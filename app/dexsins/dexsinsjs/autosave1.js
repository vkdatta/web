(function () {
  'use strict';

  const PAGE_KEY = encodeURIComponent(location.origin + location.pathname + location.search);
  const STORAGE_KEY = 'autosave_generated:' + PAGE_KEY;
  const STATIC_KEY  = 'autosave_static:' + PAGE_KEY;

  const SAVE_DELAY = 120;

  function debounce(fn, wait) {
    let t;
    return (...a) => {
      clearTimeout(t);
      t = setTimeout(() => fn(...a), wait);
    };
  }

  function read(key) {
    try {
      return JSON.parse(localStorage.getItem(key) || '[]');
    } catch {
      return [];
    }
  }

  function write(key, val) {
    try {
      localStorage.setItem(key, JSON.stringify(val));
    } catch (e) {
      console.warn('Autosave write failed', e);
    }
  }

  function ensureId(el) {
    if (!el.id) el.id = 'as-' + Math.random().toString(36).slice(2);
    return el.id;
  }

  // ---------- STATIC (inputs, textarea, etc) ----------

  function getState(el) {
    if (el.tagName === 'INPUT') {
      if (el.type === 'checkbox' || el.type === 'radio') return el.checked;
      return el.value;
    }
    if (el.tagName === 'TEXTAREA' || el.tagName === 'SELECT') return el.value;
    if (el.isContentEditable) return el.innerHTML;
    return null;
  }

  function setState(el, val) {
    if (val == null) return;

    if (el.tagName === 'INPUT') {
      if (el.type === 'checkbox' || el.type === 'radio') el.checked = !!val;
      else el.value = val;
    } else if (el.tagName === 'TEXTAREA' || el.tagName === 'SELECT') {
      el.value = val;
    } else if (el.isContentEditable) {
      el.innerHTML = val;
    }
  }

  function snapshotStatic() {
    return Array.from(document.querySelectorAll('input, textarea, select, [contenteditable]'))
      .map(el => {
        const state = getState(el);
        if (state == null) return null;
        return { id: ensureId(el), state };
      })
      .filter(Boolean);
  }

  function restoreStatic() {
    const data = read(STATIC_KEY);

    data.forEach(({ id, state }) => {
      const el = document.getElementById(id);
      if (el) setState(el, state);
    });
  }

  const saveStatic = debounce(() => {
    write(STATIC_KEY, snapshotStatic());
  }, SAVE_DELAY);

  // ---------- DYNAMIC (generated buttons) ----------

  function snapshotDynamic() {
    const cont = document.getElementById('generated');
    if (!cont) return [];

    return Array.from(cont.children).map(el => ({
      id: ensureId(el),
      label: el.textContent,
      pressed: el.hasAttribute('aria-pressed')
    }));
  }

  function restoreDynamic() {
    const cont = document.getElementById('generated');
    if (!cont) return;

    const data = read(STORAGE_KEY);

    data.forEach(item => {
      let el = document.getElementById(item.id);

      if (!el) {
        el = document.createElement('button');
        el.textContent = item.label;
        el.id = item.id;
        cont.appendChild(el);
      }

      el.textContent = item.label;

      if (item.pressed) el.setAttribute('aria-pressed', 'true');
      else el.removeAttribute('aria-pressed');
    });
  }

  const saveDynamic = debounce(() => {
    write(STORAGE_KEY, snapshotDynamic());
  }, SAVE_DELAY);

  // ---------- GLOBAL EVENT-BASED SYSTEM ----------

  // 🔥 works for dynamically injected elements too
  document.addEventListener('input', saveStatic, true);
  document.addEventListener('change', saveStatic, true);
  document.addEventListener('click', (e) => {
    if (e.target.tagName === 'BUTTON') saveStatic();
  }, true);

  const observer = new MutationObserver(() => {
    saveDynamic();
  });

  function observeGenerated() {
    const cont = document.getElementById('generated');
    if (!cont) return;

    observer.observe(cont, { childList: true, subtree: true });
  }

  // ---------- INIT ----------

  function fullRestore() {
    restoreStatic();
    restoreDynamic();
    observeGenerated();
  }

  if (document.readyState !== 'loading') {
    fullRestore();
  } else {
    document.addEventListener('DOMContentLoaded', fullRestore);
  }

  // 🔥 KEY FIX: react to async imports
  let scheduled = false;

  document.addEventListener('dextools:loaded', () => {
    if (scheduled) return;
    scheduled = true;

    requestAnimationFrame(() => {
      fullRestore();
      scheduled = false;
    });
  });

  window.addEventListener('beforeunload', () => {
    saveStatic();
    saveDynamic();
  });

})();
