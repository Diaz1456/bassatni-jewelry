const { Admin, Product, Category } = require('../models');

const getLogin = (req, res) => {
  if (req.session && req.session.adminId) {
    return res.redirect('/admin');
  }
  res.render('admin/login', {
    title: 'Admin Login',
    bodyClass: 'admin-login-body',
    layout: false,
  });
};

const postLogin = async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    req.flash('error', 'Please provide both email and password.');
    return res.redirect('/admin/login');
  }

  try {
    const admin = await Admin.findOne({ email: email.trim().toLowerCase() }).select('+passwordHash');

    if (!admin) {
      req.flash('error', 'Invalid email or password.');
      return res.redirect('/admin/login');
    }

    const isMatch = await admin.comparePassword(password);
    if (!isMatch) {
      req.flash('error', 'Invalid email or password.');
      return res.redirect('/admin/login');
    }

    req.session.adminId = admin._id.toString();
    await Admin.findByIdAndUpdate(admin._id, { lastLoginAt: new Date() });
    req.flash('success', `Welcome back, ${admin.name}!`);
    return res.redirect('/admin');
  } catch (error) {
    return next(error);
  }
};

const postLogout = (req, res) => {
  req.session.destroy((err) => {
    if (err) console.error('Logout error:', err.message);
    res.clearCookie('sid', { path: '/' });
    res.redirect('/admin/login');
  });
};

const getDashboard = async (req, res, next) => {
  try {
    const [
      totalProducts,
      totalCategories,
      recentProducts,
      bestSellersCount,
      newArrivalsCount,
      activeProducts,
      inactiveProducts,
      deletedProducts,
      lowStock,
      outOfStock,
    ] = await Promise.all([
      Product.countDocuments({ status: { $ne: 'deleted' } }),
      Category.countDocuments({}),
      Product.find({ status: { $ne: 'deleted' } }).sort({ createdAt: -1 }).limit(5).lean({ virtuals: true }),
      Product.countDocuments({ isBestSeller: true, status: { $ne: 'deleted' } }),
      Product.countDocuments({ isNew: true, status: { $ne: 'deleted' } }),
      Product.countDocuments({ status: 'active' }),
      Product.countDocuments({ status: 'inactive' }),
      Product.countDocuments({ status: 'deleted' }),
      // Low stock = active products with 0 < stock <= 5 (about to run out)
      Product.countDocuments({ status: 'active', stockQuantity: { $gt: 0, $lte: 5 } }),
      Product.countDocuments({ status: 'active', inStock: false }),
    ]);

    res.render('admin/dashboard', {
      title: 'Admin Dashboard',
      stats: {
        products: totalProducts,
        categories: totalCategories,
        bestSellers: bestSellersCount,
        newArrivals: newArrivalsCount,
        active: activeProducts,
        inactive: inactiveProducts,
        deleted: deletedProducts,
        lowStock,
        outOfStock,
      },
      recentProducts,
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getLogin,
  postLogin,
  postLogout,
  getDashboard,
};