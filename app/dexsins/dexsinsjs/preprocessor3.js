(function () {
  'use strict';
  const LOG = '[dextools-validator]';
  
  // BLOCK RENDERING IMMEDIATELY - before anything paints
  const blockStyles = document.createElement('style');
  blockStyles.textContent = 'html,body{margin:0;padding:0;overflow:hidden;height:100%;background:#000}';
  document.documentElement.appendChild(blockStyles);
  document.body && (document.body.style.display = 'none');
  
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
      // LOG TO CONSOLE
      console.error(LOG, 'MISSING FILES DETECTED:');
      missing.forEach((m, i) => {
        console.error(`  ${i + 1}. ${m.src} (${m.status ? 'HTTP ' + m.status : m.error})`);
      });
      console.error(LOG, `Total: ${missing.length} file(s) missing. Website loading blocked.`);
      
      showIsolatedErrorPage(missing);
      return false;
    }
    
    // Remove block styles if all good
    blockStyles.remove();
    document.body && (document.body.style.display = '');
    return true;
  }
  
  function showIsolatedErrorPage(missing) {
    // Clear everything
    document.head.innerHTML = '';
    document.body.innerHTML = '';
    
    // Create isolated iframe for error page
    const iframe = document.createElement('iframe');
    iframe.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;border:none;z-index:99999';
    
    const list = missing.map(m => 
      `<li style="padding:8px 0;border-bottom:1px solid #fecaca;color:#7f1d1d;font-family:monospace;font-size:13px">
        <span style="background:#fee2e2;padding:2px 6px;border-radius:3px;font-weight:bold">${escapeHtml(m.src)}</span>
        <span style="color:#991b1b;margin-left:8px">${m.status ? 'HTTP ' + m.status : escapeHtml(m.error || 'Error')}</span>
      </li>`
    ).join('');
    
    const errorHTML = `<!DOCTYPE html>
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
      background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
      padding: 20px;
    }
    .container {
      background: white;
      max-width: 700px;
      width: 100%;
      padding: 40px;
      border-radius: 12px;
      box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5);
    }
    .header {
      display: flex;
      align-items: center;
      gap: 15px;
      margin-bottom: 20px;
      padding-bottom: 20px;
      border-bottom: 2px solid #fecaca;
    }
    .icon {
      width: 50px;
      height: 50px;
      background: #fee2e2;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
    }
    h1 { 
      color: #dc2626; 
      font-size: 24px;
    }
    p { 
      color: #4b5563; 
      margin-bottom: 20px;
      line-height: 1.6;
    }
    .file-list {
      background: #fef2f2;
      border: 2px solid #fecaca;
      border-radius: 8px;
      padding: 20px;
      margin-bottom: 20px;
    }
    .file-list h3 {
      color: #991b1b;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 12px;
    }
    ul { list-style: none; }
    li:last-child { border-bottom: none !important; }
    .footer {
      color: #6b7280;
      font-size: 13px;
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="icon">⚠️</div>
      <h1>Cannot Load Website</h1>
    </div>
    <p>The following files referenced by <code style="background:#f3f4f6;padding:2px 6px;border-radius:3px;font-family:monospace">&lt;dextools-import&gt;</code> tags could not be found:</p>
    <div class="file-list">
      <h3>Missing Files (${missing.length})</h3>
      <ul>${list}</ul>
    </div>
    <div class="footer">Check that all referenced files exist and are accessible</div>
  </div>
</body>
</html>`;
    
    document.body.appendChild(iframe);
    iframe.contentDocument.open();
    iframe.contentDocument.write(errorHTML);
    iframe.contentDocument.close();
    
    // Stop everything else
    throw new Error('Dextools import validation failed - missing files');
  }
  
  function escapeHtml(text) {
    return text.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }
  
  // Run immediately
  if (!prevalidateImports()) {
    throw new Error('Validation failed');
  }
})();

// YOUR ORIGINAL CODE - COMPLETELY UNCHANGED
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
