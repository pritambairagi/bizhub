import mongoose from 'mongoose';
import dns from 'dns';
import config from './index.js';
import { logger } from '../utils/logger.js';

// Force Node.js to use public DNS for mongodb+srv:// SRV lookups if needed.
// Avoid overriding DNS for local connections (localhost / IP).
if (config.mongodb.uri.startsWith('mongodb+srv://')) {
  try {
    dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
  } catch {
    // Keep default DNS if setServers is not permitted
  }
}

const connectDB = async (): Promise<void> => {
  try {
    const { uri, options } = config.mongodb;

    await mongoose.connect(uri, options);

    logger.info(`MongoDB connected: ${mongoose.connection.host}`);

    mongoose.connection.on('error', (err) => {
      logger.error('MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected');
    });

    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      logger.info('MongoDB connection closed due to app termination');
      process.exit(0);
    });
  } catch (error) {
    logger.error('MongoDB connection failed:', error);
    // Throw instead of process.exit so Vercel serverless can handle the error gracefully
    throw error;
  }
};

export default connectDB;