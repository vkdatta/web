(function () {
  const cache = new Map();

  class DextoolsImport extends HTMLElement {
    static get observedAttributes() { return ['src']; }

    constructor() {
      super();
      this._isMounted = false;
      this._abortController = null;
      this._observer = new MutationObserver(mutations => {
        if (mutations.some(m => m.attributeName.startsWith('data-'))) {
          this.render();
        }
      });
    }

    connectedCallback() {
      this._observer.observe(this, { attributes: true });
      this.render();
    }

    disconnectedCallback() {
      this._observer.disconnect();
      if (this._abortController) this._abortController.abort();
    }

    attributeChangedCallback(name, oldVal, newVal) {
      if (name === 'src' && oldVal !== newVal && this.isConnected) {
        this.render();
      }
    }

    async render() {
      const src = this.getAttribute('src');
      if (!src || src.includes('://') || src.startsWith('//')) return;

      if (this._abortController) this._abortController.abort();
      this._abortController = new AbortController();
      const { signal } = this._abortController;

      const cacheKey = new URL(src, location.href).href;

      try {
        if (!cache.has(cacheKey)) {
          const res = await fetch(src, { signal });
          if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
          cache.set(cacheKey, await res.text());
        }

        if (signal.aborted || !this.isConnected) return;

        let html = String(cache.get(cacheKey));

        const escapeHtml = s => String(s).replace(/[&<>"']/g, m => ({
          '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
        }[m]));

        const escapeRegex = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

        this.getAttributeNames().forEach(attr => {
          if (attr.startsWith('data-')) {
            const key = attr.slice(5);
            const val = escapeHtml(this.getAttribute(attr));
            html = html.replace(new RegExp(`{{${escapeRegex(key)}}}`, 'g'), val);
          }
        });

        const stateMap = new Map();
        this.querySelectorAll('[id]').forEach(el => {
          let selectionStart = null, selectionEnd = null;
          try {
            selectionStart = el.selectionStart;
            selectionEnd = el.selectionEnd;
          } catch (_) {}
          stateMap.set(el.id, {
            value: el.value,
            checked: el.checked,
            selectionStart,
            selectionEnd
          });
        });

        const parser = new DOMParser();
        const newDoc = parser.parseFromString(html, 'text/html');

        newDoc.head.querySelectorAll('link[rel="stylesheet"], style').forEach(node => {
          if (node.tagName === 'LINK') {
            const href = node.getAttribute('href');
            if (!href) return;
            const safe = href.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
            if (!document.head.querySelector(`link[rel="stylesheet"][href="${safe}"]`)) {
              document.head.appendChild(node.cloneNode(true));
            }
          } else {
            const text = node.textContent;
            const dup = [...document.head.querySelectorAll('style')]
              .some(s => s.textContent === text);
            if (!dup) document.head.appendChild(node.cloneNode(true));
          }
        });

        if (signal.aborted || !this.isConnected) return;

        this.innerHTML = '';
        this.append(...Array.from(newDoc.body.childNodes));

        stateMap.forEach((state, id) => {
          const el = this.querySelector(`#${CSS.escape(id)}`);
          if (!el) return;
          if ('value' in el && state.value !== undefined) el.value = state.value;
          if ('checked' in el) el.checked = state.checked;
          if (state.selectionStart != null && el.setSelectionRange) {
            try {
              el.setSelectionRange(state.selectionStart, state.selectionEnd);
            } catch (_) {}
          }
        });

        this.executeScripts();

        if (!this._isMounted) this._isMounted = true;

      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error('[Dextools]', err);
          const safeSrc = src.replace(/-->/g, '-- >');
          this.innerHTML = `<!-- Error loading ${safeSrc} -->`;
        }
      }
    }

    executeScripts() {
      this.querySelectorAll('script').forEach(oldScript => {
        if (oldScript.hasAttribute('once') && this._isMounted) {
          oldScript.remove();
          return;
        }

        const newScript = document.createElement('script');
        Array.from(oldScript.attributes).forEach(attr =>
          newScript.setAttribute(attr.name, attr.value)
        );

        const isModule = oldScript.type === 'module';
        const hasSrc = oldScript.hasAttribute('src');

        if (isModule) {
          newScript.textContent = oldScript.textContent;

        } else if (hasSrc) {

        } else {
          newScript.textContent = `
(function(host){
  ${oldScript.textContent}
})(document.currentScript
    ? document.currentScript.closest('dextools-import')
    : null);
          `.trim();
        }

        oldScript.parentNode.replaceChild(newScript, oldScript);
      });
    }
  }

  customElements.define('dextools-import', DextoolsImport);
})();
