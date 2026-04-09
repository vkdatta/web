(function () {
  'use strict';

  const TAG = 'dextools-import';
  const MAX_DEPTH = 32;
  const LOG = '[dextools]';
  const cache = new Map();

  function resolveURL(src) {
    try {
      return new URL(src.trim(), document.baseURI || location.href).href;
    } catch (_) {
      return src.trim();
    }
  }

  async function fetchCached(url) {
    if (cache.has(url)) return cache.get(url);

    const promise = fetch(url)
      .then(res => {
        if (!res.ok) {
          console.error(LOG, `HTTP ${res.status} fetching: ${url}`);
          return null;
        }
        return res.text();
      })
      .catch(err => {
        console.error(LOG, 'Network error fetching:', url, err);
        return null;
      });

    cache.set(url, promise);
    return promise;
  }

  function applyData(html, element) {
    const dataset = element.dataset;

    return html.replace(/\{\{\s*([a-zA-Z0-9_-]+)\s*\}\}/g, (match, key) => {
      const camel = key.replace(/-([a-z])/g, (_, l) => l.toUpperCase());
      if (key in dataset) return dataset[key];
      if (camel in dataset) return dataset[camel];
      return match;
    });
  }

  function inject(anchor, html) {
    const tpl = document.createElement('template');
    tpl.innerHTML = html;

    const frag = document.createDocumentFragment();
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

    const parent = anchor.parentNode;
    if (!parent) return;

    parent.insertBefore(frag, anchor);
    parent.removeChild(anchor);

    document.dispatchEvent(
      new CustomEvent('dextools:loaded', {
        detail: { src: anchor.getAttribute('src') || '' }
      })
    );
  }

  class DextoolsImport extends HTMLElement {
    async connectedCallback() {
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

      const url = resolveURL(src);
      let html = await fetchCached(url);

      if (html !== null) {
        html = applyData(html, this);
        inject(this, html);
      } else {
        this.remove();
      }
    }
  }

  if (!customElements.get(TAG)) {
    customElements.define(TAG, DextoolsImport);
  }
})();
