const crypto = require('crypto');

// Lightweight CSRF protection built on the session store (no external deps).
// A per-session random token is generated on first access and embedded in every
// form via the `_csrf` hidden field. State-changing (POST) requests must echo the
// token back, which an attacker's cross-site form cannot read.
function getToken(req) {
  if (!req.session) return '';
  if (!req.session.csrfToken) {
    req.session.csrfToken = crypto.randomBytes(24).toString('hex');
  }
  return req.session.csrfToken;
}

function csrfProtect(req, res, next) {
  if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) return next();

  const valid = req.session && req.session.csrfToken
    && req.body
    && typeof req.body._csrf === 'string'
    && req.body._csrf === req.session.csrfToken;

  if (!valid) {
    return res.status(403).json({
      success: false,
      message: 'Invalid or missing CSRF token. Please reload the page and try again.',
    });
  }
  return next();
}

function csrfTokenLocals(req, res, next) {
  res.locals.csrfToken = getToken(req);
  next();
}

module.exports = {
  getToken,
  csrfProtect,
  csrfTokenLocals,
};