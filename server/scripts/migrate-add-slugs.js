/**
 * Migration script to add slugs to existing diagrams
 * Run once: node scripts/migrate-add-slugs.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const { nanoid } = require('nanoid');

const MONGODB_URI = process.env.MONGODB_URI;

async function migrate() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected!\n');

    // Get raw collection to update documents without schema validation
    const db = mongoose.connection.db;
    const diagramsCollection = db.collection('diagrams');

    // Find all diagrams without a slug
    const diagramsWithoutSlug = await diagramsCollection.find({ 
      $or: [
        { slug: { $exists: false } },
        { slug: null },
        { slug: '' }
      ]
    }).toArray();

    console.log(`Found ${diagramsWithoutSlug.length} diagrams without slugs\n`);

    if (diagramsWithoutSlug.length === 0) {
      console.log('All diagrams already have slugs. Nothing to migrate!');
      await mongoose.disconnect();
      return;
    }

    // Update each diagram with a new slug
    let updated = 0;
    for (const diagram of diagramsWithoutSlug) {
      const newSlug = nanoid(10);
      
      await diagramsCollection.updateOne(
        { _id: diagram._id },
        { 
          $set: { 
            slug: newSlug,
            isPublic: false,
            collaborators: []
          } 
        }
      );
      
      console.log(`  Updated "${diagram.name}" -> slug: ${newSlug}`);
      updated++;
    }

    console.log(`\n✅ Migration complete! Updated ${updated} diagrams.`);
    
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
    
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrate();
