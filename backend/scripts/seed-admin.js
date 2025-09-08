import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import connectDB from '../config/database.js';
import { User } from '../models/User.js';

dotenv.config({ path: './config.env' });

const run = async () => {
  try {
    await connectDB();
    const adminEmail = process.env.DEFAULT_ADMIN_EMAIL || 'admin@smartmart.com';
    const adminPassword = process.env.DEFAULT_ADMIN_PASSWORD || 'Admin@12345';

    const existing = await User.findOne({ email: adminEmail.toLowerCase() });
    if (existing) {
      console.log(`👑 Admin already exists: ${adminEmail}`);
      process.exit(0);
    }

    const hashed = await bcrypt.hash(adminPassword, 12);
    await User.create({
      name: 'SmartMart Admin',
      email: adminEmail.toLowerCase().trim(),
      password: hashed,
      role: 'admin',
      phoneNumber: '0000000000',
      address: 'Admin Address'
    });
    console.log(`✅ Default admin created: ${adminEmail} / ${adminPassword}`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Failed to seed admin:', err);
    process.exit(1);
  } finally {
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
    }
  }
};

run();


