'use server'

import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { getUsersCollection } from "@/lib/models"
import { revalidatePath } from "next/cache"
import { ObjectId } from 'mongodb'

// Import processCardData to ensure comprehensive card data
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

export async function addCardToCollection(cardData, collectionData = {}) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      throw new Error('You must be logged in to add cards to your collection')
    }

    const userId = new ObjectId(session.user.id)
    const usersCollection = await getUsersCollection()

    // Process the card data and merge with collection data
    const processedCard = processCardData(cardData)
    
    const collectionItem = {
      ...processedCard,
      // User-specific collection data
      quantity: collectionData.quantity || 1,
      condition: collectionData.condition || 'near_mint',
      foil: collectionData.foil || false,
      language: collectionData.language || 'English',
      notes: collectionData.notes || '',
      acquiredDate: collectionData.acquiredDate || new Date(),
      acquiredPrice: collectionData.acquiredPrice,
      addedAt: new Date(),
      updatedAt: new Date()
    }
    
    // Ensure pricing data is included if available in the original card
    if (cardData.pricing) {
      collectionItem.pricing = cardData.pricing
    }

    // Check if user already has this card (by multiverseid or id)
    const identifierQuery = cardData.multiverseid 
      ? { "collection.multiverseid": cardData.multiverseid }
      : { "collection.id": cardData.id }

    const existingUser = await usersCollection.findOne({
      _id: userId,
      ...identifierQuery
    })

    if (existingUser) {
      // Update quantity of existing card
      const updateQuery = cardData.multiverseid 
        ? { "collection.multiverseid": cardData.multiverseid }
        : { "collection.id": cardData.id }
        
      await usersCollection.updateOne(
        { 
          _id: userId,
          ...updateQuery
        },
        {
          $inc: { "collection.$.quantity": collectionData.quantity || 1 },
          $set: { "collection.$.updatedAt": new Date() }
        }
      )
    } else {
      // Add new card to collection
      await usersCollection.updateOne(
        { _id: userId },
        { 
          $push: { collection: collectionItem },
          $set: { updatedAt: new Date() }
        },
        { upsert: false } // Don't create user if doesn't exist
      )
    }

    revalidatePath('/collection')
    revalidatePath('/')
    
    return { success: true, message: 'Card added to collection successfully' }
  } catch (error) {
    console.error('Error adding card to collection:', error)
    return { success: false, error: error.message }
  }
}

export async function removeCardFromCollection(cardId, multiverseid) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      throw new Error('You must be logged in to manage your collection')
    }

    const userId = new ObjectId(session.user.id)
    const usersCollection = await getUsersCollection()

    // Build the pull query to remove the card from collection array
    const pullQuery = {}
    if (multiverseid) {
      pullQuery.multiverseid = multiverseid
    } else if (cardId) {
      pullQuery.id = cardId
    } else {
      throw new Error('Either cardId or multiverseid must be provided')
    }

    const result = await usersCollection.updateOne(
      { _id: userId },
      { 
        $pull: { collection: pullQuery },
        $set: { updatedAt: new Date() }
      }
    )

    if (result.matchedCount === 0) {
      throw new Error('User not found')
    }

    if (result.modifiedCount === 0) {
      throw new Error('Card not found in your collection')
    }

    revalidatePath('/collection')
    revalidatePath('/')

    return { success: true, message: 'Card removed from collection' }
  } catch (error) {
    console.error('Error removing card from collection:', error)
    return { success: false, error: error.message }
  }
}

export async function updateCardInCollection(cardId, multiverseid, updateData) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      throw new Error('You must be logged in to manage your collection')
    }

    const userId = new ObjectId(session.user.id)
    const usersCollection = await getUsersCollection()

    // Build the query to find the specific card in the collection
    const matchQuery = { _id: userId }
    const identifierQuery = multiverseid 
      ? { "collection.multiverseid": multiverseid }
      : { "collection.id": cardId }

    // Build the update object with $ positional operator
    const updateObj = {
      $set: {
        "collection.$.updatedAt": new Date()
      }
    }

    // Add each field from updateData with positional operator
    Object.keys(updateData).forEach(key => {
      updateObj.$set[`collection.$.${key}`] = updateData[key]
    })

    const result = await usersCollection.updateOne(
      { ...matchQuery, ...identifierQuery },
      updateObj
    )

    if (result.matchedCount === 0) {
      throw new Error('Card not found in your collection')
    }

    revalidatePath('/collection')

    return { success: true, message: 'Card updated successfully' }
  } catch (error) {
    console.error('Error updating card in collection:', error)
    return { success: false, error: error.message }
  }
}

