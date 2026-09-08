const { Category, Product } = require('../models');
const { toPublicUrl, destroyUploaded, removeUploadedFile } = require('../middleware/upload');

function validateCategory(body) {
  const errors = {};
  if (!body.name || !body.name.trim()) {
    errors.name = 'Category name is required.';
  }
  if (!body.slug || !body.slug.trim()) {
    errors.slug = 'Slug is required.';
  } else if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(body.slug.trim())) {
    errors.slug = 'Slug may only contain lowercase letters, numbers, and hyphens.';
  }
  return errors;
}

const getCategories = async (req, res, next) => {
  try {
    const categories = await Category.aggregate([
      { $sort: { order: 1, name: 1 } },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: 'category',
          as: 'productsLex',
        },
      },
      {
        $addFields: { productCount: { $size: { $filter: { input: '$productsLex', as: 'p', cond: { $ne: ['$$p.status', 'deleted'] } } } } },
      },
      { $project: { name: 1, slug: 1, image: 1, shortDescription: 1, order: 1, isActive: 1, productCount: 1 } },
    ]);

    res.render('admin/categories', {
      title: 'Categories',
      categories,
    });
  } catch (error) {
    return next(error);
  }
};

const getNewCategory = async (req, res) => {
  res.render('admin/category-form', {
    title: 'Add Category',
    category: null,
    form: { name: '', slug: '', shortDescription: '', order: '0', isActive: true },
    errors: {},
  });
};

const createCategory = async (req, res, next) => {
  try {
    const form = {
      name: (req.body.name || '').trim(),
      slug: (req.body.slug || '').trim(),
      shortDescription: (req.body.shortDescription || '').trim(),
      order: parseInt(req.body.order, 10) || 0,
      isActive: req.body.isActive !== 'off',
    };
    const errors = validateCategory({ name: form.name, slug: form.slug });

    if (Object.keys(errors).length > 0) {
      if (req.file) await removeUploadedFile(req.file);
      return res.status(400).render('admin/category-form', {
        title: 'Add Category',
        category: null,
        form,
        errors,
      });
    }

    const slugExists = await Category.findOne({ slug: form.slug });
    if (slugExists) {
      if (req.file) await removeUploadedFile(req.file);
      return res.status(400).render('admin/category-form', {
        title: 'Add Category',
        category: null,
        form,
        errors: { slug: 'A category with this slug already exists.' },
      });
    }

    const data = { ...form, image: {} };
    if (req.file) {
      data.image = {
        url: toPublicUrl(req.file.path),
        alt: `${form.name} category image`,
      };
    }

    const category = await Category.create(data);
    req.flash('success', `Category "${category.name}" added successfully.`);
    return res.redirect('/admin/categories');
  } catch (error) {
    if (req.file) await removeUploadedFile(req.file);
    return next(error);
  }
};

const getEditCategory = async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id).lean();
    if (!category) {
      req.flash('error', 'Category not found.');
      return res.redirect('/admin/categories');
    }

    res.render('admin/category-form', {
      title: `Edit: ${category.name}`,
      category,
      form: {
        name: category.name,
        slug: category.slug,
        shortDescription: category.shortDescription,
        order: category.order || 0,
        isActive: !!category.isActive,
      },
      errors: {},
    });
  } catch (error) {
    return next(error);
  }
};

const updateCategory = async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      req.flash('error', 'Category not found.');
      return res.redirect('/admin/categories');
    }

    const form = {
      name: (req.body.name || '').trim(),
      slug: (req.body.slug || '').trim(),
      shortDescription: (req.body.shortDescription || '').trim(),
      order: parseInt(req.body.order, 10) || 0,
      isActive: req.body.isActive !== 'off',
    };
    const errors = validateCategory(form);

    if (Object.keys(errors).length > 0) {
      if (req.file) await removeUploadedFile(req.file);
      return res.status(400).render('admin/category-form', {
        title: `Edit: ${category.name}`,
        category,
        form,
        errors,
      });
    }

    const slugExists = await Category.findOne({ slug: form.slug, _id: { $ne: category._id } });
    if (slugExists) {
      if (req.file) await removeUploadedFile(req.file);
      return res.status(400).render('admin/category-form', {
        title: `Edit: ${category.name}`,
        category,
        form,
        errors: { slug: 'A category with this slug already exists.' },
      });
    }

    Object.assign(category, form);
    if (req.file) {
      await destroyUploaded(category.image && category.image.url);
      category.image.url = toPublicUrl(req.file.path);
      category.image.alt = `${form.name} category image`;
    }

    await category.save();
    req.flash('success', `Category "${category.name}" updated.`);
    return res.redirect('/admin/categories');
  } catch (error) {
    if (req.file) await removeUploadedFile(req.file);
    return next(error);
  }
};

const deleteCategory = async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      req.flash('error', 'Category not found.');
      return res.redirect('/admin/categories');
    }

    const productCount = await Product.countDocuments({ category: category._id, status: { $ne: 'deleted' } });
    if (productCount > 0) {
      req.flash('error', `Cannot delete "${category.name}": ${productCount} product(s) reference it. Reassign or delete those products first.`);
      return res.redirect('/admin/categories');
    }

    await destroyUploaded(category.image && category.image.url);
    await category.deleteOne();
    req.flash('success', `Category "${category.name}" deleted.`);
    return res.redirect('/admin/categories');
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getCategories,
  getNewCategory,
  createCategory,
  getEditCategory,
  updateCategory,
  deleteCategory,
};