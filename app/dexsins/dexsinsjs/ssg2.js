(function() {
  const cache = new Map();
  class DextoolsImport extends HTMLElement {
    static get observedAttributes() { return ['src']; }
    constructor() {
      super();
      this._isMounted = false;
      this._abortController = null;
      this._observer = new MutationObserver(mutations => {
        if (mutations.some(r => r.attributeName.startsWith('data-'))) {
          this.render();
        }
      });
    }
    connectedCallback() {
      this._observer.observe(this, { attributes: true });
      this.render();
      this._isMounted = true;
    }
    disconnectedCallback() {
      this._observer.disconnect();
      if (this._abortController) this._abortController.abort();
    }
    async render() {
      const src = this.getAttribute('src');
      if (!src || src.includes('://') || src.startsWith('//')) return;
      if (this._abortController) this._abortController.abort();
      this._abortController = new AbortController();
      const { signal } = this._abortController;
      const fetchPath = src.startsWith('/') ? src.substring(1) : src;
      try {
        if (!cache.has(fetchPath)) {
          const res = await fetch(fetchPath, { signal });
          if (!res.ok) throw new Error(res.status);
          cache.set(fetchPath, await res.text());
        }
        let html = String(cache.get(fetchPath));
        const escape = s => String(s).replace(/[&<>"']/g, m => ({
          '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;"
        }[m]));
        this.getAttributeNames().forEach(attr => {
          if (attr.startsWith('data-')) {
            const key = attr.slice(5);
            const val = escape(this.getAttribute(attr));
            html = html.replace(new RegExp(`{{${key}}}`, 'g'), val);
          }
        });
        const stateMap = new Map();
        this.querySelectorAll('[id]').forEach(el => {
          stateMap.set(el.id, {
            value: el.value,
            checked: el.checked,
            selectionStart: el.selectionStart,
            selectionEnd: el.selectionEnd
          });
        });
        const parser = new DOMParser();
        const newDoc = parser.parseFromString(html, 'text/html');
        const newContent = newDoc.body;
        this.innerHTML = '';
        this.append(...Array.from(newContent.childNodes));
        stateMap.forEach((state, id) => {
          const el = this.querySelector(`#${CSS.escape(id)}`);
          if (el) {
            if ('value' in el) el.value = state.value;
            if ('checked' in el) el.checked = state.checked;
            if (state.selectionStart != null && el.setSelectionRange) {
              el.setSelectionRange(state.selectionStart, state.selectionEnd);
            }
          }
        });
        this.executeScripts();
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error('[Dextools]', err);
          this.innerHTML = `<!-- Error loading ${fetchPath} -->`;
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
        newScript.textContent = `
          (function(host){
            ${oldScript.textContent}
          })(document.currentScript.closest('dextools-import'));
        `;
        oldScript.parentNode.replaceChild(newScript, oldScript);
      });
    }
  }
  customElements.define('dextools-import', DextoolsImport);
})();
