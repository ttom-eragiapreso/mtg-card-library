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

// Create axios instance with default config
const scryfallApiClient = axios.create({
  baseURL: SCRYFALL_API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'User-Agent': 'MTG-Library/1.0' // Scryfall requests a User-Agent
  }
})

// Request interceptor for rate limiting
scryfallApiClient.interceptors.request.use((config) => {
  checkRateLimit()
  return config
})

// Response interceptor for error handling
scryfallApiClient.interceptors.response.use(
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
    throw new Error(error.response?.data?.details || error.message || 'An error occurred while fetching data.')
  }
)

// Pricing utilities will be imported separately to avoid circular dependencies

// Transform Scryfall data to match expected MTG API format
const transformScryfallCard = (scryfallCard, includePricing = true) => {
  const transformed = {
    // Core identification
    id: scryfallCard.id,
    oracle_id: scryfallCard.oracle_id,
    multiverseid: scryfallCard.multiverse_ids?.[0]?.toString() || null,
    name: scryfallCard.name,
    names: scryfallCard.card_faces?.map(face => face.name) || [],
    
    // Mana and casting
    manaCost: scryfallCard.mana_cost || '',
    cmc: scryfallCard.cmc || 0,
    colors: scryfallCard.colors || [],
    colorIdentity: scryfallCard.color_identity || [],
    
    // Card type information
    type: scryfallCard.type_line || '',
    supertypes: [],
    types: [],
    subtypes: [],
    
    // Set and rarity information
    rarity: scryfallCard.rarity || '',
    set: scryfallCard.set?.toUpperCase() || '',
    setName: scryfallCard.set_name || '',
    
    // Card text and abilities
    text: scryfallCard.oracle_text || '',
    flavorText: scryfallCard.flavor_text || '',
    
    // Physical characteristics
    power: scryfallCard.power || null,
    toughness: scryfallCard.toughness || null,
    loyalty: scryfallCard.loyalty || null,
    
    // Art and printing information
    artist: scryfallCard.artist || '',
    number: scryfallCard.collector_number || '',
    imageUrl: scryfallCard.image_uris?.normal || scryfallCard.card_faces?.[0]?.image_uris?.normal || '',
    watermark: scryfallCard.watermark || '',
    border: scryfallCard.border_color || '',
    
    // Layout and printing variations
    layout: scryfallCard.layout || 'normal',
    variations: [], // Scryfall doesn't provide this in the same way
    printings: scryfallCard.all_parts?.map(part => part.set) || [],
    originalText: scryfallCard.printed_text || scryfallCard.oracle_text || '',
    originalType: scryfallCard.printed_type_line || scryfallCard.type_line || '',
    
    // Foreign names - Scryfall doesn't include these in search results
    // We'll need to fetch them separately if needed
    foreignNames: [],
    
    // Format legality - transform Scryfall format
    legalities: Object.entries(scryfallCard.legalities || {}).map(([format, legality]) => ({
      format: format.charAt(0).toUpperCase() + format.slice(1),
      legality: legality.charAt(0).toUpperCase() + legality.slice(1)
    })),
    
    // Rulings - need to fetch separately from Scryfall
    rulings: [],
    
    // Pricing data from Scryfall (if includePricing is true)
    pricing: includePricing ? {
      usd: scryfallCard.prices?.usd ? parseFloat(scryfallCard.prices.usd) : null,
      usd_foil: scryfallCard.prices?.usd_foil ? parseFloat(scryfallCard.prices.usd_foil) : null,
      usd_etched: scryfallCard.prices?.usd_etched ? parseFloat(scryfallCard.prices.usd_etched) : null,
      eur: scryfallCard.prices?.eur ? parseFloat(scryfallCard.prices.eur) : null,
      eur_foil: scryfallCard.prices?.eur_foil ? parseFloat(scryfallCard.prices.eur_foil) : null,
      tix: scryfallCard.prices?.tix ? parseFloat(scryfallCard.prices.tix) : null,
      purchase_uris: scryfallCard.purchase_uris || {},
      last_updated: new Date(),
      finishes: scryfallCard.finishes || ['nonfoil']
    } : null
  }
  
  // Parse type line to extract supertypes, types, and subtypes
  if (transformed.type) {
    const typeParts = transformed.type.split(' — ')
    const mainTypes = typeParts[0]?.split(' ') || []
    const subtypes = typeParts[1]?.split(' ') || []
    
    // Identify supertypes (common ones)
    const knownSupertypes = ['Legendary', 'Basic', 'Snow', 'World', 'Ongoing']
    transformed.supertypes = mainTypes.filter(type => knownSupertypes.includes(type))
    transformed.types = mainTypes.filter(type => !knownSupertypes.includes(type))
    transformed.subtypes = subtypes
  }
  
  return transformed
}

