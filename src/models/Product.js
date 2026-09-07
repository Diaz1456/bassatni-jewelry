const mongoose = require('mongoose');
const slugify = require('slugify');
const mongooseLeanVirtuals = require('mongoose-lean-virtuals');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
    maxlength: [100, 'Product name cannot exceed 100 characters'],
  },
  slug: {
    type: String,
    unique: true,
    lowercase: true,
    index: true,
  },
  description: {
    type: String,
    required: [true, 'Product description is required'],
    maxlength: [5000, 'Description cannot exceed 5000 characters'],
  },
  shortDescription: {
    type: String,
    maxlength: [300, 'Short description cannot exceed 300 characters'],
  },
  sku: {
    type: String,
    required: [true, 'SKU is required'],
    unique: true,
    uppercase: true,
    trim: true,
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative'],
  },
  compareAtPrice: {
    type: Number,
    min: [0, 'Compare at price cannot be negative'],
    validate: {
      validator: function(value) {
        return !value || value > this.price;
      },
      message: 'Compare at price must be greater than price',
    },
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: [true, 'Category is required'],
    index: true,
  },
  subcategory: {
    type: String,
    trim: true,
  },
  metalType: {
    type: String,
    required: [true, 'Metal type is required'],
    enum: {
      values: ['gold', 'white-gold', 'rose-gold', 'silver', 'platinum', 'palladium', 'titanium', 'stainless-steel'],
      message: 'Invalid metal type',
    },
  },
  metalPurity: {
    type: String,
    enum: ['9k', '10k', '14k', '18k', '22k', '24k', '925', '950', '999', 'N/A'],
    default: 'N/A',
  },
  gemstones: [{
    type: {
      type: String,
      required: true,
      enum: ['diamond', 'sapphire', 'ruby', 'emerald', 'pearl', 'opal', 'amethyst', 'topaz', 'aquamarine', 'garnet', 'peridot', 'citrine', 'tourmaline', 'tanzanite', 'moissanite', 'lab-diamond', 'none'],
    },
    carat: {
      type: Number,
      min: 0,
    },
    clarity: {
      type: String,
      enum: ['FL', 'IF', 'VVS1', 'VVS2', 'VS1', 'VS2', 'SI1', 'SI2', 'I1', 'I2', 'I3', 'N/A'],
      default: 'N/A',
    },
    color: {
      type: String,
      enum: ['D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'N/A', 'fancy'],
      default: 'N/A',
    },
    cut: {
      type: String,
      enum: ['Excellent', 'Very Good', 'Good', 'Fair', 'Poor', 'N/A'],
      default: 'N/A',
    },
    count: {
      type: Number,
      default: 1,
      min: 1,
    },
    shape: {
      type: String,
      enum: ['round', 'princess', 'oval', 'cushion', 'emerald', 'radiant', 'pear', 'marquise', 'heart', 'asscher', 'baguette', 'other'],
    },
  }],
  measurements: {
    length: { type: Number, min: 0 },
    width: { type: Number, min: 0 },
    height: { type: Number, min: 0 },
    diameter: { type: Number, min: 0 },
    weight: { type: Number, min: 0 },
    ringSize: { type: String },
    chainLength: { type: Number, min: 0 },
    braceletLength: { type: Number, min: 0 },
  },
  images: [{
    url: { type: String, required: true },
    alt: { type: String, required: true },
    type: {
      type: String,
      enum: ['main', 'gallery', 'lifestyle', 'macro', '360', 'video-thumbnail'],
      default: 'gallery',
    },
    isMain: { type: Boolean, default: false },
    order: { type: Number, default: 0 },
  }],
  video: {
    url: { type: String },
    type: { type: String, enum: ['mp4', 'youtube', 'vimeo'] },
    title: { type: String },
    poster: { type: String },
  },
  careInstructions: {
    type: String,
    maxlength: [2000, 'Care instructions cannot exceed 2000 characters'],
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true,
  }],
  occasions: [{
    type: String,
    enum: ['engagement', 'wedding', 'anniversary', 'birthday', 'valentine', 'mothers-day', 'christmas', 'graduation', 'just-because', 'prom', 'formal', 'everyday'],
  }],
  isNew: { type: Boolean, default: false, index: true },
  isBestSeller: { type: Boolean, default: false, index: true },
  isFeatured: { type: Boolean, default: false, index: true },
  isActive: { type: Boolean, default: true, index: true },
  // Lifecycle status: 'active' → 'inactive' (hidden) → 'deleted' (soft delete).
  // Soft-deleted rows are kept for auditing/restore but excluded everywhere.
  status: {
    type: String,
    enum: ['active', 'inactive', 'deleted'],
    default: 'active',
    index: true,
  },
  inStock: { type: Boolean, default: true, index: true },
  stockQuantity: { type: Number, default: 0, min: 0 },
  rating: {
    average: { type: Number, default: 0, min: 0, max: 5 },
    count: { type: Number, default: 0, min: 0 },
  },
  seo: {
    metaTitle: { type: String, maxlength: [60, 'Meta title cannot exceed 60 characters'] },
    metaDescription: { type: String, maxlength: [160, 'Meta description cannot exceed 160 characters'] },
    ogImage: { type: String },
    keywords: [{ type: String, trim: true, lowercase: true }],
  },
  viewCount: { type: Number, default: 0 },
  soldCount: { type: Number, default: 0 },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

