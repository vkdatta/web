// ============================================================================
// latex-n.js
// Convert the LaTeX in a <textarea> into a .docx with NATIVE, EDITABLE equation
// objects (OMML) and auto-download it. Non-destructive: the textarea is never
// touched. Import the resulting file into Google Docs and equations arrive as
// real, editable Google Docs equations.
//
// Pipeline:  LaTeX --(Temml)--> MathML --(mathml2omml)--> OMML --> hand-built OOXML .docx
//
// TWO INPUT MODES (chosen automatically):
//   • Delimited mode — used when the text contains $$…$$ / \[…\] (display) or
//     \(…\) / $…$ (inline). Only delimited spans are treated as math.
//   • Auto-detect mode — used when NO delimiters are present (e.g. LaTeX pasted
//     from an AI chat). Each line is classified: lines with a LaTeX command,
//     a sub/superscript, or a bare "= …" equation become display equations;
//     everything else stays prose.
//   Force either with the opts.autodetect flag (true / false).
//
// "Foolproof": ANY input yields a valid, openable .docx. What can't be parsed
// is written as its literal LaTeX source, never silently mangled.
//
// Drop-in: import { handleLatex } from './latex-n.js';
//          button.onclick = () => handleLatex(noteTextarea, showNotification);
// ============================================================================

// ---------------------------------------------------------------- dependencies
let _mml2omml = null;
let _JSZip = null;
let _temmlReady = null;

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = src; s.onload = resolve;
    s.onerror = () => reject(new Error('Failed to load ' + src));
    document.head.appendChild(s);
  });
}

async function loadDeps() {
  if (!window.temml) {
    _temmlReady = _temmlReady ||
      loadScript('https://cdn.jsdelivr.net/npm/temml@0.11/dist/temml.min.js');
    await _temmlReady;
  }
  if (!_mml2omml) {
    const m = await import('https://cdn.jsdelivr.net/npm/mathml2omml@0.5/+esm');
    _mml2omml = m.mml2omml || (m.default && m.default.mml2omml) || m.default;
  }
  if (!_JSZip) {
    const z = await import('https://cdn.jsdelivr.net/npm/jszip@3.10/+esm');
    _JSZip = z.default || z;
  }
}

// ------------------------------------------------------------- XML boilerplate
// (Container verified to carry native equations correctly — do not prettify.)
const CONTENT_TYPES =
`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
<Default Extension="xml" ContentType="application/xml"/>
<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
<Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
</Types>`;

const RELS =
`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`;

const DOC_RELS =
`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`;

const STYLES =
`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
<w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/><w:sz w:val="22"/></w:rPr></w:rPrDefault></w:docDefaults>
<w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/></w:style>
</w:styles>`;

const DOC_OPEN =
`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><w:body>`;

const SECTPR =
`<w:sectPr><w:pgSz w:w="12240" w:h="15840"/><w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440" w:header="720" w:footer="720" w:gutter="0"/></w:sectPr>`;
const DOC_CLOSE = SECTPR + `</w:body></w:document>`;

