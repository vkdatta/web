(function () {
    const STORAGE_PREFIX = 'autosave-';
    let elementCounter = 0;

    // Generate unique ID for any element without ID
    function generateId(el) {
        if (!el.id) {
            elementCounter++;
            el.id = STORAGE_PREFIX + location.pathname.replace(/\W+/g, '-') + '-' + elementCounter;
        }
        return el.id;
    }

    // Save value/state to localStorage
    function saveValue(el) {
        const id = generateId(el);
        let value;

        if (el.type === 'checkbox' || el.type === 'radio') {
            value = el.checked;
        } else if (el.tagName === 'SELECT') {
            value = el.value;
        } else if (el.tagName === 'BUTTON') {
            value = el.textContent;
        } else {
            value = el.value;
        }

        localStorage.setItem(id, JSON.stringify({ tag: el.tagName, type: el.type, value }));
    }

    // Restore value/state from localStorage
    function restoreValue(el) {
        const id = generateId(el);
        const saved = localStorage.getItem(id);
        if (!saved) return;

        const data = JSON.parse(saved);

        if (data.tag === 'INPUT' || data.tag === 'TEXTAREA') {
            if (data.type === 'checkbox' || data.type === 'radio') {
                el.checked = data.value;
            } else {
                el.value = data.value;
            }
        } else if (data.tag === 'SELECT') {
            el.value = data.value;
        } else if (data.tag === 'BUTTON') {
            el.textContent = data.value;
        }
    }

    // Save and restore for new/changed elements
    function handleElement(el) {
        if (!el.tagName) return;
        const tag = el.tagName.toUpperCase();
        if (['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON'].includes(tag)) {
            restoreValue(el);
            el.addEventListener('input', () => saveValue(el));
            el.addEventListener('change', () => saveValue(el));
        }
    }

    // Observe DOM changes
    const observer = new MutationObserver(mutations => {
        mutations.forEach(mutation => {
            mutation.addedNodes.forEach(node => {
                if (node.nodeType === 1) {
                    handleElement(node);
                    node.querySelectorAll?.('input, textarea, select, button').forEach(handleElement);
                }
            });
        });
    });

    // Initialize on page load
    document.querySelectorAll('input, textarea, select, button').forEach(handleElement);
    observer.observe(document.body, { childList: true, subtree: true });
})();
