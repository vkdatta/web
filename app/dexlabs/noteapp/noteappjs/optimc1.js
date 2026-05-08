// ============================================
// ENTERPRISE-GRADE PRISM.JS INTEGRATION
// ============================================

// Optimized Syntax Highlighting Manager
(() => {
    class SyntaxHighlightManager {
        constructor() {
            this.updateTimeout = null;
            this.isUpdating = false;
            this.updateQueue = Promise.resolve();
            this.rafId = null;
            this.lastValue = '';
            this.observer = null;
            this.abortController = new AbortController();
            
            // Configuration
            this.config = {
                debounceDelay: 150,      // Debounce user input
                throttleDelay: 50,       // Throttle rapid events
                observerThrottle: 100    // Throttle observer callbacks
            };
        }

        // Debounced update with proper async queue management
        scheduleUpdate(immediate = false) {
            if (this.updateTimeout) {
                clearTimeout(this.updateTimeout);
            }

            const delay = immediate ? 0 : this.config.debounceDelay;
            
            this.updateTimeout = setTimeout(() => {
                this.queueUpdate();
            }, delay);
        }

        // Queue updates to prevent race conditions
        queueUpdate() {
            this.updateQueue = this.updateQueue
                .then(() => this.performUpdate())
                .catch(err => console.error('Syntax highlight update error:', err));
        }

        // Actual update logic with RAF for smooth rendering
        async performUpdate() {
            if (this.isUpdating) return;
            
            this.isUpdating = true;
            
            try {
                // Detect language
                if (currentNote && currentNote.extension) {
                    const filename = `file.${currentNote.extension}`;
                    const detectedLanguage = languageLoader.detectLanguageFromFilename(filename);
                    window.currentHighlightLanguage = detectedLanguage;
                } else {
                    window.currentHighlightLanguage = "none";
                }

                // Use RAF for visual updates to sync with browser paint cycle
                if (this.rafId) {
                    cancelAnimationFrame(this.rafId);
                }

                this.rafId = requestAnimationFrame(async () => {
                    // Plain render first (fast, non-blocking)
                    if (typeof window.immediatePlainRender === "function") {
                        window.immediatePlainRender();
                    }

                    // Then schedule syntax highlighting (can be slower)
                    if (typeof window.scheduleUpdate === "function") {
                        window.scheduleUpdate(true);
                    } else if (typeof window.updateBackdrop === "function") {
                        await window.updateBackdrop();
                    }

                    // Force reflow only once
                    if (noteBackdrop) {
                        noteBackdrop.offsetHeight;
                    }
                });
            } finally {
                this.isUpdating = false;
            }
        }

        // Throttled observer callback
        handleMutation = (() => {
            let throttleTimeout = null;
            
            return (mutations) => {
                if (throttleTimeout) return;
                
                throttleTimeout = setTimeout(() => {
                    this.scheduleUpdate();
                    throttleTimeout = null;
                }, this.config.observerThrottle);
            };
        })();

        // Initialize all observers and listeners
        init() {
            if (!noteTextarea) {
                console.error('noteTextarea not found');
                return;
            }

            // Setup MutationObserver with optimized config
            this.observer = new MutationObserver(this.handleMutation);
            this.observer.observe(noteTextarea, {
                characterData: true,
                childList: true,
                subtree: true,
                attributes: true,
                attributeFilter: ['value', 'data-language'] // Only watch relevant attributes
            });

            // Consolidated input event listener (replaces polling)
            noteTextarea.addEventListener('input', () => {
                this.scheduleUpdate();
            }, { signal: this.abortController.signal });

            // Optimized button click handler with event delegation
            document.addEventListener('click', (e) => {
                const button = e.target.closest('button');
                if (button) {
                    // Use RAF to defer update until after the click is processed
                    requestAnimationFrame(() => {
                        this.scheduleUpdate(true);
                        if (typeof updateNoteMetadata === 'function') {
                            updateNoteMetadata();
                        }
                    });
                }
            }, { 
                signal: this.abortController.signal,
                capture: true 
            });

            // Intercept paste events for immediate update
            noteTextarea.addEventListener('paste', () => {
                requestAnimationFrame(() => {
                    this.scheduleUpdate(true);
                });
            }, { signal: this.abortController.signal });

            // Monitor for external changes (cut, undo, redo)
            ['cut', 'undo', 'redo'].forEach(eventType => {
                noteTextarea.addEventListener(eventType, () => {
                    this.scheduleUpdate();
                }, { signal: this.abortController.signal });
            });

            // Language change detection
            if (typeof window.addEventListener === 'function') {
                window.addEventListener('languagechange', () => {
                    this.scheduleUpdate(true);
                }, { signal: this.abortController.signal });
            }

            console.log('SyntaxHighlightManager initialized');
        }

        // Clean up resources
        destroy() {
            if (this.updateTimeout) {
                clearTimeout(this.updateTimeout);
            }
            if (this.rafId) {
                cancelAnimationFrame(this.rafId);
            }
            if (this.observer) {
                this.observer.disconnect();
            }
            this.abortController.abort();
            console.log('SyntaxHighlightManager destroyed');
        }
    }

    // Initialize the manager
    window.syntaxHighlightManager = new SyntaxHighlightManager();
    window.syntaxHighlightManager.init();

    // Expose manual trigger if needed
    window.forceSyntaxHighlightUpdate = () => {
        window.syntaxHighlightManager.scheduleUpdate(true);
    };

    // Cleanup on page unload
    window.addEventListener('beforeunload', () => {
        window.syntaxHighlightManager.destroy();
    });
})();

