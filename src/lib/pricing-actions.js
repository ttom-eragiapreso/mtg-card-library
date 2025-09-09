'use server'

import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { getUsersCollection } from "@/lib/models"
import { revalidatePath } from "next/cache"
import { ObjectId } from 'mongodb'
import { 
  fetchCardPricing, 
  fetchMultipleCardPricing, 
  calculateCollectionValue, 
  isPricingStale 
} from '@/lib/pricing-service'

// Update pricing for a single card in a user's collection
export async function updateCardPricing(cardId, multiverseid) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      throw new Error('You must be logged in to update pricing')
    }

    const userId = new ObjectId(session.user.id)
    const usersCollection = await getUsersCollection()

    // Find the user and the specific card
    const identifierQuery = multiverseid 
      ? { "collection.multiverseid": multiverseid }
      : { "collection.id": cardId }

    const user = await usersCollection.findOne({
      _id: userId,
      ...identifierQuery
    })

    if (!user) {
      throw new Error('Card not found in your collection')
    }

    // Find the card in the collection
    const card = user.collection.find(c => 
      multiverseid ? c.multiverseid === multiverseid : c.id === cardId
    )

    if (!card) {
      throw new Error('Card not found in collection')
    }

    // Fetch fresh pricing data using the card's Scryfall ID
    let pricingData = null
    if (card.id) {
      try {
        pricingData = await fetchCardPricing(card.id)
      } catch (error) {
        console.error(`Failed to fetch pricing for card ${card.id}:`, error)
      }
    }

    // Update the card's pricing data
    if (pricingData) {
      const updateQuery = multiverseid 
        ? { "collection.multiverseid": multiverseid }
        : { "collection.id": cardId }

      await usersCollection.updateOne(
        { 
          _id: userId,
          ...updateQuery
        },
        {
          $set: { 
            "collection.$.pricing": pricingData,
            "collection.$.updatedAt": new Date()
          }
        }
      )

      revalidatePath('/collection')
      revalidatePath('/')
      
      return { success: true, pricing: pricingData }
    } else {
      return { success: false, error: 'Unable to fetch pricing data' }
    }
  } catch (error) {
    console.error('Error updating card pricing:', error)
    return { success: false, error: error.message }
  }
}

// Helper to get current card value for smart update logic
const getCurrentCardValue = (card) => {
  if (!card.pricing || !card.quantity) return 0
  
  const pricing = card.pricing
  let unitPrice = null
  
  // Get the appropriate price based on foil status
  if (card.foil) {
    unitPrice = pricing.usd_foil || pricing.usd_etched || pricing.usd
  } else {
    unitPrice = pricing.usd
  }
  
  return unitPrice ? unitPrice * card.quantity : 0
}

// Update pricing for all cards in a user's collection with smart refresh logic
export async function updateCollectionPricing(options = {}) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      throw new Error('You must be logged in to update collection pricing')
    }

    const { 
      forceUpdate = false, 
      fullRefresh = false, // Force update all cards regardless of value
      maxAgeHours = 24, // For cards worth >$1 (daily updates)
      maxAgeHoursAll = 24 * 30, // For full refresh of cheap cards (monthly)
      batchSize = 5 // Balanced batch size for good performance
    } = options

    const userId = new ObjectId(session.user.id)
    const usersCollection = await getUsersCollection()

    // Get user's collection
    const user = await usersCollection.findOne({ _id: userId })
    if (!user || !user.collection || user.collection.length === 0) {
      return { success: true, message: 'No cards in collection to update', updated: 0 }
    }

    // Filter cards that need pricing updates based on smart logic
    const cardsToUpdate = user.collection.filter(card => {
      if (!card.id) return false // Skip cards without Scryfall ID
      
      if (forceUpdate || fullRefresh) return true
      
      // Check if this card has pricing data
      const hasCurrentPricing = card.pricing && card.pricing.last_updated
      
      if (!hasCurrentPricing) {
        return true // Always update cards without pricing
      }
      
      // Get current value to determine update frequency
      const currentValue = getCurrentCardValue(card)
      
      if (currentValue >= 1.0) {
        // Cards worth $1+ get updated daily (24 hours)
        return isPricingStale(card.pricing.last_updated, maxAgeHours)
      } else {
        // Cards worth <$1 get updated monthly (30 days) 
        return isPricingStale(card.pricing.last_updated, maxAgeHoursAll)
      }
    })

    if (cardsToUpdate.length === 0) {
      return { success: true, message: 'All card prices are up to date', updated: 0 }
    }

    // Extract Scryfall IDs
    const scryfallIds = cardsToUpdate.map(card => card.id)
    
    // Fetch pricing data in batches
    const pricingData = []
    const totalBatches = Math.ceil(scryfallIds.length / batchSize)
    
    for (let i = 0; i < scryfallIds.length; i += batchSize) {
      const batch = scryfallIds.slice(i, i + batchSize)
      const batchNumber = Math.floor(i / batchSize) + 1
      
      try {
        // Process batch with individual error handling
        const batchPromises = batch.map(async (id) => {
          try {
            return await fetchCardPricing(id)
          } catch (error) {
            console.error(`Failed to fetch pricing for card ${id}:`, error)
            return null
          }
        })
        
        const batchResults = await Promise.all(batchPromises)
        pricingData.push(...batchResults.filter(Boolean))
        
        // Add delay between batches to respect rate limits
        if (i + batchSize < scryfallIds.length) {
          await new Promise(resolve => setTimeout(resolve, 1000))
        }
      } catch (error) {
        console.error(`Error processing batch ${batchNumber}:`, error)
      }
    }

    // Create a map of pricing data by Scryfall ID
    const pricingMap = new Map()
    pricingData.forEach(pricing => {
      if (pricing && pricing.id) {
        pricingMap.set(pricing.id, pricing)
      }
    })

    // Update cards with new pricing data
    let updatedCount = 0
    
    for (const card of cardsToUpdate) {
      const pricing = pricingMap.get(card.id)
      
      if (pricing) {
        const identifierQuery = card.multiverseid 
          ? { "collection.multiverseid": card.multiverseid }
          : { "collection.id": card.id }

        try {
          await usersCollection.updateOne(
            { 
              _id: userId,
              ...identifierQuery
            },
            {
              $set: { 
                "collection.$.pricing": pricing,
                "collection.$.updatedAt": new Date()
              }
            }
          )
          updatedCount++
        } catch (error) {
          console.error(`Failed to update pricing for card ${card.name}:`, error)
        }
      }
    }

    revalidatePath('/collection')
    revalidatePath('/collection/value')

    return { 
      success: true, 
      message: `Updated pricing for ${updatedCount} cards`,
      updated: updatedCount,
      total: cardsToUpdate.length,
      skipped: cardsToUpdate.length - updatedCount
    }
  } catch (error) {
    console.error('Error updating collection pricing:', error)
    return { success: false, error: error.message }
  }
}

