const { Product, Category } = require('../models');
const config = require('../config');

const generateProductSchema = (product, siteUrl) => {
  const mainImage = product.mainImage?.url ? `${siteUrl}${product.mainImage.url}` : '';
  const images = product.images?.map(img => `${siteUrl}${img.url}`) || [];

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.shortDescription || product.description?.substring(0, 300),
    sku: product.sku,
    brand: {
      '@type': 'Brand',
      name: config.site.name,
    },
    images,
    image: mainImage,
    offers: {
      '@type': 'Offer',
      url: `${siteUrl}/product/${product.slug}`,
      priceCurrency: 'USD',
      price: product.price,
      availability: product.inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      seller: {
        '@type': 'Organization',
        name: config.site.name,
      },
    },
    aggregateRating: product.rating?.count > 0 ? {
      '@type': 'AggregateRating',
      ratingValue: product.rating.average,
      reviewCount: product.rating.count,
    } : undefined,
  };
};

class ProductController {
  async getCatalog(req, res) {
    try {
      const {
        q: query,
        category,
        metalType,
        gemstone,
        minPrice,
        maxPrice,
        occasion,
        isNew,
        isBestSeller,
        inStock,
        sort = '-createdAt',
        page = 1,
        limit = 12,
      } = req.query;

      const options = {
        category: category || undefined,
        metalType: metalType || undefined,
        gemstone: gemstone || undefined,
        minPrice: minPrice ? parseFloat(minPrice) : undefined,
        maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
        occasion: occasion || undefined,
        isNew: isNew === 'true' ? true : isNew === 'false' ? false : undefined,
        isBestSeller: isBestSeller === 'true' ? true : isBestSeller === 'false' ? false : undefined,
        inStock: inStock === 'true' ? true : inStock === 'false' ? false : undefined,
        sort,
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
      };

      const [searchResults, filterOptions, categories] = await Promise.all([
        Product.searchAndCount(query, options),
        Product.getFilterOptions(category),
        Category.find({ isActive: true, parent: null }).sort({ order: 1, name: 1 }).select('name slug').lean(),
      ]);

      const { products, count: total } = searchResults;

      const totalPages = Math.ceil(total / options.limit);

      if (req.xhr || req.headers.accept?.includes('application/json')) {
        return res.json({
          products,
          pagination: {
            page: options.page,
            limit: options.limit,
            total,
            totalPages,
            hasNext: options.page < totalPages,
            hasPrev: options.page > 1,
          },
          filterOptions,
          categories,
        });
      }

      res.render('products/catalog', {
        title: 'Product Catalog',
        products,
        pagination: {
          page: options.page,
          limit: options.limit,
          total,
          totalPages,
          hasNext: options.page < totalPages,
          hasPrev: options.page > 1,
        },
        filters: req.query,
        filterOptions,
        categories,
        query: query || '',
      });
    } catch (error) {
      console.error('Catalog error:', error);
      res.status(500).render('error', { title: 'Error', message: 'Unable to load catalog' });
    }
  }

  async getProduct(req, res) {
    try {
      const { slug } = req.params;
      const product = await Product.findOne({ slug, isActive: true })
        .populate('category', 'name slug')
        .lean({ virtuals: true });

      if (!product) {
        return res.status(404).render('error', { title: 'Not Found', message: 'Product not found' });
      }

      await Product.updateOne({ _id: product._id }, { $inc: { viewCount: 1 } });

      const relatedProducts = await Product.find({
        _id: { $ne: product._id },
        category: product.category._id,
        isActive: true,
      })
        .limit(4)
        .select('name slug price compareAtPrice images isNew isBestSeller')
        .lean({ virtuals: true });

      const breadcrumbs = [
        { name: 'Home', url: '/' },
        { name: 'Catalog', url: '/catalog' },
        { name: product.category?.name, url: `/catalog?category=${product.category?._id}` },
        { name: product.name, url: '' },
      ];

      const structuredData = generateProductSchema(product, config.site.url);

      res.render('products/detail', {
        title: product.seo?.metaTitle || product.name,
        product,
        relatedProducts,
        breadcrumbs,
        structuredData,
        analytics: config.analytics,
      });
    } catch (error) {
      console.error('Product detail error:', error);
      res.status(500).render('error', { title: 'Error', message: 'Unable to load product' });
    }
  }

  async getAutocomplete(req, res) {
    try {
      const { q: query } = req.query;
      if (!query || query.length < 2) {
        return res.json({ suggestions: [] });
      }

      const products = await Product.suggest(query, 8);

      const suggestions = products.map(p => ({
        name: p.name,
        slug: p.slug,
        price: p.price,
        image: p.mainImage?.url || '/images/placeholder.svg',
      }));

      res.json({ suggestions });
    } catch (error) {
      console.error('Autocomplete error:', error);
      res.json({ suggestions: [] });
    }
  }

  async getNewArrivals(req, res) {
    try {
      const products = await Product.find({ isNew: true, isActive: true })
        .sort({ createdAt: -1 })
        .limit(8)
        .select('name slug price compareAtPrice images isBestSeller')
        .lean({ virtuals: true });

      if (req.xhr || req.headers.accept?.includes('application/json')) {
        return res.json({ products });
      }

      res.render('products/new-arrivals', { title: 'New Arrivals', products });
    } catch (error) {
      console.error('New arrivals error:', error);
      res.status(500).render('error', { title: 'Error', message: 'Unable to load new arrivals' });
    }
  }

  async getBestSellers(req, res) {
    try {
      const products = await Product.find({ isBestSeller: true, isActive: true })
        .sort({ 'rating.average': -1, soldCount: -1 })
        .limit(8)
        .select('name slug price compareAtPrice images rating isNew')
        .lean({ virtuals: true });

      if (req.xhr || req.headers.accept?.includes('application/json')) {
        return res.json({ products });
      }

      res.render('products/best-sellers', { title: 'Best Sellers', products });
    } catch (error) {
      console.error('Best sellers error:', error);
      res.status(500).render('error', { title: 'Error', message: 'Unable to load best sellers' });
    }
  }

  async getFeatured(req, res) {
    try {
      const products = await Product.find({ isFeatured: true, isActive: true })
        .sort({ createdAt: -1 })
        .limit(4)
        .select('name slug price compareAtPrice images')
        .lean({ virtuals: true });

      if (req.xhr || req.headers.accept?.includes('application/json')) {
        return res.json({ products });
      }

      res.json({ products });
    } catch (error) {
      console.error('Featured products error:', error);
      res.status(500).json({ error: 'Unable to load featured products' });
    }
  }
}

module.exports = new ProductController();