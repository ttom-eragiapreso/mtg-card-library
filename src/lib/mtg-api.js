import axios from 'axios'
// Import MTG SDK for enhanced API integration
// Note: We'll use axios for now as the SDK may have compatibility issues
// import mtg from 'mtgsdk'

const MTG_API_BASE_URL = process.env.MTG_API_BASE_URL || 'https://api.magicthegathering.io/v1'

// Rate limiting - MTG API allows 5000 requests per hour
let requestCount = 0
let requestResetTime = Date.now() + (60 * 60 * 1000) // 1 hour from now

const checkRateLimit = () => {
  const now = Date.now()
  if (now > requestResetTime) {
    requestCount = 0
    requestResetTime = now + (60 * 60 * 1000)
  }
  
  if (requestCount >= 5000) {
    throw new Error('Rate limit exceeded. Please try again later.')
  }
  
  requestCount++
}

// Create axios instance with default config
const mtgApiClient = axios.create({
  baseURL: MTG_API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Request interceptor for rate limiting
mtgApiClient.interceptors.request.use((config) => {
  checkRateLimit()
  return config
})

// Response interceptor for error handling
mtgApiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 403) {
      throw new Error('Rate limit exceeded. Please try again later.')
    }
    if (error.response?.status === 404) {
      throw new Error('Card not found.')
    }
    if (error.code === 'ECONNABORTED') {
      throw new Error('Request timed out. Please try again.')
    }
    throw new Error(error.response?.data?.message || error.message || 'An error occurred while fetching data.')
  }
)

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

