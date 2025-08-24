import clientPromise from './mongodb'

// Database collections
export const getDb = async () => {
  const client = await clientPromise
  return client.db()
}

// Users collection
export const getUsersCollection = async () => {
  const db = await getDb()
  return db.collection('users')
}

// Cards collection - stores MTG card data
export const getCardsCollection = async () => {
  const db = await getDb()
  return db.collection('cards')
}

// User collections - stores user's card collections
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
  await cardsCollection.createIndex({ 'name': 'text', 'text': 'text' })
  await cardsCollection.createIndex({ 'name': 1 })
  await cardsCollection.createIndex({ 'set': 1 })
  await cardsCollection.createIndex({ 'types': 1 })
  await cardsCollection.createIndex({ 'subtypes': 1 })
  await cardsCollection.createIndex({ 'cmc': 1 })
  await cardsCollection.createIndex({ 'colors': 1 })
  await cardsCollection.createIndex({ 'rarity': 1 })

  // User collection indexes
  await userCollectionsCollection.createIndex({ 'userId': 1 })
  await userCollectionsCollection.createIndex({ 'userId': 1, 'cardId': 1 }, { unique: true })
}

// Card schema validation (for reference)
export const cardSchema = {
  // From MTG API
  id: String, // MTG API ID
  multiverseid: Number,
  name: String,
  names: [String], // for double-faced cards
  manaCost: String,
  cmc: Number, // converted mana cost
  colors: [String],
  colorIdentity: [String],
  type: String,
  supertypes: [String],
  types: [String],
  subtypes: [String],
  rarity: String,
  set: String,
  setName: String,
  text: String,
  artist: String,
  number: String,
  power: String,
  toughness: String,
  loyalty: Number,
  imageUrl: String,
  // Additional metadata
  createdAt: Date,
  updatedAt: Date
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