// Enhanced card processing to ensure image URLs are available
const processCardData = (card) => {
  // Ensure we have the best available image URL
  if (!card.imageUrl && card.multiverseid) {
    card.imageUrl = `https://gatherer.wizards.com/Handlers/Image.ashx?multiverseid=${card.multiverseid}&type=card`
  }
  
  // Add additional image sources for fallback
  card.imageSources = []
  
  if (card.imageUrl) {
    card.imageSources.push(card.imageUrl)
  }
  
  if (card.multiverseid) {
    card.imageSources.push(`https://gatherer.wizards.com/Handlers/Image.ashx?multiverseid=${card.multiverseid}&type=card`)
    card.imageSources.push(`http://gatherer.wizards.com/Handlers/Image.ashx?multiverseid=${card.multiverseid}&type=card`)
  }
  
  // Add Scryfall fallback if we have set and collector number
  if (card.set && card.number) {
    const setCode = card.set.toLowerCase()
    const cardNumber = card.number.toLowerCase().replace(/[^a-z0-9]/g, '')
    card.imageSources.push(`https://api.scryfall.com/cards/${setCode}/${cardNumber}?format=image`)
  }
  
  // Remove duplicates
  card.imageSources = [...new Set(card.imageSources)]
  
  // Ensure all array fields are arrays (API sometimes returns null)
  card.colors = card.colors || []
  card.colorIdentity = card.colorIdentity || []
  card.types = card.types || []
  card.subtypes = card.subtypes || []
  card.supertypes = card.supertypes || []
  card.names = card.names || []
  card.variations = card.variations || []
  card.printings = card.printings || []
  card.rulings = card.rulings || []
  card.foreignNames = card.foreignNames || []
  
  // Ensure legalities object exists with all formats
  card.legalities = card.legalities || {}
  const legalityFormats = ['standard', 'modern', 'legacy', 'vintage', 'commander', 'pioneer', 'historic', 'pauper', 'penny', 'duel', 'oldschool', 'premodern']
  legalityFormats.forEach(format => {
    if (!card.legalities[format]) {
      card.legalities[format] = 'Not Legal'
    }
  })
  
  // Add timestamp for tracking
  card.lastSyncedAt = new Date()
  
  return card
}

// Note: Database operations moved to collection-actions.js to keep this client-safe

// Helper function to get English versions of cards found through foreign language search
const getEnglishVersionsFromForeignSearch = async (foreignCards) => {
  if (!foreignCards || foreignCards.length === 0) {
    return []
  }
  
  const englishCards = []
  const processedOracleIds = new Set()
  const uniqueOracleIds = []
  
  // First, collect unique oracle IDs to avoid duplicate API calls
  for (const foreignCard of foreignCards) {
    if (foreignCard.oracle_id && !processedOracleIds.has(foreignCard.oracle_id)) {
      processedOracleIds.add(foreignCard.oracle_id)
      uniqueOracleIds.push(foreignCard.oracle_id)
    }
  }
  
  // Batch the oracle IDs to reduce API calls - search for multiple at once
  const batchSize = 5 // Process 5 oracle IDs at a time to respect rate limits
  
  for (let i = 0; i < uniqueOracleIds.length; i += batchSize) {
    const batch = uniqueOracleIds.slice(i, i + batchSize)
    
    try {
      // Create a query for multiple oracle IDs
      const oracleQuery = batch.map(id => `oracle_id:${id}`).join(' or ')
      const fullQuery = `(${oracleQuery}) lang:en`
      
      const response = await scryfallApiClient.get('/cards/search', {
        params: {
          q: fullQuery,
          unique: 'prints',
          order: 'released'
        }
      })
      
      if (response.data && response.data.data) {
        // Transform and process English versions
        const transformedCards = response.data.data.map(transformScryfallCard)
        const processedCards = transformedCards.map(processCardData)
        
        englishCards.push(...processedCards)
      }
      
      // Add a small delay between batches to respect rate limits
      if (i + batchSize < uniqueOracleIds.length) {
        await new Promise(resolve => setTimeout(resolve, 300))
      }
    } catch (error) {
      console.error(`Error fetching English versions for batch starting at index ${i}:`, error)
      // Continue with remaining batches even if one fails
    }
  }
  
  return englishCards
}

