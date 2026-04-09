(function () {
  'use strict';
  const TAG       = 'dextools-import';
  const MAX_DEPTH = 32;
  const LOG       = '[dextools]';

  // ------------------------------------------------------------------
  // 1. Async helpers (used after initial sync preload)
  // ------------------------------------------------------------------
  function resolveURL(src) {
    try {
      return new URL(src.trim(), document.baseURI || location.href).href;
    } catch (_) {
      return src.trim();
    }
  }

  async function fetchAsync(url) {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        console.error(LOG, `HTTP ${response.status} fetching: ${url}`);
        return null;
      }
      return await response.text();
    } catch (e) {
      console.error(LOG, 'Network error fetching:', url, e);
      return null;
    }
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

  // ------------------------------------------------------------------
  // 2. Synchronous preloader (runs ONCE at script execution)
  //    This ensures all existing <dextools-import> tags are resolved
  //    BEFORE any subsequent <script> (like script.js) executes.
  // ------------------------------------------------------------------
  function syncPreload() {
    const imports = document.querySelectorAll(TAG);
    for (const el of imports) {
      const src = el.getAttribute('src');
      if (!src || !src.trim()) {
        console.warn(LOG, 'missing src — skipped.');
        el.remove();
        continue;
      }

      const depth = parseInt(el.getAttribute('data-dxt-depth') || '0', 10);
      if (depth > MAX_DEPTH) {
        console.error(LOG, `Max depth exceeded — possible circular import: ${src}`);
        el.remove();
        continue;
      }

      // Synchronous fetch (only during initial boot)
      let html = null;
      const xhr = new XMLHttpRequest();
      try {
        xhr.open('GET', resolveURL(src), false);  // false = synchronous
        xhr.send(null);
      } catch (e) {
        console.error(LOG, 'Network error (sync):', src, e);
      }
      if (xhr.status >= 200 && xhr.status < 300) {
        html = xhr.responseText;
      } else {
        console.error(LOG, `HTTP ${xhr.status} (sync) fetching: ${src}`);
      }

      if (html !== null) {
        inject(el, applyData(html, el));
      } else {
        el.remove();
      }
    }
  }

  // ------------------------------------------------------------------
  // 3. Async Custom Element (used for any dynamically added imports)
  // ------------------------------------------------------------------
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
        console.error(LOG, `Max depth exceeded — possible circular import: ${src}`);
        this.remove();
        return;
      }

      (async () => {
        const html = await fetchAsync(resolveURL(src));
        if (html !== null) {
          inject(this, applyData(html, this));
        } else {
          this.remove();
        }
      })();
    }
  }

  // ------------------------------------------------------------------
  // 4. Execution: preload synchronously, then define the custom element
  // ------------------------------------------------------------------
  syncPreload();                                   // <- makes DOM ready
  if (!customElements.get(TAG)) {
    customElements.define(TAG, DextoolsImport);
  }
})();
