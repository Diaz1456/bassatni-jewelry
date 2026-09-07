const { Product, Category, Lookbook } = require('../models');
const config = require('../config');

class PageController {
  async getHome(req, res) {
    try {
      const [newArrivals, bestSellers, featuredProducts, featuredLookbooks, categories] = await Promise.all([
        Product.find({ isNew: true, isActive: true }).sort({ createdAt: -1 }).limit(8).select('name slug price compareAtPrice images isBestSeller').lean({ virtuals: true }),
        Product.find({ isBestSeller: true, isActive: true }).sort({ 'rating.average': -1, soldCount: -1 }).limit(8).select('name slug price compareAtPrice images rating isNew').lean({ virtuals: true }),
        Product.find({ isFeatured: true, isActive: true }).sort({ createdAt: -1 }).limit(4).select('name slug price compareAtPrice images').lean({ virtuals: true }),
        Lookbook.getPublished({ featured: true, limit: 3 }),
        Category.find({ isActive: true, parent: null }).sort({ order: 1, name: 1 }).select('name slug image shortDescription').lean(),
      ]);

      res.render('index', {
        title: config.site.name,
        description: config.site.description,
        newArrivals,
        bestSellers,
        featuredProducts,
        featuredLookbooks,
        categories,
        analytics: config.analytics,
      });
    } catch (error) {
      console.error('Home page error:', error);
      res.status(500).render('error', { title: 'Error', message: 'Unable to load home page' });
    }
  }

  async getAbout(req, res) {
    res.render('about', {
      title: 'About Us',
      description: 'Learn about our story, craftsmanship, and commitment to quality.',
      analytics: config.analytics,
    });
  }

  async getContact(req, res) {
    res.render('contact', {
      title: 'Contact Us',
      description: 'Get in touch with our team for any inquiries.',
      analytics: config.analytics,
    });
  }

  async submitContact(req, res) {
    try {
      const { firstName, lastName, email, phone, subject, message } = req.body;
      if (!firstName || !lastName || !email || !subject || !message) {
        return res.status(400).render('contact', {
          title: 'Contact Us',
          description: 'Get in touch with our team for any inquiries.',
          error: 'Please fill in all required fields.',
          analytics: config.analytics,
        });
      }
      console.log('Contact form submission:', { firstName, lastName, email, phone, subject });
      res.render('contact', {
        title: 'Contact Us',
        description: 'Get in touch with our team for any inquiries.',
        success: 'Thank you! Your message has been received. We will respond within 24 hours.',
        analytics: config.analytics,
      });
    } catch (error) {
      console.error('Contact submission error:', error);
      res.status(500).render('contact', {
        title: 'Contact Us',
        error: 'Something went wrong submitting your message. Please try again.',
        analytics: config.analytics,
      });
    }
  }

