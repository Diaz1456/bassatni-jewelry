// Standalone entry point for the application.
// Render blueprint start command: `node server.js`
// (npm start also delegates here via the package.json start script.)
const { startServer } = require('./src/app');

startServer();