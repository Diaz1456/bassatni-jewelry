const { Product, Category } = require('../models');
const { toPublicUrl, destroyUploaded, removeUploadedFile } = require('../middleware/upload');

const GEMSTONES = ['diamond', 'sapphire', 'ruby', 'emerald', 'pearl', 'opal', 'amethyst', 'topaz', 'aquamarine', 'garnet', 'peridot', 'citrine', 'tourmaline', 'tanzanite', 'moissanite', 'lab-diamond', 'none'];
const METALS = ['gold', 'white-gold', 'rose-gold', 'silver', 'platinum', 'palladium', 'titanium', 'stainless-steel'];
const PURITIES = ['9k', '10k', '14k', '18k', '22k', '24k', '925', '950', '999', 'N/A'];
const OCCASIONS = ['engagement', 'wedding', 'anniversary', 'birthday', 'valentine', 'mothers-day', 'christmas', 'graduation', 'just-because', 'prom', 'formal', 'everyday'];

// Money is stored as integer cents in MongoDB (avoids float rounding bugs),
// but the admin form deals in dollars. These two helpers are the seam between
// the two representations used across create/update and the edit prefill.
const toCents = (dollars) => {
  if (dollars === '' || dollars === null || dollars === undefined) return 0;
  return Math.round(parseFloat(dollars) * 100);
};

const toDollars = (cents) => {
  if (cents === null || cents === undefined || Number.isNaN(Number(cents))) return '';
  return (Number(cents) / 100).toFixed(2);
};

function parseVideoUrl(raw) {
  const url = (raw || '').trim();
  if (!url) return {};
  const youtubeMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{6,})/);
  if (youtubeMatch) {
    return { url: `https://www.youtube.com/embed/${youtubeMatch[1]}`, type: 'youtube' };
  }
  if (/\.(mp4|webm|ogg|mov)(\?|$)/i.test(url)) {
    return { url, type: 'mp4' };
  }
  return { url, type: 'youtube' };
}

// Union the kept existing images with newly uploaded files. A product always
// needs exactly one `type: 'main'` image, so the first uploaded file becomes the
// main photo when no prior main image survives the edit.
function buildImagesFromFiles(files, productName, existingImages = []) {
  const images = existingImages ? existingImages.map(img => ({ ...img })) : [];
  if (!files || files.length === 0) return images;

  files.forEach((file, idx) => {
    const url = toPublicUrl(file.path);
    if (idx === 0 && images.length === 0) {
      images.push({
        url,
        alt: productName,
        type: 'main',
        isMain: true,
        order: 0,
      });
    } else {
      images.push({
        url,
        alt: productName,
        type: 'gallery',
        isMain: false,
        order: images.length,
      });
    }
  });
  return images;
}

async function removeMarkedImages(existingImages, removeIndexes) {
  const list = Array.isArray(removeIndexes)
    ? removeIndexes
    : (removeIndexes ? [removeIndexes] : []);
  const toRemove = new Set(list.map(i => parseInt(i, 10)).filter(i => Number.isInteger(i)));
  const kept = [];
  const removals = [];
  existingImages.forEach((img, idx) => {
    if (toRemove.has(idx)) {
      removals.push(destroyUploaded(img.url));
    } else {
      kept.push(img);
    }
  });
  await Promise.all(removals);
  return kept;
}

