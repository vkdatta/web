<script>
//<![CDATA[
(function () {
  const STORAGE_PREFIX = 'autosave-';
  const idMap = {}; // Track generated IDs to handle duplicates

  function makeBaseId(el) {
    let base = '';

    if (el.name) {
      base = el.name.trim().toLowerCase();
    } else if (el.placeholder) {
      base = el.placeholder.trim().toLowerCase();
    } else if (el.type) {
      base = el.type.trim().toLowerCase();
    } else {
      base = 'field';
    }

    // Limit to 10 chars for the base
    return base.substring(0, 10) || 'field';
  }

  function generateId(el) {
    if (el.id && el.id.trim()) return el.id;

    let baseId = makeBaseId(el);
    let newId = baseId;
    let counter = 1;

    // Ensure uniqueness
    while (idMap[newId]) {
      newId = `${baseId}-${counter++}`;
    }

    idMap[newId] = true;
    el.id = STORAGE_PREFIX + newId;
    return el.id;
  }

  function saveValue(el) {
    const id = generateId(el);
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

  function restoreValue(el) {
    const id = generateId(el);

    if (el.type === 'checkbox') {
      el.checked = localStorage.getItem(id) === 'true';
    } else if (el.type === 'radio') {
      const savedValue = localStorage.getItem(STORAGE_PREFIX + 'radio-' + el.name);
      if (el.value === savedValue) {
        el.checked = true;
      }
    } else {
      const saved = localStorage.getItem(id);
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
    fields.forEach(initField);
  });
})();
//]]>
</script>
