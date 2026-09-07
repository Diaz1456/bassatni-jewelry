const { Settings } = require('../models');
const { toPublicUrl, filePathFromPublicUrl, safeUnlink } = require('../middleware/upload');
const { invalidateSettingsCache } = require('../utils/settingsCache');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const URL_RE = /^https?:\/\/.+/;

// Server-side validation mirrors the requirements enforced client-side in admin.js.
// It runs in addition to the client checks because client validation can be bypassed.
function validateSettings(body) {
  const errors = {};
  if (!body.shopName || !body.shopName.trim()) {
    errors.shopName = 'Shop name is required.';
  }
  const email = (body.email || '').trim();
  if (email && !EMAIL_RE.test(email)) {
    errors.email = 'Please enter a valid email address.';
  }
  ['instagram', 'facebook', 'pinterest', 'twitter', 'youtube'].forEach((key) => {
    const value = (body[key] || '').trim();
    if (value && !URL_RE.test(value)) {
      errors[key] = 'URL must start with http:// or https://';
    }
  });
  return errors;
}

// Build a view-model for the settings form that reflects the submitted (possibly
// invalid) values so the user's input is preserved on a validation error.
function formDataFromBody(body, current) {
  return {
    shopName: body.shopName || current.shopName,
    tagline: body.tagline || current.tagline,
    announcementBar: {
      enabled: body.announcementEnabled === 'on',
      text: body.announcementText || current.announcementBar.text,
    },
    contact: {
      phone: body.phone || current.contact.phone,
      email: body.email || current.contact.email,
      address: body.address || current.contact.address,
      hours: body.hours || current.contact.hours,
      instagram: body.instagram || current.contact.instagram,
      facebook: body.facebook || current.contact.facebook,
      pinterest: body.pinterest || current.contact.pinterest,
      twitter: body.twitter || current.contact.twitter,
      youtube: body.youtube || current.contact.youtube,
    },
    hero: {
      image: current.hero.image,
      title: body.heroTitle || current.hero.title,
      subtitle: body.heroSubtitle || current.hero.subtitle,
    },
    logo: current.logo,
    favicon: current.favicon,
    mapsEmbed: body.mapsEmbed || current.mapsEmbed,
    footerText: body.footerText || current.footerText,
    copyright: body.copyright || current.copyright,
    seo: {
      defaultMetaTitle: body.defaultMetaTitle || current.seo.defaultMetaTitle,
      defaultMetaDescription: body.defaultMetaDescription || current.seo.defaultMetaDescription,
      defaultKeywords: body.defaultKeywords || current.seo.defaultKeywords,
    },
  };
}

const getSettings = async (req, res, next) => {
  try {
    const settings = await Settings.getSettings();
    res.render('admin/settings', {
      title: 'Site Settings',
      settings,
      errors: {},
    });
  } catch (error) {
    return next(error);
  }
};

const updateSettings = async (req, res, next) => {
  try {
    const current = await Settings.getSettings();
    const errors = validateSettings(req.body);

    if (Object.keys(errors).length > 0) {
      // Delete any files that were uploaded alongside an invalid form so orphaned
      // images never accumulate on disk.
      const uploaded = [
        ...(req.files && req.files.logo || []),
        ...(req.files && req.files.heroImage || []),
        ...(req.files && req.files.favicon || []),
      ];
      uploaded.forEach(file => safeUnlink(file.path));
      return res.status(400).render('admin/settings', {
        title: 'Site Settings',
        settings: formDataFromBody(req.body, current),
        errors,
      });
    }

    const settings = await Settings.updateSettings({
      shopName: req.body.shopName,
      tagline: req.body.tagline,
      contact: {
        phone: req.body.phone,
        email: req.body.email,
        address: req.body.address,
        hours: req.body.hours,
        instagram: req.body.instagram,
        facebook: req.body.facebook,
        pinterest: req.body.pinterest,
        twitter: req.body.twitter,
        youtube: req.body.youtube,
      },
      hero: {
        title: req.body.heroTitle,
        subtitle: req.body.heroSubtitle,
      },
      announcementBar: {
        enabled: req.body.announcementEnabled === 'on',
        text: req.body.announcementText,
      },
      mapsEmbed: req.body.mapsEmbed,
      footerText: req.body.footerText,
      copyright: req.body.copyright,
      seo: {
        defaultMetaTitle: req.body.defaultMetaTitle,
        defaultMetaDescription: req.body.defaultMetaDescription,
        defaultKeywords: req.body.defaultKeywords,
      },
    });

    if (req.files && req.files.logo && req.files.logo[0]) {
      const oldLogo = settings.logo.url ? filePathFromPublicUrl(settings.logo.url) : null;
      if (oldLogo) safeUnlink(oldLogo);
      settings.logo.url = toPublicUrl(req.files.logo[0].path);
      settings.logo.alt = `${settings.shopName} logo`;
    }

    if (req.files && req.files.heroImage && req.files.heroImage[0]) {
      const oldHero = settings.hero.image ? filePathFromPublicUrl(settings.hero.image) : null;
      if (oldHero) safeUnlink(oldHero);
      settings.hero.image = toPublicUrl(req.files.heroImage[0].path);
    }

    if (req.files && req.files.favicon && req.files.favicon[0]) {
      const oldFavicon = settings.favicon.url ? filePathFromPublicUrl(settings.favicon.url) : null;
      if (oldFavicon) safeUnlink(oldFavicon);
      settings.favicon.url = toPublicUrl(req.files.favicon[0].path);
      settings.favicon.alt = `${settings.shopName} favicon`;
    }

    await settings.save();
    // New settings must reach the public site immediately — invalidate the cache.
    invalidateSettingsCache();

    req.flash('success', 'Site settings saved successfully.');
    return res.redirect('/admin/settings');
  } catch (error) {
    if (req.files) {
      const files = [
        ...(req.files.logo || []),
        ...(req.files.heroImage || []),
        ...(req.files.favicon || []),
      ];
      files.forEach(file => safeUnlink(file.path));
    }
    return next(error);
  }
};

module.exports = {
  getSettings,
  updateSettings,
};