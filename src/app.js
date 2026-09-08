const express = require('express');
const expressLayouts = require('express-ejs-layouts');
const path = require('path');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const flash = require('connect-flash');
const compression = require('compression');
const morgan = require('morgan');
const { connectDB } = require('./utils/db');
const { webRoutes, apiRoutes, adminRoutes } = require('./routes');
const { securityHeaders, webLimiter, apiLimiter, errorHandler, csrfTokenLocals } = require('./middleware');
const { getCachedSettings } = require('./utils/settingsCache');
const config = require('./config');

const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '..', 'views'));
app.use(expressLayouts);
app.set('layout', 'layout');

if (config.nodeEnv === 'production') {
  app.set('trust proxy', 1);
}

app.use(securityHeaders);
app.use(compression());
app.use(morgan(config.nodeEnv === 'development' ? 'dev' : 'combined'));
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

const sessionStore = new session.MemoryStore();
app.use(session({
  name: 'sid',
  secret: config.session.secret,
  store: sessionStore,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: 'lax',
    secure: config.nodeEnv === 'production',
    maxAge: 1000 * 60 * 60 * 24 * 7,
  },
}));
app.use(flash());
app.use(csrfTokenLocals);
app.use((req, res, next) => {
  res.locals.flash = (type) => req.flash(type);
  next();
});

app.use('/api', apiLimiter);
app.use(webLimiter);

app.use(express.static(path.join(__dirname, '..', 'public'), {
  maxAge: config.nodeEnv === 'production' ? '1y' : '0',
  etag: true,
  lastModified: true,
}));

app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads'), {
  maxAge: config.nodeEnv === 'production' ? '1y' : '0',
  etag: true,
  lastModified: true,
}));

// Fallback: serve placeholder.svg for any missing image referenced by seed data
app.get('/images/*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public/images/placeholder.svg'));
});

app.use((req, res, next) => {
  res.locals.config = config.site;
  res.locals.analytics = config.analytics;
  res.locals.currentPath = req.path;
  res.locals.currentUrl = req.originalUrl;
  res.locals.title = res.locals.title || config.site.name;
  res.locals.description = res.locals.description || config.site.description;
  res.locals.structuredData = res.locals.structuredData || null;
  res.locals.product = res.locals.product || null;
  res.locals.category = res.locals.category || null;
  res.locals.lookbook = res.locals.lookbook || null;
  // Expose whether the visitor is an authenticated admin so the public header
  // can swap "Admin Login" for "Dashboard / Logout".
  res.locals.isAdminLoggedIn = Boolean(req.session && req.session.adminId);
  next();
});

// Inject site settings (shop name, logo, contact, hero) into every view
app.use(async (req, res, next) => {
  try {
    const settings = await getCachedSettings();
    res.locals.settings = settings;
    res.locals.config = {
      ...res.locals.config,
      name: settings.shopName || res.locals.config.name,
      description: settings.tagline || res.locals.config.description,
    };
  } catch (error) {
    console.error('Failed to load site settings:', error.message);
    res.locals.settings = null;
  }
  next();
});

// Expose formatting helpers to all EJS views
const formatters = require('./utils/formatters');
app.locals.formatPrice = formatters.formatPrice;
app.locals.formatPriceFromCents = formatters.formatPriceFromCents;
app.locals.formatNumber = formatters.formatNumber;
app.locals.formatDate = formatters.formatDate;
app.locals.truncate = formatters.truncate;
app.locals.slugify = formatters.slugify;
app.locals.capitalize = formatters.capitalize;
app.locals.capitalizeWords = formatters.capitalizeWords;
app.locals.getMetalLabel = formatters.getMetalLabel;
app.locals.getOccasionLabel = formatters.getOccasionLabel;
app.locals.formatMeasurements = formatters.formatMeasurements;
app.locals.formatGemstoneDetails = formatters.formatGemstoneDetails;

// Global locals middleware - fetch navbar categories and inject into all views
const { Category } = require('./models');
app.use(async (req, res, next) => {
  try {
    res.locals.categories = res.locals.categories || await Category.find({ isActive: true, parent: null })
      .sort({ order: 1, name: 1 })
      .select('name slug')
      .lean();
  } catch (error) {
    console.error('Failed to load navbar categories:', error.message);
    res.locals.categories = [];
  }
  next();
});

app.use('/api', apiRoutes);
app.use('/admin', adminRoutes);
app.use('/', webRoutes);

app.use(errorHandler);

const startServer = async () => {
  try {
    await connectDB();
    const server = app.listen(config.port, () => {
      console.log(`Server running in ${config.nodeEnv} mode on port ${config.port}`);
      console.log(`Visit: ${config.site.url}`);
    });

    const gracefulShutdown = async (signal) => {
      console.log(`\n${signal} received. Shutting down gracefully...`);
      server.close(async () => {
        const { disconnectDB } = require('./utils/db');
        await disconnectDB();
        console.log('Server closed.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

if (require.main === module) {
  startServer();
}

// Export both the configured Express app and the bootstrap function so the
// standalone entry point (server.js → `node server.js`) can start the server,
// while tests/scripts can import just the app without binding a port.
module.exports = { app, startServer };