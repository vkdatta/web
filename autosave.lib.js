<script><![CDATA[
(function () {
  const STORAGE_PREFIX = 'autosave-';
  const usedIds = new Set();

  function generateId(el, index) {
    let base = (el.id || el.name || el.tagName + index)
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '-')        // replace spaces with dash
      .substring(0, 10);           // take first 10 chars

    if (!base) base = 'field-' + index;

    let unique = base;
    let counter = 1;
    while (usedIds.has(unique)) {
      unique = base + '-' + counter++;
    }
    usedIds.add(unique);
    el.id = unique;
    return STORAGE_PREFIX + unique;
  }

  function saveValue(el, index) {
    const id = generateId(el, index);
    let value;

    if (el.type === 'checkbox') {
      value = el.checked;
    } else if (el.type === 'radio') {
      const name = el.name;
      if (name) {
        const selected = document.querySelector(`input[type="radio"][name="${name}"]:checked`);
        if (selected) {
          localStorage.setItem(STORAGE_PREFIX + 'radio-' + name, selected.value);
        }
        return;
      }
    } else {
      value = el.value;
    }
    localStorage.setItem(id, value);
  }

  function restoreValue(el, index) {
    const id = generateId(el, index);
    if (el.type === 'checkbox') {
      el.checked = localStorage.getItem(id) === 'true';
    } else if (el.type === 'radio') {
      const name = el.name;
      const savedValue = localStorage.getItem(STORAGE_PREFIX + 'radio-' + name);
      if (el.value === savedValue) {
        el.checked = true;
      }
    } else {
      const saved = localStorage.getItem(id);
      if (saved !== null) el.value = saved;
    }
  }

  function initField(el, index) {
    restoreValue(el, index);
    el.addEventListener('input', () => saveValue(el, index));
    el.addEventListener('change', () => saveValue(el, index));
  }

  document.addEventListener('DOMContentLoaded', () => {
    const fields = document.querySelectorAll('input, textarea, select');
    fields.forEach((el, idx) => initField(el, idx));
  });
})();
]]></script>
