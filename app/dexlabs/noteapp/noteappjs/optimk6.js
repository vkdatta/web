
// ============================================================
// DEXLABS NOTE APP - OPTIMIZED PRISM SYNTAX HIGHLIGHTER v6
// Fix: Inject token colors directly so they work regardless of theme/CSS
// ============================================================

(() => {
    const LARGE_FILE_THRESHOLD = 80000;
    const HIGHLIGHT_DEBOUNCE = 250;

    let languageLoader = null;
    let currentLanguage = "none";
    let isLargeFile = false;
    let lastHighlightedContent = "";
    let lastHighlightedLang = "none";
    let initComplete = false;

    // ============================================================
    // INJECT TOKEN COLORS (Works with any DOM structure)
    // ============================================================
    function injectTokenStyles() {
        const style = document.createElement('style');
        style.id = 'prism-token-colors';
        style.textContent = `
            /* Base token colors - VS Code Dark+ theme */
            #noteBackdrop .token.comment,
            #noteBackdrop .token.prolog,
            #noteBackdrop .token.doctype,
            #noteBackdrop .token.cdata { color: #6a9955; }

            #noteBackdrop .token.punctuation { color: #d4d4d4; }

            #noteBackdrop .token.namespace { opacity: 0.7; }

            #noteBackdrop .token.property,
            #noteBackdrop .token.tag,
            #noteBackdrop .token.boolean,
            #noteBackdrop .token.number,
            #noteBackdrop .token.constant,
            #noteBackdrop .token.symbol,
            #noteBackdrop .token.deleted { color: #569cd6; }

            #noteBackdrop .token.selector,
            #noteBackdrop .token.attr-name,
            #noteBackdrop .token.string,
            #noteBackdrop .token.char,
            #noteBackdrop .token.builtin,
            #noteBackdrop .token.inserted { color: #ce9178; }

            #noteBackdrop .token.operator,
            #noteBackdrop .token.entity,
            #noteBackdrop .token.url,
            #noteBackdrop .token.variable,
            #noteBackdrop .token.language-css .token.string { color: #d4d4d4; }

            #noteBackdrop .token.atrule,
            #noteBackdrop .token.attr-value,
            #noteBackdrop .token.keyword { color: #c586c0; }

            #noteBackdrop .token.function,
            #noteBackdrop .token.class-name,
            #noteBackdrop .token.regex { color: #dcdcaa; }

            #noteBackdrop .token.important,
            #noteBackdrop .token.bold { color: #569cd6; font-weight: bold; }

            #noteBackdrop .token.italic { font-style: italic; }

            /* Ensure text is visible */
            #noteBackdrop { color: #d4d4d4; }
        `;
        document.head.appendChild(style);
    }

    // ============================================================
    // LANGUAGE LOADER
    // ============================================================
    class CompletePrismLanguageLoader {
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

    // ============================================================
    // CORE RENDERING
    // ============================================================
    function immediatePlainRender() {
        const ta = document.getElementById('noteTextarea');
        const bd = document.getElementById('noteBackdrop');
        if (!ta || !bd) return;

        const text = ta.value;
        let html = escapeHtml(text);
        if (!text.endsWith('\n') && !text.endsWith('\r')) {
            html += ' ';
        }
        bd.innerHTML = html;
        bd.style.color = "var(--color)";
        syncScroll();
    }

    async function updateBackdrop() {
        const ta = document.getElementById('noteTextarea');
        const bd = document.getElementById('noteBackdrop');
        if (!ta || !bd) return;

        const text = ta.value;
        const lang = currentLanguage;

        if (text.length > LARGE_FILE_THRESHOLD) {
            if (!isLargeFile) {
                isLargeFile = true;
                console.log('[Prism] Large file mode');
            }
            return;
        }
        isLargeFile = false;

        if (lang === "none" || !lang) return;
        if (text === lastHighlightedContent && lang === lastHighlightedLang) return;
        if (!window.Prism) return;

        if (!languageLoader.isLanguageLoaded(lang)) {
            try {
                await languageLoader.loadLanguage(lang);
            } catch (e) { return; }
        }

        if (!Prism.languages[lang]) return;

        try {
            await new Promise(resolve => setTimeout(resolve, 0));
            const highlighted = Prism.highlight(text, Prism.languages[lang], lang);
            let html = highlighted;
            if (!text.endsWith('\n') && !text.endsWith('\r')) {
                html += ' ';
            }
            bd.innerHTML = html;
            bd.style.color = ""; // Let injected token CSS handle colors
            lastHighlightedContent = text;
            lastHighlightedLang = lang;
            syncScroll();
        } catch (e) {
            console.error('[Prism] Highlight error:', e);
        }
    }

    const scheduleUpdate = debounce((force = false) => {
        if (force) {
            lastHighlightedContent = "";
        }
        requestAnimationFrame(updateBackdrop);
    }, HIGHLIGHT_DEBOUNCE);

    // ============================================================
    // SCROLL SYNC
    // ============================================================
    function syncScroll() {
        const ta = document.getElementById('noteTextarea');
        const bd = document.getElementById('noteBackdrop');
        const fd = document.getElementById('findBackdrop');
        if (!ta || !bd) return;
        bd.scrollTop = ta.scrollTop;
        bd.scrollLeft = ta.scrollLeft;
        if (fd) {
            fd.scrollTop = ta.scrollTop;
            fd.scrollLeft = ta.scrollLeft;
        }
    }

    // ============================================================
    // INPUT HANDLING
    // ============================================================
    function onInput() {
        immediatePlainRender();
        scheduleUpdate();
    }

    // ============================================================
    // LANGUAGE UPDATE
    // ============================================================
    async function updateLanguage() {
        const note = window.currentNote;
        if (!note) {
            currentLanguage = "none";
            window.currentHighlightLanguage = "none";
            return;
        }

        const ext = note.extension || '';
        const newLang = ext ? languageLoader.detectLanguageFromFilename(`file.${ext}`) : "none";

        if (newLang !== currentLanguage) {
            currentLanguage = newLang;
            window.currentHighlightLanguage = newLang;
            lastHighlightedContent = "";
            lastHighlightedLang = "none";

            if (newLang !== "none") {
                try {
                    await languageLoader.loadLanguage(newLang);
                } catch (e) {
                    currentLanguage = "none";
                    window.currentHighlightLanguage = "none";
                }
            }
        }
    }

    // ============================================================
    // EVENTS
    // ============================================================
    function attachEvents() {
        const ta = document.getElementById('noteTextarea');
        if (!ta) return;

        ta.addEventListener('input', onInput);
        ta.addEventListener('scroll', syncScroll, { passive: true });
        ta.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') setTimeout(onInput, 0);
        });
        ['paste', 'cut'].forEach(evt => {
            ta.addEventListener(evt, () => setTimeout(onInput, 10));
        });
    }

    // ============================================================
    // HOOKS
    // ============================================================
    function hookFunctions() {
        const originalOpenNote = window.openNote;
        window.openNote = function(noteId) {
            if (originalOpenNote) originalOpenNote(noteId);
            updateLanguage().then(() => {
                lastHighlightedContent = "";
                onInput();
            });
        };

        const originalRename = window.handleRenameSubmit;
        window.handleRenameSubmit = function() {
            if (originalRename) originalRename();
            setTimeout(() => {
                updateLanguage().then(() => {
                    lastHighlightedContent = "";
                    onInput();
                });
            }, 50);
        };

        const ta = document.getElementById('noteTextarea');
        if (ta) {
            const descriptor = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value');
            if (descriptor && descriptor.set) {
                const originalSet = descriptor.set;
                Object.defineProperty(ta, 'value', {
                    set: function(newValue) {
                        originalSet.call(this, newValue);
                        if (initComplete) {
                            setTimeout(() => {
                                lastHighlightedContent = "";
                                onInput();
                            }, 0);
                        }
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
    // INIT
    // ============================================================
    async function init() {
        if (!window.Prism) {
            await new Promise((resolve) => {
                const check = () => {
                    if (window.Prism) resolve();
                    else setTimeout(check, 50);
                };
                check();
            });
        }

        injectTokenStyles();
        languageLoader = new CompletePrismLanguageLoader();
        attachEvents();
        hookFunctions();

        if (window.currentNote) {
            await updateLanguage();
        }

        window.immediatePlainRender = immediatePlainRender;
        window.scheduleUpdate = scheduleUpdate;
        window.updateBackdrop = updateBackdrop;
        window.syncScroll = syncScroll;

        initComplete = true;

        setTimeout(() => {
            onInput();
        }, 100);

        console.log('[Prism] v6 init complete. Language:', currentLanguage);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
