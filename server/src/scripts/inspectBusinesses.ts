import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../.env') });

async function inspectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI as string);
    const businesses = await mongoose.connection.db.collection('businesses').find({}).toArray();
    console.log('--- ALL BUSINESSES ---');
    console.log(JSON.stringify(businesses.map(b => ({
      _id: b._id,
      name: b.name,
      slug: b.slug,
      email: b.contact?.email,
      phone: b.contact?.phone,
      owner: b.owner
    })), null, 2));
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

inspectDB();
