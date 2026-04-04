(function() {
    'use strict';

    const DEBUG = false;
    const BASE_PATH = '';

    function log(...args) {
        if (DEBUG) console.log('[DexTools-Blocking]', ...args);
    }

    function fetchBlocking(url) {
        log('Fetching (blocking):', url);
        
        const xhr = new XMLHttpRequest();
        xhr.open('GET', url, false);
        xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
        
        try {
            xhr.send(null);
            if (xhr.status >= 200 && xhr.status < 300) {
                return xhr.responseText;
            }
            console.error('[DexTools] Failed to load:', url, '- Status:', xhr.status);
            return null;
        } catch (e) {
            console.error('[DexTools] Error loading:', url, '-', e.message);
            return null;
        }
    }

    function processImportsBlocking() {
        log('Starting blocking import processing...');
        
        const imports = document.querySelectorAll('dextools-import');
        
        if (imports.length === 0) {
            log('No imports found');
            return;
        }

        log('Found', imports.length, 'imports to process');

        imports.forEach(function(element) {
            const src = element.getAttribute('src');
            
            if (!src) {
                console.warn('[DexTools] Missing src attribute on dextools-import');
                return;
            }

            const fullUrl = BASE_PATH + src;
            const content = fetchBlocking(fullUrl);
            
            if (content !== null) {
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = content;
                
                let htmlString = '';
                while (tempDiv.firstChild) {
                    const node = tempDiv.firstChild;
                    
                    if (node.nodeType === 1) {
                        htmlString += node.outerHTML;
                    } else if (node.nodeType === 3) {
                        htmlString += node.nodeValue;
                    } else if (node.nodeType === 8) {
                        htmlString += '<!--' + node.nodeValue + '-->';
                    }
                    
                    tempDiv.removeChild(node);
                }
                
                document.write(htmlString);
                
                if (element.parentNode) {
                    element.parentNode.removeChild(element);
                }
                
                log('Successfully imported:', src);
            } else {
                document.write('<!-- DexTools: Failed to load ' + src + ' -->');
                if (element.parentNode) {
                    element.parentNode.removeChild(element);
                }
            }
        });
        
        log('Blocking processing complete');
    }

    function processImportsDOM() {
        log('Starting DOM-based import processing...');
        
        const imports = document.querySelectorAll('dextools-import');
        
        Array.from(imports).reverse().forEach(function(element) {
            const src = element.getAttribute('src');
            if (!src) return;

            const content = fetchBlocking(BASE_PATH + src);
            
            if (content !== null) {
                element.insertAdjacentHTML('beforebegin', content);
                element.remove();
                log('DOM import complete:', src);
            }
        });
    }

    if (document.readyState === 'loading') {
        processImportsBlocking();
    } else {
        console.warn('[DexTools] Document already loaded. Using DOM fallback. ' +
                     'For best results, place this script in <head> without async/defer.');
        processImportsDOM();
    }
})();
