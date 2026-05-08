
// ============================================================
// DEXLABS NOTE APP - ENTERPRISE PRISM SYNTAX HIGHLIGHTER
// Optimized for: viewport rendering + find/replace coexistence + live sync
// ============================================================

(() => {
    // ============================================================
    // CONFIGURATION
    // ============================================================
    const CONFIG = {
        PRISM_LIMIT: 50000,           // Max chars for full Prism highlighting
        VIEWPORT_BUFFER: 2,            // Viewports above/below to render
        DEBOUNCE_MS: 120,              // Debounce for highlighting
        SCROLL_THROTTLE_MS: 16,        // 1 frame for scroll sync
        LARGE_FILE_THRESHOLD: 100000,  // Switch to plain text mode
        MAX_LINE_LENGTH: 5000,         // Max chars per line before truncation
        USE_INCREMENTAL: true,         // Only re-highlight changed lines
        PRESERVE_FIND_BACKDROP: true   // Keep findBackdrop functional
    };

    // ============================================================
    // STATE
    // ============================================================
    let languageLoader = null;
    let currentLanguage = "none";
    let isLargeFile = false;
    let lastContent = "";
    let highlightTimeout = null;
    let scrollRAF = null;
    let prismCoreLoaded = false;

    // Viewport tracking
    let viewportState = {
        startLine: 0,
        endLine: 0,
        scrollTop: 0,
        clientHeight: 0,
        lineHeight: 20
    };

    // Line cache for incremental updates
    let lineCache = new Map();      // lineIndex -> {text, highlighted, language}
    let dirtyLines = new Set();

    // ============================================================
    // LANGUAGE LOADER (Complete, same as before)
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

        isLanguageLoaded(language) {
            return this.loadedLanguages.has(language);
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

    // Get computed line height from textarea
    function getLineHeight() {
        const ta = document.getElementById('noteTextarea');
        if (!ta) return 20;
        const style = window.getComputedStyle(ta);
        const lh = parseFloat(style.lineHeight);
        return isNaN(lh) ? parseFloat(style.fontSize) * 1.5 : lh;
    }

    // ============================================================
    // VIEWPORT CALCULATION
    // ============================================================
    function calculateViewport() {
        const ta = document.getElementById('noteTextarea');
        const bd = document.getElementById('noteBackdrop');
        if (!ta || !bd) return null;

        const lineHeight = getLineHeight();
        const scrollTop = ta.scrollTop;
        const clientHeight = ta.clientHeight;
        const firstLine = Math.floor(scrollTop / lineHeight);
        const visibleLines = Math.ceil(clientHeight / lineHeight);
        const buffer = visibleLines * CONFIG.VIEWPORT_BUFFER;

        return {
            startLine: Math.max(0, firstLine - buffer),
            endLine: firstLine + visibleLines + buffer,
            scrollTop,
            clientHeight,
            lineHeight,
            firstVisible: firstLine,
            visibleCount: visibleLines
        };
    }

    // ============================================================
    // CONTENT SPLITTING & DIFFING
    // ============================================================
    function splitLines(text) {
        return text.split(/
?
/);
    }

    function findFirstDiffLine(oldLines, newLines) {
        const maxLen = Math.max(oldLines.length, newLines.length);
        for (let i = 0; i < maxLen; i++) {
            if (oldLines[i] !== newLines[i]) return i;
        }
        return -1;
    }

    // ============================================================
    // BACKDROP RENDERING (Viewport-aware)
    // ============================================================
    function renderPlainBackdrop(text) {
        const bd = document.getElementById('noteBackdrop');
        if (!bd) return;

        // For large files or plain text mode: simple escape
        let html = escapeHtml(text);
        if (!text.endsWith('\n') && !text.endsWith('\r')) {
            html += ' ';
        }
        bd.innerHTML = html;
    }

    function renderViewportBackdrop() {
        const ta = document.getElementById('noteTextarea');
        const bd = document.getElementById('noteBackdrop');
        if (!ta || !bd) return;

        const text = ta.value;
        const vp = calculateViewport();
        if (!vp) return;

        viewportState = vp;

        // Large file: plain text only
        if (text.length > CONFIG.LARGE_FILE_THRESHOLD) {
            if (!isLargeFile) {
                isLargeFile = true;
                lineCache.clear();
                dirtyLines.clear();
            }
            renderPlainBackdrop(text);
            syncScroll();
            return;
        }

        isLargeFile = false;

        const lines = splitLines(text);
        const { startLine, endLine } = vp;
        const actualEnd = Math.min(endLine, lines.length);

        // Build HTML for visible region only
        let html = '';
        for (let i = startLine; i < actualEnd; i++) {
            const line = lines[i] || '';
            const cached = lineCache.get(i);

            if (cached && cached.text === line && cached.language === currentLanguage && !dirtyLines.has(i)) {
                html += cached.highlighted;
            } else {
                // Plain text for now, queue for highlighting
                html += escapeHtml(line) || ' ';
                if (i < lines.length - 1) html += '\n';

                if (currentLanguage !== 'none' && languageLoader && languageLoader.isLanguageLoaded(currentLanguage)) {
                    dirtyLines.add(i);
                }
            }
            if (i < actualEnd - 1) html += '\n';
        }

        // Add padding for scroll height
        const totalHeight = lines.length * vp.lineHeight;
        bd.style.minHeight = totalHeight + 'px';

        bd.innerHTML = html || ' ';
        syncScroll();

        // Queue async highlighting for dirty lines
        if (dirtyLines.size > 0 && currentLanguage !== 'none') {
            queueHighlighting(lines, vp);
        }
    }

    // ============================================================
    // ASYNC HIGHLIGHTING (Non-blocking)
    // ============================================================
    let highlightQueue = [];
    let isHighlighting = false;

    function queueHighlighting(lines, vp) {
        // Convert dirty lines to queue items, prioritize visible lines
        const visibleSet = new Set();
        for (let i = vp.firstVisible; i < vp.firstVisible + vp.visibleCount; i++) {
            visibleSet.add(i);
        }

        const items = [];
        dirtyLines.forEach(lineNo => {
            if (lineNo >= 0 && lineNo < lines.length) {
                const priority = visibleSet.has(lineNo) ? 0 : Math.abs(lineNo - vp.firstVisible);
                items.push({ lineNo, text: lines[lineNo], priority });
            }
        });

        items.sort((a, b) => a.priority - b.priority);
        highlightQueue = items;

        if (!isHighlighting) {
            processHighlightQueue();
        }
    }

    async function processHighlightQueue() {
        if (isHighlighting || highlightQueue.length === 0) return;
        isHighlighting = true;

        const ta = document.getElementById('noteTextarea');
        if (!ta) { isHighlighting = false; return; }

        const batchSize = 3; // Process 3 lines per frame

        while (highlightQueue.length > 0) {
            const batch = highlightQueue.splice(0, batchSize);

            for (const item of batch) {
                if (!window.Prism || !Prism.languages[currentLanguage]) continue;

                try {
                    const highlighted = Prism.highlight(
                        item.text,
                        Prism.languages[currentLanguage],
                        currentLanguage
                    );

                    lineCache.set(item.lineNo, {
                        text: item.text,
                        highlighted: highlighted || escapeHtml(item.text),
                        language: currentLanguage
                    });
                    dirtyLines.delete(item.lineNo);
                } catch (e) {
                    lineCache.set(item.lineNo, {
                        text: item.text,
                        highlighted: escapeHtml(item.text),
                        language: currentLanguage
                    });
                    dirtyLines.delete(item.lineNo);
                }
            }

            // Re-render viewport with new highlights
            requestAnimationFrame(() => {
                renderViewportBackdrop();
            });

            // Yield to main thread
            await new Promise(r => requestAnimationFrame(r));

            // Stop if content changed
            if (ta.value !== lastContent) {
                break;
            }
        }

        isHighlighting = false;
        if (dirtyLines.size > 0) {
            setTimeout(processHighlightQueue, 50);
        }
    }

    // ============================================================
    // SCROLL SYNC (No forced reflow)
    // ============================================================
    function syncScroll() {
        const ta = document.getElementById('noteTextarea');
        const bd = document.getElementById('noteBackdrop');
        const fd = document.getElementById('findBackdrop');

        if (!ta || !bd) return;

        const scrollTop = ta.scrollTop;
        const scrollLeft = ta.scrollLeft;

        bd.scrollTop = scrollTop;
        bd.scrollLeft = scrollLeft;

        if (fd) {
            fd.scrollTop = scrollTop;
            fd.scrollLeft = scrollLeft;
        }
    }

    const throttledSyncScroll = throttle(syncScroll, CONFIG.SCROLL_THROTTLE_MS);

    // ============================================================
    // INPUT HANDLING (Incremental)
    // ============================================================
    function handleInput() {
        const ta = document.getElementById('noteTextarea');
        if (!ta) return;

        const newContent = ta.value;
        const oldLines = splitLines(lastContent);
        const newLines = splitLines(newContent);

        // Find first changed line
        const firstDiff = findFirstDiffLine(oldLines, newLines);

        if (firstDiff >= 0) {
            // Mark changed line and downstream lines dirty
            dirtyLines.add(firstDiff);
            // Invalidate syntax state propagation (50 lines downstream)
            for (let i = firstDiff + 1; i < Math.min(firstDiff + 50, newLines.length); i++) {
                dirtyLines.add(i);
                lineCache.delete(i);
            }
        }

        lastContent = newContent;

        // Clear cache for lines that no longer exist
        const maxLine = Math.max(oldLines.length, newLines.length);
        for (let i = newLines.length; i < maxLine; i++) {
            lineCache.delete(i);
            dirtyLines.delete(i);
        }

        // Debounced render
        debouncedRender();
    }

    const debouncedRender = debounce(() => {
        requestAnimationFrame(() => {
            renderViewportBackdrop();
        });
    }, CONFIG.DEBOUNCE_MS);

    // Immediate render for scroll
    function handleScroll() {
        if (scrollRAF) cancelAnimationFrame(scrollRAF);
        scrollRAF = requestAnimationFrame(() => {
            renderViewportBackdrop();
            throttledSyncScroll();
        });
    }

    // ============================================================
    // LANGUAGE DETECTION & UPDATE
    // ============================================================
    async function updateLanguage() {
        if (!window.currentNote) {
            currentLanguage = "none";
            window.currentHighlightLanguage = "none";
            return;
        }

        const newLang = window.currentNote.extension
            ? languageLoader.detectLanguageFromFilename(`file.${window.currentNote.extension}`)
            : "none";

        if (newLang !== currentLanguage) {
            currentLanguage = newLang;
            window.currentHighlightLanguage = newLang;

            // Clear all caches when language changes
            lineCache.clear();
            dirtyLines.clear();

            if (newLang !== "none") {
                try {
                    await languageLoader.loadLanguage(newLang);
                } catch (e) {
                    currentLanguage = "none";
                    window.currentHighlightLanguage = "none";
                }
            }

            renderViewportBackdrop();
        }
    }

    // ============================================================
    // FULL RENDER (For openNote, rename, etc.)
    // ============================================================
    function forceFullRender() {
        const ta = document.getElementById('noteTextarea');
        if (!ta) return;

        lastContent = ta.value;
        lineCache.clear();
        dirtyLines.clear();

        // Mark all lines dirty for new language
        if (currentLanguage !== 'none') {
            const lines = splitLines(lastContent);
            for (let i = 0; i < lines.length; i++) {
                dirtyLines.add(i);
            }
        }

        renderViewportBackdrop();
    }

    // ============================================================
    // EVENT ATTACHMENT
    // ============================================================
    function attachEvents() {
        const ta = document.getElementById('noteTextarea');
        if (!ta) return;

        // Input - incremental update with debounce
        ta.addEventListener('input', handleInput);

        // Scroll - viewport recalculation
        ta.addEventListener('scroll', handleScroll, { passive: true });

        // Keydown - immediate feedback
        ta.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                // Let default tab handling work, then update
                setTimeout(handleInput, 0);
            }
        });

        // Paste/Cut
        ['paste', 'cut'].forEach(evt => {
            ta.addEventListener(evt, () => {
                setTimeout(handleInput, 0);
            });
        });

        // Font size changes
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((m) => {
                if (m.type === 'attributes' && m.attributeName === 'style') {
                    // Line height may have changed
                    renderViewportBackdrop();
                }
            });
        });
        observer.observe(ta, { attributes: true, attributeFilter: ['style'] });
    }

    // ============================================================
    // HOOK INTO EXISTING FUNCTIONS
    // ============================================================
    function hookFunctions() {
        // Hook openNote
        const originalOpenNote = window.openNote;
        window.openNote = function(noteId) {
            if (originalOpenNote) originalOpenNote(noteId);

            setTimeout(() => {
                updateLanguage();
                forceFullRender();
            }, 50);
        };

        // Hook handleRenameSubmit
        const originalRename = window.handleRenameSubmit;
        window.handleRenameSubmit = function() {
            if (originalRename) originalRename();

            setTimeout(() => {
                updateLanguage();
                forceFullRender();
            }, 50);
        };

        // Hook undo/redo if they exist
        if (window.undoManager) {
            const originalUndo = window.undoManager.undo;
            const originalRedo = window.undoManager.redo;

            if (originalUndo) {
                window.undoManager.undo = function(...args) {
                    const result = originalUndo.apply(this, args);
                    setTimeout(() => {
                        handleInput();
                    }, 0);
                    return result;
                };
            }

            if (originalRedo) {
                window.undoManager.redo = function(...args) {
                    const result = originalRedo.apply(this, args);
                    setTimeout(() => {
                        handleInput();
                    }, 0);
                    return result;
                };
            }
        }

        // Hook Firestore sync updates
        // The setupNoteListener updates textarea.value directly
        // We need to detect those changes
        const ta = document.getElementById('noteTextarea');
        if (ta) {
            const descriptor = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value');
            if (descriptor && descriptor.set) {
                Object.defineProperty(ta, 'value', {
                    set: function(newValue) {
                        descriptor.set.call(this, newValue);
                        // Trigger our update
                        setTimeout(() => {
                            lastContent = newValue;
                            handleInput();
                        }, 0);
                    },
                    get: function() {
                        return descriptor.get.call(this);
                    },
                    configurable: true
                });
            }
        }
    }

    // ============================================================
    // STYLES (Minimal - works with existing CSS)
    // ============================================================
    function injectStyles() {
        const style = document.createElement('style');
        style.textContent = `
            /* Prism token colors for viewport rendering */
            #noteBackdrop .token.comment { color: #6a9955; }
            #noteBackdrop .token.keyword { color: #c586c0; }
            #noteBackdrop .token.string { color: #ce9178; }
            #noteBackdrop .token.number { color: #b5cea8; }
            #noteBackdrop .token.function { color: #dcdcaa; }
            #noteBackdrop .token.operator { color: #d4d4d4; }
            #noteBackdrop .token.punctuation { color: #d4d4d4; }
            #noteBackdrop .token.class-name { color: #4ec9b0; }
            #noteBackdrop .token.builtin { color: #4ec9b0; }
            #noteBackdrop .token.property { color: #9cdcfe; }
            #noteBackdrop .token.tag { color: #569cd6; }
            #noteBackdrop .token.attr-name { color: #9cdcfe; }
            #noteBackdrop .token.attr-value { color: #ce9178; }
            #noteBackdrop .token.boolean { color: #569cd6; }
            #noteBackdrop .token.constant { color: #569cd6; }
            #noteBackdrop .token.deleted { color: #f48771; }
            #noteBackdrop .token.inserted { color: #b5cea8; }
            #noteBackdrop .token.important { color: #569cd6; }
            #noteBackdrop .token.regex { color: #d16969; }
            #noteBackdrop .token.selector { color: #d7ba7d; }
            #noteBackdrop .token.symbol { color: #569cd6; }
            #noteBackdrop .token.variable { color: #9cdcfe; }

            /* Ensure backdrop doesn't interfere with findBackdrop */
            #noteBackdrop {
                z-index: 1;
            }
            #findBackdrop {
                z-index: 2;
            }
            #noteTextarea {
                z-index: 3;
            }
        `;
        document.head.appendChild(style);
    }

    // ============================================================
    // INITIALIZATION
    // ============================================================
    async function init() {
        // Wait for Prism core (already loaded via CDN in HTML head)
        if (!window.Prism) {
            await new Promise((resolve) => {
                const check = () => {
                    if (window.Prism) resolve();
                    else setTimeout(check, 50);
                };
                check();
            });
        }
        prismCoreLoaded = true;

        languageLoader = new EnterpriseLanguageLoader();

        const ta = document.getElementById('noteTextarea');
        if (ta) {
            lastContent = ta.value;
        }

        injectStyles();
        attachEvents();
        hookFunctions();
        updateLanguage();

        // Initial render
        setTimeout(() => {
            forceFullRender();
        }, 100);

        console.log('DexLabs Prism: Enterprise highlighting initialized');
    }

    // Start
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
