require('dotenv').config();
const cloudinary = require('cloudinary').v2;

// Cloudinary is the persistent-image store. When the three env vars below are
// set the app uploads images to Cloudinary and stores the returned CDN URLs in
// MongoDB; when they are absent it falls back to the local `uploads/` disk
// storage (handy for local development / Render free tier without Cloudinary).
const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME || '';
const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY || '';
const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET || '';
const CLOUDINARY_FOLDER = process.env.CLOUDINARY_FOLDER || 'jewelry-shop';

const isCloudinaryConfigured = Boolean(
  CLOUDINARY_CLOUD_NAME && CLOUDINARY_API_KEY && CLOUDINARY_API_SECRET,
);

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: CLOUDINARY_CLOUD_NAME,
    api_key: CLOUDINARY_API_KEY,
    api_secret: CLOUDINARY_API_SECRET,
    secure: true,
  });
}

module.exports = {
  cloudinary,
  isCloudinaryConfigured,
  CLOUDINARY_FOLDER,
};