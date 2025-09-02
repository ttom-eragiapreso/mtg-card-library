'use server'

import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { getUsersCollection } from "@/lib/models"
import { revalidatePath } from "next/cache"
import { ObjectId } from 'mongodb'
import { v4 as uuidv4 } from 'uuid'

// Create a new deck
export async function createDeck(deckData) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      throw new Error('You must be logged in to create decks')
    }

    const userId = new ObjectId(session.user.id)
    const usersCollection = await getUsersCollection()

    const newDeck = {
      id: uuidv4(),
      name: deckData.name || 'Untitled Deck',
      description: deckData.description || '',
      format: deckData.format || 'casual',
      isPublic: deckData.isPublic || false,
      cards: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      lastPlayedAt: null
    }

    const result = await usersCollection.updateOne(
      { _id: userId },
      { 
        $push: { decks: newDeck },
        $set: { updatedAt: new Date() }
      },
      { upsert: false }
    )

    if (result.matchedCount === 0) {
      throw new Error('User not found')
    }

    revalidatePath('/collection/decks')
    
    return { success: true, deck: newDeck, message: 'Deck created successfully' }
  } catch (error) {
    console.error('Error creating deck:', error)
    return { success: false, error: error.message }
  }
}

// Get all user decks
export async function getUserDecks() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return { success: false, error: 'You must be logged in to view decks' }
    }

    const userId = new ObjectId(session.user.id)
    const usersCollection = await getUsersCollection()

    const user = await usersCollection.findOne(
      { _id: userId },
      { projection: { decks: 1 } }
    )

    if (!user) {
      throw new Error('User not found')
    }

    const decks = user.decks || []

    // Serialize dates for client components
    const serializedDecks = decks.map(deck => ({
      ...deck,
      createdAt: deck.createdAt?.toISOString(),
      updatedAt: deck.updatedAt?.toISOString(),
      lastPlayedAt: deck.lastPlayedAt?.toISOString()
    }))

    return {
      success: true,
      decks: serializedDecks
    }
  } catch (error) {
    console.error('Error fetching user decks:', error)
    return { success: false, error: error.message }
  }
}

// Get a specific deck by ID with full card data
export async function getDeckById(deckId) {
  try {
    console.log('=== GET DECK BY ID DEBUG ===', { deckId })
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return { success: false, error: 'You must be logged in to view decks' }
    }

    const userId = new ObjectId(session.user.id)
    const usersCollection = await getUsersCollection()
    console.log('User ID:', userId.toString())

    // Use aggregation to get deck with populated card data
    const result = await usersCollection.aggregate([
      { $match: { _id: userId } },
      { $unwind: { path: '$decks', preserveNullAndEmptyArrays: false } },
      { $match: { 'decks.id': deckId } },
      {
        $project: {
          deck: '$decks',
          collection: '$collection'
        }
      }
    ]).toArray()

    console.log('Raw database query result:', JSON.stringify(result, null, 2))

    if (result.length === 0) {
      throw new Error('Deck not found')
    }

    const { deck, collection } = result[0]
    console.log('Deck from database:', JSON.stringify(deck, null, 2))
    console.log('User collection length:', collection?.length || 0)
    console.log('Raw deck cards array:', JSON.stringify(deck.cards, null, 2))

    // Populate deck cards with full card data from collection
    const populatedCards = deck.cards.map((deckCard, index) => {
      console.log(`Processing card ${index + 1}/${deck.cards.length}:`, deckCard)
      
      // For basic lands, cardData is already embedded
      if (deckCard.isBasicLand && deckCard.cardData) {
        console.log(`  -> Basic land with embedded data: ${deckCard.cardData.name}`)
        return deckCard
      }
      
      console.log(`  -> Looking for card in collection...`)
      const collectionCard = collection.find(c => 
        (deckCard.multiverseid && c.multiverseid === deckCard.multiverseid) ||
        (deckCard.cardId && c.id === deckCard.cardId)
      )
      
      if (collectionCard) {
        console.log(`  -> Found collection card: ${collectionCard.name}`)
      } else {
        console.log(`  -> Card NOT found in collection! Looking for:`, {
          multiverseid: deckCard.multiverseid,
          cardId: deckCard.cardId
        })
        console.log('  -> Collection card ids:', collection.map(c => ({ id: c.id, multiverseid: c.multiverseid, name: c.name })))
      }
      
      return {
        ...deckCard,
        cardData: collectionCard || null
      }
    }).filter((card, index) => {
      if (card.cardData === null) {
        console.log(`  -> FILTERING OUT card ${index + 1} because cardData is null`)
        return false
      }
      return true
    }) // Filter out cards not in collection

    console.log('Final populated cards count:', populatedCards.length)
    console.log('Final populated cards:', populatedCards.map(c => ({ name: c.cardData?.name, quantity: c.quantity })))

    const populatedDeck = {
      ...deck,
      cards: populatedCards,
      createdAt: deck.createdAt?.toISOString(),
      updatedAt: deck.updatedAt?.toISOString(),
      lastPlayedAt: deck.lastPlayedAt?.toISOString()
    }

    console.log('=== FINAL DECK RESULT ===', {
      deckId: populatedDeck.id,
      name: populatedDeck.name,
      cardCount: populatedDeck.cards.length,
      cards: populatedDeck.cards.map(c => ({ name: c.cardData?.name, quantity: c.quantity }))
    })

    return {
      success: true,
      deck: populatedDeck
    }
  } catch (error) {
    console.error('Error fetching deck:', error)
    return { success: false, error: error.message }
  }
}

