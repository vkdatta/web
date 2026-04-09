(async function initializeDextoolsPreflight() {
  'use strict';

  const missingFiles = [];
  const checkedUrls = new Set();
  const urlsToCheck = [];

  function resolveURL(src) {
    try {
      return new URL(src.trim(), document.baseURI || location.href).href;
    } catch (_) {
      return src.trim();
    }
  }

  document.querySelectorAll('dextools-import').forEach(el => {
    const src = el.getAttribute('src');
    if (src) urlsToCheck.push(src);
  });

  while (urlsToCheck.length > 0) {
    const src = urlsToCheck.shift();

    if (checkedUrls.has(src)) continue;
    checkedUrls.add(src);

    const url = resolveURL(src);

    try {
      const response = await fetch(url, { method: 'GET' });

      if (!response.ok) {
        missingFiles.push({ src, status: response.status });
      } else {
        const html = await response.text();

        const regex = /<dextools-import[^>]+src\s*=\s*["']([^"']+)["']/gi;
        let match;
        while ((match = regex.exec(html)) !== null) {
          const nestedSrc = match[1];
          if (!checkedUrls.has(nestedSrc)) {
            urlsToCheck.push(nestedSrc);
          }
        }
      }
    } catch (e) {
      missingFiles.push({ src, status: 'Network Error' });
    }
  }

  if (missingFiles.length > 0) {
    const listHtml = missingFiles.map(f =>
      `<li><span class="status">[HTTP ${f.status}]</span> <span class="path">${f.src}</span></li>`
    ).join('');

    const errorPage = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <title>Missing Dextools Dependencies</title>
        <style>
          all: initial;
          html, body {
            margin: 0; padding: 0;
            font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            background-color: #0d0d0d; color: #f2f2f2;
            display: flex; justify-content: center; align-items: center;
            height: 100vh; width: 100vw;
            box-sizing: border-box;
          }
          .dxt-error-overlay {
            background: #1a1a1a; border: 1px solid #ff4444;
            border-radius: 8px; padding: 2rem; max-width: 600px; width: 100%;
            box-shadow: 0 8px 24px rgba(255, 0, 0, 0.15);
          }
          .dxt-error-overlay h1 {
            color: #ff4444; margin-top: 0; font-size: 1.5rem;
            border-bottom: 1px solid #333; padding-bottom: 1rem;
          }
          .dxt-error-overlay p {
            color: #bbbbbb; font-size: 1rem; line-height: 1.5;
            margin-bottom: 1.5rem;
          }
          .dxt-error-overlay ul {
            list-style: none; padding: 0; margin: 0;
            display: flex; flex-direction: column; gap: 0.5rem;
          }
          .dxt-error-overlay li {
            background: #262626; padding: 0.75rem 1rem;
            border-radius: 4px; display: flex; align-items: center;
            gap: 1rem; border-left: 4px solid #ff4444;
          }
          .dxt-error-overlay .status {
            color: #ff4444; font-weight: bold;
            font-size: 0.85rem; letter-spacing: 0.5px;
          }
          .dxt-error-overlay .path {
            font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
            color: #e0e0e0; font-size: 0.9rem; word-break: break-all;
          }
        </style>
      </head>
      <body>
        <div class="dxt-error-overlay">
          <h1>Fatal Error: Missing Dependencies</h1>
          <p>The application could not initialize because the following required files are missing from the server:</p>
          <ul>${listHtml}</ul>
        </div>
      </body>
      </html>
    `;

    document.documentElement.innerHTML = errorPage;
    return;
  }

  (function () {
    'use strict';
    const TAG = 'dextools-import';
    const MAX_DEPTH = 32;
    const LOG = '[dextools]';

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

})();
