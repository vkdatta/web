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
  const container = document.querySelector('.secondary-sidebar-desc .info-dex');  
  
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
                style="width:23px !important; height:23px !important; border-radius:50% !important; object-fit:cover !important;">  
         </div>`  
      : `<div style="display:flex !important; align-items:center !important; gap:8px !important; font-size:14px !important; color:#cacaca !important;">  
           <span class="material-symbols-rounded" style="font-size:18px !important;">account_circle</span>  
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
