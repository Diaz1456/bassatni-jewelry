require('dotenv').config();

module.exports = {
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  mongodb: {
    // Prefer the production URI in production, but fall back to MONGODB_URI so a
    // single connection string env var works for any environment (matches Render).
    uri: process.env.MONGODB_URI_PROD || process.env.MONGODB_URI,
    options: {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    },
  },
  session: {
    secret: process.env.SESSION_SECRET || 'dev-secret-change-in-production',
  },
  site: {
    url: process.env.SITE_URL || 'http://localhost:3000',
    name: process.env.SITE_NAME || 'Elegance Jewelry',
    description: process.env.SITE_DESCRIPTION || 'Exquisite fine jewelry for life\u2019s precious moments',
  },
  analytics: {
    gaId: process.env.GA_MEASUREMENT_ID || '',
  },
  images: {
    quality: parseInt(process.env.IMAGE_QUALITY, 10) || 80,
    maxWidth: parseInt(process.env.IMAGE_MAX_WIDTH, 10) || 1920,
  },
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 900000,
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 100,
  },
};