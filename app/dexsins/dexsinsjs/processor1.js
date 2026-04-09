(function () {
  'use strict';
  const TAG       = 'dextools-import';
  const MAX_DEPTH = 32;
  const LOG       = '[dextools]';
  function resolveURL(src) {
    try {
      return new URL(src.trim(), document.baseURI || location.href).href;
    } catch (_) {
      return src.trim();
    }
  }
  function fetchSync(url) {
    const xhr = new XMLHttpRequest();
    try {
      xhr.open('GET', url, true );
      xhr.send(null);
    } catch (e) {
      console.error(LOG, 'Network error fetching:', url, e);
      return null;
    }
    if (xhr.status >= 200 && xhr.status < 300) return xhr.responseText;
    console.error(LOG, `HTTP ${xhr.status} fetching: ${url}`);
    return null;
  }
  function applyData(html, element) {
    const dataset = element.dataset;
    return html.replace(/\{\{\s*([a-zA-Z0-9_-]+)\s*\}\}/g, (match, key) => {
      const camel = key.replace(/-([a-z])/g, (_, l) => l.toUpperCase());
      if (key in dataset)   return dataset[key];
      if (camel in dataset) return dataset[camel];
      return match;
    });
  }
  function inject(anchor, html) {
    const tpl = document.createElement('template');
    tpl.innerHTML = html;
    const frag  = document.createDocumentFragment();
    const nodes = Array.from(tpl.content.childNodes);
    for (const node of nodes) {
      if (node.nodeType === Node.ELEMENT_NODE && node.nodeName === 'SCRIPT') {
        const s = document.createElement('script');
        for (const { name, value } of node.attributes) s.setAttribute(name, value);
        s.textContent = node.textContent;
        frag.appendChild(s);
      } else {
        frag.appendChild(document.importNode(node, true));
      }
    }
    anchor.parentNode.insertBefore(frag, anchor);
    anchor.parentNode.removeChild(anchor);
  }
  class DextoolsImport extends HTMLElement {
    connectedCallback() {
      const src = this.getAttribute('src');
      if (!src || !src.trim()) {
        console.warn(LOG, '<dextools-import> missing src — skipped.');
        this.remove();
        return;
      }
      const depth = parseInt(this.getAttribute('data-dxt-depth') || '0', 10);
      if (depth > MAX_DEPTH) {
        console.error(LOG, `Max depth (${MAX_DEPTH}) exceeded — possible circular import: ${src}`);
        this.remove();
        return;
      }
      let html = fetchSync(resolveURL(src));
      if (html !== null) inject(this, applyData(html, this));
      else this.remove();
    }
  }
  if (!customElements.get(TAG)) {
    customElements.define(TAG, DextoolsImport);
  }
})();
