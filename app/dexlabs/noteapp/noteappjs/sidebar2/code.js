var generateMD5 = function (d) { var r = M(V(Y(X(d), 8 * d.length))); return r.toLowerCase(); }; function M(d) { for (var _, m = "0123456789ABCDEF", f = "", r = 0; r < d.length; r++) (_ = d.charCodeAt(r)), (f += m.charAt((_ >>> 4) & 15) + m.charAt(15 & _)); return f; } function X(d) { for (var _ = Array(d.length >> 2), m = 0; m < _.length; m++) _[m] = 0; for (m = 0; m < 8 * d.length; m += 8) _[m >> 5] |= (255 & d.charCodeAt(m / 8)) << m % 32; return _; } function V(d) { for (var _ = "", m = 0; m < 32 * d.length; m += 8) _ += String.fromCharCode((d[m >> 5] >>> m % 32) & 255); return _; } function Y(d, _) { (d[_ >> 5] |= 128 << _ % 32), (d[14 + (((_ + 64) >>> 9) << 4)] = _); for ( var m = 1732584193, f = -271733879, r = -1732584194, i = 271733878, n = 0; n < d.length; n += 16 ) { var h = m, t = f, g = r, e = i; (f = md5_ii( (f = md5_ii( (f = md5_ii( (f = md5_ii( (f = md5_hh( (f = md5_hh( (f = md5_hh( (f = md5_hh( (f = md5_gg( (f = md5_gg( (f = md5_gg( (f = md5_gg( (f = md5_ff( (f = md5_ff( (f = md5_ff( (f = md5_ff( f, (r = md5_ff( r, (i = md5_ff( i, (m = md5_ff( m, f, r, i, d[n + 0], 7, -680876936 )), f, r, d[n + 1], 12, -389564586 )), m, f, d[n + 2], 17, 606105819 )), i, m, d[n + 3], 22, -1044525330 )), (r = md5_ff( r, (i = md5_ff( i, (m = md5_ff( m, f, r, i, d[n + 4], 7, -176418897 )), f, r, d[n + 5], 12, 1200080426 )), m, f, d[n + 6], 17, -1473231341 )), i, m, d[n + 7], 22, -45705983 )), (r = md5_ff( r, (i = md5_ff( i, (m = md5_ff( m, f, r, i, d[n + 8], 7, 1770035416 )), f, r, d[n + 9], 12, -1958414417 )), m, f, d[n + 10], 17, -42063 )), i, m, d[n + 11], 22, -1990404162 )), (r = md5_ff( r, (i = md5_ff( i, (m = md5_ff( m, f, r, i, d[n + 12], 7, 1804603682 )), f, r, d[n + 13], 12, -40341101 )), m, f, d[n + 14], 17, -1502002290 )), i, m, d[n + 15], 22, 1236535329 )), (r = md5_gg( r, (i = md5_gg( i, (m = md5_gg( m, f, r, i, d[n + 1], 5, -165796510 )), f, r, d[n + 6], 9, -1069501632 )), m, f, d[n + 11], 14, 643717713 )), i, m, d[n + 0], 20, -373897302 )), (r = md5_gg( r, (i = md5_gg( i, (m = md5_gg(m, f, r, i, d[n + 5], 5, -701558691)), f, r, d[n + 10], 9, 38016083 )), m, f, d[n + 15], 14, -660478335 )), i, m, d[n + 4], 20, -405537848 )), (r = md5_gg( r, (i = md5_gg( i, (m = md5_gg(m, f, r, i, d[n + 9], 5, 568446438)), f, r, d[n + 14], 9, -1019803690 )), m, f, d[n + 3], 14, -187363961 )), i, m, d[n + 8], 20, 1163531501 )), (r = md5_gg( r, (i = md5_gg( i, (m = md5_gg(m, f, r, i, d[n + 13], 5, -1444681467)), f, r, d[n + 2], 9, -51403784 )), m, f, d[n + 7], 14, 1735328473 )), i, m, d[n + 12], 20, -1926607734 )), (r = md5_hh( r, (i = md5_hh( i, (m = md5_hh(m, f, r, i, d[n + 5], 4, -378558)), f, r, d[n + 8], 11, -2022574463 )), m, f, d[n + 11], 16, 1839030562 )), i, m, d[n + 14], 23, -35309556 )), (r = md5_hh( r, (i = md5_hh( i, (m = md5_hh(m, f, r, i, d[n + 1], 4, -1530992060)), f, r, d[n + 4], 11, 1272893353 )), m, f, d[n + 7], 16, -155497632 )), i, m, d[n + 10], 23, -1094730640 )), (r = md5_hh( r, (i = md5_hh( i, (m = md5_hh(m, f, r, i, d[n + 13], 4, 681279174)), f, r, d[n + 0], 11, -358537222 )), m, f, d[n + 3], 16, -722521979 )), i, m, d[n + 6], 23, 76029189 )), (r = md5_hh( r, (i = md5_hh( i, (m = md5_hh(m, f, r, i, d[n + 9], 4, -640364487)), f, r, d[n + 12], 11, -421815835 )), m, f, d[n + 15], 16, 530742520 )), i, m, d[n + 2], 23, -995338651 )), (r = md5_ii( r, (i = md5_ii( i, (m = md5_ii(m, f, r, i, d[n + 0], 6, -198630844)), f, r, d[n + 7], 10, 1126891415 )), m, f, d[n + 14], 15, -1416354905 )), i, m, d[n + 5], 21, -57434055 )), (r = md5_ii( r, (i = md5_ii( i, (m = md5_ii(m, f, r, i, d[n + 12], 6, 1700485571)), f, r, d[n + 3], 10, -1894986606 )), m, f, d[n + 10], 15, -1051523 )), i, m, d[n + 1], 21, -2054922799 )), (r = md5_ii( r, (i = md5_ii( i, (m = md5_ii(m, f, r, i, d[n + 8], 6, 1873313359)), f, r, d[n + 15], 10, -30611744 )), m, f, d[n + 6], 15, -1560198380 )), i, m, d[n + 13], 21, 1309151649 )), (r = md5_ii( r, (i = md5_ii( i, (m = md5_ii(m, f, r, i, d[n + 4], 6, -145523070)), f, r, d[n + 11], 10, -1120210379 )), m, f, d[n + 2], 15, 718787259 )), i, m, d[n + 9], 21, -343485551 )), (m = safe_add(m, h)), (f = safe_add(f, t)), (r = safe_add(r, g)), (i = safe_add(i, e)); } return Array(m, f, r, i); } function md5_cmn(d, _, m, f, r, i) { return safe_add(bit_rol(safe_add(safe_add(_, d), safe_add(f, i)), r), m); } function md5_ff(d, _, m, f, r, i, n) { return md5_cmn((_ & m) | (~_ & f), d, _, r, i, n); } function md5_gg(d, _, m, f, r, i, n) { return md5_cmn((_ & f) | (m & ~f), d, _, r, i, n); } function md5_hh(d, _, m, f, r, i, n) { return md5_cmn(_ ^ m ^ f, d, _, r, i, n); } function md5_ii(d, _, m, f, r, i, n) { return md5_cmn(m ^ (_ | ~f), d, _, r, i, n); } function safe_add(d, _) { var m = (65535 & d) + (65535 & _); return (((d >> 16) + (_ >> 16) + (m >> 16)) << 16) | (65535 & m); } function bit_rol(d, _) { return (d << _) | (d >>> (32 - _)); }
window.MD5 = () => {
  if (!noteTextarea) return;
  noteTextarea.value = generateMD5(noteTextarea.value);
  updateNoteMetadata();
  showNotification("MD5 Generated!");
};
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
  function extractStyleBlocks(text) {
    if (!text) return "";
    const styleRE = /<style\b[^>]*>([\s\S]*?)<\/style\s*>/gi;
    const matches = [];
    let m;
    while ((m = styleRE.exec(text)) !== null) matches.push(m[1]);
    if (matches.length) return matches.join("\n\n");
    return text;
  }
  class Tokenizer {
    constructor(css) {
      this.css = css || "";
      this.len = this.css.length;
      this.pos = 0;
    }
    eof() { return this.pos >= this.len; }
    peek(n = 0) { return this.css[this.pos + n]; }
    next() { const c = this.css[this.pos]; this.pos++; return c; }
    isWhitespace(ch) {
      if (!ch) return false;
      return ch === ' ' || ch === '\t' || ch === '\n' || ch === '\r' || ch === '\f';
    }
    skipWhitespaceAndComments() {
      while (!this.eof()) {
        const ch = this.peek();
        if (this.isWhitespace(ch)) { this.pos++; continue; }
        if (ch === '/' && this.peek(1) === '*') {
          this.pos += 2;
          while (!this.eof()) {
            if (this.peek() === '*' && this.peek(1) === '/') { this.pos += 2; break; }
            this.pos++;
          }
          continue;
        }
        break;
      }
    }
    consumeString(quote) {
      let out = quote;
      this.pos++;
      while (!this.eof()) {
        const ch = this.next();
        out += ch;
        if (ch === '\\') {
          if (!this.eof()) {
            out += this.consumeEscapeForString();
          }
        } else if (ch === quote) {
          break;
        }
      }
      return out;
    }
    consumeEscapeForString() {
      if (this.eof()) return '';
      const hexMatch = /^[0-9A-Fa-f]$/.test(this.peek()) ? true : false;
      let acc = '';
      if (hexMatch) {
        let count = 0;
        while (!this.eof() && count < 6 && /^[0-9A-Fa-f]$/.test(this.peek())) {
          acc += this.next();
          count++;
        }
        if (!this.eof() && this.isWhitespace(this.peek())) {
          acc += this.next();
        }
        return acc;
      } else {
        acc += this.next();
        return acc;
      }
    }
    consumeUntil(delimiters = []) {
      let out = '';
      while (!this.eof()) {
        const ch = this.peek();
        if (delimiters.includes(ch)) break;
        if (ch === '\\') {
          out += this.next();
          out += this.consumeEscapeForString();
          continue;
        }
        if (ch === '"' || ch === "'") {
          out += this.consumeString(ch);
          continue;
        }
        if (ch === '(') {
          out += this.next();
          let depth = 1;
          while (!this.eof() && depth > 0) {
            const c2 = this.peek();
            if (c2 === '"' || c2 === "'") {
              out += this.consumeString(this.peek());
            } else {
              if (c2 === '(') depth++;
              if (c2 === ')') depth--;
              out += this.next();
            }
          }
          continue;
        }
        out += this.next();
      }
      return out.trim();
    }
  }
  class Parser extends Tokenizer {
    constructor(css) { super(css); }
    parseDeclarations() {
      const decls = [];
      while (!this.eof()) {
        this.skipWhitespaceAndComments();
        if (this.eof()) break;
        const ch = this.peek();
        if (ch === '}') break;
        const rawProp = this.consumeUntil([':', ';', '}']);
        if (this.eof()) break;
        if (this.peek() !== ':') {
          if (this.peek() === ';') { this.next(); continue; }
          while (!this.eof() && this.peek() !== ';' && this.peek() !== '}') this.pos++;
          if (this.peek() === ';') this.next();
          continue;
        }
        this.next();
        const rawVal = this.consumeUntil([';', '}']);
        if (this.peek() === ';') this.next();
        let prop = rawProp.trim();
        let val = rawVal.trim();
        if (!prop) continue;
        let important = false;
        const impIdx = val.toLowerCase().lastIndexOf('!important');
        if (impIdx !== -1 && val.slice(impIdx).toLowerCase().startsWith('!important')) {
          important = true;
          val = val.slice(0, impIdx).trim();
        }
        decls.push({ prop: prop.toLowerCase(), val, important });
      }
      return decls;
    }
    parseKeyframesBody() {
      const frames = [];
      while (!this.eof()) {
        this.skipWhitespaceAndComments();
        if (this.eof()) break;
        if (this.peek() === '}') break;
        const selector = this.consumeUntil(['{']);
        if (this.peek() !== '{') {
          while (!this.eof() && this.peek() !== '{' && this.peek() !== '}') this.pos++;
          if (this.peek() !== '{') continue;
        }
        this.next();
        const decls = this.parseDeclarations();
        frames.push({ selector: selector.trim(), decls });
        if (this.peek() === '}') this.next();
      }
      return frames;
    }
    parseBlock() {
      const nodes = [];
      while (!this.eof()) {
        this.skipWhitespaceAndComments();
        if (this.eof()) break;
        if (this.peek() === '}') break;
        const header = this.consumeUntil(['{', ';', '}']);
        if (this.peek() === ';') {
          this.next();
          nodes.push({ type: 'stmt', header: header.trim() });
          continue;
        }
        if (this.peek() === '{') {
          this.next();
          const hLower = header.trim().toLowerCase();
          const isKeyframes = hLower.startsWith('@keyframes') || hLower.startsWith('@-webkit-keyframes') || hLower.startsWith('@-moz-keyframes');
          const isAtRule = header.trim().startsWith('@');
          if (isKeyframes) {
            const children = this.parseKeyframesBody();
            nodes.push({ type: 'keyframes', header: header.trim(), children });
            if (this.peek() === '}') this.next();
            continue;
          }
          if (isAtRule) {
            if (hLower.startsWith('@font-face') || hLower.startsWith('@page')) {
              const decls = this.parseDeclarations();
              nodes.push({ type: 'rule', selector: header.trim(), decls });
              if (this.peek() === '}') this.next();
            } else {
              const children = this.parseBlock();
              nodes.push({ type: 'at-block', header: header.trim(), children });
              if (this.peek() === '}') this.next();
            }
            continue;
          }
          const decls = this.parseDeclarations();
          nodes.push({ type: 'rule', selector: header.trim(), decls });
          if (this.peek() === '}') this.next();
          continue;
        }
        this.pos++;
      }
      return nodes;
    }
  }
  function hasCustomPropertyOrVarUsage(decls) {
    for (const d of decls) {
      if (d.prop && d.prop.startsWith('--')) return true;
      if (d.val && /\bvar\s*\(/.test(d.val)) return true;
    }
    return false;
  }
  function declSignature(decls) {
    return decls.map(d => `${d.prop}:${d.val}${d.important ? '!imp' : ''}`).join(';');
  }
  function shallowCloneDecl(d) { return { prop: d.prop, val: d.val, important: !!d.important }; }
  function optimizeNodes(nodes) {
    const out = [];
    for (const node of nodes) {
      if (node.type === 'at-block') {
        node.children = optimizeNodes(node.children || []);
        out.push(node);
        continue;
      }
      if (node.type === 'stmt' || node.type === 'keyframes') {
        out.push(node);
        continue;
      }
      if (node.type === 'rule') {
        const seenIndex = new Map();
        const resultDecls = [];
        for (const d of node.decls) {
          const prop = d.prop;
          if (seenIndex.has(prop)) {
            const idx = seenIndex.get(prop);
            const existing = resultDecls[idx];
            if (existing.important && !d.important) {
              continue;
            }
            resultDecls[idx] = shallowCloneDecl(d);
            continue;
          } else {
            seenIndex.set(prop, resultDecls.length);
            resultDecls.push(shallowCloneDecl(d));
          }
        }
        node.decls = resultDecls;
        if (node.decls.length === 0) continue;
        const prev = out.length ? out[out.length - 1] : null;
        if (prev && prev.type === 'rule' && prev.selector === node.selector) {
          for (const d of node.decls) {
            const idx = prev.decls.findIndex(p => p.prop === d.prop);
            if (idx >= 0) {
              const existing = prev.decls[idx];
              if (existing.important && !d.important) {
                continue;
              } else {
                prev.decls[idx] = shallowCloneDecl(d);
              }
            } else {
              prev.decls.push(shallowCloneDecl(d));
            }
          }
          continue;
        }
        if (prev && prev.type === 'rule') {
          if (!hasCustomPropertyOrVarUsage(prev.decls) && !hasCustomPropertyOrVarUsage(node.decls)) {
            const sigPrev = declSignature(prev.decls);
            const sigNode = declSignature(node.decls);
            if (sigPrev === sigNode) {
              prev.selector = `${prev.selector}, ${node.selector}`;
              continue;
            }
          }
        }
        out.push(node);
      }
    }
    return out;
  }
  function serialize(nodes, depth = 0) {
    const indent = ' '.repeat(depth);
    let out = '';
    for (const node of nodes) {
      if (node.type === 'stmt') {
        out += `${indent}${node.header};\n`;
      } else if (node.type === 'keyframes') {
        out += `${indent}${node.header} {\n`;
        for (const frame of node.children) {
          out += `${indent}  ${frame.selector} {\n`;
          for (const d of frame.decls) {
            out += `${indent}    ${d.prop}: ${d.val}${d.important ? ' !important' : ''};\n`;
          }
          out += `${indent}  }\n`;
        }
        out += `${indent}}\n`;
      } else if (node.type === 'at-block') {
        out += `${indent}${node.header} {\n`;
        out += serialize(node.children, depth + 1);
        out += `${indent}}\n`;
      } else if (node.type === 'rule') {
        const sel = node.selector.split(',').map(s => s.trim()).filter(Boolean).join(', ');
        out += `${indent}${sel} {\n`;
        for (const d of node.decls) {
          out += `${indent}  ${d.prop}: ${d.val}${d.important ? ' !important' : ''};\n`;
        }
        out += `${indent}}\n`;
      }
    }
    return out;
  }
  try {
    if (!noteTextarea) {
      const msg = 'No textarea found to optimize.';
      if (typeof showNotification === 'function') showNotification(msg);
      else console.warn(msg);
      return;
    }
    let input = noteTextarea.value || '';
    input = extractStyleBlocks(input);
    const parser = new Parser(input);
    const ast = parser.parseBlock();
    const optimizedAst = optimizeNodes(ast);
    let finalCss = serialize(optimizedAst);
    finalCss = finalCss.replace(/\n{3,}/g, '\n\n').trim() + '\n';
    noteTextarea.value = finalCss;
    if (typeof updateNoteMetadata === 'function') {
      try { updateNoteMetadata(); } catch (e) {  }
    }
    if (typeof showNotification === 'function') showNotification('CSS optimized (safe mode)');
    else console.info('CSS optimized (safe mode)');
  } catch (err) {
    console.error('Optimizer error:', err);
    if (typeof showNotification === 'function') showNotification('CSS optimization failed: ' + (err && err.message ? err.message : String(err)));
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

window.removehtml = preserveSelection(async () => {
  if (!currentNote || !noteTextarea) return;
  function htmlToPlainText(html) {
    if (!html) return "";
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    doc
      .querySelectorAll("script, style, noscript, template")
      .forEach((el) => el.remove());

    const state = {
      olCounters: [],
      inPre: false,
      out: "",
      lastWasNewline: true
    };

    function append(text) {
      if (!text) return;
      if (state.inPre) {
        state.out += text;
        state.lastWasNewline = text.endsWith("\n");
        return;
      }
      state.out += text;
      state.lastWasNewline = state.out.endsWith("\n");
    }

    function ensureNewline(count = 1) {
      if (!state.lastWasNewline) {
        state.out += "\n".repeat(count);
        state.lastWasNewline = true;
      } else if (count > 1) {
        const trailing = state.out.match(/\n+$/);
        const have = trailing ? trailing[0].length : 0;
        if (have < count) state.out += "\n".repeat(count - have);
      }
    }

    function walk(node, depth = 0) {
      if (!node) return;
      const nodeType = node.nodeType;
      if (nodeType === Node.TEXT_NODE) {
        let text = node.nodeValue;
        if (!text) return;
        if (state.inPre) {
          append(text);
          return;
        }
        text = text.replace(/\s+/g, " ");
        if (state.lastWasNewline) text = text.replace(/^\s+/, "");
        append(text);
        return;
      }

      if (nodeType === Node.ELEMENT_NODE) {
        const tag = node.tagName.toLowerCase();
        switch (tag) {
          case "title":
            ensureNewline(0);
            append(node.textContent.trim());
            ensureNewline(2);
            break;
          case "h1":
          case "h2":
          case "h3":
          case "h4":
          case "h5":
          case "h6":
            ensureNewline(0);
            append(node.textContent.trim());
            ensureNewline(2);
            break;
          case "p":
          case "div":
          case "section":
          case "article":
          case "header":
          case "footer":
            ensureNewline(0);
            for (let ch = node.firstChild; ch; ch = ch.nextSibling)
              walk(ch, depth + 1);
            ensureNewline(2);
            break;
          case "br":
            append("\n");
            ensureNewline(0);
            break;
          case "pre":
            ensureNewline(0);
            state.inPre = true;
            append(node.textContent.replace(/\r\n?/g, "\n"));
            state.inPre = false;
            ensureNewline(2);
            break;
          case "code":
            if (node.closest && node.closest("pre")) {
              for (let ch = node.firstChild; ch; ch = ch.nextSibling)
                walk(ch, depth + 1);
            } else {
              append("`" + node.textContent.trim() + "`");
            }
            break;
          case "blockquote":
            ensureNewline(0);
            const quoteText = (function () {
              const tmpState = { out: "", inPre: false };
              function tmpWalk(n) {
                if (n.nodeType === Node.TEXT_NODE)
                  tmpState.out += n.nodeValue.replace(/\s+/g, " ");
                else if (n.nodeType === Node.ELEMENT_NODE) {
                  for (let c = n.firstChild; c; c = c.nextSibling) tmpWalk(c);
                }
              }
              tmpWalk(node);
              return tmpState.out.trim();
            })();
            quoteText.split(/\n+/).forEach((line) => {
              if (line.trim()) append("> " + line.trim() + "\n");
            });
            ensureNewline(1);
            break;
          case "ul":
            for (let ch = node.firstChild; ch; ch = ch.nextSibling)
              walk(ch, depth + 1);
            ensureNewline(0);
            break;
          case "ol":
            state.olCounters.push(0);
            for (let ch = node.firstChild; ch; ch = ch.nextSibling)
              walk(ch, depth + 1);
            state.olCounters.pop();
            ensureNewline(0);
            break;
          case "li":
            const parentTag = node.parentElement
              ? node.parentElement.tagName.toLowerCase()
              : "";
            if (parentTag === "ol") {
              if (state.olCounters.length === 0) state.olCounters.push(0);
              state.olCounters[state.olCounters.length - 1]++;
              const numbering = state.olCounters.join(".") + ".";
              const indent = "  ".repeat(state.olCounters.length - 1);
              append(indent + numbering + " ");
              for (let ch = node.firstChild; ch; ch = ch.nextSibling)
                walk(ch, depth + 1);
              ensureNewline(1);
            } else {
              let level = 0;
              let p = node.parentElement;
              while (p) {
                if (p.tagName && p.tagName.toLowerCase() === "ul") level++;
                p = p.parentElement;
              }
              const indent = "  ".repeat(Math.max(0, level - 1));
              append(indent + "• ");
              for (let ch = node.firstChild; ch; ch = ch.nextSibling)
                walk(ch, depth + 1);
              ensureNewline(1);
            }
            break;
          case "table":
            ensureNewline(0);
            for (let r of node.querySelectorAll("tr")) {
              const cells = [];
              for (let c of r.children)
                cells.push(c.textContent.replace(/\s+/g, " ").trim());
              append(cells.join("\t") + "\n");
            }
            ensureNewline(1);
            break;
          case "a":
            const href = node.getAttribute("href");
            const anchorText = node.textContent.replace(/\s+/g, " ").trim();
            if (href) append(anchorText + " (" + href + ")");
            else append(anchorText);
            break;
          case "img":
            const alt = node.getAttribute("alt");
            if (alt) append(alt);
            break;
          default:
            for (let ch = node.firstChild; ch; ch = ch.nextSibling)
              walk(ch, depth + 1);
            break;
        }
      }
    }

    const title =
      (doc.querySelector("title") && doc.querySelector("title").textContent) ||
      "";
    if (title.trim()) {
      append(title.trim());
      ensureNewline(2);
    }

    walk(doc.body || doc.documentElement, 0);

    let out = state.out || "";
    out = out.replace(/\r\n|\r/g, "\n");
    out = out.replace(/[ \t]+/g, " ");
    out = out.replace(/\n{3,}/g, "\n\n");
    out = out.trim();
    out = out.replace(/&#(\d+);/g, (_, d) =>
      String.fromCharCode(parseInt(d, 10))
    );

    return out;
  }

  try {
    const input = noteTextarea.value || "";
    const cleaned = htmlToPlainText(input);
    noteTextarea.value = cleaned;

    if (typeof updateNoteMetadata === "function") {
      try {
        updateNoteMetadata();
      } catch (e) {}
    }
    if (typeof showNotification === "function")
      showNotification("HTML removed and text cleaned");
    else console.info("HTML removed and text cleaned");
  } catch (err) {
    console.error("RemoveHTML error:", err);
    if (typeof showNotification === "function")
      showNotification(
        "RemoveHTML failed: " + (err && err.message ? err.message : String(err))
      );
  }
});
