import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../.env') });

async function fixUser() {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) throw new Error('MONGODB_URI not found');

    await mongoose.connect(mongoUri);
    console.log('Connected.');

    const userId = '6a06c45a3241b2f95311a682';
    const business = await mongoose.connection.db.collection('businesses').findOne({ owner: new mongoose.Types.ObjectId(userId) });
    
    if (business) {
      const result = await mongoose.connection.db.collection('users').updateOne(
        { _id: new mongoose.Types.ObjectId(userId) },
        { $set: { businessId: business._id, role: 'owner' } }
      );
      console.log('User updated:', result);
    } else {
      console.log('No business found for user.');
    }

    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

fixUser();
