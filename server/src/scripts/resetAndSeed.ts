import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { User, Business, Branch, Account, Category, Warehouse } from '../models/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../.env') });

async function resetDB() {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) throw new Error('MONGODB_URI not found in .env');

    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('Connected.');

    // 1. Clear Database
    console.log('Clearing database...');
    const collections = await mongoose.connection.db.listCollections().toArray();
    for (const col of collections) {
      await mongoose.connection.db.dropCollection(col.name);
      console.log(`Dropped collection: ${col.name}`);
    }

    // 2. Create Super Admin
    console.log('Seeding Super Admin...');
    const superAdmin = await User.create({
      email: 'admin@bizhub.com',
      password: 'adminpassword123',
      role: 'super_admin',
      profile: {
        firstName: 'Master',
        lastName: 'Admin',
      },
      status: 'active',
      permissions: ['*'],
    });
    console.log('Super Admin Created.');

    // 3. Create Default Business
    console.log('Seeding Default Business...');
    const business = await Business.create({
      name: 'BizHub Demo Corp',
      type: 'retail',
      owner: superAdmin._id,
      contact: {
        email: 'info@democorp.com',
        phone: '0123456789',
        address: 'Dhaka, Bangladesh',
      },
      settings: {
        currency: 'BDT',
        timezone: 'Asia/Dhaka',
        language: 'en',
      },
      status: 'active',
    });

    // 4. Create Default Branch
    const branch = await Branch.create({
      businessId: business._id,
      name: 'Main Branch',
      code: 'MB-001',
      contact: {
        phone: '0123456789',
        address: 'Dhaka, Bangladesh',
      },
      isMain: true,
      status: 'active',
    });

    // 5. Update Super Admin with Business (Optional, but helps for testing)
    superAdmin.businessId = business._id as any;
    superAdmin.branchId = branch._id as any;
    await superAdmin.save();

    // 6. Create Default Warehouse
    await Warehouse.create({
      businessId: business._id,
      branchId: branch._id,
      name: 'Main Warehouse',
      code: 'WH-001',
      address: 'Dhaka, Bangladesh',
    });

    // 7. Seed Default Categories
    console.log('Seeding Categories...');
    const categories = [
      { name: { en: 'Electronics', bn: 'ইলেকট্রনিক্স' }, slug: 'electronics', businessId: business._id },
      { name: { en: 'Groceries', bn: 'মুদিখানা' }, slug: 'groceries', businessId: business._id },
      { name: { en: 'Fashion', bn: 'ফ্যাশন' }, slug: 'fashion', businessId: business._id },
    ];
    await Category.insertMany(categories);

    // 8. Seed Chart of Accounts
    console.log('Seeding Chart of Accounts...');
    const accounts = [
      { businessId: business._id, name: 'Cash', code: '1001', type: 'asset', currentBalance: 100000 },
      { businessId: business._id, name: 'Bank Account', code: '1002', type: 'asset', currentBalance: 500000, isBank: true },
      { businessId: business._id, name: 'Sales Revenue', code: '4001', type: 'income', currentBalance: 0 },
      { businessId: business._id, name: 'Inventory Expense', code: '5001', type: 'expense', currentBalance: 0 },
    ];
    await Account.insertMany(accounts);

    console.log('-----------------------------------');
    console.log('Database Reset and Seeded Successfully!');
    console.log('Super Admin: admin@bizhub.com / adminpassword123');
    console.log('Default Business: BizHub Demo Corp');
    console.log('-----------------------------------');

    process.exit(0);
  } catch (error) {
    console.error('Error resetting database:', error);
    process.exit(1);
  }
}

resetDB();