function collectFormData(body) {
  const data = {
    name: (body.name || '').trim(),
    shortDescription: (body.shortDescription || '').trim(),
    description: (body.description || '').trim(),
    sku: (body.sku || '').trim(),
    price: toCents(body.priceUsd),
    compareAtPrice: body.compareAtPriceUsd ? toCents(body.compareAtPriceUsd) : undefined,
    category: body.category || '',
    metalType: body.metalType || '',
    metalPurity: body.metalPurity || 'N/A',
    careInstructions: (body.careInstructions || '').trim(),
    stockQuantity: parseInt(body.stockQuantity, 10) || 0,
    inStock: body.inStock === 'on' || body.inStock === 'true',
    isNew: body.isNew === 'on' || body.isNew === 'true',
    isBestSeller: body.isBestSeller === 'on' || body.isBestSeller === 'true',
    isFeatured: body.isFeatured === 'on' || body.isFeatured === 'true',
    isActive: body.isActive !== 'off',
    measurements: {
      length: body.length ? parseFloat(body.length) : undefined,
      width: body.width ? parseFloat(body.width) : undefined,
      height: body.height ? parseFloat(body.height) : undefined,
      diameter: body.diameter ? parseFloat(body.diameter) : undefined,
      weight: body.weight ? parseFloat(body.weight) : undefined,
      ringSize: (body.ringSize || '').trim(),
      chainLength: body.chainLength ? parseFloat(body.chainLength) : undefined,
      braceletLength: body.braceletLength ? parseFloat(body.braceletLength) : undefined,
    },
    video: parseVideoUrl(body.videoUrl),
    occasions: Array.isArray(body.occasions) ? body.occasions : (body.occasions ? [body.occasions] : []),
    seo: {
      metaTitle: (body.metaTitle || '').trim(),
      metaDescription: (body.metaDescription || '').trim(),
    },
  };

  if (body.gemstoneType && body.gemstoneType !== 'none') {
    data.gemstones = [{
      type: body.gemstoneType,
      carat: body.gemstoneCarat ? parseFloat(body.gemstoneCarat) : undefined,
      clarity: body.gemstoneClarity || 'N/A',
      color: body.gemstoneColor || 'N/A',
      cut: body.gemstoneCut || 'N/A',
      count: parseInt(body.gemstoneCount, 10) || 1,
      shape: body.gemstoneShape || undefined,
    }];
  } else {
    data.gemstones = [];
  }

  return data;
}

function validate(data) {
  const errors = {};
  if (!data.name) errors.name = 'Product name is required.';
  if (!data.description) errors.description = 'Description is required.';
  if (!data.sku) errors.sku = 'SKU is required.';
  if (!data.price || data.price < 0) errors.priceUsd = 'A valid price is required.';
  if (!data.category) errors.category = 'Please select a category.';
  if (!data.metalType) errors.metalType = 'Please select a metal type.';
  if (data.video && data.video.url && !/^https?:\/\//.test(data.video.url)) {
    errors.videoUrl = 'Video URL must start with http:// or https://';
  }
  return errors;
}

const getProducts = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const q = (req.query.q || '').trim();
    const category = (req.query.category || '').trim();
    const status = ['active', 'inactive', 'deleted'].includes(req.query.status) ? req.query.status : 'show';
    const sortBy = (req.query.sort || '-createdAt').toString();

    const filter = {};
    if (q) {
      filter.$or = [
        { name: { $regex: q, $options: 'i' } },
        { sku: { $regex: q, $options: 'i' } },
      ];
    }
    if (category) filter.category = category;
    // 'show' = everything not soft-deleted; explicit statuses narrow the view.
    if (status === 'deleted') filter.status = 'deleted';
    else if (status === 'inactive') filter.status = 'inactive';
    else if (status === 'active') filter.status = 'active';
    else filter.status = { $ne: 'deleted' };

    const sortMap = {
      '-createdAt': { createdAt: -1 },
      createdAt: { createdAt: 1 },
      name: { name: 1 },
      '-name': { name: -1 },
      price: { price: 1 },
      '-price': { price: -1 },
      '-soldCount': { soldCount: -1 },
      '-viewCount': { viewCount: -1 },
    };
    const sort = sortMap[sortBy] || sortMap['-createdAt'];

    const [products, total] = await Promise.all([
      Product.find(filter)
        .populate('category', 'name slug')
        .sort(sort)
        .skip((page - 1) * limit)
        .limit(limit)
        .lean({ virtuals: true }),
      Product.countDocuments(filter),
    ]);

    const categories = await Category.find({}).sort({ name: 1 }).select('name slug').lean();

    const buildQuery = (overrides = {}) => {
      const params = new URLSearchParams();
      if (q) params.set('q', q);
      if (category) params.set('category', category);
      if (status !== 'show') params.set('status', status);
      if (sortBy !== '-createdAt') params.set('sort', sortBy);
      Object.entries(overrides).forEach(([k, v]) => {
        if (v) params.set(k, v);
        else params.delete(k);
      });
      const qs = params.toString();
      return qs ? `/admin/products?${qs}` : '/admin/products';
    };

    res.render('admin/products', {
      title: 'Products',
      products,
      q,
      category,
      status,
      sortBy,
      categories,
      buildQuery,
      pagination: {
        page,
        limit,
        total,
        pages: Math.max(1, Math.ceil(total / limit)),
      },
    });
  } catch (error) {
    return next(error);
  }
};

