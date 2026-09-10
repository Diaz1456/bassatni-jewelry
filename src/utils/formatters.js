const formatPrice = (price, currency = 'USD', locale = 'en-US') => {
  if (price === null || price === undefined) return '';
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(price / 100);
};

const formatPriceFromCents = (cents, currency = 'USD', locale = 'en-US') => {
  if (cents === null || cents === undefined) return '';
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(cents / 100);
};

// Convert a cents value to a plain dollar number string for form inputs.
// Whole dollars render without trailing decimals (e.g. 890000 → "8900"),
// fractional prices keep their cents (e.g. 49999 → "499.99").
const centsToDollars = (cents) => {
  if (cents === null || cents === undefined || Number.isNaN(Number(cents))) return '';
  const dollars = Number(cents) / 100;
  return Number.isInteger(dollars) ? String(dollars) : dollars.toFixed(2);
};

const formatNumber = (num, locale = 'en-US') => {
  if (num === null || num === undefined) return '';
  return new Intl.NumberFormat(locale).format(num);
};

const formatDate = (date, locale = 'en-US', options = {}) => {
  if (!date) return '';
  const defaultOptions = { year: 'numeric', month: 'long', day: 'numeric', ...options };
  return new Date(date).toLocaleDateString(locale, defaultOptions);
};

const truncate = (str, length = 100, suffix = '...') => {
  if (!str) return '';
  if (str.length <= length) return str;
  return str.substring(0, length).trim() + suffix;
};

const slugify = (str) => {
  if (!str) return '';
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

const getInitials = (name) => {
  if (!name) return '';
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

const capitalize = (str) => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

const capitalizeWords = (str) => {
  if (!str) return '';
  return str.replace(/\w\S*/g, txt => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
};

const formatGemstoneDetails = (gemstone) => {
  if (!gemstone) return '';
  const parts = [];
  if (gemstone.carat) parts.push(`${gemstone.carat}ct`);
  if (gemstone.clarity && gemstone.clarity !== 'N/A') parts.push(gemstone.clarity);
  if (gemstone.color && gemstone.color !== 'N/A') parts.push(gemstone.color);
  if (gemstone.cut && gemstone.cut !== 'N/A') parts.push(gemstone.cut);
  if (gemstone.shape) parts.push(capitalize(gemstone.shape));
  return parts.join(', ');
};

const formatMeasurements = (measurements) => {
  if (!measurements) return '';
  const parts = [];
  if (measurements.length) parts.push(`L: ${measurements.length}mm`);
  if (measurements.width) parts.push(`W: ${measurements.width}mm`);
  if (measurements.height) parts.push(`H: ${measurements.height}mm`);
  if (measurements.diameter) parts.push(`Ø: ${measurements.diameter}mm`);
  if (measurements.weight) parts.push(`${measurements.weight}g`);
  if (measurements.ringSize) parts.push(`Size: ${measurements.ringSize}`);
  if (measurements.chainLength) parts.push(`${measurements.chainLength}cm chain`);
  if (measurements.braceletLength) parts.push(`${measurements.braceletLength}cm`);
  return parts.join(' | ');
};

const getMetalLabel = (metalType, metalPurity) => {
  const labels = {
    gold: 'Gold',
    'white-gold': 'White Gold',
    'rose-gold': 'Rose Gold',
    silver: 'Sterling Silver',
    platinum: 'Platinum',
    palladium: 'Palladium',
    titanium: 'Titanium',
    'stainless-steel': 'Stainless Steel',
  };
  const label = labels[metalType] || metalType;
  if (metalPurity && metalPurity !== 'N/A') {
    return `${metalPurity} ${label}`;
  }
  return label;
};

const getOccasionLabel = (occasion) => {
  const labels = {
    engagement: 'Engagement',
    wedding: 'Wedding',
    anniversary: 'Anniversary',
    birthday: 'Birthday',
    valentine: "Valentine's Day",
    'mothers-day': "Mother's Day",
    christmas: 'Christmas',
    graduation: 'Graduation',
    'just-because': 'Just Because',
    prom: 'Prom',
    formal: 'Formal Events',
    everyday: 'Everyday Wear',
  };
  return labels[occasion] || occasion;
};

module.exports = {
  formatPrice,
  formatPriceFromCents,
  centsToDollars,
  formatNumber,
  formatDate,
  truncate,
  slugify,
  getInitials,
  capitalize,
  capitalizeWords,
  formatGemstoneDetails,
  formatMeasurements,
  getMetalLabel,
  getOccasionLabel,
};