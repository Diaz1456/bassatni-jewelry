const mongoose = require('mongoose');
const slugify = require('slugify');

const lookbookSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Lookbook title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters'],
  },
  slug: {
    type: String,
    unique: true,
    lowercase: true,
    index: true,
  },
  description: {
    type: String,
    maxlength: [2000, 'Description cannot exceed 2000 characters'],
  },
  shortDescription: {
    type: String,
    maxlength: [300, 'Short description cannot exceed 300 characters'],
  },
  coverImage: {
    url: { type: String, required: true },
    alt: { type: String, required: true },
  },
  images: [{
    url: { type: String, required: true },
    alt: { type: String, required: true },
    caption: { type: String },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
    },
    order: { type: Number, default: 0 },
  }],
  products: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
  }],
  tags: [{
    type: String,
    trim: true,
    lowercase: true,
  }],
  season: {
    type: String,
    enum: ['spring', 'summer', 'autumn', 'winter', 'holiday', 'bridal', 'annual'],
  },
  year: {
    type: Number,
    min: 2020,
    max: 2030,
  },
  isPublished: {
    type: Boolean,
    default: false,
    index: true,
  },
  isFeatured: {
    type: Boolean,
    default: false,
    index: true,
  },
  publishedAt: {
    type: Date,
  },
  seo: {
    metaTitle: { type: String, maxlength: [60, 'Meta title cannot exceed 60 characters'] },
    metaDescription: { type: String, maxlength: [160, 'Meta description cannot exceed 160 characters'] },
    ogImage: { type: String },
    keywords: [{ type: String, trim: true, lowercase: true }],
  },
  viewCount: { type: Number, default: 0 },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

lookbookSchema.index({ title: 'text', description: 'text', tags: 'text' });
lookbookSchema.index({ season: 1, year: 1 });
lookbookSchema.index({ isPublished: 1, publishedAt: -1 });

lookbookSchema.pre('save', function(next) {
  if (this.isModified('title') || !this.slug) {
    this.slug = slugify(this.title, { lower: true, strict: true }) + '-' + Date.now().toString(36);
  }
  if (this.isModified('isPublished') && this.isPublished && !this.publishedAt) {
    this.publishedAt = new Date();
  }
  next();
});

lookbookSchema.virtual('productCount').get(function() {
  return this.products ? this.products.length : 0;
});

lookbookSchema.statics.getPublished = function(options = {}) {
  const { limit = 10, page = 1, season, year, featured } = options;
  const filter = { isPublished: true };
  if (season) filter.season = season;
  if (year) filter.year = year;
  if (featured !== undefined) filter.isFeatured = featured;

  return this.find(filter)
    .sort({ publishedAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .populate('products', 'name slug price mainImage')
    .lean();
};

module.exports = mongoose.model('Lookbook', lookbookSchema);