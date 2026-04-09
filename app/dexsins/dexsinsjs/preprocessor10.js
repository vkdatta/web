(function () {
  'use strict';

  const TAG = 'dextools-import';
  const MAX_DEPTH = 32;
  const LOG = '[dextools]';

  const registry = new Map();

  function resolveURL(src) {
    try {
      return new URL(src.trim(), document.baseURI || location.href).href;
    } catch (_) {
      return src.trim();
    }
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
    async connectedCallback() {
      const src = this.getAttribute('src');
      if (!src) {
        this.remove();
        return;
      }

      const resolved = resolveURL(src);
      const depth = parseInt(this.getAttribute('data-dxt-depth') || '0', 10);

      if (depth > MAX_DEPTH) {
        console.error(LOG, `Circular import detected: ${src}`);
        registry.set(resolved, { status: 'Circular', error: 'Max depth exceeded' });
        checkValidation();
        return;
      }

      registry.set(resolved, { status: 'pending' });

      try {
        const response = await fetch(resolved);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const html = await response.text();
        registry.set(resolved, { status: 'success' });

        inject(this, applyData(html, this));
      } catch (e) {
        console.error(LOG, `Failed to load: ${resolved}`, e);
        registry.set(resolved, { status: 'error', error: e.message });
        this.remove();
      } finally {
        checkValidation();
      }
    }
  }

  let validationTimeout;

  function checkValidation() {
    clearTimeout(validationTimeout);

    validationTimeout = setTimeout(() => {
      const entries = Array.from(registry.values());
      const isDone = entries.every(e => e.status !== 'pending');

      if (isDone) {
        const failed = Array.from(registry.entries())
          .filter(([_, val]) => val.status === 'error' || val.status === 'Circular')
          .map(([url, val]) => ({ url, error: val.error }));

        if (failed.length > 0) {
          nukeWithErrorPage(failed);
        } else {
          console.log(LOG, 'All imports loaded successfully.');
        }
      }
    }, 100);
  }

  function nukeWithErrorPage(failed) {
    const items = failed.map(f => `
      <li>
        <code>${escapeHtml(f.url)}</code><br>
        <span style="color:#f87171;font-size:0.85rem;">↳ Reason: ${escapeHtml(f.error)}</span>
      </li>
    `).join('');

    const errorHtml = `
      <div style="background:#0b0e14;color:#e4e6eb;font-family:sans-serif;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:20px;">
        <div style="max-width:600px;width:100%;background:#1a1e29;padding:40px;border-radius:12px;border:1px solid #c41e3a;">
          <h1 style="color:#ff4d4d;margin-top:0;">⚠️ Import Failure</h1>
          <p>The following components failed to load:</p>
          <ul style="list-style:none;padding:0;">${items}</ul>
          <button onclick="location.reload()" style="margin-top:20px;padding:10px 20px;background:#c41e3a;color:white;border:none;border-radius:4px;cursor:pointer;">Retry Load</button>
        </div>
      </div>
    `;

    document.body.innerHTML = errorHtml;
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  if (!customElements.get(TAG)) {
    customElements.define(TAG, DextoolsImport);
  }
})();
