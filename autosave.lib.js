// autosave.lib.js
(function () {
  'use strict';

  const STORAGE_PREFIX = 'autosave-';
  const DEFAULT_SELECTOR = 'input, textarea, select, [contenteditable], [data-autosave]';
  const IGNORED_TYPES = new Set(['file', 'password']); // do not persist these
  const ID_PREFIX = 'autosave-id-';

  // safe localStorage wrapper
  function lsSet(key, value) {
    try { localStorage.setItem(key, value); } catch (e) { /* quota / private mode */ }
  }
  function lsGet(key) {
    try { return localStorage.getItem(key); } catch (e) { return null; }
  }

  function ensureId(el) {
    if (!el.id) {
      el.id = ID_PREFIX + Math.random().toString(36).slice(2, 11);
    }
    return el.id;
  }

  function storageKeyFor(el) {
    // radios are grouped by name
    if (el.type === 'radio' && el.name) {
      return STORAGE_PREFIX + 'radio-' + el.name;
    }
    const id = ensureId(el);
    return STORAGE_PREFIX + id;
  }

  function shouldIgnore(el) {
    if (el.dataset && el.dataset.autosave === 'false') return true;
    if (el.hasAttribute && el.hasAttribute('data-autosave-ignore')) return true;
    if (el.classList && el.classList.contains('no-autosave')) return true;
    if (el.tagName) {
      const tag = el.tagName.toLowerCase();
      if (tag === 'input') {
        const t = (el.type || '').toLowerCase();
        if (IGNORED_TYPES.has(t)) return true;
      }
    }
    return false;
  }

  function saveValue(el) {
    if (shouldIgnore(el)) return;
    const key = storageKeyFor(el);

    // contenteditable
    if (el.isContentEditable) {
      // respect developer hint: data-autosave-prop="text|html"
      const prop = el.dataset && el.dataset.autosaveProp;
      const value = (prop === 'text') ? el.textContent : el.innerHTML;
      lsSet(key, JSON.stringify({t: 'ce', v: value}));
      return;
    }

    // inputs & select
    if (el.tagName.toLowerCase() === 'select') {
      if (el.multiple) {
        const vals = Array.from(el.selectedOptions).map(o => o.value);
        lsSet(key, JSON.stringify({t: 'select-multi', v: vals}));
      } else {
        lsSet(key, JSON.stringify({t: 'select', v: el.value}));
      }
      return;
    }

    if (el.type === 'checkbox') {
      lsSet(key, JSON.stringify({t: 'checkbox', v: el.checked}));
      return;
    }

    if (el.type === 'radio') {
      // store the checked radio value for the group
      if (el.name) {
        const selected = document.querySelector(`input[type="radio"][name="${el.name}"]:checked`);
        if (selected) lsSet(STORAGE_PREFIX + 'radio-' + el.name, JSON.stringify({t: 'radio', v: selected.value}));
      }
      return;
    }

    // other inputs/textarea
    if (el.tagName.toLowerCase() === 'input' || el.tagName.toLowerCase() === 'textarea') {
      lsSet(key, JSON.stringify({t: 'text', v: el.value}));
    }

    // generic fallback for custom elements marked with data-autosave
    if (el.hasAttribute && el.hasAttribute('data-autosave') && !el.isContentEditable) {
      // developer may specify property to save e.g. data-autosave-prop="value|text|html|scrollTop"
      const prop = el.dataset && el.dataset.autosaveProp || 'text';
      let v;
      try { v = el[prop]; } catch (e) { v = el.textContent || el.value || ''; }
      lsSet(key, JSON.stringify({t: 'prop', p: prop, v: v}));
    }
  }

  function restoreValue(el) {
    if (shouldIgnore(el)) return;
    const key = storageKeyFor(el);

    // contenteditable
    if (el.isContentEditable) {
      const raw = lsGet(key);
      if (!raw) return;
      try {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.v !== undefined) {
          const prop = el.dataset && el.dataset.autosaveProp;
          if (prop === 'text') el.textContent = parsed.v;
          else el.innerHTML = parsed.v;
        }
      } catch (e) { /* ignore */ }
      return;
    }

    if (el.tagName.toLowerCase() === 'select') {
      const raw = lsGet(key);
      if (!raw) return;
      try {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.t === 'select-multi' && Array.isArray(parsed.v)) {
          Array.from(el.options).forEach(opt => { opt.selected = parsed.v.includes(opt.value); });
        } else if (parsed && parsed.v !== undefined) {
          el.value = parsed.v;
        }
      } catch (e) { /* ignore */ }
      return;
    }

    if (el.type === 'checkbox') {
      const raw = lsGet(key);
      if (!raw) return;
      try { el.checked = JSON.parse(raw).v === true; } catch (e) {}
      return;
    }

    if (el.type === 'radio' && el.name) {
      const raw = lsGet(STORAGE_PREFIX + 'radio-' + el.name);
      if (!raw) return;
      try {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.v !== undefined && el.value === parsed.v) el.checked = true;
      } catch (e) {}
      return;
    }

    if (el.tagName.toLowerCase() === 'input' || el.tagName.toLowerCase() === 'textarea') {
      const raw = lsGet(key);
      if (!raw) return;
      try {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.v !== undefined) el.value = parsed.v;
      } catch (e) {}
      return;
    }

    // custom elements with data-autosave
    if (el.hasAttribute && el.hasAttribute('data-autosave')) {
      const raw = lsGet(key);
      if (!raw) return;
      try {
        const parsed = JSON.parse(raw);
        const prop = el.dataset && el.dataset.autosaveProp || 'text';
        if (parsed && parsed.v !== undefined) {
          try { el[prop] = parsed.v; } catch (e) { /* fallback */ }
        }
      } catch (e) {}
    }
  }

  function initField(el) {
    if (shouldIgnore(el)) return;
    // avoid double-init
    if (el.__autosave_inited) return;
    el.__autosave_inited = true;

    // restore first
    restoreValue(el);

    // attach listeners
    if (el.isContentEditable) {
      el.addEventListener('input', () => saveValue(el));
      el.addEventListener('blur', () => saveValue(el));
      return;
    }

    const tag = el.tagName && el.tagName.toLowerCase();
    if (tag === 'input' || tag === 'textarea') {
      el.addEventListener('input', () => saveValue(el));
      el.addEventListener('change', () => saveValue(el));
      el.addEventListener('blur', () => saveValue(el)); // extra catch
    } else if (tag === 'select') {
      el.addEventListener('change', () => saveValue(el));
    } else {
      // custom data-autosave element
      el.addEventListener('input', () => saveValue(el));
      el.addEventListener('change', () => saveValue(el));
    }
  }

  // scan and init existing elements
  function scanAndInit(root = document) {
    try {
      const nodes = root.querySelectorAll(DEFAULT_SELECTOR);
      nodes.forEach(initField);
    } catch (e) {
      // if root is a single element (not document), try to init root itself if it matches
      if (root.matches && root.matches(DEFAULT_SELECTOR)) initField(root);
    }
  }

  // observe DOM additions so dynamically added editors/fields are picked up
  function watchMutations() {
    const mo = new MutationObserver((records) => {
      for (const r of records) {
        if (r.addedNodes && r.addedNodes.length) {
          r.addedNodes.forEach(node => {
            if (node.nodeType !== 1) return;
            if (node.matches && node.matches(DEFAULT_SELECTOR)) initField(node);
            // also scan descendants
            try { scanAndInit(node); } catch (e) {}
          });
        }
      }
    });
    mo.observe(document.documentElement || document.body, { childList: true, subtree: true });
  }

  // Public API (optional) — script auto-inits, but advanced users can still call these.
  window.AutoSave = {
    scanAndInit,
    saveValue,
    restoreValue,
    storagePrefix: STORAGE_PREFIX
  };

  // auto-init on DOMContentLoaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      scanAndInit(document);
      watchMutations();
    });
  } else {
    scanAndInit(document);
    watchMutations();
  }

})();