// Search cards by name (includes foreign names with improved matching)
export const searchCardsByName = async (name, page = 1, pageSize = 100, includeForeign = true) => {
  try {
    const response = await mtgApiClient.get('/cards', {
      params: {
        name,
        page,
        pageSize
      }
    })
    
    let allCards = response.data.cards || []
    const totalCount = parseInt(response.headers['total-count'] || '0')
    
    // Sort results to prioritize exact matches
    const sortedCards = allCards.sort((a, b) => {
      const searchTerm = name.toLowerCase()
      
      // Check for exact English name match
      const aExactEnglish = a.name && a.name.toLowerCase() === searchTerm
      const bExactEnglish = b.name && b.name.toLowerCase() === searchTerm
      
      if (aExactEnglish && !bExactEnglish) return -1
      if (!aExactEnglish && bExactEnglish) return 1
      
      // Check for exact foreign name match
      const aExactForeign = a.foreignNames && a.foreignNames.some(fn => 
        fn.name && fn.name.toLowerCase() === searchTerm
      )
      const bExactForeign = b.foreignNames && b.foreignNames.some(fn => 
        fn.name && fn.name.toLowerCase() === searchTerm
      )
      
      if (aExactForeign && !bExactForeign) return -1
      if (!aExactForeign && bExactForeign) return 1
      
      // Check for English name starting with search term
      const aStartsEnglish = a.name && a.name.toLowerCase().startsWith(searchTerm)
      const bStartsEnglish = b.name && b.name.toLowerCase().startsWith(searchTerm)
      
      if (aStartsEnglish && !bStartsEnglish) return -1
      if (!aStartsEnglish && bStartsEnglish) return 1
      
      // Default to alphabetical order
      return (a.name || '').localeCompare(b.name || '')
    })
    
    // Process cards to enhance image data
    const processedCards = sortedCards.map(processCardData)
    
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

// Search cards by language and name
export const searchCardsByLanguage = async (name, language = 'English', page = 1, pageSize = 100) => {
  try {
    const params = {
      page,
      pageSize
    }
    
    // Add name parameter
    if (name) {
      params.name = name
    }
    
    // Add language parameter if not English
    if (language && language !== 'English') {
      params.language = language
    }
    
    const response = await mtgApiClient.get('/cards', { params })
    
    let cards = response.data.cards || []
    
    // If we specified a language other than English, filter results to ensure they actually have that language
    if (language && language !== 'English' && name) {
      cards = cards.filter(card => {
        // Check if card has foreign names with the specified language
        if (!card.foreignNames || !Array.isArray(card.foreignNames)) {
          return false
        }
        
        return card.foreignNames.some(foreign => {
          const hasMatchingLanguage = foreign.language === language
          const hasMatchingName = foreign.name && 
            foreign.name.toLowerCase().includes(name.toLowerCase())
          return hasMatchingLanguage && hasMatchingName
        })
      })
    }
    
    // Process cards to enhance image data
    const processedCards = cards.map(processCardData)
    
    return {
      cards: processedCards,
      totalCount: parseInt(response.headers['total-count'] || cards.length.toString()),
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

// Get card by specific ID
export const getCardById = async (id) => {
  try {
    const response = await mtgApiClient.get(`/cards/${id}`)
    return processCardData(response.data.card)
  } catch (error) {
    console.error('Error fetching card by ID:', error)
    throw error
  }
}

// Get all versions of a card by name (including foreign names)
export const getAllVersionsOfCard = async (name) => {
  try {
    // Search by both English and foreign names
    const searchResults = await searchCardsByName(name, 1, 100, true)
    
    // Filter to exact matches (English name or any foreign name)
    const exactMatches = searchResults.cards.filter(card => {
      // Check English name
      if (card.name.toLowerCase() === name.toLowerCase()) {
        return true
      }
      
      // Check foreign names
      if (card.foreignNames && Array.isArray(card.foreignNames)) {
        return card.foreignNames.some(foreign => 
          foreign.name && foreign.name.toLowerCase() === name.toLowerCase()
        )
      }
      
      return false
    })
    
    return exactMatches
  } catch (error) {
    console.error('Error fetching all versions of card:', error)
    throw error
  }
}

// Search cards with filters
export const searchCardsWithFilters = async (filters = {}) => {
  try {
    const params = {
      page: filters.page || 1,
      pageSize: filters.pageSize || 100
    }

    // Add various filters
    if (filters.name) params.name = filters.name
    if (filters.foreignName) params.foreignName = filters.foreignName
    if (filters.set) params.set = filters.set
    if (filters.colors && filters.colors.length > 0) {
      params.colors = filters.colors.join(',')
    }
    if (filters.types && filters.types.length > 0) {
      params.types = filters.types.join(',')
    }
    if (filters.subtypes && filters.subtypes.length > 0) {
      params.subtypes = filters.subtypes.join(',')
    }
    if (filters.supertypes && filters.supertypes.length > 0) {
      params.supertypes = filters.supertypes.join(',')
    }
    if (filters.rarity) params.rarity = filters.rarity
    if (filters.cmc !== undefined) params.cmc = filters.cmc

    const response = await mtgApiClient.get('/cards', { params })
    
    // Process cards to enhance image data
    const processedCards = (response.data.cards || []).map(processCardData)
    
    return {
      cards: processedCards,
      totalCount: parseInt(response.headers['total-count'] || '0'),
      currentPage: params.page,
      pageSize: params.pageSize
    }
  } catch (error) {
    console.error('Error searching cards with filters:', error)
    throw error
  }
}

// Get sets information
export const getAllSets = async () => {
  try {
    const response = await mtgApiClient.get('/sets')
    return response.data.sets || []
  } catch (error) {
    console.error('Error fetching sets:', error)
    throw error
  }
}

// Get types
export const getAllTypes = async () => {
  try {
    const response = await mtgApiClient.get('/types')
    return response.data.types || []
  } catch (error) {
    console.error('Error fetching types:', error)
    throw error
  }
}

// Get subtypes
export const getAllSubtypes = async () => {
  try {
    const response = await mtgApiClient.get('/subtypes')
    return response.data.subtypes || []
  } catch (error) {
    console.error('Error fetching subtypes:', error)
    throw error
  }
}

// Get supertypes
export const getAllSupertypes = async () => {
  try {
    const response = await mtgApiClient.get('/supertypes')
    return response.data.supertypes || []
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