export async function getUserCollection(filters = {}) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return { success: false, error: 'You must be logged in to view your collection' }
    }

    const userId = new ObjectId(session.user.id)
    const usersCollection = await getUsersCollection()

    // Build aggregation pipeline
    const pipeline = [
      { $match: { _id: userId } },
      { $unwind: { path: '$collection', preserveNullAndEmptyArrays: false } },
    ]

    // Add search filter if provided
    if (filters.search) {
      pipeline.push({
        $match: {
          $or: [
            { 'collection.name': { $regex: filters.search, $options: 'i' } },
            { 'collection.text': { $regex: filters.search, $options: 'i' } },
            { 'collection.type': { $regex: filters.search, $options: 'i' } }
          ]
        }
      })
    }

    // Sort by most recently added
    pipeline.push(
      { $sort: { 'collection.addedAt': -1 } },
      {
        $project: {
          _id: 0,
          card: '$collection'
        }
      }
    )

    const result = await usersCollection.aggregate(pipeline).toArray()
    
    // Serialize dates for client components
    const serializedCollection = result.map(item => ({
      ...item.card,
      acquiredDate: item.card.acquiredDate ? item.card.acquiredDate.toISOString() : null,
      addedAt: item.card.addedAt ? item.card.addedAt.toISOString() : null,
      updatedAt: item.card.updatedAt ? item.card.updatedAt.toISOString() : null,
      lastSyncedAt: item.card.lastSyncedAt ? item.card.lastSyncedAt.toISOString() : null,
    }))

    return {
      success: true,
      collection: serializedCollection
    }
  } catch (error) {
    console.error('Error fetching user collection:', error)
    return { success: false, error: error.message }
  }
}

export async function clearUserCollection() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      throw new Error('You must be logged in to clear your collection')
    }

    const userId = new ObjectId(session.user.id)
    const usersCollection = await getUsersCollection()

    // Get collection count before clearing
    const user = await usersCollection.findOne(
      { _id: userId },
      { projection: { collection: 1 } }
    )
    const cardCount = user?.collection?.length || 0

    // Clear the collection array
    const result = await usersCollection.updateOne(
      { _id: userId },
      { 
        $set: { 
          collection: [],
          updatedAt: new Date()
        }
      }
    )

    if (result.matchedCount === 0) {
      throw new Error('User not found')
    }

    revalidatePath('/collection')
    revalidatePath('/')
    
    return { 
      success: true, 
      message: `Successfully cleared collection (${cardCount} cards removed)`,
      deletedCount: cardCount
    }
  } catch (error) {
    console.error('Error clearing user collection:', error)
    return { success: false, error: error.message }
  }
}

export async function getCollectionStats() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return { success: false, error: 'You must be logged in' }
    }

    const userId = new ObjectId(session.user.id)
    const usersCollection = await getUsersCollection()

    const stats = await usersCollection.aggregate([
      { $match: { _id: userId } },
      { $unwind: { path: '$collection', preserveNullAndEmptyArrays: false } },
      {
        $group: {
          _id: null,
          totalCards: { $sum: '$collection.quantity' },
          uniqueCards: { $sum: 1 },
          totalValue: {
            $sum: {
              $multiply: [
                { $ifNull: ['$collection.acquiredPrice', 0] },
                '$collection.quantity'
              ]
            }
          }
        }
      }
    ]).toArray()

    const result = stats[0] || { totalCards: 0, uniqueCards: 0, totalValue: 0 }

    return {
      success: true,
      stats: result
    }
  } catch (error) {
    console.error('Error fetching collection stats:', error)
    return { success: false, error: error.message }
  }
}
