const { Product, Category } = require('../models');
const config = require('../config');

const generateSitemap = async () => {
  try {
    const [products, categories] = await Promise.all([
      Product.find({ isActive: true }).select('slug updatedAt').lean(),
      Category.find({ isActive: true }).select('slug updatedAt').lean(),
    ]);

    const baseUrl = config.site.url;
    const urls = [
      { url: baseUrl, changefreq: 'daily', priority: 1.0, lastmod: new Date() },
      { url: `${baseUrl}/catalog`, changefreq: 'daily', priority: 0.9, lastmod: new Date() },
      { url: `${baseUrl}/categories`, changefreq: 'weekly', priority: 0.7, lastmod: new Date() },
      { url: `${baseUrl}/contact`, changefreq: 'monthly', priority: 0.6, lastmod: new Date() },
      { url: `${baseUrl}/faq`, changefreq: 'monthly', priority: 0.5, lastmod: new Date() },
    ];

    products.forEach(p => {
      urls.push({ url: `${baseUrl}/product/${p.slug}`, changefreq: 'weekly', priority: 0.8, lastmod: p.updatedAt });
    });

    categories.forEach(c => {
      urls.push({ url: `${baseUrl}/category/${c.slug}`, changefreq: 'weekly', priority: 0.7, lastmod: c.updatedAt });
    });

    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n';
    xml += '        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n';

    urls.forEach(({ url, changefreq, priority, lastmod }) => {
      xml += '  <url>\n';
      xml += `    <loc>${escapeXml(url)}</loc>\n`;
      if (lastmod) {
        xml += `    <lastmod>${lastmod.toISOString().split('T')[0]}</lastmod>\n`;
      }
      xml += `    <changefreq>${changefreq}</changefreq>\n`;
      xml += `    <priority>${priority}</priority>\n`;
      xml += '  </url>\n';
    });

    xml += '</urlset>';

    return xml;
  } catch (error) {
    console.error('Sitemap generation error:', error);
    throw error;
  }
};

const escapeXml = (str) => {
  return str
    .replace(/&/g, '&')
    .replace(/</g, '<')
    .replace(/>/g, '>')
    .replace(/"/g, '"')
    .replace(/'/g, '&apos;');
};

module.exports = { generateSitemap };