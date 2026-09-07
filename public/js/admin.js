(function () {
  'use strict';

  function createPreview(target, noteId, files) {
    const list = document.getElementById(target);
    const note = noteId ? document.getElementById(noteId) : null;
    if (!list) return;
    list.textContent = '';
    for (const file of files) {
      if (!/^image\//.test(file.type)) continue;
      const li = document.createElement('li');
      const img = document.createElement('img');
      img.src = URL.createObjectURL(file);
      img.alt = file.name;
      img.title = file.name;
      li.appendChild(img);
      list.appendChild(li);
    }
    if (note) {
      note.textContent = files.length === 0
        ? 'No images selected yet.'
        : (files.length === 1 ? '1 image selected — the first image becomes the main photo.' : `${files.length} images selected — the first image becomes the main photo.`);
    }
  }

  function attachImagePreviews(scope) {
    scope.querySelectorAll('[data-admin-image-upload]').forEach((input) => {
      input.addEventListener('change', function () {
        const target = this.getAttribute('data-admin-image-upload');
        const noteId = this.getAttribute('data-admin-image-note');
        createPreview(target, noteId, this.files);
      });
    });
  }

  function confirmDeletes(scope) {
    scope.querySelectorAll('form[data-confirm]').forEach((form) => {
      form.addEventListener('submit', function (e) {
        const message = this.getAttribute('data-confirm') || 'Are you sure?';
        if (!window.confirm(message)) {
          e.preventDefault();
        }
      });
    });
  }

  function handleSidebarToggle(scope) {
    const burger = scope.querySelector('[data-admin-toggle-sidebar]');
    const sidebar = scope.querySelector('.admin-sidebar');
    if (!burger || !sidebar) return;
    burger.addEventListener('click', () => {
      sidebar.classList.toggle('is-open');
    });
    sidebar.addEventListener('click', (e) => {
      if (e.target.tagName === 'A') sidebar.classList.remove('is-open');
    });
  }

  function autoDismissFlashes(scope) {
    scope.querySelectorAll('.admin-flash').forEach((flash) => {
      setTimeout(() => {
        flash.style.transition = 'opacity 0.4s ease';
        flash.style.opacity = '0';
        setTimeout(() => flash.remove(), 500);
      }, 6000);
    });
  }

  /* ------------ Client-side form validation (mirrored on the server) ------------
     The forms have `novalidate` so the browser tooltip is suppressed in favor of
     consistent inline `.admin-error` messages and `aria-invalid` states. Server-side
     validation (adminProductController.validate / adminSettingsController.validate)
     still runs on submit, since clients can be bypassed. */
  function setFieldError(input, message) {
    const field = input.closest('.admin-field');
    if (!field) return;
    let span = field.querySelector('.admin-error');
    if (message) {
      if (!span) {
        span = document.createElement('span');
        span.className = 'admin-error';
        field.appendChild(span);
      }
      span.textContent = message;
      input.setAttribute('aria-invalid', 'true');
    } else if (span) {
      span.textContent = '';
      input.removeAttribute('aria-invalid');
    }
  }

  const URL_RE = /^https?:\/\/.?/;

  function validateProductForm(form) {
    let firstBad = null;
    const checks = [
      ['name', (v) => v ? null : 'Product name is required.'],
      ['sku', (v) => v ? null : 'SKU is required.'],
      ['category', (v) => v ? null : 'Please select a category.'],
      ['priceUsd', (v) => (v !== '' && parseFloat(v) >= 0) ? null : 'A valid price is required.'],
      ['metalType', (v) => v ? null : 'Please select a metal type.'],
      ['description', (v) => v ? null : 'Description is required.'],
      ['videoUrl', (v) => (!v || URL_RE.test(v)) ? null : 'Video URL must start with http:// or https://'],
    ];
    checks.forEach(([name, test]) => {
      const input = form.querySelector(`[name="${name}"]`);
      if (!input) return;
      const message = test((input.value || '').trim());
      setFieldError(input, message);
      if (message && !firstBad) firstBad = input;
    });
    return firstBad;
  }

  function validateSettingsForm(form) {
    let firstBad = null;
    const checks = [
      ['shopName', (v) => v ? null : 'Shop name is required.'],
      ['email', (v) => (!v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) ? null : 'Please enter a valid email address.'],
      ['instagram', (v) => (!v || URL_RE.test(v)) ? null : 'URL must start with http:// or https://'],
      ['facebook', (v) => (!v || URL_RE.test(v)) ? null : 'URL must start with http:// or https://'],
      ['pinterest', (v) => (!v || URL_RE.test(v)) ? null : 'URL must start with http:// or https://'],
    ];
    checks.forEach(([name, test]) => {
      const input = form.querySelector(`[name="${name}"]`);
      if (!input) return;
      const message = test((input.value || '').trim());
      setFieldError(input, message);
      if (message && !firstBad) firstBad = input;
    });
    return firstBad;
  }

  const VALIDATORS = {
    product: validateProductForm,
    settings: validateSettingsForm,
  };

  function attachFormValidation(scope) {
    scope.querySelectorAll('form[data-validate]').forEach((form) => {
      form.addEventListener('submit', (e) => {
        const validator = VALIDATORS[form.getAttribute('data-validate')];
        if (!validator) return;
        const firstBad = validator(form);
        if (firstBad) {
          e.preventDefault();
          firstBad.focus();
        }
      });
    });
  }

  /* ------------ Category form ------------ */
  function validateSlug(value) {
    return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value);
  }

  function slugify(text) {
    return (text || '').trim().toLowerCase()
      .replace(/'/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  function validateCategoryForm(form) {
    let firstBad = null;
    const name = form.querySelector('[name="name"]');
    const slug = form.querySelector('[name="slug"]');
    if (name && !(name.value || '').trim()) {
      setFieldError(name, 'Category name is required.');
      if (!firstBad) firstBad = name;
    }
    if (slug) {
      const value = (slug.value || '').trim();
      if (!value) {
        setFieldError(slug, 'Slug is required.');
        if (!firstBad) firstBad = slug;
      } else if (!validateSlug(value)) {
        setFieldError(slug, 'Slug can only contain lowercase letters, numbers, and hyphens.');
        if (!firstBad) firstBad = slug;
      }
    }
    return firstBad;
  }

  function attachSlugAutofill(scope) {
    scope.querySelectorAll('[data-slug-source]').forEach((source) => {
      const attr = source.getAttribute('data-slug-target');
      const slug = attr ? (scope.querySelector(`[id="${attr}"]`) || scope.querySelector(`[name="${attr}"]`)) : null;
      if (!slug) return;
      source.addEventListener('input', () => {
        if (slug === document.activeElement) return;
        slug.value = slugify(source.value);
      });
    });
  }

  /* ------------ SKU auto-generate ------------ */
  function attachSkuGenerator(scope) {
    const name = scope.querySelector('[data-sku-name]');
    const field = scope.querySelector('[data-sku-field]');
    const btn = scope.querySelector('[data-sku-generate]');
    if (!name || !field || !btn) return;
    btn.addEventListener('click', () => {
      const base = name.value.trim();
      if (!base) {
        btn.blur();
        window.alert('Type a product name first — the SKU is built from it.');
        name.focus();
        return;
      }
      const cleaned = base.toUpperCase().replace(/[^A-Z0-9]+/g, '-').replace(/^-+|-+$/g, '');
      const stamp = Date.now().toString().slice(-4);
      field.value = `LU-${cleaned.slice(0, 28)}-${stamp}`;
    });
  }

  /* ------------ Product list bulk actions ------------ */
  function attachBulkActions(scope) {
    const form = scope.querySelector('[data-bulk-select]');
    if (!form) return;
    const selects = form.querySelectorAll('input[type="checkbox"][name="ids"]');
    const toggleAll = form.querySelector('[data-check-toggle]');
    const submitBtn = form.querySelector('[data-bulk-submit]');

    if (toggleAll) {
      toggleAll.addEventListener('change', () => {
        selects.forEach((cb) => { cb.checked = toggleAll.checked; });
        updateBulkBar();
      });
    }
    scope.querySelectorAll('[data-check-all]').forEach((btn) => {
      btn.addEventListener('click', () => {
        selects.forEach((cb) => { cb.checked = true; });
        if (toggleAll) toggleAll.checked = true;
        updateBulkBar();
      });
    });
    scope.querySelectorAll('[data-check-none]').forEach((btn) => {
      btn.addEventListener('click', () => {
        selects.forEach((cb) => { cb.checked = false; });
        if (toggleAll) toggleAll.checked = false;
        updateBulkBar();
      });
    });
    selects.forEach((cb) => cb.addEventListener('change', updateBulkBar));

    function updateBulkBar() {
      const any = selects.some((cb) => cb.checked);
      if (submitBtn) submitBtn.disabled = !any;
      if (toggleAll) {
        toggleAll.checked = selects.length > 0 && selects.every((cb) => cb.checked);
      }
    }

    if (submitBtn) {
      submitBtn.disabled = true;
      form.addEventListener('submit', (e) => {
        const action = form.querySelector('[name="action"]');
        const selected = selects.filter((cb) => cb.checked).length;
        if (selected === 0 || !action) {
          e.preventDefault();
          return;
        }
        const labels = { activate: 'activate', hide: 'hide', trash: 'move to trash' };
        const label = labels[action.value] || 'update';
        if (!window.confirm(`Apply "${label}" to ${selected} selected product${selected === 1 ? '' : 's'}?`)) {
          e.preventDefault();
        }
      });
    }
  }

  /* ------------ Media library ------------ */
  function attachMediaCopy(scope) {
    scope.querySelectorAll('[data-copy-url]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const url = btn.getAttribute('data-copy-url');
        try {
          await navigator.clipboard.writeText(url);
          const original = btn.textContent;
          btn.textContent = 'Copied!';
          setTimeout(() => { btn.textContent = original; }, 1400);
        } catch (err) {
          const textarea = document.createElement('textarea');
          textarea.value = url;
          textarea.style.position = 'fixed';
          textarea.style.opacity = '0';
          document.body.appendChild(textarea);
          textarea.select();
          document.execCommand('copy');
          textarea.remove();
          btn.textContent = 'Copied!';
          setTimeout(() => { btn.textContent = 'Copy URL'; }, 1400);
        }
      });
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    attachImagePreviews(document);
    confirmDeletes(document);
    handleSidebarToggle(document);
    autoDismissFlashes(document);
    attachFormValidation(document);
    attachSlugAutofill(document);
    attachSkuGenerator(document);
    attachBulkActions(document);
    attachMediaCopy(document);
  });
})();