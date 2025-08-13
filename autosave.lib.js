(function () {
  var STORAGE_PREFIX = 'autosave-';

  function formIdentifier(form) {
    if (!form) return location.pathname;
    if (form.dataset && form.dataset.autosaveFormKey) return form.dataset.autosaveFormKey;
    if (form.action) return form.action;
    if (form.id) return 'form-id-' + form.id;
    // fallback to index among forms on page
    return location.pathname + '#form-' + Array.prototype.indexOf.call(document.forms, form);
  }

  function storageKeyFor(el) {
    // explicit override
    if (el.dataset && el.dataset.autosaveKey) return STORAGE_PREFIX + el.dataset.autosaveKey;

    if (el.id) return STORAGE_PREFIX + 'id-' + el.id;

    if (el.name) {
      var formKey = formIdentifier(el.form);
      return STORAGE_PREFIX + 'name-' + formKey + '::' + el.name;
    }

    // final fallback: deterministic DOM path
    var parts = [], node = el;
    while (node && node !== document) {
      var tag = node.tagName.toLowerCase();
      var sibIndex = 0;
      var sib = node;
      while (sib = sib.previousElementSibling) {
        if (sib.tagName === node.tagName) sibIndex++;
      }
      parts.unshift(tag + (sibIndex ? '[' + sibIndex + ']' : ''));
      node = node.parentElement;
    }
    return STORAGE_PREFIX + 'path-' + parts.join('>');
  }

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
      // silently fail on storage exceptions (private mode etc.)
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
    // opt-out: if data-autosave="false" skip this element
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

  // public API
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
})()
