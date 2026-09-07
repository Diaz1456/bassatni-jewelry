const { Admin } = require('../models');

// Guards for the /admin area. The session id is the only stored credential on
// the client; each request re-validates it against the database so deleted or
// disabled admins lose access immediately.
const requireAdmin = async (req, res, next) => {
  if (!req.session || !req.session.adminId) {
    req.flash('error', 'Please log in to access the admin panel.');
    return res.redirect('/admin/login');
  }

  try {
    const admin = await Admin.findById(req.session.adminId);
    if (!admin) {
      req.session.destroy(() => {
        req.flash('error', 'Your session is no longer valid. Please log in again.');
        res.redirect('/admin/login');
      });
      return;
    }

    res.locals.currentAdmin = admin;
    req.currentAdmin = admin;
    next();
  } catch (error) {
    return next(error);
  }
};

// JSON variant for API-style admin endpoints (returns 401 instead of redirect)
// so fetch() callers aren't handed an HTML login page.
const requireAdminJSON = async (req, res, next) => {
  if (!req.session || !req.session.adminId) {
    return res.status(401).json({ success: false, message: 'Unauthorized. Please log in.' });
  }

  try {
    const admin = await Admin.findById(req.session.adminId);
    if (!admin) {
      return res.status(401).json({ success: false, message: 'Unauthorized. Please log in.' });
    }

    req.currentAdmin = admin;
    next();
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Unable to verify session.' });
  }
};

module.exports = { requireAdmin, requireAdminJSON };