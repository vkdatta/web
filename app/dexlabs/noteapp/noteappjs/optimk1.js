
// ============================================================
// ENTERPRISE-GRADE PRISM SYNTAX HIGHLIGHTER
// Viewport virtualization + incremental tokenization + DOM recycling
// ============================================================

(() => {
    // ============================================================
    // CONFIGURATION
    // ============================================================
    const CONFIG = {
        PRISM_LIMIT: 50000,           // Max chars for Prism highlighting
        VIEWPORT_BUFFER: 3,            // Viewports above/below to render
        LINE_HEIGHT: 20,               // Estimated line height in px
        DEBOUNCE_MS: 150,              // Debounce for highlighting
        SCROLL_DEBOUNCE_MS: 16,        // 1 frame for scroll
        IDLE_TIMEOUT_MS: 100,          // Time before idle highlighting kicks in
        MAX_CACHE_LINES: 5000,         // Max highlighted lines to cache
        WORKER_URL: null,              // Set to Worker URL for off-thread tokenization
        USE_LAYERED_RENDERING: true,   // Separate highlight layer from textarea
        PLAIN_TEXT_FALLBACK: true      // Graceful degrade for large files
    };

    // ============================================================
    // LINE VIRTUALIZATION ENGINE
    // ============================================================
    class VirtualEditor {
        constructor() {
            this.lines = [];
            this.rendered = new Map();      // lineNumber -> DOMNode
            this.highlightCache = new Map();  // lineNumber -> highlightedHTML
            this.dirtyLines = new Set();
            this.viewportStart = 0;
            this.viewportEnd = 0;
            this.scrollTop = 0;
            this.viewportHeight = 0;
            this.totalHeight = 0;
            this.isHighlighting = false;
            this.pendingHighlight = false;
            this.lastEditLine = -1;
        }

        setContent(text) {
            this.lines = text.split('\n');
            this.totalHeight = this.lines.length * CONFIG.LINE_HEIGHT;
            this.dirtyLines = new Set(this.lines.map((_, i) => i));
            this.highlightCache.clear();
            this.rendered.forEach((node, lineNo) => {
                if (!this.isLineInViewport(lineNo)) {
                    node.remove();
                    this.rendered.delete(lineNo);
                }
            });
        }

        updateLine(lineNo, newText) {
            if (lineNo >= 0 && lineNo < this.lines.length) {
                this.lines[lineNo] = newText;
                this.dirtyLines.add(lineNo);
                this.highlightCache.delete(lineNo);
                // Invalidate downstream lines (syntax state propagation)
                for (let i = lineNo + 1; i < Math.min(lineNo + 50, this.lines.length); i++) {
                    this.highlightCache.delete(i);
                    this.dirtyLines.add(i);
                }
                this.lastEditLine = lineNo;
            }
        }

        insertLine(lineNo, text) {
            this.lines.splice(lineNo, 0, text);
            this.dirtyLines.add(lineNo);
            // Shift all rendered nodes after this line
            const toShift = [];
            this.rendered.forEach((node, ln) => {
                if (ln >= lineNo) toShift.push(ln);
            });
            toShift.sort((a, b) => b - a); // descending
            toShift.forEach(ln => {
                const node = this.rendered.get(ln);
                this.rendered.delete(ln);
                this.rendered.set(ln + 1, node);
                this.updateNodePosition(node, ln + 1);
            });
            this.totalHeight = this.lines.length * CONFIG.LINE_HEIGHT;
        }

        deleteLine(lineNo) {
            if (lineNo >= 0 && lineNo < this.lines.length) {
                this.lines.splice(lineNo, 1);
                const node = this.rendered.get(lineNo);
                if (node) {
                    node.remove();
                    this.rendered.delete(lineNo);
                }
                // Shift all rendered nodes after this line
                const toShift = [];
                this.rendered.forEach((node, ln) => {
                    if (ln > lineNo) toShift.push(ln);
                });
                toShift.sort((a, b) => a - b); // ascending
                toShift.forEach(ln => {
                    const node = this.rendered.get(ln);
                    this.rendered.delete(ln);
                    this.rendered.set(ln - 1, node);
                    this.updateNodePosition(node, ln - 1);
                });
                this.totalHeight = this.lines.length * CONFIG.LINE_HEIGHT;
            }
        }

        getVisibleRange() {
            const firstVisible = Math.floor(this.scrollTop / CONFIG.LINE_HEIGHT);
            const visibleCount = Math.ceil(this.viewportHeight / CONFIG.LINE_HEIGHT);
            const buffer = visibleCount * CONFIG.VIEWPORT_BUFFER;

            const start = Math.max(0, firstVisible - buffer);
            const end = Math.min(this.lines.length, firstVisible + visibleCount + buffer);

            return { start, end, firstVisible, visibleCount };
        }

        isLineInViewport(lineNo) {
            const { start, end } = this.getVisibleRange();
            return lineNo >= start && lineNo < end;
        }

        updateNodePosition(node, lineNo) {
            node.style.transform = `translateY(${lineNo * CONFIG.LINE_HEIGHT}px)`;
            node.dataset.line = lineNo;
        }
    }

    // ============================================================
    // DOM RECYCLING POOL
    // ============================================================
    class DOMPool {
        constructor(container, maxSize = 500) {
            this.container = container;
            this.available = [];
            this.inUse = new Map();
            this.maxSize = maxSize;
        }

        acquire(lineNo) {
            let node;
            if (this.available.length > 0) {
                node = this.available.pop();
            } else {
                node = document.createElement('div');
                node.className = 've-line';
                node.style.position = 'absolute';
                node.style.left = '0';
                node.style.right = '0';
                node.style.height = CONFIG.LINE_HEIGHT + 'px';
                node.style.willChange = 'transform';
                node.style.whiteSpace = 'pre';
                node.style.overflow = 'hidden';
            }
            node.dataset.line = lineNo;
            node.style.transform = `translateY(${lineNo * CONFIG.LINE_HEIGHT}px)`;
            this.inUse.set(lineNo, node);
            return node;
        }

        release(lineNo) {
            const node = this.inUse.get(lineNo);
            if (node) {
                node.remove();
                this.inUse.delete(lineNo);
                if (this.available.length < this.maxSize) {
                    node.textContent = '';
                    node.innerHTML = '';
                    this.available.push(node);
                }
            }
        }

        releaseAll() {
            this.inUse.forEach((node, lineNo) => {
                node.remove();
                if (this.available.length < this.maxSize) {
                    node.textContent = '';
                    node.innerHTML = '';
                    this.available.push(node);
                }
            });
            this.inUse.clear();
        }

        getNode(lineNo) {
            return this.inUse.get(lineNo);
        }
    }

    // ============================================================
    // ASYNC HIGHLIGHTING QUEUE
    // ============================================================
    class HighlightQueue {
        constructor() {
            this.queue = [];
            this.processing = false;
            this.cancelToken = null;
        }

        enqueue(lineNo, text, language) {
            // Remove duplicates
            this.queue = this.queue.filter(item => item.lineNo !== lineNo);
            this.queue.push({ lineNo, text, language, priority: this.getPriority(lineNo) });
            this.queue.sort((a, b) => a.priority - b.priority);
            this.process();
        }

        getPriority(lineNo) {
            const { firstVisible, visibleCount } = virtualEditor.getVisibleRange();
            const dist = Math.abs(lineNo - firstVisible - visibleCount / 2);
            return dist;
        }

        async process() {
            if (this.processing || this.queue.length === 0) return;
            this.processing = true;
            this.cancelToken = { cancelled: false };
            const token = this.cancelToken;

            while (this.queue.length > 0 && !token.cancelled) {
                const batch = this.queue.splice(0, 5); // Process 5 lines at a time

                for (const item of batch) {
                    if (token.cancelled) break;

                    const highlighted = await this.highlightLine(item.text, item.language);
                    if (!token.cancelled) {
                        virtualEditor.highlightCache.set(item.lineNo, highlighted);
                        virtualEditor.dirtyLines.delete(item.lineNo);

                        // Update DOM if line is still visible
                        const node = domPool.getNode(item.lineNo);
                        if (node) {
                            node.innerHTML = highlighted;
                        }
                    }
                }

                // Yield to main thread
                await new Promise(r => requestAnimationFrame(r));
            }

            this.processing = false;
            if (this.queue.length > 0) {
                setTimeout(() => this.process(), 0);
            }
        }

        highlightLine(text, language) {
            return new Promise((resolve) => {
                if (!language || language === 'none' || !window.Prism || !Prism.languages[language]) {
                    resolve(escapeHtml(text) || ' ');
                    return;
                }

                // Use setTimeout to yield
                setTimeout(() => {
                    try {
                        const result = Prism.highlight(text, Prism.languages[language], language);
                        resolve(result || ' ');
                    } catch (e) {
                        resolve(escapeHtml(text) || ' ');
                    }
                }, 0);
            });
        }

        cancel() {
            if (this.cancelToken) {
                this.cancelToken.cancelled = true;
            }
            this.queue = [];
            this.processing = false;
        }
    }

    // ============================================================
    // LANGUAGE LOADER (Enhanced with better dependency handling)
    // ============================================================
    class EnterpriseLanguageLoader {
        constructor() {
            this.loadedLanguages = new Set(["markup", "css", "clike", "javascript"]);
            this.loadingLanguages = new Set();
            this.loadPromises = new Map();
            this.extensionMap = {
                html: "markup", htm: "markup", xml: "markup", svg: "markup", mathml: "markup", ssml: "markup", atom: "markup", rss: "markup",
                css: "css", js: "javascript", mjs: "javascript", cjs: "javascript",
                abap: "abap", abnf: "abnf", as: "actionscript", actionscript: "actionscript",
                ada: "ada", adb: "ada", ads: "ada", agda: "agda", al: "al", g4: "antlr4", antlr4: "antlr4",
                apacheconf: "apacheconf", apex: "apex", apl: "apl", applescript: "applescript", scpt: "applescript",
                aql: "aql", ino: "arduino", arduino: "arduino", arff: "arff", "arm-asm": "armasm", armasm: "armasm",
                art: "arturo", arturo: "arturo", adoc: "asciidoc", asciidoc: "asciidoc", aspx: "aspnet", aspnet: "aspnet",
                asm6502: "asm6502", asmatmel: "asmatmel", ahk: "autohotkey", autohotkey: "autohotkey",
                au3: "autoit", autoit: "autoit", avs: "avisynth", avisynth: "avisynth", avdl: "avro-idl",
                awk: "awk", gawk: "awk", sh: "bash", bash: "bash", shell: "bash", zsh: "bash",
                basic: "basic", bas: "basic", bat: "batch", cmd: "batch", bbcode: "bbcode", shortcode: "bbcode",
                bbj: "bbj", bicep: "bicep", birb: "birb", bison: "bison", yacc: "bison", bnf: "bnf", rbnf: "bnf",
                bqn: "bqn", b: "brainfuck", bf: "brainfuck", brainfuck: "brainfuck",
                brs: "brightscript", brightscript: "brightscript", bro: "bro", bsl: "bsl", oscript: "bsl",
                c: "c", h: "c", cs: "csharp", csharp: "csharp", dotnet: "csharp",
                cpp: "cpp", cc: "cpp", cxx: "cpp", "c++": "cpp", hpp: "cpp", hxx: "cpp",
                cfc: "cfscript", cfscript: "cfscript", chai: "chaiscript", chaiscript: "chaiscript",
                cil: "cil", cilkc: "cilkc", "cilk-c": "cilkc", cilkcpp: "cilkcpp", "cilk-cpp": "cilkcpp", cilk: "cilkcpp",
                clj: "clojure", cljs: "clojure", cljc: "clojure", edn: "clojure", cmake: "cmake",
                cob: "cobol", cbl: "cobol", cobol: "cobol", coffee: "coffeescript", coffeescript: "coffeescript",
                conc: "concurnas", concurnas: "concurnas", csp: "csp", cook: "cooklang", cooklang: "cooklang",
                coq: "coq", v: "coq", cr: "crystal", crystal: "crystal", "css-extras": "css-extras",
                csv: "csv", cue: "cue", cypher: "cypher", d: "d", di: "d", dart: "dart",
                dw: "dataweave", dataweave: "dataweave", dax: "dax", dhall: "dhall", diff: "diff", patch: "diff",
                django: "django", jinja: "django", jinja2: "django", "dns-zone": "dns-zone-file", zone: "dns-zone-file",
                dockerfile: "docker", docker: "docker", dot: "dot", gv: "dot", ebnf: "ebnf",
                editorconfig: "editorconfig", e: "eiffel", eiffel: "eiffel", ejs: "ejs", eta: "ejs",
                erb: "erb", rhtml: "erb", erl: "erlang", hrl: "erlang", erlang: "erlang",
                xlsx: "excel-formula", xls: "excel-formula", fs: "fsharp", fsx: "fsharp", fsi: "fsharp",
                factor: "factor", false: "false", firestore: "firestore-security-rules", flow: "flow",
                f: "fortran", f90: "fortran", f95: "fortran", f03: "fortran", ftl: "ftl",
                gml: "gml", gamemakerlanguage: "gml", gap: "gap", gi: "gap", gd: "gap", gcode: "gcode", nc: "gcode",
                gdscript: "gdscript", ged: "gedcom", gedcom: "gedcom", po: "gettext", pot: "gettext", gettext: "gettext",
                feature: "gherkin", gherkin: "gherkin", git: "git", glsl: "glsl", vert: "glsl", frag: "glsl",
                gn: "gn", gni: "gn", ld: "linker-script", go: "go", mod: "go-module", sum: "go-module",
                gradle: "gradle", graphql: "graphql", gql: "graphql", groovy: "groovy", gvy: "groovy",
                haml: "haml", hbs: "handlebars", handlebars: "handlebars", mustache: "handlebars",
                hs: "haskell", lhs: "haskell", haskell: "haskell", hx: "haxe", haxe: "haxe",
                hcl: "hcl", tf: "hcl", hlsl: "hlsl", hoon: "hoon", http: "http", hpkp: "hpkp", hsts: "hsts",
                ichigojam: "ichigojam", icn: "icon", icon: "icon", icu: "icu-message-format",
                idr: "idris", lidr: "idris", idris: "idris", gitignore: "ignore", hgignore: "ignore", npmignore: "ignore",
                ni: "inform7", i7x: "inform7", ini: "ini", cfg: "ini", conf: "ini", properties: "ini",
                io: "io", ijs: "j", j: "j", java: "java", javadoc: "javadoc", javadoclike: "javadoclike",
                javastacktrace: "javastacktrace", jexl: "jexl", jolie: "jolie", ol: "jolie", jq: "jq",
                jsdoc: "jsdoc", "js-extras": "js-extras", json: "json", webmanifest: "json", json5: "json5",
                jsonp: "jsonp", jsstacktrace: "jsstacktrace", "js-templates": "js-templates",
                jl: "julia", julia: "julia", keepalived: "keepalived", kmn: "keyman", keyman: "keyman",
                kt: "kotlin", kts: "kotlin", kotlin: "kotlin", kum: "kumir", kumir: "kumir",
                kql: "kusto", kusto: "kusto", tex: "latex", latex: "latex", sty: "latex", cls: "latex",
                latte: "latte", less: "less", ly: "lilypond", ily: "lilypond", liquid: "liquid",
                lisp: "lisp", el: "lisp", emacs: "lisp", elisp: "lisp", ls: "livescript", livescript: "livescript",
                ll: "llvm", llvm: "llvm", log: "log", lol: "lolcode", lolcode: "lolcode", lua: "lua",
                magma: "magma", makefile: "makefile", mk: "makefile", mak: "makefile",
                md: "markdown", markdown: "markdown", "markup-templating": "markup-templating",
                mata: "mata", matah: "mata", m: "matlab", matlab: "matlab", ms: "maxscript", mcr: "maxscript",
                mel: "mel", mermaid: "mermaid", mmd: "mermaid", mf: "metafont", mp: "metafont",
                miz: "mizar", mizar: "mizar", mongodb: "mongodb", monkey: "monkey", monkey2: "monkey",
                moon: "moonscript", moonscript: "moonscript", n1ql: "n1ql", n4js: "n4js", n4jsd: "n4js",
                hdl: "nand2tetris-hdl", nani: "naniscript", naniscript: "naniscript",
                nasm: "nasm", asm: "nasm", neon: "neon", nevod: "nevod", nginx: "nginx", nginxconf: "nginx",
                nim: "nim", nims: "nim", nimble: "nim", nix: "nix", nsi: "nsis", nsh: "nsis",
                objc: "objectivec", "objective-c": "objectivec", ml: "ocaml", mli: "ocaml", ocaml: "ocaml",
                odin: "odin", cl: "opencl", opencl: "opencl", qasm: "openqasm", openqasm: "openqasm",
                oz: "oz", gp: "parigp", pari: "parigp", parser: "parser", pas: "pascal", p: "pascal", pp: "pascal",
                ligo: "pascaligo", pascaligo: "pascaligo", psl: "psl", px: "pcaxis", pcaxis: "pcaxis",
                pcode: "peoplecode", peoplecode: "peoplecode", pl: "perl", pm: "perl", perl: "perl",
                php: "php", php3: "php", php4: "php", php5: "php", phpdoc: "phpdoc", "php-extras": "php-extras",
                plantuml: "plant-uml", puml: "plant-uml", "plant-uml": "plant-uml",
                sql: "plsql", pls: "plsql", plb: "plsql", pq: "powerquery", powerquery: "powerquery", mscript: "powerquery",
                ps1: "powershell", ps1xml: "powershell", psc1: "powershell", pde: "processing", processing: "processing",
                pro: "prolog", prolog: "prolog", promql: "promql", proto: "protobuf", protobuf: "protobuf",
                pug: "pug", jade: "pug", puppet: "puppet", pure: "pure", pb: "purebasic", pbi: "purebasic",
                purs: "purescript", purescript: "purescript", py: "python", pyw: "python", python: "python",
                qs: "qsharp", qsharp: "qsharp", q: "q", qml: "qml", qore: "qore",
                r: "r", R: "r", rkt: "racket", rktd: "racket", cshtml: "cshtml", razor: "cshtml",
                jsx: "jsx", tsx: "tsx", re: "reason", rei: "reason", regex: "regex", regexp: "regex",
                rego: "rego", rpy: "renpy", rpym: "renpy", res: "rescript", resi: "rescript",
                rst: "rest", rest: "rest", rip: "rip", graph: "roboconf", instances: "roboconf",
                robot: "robotframework", resource: "robotframework", rb: "ruby", rbw: "ruby", ruby: "ruby",
                rs: "rust", rust: "rust", sas: "sas", sass: "sass", scss: "scss", scala: "scala", sc: "scala",
                scm: "scheme", ss: "scheme", scheme: "scheme", "sh-session": "shell-session", "shell-session": "shell-session",
                smali: "smali", st: "smalltalk", smalltalk: "smalltalk", tpl: "smarty", smarty: "smarty",
                sml: "sml", fun: "sml", sig: "sml", sol: "solidity", solidity: "solidity", sln: "solution-file",
                soy: "soy", sparql: "sparql", rq: "sparql", spl: "splunk-spl", sqf: "sqf", nut: "squirrel", squirrel: "squirrel",
                stan: "stan", do: "stata", ado: "stata", iecst: "iecst", styl: "stylus", stylus: "stylus",
                scd: "supercollider", swift: "swift", service: "systemd", socket: "systemd", device: "systemd",
                t4: "t4-templating", tt: "t4-cs", "vb-t4": "t4-vb", tap: "tap", tcl: "tcl", tk: "tcl",
                tt2: "tt2", textile: "textile", toml: "toml", troy: "tremor", trickle: "tremor",
                ttl: "turtle", trig: "turtle", twig: "twig", ts: "typescript", typescript: "typescript",
                tsconfig: "typoscript", uc: "unrealscript", uci: "unrealscript", uorazor: "uorazor",
                uri: "uri", url: "uri", vala: "vala", vapi: "vala", vb: "vbnet", vbnet: "vbnet",
                vm: "velocity", velocity: "velocity", vh: "verilog", vhd: "vhdl", vhdl: "vhdl",
                vim: "vim", vimrc: "vim", bas: "visual-basic", warpscript: "warpscript",
                wast: "wasm", wat: "wasm", webidl: "web-idl", wgsl: "wgsl", wiki: "wiki",
                wl: "wolfram", nb: "wolfram", wren: "wren", xeoracube: "xeora", "xml-doc": "xml-doc",
                xojo: "xojo", xq: "xquery", xquery: "xquery", yml: "yaml", yaml: "yaml", yang: "yang", zig: "zig"
            };
            this.dependencies = {
                jsx: ["javascript"], tsx: ["typescript", "jsx"], typescript: ["javascript"],
                scss: ["css"], sass: ["css"], less: ["css"], stylus: ["css"],
                php: ["markup"], erb: ["ruby", "markup"], aspnet: ["csharp", "markup"],
                handlebars: ["markup"], django: ["markup"], twig: ["markup"],
                liquid: ["markup"], pug: ["markup"], haml: ["markup"],
                cshtml: ["csharp", "markup"], "plant-uml": ["markup"],
                "t4-cs": ["csharp", "t4-templating"], "t4-vb": ["visual-basic", "t4-templating"],
                "markup-templating": ["markup"]
            };
            this.languageNames = {
                markup: "HTML/XML", css: "CSS", javascript: "JavaScript", typescript: "TypeScript",
                jsx: "React JSX", tsx: "React TSX", python: "Python", java: "Java", cpp: "C++", c: "C",
                csharp: "C#", php: "PHP", ruby: "Ruby", go: "Go", rust: "Rust", swift: "Swift",
                kotlin: "Kotlin", scala: "Scala", dart: "Dart", bash: "Bash", powershell: "PowerShell",
                sql: "SQL", json: "JSON", yaml: "YAML", markdown: "Markdown", clojure: "Clojure",
                haskell: "Haskell", elixir: "Elixir", erlang: "Erlang", fsharp: "F#", ocaml: "OCaml",
                reason: "Reason", elm: "Elm", purescript: "PureScript", rescript: "ReScript",
                lua: "Lua", perl: "Perl", r: "R", julia: "Julia", solidity: "Solidity",
                graphql: "GraphQL", dockerfile: "Docker", nginx: "nginx", apache: "Apache",
                makefile: "Makefile", toml: "TOML", ini: "INI", properties: "Properties", none: "Plain Text"
            };
        }

        detectLanguageFromFilename(filename) {
            if (!filename || !filename.includes(".")) return "none";
            const extension = filename.split(".").pop().toLowerCase();
            return this.extensionMap[extension] || "none";
        }

        getLanguageDisplayName(language) {
            return this.languageNames[language] || language.charAt(0).toUpperCase() + language.slice(1);
        }

        async loadLanguage(language) {
            if (!language || language === "none" || this.loadedLanguages.has(language)) {
                return Promise.resolve();
            }
            if (this.loadPromises.has(language)) {
                return this.loadPromises.get(language);
            }
            const promise = this._loadWithDeps(language);
            this.loadPromises.set(language, promise);
            return promise;
        }

        async _loadWithDeps(language) {
            if (this.dependencies[language]) {
                for (const dep of this.dependencies[language]) {
                    await this.loadLanguage(dep);
                }
            }
            if (this.loadedLanguages.has(language)) return;
            if (this.loadingLanguages.has(language)) return;

            this.loadingLanguages.add(language);
            const script = document.createElement("script");
            script.src = `https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-${language}.min.js`;

            const loadPromise = new Promise((resolve, reject) => {
                script.onload = () => {
                    this.loadedLanguages.add(language);
                    this.loadingLanguages.delete(language);
                    resolve();
                };
                script.onerror = () => {
                    this.loadingLanguages.delete(language);
                    reject(new Error(`Failed to load: ${language}`));
                };
                setTimeout(() => {
                    if (this.loadingLanguages.has(language)) {
                        this.loadingLanguages.delete(language);
                        reject(new Error(`Timeout: ${language}`));
                    }
                }, 5000);
            });

            document.head.appendChild(script);
            return loadPromise;
        }
    }

    // ============================================================
    // UTILITIES
    // ============================================================
    function escapeHtml(text) {
        if (!text) return '';
        return text
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function debounce(fn, ms) {
        let timer;
        return (...args) => {
            clearTimeout(timer);
            timer = setTimeout(() => fn(...args), ms);
        };
    }

    function throttle(fn, limit) {
        let inThrottle;
        return (...args) => {
            if (!inThrottle) {
                fn(...args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    // ============================================================
    // GLOBAL STATE
    // ============================================================
    let virtualEditor = null;
    let domPool = null;
    let highlightQueue = null;
    let languageLoader = null;
    let isLargeFile = false;
    let currentLanguage = "none";
    let editorContainer = null;
    let highlightLayer = null;
    let noteTextarea = null;

    // ============================================================
    // CORE RENDERING FUNCTIONS
    // ============================================================
    function initEditor() {
        // Find or create elements
        const wrapper = document.querySelector('.text-area-wrapper') || document.body;

        noteTextarea = document.getElementById('noteTextarea');
        if (!noteTextarea) {
            noteTextarea = document.createElement('textarea');
            noteTextarea.id = 'noteTextarea';
            noteTextarea.className = 'note-textarea';
            noteTextarea.setAttribute('spellcheck', 'false');
            noteTextarea.setAttribute('autocomplete', 'off');
            noteTextarea.setAttribute('autocorrect', 'off');
            noteTextarea.setAttribute('autocapitalize', 'off');
            wrapper.appendChild(noteTextarea);
        }

        // Create layered rendering structure
        editorContainer = document.getElementById('editorContainer');
        if (!editorContainer) {
            editorContainer = document.createElement('div');
            editorContainer.id = 'editorContainer';
            editorContainer.className = 'editor-container';
            editorContainer.style.cssText = `
                position: relative;
                width: 100%;
                height: 100%;
                overflow: hidden;
            `;

            // Highlight layer (behind textarea)
            highlightLayer = document.createElement('div');
            highlightLayer.id = 'highlightLayer';
            highlightLayer.className = 'highlight-layer';
            highlightLayer.style.cssText = `
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                overflow: hidden;
                pointer-events: none;
                z-index: 1;
                font-family: inherit;
                font-size: inherit;
                line-height: inherit;
                white-space: pre;
                tab-size: 4;
            `;

            editorContainer.appendChild(highlightLayer);

            // Style textarea to be transparent with visible caret
            noteTextarea.style.cssText = `
                position: relative;
                z-index: 2;
                background: transparent;
                color: transparent;
                caret-color: var(--color, #fff);
                width: 100%;
                height: 100%;
                border: none;
                outline: none;
                resize: none;
                font-family: inherit;
                font-size: inherit;
                line-height: inherit;
                white-space: pre;
                tab-size: 4;
                padding: 0;
                margin: 0;
            `;

            // Wrap textarea
            const textWrapper = noteTextarea.parentNode;
            textWrapper.insertBefore(editorContainer, noteTextarea);
            editorContainer.appendChild(highlightLayer);
            editorContainer.appendChild(noteTextarea);
        } else {
            highlightLayer = document.getElementById('highlightLayer');
        }

        // Initialize engines
        virtualEditor = new VirtualEditor();
        domPool = new DOMPool(highlightLayer);
        highlightQueue = new HighlightQueue();
        languageLoader = new EnterpriseLanguageLoader();

        // Set initial content
        virtualEditor.setContent(noteTextarea.value || '');

        // Calculate viewport
        updateViewportMetrics();

        // Initial render
        renderViewport();
    }

    function updateViewportMetrics() {
        if (!editorContainer) return;
        virtualEditor.viewportHeight = editorContainer.clientHeight;
        virtualEditor.scrollTop = noteTextarea.scrollTop;
    }

    function renderViewport() {
        if (!virtualEditor || isLargeFile) return;

        const { start, end } = virtualEditor.getVisibleRange();
        virtualEditor.viewportStart = start;
        virtualEditor.viewportEnd = end;

        // Update container height for scrolling
        highlightLayer.style.height = Math.max(
            virtualEditor.totalHeight,
            editorContainer.clientHeight
        ) + 'px';

        // Render visible lines
        for (let i = start; i < end; i++) {
            renderLine(i);
        }

        // Clean up offscreen lines
        cleanupOffscreen(start, end);

        // Queue highlighting for visible lines
        queueVisibleHighlights(start, end);
    }

    function renderLine(lineNo) {
        if (lineNo < 0 || lineNo >= virtualEditor.lines.length) return;

        let node = domPool.getNode(lineNo);
        if (!node) {
            node = domPool.acquire(lineNo);
            highlightLayer.appendChild(node);
        }

        const text = virtualEditor.lines[lineNo];
        const cached = virtualEditor.highlightCache.get(lineNo);

        if (cached && !virtualEditor.dirtyLines.has(lineNo)) {
            node.innerHTML = cached;
        } else {
            // Show plain text immediately, highlight later
            node.textContent = text || ' ';
        }
    }

    function cleanupOffscreen(start, end) {
        const toRemove = [];
        domPool.inUse.forEach((node, lineNo) => {
            if (lineNo < start || lineNo >= end) {
                toRemove.push(lineNo);
            }
        });
        toRemove.forEach(lineNo => domPool.release(lineNo));
    }

    function queueVisibleHighlights(start, end) {
        if (!currentLanguage || currentLanguage === 'none') return;
        if (!languageLoader.isLanguageLoaded(currentLanguage)) return;

        for (let i = start; i < end; i++) {
            if (virtualEditor.dirtyLines.has(i) || !virtualEditor.highlightCache.has(i)) {
                highlightQueue.enqueue(i, virtualEditor.lines[i], currentLanguage);
            }
        }
    }

    // ============================================================
    // LARGE FILE HANDLING (Graceful Degradation)
    // ============================================================
    function handleLargeFile() {
        isLargeFile = true;
        highlightQueue.cancel();
        domPool.releaseAll();

        // Show plain text with basic styling
        highlightLayer.innerHTML = `<pre style="
            margin: 0;
            white-space: pre;
            word-wrap: normal;
            color: var(--color, #fff);
            font-family: inherit;
            font-size: inherit;
            line-height: inherit;
        ">${escapeHtml(noteTextarea.value)}</pre>`;

        highlightLayer.style.height = 'auto';
    }

    function handleNormalFile() {
        if (!isLargeFile) return;
        isLargeFile = false;
        highlightLayer.innerHTML = '';
        virtualEditor.setContent(noteTextarea.value || '');
        updateViewportMetrics();
        renderViewport();
    }

    // ============================================================
    // SYNC SCROLLING
    // ============================================================
    const syncScroll = throttle(() => {
        if (!noteTextarea || !highlightLayer) return;
        virtualEditor.scrollTop = noteTextarea.scrollTop;

        if (isLargeFile) {
            highlightLayer.scrollTop = noteTextarea.scrollTop;
        } else {
            requestAnimationFrame(() => {
                updateViewportMetrics();
                renderViewport();
            });
        }
    }, CONFIG.SCROLL_DEBOUNCE_MS);

    // ============================================================
    // INPUT HANDLING (Incremental Updates)
    // ============================================================
    function handleInput() {
        const text = noteTextarea.value;
        const len = text.length;

        // Check file size threshold
        if (len > CONFIG.PRISM_LIMIT) {
            if (!isLargeFile) handleLargeFile();
            // Still update plain text
            const pre = highlightLayer.querySelector('pre');
            if (pre) pre.textContent = text;
            return;
        }

        if (isLargeFile) handleNormalFile();

        // Diff and update only changed lines
        const newLines = text.split('\n');
        const oldLines = virtualEditor.lines;

        // Simple diff: find first changed line
        let firstChange = 0;
        while (firstChange < oldLines.length && 
               firstChange < newLines.length && 
               oldLines[firstChange] === newLines[firstChange]) {
            firstChange++;
        }

        // Update from first change to end
        if (newLines.length !== oldLines.length || firstChange < oldLines.length) {
            virtualEditor.lines = newLines;
            virtualEditor.totalHeight = newLines.length * CONFIG.LINE_HEIGHT;

            // Mark changed lines dirty
            for (let i = firstChange; i < newLines.length; i++) {
                virtualEditor.dirtyLines.add(i);
                virtualEditor.highlightCache.delete(i);
            }

            // Invalidate downstream for syntax state
            const invalidateEnd = Math.min(firstChange + 100, newLines.length);
            for (let i = firstChange + 1; i < invalidateEnd; i++) {
                virtualEditor.highlightCache.delete(i);
                virtualEditor.dirtyLines.add(i);
            }

            renderViewport();
        }
    }

    const debouncedInput = debounce(handleInput, CONFIG.DEBOUNCE_MS);

    // ============================================================
    // LANGUAGE DETECTION & HIGHLIGHTING TRIGGER
    // ============================================================
    async function updateLanguage() {
        if (!currentNote) {
            currentLanguage = "none";
            return;
        }

        const newLang = currentNote.extension 
            ? languageLoader.detectLanguageFromFilename(`file.${currentNote.extension}`)
            : "none";

        if (newLang !== currentLanguage) {
            currentLanguage = newLang;
            window.currentHighlightLanguage = newLang;

            // Clear cache when language changes
            virtualEditor.highlightCache.clear();
            virtualEditor.dirtyLines = new Set(virtualEditor.lines.map((_, i) => i));

            if (newLang !== "none") {
                await languageLoader.loadLanguage(newLang).catch(() => {
                    currentLanguage = "none";
                    window.currentHighlightLanguage = "none";
                });
            }

            if (!isLargeFile) {
                renderViewport();
            }
        }
    }

    // ============================================================
    // EVENT LISTENERS (Clean, minimal)
    // ============================================================
    function attachEvents() {
        if (!noteTextarea) return;

        // Input - incremental update
        noteTextarea.addEventListener('input', () => {
            debouncedInput();
        });

        // Scroll - viewport recalculation
        noteTextarea.addEventListener('scroll', syncScroll, { passive: true });

        // Keydown - immediate feedback for special keys
        noteTextarea.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                e.preventDefault();
                const start = noteTextarea.selectionStart;
                const end = noteTextarea.selectionEnd;
                noteTextarea.value = noteTextarea.value.substring(0, start) + '\t' + noteTextarea.value.substring(end);
                noteTextarea.selectionStart = noteTextarea.selectionEnd = start + 1;
                handleInput();
            }
        });

        // Paste/Cut - delayed to let value update
        ['paste', 'cut'].forEach(evt => {
            noteTextarea.addEventListener(evt, () => {
                setTimeout(handleInput, 0);
            });
        });

        // Resize observer for viewport changes
        if (window.ResizeObserver) {
            const ro = new ResizeObserver(() => {
                updateViewportMetrics();
                if (!isLargeFile) renderViewport();
            });
            ro.observe(editorContainer);
        }

        // Window resize
        window.addEventListener('resize', throttle(() => {
            updateViewportMetrics();
            if (!isLargeFile) renderViewport();
        }, 100));
    }

    // ============================================================
    // HOOK INTO EXISTING FUNCTIONS
    // ============================================================
    function hookExistingFunctions() {
        // Hook openNote
        const originalOpenNote = window.openNote;
        window.openNote = function(e) {
            if (originalOpenNote) originalOpenNote(e);
            setTimeout(() => {
                if (noteTextarea) {
                    virtualEditor.setContent(noteTextarea.value || '');
                    updateLanguage();
                    updateViewportMetrics();
                    if (!isLargeFile) renderViewport();
                }
            }, 50);
        };

        // Hook handleRenameSubmit
        const originalRename = window.handleRenameSubmit;
        window.handleRenameSubmit = function() {
            if (originalRename) originalRename();
            setTimeout(() => {
                updateLanguage();
                if (!isLargeFile) renderViewport();
            }, 50);
        };
    }

    // ============================================================
    // STYLES
    // ============================================================
    function injectStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .editor-container {
                position: relative;
                width: 100%;
                height: 100%;
                overflow: hidden;
                contain: layout style paint;
            }
            .highlight-layer {
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                overflow: hidden;
                pointer-events: none;
                z-index: 1;
            }
            .ve-line {
                position: absolute;
                left: 0;
                right: 0;
                will-change: transform;
                white-space: pre;
                overflow: hidden;
                font-family: 'Source Code Pro', monospace;
                line-height: 1.5;
            }
            .ve-line .token {
                display: inline;
            }
            /* Prism token colors - customize as needed */
            .ve-line .token.comment { color: #6a9955; }
            .ve-line .token.keyword { color: #c586c0; }
            .ve-line .token.string { color: #ce9178; }
            .ve-line .token.number { color: #b5cea8; }
            .ve-line .token.function { color: #dcdcaa; }
            .ve-line .token.operator { color: #d4d4d4; }
            .ve-line .token.punctuation { color: #d4d4d4; }
            .ve-line .token.class-name { color: #4ec9b0; }
            .ve-line .token.builtin { color: #4ec9b0; }
        `;
        document.head.appendChild(style);
    }

    // ============================================================
    // INITIALIZATION
    // ============================================================
    async function init() {
        // Remove old Prism script if exists
        const oldScript = document.querySelector('script[src*="prism"]');
        if (oldScript) oldScript.remove();

        // Remove old backdrop
        const oldBackdrop = document.getElementById('noteBackdrop');
        if (oldBackdrop) oldBackdrop.remove();

        // Load Prism core
        if (!window.Prism) {
            await new Promise((resolve, reject) => {
                const script = document.createElement('script');
                script.src = 'https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/prism.min.js';
                script.setAttribute('data-manual', 'true');
                script.onload = resolve;
                script.onerror = () => reject(new Error('Failed to load Prism'));
                document.head.appendChild(script);
            }).catch(e => console.error('Prism load failed:', e));
        }

        injectStyles();
        initEditor();
        attachEvents();
        hookExistingFunctions();
        updateLanguage();

        console.log('Enterprise Prism initialized - viewport virtualization active');
    }

    // Start when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
