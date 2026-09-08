const express = require('express');
const rateLimit = require('express-rate-limit');
const {
  adminController,
  adminProductController,
  adminSettingsController,
  adminCategoryController,
  adminMediaController,
} = require('../controllers');
const { requireAdmin } = require('../middleware/adminAuth');
const { csrfProtect } = require('../middleware');
const { productUpload, settingsUpload, categoryUpload } = require('../middleware/upload');

const router = express.Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many login attempts. Please try again later.' },
});

router.use((req, res, next) => {
  res.locals.adminPath = req.path;
  res.locals.layout = 'admin/layout';
  next();
});

router.get('/login', adminController.getLogin);
router.post('/login', loginLimiter, csrfProtect, adminController.postLogin);
router.post('/logout', requireAdmin, csrfProtect, adminController.postLogout);

// Dashboard (also aliased at the root /admin via the requireAdmin redirect below)
router.get('/dashboard', requireAdmin, adminController.getDashboard);
router.get('/', requireAdmin, adminController.getDashboard);

// Change password (requires an active admin session)
router.get('/change-password', requireAdmin, adminController.getChangePassword);
router.post('/change-password', requireAdmin, csrfProtect, adminController.postChangePassword);

// Products
router.get('/products', requireAdmin, adminProductController.getProducts);
router.get('/products/new', requireAdmin, adminProductController.getNewProduct);
router.post('/products/new', requireAdmin, productUpload.array('images', 8), csrfProtect, adminProductController.createProduct);
router.post('/products/bulk', requireAdmin, csrfProtect, adminProductController.bulkProducts);
router.get('/products/:id/edit', requireAdmin, adminProductController.getEditProduct);
router.post('/products/:id/edit', requireAdmin, productUpload.array('images', 8), csrfProtect, adminProductController.updateProduct);
router.post('/products/:id/delete', requireAdmin, csrfProtect, adminProductController.deleteProduct);
router.post('/products/:id/restore', requireAdmin, csrfProtect, adminProductController.restoreProduct);
router.post('/products/:id/purge', requireAdmin, csrfProtect, adminProductController.purgeProduct);

// Categories
router.get('/categories', requireAdmin, adminCategoryController.getCategories);
router.get('/categories/new', requireAdmin, adminCategoryController.getNewCategory);
router.post('/categories/new', requireAdmin, categoryUpload.single('image'), csrfProtect, adminCategoryController.createCategory);
router.get('/categories/:id/edit', requireAdmin, adminCategoryController.getEditCategory);
router.post('/categories/:id/edit', requireAdmin, categoryUpload.single('image'), csrfProtect, adminCategoryController.updateCategory);
router.post('/categories/:id/delete', requireAdmin, csrfProtect, adminCategoryController.deleteCategory);

// Image library
router.get('/media', requireAdmin, adminMediaController.getMedia);
router.post('/media/delete', requireAdmin, csrfProtect, adminMediaController.deleteMedia);

// Settings
router.get('/settings', requireAdmin, adminSettingsController.getSettings);
router.post('/settings', requireAdmin, settingsUpload.fields([
  { name: 'logo', maxCount: 1 },
  { name: 'heroImage', maxCount: 1 },
  { name: 'favicon', maxCount: 1 },
]), csrfProtect, adminSettingsController.updateSettings);

module.exports = router;