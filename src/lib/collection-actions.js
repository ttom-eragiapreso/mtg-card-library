'use server'

import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { getCardsCollection, getUserCollectionsCollection } from "@/lib/models"
import { revalidatePath } from "next/cache"

export async function addCardToCollection(cardData, collectionData = {}) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      throw new Error('You must be logged in to add cards to your collection')
    }

    const userId = session.user.id
    const cardsCollection = await getCardsCollection()
    const userCollectionsCollection = await getUserCollectionsCollection()

    // First, ensure the card exists in our cards collection
    let existingCard = null
    if (cardData.multiverseid) {
      existingCard = await cardsCollection.findOne({ multiverseid: cardData.multiverseid })
    } else if (cardData.id) {
      existingCard = await cardsCollection.findOne({ id: cardData.id })
    }

    let cardId = cardData.id || cardData.multiverseid?.toString()

    if (!existingCard) {
      // Save the card data to our database
      const cardToSave = {
        ...cardData,
        createdAt: new Date(),
        updatedAt: new Date()
      }
      
      const result = await cardsCollection.insertOne(cardToSave)
      cardId = result.insertedId.toString()
    } else {
      cardId = existingCard._id.toString()
    }

    // Check if user already has this card in collection
    const existingUserCard = await userCollectionsCollection.findOne({
      userId,
      $or: [
        { cardId },
        { multiverseid: cardData.multiverseid }
      ]
    })

    if (existingUserCard) {
      // Update quantity instead of creating duplicate
      await userCollectionsCollection.updateOne(
        { _id: existingUserCard._id },
        {
          $set: {
            quantity: (existingUserCard.quantity || 1) + (collectionData.quantity || 1),
            updatedAt: new Date()
          }
        }
      )
    } else {
      // Add new card to user collection
      const collectionEntry = {
        userId,
        cardId,
        multiverseid: cardData.multiverseid,
        quantity: collectionData.quantity || 1,
        condition: collectionData.condition || 'near_mint',
        foil: collectionData.foil || false,
        language: collectionData.language || 'English',
        notes: collectionData.notes || '',
        acquiredDate: collectionData.acquiredDate || new Date(),
        acquiredPrice: collectionData.acquiredPrice,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      await userCollectionsCollection.insertOne(collectionEntry)
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

    const userId = session.user.id
    const userCollectionsCollection = await getUserCollectionsCollection()

    const query = {
      userId,
      $or: [
        { cardId },
        { multiverseid }
      ]
    }

    const result = await userCollectionsCollection.deleteOne(query)

    if (result.deletedCount === 0) {
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

export async function updateCardInCollection(collectionId, updateData) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      throw new Error('You must be logged in to manage your collection')
    }

    const userId = session.user.id
    const userCollectionsCollection = await getUserCollectionsCollection()

    const result = await userCollectionsCollection.updateOne(
      { _id: collectionId, userId },
      {
        $set: {
          ...updateData,
          updatedAt: new Date()
        }
      }
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

    const userId = session.user.id
    const userCollectionsCollection = await getUserCollectionsCollection()
    const cardsCollection = await getCardsCollection()

    // Build query
    const query = { userId }
    
    // Add filters
    if (filters.search) {
      // We'll need to search in the cards collection and then filter user collection
      const cardQuery = {
        $or: [
          { name: new RegExp(filters.search, 'i') },
          { text: new RegExp(filters.search, 'i') },
          { type: new RegExp(filters.search, 'i') }
        ]
      }
      
      const matchingCards = await cardsCollection.find(cardQuery).toArray()
      const matchingCardIds = matchingCards.map(card => card._id.toString())
      
      query.cardId = { $in: matchingCardIds }
    }

    // Get user collection entries
    const collectionEntries = await userCollectionsCollection
      .find(query)
      .sort({ createdAt: -1 })
      .toArray()

    // Get full card data for each collection entry
    const enrichedCollection = await Promise.all(
      collectionEntries.map(async (entry) => {
        let card = null
        
        if (entry.multiverseid) {
          card = await cardsCollection.findOne({ multiverseid: entry.multiverseid })
        }
        
        if (!card && entry.cardId) {
          card = await cardsCollection.findOne({ _id: entry.cardId })
        }

        return {
          ...entry,
          card: card || null
        }
      })
    )

    return {
      success: true,
      collection: enrichedCollection.filter(item => item.card !== null)
    }
  } catch (error) {
    console.error('Error fetching user collection:', error)
    return { success: false, error: error.message }
  }
}

export async function getCollectionStats() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return { success: false, error: 'You must be logged in' }
    }

    const userId = session.user.id
    const userCollectionsCollection = await getUserCollectionsCollection()

    const stats = await userCollectionsCollection.aggregate([
      { $match: { userId } },
      {
        $group: {
          _id: null,
          totalCards: { $sum: '$quantity' },
          uniqueCards: { $sum: 1 },
          totalValue: { $sum: { $multiply: ['$acquiredPrice', '$quantity'] } }
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
