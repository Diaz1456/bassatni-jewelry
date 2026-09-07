const { Lookbook } = require('../models');
const config = require('../config');

class LookbookController {
  async getLookbooks(req, res) {
    try {
      const { page = 1, limit = 12, season, year, featured } = req.query;

      const options = {
        limit: parseInt(limit, 10),
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

      const seasons = ['spring', 'summer', 'autumn', 'winter', 'holiday', 'bridal', 'annual'];
      const years = Array.from({ length: new Date().getFullYear() - 2020 + 1 }, (_, i) => 2020 + i).reverse();

      if (req.xhr || req.headers.accept?.includes('application/json')) {
        return res.json({
          lookbooks,
          pagination: {
            page: options.page,
            limit: options.limit,
            total,
            totalPages,
            hasNext: options.page < totalPages,
            hasPrev: options.page > 1,
          },
        });
      }

      res.render('lookbooks/index', {
        title: 'Lookbooks & Style Galleries',
        lookbooks,
        pagination: {
          page: options.page,
          limit: options.limit,
          total,
          totalPages,
          hasNext: options.page < totalPages,
          hasPrev: options.page > 1,
        },
        filters: { season: options.season, year: options.year, featured: options.featured },
        seasons,
        years,
        analytics: config.analytics,
      });
    } catch (error) {
      console.error('Lookbooks error:', error);
      res.status(500).render('error', { title: 'Error', message: 'Unable to load lookbooks' });
    }
  }

  async getLookbook(req, res) {
    try {
      const { slug } = req.params;
      const lookbook = await Lookbook.findOne({ slug, isPublished: true })
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
        return res.status(404).render('error', { title: 'Not Found', message: 'Lookbook not found' });
      }

      await Lookbook.updateOne({ _id: lookbook._id }, { $inc: { viewCount: 1 } });

      const breadcrumbs = [
        { name: 'Home', url: '/' },
        { name: 'Lookbooks', url: '/lookbooks' },
        { name: lookbook.title, url: '' },
      ];

      res.render('lookbooks/show', {
        title: lookbook.seo?.metaTitle || lookbook.title,
        lookbook,
        breadcrumbs,
        analytics: config.analytics,
      });
    } catch (error) {
      console.error('Lookbook detail error:', error);
      res.status(500).render('error', { title: 'Error', message: 'Unable to load lookbook' });
    }
  }

  async getFeaturedLookbooks(req, res) {
    try {
      const lookbooks = await Lookbook.getPublished({ featured: true, limit: 4 });
      res.json({ lookbooks });
    } catch (error) {
      console.error('Featured lookbooks error:', error);
      res.status(500).json({ error: 'Unable to load featured lookbooks' });
    }
  }
}

module.exports = new LookbookController();