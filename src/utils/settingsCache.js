const { Settings } = require('../models');

// In-memory TTL cache for the site-settings singleton document.
//
// The settings are read by the public-site middleware on every request; without a
// cache that would mean one MongoDB query per page load. A short TTL keeps public
// reads fast, and the admin save handler calls invalidateSettingsCache() so edits
// appear immediately. Because this is a single-process cache, it is cleared on
// restart (harmless — it simply re-queries MongoDB).
let cachedSettings = null;
let cachedAt = 0;
const TTL = process.env.SETTINGS_CACHE_TTL_MS
  ? parseInt(process.env.SETTINGS_CACHE_TTL_MS, 10)
  : 60000;

async function getCachedSettings(force = false) {
  if (!force && cachedSettings && Date.now() - cachedAt < TTL) {
    return cachedSettings;
  }
  cachedSettings = await Settings.getSettings();
  cachedAt = Date.now();
  return cachedSettings;
}

function invalidateSettingsCache() {
  cachedSettings = null;
  cachedAt = 0;
}

module.exports = { getCachedSettings, invalidateSettingsCache };