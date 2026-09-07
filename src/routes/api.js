const express = require('express');
const { Product, Category, Lookbook } = require('../models');

const router = express.Router();

router.get('/products', async (req, res) => {
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
      limit: Math.min(parseInt(limit, 10), 50),
    };

    const [searchResults, filterOptions] = await Promise.all([
      Product.searchAndCount(query, options),
      Product.getFilterOptions(category),
    ]);

    const { products, count: total } = searchResults;

    const totalPages = Math.ceil(total / options.limit);

    res.json({
      success: true,
      data: products,
      pagination: {
        page: options.page,
        limit: options.limit,
        total,
        totalPages,
        hasNext: options.page < totalPages,
        hasPrev: options.page > 1,
      },
      filterOptions,
    });
  } catch (error) {
    console.error('API products error:', error);
    res.status(500).json({ success: false, error: 'Unable to fetch products' });
  }
});

router.get('/products/:slug', async (req, res) => {
  try {
    const product = await Product.findOne({ slug: req.params.slug, isActive: true })
      .populate('category', 'name slug')
      .lean({ virtuals: true });

    if (!product) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }

    const relatedProducts = await Product.find({
      _id: { $ne: product._id },
      category: product.category._id,
      isActive: true,
    })
      .limit(4)
      .select('name slug price compareAtPrice images isNew isBestSeller')
      .lean({ virtuals: true });

    res.json({ success: true, data: { product, relatedProducts } });
  } catch (error) {
    console.error('API product detail error:', error);
    res.status(500).json({ success: false, error: 'Unable to fetch product' });
  }
});

router.get('/products/search/autocomplete', async (req, res) => {
  try {
    const { q: query } = req.query;
    if (!query || query.length < 2) {
      return res.json({ success: true, data: { suggestions: [] } });
    }

    const products = await Product.suggest(query, 8);

    const suggestions = products.map(p => ({
      name: p.name,
      slug: p.slug,
      price: p.price,
      image: p.mainImage?.url || '/images/placeholder.svg',
    }));

    res.json({ success: true, data: { suggestions } });
  } catch (error) {
    console.error('API autocomplete error:', error);
    res.json({ success: true, data: { suggestions: [] } });
  }
});

router.get('/categories', async (req, res) => {
  try {
    const categories = await Category.getTree();
    res.json({ success: true, data: categories });
  } catch (error) {
    console.error('API categories error:', error);
    res.status(500).json({ success: false, error: 'Unable to fetch categories' });
  }
});

router.get('/categories/nav', async (req, res) => {
  try {
    const categories = await Category.getNavCategories();
    res.json({ success: true, data: categories });
  } catch (error) {
    console.error('API nav categories error:', error);
    res.status(500).json({ success: false, error: 'Unable to fetch navigation categories' });
  }
});

router.get('/categories/:slug', async (req, res) => {
  try {
    const category = await Category.findOne({ slug: req.params.slug, isActive: true })
      .populate({
        path: 'subcategories',
        match: { isActive: true },
        select: 'name slug image shortDescription',
        options: { sort: { order: 1, name: 1 } },
      })
      .lean();

    if (!category) {
      return res.status(404).json({ success: false, error: 'Category not found' });
    }

    res.json({ success: true, data: category });
  } catch (error) {
    console.error('API category error:', error);
    res.status(500).json({ success: false, error: 'Unable to fetch category' });
  }
});

router.get('/lookbooks', async (req, res) => {
  try {
    const { page = 1, limit = 12, season, year, featured } = req.query;

    const options = {
      limit: Math.min(parseInt(limit, 10), 50),
      page: parseInt(page, 10),
      season: season || undefined,
      year: year ? parseInt(year, 10) : undefined,
      featured: featured === 'true' ? true : featured === 'false' ? false : undefined,
    };

    const [lookbooks, total] = await Promise.all([
      Lookbook.getPublished(options),
      Lookbook.countDocuments({
        isPublished: true,
        ...(options.season && { season: options.season }),
        ...(options.year && { year: options.year }),
        ...(options.featured !== undefined && { isFeatured: options.featured }),
      }),
    ]);

    const totalPages = Math.ceil(total / options.limit);

    res.json({
      success: true,
      data: lookbooks,
      pagination: {
        page: options.page,
        limit: options.limit,
        total,
        totalPages,
        hasNext: options.page < totalPages,
        hasPrev: options.page > 1,
      },
    });
  } catch (error) {
    console.error('API lookbooks error:', error);
    res.status(500).json({ success: false, error: 'Unable to fetch lookbooks' });
  }
});

router.get('/lookbooks/:slug', async (req, res) => {
  try {
    const lookbook = await Lookbook.findOne({ slug: req.params.slug, isPublished: true })
      .populate([
        {
          path: 'products',
          select: 'name slug price compareAtPrice images isNew isBestSeller',
          lean: { virtuals: true },
        },
        {
          path: 'images.product',
          select: 'name slug',
        },
      ])
      .lean({ virtuals: true });

    if (!lookbook) {
      return res.status(404).json({ success: false, error: 'Lookbook not found' });
    }

    res.json({ success: true, data: lookbook });
  } catch (error) {
    console.error('API lookbook error:', error);
    res.status(500).json({ success: false, error: 'Unable to fetch lookbook' });
  }
});

module.exports = router;