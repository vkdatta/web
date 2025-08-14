(function () {
  'use strict';

  // ---------------- CONFIG ----------------
  const PREFIX = 'autosave-ids-';
  const FIELD_PREFIX = PREFIX + 'field:';
  const RADIO_PREFIX = PREFIX + 'radio:';
  const STATE_PREFIX = PREFIX + 'state:';
  const ID_COUNTER_KEY_PREFIX = PREFIX + 'counter:';
  const SAVE_DEBOUNCE = 200;
  const EXCLUDE_TAGS = new Set(['html','head','meta','script','style','link','iframe','svg','path','noscript','template']);

  // ---------------- helpers ----------------
  function pageKey() {
    return encodeURIComponent(location.origin + location.pathname + location.search);
  }

  function sanitizePagePrefix() {
    try {
      const raw = (location.href || '').replace(/^https?:\/\//i, '').replace(/[#?].*$/,'');
      let s = raw.replace(/[^a-z0-9]+/gi, '-').toLowerCase();
      s = s.replace(/(^-+|-+$)/g, '');
      return s.slice(0, 60) || 'page';
    } catch (e) {
      return 'page';
    }
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
    return function (...args) {
      clearTimeout(t);
      t = setTimeout(() => fn.apply(this, args), wait);
    };
  }

  // ---------------- ID assignment ----------------
  function assignIdIfMissing(el) {
    if (!el || el.nodeType !== 1) return;
    const tag = (el.tagName || '').toLowerCase();
    if (EXCLUDE_TAGS.has(tag)) return;
    if (el.id && String(el.id).trim() !== '') return;
    
    let candidate;
    do {
      candidate = nextAutoId();
    } while (document.getElementById(candidate));
    
    try {
      el.id = candidate;
    } catch (e) {
      // If element refuses ID, use dataset
      el.dataset.autosaveId = candidate;
    }
    el.dataset.autosaveManaged = '1';
  }

  function assignIdsRecursively(root) {
    if (!root) return;
    if (root.nodeType === 1) assignIdIfMissing(root);
    
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT, null, false);
    while (walker.nextNode()) {
      assignIdIfMissing(walker.currentNode);
    }
  }

  // ---------------- storage key helpers ----------------
  function getElementIdentifier(el) {
    if (!el) return null;
    return el.id || el.dataset.autosaveId || null;
  }

  function storageKeyForElement(el) {
    const id = getElementIdentifier(el);
    return id ? `${FIELD_PREFIX}${pageKey()}:${id}` : null;
  }

  function stateKeyForElement(el) {
    const id = getElementIdentifier(el);
    return id ? `${STATE_PREFIX}${pageKey()}:${id}` : null;
  }

  function radioKey(name) {
    return `${RADIO_PREFIX}${pageKey()}:${String(name)}`;
  }

  // ---------------- detect stateful elements ----------------
  function isStatefulElement(el) {
    if (!el || el.nodeType !== 1) return false;
    
    // Traditional form elements
    const tag = (el.tagName || '').toLowerCase();
    if (['textarea', 'select', 'input'].includes(tag)) {
      if (tag === 'input') {
        const type = (el.type || '').toLowerCase();
        return !['hidden', 'button', 'submit', 'reset', 'image'].includes(type);
      }
      return true;
    }
    
    // Content-editable elements
    if (el.isContentEditable) return true;
    
    // Interactive elements
    if (['button', 'a'].includes(tag)) return true;
    
    // Elements with ARIA roles
    const role = el.getAttribute('role');
    if (['checkbox', 'radio', 'switch', 'button'].includes(role)) return true;
    
    // Elements with toggle attributes
    if (el.hasAttribute('aria-pressed') || 
        el.hasAttribute('aria-checked') || 
        el.hasAttribute('aria-selected')) {
      return true;
    }
    
    // Explicitly marked elements
    return el.hasAttribute('data-autosave-state');
  }

  // ---------------- save/restore element state ----------------
  function saveElementState(el) {
    if (!isStatefulElement(el)) return;
    
    const tag = (el.tagName || '').toLowerCase();
    const role = el.getAttribute('role');
    const stateKey = stateKeyForElement(el);
    const fieldKey = storageKeyForElement(el);
    
    // Save traditional form fields
    if (tag === 'input' && el.type === 'checkbox') {
      localStorage.setItem(fieldKey, el.checked ? '1' : '0');
    }
    else if (tag === 'input' && el.type === 'radio') {
      if (!el.name) return;
      const sel = document.querySelector(`input[type="radio"][name="${el.name}"]:checked`);
      if (sel) localStorage.setItem(radioKey(el.name), sel.value);
    }
    else if (['select', 'input', 'textarea'].includes(tag)) {
      localStorage.setItem(fieldKey, el.value);
    }
    // Save content-editable
    else if (el.isContentEditable) {
      localStorage.setItem(fieldKey, el.innerHTML);
    }
    // Save toggle states
    else if (el.hasAttribute('aria-pressed')) {
      localStorage.setItem(stateKey, el.getAttribute('aria-pressed'));
    }
    else if (el.hasAttribute('aria-checked')) {
      localStorage.setItem(stateKey, el.getAttribute('aria-checked'));
    }
    else if (el.hasAttribute('aria-selected')) {
      localStorage.setItem(stateKey, el.getAttribute('aria-selected'));
    }
    // Save custom state
    else if (el.hasAttribute('data-autosave-state')) {
      const state = el.getAttribute('data-autosave-state');
      localStorage.setItem(stateKey, state);
    }
    // Save button text (for dynamically generated elements)
    else if (tag === 'button' || role === 'button') {
      localStorage.setItem(fieldKey, el.textContent);
    }
  }

  function restoreElementState(el) {
    if (!isStatefulElement(el)) return;
    
    const tag = (el.tagName || '').toLowerCase();
    const stateKey = stateKeyForElement(el);
    const fieldKey = storageKeyForElement(el);
    
    // Restore traditional form fields
    if (tag === 'input' && el.type === 'checkbox') {
      const v = localStorage.getItem(fieldKey);
      if (v !== null) el.checked = v === '1';
    }
    else if (tag === 'input' && el.type === 'radio') {
      if (!el.name) return;
      const v = localStorage.getItem(radioKey(el.name));
      if (v !== null) {
        const sel = document.querySelector(`input[type="radio"][name="${el.name}"][value="${v}"]`);
        if (sel) sel.checked = true;
      }
    }
    else if (['select', 'input', 'textarea'].includes(tag)) {
      const v = localStorage.getItem(fieldKey);
      if (v !== null) el.value = v;
    }
    // Restore content-editable
    else if (el.isContentEditable) {
      const v = localStorage.getItem(fieldKey);
      if (v !== null) el.innerHTML = v;
    }
    // Restore toggle states
    else if (el.hasAttribute('aria-pressed')) {
      const v = localStorage.getItem(stateKey);
      if (v !== null) el.setAttribute('aria-pressed', v);
    }
    else if (el.hasAttribute('aria-checked')) {
      const v = localStorage.getItem(stateKey);
      if (v !== null) el.setAttribute('aria-checked', v);
    }
    else if (el.hasAttribute('aria-selected')) {
      const v = localStorage.getItem(stateKey);
      if (v !== null) el.setAttribute('aria-selected', v);
    }
    // Restore custom state
    else if (el.hasAttribute('data-autosave-state')) {
      const v = localStorage.getItem(stateKey);
      if (v !== null) el.setAttribute('data-autosave-state', v);
    }
    // Restore button text
    else if (tag === 'button' || (el.getAttribute('role') === 'button')) {
      const v = localStorage.getItem(fieldKey);
      if (v !== null) el.textContent = v;
    }
  }

  // Initialize element with event listeners
  function initStatefulElement(el) {
    if (el.dataset.autosaveInited === '1') return;
    el.dataset.autosaveInited = '1';
    
    restoreElementState(el);
    
    const saver = debounce(() => saveElementState(el), SAVE_DEBOUNCE);
    
    // Different events for different element types
    if (el.isContentEditable) {
      el.addEventListener('input', saver, { passive: true });
      el.addEventListener('blur', saver, { passive: true });
    } 
    else if (['input', 'textarea', 'select'].includes(el.tagName.toLowerCase())) {
      el.addEventListener('input', saver, { passive: true });
      el.addEventListener('change', saver, { passive: true });
    } 
    else {
      // For buttons, toggles, and custom elements
      el.addEventListener('click', saver, { passive: true });
      el.addEventListener('change', saver, { passive: true });
      el.addEventListener('keyup', saver, { passive: true });
    }
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
    } catch (e) {
      console.error('Autosave init error', e);
    }
  }

  // ---------------- observation and hooking ----------------
  function initialAssignAndInit() {
    // Assign IDs to all potential stateful elements
    const potentialElements = document.querySelectorAll(`
      input, textarea, select, [contenteditable], 
      button, a, [role="button"], [role="checkbox"], 
      [role="switch"], [aria-pressed], [aria-checked],
      [data-autosave-state]
    `);
    potentialElements.forEach(assignIdIfMissing);
    
    // Initialize all stateful elements
    initAllStatefulElements(document);
  }

  const globalObserver = new MutationObserver(mutations => {
    for (const mutation of mutations) {
      // Handle added nodes
      if (mutation.addedNodes.length) {
        mutation.addedNodes.forEach(node => {
          if (node.nodeType === 1) {
            // Assign IDs to new elements and their children
            assignIdsRecursively(node);
            // Initialize any stateful elements in the new subtree
            initAllStatefulElements(node);
          }
        });
      }
      
      // Handle attribute changes
      if (mutation.type === 'attributes') {
        const el = mutation.target;
        if (isStatefulElement(el) && !el.dataset.autosaveInited) {
          initStatefulElement(el);
        }
        // If element becomes stateful
        else if (isStatefulElement(el) && mutation.attributeName.startsWith('aria-')) {
          saveElementState(el);
        }
      }
    }
  });

  // ---------------- bootstrap ----------------
  function startAutosave() {
    initialAssignAndInit();
    
    // Observe entire document
    globalObserver.observe(document.documentElement, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: [
        'id', 
        'data-autosave-id',
        'contenteditable',
        'aria-pressed',
        'aria-checked',
        'aria-selected',
        'role',
        'data-autosave-state'
      ]
    });
    
    // Save before page unload
    window.addEventListener('beforeunload', () => {
      document.querySelectorAll('[data-autosave-managed]').forEach(saveElementState);
    });
    
    console.info('Autosave: Enhanced state management active');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startAutosave);
  } else {
    startAutosave();
  }
})();