  async subscribeNewsletter(req, res) {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ success: false, error: 'Email is required' });
      }
      console.log('Newsletter subscription:', email);
      res.json({ success: true, message: 'Subscribed successfully' });
    } catch (error) {
      console.error('Newsletter subscription error:', error);
      res.status(500).json({ success: false, error: 'Unable to subscribe' });
    }
  }

  async getFAQ(req, res) {
    const faqs = [
      {
        question: 'What materials do you use for your jewelry?',
        answer: 'We use only the finest materials including 14k/18k gold (yellow, white, rose), platinum, sterling silver, and ethically sourced gemstones. Each piece is hallmarked for authenticity.',
      },
      {
        question: 'Do you offer customization?',
        answer: 'Yes! We offer custom design services for engagement rings, wedding bands, and special pieces. Contact our design team for a consultation.',
      },
      {
        question: 'What is your return policy?',
        answer: 'We offer a 30-day return policy for unworn items in original condition. Custom and engraved pieces are non-returnable. Please see our Returns page for full details.',
      },
      {
        question: 'Do you ship internationally?',
        answer: 'Yes, we ship worldwide. Shipping times and costs vary by destination. All international orders include tracking and insurance.',
      },
      {
        question: 'How do I care for my jewelry?',
        answer: 'Each piece comes with specific care instructions. Generally, store jewelry separately, avoid chemicals, clean with a soft cloth, and have pieces professionally inspected annually.',
      },
      {
        question: 'What payment methods do you accept?',
        answer: 'We accept all major credit cards (Visa, Mastercard, Amex), PayPal, Apple Pay, Google Pay, and bank transfers for larger orders.',
      },
    ];

    res.render('faq', {
      title: 'Frequently Asked Questions',
      description: 'Find answers to common questions about our jewelry, policies, and services.',
      faqs,
      analytics: config.analytics,
    });
  }

  async getSizeGuide(req, res) {
    const ringSizes = [
      { us: '4', uk: 'H', circumference: '46.8', diameter: '14.9' },
      { us: '4.5', uk: 'I', circumference: '48.0', diameter: '15.3' },
      { us: '5', uk: 'J', circumference: '49.3', diameter: '15.7' },
      { us: '5.5', uk: 'K', circumference: '50.6', diameter: '16.1' },
      { us: '6', uk: 'K½', circumference: '51.8', diameter: '16.5' },
      { us: '6.5', uk: 'L', circumference: '53.1', diameter: '16.9' },
      { us: '7', uk: 'M', circumference: '54.4', diameter: '17.3' },
      { us: '7.5', uk: 'M½', circumference: '55.7', diameter: '17.7' },
      { us: '8', uk: 'N', circumference: '56.9', diameter: '18.1' },
      { us: '8.5', uk: 'O', circumference: '58.2', diameter: '18.5' },
      { us: '9', uk: 'P', circumference: '59.5', diameter: '18.9' },
      { us: '9.5', uk: 'P½', circumference: '60.7', diameter: '19.3' },
      { us: '10', uk: 'Q', circumference: '62.0', diameter: '19.7' },
      { us: '10.5', uk: 'R', circumference: '63.3', diameter: '20.1' },
      { us: '11', uk: 'S', circumference: '64.5', diameter: '20.5' },
    ];

    res.render('size-guide', {
      title: 'Jewelry Size Guide',
      description: 'Find your perfect ring size with our sizing chart and measurement tips.',
      ringSizes,
      analytics: config.analytics,
    });
  }

  async getCart(req, res) {
    // The cart is client-side (localStorage). The page is a styled shell that
    // main.js hydrates from the shopper's stored cart.
    res.render('cart', {
      title: 'Shopping Cart',
      description: 'Review the fine jewelry in your shopping cart.',
      analytics: config.analytics,
    });
  }

  async getWishlist(req, res) {
    // Wishlist is also client-side (localStorage) — same pattern as the cart.
    res.render('wishlist', {
      title: 'My Wishlist',
      description: 'Items you\u2019ve saved for later.',
      analytics: config.analytics,
    });
  }

  async getSitemap(req, res) {
    try {
      const [products, categories, lookbooks] = await Promise.all([
        Product.find({ isActive: true }).select('slug updatedAt').lean(),
        Category.find({ isActive: true }).select('slug updatedAt').lean(),
        Lookbook.find({ isPublished: true }).select('slug updatedAt').lean(),
      ]);

      const baseUrl = config.site.url;
      const urls = [
        { url: baseUrl, changefreq: 'daily', priority: 1.0 },
        { url: `${baseUrl}/catalog`, changefreq: 'daily', priority: 0.9 },
        { url: `${baseUrl}/lookbooks`, changefreq: 'weekly', priority: 0.8 },
        { url: `${baseUrl}/categories`, changefreq: 'weekly', priority: 0.7 },
        { url: `${baseUrl}/about`, changefreq: 'monthly', priority: 0.6 },
        { url: `${baseUrl}/contact`, changefreq: 'monthly', priority: 0.6 },
        { url: `${baseUrl}/faq`, changefreq: 'monthly', priority: 0.5 },
        { url: `${baseUrl}/size-guide`, changefreq: 'monthly', priority: 0.5 },
      ];

      products.forEach(p => {
        urls.push({ url: `${baseUrl}/product/${p.slug}`, changefreq: 'weekly', priority: 0.8, lastmod: p.updatedAt });
      });

      categories.forEach(c => {
        urls.push({ url: `${baseUrl}/category/${c.slug}`, changefreq: 'weekly', priority: 0.7, lastmod: c.updatedAt });
      });

      lookbooks.forEach(l => {
        urls.push({ url: `${baseUrl}/lookbook/${l.slug}`, changefreq: 'monthly', priority: 0.6, lastmod: l.updatedAt });
      });

      res.set('Content-Type', 'application/xml');
      res.render('sitemap', { urls, baseUrl, layout: false });
    } catch (error) {
      console.error('Sitemap error:', error);
      res.status(500).send('Error generating sitemap');
    }
  }

  async getRobots(req, res) {
    const baseUrl = config.site.url;
const robots = `User-agent: *
Allow: /

Disallow: /admin/
Disallow: /api/
Disallow: /cart/
Disallow: /wishlist/
Disallow: /account/
Disallow: /search?q=
Disallow: /*.json$
Disallow: /*.xml$

Sitemap: ${baseUrl}/sitemap.xml

`;

    res.set('Content-Type', 'text/plain');
    res.send(robots);
  }

  async getHealth(req, res) {
    res.json({ status: 'ok', timestamp: new Date().toISOString(), uptime: process.uptime() });
  }
}

module.exports = new PageController();