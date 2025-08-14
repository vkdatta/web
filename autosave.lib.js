(function () {
  'use strict';

  // ---------- Your original config (kept) ----------
  const PREFIX = 'autosave-ids-';
  const FIELD_PREFIX = PREFIX + 'field:';
  const RADIO_PREFIX = PREFIX + 'radio:';
  const STATE_PREFIX = PREFIX + 'state:';
  const ID_COUNTER_KEY_PREFIX = PREFIX + 'counter:';
  const SAVE_DEBOUNCE = 200;
  const GEN_SAVE_DEBOUNCE = 180;
  const EXCLUDE_TAGS = new Set(['html','head','meta','script','style','link','iframe','svg','path','noscript','template']);

  function pageKey() { return encodeURIComponent(location.origin + location.pathname + location.search); }

  function sanitizePagePrefix() {
    try {
      const raw = (location.href || '').replace(/^https?:\/\//i, '').replace(/[#?].*$/,'');
      let s = raw.replace(/[^a-z0-9]+/gi, '-').toLowerCase();
      s = s.replace(/(^-+|-+$)/g, '');
      return s.slice(0, 60) || 'page';
    } catch (e) { return 'page'; }
  }
  const PAGE_PREFIX = sanitizePagePrefix();
  const COUNTER_KEY = ID_COUNTER_KEY_PREFIX + pageKey();

  function nextAutoId() {
    const cur = parseInt(localStorage.getItem(COUNTER_KEY) || '0', 10) + 1;
    localStorage.setItem(COUNTER_KEY, String(cur));
    return `${PAGE_PREFIX}-${cur}`;
  }

  function debounce(fn, wait) {
    let t = 0;
    return function (...args) { clearTimeout(t); t = setTimeout(() => fn.apply(this, args), wait); };
  }

  // ---------- ID assignment ----------
  function assignIdIfMissing(el) {
    if (!el || el.nodeType !== 1) return;
    const tag = (el.tagName || '').toLowerCase();
    if (EXCLUDE_TAGS.has(tag)) return;
    // if element already has id or autosaveId, keep it
    if (el.id && String(el.id).trim() !== '') return;
    if (el.dataset && el.dataset.autosaveId) return;

    // Find unique candidate
    let candidate;
    let attempts = 0;
    do {
      candidate = nextAutoId();
      attempts++;
      if (attempts > 1000) break; // safety
    } while (document.getElementById(candidate));
    try { el.id = candidate; } catch (e) { /* some custom elements may restrict id - ignore */ }
    try { if (el.dataset) el.dataset.autosaveId = candidate; } catch (e) {}
    try { if (el.dataset) el.dataset.autosaveManaged = '1'; } catch (e) {}
  }

  function assignIdsRecursively(root) {
    if (!root) return;
    if (root.nodeType === 1) assignIdIfMissing(root);
    try {
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT, null, false);
      while (walker.nextNode()) assignIdIfMissing(walker.currentNode);
    } catch (e) {
      // fallback
      const all = root.querySelectorAll ? root.querySelectorAll('*') : [];
      for (let i=0;i<all.length;i++) assignIdIfMissing(all[i]);
    }
  }

  // ---------- storage helpers ----------
  function getElementIdentifier(el) {
    if (!el) return null;
    return el.id || (el.dataset && el.dataset.autosaveId) || null;
  }
  function storageKeyForElement(el) {
    const id = getElementIdentifier(el);
    return id ? `${FIELD_PREFIX}${pageKey()}:${id}` : null;
  }
  function stateKeyForElement(el) {
    const id = getElementIdentifier(el);
    return id ? `${STATE_PREFIX}${pageKey()}:${id}` : null;
  }
  function radioKey(name) { return `${RADIO_PREFIX}${pageKey()}:${String(name)}`; }

  // ---------- stateful detection (kept your logic) ----------
  function isStatefulElement(el) {
    if (!el || el.nodeType !== 1) return false;
    const tag = (el.tagName || '').toLowerCase();
    if (['textarea', 'select', 'input'].includes(tag)) {
      if (tag === 'input') {
        const type = (el.type || '').toLowerCase();
        return !['hidden', 'button', 'submit', 'reset', 'image'].includes(type);
      }
      return true;
    }
    if (el.isContentEditable) return true;
    if (['button','a'].includes(tag)) return true;
    const role = el.getAttribute && el.getAttribute('role');
    if (['checkbox','radio','switch','button'].includes(role)) return true;
    if (el.hasAttribute && (el.hasAttribute('aria-pressed') || el.hasAttribute('aria-checked') || el.hasAttribute('aria-selected'))) return true;
    if (el.hasAttribute && el.hasAttribute('data-autosave-state')) return true;
    return false;
  }

  // ---------- save / restore an individual element (kept & made safe) ----------
  function saveElementState(el) {
    if (!isStatefulElement(el)) return;
    const tag = (el.tagName || '').toLowerCase();
    const stateKey = stateKeyForElement(el);
    const fieldKey = storageKeyForElement(el);

    // If target keys are null we skip (shouldn't happen if assignIdsRecursively ran)
    // but guard to avoid accidental localStorage.setItem(null,...)
    function setIfKey(k, v) { if (!k) return; try { localStorage.setItem(k, v); } catch (e) { console.warn('autosave: storage error', e); } }

    if (tag === 'input' && (el.type || '').toLowerCase() === 'checkbox') {
      setIfKey(fieldKey, el.checked ? '1' : '0');
      return;
    }

    if (tag === 'input' && (el.type || '').toLowerCase() === 'radio') {
      if (!el.name) return;
      const sel = document.querySelector(`input[type="radio"][name="${el.name}"]:checked`);
      if (sel) setIfKey(radioKey(el.name), sel.value);
      return;
    }

    if (['select','input','textarea'].includes(tag)) {
      setIfKey(fieldKey, el.value == null ? '' : String(el.value));
      return;
    }

    if (el.isContentEditable) {
      setIfKey(fieldKey, el.innerHTML);
      return;
    }

    if (el.hasAttribute && el.hasAttribute('aria-pressed')) {
      setIfKey(stateKey, el.getAttribute('aria-pressed'));
      return;
    }
    if (el.hasAttribute && el.hasAttribute('aria-checked')) {
      setIfKey(stateKey, el.getAttribute('aria-checked'));
      return;
    }
    if (el.hasAttribute && el.hasAttribute('aria-selected')) {
      setIfKey(stateKey, el.getAttribute('aria-selected'));
      return;
    }
    if (el.hasAttribute && el.hasAttribute('data-autosave-state')) {
      setIfKey(stateKey, el.getAttribute('data-autosave-state'));
      return;
    }

    if (tag === 'button' || (el.getAttribute && el.getAttribute('role') === 'button')) {
      setIfKey(fieldKey, (el.textContent || '').trim());
      return;
    }
  }

  function restoreElementState(el) {
    if (!isStatefulElement(el)) return;
    const tag = (el.tagName || '').toLowerCase();
    const stateKey = stateKeyForElement(el);
    const fieldKey = storageKeyForElement(el);

    function getIfKey(k) { if (!k) return null; try { return localStorage.getItem(k); } catch (e) { return null; } }

    if (tag === 'input' && (el.type || '').toLowerCase() === 'checkbox') {
      const v = getIfKey(fieldKey); if (v !== null) el.checked = v === '1'; return;
    }
    if (tag === 'input' && (el.type || '').toLowerCase() === 'radio') {
      if (!el.name) return;
      const v = getIfKey(radioKey(el.name)); if (v !== null) {
        const sel = document.querySelector(`input[type="radio"][name="${el.name}"][value="${v}"]`);
        if (sel) sel.checked = true;
      }
      return;
    }
    if (['select','input','textarea'].includes(tag)) {
      const v = getIfKey(fieldKey); if (v !== null) el.value = v; return;
    }
    if (el.isContentEditable) {
      const v = getIfKey(fieldKey); if (v !== null) el.innerHTML = v; return;
    }
    if (el.hasAttribute && el.hasAttribute('aria-pressed')) {
      const v = getIfKey(stateKey); if (v !== null) el.setAttribute('aria-pressed', v); return;
    }
    if (el.hasAttribute && el.hasAttribute('aria-checked')) {
      const v = getIfKey(stateKey); if (v !== null) el.setAttribute('aria-checked', v); return;
    }
    if (el.hasAttribute && el.hasAttribute('aria-selected')) {
      const v = getIfKey(stateKey); if (v !== null) el.setAttribute('aria-selected', v); return;
    }
    if (el.hasAttribute && el.hasAttribute('data-autosave-state')) {
      const v = getIfKey(stateKey); if (v !== null) el.setAttribute('data-autosave-state', v); return;
    }
    if (tag === 'button' || (el.getAttribute && el.getAttribute('role') === 'button')) {
      const v = getIfKey(fieldKey); if (v !== null) el.textContent = v; return;
    }
  }

  // ---------- init helpers ----------
  function initStatefulElement(el) {
    try {
      if (!(el && el.nodeType === 1)) return;
      if (el.dataset && el.dataset.autosaveInited === '1') return;
      if (!isStatefulElement(el)) return;
      if (el.dataset) el.dataset.autosaveInited = '1';
    } catch (e) {}

    // ensure it has an identifier
    assignIdIfMissing(el);
    // restore from storage if available
    try { restoreElementState(el); } catch (e) {}
    // add event listeners
    const saver = debounce(() => saveElementState(el), SAVE_DEBOUNCE);
    try {
      if (el.isContentEditable) {
        el.addEventListener('input', saver, { passive: true });
        el.addEventListener('blur', saver, { passive: true });
      } else {
        const tag = (el.tagName || '').toLowerCase();
        if (['input','textarea','select'].includes(tag)) {
          el.addEventListener('input', saver, { passive: true });
          el.addEventListener('change', saver, { passive: true });
        } else {
          // button, a, roles, custom toggles
          el.addEventListener('click', saver, { passive: true });
          el.addEventListener('change', saver, { passive: true });
          el.addEventListener('keyup', saver, { passive: true });
        }
      }
    } catch (e) { /* best-effort */ }
  }

  function initAllStatefulElements(root = document) {
    const selector = `
      input:not([type=hidden]):not([data-autosave="off"]), 
      textarea:not([data-autosave="off"]), 
      select:not([data-autosave="off"]), 
      [contenteditable="true"]:not([data-autosave="off"]),
      button:not([data-autosave="off"]),
      [role="button"]:not([data-autosave="off"]),
      [role="checkbox"]:not([data-autosave="off"]),
      [role="switch"]:not([data-autosave="off"]),
      [aria-pressed]:not([data-autosave="off"]),
      [aria-checked]:not([data-autosave="off"]),
      [data-autosave-state]:not([data-autosave="off"])
    `;
    try {
      const nodes = root.querySelectorAll(selector);
      nodes.forEach(initStatefulElement);
    } catch (e) { /* ignore */ }
  }

  // ---------- generated container persistence (MISSING piece you need) ----------
  // container ID detection
  function findGeneratedContainer() {
    return document.getElementById('generated') || document.querySelector('[data-autosave-generated]') || null;
  }

  function genKeyForContainer(container) {
    if (!container) return null;
    return `${PREFIX}generated:${pageKey()}:${container.id || 'generated'}`;
  }

  function snapshotGenerated(container) {
    if (!container) return [];
    return Array.from(container.children)
      .filter(c => c.nodeType === 1)
      .map(c => ({ id: (c.id || (c.dataset && c.dataset.autosaveId) || ''), label: (c.textContent || '').trim(), tag: (c.tagName || '').toLowerCase() }));
  }

  function saveGenerated(container) {
    if (!container) return;
    assignIdsRecursively(container); // ensure stable ids before saving
    const arr = snapshotGenerated(container);
    const key = genKeyForContainer(container);
    try { localStorage.setItem(key, JSON.stringify(arr)); } catch (e) { console.warn('autosave: failed to save generated list', e); }
  }
  const debouncedSaveGenerated = debounce(saveGenerated, GEN_SAVE_DEBOUNCE);

  function restoreGenerated(container) {
    if (!container) return;
    const key = genKeyForContainer(container);
    let raw = null;
    try { raw = localStorage.getItem(key); } catch (e) { raw = null; }
    const arr = raw ? JSON.parse(raw || '[]') : [];
    if (!Array.isArray(arr) || arr.length === 0) return;
    // create missing items (do not duplicate existing ids)
    const existingIds = new Set(Array.from(container.children).map(c => c.id || (c.dataset && c.dataset.autosaveId) || ''));
    arr.forEach(obj => {
      if (!obj || typeof obj !== 'object') return;
      const id = obj.id || '';
      const label = obj.label || '';
      const tag = obj.tag || 'button';
      if (existingIds.has(id) && id) {
        // update text if different
        const existing = id ? document.getElementById(id) : null;
        if (existing && (existing.textContent || '').trim() !== label) existing.textContent = label;
      } else {
        // create element and append
        try {
          const el = document.createElement(tag === 'a' ? 'a' : 'button');
          el.type = 'button';
          el.className = 'gen-btn';
          el.textContent = label;
          if (id) {
            try { el.id = id; } catch (e) {}
            try { if (el.dataset) el.dataset.autosaveId = id; } catch (e) {}
          } else {
            assignIdIfMissing(el);
          }
          // small click behavior to match your earlier UI
          el.addEventListener('click', () => {
            try { el.toggleAttribute('aria-pressed'); } catch (e) {}
            try { el.style.boxShadow = el.hasAttribute('aria-pressed') ? '0 4px 10px rgba(2,6,23,0.08)' : ''; } catch (e) {}
            // save after user clicks
            debouncedSaveGenerated(container);
          });
          container.appendChild(el);
        } catch (e) {}
      }
    });
    // ensure ids remain after restoration
    assignIdsRecursively(container);
  }

  // provide a reapply function you can call after frameworks re-render
  window.__autosave_reapplyGenerated = function () {
    const container = findGeneratedContainer();
    if (!container) return;
    // reassign ids to whatever exists now
    assignIdsRecursively(container);
    // restore missing items (won't duplicate existing)
    restoreGenerated(container);
    // re-init stateful elements that were restored
    initAllStatefulElements(container);
    // save a stable snapshot now
    saveGenerated(container);
  };

  // ---------- observation ----------
  const globalObserver = new MutationObserver(mutations => {
    let genContainer = null;
    for (const m of mutations) {
      if (m.type === 'childList' && m.addedNodes.length) {
        for (const n of m.addedNodes) {
          if (n.nodeType !== 1) continue;
          // ensure ids and init stateful subtree
          assignIdsRecursively(n);
          initAllStatefulElements(n);
        }
      }
      if (m.type === 'attributes') {
        const el = m.target;
        if (isStatefulElement(el) && !(el.dataset && el.dataset.autosaveInited === '1')) initStatefulElement(el);
      }
      // if any mutation touches the generated container, save its snapshot
      const target = m.target;
      if (target && target.nodeType === 1) {
        if (!genContainer) genContainer = findGeneratedContainer();
        if (genContainer && (target === genContainer || genContainer.contains && genContainer.contains(target))) {
          debouncedSaveGenerated(genContainer);
        }
      }
    }
  });

  // monitor the generated container specifically; attach fast childList observer
  function watchGeneratedContainer() {
    const container = findGeneratedContainer();
    if (!container) return null;
    // attach MutationObserver for that container (childList)
    const mo = new MutationObserver((muts) => {
      for (const m of muts) {
        if (m.type === 'childList') {
          // new nodes: ensure they get ids & init
          m.addedNodes.forEach(n => { if (n.nodeType === 1) { assignIdsRecursively(n); initAllStatefulElements(n); } });
          // save a snapshot (debounced)
          debouncedSaveGenerated(container);
        }
        if (m.type === 'attributes') {
          debouncedSaveGenerated(container);
        }
      }
    });
    mo.observe(container, { childList: true, subtree: false, attributes: true, attributeFilter: ['id','class','data-autosave-id'] });
    return mo;
  }

  // ---------- bootstrap ----------
  function startAutosave() {
    // initial pass: assign ids and init any stateful nodes present in document
    assignIdsRecursively(document.documentElement || document.body);
    initAllStatefulElements(document);

    // restore generated items into container if possible (this is the important creation step)
    const cont = findGeneratedContainer();
    if (cont) {
      try { restoreGenerated(cont); } catch (e) {}
    }

    // observe global changes and generated container
    globalObserver.observe(document.documentElement || document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['id','contenteditable','aria-pressed','aria-checked','aria-selected','role','data-autosave-state'] });
    const genMo = watchGeneratedContainer();

    // small convenience: immediate save on Add/Clear-like clicks (so quick refresh won't lose)
    document.addEventListener('click', (e) => {
      try {
        const btn = e.target && e.target.closest && e.target.closest('button');
        if (!btn) return;
        const text = ((btn.textContent || '') + ' ' + (btn.getAttribute('aria-label') || '')).toLowerCase();
        if (text.includes('add') || text.trim() === '+' || text.includes('new') || text.includes('clear') || text.includes('remove all')) {
          // tiny delay to let the page handler mutate DOM
          setTimeout(() => {
            const c = findGeneratedContainer();
            if (c) { assignIdsRecursively(c); saveGenerated(c); }
          }, 18);
        }
      } catch (e) {}
    }, true);

    // beforeunload: ensure any managed items saved
    window.addEventListener('beforeunload', () => {
      try {
        document.querySelectorAll('[data-autosave-managed]').forEach(el => {
          try { saveElementState(el); } catch (e) {}
        });
        const c = findGeneratedContainer();
        if (c) saveGenerated(c);
      } catch (e) {}
    });

    // expose quick helpers
    window.__autosave_reapplyGenerated = window.__autosave_reapplyGenerated || window.__autosave_reapplyGenerated;
    window.__autosave_forceSaveGenerated = function () { const c = findGeneratedContainer(); if (c) saveGenerated(c); };

    console.info('Autosave: enhanced + generated-item restore active. Use __autosave_reapplyGenerated() if your framework re-renders the DOM.');
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', startAutosave); else startAutosave();

})();
