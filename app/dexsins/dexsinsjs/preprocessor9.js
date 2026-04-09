// dextools-import.js – Single file with built‑in validation and error nuking
(function () {
  'use strict';

  const TAG = 'dextools-import';
  const MAX_DEPTH = 32;
  const LOG = '[dextools]';

  // ---------- GLOBAL REQUEST LOG (for validation) ----------
  const requestLog = new Map(); // url -> { status, error }

  // Intercept XMLHttpRequest at the very top
  (function patchXHR() {
    const OriginalXHR = window.XMLHttpRequest;
    window.XMLHttpRequest = function () {
      const xhr = new OriginalXHR();
      let url = null;

      const originalOpen = xhr.open;
      xhr.open = function (method, u, async) {
        url = u;
        return originalOpen.apply(this, arguments);
      };

      const originalSend = xhr.send;
      xhr.send = function () {
        try {
          originalSend.apply(this, arguments);
        } catch (e) {
          // Network error (sync XHR throws)
          if (url) requestLog.set(url, { status: 0, error: e.message });
          throw e;
        }
        // Request completed synchronously
        if (url) {
          requestLog.set(url, {
            status: this.status,
            error: this.status === 0 ? 'Network error' : null
          });
        }
      };

      return xhr;
    };
    window.XMLHttpRequest.prototype = OriginalXHR.prototype;
  })();

  // ---------- ORIGINAL CODE X (with one small hook) ----------
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
      xhr.open('GET', url, false);
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

  // ---------- VALIDATION AND ERROR NUKE ----------
  function validateAfterImports() {
    // Gather all <dextools-import> src attributes that were attempted
    const elements = document.querySelectorAll(TAG);
    const attemptedSrcs = new Set();
    elements.forEach(el => {
      const src = el.getAttribute('src');
      if (src) attemptedSrcs.add(src);
    });

    // Also include any URLs from requestLog that were attempted but element removed
    const allAttempted = new Set([
      ...attemptedSrcs,
      ...[...requestLog.keys()].map(u => {
        // Convert absolute URL back to original src if possible (best effort)
        try {
          const url = new URL(u);
          return url.pathname;
        } catch { return u; }
      })
    ]);

    const missing = [];
    for (const src of allAttempted) {
      const resolved = resolveURL(src);
      const req = requestLog.get(resolved);
      if (!req || req.status < 200 || req.status >= 300) {
        missing.push({
          src,
          resolved,
          status: req ? req.status : 'Not requested',
          error: req?.error || 'Unknown'
        });
      }
    }

    if (missing.length > 0) {
      console.error(LOG, `❌ ${missing.length} import(s) failed. Replacing page.`);
      nukeWithErrorPage(missing);
    } else {
      console.log(LOG, '✅ All imports succeeded.');
    }
  }

  function nukeWithErrorPage(missing) {
    const items = missing.map(m => `
      <li>
        <code>${escapeHtml(m.src)}</code><br>
        <span style="opacity:0.8;">↳ ${escapeHtml(m.resolved)} — HTTP ${m.status} ${m.error}</span>
      </li>
    `).join('');

    const errorHtml = `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Import Validation Failed</title>
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{background:#0b0e14;color:#e4e6eb;font-family:system-ui,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;padding:2rem}
  .card{max-width:900px;width:100%;background:#1a1e29;border-radius:20px;box-shadow:0 25px 50px -12px #000c;border:1px solid #2c3344}
  .header{background:#c41e3a;padding:1.5rem 2rem;border-radius:20px 20px 0 0}
  .header h1{font-weight:600;font-size:1.8rem;color:#fff;display:flex;align-items:center;gap:12px}
  .header h1::before{content:"⚠️";font-size:2rem}
  .content{padding:2rem}
  .message{font-size:1.1rem;margin-bottom:1.5rem;color:#b0b8c5}
  .missing-list{background:#0f131a;border-radius:12px;padding:1.5rem;border:1px solid #2a3342;font-family:monospace;font-size:0.95rem;color:#f87171;max-height:60vh;overflow-y:auto}
  .missing-list li{margin-bottom:1.25rem;word-break:break-word}
  .footer{margin-top:1.5rem;font-size:0.9rem;color:#6b7a8f;text-align:right}
</style>
</head>
<body>
<div class="card">
  <div class="header"><h1>Import Validation Failed</h1></div>
  <div class="content">
    <div class="message">The following &lt;dextools-import&gt; sources could not be loaded:</div>
    <ul class="missing-list">${items}</ul>
    <div class="footer">Validation performed client‑side • Page replaced</div>
  </div>
</div>
</body>
</html>`;

    document.open();
    document.write(errorHtml);
    document.close();
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = String(text);
    return div.innerHTML;
  }

  // Run validation after everything settles
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(validateAfterImports, 0));
  } else {
    setTimeout(validateAfterImports, 0);
  }

  // Also observe for dynamically added imports (just in case)
  new MutationObserver(() => {}).observe(document.documentElement, { childList: true, subtree: true });
})();
