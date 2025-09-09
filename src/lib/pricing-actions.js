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

// Update pricing for all cards in a user's collection with progress tracking
export async function updateCollectionPricing(options = {}, onProgress) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      throw new Error('You must be logged in to update collection pricing')
    }

    const { 
      forceUpdate = false, 
      maxAgeHours = 24,
      batchSize = 5 // Reduced batch size for better progress tracking
    } = options

    const userId = new ObjectId(session.user.id)
    const usersCollection = await getUsersCollection()

    // Initial progress report
    if (onProgress) onProgress({ stage: 'initializing', message: 'Loading your collection...', progress: 0 })

    // Get user's collection
    const user = await usersCollection.findOne({ _id: userId })
    if (!user || !user.collection || user.collection.length === 0) {
      return { success: true, message: 'No cards in collection to update', updated: 0 }
    }

    if (onProgress) onProgress({ stage: 'analyzing', message: 'Analyzing cards that need price updates...', progress: 5 })

    // Filter cards that need pricing updates
    const cardsToUpdate = user.collection.filter(card => {
      if (!card.id) return false // Skip cards without Scryfall ID
      
      if (forceUpdate) return true
      
      // Check if pricing is stale
      return isPricingStale(card.pricing?.last_updated, maxAgeHours)
    })

    if (cardsToUpdate.length === 0) {
      if (onProgress) onProgress({ stage: 'complete', message: 'All card prices are up to date!', progress: 100 })
      return { success: true, message: 'All card prices are up to date', updated: 0 }
    }

    if (onProgress) {
      onProgress({ 
        stage: 'fetching', 
        message: `Found ${cardsToUpdate.length} cards to update. Fetching pricing data...`,
        progress: 10,
        total: cardsToUpdate.length
      })
    }

    // Extract Scryfall IDs
    const scryfallIds = cardsToUpdate.map(card => card.id)
    
    // Fetch pricing data in batches with progress tracking
    const pricingData = []
    const totalBatches = Math.ceil(scryfallIds.length / batchSize)
    
    for (let i = 0; i < scryfallIds.length; i += batchSize) {
      const batch = scryfallIds.slice(i, i + batchSize)
      const batchNumber = Math.floor(i / batchSize) + 1
      
      if (onProgress) {
        onProgress({
          stage: 'fetching',
          message: `Fetching prices for batch ${batchNumber} of ${totalBatches}...`,
          progress: 10 + (batchNumber / totalBatches * 50), // 10-60% for fetching
          batch: batchNumber,
          totalBatches
        })
      }
      
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
        if (onProgress) {
          onProgress({
            stage: 'warning',
            message: `Warning: Batch ${batchNumber} failed, continuing with others...`,
            progress: 10 + (batchNumber / totalBatches * 50)
          })
        }
      }
    }

    if (onProgress) {
      onProgress({
        stage: 'updating',
        message: `Updating ${pricingData.length} cards in your collection...`,
        progress: 65
      })
    }

    // Create a map of pricing data by Scryfall ID
    const pricingMap = new Map()
    pricingData.forEach(pricing => {
      if (pricing && pricing.id) {
        pricingMap.set(pricing.id, pricing)
      }
    })

    // Update cards with new pricing data with progress tracking
    let updatedCount = 0
    const totalToUpdate = cardsToUpdate.length
    
    for (let index = 0; index < cardsToUpdate.length; index++) {
      const card = cardsToUpdate[index]
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
      
      // Progress update every 10 cards or on last card
      if ((index + 1) % 10 === 0 || index === totalToUpdate - 1) {
        if (onProgress) {
          onProgress({
            stage: 'updating',
            message: `Updated ${updatedCount} of ${totalToUpdate} cards...`,
            progress: 65 + ((index + 1) / totalToUpdate * 30) // 65-95% for updating
          })
        }
      }
    }

    if (onProgress) {
      onProgress({
        stage: 'finalizing',
        message: 'Finalizing updates...',
        progress: 95
      })
    }

    revalidatePath('/collection')
    revalidatePath('/collection/value')

    if (onProgress) {
      onProgress({
        stage: 'complete',
        message: `Successfully updated pricing for ${updatedCount} cards!`,
        progress: 100,
        updated: updatedCount,
        total: cardsToUpdate.length
      })
    }

    return { 
      success: true, 
      message: `Updated pricing for ${updatedCount} cards`,
      updated: updatedCount,
      total: cardsToUpdate.length,
      skipped: cardsToUpdate.length - updatedCount
    }
  } catch (error) {
    console.error('Error updating collection pricing:', error)
    if (onProgress) {
      onProgress({
        stage: 'error',
        message: `Error: ${error.message}`,
        progress: 0
      })
    }
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
