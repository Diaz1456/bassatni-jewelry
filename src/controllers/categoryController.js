const { Category, Product } = require('../models');
const config = require('../config');

class CategoryController {
  async getCategory(req, res) {
    try {
      const { slug } = req.params;
      const category = await Category.findOne({ slug, isActive: true })
        .populate({
          path: 'subcategories',
          match: { isActive: true },
          select: 'name slug image shortDescription',
          options: { sort: { order: 1, name: 1 } },
        })
        .lean();

      if (!category) {
        return res.status(404).render('error', { title: 'Not Found', message: 'Category not found' });
      }

      const {
        q: query,
        metalType,
        gemstone,
        minPrice,
        maxPrice,
        occasion,
        sort = '-createdAt',
        page = 1,
        limit = 12,
      } = req.query;

      const options = {
        category: category._id,
        metalType: metalType || undefined,
        gemstone: gemstone || undefined,
        minPrice: minPrice ? parseFloat(minPrice) : undefined,
        maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
        occasion: occasion || undefined,
        sort,
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
      };

      const [searchResults, filterOptions] = await Promise.all([
        Product.searchAndCount(query, options),
        Product.getFilterOptions(category._id),
      ]);

      const { products, count: total } = searchResults;

      const totalPages = Math.ceil(total / options.limit);

      const breadcrumbs = [
        { name: 'Home', url: '/' },
        { name: 'Catalog', url: '/catalog' },
        { name: category.name, url: '' },
      ];

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
          category,
        });
      }

      res.render('categories/show', {
        title: category.seo?.metaTitle || category.name,
        category,
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
        breadcrumbs,
        analytics: config.analytics,
      });
    } catch (error) {
      console.error('Category error:', error);
      res.status(500).render('error', { title: 'Error', message: 'Unable to load category' });
    }
  }

  async getAllCategories(req, res) {
    try {
      const categories = await Category.getTree();
      res.render('categories/index', { title: 'All Categories', categories });
    } catch (error) {
      console.error('Categories error:', error);
      res.status(500).render('error', { title: 'Error', message: 'Unable to load categories' });
    }
  }

  async getNavCategories(req, res) {
    try {
      const categories = await Category.getNavCategories();
      res.json({ categories });
    } catch (error) {
      console.error('Nav categories error:', error);
      res.status(500).json({ error: 'Unable to load navigation categories' });
    }
  }
}

module.exports = new CategoryController();