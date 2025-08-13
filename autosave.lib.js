<script>
(function () {
  const STORAGE_PREFIX = 'autosave-';

  function makeBaseId(el) {
    let base = (el.name || el.placeholder || el.type || 'field')
      .toLowerCase()
      .replace(/\s+/g, '')
      .substring(0, 10)
      .trim();
    if (!base) base = 'field';
    return base;
  }

  function generateUniqueId(el) {
    let base = makeBaseId(el);
    let id = base;
    let counter = 1;

    // Keep looping until we find a unique ID in DOM
    while (document.getElementById(id)) {
      id = base + '-' + counter++;
    }

    el.id = id;
    return id;
  }

  function saveValue(el) {
    const id = el.id || generateUniqueId(el);
    let value;

    if (el.type === 'checkbox') {
      value = el.checked;
    } else if (el.type === 'radio') {
      if (el.name) {
        const selected = document.querySelector(`input[type="radio"][name="${el.name}"]:checked`);
        if (selected) {
          localStorage.setItem(STORAGE_PREFIX + 'radio-' + el.name, selected.value);
        }
        return;
      }
    } else {
      value = el.value;
    }

    localStorage.setItem(STORAGE_PREFIX + id, value);
  }

  function restoreValue(el) {
    const id = el.id || generateUniqueId(el);

    if (el.type === 'checkbox') {
      el.checked = localStorage.getItem(STORAGE_PREFIX + id) === 'true';
    } else if (el.type === 'radio') {
      const savedValue = localStorage.getItem(STORAGE_PREFIX + 'radio-' + el.name);
      if (el.value === savedValue) {
        el.checked = true;
      }
    } else {
      const saved = localStorage.getItem(STORAGE_PREFIX + id);
      if (saved !== null) el.value = saved;
    }
  }

  function initField(el) {
    restoreValue(el);
    el.addEventListener('input', () => saveValue(el));
    el.addEventListener('change', () => saveValue(el));
  }

  document.addEventListener('DOMContentLoaded', () => {
    const fields = document.querySelectorAll('input, textarea, select');
    fields.forEach(el => {
      if (!el.id) generateUniqueId(el);
      initField(el);
    });
  });
})();
</script>
