import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../.env') });

const UserSchema = new mongoose.Schema({
  email: String,
  password: { type: String, required: true },
  role: String,
  profile: {
    firstName: String,
    lastName: String,
  },
  status: String,
});

const User = mongoose.model('User', UserSchema);

async function seedAdmin() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb+srv://pritamperson_db_user:vDOMNj7B0OCzlSta@ac-skcldwn.gh4gwki.mongodb.net/POS?retryWrites=true&w=majority';
    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('Connected.');

    const email = 'admin@bizhub.com';
    const password = 'adminpassword123';

    const existingAdmin = await User.findOne({ email });
    if (existingAdmin) {
      console.log('Admin user already exists.');
      process.exit(0);
    }

    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    await User.create({
      email,
      password: hashedPassword,
      role: 'super_admin',
      profile: {
        firstName: 'Master',
        lastName: 'Admin',
      },
      status: 'active',
    });

    console.log('-----------------------------------');
    console.log('Super Admin Created Successfully!');
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);
    console.log('-----------------------------------');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding admin:', error);
    process.exit(1);
  }
}

seedAdmin();