// ------------------------------------------------------------------ utilities
function xmlEscape(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
function textRun(s) {
  return `<w:r><w:t xml:space="preserve">${xmlEscape(s)}</w:t></w:r>`;
}

// Convert one math string to an <m:oMath> string, or null if it can't be done.
function mathToOmml(tex, display) {
  const mml = window.temml.renderToString(tex, { displayMode: display, throwOnError: false });
  const omml = _mml2omml(mml);
  if (!omml || omml.indexOf('<m:oMath') === -1) return null;
  return omml;
}

// ---- Delimiter detection & splitting ---------------------------------------
const DELIM_RE = /\$\$([\s\S]+?)\$\$|\\\[([\s\S]+?)\\\]|\\\(([\s\S]+?)\\\)|\$(?!\d)([\s\S]+?)\$/;
function hasDelimiters(input) { return new RegExp(DELIM_RE.source).test(input); }

function segment(input) {
  const RE = new RegExp(DELIM_RE.source, 'g');
  const segs = []; let last = 0, m;
  while ((m = RE.exec(input)) !== null) {
    if (m.index > last) segs.push({ type: 'text', value: input.slice(last, m.index) });
    if (m[1] !== undefined)      segs.push({ type: 'math', display: true,  tex: m[1], raw: m[0] });
    else if (m[2] !== undefined) segs.push({ type: 'math', display: true,  tex: m[2], raw: m[0] });
    else if (m[3] !== undefined) segs.push({ type: 'math', display: false, tex: m[3], raw: m[0] });
    else                         segs.push({ type: 'math', display: false, tex: m[4], raw: m[0] });
    last = RE.lastIndex;
  }
  if (last < input.length) segs.push({ type: 'text', value: input.slice(last) });
  return segs;
}

// ---- Auto-detect: is this delimiter-free line an equation? ------------------
function isMathLine(line) {
  if (/\\[a-zA-Z]/.test(line)) return true;   // a LaTeX command: \frac \max \times \text …
  if (/[_^]/.test(line)) return true;         // a sub/superscript: C_{uu}, x^2, C_0
  const t = line.trim();                       // a bare equation: "1 - p = 0.3765"
  if (t.includes('=') && /\d/.test(t) && !/[A-Za-z]{3,}/.test(t)) return true;
  return false;                                // …otherwise it's prose
}

// ------------------------------------------------------------------ body builders
// Delimited mode: math only inside delimiters; inline math stays in its paragraph.
function buildBodyDelimited(segs, stats) {
  const paras = []; let cur = '';
  const flush = () => { paras.push(`<w:p>${cur}</w:p>`); cur = ''; };
  for (const s of segs) {
    if (s.type === 'text') {
      const parts = s.value.split('\n');
      parts.forEach((p, i) => { if (p.length) cur += textRun(p); if (i < parts.length - 1) flush(); });
      continue;
    }
    let o = null; try { o = mathToOmml(s.tex, s.display); } catch (_) { o = null; }
    if (o) {
      stats.ok++;
      if (s.display) { if (cur.length) flush(); paras.push(`<w:p><m:oMathPara>${o}</m:oMathPara></w:p>`); }
      else cur += o;
    } else { stats.fail++; cur += textRun(s.raw); }
  }
  if (cur.length) flush();
  if (!paras.length) paras.push('<w:p></w:p>');
  return paras.join('');
}

// Auto mode: line-by-line. Equation lines -> display equations, else prose.
function buildBodyAuto(input, stats) {
  const paras = [];
  for (const line of input.split('\n')) {
    if (line.trim() === '') { paras.push('<w:p></w:p>'); continue; }   // preserve blank lines
    if (isMathLine(line)) {
      let o = null; try { o = mathToOmml(line.trim(), true); } catch (_) { o = null; }
      if (o) { stats.ok++; paras.push(`<w:p><m:oMathPara>${o}</m:oMathPara></w:p>`); }
      else { stats.fail++; paras.push(`<w:p>${textRun(line)}</w:p>`); }
    } else {
      paras.push(`<w:p>${textRun(line)}</w:p>`);
    }
  }
  if (!paras.length) paras.push('<w:p></w:p>');
  return paras.join('');
}

// ------------------------------------------------------------------- public API
// opts.autodetect: true forces line-mode, false forces delimiter-mode.
// Default: auto-detect when no delimiters are present.
export async function latexToDocxBlob(latex, opts = {}) {
  await loadDeps();
  const input = latex ?? '';
  const stats = { ok: 0, fail: 0 };
  const auto = (opts.autodetect !== undefined) ? opts.autodetect : !hasDelimiters(input);
  const body = auto ? buildBodyAuto(input, stats) : buildBodyDelimited(segment(input), stats);
  const documentXml = DOC_OPEN + body + DOC_CLOSE;

  const zip = new _JSZip();
  zip.file('[Content_Types].xml', CONTENT_TYPES);
  zip.file('_rels/.rels', RELS);
  zip.file('word/_rels/document.xml.rels', DOC_RELS);
  zip.file('word/styles.xml', STYLES);
  zip.file('word/document.xml', documentXml);

  const blob = await zip.generateAsync({
    type: 'blob',
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  });
  return { blob, stats, mode: auto ? 'auto' : 'delimited' };
}

function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

export async function handleLatex(textarea, notify, opts = {}) {
  const ta = textarea
    || (typeof window !== 'undefined' && window.noteTextarea)
    || document.querySelector('textarea#noteTextarea, textarea[data-note], textarea');
  const say = notify
    || (typeof window !== 'undefined' && window.showNotification)
    || ((msg) => console.log('[latex-n]', msg));

  if (!ta) { say('LaTeX export: no textarea found.'); return; }

  try {
    say('Building .docx…');
    const { blob, stats } = await latexToDocxBlob(ta.value || '', opts);
    const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
    triggerDownload(blob, `latex-notes-${stamp}.docx`);
    const tail = stats.fail
      ? ` (${stats.fail} left as literal text)`
      : '';
    say(`Downloaded .docx — ${stats.ok} equation${stats.ok === 1 ? '' : 's'} converted${tail}.`);
  } catch (err) {
    console.error('handleLatex error:', err);
    say('LaTeX export failed: ' + (err && err.message ? err.message : String(err)));
  }
}

export default handleLatex;