// Update deck information (name, description, format)
export async function updateDeck(deckId, updateData) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      throw new Error('You must be logged in to update decks')
    }

    const userId = new ObjectId(session.user.id)
    const usersCollection = await getUsersCollection()

    const updateFields = {}
    if (updateData.name !== undefined) updateFields['decks.$.name'] = updateData.name
    if (updateData.description !== undefined) updateFields['decks.$.description'] = updateData.description
    if (updateData.format !== undefined) updateFields['decks.$.format'] = updateData.format
    if (updateData.isPublic !== undefined) updateFields['decks.$.isPublic'] = updateData.isPublic
    updateFields['decks.$.updatedAt'] = new Date()

    const result = await usersCollection.updateOne(
      { _id: userId, 'decks.id': deckId },
      { $set: updateFields }
    )

    if (result.matchedCount === 0) {
      throw new Error('Deck not found')
    }

    revalidatePath(`/collection/decks/${deckId}`)
    revalidatePath('/collection/decks')

    return { success: true, message: 'Deck updated successfully' }
  } catch (error) {
    console.error('Error updating deck:', error)
    return { success: false, error: error.message }
  }
}

// Delete a deck
export async function deleteDeck(deckId) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      throw new Error('You must be logged in to delete decks')
    }

    const userId = new ObjectId(session.user.id)
    const usersCollection = await getUsersCollection()

    const result = await usersCollection.updateOne(
      { _id: userId },
      { 
        $pull: { decks: { id: deckId } },
        $set: { updatedAt: new Date() }
      }
    )

    if (result.matchedCount === 0) {
      throw new Error('User not found')
    }

    if (result.modifiedCount === 0) {
      throw new Error('Deck not found')
    }

    revalidatePath('/collection/decks')

    return { success: true, message: 'Deck deleted successfully' }
  } catch (error) {
    console.error('Error deleting deck:', error)
    return { success: false, error: error.message }
  }
}

