const mongoose = require('mongoose');

// Site settings are stored as a single document (key: 'site'). Keeping them in
// MongoDB means the admin can edit brand/contact/hero content without a redeploy;
// getSettings() exposes them to views while settingsCache adds a short TTL so the
// public site doesn't re-query on every request.
const settingsSchema = new mongoose.Schema({
  key: {
    type: String,
    default: 'site',
    unique: true,
  },
  shopName: {
    type: String,
    default: 'Elegance Jewelry',
    trim: true,
  },
  tagline: {
    type: String,
    default: 'Exquisite fine jewelry for life\u2019s precious moments',
    trim: true,
  },
  logo: {
    url: {
      type: String,
      default: '',
    },
    alt: {
      type: String,
      default: '',
    },
  },
  favicon: {
    url: { type: String, default: '' },
    alt: { type: String, default: '' },
  },
  contact: {
    phone: { type: String, default: '' },
    email: { type: String, default: '' },
    address: { type: String, default: '' },
    hours: { type: String, default: '' },
    instagram: { type: String, default: '' },
    facebook: { type: String, default: '' },
    pinterest: { type: String, default: '' },
    twitter: { type: String, default: '' },
    youtube: { type: String, default: '' },
  },
  hero: {
    image: { type: String, default: '' },
    title: {
      type: String,
      default: 'Timeless Elegance, Crafted for You',
    },
    subtitle: {
      type: String,
      default: 'Discover handcrafted fine jewelry designed to celebrate life\u2019s most precious moments.',
    },
  },
  announcementBar: {
    enabled: { type: Boolean, default: true },
    text: {
      type: String,
      default: 'Complimentary shipping on all orders over $500',
    },
  },
  mapsEmbed: { type: String, default: '' },
  footerText: {
    type: String,
    default: 'Fine jewelry crafted to celebrate every precious moment. Each piece is ethically sourced and beautifully made to last a lifetime.',
  },
  copyright: { type: String, default: 'All rights reserved' },
  seo: {
    defaultMetaTitle: { type: String, default: '' },
    defaultMetaDescription: { type: String, default: '' },
    defaultKeywords: { type: String, default: '' },
  },
}, {
  timestamps: true,
});

settingsSchema.statics.getSettings = async function() {
  let settings = await this.findOne({ key: 'site' }).lean();
  if (!settings) {
    settings = await this.create({ key: 'site' });
    settings = settings.toObject();
  }
  return settings;
};

settingsSchema.statics.updateSettings = async function(data) {
  let settings = await this.findOne({ key: 'site' });
  if (!settings) {
    settings = await this.create({ key: 'site' });
  }
  const { shopName, tagline, contact, hero } = data;
  if (typeof shopName === 'string') settings.shopName = shopName;
  if (typeof tagline === 'string') settings.tagline = tagline;
  if (contact) {
    settings.contact.phone = contact.phone || '';
    settings.contact.email = contact.email || '';
    settings.contact.address = contact.address || '';
    settings.contact.hours = contact.hours || '';
    settings.contact.instagram = contact.instagram || '';
    settings.contact.facebook = contact.facebook || '';
    settings.contact.pinterest = contact.pinterest || '';
    settings.contact.twitter = contact.twitter || '';
    settings.contact.youtube = contact.youtube || '';
  }
  if (hero) {
    if (typeof hero.title === 'string') settings.hero.title = hero.title;
    if (typeof hero.subtitle === 'string') settings.hero.subtitle = hero.subtitle;
  }
  if (data.logoUrl) settings.logo.url = data.logoUrl;
  if (data.faviconUrl) settings.favicon.url = data.faviconUrl;
  if (typeof data.announcementBar !== 'undefined') {
    settings.announcementBar.enabled = !!data.announcementBar.enabled;
    settings.announcementBar.text = data.announcementBar.text || '';
  }
  if (typeof data.mapsEmbed === 'string') settings.mapsEmbed = data.mapsEmbed;
  if (typeof data.footerText === 'string') settings.footerText = data.footerText;
  if (typeof data.copyright === 'string') settings.copyright = data.copyright;
  if (data.seo) {
    if (typeof data.seo.defaultMetaTitle === 'string') settings.seo.defaultMetaTitle = data.seo.defaultMetaTitle;
    if (typeof data.seo.defaultMetaDescription === 'string') settings.seo.defaultMetaDescription = data.seo.defaultMetaDescription;
    if (typeof data.seo.defaultKeywords === 'string') settings.seo.defaultKeywords = data.seo.defaultKeywords;
  }

  await settings.save();
  return settings;
};

module.exports = mongoose.model('Settings', settingsSchema);