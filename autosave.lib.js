(function () {
  'use strict';

  // Per-page storage keys (scoped by origin + path)
  const STORAGE_KEY = 'autosave_generated:' + encodeURIComponent(location.origin + location.pathname + location.search);
  const STATIC_KEY = 'autosave_static:' + encodeURIComponent(location.origin + location.pathname + location.search);
  const COUNTER_KEY = 'autosave_id_counter:' + encodeURIComponent(location.origin + location.pathname + location.search);

  // ID prefix
  const ID_PREFIX = 'webURLLINK';

  // debounce delay
  const SAVE_DELAY = 120;

  function debounce(fn, wait) {
    let t;
    return function (...a) {
      clearTimeout(t);
      t = setTimeout(() => fn.apply(this, a), wait);
    };
  }

  // counter helpers
  function getCounter() {
    return parseInt(localStorage.getItem(COUNTER_KEY) || '0', 10) || 0;
  }
  function incrementCounter() {
    const n = getCounter() + 1;
    try { localStorage.setItem(COUNTER_KEY, String(n)); } catch (e) {}
    return n;
  }
  function makeId() {
    return ID_PREFIX + '-' + incrementCounter();
  }

  // ensure element has stable id; if it can't set .id, store on dataset.autosaveId
  function ensureId(el) {
    if (!el || el.nodeType !== 1) return null;
    if (el.id && String(el.id).trim() !== '') return el.id;
    if (el.dataset && el.dataset.autosaveId) {
      const cand = el.dataset.autosaveId;
      if (!document.getElementById(cand)) {
        try { el.id = cand; } catch (e) {}
      }
      return el.dataset.autosaveId;
    }
    const id = makeId();
    try { el.id = id; } catch (e) { /* ignore */ }
    try { if (el.dataset) el.dataset.autosaveId = id; } catch (e) {}
    return id;
  }

  // General state getters/setters for various element types
  function getState(el) {
    if (!el) return null;
    if (el.tagName === 'SELECT') {
      return el.value;
    } else if (el.tagName === 'TEXTAREA') {
      return el.value;
    } else if (el.tagName === 'INPUT') {
      switch (el.type) {
        case 'checkbox':
        case 'radio':
          return el.checked;
        default:
          return el.value;
      }
    } else if (el.tagName === 'BUTTON') {
      if (el.hasAttribute('aria-pressed')) {
        return el.hasAttribute('aria-pressed');
      } else {
        return ( پذیر: '').trim();
      }
    }
    // Add more types if needed
    return null;
  }

  function setState(el, state) {
    if (state == null) return;
    if (el.tagName === 'SELECT') {
      el.value = state;
    } else if (el.tagName === 'TEXTAREA') {
      el.value = state;
    } else if (el.tagName === 'INPUT') {
      switch (el.type) {
        case 'checkbox':
        case 'radio':
          el.checked = !!state;
          break;
        default:
          el.value = String(state);
      }
    } else if (el.tagName === 'BUTTON') {
      if (el.hasAttribute('aria-pressed')) {
        if (!!state) {
          el.setAttribute('aria-pressed', 'true');
        } else {
          el.removeAttribute('aria-pressed');
        }
      } else {
        el.textContent = String(state);
      }
    }
  }

  // Read/write helpers
  function readStored(key) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }
  function writeStored(key, arr) {
    try {
      localStorage.setItem(key, JSON.stringify(arr));
    } catch (e) {
      console.warn('Autosave: could not write to localStorage', e);
    }
  }

  // === Dynamic container (generated buttons) ===

  // Snapshot dynamic container
  function snapshotDynamic(containerEl) {
    if (!containerEl) return [];
    return Array.from(containerEl.children)
      .filter(n => n.nodeType === 1)
      .map(btn => {
        const id = ensureId(btn);
        const label = (btn.textContent || '').trim();
        const pressed = btn.hasAttribute('aria-pressed');
        return { id: id, label: label, pressed: pressed };
      });
  }

  // Save functions for dynamic
  function saveNowDynamic() {
    const cont = document.getElementById('generated');
    if (!cont) return;
    const arr = snapshotDynamic(cont);
    writeStored(STORAGE_KEY, arr);
  }
  const saveDebouncedDynamic = debounce(saveNowDynamic, SAVE_DELAY);

  // Update style based on pressed state
  function updateStyle(btn) {
    if (!btn) return;
    btn.style.boxShadow = btn.hasAttribute('aria-pressed') ? '0 4px 10px rgba(2,6,23,0.08)' : '';
  }

  // Attach toggle to restored buttons
  function attachToggleToRestored(btn) {
    if (!btn) return;
    if (btn.dataset && btn.dataset.autosaveToggleAttached === '1') return;
    btn.addEventListener('click', () => {
      btn.toggleAttribute('aria-pressed');
      updateStyle(btn);
    });
    try { if (btn.dataset) btn.dataset.autosaveToggleAttached = '1'; } catch (e) {}
    updateStyle(btn);
  }

  // Restore dynamic
  function restoreDynamic() {
    const cont = document.getElementById('generated');
    if (!cont) return;
    const arr = readStored(STORAGE_KEY);
    if (!Array.isArray(arr) || arr.length === 0) return;

    const existing = new Set(Array.from(cont.children).map(c => c.id || (c.dataset && c.dataset.autosaveId) || ''));

    arr.forEach(item => {
      if (!item || typeof item !== 'object') return;
      const id = String(item.id || '').trim();
      const label = String(item.label || '').trim();
      const pressed = !!item.pressed;
      if (!id) return;

      let el = document.getElementById(id);
      if (!el) {
        el = Array.from(cont.children).find(c => c.dataset && c.dataset.autosaveId === id);
      }
      if (el) {
        if ((el.textContent || '').trim() !== label) el.textContent = label;
        if (pressed !== el.hasAttribute('aria-pressed')) {
          if (pressed) {
            el.setAttribute('aria-pressed', 'true');
          } else {
            el.removeAttribute('aria-pressed');
          }
        }
        attachToggleToRestored(el);
        updateStyle(el);
      } else {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'gen-btn';
        b.textContent = label;
        try { b.id = id; } catch (e) {}
        try { if (b.dataset) b.dataset.autosaveId = id; } catch (e) {}
        if (pressed) b.setAttribute('aria-pressed', 'true');
        attachToggleToRestored(b);
        updateStyle(b);
        cont.appendChild(b);
      }
    });

    Array.from(cont.children).forEach(c => ensureId(c));
  }

  // Observe dynamic container
  function observeDynamic() {
    const cont = document.getElementById('generated');
    if (!cont) return;

    Array.from(cont.children).forEach(n => ensureId(n));

    const mo = new MutationObserver(muts => {
      let changed = false;
      for (const m of muts) {
        if (m.type === 'childList' || m.type === 'characterData') {
          changed = true;
        }
        if (m.type === 'attributes') {
          changed = true;
        }
      }
      if (changed) saveDebouncedDynamic();
    });

    mo.observe(cont, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ['id', 'class', 'data-autosave-id', 'aria-pressed'] });

    const addBtn = document.getElementById('addBtn');
    if (addBtn) {
      addBtn.addEventListener('click', () => {
        setTimeout(saveNowDynamic, 30);
      }, true);
    }

    const clearBtn = document.getElementById('clearBtn');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        setTimeout(() => {
          try { localStorage.removeItem(STORAGE_KEY); } catch (e) {}
        }, 30);
      }, true);
    }
  }

  // === Static elements ([data-autosave]) ===

  // Snapshot static
  function snapshotStatic() {
    const els = document.querySelectorAll('[data-autosave]');
    return Array.from(els)
      .map(el => {
        const id = ensureId(el);
        const state = getState(el);
        return { id, state };
      });
  }

  // Save functions for static
  function saveNowStatic() {
    const arr = snapshotStatic();
    writeStored(STATIC_KEY, arr);
  }
  const saveDebouncedStatic = debounce(saveNowStatic, SAVE_DELAY);

  // Restore static
  function restoreStatic() {
    const arr = readStored(STATIC_KEY);
    if (!Array.isArray(arr) || arr.length === 0) return;

    arr.forEach(item => {
      if (!item || typeof item !== 'object') return;
      const id = String(item.id || '').trim();
      const state = item.state;
      if (!id) return;

      let el = document.getElementById(id);
      if (!el) {
        el = document.querySelector(`[data-autosave-id="${id}"]`);
      }
      if (el) {
        setState(el, state);
        // For buttons with aria-pressed, update style if it's the same as generated (optional)
        if (el.tagName === 'BUTTON' && el.hasAttribute('aria-pressed')) {
          updateStyle(el); // Reuse if applicable, else remove this
        }
      }
      // No creation for static elements
    });
  }

  // Observe static (event listeners)
  function observeStatic() {
    const els = document.querySelectorAll('[data-autosave]');
    Array.from(els).forEach(el => {
      ensureId(el);
      // Add change listeners based on type
      if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
        el.addEventListener('input', saveDebouncedStatic);
        el.addEventListener('change', saveDebouncedStatic);
      } else if (el.tagName === 'SELECT') {
        el.addEventListener('change', saveDebouncedStatic);
      } else if (el.tagName === 'BUTTON') {
        el.addEventListener('click', saveDebouncedStatic);
      }
      // Add more if needed
    });
  }

  // Bootstrap
  function init() {
    try {
      restoreDynamic();
      restoreStatic();
      observeDynamic();
      observeStatic();
    } catch (e) {
      console.error('Autosave: unexpected error', e);
    }
    window.addEventListener('beforeunload', () => {
      saveNowDynamic();
      saveNowStatic();
    });
  }

  if (document.readyState !== 'loading') {
    init();
  } else {
    document.addEventListener('DOMContentLoaded', init);
  }

  // Debugging helpers
  window.__autosave_force_restore_generated = restoreDynamic;
  window.__autosave_force_restore_static = restoreStatic;

})();