// Add card to deck
export async function addCardToDeck(deckId, cardData, quantity = 1, category = 'mainboard') {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      throw new Error('You must be logged in to manage decks')
    }

    const userId = new ObjectId(session.user.id)
    const usersCollection = await getUsersCollection()

    // Check if card exists in user's collection (required for all non-basic cards)
    const hasCollectionCard = await usersCollection.findOne(
      {
        _id: userId,
        $or: [
          { 'collection.multiverseid': cardData.multiverseid },
          { 'collection.id': cardData.id }
        ]
      },
      { projection: { _id: 1 } }
    )

    if (!hasCollectionCard) {
      throw new Error('Card not found in your collection')
    }

    // Get the current deck to check what cards already exist
    const currentUser = await usersCollection.findOne(
      { _id: userId },
      { projection: { decks: { $elemMatch: { id: deckId } } } }
    )
    
    if (!currentUser || !currentUser.decks || currentUser.decks.length === 0) {
      throw new Error('Deck not found')
    }
    
    const currentDeck = currentUser.decks[0]

    const deckCard = {
      collectionCardId: cardData.multiverseid || cardData.id,
      multiverseid: cardData.multiverseid,
      cardId: cardData.id,
      quantity,
      category
    }

    // Check if this card already exists in the deck
    const existingCard = currentDeck.cards.find(card => 
      (card.multiverseid && card.multiverseid === cardData.multiverseid) ||
      (card.cardId === cardData.id)
    )
    
    if (existingCard) {
      // Update existing card quantity
      const updateFilter = {
        _id: userId,
        'decks.id': deckId
      }
      
      // Add the specific card identification to the filter
      if (cardData.multiverseid) {
        updateFilter['decks.cards.multiverseid'] = cardData.multiverseid
      } else {
        updateFilter['decks.cards.cardId'] = cardData.id
      }
      
      const updateQuery = {
        $inc: { 'decks.$.cards.$[card].quantity': quantity },
        $set: { 'decks.$.updatedAt': new Date() }
      }
      
      const updateOptions = {
        arrayFilters: cardData.multiverseid 
          ? [{ 'card.multiverseid': cardData.multiverseid }]
          : [{ 'card.cardId': cardData.id }]
      }
      
      await usersCollection.updateOne(updateFilter, updateQuery, updateOptions)
    } else {
      // Add new card
      const pushResult = await usersCollection.updateOne(
        { _id: userId, 'decks.id': deckId },
        {
          $push: { 'decks.$.cards': deckCard },
          $set: { 'decks.$.updatedAt': new Date() }
        }
      )
      
      if (pushResult.modifiedCount === 0) {
        throw new Error('Failed to add card to deck - deck might not exist')
      }
    }

    revalidatePath(`/collection/decks/${deckId}`)

    return { success: true, message: 'Card added to deck successfully' }
  } catch (error) {
    console.error('Error adding card to deck:', error)
    return { success: false, error: error.message }
  }
}

// Remove card from deck
export async function removeCardFromDeck(deckId, cardData, quantity = null) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      throw new Error('You must be logged in to manage decks')
    }

    const userId = new ObjectId(session.user.id)
    const usersCollection = await getUsersCollection()

    console.log('Removing card from deck:', { deckId, cardData, quantity })

    // Handle different card data structures
    let pullQuery = {}
    let arrayFilter = {}
    
    if (cardData.isBasicLand || cardData.cardId?.startsWith('basic-')) {
      // Basic land removal
      pullQuery = { cardId: cardData.cardId }
      arrayFilter = { 'card.cardId': cardData.cardId }
    } else if (cardData.multiverseid) {
      // Regular card with multiverseid
      pullQuery = { multiverseid: cardData.multiverseid }
      arrayFilter = { 'card.multiverseid': cardData.multiverseid }
    } else if (cardData.cardId || cardData.id) {
      // Regular card with cardId/id
      const cardId = cardData.cardId || cardData.id
      pullQuery = { cardId: cardId }
      arrayFilter = { 'card.cardId': cardId }
    } else {
      throw new Error('Invalid card data structure for removal')
    }

    console.log('Using pullQuery:', pullQuery)
    console.log('Using arrayFilter:', arrayFilter)

    if (quantity === null) {
      // Remove card completely
      const result = await usersCollection.updateOne(
        { _id: userId, 'decks.id': deckId },
        {
          $pull: { 'decks.$.cards': pullQuery },
          $set: { 'decks.$.updatedAt': new Date() }
        }
      )
      console.log('Remove card result:', result)
    } else {
      // Decrease quantity
      const updateResult = await usersCollection.updateOne(
        { _id: userId },
        {
          $inc: { 'decks.$[deck].cards.$[card].quantity': -quantity },
          $set: { 'decks.$[deck].updatedAt': new Date() }
        },
        {
          arrayFilters: [
            { 'deck.id': deckId },
            arrayFilter
          ]
        }
      )
      console.log('Decrease quantity result:', updateResult)

      // Remove cards with 0 or negative quantity
      const cleanupResult = await usersCollection.updateOne(
        { _id: userId, 'decks.id': deckId },
        {
          $pull: { 'decks.$.cards': { quantity: { $lte: 0 } } },
          $set: { 'decks.$.updatedAt': new Date() }
        }
      )
      console.log('Cleanup result:', cleanupResult)
    }

    revalidatePath(`/collection/decks/${deckId}`)

    return { success: true, message: 'Card removed from deck successfully' }
  } catch (error) {
    console.error('Error removing card from deck:', error)
    return { success: false, error: error.message }
  }
}

