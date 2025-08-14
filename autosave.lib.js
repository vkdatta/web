(function () {
  'use strict';
  // Ultra-robust autosave for generated buttons + form fields
  // Replace previous autosave IIFE with this block only.

  const PREFIX = 'autosave-ultimate-';
  const FIELD_PREFIX = PREFIX + 'field:';
  const RADIO_PREFIX = PREFIX + 'radio:';
  const GEN_PREFIX = PREFIX + 'generated:';
  const SAVE_DEBOUNCE_MS = 180;
  const GEN_SAVE_DEBOUNCE_MS = 220;
  const POLL_INTERVAL = 900;
  const POLL_TIMEOUT = 30000;

  const pageKey = () => encodeURIComponent(location.origin + location.pathname + location.search);

  function debounce(fn, wait) {
    let t;
    return function (...a) { clearTimeout(t); t = setTimeout(() => fn(...a), wait); };
  }
  function safeParse(s, d = null) { try { return JSON.parse(s); } catch (e) { return d; } }

  // --- stable id generator ---
  let idCounter = 0;
  function genStableId() {
    idCounter++;
    try {
      const arr = new Uint32Array(1);
      crypto.getRandomValues(arr);
      return 'autosave-' + Date.now().toString(36) + '-' + arr[0].toString(36).slice(-6) + '-' + idCounter;
    } catch (e) {
      return 'autosave-' + Date.now().toString(36) + '-' + Math.floor(Math.random() * 1e6).toString(36) + '-' + idCounter;
    }
  }

  // --- helpers for element keys ---
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
  function fieldKey(el) { return FIELD_PREFIX + pageKey() + ':' + elementPath(el); }
  function radioKey(name) { return RADIO_PREFIX + pageKey() + ':' + String(name); }
  function genKey(containerId) { return GEN_PREFIX + pageKey() + ':' + (containerId || 'generated'); }

  // --- detect editable fields (infer permission from element) ---
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

  // --- field save / restore ---
  function saveField(el) {
    try {
      if (!isEditable(el)) return;
      const key = fieldKey(el);
      if (!key) return;
      const tag = el.tagName.toLowerCase();
      if (el.type === 'checkbox') localStorage.setItem(key, el.checked ? '1' : '0');
      else if (el.type === 'radio') {
        if (!el.name) return;
        const sel = document.querySelector('input[type="radio"][name="' + el.name + '"]:checked');
        if (sel) localStorage.setItem(radioKey(el.name), sel.value);
      } else if (tag === 'select') localStorage.setItem(key, el.value);
      else if (el.isContentEditable) localStorage.setItem(key, el.innerHTML);
      else localStorage.setItem(key, el.value);
    } catch (e) { console.warn('autosave: field save failed', e); }
  }

  function restoreField(el) {
    try {
      if (!isEditable(el)) return;
      const key = fieldKey(el);
      if (!key) return;
      if (el.type === 'checkbox') {
        const v = localStorage.getItem(key); if (v !== null) el.checked = v === '1';
      } else if (el.type === 'radio') {
        if (!el.name) return;
        const v = localStorage.getItem(radioKey(el.name));
        if (v !== null) {
          const sel = document.querySelector('input[type="radio"][name="' + el.name + '"][value="' + v + '"]');
          if (sel) sel.checked = true;
        }
      } else if (el.tagName.toLowerCase() === 'select') {
        const v = localStorage.getItem(key); if (v !== null) el.value = v;
      } else if (el.isContentEditable) {
        const v = localStorage.getItem(key); if (v !== null) el.innerHTML = v;
      } else {
        const v = localStorage.getItem(key); if (v !== null) el.value = v;
      }
    } catch (e) { console.warn('autosave: field restore failed', e); }
  }

  // initialize fields under a root
  const saveFieldDeb = debounce(saveField, SAVE_DEBOUNCE_MS);
  const fieldSaverMap = new WeakMap();
  function initField(el) {
    if (!isEditable(el)) return;
    try { restoreField(el); } catch (e) {}
    const runner = () => saveField(el);
    const deb = debounce(runner, SAVE_DEBOUNCE_MS);
    fieldSaverMap.set(el, deb);
    el.addEventListener('input', deb, { passive: true });
    el.addEventListener('change', deb, { passive: true });
    if (el.isContentEditable) el.addEventListener('blur', deb, { passive: true });
  }
  function initAllFields(root = document) {
    try {
      const sel = 'input:not([type=hidden]):not([data-autosave="off"]), textarea:not([data-autosave="off"]), select:not([data-autosave="off"]), [contenteditable="true"]:not([data-autosave="off"])';
      [...root.querySelectorAll(sel)].forEach(node => {
        if (node.type === 'radio') {
          const group = document.querySelectorAll('input[type="radio"][name="' + (node.name || '') + '"]');
          if ([...group].some(r => !r.disabled && !r.readOnly)) initField(node);
        } else initField(node);
      });
    } catch (e) { console.warn('autosave: initAllFields failed', e); }
  }

  // --- generated buttons handling (stable ids + robust detection) ---
  function findContainer() {
    return document.getElementById('generated') || document.querySelector('[data-autosave-generated]') || null;
  }
  function pickAddButton() {
    return document.querySelector('#addBtn, [data-action="add"], [data-add], button[title="Add"], button[aria-label*="add"], .add, .add-btn') ||
      [...document.getElementsByTagName('button')].find(b => /^\s*(?:\+|add|new)\s*$/i.test((b.textContent || '') + (b.getAttribute('aria-label') || '')));
  }
  function pickClearButton() {
    return document.querySelector('#clearBtn, [data-action="clear"], [data-clear], button[title="Clear"], button[aria-label*="clear"], .clear, .clear-btn') ||
      [...document.getElementsByTagName('button')].find(b => /\b(clear|clear all|remove all)\b/i.test((b.textContent || '') + (b.getAttribute('aria-label') || '')));
  }
  function addClearPresent() { return !!(pickAddButton() && pickClearButton()); }

  function ensureStableIds(container) {
    if (!container) return;
    [...container.children].forEach(child => {
      if (child.nodeType !== 1) return;
      const t = (child.tagName || '').toLowerCase();
      if (!['button','a','div','span'].includes(t)) return;
      if (!child.dataset.autosaveId) {
        const prefer = child.id && (!document.getElementById(child.id) || document.getElementById(child.id) === child) ? child.id : null;
        const id = prefer || genStableId();
        child.dataset.autosaveId = id;
        if (!child.id) try { child.id = id; } catch (e) {}
      }
    });
  }

  function snapshot(container) {
    if (!container) return [];
    return [...container.children].filter(c => c.nodeType === 1).map(c => ({ id: c.dataset?.autosaveId || c.id || '', label: (c.textContent || '').trim() }));
  }

  function saveGenerated(container) {
    try {
      if (!container) return;
      ensureStableIds(container);
      const arr = snapshot(container);
      localStorage.setItem(genKey(container.id || 'generated'), JSON.stringify(arr));
      // small console feedback for debugging
      console.debug('autosave: saved generated', arr);
    } catch (e) { console.warn('autosave: failed to save generated', e); }
  }
  const saveGeneratedDeb = debounce(saveGenerated, GEN_SAVE_DEBOUNCE_MS);

  function restoreGeneratedIfAllowed(container) {
    try {
      if (!container) return;
      if (!addClearPresent()) return; // only inject DOM when user can manage Add+Clear
      const raw = localStorage.getItem(genKey(container.id || 'generated'));
      const arr = safeParse(raw, []);
      if (!Array.isArray(arr) || arr.length === 0) return;
      // build map of existing ids
      const existing = new Map();
      [...container.children].forEach(c => {
        const aid = c.dataset?.autosaveId || c.id;
        if (aid) existing.set(aid, c);
      });
      arr.forEach(obj => {
        if (!obj || typeof obj !== 'object') return;
        const id = obj.id || '';
        const label = obj.label || '';
        if (existing.has(id)) {
          const el = existing.get(id);
          if ((el.textContent || '') !== label) el.textContent = label;
        } else {
          // create new
          const b = document.createElement('button');
          b.type = 'button';
          b.className = 'gen-btn';
          b.textContent = label;
          if (id) { b.dataset.autosaveId = id; if (!document.getElementById(id)) b.id = id; }
          b.addEventListener('click', () => { b.toggleAttribute('aria-pressed'); b.style.boxShadow = b.hasAttribute('aria-pressed') ? '0 4px 10px rgba(2,6,23,0.08)' : ''; });
          container.appendChild(b);
        }
      });
      ensureStableIds(container);
      console.debug('autosave: restored generated (if allowed)', arr);
    } catch (e) { console.warn('autosave: restoreGenerated failed', e); }
  }

  // --- super-robust mutation capturing: monkey-patch core DOM mutation APIs + innerHTML setter ---
  function safeCall(fn, ctx, args) { try { return fn.apply(ctx, args); } catch (e) { try { return fn.call(ctx, ...args); } catch (err) {} } }

  function wrapDomMutators(postFn) {
    // appendChild, insertBefore, replaceChild, replaceWith, removeChild
    const proto = Node.prototype;
    const m1 = proto.appendChild;
    proto.appendChild = function (child) {
      const res = safeCall(m1, this, [child]);
      try { postFn(this, child, 'appendChild'); } catch (e) {}
      return res;
    };
    const m2 = proto.insertBefore;
    proto.insertBefore = function (child, ref) {
      const res = safeCall(m2, this, [child, ref]);
      try { postFn(this, child, 'insertBefore'); } catch (e) {}
      return res;
    };
    const m3 = proto.replaceChild;
    proto.replaceChild = function (newNode, oldNode) {
      const res = safeCall(m3, this, [newNode, oldNode]);
      try { postFn(this, newNode, 'replaceChild'); } catch (e) {}
      return res;
    };
    const m4 = proto.removeChild;
    proto.removeChild = function (node) {
      const res = safeCall(m4, this, [node]);
      try { postFn(this, node, 'removeChild'); } catch (e) {}
      return res;
    };

    // replaceWith may be on Element.prototype
    if (Element.prototype.replaceWith) {
      const rp = Element.prototype.replaceWith;
      Element.prototype.replaceWith = function (...args) {
        const res = safeCall(rp, this, args);
        try { postFn(this, args && args[0], 'replaceWith'); } catch (e) {}
        return res;
      };
    }

    // innerHTML setter wrapper (high-impact; frameworks often use it)
    try {
      const desc = Object.getOwnPropertyDescriptor(Element.prototype, 'innerHTML');
      if (desc && desc.set) {
        const origSet = desc.set;
        Object.defineProperty(Element.prototype, 'innerHTML', {
          get: desc.get,
          set: function (v) {
            const res = safeCall(origSet, this, [v]);
            try { postFn(this, null, 'innerHTML'); } catch (e) {}
            return res;
          },
          configurable: true,
          enumerable: desc.enumerable
        });
      }
    } catch (e) { /* ignore if cannot override on this browser */ }
  }

  // --- fallback observer & poll ---
  let pollHandle = null;
  let pollStart = 0;
  function startPoll(container, onChange) {
    pollStart = Date.now();
    if (pollHandle) clearInterval(pollHandle);
    let last = JSON.stringify(snapshot(container || document.createElement('div')));
    pollHandle = setInterval(() => {
      try {
        if (!container) container = findContainer();
        const s = JSON.stringify(snapshot(container || document.createElement('div')));
        if (s !== last) { last = s; onChange(); }
        if (Date.now() - pollStart > POLL_TIMEOUT) { clearInterval(pollHandle); pollHandle = null; }
      } catch (e) {}
    }, POLL_INTERVAL);
  }
  function stopPoll() { if (pollHandle) { clearInterval(pollHandle); pollHandle = null; } }

  // --- attach to container robustly ---
  let genObserver = null;
  function attachToContainer(container) {
    if (!container) return;
    // ensure ids and try restore
    ensureStableIds(container);
    restoreGeneratedIfAllowed(container);
    ensureStableIds(container);
    // mutation observer as primary
    if (genObserver) try { genObserver.disconnect(); } catch (e) {}
    genObserver = new MutationObserver((muts) => {
      // bail quickly on no changes
      for (const m of muts) {
        if (m.type === 'childList' || m.type === 'attributes') {
          ensureStableIds(container);
          saveGeneratedDebounced(container);
          break;
        }
      }
    });
    genObserver.observe(container, { childList: true, attributes: true, subtree: false, attributeFilter: ['class', 'id', 'data-autosave-id'] });
    // patch low-level DOM methods to catch framework changes
    wrapDomMutators((parent, node, op) => {
      // if mutation touches container or its subtree, save
      try {
        if (!container) return;
        if (parent === container || parent.contains(container) || (node && (node === container || (node.nodeType === 1 && node.contains && node.contains(container))))) {
          ensureStableIds(container);
          saveGeneratedNow(container);
        } else {
          // also if node was appended into container specifically
          if (node && node.parentElement === container) {
            ensureStableIds(container);
            saveGeneratedNow(container);
          }
        }
      } catch (e) {}
    });

    // click capture to detect Add/Clear clicks; schedule immediate save after original handlers run
    document.addEventListener('click', onDocClickCapture, true);

    // start poll fallback
    startPoll(container, () => { ensureStableIds(container); saveGeneratedNow(container); });

    // beforeunload last-chance save
    window.addEventListener('beforeunload', () => saveGeneratedNow(container));
  }

  function detachFromContainer() {
    if (genObserver) try { genObserver.disconnect(); } catch (e) {}
    stopPoll();
    document.removeEventListener('click', onDocClickCapture, true);
  }

  function saveGeneratedNow(container) {
    saveGenerated(container);
  }
  const saveGeneratedDebounced = debounce(saveGeneratedNow, GEN_SAVE_DEBOUNCE_MS);

  // click capture handler
  function onDocClickCapture(e) {
    try {
      const btn = e.target && e.target.closest && e.target.closest('button');
      if (!btn) return;
      const text = ((btn.textContent || '') + ' ' + (btn.getAttribute('aria-label') || '')).toLowerCase();
      if (text.includes('add') || /^\s*\+\s*$/.test(text) || text.includes('new') || text.includes('clear') || text.includes('remove all')) {
        // wait tiny bit to let page handler mutate DOM then save
        setTimeout(() => {
          const c = findContainer();
          if (c) { ensureStableIds(c); saveGeneratedNow(c); }
        }, 12);
      }
    } catch (e) {}
  }

  // --- locate container even if added later ---
  let containerWatcher = null;
  function watchForContainerAndAttach() {
    const existing = findContainer();
    if (existing) { attachToContainer(existing); return; }
    // watch DOM for container creation
    containerWatcher = new MutationObserver(muts => {
      for (const m of muts) {
        if (m.type === 'childList' && m.addedNodes.length) {
          for (const n of m.addedNodes) {
            if (n.nodeType !== 1) continue;
            const found = (n.matches && (n.matches('#generated') || n.matches('[data-autosave-generated]'))) ? n : (n.querySelector && (n.querySelector('#generated') || n.querySelector('[data-autosave-generated]')));
            if (found) {
              attachToContainer(found);
              if (containerWatcher) try { containerWatcher.disconnect(); } catch (e) {}
              containerWatcher = null;
              return;
            }
          }
        }
      }
    });
    containerWatcher.observe(document.documentElement || document.body, { childList: true, subtree: true });
    // safety disconnect after PSTIMEOUT
    setTimeout(() => { if (containerWatcher) try { containerWatcher.disconnect(); containerWatcher = null; } catch (e) {} }, POLL_TIMEOUT);
  }

  // --- init bootstrap ---
  function bootstrap() {
    try {
      initAllFields(document);

      // global observer for new editable fields
      const globalFieldsObserver = new MutationObserver(muts => {
        for (const m of muts) {
          if (m.type === 'childList' && m.addedNodes.length) {
            m.addedNodes.forEach(n => { if (n.nodeType === 1) initAllFields(n); });
          }
          if (m.type === 'attributes' && (m.attributeName === 'contenteditable' || m.attributeName === 'disabled' || m.attributeName === 'readonly' || m.attributeName === 'data-autosave')) {
            try { initField(m.target); } catch (e) {}
          }
        }
      });
      globalFieldsObserver.observe(document.documentElement || document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['contenteditable', 'disabled', 'readonly', 'data-autosave'] });

      // attach to generated container (or wait for it)
      watchForContainerAndAttach();

      // restore radio groups globally
      try {
        [...document.querySelectorAll('input[type="radio"][name]')].forEach(r => {
          const v = localStorage.getItem(radioKey(r.name));
          if (v !== null) {
            const sel = document.querySelector('input[type="radio"][name="' + r.name + '"][value="' + v + '"]');
            if (sel) sel.checked = true;
          }
        });
      } catch (e) {}

      console.info('autosave-ultimate: running (aggressive mode)');
    } catch (err) {
      console.error('autosave-ultimate bootstrap error', err);
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bootstrap); else bootstrap();

})();
