<script>
(function(){
'use strict';
const css = ` .code-container { position: relative; margin: 20px auto; max-width: 80vw; font-size: 14px; background: #000000; border-radius: 8px; border: 1px solid #333; overflow: hidden; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3); font-family: "Source Code Pro", Monaco, Consolas, "Courier New", monospace; } .code-header { display: flex; justify-content: space-between; align-items: center; padding: 5px; background: #1e1e1e; border-bottom: 1px solid #404040; min-height: 20px; font-family: "Source Code Pro", Monaco, Consolas, "Courier New", monospace; } .language-badge { margin-left:8px; color: #ccc; padding: 2px 8px; border-radius: 4px; font-size: 12px; font-weight: 500; text-transform: none; letter-spacing: 0.5px; background: transparent; font-family: "Source Code Pro", Monaco, Consolas, "Courier New", monospace; } .code-toolbar { display: flex; gap: 2px; align-items: center; -webkit-user-select: none; -moz-user-select: none; -ms-user-select: none; user-select: none; } .code-btn { background: transparent; border: none; color: #cacaca; cursor: pointer; padding: 4px 6px; border-radius: 4px; display: flex; align-items: center; justify-content: center; width: 28px; height: 28px; transition: none; font-size: 18px; -webkit-user-select: none; -moz-user-select: none; -ms-user-select: none; user-select: none; } .code-btn:hover { } .code-btn:active { transform: none; } .code-btn i { font-size: 20px; line-height: 1; -webkit-user-select: none; -moz-user-select: none; -ms-user-select: none; user-select: none; } .code-pre { margin: 0; padding: 16px; overflow-x: auto; white-space: pre; color: #d4d4d4; background: transparent; border-radius: 0; line-height: 1.4; tab-size: 4; font-family: "Source Code Pro", Monaco, Consolas, "Courier New", monospace; } .code-pre::-webkit-scrollbar { height: 8px; } .code-pre::-webkit-scrollbar-track { background: #1e1e1e; } .code-pre::-webkit-scrollbar-thumb { background: #404040; border-radius: 4px; } .code-pre::-webkit-scrollbar-thumb:hover { background: #555; } .code-pre.line-wrap { white-space: pre-wrap; word-wrap: break-word; overflow-x: hidden; } .code-content { display: block; margin: 0; font-size: inherit; font-family: "Source Code Pro", Monaco, Consolas, "Courier New", monospace; } .code-container.collapsed .code-pre { max-height: 0; overflow: hidden; position: relative; padding: 0; margin: 0; border: none; } .hidden-lines-indicator { display: none; padding: 8px 16px; color: #888; font-size: 12px; background: #2d2d2d; border-top: 1px solid #333; font-family: "Source Code Pro", Monaco, Consolas, "Courier New", monospace; } .code-container.collapsed .hidden-lines-indicator { display: block; } .copy-success .code-btn i { transform: scale(1.1); } .namespace{opacity:.7}.token.doctype .token.doctype-tag{color:#569CD6}.token.doctype .token.name{color:#9cdcfe}.token.comment,.token.prolog{color:#6a9955}.token.punctuation,.language-html .language-css .token.punctuation,.language-html .language-javascript .token.punctuation{color:#d4d4d4}.token.property,.token.tag,.token.boolean,.token.number,.token.constant,.token.symbol,.token.inserted,.token.unit{color:#b5cea8}.token.selector,.token.attr-name,.token.string,.token.char,.token.builtin,.token.deleted{color:#ce9178}.language-css .token.string.url{text-decoration:underline}.token.operator,.token.entity{color:#d4d4d4}.token.operator.arrow{color:#569CD6}.token.atrule{color:#ce9178}.token.atrule .token.rule{color:#c586c0}.token.atrule .token.url{color:#9cdcfe}.token.atrule .token.url .token.function{color:#dcdcaa}.token.atrule .token.url .token.punctuation{color:#d4d4d4}.token.keyword{color:#569CD6}.token.keyword.module,.token.keyword.control-flow{color:#c586c0}.token.function,.token.function .token.maybe-class-name{color:#dcdcaa}.token.regex{color:#d16969}.token.important{color:#569cd6}.token.italic{font-style:italic}.token.constant{color:#9cdcfe}.token.class-name,.token.maybe-class-name{color:#4ec9b0}.token.console{color:#9cdcfe}.token.parameter{color:#9cdcfe}.token.interpolation{color:#9cdcfe}.token.punctuation.interpolation-punctuation{color:#569cd6}.token.boolean{color:#569cd6}.token.property,.token.variable,.token.imports .token.maybe-class-name,.token.exports .token.maybe-class-name{color:#9cdcfe}.token.selector{color:#d7ba7d}.token.escape{color:#d7ba7d}.token.tag{color:#569cd6}.token.tag .token.punctuation{color:#808080}.token.cdata{color:#808080}.token.attr-name{color:#9cdcfe}.token.attr-value,.token.attr-value .token.punctuation{color:#ce9178}.token.attr-value .token.punctuation.attr-equals{color:#d4d4d4}.token.entity{color:#569cd6}.token.namespace{color:#4ec9b0}pre[class*="language-javascript"],code[class*="language-javascript"],pre[class*="language-jsx"],code[class*="language-jsx"],pre[class*="language-typescript"],code[class*="language-typescript"],pre[class*="language-tsx"],code[class*="language-tsx"]{color:#9cdcfe}pre[class*="language-css"],code[class*="language-css"]{color:#ce9178}pre[class*="language-html"],code[class*="language-html"]{color:#d4d4d4}.language-regex .token.anchor{color:#dcdcaa}.language-html .token.punctuation{color:#808080}`;
function injectCSS(cssText){
  try{
    const style=document.createElement('style');
    style.textContent=cssText;
    document.head.appendChild(style);
    const test=document.createElement('div');
    test.className='code-container';
    test.style.position='absolute';
    test.style.left='-9999px';
    document.body.appendChild(test);
    const applied=getComputedStyle(test).backgroundColor.replace(/\s+/g,'');
    document.body.removeChild(test);
    if(applied&&!(applied==='rgba(0,0,0,0)'||applied==='transparent'))return style;
    document.head.removeChild(style);
  }catch(e){}
  try{
    const blob=new Blob([cssText],{type:'text/css'});
    const url=URL.createObjectURL(blob);
    const link=document.createElement('link');
    link.rel='stylesheet';
    link.href=url;
    document.head.appendChild(link);
    return link;
  }catch(e){}
  try{
    if('adoptedStyleSheets' in document && typeof CSSStyleSheet!=='undefined'){
      const s=new CSSStyleSheet();
      s.replaceSync(cssText);
      document.adoptedStyleSheets=document.adoptedStyleSheets.concat(s);
      return s;
    }
  }catch(e){}
  return null;
}
injectCSS(css);
(function(){
  const f=document.createElement('link');f.rel='stylesheet';f.href='https://fonts.googleapis.com/css2?family=Source+Code+Pro:wght@400;500;600&display=swap';document.head.appendChild(f);
  const i=document.createElement('link');i.rel='stylesheet';i.href='https://fonts.googleapis.com/icon?family=Material+Icons+Round';document.head.appendChild(i);
})();
class L{
  constructor(){
    this.loadedLanguages = new Set(["markup", "css", "clike", "javascript"]);
    this.loadingLanguages = new Set();
    this.loadPromises = new Map();
    this.extensionMap = { html: "markup", htm: "markup", xml: "markup", svg: "markup", mathml: "markup", ssml: "markup", atom: "markup", rss: "markup", css: "css", js: "javascript", mjs: "javascript", cjs: "javascript", abap: "abap", abnf: "abnf", as: "actionscript", actionscript: "actionscript", ada: "ada", adb: "ada", ads: "ada", agda: "agda", al: "al", g4: "antlr4", antlr4: "antlr4", apacheconf: "apacheconf", apex: "apex", apl: "apl", applescript: "applescript", scpt: "applescript", aql: "aql", ino: "arduino", arduino: "arduino", arff: "arff", "arm-asm": "armasm", armasm: "armasm", art: "arturo", arturo: "arturo", adoc: "asciidoc", asciidoc: "asciidoc", aspx: "aspnet", aspnet: "aspnet", asm6502: "asm6502", asmatmel: "asmatmel", ahk: "autohotkey", autohotkey: "autohotkey", au3: "autoit", autoit: "autoit", avs: "avisynth", avisynth: "avisynth", avdl: "avro-idl", awk: "awk", gawk: "awk", sh: "bash", bash: "bash", shell: "bash", zsh: "bash", basic: "basic", bas: "basic", bat: "batch", cmd: "batch", bbcode: "bbcode", shortcode: "bbcode", bbj: "bbj", bicep: "bicep", birb: "birb", bison: "bison", yacc: "bison", bnf: "bnf", rbnf: "bnf", bqn: "bqn", b: "brainfuck", bf: "brainfuck", brainfuck: "brainfuck", brs: "brightscript", brightscript: "brightscript", bro: "bro", bsl: "bsl", oscript: "bsl", c: "c", h: "c", cs: "csharp", csharp: "csharp", dotnet: "csharp", cpp: "cpp", cc: "cpp", cxx: "cpp", "c++": "cpp", hpp: "cpp", hxx: "cpp", cfc: "cfscript", cfscript: "cfscript", chai: "chaiscript", chaiscript: "chaiscript", cil: "cil", cilkc: "cilkc", "cilk-c": "cilkc", cilkcpp: "cilkcpp", "cilk-cpp": "cilkcpp", cilk: "cilkcpp", clj: "clojure", cljs: "clojure", cljc: "clojure", edn: "clojure", cmake: "cmake", cob: "cobol", cbl: "cobol", cobol: "cobol", coffee: "coffeescript", coffeescript: "coffeescript", conc: "concurnas", concurnas: "concurnas", csp: "csp", cook: "cooklang", cooklang: "cooklang", coq: "coq", v: "coq", cr: "crystal", crystal: "crystal", "css-extras": "css-extras", csv: "csv", cue: "cue", cypher: "cypher", d: "d", di: "d", dart: "dart", dw: "dataweave", dataweave: "dataweave", dax: "dax", dhall: "dhall", diff: "diff", patch: "diff", django: "django", jinja: "django", jinja2: "django", "dns-zone": "dns-zone-file", zone: "dns-zone-file", dockerfile: "docker", docker: "docker", dot: "dot", gv: "dot", ebnf: "ebnf", editorconfig: "editorconfig", e: "eiffel", eiffel: "eiffel", ejs: "ejs", eta: "ejs", erb: "erb", rhtml: "erb", erl: "erlang", hrl: "erlang", erlang: "erlang", xlsx: "excel-formula", xls: "excel-formula", fs: "fsharp", fsx: "fsharp", fsi: "fsharp", factor: "factor", false: "false", firestore: "firestore-security-rules", flow: "flow", f: "fortran", f90: "fortran", f95: "fortran", f03: "fortran", ftl: "ftl", gml: "gml", gamemakerlanguage: "gml", gap: "gap", gi: "gap", gd: "gap", gcode: "gcode", nc: "gcode", gdscript: "gdscript", ged: "gedcom", gedcom: "gedcom", po: "gettext", pot: "gettext", gettext: "gettext", feature: "gherkin", gherkin: "gherkin", git: "git", glsl: "glsl", vert: "glsl", frag: "glsl", gn: "gn", gni: "gn", ld: "linker-script", go: "go", mod: "go-module", sum: "go-module", gradle: "gradle", graphql: "graphql", gql: "graphql", groovy: "groovy", gvy: "groovy", haml: "haml", hbs: "handlebars", handlebars: "handlebars", mustache: "handlebars", hs: "haskell", lhs: "haskell", haskell: "haskell", hx: "haxe", haxe: "haxe", hcl: "hcl", tf: "hcl", hlsl: "hlsl", hoon: "hoon", http: "http", hpkp: "hpkp", hsts: "hsts", ichigojam: "ichigojam", icn: "icon", icon: "icon", icu: "icu-message-format", idr: "idris", lidr: "idris", idris: "idris", gitignore: "ignore", hgignore: "ignore", npmignore: "ignore", ni: "inform7", i7x: "inform7", ini: "ini", cfg: "ini", conf: "ini", properties: "ini", io: "io", ijs: "j", j: "j", java: "java", javadoc: "javadoc", javadoclike: "javadoclike", javastacktrace: "javastacktrace", jexl: "jexl", jolie: "jolie", ol: "jolie", jq: "jq", jsdoc: "jsdoc", "js-extras": "js-extras", json: "json", webmanifest: "json", json5: "json5", jsonp: "jsonp", jsstacktrace: "jsstacktrace", "js-templates": "js-templates", jl: "julia", julia: "julia", keepalived: "keepalived", kmn: "keyman", keyman: "keyman", kt: "kotlin", kts: "kotlin", kotlin: "kotlin", kum: "kumir", kumir: "kumir", kql: "kusto", kusto: "kusto", tex: "latex", latex: "latex", sty: "latex", cls: "latex", latte: "latte", less: "less", ly: "lilypond", ily: "lilypond", liquid: "liquid", lisp: "lisp", el: "lisp", emacs: "lisp", elisp: "lisp", ls: "livescript", livescript: "livescript", ll: "llvm", llvm: "llvm", log: "log", lol: "lolcode", lolcode: "lolcode", lua: "lua", magma: "magma", makefile: "makefile", mk: "makefile", mak: "makefile", md: "markdown", markdown: "markdown", "markup-templating": "markup-templating", mata: "mata", matah: "mata", m: "matlab", matlab: "matlab", ms: "maxscript", mcr: "maxscript", mel: "mel", mermaid: "mermaid", mmd: "mermaid", mf: "metafont", mp: "metafont", miz: "mizar", mizar: "mizar", mongodb: "mongodb", monkey: "monkey", monkey2: "monkey", moon: "moonscript", moonscript: "moonscript", n1ql: "n1ql", n4js: "n4js", n4jsd: "n4js", hdl: "nand2tetris-hdl", nani: "naniscript", naniscript: "naniscript", nasm: "nasm", asm: "nasm", neon: "neon", nevod: "nevod", nginx: "nginx", nginxconf: "nginx", nim: "nim", nims: "nim", nimble: "nim", nix: "nix", nsi: "nsis", nsh: "nsis", objc: "objectivec", "objective-c": "objectivec", m: "objectivec", ml: "ocaml", mli: "ocaml", ocaml: "ocaml", odin: "odin", cl: "opencl", opencl: "opencl", qasm: "openqasm", openqasm: "openqasm", oz: "oz", gp: "parigp", pari: "parigp", parser: "parser", pas: "pascal", p: "pascal", pp: "pascal", ligo: "pascaligo", pascaligo: "pascaligo", psl: "psl", px: "pcaxis", pcaxis: "pcaxis", pcode: "peoplecode", peoplecode: "peoplecode", pl: "perl", pm: "perl", perl: "perl", php: "php", php3: "php", php4: "php", php5: "php", phpdoc: "phpdoc", "php-extras": "php-extras", plantuml: "plant-uml", puml: "plant-uml", "plant-uml": "plant-uml", sql: "plsql", pls: "plsql", plb: "plsql", pq: "powerquery", powerquery: "powerquery", mscript: "powerquery", ps1: "powershell", ps1xml: "powershell", psc1: "powershell", pde: "processing", processing: "processing", pro: "prolog", prolog: "prolog", pl: "prolog", promql: "promql", properties: "properties", proto: "protobuf", protobuf: "protobuf", pug: "pug", jade: "pug", pp: "puppet", puppet: "puppet", pure: "pure", pb: "purebasic", pbi: "purebasic", purs: "purescript", purescript: "purescript", py: "python", pyw: "python", python: "python", qs: "qsharp", qsharp: "qsharp", q: "q", qml: "qml", qore: "qore", q: "qore", r: "r", R: "r", rkt: "racket", rktd: "racket", cshtml: "cshtml", razor: "cshtml", jsx: "jsx", tsx: "tsx", re: "reason", rei: "reason", regex: "regex", regexp: "regex", rego: "rego", rpy: "renpy", rpym: "renpy", res: "rescript", resi: "rescript", rst: "rest", rest: "rest", rip: "rip", graph: "roboconf", instances: "roboconf", robot: "robotframework", resource: "robotframework", rb: "ruby", rbw: "ruby", ruby: "ruby", rs: "rust", rust: "rust", sas: "sas", sass: "sass", scss: "scss", scala: "scala", sc: "scala", scm: "scheme", ss: "scheme", scheme: "scheme", "sh-session": "shell-session", "shell-session": "shell-session", smali: "smali", st: "smalltalk", smalltalk: "smalltalk", tpl: "smarty", smarty: "smarty", sml: "sml", fun: "sml", sig: "sml", sol: "solidity", solidity: "solidity", sln: "solution-file", soy: "soy", sparql: "sparql", rq: "sparql", spl: "splunk-spl", sqf: "sqf", sql: "sql", nut: "squirrel", squirrel: "squirrel", stan: "stan", do: "stata", ado: "stata", st: "iecst", iecst: "iecst", styl: "stylus", stylus: "stylus", sc: "supercollider", scd: "supercollider", swift: "swift", service: "systemd", socket: "systemd", device: "systemd", t4: "t4-templating", tt: "t4-cs", "vb-t4": "t4-vb", tap: "tap", tcl: "tcl", tk: "tcl", tt: "tt2", tt2: "tt2", textile: "textile", toml: "toml", troy: "tremor", trickle: "tremor", ttl: "turtle", trig: "turtle", twig: "twig", ts: "typescript", typescript: "typescript", tsconfig: "typoscript", ts: "typoscript", uc: "unrealscript", uci: "unrealscript", uorazor: "uorazor", uri: "uri", url: "uri", v: "v", vala: "vala", vapi: "vala", vb: "vbnet", vbnet: "vbnet", vm: "velocity", velocity: "velocity", verilog: "verilog", vh: "verilog", vhd: "vhdl", vhdl: "vhdl", vim: "vim", vimrc: "vim", "visual-basic": "visual-basic", bas: "visual-basic", warpscript: "warpscript", wast: "wasm", wat: "wasm", "web-idl": "web-idl", wgsl: "wgsl", wiki: "wiki", wl: "wolfram", nb: "wolfram", m: "wolfram", wren: "wren", xeoracube: "xeora", "xml-doc": "xml-doc", xojo: "xojo", xq: "xquery", xquery: "xquery", yml: "yaml", yaml: "yaml", yang: "yang", zig: "zig", txt: "none", vba: "vba" };
    this.dependencies = { jsx: ["javascript"], tsx: ["typescript", "jsx"], typescript: ["javascript"], scss: ["css"], sass: ["css"], less: ["css"], stylus: ["css"], php: ["markup"], erb: ["ruby", "markup"], aspnet: ["csharp", "markup"], handlebars: ["markup"], django: ["markup"], twig: ["markup"], liquid: ["markup"], pug: ["markup"], haml: ["markup"], cshtml: ["csharp", "markup"], "plant-uml": ["markup"], "t4-cs": ["csharp", "t4-templating"], "t4-vb": ["visual-basic", "t4-templating"], "markup-templating": ["markup"] };
    this.primaryExtensionMap = {};
    for (const [ext, lang] of Object.entries(this.extensionMap)) {
      if (!this.primaryExtensionMap[lang]) {
        this.primaryExtensionMap[lang] = ext;
      }
    }
  }
  detectLanguageFromExtension(ext){
    return this.extensionMap[(ext||'').toLowerCase()] || 'none';
  }
  getLanguageDisplayName(langAttr){
    const lang = this.detectLanguageFromExtension(langAttr);
    return this.primaryExtensionMap[lang] || (langAttr||'txt').toLowerCase();
  }
  async loadLanguage(lang){
    if(!lang||lang==='none')return;
    if(this.loadedLanguages.has(lang))return;
    if(this.loadPromises.has(lang))return this.loadPromises.get(lang);
    const p=this._loadLanguage(lang);
    this.loadPromises.set(lang,p);
    return p;
  }
  async _loadLanguage(lang){
    if(this.loadedLanguages.has(lang)||this.loadingLanguages.has(lang))return;
    this.loadingLanguages.add(lang);
    const s=document.createElement('script');
    s.src=`https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-${lang}.min.js`;
    return new Promise((res,rej)=>{
      s.onload=()=>{this.loadedLanguages.add(lang);this.loadingLanguages.delete(lang);res()};
      s.onerror=()=>{this.loadingLanguages.delete(lang);rej(new Error('load failed'))};
      document.head.appendChild(s);
    });
  }
  isLanguageLoaded(lang){return this.loadedLanguages.has(lang)}
  detect(x){return this.detectLanguageFromExtension(x)}
  displayName(a){return this.getLanguageDisplayName(a)}
  load(lang){return this.loadLanguage(lang)}
  isLoaded(lang){return this.isLanguageLoaded(lang)}
}
const loader=new L();
function esc(x){const d=document.createElement('div');d.textContent=x;return d.innerHTML}
function debounce(fn,t=120){let h;return(...a)=>{clearTimeout(h);h=setTimeout(()=>fn(...a),t)}}
async function highlight(codeEl){
  const langAttr=codeEl.getAttribute('lang')||'txt';
  const lang=loader.detect(langAttr);
  const display=loader.displayName(langAttr);
  const raw=((codeEl.textContent||'').replace(/\r\n/g,'\n')).trim();
  codeEl.textContent=raw;
  const lines=raw?raw.split('\n').length:0;
  if(lang!=='none'){
    try{
      await loader.load(lang);
      if(window.Prism&&loader.isLoaded(lang)){codeEl.classList.add('code-content',`language-${lang}`);Prism.highlightElement(codeEl)}
      else codeEl.innerHTML=esc(raw);
    }catch(e){codeEl.innerHTML=esc(raw)}
  }else codeEl.innerHTML=esc(raw);
  return{display,lines};
}
function makeWrapper(codeEl,display,lines){
  const container=document.createElement('div');container.className='code-container';
  const header=document.createElement('div');header.className='code-header';
  const badge=document.createElement('span');badge.className='language-badge';badge.textContent=display||'txt';header.appendChild(badge);
  const toolbar=document.createElement('div');toolbar.className='code-toolbar';
  const collapse=document.createElement('button');collapse.className='code-btn collapse-btn';collapse.type='button';collapse.title='Collapse code block';collapse.innerHTML='<i class=\"material-icons-round\">unfold_less</i>';
  const wrap=document.createElement('button');wrap.className='code-btn wrap-btn';wrap.type='button';wrap.title='Toggle line wrap';wrap.innerHTML='<i class=\"material-icons-round\">wrap_text</i>';
  const copy=document.createElement('button');copy.className='code-btn copy-btn';copy.type='button';copy.title='Copy code';copy.innerHTML='<i class=\"material-icons-round\">content_copy</i>';
  toolbar.appendChild(collapse);toolbar.appendChild(wrap);toolbar.appendChild(copy);
  header.appendChild(toolbar);
  container.appendChild(header);
  const pre=document.createElement('pre');pre.className='code-pre';pre.appendChild(codeEl);
  container.appendChild(pre);
  const hidden=document.createElement('div');hidden.className='hidden-lines-indicator';hidden.innerHTML=`<span>${lines} lines hidden</span>`;container.appendChild(hidden);
  let c=false,w=false;
  collapse.addEventListener('click',function(){c=!c;container.classList.toggle('collapsed',c);collapse.innerHTML=c?'<i class=\"material-icons-round\">unfold_more</i>':'<i class=\"material-icons-round\">unfold_less</i>';collapse.title=c?'Expand code block':'Collapse code block'});
  wrap.addEventListener('click',function(){w=!w;pre.classList.toggle('line-wrap',w);wrap.innerHTML=w?'<i class=\"material-icons-round\">code</i>':'<i class=\"material-icons-round\">wrap_text</i>';wrap.title=w?'Unwrap lines':'Wrap lines'});
  copy.addEventListener('click',function(){const t=(codeEl.textContent||'');navigator.clipboard.writeText(t).then(()=>{const ic=copy.querySelector('i');const o=ic.innerHTML;ic.innerHTML='check';container.classList.add('copy-success');setTimeout(()=>{ic.innerHTML=o;container.classList.remove('copy-success')},1500)}).catch(()=>{})});
  return container;
}
const per=new WeakMap();
function observeCode(codeEl,rehighlight){
  if(per.has(codeEl))return;
  const d=debounce(()=>rehighlight(codeEl),120);
  const o=new MutationObserver((ms)=>{for(const m of ms)if(m.type==='characterData'||m.type==='childList'||(m.type==='attributes'&&m.attributeName==='lang')){d();break}});
  o.observe(codeEl,{characterData:true,subtree:true,childList:true,attributes:true});
  per.set(codeEl,o);
}
async function process(codeEl){
  if(!codeEl||codeEl.dataset.codeProcessed==='1')return;
  codeEl.dataset.codeProcessed='1';
  try{
    const {display,lines}=await highlight(codeEl);
    const wrapper=makeWrapper(codeEl,display,lines);
    const anc=codeEl.closest('pre')||codeEl;
    if(anc.parentNode)anc.parentNode.replaceChild(wrapper,anc);else document.body.appendChild(wrapper);
    const updateHidden=()=>{const txt=((codeEl.textContent||'').trim());const lc=txt?txt.split('\n').length:0;const span=wrapper.querySelector('.hidden-lines-indicator span');if(span)span.textContent=`${lc} lines hidden`};
    const rehighlight=async(el)=>{try{await highlight(el);updateHidden()}catch(e){}};
    observeCode(codeEl,rehighlight);
  }catch(e){
    try{const fallback=document.createElement('div');fallback.className='code-container';fallback.innerHTML=`<div class=\"code-header\"><span class=\"language-badge\">txt</span><div class=\"code-toolbar\"><button class=\"code-btn copy-btn\" type=\"button\" title=\"Copy code\"><i class=\"material-icons-round\">content_copy</i></button></div></div><pre class=\"code-pre\">${esc((codeEl.textContent||''))}</pre><div class=\"hidden-lines-indicator\"><span>${(codeEl.textContent||'').trim().split('\n').length} lines hidden</span></div>`;if(codeEl.parentNode)codeEl.parentNode.replaceChild(fallback,codeEl)}catch(e2){}}} const globalObs=new MutationObserver((ms)=>{ for(const m of ms){ if(m.type==='childList'){ for(const n of m.addedNodes){ if(!n||n.nodeType!==1)continue; if(n.tagName&&n.tagName.toLowerCase()==='code')process(n);else{const cs=n.querySelectorAll&&n.querySelectorAll('code');if(cs&&cs.length)cs.forEach(c=>process(c))} } }else if(m.type==='attributes'){ const t=m.target; if((t.tagName==='INPUT'||t.tagName==='TEXTAREA')&&t.dataset&&t.dataset.codeTarget)updateFromInput(t); } } }); globalObs.observe(document.documentElement||document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['value']}); function wireInput(inp){if(!inp||inp.__wired)return;inp.__wired=true;const u=()=>updateFromInput(inp);inp.addEventListener('input',u);const o=new MutationObserver(()=>u());o.observe(inp,{attributes:true,attributeFilter:['value']})} function updateFromInput(inp){const sel=inp.dataset.codeTarget;if(!sel)return;try{const t=document.querySelector(sel);if(!t)return; if(t.tagName&&t.tagName.toLowerCase()==='code'){t.textContent=inp.value}else{const c=t.querySelector&&t.querySelector('code');if(c)c.textContent=inp.value;else t.innerHTML=<code>${esc(inp.value)}</code>}}catch(e){}} async function init(){ if(!window.Prism)await new Promise((r,j)=>{const s=document.createElement('script');s.src='https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/prism.min.js';s.onload=r;s.onerror=j;document.head.appendChild(s)}); const codes=Array.from(document.querySelectorAll('code')); for(const c of codes)if(!(c.closest&&c.closest('.code-container')))await process(c); const inputs=Array.from(document.querySelectorAll('input[data-code-target],textarea[data-code-target]'));inputs.forEach(wireInput); setTimeout(()=>{const links=document.querySelectorAll('link[href*="fonts.googleapis"]');if(links.length)links.forEach(l=>{l.crossOrigin='anonymous'})},500); } if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else setTimeout(init,0); })(); </script>
