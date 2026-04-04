customElements.define('dextools-import', class extends HTMLElement {
  async connectedCallback() {
    let src = this.getAttribute('src');
    if (!src) return;

    const isImaginaryRoot = src.startsWith('/') && !src.startsWith('//');
    const fetchPath = isImaginaryRoot ? src.substring(1) : src;

    try {
      const response = await fetch(fetchPath);
      if (!response.ok) throw new Error(`Status: ${response.status}`);
      
      const html = await response.text();
      this.innerHTML = html;

      this.querySelectorAll('script').forEach(oldScript => {
        const newScript = document.createElement('script');
        Array.from(oldScript.attributes).forEach(attr => newScript.setAttribute(attr.name, attr.value));
        newScript.textContent = oldScript.textContent;
        oldScript.parentNode.replaceChild(newScript, oldScript);
      });

      this.dispatchEvent(new Event('dex-loaded', { bubbles: true }));

    } catch (err) {
      console.error(`[Dextools] Error: ${fetchPath}`, err);
      this.innerHTML = `<!-- Failed to load ${fetchPath} -->`;
    }
  }
});
