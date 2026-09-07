const { Product, Category, Lookbook, Admin, Settings } = require('../src/models');
const { connectDB, disconnectDB } = require('../src/utils/db');

// ---------------------------------------------------------------------------
// Seed script
//
// - Products / categories / lookbooks are DESTRUCTIVE: existing content is
//   wiped and replaced with the samples below (safe to re-run during dev).
// - The admin user and the site settings are UPSERTED to the documented
//   defaults, so a re-run also resets the admin password and the shop name.
//   Override admin credentials via ADMIN_EMAIL / ADMIN_PASSWORD / ADMIN_NAME.
// ---------------------------------------------------------------------------

const seedDB = async () => {
  try {
    await connectDB();

    // 1. Wipe existing content so every seed run is a clean, known state.
    await Promise.all([
      Product.deleteMany({}),
      Category.deleteMany({}),
      Lookbook.deleteMany({}),
    ]);
    console.log('Cleared existing content data');

    // 2. Categories — the four main jewelry departments.
    const [rings, necklaces, earrings, bracelets] = await Category.create([
      {
        name: 'Rings',
        slug: 'rings',
        description: 'Engagement rings, wedding bands, and everyday statement rings crafted from fine gold and platinum.',
        shortDescription: 'Engagement rings, wedding bands & more',
        image: { url: '/images/categories/rings.jpg', alt: 'Gold engagement ring' },
        icon: 'ring',
        order: 1,
        isFeatured: true,
        seo: {
          metaTitle: 'Rings - Engagement, Wedding & Fine Jewelry',
          metaDescription: 'Shop our exquisite collection of fine rings including engagement, wedding, and fashion rings.',
        },
      },
      {
        name: 'Necklaces',
        slug: 'necklaces',
        description: 'Elegant necklaces and pendants set with diamonds, sapphires, emeralds, and pearls in fine gold.',
        shortDescription: 'Elegant necklaces & pendants',
        image: { url: '/images/categories/necklaces.jpg', alt: 'Gold necklace' },
        icon: 'necklace',
        order: 2,
        isFeatured: true,
        seo: {
          metaTitle: 'Necklaces & Pendants - Fine Jewelry',
          metaDescription: 'Shop elegant necklaces and pendants in gold, silver, and platinum with diamonds and gemstones.',
        },
      },
      {
        name: 'Earrings',
        slug: 'earrings',
        description: 'From classic diamond studs to dramatic drops and everyday hoops, find earrings for every occasion.',
        shortDescription: 'Studs, drops & hoops',
        image: { url: '/images/categories/earrings.jpg', alt: 'Diamond stud earrings' },
        icon: 'earrings',
        order: 3,
        isFeatured: true,
        seo: {
          metaTitle: 'Earrings - Diamond & Gold Studs, Drops, Hoops',
          metaDescription: 'Explore our earrings collection featuring diamond studs, pearl drops, and statement hoops.',
        },
      },
      {
        name: 'Bracelets',
        slug: 'bracelets',
        description: 'Delicate chains, bold bangles, and diamond tennis bracelets crafted for stacking and everyday elegance.',
        shortDescription: 'Chains, bangles & cuffs',
        image: { url: '/images/categories/bracelets.jpg', alt: 'Gold bracelet' },
        icon: 'bracelet',
        order: 4,
        isFeatured: true,
        seo: {
          metaTitle: 'Bracelets - Fine Gold, Diamond & Gemstone',
          metaDescription: 'Shop bracelets featuring delicate chains, bold bangles, and gemstone cuffs.',
        },
      },
    ]);
    console.log(`Created ${[rings, necklaces, earrings, bracelets].length} categories`);

    // 3. Products — full details for the public site and the admin editor.
    const products = await Product.create([
      /* ------------------------------ Rings ------------------------------ */
      {
        name: 'Eternal Diamond Solitaire Engagement Ring',
        shortDescription: 'A classic solitaire engagement ring with a brilliant-cut diamond set in 18k gold.',
        description: 'The Eternal Solitaire is the epitome of timeless elegance. Crafted in 18k yellow gold, this engagement ring features a brilliant-cut center diamond designed to catch the light from every angle, set in a secure four-prong setting that maximizes brilliance.\n\nEach diamond is ethically sourced and certified conflict-free, with a minimum of VS2 clarity and G color. The ring ships with a certificate of authenticity and a lifetime warranty.',
        sku: 'RNG-ENG-001',
        price: 890000, // $8,900 — stored in cents
        compareAtPrice: 990000,
        metalType: 'gold',
        metalPurity: '18k',
        gemstones: [{
          type: 'diamond',
          carat: 1.5,
          clarity: 'VS2',
          color: 'G',
          cut: 'Excellent',
          count: 1,
          shape: 'round',
        }],
        measurements: { ringSize: 'US 6-8', weight: 3.2 },
        careInstructions: 'Store in a soft pouch or jewelry box. Clean with mild soap and warm water. Avoid contact with chemicals. Have prongs inspected annually.',
        images: [
          { url: '/images/products/eternal-diamond/main.jpg', alt: 'Eternal Diamond Solitaire Engagement Ring in 18k gold', type: 'main', isMain: true, order: 0 },
          { url: '/images/products/eternal-diamond/gallery-1.jpg', alt: 'Side view of diamond solitaire ring', type: 'gallery', order: 1 },
          { url: '/images/products/eternal-diamond/lifestyle.jpg', alt: 'Engagement ring worn on hand', type: 'lifestyle', order: 2 },
        ],
        tags: ['engagement', 'diamond', 'solitaire', '18k gold', 'bridal'],
        occasions: ['engagement', 'wedding', 'anniversary'],
        category: rings._id,
        isNew: true,
        isBestSeller: true,
        isFeatured: true,
        inStock: true,
        stockQuantity: 10,
        rating: { average: 4.9, count: 124 },
        soldCount: 562,
        seo: {
          metaTitle: 'Eternal Diamond Solitaire Engagement Ring | 18k Gold',
          metaDescription: 'Timeless 1.50ct diamond solitaire engagement ring in 18k yellow gold with brilliant-cut center stone.',
          keywords: ['engagement ring', 'diamond solitaire', 'bridal', '18k gold ring'],
        },
      },
      {
        name: 'Halo Diamond Eternity Band',
        shortDescription: 'A pavé eternity band with a diamond halo set in platinum.',
        description: 'The Halo Eternity Band celebrates round-the-clock brilliance. Forty-two hand-set diamonds in a comfortable platinum band make it a perfect wedding ring or an heirloom gift that will be worn every day.\n\nDesigned to sit flush against a solitaire engagement ring, the low-profile setting protects both the stones and everyday wear.',
        sku: 'RNG-WED-019',
        price: 245000, // $2,450
        metalType: 'platinum',
        gemstones: [{
          type: 'diamond',
          carat: 0.6,
          clarity: 'VS2',
          color: 'G',
          cut: 'Excellent',
          count: 42,
          shape: 'round',
        }],
        measurements: { ringSize: 'US 5-9', width: 2.2, weight: 4.1 },
        careInstructions: 'Polish with a soft gold cloth. Have the pavé setting checked by a jeweler every six months.',
        images: [
          { url: '/images/products/halo-eternity/main.jpg', alt: 'Halo Diamond Eternity Band in platinum', type: 'main', isMain: true, order: 0 },
          { url: '/images/products/halo-eternity/gallery-1.jpg', alt: 'Pavé diamond detail', type: 'gallery', order: 1 },
        ],
        tags: ['eternity', 'wedding', 'diamond', 'platinum', 'pavé'],
        occasions: ['wedding', 'anniversary'],
        category: rings._id,
        isNew: true,
        isBestSeller: false,
        isFeatured: true,
        inStock: true,
        stockQuantity: 15,
        rating: { average: 4.8, count: 61 },
        soldCount: 204,
        seo: {
          metaTitle: 'Halo Diamond Eternity Band | Platinum Wedding Ring',
          metaDescription: 'Round-the-clock pavé diamond eternity band in platinum. 42 hand-set diamonds, designed to sit flush with a solitaire.',
        },
      },
      {
        name: 'Victorian Pearl & Diamond Cocktail Ring',
        shortDescription: 'A vintage-inspired cocktail ring with a pearl centerpiece and diamond accents.',
        description: 'Inspired by Victorian design, this cocktail ring pairs a lustrous fresh-water pearl with a swirl of brilliant-cut diamonds in warm rose gold. Its sculpted silhouette makes it a conversation piece for evenings and special occasions.\n\nEach ring is finished with a high-polish mirror shine and hallmarked for authenticity.',
        sku: 'RNG-CKT-033',
        price: 115000, // $1,150
        metalType: 'rose-gold',
        metalPurity: '14k',
        gemstones: [{
          type: 'pearl',
          carat: 0.8,
          clarity: 'N/A',
          color: 'N/A',
          cut: 'N/A',
          count: 1,
          shape: 'round',
        }, {
          type: 'diamond',
          carat: 0.2,
          clarity: 'VS2',
          color: 'G',
          cut: 'Very Good',
          count: 9,
          shape: 'round',
        }],
        measurements: { ringSize: 'US 5-10', weight: 5.7 },
        careInstructions: 'Avoid ultrasonic and steam cleaners. Wipe gently with a soft, damp cloth. Store separately.',
        images: [
          { url: '/images/products/victorian-pearl/main.jpg', alt: 'Victorian Pearl and Diamond Cocktail Ring in rose gold', type: 'main', isMain: true, order: 0 },
          { url: '/images/products/victorian-pearl/gallery-1.jpg', alt: 'Pearl centerpiece detail', type: 'gallery', order: 1 },
          { url: '/images/products/victorian-pearl/lifestyle.jpg', alt: 'Cocktail ring on hand', type: 'lifestyle', order: 2 },
        ],
        tags: ['pearl', 'cocktail', 'vintage', 'rose gold', 'statement'],
        occasions: ['formal', 'birthday', 'anniversary'],
        category: rings._id,
        isNew: false,
        isBestSeller: true,
        isFeatured: false,
        inStock: true,
        stockQuantity: 12,
        rating: { average: 4.7, count: 48 },
        soldCount: 173,
        seo: {
          metaTitle: 'Victorian Pearl & Diamond Cocktail Ring | 14k Rose Gold',
          metaDescription: 'Vintage-inspired cocktail ring with a lustrous pearl and diamond accents set in 14k rose gold.',
        },
      },
      /* ---------------------------- Necklaces ---------------------------- */
      {
        name: 'Celestial Sapphire Cluster Necklace',
        shortDescription: 'A celestial-inspired necklace with a sapphire and diamond cluster in white gold.',
        description: 'Inspired by the night sky, the Celestial Sapphire necklace centers a vivid blue sapphire in a halo of brilliant diamonds that cascades along the collarbone. Hand-set using our signature micro-pavé technique — over forty hours of skilled labor per piece.\n\nEach sapphire is hand-selected for color and clarity, and the piece transitions seamlessly from office to evening.',
        sku: 'NCK-SAP-042',
        price: 1250000, // $12,500
        metalType: 'white-gold',
        metalPurity: '14k',
        gemstones: [{
          type: 'sapphire',
          carat: 2.0,
          clarity: 'VS1',
          color: 'fancy',
          cut: 'Excellent',
          count: 1,
          shape: 'cushion',
        }, {
          type: 'diamond',
          carat: 0.5,
          clarity: 'VS2',
          color: 'F',
          cut: 'Very Good',
          count: 12,
          shape: 'round',
        }],
        measurements: { chainLength: 42, weight: 8.4 },
        careInstructions: 'Store flat in a jewelry box. Clean with a soft brush and mild soap. Avoid harsh chemicals.',
        images: [
          { url: '/images/products/celestial-sapphire/main.jpg', alt: 'Celestial Sapphire Cluster Necklace in white gold', type: 'main', isMain: true, order: 0 },
          { url: '/images/products/celestial-sapphire/gallery-1.jpg', alt: 'Sapphire and diamond cluster detail', type: 'gallery', order: 1 },
          { url: '/images/products/celestial-sapphire/lifestyle.jpg', alt: 'Necklace worn on model', type: 'lifestyle', order: 2 },
        ],
        tags: ['sapphire', 'necklace', 'white gold', 'statement'],
        occasions: ['formal', 'anniversary', 'birthday'],
        category: necklaces._id,
        isNew: true,
        isBestSeller: false,
        isFeatured: true,
        inStock: true,
        stockQuantity: 5,
        rating: { average: 4.8, count: 78 },
        soldCount: 235,
        seo: {
          metaTitle: 'Celestial Sapphire Cluster Necklace | 14k White Gold',
          metaDescription: 'Celestial-inspired sapphire and diamond cluster necklace in 14k white gold with 2.00ct blue sapphire.',
        },
      },
      {
        name: 'Golden Bar Pendant Necklace',
        shortDescription: 'A minimalist 14k gold bar pendant on a delicate cable chain.',
        description: 'Clean lines and a warm glow — the Golden Bar pendant is crafted from solid 14k yellow gold with a mirror finish. Lightweight and smooth against the skin, it layers beautifully with other necklaces and suits both casual and professional wear.\n\nDiamond-cut details along the edge catch the light with every movement.',
        sku: 'NCK-BAR-017',
        price: 68000, // $680
        metalType: 'gold',
        metalPurity: '14k',
        measurements: { chainLength: 45, weight: 3.6 },
        careInstructions: 'Polish with a soft jewelry cloth. Avoid contact with chlorine and abrasive cleaners.',
        images: [
          { url: '/images/products/golden-bar/main.jpg', alt: 'Golden Bar Pendant Necklace in 14k gold', type: 'main', isMain: true, order: 0 },
          { url: '/images/products/golden-bar/lifestyle.jpg', alt: 'Bar pendant worn on neckline', type: 'lifestyle', order: 1 },
        ],
        tags: ['minimalist', 'gold', 'bar pendant', 'everyday'],
        occasions: ['everyday', 'birthday'],
        category: necklaces._id,
        isNew: true,
        isBestSeller: true,
        isFeatured: false,
        inStock: true,
        stockQuantity: 30,
        rating: { average: 4.6, count: 112 },
        soldCount: 412,
        seo: {
          metaTitle: 'Golden Bar Pendant Necklace | 14k Gold Minimalist',
          metaDescription: 'Minimalist solid 14k gold bar pendant on a delicate cable chain. Perfect for layering and everyday wear.',
        },
      },
      {
        name: 'Emerald Drop Pendant',
        shortDescription: 'A vivid emerald pendant with a diamond halo in 18k yellow gold.',
        description: 'The Emerald Drop pendant sets a deep, vivid emerald in an open 18k yellow gold frame with a delicate diamond halo. The classic teardrop silhouette flatters every neckline, and the pendant arrives on an adjustable 18-inch chain.\n\nEvery emerald is ethically mined and certified natural, with our guarantee of origin.',
        sku: 'NCK-EMD-026',
        price: 390000, // $3,900
        metalType: 'gold',
        metalPurity: '18k',
        gemstones: [{
          type: 'emerald',
          carat: 1.5,
          clarity: 'VS2',
          color: 'N/A',
          cut: 'Good',
          count: 1,
          shape: 'pear',
        }, {
          type: 'diamond',
          carat: 0.3,
          clarity: 'VS2',
          color: 'F',
          cut: 'Very Good',
          count: 10,
          shape: 'round',
        }],
        measurements: { chainLength: 45, weight: 5.2 },
        careInstructions: 'Avoid ultrasonic cleaning. Clean with a soft brush and store separately to prevent scratching.',
        images: [
          { url: '/images/products/emerald-drop/main.jpg', alt: 'Emerald Drop Pendant with diamond halo in 18k gold', type: 'main', isMain: true, order: 0 },
          { url: '/images/products/emerald-drop/gallery-1.jpg', alt: 'Emerald and diamond halo detail', type: 'gallery', order: 1 },
          { url: '/images/products/emerald-drop/lifestyle.jpg', alt: 'Emerald pendant worn by model', type: 'lifestyle', order: 2 },
        ],
        tags: ['emerald', 'pendant', 'gold', 'statement'],
        occasions: ['anniversary', 'birthday', 'formal'],
        category: necklaces._id,
        isNew: false,
        isBestSeller: false,
        isFeatured: true,
        inStock: true,
        stockQuantity: 8,
        rating: { average: 4.5, count: 32 },
        soldCount: 96,
        seo: {
          metaTitle: 'Emerald Drop Pendant | 18k Gold with Diamond Halo',
          metaDescription: 'Vivid emerald drop pendant with a diamond halo, set in 18k yellow gold with an adjustable 18-inch chain.',
        },
      },
      /* ----------------------------- Earrings ---------------------------- */
      {
        name: 'Lumière Diamond Drop Earrings',
        shortDescription: 'Elegant pear-shaped diamond drop earrings in platinum.',
        description: 'The Lumière Diamond Drop earrings pair two pear-shaped diamonds with the cool luster of platinum. Each stone is set to sway gently with movement, catching the light from every angle.\n\nIdeal for bridal and formal wear, the earrings are backed by our lifetime warranty and arrive gift-boxed.',
        sku: 'ERN-DMD-008',
        price: 345000, // $3,450
        metalType: 'platinum',
        gemstones: [{
          type: 'diamond',
          carat: 1.0,
          clarity: 'VS2',
          color: 'F',
          cut: 'Excellent',
          count: 2,
          shape: 'pear',
        }],
        measurements: { length: 20, width: 8, weight: 2.8 },
        careInstructions: 'Store in a padded box. Clean with a soft cloth. Avoid ultrasonic cleaners for stone settings.',
        images: [
          { url: '/images/products/lumiere-earrings/main.jpg', alt: 'Lumière Diamond Drop Earrings in platinum', type: 'main', isMain: true, order: 0 },
          { url: '/images/products/lumiere-earrings/gallery-1.jpg', alt: 'Close-up of pear diamond drop', type: 'gallery', order: 1 },
          { url: '/images/products/lumiere-earrings/lifestyle.jpg', alt: 'Diamond drop earrings worn by model', type: 'lifestyle', order: 2 },
        ],
        tags: ['diamond', 'earrings', 'drop', 'platinum', 'evening'],
        occasions: ['formal', 'birthday', 'anniversary'],
        category: earrings._id,
        isNew: false,
        isBestSeller: true,
        isFeatured: true,
        inStock: true,
        stockQuantity: 15,
        rating: { average: 4.7, count: 95 },
        soldCount: 312,
        seo: {
          metaTitle: 'Lumière Diamond Drop Earrings | Platinum Pear Diamonds',
          metaDescription: 'Elegant pear-shaped diamond drop earrings crafted in platinum. Perfect for evening wear and formal events.',
        },
      },
      {
        name: 'Serena Pearl Stud Earrings',
        shortDescription: 'Classic button pearl studs with 14k white gold posts.',
        description: 'Understated and forever classic, the Serena studs pair high-luster button pearls with slim 14k white gold posts and secure friction backs — comfortable enough for all-day wear.\n\nEach pearl is matched for size and luster, making these the earrings you reach for every morning.',
        sku: 'ERN-PRL-011',
        price: 49000, // $490
        metalType: 'white-gold',
        metalPurity: '14k',
        gemstones: [{
          type: 'pearl',
          carat: 0.7,
          clarity: 'N/A',
          color: 'N/A',
          cut: 'N/A',
          count: 2,
          shape: 'round',
        }],
        measurements: { diameter: 8, weight: 1.4 },
        careInstructions: 'Wipe with a soft, dry cloth. Avoid perfumes and hairspray. Store away from other jewelry to avoid scratches.',
        images: [
          { url: '/images/products/serena-pearl/main.jpg', alt: 'Serena Pearl Stud Earrings in 14k white gold', type: 'main', isMain: true, order: 0 },
          { url: '/images/products/serena-pearl/lifestyle.jpg', alt: 'Pearl studs worn by model', type: 'lifestyle', order: 1 },
        ],
        tags: ['pearl', 'studs', 'classic', 'white gold'],
        occasions: ['everyday', 'formal'],
        category: earrings._id,
        isNew: true,
        isBestSeller: true,
        isFeatured: false,
        inStock: true,
        stockQuantity: 40,
        rating: { average: 4.8, count: 210 },
        soldCount: 728,
        seo: {
          metaTitle: 'Serena Pearl Stud Earrings | 14k White Gold',
          metaDescription: 'Classic button pearl studs with 14k white gold posts and secure friction backs.',
        },
      },
      {
        name: 'Classic Gold Hoop Earrings',
        shortDescription: 'Polished 18k gold hoop earrings with a secure snap closure.',
        description: 'Thin, polished, and endlessly versatile — these 18k yellow gold hoops are the everyday icon. The seamless finish meets in a secure snap closure that stays put, and the generous 25mm diameter dresses up or down with ease.\n\nPriced per pair, hallmarked, and gift-boxed.',
        sku: 'ERN-HOP-004',
        price: 52000, // $520
        metalType: 'gold',
        metalPurity: '18k',
        measurements: { diameter: 25, weight: 3.3 },
        careInstructions: 'Clean with warm water and mild soap. Dry thoroughly and polish with a jewelry cloth.',
        images: [
          { url: '/images/products/gold-hoops/main.jpg', alt: 'Classic 18k gold hoop earrings', type: 'main', isMain: true, order: 0 },
          { url: '/images/products/gold-hoops/lifestyle.jpg', alt: 'Gold hoops worn by model', type: 'lifestyle', order: 1 },
        ],
        tags: ['hoops', 'gold', 'everyday', 'minimalist'],
        occasions: ['everyday', 'birthday'],
        category: earrings._id,
        isNew: false,
        isBestSeller: true,
        isFeatured: false,
        inStock: true,
        stockQuantity: 35,
        rating: { average: 4.9, count: 187 },
        soldCount: 843,
        seo: {
          metaTitle: 'Classic Gold Hoop Earrings | 18k Yellow Gold',
          metaDescription: 'Polished 18k yellow gold hoop earrings with a secure snap closure. The everyday icon.',
        },
      },
      /* ---------------------------- Bracelets ---------------------------- */
      {
        name: 'Aura Rose Gold Bangle',
        shortDescription: 'A sleek modern bangle in polished rose gold.',
        description: 'The Aura rose gold bangle is a modern classic. Its seamless polished silhouette works alone or stacked, and the warm 14k rose tone flatters every skin tone.\n\nAvailable in multiple sizes, with a secure push-lock hinge.',
        sku: 'BRC-RSG-021',
        price: 180000, // $1,800
        metalType: 'rose-gold',
        metalPurity: '14k',
        measurements: { diameter: 65, weight: 6.1 },
        careInstructions: 'Polish with a soft gold polishing cloth. Keep away from chemicals and hot tubs.',
        images: [
          { url: '/images/products/aura-bangle/main.jpg', alt: 'Aura Rose Gold Bangle', type: 'main', isMain: true, order: 0 },
          { url: '/images/products/aura-bangle/gallery-1.jpg', alt: 'Rose gold bangle close up', type: 'gallery', order: 1 },
          { url: '/images/products/aura-bangle/lifestyle.jpg', alt: 'Bangle worn on wrist', type: 'lifestyle', order: 2 },
        ],
        tags: ['bangle', 'rose gold', 'minimalist', 'everyday'],
        occasions: ['everyday', 'birthday'],
        category: bracelets._id,
        isNew: true,
        isBestSeller: true,
        isFeatured: false,
        inStock: true,
        stockQuantity: 20,
        rating: { average: 4.6, count: 52 },
        soldCount: 187,
        seo: {
          metaTitle: 'Aura Rose Gold Bangle | 14k Rose Gold',
          metaDescription: 'Sleek modern rose gold bangle with a polished finish. Versatile everyday piece in 14k gold.',
        },
      },
      {
        name: 'Milano Diamond Tennis Bracelet',
        shortDescription: 'A brilliant 4.0ct diamond tennis bracelet in 14k white gold.',
        description: 'A modern take on the classic tennis bracelet: 62 invisible-set brilliant-cut diamonds on a slim 14k white gold link. The stones are channel-set for a smooth profile that catches light continuously around the wrist.\n\nIncludes a certified gemological report and our lifetime warranty.',
        sku: 'BRC-TNS-012',
        price: 420000, // $4,200
        metalType: 'white-gold',
        metalPurity: '14k',
        gemstones: [{
          type: 'diamond',
          carat: 4.0,
          clarity: 'VS2',
          color: 'G',
          cut: 'Excellent',
          count: 62,
          shape: 'round',
        }],
        measurements: { braceletLength: 17, width: 3.5, weight: 10.2 },
        careInstructions: 'Store flat. Clean gently with a soft brush and warm soapy water. Have the setting inspected annually.',
        images: [
          { url: '/images/products/milano-tennis/main.jpg', alt: 'Milano Diamond Tennis Bracelet in white gold', type: 'main', isMain: true, order: 0 },
          { url: '/images/products/milano-tennis/gallery-1.jpg', alt: 'Diamond tennis bracelet detail', type: 'gallery', order: 1 },
          { url: '/images/products/milano-tennis/lifestyle.jpg', alt: 'Tennis bracelet worn on wrist', type: 'lifestyle', order: 2 },
        ],
        tags: ['tennis', 'diamond', 'white gold', 'statement'],
        occasions: ['formal', 'anniversary'],
        category: bracelets._id,
        isNew: false,
        isBestSeller: true,
        isFeatured: true,
        inStock: true,
        stockQuantity: 9,
        rating: { average: 4.9, count: 66 },
        soldCount: 201,
        seo: {
          metaTitle: 'Milano Diamond Tennis Bracelet | 14k White Gold',
          metaDescription: 'Brilliant 4.0ct diamond tennis bracelet with 62 channel-set stones in 14k white gold. Certified and warrantied.',
        },
      },
      {
        name: 'Heritage Charm Bracelet',
        shortDescription: 'A 14k gold charm bracelet with a heart, star, and initial charms.',
        description: 'The Heritage charm bracelet tells your story. The polished 14k gold chain arrives with a heart, a star, and an initial charm, and holds up to six more — add a charm for every milestone and anniversary.\n\nEach charm is expertly engraved and soldered, and the bracelet closes with a secure lobster clasp.',
        sku: 'BRC-CHM-007',
        price: 95000, // $950
        metalType: 'gold',
        metalPurity: '14k',
        measurements: { braceletLength: 18, weight: 5.8 },
        careInstructions: 'Remove before sleeping and showering. Polish with a jewelry cloth. Store in a soft pouch.',
        images: [
          { url: '/images/products/heritage-charm/main.jpg', alt: 'Heritage 14k gold charm bracelet', type: 'main', isMain: true, order: 0 },
          { url: '/images/products/heritage-charm/gallery-1.jpg', alt: 'Charm details', type: 'gallery', order: 1 },
          { url: '/images/products/heritage-charm/lifestyle.jpg', alt: 'Charm bracelet on wrist', type: 'lifestyle', order: 2 },
        ],
        tags: ['charm', 'gold', 'personalized', 'gift'],
        occasions: ['birthday', 'mothers-day', 'anniversary'],
        category: bracelets._id,
        isNew: true,
        isBestSeller: false,
        isFeatured: false,
        inStock: true,
        stockQuantity: 18,
        rating: { average: 4.7, count: 41 },
        soldCount: 156,
        seo: {
          metaTitle: 'Heritage Charm Bracelet | 14k Gold with Initials',
          metaDescription: '14k gold charm bracelet with heart, star, and initial charms. Add a charm for every milestone.',
        },
      },
    ]);
    console.log(`Created ${products.length} products`);

    // 4. Lookbooks — curated collections referencing the products above.
    const lookbooks = await Lookbook.create([
      {
        title: 'Bridal 2026',
        slug: 'bridal-2026',
        description: 'The season\'s most romantic bridal jewelry — from timeless solitaires to celestial necklaces and luminous drops.',
        shortDescription: 'Timeless bridal jewelry for the modern bride',
        coverImage: { url: '/images/lookbooks/bridal-2026/cover.jpg', alt: 'Bridal jewelry lookbook cover' },
        images: [
          { url: '/images/lookbooks/bridal-2026/1.jpg', alt: 'Engagement ring on bride hand', caption: 'The Eternal Solitaire', product: products[0]._id, order: 1 },
          { url: '/images/lookbooks/bridal-2026/2.jpg', alt: 'Diamond earrings on bride', caption: 'Complete the look', product: products[6]._id, order: 2 },
          { url: '/images/lookbooks/bridal-2026/3.jpg', alt: 'Bridal necklace', caption: 'Celestial Elegance', product: products[3]._id, order: 3 },
          { url: '/images/lookbooks/bridal-2026/4.jpg', alt: 'Bride with jewelry', caption: 'Bridal Styling', product: products[0]._id, order: 4 },
        ],
        products: [products[0]._id, products[3]._id, products[6]._id],
        tags: ['bridal', 'engagement', 'wedding', '2026'],
        season: 'bridal',
        year: 2026,
        isPublished: true,
        isFeatured: true,
        seo: {
          metaTitle: 'Bridal 2026 Lookbook - Engagement & Wedding Jewelry',
          metaDescription: 'Explore our curated bridal jewelry lookbook featuring engagement rings, wedding bands, and bridal accessories.',
        },
      },
      {
        title: 'Minimalist Modern',
        slug: 'minimalist-modern',
        description: 'Clean lines and understated elegance. Our minimalist edit focuses on the beauty of simplicity for the modern woman.',
        shortDescription: 'Clean lines and understated elegance',
        coverImage: { url: '/images/lookbooks/minimalist/cover.jpg', alt: 'Minimalist jewelry lookbook cover' },
        images: [
          { url: '/images/lookbooks/minimalist/1.jpg', alt: 'Gold bangle on wrist', caption: 'The Aura Bangle', product: products[9]._id, order: 1 },
          { url: '/images/lookbooks/minimalist/2.jpg', alt: 'Bar pendant necklace', caption: 'Quiet Luxury', product: products[4]._id, order: 2 },
          { url: '/images/lookbooks/minimalist/3.jpg', alt: 'Minimalist styling', caption: 'Less is More', order: 3 },
        ],
        products: [products[9]._id, products[4]._id],
        tags: ['minimalist', 'modern', 'everyday'],
        season: 'annual',
        year: 2026,
        isPublished: true,
        isFeatured: true,
        seo: {
          metaTitle: 'Minimalist Modern Lookbook - Simple Fine Jewelry',
          metaDescription: 'Discover our minimalist jewelry lookbook featuring clean, modern pieces for everyday wear.',
        },
      },
      {
        title: 'Summer Radiance',
        slug: 'summer-radiance',
        description: 'Jewelry that captures the warmth and light of the season — sunny golds, pearls, and brilliant diamonds.',
        shortDescription: 'Pieces that capture summer\'s light',
        coverImage: { url: '/images/lookbooks/summer/cover.jpg', alt: 'Summer jewelry lookbook cover' },
        images: [
          { url: '/images/lookbooks/summer/1.jpg', alt: 'Gold hoops in sunlight', caption: 'Sunshine Hoops', product: products[8]._id, order: 1 },
          { url: '/images/lookbooks/summer/2.jpg', alt: 'Pearl jewelry on summer outfit', caption: 'Everyday Pearls', product: products[7]._id, order: 2 },
          { url: '/images/lookbooks/summer/3.jpg', alt: 'Gold jewelry on beach', caption: 'Beach Vibes', order: 3 },
        ],
        products: [products[8]._id, products[7]._id],
        tags: ['summer', 'radiant', 'seasonal'],
        season: 'summer',
        year: 2026,
        isPublished: true,
        isFeatured: false,
        seo: {
          metaTitle: 'Summer Radiance Lookbook - Jewelry for Summer',
          metaDescription: 'Explore our summer jewelry lookbook with pieces designed to capture the light and warmth of the season.',
        },
      },
    ]);
    console.log(`Created ${lookbooks.length} lookbooks`);

    // 5. Admin user — upserted so a re-run can reset the default credentials.
    //    Password is hashed with bcrypt before it ever touches the database.
    const adminEmail = (process.env.ADMIN_EMAIL || 'admin@jewelrystore.com').toLowerCase();
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
    const adminName = process.env.ADMIN_NAME || 'Store Owner';
    await Admin.updateOne(
      { email: adminEmail },
      {
        $set: {
          email: adminEmail,
          name: adminName,
          passwordHash: await Admin.hashPassword(adminPassword),
          role: 'superadmin',
        },
      },
      { upsert: true },
    );
    console.log(`Admin user ready: ${adminEmail}`);

    // 6. Default site settings — upserted so the shop always boots with a sane,
    //    documented brand. Re-running the seed resets these to the defaults.
    await Settings.updateOne(
      { key: 'site' },
      {
        $set: {
          shopName: 'Elegance Jewelry',
          tagline: 'Exquisite fine jewelry for life\u2019s precious moments',
          logo: {},
          hero: {
            title: 'Timeless Elegance, Crafted for You',
            subtitle: 'Discover handcrafted fine jewelry designed to celebrate life\u2019s most precious moments.',
          },
          contact: {
            phone: '+1 (555) 123-4567',
            email: 'hello@elegancejewelry.com',
            address: '120 Madison Avenue, New York, NY 10016',
            hours: 'Mon\u2013Sat: 10am\u20137pm \u2022 Sun: 12pm\u20135pm',
            instagram: 'https://instagram.com/elegancejewelry',
            facebook: 'https://facebook.com/elegancejewelry',
            pinterest: 'https://pinterest.com/elegancejewelry',
            twitter: '',
            youtube: '',
          },
          favicon: {},
          announcementBar: {
            enabled: true,
            text: 'Complimentary shipping on all orders over $100',
          },
          mapsEmbed: '',
          footerText: 'Handcrafted fine jewelry. Each piece is designed, cast, and finished by our master jewelers.',
          copyright: 'Elegance Jewelry',
          seo: {
            defaultMetaTitle: 'Elegance Jewelry | Fine Handcrafted Jewelry',
            defaultMetaDescription: 'Explore handcrafted fine jewelry — engagement rings, earrings, necklaces, and more. Shop elegant designs crafted to be treasured forever.',
            defaultKeywords: 'fine jewelry, engagement rings, gold jewelry, diamond jewelry, luxury jewelry',
          },
        },
      },
      { upsert: true },
    );
    console.log('Default site settings applied');

    console.log('\n\u2713 Database seeded successfully!');
    console.log(`Categories: ${[rings, necklaces, earrings, bracelets].length}`);
    console.log(`Products: ${products.length}`);
    console.log(`Lookbooks: ${lookbooks.length}`);
    console.log(`Admin: ${adminEmail} / ${adminPassword}`);
    console.log('Shop name: Elegance Jewelry');
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  } finally {
    await disconnectDB();
  }
};

seedDB();