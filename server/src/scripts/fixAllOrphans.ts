import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../.env') });

async function fixAllOrphans() {
  try {
    await mongoose.connect(process.env.MONGODB_URI as string);
    console.log('Connected.');

    const users = await mongoose.connection.db.collection('users').find({ role: 'owner', businessId: { $exists: false } }).toArray();
    console.log(`Found ${users.length} owners without businessId.`);

    for (const user of users) {
      const business = await mongoose.connection.db.collection('businesses').findOne({ owner: user._id });
      if (business) {
        const branch = await mongoose.connection.db.collection('branches').findOne({ businessId: business._id });
        const result = await mongoose.connection.db.collection('users').updateOne(
          { _id: user._id },
          { $set: { businessId: business._id, branchId: branch ? branch._id : null, permissions: ['*'] } }
        );
        console.log(`Fixed user ${user.email}:`, result.modifiedCount);
      } else {
        console.log(`User ${user.email} has no business doc yet.`);
      }
    }

    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

fixAllOrphans();
