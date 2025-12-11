function renderDropdownMenuPortal(trigger, options, callback) {
  document
    .querySelectorAll(".custom-dropdown-portal-menu")
    .forEach((e) => e.remove());
  const menu = document.createElement("div");
  menu.className = "custom-dropdown-portal-menu active";
  menu.setAttribute("role", "listbox");
  options.forEach((o) => {
    const opt = document.createElement("div");
    opt.className = "custom-dropdown-option";
    opt.tabIndex = 0;
    opt.dataset.value = typeof o === "object" ? o.value : o;
    opt.textContent = typeof o === "object" ? o.label : o;
    opt.setAttribute("role", "option");
    opt.addEventListener("click", () => {
      callback(o);
      menu.remove();
    });
    opt.addEventListener("keydown", (ev) => {
      if (ev.key === "Enter") {
        ev.preventDefault();
        opt.click();
      }
    });
    menu.appendChild(opt);
  });
  document.body.appendChild(menu);
  const rect = trigger.getBoundingClientRect();
  menu.style.width = rect.width + "px";
  let left = rect.left + window.scrollX;
  const rightEdge = left + rect.width;
  const viewportWidth = window.innerWidth;
  if (rightEdge > viewportWidth) {
    left -= rightEdge - viewportWidth;
  }
  if (left < 0) left = 0;
  menu.style.left = left + "px";
  menu.style.top = rect.bottom + window.scrollY + "px";
  function closeOnOutside(ev) {
    if (!menu.contains(ev.target) && ev.target !== trigger) {
      menu.remove();
      document.removeEventListener("mousedown", closeOnOutside);
    }
  }
  document.addEventListener("mousedown", closeOnOutside);
  window.addEventListener(
    "scroll",
    () => {
      if (document.body.contains(menu)) {
        const rect = trigger.getBoundingClientRect();
        let leftNew = rect.left + window.scrollX;
        const rightNewEdge = leftNew + rect.width;
        if (rightNewEdge > window.innerWidth) {
          leftNew -= rightNewEdge - window.innerWidth;
        }
        if (leftNew < 0) leftNew = 0;
        menu.style.left = leftNew + "px";
        menu.style.top = rect.bottom + window.scrollY + "px";
        menu.style.width = rect.width + "px";
      }
    },
    { passive: true }
  );
  return menu;
}
let modalBackdrop = null;
let modalResolver = null;
let modalScope = {};
function ensureModal() {
  if (modalBackdrop) return;
  modalBackdrop = document.createElement("div");
  modalBackdrop.className = "modal-backdrop";
  modalBackdrop.setAttribute("aria-hidden", "true");
  document.body.appendChild(modalBackdrop);
  modalBackdrop.addEventListener("click", (e) => {
    if (e.target === modalBackdrop) closeModal();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modalBackdrop.classList.contains("active")) {
      closeModal();
    }
  });
}
function closeModal(result = null) {
  if (modalBackdrop) {
    modalBackdrop.classList.remove("active");
    document.documentElement.style.overflow = "";
  }
  modalScope = {};
  if (modalResolver) {
    modalResolver(result);
    modalResolver = null;
  }
  setTimeout(() => {
    if (modalBackdrop) {
      modalBackdrop.innerHTML = "";
    }
  }, 300);
}
function applyModalStyles(element) {
  if (element.tagName === "INPUT") {
    element.classList.add("modal-input");
  } else if (element.tagName === "TEXTAREA") {
    element.classList.add("modal-textarea");
  } else if (element.tagName === "SELECT") {
    element.classList.add("modal-select");
  } else if (element.tagName === "BUTTON") {
    element.classList.add("modal-btn");
  }
  element
    .querySelectorAll("input, textarea, select, button")
    .forEach((child) => {
      applyModalStyles(child);
    });
}
function createModalScope(container) {
  const scope = {};
  container.querySelectorAll("[id]").forEach((element) => {
    if (element.id) {
      scope[element.id] = element;
    }
  });
  return scope;
}
function validateModalFields(container) {
  let isValid = true;
  const fields = container.querySelectorAll(
    "input, textarea, .custom-dropdown-trigger"
  );
  fields.forEach((field) => {
    field.style.borderColor = "";
    if (field.hasAttribute("data-skip-validation")) {
      return;
    }
    let isEmpty = false;
    if (
      field.tagName === "INPUT" &&
      (field.type === "text" || field.type === "email" || field.type === "url")
    ) {
      isEmpty = field.value.trim() === "";
    } else if (field.classList.contains("custom-dropdown-trigger")) {
      isEmpty = (field.dataset.value || "").trim() === "";
    } else if (field.tagName === "TEXTAREA") {
      isEmpty = field.value.trim() === "";
    }
    if (isEmpty) {
      field.style.borderColor = "var(--danger)";
      isValid = false;
      const clearValidation = () => {
        field.style.borderColor = "";
        field.removeEventListener("input", clearValidation);
        field.removeEventListener("change", clearValidation);
      };
      field.addEventListener("input", clearValidation);
      field.addEventListener("change", clearValidation);
    }
  });
  return isValid;
}
function collectFormValues(container) {
  const values = {};
  container.querySelectorAll("[id]").forEach((element) => {
    if (element.id) {
      if (element.tagName === "INPUT") {
        if (element.type === "checkbox" || element.type === "radio") {
          values[element.id] = element.checked;
        } else {
          values[element.id] = element.value;
        }
      } else if (
        element.tagName === "TEXTAREA" ||
        element.tagName === "SELECT"
      ) {
        values[element.id] = element.value;
      } else if (element.classList.contains("custom-dropdown-trigger")) {
        values[element.id] = element.dataset.value || element.textContent;
      }
    }
  });
  return values;
}
window.showModal = function (options = {}) {
  ensureModal();
  return new Promise((resolve) => {
    modalResolver = resolve;
    modalScope = {};
    modalBackdrop.innerHTML = "";
    const modalWindow = document.createElement("div");
    modalWindow.className = "modal-window";
    modalWindow.setAttribute("role", "dialog");
    modalWindow.setAttribute("aria-modal", "true");
    const headerDiv = document.createElement("div");
    headerDiv.className = "modal-header";
    if (options.header) {
      if (typeof options.header === "string") {
        headerDiv.innerHTML = options.header;
      } else if (options.header instanceof HTMLElement) {
        headerDiv.appendChild(options.header);
      }
    } else {
      const titleEl = document.createElement("h3");
      titleEl.className = "modal-title";
      titleEl.textContent = options.title || "";
      titleEl.id = "modal-title-" + Math.random().toString(36).slice(2);
      const closeBtn = document.createElement("button");
      closeBtn.className = "modal-close";
      closeBtn.setAttribute("aria-label", "Close dialog");
      closeBtn.innerHTML = "&#x2715;";
      closeBtn.addEventListener("click", closeModal);
      headerDiv.appendChild(titleEl);
      headerDiv.appendChild(closeBtn);
      modalWindow.setAttribute("aria-labelledby", titleEl.id);
    }
    const bodyDiv = document.createElement("div");
    bodyDiv.className = "modal-body";
    if (options.body) {
      if (typeof options.body === "string") {
        bodyDiv.innerHTML = options.body;
      } else if (options.body instanceof HTMLElement) {
        bodyDiv.appendChild(options.body);
      } else if (Array.isArray(options.body)) {
        bodyDiv.innerHTML = options.body.join("");
      }
    }
    const footerDiv = document.createElement("div");
    footerDiv.className = "modal-footer";
    if (options.footer) {
      if (typeof options.footer === "string") {
        footerDiv.innerHTML = options.footer;
      } else if (options.footer instanceof HTMLElement) {
        footerDiv.appendChild(options.footer);
      } else if (Array.isArray(options.footer)) {
        footerDiv.innerHTML = options.footer.join("");
      }
    } else {
      footerDiv.innerHTML = '<button class="modal-btn">OK</button>';
    }
    applyModalStyles(headerDiv);
    applyModalStyles(bodyDiv);
    applyModalStyles(footerDiv);
    modalScope = createModalScope(bodyDiv);
    footerDiv.querySelectorAll("button").forEach((button) => {
      const onclickAttr = button.getAttribute("onclick");
      if (onclickAttr) {
        button.removeAttribute("onclick");
        button.addEventListener("click", () => {
          if (onclickAttr !== "closeModal()") {
            if (!validateModalFields(bodyDiv)) {
              showNotification("Please fill in all required fields.");
              return;
            }
          }
          try {
            with (modalScope) {
              eval(`(function() { ${onclickAttr} })()`);
            }
          } catch (error) {
            console.error("Error executing button action:", error);
          }
        });
      } else {
        button.addEventListener("click", () => {
          if (validateModalFields(bodyDiv)) {
            const values = collectFormValues(bodyDiv);
            closeModal({
              action: button.textContent || button.id || "unknown",
              values
            });
          } else {
            showNotification("Please fill in all required fields.");
          }
        });
      }
    });
    bodyDiv.querySelectorAll("[onclick]").forEach((element) => {
      const onclickAttr = element.getAttribute("onclick");
      if (onclickAttr) {
        element.addEventListener("click", () => {
          try {
            with (modalScope) {
              eval(`(function() { ${onclickAttr} })()`);
            }
          } catch (error) {
            console.error("Error executing element action:", error);
          }
        });
        element.removeAttribute("onclick");
      }
    });
    bodyDiv.querySelectorAll(".custom-dropdown-trigger").forEach((trigger) => {
      const options = JSON.parse(trigger.dataset.options || "[]");
      trigger.addEventListener("click", () => {
        renderDropdownMenuPortal(trigger, options, (selected) => {
          trigger.textContent = selected.label;
          trigger.dataset.value = selected.value;
          trigger.dispatchEvent(new Event("change", { bubbles: true }));
        });
      });
    });
    modalWindow.appendChild(headerDiv);
    modalWindow.appendChild(bodyDiv);
    modalWindow.appendChild(footerDiv);
    modalBackdrop.appendChild(modalWindow);
    document.documentElement.style.overflow = "hidden";
    modalBackdrop.classList.add("active");
    setTimeout(() => {
      const firstInput = bodyDiv.querySelector(
        "input, textarea, select, button"
      );
      if (firstInput) firstInput.focus();
    }, 100);
  });
};
window.modalSubmit = function () {
  const bodyEl = modalBackdrop.querySelector(".modal-body");
  if (validateModalFields(bodyEl)) {
    const values = collectFormValues(bodyEl);
    closeModal({ action: "submit", values });
  } else {
    showNotification("Please fill in all required fields.");
  }
};
window.closeModal = closeModal;
window.createModalElement = function (type, opts = {}) {
  const out = { el: null, input: null };
  type = type.toLowerCase();
  const wrapper = document.createElement("div");
  wrapper.className = "modal-element";
  if (opts.label) {
    const lbl = document.createElement("label");
    lbl.className = "modal-label";
    lbl.textContent = opts.label;
    wrapper.appendChild(lbl);
  }
  if (type === "message") {
    const p = document.createElement("div");
    p.className = "modal-message";
    p.textContent = opts.text || "";
    out.el = wrapper;
    wrapper.appendChild(p);
    return out;
  }
  if (type === "input") {
    const input = document.createElement("input");
    input.className = "modal-input";
    input.type = opts.inputType || "text";
    if (opts.placeholder) input.placeholder = opts.placeholder;
    if (opts.value) input.value = opts.value;
    if (opts.key) input.dataset.modalKey = opts.key;
    if (opts.visibleIf) wrapper.dataset.visibleIf = opts.visibleIf;
    wrapper.appendChild(input);
    out.el = wrapper;
    out.input = input;
    return out;
  }
  if (type === "textarea") {
    const ta = document.createElement("textarea");
    ta.className = "modal-textarea";
    ta.rows = opts.rows || 3;
    if (opts.placeholder) ta.placeholder = opts.placeholder;
    if (opts.key) ta.dataset.modalKey = opts.key;
    if (opts.visibleIf) wrapper.dataset.visibleIf = opts.visibleIf;
    wrapper.appendChild(ta);
    out.el = wrapper;
    out.input = ta;
    return out;
  }
  if (type === "checkbox" || type === "radio") {
    const input = document.createElement("input");
    input.className = "modal-input";
    input.type = type;
    if (opts.key) input.dataset.modalKey = opts.key;
    if (opts.visibleIf) wrapper.dataset.visibleIf = opts.visibleIf;
    wrapper.appendChild(input);
    out.el = wrapper;
    out.input = input;
    return out;
  }
  if (type === "select") {
    const wrapper2 = document.createElement("div");
    wrapper2.className = "custom-dropdown";
    const trigger = document.createElement("div");
    trigger.className = "custom-dropdown-trigger modal-input";
    trigger.tabIndex = 0;
    const options = opts.options || [{ label: "Select option", value: "" }];
    trigger.textContent = options[0].label;
    trigger.dataset.value = options[0].value;
    trigger.dataset.options = JSON.stringify(options);
    trigger.addEventListener("click", () => {
      renderDropdownMenuPortal(trigger, options, (selected) => {
        trigger.textContent = selected.label;
        trigger.dataset.value = selected.value;
        trigger.dispatchEvent(new Event("change"));
      });
    });
    if (opts.key) trigger.dataset.modalKey = opts.key;
    wrapper2.appendChild(trigger);
    if (opts.visibleIf) wrapper2.dataset.visibleIf = opts.visibleIf;
    wrapper.appendChild(wrapper2);
    out.el = wrapper;
    out.input = trigger;
    return out;
  }
  if (type === "button") {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "modal-inline-button modal-btn";
    btn.textContent = opts.value || opts.label || "Button";
    if (opts.ariaLabel) btn.setAttribute("aria-label", opts.ariaLabel);
    const lowerLabel = (opts.value || opts.label || "").toLowerCase();
    if (lowerLabel.includes("cancel") || lowerLabel.includes("close")) {
      btn.style.background = "#373737";
      btn.style.color = "#eeeeee";
    } else {
      btn.style.background = "var(--accent2)";
      btn.style.color = "#052027";
    }
    if (typeof opts.onClick === "function") {
      btn.addEventListener("click", opts.onClick);
    }
    if (opts.visibleIf) wrapper.dataset.visibleIf = opts.visibleIf;
    wrapper.appendChild(btn);
    out.el = wrapper;
    out.input = btn;
    return out;
  }
  if (type === "row") {
    const container = document.createElement("div");
    container.className = "modal-row";
    if (opts.position) {
      container.setAttribute("data-position", opts.position);
    }
    (opts.children || []).forEach((child) => {
      if (child instanceof Node) {
        container.appendChild(child);
      } else if (child.el) {
        container.appendChild(child.el);
      }
    });
    out.el = container;
    return out;
  }
  out.el = wrapper;
  return out;
};
ensureModal();
class CompletePrismLanguageLoader {
  constructor() {
    this.loadedLanguages = new Set(["markup", "css", "clike", "javascript"]);
    this.loadingLanguages = new Set();
    this.loadPromises = new Map();
    this.extensionMap = { html: "markup", htm: "markup", xml: "markup", svg: "markup", mathml: "markup", ssml: "markup", atom: "markup", rss: "markup", css: "css", js: "javascript", mjs: "javascript", cjs: "javascript", abap: "abap", abnf: "abnf", as: "actionscript", actionscript: "actionscript", ada: "ada", adb: "ada", ads: "ada", agda: "agda", al: "al", g4: "antlr4", antlr4: "antlr4", apacheconf: "apacheconf", apex: "apex", apl: "apl", applescript: "applescript", scpt: "applescript", aql: "aql", ino: "arduino", arduino: "arduino", arff: "arff", "arm-asm": "armasm", armasm: "armasm", art: "arturo", arturo: "arturo", adoc: "asciidoc", asciidoc: "asciidoc", aspx: "aspnet", aspnet: "aspnet", asm6502: "asm6502", asmatmel: "asmatmel", ahk: "autohotkey", autohotkey: "autohotkey", au3: "autoit", autoit: "autoit", avs: "avisynth", avisynth: "avisynth", avdl: "avro-idl", awk: "awk", gawk: "awk", sh: "bash", bash: "bash", shell: "bash", zsh: "bash", basic: "basic", bas: "basic", bat: "batch", cmd: "batch", bbcode: "bbcode", shortcode: "bbcode", bbj: "bbj", bicep: "bicep", birb: "birb", bison: "bison", yacc: "bison", bnf: "bnf", rbnf: "bnf", bqn: "bqn", b: "brainfuck", bf: "brainfuck", brainfuck: "brainfuck", brs: "brightscript", brightscript: "brightscript", bro: "bro", bsl: "bsl", oscript: "bsl", c: "c", h: "c", cs: "csharp", csharp: "csharp", dotnet: "csharp", cpp: "cpp", cc: "cpp", cxx: "cpp", "c++": "cpp", hpp: "cpp", hxx: "cpp", cfc: "cfscript", cfscript: "cfscript", chai: "chaiscript", chaiscript: "chaiscript", cil: "cil", cilkc: "cilkc", "cilk-c": "cilkc", cilkcpp: "cilkcpp", "cilk-cpp": "cilkcpp", cilk: "cilkcpp", clj: "clojure", cljs: "clojure", cljc: "clojure", edn: "clojure", cmake: "cmake", cob: "cobol", cbl: "cobol", cobol: "cobol", coffee: "coffeescript", coffeescript: "coffeescript", conc: "concurnas", concurnas: "concurnas", csp: "csp", cook: "cooklang", cooklang: "cooklang", coq: "coq", v: "coq", cr: "crystal", crystal: "crystal", "css-extras": "css-extras", csv: "csv", cue: "cue", cypher: "cypher", d: "d", di: "d", dart: "dart", dw: "dataweave", dataweave: "dataweave", dax: "dax", dhall: "dhall", diff: "diff", patch: "diff", django: "django", jinja: "django", jinja2: "django", "dns-zone": "dns-zone-file", zone: "dns-zone-file", dockerfile: "docker", docker: "docker", dot: "dot", gv: "dot", ebnf: "ebnf", editorconfig: "editorconfig", e: "eiffel", eiffel: "eiffel", ejs: "ejs", eta: "ejs", erb: "erb", rhtml: "erb", erl: "erlang", hrl: "erlang", erlang: "erlang", xlsx: "excel-formula", xls: "excel-formula", fs: "fsharp", fsx: "fsharp", fsi: "fsharp", factor: "factor", false: "false", firestore: "firestore-security-rules", flow: "flow", f: "fortran", f90: "fortran", f95: "fortran", f03: "fortran", ftl: "ftl", gml: "gml", gamemakerlanguage: "gml", gap: "gap", gi: "gap", gd: "gap", gcode: "gcode", nc: "gcode", gd: "gdscript", gdscript: "gdscript", ged: "gedcom", gedcom: "gedcom", po: "gettext", pot: "gettext", gettext: "gettext", feature: "gherkin", gherkin: "gherkin", git: "git", glsl: "glsl", vert: "glsl", frag: "glsl", gn: "gn", gni: "gn", ld: "linker-script", go: "go", mod: "go-module", sum: "go-module", gradle: "gradle", graphql: "graphql", gql: "graphql", groovy: "groovy", gvy: "groovy", haml: "haml", hbs: "handlebars", handlebars: "handlebars", mustache: "handlebars", hs: "haskell", lhs: "haskell", haskell: "haskell", hx: "haxe", haxe: "haxe", hcl: "hcl", tf: "hcl", hlsl: "hlsl", hoon: "hoon", http: "http", hpkp: "hpkp", hsts: "hsts", ichigojam: "ichigojam", icn: "icon", icon: "icon", icu: "icu-message-format", idr: "idris", lidr: "idris", idris: "idris", gitignore: "ignore", hgignore: "ignore", npmignore: "ignore", ni: "inform7", i7x: "inform7", ini: "ini", cfg: "ini", conf: "ini", properties: "ini", io: "io", ijs: "j", j: "j", java: "java", javadoc: "javadoc", javadoclike: "javadoclike", javastacktrace: "javastacktrace", jexl: "jexl", jolie: "jolie", ol: "jolie", jq: "jq", jsdoc: "jsdoc", "js-extras": "js-extras", json: "json", webmanifest: "json", json5: "json5", jsonp: "jsonp", jsstacktrace: "jsstacktrace", "js-templates": "js-templates", jl: "julia", julia: "julia", keepalived: "keepalived", kmn: "keyman", keyman: "keyman", kt: "kotlin", kts: "kotlin", kotlin: "kotlin", kum: "kumir", kumir: "kumir", kql: "kusto", kusto: "kusto", tex: "latex", latex: "latex", sty: "latex", cls: "latex", latte: "latte", less: "less", ly: "lilypond", ily: "lilypond", liquid: "liquid", lisp: "lisp", el: "lisp", emacs: "lisp", elisp: "lisp", ls: "livescript", livescript: "livescript", ll: "llvm", llvm: "llvm", log: "log", lol: "lolcode", lolcode: "lolcode", lua: "lua", magma: "magma", makefile: "makefile", mk: "makefile", mak: "makefile", md: "markdown", markdown: "markdown", "markup-templating": "markup-templating", mata: "mata", matah: "mata", m: "matlab", matlab: "matlab", ms: "maxscript", mcr: "maxscript", mel: "mel", mermaid: "mermaid", mmd: "mermaid", mf: "metafont", mp: "metafont", miz: "mizar", mizar: "mizar", mongodb: "mongodb", monkey: "monkey", monkey2: "monkey", moon: "moonscript", moonscript: "moonscript", n1ql: "n1ql", n4js: "n4js", n4jsd: "n4js", hdl: "nand2tetris-hdl", nani: "naniscript", naniscript: "naniscript", nasm: "nasm", asm: "nasm", neon: "neon", nevod: "nevod", nginx: "nginx", nginxconf: "nginx", nim: "nim", nims: "nim", nimble: "nim", nix: "nix", nsi: "nsis", nsh: "nsis", objc: "objectivec", "objective-c": "objectivec", m: "objectivec", ml: "ocaml", mli: "ocaml", ocaml: "ocaml", odin: "odin", cl: "opencl", opencl: "opencl", qasm: "openqasm", openqasm: "openqasm", oz: "oz", gp: "parigp", pari: "parigp", parser: "parser", pas: "pascal", p: "pascal", pp: "pascal", ligo: "pascaligo", pascaligo: "pascaligo", psl: "psl", px: "pcaxis", pcaxis: "pcaxis", pcode: "peoplecode", peoplecode: "peoplecode", pl: "perl", pm: "perl", perl: "perl", php: "php", php3: "php", php4: "php", php5: "php", phpdoc: "phpdoc", "php-extras": "php-extras", plantuml: "plant-uml", puml: "plant-uml", "plant-uml": "plant-uml", sql: "plsql", pls: "plsql", plb: "plsql", pq: "powerquery", powerquery: "powerquery", mscript: "powerquery", ps1: "powershell", ps1xml: "powershell", psc1: "powershell", pde: "processing", processing: "processing", pro: "prolog", prolog: "prolog", pl: "prolog", promql: "promql", properties: "properties", proto: "protobuf", protobuf: "protobuf", pug: "pug", jade: "pug", pp: "puppet", puppet: "puppet", pure: "pure", pb: "purebasic", pbi: "purebasic", purs: "purescript", purescript: "purescript", py: "python", pyw: "python", python: "python", qs: "qsharp", qsharp: "qsharp", q: "q", qml: "qml", qore: "qore", q: "qore", r: "r", R: "r", rkt: "racket", rktd: "racket", cshtml: "cshtml", razor: "cshtml", jsx: "jsx", tsx: "tsx", re: "reason", rei: "reason", regex: "regex", regexp: "regex", rego: "rego", rpy: "renpy", rpym: "renpy", res: "rescript", resi: "rescript", rst: "rest", rest: "rest", rip: "rip", graph: "roboconf", instances: "roboconf", robot: "robotframework", resource: "robotframework", rb: "ruby", rbw: "ruby", ruby: "ruby", rs: "rust", rust: "rust", sas: "sas", sass: "sass", scss: "scss", scala: "scala", sc: "scala", scm: "scheme", ss: "scheme", scheme: "scheme", "sh-session": "shell-session", "shell-session": "shell-session", smali: "smali", st: "smalltalk", smalltalk: "smalltalk", tpl: "smarty", smarty: "smarty", sml: "sml", fun: "sml", sig: "sml", sol: "solidity", solidity: "solidity", sln: "solution-file", soy: "soy", sparql: "sparql", rq: "sparql", spl: "splunk-spl", sqf: "sqf", sql: "sql", nut: "squirrel", squirrel: "squirrel", stan: "stan", do: "stata", ado: "stata", st: "iecst", iecst: "iecst", styl: "stylus", stylus: "stylus", sc: "supercollider", scd: "supercollider", swift: "swift", service: "systemd", socket: "systemd", device: "systemd", t4: "t4-templating", tt: "t4-cs", "vb-t4": "t4-vb", tap: "tap", tcl: "tcl", tk: "tcl", tt: "tt2", tt2: "tt2", textile: "textile", toml: "toml", troy: "tremor", trickle: "tremor", ttl: "turtle", trig: "turtle", twig: "twig", ts: "typescript", typescript: "typescript", tsconfig: "typoscript", ts: "typoscript", uc: "unrealscript", uci: "unrealscript", uorazor: "uorazor", uri: "uri", url: "uri", v: "v", vala: "vala", vapi: "vala", vb: "vbnet", vbnet: "vbnet", vm: "velocity", velocity: "velocity", v: "verilog", vh: "verilog", vhd: "vhdl", vhdl: "vhdl", vim: "vim", vimrc: "vim", vb: "visual-basic", bas: "visual-basic", warpscript: "warpscript", wast: "wasm", wat: "wasm", webidl: "web-idl", wgsl: "wgsl", wiki: "wiki", wl: "wolfram", nb: "wolfram", m: "wolfram", wren: "wren", xeoracube: "xeora", "xml-doc": "xml-doc", xojo: "xojo", xq: "xquery", xquery: "xquery", yml: "yaml", yaml: "yaml", yang: "yang", zig: "zig" }; this.dependencies = { jsx: ["javascript"], tsx: ["typescript", "jsx"], typescript: ["javascript"], scss: ["css"], sass: ["css"], less: ["css"], stylus: ["css"], php: ["markup"], erb: ["ruby", "markup"], aspnet: ["csharp", "markup"], handlebars: ["markup"], django: ["markup"], twig: ["markup"], liquid: ["markup"], pug: ["markup"], haml: ["markup"], cshtml: ["csharp", "markup"], "plant-uml": ["markup"], "t4-cs": ["csharp", "t4-templating"], "t4-vb": ["visual-basic", "t4-templating"], "markup-templating": ["markup"] }; this.languageNames = { markup: "HTML/XML", css: "CSS", javascript: "JavaScript", typescript: "TypeScript", jsx: "React JSX", tsx: "React TSX", python: "Python", java: "Java", cpp: "C++", c: "C", csharp: "C#", php: "PHP", ruby: "Ruby", go: "Go", rust: "Rust", swift: "Swift", kotlin: "Kotlin", scala: "Scala", dart: "Dart", bash: "Bash", powershell: "PowerShell", sql: "SQL", json: "JSON", yaml: "YAML", markdown: "Markdown", clojure: "Clojure", haskell: "Haskell", elixir: "Elixir", erlang: "Erlang", fsharp: "F#", ocaml: "OCaml", reason: "Reason", elm: "Elm", purescript: "PureScript", rescript: "ReScript", lua: "Lua", perl: "Perl", r: "R", julia: "Julia", solidity: "Solidity", graphql: "GraphQL", dockerfile: "Docker", nginx: "nginx", apache: "Apache", makefile: "Makefile", toml: "TOML", ini: "INI", properties: "Properties", none: "Plain Text" };}
  detectLanguageFromFilename(filename) {
    if (!filename || !filename.includes(".")) {
      return "none";
    }
    const extension = filename.split(".").pop().toLowerCase();
    return this.extensionMap[extension] || "none";
  }
  getLanguageDisplayName(language) {
    return (
      this.languageNames[language] ||
      language.charAt(0).toUpperCase() + language.slice(1)
    );
  }
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
  async _loadLanguageWithDependencies(language) {
    try {
      if (this.dependencies[language]) {
        for (const dep of this.dependencies[language]) {
          await this.loadLanguage(dep);
        }
      }
      if (
        this.loadedLanguages.has(language) ||
        this.loadingLanguages.has(language)
      ) {
        return;
      }
      this.loadingLanguages.add(language);
      const script = document.createElement("script");
      script.src = `https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-${language}.min.js`;
      const loadPromise = new Promise((resolve, reject) => {
        script.onload = () => {
          this.loadedLanguages.add(language);
          this.loadingLanguages.delete(language);
          console.log(`Loaded language: ${language}`);
          resolve();
        };
        script.onerror = () => {
          this.loadingLanguages.delete(language);
          console.warn(`Failed to load language: ${language}`);
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
      console.error(`Error loading language ${language}:`, error);
      throw error;
    }
  }
  isLanguageLoaded(language) {
    return this.loadedLanguages.has(language);
  }
  isLanguageLoading(language) {
    return this.loadingLanguages.has(language);
  }
}
window.currentHighlightLanguage = "none";
window.prismInitialized = !1;
window.updateTimeout = null;
window.debounceTimer = null;
const LARGE_TEXT_THRESHOLD = 1e5;
function fastEscapeHtml(e) {
  return e
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
window.syncScroll = function () {
  noteBackdrop &&
    noteTextarea &&
    ((noteBackdrop.scrollTop = noteTextarea.scrollTop),
    (noteBackdrop.scrollLeft = noteTextarea.scrollLeft),
    noteBackdrop.offsetHeight,
    noteTextarea.offsetHeight);
};
window.immediatePlainRender = function () {
  const e = noteTextarea.value;
  let t = e;
  e.endsWith("\n") && (t += " "),
    (noteBackdrop.innerHTML = fastEscapeHtml(t)),
    (noteBackdrop.style.color = "var(--color)"),
    noteBackdrop.offsetHeight,
    noteTextarea.offsetHeight,
    window.syncScroll();
};
window.scheduleUpdate = function (e = !1) {
  window.debounceTimer && clearTimeout(window.debounceTimer),
    window.updateTimeout && cancelAnimationFrame(window.updateTimeout),
    e
      ? requestAnimationFrame(window.updateBackdrop)
      : (window.debounceTimer = setTimeout(() => {
          requestAnimationFrame(window.updateBackdrop);
        }, 800));
};
window.updateBackdrop = async function () {
  (window.updateTimeout = null), (window.debounceTimer = null);
  if (!noteTextarea || !noteBackdrop) return;
  const e = noteTextarea.scrollTop,
    t = noteTextarea.scrollLeft,
    o = noteTextarea.selectionStart,
    n = noteTextarea.selectionEnd,
    l = document.activeElement === noteTextarea;
  const a = noteTextarea.value;
  if (!a) return void (noteBackdrop.innerHTML = "");
  let i = a;
  a.endsWith("\n") && (i = a + " ");
  if (a.length > LARGE_TEXT_THRESHOLD) return;
  let d = "none";
  if (currentNote && currentNote.extension) {
    const e = `file.${currentNote.extension}`;
    d = languageLoader.detectLanguageFromFilename(e);
  }
  d !== window.currentHighlightLanguage &&
    (window.currentHighlightLanguage = d),
    window.currentHighlightLanguage &&
      "none" !== window.currentHighlightLanguage &&
      (languageLoader.isLanguageLoaded(window.currentHighlightLanguage) ||
        languageLoader.isLanguageLoading(window.currentHighlightLanguage) ||
        (await languageLoader
          .loadLanguage(window.currentHighlightLanguage)
          .catch((e) => {
            console.warn(
              "Failed to load language:",
              window.currentHighlightLanguage
            ),
              (window.currentHighlightLanguage = "none");
          })),
      languageLoader.isLanguageLoaded(window.currentHighlightLanguage) &&
        window.Prism &&
        Prism.languages[window.currentHighlightLanguage] &&
        (() => {
          try {
            const e = Prism.highlight(
              i,
              Prism.languages[window.currentHighlightLanguage],
              window.currentHighlightLanguage
            );
            (noteBackdrop.innerHTML = e),
              noteBackdrop.offsetHeight,
              noteTextarea.offsetHeight;
          } catch (e) {
            console.warn("Prism highlighting failed:", e);
          }
        })()),
    (noteTextarea.scrollTop = e),
    (noteTextarea.scrollLeft = t),
    (noteBackdrop.scrollTop = e),
    (noteBackdrop.scrollLeft = t),
    l && (noteTextarea.focus(), noteTextarea.setSelectionRange(o, n));
};
(async function () {
  function e() {
    let e = document.getElementById("noteBackdrop"),
      t = document.getElementById("noteTextarea");
    return (
      e ||
        ((e = document.createElement("pre")),
        (e.id = "noteBackdrop"),
        (e.className = "note-backdrop"),
        e.setAttribute("aria-hidden", "true"),
        (
          document.querySelector(".text-area-wrapper") || document.body
        ).insertBefore(e, null)),
      t ||
        ((t = document.createElement("textarea")),
        (t.id = "noteTextarea"),
        (t.className = "note-textarea"),
        t.setAttribute("spellcheck", "false"),
        t.setAttribute("autocomplete", "off"),
        t.setAttribute("autocorrect", "off"),
        t.setAttribute("autocapitalize", "off"),
        (
          document.querySelector(".text-area-wrapper") || document.body
        ).appendChild(t)),
      { noteBackdrop: e, noteTextarea: t }
    );
  }
  const { noteBackdrop: t, noteTextarea: o } = e();
  (window.noteBackdrop = t), (window.noteTextarea = o);
  const n = document.querySelector('script[src*="prism"]');
  n && n.remove(),
    window.Prism ||
      (await new Promise((e, t) => {
        const o = document.createElement("script");
        (o.src =
          "https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/prism.min.js"),
          o.setAttribute("data-manual", "true"),
          (o.onload = e),
          (o.onerror = t),
          document.head.appendChild(o);
      }).catch((e) => console.error("Could not load Prism core:", e))),
    window.languageLoader ||
      ((window.languageLoader = new CompletePrismLanguageLoader()),
      (window.prismInitialized = !0)),
    o.addEventListener("input", () => {
      window.immediatePlainRender(), window.scheduleUpdate();
    }),
    o.addEventListener("scroll", window.syncScroll, { passive: !0 }),
    o.addEventListener("keydown", (e) => {
      if ("Tab" === e.key) {
        e.preventDefault();
        const t = o.selectionStart,
          n = o.selectionEnd;
        (o.value = o.value.substring(0, t) + "\t" + o.value.substring(n)),
          (o.selectionStart = o.selectionEnd = t + 1),
          window.immediatePlainRender();
      } else setTimeout(window.immediatePlainRender, 0);
      window.scheduleUpdate();
    }),
    o.addEventListener("paste", () =>
      setTimeout(() => {
        window.immediatePlainRender(), window.scheduleUpdate();
      }, 10)
    ),
    o.addEventListener("cut", () =>
      setTimeout(() => {
        window.immediatePlainRender(), window.scheduleUpdate();
      }, 10)
    ),
    o.addEventListener("change", () => {
      window.immediatePlainRender(), window.scheduleUpdate();
    });
  const l = window.openNote;
  window.openNote = function (e) {
    l && l(e),
      setTimeout(() => {
        (window.currentHighlightLanguage = "none"),
          window.immediatePlainRender(),
          window.scheduleUpdate(!0);
      }, 50);
  };
  const a = window.handleRenameSubmit;
  window.handleRenameSubmit = function () {
    a && a(),
      setTimeout(() => {
        (window.currentHighlightLanguage = "none"),
          window.immediatePlainRender(),
          window.scheduleUpdate(!0);
      }, 50);
  };
  const i = document.createElement("style");
  (i.textContent =
    ".text-area-wrapper{position:relative;width:100%;height:100%;overflow:hidden;contain:layout style paint;}#noteBackdrop pre{margin:0;pointer-events:none;}"),
    document.head.appendChild(i),
    setTimeout(() => window.scheduleUpdate(!0), 100),
    console.log("Prism syntax highlighting initialized - auto-update enabled");
})();

(function () {
  const DEFAULTS = {
    maxEntries: 50,
    powerWindowMs: 3000,
    coalesceMs: 500,
    memoryBudgetBytes: 200000,
    persistKey: "myapp_undo_data_v5",
    persistTTL: 864e5,
    imeDebounce: 50
  };
  function approxBytes(e) {
    try {
      return new Blob([JSON.stringify(e)]).size;
    } catch (t) {
      return JSON.stringify(e).length;
    }
  }
  function now() {
    return Date.now();
  }
  function shallowEqual(e, t) {
    return (
      e && t && e.value === t.value && e.start === t.start && e.end === t.end
    );
  }
  function clamp(e, t, n) {
    return Math.max(t, Math.min(n, e));
  }
  function getSelectionState(e) {
    if (!e) return { start: 0, end: 0, dir: "forward" };
    try {
      return {
        start: e.selectionStart || 0,
        end: e.selectionEnd || 0,
        dir: e.selectionDirection || "forward"
      };
    } catch (t) {
      return { start: 0, end: 0, dir: "forward" };
    }
  }
  function restoreSelectionState(e, t) {
    if (!e || !t) return;
    try {
      e.setSelectionRange(t.start, t.end, t.dir);
    } catch (n) {}
  }
  function snapshot(e) {
    return { value: e.value, ...getSelectionState(e), ts: now() };
  }
  function diffIsSmall(e, t) {
    if (!e || !t) return false;
    const n = e.value || "",
      r = t.value || "";
    if (Math.abs(n.length - r.length) > 5) return false;
    let i = 0;
    for (let o = 0, a = 0; o < n.length || a < r.length; ) {
      if (n[o] !== r[a]) {
        i++;
        if (i > 2) return false;
        o++;
        a++;
      } else {
        o++;
        a++;
      }
    }
    return true;
  }
  class HistoryManager {
    constructor(e, t) {
      this.opts = Object.assign({}, DEFAULTS, t || {});
      this.maxEntries = this.opts.maxEntries;
      this.powerWindowMs = this.opts.powerWindowMs;
      this.coalesceMs = this.opts.coalesceMs;
      this.persistKey = this.opts.persistKey;
      this.persistTTL = this.opts.persistTTL;
      this.imeDebounce = this.opts.imeDebounce;
      this.target = null;
      this._onInput = this._onInput.bind(this);
      this._onCutPaste = this._onCutPaste.bind(this);
      this._onKeydown = this._onKeydown.bind(this);
      this._onCompositionStart = this._onCompositionStart.bind(this);
      this._onCompositionEnd = this._onCompositionEnd.bind(this);
      this._observer = null;
      this._composition = false;
      this._coalesceTimer = null;
      this._undo = [];
      this._redo = [];
      this._suppress = false;
      this._wrapped = {};
      this._lastUndoClick = 0;
      this._lastRedoClick = 0;
      this._undoPower = 1;
      this._redoPower = 1;
      if (e) this.init(e);
    }
    init(e) {
      if (!e || "TEXTAREA" !== e.tagName.toUpperCase())
        throw new Error("target must be textarea");
      this.destroy();
      this.target = e;
      this._loadPersist();
      this._installListeners();
      this._wrapProgrammatics();
      this._commitInitial();
    }
    destroy() {
      this._uninstallListeners();
      this._unwrapProgrammatics();
      this._disconnectObserver();
      this._undo = [];
      this._redo = [];
      this.target = null;
      this._suppress = false;
    }
    performUndo() {
      if (!this.target) return;
      if (this._undo.length <= 1) {
        this._notify("Nothing to undo");
        return;
      }
      let e = Math.min(this._undoPower, this._undo.length - 1);
      this._suppress = true;
      for (let t = 0; t < e; t++) {
        let e = this._undo.pop();
        this._redo.push(e);
      }
      let t = this._undo[this._undo.length - 1];
      t && this._applyFrame(t);
      this._suppress = false;
      this._notify(`Undo performed (${e} step(s))`);
      this._persist();
    }
    performRedo() {
      if (!this.target) return;
      if (this._redo.length === 0) {
        this._notify("Nothing to redo");
        return;
      }
      let e = Math.min(this._redoPower, this._redo.length);
      this._suppress = true;
      for (let t = 0; t < e; t++) {
        let e = this._redo.pop();
        this._undo.push(e);
      }
      let t = this._undo[this._undo.length - 1];
      t && this._applyFrame(t);
      this._suppress = false;
      this._notify(`Redo performed (${e} step(s))`);
      this._persist();
    }
    clear() {
      this._undo = [];
      this._redo = [];
      this._persist();
    }
    recordNow(e) {
      if (!this.target) return;
      this._commitImmediate(e || "manual");
    }
    serialize() {
      return JSON.stringify({ undo: this._undo, redo: this._redo, ts: now() });
    }
    deserialize(e) {
      try {
        const t = typeof e === "string" ? JSON.parse(e) : e;
        this._undo = t.undo || [];
        this._redo = t.redo || [];
        this._trim();
        this._persist();
        return true;
      } catch (n) {
        return false;
      }
    }
    _notify(e) {
      try {
        showNotification && showNotification(e);
      } catch (t) {
        console.log(e);
      }
    }
    _applyFrame(e) {
      if (!this.target) return;
      this._suppress = true;
      this.target.value = e.value;
      restoreSelectionState(this.target, e);
      if (currentNote) currentNote.content = e.value;
      if (typeof updateNoteMetadata === "function") updateNoteMetadata();
      this._suppress = false;
    }
    _createFrame(e) {
      return {
        value: e.value,
        start: e.start,
        end: e.end,
        dir: e.dir,
        ts: e.ts
      };
    }
    _undoPush(e) {
      if (
        this._undo.length &&
        shallowEqual(this._undo[this._undo.length - 1], e)
      )
        return;
      this._undo.push(e);
      this._trim();
      this._persist();
    }
    _redoPush(e) {
      if (
        this._redo.length &&
        shallowEqual(this._redo[this._redo.length - 1], e)
      )
        return;
      this._redo.push(e);
      this._trim();
      this._persist();
    }
    _trim() {
      const e = this.maxEntries;
      while (this._undo.length > e) this._undo.shift();
      while (this._redo.length > e) this._redo.shift();
      if (this.opts.memoryBudgetBytes) {
        let t = approxBytes({ undo: this._undo, redo: this._redo });
        while (t > this.opts.memoryBudgetBytes && this._undo.length > 1) {
          this._undo.shift();
          t = approxBytes({ undo: this._undo, redo: this._redo });
        }
      }
    }
    _persist() {
      try {
        localStorage.setItem(
          this.persistKey,
          JSON.stringify({
            undo: this._undo,
            redo: this._redo,
            expires: now() + this.persistTTL
          })
        );
      } catch (e) {}
    }
    _loadPersist() {
      try {
        const e = localStorage.getItem(this.persistKey);
        if (!e) return;
        const t = JSON.parse(e);
        if (t.expires && t.expires > now()) {
          this._undo = (t.undo || []).slice(-this.maxEntries);
          this._redo = (t.redo || []).slice(-this.maxEntries);
        }
      } catch (n) {}
    }
    _commitInitial() {
      if (!this.target) return;
      const e = snapshot(this.target);
      this._undo = [this._createFrame(e)];
      this._redo = [];
      this._persist();
    }
    _installListeners() {
      if (!this.target) return;
      this.target.addEventListener("input", this._onInput);
      this.target.addEventListener("paste", this._onCutPaste);
      this.target.addEventListener("cut", this._onCutPaste);
      this.target.addEventListener("keydown", this._onKeydown);
      this.target.addEventListener(
        "compositionstart",
        this._onCompositionStart
      );
      this.target.addEventListener("compositionend", this._onCompositionEnd);
      this._observer = new MutationObserver(() => {
        if (this._suppress) return;
        this._scheduleCommit();
      });
      this._observer.observe(this.target, {
        characterData: true,
        childList: true,
        subtree: true
      });
      if (undoBtn)
        undoBtn.addEventListener("click", () => {
          const e = now();
          if (e - this._lastUndoClick <= this.powerWindowMs) {
            this._undoPower = clamp(this._undoPower + 1, 1, this.maxEntries);
          } else {
            this._undoPower = 1;
          }
          this._lastUndoClick = e;
          this._redoPower = 1;
          this._lastRedoClick = 0;
          this.performUndo();
        });
      if (redoBtn)
        redoBtn.addEventListener("click", () => {
          const e = now();
          if (e - this._lastRedoClick <= this.powerWindowMs) {
            this._redoPower = clamp(this._redoPower + 1, 1, this.maxEntries);
          } else {
            this._redoPower = 1;
          }
          this._lastRedoClick = e;
          this._undoPower = 1;
          this._lastUndoClick = 0;
          this.performRedo();
        });
    }
    _uninstallListeners() {
      if (!this.target) return;
      try {
        this.target.removeEventListener("input", this._onInput);
        this.target.removeEventListener("paste", this._onCutPaste);
        this.target.removeEventListener("cut", this._onCutPaste);
        this.target.removeEventListener("keydown", this._onKeydown);
        this.target.removeEventListener(
          "compositionstart",
          this._onCompositionStart
        );
        this.target.removeEventListener(
          "compositionend",
          this._onCompositionEnd
        );
      } catch (e) {}
      this._disconnectObserver();
      if (undoBtn) undoBtn.removeEventListener("click", this.performUndo);
      if (redoBtn) redoBtn.removeEventListener("click", this.performRedo);
    }
    _disconnectObserver() {
      if (this._observer) {
        try {
          this._observer.disconnect();
        } catch (e) {}
        this._observer = null;
      }
    }
    _onInput(e) {
      if (this._suppress) return;
      if (this._composition) return this._scheduleCommit();
      this._scheduleCommit();
    }
    _onCutPaste(e) {
      if (this._suppress) return;
      this._scheduleCommit(0);
    }
    _onKeydown(e) {
      if ((e.ctrlKey || e.metaKey) && !e.altKey) {
        if (e.key === "z" || e.key === "Z") {
          if (e.shiftKey) {
            e.preventDefault();
            this.performRedo();
          } else {
            e.preventDefault();
            this.performUndo();
          }
        } else if (e.key === "y" || e.key === "Y") {
          e.preventDefault();
          this.performRedo();
        }
      }
    }
    _onCompositionStart() {
      this._composition = true;
    }
    _onCompositionEnd() {
      this._composition = false;
      setTimeout(() => {
        this._scheduleCommit(0);
      }, this.imeDebounce);
    }
    _scheduleCommit(e) {
      clearTimeout(this._coalesceTimer);
      if (e === 0) {
        this._commitImmediate("immediate");
        return;
      }
      this._coalesceTimer = setTimeout(() => {
        this._commitImmediate("coalesced");
      }, this.coalesceMs);
    }
    _commitImmediate(e) {
      clearTimeout(this._coalesceTimer);
      if (!this.target) return;
      const t = snapshot(this.target);
      if (this._suppress) return;
      const n = this._undo[this._undo.length - 1];
      if (n && shallowEqual(n, t)) return;
      if (
        n &&
        diffIsSmall(n, t) &&
        now() - n.ts < this.coalesceMs &&
        !this._composition
      ) {
        this._undo[this._undo.length - 1] = this._createFrame(t);
        this._undo[this._undo.length - 1].ts = now();
      } else {
        this._undoPush(this._createFrame(t));
      }
      this._redo = [];
      this._persist();
    }
    _wrapProgrammatics() {
      if (!this.target) return;
      const e = this.target,
        t = this;
      try {
        if (!e.__undov_value_wrapped) {
          const n =
            Object.getOwnPropertyDescriptor(e, "value") ||
            Object.getOwnPropertyDescriptor(
              HTMLTextAreaElement.prototype,
              "value"
            );
          const r =
            n.get ||
            function () {
              return this.value;
            };
          const i =
            n.set ||
            function (e) {
              this.value = e;
            };
          Object.defineProperty(e, "value", {
            configurable: true,
            enumerable: n.enumerable,
            get: function () {
              return r.call(this);
            },
            set: function (e) {
              if (t._suppress) return i.call(this, e);
              i.call(this, e);
              t.recordNow("setter");
            }
          });
          e.__undov_value_wrapped = true;
          this._wrapped.value = true;
        }
      } catch (n) {}
      try {
        if (
          typeof e.setRangeText === "function" &&
          !e.__undov_setRangeText_wrapped
        ) {
          const n = e.setRangeText;
          e.setRangeText = function () {
            if (t._suppress) return n.apply(this, arguments);
            const e = snapshot(this);
            const r = n.apply(this, arguments);
            t.recordNow("setRangeText");
            return r;
          };
          e.__undov_setRangeText_wrapped = true;
          this._wrapped.setRangeText = true;
        }
      } catch (n) {}
    }
    _unwrapProgrammatics() {
      const e = this.target;
      try {
        if (e && e.__undov_value_wrapped) delete e.__undov_value_wrapped;
        if (e && e.__undov_setRangeText_wrapped)
          delete e.__undov_setRangeText_wrapped;
      } catch (t) {}
    }
  }
  function autoWire() {
    const e =
      document.getElementById("noteTextarea") ||
      document.querySelector("textarea");
    if (!e) return null;
    window.__HistoryManagerInstance &&
      window.__HistoryManagerInstance.destroy();
    window.__HistoryManagerInstance = new HistoryManager(e);
    window.performUndo = () => window.__HistoryManagerInstance.performUndo();
    window.performRedo = () => window.__HistoryManagerInstance.performRedo();
    window.clearUndoHistory = () => window.__HistoryManagerInstance.clear();
    window.recordState = (e) => window.__HistoryManagerInstance.recordNow(e);
    window.serializeUndoHistory = () =>
      window.__HistoryManagerInstance.serialize();
    window.deserializeUndoHistory = (e) =>
      window.__HistoryManagerInstance.deserialize(e);
    return window.__HistoryManagerInstance;
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", autoWire, { once: true });
  } else {
    setTimeout(autoWire, 0);
  }
  window.HistoryManager = HistoryManager;
})();
window.handleRename = function () {
  const e = preserveSelection(async function () {
    if (!currentNote) return void showNotification("No note selected");
    const t = currentNote.title || "",
      n = currentNote.extension || "",
      o = await showModal({
        header: '<div class="modal-title">Rename Note</div>',
        body: `<div style="display:flex;gap:10px;align-items:center;"><div style="flex:1;"><label class="modal-label">Name</label><input type="text" id="newTitle" placeholder="Enter Name" value="${t.replace(
          /"/g,
          "&quot;"
        )}"></div></div><div style="display:flex;gap:10px;align-items:center;"><div style="flex:1;"><label class="modal-label">Extension</label><input type="text" id="newExtension" placeholder="Enter Extension" value="${n.replace(
          /"/g,
          "&quot;"
        )}"></div></div>`,
        footer:
          '<button onclick="closeModal()">Cancel</button><button onclick="handleRenameSubmit()" class="modal-btn">Rename</button>'
      });
    if (!o || "OK" !== o.action) return;
    let a = String(o.newTitle || "").trim(),
      i = String(o.newExtension || "").trim();
    if (!a && !i) return;
    (a = a || t),
      (i = i || n),
      (currentNote.title = a),
      (currentNote.extension = i.replace(/^\./, "").toLowerCase()),
      (currentNote.lastEdited = new Date().toISOString());
    const l = notes.findIndex((e) => e.id === currentNote.id);
    -1 !== l &&
      ((notes[l].title = a),
      (notes[l].extension = currentNote.extension),
      (notes[l].lastEdited = currentNote.lastEdited)),
      updateNoteMetadata(),
      populateNoteList(),
      updateDocumentInfo(),
      showNotification("Note updated!"),
      (currentHighlightLanguage = "none"),
      immediatePlainRender(),
      (noteBackdrop.style.color = "var(--color)"),
      noteBackdrop.offsetHeight,
      scheduleUpdate(!0);
  });
  return "function" == typeof e ? e() : e;
};
window.handleRenameSubmit = function () {
  closeModal({
    action: "OK",
    newTitle: modalScope.newTitle ? modalScope.newTitle.value : "",
    newExtension: modalScope.newExtension ? modalScope.newExtension.value : ""
  }),
    setTimeout(() => {
      (currentHighlightLanguage = "none"),
        immediatePlainRender(),
        scheduleUpdate(!0);
    }, 50);
};
window.handleFormat = function (t) {
  return preserveSelection(async function () {
    if (!currentNote || !noteTextarea) return;
    const s = noteTextarea.selectionStart,
      e = noteTextarea.selectionEnd,
      v = noteTextarea.value;
    if (s === e) {
      showNotification(`Please select text to ${t}!`);
      return;
    }
    const formatOptions =
      t === "italic"
        ? "MarkDown (*text*),MarkUp (<i>text</i>)"
        : t === "underline"
        ? "MarkDown (__text__),MarkUp (<u>text</u>)"
        : t === "bold"
        ? "MarkDown (**text**),MarkUp (<b>text</b>)"
        : "MarkDown (```),MarkUp (<code>)";
    const optionsArray = [
      { label: "Select option", value: "" },
      { label: formatOptions.split(",")[0], value: "1" },
      { label: formatOptions.split(",")[1], value: "2" }
    ];
    const result = await showModal({
      header: `<div class="modal-title">${
        t[0].toUpperCase() + t.slice(1)
      } Text</div>`,
      body: ` <label class="modal-label">Choose Format</label> <div class="custom-dropdown"> <div id="formatType" class="custom-dropdown-trigger modal-input" data-options='${JSON.stringify(
        optionsArray
      )}'>Select option</div> </div> `,
      footer: ` <button onclick="closeModal()">Cancel</button> <button onclick="handleFormatSubmit('${t}')" class="modal-btn">OK</button> `
    });
    if (!result || result.action !== "OK") return;
    const formatValue = result.format;
    if (!formatValue) return;
    const sel = v.slice(s, e);
    let formatted = "";
    if (t === "italic")
      formatted = formatValue === "2" ? `<i>${sel}</i>` : `*${sel}*`;
    else if (t === "underline")
      formatted = formatValue === "2" ? `<u>${sel}</u>` : `__${sel}__`;
    else if (t === "bold")
      formatted = formatValue === "2" ? `<b>${sel}</b>` : `**${sel}**`;
    else if (t === "code")
      formatted =
        formatValue === "2" ? `<code>${sel}</code>` : `\`\`\`\n${sel}\n\`\`\``;
    noteTextarea.value = v.slice(0, s) + formatted + v.slice(e);
    updateNoteMetadata();
    showNotification(`Text ${t} applied!`);
  })();
};
window.handleFormatSubmit = function (type) {
  const formatValue = modalScope.formatType
    ? modalScope.formatType.dataset.value
    : null;
  if (!formatValue) {
    showNotification("Please select a format!");
    return;
  }
  closeModal({ action: "OK", format: formatValue, type: type });
};
window.handleBulletList = function () {
  return preserveSelection(async function () {
    if (!currentNote || !noteTextarea) return;
    const s = noteTextarea.selectionStart,
      e = noteTextarea.selectionEnd,
      v = noteTextarea.value;
    if (s === e) {
      showNotification("Please select text for bullet list!");
      return;
    }
    const optionsArray = [
      { label: "Select option", value: "" },
      { label: "MarkDown (- item)", value: "1" },
      { label: "MarkUp (&lt;ul&gt;&lt;li&gt;)", value: "2" }
    ];
    const result = await showModal({
      header: `<div class="modal-title">Bullet List</div>`,
      body: ` <label class="modal-label">Choose Format</label> <div class="custom-dropdown"> <div id="listFormat" class="custom-dropdown-trigger modal-input" data-options='${JSON.stringify(
        optionsArray
      )}'>Select option</div> </div> `,
      footer: ` <button onclick="closeModal()">Cancel</button> <button onclick="handleListSubmit('bullet')" class="modal-btn">OK</button> `
    });
    if (!result || result.action !== "OK") return;
    const formatValue = result.format;
    if (!formatValue) return;
    const sel = v.slice(s, e),
      lines = sel.split(/\r?\n/);
    let formatted;
    if (formatValue === "2") {
      formatted =
        "<ul>\n" +
        lines.map((t) => "<li>" + t + "</li>").join("\n") +
        "\n</ul>";
    } else {
      formatted = lines.map((t) => "- " + t).join("\n");
    }
    noteTextarea.value = v.slice(0, s) + formatted + v.slice(e);
    updateNoteMetadata();
    showNotification("Bullet list applied!");
  })();
};
window.handleNumberedList = function () {
  return preserveSelection(async function () {
    if (!currentNote || !noteTextarea) return;
    const s = noteTextarea.selectionStart,
      e = noteTextarea.selectionEnd,
      v = noteTextarea.value;
    if (s === e) {
      showNotification("Please select text for numbered list!");
      return;
    }
    const optionsArray = [
      { label: "Select option", value: "" },
      { label: "MarkDown (1. item)", value: "1" },
      { label: "MarkUp (&lt;ol&gt;&lt;li&gt;)", value: "2" }
    ];
    const result = await showModal({
      header: `<div class="modal-title">Numbered List</div>`,
      body: ` <label class="modal-label">Choose Format</label> <div class="custom-dropdown"> <div id="listFormat" class="custom-dropdown-trigger modal-input" data-options='${JSON.stringify(
        optionsArray
      )}'>Select option</div> </div> `,
      footer: ` <button onclick="closeModal()">Cancel</button> <button onclick="handleListSubmit('numbered')" class="modal-btn">OK</button> `
    });
    if (!result || result.action !== "OK") return;
    const formatValue = result.format;
    if (!formatValue) return;
    const sel = v.slice(s, e),
      lines = sel.split(/\r?\n/);
    let formatted;
    if (formatValue === "2") {
      formatted =
        "<ol>\n" +
        lines.map((t) => "<li>" + t + "</li>").join("\n") +
        "\n</ol>";
    } else {
      formatted = lines.map((t, i) => i + 1 + ". " + t).join("\n");
    }
    noteTextarea.value = v.slice(0, s) + formatted + v.slice(e);
    updateNoteMetadata();
    showNotification("Numbered list applied!");
  })();
};
window.handleListSubmit = function (type) {
  const formatValue = modalScope.listFormat
    ? modalScope.listFormat.dataset.value
    : null;
  if (!formatValue) {
    showNotification("Please select a format!");
    return;
  }
  closeModal({ action: "OK", format: formatValue, listType: type });
};
window.handleInsertLink = function () {
  return preserveSelection(async function () {
    if (!currentNote || !noteTextarea) return;
    const s = noteTextarea.selectionStart,
      e = noteTextarea.selectionEnd,
      v = noteTextarea.value;
    const formatOptionsArray = [
      { label: "Select option", value: "" },
      { label: "Markdown", value: "markdown" },
      { label: "MarkUp", value: "markup" }
    ];
    const result = await showModal({
      header: `<div class="modal-title">Insert Link</div>`,
      body: ` <div style="display: flex; gap: 10px; align-items: center;"> <div style="flex: 1;"> <label class="modal-label">URL</label> <input type="url" id="linkUrl" placeholder="Enter URL"> </div> </div> <div style="display: flex; gap: 10px; align-items: center;"> <div style="flex: 1;"> <label class="modal-label">Link Text</label> <input type="text" id="linkText" placeholder="Enter link text"> </div> </div> <div style="display: flex; gap: 10px; align-items: center;"> <div style="flex: 1;"> <label class="modal-label">Format</label> <div class="custom-dropdown"> <div id="linkFormat" class="custom-dropdown-trigger modal-input" data-options='${JSON.stringify(
        formatOptionsArray
      )}'>Select option</div> </div> </div> </div> `,
      footer: ` <button onclick="closeModal()">Cancel</button> <button onclick="handleLinkSubmit()" class="modal-btn">Submit</button> `
    });
    if (!result || result.action !== "submit") return;
    const url = result.url;
    const text = result.text;
    const format = result.format;
    if (!url || !text || !format) return;
    const link =
      format === "markup"
        ? `<a href="${url}">${text}</a>`
        : `[${text}](${url})`;
    noteTextarea.value = v.slice(0, s) + link + v.slice(e);
    updateNoteMetadata();
    showNotification("Link inserted!");
  })();
};
window.handleLinkSubmit = function () {
  const url = modalScope.linkUrl ? modalScope.linkUrl.value.trim() : "";
  const text = modalScope.linkText ? modalScope.linkText.value.trim() : "";
  const format = modalScope.linkFormat
    ? modalScope.linkFormat.dataset.value
    : "";
  if (!url || !text || !format) {
    showNotification("Please fill in all fields!");
    return;
  }
  closeModal({ action: "submit", url: url, text: text, format: format });
};
window.handleInsertImage = function () {
  return preserveSelection(async function () {
    if (!currentNote || !noteTextarea) return;
    const s = noteTextarea.selectionStart,
      e = noteTextarea.selectionEnd,
      v = noteTextarea.value;
    const formatOptionsArray = [
      { label: "Select option", value: "" },
      { label: "Markdown", value: "markdown" },
      { label: "MarkUp", value: "markup" }
    ];
    const result = await showModal({
      header: `<div class="modal-title">Insert Image</div>`,
      body: ` <div style="display: flex; gap: 10px; align-items: center;"> <div style="flex: 1;"> <label class="modal-label">Image URL</label> <input type="url" id="imageUrl" placeholder="Enter image URL"> </div> </div> <div style="display: flex; gap: 10px; align-items: center;"> <div style="flex: 1;"> <label class="modal-label">Format</label> <div class="custom-dropdown"> <div id="imageFormat" class="custom-dropdown-trigger modal-input" data-options='${JSON.stringify(
        formatOptionsArray
      )}'>Select option</div> </div> </div> </div> `,
      footer: ` <button onclick="closeModal()">Cancel</button> <button onclick="handleImageSubmit()" class="modal-btn">Insert</button> `
    });
    if (!result || result.action !== "submit") return;
    const url = result.url;
    const format = result.format;
    if (!url || !format) return;
    const image =
      format === "markup"
        ? `<img src="${url}" alt="Image" />`
        : `![Image](${url})`;
    noteTextarea.value =
      s === e ? v + image : v.slice(0, s) + image + v.slice(e);
    updateNoteMetadata();
    showNotification("Image inserted!");
  })();
};
window.handleImageSubmit = function () {
  const url = modalScope.imageUrl ? modalScope.imageUrl.value.trim() : "";
  const format = modalScope.imageFormat
    ? modalScope.imageFormat.dataset.value
    : "";
  if (!url || !format) {
    showNotification("Please fill in all fields!");
    return;
  }
  closeModal({ action: "submit", url: url, format: format });
};
window.handleUppercase = function () {
  const r = preserveSelection(function () {
    if (!currentNote || !noteTextarea) return;
    const s = noteTextarea.selectionStart,
      e = noteTextarea.selectionEnd,
      v = noteTextarea.value;
    if (!v) return;
    const f =
      s === e
        ? v.toUpperCase()
        : v.slice(0, s) + v.slice(s, e).toUpperCase() + v.slice(e);
    noteTextarea.value = f;
    updateNoteMetadata();
    showNotification("Converted to uppercase!");
  });
  return typeof r === "function" ? r() : r;
};
window.handleLowercase = function () {
  const r = preserveSelection(function () {
    if (!currentNote || !noteTextarea) return;
    const s = noteTextarea.selectionStart,
      e = noteTextarea.selectionEnd,
      v = noteTextarea.value;
    if (!v) return;
    const f =
      s === e
        ? v.toLowerCase()
        : v.slice(0, s) + v.slice(s, e).toLowerCase() + v.slice(e);
    noteTextarea.value = f;
    updateNoteMetadata();
    showNotification("Converted to lowercase!");
  });
  return typeof r === "function" ? r() : r;
};
window.handleAlignLeft = function () {
  if (!noteTextarea) return;
  noteTextarea.style.textAlign = "left";
  showNotification("Text aligned left!");
};
window.handleAlignCenter = function () {
  if (!noteTextarea) return;
  noteTextarea.style.textAlign = "center";
  showNotification("Text aligned center!");
};
window.handleAlignRight = function () {
  if (!noteTextarea) return;
  noteTextarea.style.textAlign = "right";
  showNotification("Text aligned right!");
};
window.increaseIndentation = function () {
  const r = preserveSelection(async function () {
    if (!currentNote || !noteTextarea) return;
    const s = noteTextarea.selectionStart,
      e = noteTextarea.selectionEnd;
    if (s === e) {
      showNotification("Please select text to indent!");
      return;
    }
    const t = noteTextarea.value.slice(s, e),
      i = "\t" + t.replace(/\n/g, "\n\t");
    noteTextarea.value =
      noteTextarea.value.slice(0, s) + i + noteTextarea.value.slice(e);
    updateNoteMetadata();
    showNotification("Text indented!");
  });
  return "function" == typeof r ? r() : r;
};
window.decreaseIndentation = function () {
  const r = preserveSelection(async function () {
    if (!currentNote || !noteTextarea) return;
    const s = noteTextarea.selectionStart,
      e = noteTextarea.selectionEnd;
    if (s === e) {
      showNotification("Please select text to un-indent!");
      return;
    }
    const t = noteTextarea.value.slice(s, e).split("\n"),
      i = t
        .map((e) =>
          e.startsWith("\t") ? e.slice(1) : e.startsWith(" ") ? e.slice(4) : e
        )
        .join("\n");
    noteTextarea.value =
      noteTextarea.value.slice(0, s) + i + noteTextarea.value.slice(e);
    updateNoteMetadata();
    showNotification("Indentation removed!");
  });
  return "function" == typeof r ? r() : r;
};
window.handleSelectAll = function () {
  if (!currentNote || !noteTextarea) return;
  noteTextarea.setSelectionRange(0, noteTextarea.value.length);
  noteTextarea.blur();
  showNotification("All text selected!");
};
window.handleCopyNote = function () {
  if (!currentNote || !noteTextarea) return;
  const s = noteTextarea.selectionStart,
    e = noteTextarea.selectionEnd,
    t = s === e ? noteTextarea.value : noteTextarea.value.slice(s, e);
  navigator.clipboard
    .writeText(t)
    .then(() => showNotification("Copied to clipboard!"))
    .catch(() => showNotification("Copy failed (clipboard not available)."));
};
window.handleCutNote = function () {
  if (!currentNote || !noteTextarea) return;
  const s = noteTextarea.selectionStart,
    e = noteTextarea.selectionEnd,
    t = s === e ? noteTextarea.value : noteTextarea.value.slice(s, e);
  navigator.clipboard
    .writeText(t)
    .then(() => {
      noteTextarea.value =
        s === e
          ? ""
          : noteTextarea.value.slice(0, s) + noteTextarea.value.slice(e);
      noteTextarea.selectionStart = noteTextarea.selectionEnd = s;
      updateNoteMetadata();
      showNotification("Cut to clipboard!");
    })
    .catch(() => showNotification("Cut failed (clipboard not available)."));
};
window.handleClearNote = function () {
  const r = preserveSelection(async function () {
    if (!currentNote || !noteTextarea) return;
    const s = noteTextarea.selectionStart,
      e = noteTextarea.selectionEnd,
      v = noteTextarea.value;
    if (s === e) {
      noteTextarea.value = "";
    } else {
      noteTextarea.value = v.slice(0, s) + v.slice(e);
    }
    updateNoteMetadata();
    showNotification("Note cleared!");
  });
  return "function" == typeof r ? r() : r;
};
window.handlePasteNote = function () {
  const r = async function () {
    if (!currentNote || !noteTextarea) return;
    if (!navigator.clipboard || !navigator.permissions) {
      showNotification("Paste not supported in this browser.");
      return;
    }
    try {
      const perm = await navigator.permissions.query({
        name: "clipboard-read"
      });
      if (perm.state === "denied") {
        showNotification(
          "Clipboard access denied. Please allow it in your browser settings."
        );
        return;
      }
      const clip = await navigator.clipboard.readText();
      const s = noteTextarea.selectionStart,
        e = noteTextarea.selectionEnd;
      noteTextarea.value =
        noteTextarea.value.slice(0, s) + clip + noteTextarea.value.slice(e);
      const n = s + clip.length;
      noteTextarea.selectionStart = noteTextarea.selectionEnd = n;
      updateNoteMetadata();
      showNotification("Pasted from clipboard!");
    } catch {
      showNotification("Paste failed (permission denied or empty clipboard).");
    }
  };
  r();
};
window.handlePattern = async function () {
  if (!currentNote || !noteTextarea) return;
  const r = await showModal({
    header: `<div class="modal-title">Replace Between Delimiters</div>`,
    body: `<div><label class="modal-label">Start delimiter</label><input type="text" id="startDelim" placeholder="Start delimiter (required)"></div><div><label class="modal-label">End delimiter</label><input type="text" id="endDelim" placeholder="End delimiter (required)"></div><div style="display:flex;align-items:center;gap:8px;margin-top:6px;"><input type="checkbox" id="includeDelims"><label for="includeDelims" class="modal-label">Include delimiters in replacement</label></div><div><label class="modal-label">Replacement text</label><input type="text" id="replaceText" placeholder="Replacement text" data-skip-validation></div><div style="margin-top:8px;font-weight:600;">Which instances to replace?</div><div style="display:flex;gap:8px;margin-top:4px;"><button type="button" id="allMode" class="modal-btn active" data-mode="all">All</button><button type="button" id="singleMode" class="modal-btn" data-mode="single">Single</button><button type="button" id="rangeMode" class="modal-btn" data-mode="range">Range</button></div><div id="singleContainer" style="display:none;margin-top:6px;"><label class="modal-label">Instance number (1-based)</label><input type="number" id="singleInstance" min="1" value="1"></div><div id="rangeContainer" style="display:none;margin-top:6px;display:flex;gap:8px;"><div><label class="modal-label">From (1-based)</label><input type="number" id="rangeFrom" min="1" value="1"></div><div><label class="modal-label">To (1-based)</label><input type="number" id="rangeTo" min="1" value="1"></div></div><div id="matchInfo" style="font-size:13px;color:var(--blueink);margin-top:6px;">Matches: 0</div>`,
    footer: `<button onclick="closeModal()">Cancel</button><button onclick="handlePatternSubmit()" class="modal-btn">Replace</button>`
  });
  if (!r || r.action !== "submit") return;
  const {
    startDelim,
    endDelim,
    includeDelims,
    replaceText,
    mode,
    singleInstance,
    rangeFrom,
    rangeTo
  } = r;
  if (!startDelim) return showNotification("Start delimiter required");
  if (!endDelim) return showNotification("End delimiter required");
  const text = noteTextarea.value,
    pairs = findPairs(text, startDelim, endDelim);
  if (!pairs.length) return showNotification("No matches found");
  let from = 1,
    to = pairs.length;
  if (mode === "single") {
    const n = parseInt(singleInstance, 10);
    if (isNaN(n) || n < 1) return showNotification("Invalid instance number");
    from = to = Math.min(Math.max(n, 1), pairs.length);
  } else if (mode === "range") {
    const f = parseInt(rangeFrom, 10),
      t = parseInt(rangeTo, 10);
    if (isNaN(f) || isNaN(t)) return showNotification("Invalid range");
    from = Math.min(Math.max(f, 1), pairs.length);
    to = Math.min(Math.max(t, from), pairs.length);
  }
  try {
    let out = text;
    for (let i = pairs.length - 1; i >= 0; i--) {
      const pair = pairs[i],
        idx1 = i + 1;
      if (idx1 < from || idx1 > to) continue;
      const before = out.slice(0, pair.startIndex),
        after = out.slice(pair.endIndex);
      let middle;
      if (includeDelims) {
        middle = replaceText;
      } else {
        middle = startDelim + replaceText + endDelim;
      }
      out = before + middle + after;
    }
    noteTextarea.value = out;
    typeof updateNoteMetadata === "function" && updateNoteMetadata();
    const replacedCount = Math.max(0, Math.min(to, pairs.length) - from + 1);
    showNotification(
      `Replacement done! (${replacedCount} instance(s) replaced)`
    );
  } catch (err) {
    console.error("Replacement error", err);
    showNotification("Replacement failed — see console");
  }
};
window.handlePatternSubmit = function () {
  const s = modalScope.startDelim ? modalScope.startDelim.value.trim() : "",
    e = modalScope.endDelim ? modalScope.endDelim.value.trim() : "",
    inc = modalScope.includeDelims ? modalScope.includeDelims.checked : false,
    rep = modalScope.replaceText ? modalScope.replaceText.value : "",
    mode =
      modalScope.allMode && modalScope.allMode.classList.contains("active")
        ? "all"
        : modalScope.singleMode &&
          modalScope.singleMode.classList.contains("active")
        ? "single"
        : "range",
    si = modalScope.singleInstance ? modalScope.singleInstance.value : "1",
    rf = modalScope.rangeFrom ? modalScope.rangeFrom.value : "1",
    rt = modalScope.rangeTo ? modalScope.rangeTo.value : "1";
  closeModal({
    action: "submit",
    startDelim: s,
    endDelim: e,
    includeDelims: inc,
    replaceText: rep,
    mode: mode,
    singleInstance: si,
    rangeFrom: rf,
    rangeTo: rt
  });
};
document.addEventListener("click", function (e) {
  if (!modalScope) return;
  const id = e.target && e.target.id;
  if (id === "allMode" || id === "singleMode" || id === "rangeMode") {
    ["allMode", "singleMode", "rangeMode"].forEach(
      (i) => modalScope[i] && modalScope[i].classList.remove("active")
    );
    e.target.classList.add("active");
    modalScope.singleContainer &&
      (modalScope.singleContainer.style.display =
        id === "singleMode" ? "block" : "none");
    modalScope.rangeContainer &&
      (modalScope.rangeContainer.style.display =
        id === "rangeMode" ? "flex" : "none");
  }
});
document.addEventListener("input", function (e) {
  if (!modalScope) return;
  const tid = e.target && e.target.id;
  if (tid === "startDelim" || tid === "endDelim") {
    const s = modalScope.startDelim ? modalScope.startDelim.value : "",
      f = modalScope.endDelim ? modalScope.endDelim.value : "";
    if (!s || !f) {
      modalScope.matchInfo && (modalScope.matchInfo.textContent = "Matches: 0");
      return;
    }
    const pairs = findPairs(noteTextarea.value, s, f);
    modalScope.matchInfo &&
      (modalScope.matchInfo.textContent = `Matches: ${pairs.length}`);
    if (pairs.length) {
      modalScope.rangeFrom && (modalScope.rangeFrom.value = "1");
      modalScope.rangeTo && (modalScope.rangeTo.value = String(pairs.length));
      modalScope.singleInstance && (modalScope.singleInstance.value = "1");
    }
  }
});
function findPairs(text, startDelim, endDelim) {
  const pairs = [];
  if (!startDelim || !endDelim) return pairs;
  const sLen = startDelim.length,
    eLen = endDelim.length,
    stack = [];
  let i = 0;
  while (i < text.length) {
    if (text.substr(i, sLen) === startDelim) {
      stack.push(i);
      i += sLen;
      continue;
    }
    if (text.substr(i, eLen) === endDelim) {
      if (stack.length > 0) {
        const startIdx = stack.pop(),
          endIdx = i + eLen;
        pairs.push({ startIndex: startIdx, endIndex: endIdx });
      }
      i += eLen;
      continue;
    }
    i++;
  }
  return pairs.sort((a, b) => a.startIndex - b.startIndex);
}
window.handleDownload = async function () {
  if (!currentNote || !noteTextarea) return;
  const dfn = `${currentNote.title || "note"}.${
    currentNote.extension || "txt"
  }`.replace(/"/g, "&quot;");
  const res = await showModal({
    header: `<div class="modal-title">Download Note</div>`,
    body: `<div style="display: flex; gap: 10px; align-items: center;"><div style="flex: 1;"><label class="modal-label">Filename</label><input type="text" id="fileName" placeholder="Enter filename including extension" value="${dfn}"></div></div>`,
    footer: `<button onclick="closeModal()">Cancel</button><button onclick="handleDownloadSubmit()" data-skip-validation class="modal-btn">Download</button>`
  });
  if (!res || res.action !== "Download") return;
  let f = String(res.fileName || "").trim();
  if (!f) return;
  f = f
    .replace(/\0/g, "")
    .replace(/[/\\]+/g, "")
    .replace(/["'<>:|?*]+/g, "");
  const p = f.split("."),
    ext = p.length > 1 ? (p.pop() || "txt").toLowerCase() : "txt",
    name = p.join(".") || "note",
    mimeMap = {
      txt: "text/plain; charset=utf-8",
      text: "text/plain; charset=utf-8",
      md: "text/markdown; charset=utf-8",
      markdown: "text/markdown; charset=utf-8",
      csv: "text/csv; charset=utf-8",
      log: "text/plain; charset=utf-8",
      ini: "text/plain; charset=utf-8",
      conf: "text/plain; charset=utf-8",
      env: "text/plain; charset=utf-8",
      html: "text/html; charset=utf-8",
      htm: "text/html; charset=utf-8",
      css: "text/css; charset=utf-8",
      js: "application/javascript; charset=utf-8",
      mjs: "text/javascript; charset=utf-8",
      ts: "application/typescript; charset=utf-8",
      jsx: "text/jsx; charset=utf-8",
      tsx: "text/tsx; charset=utf-8",
      json: "application/json; charset=utf-8",
      xml: "application/xml; charset=utf-8",
      yaml: "text/yaml; charset=utf-8",
      yml: "text/yaml; charset=utf-8",
      png: "image/png",
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      webp: "image/webp",
      gif: "image/gif",
      svg: "image/svg+xml; charset=utf-8",
      ico: "image/vnd.microsoft.icon",
      woff: "font/woff",
      woff2: "font/woff2",
      ttf: "font/ttf",
      otf: "font/otf",
      mp3: "audio/mpeg",
      m4a: "audio/mp4",
      wav: "audio/wav",
      ogg: "audio/ogg",
      flac: "audio/flac",
      mp4: "video/mp4",
      m4v: "video/x-m4v",
      mov: "video/quicktime",
      webm: "video/webm",
      mkv: "video/x-matroska",
      avi: "video/x-msvideo",
      zip: "application/zip",
      tar: "application/x-tar",
      gz: "application/gzip",
      tgz: "application/gzip",
      bz2: "application/x-bzip2",
      xz: "application/x-xz",
      rar: "application/vnd.rar",
      "7z": "application/x-7z-compressed",
      pdf: "application/pdf",
      doc: "application/msword",
      docx:
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      xls: "application/vnd.ms-excel",
      xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      ppt: "application/vnd.ms-powerpoint",
      pptx:
        "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      odt: "application/vnd.oasis.opendocument.text",
      ods: "application/vnd.oasis.opendocument.spreadsheet",
      odp: "application/vnd.oasis.opendocument.presentation",
      epub: "application/epub+zip",
      exe: "application/vnd.microsoft.portable-executable",
      dll: "application/octet-stream",
      bin: "application/octet-stream",
      wasm: "application/wasm",
      sh: "application/x-sh",
      bash: "application/x-sh",
      ps1: "text/plain; charset=utf-8",
      bat: "application/x-msdownload",
      sql: "text/x-sql; charset=utf-8",
      rtf: "application/rtf",
      svgz: "image/svg+xml; charset=utf-8",
      heic: "image/heic",
      heif: "image/heif"
    },
    textLike = [
      "text/plain",
      "text/markdown",
      "text/csv",
      "text/html",
      "application/json",
      "application/javascript",
      "application/xml",
      "text/yaml",
      "text/jsx",
      "text/tsx"
    ],
    mime =
      mimeMap[ext] ||
      (/\.(jpg|jpeg|png|gif|webp|svg|ico)$/i.test(ext)
        ? `image/${ext}`
        : "application/octet-stream");
  if (textLike.some((t) => mime.indexOf(t) === 0) && !/charset=/.test(mime))
    mime += "; charset=utf-8";
  const fileName = `${name}.${ext}`,
    blob = new Blob([noteTextarea.value], { type: mime }),
    url = URL.createObjectURL(blob),
    a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
  showNotification(`Note downloaded as ${fileName}!`);
};
window.handleDownloadSubmit = function () {
  const fileName = modalScope.fileName ? modalScope.fileName.value : "";
  closeModal({ action: "Download", fileName });
};
window.handleAdd = async () => {
  if (!currentNote || !noteTextarea) return;
  const r = await showModal({
    header: `<div class="modal-title">Add Text to Lines</div>`,
    body: `<div style="display:flex;flex-direction:column;gap:10px;"><div><label class="modal-label">Insert text</label><input type="text" id="insertText" class="modal-input" placeholder="Text to insert (use %L for line number, %N for new line)" data-skip-validation></div><div><label class="modal-label">Insert position</label><div class="custom-dropdown"><div id="insertPosition" class="custom-dropdown-trigger modal-input" data-options='[{"label":"Insert at start of line","value":"start"},{"label":"Insert at end of line","value":"end"},{"label":"Insert at specific column","value":"column"}]' data-value="start">Insert at start of line</div></div></div><div id="colContainer" style="display:none"><label class="modal-label">Column number</label><input type="number" id="columnNumber" class="modal-input" placeholder="Column number (1-based)" min="1"></div></div>`,
    footer: `<button onclick="closeModal()">Cancel</button><button onclick="handleAddSubmit()">Add</button>`,
    html: true
  });
  if (!r || r.action !== "submit") return;
  const { insertText, insertPosition, columnNumber } = r;
  const col = parseInt(columnNumber, 10) || 1;
  const lines = noteTextarea.value.split("\n");
  let result = "";
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    const replacement = insertText
      .replace(/%L/g, String(i + 1))
      .replace(/%N/g, "\n");
    if (insertPosition === "start") {
      line = replacement + line;
    } else if (insertPosition === "end") {
      line = line + replacement;
    } else if (insertPosition === "column") {
      const idx = Math.max(0, col - 1);
      if (line.length < idx) {
        line = line.padEnd(idx, " ");
      }
      line = line.slice(0, idx) + replacement + line.slice(idx);
    }
    result += line + (i < lines.length - 1 ? "\n" : "");
  }
  noteTextarea.value = result;
  if (typeof updateNoteMetadata === "function") updateNoteMetadata();
  if (typeof updatecounts === "function") updatecounts();
  showNotification("Text added successfully!");
};
window.handleAddSubmit = function () {
  const insertText = modalScope.insertText ? modalScope.insertText.value : "";
  const insertPosition = modalScope.insertPosition
    ? modalScope.insertPosition.dataset.value
    : "start";
  const columnNumber = modalScope.columnNumber
    ? modalScope.columnNumber.value
    : "";
  closeModal({ action: "submit", insertText, insertPosition, columnNumber });
};
document.addEventListener("click", (e) => {
  if (!modalScope) return;
  const positionElem = modalScope.insertPosition;
  if (!positionElem) return;
  const value = positionElem.dataset.value || "start";
  const colContainer = modalScope.colContainer;
  if (colContainer) {
    colContainer.style.display = value === "column" ? "block" : "none";
  }
});
window.handleCleanupText = async () => {
  if (!currentNote || !noteTextarea) return;
  const r = await showModal({
    header: `<div class="modal-title">Cleanup Text</div>`,
    body: `<div style="display:flex;flex-direction:column;gap:10px;"><div><label class="modal-label">Choose Cleanup Style</label><div class="custom-dropdown"><div id="cleanupStyle" class="custom-dropdown-trigger modal-input" data-options='[{"label":"Select CleanUp Style","value":""},{"label":"Remove Linebreaks","value":"remove_linebreaks"},{"label":"Remove Parabreaks","value":"remove_parabreaks"},{"label":"Remove Both Line & Para Breaks","value":"remove_both"},{"label":"Whitespace Cleanup","value":"whitespace_cleanup"},{"label":"Trim Columns","value":"trim_columns"},{"label":"Tidy Lines","value":"tidy_lines"}]' data-value="">Select CleanUp Style</div></div></div><div id="trimContainer" style="display:none;flex-direction:column;gap:10px;"><div><label class="modal-label">Number of Columns</label><input type="number" id="trimNumber" class="modal-input" value="1" min="1"></div><div><label class="modal-label">Trim Side</label><div class="custom-dropdown"><div id="trimSide" class="custom-dropdown-trigger modal-input" data-options='[{"label":"Left","value":"left"},{"label":"Right","value":"right"}]' data-value="left">Left</div></div></div></div></div>`,
    footer: `<button onclick="closeModal()">Cancel</button><button onclick="handleCleanupSubmit()">Cleanup</button>`,
    html: true
  });
  if (!r || r.action !== "submit") return;
  const { cleanupStyle, trimNumber, trimSide } = r;
  let text = noteTextarea.value;
  if (cleanupStyle === "remove_linebreaks") {
    text = text.replace(/\r\n|\r|\n/g, " ");
  } else if (cleanupStyle === "remove_parabreaks") {
    text = text.replace(/\n{3,}/g, "\n\n");
  } else if (cleanupStyle === "remove_both") {
    text = text
      .replace(/\r\n|\r|\n/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  } else if (cleanupStyle === "whitespace_cleanup") {
    text = text
      .replace(/\t+/g, " ")
      .replace(/ {2,}/g, " ")
      .replace(/\n{3,}/g, "\n\n")
      .replace(/^\n+|\n+$/g, "");
  } else if (cleanupStyle === "trim_columns") {
    const n = parseInt(trimNumber, 10) || 0;
    text = text
      .split("\n")
      .map((line) => {
        if (trimSide === "left") return line.slice(n);
        if (trimSide === "right") return line.slice(0, -n);
        return line;
      })
      .join("\n");
  } else if (cleanupStyle === "tidy_lines") {
    text = text
      .split("\n")
      .map((line) => line.trim())
      .join("\n");
  }
  noteTextarea.value = text;
  if (typeof updateNoteMetadata === "function") updateNoteMetadata();
  showNotification("Text cleaned successfully!");
};
window.handleCleanupSubmit = function () {
  const cleanupStyle = modalScope.cleanupStyle
    ? modalScope.cleanupStyle.dataset.value
    : "";
  const trimNumber = modalScope.trimNumber ? modalScope.trimNumber.value : "1";
  const trimSide = modalScope.trimSide
    ? modalScope.trimSide.dataset.value
    : "left";
  if (!cleanupStyle) return showNotification("Please select a cleanup style!");
  closeModal({ action: "submit", cleanupStyle, trimNumber, trimSide });
};
document.addEventListener("click", (e) => {
  if (!modalScope) return;
  const styleElem = modalScope.cleanupStyle;
  if (!styleElem) return;
  const value = styleElem.dataset.value || "";
  const trimContainer = modalScope.trimContainer;
  if (trimContainer) {
    trimContainer.style.display = value === "trim_columns" ? "flex" : "none";
  }
});
window.reverseText = preserveSelection(async () => {
  if (!currentNote || !noteTextarea) return;
  let s = noteTextarea.selectionStart,
    e = noteTextarea.selectionEnd;
  if (s === e)
    noteTextarea.value = noteTextarea.value.split("").reverse().join("");
  else {
    let t = noteTextarea.value,
      n = t.substring(s, e),
      r = n.split("").reverse().join("");
    noteTextarea.value = t.substring(0, s) + r + t.substring(e);
  }
  try {
    updateNoteMetadata();
    showNotification("Text reversed!");
  } catch (err) {
    console.error("Error updating note metadata:", err);
    showNotification("Failed to update note metadata");
  }
});
window.reverseWords = preserveSelection(async () => {
  if (!currentNote || !noteTextarea) return;
  const s = noteTextarea.selectionStart;
  const e = noteTextarea.selectionEnd;
  if (s === e) {
    noteTextarea.value = noteTextarea.value.split(/\s+/).reverse().join(" ");
  } else {
    const t = noteTextarea.value;
    const n = t.substring(s, e);
    const r = n.split(/\s+/).reverse().join(" ");
    noteTextarea.value = t.substring(0, s) + r + t.substring(e);
  }
  updateNoteMetadata();
  showNotification("Words reversed!");
});
window.capitalizeWords = preserveSelection(async () => {
  if (!currentNote || !noteTextarea) return;
  const s = noteTextarea.selectionStart;
  const e = noteTextarea.selectionEnd;
  if (s === e) {
    noteTextarea.value = noteTextarea.value.replace(
      /\b\w+/g,
      (t) => t.charAt(0).toUpperCase() + t.slice(1).toLowerCase()
    );
  } else {
    const t = noteTextarea.value;
    const n = t.substring(s, e);
    const r = n.replace(
      /\b\w+/g,
      (t) => t.charAt(0).toUpperCase() + t.slice(1).toLowerCase()
    );
    noteTextarea.value = t.substring(0, s) + r + t.substring(e);
  }
  updateNoteMetadata();
  showNotification("Words capitalized!");
});
window.capitalizeSentences = preserveSelection(async () => {
  if (!currentNote || !noteTextarea) return;
  const s = noteTextarea.selectionStart;
  const e = noteTextarea.selectionEnd;
  if (s === e) {
    noteTextarea.value = noteTextarea.value
      .toLowerCase()
      .replace(/(^\s*[a-z])|([.!?]\s*[a-z])/g, (t) => t.toUpperCase());
  } else {
    const t = noteTextarea.value;
    const n = t.substring(s, e).toLowerCase();
    const r = n.replace(/(^\s*[a-z])|([.!?]\s*[a-z])/g, (t) => t.toUpperCase());
    noteTextarea.value = t.substring(0, s) + r + t.substring(e);
  }
  updateNoteMetadata();
  showNotification("Sentences capitalized!");
});
window.handleOpenFile = function () {
  const e = getNextEmptyNote();
  if (!e) {
    showNotification("No empty notes available! Clear a note to continue.");
    return;
  }
  const t = document.createElement("input");
  t.type = "file";
  t.accept =
    ".txt,.md,.csv,.json,.xml,.yml,.yaml,.js,.ts,.jsx,.tsx,.html,.css,.py,.java,.c,.cpp,.h,.go,.rb,.php,.rs,.swift,.sh,.bat,Dockerfile,Makefile,.env,.ini,.toml,.conf,.log,.dockerignore";
  t.onchange = function (o) {
    const n = o.target.files[0];
    if (n) {
      const r = new FileReader();
      (r.onload = function (o) {
        let x = n.name.split("."),
          a = x.pop().toLowerCase(),
          base = x.join(".");
        e.title = base;
        e.content = o.target.result;
        e.extension = a;
        e.lastEdited = new Date().toISOString();
        visibleNotes = 1;
        updateNoteVisibility();
        openNote(e.id);
        showNotification("File opened!");
      }),
        r.readAsText(n);
    }
  };
  t.click();
};
window.handleFindReplace = async function () {
  if (!currentNote || !noteTextarea) return;
  const r = await showModal({
    header: `<div class="modal-title">Find and Replace</div>`,
    body: `<div style="display: flex; gap: 10px; align-items: center;"><div style="flex: 1;"><label class="modal-label">Find</label><input type="text" id="findText" placeholder="Enter text to find"></div></div><div style="display: flex; gap: 10px; align-items: center;"><div style="flex: 1;"><label class="modal-label">Replace</label><input type="text" id="replaceText" placeholder="Enter replacement text" data-skip-validation></div></div><div style="display: flex; align-items: center; margin-top: 8px;"><input type="checkbox" id="caseSensitive" style="color: var(--accent2);margin-right: 6px"><label for="caseSensitive" class="modal-label">Case sensitive</label></div>`,
    footer: `<button onclick="closeModal()">Cancel</button><button onclick="handleFindReplaceSubmit()" class="modal-btn">Replace</button>`
  });
  if (!r || r.action !== "Replace") return;
  const f = r.findText.trim(),
    p = r.replaceText,
    c = r.caseSensitive === true;
  if (!f) {
    showNotification("Please enter text to find!");
    return;
  }
  try {
    const e = f.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
      t = new RegExp(e, c ? "g" : "gi");
    (noteTextarea.value = noteTextarea.value.replace(t, p)),
      updateNoteMetadata(),
      showNotification("Text replaced!");
  } catch (e) {
    showNotification("Error in find and replace!");
  }
};
window.handleFindReplaceSubmit = function () {
  const e = modalScope.findText ? modalScope.findText.value : "",
    t = modalScope.replaceText ? modalScope.replaceText.value : "",
    c = modalScope.caseSensitive ? modalScope.caseSensitive.checked : false;
  closeModal({
    action: "Replace",
    findText: e,
    replaceText: t,
    caseSensitive: c
  });
};
var generateMD5 = function (d) { var r = M(V(Y(X(d), 8 * d.length))); return r.toLowerCase(); }; function M(d) { for (var _, m = "0123456789ABCDEF", f = "", r = 0; r < d.length; r++) (_ = d.charCodeAt(r)), (f += m.charAt((_ >>> 4) & 15) + m.charAt(15 & _)); return f; } function X(d) { for (var _ = Array(d.length >> 2), m = 0; m < _.length; m++) _[m] = 0; for (m = 0; m < 8 * d.length; m += 8) _[m >> 5] |= (255 & d.charCodeAt(m / 8)) << m % 32; return _; } function V(d) { for (var _ = "", m = 0; m < 32 * d.length; m += 8) _ += String.fromCharCode((d[m >> 5] >>> m % 32) & 255); return _; } function Y(d, _) { (d[_ >> 5] |= 128 << _ % 32), (d[14 + (((_ + 64) >>> 9) << 4)] = _); for ( var m = 1732584193, f = -271733879, r = -1732584194, i = 271733878, n = 0; n < d.length; n += 16 ) { var h = m, t = f, g = r, e = i; (f = md5_ii( (f = md5_ii( (f = md5_ii( (f = md5_ii( (f = md5_hh( (f = md5_hh( (f = md5_hh( (f = md5_hh( (f = md5_gg( (f = md5_gg( (f = md5_gg( (f = md5_gg( (f = md5_ff( (f = md5_ff( (f = md5_ff( (f = md5_ff( f, (r = md5_ff( r, (i = md5_ff( i, (m = md5_ff( m, f, r, i, d[n + 0], 7, -680876936 )), f, r, d[n + 1], 12, -389564586 )), m, f, d[n + 2], 17, 606105819 )), i, m, d[n + 3], 22, -1044525330 )), (r = md5_ff( r, (i = md5_ff( i, (m = md5_ff( m, f, r, i, d[n + 4], 7, -176418897 )), f, r, d[n + 5], 12, 1200080426 )), m, f, d[n + 6], 17, -1473231341 )), i, m, d[n + 7], 22, -45705983 )), (r = md5_ff( r, (i = md5_ff( i, (m = md5_ff( m, f, r, i, d[n + 8], 7, 1770035416 )), f, r, d[n + 9], 12, -1958414417 )), m, f, d[n + 10], 17, -42063 )), i, m, d[n + 11], 22, -1990404162 )), (r = md5_ff( r, (i = md5_ff( i, (m = md5_ff( m, f, r, i, d[n + 12], 7, 1804603682 )), f, r, d[n + 13], 12, -40341101 )), m, f, d[n + 14], 17, -1502002290 )), i, m, d[n + 15], 22, 1236535329 )), (r = md5_gg( r, (i = md5_gg( i, (m = md5_gg( m, f, r, i, d[n + 1], 5, -165796510 )), f, r, d[n + 6], 9, -1069501632 )), m, f, d[n + 11], 14, 643717713 )), i, m, d[n + 0], 20, -373897302 )), (r = md5_gg( r, (i = md5_gg( i, (m = md5_gg(m, f, r, i, d[n + 5], 5, -701558691)), f, r, d[n + 10], 9, 38016083 )), m, f, d[n + 15], 14, -660478335 )), i, m, d[n + 4], 20, -405537848 )), (r = md5_gg( r, (i = md5_gg( i, (m = md5_gg(m, f, r, i, d[n + 9], 5, 568446438)), f, r, d[n + 14], 9, -1019803690 )), m, f, d[n + 3], 14, -187363961 )), i, m, d[n + 8], 20, 1163531501 )), (r = md5_gg( r, (i = md5_gg( i, (m = md5_gg(m, f, r, i, d[n + 13], 5, -1444681467)), f, r, d[n + 2], 9, -51403784 )), m, f, d[n + 7], 14, 1735328473 )), i, m, d[n + 12], 20, -1926607734 )), (r = md5_hh( r, (i = md5_hh( i, (m = md5_hh(m, f, r, i, d[n + 5], 4, -378558)), f, r, d[n + 8], 11, -2022574463 )), m, f, d[n + 11], 16, 1839030562 )), i, m, d[n + 14], 23, -35309556 )), (r = md5_hh( r, (i = md5_hh( i, (m = md5_hh(m, f, r, i, d[n + 1], 4, -1530992060)), f, r, d[n + 4], 11, 1272893353 )), m, f, d[n + 7], 16, -155497632 )), i, m, d[n + 10], 23, -1094730640 )), (r = md5_hh( r, (i = md5_hh( i, (m = md5_hh(m, f, r, i, d[n + 13], 4, 681279174)), f, r, d[n + 0], 11, -358537222 )), m, f, d[n + 3], 16, -722521979 )), i, m, d[n + 6], 23, 76029189 )), (r = md5_hh( r, (i = md5_hh( i, (m = md5_hh(m, f, r, i, d[n + 9], 4, -640364487)), f, r, d[n + 12], 11, -421815835 )), m, f, d[n + 15], 16, 530742520 )), i, m, d[n + 2], 23, -995338651 )), (r = md5_ii( r, (i = md5_ii( i, (m = md5_ii(m, f, r, i, d[n + 0], 6, -198630844)), f, r, d[n + 7], 10, 1126891415 )), m, f, d[n + 14], 15, -1416354905 )), i, m, d[n + 5], 21, -57434055 )), (r = md5_ii( r, (i = md5_ii( i, (m = md5_ii(m, f, r, i, d[n + 12], 6, 1700485571)), f, r, d[n + 3], 10, -1894986606 )), m, f, d[n + 10], 15, -1051523 )), i, m, d[n + 1], 21, -2054922799 )), (r = md5_ii( r, (i = md5_ii( i, (m = md5_ii(m, f, r, i, d[n + 8], 6, 1873313359)), f, r, d[n + 15], 10, -30611744 )), m, f, d[n + 6], 15, -1560198380 )), i, m, d[n + 13], 21, 1309151649 )), (r = md5_ii( r, (i = md5_ii( i, (m = md5_ii(m, f, r, i, d[n + 4], 6, -145523070)), f, r, d[n + 11], 10, -1120210379 )), m, f, d[n + 2], 15, 718787259 )), i, m, d[n + 9], 21, -343485551 )), (m = safe_add(m, h)), (f = safe_add(f, t)), (r = safe_add(r, g)), (i = safe_add(i, e)); } return Array(m, f, r, i); } function md5_cmn(d, _, m, f, r, i) { return safe_add(bit_rol(safe_add(safe_add(_, d), safe_add(f, i)), r), m); } function md5_ff(d, _, m, f, r, i, n) { return md5_cmn((_ & m) | (~_ & f), d, _, r, i, n); } function md5_gg(d, _, m, f, r, i, n) { return md5_cmn((_ & f) | (m & ~f), d, _, r, i, n); } function md5_hh(d, _, m, f, r, i, n) { return md5_cmn(_ ^ m ^ f, d, _, r, i, n); } function md5_ii(d, _, m, f, r, i, n) { return md5_cmn(m ^ (_ | ~f), d, _, r, i, n); } function safe_add(d, _) { var m = (65535 & d) + (65535 & _); return (((d >> 16) + (_ >> 16) + (m >> 16)) << 16) | (65535 & m); } function bit_rol(d, _) { return (d << _) | (d >>> (32 - _)); }
window.MD5 = () => {
  if (!noteTextarea) return;
  noteTextarea.value = generateMD5(noteTextarea.value);
  updateNoteMetadata();
  showNotification("MD5 Generated!");
};
window.toggleFullscreen = function () {
  const e = document.documentElement;
  !document.fullscreenElement &&
  !document.webkitFullscreenElement &&
  !document.msFullscreenElement
    ? e.requestFullscreen
      ? e.requestFullscreen()
      : e.webkitRequestFullscreen
      ? e.webkitRequestFullscreen()
      : e.msRequestFullscreen && e.msRequestFullscreen()
    : document.exitFullscreen
    ? document.exitFullscreen()
    : document.webkitExitFullscreen
    ? document.webkitExitFullscreen()
    : document.msExitFullscreen && document.msExitFullscreen();
};
function applyFontSize() {
  noteTextarea.style.fontSize = `${fontSize}px`;
  noteBackdrop.style.fontSize = `${fontSize}px`;
  localStorage.setItem("fontSize", fontSize);
}
window.increaseFontSize = () => {
  fontSize = Math.min(fontSize + 2, 42);
  applyFontSize();
  showNotification(`Font size increased to ${fontSize}px`);
};
window.decreaseFontSize = () => {
  fontSize = Math.max(fontSize - 2, 10);
  applyFontSize();
  showNotification(`Font size decreased to ${fontSize}px`);
};
applyFontSize();
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
window.handleFetchSubmit = function () {
  closeModal({
    action: "submit",
    fetchUrl: modalScope && modalScope.fetchUrlInput ? modalScope.fetchUrlInput.value.trim() : ""
  });
};

window.fetchUrlToCurrentNote = async function (url) {
  const API_URL = "https://fetch-300199660511.us-central1.run.app/fetch";
  if (!currentNote || !noteTextarea) {
    showNotification("No note selected or editor missing");
    return;
  }
  if (!url) {
    showNotification("Please enter a URL");
    return;
  }
  showNotification("Fetching...");
  try {
    const resp = await window.fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: url.trim() })
    });
    if (!resp.ok) {
      showNotification("Fetch failed: " + resp.status + " " + resp.statusText);
      return;
    }
    const data = await resp.json();
    const source = data.source_url || data.source || data.html || null;
    if (!source) {
      showNotification("No source returned");
      return;
    }
    const temp = document.createElement("div");
    temp.innerHTML = source || "";
    const html = temp.textContent || temp.innerText || "";
    noteTextarea.value = (noteTextarea.value || "") + "\n\n<!-- appended from fetch -->\n\n" + html;
    currentNote.extension = "html";
    currentNote.lastEdited = new Date().toISOString();
    const idx = notes.findIndex((n) => n.id === currentNote.id);
    if (idx !== -1) {
      notes[idx].extension = currentNote.extension;
      notes[idx].lastEdited = currentNote.lastEdited;
    }
    if (typeof updateNoteMetadata === "function") updateNoteMetadata();
    if (typeof populateNoteList === "function") populateNoteList();
    if (typeof updateDocumentInfo === "function") updateDocumentInfo();
    if (typeof immediatePlainRender === "function") immediatePlainRender();
    if (typeof scheduleUpdate === "function") scheduleUpdate(true);
    showNotification("Fetched and appended. Note extension set to .html");
  } catch (err) {
    showNotification("Request failed: " + (err && err.message ? err.message : err));
  }
};

window.openFetchModal = function () {
  return preserveSelection(async function () {
    if (!currentNote || !noteTextarea) {
      showNotification("No note selected or editor missing");
      return;
    }
    const r = await showModal({
      header: '<div class="modal-title">Fetch Website Source</div>',
      body:
        '<div style="display:flex;flex-direction:column;gap:8px;"><label class="modal-label">URL</label><input type="text" id="fetchUrlInput" placeholder="https://example.com" class="modal-input" /></div>',
      footer: '<button onclick="closeModal()">Cancel</button><button onclick="handleFetchSubmit()" class="modal-btn">Fetch</button>',
      html: true
    });
    if (!r || r.action !== "submit") return;
    const url = (r.fetchUrl || "").trim();
    if (!url) {
      showNotification("Please enter a URL");
      return;
    }
    await window.fetchUrlToCurrentNote(url);
  })();
};

window.optimisejs = preserveSelection(async () => {
  if (!currentNote || !noteTextarea) return;
  try {
    const src = noteTextarea.value || "";
    const len = src.length;
    let i = 0;
    let out = "";
    let inSingle = false;
    let inDouble = false;
    let inTemplate = false;
    let inRegex = false;
    let inLineComment = false;
    let inBlockComment = false;
    let prevChar = "";
    let prevNonWS = "";
    const canStartRegex = (c) => {
      return c === "" || /[=(:,!&|?{};\n\t\0\[\-+*~^<>%]/.test(c);
    };
    const appendChar = (ch) => {
      out += ch;
      if (!/\s/.test(ch)) prevNonWS = ch;
      prevChar = ch;
    };
    while (i < len) {
      const ch = src[i];
      const next = src[i + 1];
      if (inLineComment) {
        if (ch === "\n") {
          inLineComment = false;
          appendChar("\n");
        }
        i++;
        continue;
      }
      if (inBlockComment) {
        if (ch === "*" && next === "/") {
          inBlockComment = false;
          i += 2;
        } else {
          i++;
        }
        continue;
      }
      if (inRegex) {
        if (ch === "\\" && i + 1 < len) {
          appendChar(ch);
          appendChar(src[i + 1]);
          i += 2;
          continue;
        }
        if (ch === "/" && prevChar !== "\\") {
          appendChar(ch);
          i++;
          while (i < len && /[a-zA-Z]/.test(src[i])) {
            appendChar(src[i]);
            i++;
          }
          inRegex = false;
          continue;
        }
        appendChar(ch);
        i++;
        continue;
      }
      if (inSingle || inDouble) {
        if (ch === "\\" && i + 1 < len) {
          appendChar(ch);
          appendChar(src[i + 1]);
          i += 2;
          continue;
        }
        if ((inSingle && ch === "'") || (inDouble && ch === '"')) {
          appendChar(ch);
          if (inSingle) inSingle = false; else inDouble = false;
          i++;
          continue;
        }
        appendChar(ch);
        i++;
        continue;
      }
      if (inTemplate) {
        if (ch === "$" && next === "{") {
          appendChar(ch);
          appendChar("{");
          i += 2;
          let depth = 1;
          while (i < len && depth > 0) {
            const c = src[i], n = src[i + 1];
            if (c === "/" && n === "/") {
              i += 2;
              while (i < len && src[i] !== "\n") i++;
              continue;
            }
            if (c === "/" && n === "*") {
              i += 2;
              while (i + 1 < len && !(src[i] === "*" && src[i + 1] === "/")) i++;
              if (i + 1 < len) i += 2;
              continue;
            }
            if (c === "'" || c === '"') {
              const q = c;
              appendChar(c); i++;
              while (i < len) {
                const cc = src[i];
                appendChar(cc);
                if (cc === "\\" && i + 1 < len) { appendChar(src[i + 1]); i += 2; continue; }
                i++;
                if (cc === q) break;
              }
              continue;
            }
            if (c === "/") {
              const prev = (out && out.slice(-1)) || prevNonWS || "";
              if (canStartRegex(prev) && src[i + 1] !== "/" && src[i + 1] !== "*") {
                appendChar("/");
                i++;
                while (i < len) {
                  const rc = src[i];
                  appendChar(rc);
                  if (rc === "\\" && i + 1 < len) { appendChar(src[i + 1]); i += 2; continue; }
                  if (rc === "/") { i++; break; }
                  i++;
                }
                while (i < len && /[a-zA-Z]/.test(src[i])) { appendChar(src[i]); i++; }
                continue;
              }
            }
            if (c === "{") { appendChar(c); i++; depth++; continue; }
            if (c === "}") { appendChar(c); i++; depth--; continue; }
            appendChar(c); i++;
          }
          continue;
        }
        if (ch === "`" && prevChar !== "\\") {
          appendChar(ch);
          inTemplate = false;
          i++;
          continue;
        }
        appendChar(ch);
        i++;
        continue;
      }
      if (ch === "/" && next === "/") {
        if (prevNonWS === ":") {
          appendChar(ch);
          i++;
          continue;
        } else {
          inLineComment = true;
          i += 2;
          continue;
        }
      }
      if (ch === "/" && next === "*") {
        inBlockComment = true;
        i += 2;
        continue;
      }
      if (ch === "'") { inSingle = true; appendChar(ch); i++; continue; }
      if (ch === '"') { inDouble = true; appendChar(ch); i++; continue; }
      if (ch === "`") { inTemplate = true; appendChar(ch); i++; continue; }
      if (ch === "/") {
        if (next !== "/" && next !== "*" && canStartRegex(prevNonWS)) {
          inRegex = true;
          appendChar(ch);
          i++;
          continue;
        } else {
          appendChar(ch);
          i++;
          continue;
        }
      }
      appendChar(ch);
      i++;
    }
    const cleaned = out
      .replace(/\r\n?/g, "\n")
      .split("\n")
      .map(line => line.replace(/[ \t]+$/g, ""))
      .filter(line => line.trim() !== "")
      .join("\n") + "\n";
    noteTextarea.value = cleaned;
    updateNoteMetadata();
    showNotification("Comments removed and code compacted.");
  } catch (err) {
    console.error("removeJsCommentsAndCompact error:", err);
    showNotification("Failed to remove comments");
  }
});

window.optimisecss = preserveSelection(async () => {
  if (!currentNote || !noteTextarea) return;
  try {
    let css = noteTextarea.value || "";
    css = css.replace(/\/\*[\s\S]*?\*\//g, "");
    css = css.replace(/<!--[\s\S]*?-->/g, "");
    css = css.replace(/(^|[^:])\/\/.*$/gm, (m, p1) => p1);
    css = css.replace(/\r\n?/g, "\n");
    function parseNodes(text, start = 0, end = text.length) {
      const nodes = [];
      let i = start;
      const skipWhitespace = () => { while (i < end && /\s/.test(text[i])) i++; };
      while (i < end) {
        skipWhitespace();
        if (i >= end) break;
        if (text[i] === "@") {
          const atStart = i;
          while (i < end && text[i] !== "{" && text[i] !== ";") i++;
          const header = text.slice(atStart, i).trim();
          if (i < end && text[i] === ";") {
            i++;
            nodes.push({ type: "prelude", text: header + ";" });
            continue;
          }
          if (i >= end || text[i] !== "{") {
            nodes.push({ type: "prelude", text: text.slice(atStart).trim() });
            break;
          }
          const braceOpen = i;
          i++;
          let depth = 1;
          const bodyStart = i;
          while (i < end && depth > 0) {
            if (text[i] === "{") depth++;
            else if (text[i] === "}") depth--;
            i++;
          }
          if (depth !== 0) {
            nodes.push({ type: "prelude", text: text.slice(atStart).trim() });
            break;
          }
          const bodyEnd = i - 1;
          const params = header.replace(/^\@/, "").trim();
          const inner = parseNodes(text, bodyStart, bodyEnd);
          nodes.push({ type: "atrule", header: header, params: params, children: inner });
          continue;
        }
        const nextBrace = text.indexOf("{", i);
        if (nextBrace === -1) {
          const remainder = text.slice(i).trim();
          if (remainder) nodes.push({ type: "prelude", text: remainder });
          break;
        }
        const selectorText = text.slice(i, nextBrace).trim();
        let j = nextBrace + 1;
        let depth = 1;
        while (j < end && depth > 0) {
          if (text[j] === "{") depth++;
          else if (text[j] === "}") depth--;
          j++;
        }
        if (depth !== 0) {
          const remainder = text.slice(i).trim();
          nodes.push({ type: "prelude", text: remainder });
          break;
        }
        const bodyText = text.slice(nextBrace + 1, j - 1);
        const declParts = bodyText.split(";").map(s => s.trim()).filter(Boolean);
        const decls = [];
        for (const p of declParts) {
          const colon = p.indexOf(":");
          if (colon === -1) continue;
          const prop = p.slice(0, colon).trim();
          const val = p.slice(colon + 1).trim();
          if (prop) decls.push({ prop, val });
        }
        nodes.push({ type: "rule", selectorText: selectorText, decls });
        i = j;
      }
      return nodes;
    }
    const MAX_PAIRWISE = 120;
    function processContainer(nodes) {
      const preludeNodes = [];
      const ruleNodes = [];
      const atruleNodes = [];
      for (const node of nodes) {
        if (node.type === "atrule") {
          node.children = processContainer(node.children);
          atruleNodes.push(node);
        } else if (node.type === "rule") {
          ruleNodes.push(node);
        } else {
          preludeNodes.push(node);
        }
      }
      const selectorOccs = new Map();
      let ruleCounter = 0;
      for (const rn of ruleNodes) {
        const sls = rn.selectorText.split(",").map(s => s.trim()).filter(Boolean);
        for (const s of sls) {
          if (!selectorOccs.has(s)) selectorOccs.set(s, { occurrences: [], firstSeen: ruleCounter });
          selectorOccs.get(s).occurrences.push({ decls: rn.decls, order: ruleCounter++ });
        }
        if (sls.length === 0) ruleCounter++;
      }
      const selectorMerged = new Map();
      for (const [sel, info] of selectorOccs.entries()) {
        const occs = info.occurrences;
        const seen = new Set();
        const merged = [];
        for (let k = occs.length - 1; k >= 0; k--) {
          const decls = occs[k].decls;
          for (const d of decls) {
            if (seen.has(d.prop)) continue;
            seen.add(d.prop);
            merged.push({ prop: d.prop, val: d.val, order: occs[k].order });
          }
        }
        selectorMerged.set(sel, { mergedDecls: merged, firstSeen: info.firstSeen });
      }
      const sigMap = new Map();
      for (const [sel, data] of selectorMerged.entries()) {
        const sig = data.mergedDecls.map(d => d.prop + ":" + d.val).join(";;");
        if (!sigMap.has(sig)) sigMap.set(sig, []);
        sigMap.get(sig).push(sel);
      }
      let blocks = [];
      for (const [sig, sels] of sigMap.entries()) {
        if (!sels || sels.length === 0) continue;
        const decls = selectorMerged.get(sels[0]).mergedDecls.slice();
        const orderKey = Math.min(...sels.map(s => selectorMerged.get(s).firstSeen || 0));
        blocks.push({ selectors: sels.slice(), decls, orderKey });
      }
      const allSels = Array.from(selectorMerged.keys());
      if (allSels.length <= MAX_PAIRWISE) {
        const selMap = new Map();
        for (const s of allSels) {
          const arr = selectorMerged.get(s).mergedDecls || [];
          const m = new Map(arr.map(d => [d.prop, d.val]));
          selMap.set(s, m);
        }
        const blockLen = (sels, decls) => {
          const selText = sels.join(", ");
          let body = "";
          for (const d of decls) body += d.prop + ": " + d.val + ";";
          return selText.length + 3 + body.length + 1;
        };
        for (let a = 0; a < allSels.length; a++) {
          for (let b = a + 1; b < allSels.length; b++) {
            const sa = allSels[a], sb = allSels[b];
            const ma = selMap.get(sa);
            const mb = selMap.get(sb);
            if (!ma || !mb) continue;
            const common = [];
            for (const [p, v] of ma.entries()) {
              if (mb.has(p) && mb.get(p) === v) common.push({ prop: p, val: v });
            }
            if (common.length === 0) continue;
            const remainderA = [];
            const remainderB = [];
            for (const [p, v] of ma.entries()) if (!mb.has(p) || mb.get(p) !== v) remainderA.push({ prop: p, val: v });
            for (const [p, v] of mb.entries()) if (!ma.has(p) || ma.get(p) !== v) remainderB.push({ prop: p, val: v });
            const before = blockLen([sa], Array.from(ma.entries()).map(([p, v]) => ({ prop: p, val: v })))
                         + blockLen([sb], Array.from(mb.entries()).map(([p, v]) => ({ prop: p, val: v })));
            const after = blockLen([sa, sb], common)
                        + (remainderA.length ? blockLen([sa], remainderA) : 0)
                        + (remainderB.length ? blockLen([sb], remainderB) : 0);
            if (after < before) {
              for (const c of common) {
                ma.delete(c.prop);
                mb.delete(c.prop);
              }
              selMap.set(sa, ma);
              selMap.set(sb, mb);
              const rebuild = (sel, mapObj) => {
                const orig = selectorMerged.get(sel).mergedDecls || [];
                const arr = [];
                for (const od of orig) if (mapObj.has(od.prop)) arr.push({ prop: od.prop, val: mapObj.get(od.prop) });
                return arr;
              };
              selectorMerged.get(sa).mergedDecls = rebuild(sa, ma);
              selectorMerged.get(sb).mergedDecls = rebuild(sb, mb);
              const commonSig = common.map(d => d.prop + ":" + d.val).join(";;");
              let found = blocks.find(bk => bk.decls.map(dd => dd.prop + ":" + dd.val).join(";;") === commonSig);
              if (!found) {
                blocks.push({ selectors: [sa, sb], decls: common.slice(), orderKey: Math.min(selectorMerged.get(sa).firstSeen || 0, selectorMerged.get(sb).firstSeen || 0) });
              } else {
                for (const s of [sa, sb]) if (!found.selectors.includes(s)) found.selectors.push(s);
              }
            }
          }
        }
        const rebuilt = new Map();
        for (const [sel, data] of selectorMerged.entries()) {
          const decls = data.mergedDecls || [];
          if (!decls.length) continue;
          const sig = decls.map(d => d.prop + ":" + d.val).join(";;");
          if (!rebuilt.has(sig)) rebuilt.set(sig, { selectors: [], decls: decls.slice(), orderKey: data.firstSeen || 0 });
          rebuilt.get(sig).selectors.push(sel);
        }
        for (const blk of blocks) {
          const sig = blk.decls.map(d => d.prop + ":" + d.val).join(";;");
          if (!rebuilt.has(sig)) rebuilt.set(sig, { selectors: blk.selectors.slice(), decls: blk.decls.slice(), orderKey: blk.orderKey || 0 });
          else {
            const t = rebuilt.get(sig);
            for (const s of blk.selectors) if (!t.selectors.includes(s)) t.selectors.push(s);
            t.orderKey = Math.min(t.orderKey, blk.orderKey || 0);
          }
        }
        blocks = Array.from(rebuilt.values());
        blocks.sort((a, b) => (a.orderKey || 0) - (b.orderKey || 0));
      }
      const out = [];
      for (const p of preludeNodes) out.push(p);
      for (const ar of atruleNodes) out.push(ar);
      for (const blk of blocks) {
        out.push({ type: "rulegroup", selectors: blk.selectors.slice(), decls: blk.decls.slice() });
      }
      return out;
    }
    const rootNodes = parseNodes(css, 0, css.length);
    const processed = processContainer(rootNodes);
    function serialize(nodes) {
      const lines = [];
      for (const node of nodes) {
        if (!node) continue;
        if (node.type === "prelude") {
          lines.push(node.text);
          continue;
        }
        if (node.type === "atrule") {
          lines.push(node.header + " {");
          const inner = serialize(node.children || []);
          if (inner) {
            lines.push(inner.trim());
          }
          lines.push("}");
          continue;
        }
        if (node.type === "rulegroup") {
          lines.push(node.selectors.join(", ") + " {");
          for (const d of node.decls) {
            lines.push(d.prop + ": " + d.val + ";");
          }
          lines.push("}");
          continue;
        }
        if (node.text) lines.push(node.text);
      }
      return lines.join("\n");
    }
    const finalCss = serialize(processed).replace(/\n{2,}/g, "\n").trim() + (processed.length ? "\n" : "");
    noteTextarea.value = finalCss;
    updateNoteMetadata();
    showNotification("CSS optimized including @-rules and @media blocks.");
  } catch (err) {
    console.error("optimizeCssWithAtRules error:", err);
    showNotification("Failed to optimize CSS");
  }
});

window.minifyjs = preserveSelection(async () => {
  if (!currentNote || !noteTextarea) return;
  const originalShowNotification = window.showNotification;
  window.showNotification = () => {};
  try {
    if (typeof window.optimisejs === "function") {
      await window.optimisejs();
    } else {
      throw new Error("optimisejs is not defined");
    }
    noteTextarea.value = noteTextarea.value
      .replace(/\r\n|\r|\n/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  } catch (err) {
    console.error("minifyjs error:", err);
  } finally {
    window.showNotification = originalShowNotification;
  }
  showNotification("Minified JS");
});

window.minifycss = preserveSelection(async () => {
  if (!currentNote || !noteTextarea) return;
  const originalShowNotification = window.showNotification;
  window.showNotification = () => {};
  try {
    if (typeof window.optimisecss === "function") {
      await window.optimisecss();
    } else {
      throw new Error("optimisecss is not defined");
    }
    noteTextarea.value = noteTextarea.value
      .replace(/\r\n|\r|\n/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  } catch (err) {
    console.error("minifycss error:", err);
  } finally {
    window.showNotification = originalShowNotification;
  }
  showNotification("Minified CSS");
});

(function () {
  const hamburger = document.getElementById('secondary-sidebar-button');
  const overlay = document.getElementById('secondary-sidebar-overlay');
  const sidebar = document.getElementById('secondary-sidebar');
  const productCard = document.getElementById('secondary-sidebar-card');
  const cardScroll = document.getElementById('secondary-sidebar-scroll');
  const focusableSelector = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';
  let lastFocused = null;
  
  function getTransitionMs() {
    const val = getComputedStyle(document.documentElement).getPropertyValue('--transition-duration').trim();
    return Math.round((parseFloat(val) || 0.32) * 1000);
  }
  
 function openSidebar() {
  sidebar.classList.add('open');
  sidebar.setAttribute('aria-hidden', 'false');
  hamburger.setAttribute('aria-expanded', 'true');
  hamburger.innerHTML = '<i class="material-symbols-rounded">close</i>';
}

function closeSidebar() {
  sidebar.classList.remove('open');
  sidebar.setAttribute('aria-hidden', 'true');
  hamburger.setAttribute('aria-expanded', 'false');
  hamburger.innerHTML = '<i class="material-symbols-rounded">view_cozy</i>';
}

  hamburger.addEventListener('click', (e) => {
    e.stopPropagation();
    sidebar.classList.contains('open') ? closeSidebar() : openSidebar();
  });

  sidebar.addEventListener('click', (e) => e.stopPropagation());

  document.addEventListener('click', (e) => {
    if (!sidebar.classList.contains('open')) return;
    if (!sidebar.contains(e.target) && !hamburger.contains(e.target)) {
      closeSidebar();
    }
  });
 
  function collapse(elem, done) {
    elem.style.overflow = 'hidden';
    elem.style.height = elem.scrollHeight + 'px';
    elem.getBoundingClientRect();
    requestAnimationFrame(() => { elem.style.height = '0'; });
    setTimeout(() => {
      elem.style.height = '';
      elem.setAttribute('aria-hidden','true');
      elem.style.overflow = 'hidden';
      if (done) done();
    }, getTransitionMs() + 20);
  }
  
  function expand(elem, done) {
    elem.style.height = '0';
    elem.setAttribute('aria-hidden','false');
    elem.getBoundingClientRect();
    const target = elem.scrollHeight + 'px';
    requestAnimationFrame(() => { elem.style.height = target; });
    setTimeout(() => {
      elem.style.height = 'auto';
      elem.style.overflow = 'auto';
      if (done) done();
    }, getTransitionMs() + 20);
  }
  
  function buildTopLevel(container, dataContainer, depth = 0) {
    const baseLeft = 12;
    const indentUnit = 20;
    const indent = depth * indentUnit;
    const totalLeft = baseLeft + indent;
    
    Array.from(dataContainer.children).forEach(dataDiv => {
      const isCollapse = dataDiv.classList.contains('collapse');
      const text = dataDiv.getAttribute('text');
      const icon = dataDiv.getAttribute('icon');
      const vlineLeft = (totalLeft + 7) + 'px';
      
      const group = document.createElement('div');
      group.className = `secondary-sidebar-category-group${isCollapse && dataDiv.classList.contains('open') ? ' open' : ''}`;
      
      const header = document.createElement('button');
      header.type = 'button';
      header.className = 'secondary-sidebar-category-header';
      header.style.paddingLeft = totalLeft + 'px';
      
      const left = document.createElement('span');
      left.className = 'secondary-sidebar-left';
      
      const i = document.createElement('span');
      i.className = 'material-symbols-rounded';
      i.textContent = icon;
      
      const l = document.createElement('span');
      l.className = 'secondary-sidebar-label';
      l.textContent = text;
      
      left.append(i, l);
      header.append(left);
      
      if (isCollapse) {
        group.classList.add('has-line');
        group.style.setProperty('--vline-left', vlineLeft);
        
        const ch = document.createElement('span');
        ch.className = 'material-symbols-rounded secondary-sidebar-chevron';
        ch.textContent = 'expand_more';
        header.append(ch);
        
        header.onclick = () => toggleGroup(header);
        header.setAttribute('aria-expanded', dataDiv.classList.contains('open') ? 'true' : 'false');
        
        const content = document.createElement('div');
        content.className = 'secondary-sidebar-category-content';
        content.setAttribute('aria-hidden', dataDiv.classList.contains('open') ? 'false' : 'true');
        
        group.append(header, content);
        buildSubLevel(content, dataDiv, depth + 1);
      } else {
        const onclickAttr = dataDiv.getAttribute('onclick');
        if (onclickAttr) {
          header.setAttribute('onclick', onclickAttr);
        }
        group.append(header);
      }
      
      container.append(group);
    });
  }
  
  function buildSubLevel(container, dataContainer, depth) {
    const baseLeft = 12;
    const indentUnit = 20;
    const indent = depth * indentUnit;
    const totalLeft = baseLeft + indent;
    
    Array.from(dataContainer.children).forEach(dataDiv => {
      const isCollapse = dataDiv.classList.contains('collapse');
      const text = dataDiv.getAttribute('text');
      const icon = dataDiv.getAttribute('icon');
      const vlineLeft = (totalLeft + 7) + 'px';
      
      if (isCollapse) {
        const group = document.createElement('div');
        group.className = `secondary-sidebar-nav-item-group${dataDiv.classList.contains('open') ? ' open' : ''}`;
        group.classList.add('has-line');
        group.style.setProperty('--vline-left', vlineLeft);
        
        const toggle = document.createElement('button');
        toggle.type = 'button';
        toggle.className = 'secondary-sidebar-nav-toggle';
        toggle.style.paddingLeft = totalLeft + 'px';
        
        const left = document.createElement('span');
        left.className = 'secondary-sidebar-left';
        
        const i = document.createElement('span');
        i.className = 'material-symbols-rounded';
        i.textContent = icon;
        
        const l = document.createElement('span');
        l.className = 'secondary-sidebar-label';
        l.textContent = text;
        
        left.append(i, l);
        toggle.append(left);
        
        const ch = document.createElement('span');
        ch.className = 'material-symbols-rounded secondary-sidebar-chevron';
        ch.textContent = 'expand_more';
        toggle.append(ch);
        
        toggle.onclick = () => toggleGroup(toggle);
        toggle.setAttribute('aria-expanded', dataDiv.classList.contains('open') ? 'true' : 'false');
        
        const sublist = document.createElement('div');
        sublist.className = 'secondary-sidebar-sub-list';
        sublist.setAttribute('aria-hidden', dataDiv.classList.contains('open') ? 'false' : 'true');
        
        group.append(toggle, sublist);
        container.append(group);
        buildSubLevel(sublist, dataDiv, depth + 1);
      } else {
        const item = document.createElement('button');
        item.type = 'button';
        item.className = 'secondary-sidebar-sub-item';
        item.style.paddingLeft = totalLeft + 'px';
        
        const onclickAttr = dataDiv.getAttribute('onclick');
        if (onclickAttr) {
          item.setAttribute('onclick', onclickAttr);
        }
        const i = document.createElement('span');
        i.className = 'material-symbols-rounded';
        i.textContent = icon;
        
        item.append(i, document.createTextNode(text));
        container.append(item);
      }
    });
  }
  
  const products = cardScroll.querySelector('.secondary-sidebar-products');
  if (products) {
    buildTopLevel(cardScroll, products, 0);
    products.remove();

    document.querySelectorAll('.secondary-sidebar-category-group.has-line, .secondary-sidebar-nav-item-group.has-line').forEach(group => {
      const header = group.querySelector('.secondary-sidebar-category-header, .secondary-sidebar-nav-toggle');
      if (header) {
        header.offsetHeight;
        const headerHeight = header.offsetHeight;
        group.style.setProperty('--line-top', headerHeight + 'px');
      }
    });
  }
  
  window.toggleGroup = function(btn) {
    const group = btn.closest('.secondary-sidebar-category-group, .secondary-sidebar-nav-item-group');
    if (!group) return;
    
    const content = group.querySelector('.secondary-sidebar-category-content, .secondary-sidebar-sub-list');
    if (!content) return;
    
    const isOpen = group.classList.contains('open');
    
    if (group.classList.contains('secondary-sidebar-category-group')) {
      if (!isOpen) {
        const others = Array.from(document.querySelectorAll('.secondary-sidebar-category-group.open'))
          .filter(g => g !== group);
        others.forEach(o => {
          const c = o.querySelector('.secondary-sidebar-category-content');
          const b = o.querySelector('.secondary-sidebar-category-header');
          o.classList.remove('open');
          if (b) b.setAttribute('aria-expanded','false');
          if (c) collapse(c);
        });
        group.classList.add('open');
        btn.setAttribute('aria-expanded','true');
        expand(content);
      } else {
        group.classList.remove('open');
        btn.setAttribute('aria-expanded','false');
        collapse(content);
      }
      return;
    }
    
    const parent = group.parentElement.closest('.secondary-sidebar-nav-item-group, .secondary-sidebar-category-group');
    if (parent) {
      const siblings = Array.from(parent.querySelectorAll('.secondary-sidebar-nav-item-group'));
      siblings.forEach(sib => {
        if (sib !== group && sib.classList.contains('open')) {
          const sc = sib.querySelector('.secondary-sidebar-sub-list');
          const sb = sib.querySelector('.secondary-sidebar-nav-toggle');
          sib.classList.remove('open');
          if (sb) sb.setAttribute('aria-expanded','false');
          if (sc) collapse(sc);
        }
      });
    }
    
    if (!isOpen) {
      group.classList.add('open');
      btn.setAttribute('aria-expanded','true');
      expand(content);
    } else {
      group.classList.remove('open');
      btn.setAttribute('aria-expanded','false');
      collapse(content);
    }
  };
  
  document.querySelectorAll('.secondary-sidebar-category-group.open, .secondary-sidebar-nav-item-group.open').forEach(g => {
    const content = g.querySelector('.secondary-sidebar-category-content, .secondary-sidebar-sub-list');
    if (content) {
      content.style.height = 'auto';
      content.style.overflow = 'auto';
      content.removeAttribute('aria-hidden');
      const btn = g.querySelector('.secondary-sidebar-category-header, .secondary-sidebar-nav-toggle');
      if (btn) btn.setAttribute('aria-expanded','true');
    }
  });
})();

(function() {  
  const container = document.querySelector('.secondary-sidebar-desc .info-name');  
  
  if (!container) return;  
  
  const userDisplayWrapper = document.createElement('div');  
  userDisplayWrapper.id = 'user-display-wrapper';  
  userDisplayWrapper.style.cssText = `  
    width: 100% !important;  
    display: flex !important;  
    justify-content: center !important;  
    align-items: center !important;  
    text-align: center !important;  
    margin-bottom: 8px !important;  
  `;  
  
  function capitalizeName(name) {  
    return name  
      .split(' ')  
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))  
      .join(' ');  
  }  
  
  function renderUserDisplay(user) {  
    userDisplayWrapper.innerHTML = user  
      ? `<div style="display:flex !important; align-items:center !important; gap:8px !important;">  
           <img src="${user.photoURL || 'default-profile.png'}"   
                alt="Profile Picture"   
                style="width:27px !important; height:27px !important; border-radius:50% !important; object-fit:cover !important;">  
         </div>`  
      : `<div style="display:flex !important; align-items:center !important; gap:8px !important; font-size:14px !important; color:#cacaca !important;">  
           <span class="material-symbols-rounded" style="font-size:24px !important;">star_shine</span>  
         </div>`;  
  }  
  container.parentNode.insertBefore(userDisplayWrapper, container);  
  renderUserDisplay(auth.currentUser);  
  auth.onAuthStateChanged(user => {  
    renderUserDisplay(user);  
  });  
})();  

window.cipher = async function () {
  const ITERATIONS = 150000;
  const ROUNDS = 64;
  const SALT_BYTES = 16;
  const IV_BYTES = 12;
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  function concatUint8(...parts){
    const total = parts.reduce((s,p)=>s+p.length,0);
    const out = new Uint8Array(total);
    let offset=0;
    for(const p of parts){ out.set(p, offset); offset += p.length; }
    return out;
  }
  function uint32ToBE(n){
    const b = new Uint8Array(4);
    new DataView(b.buffer).setUint32(0, n, false);
    return b;
  }
  function beToUint32(buf){
    return new DataView(buf.buffer).getUint32(0, false);
  }
  function repeatToLength(src, len){
    if(len===0) return new Uint8Array(0);
    const out = new Uint8Array(len);
    let i=0;
    while(i<len){
      const take = Math.min(src.length, len-i);
      out.set(src.subarray(0, take), i);
      i += take;
    }
    return out;
  }
  function rotateLeft(u8, r){
    const n = u8.length;
    if(n===0) return u8;
    r = r % n;
    if(r===0) return u8;
    return concatUint8(u8.subarray(r), u8.subarray(0, r));
  }
  function rotateRight(u8, r){
    const n = u8.length;
    if(n===0) return u8;
    r = r % n;
    if(r===0) return u8;
    return concatUint8(u8.subarray(n-r), u8.subarray(0, n-r));
  }
  function toBase64Url(u8){
    let s='';
    const chunk=0x8000;
    for(let i=0;i<u8.length;i+=chunk) s+=String.fromCharCode.apply(null, u8.subarray(i, i+chunk));
    const b64 = btoa(s);
    return b64.replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
  }
  function fromBase64Url(s){
    s = s.replace(/-/g,'+').replace(/_/g,'/');
    while(s.length % 4) s += '=';
    const str = atob(s);
    const arr = new Uint8Array(str.length);
    for(let i=0;i<str.length;i++) arr[i] = str.charCodeAt(i);
    return arr;
  }
  async function deriveBitsPBKDF2(password, salt, bits = 512){
    const passKey = await crypto.subtle.importKey('raw', encoder.encode(password), {name:'PBKDF2'}, false, ['deriveBits']);
    const buf = await crypto.subtle.deriveBits({name:'PBKDF2', salt, iterations:ITERATIONS, hash:'SHA-256'}, passKey, bits);
    return new Uint8Array(buf);
  }
  async function deriveKeysFromTwoPasswords(pw1, pw2, salt1, salt2){
    const bitsA = await deriveBitsPBKDF2(pw1, salt1, 512);
    const bitsB = await deriveBitsPBKDF2(pw2, salt2, 512);
    const combined = new Uint8Array(bitsA.length);
    for(let i=0;i<combined.length;i++) combined[i] = bitsA[i] ^ bitsB[i];
    const aesRaw = combined.subarray(0,32);
    const hmacRaw = combined.subarray(32,64);
    const aesKey = await crypto.subtle.importKey('raw', aesRaw, {name:'AES-GCM'}, false, ['encrypt','decrypt']);
    const hmacKey = await crypto.subtle.importKey('raw', hmacRaw, {name:'HMAC', hash:'SHA-256'}, false, ['sign']);
    return { aesKey, hmacKey };
  }
  async function roundHMAC(hmacKey, roundIndex){
    const msg = concatUint8(encoder.encode('round'), uint32ToBE(roundIndex));
    const sig = await crypto.subtle.sign('HMAC', hmacKey, msg);
    return new Uint8Array(sig);
  }
  function sumBytes(u8){
    let s=0;
    for(let i=0;i<u8.length;i++) s += u8[i];
    return s;
  }
  async function encryptText(plainText, pw1, pw2){
    const salt1 = crypto.getRandomValues(new Uint8Array(SALT_BYTES));
    const salt2 = crypto.getRandomValues(new Uint8Array(SALT_BYTES));
    const iv = crypto.getRandomValues(new Uint8Array(IV_BYTES));
    const { aesKey, hmacKey } = await deriveKeysFromTwoPasswords(pw1, pw2, salt1, salt2);
    const data = encoder.encode(plainText);
    const stateHeader = uint32ToBE(data.length);
    let state = concatUint8(stateHeader, data);
    for(let r=0;r<ROUNDS;r++){
      const rk = await roundHMAC(hmacKey, r);
      const ks = repeatToLength(concatUint8(rk, iv), state.length);
      for(let i=0;i<state.length;i++) state[i] ^= ks[i];
      const rot = sumBytes(rk) % (state.length || 1);
      state = rotateLeft(state, rot);
    }
    const encrypted = new Uint8Array(await crypto.subtle.encrypt({name:'AES-GCM', iv}, aesKey, state.buffer));
    const blob = concatUint8(salt1, salt2, iv, encrypted);
    return toBase64Url(blob);
  }
  function randomFake27(){
    const b = crypto.getRandomValues(new Uint8Array(20));
    let s='';
    const chunk=0x8000;
    for(let i=0;i<b.length;i+=chunk) s+=String.fromCharCode.apply(null, b.subarray(i, i+chunk));
    const b64 = btoa(s).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
    if(b64.length >= 27) return b64.slice(0,27);
    while(b64.length < 27) b64 += '-';
    return b64.slice(0,27);
  }
  async function decryptText(token, pw1, pw2){
    try{
      const blob = fromBase64Url(token);
      if(blob.length < SALT_BYTES + SALT_BYTES + IV_BYTES + 1) return randomFake27();
      const salt1 = blob.subarray(0, SALT_BYTES);
      const salt2 = blob.subarray(SALT_BYTES, SALT_BYTES + SALT_BYTES);
      const iv = blob.subarray(SALT_BYTES + SALT_BYTES, SALT_BYTES + SALT_BYTES + IV_BYTES);
      const ciphertext = blob.subarray(SALT_BYTES + SALT_BYTES + IV_BYTES);
      const { aesKey, hmacKey } = await deriveKeysFromTwoPasswords(pw1, pw2, salt1, salt2);
      let state;
      try{
        const plainBuf = await crypto.subtle.decrypt({name:'AES-GCM', iv}, aesKey, ciphertext);
        state = new Uint8Array(plainBuf);
      }catch(e){
        return randomFake27();
      }
      for(let r=ROUNDS-1;r>=0;r--){
        const rk = await roundHMAC(hmacKey, r);
        const rot = sumBytes(rk) % (state.length || 1);
        state = rotateRight(state, rot);
        const ks = repeatToLength(concatUint8(rk, iv), state.length);
        for(let i=0;i<state.length;i++) state[i] ^= ks[i];
      }
      if(state.length < 4) return randomFake27();
      const len = beToUint32(state.subarray(0,4));
      const payload = state.subarray(4, 4 + len);
      return decoder.decode(payload);
    }catch(e){
      return randomFake27();
    }
  }

  window.cipherSubmit = function(){
    const p1 = (document.getElementById('cipher_pw1') || {}).value || '';
    const p2 = (document.getElementById('cipher_pw2') || {}).value || '';
    const encBtn = document.getElementById('cipher_mode_encrypt');
    const mode = encBtn && encBtn.classList.contains('active') ? 'encrypt' : 'decrypt';
    closeModal({ action: 'submit', pw1: p1, pw2: p2, mode });
  };

  window._cipherToggleMode = function(mode){
    const encBtn = document.getElementById('cipher_mode_encrypt');
    const decBtn = document.getElementById('cipher_mode_decrypt');
    if(!encBtn || !decBtn) return;
    if(mode === 'encrypt'){
      encBtn.classList.add('active');
      decBtn.classList.remove('active');
    } else {
      decBtn.classList.add('active');
      encBtn.classList.remove('active');
    }
  };

  const bodyHtml = `
  <div>
  <label class="modal-label">Enter Passkeys</label>
  </div>
  <div>
  <input id="cipher_pw1" placeholder="Key I">
  </div>
<div>
<input id="cipher_pw2" placeholder="Key II">  
</div>

<div style="display: flex; gap: 8px; margin-top: 4px;">
<button type="button" id="cipher_mode_encrypt" class="modal-btn active" onclick="window._cipherToggleMode('encrypt')">Encrypt</button>
<button type="button" id="cipher_mode_decrypt" class="modal-btn" onclick="window._cipherToggleMode('decrypt')">Decrypt</button>
</div>
`;

  const footerHtml = `<button onclick="closeModal()">Cancel</button><button onclick="window.cipherSubmit()" class="modal-btn">Cipher</button>`;

  const r = await showModal({
    header: `<div class="modal-title">Cipher</div>`,
    body: bodyHtml,
    footer: footerHtml
  });

  if(!r || r.action !== 'submit') return;
  const pw1 = r.pw1 || '';
  const pw2 = r.pw2 || '';
  const mode = r.mode || 'encrypt';
  const textareaEl = window.noteTextarea || document.querySelector('textarea');
  if(!textareaEl) return;
  const text = textareaEl.value || '';
  if(!pw1 || !pw2){
    showNotification && showNotification('Both passwords are required');
    return;
  }
  try{
    if(mode === 'encrypt'){
      const token = await encryptText(text, pw1, pw2);
      textareaEl.value = token;
      showNotification('Text encrypted');
    }else{
      const out = await decryptText(text, pw1, pw2);
      textareaEl.value = out;
      showNotification('Text decrypted');
    }
    typeof updateNoteMetadata === 'function' && updateNoteMetadata();
  }catch(err){
    textareaEl.value = randomFake27();
    showNotification('Text decrypted');
  }
};
