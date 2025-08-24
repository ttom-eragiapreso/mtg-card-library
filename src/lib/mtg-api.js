import axios from 'axios'

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

// Search cards by name
export const searchCardsByName = async (name, page = 1, pageSize = 100) => {
  try {
    const response = await mtgApiClient.get('/cards', {
      params: {
        name,
        page,
        pageSize
      }
    })
    return {
      cards: response.data.cards || [],
      totalCount: parseInt(response.headers['total-count'] || '0'),
      currentPage: page,
      pageSize
    }
  } catch (error) {
    console.error('Error searching cards by name:', error)
    throw error
  }
}

// Get card by specific ID
export const getCardById = async (id) => {
  try {
    const response = await mtgApiClient.get(`/cards/${id}`)
    return response.data.card
  } catch (error) {
    console.error('Error fetching card by ID:', error)
    throw error
  }
}

// Get all versions of a card by name
export const getAllVersionsOfCard = async (name) => {
  try {
    // First search to get all cards with this name
    const response = await mtgApiClient.get('/cards', {
      params: {
        name,
        pageSize: 100 // Get up to 100 versions
      }
    })
    
    const cards = response.data.cards || []
    
    // Filter to exact name matches (MTG API does partial matching)
    const exactMatches = cards.filter(card => 
      card.name.toLowerCase() === name.toLowerCase()
    )
    
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
    
    return {
      cards: response.data.cards || [],
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
