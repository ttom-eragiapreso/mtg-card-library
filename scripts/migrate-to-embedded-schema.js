#!/usr/bin/env node

/**
 * Migration Script: Convert from separate collections to embedded document schema
 * 
 * This script migrates data from the old schema:
 * - users collection (basic user data)
 * - cards collection (MTG card data) 
 * - userCollections collection (join table)
 * 
 * To the new embedded schema:
 * - users collection (user data + embedded collection array)
 */

const mongoose = require('mongoose');

// MongoDB connection string - update this to match your database
const MONGODB_URI = 'mongodb://localhost:27017/mtg-library';

console.log('🔧 Using MongoDB URI:', MONGODB_URI);

// Direct MongoDB connection function
async function connectToDatabase() {
  try {
    await mongoose.connect(MONGODB_URI, {
      bufferCommands: false
    });
    console.log('✅ Connected to MongoDB');
    return mongoose.connection.db;
  } catch (error) {
    console.error('❌ Failed to connect to MongoDB:', error.message);
    throw error;
  }
}

async function migrateToEmbeddedSchema() {
  try {
    console.log('🔄 Starting migration to embedded schema...');
    
    // Connect to database
    const db = await connectToDatabase();
    
    // Get collections
    const usersCollection = db.collection('users');
    const cardsCollection = db.collection('cards');
    const userCollectionsCollection = db.collection('userCollections');
    
    // Check if old collections exist
    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);
    
    const hasCards = collectionNames.includes('cards');
    const hasUserCollections = collectionNames.includes('userCollections');
    
    if (!hasCards && !hasUserCollections) {
      console.log('✅ No old collections found. Migration not needed.');
      return;
    }
    
    console.log(`📋 Found collections: cards=${hasCards}, userCollections=${hasUserCollections}`);
    
    // Get all users
    const users = await usersCollection.find({}).toArray();
    console.log(`👥 Found ${users.length} users to migrate`);
    
    let migratedUsers = 0;
    let totalCardsProcessed = 0;
    
    for (const user of users) {
      console.log(`\n👤 Migrating user: ${user.email}`);
      
      // Skip if user already has collection array (already migrated)
      if (user.collection && Array.isArray(user.collection)) {
        console.log(`  ⏭️  User already migrated (has collection array)`);
        continue;
      }
      
      // Get user's collection entries
      const userCollectionEntries = hasUserCollections 
        ? await userCollectionsCollection.find({ userId: user._id.toString() }).toArray()
        : [];
      
      console.log(`  📦 Found ${userCollectionEntries.length} collection entries`);
      
      if (userCollectionEntries.length === 0) {
        // User has no collection, just add empty array
        await usersCollection.updateOne(
          { _id: user._id },
          { 
            $set: { 
              collection: [],
              updatedAt: new Date()
            }
          }
        );
        console.log(`  ✅ Added empty collection array`);
        migratedUsers++;
        continue;
      }
      
      // Build the embedded collection array
      const embeddedCollection = [];
      
      for (const entry of userCollectionEntries) {
        let cardData = null;
        
        // Try to find the card data
        if (hasCards) {
          if (entry.multiverseid) {
            cardData = await cardsCollection.findOne({ multiverseid: entry.multiverseid });
          } else if (entry.cardId) {
            // Try as ObjectId first, then as string
            try {
              cardData = await cardsCollection.findOne({ _id: new mongoose.Types.ObjectId(entry.cardId) });
            } catch {
              cardData = await cardsCollection.findOne({ id: entry.cardId });
            }
          }
        }
        
        if (!cardData) {
          console.log(`  ⚠️  Card data not found for entry: ${entry.cardId || entry.multiverseid}`);
          continue;
        }
        
        // Merge card data with collection data
        const embeddedCard = {
          // Card data from cards collection
          ...cardData,
          
          // User-specific collection data from userCollections
          quantity: entry.quantity || 1,
          condition: entry.condition || 'near_mint',
          foil: entry.foil || false,
          language: entry.language || 'English',
          notes: entry.notes || '',
          acquiredDate: entry.acquiredDate || entry.createdAt || new Date(),
          acquiredPrice: entry.acquiredPrice || null,
          addedAt: entry.createdAt || new Date(),
          updatedAt: entry.updatedAt || new Date(),
          
          // Remove the old _id from cards collection to avoid conflicts
          _id: undefined
        };
        
        embeddedCollection.push(embeddedCard);
        totalCardsProcessed++;
      }
      
      // Update user with embedded collection
      await usersCollection.updateOne(
        { _id: user._id },
        { 
          $set: { 
            collection: embeddedCollection,
            updatedAt: new Date()
          }
        }
      );
      
      console.log(`  ✅ Migrated ${embeddedCollection.length} cards to embedded collection`);
      migratedUsers++;
    }
    
    console.log(`\n🎉 Migration completed successfully!`);
    console.log(`  📊 Users migrated: ${migratedUsers}`);
    console.log(`  🃏 Total cards processed: ${totalCardsProcessed}`);
    
    // Ask if user wants to backup old collections
    console.log(`\n⚠️  IMPORTANT: Old collections still exist:`);
    if (hasCards) console.log(`  - 'cards' collection`);
    if (hasUserCollections) console.log(`  - 'userCollections' collection`);
    console.log(`\nYou may want to:`);
    console.log(`1. Test the new schema thoroughly`);
    console.log(`2. Create backups: mongodump --db your-db-name --collection cards --collection userCollections`);
    console.log(`3. Drop old collections when confident: db.cards.drop(), db.userCollections.drop()`);
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
}

// Run the migration if this script is executed directly
if (require.main === module) {
  migrateToEmbeddedSchema()
    .then(() => {
      console.log('✨ Migration script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Migration script failed:', error);
      process.exit(1);
    });
}

module.exports = migrateToEmbeddedSchema;