// ============================================
// COMPLETE PRISM LANGUAGE LOADER
// ============================================

class CompletePrismLanguageLoader {
    constructor() {
        this.loadedLanguages = new Set(["markup", "css", "clike", "javascript"]);
        this.loadingLanguages = new Set();
        this.loadPromises = new Map();
        
        // Comprehensive extension map
        this.extensionMap = {
            // Markup
            html: "markup", htm: "markup", xml: "markup", svg: "markup",
            mathml: "markup", ssml: "markup", atom: "markup", rss: "markup",
            
            // Styles
            css: "css", scss: "scss", sass: "sass", less: "less", styl: "stylus",
            
            // JavaScript ecosystem
            js: "javascript", mjs: "javascript", cjs: "javascript",
            jsx: "jsx", tsx: "tsx", ts: "typescript",
            
            // Systems programming
            c: "c", h: "c", cpp: "cpp", cc: "cpp", cxx: "cpp", "c++": "cpp",
            hpp: "cpp", hxx: "cpp", rs: "rust", go: "go",
            
            // JVM languages
            java: "java", kt: "kotlin", kts: "kotlin", scala: "scala",
            groovy: "groovy", clj: "clojure", cljs: "clojure",
            
            // .NET languages
            cs: "csharp", fs: "fsharp", vb: "vbnet",
            
            // Scripting
            py: "python", pyw: "python", rb: "ruby", pl: "perl", pm: "perl",
            lua: "lua", tcl: "tcl", r: "r", php: "php",
            
            // Shell
            sh: "bash", bash: "bash", zsh: "bash", ps1: "powershell",
            bat: "batch", cmd: "batch",
            
            // Functional
            hs: "haskell", ml: "ocaml", elm: "elm", erl: "erlang",
            ex: "elixir", exs: "elixir", clj: "clojure",
            
            // Data
            json: "json", yaml: "yaml", yml: "yaml", toml: "toml",
            xml: "markup", csv: "csv", sql: "sql",
            
            // Documentation
            md: "markdown", markdown: "markdown", rst: "rest",
            adoc: "asciidoc", tex: "latex",
            
            // Config
            ini: "ini", cfg: "ini", conf: "ini", properties: "properties",
            dockerfile: "docker", gitignore: "ignore",
            
            // Web
            graphql: "graphql", gql: "graphql",
            
            // Specialized
            sol: "solidity", v: "verilog", vhd: "vhdl",
            asm: "nasm", wasm: "wasm", proto: "protobuf",
            
            // Mobile
            swift: "swift", m: "objectivec", dart: "dart",
            
            // Additional languages
            jl: "julia", zig: "zig", nim: "nim", d: "d",
            hx: "haxe", purs: "purescript", reason: "reason",
            wren: "wren", odin: "odin"
        };

        // Language dependencies
        this.dependencies = {
            jsx: ["javascript"],
            tsx: ["typescript", "jsx"],
            typescript: ["javascript"],
            scss: ["css"],
            sass: ["css"],
            less: ["css"],
            stylus: ["css"],
            php: ["markup"],
            erb: ["ruby", "markup"],
            aspnet: ["csharp", "markup"],
            handlebars: ["markup"],
            django: ["markup"],
            twig: ["markup"],
            liquid: ["markup"],
            pug: ["markup"],
            haml: ["markup"],
            cshtml: ["csharp", "markup"],
            "plant-uml": ["markup"],
            "t4-cs": ["csharp", "t4-templating"],
            "t4-vb": ["visual-basic", "t4-templating"],
            "markup-templating": ["markup"]
        };

        // Human-readable language names
        this.languageNames = {
            markup: "HTML/XML", css: "CSS", javascript: "JavaScript",
            typescript: "TypeScript", jsx: "React JSX", tsx: "React TSX",
            python: "Python", java: "Java", cpp: "C++", c: "C",
            csharp: "C#", php: "PHP", ruby: "Ruby", go: "Go",
            rust: "Rust", swift: "Swift", kotlin: "Kotlin", scala: "Scala",
            dart: "Dart", bash: "Bash", powershell: "PowerShell",
            sql: "SQL", json: "JSON", yaml: "YAML", markdown: "Markdown",
            none: "Plain Text"
        };
    }

