(function () {
  'use strict';

  // ---------- Config ----------
  const PREFIX = 'autosave-';
  const FIELD_PREFIX = PREFIX + 'field:';
  const RADIO_PREFIX = PREFIX + 'radio:';
  const GEN_PREFIX = PREFIX + 'generated-buttons:';
  const SAVE_DEBOUNCE = 160;         // ms for debounced saves
  const GEN_SAVE_DEBOUNCE = 220;     // ms for generated buttons
  const POLL_INTERVAL = 1000;        // snapshot poll fallback (ms)
  const POLL_TIMEOUT = 30000;        // stop polling after this many ms (safety)

  // ---------- small helpers ----------
  const nowKey = () => encodeURIComponent(location.origin + location.pathname + location.search);

  function debounce(fn, wait) {
    let t;
    return function (...a) { clearTimeout(t); t = setTimeout(() => fn(...a), wait); };
  }

  function safeParse(s, fallback = null) {
    try { return JSON.parse(s); } catch (e) { return fallback; }
  }

  // small stable id generator
  let _nid = 0;
  function genId() {
    _nid += 1;
    try {
      const a = new Uint32Array(1);
      crypto.getRandomValues(a);
      return 'autosave-btn-' + Date.now().toString(36) + '-' + a[0].toString(36).slice(-6) + '-' + _nid;
    } catch (e) {
      return 'autosave-btn-' + Date.now().toString(36) + '-' + Math.floor(Math.random() * 1e6).toString(36) + '-' + _nid;
    }
  }

  // ---------- editable detection (infer permission by element itself) ----------
  function isEditable(el) {
    if (!el || el.nodeType !== 1) return false;
    if (el.isContentEditable) return true;
    const t = el.tagName && el.tagName.toLowerCase();
    if (t === 'textarea') return !el.disabled && !el.readOnly;
    if (t === 'select') return !el.disabled;
    if (t === 'input') {
      const it = (el.type || '').toLowerCase();
      if (['hidden', 'button', 'submit', 'reset', 'image'].includes(it)) return false;
      return !el.disabled && !el.readOnly;
    }
    return false;
  }

  // ---------- field autosave (inputs, textareas, selects, contenteditable, radios, checkboxes) ----------
  function fieldKey(el) { return FIELD_PREFIX + nowKey() + ':' + elementPath(el); }
  function radioKey(name) { return RADIO_PREFIX + nowKey() + ':' + String(name); }

  // compute simple path for uniqueness (not perfect, but stable enough)
  function elementPath(el) {
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
      parts.unshift(tag + ':nth-of-type(' + idx + ')');
      node = node.parentElement;
    }
    parts.unshift('html');
    return parts.join(' > ');
  }

  function saveField(el) {
    try {
      const key = fieldKey(el);
      if (!key) return;
      const tag = el.tagName.toLowerCase();
      if (el.type === 'checkbox') localStorage.setItem(key, el.checked ? 'true' : 'false');
      else if (el.type === 'radio') {
        if (!el.name) return;
        const sel = document.querySelector('input[type="radio"][name="' + (el.name) + '"]:checked');
        if (sel) localStorage.setItem(radioKey(el.name), sel.value);
      } else if (tag === 'select') localStorage.setItem(key, el.value);
      else if (el.isContentEditable) localStorage.setItem(key, el.innerHTML);
      else localStorage.setItem(key, el.value);
    } catch (e) { console.warn('Autosave field save error', e); }
  }

  function restoreField(el) {
    try {
      const key = fieldKey(el);
      if (!key) return;
      if (el.type === 'checkbox') {
        const v = localStorage.getItem(key); if (v !== null) el.checked = v === 'true';
      } else if (el.type === 'radio') {
        if (!el.name) return;
        const v = localStorage.getItem(radioKey(el.name)); if (v !== null) {
          const match = document.querySelector('input[type="radio"][name="' + (el.name) + '"][value="' + (v) + '"]');
          if (match) match.checked = true;
        }
      } else if (el.tagName.toLowerCase() === 'select') {
        const v = localStorage.getItem(key); if (v !== null) el.value = v;
      } else if (el.isContentEditable) {
        const v = localStorage.getItem(key); if (v !== null) el.innerHTML = v;
      } else {
        const v = localStorage.getItem(key); if (v !== null) el.value = v;
      }
    } catch (e) { console.warn('Autosave field restore error', e); }
  }

  // initialize fields under root
  const debMap = new WeakMap();
  function initField(el) {
    if (!isEditable(el)) return;
    restoreField(el);
    const saver = debounce(() => saveField(el), SAVE_DEBOUNCE);
    debMap.set(el, saver);
    el.addEventListener('input', saver, { passive: true });
    el.addEventListener('change', saver, { passive: true });
    if (el.isContentEditable) el.addEventListener('blur', saver, { passive: true });
  }
  function initAllFields(root = document) {
    try {
      const sel = 'input:not([type=hidden]):not([data-autosave="off"]), textarea:not([data-autosave="off"]), select:not([data-autosave="off"]), [contenteditable="true"]:not([data-autosave="off"])';
      root.querySelectorAll(sel).forEach(n => {
        if (n.type === 'radio') {
          // radio group editable if at least one not disabled
          const group = document.querySelectorAll('input[type="radio"][name="' + (n.name || '') + '"]');
          if (Array.from(group).some(r => !r.disabled && !r.readOnly)) initField(n);
        } else initField(n);
      });
    } catch (e) { console.warn('Autosave initAllFields failed', e); }
  }

  // ---------- Generated buttons persistence (robust) ----------
  function genKey(containerId) { return GEN_PREFIX + nowKey() + ':' + (containerId || 'generated'); }

  // find container
  function findContainer() {
    return document.getElementById('generated') || document.querySelector('[data-autosave-generated]') || null;
  }

  // heuristics for add/clear buttons (aggressive)
  function pickAddButton() {
    const q = document.querySelector('#addBtn, [data-action="add"], [data-add], button[title="Add"], button[aria-label*="add"], .add, .add-btn');
    if (q) return q;
    const all = Array.from(document.getElementsByTagName('button'));
    return all.find(b => /^\s*(?:\+|add|new)\s*$/i.test((b.textContent || '') + (b.getAttribute('aria-label') || '')));
  }
  function pickClearButton() {
    const q = document.querySelector('#clearBtn, [data-action="clear"], [data-clear], button[title="Clear"], button[aria-label*="clear"], .clear, .clear-btn');
    if (q) return q;
    const all = Array.from(document.getElementsByTagName('button'));
    return all.find(b => /\b(clear|clear all|remove all)\b/i.test((b.textContent || '') + (b.getAttribute('aria-label') || '')));
  }
  function addClearPresent() { return !!(pickAddButton() && pickClearButton()); }

  // ensure stable ids for children
  function ensureIds(container) {
    if (!container) return;
    Array.from(container.children).forEach(ch => {
      if (ch.nodeType !== 1) return;
      const tag = ch.tagName.toLowerCase();
      if (!['button', 'a', 'div', 'span'].includes(tag)) return;
      if (!ch.dataset.autosaveId) {
        const assigned = ch.id && !document.querySelectorAll('#' + CSS.escape(ch.id)).length > 1 ? ch.id : genId();
        ch.dataset.autosaveId = assigned;
        if (!ch.id) ch.id = assigned; // safe to set if no id existed
      }
    });
  }

  function snapshotFromContainer(container) {
    if (!container) return [];
    return Array.from(container.children)
      .filter(c => c.nodeType === 1)
      .map(c => ({ id: c.dataset?.autosaveId || c.id || '', label: (c.textContent || '').trim() }));
  }

  function saveGenNow(container) {
    try {
      if (!container) return;
      ensureIds(container);
      const arr = snapshotFromContainer(container);
      const key = genKey(container.id || 'generated');
      localStorage.setItem(key, JSON.stringify(arr));
    } catch (e) { console.warn('Autosave saveGenNow failed', e); }
  }
  const saveGenDeb = debounce(saveGenNow, GEN_SAVE_DEBOUNCE);

  // restore only when page offers add+clear controls (we avoid injecting UI if user cannot manage it)
  function restoreGenIfAllowed(container) {
    if (!container) return;
    if (!addClearPresent()) return; // wait until both controls exist
    const key = genKey(container.id || 'generated');
    const raw = localStorage.getItem(key);
    const arr = safeParse(raw, []);
    if (!Array.isArray(arr) || arr.length === 0) return;
    // map existing
    const existing = new Map();
    Array.from(container.children).forEach(ch => {
      const aid = ch.dataset?.autosaveId || ch.id;
      if (aid) existing.set(aid, ch);
    });
    // add missing or update labels
    arr.forEach(obj => {
      if (!obj || typeof obj !== 'object') return;
      const id = obj.id || '';
      const label = obj.label || '';
      if (existing.has(id)) {
        const el = existing.get(id);
        if ((el.textContent || '') !== label) el.textContent = label;
      } else {
        // create button with same id/label
        try {
          const b = document.createElement('button');
          b.type = 'button';
          b.className = 'gen-btn';
          b.textContent = label;
          if (id) { b.dataset.autosaveId = id; if (!document.getElementById(id)) b.id = id; }
          b.addEventListener('click', () => { b.toggleAttribute('aria-pressed'); b.style.boxShadow = b.hasAttribute('aria-pressed') ? '0 4px 10px rgba(2,6,23,0.08)' : ''; });
          container.appendChild(b);
        } catch (e) {}
      }
    });
    ensureIds(container);
  }

  // ---------- robust observers & fallbacks ----------
  let genObserver = null;
  let pollTimer = null;
  let pollStart = null;
  let lastSnapshotJson = '';

  function attachGenObserver(container) {
    if (!container) return;
    // initial restore attempt (if controls present)
    restoreGenIfAllowed(container);
    ensureIds(container);
    // snapshot baseline
    lastSnapshotJson = JSON.stringify(snapshotFromContainer(container));
    // observer for direct mutations
    if (genObserver) try { genObserver.disconnect(); } catch (e) {}
    genObserver = new MutationObserver((muts) => {
      // if anything changed, ensure ids and save
      for (const m of muts) {
        if (m.type === 'childList' || m.type === 'attributes') {
          ensureIds(container);
          saveGenDeb(container);
          break;
        }
      }
    });
    genObserver.observe(container, { childList: true, attributes: true, subtree: false, attributeFilter: ['class', 'id', 'data-autosave-id'] });

    // global click hook: if user clicks an add/clear-ish control, attempt immediate save/restore
    document.addEventListener('click', onDocumentClick, true);

    // start polling fallback: every POLL_INTERVAL compare snapshot; if changed, save
    pollStart = Date.now();
    if (pollTimer) clearInterval(pollTimer);
    pollTimer = setInterval(() => {
      const now = Date.now();
      if (now - pollStart > POLL_TIMEOUT) { clearInterval(pollTimer); pollTimer = null; return; }
      const snap = JSON.stringify(snapshotFromContainer(container));
      if (snap !== lastSnapshotJson) {
        lastSnapshotJson = snap;
        ensureIds(container);
        saveGenNow(container);
      }
    }, POLL_INTERVAL);

    // beforeunload final saver
    window.addEventListener('beforeunload', () => saveGenNow(container));
  }

  function detachGenObserver() {
    if (genObserver) try { genObserver.disconnect(); } catch (e) {}
    if (pollTimer) { clearInterval(pollTimer); pollTimer = null; }
    document.removeEventListener('click', onDocumentClick, true);
  }

  // click handler to detect Add/Clear and ensure immediate saves
  function onDocumentClick(e) {
    const target = e.target;
    if (!target) return;
    const btn = target.closest && target.closest('button');
    if (!btn) return;
    // if clicked element is likely Add/clear we must trigger immediate save/restore
    const text = ((btn.textContent || '') + ' ' + (btn.getAttribute('aria-label') || '')).toLowerCase();
    if (/^\s*(\+|add|new)\s*$/.test(text) || text.includes('add') || /clear|remove all|clear all/.test(text)) {
      const container = findContainer();
      if (container) {
        // small tick to allow original handler to mutate DOM first
        setTimeout(() => {
          ensureIds(container);
          saveGenNow(container);
          // If Add caused buttons to appear and Add+Clear present, restore missing (rare)
          restoreGenIfAllowed(container);
        }, 20);
      }
    }
  }

  // watch for container creation if not present immediately
  let containerWatcher = null;
  function watchForContainer() {
    const c = findContainer();
    if (c) { attachGenObserver(c); return; }
    // watch DOM for container being added
    containerWatcher = new MutationObserver((muts) => {
      for (const m of muts) {
        if (m.type === 'childList' && m.addedNodes.length) {
          for (const n of m.addedNodes) {
            if (n.nodeType !== 1) continue;
            const found = (n.matches && (n.matches('#generated') || n.matches('[data-autosave-generated]'))) ? n
              : (n.querySelector && (n.querySelector('#generated') || n.querySelector('[data-autosave-generated]')));
            if (found) { attachGenObserver(found); containerWatcher.disconnect(); containerWatcher = null; return; }
          }
        }
      }
    });
    containerWatcher.observe(document.documentElement || document.body, { childList: true, subtree: true });
    // safety cutoff
    setTimeout(() => { if (containerWatcher) try { containerWatcher.disconnect(); containerWatcher = null; } catch (e) {} }, POLL_TIMEOUT);
  }

  // ---------- bootstrap ----------
  function start() {
    try {
      initAllFields(document);

      // observe document for new editable fields
      const globalFieldObserver = new MutationObserver((muts) => {
        for (const m of muts) {
          if (m.type === 'childList' && m.addedNodes.length) {
            m.addedNodes.forEach(n => { if (n.nodeType === 1) initAllFields(n); });
          }
          if (m.type === 'attributes' && (m.attributeName === 'contenteditable' || m.attributeName === 'disabled' || m.attributeName === 'readonly' || m.attributeName === 'data-autosave')) {
            initField(m.target);
          }
        }
      });
      globalFieldObserver.observe(document.documentElement || document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['contenteditable', 'disabled', 'readonly', 'data-autosave'] });

      // watch and attach to generated container
      watchForContainer();

      // restore radios globally (safe)
      try {
        Array.from(document.querySelectorAll('input[type="radio"][name]')).forEach(r => {
          const rk = radioKey(r.name);
          const v = localStorage.getItem(rk);
          if (v !== null) {
            const sel = document.querySelector('input[type="radio"][name="' + (r.name) + '"][value="' + (v) + '"]');
            if (sel) sel.checked = true;
          }
        });
      } catch (e) {}

      // final console hint
      console.info('Autosave: robust mode active (fields + generated buttons).');
    } catch (e) {
      console.error('Autosave bootstrap failed', e);
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();

})();
