(function () {
  var STORAGE_PREFIX = 'autosave-';

  // --- helper: generate a safe base string from element attributes ---
  function makeBaseString(el) {
    // choose a stable source: prefer explicit data-autosave-key, then name, placeholder, aria-label, type+tag
    var src = (el.dataset && el.dataset.autosaveKey) ||
              el.name ||
              el.placeholder ||
              el.getAttribute && el.getAttribute('aria-label') ||
              (el.type ? (el.type + '-' + el.tagName.toLowerCase()) : el.tagName.toLowerCase());

    if (!src) src = 'field';

    // normalize: trim, lowercase, collapse whitespace, keep alnum and dash/underscore
    src = String(src).trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9\-_]/g, '');

    // left(10)
    return src.slice(0, 10) || 'field';
  }

  // --- helper: ensure a unique id on element, using base + -1, -2 ... if required ---
  function ensureGeneratedId(el) {
    if (el.id) return el.id; // respect existing ids

    var base = makeBaseString(el);
    var candidate = base;
    var suffix = 1;

    // if candidate is empty (shouldn't happen), fallback
    if (!candidate) candidate = 'field';

    // if an element with this id exists and it's not the same element, append suffix until unique
    while (true) {
      var existing = document.getElementById(candidate);
      if (!existing) break;
      if (existing === el) break; // already assigned to this element
      candidate = base + '-' + suffix;
      suffix++;
    }

    // assign the id to the element (now unique)
    try {
      el.id = candidate;
    } catch (e) {
      // some elements might be read-only for id in weird DOMs; ignore
      console.warn('autosave: failed to assign generated id', e);
    }

    return candidate;
  }

  // --- form identifier (unchanged except small normalization) ---
  function formIdentifier(form) {
    if (!form) return location.pathname;
    if (form.dataset && form.dataset.autosaveFormKey) return form.dataset.autosaveFormKey;
    if (form.action) return 'action:' + form.action;
    if (form.id) return 'form-id-' + form.id;
    return location.pathname + '#form-' + Array.prototype.indexOf.call(document.forms, form);
  }

  // --- storage key builder: uses data-autosave-key, id (generated if missing), name+form, or deterministic path as fallback ---
  function storageKeyFor(el) {
    // explicit override
    if (el.dataset && el.dataset.autosaveKey) return STORAGE_PREFIX + el.dataset.autosaveKey;

    // prefer real id when present in markup; if missing, generate one using the requested method
    if (!el.id) {
      // generate id according to: tolower(trim(left(10))) and resolve duplicates with -1,-2,...
      ensureGeneratedId(el);
    }
    if (el.id) return STORAGE_PREFIX + 'id-' + el.id;

    // prefer name within form context (should be reached only if id generation failed)
    if (el.name) {
      var formKey = formIdentifier(el.form);
      return STORAGE_PREFIX + 'name-' + formKey + '::' + el.name;
    }

    // final fallback: deterministic DOM path (rarely used because we prefer generated id)
    var parts = [], node = el;
    while (node && node !== document) {
      var tag = node.tagName.toLowerCase();
      var sibIndex = 0;
      var sib = node;
      while (sib = sib.previousElementSibling) {
        if (sib.tagName && sib.tagName.toLowerCase() === tag) sibIndex++;
      }
      parts.unshift(tag + (sibIndex ? '[' + sibIndex + ']' : ''));
      node = node.parentElement;
    }
    return STORAGE_PREFIX + 'path-' + parts.join('>');
  }

  // --- rest of your autosave code (unchanged) ---
  function saveValue(el) {
    try {
      if (el.type === 'radio') {
        var name = el.name;
        if (!name) return;
        var selected = document.querySelector('input[type="radio"][name="' + name + '"]:checked');
        if (selected) {
          var key = STORAGE_PREFIX + 'radio-' + formIdentifier(el.form) + '::' + name;
          localStorage.setItem(key, selected.value);
        }
        return;
      }

      var key = storageKeyFor(el);

      if (el.type === 'checkbox') {
        localStorage.setItem(key, el.checked ? '1' : '0');
        return;
      }

      // select or text-like
      localStorage.setItem(key, el.value == null ? '' : String(el.value));
    } catch (e) {
      console.warn('autosave: storage failed', e);
    }
  }

  function restoreValue(el) {
    try {
      if (el.type === 'radio') {
        var key = STORAGE_PREFIX + 'radio-' + formIdentifier(el.form) + '::' + el.name;
        var saved = localStorage.getItem(key);
        if (saved !== null && el.value === saved) el.checked = true;
        return;
      }

      var key = storageKeyFor(el);
      var saved = localStorage.getItem(key);
      if (saved === null) return;

      if (el.type === 'checkbox') {
        el.checked = saved === '1';
        return;
      }

      // select or inputs
      el.value = saved;
    } catch (e) {
      console.warn('autosave: restore failed', e);
    }
  }

  function initField(el) {
    if (el.dataset && el.dataset.autosave === 'false') return;
    restoreValue(el);
    el.addEventListener('input', function () { saveValue(el); }, false);
    el.addEventListener('change', function () { saveValue(el); }, false);
  }

  function initAll() {
    var fields = document.querySelectorAll('input, textarea, select');
    Array.prototype.forEach.call(fields, initField);
  }

  document.addEventListener('DOMContentLoaded', initAll, false);

  window.AutoSave = {
    init: initAll,
    clearAll: function () {
      for (var i = localStorage.length - 1; i >= 0; i--) {
        var k = localStorage.key(i);
        if (k && k.indexOf(STORAGE_PREFIX) === 0) localStorage.removeItem(k);
      }
    },
    removeKey: function (keySuffix) { localStorage.removeItem(STORAGE_PREFIX + keySuffix); }
  };
})();
