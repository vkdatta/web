/**
 * dextools-preprocessor.js
 * Synchronous HTML imports — injected during parsing, before CSS/JS runs.
 *
 * Usage (in <head>, NO defer, NO async):
 *   <script src="https://<you>.github.io/<repo>/dextools-preprocessor.js"></script>
 *
 * Then anywhere in markup:
 *   <dextools-import src="./partials/header.html"></dextools-import>
 */

(function () {
  'use strict';

  const TAG       = 'dextools-import';
  const MAX_DEPTH = 32;
  const LOG       = '[dextools]';

  /* ── Resolve src relative to current page ── */
  function resolveURL(src) {
    try {
      return new URL(src.trim(), document.baseURI || location.href).href;
    } catch (_) {
      return src.trim();
    }
  }

  /* ── Synchronous XHR — blocks the parser until response arrives ── */
  function fetchSync(url) {
    const xhr = new XMLHttpRequest();
    try {
      xhr.open('GET', url, false /* synchronous */);
      xhr.send(null);
    } catch (e) {
      console.error(LOG, 'Network error fetching:', url, e);
      return null;
    }
    if (xhr.status >= 200 && xhr.status < 300) return xhr.responseText;
    console.error(LOG, `HTTP ${xhr.status} fetching: ${url}`);
    return null;
  }

  /* ── Splice fetched HTML into the live document ── */
  function inject(anchor, html) {
    const tpl = document.createElement('template');
    tpl.innerHTML = html;

    const frag  = document.createDocumentFragment();
    const nodes = Array.from(tpl.content.childNodes);

    for (const node of nodes) {
      if (node.nodeType === Node.ELEMENT_NODE && node.nodeName === 'SCRIPT') {
        /* innerHTML script nodes are inert — re-create so they execute */
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

  /* ── Custom Element ── MUST use "class extends" — ES5 won't work ── */
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

      const html = fetchSync(resolveURL(src));
      if (html !== null) inject(this, html);
      else this.remove();
    }
  }

  if (!customElements.get(TAG)) {
    customElements.define(TAG, DextoolsImport);
  }

})();
