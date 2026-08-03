// ============================================================================
// latex-to-docx.js
// Convert the LaTeX in a <textarea> into a .docx with NATIVE, EDITABLE equation
// objects (OMML) and auto-download it. Non-destructive: the textarea is never
// touched. Import the resulting file into Google Docs and equations arrive as
// real, editable Google Docs equations.
//
// Pipeline:  LaTeX --(Temml)--> MathML --(mathml2omml)--> OMML --> hand-built OOXML .docx
//
// "Foolproof" here means: ANY input yields a valid, openable .docx. Standard
// math renders as real equations; anything the parser can't handle is written
// as its literal LaTeX source, never silently mangled.
//
// Drop-in: replaces the old handleLatex(). Wire it as:
//     import { handleLatex } from './latex-to-docx.js';
//     button.addEventListener('click', () => handleLatex(noteTextarea, showNotification));
// (both args optional — see handleLatex below)
//
// Delimiters recognised:  $$...$$  and  \[...\]  = display   |   \(...\)  and  $...$  = inline
// A '$' glued to a digit (e.g. "$5") is treated as currency, not a math opener.
// ============================================================================

// ---------------------------------------------------------------- dependencies
let _mml2omml = null;
let _JSZip = null;
let _temmlReady = null;

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = src;
    s.onload = resolve;
    s.onerror = () => reject(new Error('Failed to load ' + src));
    document.head.appendChild(s);
  });
}

async function loadDeps() {
  // Temml (LaTeX -> MathML) as a UMD global `temml`.
  if (!window.temml) {
    _temmlReady = _temmlReady ||
      loadScript('https://cdn.jsdelivr.net/npm/temml@0.11/dist/temml.min.js');
    await _temmlReady;
  }
  // mathml2omml (MathML -> OMML) and JSZip as ES modules.
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
// (These strings mirror a container that was rendered & verified to carry
//  native equations correctly. Do not "prettify" — whitespace is deliberate.)
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

// US Letter page (DXA units: 1440 = 1 inch), 1" margins.
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

// Split raw text into ordered text / math segments.
function segment(input) {
  //  $$..$$  |  \[..\]  |  \(..\)  |  $..$ (opener not followed by a digit)
  const RE = /\$\$([\s\S]+?)\$\$|\\\[([\s\S]+?)\\\]|\\\(([\s\S]+?)\\\)|\$(?!\d)([\s\S]+?)\$/g;
  const segs = [];
  let last = 0, m;
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

// Convert one math segment to an <m:oMath> string, or null if it can't be done.
function mathToOmml(tex, display) {
  const mml = window.temml.renderToString(tex, { displayMode: display, throwOnError: false });
  const omml = _mml2omml(mml);
  if (!omml || omml.indexOf('<m:oMath') === -1) return null;
  return omml;
}

// Build the <w:body> inner XML from segments. `stats` collects ok/fail counts.
function buildBody(segs, stats) {
  const paras = [];
  let cur = '';
  const flush = () => { paras.push(`<w:p>${cur}</w:p>`); cur = ''; };

  for (const s of segs) {
    if (s.type === 'text') {
      const parts = s.value.split('\n');
      parts.forEach((piece, idx) => {
        if (piece.length) cur += textRun(piece);
        if (idx < parts.length - 1) flush();     // newline => paragraph break (blank lines preserved)
      });
      continue;
    }
    // math
    let omath = null;
    try { omath = mathToOmml(s.tex, s.display); } catch (_) { omath = null; }
    if (omath) {
      stats.ok++;
      if (s.display) {
        if (cur.length) flush();                 // close any open text paragraph first
        paras.push(`<w:p><m:oMathPara>${omath}</m:oMathPara></w:p>`);
      } else {
        cur += omath;                            // inline: stays in the current paragraph
      }
    } else {
      stats.fail++;
      cur += textRun(s.raw);                      // FOOLPROOF fallback: literal LaTeX, uncorrupted
    }
  }
  if (cur.length) flush();
  if (paras.length === 0) paras.push('<w:p></w:p>');
  return paras.join('');
}

// ------------------------------------------------------------------- public API

// Build a .docx Blob from a LaTeX string. Returns { blob, stats }.
export async function latexToDocxBlob(latex) {
  await loadDeps();
  const stats = { ok: 0, fail: 0 };
  const body = buildBody(segment(latex ?? ''), stats);
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
  return { blob, stats };
}

function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

// Drop-in replacement for the old handleLatex().
// Both args optional: pass your textarea element and a notify(msg) function.
// Falls back to window.noteTextarea / window.showNotification / a sensible selector.
export async function handleLatex(textarea, notify) {
  const ta = textarea
    || (typeof window !== 'undefined' && window.noteTextarea)
    || document.querySelector('textarea#noteTextarea, textarea[data-note], textarea');
  const say = notify
    || (typeof window !== 'undefined' && window.showNotification)
    || ((msg) => console.log('[latex-to-docx]', msg));

  if (!ta) { say('LaTeX export: no textarea found.'); return; }

  try {
    say('Building .docx…');
    const { blob, stats } = await latexToDocxBlob(ta.value || '');
    const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
    triggerDownload(blob, `latex-notes-${stamp}.docx`);
    const tail = stats.fail
      ? ` (${stats.fail} expression${stats.fail > 1 ? 's' : ''} left as literal text)`
      : '';
    say(`Downloaded .docx — ${stats.ok} equation${stats.ok === 1 ? '' : 's'} converted${tail}.`);
  } catch (err) {
    console.error('handleLatex error:', err);
    say('LaTeX export failed: ' + (err && err.message ? err.message : String(err)));
  }
}

export default handleLatex;
