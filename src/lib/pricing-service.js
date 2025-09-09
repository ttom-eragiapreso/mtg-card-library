import axios from 'axios'

const SCRYFALL_API_BASE_URL = process.env.SCRYFALL_API_BASE_URL || 'https://api.scryfall.com'

// Rate limiting - Scryfall allows 10 requests per second with bursts
// We'll be more conservative and limit to 5 requests per second
let requestCount = 0
let requestWindow = Date.now() + 1000 // 1 second window

const checkRateLimit = () => {
  const now = Date.now()
  if (now > requestWindow) {
    requestCount = 0
    requestWindow = now + 1000
  }
  
  if (requestCount >= 5) {
    throw new Error('Rate limit exceeded. Please slow down your requests.')
  }
  
  requestCount++
}

// Create axios instance for pricing requests
const scryfallPricingClient = axios.create({
  baseURL: SCRYFALL_API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'User-Agent': 'MTG-Library/1.0'
  }
})

// Request interceptor for rate limiting
scryfallPricingClient.interceptors.request.use((config) => {
  checkRateLimit()
  return config
})

// Response interceptor for error handling
scryfallPricingClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 429) {
      throw new Error('Rate limit exceeded. Please try again later.')
    }
    if (error.response?.status === 404) {
      throw new Error('Card not found.')
    }
    if (error.code === 'ECONNABORTED') {
      throw new Error('Request timed out. Please try again.')
    }
    throw new Error(error.response?.data?.details || error.message || 'An error occurred while fetching pricing data.')
  }
)

// Transform Scryfall pricing data to our format
const transformPricingData = (scryfallCard) => {
  const prices = scryfallCard.prices || {}
  const purchaseUris = scryfallCard.purchase_uris || {}
  
  return {
    // Basic card identifiers
    id: scryfallCard.id,
    oracle_id: scryfallCard.oracle_id,
    set: scryfallCard.set?.toUpperCase(),
    collector_number: scryfallCard.collector_number,
    
    // USD prices
    usd: prices.usd ? parseFloat(prices.usd) : null,
    usd_foil: prices.usd_foil ? parseFloat(prices.usd_foil) : null,
    usd_etched: prices.usd_etched ? parseFloat(prices.usd_etched) : null,
    
    // EUR prices  
    eur: prices.eur ? parseFloat(prices.eur) : null,
    eur_foil: prices.eur_foil ? parseFloat(prices.eur_foil) : null,
    
    // TIX (MTGO) prices
    tix: prices.tix ? parseFloat(prices.tix) : null,
    
    // Purchase URIs for different retailers
    purchase_uris: {
      tcgplayer: purchaseUris.tcgplayer || null,
      cardmarket: purchaseUris.cardmarket || null,
      cardhoarder: purchaseUris.cardhoarder || null
    },
    
    // Metadata
    last_updated: new Date(),
    scryfall_uri: scryfallCard.scryfall_uri,
    
    // Price trends (will be populated by historical tracking)
    price_trend_7d: null, // 7-day trend
    price_trend_30d: null, // 30-day trend
    
    // Additional metadata for tracking
    rarity: scryfallCard.rarity,
    name: scryfallCard.name,
    set_name: scryfallCard.set_name,
    finishes: scryfallCard.finishes || ['nonfoil'] // ['nonfoil', 'foil', 'etched']
  }
}

// Fetch pricing data for a single card by Scryfall ID
export const fetchCardPricing = async (scryfallId) => {
  try {
    const response = await scryfallPricingClient.get(`/cards/${scryfallId}`)
    return transformPricingData(response.data)
  } catch (error) {
    console.error(`Error fetching pricing for card ${scryfallId}:`, error)
    throw error
  }
}