// Add basic lands to deck (without collection validation)
export async function addBasicLandsToDeck(deckId, basicLands) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      throw new Error('You must be logged in to manage decks')
    }

    const userId = new ObjectId(session.user.id)
    const usersCollection = await getUsersCollection()

    // Basic land card data templates
    const basicLandData = {
      Plains: {
        name: 'Plains',
        type: 'Basic Land — Plains',
        types: ['Land', 'Basic'],
        subtypes: ['Plains'],
        colors: [],
        cmc: 0,
        manaCost: '',
        text: '{T}: Add {W}.',
        power: null,
        toughness: null,
        rarity: 'Basic Land'
      },
      Island: {
        name: 'Island',
        type: 'Basic Land — Island',
        types: ['Land', 'Basic'],
        subtypes: ['Island'],
        colors: [],
        cmc: 0,
        manaCost: '',
        text: '{T}: Add {U}.',
        power: null,
        toughness: null,
        rarity: 'Basic Land'
      },
      Swamp: {
        name: 'Swamp',
        type: 'Basic Land — Swamp',
        types: ['Land', 'Basic'],
        subtypes: ['Swamp'],
        colors: [],
        cmc: 0,
        manaCost: '',
        text: '{T}: Add {B}.',
        power: null,
        toughness: null,
        rarity: 'Basic Land'
      },
      Mountain: {
        name: 'Mountain',
        type: 'Basic Land — Mountain',
        types: ['Land', 'Basic'],
        subtypes: ['Mountain'],
        colors: [],
        cmc: 0,
        manaCost: '',
        text: '{T}: Add {R}.',
        power: null,
        toughness: null,
        rarity: 'Basic Land'
      },
      Forest: {
        name: 'Forest',
        type: 'Basic Land — Forest',
        types: ['Land', 'Basic'],
        subtypes: ['Forest'],
        colors: [],
        cmc: 0,
        manaCost: '',
        text: '{T}: Add {G}.',
        power: null,
        toughness: null,
        rarity: 'Basic Land'
      }
    }

    // Get the current deck to check what cards already exist
    const currentUser = await usersCollection.findOne(
      { _id: userId },
      { projection: { decks: { $elemMatch: { id: deckId } } } }
    )
    
    if (!currentUser || !currentUser.decks || currentUser.decks.length === 0) {
      throw new Error('Deck not found')
    }
    
    const currentDeck = currentUser.decks[0]

    // Process each basic land to add
    for (const { landName, quantity } of basicLands) {
      if (!basicLandData[landName]) {
        console.warn(`Unknown basic land: ${landName}`)
        continue
      }

      const landData = basicLandData[landName]
      const basicLandId = `basic-${landName.toLowerCase()}`
      
      // Check if this basic land already exists in the deck
      const existingCard = currentDeck.cards.find(card => card.cardId === basicLandId)
      
      if (existingCard) {
        // Update existing card quantity
        await usersCollection.updateOne(
          {
            _id: userId,
            'decks.id': deckId,
            'decks.cards.cardId': basicLandId
          },
          {
            $inc: { 'decks.$.cards.$[card].quantity': quantity },
            $set: { 
              'decks.$.updatedAt': new Date(),
              'decks.$.cards.$[card].cardData': landData
            }
          },
          {
            arrayFilters: [{ 'card.cardId': basicLandId }]
          }
        )
      } else {
        // Add new card
        const deckCard = {
          collectionCardId: basicLandId,
          multiverseid: null,
          cardId: basicLandId,
          quantity,
          category: 'mainboard',
          isBasicLand: true,
          cardData: landData // Embed card data directly
        }
        
        const pushResult = await usersCollection.updateOne(
          { _id: userId, 'decks.id': deckId },
          {
            $push: { 'decks.$.cards': deckCard },
            $set: { 'decks.$.updatedAt': new Date() }
          }
        )
        
        if (pushResult.modifiedCount === 0) {
          throw new Error(`Failed to add ${landName} to deck`)
        }
        
        // Update current deck state for next iteration
        currentDeck.cards.push(deckCard)
      }
    }

    revalidatePath(`/collection/decks/${deckId}`)

    return { success: true, message: 'Basic lands added to deck successfully' }
  } catch (error) {
    console.error('Error adding basic lands to deck:', error)
    return { success: false, error: error.message }
  }
}

