(function () {
  'use strict';

  /* ── Preflight: check all <dextools-import src> files before doing anything ── */
  const missingFiles = [];
  document.querySelectorAll('dextools-import[src]').forEach(function (el) {
    const url = el.getAttribute('src').trim();
    if (!url) return;
    const xhr = new XMLHttpRequest();
    try {
      xhr.open('GET', url, false);
      xhr.send(null);
    } catch (e) { /* network error */ }
    if (xhr.status === 0 || xhr.status >= 400) missingFiles.push(url);
  });

  if (missingFiles.length > 0) {
    const rows = missingFiles.map(function (f, i) {
      return '<tr><td>' + (i + 1) + '</td><td><code>' + f + '</code></td><td>Missing</td></tr>';
    }).join('');
    document.open();
    document.write('<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Import Error</title>'
      + '<style>body{font-family:sans-serif;background:#0f1117;color:#e2e8f0;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0}'
      + '.card{background:#1a1d27;border:1px solid #2d3148;border-radius:12px;max-width:720px;width:100%;overflow:hidden}'
      + '.hd{background:#1e2235;padding:1.5rem 2rem;border-bottom:1px solid #2d3148}'
      + '.hd h1{color:#f87171;font-size:1.2rem;margin:0}.hd p{color:#94a3b8;font-size:.85rem;margin:.25rem 0 0}'
      + '.bd{padding:1.5rem 2rem}table{width:100%;border-collapse:collapse;font-size:.875rem}'
      + 'th{text-align:left;padding:.6rem .75rem;color:#64748b;font-size:.75rem;text-transform:uppercase;border-bottom:1px solid #2d3148}'
      + 'td{padding:.65rem .75rem;border-bottom:1px solid #1e2235}td:first-child{color:#475569;width:2rem;text-align:center}'
      + 'td code{color:#fbbf24;font-family:monospace;word-break:break-all}'
      + 'td:last-child{color:#f87171;font-size:.8rem}.ft{background:#13161f;border-top:1px solid #2d3148;padding:1rem 2rem;font-size:.8rem;color:#475569}'
      + '</style></head><body><div class="card">'
      + '<div class="hd"><h1>⚠️ Page failed to load</h1><p>' + missingFiles.length + ' missing file(s) blocked rendering</p></div>'
      + '<div class="bd"><table><thead><tr><th>#</th><th>File</th><th>Status</th></tr></thead><tbody>' + rows + '</tbody></table></div>'
      + '<div class="ft">Fix the missing files above, then reload.</div>'
      + '</div></body></html>');
    document.close();
    return;
  }
  /* ── End preflight ───────────────────────────────────────────────────────── */


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
      xhr.open('GET', url, false );
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
