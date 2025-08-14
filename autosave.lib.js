(function () {
  'use strict';

  const STORAGE_PREFIX = 'autosave-';
  const FIELD_KEY_PREFIX = STORAGE_PREFIX + 'field:';
  const RADIO_KEY_PREFIX = STORAGE_PREFIX + 'radio:';
  const GENERATED_BTN_KEY = STORAGE_PREFIX + 'generated-buttons:';
  const SAVE_DEBOUNCE_MS = 250;
  const GEN_SAVE_DEBOUNCE_MS = 400;

  // --------- Utilities ----------
  function pageKey() {
    return encodeURIComponent(location.origin + location.pathname + location.search);
  }

  function debounce(fn, wait) {
    let t;
    return function (...args) {
      clearTimeout(t);
      t = setTimeout(() => fn.apply(this, args), wait);
    };
  }

  function safeJSONParse(str, fallback = null) {
    try { return JSON.parse(str); } catch (e) { return fallback; }
  }

  function cssPath(el) {
    if (!el || el.nodeType !== 1) return '';
    const parts = [];
    let node = el;
    while (node && node.nodeType === 1 && node.tagName.toLowerCase() !== 'html') {
      const tag = node.tagName.toLowerCase();
      let idx = 1;
      let sib = node;
      while (sib.previousElementSibling) {
        sib = sib.previousElementSibling;
        if (sib.tagName.toLowerCase() === tag) idx++;
      }
      parts.unshift(`${tag}:nth-of-type(${idx})`);
      node = node.parentElement;
    }
    parts.unshift('html');
    return parts.join(' > ');
  }

  function storageKeyForElement(el) {
    return FIELD_KEY_PREFIX + pageKey() + ':' + cssPath(el);
  }
  function storageKeyForRadio(name) {
    return RADIO_KEY_PREFIX + pageKey() + ':' + String(name);
  }
  function storageKeyForGenerated(containerIdOrSelector) {
    const suffix = containerIdOrSelector ? ':' + containerIdOrSelector : '';
    return GENERATED_BTN_KEY + pageKey() + suffix;
  }

  // --------- Editable detection (no manual perms) ----------
  function isElementEditable(el) {
    if (!el || el.nodeType !== 1) return false;
    // contenteditable true => editable
    if (el.isContentEditable) return true;
    const tag = el.tagName.toLowerCase();
    if (tag === 'textarea') {
      return !el.disabled && !el.readOnly;
    }
    if (tag === 'select') {
      return !el.disabled;
    }
    if (tag === 'input') {
      const t = (el.type || '').toLowerCase();
      if (t === 'hidden' || t === 'button' || t === 'submit' || t === 'reset' || t === 'image') return false;
      // radios/checkboxes: editable if not disabled
      return !el.disabled && !el.readOnly;
    }
    return false;
  }

  // For radios: group is editable if any radio in group is not disabled
  function isRadioGroupEditable(name) {
    if (!name) return false;
    const group = document.querySelectorAll(`input[type="radio"][name="${CSS.escape ? CSS.escape(name) : name}"]`);
    return Array.from(group).some(r => !r.disabled && !r.readOnly);
  }

  // --------- Field save/restore ----------
  function saveFieldValue(el) {
    try {
      const key = storageKeyForElement(el);
      if (!key) return;
      if (el.type === 'checkbox') {
        localStorage.setItem(key, el.checked ? 'true' : 'false');
      } else if (el.type === 'radio') {
        const name = el.name;
        if (!name) return;
        const groupKey = storageKeyForRadio(name);
        const selected = document.querySelector(`input[type="radio"][name="${CSS.escape ? CSS.escape(name) : name}"]:checked`);
        if (selected) localStorage.setItem(groupKey, selected.value);
      } else if (el.tagName.toLowerCase() === 'select') {
        localStorage.setItem(key, el.value);
      } else if (el.isContentEditable) {
        localStorage.setItem(key, el.innerHTML);
      } else {
        localStorage.setItem(key, el.value);
      }
    } catch (e) {
      console.warn('Autosave: save failed', e);
    }
  }

  function restoreFieldValue(el) {
    try {
      const key = storageKeyForElement(el);
      if (!key) return;
      if (el.type === 'checkbox') {
        const saved = localStorage.getItem(key);
        if (saved !== null) el.checked = saved === 'true';
      } else if (el.type === 'radio') {
        const name = el.name;
        if (!name) return;
        const savedValue = localStorage.getItem(storageKeyForRadio(name));
        if (savedValue !== null && el.value === savedValue) el.checked = true;
      } else if (el.tagName.toLowerCase() === 'select') {
        const saved = localStorage.getItem(key);
        if (saved !== null) el.value = saved;
      } else if (el.isContentEditable) {
        const saved = localStorage.getItem(key);
        if (saved !== null) el.innerHTML = saved;
      } else {
        const saved = localStorage.getItem(key);
        if (saved !== null) el.value = saved;
      }
    } catch (e) {
      console.warn('Autosave: restore failed', e);
    }
  }

  // --------- Init fields and dynamic hookup ----------
  const debouncedSaveMap = new WeakMap();
  function initField(el) {
    if (!el || el.nodeType !== 1) return;
    if (!isElementEditable(el)) return;

    restoreFieldValue(el);

    const saver = debounce(() => saveFieldValue(el), SAVE_DEBOUNCE_MS);
    debouncedSaveMap.set(el, saver);

    el.addEventListener('input', saver, { passive: true });
    el.addEventListener('change', saver, { passive: true });
    if (el.isContentEditable) el.addEventListener('blur', saver, { passive: true });
  }

  function initAllFields(root = document) {
    try {
      const selector = 'input:not([type=hidden]):not([data-autosave="off"]), textarea:not([data-autosave="off"]), select:not([data-autosave="off"]), [contenteditable="true"]:not([data-autosave="off"])';
      const nodes = root.querySelectorAll(selector);
      nodes.forEach(node => {
        // For radios, initialize only if group editable
        if (node.type === 'radio') {
          if (isRadioGroupEditable(node.name)) initField(node);
        } else {
          if (isElementEditable(node)) initField(node);
        }
      });
    } catch (e) {
      console.warn('Autosave: initAllFields failed', e);
    }
  }

  // --------- Generated buttons persistence conditioned on Add+Clear controls ----------
  function findGeneratedContainer() {
    let el = document.getElementById('generated');
    if (el) return el;
    el = document.querySelector('[data-autosave-generated]');
    if (el) return el;
    return null;
  }

  function guessAddControl() {
    // look for common patterns
    return document.querySelector(
      '#addBtn, [data-action="add"], [data-add], button[title="Add"], button[aria-label*="add"], button:where(:not([disabled])):where(:is(.add, .add-btn, [data-add-btn]))'
    ) || Array.from(document.querySelectorAll('button:not([disabled])')).find(b => /^\s*(?:\+|add|new)\s*$/i.test(b.textContent));
  }
  function guessClearControl() {
    return document.querySelector(
      '#clearBtn, [data-action="clear"], [data-clear], button[title="Clear"], button[aria-label*="clear"], button:where(:not([disabled])):where(:is(.clear, .clear-btn, [data-clear-btn]))'
    ) || Array.from(document.querySelectorAll('button:not([disabled])')).find(b => /\b(clear|clear all|remove all)\b/i.test(b.textContent));
  }

  function isAddClearAvailable() {
    const a = guessAddControl();
    const c = guessClearControl();
    return !!(a && c);
  }

  function createGeneratedButton(label, container) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'gen-btn';
    btn.textContent = label;
    btn.addEventListener('click', () => {
      btn.toggleAttribute('aria-pressed');
      btn.style.boxShadow = btn.hasAttribute('aria-pressed') ? '0 4px 10px rgba(2,6,23,0.08)' : '';
    });
    container.appendChild(btn);
    return btn;
  }

  function saveGeneratedStateIfAllowed(container) {
    if (!container) return;
    if (!isAddClearAvailable()) return; // only save if both controls are present
    const labels = Array.from(container.children)
      .filter(c => c.nodeType === 1 && (c.tagName.toLowerCase() === 'button' || c.matches?.('.gen-btn')))
      .map(b => b.textContent || '');
    const skey = storageKeyForGenerated(container.id || 'generated');
    try { localStorage.setItem(skey, JSON.stringify(labels)); } catch (e) { console.warn('Autosave: save generated failed', e); }
  }
  const debouncedSaveGenerated = debounce(saveGeneratedStateIfAllowed, GEN_SAVE_DEBOUNCE_MS);

  function restoreGeneratedState(container) {
    if (!container) return;
    // Only restore if both add and clear available (otherwise don't create UI the user can't manage)
    if (!isAddClearAvailable()) return;
    const skey = storageKeyForGenerated(container.id || 'generated');
    const raw = localStorage.getItem(skey);
    const arr = safeJSONParse(raw, []);
    if (!Array.isArray(arr)) return;
    // Clear and restore
    while (container.firstChild) container.removeChild(container.firstChild);
    arr.forEach(label => {
      try { createGeneratedButton(label, container); } catch (e) { /* ignore */ }
    });
  }

  // --------- Mutation observers for dynamic fields and add/clear appearance ----------
  let genObserver = null;
  function observeGeneratedContainer(container) {
    if (!container) return;
    // restore if allowed now
    restoreGeneratedState(container);
    // disconnect existing
    if (genObserver) {
      try { genObserver.disconnect(); } catch (e) { /* ignore */ }
    }
    genObserver = new MutationObserver(muts => {
      for (const m of muts) {
        if (m.type === 'childList') {
          debouncedSaveGenerated(container);
          break;
        }
      }
    });
    genObserver.observe(container, { childList: true });
  }

  function monitorAddClearAndGenerated() {
    const container = findGeneratedContainer();

    // Observe document for appearance/disappearance of add/clear controls
    const acObserver = new MutationObserver(() => {
      const allowed = isAddClearAvailable();
      if (allowed) {
        // if allowed now, ensure container is observed and restored
        if (container) observeGeneratedContainer(container);
      } else {
        // if not allowed now, don't save generated (we simply stop saving by not calling save)
        // (we do not delete stored entries — user can regain them when controls appear)
        if (genObserver) {
          try { genObserver.disconnect(); } catch (e) { /* ignore */ }
          genObserver = null;
        }
      }
    });

    acObserver.observe(document.documentElement || document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['id', 'class', 'data-action', 'disabled', 'data-add', 'data-clear']
    });

    // run immediately once
    if (isAddClearAvailable() && container) observeGeneratedContainer(container);
  }

  // --------- bootstrap ----------
  function bootstrapAutosave() {
    // init existing fields that are editable
    initAllFields(document);

    // Observe DOM for newly added fields and init them
    const fieldObserver = new MutationObserver(mutations => {
      for (const m of mutations) {
        if (m.type === 'childList' && m.addedNodes.length) {
          m.addedNodes.forEach(node => {
            if (node.nodeType !== 1) return;
            initAllFields(node);
          });
        }
        if (m.type === 'attributes' && (m.attributeName === 'disabled' || m.attributeName === 'readonly' || m.attributeName === 'contenteditable' || m.attributeName === 'data-autosave')) {
          initField(m.target);
        }
      }
    });
    fieldObserver.observe(document.documentElement || document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['disabled', 'readonly', 'contenteditable', 'data-autosave']
    });

    // Monitor add/clear controls and generated container
    monitorAddClearAndGenerated();

    // Restore radios globally (some pages may have radios before individual init)
    try {
      const radios = document.querySelectorAll('input[type="radio"][name]');
      radios.forEach(r => {
        const name = r.name;
        const saved = localStorage.getItem(storageKeyForRadio(name));
        if (saved !== null) {
          const matched = document.querySelector(`input[type="radio"][name="${CSS.escape ? CSS.escape(name) : name}"][value="${CSS.escape ? CSS.escape(saved) : saved}"]`);
          if (matched) matched.checked = true;
        }
      });
    } catch (e) { /* ignore */ }

    console.info('Autosave: initialized (inferred edit rights).');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootstrapAutosave);
  } else {
    bootstrapAutosave();
  }

})();