// Calculate deck analytics
export async function getDeckAnalytics(deckId) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return { success: false, error: 'You must be logged in to view deck analytics' }
    }

    const result = await getDeckById(deckId)
    if (!result.success) {
      return result
    }

    const deck = result.deck
    const mainboardCards = deck.cards.filter(card => card.category === 'mainboard')
    
    // Basic stats
    const totalCards = mainboardCards.reduce((sum, card) => sum + card.quantity, 0)
    const uniqueCards = mainboardCards.length

    // Mana curve
    const manaCurve = {}
    for (let i = 0; i <= 10; i++) {
      manaCurve[i] = 0
    }

    // Color distribution
    const colorDistribution = {
      W: 0, U: 0, B: 0, R: 0, G: 0, C: 0 // C for colorless
    }

    // Type distribution
    const typeDistribution = {
      creature: 0,
      instant: 0,
      sorcery: 0,
      artifact: 0,
      enchantment: 0,
      planeswalker: 0,
      land: 0,
      other: 0
    }

    // Calculate analytics
    mainboardCards.forEach(deckCard => {
      if (!deckCard.cardData) return

      const card = deckCard.cardData
      const quantity = deckCard.quantity
      const isBasicLand = deckCard.isBasicLand || false

      // Mana curve (exclude basic lands)
      if (!isBasicLand) {
        const cmc = parseInt(card.cmc) || 0
        const cmcGroup = cmc > 10 ? 10 : cmc
        manaCurve[cmcGroup] += quantity
      }

      // Color distribution (exclude basic lands)
      if (!isBasicLand) {
        const colors = card.colors || []
        if (colors.length === 0) {
          colorDistribution.C += quantity
        } else {
          colors.forEach(color => {
            if (Object.hasOwn(colorDistribution, color)) {
              colorDistribution[color] += quantity
            }
          })
        }
      }

      // Type distribution (include all cards including basic lands)
      const types = card.types || []
      let counted = false
      
      for (const type of ['creature', 'instant', 'sorcery', 'artifact', 'enchantment', 'planeswalker', 'land']) {
        if (types.some(cardType => cardType.toLowerCase() === type)) {
          typeDistribution[type] += quantity
          counted = true
          break
        }
      }
      
      if (!counted) {
        typeDistribution.other += quantity
      }
    })

    // Calculate color percentages
    const colorPercentages = {}
    const totalColoredCards = Object.values(colorDistribution).reduce((sum, count) => sum + count, 0)
    
    Object.keys(colorDistribution).forEach(color => {
      colorPercentages[color] = totalColoredCards > 0 
        ? (colorDistribution[color] / totalColoredCards * 100).toFixed(1)
        : 0
    })

    // Average CMC (exclude basic lands)
    const nonBasicLandCards = mainboardCards.filter(card => !card.isBasicLand)
    const totalNonBasicCards = nonBasicLandCards.reduce((sum, card) => sum + card.quantity, 0)
    const totalCmc = nonBasicLandCards.reduce((sum, deckCard) => {
      if (!deckCard.cardData) return sum
      const cmc = parseInt(deckCard.cardData.cmc) || 0
      return sum + (cmc * deckCard.quantity)
    }, 0)
    const averageCmc = totalNonBasicCards > 0 ? (totalCmc / totalNonBasicCards).toFixed(2) : 0

    const analytics = {
      totalCards,
      uniqueCards,
      averageCmc: parseFloat(averageCmc),
      manaCurve,
      colorDistribution,
      colorPercentages,
      typeDistribution
    }

    return {
      success: true,
      analytics
    }
  } catch (error) {
    console.error('Error calculating deck analytics:', error)
    return { success: false, error: error.message }
  }
}