    // Detect language from filename
    detectLanguageFromFilename(filename) {
        if (!filename || !filename.includes(".")) {
            return "none";
        }
        const extension = filename.split(".").pop().toLowerCase();
        return this.extensionMap[extension] || "none";
    }

    // Get display name for language
    getLanguageDisplayName(language) {
        return this.languageNames[language] || 
               language.charAt(0).toUpperCase() + language.slice(1);
    }

    // Load language with caching and error handling
    async loadLanguage(language) {
        if (!language || language === "none") {
            return Promise.resolve();
        }

        if (this.loadedLanguages.has(language)) {
            return Promise.resolve();
        }

        if (this.loadPromises.has(language)) {
            return this.loadPromises.get(language);
        }

        const loadPromise = this._loadLanguageWithDependencies(language);
        this.loadPromises.set(language, loadPromise);
        
        return loadPromise;
    }

    // Load language and all dependencies
    async _loadLanguageWithDependencies(language) {
        try {
            // Load dependencies first
            if (this.dependencies[language]) {
                await Promise.all(
                    this.dependencies[language].map(dep => this.loadLanguage(dep))
                );
            }

            // Skip if already loaded (could have been loaded as dependency)
            if (this.loadedLanguages.has(language) || this.loadingLanguages.has(language)) {
                return;
            }

            this.loadingLanguages.add(language);

            // Dynamically load the language file
            await this._loadScript(
                `https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-${language}.min.js`
            );

            this.loadedLanguages.add(language);
            this.loadingLanguages.delete(language);
            
            console.log(`Loaded Prism language: ${language}`);
        } catch (error) {
            console.error(`Failed to load language ${language}:`, error);
            this.loadingLanguages.delete(language);
            // Don't throw - fail gracefully
        }
    }

    // Load script dynamically with timeout
    _loadScript(url, timeout = 5000) {
        return new Promise((resolve, reject) => {
            const script = document.createElement("script");
            script.src = url;
            script.async = true;

            const timer = setTimeout(() => {
                script.remove();
                reject(new Error(`Script load timeout: ${url}`));
            }, timeout);

            script.onload = () => {
                clearTimeout(timer);
                resolve();
            };

            script.onerror = () => {
                clearTimeout(timer);
                script.remove();
                reject(new Error(`Failed to load script: ${url}`));
            };

            document.head.appendChild(script);
        });
    }

    // Get statistics about loaded languages
    getStats() {
        return {
            loaded: this.loadedLanguages.size,
            loading: this.loadingLanguages.size,
            available: Object.keys(this.extensionMap).length
        };
    }
}

// Initialize the language loader
window.languageLoader = new CompletePrismLanguageLoader();
console.log('Prism Language Loader initialized:', window.languageLoader.getStats());
