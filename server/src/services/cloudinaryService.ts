import { v2 as cloudinary } from 'cloudinary';
import config from '../config/index.js';
import { logger } from '../utils/logger.js';
import fs from 'fs';

// Configure Cloudinary
const isConfigured =
  config.cloudinary.cloudName &&
  config.cloudinary.cloudName !== 'demo' &&
  config.cloudinary.apiKey &&
  config.cloudinary.apiSecret;

if (isConfigured) {
  cloudinary.config({
    cloud_name: config.cloudinary.cloudName,
    api_key: config.cloudinary.apiKey,
    api_secret: config.cloudinary.apiSecret,
  });
  logger.info('Cloudinary configured successfully.');
} else {
  logger.warn('Cloudinary not configured or using default demo credentials.');
}

/**
 * Uploads an in-memory Buffer directly to Cloudinary via upload_stream.
 * This avoids any disk I/O and works on Vercel's read-only serverless filesystem.
 * @param buffer File buffer from multer memoryStorage
 * @param mimeType MIME type of the file (e.g. 'image/jpeg')
 * @param folder Cloudinary folder name
 */
export const uploadImageBuffer = async (
  buffer: Buffer,
  mimeType: string,
  folder = 'bizhub'
): Promise<string> => {
  if (!isConfigured) {
    throw new Error('Cloudinary is not configured. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET environment variables.');
  }

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'image',
        allowed_formats: ['jpg', 'png', 'jpeg', 'webp', 'gif'],
      },
      (error, result) => {
        if (error) {
          logger.error('Cloudinary upload_stream error:', error);
          return reject(new Error('Failed to upload image to Cloudinary'));
        }
        if (!result) {
          return reject(new Error('Cloudinary returned no result'));
        }
        resolve(result.secure_url);
      }
    );
    uploadStream.end(buffer);
  });
};

/**
 * Uploads a local file path to Cloudinary.
 * Used for compatibility with any legacy code that still passes a file path.
 * @param filePath Path to the temporary local file
 * @param folder Cloudinary folder name
 */
export const uploadImage = async (filePath: string, folder = 'bizhub'): Promise<string> => {
  try {
    if (isConfigured) {
      const result = await cloudinary.uploader.upload(filePath, {
        folder,
        resource_type: 'image',
        allowed_formats: ['jpg', 'png', 'jpeg', 'webp', 'gif'],
      });
      // Clean up the local file asynchronously
      fs.unlink(filePath, (err) => {
        if (err) logger.error('Failed to delete temp file:', err);
      });
      return result.secure_url;
    } else {
      throw new Error('Cloudinary is not configured. Cannot upload image.');
    }
  } catch (error) {
    logger.error('Error during image upload:', error);
    // Cleanup on error
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    throw new Error('Failed to upload image');
  }
};