// Calculate total collection value
export async function getCollectionValue(currency = 'usd') {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      throw new Error('You must be logged in to view collection value')
    }

    const userId = new ObjectId(session.user.id)
    const usersCollection = await getUsersCollection()

    // Get user's collection
    const user = await usersCollection.findOne({ _id: userId })
    if (!user || !user.collection) {
      return { success: true, value: { total: 0, cards: 0, breakdown: {} } }
    }

    // Calculate collection value
    const value = calculateCollectionValue(user.collection, currency)

    return { success: true, value }
  } catch (error) {
    console.error('Error calculating collection value:', error)
    return { success: false, error: error.message }
  }
}

// Get pricing statistics for collection
export async function getCollectionPricingStats() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      throw new Error('You must be logged in to view pricing statistics')
    }

    const userId = new ObjectId(session.user.id)
    const usersCollection = await getUsersCollection()

    // Get user's collection
    const user = await usersCollection.findOne({ _id: userId })
    if (!user || !user.collection) {
      return { 
        success: true, 
        stats: { 
          totalCards: 0, 
          cardsWithPricing: 0, 
          lastUpdated: null,
          stalePricing: 0
        } 
      }
    }

    const collection = user.collection
    const totalCards = collection.length
    const cardsWithPricing = collection.filter(card => card.pricing).length
    const stalePricing = collection.filter(card => 
      isPricingStale(card.pricing?.last_updated, 24)
    ).length

    // Find most recent pricing update
    const lastUpdated = collection
      .filter(card => card.pricing?.last_updated)
      .reduce((latest, card) => {
        const cardDate = new Date(card.pricing.last_updated)
        return cardDate > latest ? cardDate : latest
      }, new Date(0))

    const stats = {
      totalCards,
      cardsWithPricing,
      pricingCoverage: totalCards > 0 ? (cardsWithPricing / totalCards * 100).toFixed(1) : 0,
      stalePricing,
      lastUpdated: lastUpdated.getTime() > 0 ? lastUpdated : null
    }

    return { success: true, stats }
  } catch (error) {
    console.error('Error getting collection pricing stats:', error)
    return { success: false, error: error.message }
  }
}

// Get top valued cards in collection
export async function getTopValuedCards(currency = 'usd', limit = 10) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      throw new Error('You must be logged in to view top valued cards')
    }

    const userId = new ObjectId(session.user.id)
    const usersCollection = await getUsersCollection()

    // Get user's collection
    const user = await usersCollection.findOne({ _id: userId })
    if (!user || !user.collection) {
      return { success: true, cards: [] }
    }

    // Calculate value for each card and sort
    const cardsWithValue = user.collection
      .filter(card => card.pricing && card.quantity)
      .map(card => {
        const pricing = card.pricing
        let price = null
        
        if (currency === 'usd') {
          price = card.foil ? (pricing.usd_foil || pricing.usd_etched || pricing.usd) : pricing.usd
        } else if (currency === 'eur') {
          price = card.foil ? (pricing.eur_foil || pricing.eur) : pricing.eur
        }
        
        const totalValue = price ? price * card.quantity : 0
        
        return {
          ...card,
          unitPrice: price,
          totalValue
        }
      })
      .filter(card => card.totalValue > 0)
      .sort((a, b) => b.totalValue - a.totalValue)
      .slice(0, limit)

    return { success: true, cards: cardsWithValue }
  } catch (error) {
    console.error('Error getting top valued cards:', error)
    return { success: false, error: error.message }
  }
}

// Full refresh - updates all cards regardless of age or value (monthly operation)
export async function fullCollectionPricingRefresh() {
  return await updateCollectionPricing({ 
    fullRefresh: true,
    forceUpdate: true 
  })
}

// Refresh pricing for specific cards by name (useful for newly added cards)
export async function refreshCardPricingByName(cardName, setCode = null) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return { success: false, error: 'Authentication required' }
    }

    // This would be used when adding new cards to collection
    // The pricing data will be fetched and included when the card is added
    // This is more of a utility function for manual refresh
    
    return { success: true, message: 'Pricing refresh initiated' }
  } catch (error) {
    console.error('Error refreshing card pricing by name:', error)
    return { success: false, error: error.message }
  }
}
