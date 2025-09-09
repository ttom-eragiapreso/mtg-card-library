import { connectDB } from './mongodb'
import mongoose from 'mongoose'

// Ensure connection
export const ensureConnection = async () => {
  await connectDB()
}

// Get the native MongoDB collections for backward compatibility
export const getDb = async () => {
  await ensureConnection()
  return mongoose.connection.db
}

export const getUsersCollection = async () => {
  const db = await getDb()
  return db.collection('users')
}

// Removed cards collection - now embedded in user collections

// Removed userCollections - now embedded in users

// Create indexes for better performance
export const createIndexes = async () => {
  const usersCollection = await getUsersCollection()

  // User indexes
  await usersCollection.createIndex({ 'email': 1 }, { unique: true })
  
  // Collection indexes on embedded documents
  await usersCollection.createIndex({ 'collection.name': 'text', 'collection.text': 'text' })
  await usersCollection.createIndex({ 'collection.name': 1 })
  await usersCollection.createIndex({ 'collection.multiverseid': 1 })
  await usersCollection.createIndex({ 'collection.id': 1 })
  await usersCollection.createIndex({ 'collection.set': 1 })
  await usersCollection.createIndex({ 'collection.types': 1 })
  await usersCollection.createIndex({ 'collection.colors': 1 })
  await usersCollection.createIndex({ 'collection.rarity': 1 })
  await usersCollection.createIndex({ 'collection.cmc': 1 })
  
  // Deck indexes
  await usersCollection.createIndex({ 'decks.id': 1 })
  await usersCollection.createIndex({ 'decks.name': 'text', 'decks.description': 'text' })
  await usersCollection.createIndex({ 'decks.format': 1 })
  await usersCollection.createIndex({ 'decks.isPublic': 1 })
  await usersCollection.createIndex({ 'decks.createdAt': 1 })
  
  console.log('Indexes created successfully')
}

// Card schema validation (for reference)
export const cardSchema = {
  // From MTG API - Core identification
  id: String, // MTG API ID
  multiverseid: Number,
  name: String,
  names: [String], // for double-faced cards
  
  // Mana and casting
  manaCost: String,
  cmc: Number, // converted mana cost
  colors: [String], // card colors
  colorIdentity: [String], // commander color identity
  
  // Card type information
  type: String, // full type line
  supertypes: [String], // e.g., Legendary, Basic
  types: [String], // e.g., Creature, Instant
  subtypes: [String], // e.g., Human, Wizard
  
  // Set and rarity information
  rarity: String, // Common, Uncommon, Rare, Mythic Rare
  set: String, // set code
  setName: String, // full set name
  
  // Card text and abilities
  text: String, // card rules text
  flavorText: String, // flavor text
  
  // Foreign name translations
  foreignNames: [{
    name: String,
    text: String,
    type: String,
    flavor: String,
    imageUrl: String,
    language: String,
    multiverseid: Number
  }],
  
  // Physical characteristics
  power: String,
  toughness: String,
  loyalty: Number, // for planeswalkers
  
  // Art and printing information
  artist: String,
  number: String, // collector number
  imageUrl: String,
  watermark: String,
  border: String, // black, white, silver, etc.
  
  // Layout and printing variations
  layout: String, // normal, split, flip, double-faced, etc.
  variations: [String], // multiverseids of variations
  printings: [String], // sets this card was printed in
  originalText: String, // original printed text
  originalType: String, // original printed type
  
  // Format legality
  legalities: {
    standard: String, // Legal, Not Legal, Banned, Restricted
    modern: String,
    legacy: String,
    vintage: String,
    commander: String,
    pioneer: String,
    historic: String,
    pauper: String,
    penny: String,
    duel: String,
    oldschool: String,
    premodern: String
  },
  
  // Rulings and additional data
  rulings: [{
    date: String,
    text: String
  }],
  
  // Enhanced image sources for fallbacks
  imageSources: [String],
  
  // Pricing data from Scryfall
  pricing: {
    usd: Number,
    usd_foil: Number,
    usd_etched: Number,
    eur: Number,
    eur_foil: Number,
    tix: Number,
    purchase_uris: {
      tcgplayer: String,
      cardmarket: String,
      cardhoarder: String
    },
    last_updated: Date,
    finishes: [String] // ['nonfoil', 'foil', 'etched']
  },

  // Additional metadata
  createdAt: Date,
  updatedAt: Date,
  lastSyncedAt: Date // when card data was last updated from API
}

// User schema with embedded collection
export const userSchema = {
  email: String,
  password: String, // hashed password
  name: String,
  emailVerified: Date,
  image: String,
  provider: String, // 'google', 'credentials'
  collection: [{
    // Full MTG card data (embedded)
    id: String, // MTG API ID
    multiverseid: Number,
    name: String,
    names: [String], // for double-faced cards
    
    // Mana and casting
    manaCost: String,
    cmc: Number, // converted mana cost
    colors: [String], // card colors
    colorIdentity: [String], // commander color identity
    
    // Card type information
    type: String, // full type line
    supertypes: [String], // e.g., Legendary, Basic
    types: [String], // e.g., Creature, Instant
    subtypes: [String], // e.g., Human, Wizard
    
    // Set and rarity information
    rarity: String, // Common, Uncommon, Rare, Mythic Rare
    set: String, // set code
    setName: String, // full set name
    
    // Card text and abilities
    text: String, // card rules text
    flavorText: String, // flavor text
    
    // Physical characteristics
    power: String,
    toughness: String,
    loyalty: Number, // for planeswalkers
    
    // Art and printing information
    artist: String,
    number: String, // collector number
    imageUrl: String,
    imageSources: [String], // fallback image URLs
    
    // Layout and printing variations
    layout: String, // normal, split, flip, double-faced, etc.
    
    // Format legality
    legalities: {
      standard: String,
      modern: String,
      legacy: String,
      vintage: String,
      commander: String,
      pioneer: String,
      historic: String,
      pauper: String,
      penny: String,
      duel: String,
      oldschool: String,
      premodern: String
    },
    
    // Pricing data from Scryfall
    pricing: {
      usd: Number,
      usd_foil: Number,
      usd_etched: Number,
      eur: Number,
      eur_foil: Number,
      tix: Number,
      purchase_uris: {
        tcgplayer: String,
        cardmarket: String,
        cardhoarder: String
      },
      last_updated: Date,
      finishes: [String] // ['nonfoil', 'foil', 'etched']
    },
    
    // User-specific collection data
    quantity: Number,
    condition: String, // 'mint', 'near_mint', 'excellent', 'good', 'light_played', 'played', 'poor'
    foil: Boolean,
    language: String,
    notes: String,
    acquiredDate: Date,
    acquiredPrice: Number,
    addedAt: Date, // when added to collection
    updatedAt: Date // when collection entry was last updated
  }],
  
  // User's decks
  decks: [{
    id: String, // unique deck identifier
    name: String, // deck name
    description: String, // optional deck description
    format: String, // commander, standard, modern, legacy, etc.
    isPublic: Boolean, // whether deck is publicly viewable
    cards: [{
      // Reference to card in user's collection
      collectionCardId: String, // id or multiverseid from collection
      multiverseid: Number,
      cardId: String, // MTG API ID
      quantity: Number, // number of this card in deck
      category: String // 'mainboard', 'sideboard', 'maybeboard'
    }],
    createdAt: Date,
    updatedAt: Date,
    lastPlayedAt: Date // when deck was last used
  }],
  createdAt: Date,
  updatedAt: Date
}

// Collection item schema (for validation)
export const collectionItemSchema = {
  // MTG card data + user-specific data combined
  // See userSchema.collection for full definition
}
