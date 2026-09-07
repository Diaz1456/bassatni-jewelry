const fs = require('fs');
const path = require('path');
const { UPLOADS_ROOT, isUploadedImage, toPublicUrl, safeUnlink } = require('../middleware/upload');

const IMAGE_TYPES = new Map([
  ['.jpg', 'JPEG'],
  ['.jpeg', 'JPEG'],
  ['.png', 'PNG'],
  ['.webp', 'WebP'],
  ['.gif', 'GIF'],
  ['.svg', 'SVG'],
  ['.avif', 'AVIF'],
]);

// Recursively collect image files under the uploads root (products/,
// settings/, categories/) into a flat list with metadata for the admin grid.
function walk(uploadDir, base = '') {
  let results = [];
  for (const entry of fs.readdirSync(uploadDir, { withFileTypes: true })) {
    const full = path.join(uploadDir, entry.name);
    const rel = base ? `${base}/${entry.name}` : entry.name;
    if (entry.isDirectory()) {
      results = results.concat(walk(full, rel));
    } else if (isUploadedImage(full)) {
      try {
        const stat = fs.statSync(full);
        results.push({
          name: entry.name,
          folder: base || '(root)',
          url: toPublicUrl(full),
          path: full,
          size: stat.size,
          type: IMAGE_TYPES.get(path.extname(entry.name).toLowerCase()) || 'Image',
          modified: stat.mtime,
        });
      } catch (e) {
        /* race: file removed between readdir and stat — skip */
      }
    }
  }
  return results;
}

const getMedia = async (req, res, next) => {
  try {
    let images;
    try {
      images = walk(UPLOADS_ROOT);
    } catch (error) {
      console.error('Media library scan error:', error.message);
      images = [];
    }
    // Newest first.
    images.sort((a, b) => b.modified - a.modified);

    const folder = (req.query.folder || '').trim();
    const filtered = folder ? images.filter(i => i.folder === folder) : images;

    res.render('admin/media', {
      title: 'Image Library',
      images: filtered,
      folder,
      folders: [...new Set(images.map(i => i.folder))],
    });
  } catch (error) {
    return next(error);
  }
};

const deleteMedia = async (req, res, next) => {
  try {
    const url = (req.body.url || '').replace(/\/$/, '');
    const prefix = '/uploads/';
    if (!url.startsWith(prefix)) {
      req.flash('error', 'Invalid image URL.');
      return res.redirect('/admin/media');
    }
    const file = path.join(UPLOADS_ROOT, ...url.slice(prefix.length).split('/'));
    // Safety: never traverse outside the uploads root.
    if (!file.startsWith(UPLOADS_ROOT)) {
      req.flash('error', 'Invalid image path.');
      return res.redirect('/admin/media');
    }
    safeUnlink(file);
    req.flash('success', 'Image deleted from disk.');
    return res.redirect(req.get('Referer') || '/admin/media');
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getMedia,
  deleteMedia,
};