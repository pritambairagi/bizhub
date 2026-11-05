import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { User } from '../models/User.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../.env') });

async function resetDatabase() {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) throw new Error('MONGODB_URI not found in .env');

    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('Connected.');

    // 1. Find Master Admin (super_admin)
    const masterAdmin = await User.findOne({ role: 'super_admin' }).lean();
    
    if (!masterAdmin) {
      console.log('No super_admin found. A new one will be created if needed during seed.');
    } else {
      console.log(`Found Master Admin: ${masterAdmin.email}`);
    }

    // 2. Get all collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    
    console.log('Resetting collections...');
    for (const collection of collections) {
      const collectionName = collection.name;
      
      if (collectionName === 'users') {
        // Delete all users EXCEPT the super_admin
        // And reset super_admin's business association
        const result = await mongoose.connection.db.collection('users').deleteMany({
          role: { $ne: 'super_admin' }
        });
        await mongoose.connection.db.collection('users').updateMany(
          { role: 'super_admin' },
          { $set: { businessId: null, branchId: null, permissions: ['*'] } }
        );
        console.log(`Cleared ${result.deletedCount} users (kept and reset super_admin).`);
      } else {
        // Delete everything in other collections
        const result = await mongoose.connection.db.collection(collectionName).deleteMany({});
        console.log(`Cleared collection: ${collectionName} (${result.deletedCount} docs).`);
      }
    }

    console.log('-----------------------------------');
    console.log('Database Reset Successfully!');
    if (masterAdmin) {
      console.log(`Master Admin ${masterAdmin.email} is preserved.`);
    }
    console.log('-----------------------------------');

    process.exit(0);
  } catch (error) {
    console.error('Error resetting database:', error);
    process.exit(1);
  }
}

resetDatabase();
