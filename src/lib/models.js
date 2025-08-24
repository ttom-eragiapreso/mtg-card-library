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

export const getCardsCollection = async () => {
  const db = await getDb()
  return db.collection('cards')
}

export const getUserCollectionsCollection = async () => {
  const db = await getDb()
  return db.collection('userCollections')
}

// Create indexes for better performance
export const createIndexes = async () => {
  const usersCollection = await getUsersCollection()
  const cardsCollection = await getCardsCollection()
  const userCollectionsCollection = await getUserCollectionsCollection()

  // User indexes
  await usersCollection.createIndex({ 'email': 1 }, { unique: true })

  // Card indexes
  await cardsCollection.createIndex({ 'multiverseid': 1 }, { unique: true, sparse: true })
  await cardsCollection.createIndex({ 'id': 1 }, { unique: true, sparse: true })
  await cardsCollection.createIndex({ 'name': 'text', 'text': 'text' })
  await cardsCollection.createIndex({ 'name': 1 })
  await cardsCollection.createIndex({ 'set': 1 })
  await cardsCollection.createIndex({ 'setName': 1 })
  await cardsCollection.createIndex({ 'types': 1 })
  await cardsCollection.createIndex({ 'subtypes': 1 })
  await cardsCollection.createIndex({ 'supertypes': 1 })
  await cardsCollection.createIndex({ 'cmc': 1 })
  await cardsCollection.createIndex({ 'colors': 1 })
  await cardsCollection.createIndex({ 'colorIdentity': 1 })
  await cardsCollection.createIndex({ 'rarity': 1 })
  await cardsCollection.createIndex({ 'artist': 1 })
  await cardsCollection.createIndex({ 'layout': 1 })
  // Compound indexes for common queries
  await cardsCollection.createIndex({ 'colors': 1, 'cmc': 1 })
  await cardsCollection.createIndex({ 'types': 1, 'rarity': 1 })
  await cardsCollection.createIndex({ 'set': 1, 'rarity': 1 })

  // User collection indexes
  await userCollectionsCollection.createIndex({ 'userId': 1 })
  await userCollectionsCollection.createIndex({ 'userId': 1, 'cardId': 1 }, { unique: true })
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
  
  // Additional metadata
  createdAt: Date,
  updatedAt: Date,
  lastSyncedAt: Date // when card data was last updated from API
}

// User schema
export const userSchema = {
  email: String,
  password: String, // hashed password
  name: String,
  emailVerified: Date,
  image: String,
  createdAt: Date,
  updatedAt: Date
}

// User collection schema
export const userCollectionSchema = {
  userId: String, // NextAuth user ID
  cardId: String, // MTG API card ID
  multiverseid: Number, // Specific card printing
  quantity: Number,
  condition: String, // 'mint', 'near_mint', 'excellent', 'good', 'light_played', 'played', 'poor'
  foil: Boolean,
  language: String,
  notes: String,
  acquiredDate: Date,
  acquiredPrice: Number,
  createdAt: Date,
  updatedAt: Date
}
