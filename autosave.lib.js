(function () {
  'use strict';

  const STORAGE_PREFIX = 'autosave-';
  const FIELD_KEY_PREFIX = STORAGE_PREFIX + 'field:';
  const RADIO_KEY_PREFIX = STORAGE_PREFIX + 'radio:';
  const GENERATED_BTN_KEY = STORAGE_PREFIX + 'generated-buttons:';
  const SAVE_DEBOUNCE_MS = 250;
  const GEN_SAVE_DEBOUNCE_MS = 300;

  function pageKey() {
    return encodeURIComponent(location.origin + location.pathname + location.search);
  }
  function debounce(fn, wait) {
    let t;
    return function (...args) { clearTimeout(t); t = setTimeout(() => fn.apply(this, args), wait); };
  }
  function safeJSONParse(str, fallback = null) { try { return JSON.parse(str); } catch (e) { return fallback; } }

  function cssPath(el) {
    if (!el || el.nodeType !== 1) return '';
    const parts = [];
    let node = el;
    while (node && node.nodeType === 1 && node.tagName.toLowerCase() !== 'html') {
      const tag = node.tagName.toLowerCase();
      let idx = 1;
      let sib = node;
      while (sib.previousElementSibling) { sib = sib.previousElementSibling; if (sib.tagName.toLowerCase() === tag) idx++; }
      parts.unshift(`${tag}:nth-of-type(${idx})`);
      node = node.parentElement;
    }
    parts.unshift('html');
    return parts.join(' > ');
  }

  function storageKeyForElement(el) { return FIELD_KEY_PREFIX + pageKey() + ':' + cssPath(el); }
  function storageKeyForRadio(name) { return RADIO_KEY_PREFIX + pageKey() + ':' + String(name); }
  function storageKeyForGenerated(containerIdOrSelector) {
    const suffix = containerIdOrSelector ? ':' + containerIdOrSelector : '';
    return GENERATED_BTN_KEY + pageKey() + suffix;
  }

  // ---------------- editable detection ----------------
  function isElementEditable(el) {
    if (!el || el.nodeType !== 1) return false;
    if (el.isContentEditable) return true;
    const tag = el.tagName.toLowerCase();
    if (tag === 'textarea') return !el.disabled && !el.readOnly;
    if (tag === 'select') return !el.disabled;
    if (tag === 'input') {
      const t = (el.type || '').toLowerCase();
      if (t === 'hidden' || t === 'button' || t === 'submit' || t === 'reset' || t === 'image') return false;
      return !el.disabled && !el.readOnly;
    }
    return false;
  }
  function isRadioGroupEditable(name) {
    if (!name) return false;
    const group = document.querySelectorAll(`input[type="radio"][name="${CSS.escape ? CSS.escape(name) : name}"]`);
    return Array.from(group).some(r => !r.disabled && !r.readOnly);
  }

  // ---------------- field save / restore ----------------
  function saveFieldValue(el) {
    try {
      const key = storageKeyForElement(el);
      if (!key) return;
      if (el.type === 'checkbox') localStorage.setItem(key, el.checked ? 'true' : 'false');
      else if (el.type === 'radio') {
        const name = el.name; if (!name) return;
        const selected = document.querySelector(`input[type="radio"][name="${CSS.escape ? CSS.escape(name) : name}"]:checked`);
        if (selected) localStorage.setItem(storageKeyForRadio(name), selected.value);
      } else if (el.tagName.toLowerCase() === 'select') localStorage.setItem(key, el.value);
      else if (el.isContentEditable) localStorage.setItem(key, el.innerHTML);
      else localStorage.setItem(key, el.value);
    } catch (e) { console.warn('Autosave: saveFieldValue failed', e); }
  }

  function restoreFieldValue(el) {
    try {
      const key = storageKeyForElement(el);
      if (!key) return;
      if (el.type === 'checkbox') {
        const saved = localStorage.getItem(key); if (saved !== null) el.checked = saved === 'true';
      } else if (el.type === 'radio') {
        const name = el.name; if (!name) return;
        const saved = localStorage.getItem(storageKeyForRadio(name));
        if (saved !== null && el.value === saved) el.checked = true;
      } else if (el.tagName.toLowerCase() === 'select') {
        const saved = localStorage.getItem(key); if (saved !== null) el.value = saved;
      } else if (el.isContentEditable) {
        const saved = localStorage.getItem(key); if (saved !== null) el.innerHTML = saved;
      } else {
        const saved = localStorage.getItem(key); if (saved !== null) el.value = saved;
      }
    } catch (e) { console.warn('Autosave: restoreFieldValue failed', e); }
  }

  // ---------------- initialize fields ----------------
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
        if (node.type === 'radio') {
          if (isRadioGroupEditable(node.name)) initField(node);
        } else {
          if (isElementEditable(node)) initField(node);
        }
      });
    } catch (e) { console.warn('Autosave: initAllFields failed', e); }
  }

  // ---------------- generated buttons persistence (fixed) ----------------
  function findGeneratedContainer() {
    let el = document.getElementById('generated'); if (el) return el;
    el = document.querySelector('[data-autosave-generated]'); if (el) return el;
    return null;
  }

  function guessAddControl() {
    return document.querySelector('#addBtn, [data-action="add"], [data-add], button[title="Add"], button[aria-label*="add"], button.add, button.add-btn') ||
      Array.from(document.querySelectorAll('button:not([disabled])')).find(b => /^\s*(?:\+|add|new)\s*$/i.test(b.textContent));
  }
  function guessClearControl() {
    return document.querySelector('#clearBtn, [data-action="clear"], [data-clear], button[title="Clear"], button[aria-label*="clear"], button.clear, button.clear-btn') ||
      Array.from(document.querySelectorAll('button:not([disabled])')).find(b => /\b(clear|clear all|remove all)\b/i.test(b.textContent));
  }
  function isAddClearAvailable() { return !!(guessAddControl() && guessClearControl()); }

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

  function saveGeneratedState(container) {
    if (!container) return;
    // ALWAYS save (so user-added buttons are not lost).
    const labels = Array.from(container.children)
      .filter(c => c.nodeType === 1 && (c.tagName.toLowerCase() === 'button' || (c.classList && c.classList.contains('gen-btn'))))
      .map(b => b.textContent || '');
    const skey = storageKeyForGenerated(container.id || 'generated');
    try { localStorage.setItem(skey, JSON.stringify(labels)); } catch (e) { console.warn('Autosave: saveGeneratedState failed', e); }
  }
  const debouncedSaveGenerated = debounce(saveGeneratedState, GEN_SAVE_DEBOUNCE_MS);

  function restoreGeneratedStateIfAllowed(container) {
    if (!container) return;
    // Only restore *into the DOM* if user has both controls present (so UI remains manageable).
    if (!isAddClearAvailable()) return;
    const skey = storageKeyForGenerated(container.id || 'generated');
    const raw = localStorage.getItem(skey);
    const arr = safeJSONParse(raw, []);
    if (!Array.isArray(arr) || arr.length === 0) return;
    // Replace container children with restored buttons
    while (container.firstChild) container.removeChild(container.firstChild);
    arr.forEach(label => { try { createGeneratedButton(label, container); } catch (e) { /* ignore */ } });
  }

  // If saved data exists but Add/Clear aren't present yet, wait and restore when they do.
  function waitUntilControlsThenRestore(container) {
    if (!container) return;
    const skey = storageKeyForGenerated(container.id || 'generated');
    const raw = localStorage.getItem(skey);
    const arr = safeJSONParse(raw, []);
    if (!Array.isArray(arr) || arr.length === 0) return;
    // If controls exist, restore now
    if (isAddClearAvailable()) { restoreGeneratedStateIfAllowed(container); return; }
    // Otherwise observe for controls appearing
    const controlObserver = new MutationObserver(() => {
      if (isAddClearAvailable()) {
        controlObserver.disconnect();
        restoreGeneratedStateIfAllowed(container);
      }
    });
    controlObserver.observe(document.documentElement || document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['id', 'class', 'data-action', 'data-add', 'data-clear', 'disabled'] });
    // safety: stop observing after 30s
    setTimeout(() => { try { controlObserver.disconnect(); } catch (e) {} }, 30000);
  }

  let genObserver = null;
  function observeGeneratedContainer(container) {
    if (!container) return;
    // restore now if possible, or wait for controls to restore later
    restoreGeneratedStateIfAllowed(container);
    waitUntilControlsThenRestore(container);

    // disconnect previous observer
    if (genObserver) {
      try { genObserver.disconnect(); } catch (e) {}
    }
    genObserver = new MutationObserver(muts => {
      for (const m of muts) {
        if (m.type === 'childList') { debouncedSaveGenerated(container); break; }
        // attributes that may indicate a button changed (rare)
        if (m.type === 'attributes') { debouncedSaveGenerated(container); break; }
      }
    });
    genObserver.observe(container, { childList: true, subtree: false, attributes: true, attributeFilter: ['class', 'disabled'] });

    // also save on unload as a final safety net
    window.addEventListener('beforeunload', () => saveGeneratedState(container));
  }

  // If container isn't present at bootstrap, watch the DOM and attach once it's added
  function watchForGeneratedContainer() {
    const existing = findGeneratedContainer();
    if (existing) { observeGeneratedContainer(existing); return; }

    const containerObserver = new MutationObserver(muts => {
      for (const m of muts) {
        if (m.type === 'childList' && m.addedNodes.length) {
          for (const n of m.addedNodes) {
            if (n.nodeType !== 1) continue;
            // check subtree and node itself
            const found = n.matches && n.matches('#generated, [data-autosave-generated]') ? n : n.querySelector && n.querySelector('#generated, [data-autosave-generated]');
            if (found) { observeGeneratedContainer(found); containerObserver.disconnect(); return; }
          }
        }
      }
    });
    containerObserver.observe(document.documentElement || document.body, { childList: true, subtree: true });
    // stop watching after 30s to avoid permanent observer if container never appears
    setTimeout(() => { try { containerObserver.disconnect(); } catch (e) {} }, 30000);
  }

  // ---------------- bootstrap ----------------
  function bootstrapAutosave() {
    initAllFields(document);

    // dynamic hookup for newly added fields
    const fieldObserver = new MutationObserver(mutations => {
      for (const m of mutations) {
        if (m.type === 'childList' && m.addedNodes.length) {
          m.addedNodes.forEach(node => { if (node.nodeType === 1) initAllFields(node); });
        }
        if (m.type === 'attributes' && (m.attributeName === 'disabled' || m.attributeName === 'readonly' || m.attributeName === 'contenteditable' || m.attributeName === 'data-autosave')) {
          initField(m.target);
        }
      }
    });
    fieldObserver.observe(document.documentElement || document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['disabled', 'readonly', 'contenteditable', 'data-autosave'] });

    // generated buttons handling
    watchForGeneratedContainer();

    // restore radios globally
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
    } catch (e) {}

    console.info('Autosave: initialized (generated-buttons saving fixed).');
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bootstrapAutosave); else bootstrapAutosave();

})();
