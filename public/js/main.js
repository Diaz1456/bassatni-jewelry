(function() {
  'use strict';

  const config = window.SITE_CONFIG || {};
  const body = document.body;

  /* ===== Shop entrance loader cleanup (root catalog page) =====
     The overlay hides itself via CSS keyframes; this just removes the node
     from the DOM once the animation is over so it can never sit on top of
     anything later. */
  const shopLoader = document.querySelector('#shop-loader');
  if (shopLoader) {
    const removeLoader = () => {
      shopLoader.remove();
      window.removeEventListener('load', removeLoader);
    };
    window.addEventListener('load', removeLoader);
    setTimeout(removeLoader, 1600);
  }

  /* ===== Sticky header: shadow once scrolled ===== */
  const siteHeader = document.querySelector('.site-header');
  if (siteHeader) {
    const onScroll = () => {
      siteHeader.classList.toggle('scrolled', window.scrollY > 10);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* ===== Mobile Menu ===== */
  const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
  const mobileMenuClose = document.querySelector('.mobile-menu-close');
  const mobileMenuPanel = document.querySelector('#mobile-menu-panel');
  const mobileMenuOverlay = document.querySelector('.mobile-nav-overlay');

  const openMobileMenu = () => {
    if (!mobileMenuPanel) return;
    mobileMenuPanel.classList.add('active');
    mobileMenuPanel.setAttribute('aria-hidden', 'false');
    mobileMenuOverlay?.classList.add('active');
    mobileMenuOverlay?.setAttribute('aria-hidden', 'false');
    mobileMenuToggle?.setAttribute('aria-expanded', 'true');
    mobileMenuToggle?.setAttribute('aria-controls', 'main-nav');
    body.style.overflow = 'hidden';
  };

  const closeMobileMenu = () => {
    if (!mobileMenuPanel) return;
    mobileMenuPanel.classList.remove('active');
    mobileMenuPanel.setAttribute('aria-hidden', 'true');
    mobileMenuOverlay?.classList.remove('active');
    mobileMenuOverlay?.setAttribute('aria-hidden', 'true');
    mobileMenuToggle?.setAttribute('aria-expanded', 'false');
    body.style.overflow = '';
  };

  mobileMenuToggle?.addEventListener('click', openMobileMenu);
  mobileMenuClose?.addEventListener('click', closeMobileMenu);
  mobileMenuOverlay?.addEventListener('click', closeMobileMenu);

  /* ===== Mobile Submenus ===== */
  document.querySelectorAll('.submenu-toggle').forEach(btn => {
    btn.addEventListener('click', () => {
      const expanded = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', String(!expanded));
      const submenu = btn.parentElement.querySelector('.mobile-submenu');
      submenu?.classList.toggle('active', !expanded);
    });
  });

  /* ===== Hero Slider ===== */
  const heroSlider = document.querySelector('.hero-slider');
  if (heroSlider) {
    const slides = heroSlider.querySelectorAll('.hero-slide');
    const dotsContainer = heroSlider.querySelector('.hero-dots');
    const prevBtn = heroSlider.querySelector('.hero-prev');
    const nextBtn = heroSlider.querySelector('.hero-next');
    let currentSlide = 0;
    let slideInterval;

    slides.forEach((_, i) => {
      const dot = document.createElement('button');
      dot.className = 'hero-dot' + (i === 0 ? ' active' : '');
      dot.setAttribute('aria-label', `Go to slide ${i + 1}`);
      dot.setAttribute('role', 'tab');
      dot.addEventListener('click', () => goToSlide(i));
      dotsContainer?.appendChild(dot);
    });

    const dots = dotsContainer?.querySelectorAll('.hero-dot') || [];

    function goToSlide(index) {
      slides.forEach((slide, i) => slide.classList.toggle('active', i === index));
      dots.forEach((dot, i) => dot.classList.toggle('active', i === index));
      currentSlide = index;
    }

    function nextSlide() {
      goToSlide((currentSlide + 1) % slides.length);
    }

    function prevSlide() {
      goToSlide((currentSlide - 1 + slides.length) % slides.length);
    }

    prevBtn?.addEventListener('click', () => {
      prevSlide();
      resetInterval();
    });
    nextBtn?.addEventListener('click', () => {
      nextSlide();
      resetInterval();
    });

    function startInterval() {
      slideInterval = setInterval(nextSlide, 7000);
    }

    function resetInterval() {
      clearInterval(slideInterval);
      startInterval();
    }

    if (slides.length > 1) {
      startInterval();
    }
  }

  /* ===== Search Autocomplete ===== */
  const searchInput = document.querySelector('#site-search');
  const searchResults = document.querySelector('#search-results');
  let debounceTimer;

  if (searchInput && searchResults) {
    searchInput.addEventListener('input', (e) => {
      clearTimeout(debounceTimer);
      const query = e.target.value.trim();
      if (query.length < 2) {
        hideResults();
        return;
      }
      debounceTimer = setTimeout(() => fetchSuggestions(query), 300);
    });

    searchInput.addEventListener('focus', () => {
      if (searchInput.value.trim().length >= 2) {
        showResults();
      }
    });

    document.addEventListener('click', (e) => {
      if (!e.target.closest('.search-wrapper')) {
        hideResults();
      }
    });

    async function fetchSuggestions(query) {
      try {
        const response = await fetch(`/catalog/autocomplete?q=${encodeURIComponent(query)}`);
        const data = await response.json();
        renderSuggestions(data.suggestions || []);
      } catch (error) {
        hideResults();
      }
    }

    function renderSuggestions(suggestions) {
      if (suggestions.length === 0) {
        searchResults.innerHTML = '<div class="search-result-item no-results">No products found. Try "diamond", "ring", "gold"...</div>';
      } else {
        searchResults.innerHTML = suggestions.map(item => `
          <a href="/product/${item.slug}" class="search-result-item">
            <img src="${item.image}" alt="" class="search-result-image">
            <div class="search-result-info">
              <p class="search-result-name">${escapeHtml(item.name)}</p>
              <p class="search-result-price">$${(item.price / 100).toFixed(2)}</p>
            </div>
          </a>
        `).join('');
      }
      showResults();
    }

    function showResults() {
      searchResults.classList.add('active');
      searchResults.setAttribute('role', 'listbox');
    }

    function hideResults() {
      searchResults.classList.remove('active');
    }
  }

  /* ===== Product Gallery & Zoom ===== */
  const mainImageContainer = document.querySelector('.main-image-container');
  const mainImage = document.querySelector('#main-product-image');
  const zoomLens = document.querySelector('.zoom-lens');
  const zoomResult = document.querySelector('.zoom-result');
  const thumbnails = document.querySelectorAll('.thumbnail');
  const thumbTrack = document.querySelector('.thumbnails-track');
  const thumbPrev = document.querySelector('.thumb-prev');
  const thumbNext = document.querySelector('.thumb-next');

  if (mainImageContainer && mainImage) {
    let scrollIndex = 0;
    const visibleThumbs = 5;

    thumbnails.forEach(thumb => {
      thumb.addEventListener('click', () => {
        mainImage.src = thumb.dataset.image;
        mainImage.dataset.zoomImage = thumb.dataset.zoomImage || thumb.dataset.image;
        if (zoomResult) {
          zoomResult.style.backgroundImage = `url('${thumb.dataset.zoomImage}')`;
        }
        thumbnails.forEach(t => {
          t.classList.remove('active');
          t.setAttribute('aria-pressed', 'false');
        });
        thumb.classList.add('active');
        thumb.setAttribute('aria-pressed', 'true');
      });
    });

    thumbPrev?.addEventListener('click', () => {
      if (scrollIndex > 0) {
        scrollIndex--;
        updateThumbScroll();
      }
    });

    thumbNext?.addEventListener('click', () => {
      if (scrollIndex < thumbnails.length - visibleThumbs) {
        scrollIndex++;
        updateThumbScroll();
      }
    });

    function updateThumbScroll() {
      if (thumbTrack) {
        thumbTrack.style.transform = `translateX(-${scrollIndex * 96}px)`;
      }
    }

    /* Zoom functionality */
    mainImageContainer.addEventListener('mouseenter', () => {
      if (window.matchMedia('(hover: hover)').matches && zoomLens && zoomResult) {
        zoomLens.style.display = 'block';
        zoomResult.style.display = 'block';
      }
    });

    mainImageContainer.addEventListener('mousemove', (e) => {
      if (!zoomLens || !zoomResult) return;
      const rect = mainImageContainer.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const lensSize = 150;

      let lensX = x - lensSize / 2;
      let lensY = y - lensSize / 2;

      lensX = Math.max(0, Math.min(lensX, rect.width - lensSize));
      lensY = Math.max(0, Math.min(lensY, rect.height - lensSize));

      zoomLens.style.left = lensX + 'px';
      zoomLens.style.top = lensY + 'px';

      const zoomImage = mainImage.dataset.zoomImage || mainImage.src;
      zoomResult.style.backgroundImage = `url('${zoomImage}')`;
      zoomResult.style.backgroundSize = `${rect.width * 2}px ${rect.height * 2}px`;
      zoomResult.style.backgroundPosition = `-${lensX * 2}px -${lensY * 2}px`;
    });

    mainImageContainer.addEventListener('mouseleave', () => {
      if (zoomLens) zoomLens.style.display = 'none';
      if (zoomResult) zoomResult.style.display = 'none';
    });

    mainImageContainer.addEventListener('click', () => {
      const rect = mainImageContainer.getBoundingClientRect();
      if (!zoomLens || !zoomResult) return;
      if (zoomLens.style.display === 'block') {
        zoomLens.style.display = 'none';
        zoomResult.style.display = 'none';
      } else {
        zoomLens.style.display = 'block';
        zoomResult.style.display = 'block';
        zoomLens.style.left = rect.width / 2 - 75 + 'px';
        zoomLens.style.top = rect.height / 2 - 75 + 'px';
      }
    });
  }

  /* ===== Video Modal ===== */
  const videoToggle = document.querySelector('.video-toggle');
  const videoModal = document.querySelector('#video-modal');
  const videoModalClose = document.querySelector('.video-modal-close');
  const videoContainer = document.querySelector('#video-container');

  if (videoToggle && videoModal && videoContainer) {
    videoToggle.addEventListener('click', () => {
      const videoUrl = videoToggle.dataset.videoUrl;
      const videoType = videoToggle.dataset.videoType;
      openVideoModal(videoUrl, videoType);
    });

    videoModalClose?.addEventListener('click', closeVideoModal);
    document.querySelector('.video-modal-overlay')?.addEventListener('click', closeVideoModal);

    function openVideoModal(url, type) {
      videoContainer.innerHTML = '';
      if (type === 'youtube' || url.includes('youtube.com') || url.includes('youtu.be')) {
        const youtubeId = getYouTubeId(url);
        if (youtubeId) {
          const iframe = document.createElement('iframe');
          iframe.src = `https://www.youtube.com/embed/${youtubeId}?autoplay=1`;
          iframe.title = 'Product video';
          iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
          iframe.allowFullscreen = true;
          videoContainer.appendChild(iframe);
        }
      } else if (type === 'vimeo' || url.includes('vimeo.com')) {
        const vimeoId = getVimeoId(url);
        if (vimeoId) {
          const iframe = document.createElement('iframe');
          iframe.src = `https://player.vimeo.com/video/${vimeoId}?autoplay=1`;
          iframe.title = 'Product video';
          iframe.allow = 'autoplay; fullscreen';
          iframe.allowFullscreen = true;
          videoContainer.appendChild(iframe);
        }
      } else {
        const video = document.createElement('video');
        video.src = url;
        video.controls = true;
        video.autoplay = true;
        video.addEventListener('error', () => {
          videoContainer.innerHTML = '<p style="text-align:center">Video could not be loaded.</p>';
        });
        videoContainer.appendChild(video);
      }
      videoModal.classList.add('active');
      videoModal.setAttribute('aria-hidden', 'false');
      body.style.overflow = 'hidden';
      document.addEventListener('keydown', closeOnEsc);
    }

    function closeVideoModal() {
      videoContainer.innerHTML = '';
      videoModal.classList.remove('active');
      videoModal.setAttribute('aria-hidden', 'true');
      body.style.overflow = '';
      document.removeEventListener('keydown', closeOnEsc);
    }

    function closeOnEsc(e) {
      if (e.key === 'Escape') {
        closeVideoModal();
      }
    }

    function getYouTubeId(url) {
      const patterns = [
        /(?:youtube\.com\/watch\?v=)([^&\s]+)/,
        /(?:youtu\.be\/)([^\s]+)/,
        /(?:youtube\.com\/embed\/)([^\s?]+)/,
      ];
      for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match && match[1]) return match[1];
      }
      return null;
    }

    function getVimeoId(url) {
      const match = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
      return match ? match[1] : null;
    }
  }

  /* ===== 360° Viewer ===== */
  const view360Toggle = document.querySelector('.view-360-toggle');
  const view360Modal = document.querySelector('#view-360-modal');
  const view360Close = document.querySelector('.view-360-close');
  const view360Viewer = document.querySelector('#view-360-viewer');

  if (view360Toggle && view360Modal && view360Viewer) {
    let isDragging = false;
    let startX = 0;
    let currentFrame = 0;

    view360Toggle.addEventListener('click', () => {
      init360Viewer();
      view360Modal.classList.add('active');
      view360Modal.setAttribute('aria-hidden', 'false');
      body.style.overflow = 'hidden';
      document.addEventListener('keydown', closeOnEsc);

      document.addEventListener('mousemove', handleDrag);
      document.addEventListener('mouseup', stopDrag);
      view360Viewer.addEventListener('touchstart', startDrag, { passive: true });
      view360Viewer.addEventListener('touchmove', handleTouchDrag, { passive: true });
      view360Viewer.addEventListener('touchend', stopDrag);
    });

    view360Close?.addEventListener('click', close360Viewer);
    document.querySelector('.view-360-overlay')?.addEventListener('click', close360Viewer);

    function close360Viewer() {
      view360Modal.classList.remove('active');
      view360Modal.setAttribute('aria-hidden', 'true');
      body.style.overflow = '';
      document.removeEventListener('keydown', closeOnEsc);
      document.removeEventListener('mousemove', handleDrag);
      document.removeEventListener('mouseup', stopDrag);
      view360Viewer.removeEventListener('touchstart', startDrag);
      view360Viewer.removeEventListener('touchmove', handleTouchDrag);
      view360Viewer.removeEventListener('touchend', stopDrag);
    }

    function closeOnEsc(e) {
      if (e.key === 'Escape') {
        close360Viewer();
      }
    }

    function init360Viewer() {
      const frames = document.querySelectorAll('[data-360-frame]');
      const image = view360Viewer.querySelector('img');
      if (image && frames.length > 0) {
        currentFrame = 0;
        const firstFrame = frames[0].dataset.image;
        image.src = firstFrame;
      }
    }

    function startDrag(e) {
      isDragging = true;
      startX = e.clientX || e.touches?.[0].clientX || 0;
      view360Viewer.querySelector('img')?.classList.add('dragging');
    }

    function handleDrag(e) {
      if (!isDragging) return;
      const deltaX = e.clientX - startX;
      if (Math.abs(deltaX) > 50) {
        const direction = deltaX > 0 ? 1 : -1;
        rotate360Frame(direction);
        startX = e.clientX;
      }
    }

    function handleTouchDrag(e) {
      if (!isDragging) return;
      const touch = e.touches?.[0];
      if (!touch) return;
      const deltaX = touch.clientX - startX;
      if (Math.abs(deltaX) > 50) {
        const direction = deltaX > 0 ? 1 : -1;
        rotate360Frame(direction);
        startX = touch.clientX;
      }
    }

    function stopDrag() {
      isDragging = false;
      view360Viewer.querySelector('img')?.classList.remove('dragging');
    }

    function rotate360Frame(direction) {
      const frames = document.querySelectorAll('[data-360-frame]');
      if (frames.length === 0) return;
      currentFrame = (currentFrame + direction + frames.length) % frames.length;
      const image = view360Viewer.querySelector('img');
      if (image) {
        image.src = frames[currentFrame].dataset.image;
      }
    }
  }

  /* ===== Quantity Selector ===== */
  const qtyMinus = document.querySelector('.qty-minus');
  const qtyPlus = document.querySelector('.qty-plus');
  const qtyInput = document.querySelector('.qty-input');

  if (qtyMinus && qtyPlus && qtyInput) {
    qtyMinus.addEventListener('click', () => {
      const current = parseInt(qtyInput.value, 10) || 1;
      if (current > 1) {
        qtyInput.value = current - 1;
      }
    });

    qtyPlus.addEventListener('click', () => {
      const current = parseInt(qtyInput.value, 10) || 1;
      const max = parseInt(qtyInput.max, 10) || 10;
      if (current < max) {
        qtyInput.value = current + 1;
      }
    });

    qtyInput.addEventListener('change', () => {
      const max = parseInt(qtyInput.max, 10) || 10;
      const min = 1;
      let value = parseInt(qtyInput.value, 10);
      if (isNaN(value)) value = min;
      qtyInput.value = Math.max(min, Math.min(max, value));
    });
  }

  /* ===== Product Tabs ===== */
  const tabButtons = document.querySelectorAll('.tab-btn');
  const tabPanels = document.querySelectorAll('.tab-panel');

  if (tabButtons.length > 0) {
    tabButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const tabId = btn.getAttribute('aria-controls');

        tabButtons.forEach(b => {
          b.classList.remove('active');
          b.setAttribute('aria-selected', 'false');
        });
        tabPanels.forEach(p => p.classList.remove('active'));

        btn.classList.add('active');
        btn.setAttribute('aria-selected', 'true');
        document.getElementById(tabId)?.classList.add('active');
      });
    });
  }

  /* ===== Cart (localStorage) ===== */
  const addToCartBtn = document.querySelector('.add-to-cart-btn');
  const cartCount = document.querySelector('.cart-count');

  const CART_KEY = 'cart';
  const WISHLIST_KEY = 'wishlist';

  function getCart() {
    try { return JSON.parse(localStorage.getItem(CART_KEY) || '[]'); } catch (e) { return []; }
  }
  function saveCart(cart) {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    updateCartCount();
  }

  if (addToCartBtn) {
    addToCartBtn.addEventListener('click', () => {
      const quantity = parseInt(qtyInput?.value, 10) || 1;
      addToCart(addToCartBtn.dataset, quantity);
    });
  }

  // Delegated quick-add handler (works for both initial and AJAX-rendered cards)
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.quick-add-btn');
    if (!btn) return;
    e.preventDefault();
    e.stopPropagation();
    const slug = btn.dataset.productSlug;
    fetch(`/api/products/${slug}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          const p = data.data.product;
          addToCart({
            productSlug: p.slug,
            productName: p.name,
            productPrice: p.price,
            productImage: (p.mainImage && p.mainImage.url) || '/images/placeholder.svg',
            productUrl: '/product/' + p.slug,
          }, 1);
        }
      })
      .catch(err => console.error('Error adding to cart:', err));
  });

  function addToCart(data, quantity) {
    const cart = getCart();
    const existing = cart.find(item => item.slug === data.productSlug);
    if (existing) {
      existing.quantity += quantity;
    } else {
      cart.push({
        slug: data.productSlug,
        name: data.productName,
        price: parseFloat(data.productPrice),
        image: data.productImage || '/images/placeholder.svg',
        url: data.productUrl || '/product/' + data.productSlug,
        quantity: quantity,
      });
    }
    saveCart(cart);
    showToast(`${data.productName || 'Item'} added to cart`);
  }

  function removeFromCart(slug) {
    saveCart(getCart().filter(item => item.slug !== slug));
    renderCartPage();
  }

  function updateCartCount() {
    const cart = getCart();
    const total = cart.reduce((sum, item) => sum + item.quantity, 0);
    if (cartCount) cartCount.textContent = total;
  }
  updateCartCount();

  /* ===== Wishlist (localStorage) ===== */
  const wishlistCount = document.querySelector('.wishlist-count');

  function getWishlist() {
    try { return JSON.parse(localStorage.getItem(WISHLIST_KEY) || '[]'); } catch (e) { return []; }
  }
  function saveWishlist(list) {
    localStorage.setItem(WISHLIST_KEY, JSON.stringify(list));
    updateWishlistCount();
    syncWishlistButtons();
  }
  function isWishlisted(slug) {
    return getWishlist().some(item => item.slug === slug);
  }
  function toggleWishlist(data) {
    const list = getWishlist();
    const idx = list.findIndex(item => item.slug === data.productSlug);
    if (idx >= 0) {
      list.splice(idx, 1);
      saveWishlist(list);
      showToast('Removed from wishlist');
      renderWishlistPage();
      return false;
    }
    list.push({
      slug: data.productSlug,
      name: data.productName,
      price: parseFloat(data.productPrice),
      image: data.productImage || '/images/placeholder.svg',
      url: data.productUrl || '/product/' + data.productSlug,
    });
    saveWishlist(list);
    showToast('Added to wishlist');
    renderWishlistPage();
    return true;
  }

  function updateWishlistCount() {
    const total = getWishlist().length;
    if (wishlistCount) wishlistCount.textContent = total;
  }

  function syncWishlistButtons() {
    document.querySelectorAll('.wishlist-btn, .card-wish-btn').forEach(btn => {
      btn.classList.toggle('liked', isWishlisted(btn.dataset.productSlug));
    });
  }

  // Delegated handler so wishlist buttons work even after AJAX re-renders the grid
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.wishlist-btn, .card-wish-btn');
    if (!btn) return;
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(btn.dataset);
    syncWishlistButtons();
  });

  syncWishlistButtons();
  updateWishlistCount();

  /* ===== Cart page hydration ===== */
  const cartItemsEl = document.querySelector('[data-cart-items]');
  const cartEmptyEl = document.querySelector('[data-cart-empty]');
  const cartSummaryEl = document.querySelector('[data-cart-summary]');

  function formatMoney(cents) {
    return '$' + (cents / 100).toFixed(2);
  }

  function renderCartPage() {
    if (!cartItemsEl) return;
    const cart = getCart();
    cartItemsEl.innerHTML = '';
    cartEmptyEl.classList.toggle('is-hidden', cart.length > 0);

    cart.forEach(item => {
      const row = document.createElement('article');
      row.className = 'cart-item';
      row.innerHTML = `
        <img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.name)}" loading="lazy">
        <div>
          <a class="cart-item-name" href="${escapeHtml(item.url)}">${escapeHtml(item.name)}</a>
          <div class="cart-item-meta">SKU ${escapeHtml(item.slug)}</div>
          <div class="cart-qty">
            <label class="visually-hidden" for="qty-${escapeHtml(item.slug)}">Quantity</label>
            <input id="qty-${escapeHtml(item.slug)}" type="number" min="1" value="${item.quantity}" data-cart-qty="${escapeHtml(item.slug)}">
            <span class="cart-item-price">${formatMoney(item.price * item.quantity)}</span>
          </div>
        </div>
        <button type="button" class="cart-remove" data-cart-remove="${escapeHtml(item.slug)}" aria-label="Remove ${escapeHtml(item.name)}">Remove</button>
      `;
      cartItemsEl.appendChild(row);
    });

    const totalQty = cart.reduce((sum, item) => sum + item.quantity, 0);
    const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    document.querySelector('[data-cart-count]').textContent = totalQty;
    document.querySelector('[data-cart-subtotal]').textContent = formatMoney(subtotal);
    document.querySelector('[data-cart-total]').textContent = formatMoney(subtotal);
  }

  if (cartItemsEl) {
    cartItemsEl.addEventListener('click', (e) => {
      const removeBtn = e.target.closest('[data-cart-remove]');
      if (removeBtn) removeFromCart(removeBtn.dataset.cartRemove);
    });
    cartItemsEl.addEventListener('change', (e) => {
      const input = e.target.closest('[data-cart-qty]');
      if (!input) return;
      const cart = getCart();
      const item = cart.find(i => i.slug === input.dataset.cartQty);
      if (item) {
        item.quantity = Math.max(1, parseInt(input.value, 10) || 1);
        saveCart(cart);
        renderCartPage();
      }
    });
    document.querySelector('[data-cart-clear]')?.addEventListener('click', () => {
      if (!window.confirm('Clear all items from your cart?')) return;
      saveCart([]);
      renderCartPage();
    });
    document.querySelector('[data-cart-checkout]')?.addEventListener('click', () => {
      showToast('Checkout is not enabled in this demo yet.', 'error');
    });
    renderCartPage();
  }

  /* ===== Wishlist page hydration ===== */
  const wishlistItemsEl = document.querySelector('[data-wishlist-items]');
  const wishlistEmptyEl = document.querySelector('[data-wishlist-empty]');

  function renderWishlistPage() {
    if (!wishlistItemsEl) return;
    const list = getWishlist();
    wishlistItemsEl.innerHTML = '';
    wishlistEmptyEl.classList.toggle('is-hidden', list.length > 0);

    list.forEach(item => {
      const row = document.createElement('article');
      row.className = 'wishlist-item';
      row.innerHTML = `
        <img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.name)}" loading="lazy">
        <div>
          <a class="wishlist-item-name" href="${escapeHtml(item.url)}">${escapeHtml(item.name)}</a>
          <div class="wishlist-item-price">${formatMoney(item.price)}</div>
          <a class="btn btn-primary" style="margin-top: 0.6rem; padding: 8px 16px; font-size: 13px;" href="${escapeHtml(item.url)}">View Product</a>
        </div>
        <button type="button" class="wishlist-remove" data-wishlist-remove="${escapeHtml(item.slug)}" aria-label="Remove ${escapeHtml(item.name)} from wishlist">Remove</button>
      `;
      wishlistItemsEl.appendChild(row);
    });
  }

  if (wishlistItemsEl) {
    wishlistItemsEl.addEventListener('click', (e) => {
      const removeBtn = e.target.closest('[data-wishlist-remove]');
      if (!removeBtn) return;
      const list = getWishlist().filter(i => i.slug !== removeBtn.dataset.wishlistRemove);
      saveWishlist(list);
      renderWishlistPage();
    });
    renderWishlistPage();
  }

  function showToast(message, type = 'success') {
    let toast = document.querySelector('.toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.className = 'toast';
      body.appendChild(toast);

      const style = document.createElement('style');
      style.textContent = `
        .toast {
          position: fixed;
          bottom: 24px;
          left: 50%;
          transform: translateX(-50%) translateY(100px);
          background: var(--color-primary);
          color: var(--color-surface);
          padding: 12px 24px;
          border-radius: 8px;
          z-index: 500;
          opacity: 0;
          transition: all 0.3s ease;
          box-shadow: 0 8px 24px rgba(0,0,0,0.2);
        }
        .toast.show {
          transform: translateX(-50%) translateY(0);
          opacity: 1;
        }
        .toast.success {
          background: var(--color-success);
        }
        .toast.error {
          background: var(--color-error);
        }
      `;
      document.head.appendChild(style);
    }
    toast.textContent = message;
    toast.className = 'toast' + (type === 'success' ? ' success' : type === 'error' ? ' error' : '') ;
    requestAnimationFrame(() => {
      toast.classList.add('show');
    });
    setTimeout(() => {
      toast.classList.remove('show');
    }, 3000);
  }

  /* ===== Copy Link ===== */
  const copyLinkBtn = document.querySelector('.copy-link');
  if (copyLinkBtn) {
    copyLinkBtn.addEventListener('click', async () => {
      const url = copyLinkBtn.dataset.url;
      try {
        await navigator.clipboard.writeText(url);
        showToast('Link copied to clipboard');
      } catch (err) {
        showToast('Could not copy link');
      }
    });
  }

  /* ===== Filter Interactions (dynamic – no page reload) ===== */
  const filterForm = document.querySelector('#filter-form');
  const productGrid = document.querySelector('#product-grid');
  const clearFiltersBtn = document.querySelector('.clear-filters-btn');
  const filterResultInfo = document.querySelector('.results-info');
  const filterPagination = document.querySelector('.pagination');
  const activeFilterCountEl = document.querySelector('#active-filter-count');
  let filterDebounce;

  if (clearFiltersBtn) {
    clearFiltersBtn.addEventListener('click', (e) => {
      e.preventDefault();
      window.location.href = window.location.pathname;
    });
  }

  /* Mobile filter sidebar */
  const openFiltersBtn = document.querySelector('#open-filters-btn');
  const catalogSidebar = document.querySelector('.catalog-sidebar');
  if (openFiltersBtn && catalogSidebar) {
    openFiltersBtn.addEventListener('click', () => {
      catalogSidebar.classList.toggle('active');
    });

    document.addEventListener('click', (e) => {
      if (window.innerWidth <= 768 && catalogSidebar.classList.contains('active')) {
        if (!catalogSidebar.contains(e.target) && !openFiltersBtn.contains(e.target)) {
          catalogSidebar.classList.remove('active');
        }
      }
    });
  }

  /* Grid / list view toggle */
  const viewBtns = document.querySelectorAll('.view-btn');
  if (viewBtns.length > 0 && productGrid) {
    viewBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const view = btn.dataset.view;
        viewBtns.forEach(b => {
          b.classList.toggle('active', b === btn);
          b.setAttribute('aria-pressed', String(b === btn));
        });
        if (view === 'list') {
          productGrid.classList.add('list-view');
        } else {
          productGrid.classList.remove('list-view');
        }
      });
    });
  }

  /* Build a query string from all filter form inputs.
     Price inputs are in DOLLARS on screen – multiply by 100 before sending. */
  function buildFilterQuery(overrides) {
    if (!filterForm) return '';
    const params = new URLSearchParams();
    const fd = new FormData(filterForm);

    // Collect multi-value fields
    const metals = [];
    const gems = [];
    const occasions = [];

    for (const [key, val] of fd.entries()) {
      if (key === 'metalType') metals.push(val);
      else if (key === 'gemstone') gems.push(val);
      else if (key === 'occasion') occasions.push(val);
      else if (key === 'minPrice' || key === 'maxPrice') {
        // Convert dollars → cents
        const cents = Math.round(parseFloat(val) * 100);
        if (!isNaN(cents) && cents > 0) params.set(key, String(cents));
      }
      else if (val) params.set(key, val);
    }

    metals.forEach(m => params.append('metalType', m));
    gems.forEach(g => params.append('gemstone', g));
    occasions.forEach(o => params.append('occasion', o));

    // Apply overrides (sort, page)
    if (overrides) {
      Object.entries(overrides).forEach(([k, v]) => {
        if (v === '' || v === undefined || v === null) params.delete(k);
        else params.set(k, v);
      });
    }

    const qs = params.toString();
    // Update URL without reload
    const newUrl = window.location.pathname + (qs ? '?' + qs : '');
    history.replaceState(null, '', newUrl);
    return qs;
  }

  /* Fetch and render filtered products */
  async function fetchFilteredProducts(overrides) {
    const qs = buildFilterQuery(overrides);
    const baseUrl = filterForm ? filterForm.getAttribute('action') : window.location.pathname;
    try {
      const resp = await fetch(baseUrl + '?' + qs, {
        headers: { 'Accept': 'application/json' },
      });
      if (!resp.ok) throw new Error('Network response was not ok');
      const data = await resp.json();
      renderFilteredResults(data);
    } catch (err) {
      console.error('Filter fetch error:', err);
    }
  }

  function renderFilteredResults(data) {
    if (!productGrid) return;
    const products = data.products || [];

    if (products.length === 0) {
      productGrid.innerHTML = `
        <div class="no-results">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/><line x1="12" y1="8" x2="12" y2="12"/></svg>
          <h3>No products found</h3>
          <p>Try adjusting your filters or search terms</p>
        </div>`;
    } else {
      productGrid.innerHTML = products.map(p => renderProductCard(p)).join('');
      syncWishlistButtons();
    }

    if (filterResultInfo) {
      filterResultInfo.innerHTML = `<span>${products.length} of ${data.pagination?.total || products.length} products</span>`;
    }

    // Render pagination
    if (filterPagination && data.pagination && data.pagination.totalPages > 1) {
      const pag = data.pagination;
      let html = '';
      if (pag.hasPrev) {
        html += `<button class="page-btn" data-page="${pag.page - 1}" aria-label="Previous page">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><polyline points="15 18 9 12 15 6"/></svg>
        </button>`;
      }
      const start = Math.max(1, pag.page - 2);
      const end = Math.min(pag.totalPages, pag.page + 2);
      html += '<div class="page-numbers">';
      for (let i = start; i <= end; i++) {
        html += `<button class="page-btn ${i === pag.page ? 'active' : ''}" data-page="${i}" aria-label="Page ${i}" ${i === pag.page ? 'aria-current="page"' : ''}>${i}</button>`;
      }
      html += '</div>';
      if (pag.hasNext) {
        html += `<button class="page-btn" data-page="${pag.page + 1}" aria-label="Next page">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><polyline points="9 18 15 12 9 6"/></svg>
        </button>`;
      }
      filterPagination.innerHTML = html;
    } else if (filterPagination) {
      filterPagination.innerHTML = '';
    }

    // Update active filter count badge
    if (activeFilterCountEl) {
      const params = new URLSearchParams(window.location.search);
      let count = 0;
      if (params.get('category')) count++;
      if (params.getAll('metalType').length) count++;
      if (params.getAll('gemstone').length) count++;
      if (params.getAll('occasion').length) count++;
      if (params.get('minPrice')) count++;
      if (params.get('maxPrice')) count++;
      if (params.get('isNew')) count++;
      if (params.get('isBestSeller')) count++;
      if (params.get('q')) count++;
      activeFilterCountEl.textContent = count;
    }
  }

  /* Render a single product card (matches product-card.ejs markup) */
  function renderProductCard(p) {
    const img = (p.mainImage && p.mainImage.url) || '/images/placeholder.svg';
    const alt = (p.mainImage && p.mainImage.alt) || p.name;
    const price = formatMoney(p.price);
    const compareAt = p.compareAtPrice && p.compareAtPrice > p.price ? formatMoney(p.compareAtPrice) : '';
    const discount = p.discountPercent || 0;

    return `
      <article class="product-card" role="listitem" data-product-id="${p._id}">
        <button type="button" class="card-wish-btn"
                data-product-slug="${escapeHtml(p.slug)}"
                data-product-name="${escapeHtml(p.name)}"
                data-product-price="${p.price}"
                data-product-image="${escapeHtml(img)}"
                data-product-url="/product/${escapeHtml(p.slug)}"
                aria-label="Toggle wishlist for ${escapeHtml(p.name)}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
          </svg>
        </button>
        <a href="/product/${escapeHtml(p.slug)}" class="product-link" aria-label="${escapeHtml(p.name)} - ${price}">
          <div class="product-image-wrapper">
            <img src="${escapeHtml(img)}" alt="${escapeHtml(alt)}" loading="lazy" width="400" height="500" class="product-image">
            ${p.isNew ? '<span class="product-badge badge-new" aria-label="New arrival">New</span>' : ''}
            ${!p.isNew && p.isBestSeller ? '<span class="product-badge badge-bestseller" aria-label="Best seller">Bestseller</span>' : ''}
            ${compareAt ? `<span class="product-badge badge-sale" aria-label="${discount}% off">-${discount}%</span>` : ''}
          </div>
          <div class="product-info">
            <p class="product-category">${escapeHtml(p.category?.name || 'Jewelry')}</p>
            <h3 class="product-name">${escapeHtml(p.name)}</h3>
            <div class="product-price">
              <span class="current-price">${price}</span>
              ${compareAt ? `<span class="original-price">${compareAt}</span>` : ''}
            </div>
          </div>
        </a>
        <button class="quick-add-btn" aria-label="Quick add ${escapeHtml(p.name)} to cart" data-product-slug="${escapeHtml(p.slug)}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
        </button>
      </article>`;
  }

  /* --- Attach live-change listeners to all filter inputs --- */
  if (filterForm) {
    // Prevent default form submit (full page reload)
    filterForm.addEventListener('submit', (e) => e.preventDefault());

    // Checkboxes & radios → update on change
    filterForm.querySelectorAll('input[type="checkbox"], input[type="radio"]').forEach(input => {
      input.addEventListener('change', () => {
        clearTimeout(filterDebounce);
        filterDebounce = setTimeout(() => fetchFilteredProducts({ page: 1 }), 50);
      });
    });

    // Price inputs → debounced update (user types in dollars)
    const minPriceInput = filterForm.querySelector('#min-price');
    const maxPriceInput = filterForm.querySelector('#max-price');
    [minPriceInput, maxPriceInput].forEach(input => {
      if (!input) return;
      input.addEventListener('input', () => {
        clearTimeout(filterDebounce);
        filterDebounce = setTimeout(() => fetchFilteredProducts({ page: 1 }), 400);
      });
    });
  }

  // Sort select → dynamic
  const sortSelect = document.querySelector('#sort-select');
  if (sortSelect) {
    sortSelect.addEventListener('change', () => {
      fetchFilteredProducts({ sort: sortSelect.value, page: 1 });
    });
  }

  // Pagination clicks (delegated – handles server-rendered <a> links and
  // AJAX-rendered <button>s)
  if (filterPagination) {
    filterPagination.addEventListener('click', (e) => {
      const btn = e.target.closest('.page-btn, .pagination a, .page-numbers a, [data-page]');
      if (!btn) return;
      e.preventDefault();
      let page = btn.dataset ? btn.dataset.page : null;
      if (!page) {
        const href = btn.getAttribute && btn.getAttribute('href');
        if (href) page = new URL(href, window.location.origin).searchParams.get('page');
      }
      if (page) {
        fetchFilteredProducts({ page });
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
  }

  /* ===== FAQ Interactions ===== */
  const faqQuestions = document.querySelectorAll('.faq-question');
  if (faqQuestions.length > 0) {
    faqQuestions.forEach(question => {
      question.addEventListener('click', () => {
        const answer = document.getElementById(question.getAttribute('aria-controls'));
        const isExpanded = question.getAttribute('aria-expanded') === 'true';
        question.setAttribute('aria-expanded', String(!isExpanded));
        if (answer) answer.hidden = isExpanded;
      });
    });

    const faqSearch = document.querySelector('#faq-search');
    if (faqSearch) {
      faqSearch.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();
        document.querySelectorAll('.faq-item').forEach(item => {
          const text = item.textContent.toLowerCase();
          item.style.display = text.includes(query) ? '' : 'none';
        });
      });
    }

    const faqCatBtns = document.querySelectorAll('.faq-cat-btn');
    if (faqCatBtns.length > 0) {
      faqCatBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          const category = btn.dataset.category;
          faqCatBtns.forEach(b => b.classList.toggle('active', b === btn));
          document.querySelectorAll('.faq-item').forEach(item => {
            const itemCat = item.dataset.category || 'general';
            item.style.display = category === 'all' || itemCat === category ? '' : 'none';
          });
        });
      });
    }
  }

  /* ===== Lazy Loading Images ===== */
  if ('loading' in HTMLImageElement.prototype) {
    document.querySelectorAll('[loading="lazy"]').forEach(img => {
      if (img.dataset.src) {
        img.addEventListener('load', () => {
          img.classList.add('loaded');
        });
      }
    });
  } else {
    const lazyImages = document.querySelectorAll('img[loading="lazy"]');
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target;
            if (img.dataset.src) {
              img.src = img.dataset.src;
            }
            observer.unobserve(img);
          }
        });
      }, { rootMargin: '200px' });
      lazyImages.forEach(img => observer.observe(img));
    }
  }

  /* ===== Contact Form: client-side validation (server re-validates on POST) ===== */
  const contactForms = document.querySelectorAll('.contact-form');
  contactForms.forEach(form => {
    form.addEventListener('submit', (e) => {
      const rules = [
        ['firstName', v => v ? '' : 'First name is required.'],
        ['lastName', v => v ? '' : 'Last name is required.'],
        ['email', v => (v && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) ? '' : 'Please enter a valid email address.'],
        ['subject', v => v ? '' : 'Please choose a subject.'],
        ['message', v => v ? '' : 'Please enter a message.'],
      ];
      let firstBad = null;
      rules.forEach(([name, test]) => {
        const input = form.querySelector(`[name="${name}"]`);
        if (!input) return;
        const message = test((input.value || '').trim());
        const field = input.closest('.form-group');
        let errorEl = field ? field.querySelector('.field-error') : null;
        if (message) {
          if (!errorEl) {
            errorEl = document.createElement('span');
            errorEl.className = 'field-error';
            field.appendChild(errorEl);
          }
          errorEl.textContent = message;
          input.classList.add('is-invalid');
          input.setAttribute('aria-invalid', 'true');
          if (!firstBad) firstBad = input;
        } else if (errorEl) {
          errorEl.remove();
          input.classList.remove('is-invalid');
          input.removeAttribute('aria-invalid');
        }
      });
      if (firstBad) {
        e.preventDefault();
        firstBad.focus();
        return;
      }
    });
  });

  /* ===== Newsletter Forms ===== */
  document.querySelectorAll('.newsletter-form, .newsletter-form-large').forEach(form => {
    const input = form.querySelector('input[type="email"]');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!input || !input.value.trim()) return;
      try {
        const csrfField = form.querySelector('input[name="_csrf"]');
        const response = await fetch('/newsletter/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: input.value.trim(),
            _csrf: csrfField ? csrfField.value : '',
          }),
        });
        const data = await response.json();
        if (data.success) {
          showToast('Thanks for subscribing!');
          form.reset();
        } else {
          showToast(data.error || 'Unable to subscribe', 'error');
        }
      } catch (err) {
        showToast('Something went wrong. Please try again.', 'error');
      }
    });
  });

  /* ===== Utility Functions ===== */
  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
})();