<script>
        // Enhanced form autosave solution
        (function () {
            const STORAGE_PREFIX = 'autosave-';
            const usedIds = new Set();
            
            // Enhanced ID generation algorithm
            function generateElementId(el, index) {
                // Create a unique fingerprint for each element
                let fingerprint = '';
                
                if (el.name) fingerprint += `name:${el.name}|`;
                if (el.type) fingerprint += `type:${el.type}|`;
                if (el.id) fingerprint += `id:${el.id}|`;
                
                // Add position-based identifier
                fingerprint += `index:${index}`;
                
                // Generate hash for consistent ID
                let hash = 0;
                for (let i = 0; i < fingerprint.length; i++) {
                    const char = fingerprint.charCodeAt(i);
                    hash = ((hash << 5) - hash) + char;
                    hash |= 0; // Convert to 32bit integer
                }
                
                return `autosave-${Math.abs(hash)}`;
            }

            function saveValue(el, index) {
                try {
                    const id = generateElementId(el, index);
                    let value;
                    
                    // Handle different input types
                    if (el.type === 'checkbox') {
                        value = el.checked;
                    } else if (el.type === 'radio') {
                        // Save only the selected radio button value
                        if (el.checked) {
                            const name = el.name;
                            if (name) {
                                localStorage.setItem(STORAGE_PREFIX + 'radio-' + name, el.value);
                            }
                        }
                        return;
                    } else {
                        value = el.value;
                    }
                    
                    // Save to localStorage
                    localStorage.setItem(id, value);
                } catch (e) {
                    console.error('Error saving value:', e);
                }
            }

            function restoreValue(el, index) {
                try {
                    const id = generateElementId(el, index);
                    
                    if (el.type === 'checkbox') {
                        const saved = localStorage.getItem(id);
                        if (saved !== null) {
                            el.checked = saved === 'true';
                        }
                    } else if (el.type === 'radio') {
                        const name = el.name;
                        if (name) {
                            const savedValue = localStorage.getItem(STORAGE_PREFIX + 'radio-' + name);
                            if (savedValue === el.value) {
                                el.checked = true;
                            }
                        }
                    } else {
                        const saved = localStorage.getItem(id);
                        if (saved !== null) {
                            el.value = saved;
                        }
                    }
                } catch (e) {
                    console.error('Error restoring value:', e);
                }
            }

            function initField(el, index) {
                restoreValue(el, index);
                el.addEventListener('input', () => saveValue(el, index));
                el.addEventListener('change', () => saveValue(el, index));
            }

            // Initialize when DOM is ready
            document.addEventListener('DOMContentLoaded', () => {
                const fields = document.querySelectorAll('input, textarea, select');
                fields.forEach((el, idx) => initField(el, idx));
                updateStorageView();
            });
        })();
        
        // Helper functions
        function saveForm() {
            alert('Form data has been saved! Try refreshing the page to see autosave in action.');
        }
        
        function resetForm() {
            if (confirm('Are you sure you want to reset the form? All saved data will be cleared.')) {
                localStorage.clear();
                document.getElementById('userForm').reset();
                updateStorageView();
                setTimeout(() => alert('Form has been reset!'), 300);
            }
        }
        
        function clearStorage() {
            if (confirm('Are you sure you want to clear ALL saved form data?')) {
                localStorage.clear();
                updateStorageView();
                setTimeout(() => alert('All saved data has been cleared!'), 300);
            }
        }
        
        function updateStorageView() {
            const container = document.getElementById('storageContents');
            container.innerHTML = '';
            
            if (localStorage.length === 0) {
                container.innerHTML = '<div class="debug-item">No form data saved in localStorage</div>';
                return;
            }
            
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key.startsWith('autosave-')) {
                    const value = localStorage.getItem(key);
                    const item = document.createElement('div');
                    item.className = 'debug-item';
                    item.innerHTML = `<span class="debug-key">${key}:</span> <span class="debug-value">${value}</span>`;
                    container.appendChild(item);
                }
            }
        }
        
        // Initialize storage viewer
        window.addEventListener('load', updateStorageView);
    </script>