productSchema.index({ name: 'text', description: 'text', tags: 'text', sku: 'text' });
productSchema.index({ category: 1, isActive: 1, isNew: 1 });
productSchema.index({ category: 1, isActive: 1, isBestSeller: 1 });
productSchema.index({ price: 1 });
productSchema.index({ metalType: 1 });
productSchema.index({ 'gemstones.type': 1 });
productSchema.index({ occasions: 1 });
productSchema.index({ createdAt: -1 });

// mongoose 8 removes virtuals from `.lean()` results; this plugin restores them
// so lean queries used across the catalog still expose mainImage/galleryImages etc.
productSchema.plugin(mongooseLeanVirtuals);

// Derived image/view helpers — computed on read so no denormalized state exists
// to drift out of sync in the database.
productSchema.virtual('discountPercent').get(function() {
  if (this.compareAtPrice && this.compareAtPrice > this.price) {
    return Math.round(((this.compareAtPrice - this.price) / this.compareAtPrice) * 100);
  }
  return 0;
});

productSchema.virtual('mainImage').get(function() {
  const images = this.images || [];
  const main = images.find(img => img.isMain);
  return main || images[0] || { url: '/images/placeholder.svg', alt: this.name };
});

productSchema.virtual('galleryImages').get(function() {
  const images = this.images || [];
  return images.filter(img => img.type === 'gallery' || img.type === 'lifestyle' || img.type === 'macro');
});

productSchema.virtual('macroImages').get(function() {
  const images = this.images || [];
  return images.filter(img => img.type === 'macro');
});

productSchema.virtual('lifestyleImages').get(function() {
  const images = this.images || [];
  return images.filter(img => img.type === 'lifestyle');
});

productSchema.virtual('images360').get(function() {
  const images = this.images || [];
  return images.filter(img => img.type === '360').sort((a, b) => a.order - b.order);
});

productSchema.pre('save', function(next) {
  // Public slugs are `name-slug + base36 timestamp` so they are unique without
  // extra queries, read well for SEO, and change on rename (prevents stale URLs).
  if (this.isModified('name') || !this.slug) {
    this.slug = slugify(this.name, { lower: true, strict: true }) + '-' + Date.now().toString(36);
  }
  if (this.isModified('images')) {
    // Maintain the invariant "exactly one main image": if several are flagged
    // main, promote the first; if none are, promote the first overall.
    const mainImages = this.images.filter(img => img.isMain);
    if (mainImages.length > 1) {
      this.images.forEach((img, i) => {
        img.isMain = i === 0;
      });
    } else if (mainImages.length === 0 && this.images.length > 0) {
      this.images[0].isMain = true;
    }
  }
  next();
});

