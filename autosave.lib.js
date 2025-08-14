(function () {
  'use strict';

  // ---------------- CONFIG ----------------
  const PREFIX = 'autosave-ids-'; // localStorage keys namespace
  const FIELD_PREFIX = PREFIX + 'field:';
  const RADIO_PREFIX = PREFIX + 'radio:';
  const GEN_PREFIX = PREFIX + 'generated:';
  const ID_COUNTER_KEY_PREFIX = PREFIX + 'counter:';
  const SAVE_DEBOUNCE = 200;
  const GEN_SAVE_DEBOUNCE = 220;
  const POLL_INTERVAL = 1000;
  const EXCLUDE_TAGS = new Set(['html','head','meta','script','style','link','iframe','svg','path','noscript','template']);

  // ---------------- helpers ----------------
  function pageKey() {
    return encodeURIComponent(location.origin + location.pathname + location.search);
  }

  // sanitize URL to a short, safe id prefix (your "webURLLINK" base)
  function sanitizePagePrefix() {
    try {
      const raw = (location.href || '').replace(/^https?:\/\//i, '').replace(/[#?].*$/,'');
      let s = raw.replace(/[^a-z0-9]+/gi, '-').toLowerCase();
      s = s.replace(/(^-+|-+$)/g, '');
      if (!s) s = 'page';
      return s.slice(0, 60);
    } catch (e) {
      return 'page';
    }
  }
  const PAGE_PREFIX = sanitizePagePrefix();

  // per-page counter key
  const COUNTER_KEY = ID_COUNTER_KEY_PREFIX + pageKey();

  function nextAutoId() {
    const cur = parseInt(localStorage.getItem(COUNTER_KEY) || '0', 10) + 1;
    localStorage.setItem(COUNTER_KEY, String(cur));
    // id format: <pageprefix>-<n>
    return `${PAGE_PREFIX}-${cur}`;
  }

  // small debounce
  function debounce(fn, wait) {
    let t = 0;
    return function (...args) {
      clearTimeout(t);
      t = setTimeout(() => fn.apply(this, args), wait);
    };
  }

  // safe JSON parse
  function safeParse(s, fallback = null) {
    try { return JSON.parse(s); } catch (e) { return fallback; }
  }

  // ---------------- ID assignment ----------------
  // Assign an id to a single element if it doesn't have one and is not excluded.
  function assignIdIfMissing(el) {
    if (!el || el.nodeType !== 1) return;
    const tag = (el.tagName || '').toLowerCase();
    if (EXCLUDE_TAGS.has(tag)) return;
    if (el.id && String(el.id).trim() !== '') return; // keep existing ids
    // generate unique id that doesn't collide with existing element IDs
    let candidate;
    do {
      candidate = nextAutoId();
    } while (document.getElementById(candidate));
    try {
      el.id = candidate;
    } catch (e) {
      // if element refuses id, still set data attribute
    }
    // mark that we assigned it (useful for debugging)
    try { el.dataset.autosaveAssigned = '1'; } catch (e) {}
  }

  // Walk subtree and assign ids to every element without an id
  function assignIdsRecursively(root) {
    if (!root) return;
    if (root.nodeType === 1) assignIdIfMissing(root);
    // use TreeWalker for memory-friendly traversal
    try {
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT, null, false);
      while (walker.nextNode()) {
        assignIdIfMissing(walker.currentNode);
      }
    } catch (e) {
      // fallback: querySelectorAll (slower)
      const all = root.querySelectorAll ? root.querySelectorAll('*') : [];
      for (let i = 0; i < all.length; i++) assignIdIfMissing(all[i]);
    }
  }

  // ---------------- storage key helpers ----------------
  // Use ID-based key when available, fall back to element path (rare)
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
      parts.unshift(`${tag}:nth-of-type(${idx})`);
      node = node.parentElement;
    }
    parts.unshift('html');
    return parts.join(' > ');
  }
  function storageKeyForElement(el) {
    if (!el) return null;
    if (el.id) return FIELD_PREFIX + pageKey() + ':id:' + el.id;
    return FIELD_PREFIX + pageKey() + ':path:' + elementPath(el);
  }
  function radioKey(name) { return RADIO_PREFIX + pageKey() + ':' + String(name); }
  function genKey(containerId) { return GEN_PREFIX + pageKey() + ':' + (containerId || 'generated'); }

  // ---------------- detect editable fields ----------------
  function isEditable(el) {
    if (!el || el.nodeType !== 1) return false;
    if (el.isContentEditable) return true;
    const tag = (el.tagName || '').toLowerCase();
    if (tag === 'textarea') return !el.disabled && !el.readOnly;
    if (tag === 'select') return !el.disabled;
    if (tag === 'input') {
      const t = (el.type || '').toLowerCase();
      if (['hidden','button','submit','reset','image'].includes(t)) return false;
      return !el.disabled && !el.readOnly;
    }
    return false;
  }

  // ---------------- save / restore field values ----------------
  function saveField(el) {
    try {
      if (!isEditable(el)) return;
      const key = storageKeyForElement(el);
      if (!key) return;
      const tag = (el.tagName || '').toLowerCase();
      if (el.type === 'checkbox') localStorage.setItem(key, el.checked ? '1' : '0');
      else if (el.type === 'radio') {
        if (!el.name) return;
        const sel = document.querySelector('input[type="radio"][name="' + (el.name) + '"]:checked');
        if (sel) localStorage.setItem(radioKey(el.name), sel.value);
      } else if (tag === 'select') localStorage.setItem(key, el.value);
      else if (el.isContentEditable) localStorage.setItem(key, el.innerHTML);
      else localStorage.setItem(key, el.value);
    } catch (e) {
      console.warn('autosave: saveField failed', e);
    }
  }
  function restoreField(el) {
    try {
      if (!isEditable(el)) return;
      const key = storageKeyForElement(el);
      if (!key) return;
      if (el.type === 'checkbox') {
        const v = localStorage.getItem(key); if (v !== null) el.checked = v === '1';
      } else if (el.type === 'radio') {
        if (!el.name) return;
        const v = localStorage.getItem(radioKey(el.name)); if (v !== null) {
          const sel = document.querySelector('input[type="radio"][name="' + (el.name) + '"][value="' + v + '"]');
          if (sel) sel.checked = true;
        }
      } else if (el.tagName.toLowerCase() === 'select') {
        const v = localStorage.getItem(key); if (v !== null) el.value = v;
      } else if (el.isContentEditable) {
        const v = localStorage.getItem(key); if (v !== null) el.innerHTML = v;
      } else {
        const v = localStorage.getItem(key); if (v !== null) el.value = v;
      }
    } catch (e) {
      console.warn('autosave: restoreField failed', e);
    }
  }

  // init field: attach listeners only once (guard with data flag)
  function initField(el) {
    if (!isEditable(el)) return;
    if (el.dataset && el.dataset.autosaveInited === '1') return;
    try { if (el.dataset) el.dataset.autosaveInited = '1'; } catch (e) {}
    restoreField(el);
    const saver = debounce(() => saveField(el), SAVE_DEBOUNCE);
    el.addEventListener('input', saver, { passive: true });
    el.addEventListener('change', saver, { passive: true });
    if (el.isContentEditable) el.addEventListener('blur', saver, { passive: true });
  }

  function initAllFields(root=document) {
    try {
      const selector = 'input:not([type=hidden]):not([data-autosave="off"]), textarea:not([data-autosave="off"]), select:not([data-autosave="off"]), [contenteditable="true"]:not([data-autosave="off"])';
      const nodes = root.querySelectorAll(selector);
      nodes.forEach(node => {
        if (node.type === 'radio') {
          // initialize group radios only if group has any editable radio
          const group = document.querySelectorAll('input[type="radio"][name="' + (node.name || '') + '"]');
          if (Array.from(group).some(r => !r.disabled && !r.readOnly)) initField(node);
        } else initField(node);
      });
    } catch (e) {}
  }

  // ---------------- generated buttons persistence ----------------
  function findGeneratedContainer() {
    return document.getElementById('generated') || document.querySelector('[data-autosave-generated]') || null;
  }

  function snapshotContainer(container) {
    if (!container) return [];
    return Array.from(container.children)
      .filter(c => c.nodeType === 1)
      .map(c => ({ id: c.id || c.dataset?.autosaveId || '', label: (c.textContent || '').trim() }));
  }

  function restoreGenerated(container) {
    if (!container) return;
    const key = genKey(container.id || 'generated');
    const raw = localStorage.getItem(key);
    const arr = safeParse(raw, []);
    if (!Array.isArray(arr) || arr.length === 0) return;
    // map existing ids to elements
    const existing = new Map();
    Array.from(container.children).forEach(ch => {
      const aid = ch.id || (ch.dataset && ch.dataset.autosaveId) || '';
      if (aid) existing.set(aid, ch);
    });
    // create missing ones
    arr.forEach(obj => {
      if (!obj || typeof obj !== 'object') return;
      const id = obj.id || '';
      const label = obj.label || '';
      if (existing.has(id)) {
        const el = existing.get(id);
        if ((el.textContent || '') !== label) el.textContent = label;
      } else {
        // create a new button (non-destructive)
        try {
          const b = document.createElement('button');
          b.type = 'button';
          b.className = 'gen-btn';
          b.textContent = label;
          if (id) {
            try { b.id = id; } catch (e) {}
            try { b.dataset.autosaveId = id; } catch (e) {}
          }
          b.addEventListener('click', () => {
            b.toggleAttribute('aria-pressed');
            b.style.boxShadow = b.hasAttribute('aria-pressed') ? '0 4px 10px rgba(2,6,23,0.08)' : '';
          });
          container.appendChild(b);
        } catch (e) {}
      }
    });
  }

  function saveGenerated(container) {
    if (!container) return;
    // ensure ids on children first
    assignIdsRecursively(container);
    const arr = snapshotContainer(container);
    try {
      localStorage.setItem(genKey(container.id || 'generated'), JSON.stringify(arr));
    } catch (e) { console.warn('autosave: saveGenerated failed', e); }
  }
  const saveGeneratedDebounced = debounce(saveGenerated, GEN_SAVE_DEBOUNCE);

  // ---------------- observation and hooking ----------------
  // assign ids to existing relevant elements at start
  function initialAssignAndInit() {
    // assign ids to inputs, textareas, selects, contenteditable and buttons (broad but safe)
    const selector = 'input:not([type=hidden]), textarea, select, [contenteditable="true"], button, a';
    Array.from(document.querySelectorAll(selector)).forEach(el => assignIdIfMissing(el));
    // init fields (attach listeners)
    initAllFields(document);
    // try to restore generated container if any
    const cont = findGeneratedContainer();
    if (cont) restoreGenerated(cont);
  }

  // MutationObserver: watch whole document for additions
  const globalObserver = new MutationObserver(muts => {
    let sawAdded = false;
    for (const m of muts) {
      if (m.type === 'childList' && m.addedNodes.length) {
        m.addedNodes.forEach(node => {
          if (node.nodeType !== 1) return;
          // assign ids to node subtree
          assignIdsRecursively(node);
        });
        sawAdded = true;
      } else if (m.type === 'attributes' && m.attributeName === 'contenteditable') {
        assignIdIfMissing(m.target);
        initField(m.target);
      }
    }
    if (sawAdded) {
      // re-init any newly added editable fields (guarded by dataset flag inside initField)
      initAllFields(document);
      // if generated container exists, save it (debounced)
      const cont = findGeneratedContainer();
      if (cont) saveGeneratedDebounced(cont);
    }
  });

  // innerHTML setter guard: when a script sets innerHTML we re-run assignment for that element
  function wrapInnerHTMLSetter() {
    try {
      const desc = Object.getOwnPropertyDescriptor(Element.prototype, 'innerHTML');
      if (!desc || !desc.set) return;
      const origSet = desc.set;
      Object.defineProperty(Element.prototype, 'innerHTML', {
        get: desc.get,
        set: function (val) {
          // call original
          const res = origSet.call(this, val);
          try {
            // small microtask so DOM actually updates
            setTimeout(() => {
              assignIdsRecursively(this);
              initAllFields(this);
              const cont = findGeneratedContainer();
              if (cont) saveGeneratedDebounced(cont);
            }, 0);
          } catch (e) {}
          return res;
        },
        configurable: true,
        enumerable: desc.enumerable
      });
    } catch (e) {
      // ignore if cannot override
    }
  }

  // click capture: detect Add/Clear style clicks and force immediate save after handlers run
  function onDocumentClick(e) {
    try {
      const btn = e.target && e.target.closest && e.target.closest('button');
      if (!btn) return;
      const text = ((btn.textContent || '') + ' ' + (btn.getAttribute('aria-label') || '')).toLowerCase();
      const looksLikeAdd = /^\s*(?:\+|add|new)\s*$/.test((btn.textContent || '')) || text.includes('add') || btn.matches?.('[data-action="add"], [data-add]');
      const looksLikeClear = text.includes('clear') || /remove all|clear all/.test(text) || btn.matches?.('[data-action="clear"], [data-clear]');
      // microdelay to let page handler mutate DOM
      if (looksLikeAdd || looksLikeClear) {
        setTimeout(() => {
          const cont = findGeneratedContainer();
          if (cont) {
            assignIdsRecursively(cont);
            initAllFields(cont);
            saveGenerated(cont); // immediate save (no debounce)
          }
        }, 16);
      }
    } catch (e) {}
  }

  // fall-back polling to catch mutations that slip through (frameworks doing weirdness)
  let pollHandle = null;
  function startPolling(container) {
    if (pollHandle) clearInterval(pollHandle);
    let last = JSON.stringify(snapshotContainer(container || findGeneratedContainer() || document.createElement('div')));
    pollHandle = setInterval(() => {
      try {
        const cont = container || findGeneratedContainer();
        const cur = JSON.stringify(snapshotContainer(cont || document.createElement('div')));
        if (cur !== last) {
          last = cur;
          if (cont) { assignIdsRecursively(cont); initAllFields(cont); saveGenerated(cont); }
        }
      } catch (e) {}
    }, POLL_INTERVAL);
    // stop polling after a while to avoid permanent cost
    setTimeout(() => { try { clearInterval(pollHandle); pollHandle = null; } catch (e) {} }, 30000);
  }

  // ---------------- bootstrap ----------------
  function startAutosave() {
    // initial pass
    initialAssignAndInit();

    // observe whole doc
    globalObserver.observe(document.documentElement || document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['contenteditable'] });

    // wrap innerHTML setter
    wrapInnerHTMLSetter();

    // click capture for add/clear detection
    document.addEventListener('click', onDocumentClick, true);

    // attach to generated container if present and watch its children
    const cont = findGeneratedContainer();
    if (cont) {
      // ensure ids and restore (if any saved)
      assignIdsRecursively(cont);
      initAllFields(cont);
      restoreGenerated(cont);
      // observe container specifically for fast saves
      const co = new MutationObserver(muts => {
        let changed = false;
        for (const m of muts) {
          if (m.type === 'childList' && (m.addedNodes.length || m.removedNodes.length)) changed = true;
          if (m.type === 'attributes') changed = true;
        }
        if (changed) {
          assignIdsRecursively(cont);
          initAllFields(cont);
          saveGeneratedDebounced(cont);
        }
      });
      co.observe(cont, { childList: true, subtree: false, attributes: true, attributeFilter: ['class','id','data-autosave-id'] });
      // fallback polling to be safe
      startPolling(cont);
    } else {
      // If container not present now, still start a short poll to catch late mount
      startPolling(null);
    }

    // restore radio groups globally
    try {
      const radios = document.querySelectorAll('input[type="radio"][name]');
      Array.from(radios).forEach(r => {
        const rk = radioKey(r.name);
        const v = localStorage.getItem(rk);
        if (v !== null) {
          const match = document.querySelector('input[type="radio"][name="' + r.name + '"][value="' + v + '"]');
          if (match) match.checked = true;
        }
      });
    } catch (e) {}

    console.info('Autosave: id-assignment + field autosave active. Inspect elements for data-autosave-assigned if needed.');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startAutosave);
  } else startAutosave();

})();
