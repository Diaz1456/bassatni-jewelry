const path = require('path');
const fs = require('fs');
const multer = require('multer');

const UPLOADS_ROOT = path.join(__dirname, '..', '..', 'uploads');

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

ensureDir(UPLOADS_ROOT);
ensureDir(path.join(UPLOADS_ROOT, 'products'));
ensureDir(path.join(UPLOADS_ROOT, 'settings'));
ensureDir(path.join(UPLOADS_ROOT, 'categories'));

function makeStorage(folder) {
  return multer.diskStorage({
    destination(req, file, cb) {
      const dir = path.join(UPLOADS_ROOT, folder);
      ensureDir(dir);
      cb(null, dir);
    },
    filename(req, file, cb) {
      // Sanitize the original filename to a safe slug, then prefix with
      // timestamp+random so filenames are unique and can never collide or
      // contain path traversal characters, regardless of the client's input.
      const safeOriginal = file.originalname
        .toLowerCase()
        .replace(/[^a-z0-9.\-]+/g, '-')
        .replace(/\.(jpg|jpeg|png|webp|gif|avif|svg)$/i, '');
      const ext = (path.extname(file.originalname) || '.jpg').toLowerCase();
      cb(null, `${Date.now()}-${Math.round(Math.random() * 1e6)}-${safeOriginal || 'image'}${ext}`);
    },
  });
}

const allowedImageTypes = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/svg+xml',
  'image/avif',
]);

function imageFileFilter(req, file, cb) {
  if (allowedImageTypes.has(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only image files (JPEG, PNG, WebP, GIF, SVG, AVIF) are allowed.'));
  }
}

const productUpload = multer({
  storage: makeStorage('products'),
  fileFilter: imageFileFilter,
  limits: { fileSize: 6 * 1024 * 1024, files: 8 },
});

const settingsUpload = multer({
  storage: makeStorage('settings'),
  fileFilter: imageFileFilter,
  limits: { fileSize: 6 * 1024 * 1024, files: 2 },
});

const categoryUpload = multer({
  storage: makeStorage('categories'),
  fileFilter: imageFileFilter,
  limits: { fileSize: 6 * 1024 * 1024, files: 1 },
});

const IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg', '.avif']);

function isUploadedImage(filepath) {
  return filepath && IMAGE_EXTENSIONS.has(path.extname(filepath).toLowerCase());
}

function toPublicUrl(filepath) {
  if (!filepath) return '';
  // Absolute URLs and already-public paths pass through unchanged. Local disk
  // paths are relativized against the uploads root so the browser fetches them
  // via the /uploads static route rather than the private filesystem.
  if (/^https?:\/\//.test(filepath) || filepath.startsWith('/uploads/') || filepath.startsWith('/images/')) {
    return filepath;
  }
  const relative = path.relative(UPLOADS_ROOT, filepath).split(path.sep).join('/');
  return `/uploads/${relative}`;
}

// Inverse of toPublicUrl: safely map a stored public URL back to its disk path.
// Returns null for anything outside /uploads so callers can never delete files
// that aren't managed uploads (e.g. seed image placeholders).
function filePathFromPublicUrl(publicUrl) {
  const prefix = '/uploads/';
  if (!publicUrl || !publicUrl.startsWith(prefix)) return null;
  const relative = publicUrl.slice(prefix.length).split('/');
  return path.join(UPLOADS_ROOT, ...relative);
}

function safeUnlink(filepath) {
  if (!filepath) return;
  try {
    if (fs.existsSync(filepath)) fs.unlinkSync(filepath);
  } catch (error) {
    console.warn('Failed to remove file:', filepath, error.message);
  }
}

module.exports = {
  UPLOADS_ROOT,
  productUpload,
  settingsUpload,
  categoryUpload,
  toPublicUrl,
  isUploadedImage,
  filePathFromPublicUrl,
  safeUnlink,
};