(function () {
  'use strict';

  /* ── Preflight: intercept XHR failures, show error page if any file is missing ── */
  const _missingFiles = [];
  const _OrigXHR = window.XMLHttpRequest;

  function _PatchedXHR() {
    const _xhr = new _OrigXHR();
    let _url = '';
    const _origOpen = _xhr.open.bind(_xhr);
    _xhr.open = function (method, url, async, user, pass) {
      _url = url;
      return _origOpen(method, url, async, user, pass);
    };
    const _origSend = _xhr.send.bind(_xhr);
    _xhr.send = function (body) {
      try { _origSend(body); } catch (e) { /* network error */ }
      if (_url && (_xhr.status === 0 || _xhr.status >= 400)) {
        console.error('[dextools] Missing file:', _url);
        _missingFiles.push(_url);
        setTimeout(_showErrorPage, 0);
      }
    };
    return _xhr;
  }
  Object.setPrototypeOf(_PatchedXHR, _OrigXHR);
  Object.assign(_PatchedXHR, _OrigXHR);
  window.XMLHttpRequest = _PatchedXHR;

  function _showErrorPage() {
    if (!_missingFiles.length) return;
    console.error('[dextools] Page blocked. Missing files:\n' + _missingFiles.join('\n'));
    const rows = _missingFiles.map(function (f, i) {
      return '<tr><td>' + (i + 1) + '</td><td>' + f + '</td><td>Missing</td></tr>';
    }).join('');
    document.documentElement.innerHTML = '<head><meta charset="UTF-8"><title>Import Error</title></head><body>'
      + '<div style="font-family:sans-serif;background:#0f1117;color:#e2e8f0;min-height:100vh;display:flex;align-items:center;justify-content:center;margin:0;padding:2rem;">'
      + '<div style="background:#1a1d27;border:1px solid #2d3148;border-radius:12px;max-width:720px;width:100%;overflow:hidden;">'
      + '<div style="background:#1e2235;padding:1.5rem 2rem;border-bottom:1px solid #2d3148;">'
      + '<h1 style="color:#f87171;font-size:1.2rem;margin:0;">&#9888; Page failed to load</h1>'
      + '<p style="color:#94a3b8;font-size:.85rem;margin:.3rem 0 0;">' + _missingFiles.length + ' missing file(s) blocked rendering</p>'
      + '</div>'
      + '<div style="padding:1.5rem 2rem;">'
      + '<table style="width:100%;border-collapse:collapse;font-size:.875rem;">'
      + '<thead><tr>'
      + '<th style="text-align:left;padding:.6rem .75rem;color:#64748b;font-size:.75rem;text-transform:uppercase;border-bottom:1px solid #2d3148;">#</th>'
      + '<th style="text-align:left;padding:.6rem .75rem;color:#64748b;font-size:.75rem;text-transform:uppercase;border-bottom:1px solid #2d3148;">File</th>'
      + '<th style="text-align:left;padding:.6rem .75rem;color:#64748b;font-size:.75rem;text-transform:uppercase;border-bottom:1px solid #2d3148;">Status</th>'
      + '</tr></thead><tbody>' + rows + '</tbody></table>'
      + '</div>'
      + '<div style="background:#13161f;border-top:1px solid #2d3148;padding:1rem 2rem;font-size:.8rem;color:#475569;">Fix the missing files above and reload the page.</div>'
      + '</div></div></body>';
  }
  /* ── End preflight ── */


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