// Fetch pricing data for multiple cards by Scryfall IDs
export const fetchMultipleCardPricing = async (scryfallIds) => {
  if (!Array.isArray(scryfallIds) || scryfallIds.length === 0) {
    return []
  }

  const pricingData = []
  const batchSize = 5 // Process 5 cards at a time to respect rate limits
  
  for (let i = 0; i < scryfallIds.length; i += batchSize) {
    const batch = scryfallIds.slice(i, i + batchSize)
    
    try {
      // Process batch concurrently
      const batchPromises = batch.map(async (id) => {
        try {
          return await fetchCardPricing(id)
        } catch (error) {
          console.error(`Failed to fetch pricing for card ${id}:`, error)
          return null // Return null for failed requests
        }
      })
      
      const batchResults = await Promise.all(batchPromises)
      pricingData.push(...batchResults.filter(Boolean)) // Filter out null results
      
      // Add delay between batches to respect rate limits
      if (i + batchSize < scryfallIds.length) {
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    } catch (error) {
      console.error(`Error processing batch starting at index ${i}:`, error)
      // Continue with remaining batches even if one fails
    }
  }
  
  return pricingData
}

// Search for card pricing by name and set (fallback when we don't have Scryfall ID)
export const searchCardPricing = async (name, setCode = null) => {
  try {
    let query = `!"${name}"` // Exact name search
    if (setCode) {
      query += ` set:${setCode.toLowerCase()}`
    }
    
    const response = await scryfallPricingClient.get('/cards/search', {
      params: {
        q: query,
        unique: 'prints',
        order: 'released'
      }
    })
    
    if (response.data && response.data.data && response.data.data.length > 0) {
      return response.data.data.map(transformPricingData)
    }
    
    return []
  } catch (error) {
    console.error(`Error searching pricing for card "${name}" in set "${setCode}":`, error)
    throw error
  }
}

// Get best price for a card considering foil/non-foil preference
export const getBestPrice = (pricingData, preferFoil = false, currency = 'usd') => {
  if (!pricingData) return null
  
  let prices = []
  
  // Collect all available prices
  if (currency === 'usd') {
    if (pricingData.usd) prices.push({ price: pricingData.usd, type: 'nonfoil' })
    if (pricingData.usd_foil) prices.push({ price: pricingData.usd_foil, type: 'foil' })
    if (pricingData.usd_etched) prices.push({ price: pricingData.usd_etched, type: 'etched' })
  } else if (currency === 'eur') {
    if (pricingData.eur) prices.push({ price: pricingData.eur, type: 'nonfoil' })
    if (pricingData.eur_foil) prices.push({ price: pricingData.eur_foil, type: 'foil' })
  }
  
  if (prices.length === 0) return null
  
  // If we have preference and that type is available, return it
  if (preferFoil) {
    const foilPrice = prices.find(p => p.type === 'foil' || p.type === 'etched')
    if (foilPrice) return foilPrice
  } else {
    const nonFoilPrice = prices.find(p => p.type === 'nonfoil')
    if (nonFoilPrice) return nonFoilPrice
  }
  
  // Otherwise, return the first available price
  return prices[0]
}

// Calculate collection value
export const calculateCollectionValue = (collection, currency = 'usd') => {
  if (!Array.isArray(collection)) return { total: 0, cards: 0, breakdown: {} }
  
  let totalValue = 0
  let cardCount = 0
  const breakdown = {
    nonfoil: 0,
    foil: 0,
    unknown: 0
  }
  
  collection.forEach(card => {
    if (card.pricing && card.quantity) {
      const bestPrice = getBestPrice(card.pricing, card.foil, currency)
      if (bestPrice) {
        const cardValue = bestPrice.price * card.quantity
        totalValue += cardValue
        cardCount += card.quantity
        breakdown[bestPrice.type] += cardValue
      } else {
        breakdown.unknown += card.quantity || 0
      }
    }
  })
  
  return {
    total: Math.round(totalValue * 100) / 100, // Round to 2 decimal places
    cards: cardCount,
    breakdown,
    currency: currency.toUpperCase()
  }
}

// Format price for display
export const formatPrice = (price, currency = 'usd') => {
  if (price === null || price === undefined) return null
  
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
  
  return formatter.format(price)
}

// Determine if pricing data is stale and needs refresh
export const isPricingStale = (lastUpdated, maxAgeHours = 24) => {
  if (!lastUpdated) return true
  
  const now = new Date()
  const ageHours = (now - new Date(lastUpdated)) / (1000 * 60 * 60)
  return ageHours > maxAgeHours
}

// Utility to get pricing summary for a card
export const getPricingSummary = (pricingData, currency = 'usd') => {
  if (!pricingData) return null
  
  const summary = {
    hasPrice: false,
    nonfoil: null,
    foil: null,
    etched: null,
    lowest: null,
    highest: null,
    currency: currency.toUpperCase()
  }
  
  if (currency === 'usd') {
    summary.nonfoil = pricingData.usd
    summary.foil = pricingData.usd_foil
    summary.etched = pricingData.usd_etched
  } else if (currency === 'eur') {
    summary.nonfoil = pricingData.eur
    summary.foil = pricingData.eur_foil
  }
  
  const prices = [summary.nonfoil, summary.foil, summary.etched].filter(Boolean)
  
  if (prices.length > 0) {
    summary.hasPrice = true
    summary.lowest = Math.min(...prices)
    summary.highest = Math.max(...prices)
  }
  
  return summary
}
