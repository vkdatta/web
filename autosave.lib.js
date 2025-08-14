(function () {
    'use strict';

    // Per-page storage key (scoped by origin + path)
    const STORAGE_KEY = 'autosave_generated:' + encodeURIComponent(location.origin + location.pathname + location.search);
    const COUNTER_KEY = 'autosave_id_counter:' + encodeURIComponent(location.origin + location.pathname + location.search);

    // ID prefix requested: "webURLLINK-i"
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
      // webURLLINK-<n>
      return ID_PREFIX + '-' + incrementCounter();
    }

    // ensure element has stable id; if it can't set .id, store on dataset.autosaveId
    function ensureId(el) {
      if (!el || el.nodeType !== 1) return null;
      if (el.id && String(el.id).trim() !== '') return el.id;
      if (el.dataset && el.dataset.autosaveId) {
        // try to set id to dataset value if not used
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

    // snapshot container into array of {id,label}
    function snapshot(containerEl) {
      if (!containerEl) return [];
      return Array.from(containerEl.children)
        .filter(n => n.nodeType === 1)
        .map(btn => {
          const id = ensureId(btn);
          return { id: id, label: (btn.textContent || '').trim() };
        });
    }

    function readStored() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : [];
      } catch (e) {
        return [];
      }
    }
    function writeStored(arr) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
      } catch (e) {
        // localStorage may be blocked — silently fail but don't throw
        console.warn('Autosave: could not write to localStorage', e);
      }
    }

    // Save functions
    function saveNow() {
      const cont = document.getElementById('generated');
      if (!cont) return;
      const arr = snapshot(cont);
      writeStored(arr);
    }
    const saveDebounced = debounce(saveNow, SAVE_DELAY);

    // Attach to restored buttons so they behave like originals.
    function attachToggleToRestored(btn) {
      if (!btn) return;
      // mark it so we don't duplicate on repeated restores
      if (btn.dataset && btn.dataset.autosaveToggleAttached === '1') return;
      btn.addEventListener('click', () => {
        btn.toggleAttribute('aria-pressed');
        btn.style.boxShadow = btn.hasAttribute('aria-pressed') ? '0 4px 10px rgba(2,6,23,0.08)' : '';
      });
      try { if (btn.dataset) btn.dataset.autosaveToggleAttached = '1'; } catch (e) {}
    }

    // Restore saved buttons into container (creates missing ones, updates labels)
    function restore() {
      const cont = document.getElementById('generated');
      if (!cont) return;
      const arr = readStored();
      if (!Array.isArray(arr) || arr.length === 0) return;

      // Build a set of existing ids to avoid duplicates
      const existing = new Set(Array.from(cont.children).map(c => c.id || (c.dataset && c.dataset.autosaveId) || ''));

      arr.forEach(item => {
        if (!item || typeof item !== 'object') return;
        const id = String(item.id || '').trim();
        const label = String(item.label || '').trim();
        if (!id) return;

        // If element already exists in DOM, just update label if needed
        let el = document.getElementById(id);
        if (!el) {
          // maybe dataset was used: search children for matching dataset.autosaveId
          el = Array.from(cont.children).find(c => c.dataset && c.dataset.autosaveId === id);
        }
        if (el) {
          if ((el.textContent || '').trim() !== label) el.textContent = label;
          // ensure toggle is attached so restored AND existing elements behave
          attachToggleToRestored(el);
        } else {
          // create new button (restore)
          const b = document.createElement('button');
          b.type = 'button';
          b.className = 'gen-btn';
          b.textContent = label;
          try { b.id = id; } catch (e) {}
          try { if (b.dataset) b.dataset.autosaveId = id; } catch (e) {}
          attachToggleToRestored(b);
          cont.appendChild(b);
        }
      });

      // Ensure all children have ids for future saves
      Array.from(cont.children).forEach(c => ensureId(c));
    }

    // Monitor container for changes and persist
    function observeContainer() {
      const cont = document.getElementById('generated');
      if (!cont) return;

      // Ensure any pre-existing children get ids (and do NOT attach toggles here to avoid double-handlers).
      Array.from(cont.children).forEach(n => ensureId(n));

      const mo = new MutationObserver(muts => {
        let changed = false;
        for (const m of muts) {
          if (m.type === 'childList') {
            if (m.addedNodes && m.addedNodes.length) {
              m.addedNodes.forEach(node => {
                if (node.nodeType !== 1) return;
                ensureId(node);
                // NOTE: do NOT attach toggle here because your original createRandomButton already attaches a click handler.
                // We attach toggles only for buttons created by restore() to avoid double handlers.
                changed = true;
              });
            }
            if (m.removedNodes && m.removedNodes.length) changed = true;
          }
          if (m.type === 'attributes') {
            changed = true;
          }
        }
        if (changed) saveDebounced();
      });

      mo.observe(cont, { childList: true, subtree: false, attributes: true, attributeFilter: ['id', 'class', 'data-autosave-id'] });

      // quick-saves: if user clicks Add, schedule an immediate save (race-proof)
      const addBtn = document.getElementById('addBtn');
      if (addBtn) {
        addBtn.addEventListener('click', () => {
          // give page handler a tick to append the node, then save immediately
          setTimeout(() => {
            ensureId(cont); // no-op but safe
            saveNow();
          }, 30);
        }, true);
      }

      // when user clears, remove stored state immediately (after original handler runs)
      const clearBtn = document.getElementById('clearBtn');
      if (clearBtn) {
        clearBtn.addEventListener('click', () => {
          setTimeout(() => {
            try { localStorage.removeItem(STORAGE_KEY); } catch (e) {}
          }, 30);
        }, true);
      }

      // final safety net
      window.addEventListener('beforeunload', saveNow);
    }

    // bootstrap
    document.addEventListener('DOMContentLoaded', () => {
      try {
        // 1) restore saved buttons (if any)
        restore();
        // 2) start observing container for changes and auto-saving
        observeContainer();
      } catch (e) {
        console.error('Autosave: unexpected error', e);
      }
    });

    // For debugging: expose a helper to force-restore (useful if you test manually)
    window.__autosave_force_restore_generated = function () {
      restore();
    };

  })();
