(function () {
  'use strict';

  const PAGE_KEY = encodeURIComponent(location.origin + location.pathname + location.search);
  const STATIC_KEY = 'autosave_static:' + PAGE_KEY;
  const DYNAMIC_KEY = 'autosave_generated:' + PAGE_KEY;
  const SAVE_DELAY = 120;

  function debounce(fn, wait) {
    let t;
    return function (...args) {
      clearTimeout(t);
      t = setTimeout(() => fn.apply(this, args), wait);
    };
  }

  function readStored(key) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  function writeStored(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.warn('Autosave: could not write to localStorage', e);
    }
  }

  function cssEscapeValue(v) {
    if (window.CSS && typeof CSS.escape === 'function') return CSS.escape(v);
    return String(v).replace(/["\\]/g, '\\$&');
  }

  function getState(el) {
    if (!el) return null;

    if (el.isContentEditable) return el.innerHTML;

    if (el.tagName === 'SELECT') return el.value;
    if (el.tagName === 'TEXTAREA') return el.value;

    if (el.tagName === 'INPUT') {
      switch (el.type) {
        case 'checkbox':
        case 'radio':
          return el.checked;
        default:
          return el.value;
      }
    }

    if (el.tagName === 'BUTTON' && el.hasAttribute('aria-pressed')) {
      return el.getAttribute('aria-pressed') === 'true';
    }

    return null;
  }

  function setState(el, state) {
    if (!el || state == null) return;

    if (el.isContentEditable) {
      el.innerHTML = state;
      return;
    }

    if (el.tagName === 'SELECT' || el.tagName === 'TEXTAREA') {
      el.value = state;
      return;
    }

    if (el.tagName === 'INPUT') {
      switch (el.type) {
        case 'checkbox':
        case 'radio':
          el.checked = !!state;
          break;
        default:
          el.value = String(state);
      }
      return;
    }

    if (el.tagName === 'BUTTON' && el.hasAttribute('aria-pressed')) {
      if (state) el.setAttribute('aria-pressed', 'true');
      else el.removeAttribute('aria-pressed');
    }
  }

  function nthOfType(el) {
    const tag = el.tagName;
    const parent = el.parentElement;
    if (!parent) return 1;

    const siblings = Array.from(parent.children).filter(n => n.tagName === tag);
    return siblings.indexOf(el) + 1;
  }

  function cssPath(el) {
    const parts = [];
    let node = el;

    while (node && node.nodeType === 1 && node !== document.body) {
      let part = node.tagName.toLowerCase();

      if (node.id) {
        part += '#' + cssEscapeValue(node.id);
        parts.unshift(part);
        break;
      }

      part += `:nth-of-type(${nthOfType(node)})`;
      parts.unshift(part);
      node = node.parentElement;
    }

    parts.unshift('body');
    return parts.join(' > ');
  }

  function makeStaticKey(el) {
    if (!el || el.nodeType !== 1) return null;

    const existing = el.getAttribute('data-autosave-key');
    if (existing) return existing;

    if (el.id && String(el.id).trim() !== '') {
      return 'id:' + el.id.trim();
    }

    const name = el.getAttribute('name');
    if (name && String(name).trim() !== '') {
      return 'name:' + el.tagName.toLowerCase() + ':' + name.trim();
    }

    const aria = el.getAttribute('aria-label');
    if (aria && String(aria).trim() !== '') {
      return 'aria:' + el.tagName.toLowerCase() + ':' + aria.trim();
    }

    return 'path:' + cssPath(el);
  }

  function findByStaticKey(key) {
    if (!key) return null;

    if (key.startsWith('id:')) {
      return document.getElementById(key.slice(3));
    }

    if (key.startsWith('name:')) {
      const rest = key.slice(5);
      const idx = rest.indexOf(':');
      if (idx !== -1) {
        const tag = rest.slice(0, idx);
        const name = rest.slice(idx + 1);
        return document.querySelector(`${tag}[name="${cssEscapeValue(name)}"]`);
      }
    }

    if (key.startsWith('aria:')) {
      const rest = key.slice(5);
      const idx = rest.indexOf(':');
      if (idx !== -1) {
        const tag = rest.slice(0, idx);
        const aria = rest.slice(idx + 1);
        return document.querySelector(`${tag}[aria-label="${cssEscapeValue(aria)}"]`);
      }
    }

    if (key.startsWith('path:')) {
      try {
        return document.querySelector(key.slice(5));
      } catch (_) {
        return null;
      }
    }

    return document.querySelector(`[data-autosave-key="${cssEscapeValue(key)}"]`);
  }

  function snapshotStatic() {
    const els = document.querySelectorAll('input:not([type=password]), textarea, select, [contenteditable], button[aria-pressed]');
    return Array.from(els)
      .map(el => {
        const state = getState(el);
        if (state == null) return null;
        return { key: makeStaticKey(el), state };
      })
      .filter(Boolean);
  }

  function restoreStatic() {
    const arr = readStored(STATIC_KEY);
    if (!Array.isArray(arr) || arr.length === 0) return;

    arr.forEach(item => {
      if (!item || typeof item !== 'object') return;
      const key = String(item.key || '').trim();
      if (!key) return;

      const el = findByStaticKey(key);
      if (el) {
        setState(el, item.state);
        el.dispatchEvent(
          new CustomEvent('autosave:restored', {
            bubbles: true,
            detail: { state: item.state, key }
          })
        );
      }
    });
  }

  function saveNowStatic() {
    writeStored(STATIC_KEY, snapshotStatic());
  }

  const saveDebouncedStatic = debounce(saveNowStatic, SAVE_DELAY);

  function snapshotDynamic() {
    const cont = document.getElementById('generated');
    if (!cont) return [];

    return Array.from(cont.children).map((el, index) => ({
      slot: index,
      label: (el.textContent || '').trim(),
      pressed: el.getAttribute('aria-pressed') === 'true'
    }));
  }

  function saveNowDynamic() {
    writeStored(DYNAMIC_KEY, snapshotDynamic());
  }

  const saveDebouncedDynamic = debounce(saveNowDynamic, SAVE_DELAY);

  function applyDynamicButton(el, item) {
    if (!el || !item) return;

    const label = String(item.label || '').trim();
    if (label !== '') el.textContent = label;

    if (item.pressed) el.setAttribute('aria-pressed', 'true');
    else el.removeAttribute('aria-pressed');

    if (!el.dataset.autosaveToggleAttached) {
      el.addEventListener('click', () => {
        el.toggleAttribute('aria-pressed');
        saveDebouncedDynamic();
      });
      el.dataset.autosaveToggleAttached = '1';
    }
  }

  function restoreDynamic() {
    const cont = document.getElementById('generated');
    if (!cont) return;

    const arr = readStored(DYNAMIC_KEY);
    if (!Array.isArray(arr) || arr.length === 0) return;

    const children = Array.from(cont.children);

    arr.forEach(item => {
      if (!item || typeof item !== 'object') return;

      let el = children[item.slot];

      if (!el || el.tagName !== 'BUTTON') {
        el = children.find(c => (c.textContent || '').trim() === String(item.label || '').trim()) || null;
      }

      if (el) {
        applyDynamicButton(el, item);
      } else {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'gen-btn';
        b.textContent = String(item.label || '').trim();

        if (item.pressed) b.setAttribute('aria-pressed', 'true');

        b.addEventListener('click', () => {
          b.toggleAttribute('aria-pressed');
          saveDebouncedDynamic();
        });
        b.dataset.autosaveToggleAttached = '1';

        cont.appendChild(b);
      }
    });

    saveNowDynamic();
  }

  function observeGenerated() {
    const cont = document.getElementById('generated');
    if (!cont) return;

    const mo = new MutationObserver(() => {
      saveDebouncedDynamic();
    });

    mo.observe(cont, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: ['aria-pressed', 'class', 'id', 'data-autosave-key']
    });
  }

  function initSaveListeners() {
    document.addEventListener('input', saveDebouncedStatic, true);
    document.addEventListener('change', saveDebouncedStatic, true);

    document.addEventListener('click', e => {
      const btn = e.target && e.target.closest ? e.target.closest('#generated button, button[aria-pressed]') : null;
      if (btn) saveDebouncedDynamic();
    }, true);
  }

  let restoreQueued = false;
  function queueRestore() {
    if (restoreQueued) return;
    restoreQueued = true;

    requestAnimationFrame(() => {
      restoreStatic();
      restoreDynamic();
      observeGenerated();
      restoreQueued = false;
    });
  }

  function init() {
    try {
      initSaveListeners();
      queueRestore();
    } catch (e) {
      console.error('Autosave: unexpected error', e);
    }

    window.addEventListener('beforeunload', () => {
      saveNowStatic();
      saveNowDynamic();
    });
  }

  if (document.readyState !== 'loading') {
    init();
  } else {
    document.addEventListener('DOMContentLoaded', init);
  }

  document.addEventListener('dextools:loaded', queueRestore);

  window.__autosave_force_restore_generated = restoreDynamic;
  window.__autosave_force_restore_static = restoreStatic;
})();
