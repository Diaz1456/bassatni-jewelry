const { Admin, Product, Category, Settings } = require('../models');

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
      settingsDoc,
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
      Settings.getSettings(),
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
        visitors: settingsDoc?.visitorCount || 0,
        dailyVisitors: settingsDoc?.dailyVisitors || 0,
      },
      recentProducts,
    });
  } catch (error) {
    return next(error);
  }
};

const MIN_PASSWORD_LENGTH = 8;

const getChangePassword = (req, res) => {
  res.render('admin/change-password', {
    title: 'Change Password',
    errors: {},
    form: {},
  });
};

const postChangePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;
    const errors = {};
    const form = {};

    const admin = await Admin.findById(req.session.adminId).select('+passwordHash');
    if (!admin) {
      req.session.destroy(() => {});
      res.clearCookie('sid', { path: '/' });
      req.flash('error', 'Your session has expired. Please sign in again.');
      return res.redirect('/admin/login');
    }

    const currentIsValid = await admin.comparePassword(currentPassword || '');
    if (!currentIsValid) {
      errors.currentPassword = 'Current password is incorrect.';
    }
    if (!newPassword || newPassword.length < MIN_PASSWORD_LENGTH) {
      errors.newPassword = `New password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
    } else {
      const sameAsCurrent = admin.passwordHash && await admin.comparePassword(newPassword);
      if (sameAsCurrent) {
        errors.newPassword = 'New password must be different from your current password.';
      }
    }
    if (newPassword !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match.';
    }

    if (Object.keys(errors).length > 0) {
      return res.status(400).render('admin/change-password', {
        title: 'Change Password',
        errors,
        form,
      });
    }

    admin.passwordHash = await Admin.hashPassword(newPassword);
    await admin.save();

    req.flash('success', 'Password changed successfully.');
    return res.redirect('/admin');
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getLogin,
  postLogin,
  postLogout,
  getDashboard,
  getChangePassword,
  postChangePassword,
};