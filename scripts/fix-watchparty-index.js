// Run this script once to drop old indexes
// node scripts/fix-watchparty-index.js

require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');

async function fixIndex() {
    try {
        const mongoUri = process.env.MONGODB_URI;

        if (!mongoUri) {
            console.error('❌ MONGODB_URI not found in .env.local');
            process.exit(1);
        }

        console.log('Connecting to MongoDB...');
        await mongoose.connect(mongoUri);

        console.log('✅ Connected to MongoDB');

        // Get the watchparties collection
        const db = mongoose.connection.db;
        const collection = db.collection('watchparties');

        // List all indexes
        const indexes = await collection.indexes();
        console.log('Current indexes:', JSON.stringify(indexes, null, 2));

        // Drop old indexes
        const oldIndexes = ['partyCode_1', 'code_1', 'expiresAt_1'];

        for (const indexName of oldIndexes) {
            try {
                await collection.dropIndex(indexName);
                console.log(`✅ Dropped old ${indexName} index`);
            } catch (error) {
                console.log(`ℹ️  Index ${indexName} does not exist or already dropped`);
            }
        }

        // List indexes after dropping
        const indexesAfter = await collection.indexes();
        console.log('\nIndexes after cleanup:', JSON.stringify(indexesAfter, null, 2));

        console.log('\n✅ Index cleanup complete! You can now create watch parties.');

    } catch (error) {
        console.error('❌ Error fixing index:', error.message);
    } finally {
        await mongoose.connection.close();
        console.log('Disconnected from MongoDB');
    }
}

fixIndex();