const escapeRegex = (str) => {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

const buildFuzzyQuery = (query) => {
  const fuzzy = escapeRegex(query).split('').join('.*');
  return {
    $or: [
      { name: { $regex: fuzzy, $options: 'i' } },
      { description: { $regex: fuzzy, $options: 'i' } },
      { tags: { $regex: fuzzy, $options: 'i' } },
      { sku: { $regex: escapeRegex(query), $options: 'i' } },
    ],
  };
};

productSchema.statics.buildFilter = function(query, options = {}) {
  const filter = { isActive: true };
  if (query) filter.$text = { $search: query };
  if (options.category) filter.category = options.category;
  if (options.metalType) filter.metalType = options.metalType;
  if (options.gemstone) filter['gemstones.type'] = options.gemstone;
  if (options.occasion) filter.occasions = options.occasion;
  if (options.isNew !== undefined) filter.isNew = options.isNew;
  if (options.isBestSeller !== undefined) filter.isBestSeller = options.isBestSeller;
  if (options.inStock !== undefined) filter.inStock = options.inStock;
  if (options.minPrice !== undefined || options.maxPrice !== undefined) {
    filter.price = {};
    if (options.minPrice !== undefined) filter.price.$gte = options.minPrice;
    if (options.maxPrice !== undefined) filter.price.$lte = options.maxPrice;
  }
  return filter;
};

productSchema.statics.searchAndCount = async function(query, options = {}) {
  const {
    sort = '-createdAt',
    page = 1,
    limit = 12,
  } = options;

  const buildPagedQuery = (filter) => this.find(filter)
    .sort(sort)
    .skip((page - 1) * limit)
    .limit(limit)
    .populate('category', 'name slug');

  let filter = this.buildFilter(query, options);
  let [products, count] = await Promise.all([
    buildPagedQuery(filter),
    this.countDocuments(filter),
  ]);

  // Typo-tolerant fallback: MongoDB text search is strict, so retry with a
  // relaxed regex when a text query returns no results (e.g. "dimond" → "diamond").
  if (query && products.length === 0) {
    const fuzzyFilter = this.buildFilter(undefined, options);
    fuzzyFilter.$and = [buildFuzzyQuery(query)];
    [products, count] = await Promise.all([
      buildPagedQuery(fuzzyFilter),
      this.countDocuments(fuzzyFilter),
    ]);
  }

  return { products, count };
};

productSchema.statics.suggest = async function(query, limit = 8) {
  let products = await this.find(
    { $text: { $search: query }, isActive: true },
    { score: { $meta: 'textScore' }, name: 1, slug: 1, price: 1, images: 1 }
  )
    .sort({ score: { $meta: 'textScore' } })
    .limit(limit)
    .lean({ virtuals: true });

  if (products.length === 0) {
    products = await this.find({
      isActive: true,
      ...buildFuzzyQuery(query),
    })
      .sort({ createdAt: -1, isBestSeller: -1 })
      .limit(limit)
      .lean({ virtuals: true });
  }

  return products;
};

productSchema.statics.getFilterOptions = async function(categoryId = null) {
  const match = { isActive: true };
  if (categoryId) match.category = categoryId;

  const [metalTypes, gemstones, occasions, priceRange] = await Promise.all([
    this.distinct('metalType', match),
    this.distinct('gemstones.type', match),
    this.distinct('occasions', match),
    this.aggregate([
      { $match: match },
      { $group: { _id: null, min: { $min: '$price' }, max: { $max: '$price' } } },
    ]),
  ]);

  return {
    metalTypes: metalTypes.filter(Boolean),
    gemstones: gemstones.filter(g => g !== 'none'),
    occasions: occasions.filter(Boolean),
    priceRange: priceRange[0] || { min: 0, max: 10000 },
  };
};

module.exports = mongoose.model('Product', productSchema);