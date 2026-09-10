/**
 * Lightweight visitor counter.
 *
 * Tracks total unique visitors (via a persistent session cookie) and daily
 * unique visitors (reset every 24 h).  Counts are stored on the Settings
 * singleton document so they survive restarts without an extra collection.
 *
 * The cookie ``_vid`` lasts 30 days; returning visitors within that window
 * are not double-counted.
 */
const Settings = require('../models/Settings');

const COOKIE_NAME = '_vid';
const COOKIE_MAX_AGE = 30 * 24 * 60 * 60 * 1000; // 30 days
const DAILY_WINDOW_MS = 24 * 60 * 60 * 1000;

/**
 * Middleware function – attach to every public route.
 * Runs non-blocking; errors are swallowed so they never break the page.
 */
async function visitorTracker(req, res, next) {
  try {
    // Skip admin, API, static, and bot requests
    const path = req.path || '';
    if (
      path.startsWith('/admin') ||
      path.startsWith('/api') ||
      path.startsWith('/uploads') ||
      path.startsWith('/images') ||
      path.includes('.')
    ) {
      return next();
    }

    const ua = req.headers['user-agent'] || '';
    if (/bot|crawl|spider|slurp|facebookexternalhit/i.test(ua)) {
      return next();
    }

    let vid = req.cookies[COOKIE_NAME];
    const isNewVisitor = !vid;

    if (isNewVisitor) {
      vid = `_v${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
      res.cookie(COOKIE_NAME, vid, {
        maxAge: COOKIE_MAX_AGE,
        httpOnly: true,
        sameSite: 'lax',
      });
    }

    // Reset daily counter if the window has elapsed
    const settings = await Settings.findOne({ key: 'site' });
    if (!settings) return next();

    const now = Date.now();
    if (!settings.dailyVisitorResetAt || (now - new Date(settings.dailyVisitorResetAt).getTime()) >= DAILY_WINDOW_MS) {
      settings.dailyVisitors = 0;
      settings.dailyVisitorResetAt = new Date();
    }

    // Bump counts only for new cookies (unique visitors)
    if (isNewVisitor) {
      settings.visitorCount = (settings.visitorCount || 0) + 1;
      settings.dailyVisitors = (settings.dailyVisitors || 0) + 1;
      await settings.save();
    }

    // Expose to views so templates / admin can read the count
    res.locals.visitorCount = settings.visitorCount || 0;
    res.locals.dailyVisitors = settings.dailyVisitors || 0;
  } catch (err) {
    // Never break the page for analytics
  }
  next();
}

module.exports = visitorTracker;