// Search cards by exact name only (no partial matching)
export const searchCardsByExactName = async (name, page = 1, pageSize = 100) => {
  try {
    // Get broader search results first
    const searchResults = await searchCardsByName(name, page, pageSize, true)
    
    // Filter to only exact matches
    const exactMatches = searchResults.cards.filter(card => {
      const searchTerm = name.toLowerCase()
      
      // Check exact English name match
      if (card.name && card.name.toLowerCase() === searchTerm) {
        return true
      }
      
      // Check exact foreign name match
      if (card.foreignNames && Array.isArray(card.foreignNames)) {
        return card.foreignNames.some(foreign => 
          foreign.name && foreign.name.toLowerCase() === searchTerm
        )
      }
      
      return false
    })
    
    return {
      cards: exactMatches,
      totalCount: exactMatches.length,
      currentPage: page,
      pageSize
    }
  } catch (error) {
    console.error('Error searching cards by exact name:', error)
    throw error
  }
}

// Search cards by name using Scryfall API
export const searchCardsByName = async (name, page = 1, pageSize = 100, _includeForeign = true) => {
  try {
    const response = await scryfallApiClient.get('/cards/search', {
      params: {
        q: name, // Scryfall uses 'q' for general search
        unique: 'prints', // Get all printings, not just unique cards
        page: page
      }
    })
    
    let allCards = response.data.data || []
    const totalCount = response.data.total_cards || 0
    
    // Transform Scryfall cards to MTG API format
    const transformedCards = allCards.map(transformScryfallCard)
    
    // Sort results to prioritize exact matches
    const sortedCards = transformedCards.sort((a, b) => {
      const searchTerm = name.toLowerCase()
      
      // Check for exact English name match
      const aExactEnglish = a.name && a.name.toLowerCase() === searchTerm
      const bExactEnglish = b.name && b.name.toLowerCase() === searchTerm
      
      if (aExactEnglish && !bExactEnglish) return -1
      if (!aExactEnglish && bExactEnglish) return 1
      
      // Check for English name starting with search term
      const aStartsEnglish = a.name && a.name.toLowerCase().startsWith(searchTerm)
      const bStartsEnglish = b.name && b.name.toLowerCase().startsWith(searchTerm)
      
      if (aStartsEnglish && !bStartsEnglish) return -1
      if (!aStartsEnglish && bStartsEnglish) return 1
      
      // Default to alphabetical order by set and then collector number
      const setComparison = (a.set || '').localeCompare(b.set || '')
      if (setComparison !== 0) return setComparison
      
      return (a.number || '').localeCompare(b.number || '')
    })
    
    // Process cards to enhance image data
    const processedCards = sortedCards.map(processCardData)
    
    // Don't limit cards here - let the frontend handle pagination/grouping
    return {
      cards: processedCards,
      totalCount: totalCount,
      currentPage: page,
      pageSize
    }
  } catch (error) {
    console.error('Error searching cards by name:', error)
    throw error
  }
}