const getNewProduct = async (req, res, next) => {
  try {
    const categories = await Category.find({}).sort({ name: 1 }).lean();
    res.render('admin/product-form', {
      title: 'Add Product',
      product: null,
      form: {},
      errors: {},
      categories,
      gemstones: GEMSTONES,
      metals: METALS,
      purities: PURITIES,
      occasions: OCCASIONS,
    });
  } catch (error) {
    return next(error);
  }
};

const createProduct = async (req, res, next) => {
  try {
    const data = collectFormData(req.body);
    data.status = data.isActive ? 'active' : 'inactive';
    const errors = validate(data);

    if (Object.keys(errors).length > 0) {
      const categories = await Category.find({}).sort({ name: 1 }).lean();
      return res.status(400).render('admin/product-form', {
        title: 'Add Product',
        product: null,
        form: data,
        errors,
        categories,
        gemstones: GEMSTONES,
        metals: METALS,
        purities: PURITIES,
        occasions: OCCASIONS,
      });
    }

    const images = buildImagesFromFiles(req.files || [], data.name);
    // Passing slug: undefined defers to the schema's pre-save hook, which
    // generates a slugified + timestamped URL from the product name.
    const product = await Product.create({
      ...data,
      images,
      slug: undefined,
    });

    req.flash('success', `Product "${product.name}" added successfully.`);
    return res.redirect('/admin/products');
  } catch (error) {
    await Promise.all((req.files || []).map(removeUploadedFile));
    if (error.code === 11000) {
      req.flash('error', 'A product with this name or SKU already exists. Choose a unique SKU or name.');
      return res.redirect('/admin/products/new');
    }
    return next(error);
  }
};

const getEditProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id).populate('category', 'name slug').lean({ virtuals: true });
    if (!product) {
      req.flash('error', 'Product not found.');
      return res.redirect('/admin/products');
    }

    const categories = await Category.find({}).sort({ name: 1 }).lean();

    const form = {
      name: product.name,
      shortDescription: product.shortDescription,
      description: product.description,
      sku: product.sku,
      priceUsd: toDollars(product.price),
      compareAtPriceUsd: product.compareAtPrice ? toDollars(product.compareAtPrice) : '',
      category: product.category ? (product.category._id || product.category).toString() : '',
      metalType: product.metalType,
      metalPurity: product.metalPurity || 'N/A',
      careInstructions: product.careInstructions,
      stockQuantity: product.stockQuantity,
      inStock: !!product.inStock,
      isNew: !!product.isNew,
      isBestSeller: !!product.isBestSeller,
      isFeatured: !!product.isFeatured,
      isActive: !!product.isActive,
      videoUrl: product.video ? product.video.url : '',
      occasions: product.occasions || [],
      measurements: {
        length: product.measurements ? product.measurements.length : '',
        width: product.measurements ? product.measurements.width : '',
        height: product.measurements ? product.measurements.height : '',
        diameter: product.measurements ? product.measurements.diameter : '',
        weight: product.measurements ? product.measurements.weight : '',
        ringSize: product.measurements ? product.measurements.ringSize : '',
        chainLength: product.measurements ? product.measurements.chainLength : '',
        braceletLength: product.measurements ? product.measurements.braceletLength : '',
      },
    };

    const gemstone = (product.gemstones || [])[0];
    form.gemstoneType = gemstone ? gemstone.type : 'none';
    form.gemstoneCarat = gemstone && gemstone.carat ? gemstone.carat : '';
    form.gemstoneClarity = gemstone ? gemstone.clarity : 'N/A';
    form.gemstoneColor = gemstone ? gemstone.color : 'N/A';
    form.gemstoneCut = gemstone ? gemstone.cut : 'N/A';
    form.gemstoneCount = gemstone ? gemstone.count : 1;
    form.gemstoneShape = gemstone ? gemstone.shape : '';
    form.metaTitle = product.seo ? product.seo.metaTitle : '';
    form.metaDescription = product.seo ? product.seo.metaDescription : '';

    res.render('admin/product-form', {
      title: `Edit: ${product.name}`,
      product,
      form,
      errors: {},
      categories,
      gemstones: GEMSTONES,
      metals: METALS,
      purities: PURITIES,
      occasions: OCCASIONS,
    });
  } catch (error) {
    return next(error);
  }
};

const updateProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      req.flash('error', 'Product not found.');
      return res.redirect('/admin/products');
    }

    const data = collectFormData(req.body);
    data.status = data.isActive ? 'active' : 'inactive';
    const errors = validate(data);

    if (Object.keys(errors).length > 0) {
      const categories = await Category.find({}).sort({ name: 1 }).lean();
      return res.status(400).render('admin/product-form', {
        title: `Edit: ${product.name}`,
        product,
        form: { ...collectFormData(req.body), images: product.images },
        errors,
        categories,
        gemstones: GEMSTONES,
        metals: METALS,
        purities: PURITIES,
        occasions: OCCASIONS,
      });
    }

    const existing = product.images || [];
    const keptExisting = await removeMarkedImages(existing, req.body.removeImages);
    const images = buildImagesFromFiles(req.files || [], data.name, keptExisting);

    Object.assign(product, data, { images });
    // Reset the slug on rename so the pre-save hook regenerates it cleanly.
    product.slug = undefined;
    await product.save();

    req.flash('success', `Product "${product.name}" updated successfully.`);
    return res.redirect('/admin/products');
  } catch (error) {
    await Promise.all((req.files || []).map(removeUploadedFile));
    if (error.code === 11000) {
      req.flash('error', 'A product with this name or SKU already exists. Choose a unique SKU or name.');
      return res.redirect(`/admin/products/${req.params.id}/edit`);
    }
    return next(error);
  }
};

const deleteProduct = async (req, res, next) => {
  // Soft delete: mark the row 'deleted' and take it out of stock/visibility.
  // Files stay on disk so the product can be restored without re-uploading.
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      req.flash('error', 'Product not found.');
      return res.redirect('/admin/products');
    }

    product.status = 'deleted';
    product.isActive = false;
    product.inStock = false;
    await product.save();

    req.flash('success', `Product "${product.name}" moved to trash. Restore it anytime from the Trash filter.`);
    return res.redirect('/admin/products');
  } catch (error) {
    return next(error);
  }
};

const restoreProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      req.flash('error', 'Product not found.');
      return res.redirect('/admin/products');
    }

    product.status = 'active';
    product.isActive = true;
    product.inStock = product.stockQuantity > 0;
    await product.save();

    req.flash('success', `Product "${product.name}" restored.`);
    return res.redirect(req.get('Referer') || '/admin/products');
  } catch (error) {
    return next(error);
  }
};

const purgeProduct = async (req, res, next) => {
  // Permanent delete: removes the database row and the uploaded image files.
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      req.flash('error', 'Product not found.');
      return res.redirect('/admin/products');
    }

    await Promise.all((product.images || []).map(img => destroyUploaded(img.url)));

    await product.deleteOne();
    req.flash('success', `Product "${product.name}" permanently deleted.`);
    return res.redirect(req.get('Referer') || '/admin/products');
  } catch (error) {
    return next(error);
  }
};

const bulkProducts = async (req, res, next) => {
  try {
    const { action } = req.body;
    const ids = Array.isArray(req.body.ids)
      ? req.body.ids
      : (req.body.ids ? [req.body.ids] : []);

    if (!ids.length) {
      req.flash('error', 'Select at least one product.');
      return res.redirect(req.get('Referer') || '/admin/products');
    }

    const query = { _id: { $in: ids } };
    if (action === 'activate') {
      await Product.updateMany(query, { isActive: true, status: 'active' });
      req.flash('success', `${ids.length} product(s) activated.`);
    } else if (action === 'hide') {
      await Product.updateMany(query, { isActive: false, status: 'inactive' });
      req.flash('success', `${ids.length} product(s) hidden.`);
    } else if (action === 'trash') {
      await Product.updateMany(query, { isActive: false, inStock: false, status: 'deleted' });
      req.flash('success', `${ids.length} product(s) moved to trash.`);
    } else {
      req.flash('error', 'Unknown bulk action.');
    }
    return res.redirect(req.get('Referer') || '/admin/products');
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getProducts,
  getNewProduct,
  createProduct,
  getEditProduct,
  updateProduct,
  deleteProduct,
  restoreProduct,
  purgeProduct,
  bulkProducts,
  GEMSTONES,
  METALS,
  PURITIES,
  OCCASIONS,
};