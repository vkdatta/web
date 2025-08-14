(function () {
  'use strict';

  const STORAGE_PREFIX = 'autosave-';
  const FIELD_KEY_PREFIX = STORAGE_PREFIX + 'field:';
  const RADIO_KEY_PREFIX = STORAGE_PREFIX + 'radio:';
  const GENERATED_BTN_KEY = STORAGE_PREFIX + 'generated-buttons:';
  const SAVE_DEBOUNCE_MS = 200;
  const GEN_SAVE_DEBOUNCE_MS = 250;

  // --- utils ---
  function pageKey() { return encodeURIComponent(location.origin + location.pathname + location.search); }
  function debounce(fn, wait) { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), wait); }; }
  function safeJSONParse(s, fallback = null) { try { return JSON.parse(s); } catch (e) { return fallback; } }
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
  function storageKeyForGenerated(containerIdOrSelector) { const suffix = containerIdOrSelector ? ':' + containerIdOrSelector : ''; return GENERATED_BTN_KEY + pageKey() + suffix; }

  // --- editable detection (infer rights by element properties) ---
  function isElementEditable(el) {
    if (!el || el.nodeType !== 1) return false;
    if (el.isContentEditable) return true;
    const tag = el.tagName.toLowerCase();
    if (tag === 'textarea') return !el.disabled && !el.readOnly;
    if (tag === 'select') return !el.disabled;
    if (tag === 'input') {
      const t = (el.type || '').toLowerCase();
      if (['hidden', 'button', 'submit', 'reset', 'image'].includes(t)) return false;
      return !el.disabled && !el.readOnly;
    }
    return false;
  }
  function isRadioGroupEditable(name) {
    if (!name) return false;
    const group = document.querySelectorAll(`input[type="radio"][name="${CSS.escape ? CSS.escape(name) : name}"]`);
    return Array.from(group).some(r => !r.disabled && !r.readOnly);
  }

  // --- field save/restore ---
  function saveFieldValue(el) {
    try {
      const key = storageKeyForElement(el);
      if (!key) return;
      if (el.type === 'checkbox') localStorage.setItem(key, el.checked ? 'true' : 'false');
      else if (el.type === 'radio') {
        const name = el.name; if (!name) return;
        const sel = document.querySelector(`input[type="radio"][name="${CSS.escape ? CSS.escape(name) : name}"]:checked`);
        if (sel) localStorage.setItem(storageKeyForRadio(name), sel.value);
      } else if (el.tagName.toLowerCase() === 'select') localStorage.setItem(key, el.value);
      else if (el.isContentEditable) localStorage.setItem(key, el.innerHTML);
      else localStorage.setItem(key, el.value);
    } catch (e) { console.warn('Autosave saveField failed', e); }
  }
  function restoreFieldValue(el) {
    try {
      const key = storageKeyForElement(el); if (!key) return;
      if (el.type === 'checkbox') { const s = localStorage.getItem(key); if (s !== null) el.checked = s === 'true'; }
      else if (el.type === 'radio') { const name = el.name; if (!name) return; const s = localStorage.getItem(storageKeyForRadio(name)); if (s !== null && el.value === s) el.checked = true; }
      else if (el.tagName.toLowerCase() === 'select') { const s = localStorage.getItem(key); if (s !== null) el.value = s; }
      else if (el.isContentEditable) { const s = localStorage.getItem(key); if (s !== null) el.innerHTML = s; }
      else { const s = localStorage.getItem(key); if (s !== null) el.value = s; }
    } catch (e) { console.warn('Autosave restoreField failed', e); }
  }

  // --- init fields & dynamic hookup ---
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
        if (node.type === 'radio') { if (isRadioGroupEditable(node.name)) initField(node); }
        else { if (isElementEditable(node)) initField(node); }
      });
    } catch (e) { console.warn('Autosave initAllFields failed', e); }
  }

  // --- generated buttons persistence with stable ids ---
  // generate a short random id (cryptographically random when available)
  let idCounter = 0;
  function generateStableId() {
    idCounter += 1;
    try {
      const a = new Uint32Array(2);
      crypto.getRandomValues(a);
      return 'autosave-btn-' + (Date.now().toString(36)) + '-' + a[0].toString(36).slice(-6) + '-' + idCounter;
    } catch (e) {
      return 'autosave-btn-' + Date.now().toString(36) + '-' + Math.floor(Math.random() * 1e6).toString(36) + '-' + idCounter;
    }
  }

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

  // Ensure every button in the generated container has a stable data-autosave-id
  function ensureStableIds(container) {
    if (!container) return;
    Array.from(container.children).forEach(child => {
      if (child.nodeType !== 1) return;
      // we care about buttons, but be lenient (some pages may use anchors)
      if (!['button', 'a'].includes(child.tagName.toLowerCase())) return;
      if (!child.dataset.autosaveId) {
        // prefer preserving existing id if safe (starts with autosave-btn- or not used elsewhere)
        let assignId = null;
        if (child.id && !document.querySelectorAll('#' + CSS.escape(child.id)).length > 1) {
          assignId = child.id;
        } else {
          assignId = generateStableId();
        }
        child.dataset.autosaveId = assignId;
        // we do not force element.id unless it is missing; avoid clobbering page IDs
        if (!child.id) child.id = assignId;
      }
    });
  }

  function createGeneratedButton(label, id, container) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'gen-btn';
    btn.textContent = label;
    if (id) {
      btn.dataset.autosaveId = id;
      // give element an id only if not colliding with existing ids
      if (!document.getElementById(id)) btn.id = id;
    } else {
      // ensure stable id is present
      const gen = generateStableId();
      btn.dataset.autosaveId = gen;
      if (!document.getElementById(gen)) btn.id = gen;
    }
    btn.addEventListener('click', () => {
      btn.toggleAttribute('aria-pressed');
      btn.style.boxShadow = btn.hasAttribute('aria-pressed') ? '0 4px 10px rgba(2,6,23,0.08)' : '';
    });
    container.appendChild(btn);
    return btn;
  }

  function saveGeneratedState(container) {
    if (!container) return;
    ensureStableIds(container);
    const labels = Array.from(container.children)
      .filter(c => c.nodeType === 1 && (c.tagName.toLowerCase() === 'button' || c.matches?.('.gen-btn')))
      .map(b => ({ id: b.dataset.autosaveId || b.id || generateStableId(), label: b.textContent || '' }));
    const skey = storageKeyForGenerated(container.id || 'generated');
    try { localStorage.setItem(skey, JSON.stringify(labels)); } catch (e) { console.warn('Autosave saveGenerated failed', e); }
  }
  const debouncedSaveGenerated = debounce(saveGeneratedState, GEN_SAVE_DEBOUNCE_MS);

  function restoreGeneratedStateIfAllowed(container) {
    if (!container) return;
    if (!isAddClearAvailable()) return; // only populate DOM when Add+Clear available
    const skey = storageKeyForGenerated(container.id || 'generated');
    const raw = localStorage.getItem(skey);
    const arr = safeJSONParse(raw, []);
    if (!Array.isArray(arr) || arr.length === 0) return;
    // Build map of existing autosave ids to avoid duplicates
    const existingMap = new Map();
    Array.from(container.children).forEach(ch => {
      const aid = ch.dataset?.autosaveId || ch.id;
      if (aid) existingMap.set(aid, ch);
    });
    // Add or update
    arr.forEach(obj => {
      if (!obj || typeof obj !== 'object') return;
      const { id, label } = obj;
      if (existingMap.has(id)) {
        const el = existingMap.get(id);
        if (el.textContent !== label) el.textContent = label;
      } else {
        try { createGeneratedButton(label, id, container); } catch (e) { /* ignore per-button error */ }
      }
    });
    // Ensure every child has a stable id for future saves
    ensureStableIds(container);
  }

  // Observe generated container for changes and assign IDs + save
  let genObserver = null;
  function observeGeneratedContainer(container) {
    if (!container) return;
    // Try restoring (if allowed) and ensure ids
    ensureStableIds(container);
    restoreGeneratedStateIfAllowed(container);
    ensureStableIds(container);

    if (genObserver) try { genObserver.disconnect(); } catch (e) {}
    genObserver = new MutationObserver(muts => {
      for (const m of muts) {
        if (m.type === 'childList' || m.type === 'attributes') {
          ensureStableIds(container);
          debouncedSaveGenerated(container);
          break;
        }
      }
    });
    genObserver.observe(container, { childList: true, subtree: false, attributes: true, attributeFilter: ['class', 'id', 'disabled', 'data-autosave-id'] });

    // last-chance save on unload
    window.addEventListener('beforeunload', () => saveGeneratedState(container));
  }

  // Watch the DOM for the container (attach even if container appears later)
  function watchForGeneratedContainer() {
    const existing = findGeneratedContainer();
    if (existing) { observeGeneratedContainer(existing); return; }

    const co = new MutationObserver(muts => {
      for (const m of muts) {
        if (m.type === 'childList' && m.addedNodes.length) {
          for (const n of m.addedNodes) {
            if (n.nodeType !== 1) continue;
            const found = (n.matches && n.matches('#generated, [data-autosave-generated]')) ? n : (n.querySelector && n.querySelector('#generated, [data-autosave-generated]'));
            if (found) { observeGeneratedContainer(found); co.disconnect(); return; }
          }
        }
      }
    });
    co.observe(document.documentElement || document.body, { childList: true, subtree: true });
    // safety cutoff
    setTimeout(() => { try { co.disconnect(); } catch (e) {} }, 30000);
  }

  // --- bootstrap ---
  function bootstrapAutosave() {
    initAllFields(document);
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

    console.info('Autosave: initialized (stable IDs for generated buttons enabled).');
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bootstrapAutosave); else bootstrapAutosave();

})();