// Search cards by language and name using Scryfall API
// Returns English versions of cards even when searching by foreign language names
export const searchCardsByLanguage = async (name, language = 'English', page = 1, pageSize = 100) => {
  try {
    // If searching in English, use the regular search
    if (language === 'English') {
      return await searchCardsByName(name, page, pageSize)
    }
    
    // For non-English languages, search for foreign names but return English versions
    const languageMap = {
      'Spanish': 'es',
      'French': 'fr', 
      'German': 'de',
      'Italian': 'it',
      'Portuguese': 'pt',
      'Japanese': 'ja',
      'Chinese Simplified': 'zhs',
      'Chinese Traditional': 'zht',
      'Korean': 'ko',
      'Russian': 'ru'
    }
    
    const langCode = languageMap[language]
    if (!langCode) {
      // Fallback to regular English search if language not supported
      return await searchCardsByName(name, page, pageSize)
    }
    
    // Search for the foreign language version first
    let query = `${name} lang:${langCode}`
    
    const foreignSearchResponse = await scryfallApiClient.get('/cards/search', {
      params: {
        q: query,
        page: page
      }
    })
    
    let foreignCards = foreignSearchResponse.data.data || []
    
    // If no foreign results found, try a broader search with just the name
    // This helps catch cards where the translation might not be exact
    if (foreignCards.length === 0) {
      try {
        const broadSearchResponse = await scryfallApiClient.get('/cards/search', {
          params: {
            q: name,
            page: page
          }
        })
        
        // Filter results to check if any have foreign names that match
        const allResults = broadSearchResponse.data.data || []
        foreignCards = allResults.filter(card => {
          // Check if this card has a foreign name that matches our search
          if (card.printed_name && card.printed_name.toLowerCase().includes(name.toLowerCase())) {
            return true
          }
          return false
        })
      } catch (broadSearchError) {
        console.log('Broad search fallback failed:', broadSearchError.message)
      }
    }
    
    // If still no results, return empty
    if (foreignCards.length === 0) {
      return {
        cards: [],
        totalCount: 0,
        currentPage: page,
        pageSize
      }
    }
    
    // Get English versions of the found cards
    const englishCards = await getEnglishVersionsFromForeignSearch(foreignCards)
    
    // Sort results to prioritize exact matches and popular sets
    const sortedCards = englishCards.sort((a, b) => {
      // Default to alphabetical order by set and then collector number
      const setComparison = (a.set || '').localeCompare(b.set || '')
      if (setComparison !== 0) return setComparison
      
      return (a.number || '').localeCompare(b.number || '')
    })
    
    // Limit to requested page size
    const limitedCards = sortedCards.slice(0, pageSize)
    
    return {
      cards: limitedCards,
      totalCount: englishCards.length,
      currentPage: page,
      pageSize
    }
  } catch (error) {
    console.error('Error searching cards by language:', error)
    // Return empty result instead of throwing to allow fallback searches
    return {
      cards: [],
      totalCount: 0,
      currentPage: page,
      pageSize
    }
  }
}

// Get card by specific ID using Scryfall API
export const getCardById = async (id) => {
  try {
    const response = await scryfallApiClient.get(`/cards/${id}`)
    const transformedCard = transformScryfallCard(response.data)
    return processCardData(transformedCard)
  } catch (error) {
    console.error('Error fetching card by ID:', error)
    throw error
  }
}

// Get all versions of a card by name using Scryfall API
export const getAllVersionsOfCard = async (name) => {
  try {
    // Use Scryfall's exact name search to get all printings
    const response = await scryfallApiClient.get('/cards/search', {
      params: {
        q: `!"${name}"`, // Exact name search in Scryfall
        unique: 'prints' // Get all printings
      }
    })
    
    const allCards = response.data.data || []
    
    // Transform and process cards
    const transformedCards = allCards.map(transformScryfallCard)
    const processedCards = transformedCards.map(processCardData)
    
    return processedCards
  } catch (error) {
    console.error('Error fetching all versions of card:', error)
    throw error
  }
}

