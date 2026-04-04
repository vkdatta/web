(function() {
  const cache = new Map();
  class DextoolsImport extends HTMLElement {
    static get observedAttributes() { return ['src']; }
    constructor() {
      super();
      this.attachShadow({ mode: 'open' });
      this._isMounted = false;
      this._abortController = null;
      this._observer = new MutationObserver(m => {
        if (m.some(r => r.attributeName.startsWith('data-'))) this.render();
      });
    }
    connectedCallback() {
      this._observer.observe(this, { attributes: true });
      this.render();
      this._isMounted = true;
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
            const propKey = attr.slice(5);
            const val = this.getAttribute(attr);
            const regex = new RegExp(`{{${propKey}}}`, 'g');
            html = html.replace(regex, val);
          }
        });
        const stateMap = new Map();
        this.shadowRoot.querySelectorAll('[id]').forEach(el => {
          stateMap.set(el.id, {
            value: el.value,
            checked: el.checked,
            selectionStart: el.selectionStart,
            selectionEnd: el.selectionEnd
          });
        });
        this.shadowRoot.innerHTML = html;
        stateMap.forEach((state, id) => {
          const el = this.shadowRoot.getElementById(id);
          if (el) {
            Object.assign(el, state);
            if (state.selectionStart !== undefined) {
              el.setSelectionRange(state.selectionStart, state.selectionEnd);
            }
          }
        });
        this.executeScripts();
      } catch (err) {
        if (err.name !== 'AbortError') console.error("[Dextools]", err);
      }
    }
    executeScripts() {
      const hostRef = this;
      const rootRef = this.shadowRoot;
      this.shadowRoot.querySelectorAll('script').forEach(oldScript => {
        if (oldScript.hasAttribute('once') && this._isMounted) return;
        const newScript = document.createElement('script');
        Array.from(oldScript.attributes).forEach(a => newScript.setAttribute(a.name, a.value));
        newScript.textContent = `(function(host, root){
          ${oldScript.textContent}
        })(window._dexActiveHost, window._dexActiveRoot);`;
        window._dexActiveHost = hostRef;
        window._dexActiveRoot = rootRef;
        this.shadowRoot.appendChild(newScript);
        delete window._dexActiveHost;
        delete window._dexActiveRoot;
        oldScript.remove();
      });
    }
  }
  if (!customElements.get('dextools-import')) {
    customElements.define('dextools-import', DextoolsImport);
  }
})();
