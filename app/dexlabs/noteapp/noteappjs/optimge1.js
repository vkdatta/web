(() => {
    // 1. Language Loader (Retained from original, unchanged for compatibility)
    class CompletePrismLanguageLoader {
        constructor() {
            this.loadedLanguages = new Set(["markup", "css", "clike", "javascript"]);
            this.loadingLanguages = new Set();
            this.loadPromises = new Map();
            this.extensionMap = { html: "markup", htm: "markup", xml: "markup", svg: "markup", mathml: "markup", ssml: "markup", atom: "markup", rss: "markup", css: "css", js: "javascript", mjs: "javascript", cjs: "javascript", abap: "abap", abnf: "abnf", as: "actionscript", actionscript: "actionscript", ada: "ada", adb: "ada", ads: "ada", agda: "agda", al: "al", g4: "antlr4", antlr4: "antlr4", apacheconf: "apacheconf", apex: "apex", apl: "apl", applescript: "applescript", scpt: "applescript", aql: "aql", ino: "arduino", arduino: "arduino", arff: "arff", "arm-asm": "armasm", armasm: "armasm", art: "arturo", arturo: "arturo", adoc: "asciidoc", asciidoc: "asciidoc", aspx: "aspnet", aspnet: "aspnet", asm6502: "asm6502", asmatmel: "asmatmel", ahk: "autohotkey", autohotkey: "autohotkey", au3: "autoit", autoit: "autoit", avs: "avisynth", avisynth: "avisynth", avdl: "avro-idl", awk: "awk", gawk: "awk", sh: "bash", bash: "bash", shell: "bash", zsh: "bash", basic: "basic", bas: "basic", bat: "batch", cmd: "batch", bbcode: "bbcode", shortcode: "bbcode", bbj: "bbj", bicep: "bicep", birb: "birb", bison: "bison", yacc: "bison", bnf: "bnf", rbnf: "bnf", bqn: "bqn", b: "brainfuck", bf: "brainfuck", brainfuck: "brainfuck", brs: "brightscript", brightscript: "brightscript", bro: "bro", bsl: "bsl", oscript: "bsl", c: "c", h: "c", cs: "csharp", csharp: "csharp", dotnet: "csharp", cpp: "cpp", cc: "cpp", cxx: "cpp", "c++": "cpp", hpp: "cpp", hxx: "cpp", cfc: "cfscript", cfscript: "cfscript", chai: "chaiscript", chaiscript: "chaiscript", cil: "cil", cilkc: "cilkc", "cilk-c": "cilkc", cilkcpp: "cilkcpp", "cilk-cpp": "cilkcpp", cilk: "cilkcpp", clj: "clojure", cljs: "clojure", cljc: "clojure", edn: "clojure", cmake: "cmake", cob: "cobol", cbl: "cobol", cobol: "cobol", coffee: "coffeescript", coffeescript: "coffeescript", conc: "concurnas", concurnas: "concurnas", csp: "csp", cook: "cooklang", cooklang: "cooklang", coq: "coq", v: "coq", cr: "crystal", crystal: "crystal", "css-extras": "css-extras", csv: "csv", cue: "cue", cypher: "cypher", d: "d", di: "d", dart: "dart", dw: "dataweave", dataweave: "dataweave", dax: "dax", dhall: "dhall", diff: "diff", patch: "diff", django: "django", jinja: "django", jinja2: "django", "dns-zone": "dns-zone-file", zone: "dns-zone-file", dockerfile: "docker", docker: "docker", dot: "dot", gv: "dot", ebnf: "ebnf", editorconfig: "editorconfig", e: "eiffel", eiffel: "eiffel", ejs: "ejs", eta: "ejs", erb: "erb", rhtml: "erb", erl: "erlang", hrl: "erlang", erlang: "erlang", xlsx: "excel-formula", xls: "excel-formula", fs: "fsharp", fsx: "fsharp", fsi: "fsharp", factor: "factor", false: "false", firestore: "firestore-security-rules", flow: "flow", f: "fortran", f90: "fortran", f95: "fortran", f03: "fortran", ftl: "ftl", gml: "gml", gamemakerlanguage: "gml", gap: "gap", gi: "gap", gd: "gap", gcode: "gcode", nc: "gcode", gd: "gdscript", gdscript: "gdscript", ged: "gedcom", gedcom: "gedcom", po: "gettext", pot: "gettext", gettext: "gettext", feature: "gherkin", gherkin: "gherkin", git: "git", glsl: "glsl", vert: "glsl", frag: "glsl", gn: "gn", gni: "gn", ld: "linker-script", go: "go", mod: "go-module", sum: "go-module", gradle: "gradle", graphql: "graphql", gql: "graphql", groovy: "groovy", gvy: "groovy", haml: "haml", hbs: "handlebars", handlebars: "handlebars", mustache: "handlebars", hs: "haskell", lhs: "haskell", haskell: "haskell", hx: "haxe", haxe: "haxe", hcl: "hcl", tf: "hcl", hlsl: "hlsl", hoon: "hoon", http: "http", hpkp: "hpkp", hsts: "hsts", ichigojam: "ichigojam", icn: "icon", icon: "icon", icu: "icu-message-format", idr: "idris", lidr: "idris", idris: "idris", gitignore: "ignore", hgignore: "ignore", npmignore: "ignore", ni: "inform7", i7x: "inform7", ini: "ini", cfg: "ini", conf: "ini", properties: "ini", io: "io", ijs: "j", j: "j", java: "java", javadoc: "javadoc", javadoclike: "javadoclike", javastacktrace: "javastacktrace", jexl: "jexl", jolie: "jolie", ol: "jolie", jq: "jq", jsdoc: "jsdoc", "js-extras": "js-extras", json: "json", webmanifest: "json", json5: "json5", jsonp: "jsonp", jsstacktrace: "jsstacktrace", "js-templates": "js-templates", jl: "julia", julia: "julia", keepalived: "keepalived", kmn: "keyman", keyman: "keyman", kt: "kotlin", kts: "kotlin", kotlin: "kotlin", kum: "kumir", kumir: "kumir", kql: "kusto", kusto: "kusto", tex: "latex", latex: "latex", sty: "latex", cls: "latex", latte: "latte", less: "less", ly: "lilypond", ily: "lilypond", liquid: "liquid", lisp: "lisp", el: "lisp", emacs: "lisp", elisp: "lisp", ls: "livescript", livescript: "livescript", ll: "llvm", llvm: "llvm", log: "log", lol: "lolcode", lolcode: "lolcode", lua: "lua", magma: "magma", makefile: "makefile", mk: "makefile", mak: "makefile", md: "markdown", markdown: "markdown", "markup-templating": "markup-templating", mata: "mata", matah: "mata", m: "matlab", matlab: "matlab", ms: "maxscript", mcr: "maxscript", mel: "mel", mermaid: "mermaid", mmd: "mermaid", mf: "metafont", mp: "metafont", miz: "mizar", mizar: "mizar", mongodb: "mongodb", monkey: "monkey", monkey2: "monkey", moon: "moonscript", moonscript: "moonscript", n1ql: "n1ql", n4js: "n4js", n4jsd: "n4js", hdl: "nand2tetris-hdl", nani: "naniscript", naniscript: "naniscript", nasm: "nasm", asm: "nasm", neon: "neon", nevod: "nevod", nginx: "nginx", nginxconf: "nginx", nim: "nim", nims: "nim", nimble: "nim", nix: "nix", nsi: "nsis", nsh: "nsis", objc: "objectivec", "objective-c": "objectivec", m: "objectivec", ml: "ocaml", mli: "ocaml", ocaml: "ocaml", odin: "odin", cl: "opencl", opencl: "opencl", qasm: "openqasm", openqasm: "openqasm", oz: "oz", gp: "parigp", pari: "parigp", parser: "parser", pas: "pascal", p: "pascal", pp: "pascal", ligo: "pascaligo", pascaligo: "pascaligo", psl: "psl", px: "pcaxis", pcaxis: "pcaxis", pcode: "peoplecode", peoplecode: "peoplecode", pl: "perl", pm: "perl", perl: "perl", php: "php", php3: "php", php4: "php", php5: "php", phpdoc: "phpdoc", "php-extras": "php-extras", plantuml: "plant-uml", puml: "plant-uml", "plant-uml": "plant-uml", sql: "plsql", pls: "plsql", plb: "plsql", pq: "powerquery", powerquery: "powerquery", mscript: "powerquery", ps1: "powershell", ps1xml: "powershell", psc1: "powershell", pde: "processing", processing: "processing", pro: "prolog", prolog: "prolog", pl: "prolog", promql: "promql", properties: "properties", proto: "protobuf", protobuf: "protobuf", pug: "pug", jade: "pug", pp: "puppet", puppet: "puppet", pure: "pure", pb: "purebasic", pbi: "purebasic", purs: "purescript", purescript: "purescript", py: "python", pyw: "python", python: "python", qs: "qsharp", qsharp: "qsharp", q: "q", qml: "qml", qore: "qore", q: "qore", r: "r", R: "r", rkt: "racket", rktd: "racket", cshtml: "cshtml", razor: "cshtml", jsx: "jsx", tsx: "tsx", re: "reason", rei: "reason", regex: "regex", regexp: "regex", rego: "rego", rpy: "renpy", rpym: "renpy", res: "rescript", resi: "rescript", rst: "rest", rest: "rest", rip: "rip", graph: "roboconf", instances: "roboconf", robot: "robotframework", resource: "robotframework", rb: "ruby", rbw: "ruby", ruby: "ruby", rs: "rust", rust: "rust", sas: "sas", sass: "sass", scss: "scss", scala: "scala", sc: "scala", scm: "scheme", ss: "scheme", scheme: "scheme", "sh-session": "shell-session", "shell-session": "shell-session", smali: "smali", st: "smalltalk", smalltalk: "smalltalk", tpl: "smarty", smarty: "smarty", sml: "sml", fun: "sml", sig: "sml", sol: "solidity", solidity: "solidity", sln: "solution-file", soy: "soy", sparql: "sparql", rq: "sparql", spl: "splunk-spl", sqf: "sqf", sql: "sql", nut: "squirrel", squirrel: "squirrel", stan: "stan", do: "stata", ado: "stata", st: "iecst", iecst: "iecst", styl: "stylus", stylus: "stylus", sc: "supercollider", scd: "supercollider", swift: "swift", service: "systemd", socket: "systemd", device: "systemd", t4: "t4-templating", tt: "t4-cs", "vb-t4": "t4-vb", tap: "tap", tcl: "tcl", tk: "tcl", tt: "tt2", tt2: "tt2", textile: "textile", toml: "toml", troy: "tremor", trickle: "tremor", ttl: "turtle", trig: "turtle", twig: "twig", ts: "typescript", typescript: "typescript", tsconfig: "typoscript", ts: "typoscript", uc: "unrealscript", uci: "unrealscript", uorazor: "uorazor", uri: "uri", url: "uri", v: "v", vala: "vala", vapi: "vala", vb: "vbnet", vbnet: "vbnet", vm: "velocity", velocity: "velocity", v: "verilog", vh: "verilog", vhd: "vhdl", vhdl: "vhdl", vim: "vim", vimrc: "vim", vb: "visual-basic", bas: "visual-basic", warpscript: "warpscript", wast: "wasm", wat: "wasm", webidl: "web-idl", wgsl: "wgsl", wiki: "wiki", wl: "wolfram", nb: "wolfram", m: "wolfram", wren: "wren", xeoracube: "xeora", "xml-doc": "xml-doc", xojo: "xojo", xq: "xquery", xquery: "xquery", yml: "yaml", yaml: "yaml", yang: "yang", zig: "zig" };
            this.dependencies = { jsx: ["javascript"], tsx: ["typescript", "jsx"], typescript: ["javascript"], scss: ["css"], sass: ["css"], less: ["css"], stylus: ["css"], php: ["markup"], erb: ["ruby", "markup"], aspnet: ["csharp", "markup"], handlebars: ["markup"], django: ["markup"], twig: ["markup"], liquid: ["markup"], pug: ["markup"], haml: ["markup"], cshtml: ["csharp", "markup"], "plant-uml": ["markup"], "t4-cs": ["csharp", "t4-templating"], "t4-vb": ["visual-basic", "t4-templating"], "markup-templating": ["markup"] };
            this.languageNames = { markup: "HTML/XML", css: "CSS", javascript: "JavaScript", typescript: "TypeScript", jsx: "React JSX", tsx: "React TSX", python: "Python", java: "Java", cpp: "C++", c: "C", csharp: "C#", php: "PHP", ruby: "Ruby", go: "Go", rust: "Rust", swift: "Swift", kotlin: "Kotlin", scala: "Scala", dart: "Dart", bash: "Bash", powershell: "PowerShell", sql: "SQL", json: "JSON", yaml: "YAML", markdown: "Markdown", clojure: "Clojure", haskell: "Haskell", elixir: "Elixir", erlang: "Erlang", fsharp: "F#", ocaml: "OCaml", reason: "Reason", elm: "Elm", purescript: "PureScript", rescript: "ReScript", lua: "Lua", perl: "Perl", r: "R", julia: "Julia", solidity: "Solidity", graphql: "GraphQL", dockerfile: "Docker", nginx: "nginx", apache: "Apache", makefile: "Makefile", toml: "TOML", ini: "INI", properties: "Properties", none: "Plain Text" };
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
            if (!language || language === "none" || this.loadedLanguages.has(language)) return Promise.resolve();
            if (this.loadPromises.has(language)) return this.loadPromises.get(language);
            const loadPromise = this._loadLanguageWithDependencies(language);
            this.loadPromises.set(language, loadPromise);
            return loadPromise;
        }
        async _loadLanguageWithDependencies(language) {
            try {
                if (this.dependencies[language]) {
                    for (const dep of this.dependencies[language]) await this.loadLanguage(dep);
                }
                if (this.loadedLanguages.has(language) || this.loadingLanguages.has(language)) return;
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
                        reject(new Error(`Failed to load language: ${language}`));
                    };
                    setTimeout(() => {
                        if (this.loadingLanguages.has(language)) {
                            this.loadingLanguages.delete(language);
                            reject(new Error(`Timeout loading language: ${language}`));
                        }
                    }, 5000);
                });
                document.head.appendChild(script);
                return loadPromise;
            } catch (error) {
                this.loadingLanguages.delete(language);
                throw error;
            }
        }
        isLanguageLoaded(language) { return this.loadedLanguages.has(language); }
        isLanguageLoading(language) { return this.loadingLanguages.has(language); }
    }

    // 2. State & Core Variables
    window.currentHighlightLanguage = "none";
    window.prismInitialized = false;
    window.updateTimeout = null;
    window.debounceTimer = null;
    
    // Limits for graceful degradation
    const LARGE_TEXT_THRESHOLD = 50000; 

    function fastEscapeHtml(e) {
        return e.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
    }

    // Utility: Calculate line height for virtualization
    function getLineHeight(el) {
        const computedStyle = window.getComputedStyle(el);
        let lh = parseInt(computedStyle.lineHeight);
        if (isNaN(lh)) lh = parseInt(computedStyle.fontSize) * 1.2 || 20; 
        return lh;
    }

    // Deprecate immediate plain render to avoid double-rendering large files
    window.immediatePlainRender = function () {
        // Handled efficiently inside updateBackdrop now.
    };

    window.syncScroll = function () {
        if (!window.noteBackdrop || !window.noteTextarea) return;
        window.noteBackdrop.scrollTop = window.noteTextarea.scrollTop;
        window.noteBackdrop.scrollLeft = window.noteTextarea.scrollLeft;
        // Removed forced layout reads (.offsetHeight) to prevent lag
    };

    window.scheduleUpdate = function (force = false) {
        if (window.debounceTimer) clearTimeout(window.debounceTimer);
        if (window.updateTimeout) cancelAnimationFrame(window.updateTimeout);
        
        if (force) {
            requestAnimationFrame(window.updateBackdrop);
        } else {
            // Aggressive debounce: Wait 150ms after typing stops
            window.debounceTimer = setTimeout(() => {
                requestAnimationFrame(window.updateBackdrop);
            }, 150);
        }
    };

    // 3. The Enterprise Render Engine
    window.updateBackdrop = async function () {
        window.updateTimeout = null;
        window.debounceTimer = null;

        if (!window.noteTextarea || !window.noteBackdrop) return;

        const text = window.noteTextarea.value;
        if (!text) {
            window.noteBackdrop.innerHTML = "";
            return;
        }

        // Detect Language
        let lang = "none";
        if (window.currentNote && window.currentNote.extension) {
            lang = window.languageLoader.detectLanguageFromFilename(`file.${window.currentNote.extension}`);
        }

        if (lang !== window.currentHighlightLanguage) {
            window.currentHighlightLanguage = lang;
        }

        // Lazy load language
        if (lang && lang !== "none") {
            if (!window.languageLoader.isLanguageLoaded(lang) && !window.languageLoader.isLanguageLoading(lang)) {
                await window.languageLoader.loadLanguage(lang).catch(() => {
                    window.currentHighlightLanguage = "none";
                });
            }
        }

        // JIT VIEWPORT RENDERER (For Large Files)
        if (text.length > LARGE_TEXT_THRESHOLD) {
            const scrollTop = window.noteTextarea.scrollTop;
            const lineHeight = getLineHeight(window.noteTextarea);
            const clientHeight = window.noteTextarea.clientHeight || 800;

            const firstVisible = Math.max(0, Math.floor(scrollTop / lineHeight));
            const visibleCount = Math.ceil(clientHeight / lineHeight);
            const buffer = visibleCount * 2; // Render 2 screens worth

            const lines = text.split('\n');
            const totalLines = lines.length;
            
            const startLine = Math.max(0, firstVisible - buffer);
            const endLine = Math.min(totalLines, firstVisible + visibleCount + buffer);

            let chunk = lines.slice(startLine, endLine).join('\n');
            if (chunk.endsWith("\n") || endLine === totalLines) chunk += " ";

            // Skip Prism. Highlighting arbitrary slices breaks multiline tokens (/* ... */)
            const escapedChunk = fastEscapeHtml(chunk);

            // Maintain exact scroll height container to preserve native scroll synchronization
            window.noteBackdrop.innerHTML = `
                <div style="height: ${totalLines * lineHeight}px; position: relative;">
                    <div style="transform: translateY(${startLine * lineHeight}px); color: var(--color);">${escapedChunk}</div>
                </div>
            `;
        } 
        // STANDARD RENDERER (For Small Files)
        else {
            let contentToRender = text;
            if (contentToRender.endsWith("\n")) contentToRender += " ";

            if (window.languageLoader.isLanguageLoaded(window.currentHighlightLanguage) && window.Prism && Prism.languages[window.currentHighlightLanguage]) {
                try {
                    contentToRender = Prism.highlight(
                        contentToRender,
                        Prism.languages[window.currentHighlightLanguage],
                        window.currentHighlightLanguage
                    );
                } catch (e) {
                    console.warn("Prism failed:", e);
                    contentToRender = fastEscapeHtml(contentToRender);
                }
            } else {
                contentToRender = fastEscapeHtml(contentToRender);
            }
            window.noteBackdrop.innerHTML = contentToRender;
        }

        window.syncScroll();
    };

    // 4. Initialization & Clean Listeners
    (async function () {
        function setupDOM() {
            let bd = document.getElementById("noteBackdrop");
            let ta = document.getElementById("noteTextarea");
            
            if (!bd) {
                bd = document.createElement("pre");
                bd.id = "noteBackdrop";
                bd.className = "note-backdrop";
                bd.setAttribute("aria-hidden", "true");
                (document.querySelector(".text-area-wrapper") || document.body).insertBefore(bd, null);
            }
            if (!ta) {
                ta = document.createElement("textarea");
                ta.id = "noteTextarea";
                ta.className = "note-textarea";
                ta.setAttribute("spellcheck", "false");
                ta.setAttribute("autocomplete", "off");
                ta.setAttribute("autocorrect", "off");
                ta.setAttribute("autocapitalize", "off");
                (document.querySelector(".text-area-wrapper") || document.body).appendChild(ta);
            }
            return { bd, ta };
        }

        const { bd, ta } = setupDOM();
        window.noteBackdrop = bd;
        window.noteTextarea = ta;

        // Strip existing bad prism scripts if any
        const oldPrism = document.querySelector('script[src*="prism"]');
        if (oldPrism && !oldPrism.hasAttribute("data-manual")) oldPrism.remove();

        if (!window.Prism) {
            await new Promise((resolve, reject) => {
                const script = document.createElement("script");
                script.src = "https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/prism.min.js";
                script.setAttribute("data-manual", "true");
                script.onload = resolve;
                script.onerror = reject;
                document.head.appendChild(script);
            }).catch(e => console.error("Could not load Prism:", e));
        }

        if (!window.languageLoader) {
            window.languageLoader = new CompletePrismLanguageLoader();
            window.prismInitialized = true;
        }

        // Optimized Listeners: Removed MutationObserver, setInterval, and duplicates.
        ta.addEventListener("input", () => window.scheduleUpdate());
        
        // Critical for viewport chunking: Re-render on scroll if large text
        ta.addEventListener("scroll", () => {
            window.syncScroll();
            if (ta.value.length > LARGE_TEXT_THRESHOLD) {
                window.scheduleUpdate();
            }
        }, { passive: true });

        ta.addEventListener("keydown", (e) => {
            if (e.key === "Tab") {
                e.preventDefault();
                const start = ta.selectionStart;
                const end = ta.selectionEnd;
                ta.value = ta.value.substring(0, start) + "\t" + ta.value.substring(end);
                ta.selectionStart = ta.selectionEnd = start + 1;
                // Dispatch input event to trigger saves/highlights naturally
                ta.dispatchEvent(new Event('input')); 
            } else {
                window.scheduleUpdate();
            }
        });

        // Setup base styles to ensure alignment
        const style = document.createElement("style");
        style.textContent = `
            .text-area-wrapper { position:relative; width:100%; height:100%; overflow:hidden; contain:layout style paint; }
            #noteBackdrop pre, #noteBackdrop { margin:0; pointer-events:none; }
        `;
        document.head.appendChild(style);
        
        // Final init paint
        setTimeout(() => window.scheduleUpdate(true), 100);
        console.log("Enterprise-optimized Virtualized Prism initialized");
    })();
})();
