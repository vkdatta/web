(function () {
  var STORAGE_PREFIX = 'autosave-';

  // quick localStorage availability test
  function lsAvailable() {
    try {
      var t = '__autosave_test__';
      localStorage.setItem(t, t);
      localStorage.removeItem(t);
      return true;
    } catch (e) {
      return false;
    }
  }
  var LS_OK = lsAvailable();

  // compute deterministic DOM path for element (tag[index]>... up to document)
  function domPath(el) {
    var parts = [], node = el;
    while (node && node.nodeType === 1 && node !== document) {
      var tag = node.tagName.toLowerCase();
      var idx = 1;
      var sib = node;
      while (sib = sib.previousElementSibling) {
        if (sib.tagName && sib.tagName.toLowerCase() === tag) idx++;
      }
      parts.unshift(tag + (idx > 1 ? '[' + idx + ']' : ''));
      node = node.parentElement;
    }
    return parts.join('>');
  }

  // make base string: toLower(trim(left(10))) from stable attributes
  function makeBaseString(el) {
    var src = (el.dataset && el.dataset.autosaveKey) ||
              el.name ||
              el.placeholder ||
              (el.getAttribute && el.getAttribute('aria-label')) ||
              (el.type ? (el.type + '-' + el.tagName.toLowerCase()) : el.tagName.toLowerCase());

    if (!src) src = 'field';
    src = String(src).trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9\-_]/g, '');
    return (src.slice(0, 10) || 'field');
  }

  // Ensure (and persist) a generated id for elements that don't have one already.
  // Uses localStorage mapping: STORAGE_PREFIX + 'idmap:' + path => generated-id
  function ensureGeneratedId(el) {
    if (el.id) return el.id;

    var path = domPath(el);
    var mapKey = STORAGE_PREFIX + 'idmap:' + path;

    try {
      if (LS_OK) {
        var mapped = localStorage.getItem(mapKey);
        if (mapped) {
          // if mapped id currently free or assigned to this element, reuse it
          var existing = document.getElementById(mapped);
          if (!existing || existing === el) {
            try { el.id = mapped; } catch (e) { /* ignore */ }
            return el.id;
          }
          // otherwise mapping points to someone else — we'll generate a new id and overwrite mapping
        }
      }
    } catch (e) {
      console.warn('autosave: idmap read failed', e);
    }

    // generate base and disambiguate with -1,-2...
    var base = makeBaseString(el) || 'field';
    var candidate = base;
    var suffix = 1;
    // ensure unique in document
    while (document.getElementById(candidate)) {
      candidate = base + '-' + suffix;
      suffix++;
      // safety break (extremely unlikely)
      if (suffix > 10000) break;
    }

    try {
      el.id = candidate;
    } catch (e) {
      console.warn('autosave: failed assigning id', e);
    }

    try {
      if (LS_OK) localStorage.setItem(mapKey, candidate);
    } catch (e) {
      console.warn('autosave: idmap write failed', e);
    }

    return el.id;
  }

  // build the storage key for an element (data-autosave-key, id-based (generated if needed), name-with-form, fallback path)
  function storageKeyFor(el) {
    if (!el) return null;

    // explicit override
    if (el.dataset && el.dataset.autosaveKey) return STORAGE_PREFIX + el.dataset.autosaveKey;

    // if has id already, use it
    if (el.id) return STORAGE_PREFIX + 'id-' + el.id;

    // try to ensure/persist a generated id
    var gid = ensureGeneratedId(el);
    if (gid) return STORAGE_PREFIX + 'id-' + gid;

    // fallback: name + form
    if (el.name) {
      var formKey = (function (form) {
        if (!form) return location.pathname;
        if (form.dataset && form.dataset.autosaveFormKey) return form.dataset.autosaveFormKey;
        if (form.action) return 'action:' + form.action;
        if (form.id) return 'form-id-' + form.id;
        return location.pathname + '#form-' + Array.prototype.indexOf.call(document.forms, form);
      })(el.form);
      return STORAGE_PREFIX + 'name-' + formKey + '::' + el.name;
    }

    // final fallback: path
    var path = domPath(el);
    return STORAGE_PREFIX + 'path-' + path;
  }

  // saving, restoring (radio uses special key)
  function formIdentifier(form) {
    if (!form) return location.pathname;
    if (form.dataset && form.dataset.autosaveFormKey) return form.dataset.autosaveFormKey;
    if (form.action) return 'action:' + form.action;
    if (form.id) return 'form-id-' + form.id;
    return location.pathname + '#form-' + Array.prototype.indexOf.call(document.forms, form);
  }

  function saveValue(el) {
    try {
      if (el.type === 'radio') {
        var name = el.name;
        if (!name) return;
        var selected = document.querySelector('input[type="radio"][name="' + name + '"]:checked');
        if (selected) {
          var key = STORAGE_PREFIX + 'radio-' + formIdentifier(el.form) + '::' + name;
          if (LS_OK) localStorage.setItem(key, selected.value);
        }
        return;
      }

      var key = storageKeyFor(el);
      if (!key) return;

      if (el.type === 'checkbox') {
        if (LS_OK) localStorage.setItem(key, el.checked ? '1' : '0');
        return;
      }

      if (LS_OK) localStorage.setItem(key, el.value == null ? '' : String(el.value));
    } catch (e) {
      console.warn('autosave: storage failed', e);
    }
  }

  function restoreValue(el) {
    try {
      if (el.type === 'radio') {
        var key = STORAGE_PREFIX + 'radio-' + formIdentifier(el.form) + '::' + el.name;
        if (!LS_OK) return;
        var saved = localStorage.getItem(key);
        if (saved !== null && el.value === saved) el.checked = true;
        return;
      }

      var key = storageKeyFor(el);
      if (!key) return;
      if (!LS_OK) return;
      var saved = localStorage.getItem(key);
      if (saved === null) return;

      if (el.type === 'checkbox') {
        el.checked = saved === '1';
        return;
      }

      el.value = saved;
    } catch (e) {
      console.warn('autosave: restore failed', e);
    }
  }

  function initField(el) {
    if (!el || (el.dataset && el.dataset.autosave === 'false')) return;
    restoreValue(el);
    el.addEventListener('input', function () { saveValue(el); }, false);
    el.addEventListener('change', function () { saveValue(el); }, false);
  }

  function initAll() {
    var fields = document.querySelectorAll('input, textarea, select');
    Array.prototype.forEach.call(fields, initField);
  }

  // Public API helpers (debug + migration)
  window.AutoSave = {
    init: initAll,
    clearAll: function () {
      try {
        for (var i = localStorage.length - 1; i >= 0; i--) {
          var k = localStorage.key(i);
          if (k && k.indexOf(STORAGE_PREFIX) === 0) localStorage.removeItem(k);
        }
      } catch (e) { console.warn('autosave: clearAll failed', e); }
    },
    removeKey: function (keySuffix) { try { localStorage.removeItem(STORAGE_PREFIX + keySuffix); } catch (e) { } },
    // debugging: return computed storage key for element
    keyFor: function (el) { try { return storageKeyFor(el); } catch (e) { return null; } },
    // migrate previous name-based keys into id-based scheme (run once if you changed earlier logic)
    migrateNameToId: function () {
      if (!LS_OK) { console.warn('autosave: localStorage not available - cannot migrate'); return; }
      try {
        var keys = [];
        for (var i = 0; i < localStorage.length; i++) { var k = localStorage.key(i); if (k) keys.push(k); }
        var prefix = STORAGE_PREFIX + 'name-';
        keys.forEach(function (k) {
          if (k.indexOf(prefix) === 0) {
            var rest = k.slice(prefix.length); // formKey::fieldname
            var parts = rest.split('::');
            if (parts.length !== 2) return;
            var name = parts[1];
            // try to find matching element(s) on page
            var selector = 'input[name="' + name + '"], textarea[name="' + name + '"], select[name="' + name + '"]';
            var els = document.querySelectorAll(selector);
            Array.prototype.forEach.call(els, function (el) {
              var newKey = storageKeyFor(el);
              if (!newKey) return;
              var val = localStorage.getItem(k);
              if (val !== null) localStorage.setItem(newKey, val);
            });
          }
        });
        console.info('autosave: migration done (name→id)');
      } catch (e) {
        console.warn('autosave: migration failed', e);
      }
    }
  };

  // auto-init
  document.addEventListener('DOMContentLoaded', initAll, false);
})();
