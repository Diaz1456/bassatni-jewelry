const { connectDB, disconnectDB } = require('./db');
const { generateSitemap } = require('./generateSitemap');
const formatters = require('./formatters');

module.exports = {
  connectDB,
  disconnectDB,
  generateSitemap,
  ...formatters,
};