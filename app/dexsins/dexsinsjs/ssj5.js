(function () {
  'use strict';

  const cache  = new Map();
  const active = new Set();

  const _style = document.createElement('style');
  _style.textContent = 'dextools-import{display:contents}';
  (document.head || document.documentElement).appendChild(_style);

  function fetchSync(src) {
    if (cache.has(src)) return cache.get(src);
    try {
      const xhr = new XMLHttpRequest();
      xhr.open('GET', src, false);
      xhr.send(null);
      if (xhr.status === 200 || xhr.status === 0) {
        cache.set(src, xhr.responseText);
        return xhr.responseText;
      }
    } catch (e) {}
    return null;
  }

  const escHtml  = s => String(s).replace(/[&<>"']/g, c =>
    ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":"&#39;" }[c])
  );
  const escRegex = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  class DextoolsImport extends HTMLElement {
    connectedCallback() {
      const src = this.getAttribute('src');

      if (!src || /^(https?:)?\/\//i.test(src)) return;

      if (active.has(src)) {
        console.warn('[dextools-import] circular import skipped:', src);
        return;
      }

      const raw = fetchSync(src);
      if (raw === null) {
        console.error('[dextools-import] failed to load:', src);
        return;
      }

      let html = raw;
      this.getAttributeNames().forEach(attr => {
        if (!attr.startsWith('data-')) return;
        const key = attr.slice(5);
        const val = escHtml(this.getAttribute(attr));
        html = html.replace(new RegExp(`{{${escRegex(key)}}}`, 'g'), val);
      });

      active.add(src);
      this.innerHTML = html;
      active.delete(src);
    }
  }

  customElements.define('dextools-import', DextoolsImport);

})();
