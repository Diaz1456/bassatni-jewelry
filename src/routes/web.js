const express = require('express');
const { productController, categoryController, lookbookController, pageController } = require('../controllers');
const { csrfProtect } = require('../middleware');

const router = express.Router();

router.get('/', pageController.getHome);
router.get('/health', pageController.getHealth);
router.get('/sitemap.xml', pageController.getSitemap);
router.get('/robots.txt', pageController.getRobots);

router.get('/about', pageController.getAbout);
router.get('/contact', pageController.getContact);
router.post('/contact', csrfProtect, pageController.submitContact);
router.post('/newsletter/subscribe', csrfProtect, pageController.subscribeNewsletter);
router.get('/faq', pageController.getFAQ);
router.get('/size-guide', pageController.getSizeGuide);
router.get('/cart', pageController.getCart);
router.get('/wishlist', pageController.getWishlist);

router.get('/catalog', productController.getCatalog);
router.get('/catalog/new-arrivals', productController.getNewArrivals);
router.get('/catalog/best-sellers', productController.getBestSellers);
router.get('/catalog/featured', productController.getFeatured);
router.get('/catalog/autocomplete', productController.getAutocomplete);
router.get('/product/:slug', productController.getProduct);

router.get('/categories', categoryController.getAllCategories);
router.get('/category/:slug', categoryController.getCategory);
router.get('/api/categories/nav', categoryController.getNavCategories);

router.get('/lookbooks', lookbookController.getLookbooks);
router.get('/lookbook/:slug', lookbookController.getLookbook);
router.get('/api/lookbooks/featured', lookbookController.getFeaturedLookbooks);

router.use((req, res) => {
  res.status(404).render('error', { title: '404 - Not Found', statusCode: 404, message: 'The page you are looking for does not exist.' });
});

module.exports = router;