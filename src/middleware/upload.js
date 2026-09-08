const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const { cloudinary, isCloudinaryConfigured, CLOUDINARY_FOLDER } = require('../config/cloudinary');
const config = require('../config');

const UPLOADS_ROOT = path.join(__dirname, '..', '..', 'uploads');

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

ensureDir(UPLOADS_ROOT);
ensureDir(path.join(UPLOADS_ROOT, 'products'));
ensureDir(path.join(UPLOADS_ROOT, 'settings'));
ensureDir(path.join(UPLOADS_ROOT, 'categories'));

function makeStorage(folder) {
  // Cloudinary: store every upload under a per-type folder on the CDN. The
  // multer `file.path` then holds the https URL persisted to MongoDB.
  if (isCloudinaryConfigured) {
    return new CloudinaryStorage({
      cloudinary,
      params: {
        folder: `${CLOUDINARY_FOLDER}/${folder}`.replace(/\/$/, ''),
        resource_type: 'image',
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg', 'avif'],
        transformation: [
          { width: config.images.maxWidth, crop: 'limit', quality: 80 },
        ],
      },
    });
  }
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

// The settings form can upload up to three files named `logo`, `heroImage`
// and `favicon` in a single request. `files` must be >= 3 or Multer aborts the
// whole form with LIMIT_FILE_COUNT ("Too many files") before saving anything.
const settingsUpload = multer({
  storage: makeStorage('settings'),
  fileFilter: imageFileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024,
    files: 10,
    fields: 20,
    parts: 30,
  },
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
  // Absolute URLs (Cloudinary CDN) and already-public paths pass through
  // unchanged. Local disk paths are relativized against the uploads root so the
  // browser fetches them via the /uploads static route rather than the private
  // filesystem.
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

function isCloudinaryUrl(url) {
  return typeof url === 'string' && /^https?:\/\/(res\.)?cloudinary\.com\//.test(url);
}

// Extract the public_id from a Cloudinary URL so the asset can be destroyed.
// Example: https://res.cloudinary.com/<cloud>/image/upload/v1/<folder>/<id>.jpg
//   -> public_id "<folder>/<id>"
function publicIdFromUrl(url) {
  if (!isCloudinaryUrl(url)) return null;
  const match = url.match(/\/image\/upload\/v\d+\/(.+)\.[a-z0-9]{1,8}$/i);
  return match ? match[1] : null;
}

// Delete an image by its stored public URL: destroys the Cloudinary asset when
// the URL points at the CDN, otherwise removes the local disk file. Safe no-op
// for seed placeholders (`/images/...`) that are not managed uploads.
async function destroyUploaded(url) {
  if (!url) return;
  const publicId = publicIdFromUrl(url);
  if (publicId) {
    try {
      await cloudinary.uploader.destroy(publicId, { resource_type: 'image', invalidate: true });
    } catch (error) {
      console.warn('Failed to delete Cloudinary image:', publicId, error.message);
    }
    return;
  }
  safeUnlink(filePathFromPublicUrl(url));
}

// Delete a freshly-uploaded multer file (used to clean up after a failed
// save/revalidation). Handles both Cloudinary uploads (file.filename is the
// public_id) and disk storage (file.path is the local path).
async function removeUploadedFile(file) {
  if (!file) return;
  if (file.filename && file.path && isCloudinaryUrl(file.path)) {
    try {
      await cloudinary.uploader.destroy(file.filename, { resource_type: 'image', invalidate: true });
      return;
    } catch (error) {
      console.warn('Failed to delete Cloudinary upload:', file.path, error.message);
      return;
    }
  }
  safeUnlink(file.path);
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
  isCloudinaryUrl,
  publicIdFromUrl,
  destroyUploaded,
  removeUploadedFile,
};