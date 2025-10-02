function initApp() {
  let notes = [];
  let currentNote = null;
  let visibleNotes = localStorage.getItem('visibleNotes') ? parseInt(localStorage.getItem('visibleNotes')) : 1;
  let isHomepage = true;
  let currentApp = 'home';
  let fontSize = localStorage.getItem('fontSize') ? parseInt(localStorage.getItem('fontSize')) : 14;
  let dob = localStorage.getItem('dob') || '';
  const noteBackdrop = document.getElementById('noteBackdrop'); // Query the backdrop;
const maxNotes = 15;
  const homepage = document.getElementById('homepage');
  const noteAppContainer = document.getElementById('noteAppContainer');
  const diffCheckerContainer = document.getElementById('diffCheckerContainer');
  const topbar = document.getElementById('topbar');
  const themeToggle = document.getElementById('themeToggle');
  const undoBtn = document.getElementById('undoBtn');
  const redoBtn = document.getElementById('redoBtn');
  const homeBtn = document.getElementById('homeBtn');
  const sidebar1 = document.getElementById('sidebar1');
  const sidebar1Toggle = document.getElementById('sidebar1Toggle');
  const noteList = document.getElementById('noteList');
  const noteTextarea = document.getElementById('noteTextarea');
  const showNextNoteBtn = document.getElementById('showNextNoteBtn');
  const hideLastNoteBtn = document.getElementById('hideLastNoteBtn');
  const sidebar2Toggle = document.getElementById('sidebar2Toggle');
  const secondarySidebar = document.getElementById('secondarySidebar');
  const notification = document.getElementById('notification');
  const noteAppBtn = document.getElementById('noteAppBtn');
  const diffCheckerBtn = document.getElementById('diffCheckerBtn');
  const infoName = document.getElementById('infoName');
  const infoCharsWith = document.getElementById('infoCharsWith');
  const infoCharsWithout = document.getElementById('infoCharsWithout');
  const infoWords = document.getElementById('infoWords');
  const infoReadTime = document.getElementById('infoReadTime');
  const infoExtension = document.getElementById('infoExtension');
  const text1 = document.getElementById('diffText1');
  const text2 = document.getElementById('diffText2');
  const compareBtn = document.getElementById('compareBtn');
  const clearBtn = document.getElementById('clearBtn');
  const swapBtn = document.getElementById('swapBtn');
  const linesLeft = document.getElementById('linesLeft');
  const linesRight = document.getElementById('linesRight');
  const diffSummary = document.getElementById('diffSummary');
  const diffCountEl = document.getElementById('diffCount');
  const lineCountEl = document.getElementById('lineCount');
  const saveSelLeftBtn = document.getElementById('saveSelLeft');
  const saveSelRightBtn = document.getElementById('saveSelRight');
  const applySwapBtn = document.getElementById('applySwap');
  const swapDirectionEl = document.getElementById('swapDirection');
  const selectionInfo = document.getElementById('selectionInfo');
  const uploadBtn1 = document.getElementById('uploadBtn1');
  const uploadBtn2 = document.getElementById('uploadBtn2');
  const fileInput1 = document.getElementById('fileInput1');
  const fileInput2 = document.getElementById('fileInput2');
  let savedLeft = null, savedRight = null;
  let state = {
    s1flat: '',
    s2flat: '',
    lines1: [],
    lines2: [],
    map1: [],
    map2: [],
    lineStarts1: [],
    lineStarts2: []
  };
  const WORD_DIFF_THRESHOLD = 5000;
  const LINE_DIFF_THRESHOLD = 500;
  
  window.handleDownload = async function () { if (!currentNote || !noteTextarea) return; const dfn = `${currentNote.title || "note"}.${ currentNote.extension || "txt" }`.replace(/"/g, "&quot;"); const res = await showModal({ header: `<div class="modal-title">Download Note</div>`, body: `<div style="display: flex; gap: 10px; align-items: center;"><div style="flex: 1;"><label class="modal-label">Filename</label><input type="text" id="fileName" placeholder="Enter filename including extension" value="${dfn}"></div></div>`, footer: `<button onclick="closeModal()">Cancel</button><button onclick="handleDownloadSubmit()" data-skip-validation class="modal-btn">Download</button>` }); if (!res || res.action !== "Download") return; let f = String(res.fileName || "").trim(); if (!f) return; f = f .replace(/\0/g, "") .replace(/[/\\]+/g, "") .replace(/["'<>:|?*]+/g, ""); const p = f.split("."), ext = p.length > 1 ? (p.pop() || "txt").toLowerCase() : "txt", name = p.join(".") || "note", mimeMap = { txt: "text/plain; charset=utf-8", text: "text/plain; charset=utf-8", md: "text/markdown; charset=utf-8", markdown: "text/markdown; charset=utf-8", csv: "text/csv; charset=utf-8", log: "text/plain; charset=utf-8", ini: "text/plain; charset=utf-8", conf: "text/plain; charset=utf-8", env: "text/plain; charset=utf-8", html: "text/html; charset=utf-8", htm: "text/html; charset=utf-8", css: "text/css; charset=utf-8", js: "application/javascript; charset=utf-8", mjs: "text/javascript; charset=utf-8", ts: "application/typescript; charset=utf-8", jsx: "text/jsx; charset=utf-8", tsx: "text/tsx; charset=utf-8", json: "application/json; charset=utf-8", xml: "application/xml; charset=utf-8", yaml: "text/yaml; charset=utf-8", yml: "text/yaml; charset=utf-8", png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", webp: "image/webp", gif: "image/gif", svg: "image/svg+xml; charset=utf-8", ico: "image/vnd.microsoft.icon", woff: "font/woff", woff2: "font/woff2", ttf: "font/ttf", otf: "font/otf", mp3: "audio/mpeg", m4a: "audio/mp4", wav: "audio/wav", ogg: "audio/ogg", flac: "audio/flac", mp4: "video/mp4", m4v: "video/x-m4v", mov: "video/quicktime", webm: "video/webm", mkv: "video/x-matroska", avi: "video/x-msvideo", zip: "application/zip", tar: "application/x-tar", gz: "application/gzip", tgz: "application/gzip", bz2: "application/x-bzip2", xz: "application/x-xz", rar: "application/vnd.rar", "7z": "application/x-7z-compressed", pdf: "application/pdf", doc: "application/msword", docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", xls: "application/vnd.ms-excel", xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", ppt: "application/vnd.ms-powerpoint", pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation", odt: "application/vnd.oasis.opendocument.text", ods: "application/vnd.oasis.opendocument.spreadsheet", odp: "application/vnd.oasis.opendocument.presentation", epub: "application/epub+zip", exe: "application/vnd.microsoft.portable-executable", dll: "application/octet-stream", bin: "application/octet-stream", wasm: "application/wasm", sh: "application/x-sh", bash: "application/x-sh", ps1: "text/plain; charset=utf-8", bat: "application/x-msdownload", sql: "text/x-sql; charset=utf-8", rtf: "application/rtf", svgz: "image/svg+xml; charset=utf-8", heic: "image/heic", heif: "image/heif" }, textLike = [ "text/plain", "text/markdown", "text/csv", "text/html", "application/json", "application/javascript", "application/xml", "text/yaml", "text/jsx", "text/tsx" ], mime = mimeMap[ext] || (/\.(jpg|jpeg|png|gif|webp|svg|ico)$/i.test(ext) ? `image/${ext}` : "application/octet-stream"); if (textLike.some((t) => mime.indexOf(t) === 0) && !/charset=/.test(mime)) mime += "; charset=utf-8"; const fileName = `${name}.${ext}`, blob = new Blob([noteTextarea.value], { type: mime }), url = URL.createObjectURL(blob), a = document.createElement("a"); a.href = url; a.download = fileName; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 1500); showNotification(`Note downloaded as ${fileName}!`); }; window.handleDownloadSubmit = function () { const fileName = modalScope.fileName ? modalScope.fileName.value : ""; closeModal({ action: "Download", fileName }); };

} //INIT APP CLOSING

if (window.blogger && window.blogger.uiReady) {
  initApp();
} else {
  document.addEventListener("DOMContentLoaded", initApp);
  setTimeout(initApp, 100);
}
