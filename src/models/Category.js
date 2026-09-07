const mongoose = require('mongoose');
const slugify = require('slugify');

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Category name is required'],
    unique: true,
    trim: true,
    maxlength: [50, 'Category name cannot exceed 50 characters'],
  },
  slug: {
    type: String,
    unique: true,
    lowercase: true,
    index: true,
  },
  description: {
    type: String,
    maxlength: [1000, 'Description cannot exceed 1000 characters'],
  },
  shortDescription: {
    type: String,
    maxlength: [200, 'Short description cannot exceed 200 characters'],
  },
  image: {
    url: { type: String },
    alt: { type: String },
  },
  icon: {
    type: String,
    trim: true,
  },
  parent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    default: null,
  },
  order: {
    type: Number,
    default: 0,
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true,
  },
  isFeatured: {
    type: Boolean,
    default: false,
  },
  seo: {
    metaTitle: { type: String, maxlength: [60, 'Meta title cannot exceed 60 characters'] },
    metaDescription: { type: String, maxlength: [160, 'Meta description cannot exceed 160 characters'] },
    ogImage: { type: String },
    keywords: [{ type: String, trim: true, lowercase: true }],
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

categorySchema.virtual('subcategories', {
  ref: 'Category',
  localField: '_id',
  foreignField: 'parent',
});

categorySchema.virtual('products', {
  ref: 'Product',
  localField: '_id',
  foreignField: 'category',
});

categorySchema.pre('save', function(next) {
  if (this.isModified('name') || !this.slug) {
    this.slug = slugify(this.name, { lower: true, strict: true });
  }
  next();
});

categorySchema.pre('deleteOne', { document: true, query: false }, async function(next) {
  await this.model('Product').updateMany(
    { category: this._id },
    { $set: { category: null } }
  );
  await this.model('Category').updateMany(
    { parent: this._id },
    { $set: { parent: null } }
  );
  next();
});

categorySchema.statics.getTree = async function() {
  const categories = await this.find({ isActive: true }).sort({ order: 1, name: 1 }).lean();
  const categoryMap = {};
  const roots = [];

  categories.forEach(cat => {
    categoryMap[cat._id] = { ...cat, children: [] };
  });

  categories.forEach(cat => {
    if (cat.parent && categoryMap[cat.parent]) {
      categoryMap[cat.parent].children.push(categoryMap[cat._id]);
    } else {
      roots.push(categoryMap[cat._id]);
    }
  });

  return roots;
};

categorySchema.statics.getNavCategories = async function() {
  return this.find({ isActive: true, parent: null })
    .sort({ order: 1, name: 1 })
    .populate({
      path: 'subcategories',
      match: { isActive: true },
      select: 'name slug',
      options: { sort: { order: 1, name: 1 } },
    })
    .lean();
};

module.exports = mongoose.model('Category', categorySchema);