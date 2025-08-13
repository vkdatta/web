(function () {
  const STORAGE_PREFIX = 'autosave-';

  function generateId(el) {
    if (!el.id) {
      el.id = STORAGE_PREFIX + Math.random().toString(36).substr(2, 9);
    }
    return el.id;
  }

  function saveValue(el) {
    const id = generateId(el);
    let value;
    if (el.type === 'checkbox') {
      value = el.checked;
    } else if (el.type === 'radio') {
      // Save the selected radio group's value
      const name = el.name;
      if (name) {
        const selected = document.querySelector(`input[type="radio"][name="${name}"]:checked`);
        if (selected) {
          localStorage.setItem(STORAGE_PREFIX + 'radio-' + name, selected.value);
        }
        return;
      }
    } else if (el.tagName.toLowerCase() === 'select') {
      value = el.value;
    } else {
      value = el.value;
    }
    if (value !== undefined) {
      localStorage.setItem(id, value);
    }
  }

  function restoreValue(el) {
    const id = generateId(el);
    if (el.type === 'checkbox') {
      el.checked = localStorage.getItem(id) === 'true';
    } else if (el.type === 'radio') {
      const name = el.name;
      const savedValue = localStorage.getItem(STORAGE_PREFIX + 'radio-' + name);
      if (savedValue !== null && el.value === savedValue) {
        el.checked = true;
      }
    } else if (el.tagName.toLowerCase() === 'select') {
      const saved = localStorage.getItem(id);
      if (saved !== null) el.value = saved;
    } else {
      const saved = localStorage.getItem(id);
      if (saved !== null) el.value = saved;
    }
  }

  function initField(el) {
    restoreValue(el);
    el.addEventListener('input', () => saveValue(el));
    el.addEventListener('change', () => saveValue(el)); // for checkboxes, radios, selects
  }

  function init() {
    const fields = document.querySelectorAll('input, textarea, select');
    fields.forEach(initField);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
