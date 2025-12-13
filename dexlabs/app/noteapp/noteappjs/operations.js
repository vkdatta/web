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