// Search cards with filters using Scryfall API
export const searchCardsWithFilters = async (filters = {}) => {
  try {
    // Build Scryfall query string
    let queryParts = []
    
    if (filters.name) {
      queryParts.push(filters.name)
    }
    
    if (filters.set) {
      queryParts.push(`set:${filters.set}`)
    }
    
    if (filters.colors && filters.colors.length > 0) {
      const colorQuery = filters.colors.map(color => `color:${color}`).join(' OR ')
      queryParts.push(`(${colorQuery})`)
    }
    
    if (filters.types && filters.types.length > 0) {
      const typeQuery = filters.types.map(type => `type:${type}`).join(' OR ')
      queryParts.push(`(${typeQuery})`)
    }
    
    if (filters.subtypes && filters.subtypes.length > 0) {
      const subtypeQuery = filters.subtypes.map(subtype => `type:${subtype}`).join(' OR ')
      queryParts.push(`(${subtypeQuery})`)
    }
    
    if (filters.supertypes && filters.supertypes.length > 0) {
      const supertypeQuery = filters.supertypes.map(supertype => `type:${supertype}`).join(' OR ')
      queryParts.push(`(${supertypeQuery})`)
    }
    
    if (filters.rarity) {
      queryParts.push(`rarity:${filters.rarity.toLowerCase()}`)
    }
    
    if (filters.cmc !== undefined) {
      queryParts.push(`cmc:${filters.cmc}`)
    }
    
    // Handle CMC range filtering
    if (filters.needsCmcFilter) {
      const { min, max } = filters.needsCmcFilter
      queryParts.push(`cmc>=${min} cmc<=${max}`)
    }
    
    const query = queryParts.join(' ') || '*' // Default to all cards if no filters
    
    const response = await scryfallApiClient.get('/cards/search', {
      params: {
        q: query,
        page: filters.page || 1
      }
    })
    
    const allCards = response.data.data || []
    
    // Transform Scryfall cards to MTG API format
    const transformedCards = allCards.map(transformScryfallCard)
    
    // Process cards to enhance image data
    const processedCards = transformedCards.map(processCardData)
    
    // Limit to requested page size
    const pageSize = filters.pageSize || 100
    const limitedCards = processedCards.slice(0, pageSize)
    
    return {
      cards: limitedCards,
      totalCount: response.data.total_cards || 0,
      currentPage: filters.page || 1,
      pageSize: pageSize
    }
  } catch (error) {
    console.error('Error searching cards with filters:', error)
    throw error
  }
}

// Get sets information using Scryfall API
export const getAllSets = async () => {
  try {
    const response = await scryfallApiClient.get('/sets')
    const scryfallSets = response.data.data || []
    
    // Transform Scryfall sets to match expected format
    const transformedSets = scryfallSets.map(set => ({
      code: set.code?.toUpperCase() || '',
      name: set.name || '',
      type: set.set_type || '',
      releaseDate: set.released_at || '',
      block: set.block || '',
      onlineOnly: set.digital || false
    }))
    
    return transformedSets
  } catch (error) {
    console.error('Error fetching sets:', error)
    throw error
  }
}

// Get types using Scryfall catalog
export const getAllTypes = async () => {
  try {
    const response = await scryfallApiClient.get('/catalog/card-types')
    return response.data.data || []
  } catch (error) {
    console.error('Error fetching types:', error)
    throw error
  }
}

// Get subtypes using Scryfall catalog
export const getAllSubtypes = async () => {
  try {
    const response = await scryfallApiClient.get('/catalog/creature-types')
    return response.data.data || []
  } catch (error) {
    console.error('Error fetching subtypes:', error)
    throw error
  }
}

// Get supertypes using Scryfall catalog
export const getAllSupertypes = async () => {
  try {
    const response = await scryfallApiClient.get('/catalog/supertypes')
    return response.data.data || []
  } catch (error) {
    console.error('Error fetching supertypes:', error)
    throw error
  }
}

// Utility function to parse mana cost
export const parseManaSymbols = (manaCost) => {
  if (!manaCost) return []
  
  // Match mana symbols in curly braces like {3}{W}{W}
  const symbols = manaCost.match(/{[^}]+}/g) || []
  return symbols.map(symbol => symbol.replace(/[{}]/g, ''))
}

// Utility function to get mana cost colors
export const getManaColors = (manaCost) => {
  const symbols = parseManaSymbols(manaCost)
  const colors = []
  
  symbols.forEach(symbol => {
    if (symbol === 'W') colors.push('white')
    else if (symbol === 'U') colors.push('blue')
    else if (symbol === 'B') colors.push('black')
    else if (symbol === 'R') colors.push('red')
    else if (symbol === 'G') colors.push('green')
  })
  
  return [...new Set(colors)] // Remove duplicates
}
