(function () {
  'use strict';
  const LOG = '[dextools-validator]';
  
  // Pre-validate all imports before the custom element loads anything
  function prevalidateImports() {
    const imports = Array.from(document.querySelectorAll('dextools-import'));
    const missing = [];
    const checked = new Set();
    
    for (const el of imports) {
      const src = el.getAttribute('src');
      if (!src || !src.trim()) continue;
      
      const url = new URL(src.trim(), document.baseURI || location.href).href;
      if (checked.has(url)) continue;
      checked.add(url);
      
      // Check if file exists with HEAD request
      const xhr = new XMLHttpRequest();
      try {
        xhr.open('HEAD', url, false);
        xhr.send(null);
        if (xhr.status >= 400 || xhr.status === 0) {
          missing.push({src: src.trim(), url, status: xhr.status});
        }
      } catch (e) {
        missing.push({src: src.trim(), url, error: e.message});
      }
    }
    
    if (missing.length > 0) {
      displayErrorPage(missing);
      return false;
    }
    return true;
  }
  
  function displayErrorPage(missing) {
    const list = missing.map(m => 
      `<li><code>${escapeHtml(m.src)}</code> — ${m.status ? `HTTP ${m.status}` : escapeHtml(m.error || 'Network Error')}</li>`
    ).join('');
    
    document.documentElement.innerHTML = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Import Error - Missing Files</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 20px;
    }
    .container {
      background: white;
      max-width: 800px;
      width: 100%;
      padding: 40px;
      border-radius: 16px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
    }
    .icon {
      width: 64px;
      height: 64px;
      background: #fee2e2;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 20px;
    }
    .icon::before {
      content: "⚠️";
      font-size: 32px;
    }
    h1 { 
      color: #dc2626; 
      font-size: 28px;
      margin-bottom: 12px;
    }
    p { 
      color: #4b5563; 
      margin-bottom: 24px;
      line-height: 1.6;
    }
    .file-list {
      background: #fef2f2;
      border: 1px solid #fecaca;
      border-radius: 8px;
      padding: 20px;
      margin-bottom: 20px;
    }
    .file-list h3 {
      color: #991b1b;
      font-size: 14px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 12px;
    }
    ul { 
      list-style: none;
    }
    li { 
      padding: 10px 0;
      border-bottom: 1px solid #fecaca;
      color: #7f1d1d;
      font-family: 'Courier New', monospace;
      font-size: 14px;
    }
    li:last-child { border-bottom: none; }
    code { 
      background: #fee2e2; 
      padding: 4px 8px; 
      border-radius: 4px; 
      font-weight: 600;
    }
    .footer {
      color: #6b7280;
      font-size: 14px;
      text-align: center;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="icon"></div>
    <h1>Cannot Load Website</h1>
    <p>The following files referenced by <code>&lt;dextools-import&gt;</code> tags could not be found. Please ensure all files exist and try again.</p>
    <div class="file-list">
      <h3>Missing Files (${missing.length})</h3>
      <ul>${list}</ul>
    </div>
    <div class="footer">Check file paths and server configuration</div>
  </div>
</body>
</html>`;
  }
  
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
  
  // Run validation immediately - if it fails, block everything
  if (!prevalidateImports()) {
    // Prevent the rest of the script from executing
    throw new Error('Import validation failed - missing files detected');
  }
})();

// YOUR ORIGINAL CODE BELOW - COMPLETELY UNCHANGED
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
