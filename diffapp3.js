function clearAll() {
  text1.value = "";
  text2.value = "";
  linesLeft.innerHTML = "Original text will appear here after comparison";
  linesRight.innerHTML = "Changed text will appear here after comparison";
  linesLeft.className = "diff-lines initial-message";
  linesRight.className = "diff-lines initial-message";
  diffSummary.textContent = "Ready to compare";
  diffCountEl.textContent = "0";
  lineCountEl.textContent = "0";
  savedLeft = null;
  savedRight = null;
  selectionInfo.textContent = "None";
}
function swapTexts() {
  const temp = text1.value;
  text1.value = text2.value;
  text2.value = temp;
  compareTexts();
}
function escapeHTML(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function compareTexts() {
  const orig1 = text1.value || "";
  const orig2 = text2.value || "";
  const largeFile = orig1.length + orig2.length > WORD_DIFF_THRESHOLD;
  diffSummary.textContent = largeFile
    ? "Processing large file (line-level diff only)..."
    : "Comparing texts...";
  setTimeout(() => {
    try {
      const lines1 = orig1.split(/\r?\n/);
      const lines2 = orig2.split(/\r?\n/);
      const L = Math.max(lines1.length, lines2.length);
      let flat1 = "",
        flat2 = "";
      const map1 = [],
        map2 = [],
        lineStarts1 = [],
        lineStarts2 = [];
      for (let i = 0; i < lines1.length; i++) {
        lineStarts1[i] = flat1.length;
        const ln = lines1[i];
        for (let k = 0; k < ln.length; k++) {
          map1[flat1.length] = { line: i, offset: k };
          flat1 += ln[k];
        }
        if (i < lines1.length - 1) flat1 += "\n";
      }
      for (let i = 0; i < lines2.length; i++) {
        lineStarts2[i] = flat2.length;
        const ln = lines2[i];
        for (let k = 0; k < ln.length; k++) {
          map2[flat2.length] = { line: i, offset: k };
          flat2 += ln[k];
        }
        if (i < lines2.length - 1) flat2 += "\n";
      }
      state.s1flat = flat1;
      state.s2flat = flat2;
      state.map1 = map1;
      state.map2 = map2;
      state.lineStarts1 = lineStarts1;
      state.lineStarts2 = lineStarts2;
      state.lines1 = lines1;
      state.lines2 = lines2;
      if (
        largeFile ||
        lines1.length > LINE_DIFF_THRESHOLD ||
        lines2.length > LINE_DIFF_THRESHOLD
      ) {
        fastLineDiff(lines1, lines2);
      } else {
        detailedDiff(lines1, lines2);
      }
      lineCountEl.textContent = L;
      diffSummary.textContent =
        diffCountEl.textContent === "0"
          ? "Texts are identical!"
          : "Comparison complete";
      diffSummary.style.color =
        diffCountEl.textContent === "0" ? "var(--added-text)" : "var(--text)";
      setupScrollSync();
    } catch (e) {
      diffSummary.textContent = "Error during comparison";
      diffSummary.style.color = "var(--removed-text)";
    }
  }, 50);
}

function setupScrollSync() {
  const panes = document.querySelectorAll(".diff-pane-scroller");
  if (panes.length < 2) return;
  const leftPane = panes[0];
  const rightPane = panes[1];
  leftPane.addEventListener("scroll", syncScroll);
  rightPane.addEventListener("scroll", syncScroll);
  function syncScroll() {
    const target = this === leftPane ? rightPane : leftPane;
    target.scrollTop = this.scrollTop;
    target.scrollLeft = this.scrollLeft;
  }
}

function fastLineDiff(lines1, lines2) {
  let leftHtml = "",
    rightHtml = "";
  let diffs = 0;
  const L = Math.max(lines1.length, lines2.length);
  for (let i = 0; i < L; i++) {
    const a = lines1[i] || "";
    const b = lines2[i] || "";
    if (a === b) {
      leftHtml +=
        '<div class="line-row" data-line="' +
        i +
        '">' +
        '<div class="gutter-cell">' +
        "<span>" +
        (i + 1) +
        "</span>" +
        '<button class="swap-btn" data-line="' +
        i +
        '" data-side="left">↔</button>' +
        "</div>" +
        '<div class="content-cell">' +
        escapeHTML(a) +
        "</div>" +
        "</div>";
      rightHtml +=
        '<div class="line-row" data-line="' +
        i +
        '">' +
        '<div class="gutter-cell">' +
        "<span>" +
        (i + 1) +
        "</span>" +
        '<button class="swap-btn" data-line="' +
        i +
        '" data-side="right">↔</button>' +
        "</div>" +
        '<div class="content-cell">' +
        escapeHTML(b) +
        "</div>" +
        "</div>";
    } else {
      diffs++;
      leftHtml +=
        '<div class="line-row removed" data-line="' +
        i +
        '">' +
        '<div class="gutter-cell">' +
        "<span>" +
        (i + 1) +
        "</span>" +
        '<button class="swap-btn" data-line="' +
        i +
        '" data-side="left">↔</button>' +
        "</div>" +
        '<div class="content-cell">' +
        (a ? escapeHTML(a) : "&nbsp;") +
        "</div>" +
        "</div>";
      rightHtml +=
        '<div class="line-row added" data-line="' +
        i +
        '">' +
        '<div class="gutter-cell">' +
        "<span>" +
        (i + 1) +
        "</span>" +
        '<button class="swap-btn" data-line="' +
        i +
        '" data-side="right">↔</button>' +
        "</div>" +
        '<div class="content-cell">' +
        (b ? escapeHTML(b) : "&nbsp;") +
        "</div>" +
        "</div>";
    }
  }
  linesLeft.innerHTML = leftHtml;
  linesRight.innerHTML = rightHtml;
  diffCountEl.textContent = diffs;
  document.querySelectorAll(".swap-btn").forEach(function (btn) {
    btn.addEventListener("click", function (e) {
      swapLine(parseInt(this.dataset.line), this.dataset.side);
      e.stopPropagation();
    });
  });
}
function detailedDiff(lines1, lines2) {
  let leftHtml = "",
    rightHtml = "";
  let diffs = 0;
  const L = Math.max(lines1.length, lines2.length);
  for (let i = 0; i < L; i++) {
    const a = lines1[i] || "";
    const b = lines2[i] || "";
    if (a === b) {
      leftHtml +=
        '<div class="line-row" data-line="' +
        i +
        '">' +
        '<div class="gutter-cell">' +
        "<span>" +
        (i + 1) +
        "</span>" +
        '<button class="swap-btn" data-line="' +
        i +
        '" data-side="left">↔</button>' +
        "</div>" +
        '<div class="content-cell">' +
        escapeHTML(a) +
        "</div>" +
        "</div>";
      rightHtml +=
        '<div class="line-row" data-line="' +
        i +
        '">' +
        '<div class="gutter-cell">' +
        "<span>" +
        (i + 1) +
        "</span>" +
        '<button class="swap-btn" data-line="' +
        i +
        '" data-side="right">↔</button>' +
        "</div>" +
        '<div class="content-cell">' +
        escapeHTML(b) +
        "</div>" +
        "</div>";
    } else {
      const prefix = commonPrefix(a, b);
      const suffix = commonSuffix(a, b);
      const aMid = a.substring(prefix.length, a.length - suffix.length);
      const bMid = b.substring(prefix.length, b.length - suffix.length);
      diffs++;
      leftHtml +=
        '<div class="line-row" data-line="' +
        i +
        '">' +
        '<div class="gutter-cell">' +
        "<span>" +
        (i + 1) +
        "</span>" +
        '<button class="swap-btn" data-line="' +
        i +
        '" data-side="left">↔</button>' +
        "</div>" +
        '<div class="content-cell">' +
        escapeHTML(prefix) +
        '<span class="word-removed-strong">' +
        escapeHTML(aMid) +
        "</span>" +
        escapeHTML(suffix) +
        "</div>" +
        "</div>";
      rightHtml +=
        '<div class="line-row" data-line="' +
        i +
        '">' +
        '<div class="gutter-cell">' +
        "<span>" +
        (i + 1) +
        "</span>" +
        '<button class="swap-btn" data-line="' +
        i +
        '" data-side="right">↔</button>' +
        "</div>" +
        '<div class="content-cell">' +
        escapeHTML(prefix) +
        '<span class="word-added-strong">' +
        escapeHTML(bMid) +
        "</span>" +
        escapeHTML(suffix) +
        "</div>" +
        "</div>";
    }
  }
  linesLeft.innerHTML = leftHtml;
  linesRight.innerHTML = rightHtml;
  diffCountEl.textContent = diffs;
  document.querySelectorAll(".swap-btn").forEach(function (btn) {
    btn.addEventListener("click", function (e) {
      swapLine(parseInt(this.dataset.line), this.dataset.side);
      e.stopPropagation();
    });
  });
}
function commonPrefix(a, b) {
  let i = 0;
  const min = Math.min(a.length, b.length);
  while (i < min && a[i] === b[i]) i++;
  return a.substring(0, i);
}
function commonSuffix(a, b) {
  let i = 0;
  const min = Math.min(a.length, b.length);
  while (i < min && a[a.length - 1 - i] === b[b.length - 1 - i]) i++;
  return a.substring(a.length - i);
}
function swapLine(lineIndex, side) {
  const lines1 = [].concat(state.lines1);
  const lines2 = [].concat(state.lines2);
  if (lineIndex >= lines1.length) lines1.length = lineIndex + 1;
  if (lineIndex >= lines2.length) lines2.length = lineIndex + 1;
  if (side === "left") {
    lines1[lineIndex] = lines2[lineIndex] || "";
  } else {
    lines2[lineIndex] = lines1[lineIndex] || "";
  }
  text1.value = lines1.join("\n");
  text2.value = lines2.join("\n");
  compareTexts();
}

function handleFileUpload1(e) {
  const file = e.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (event) => {
      text1.value = event.target.result;
      compareTexts();
    };
    reader.readAsText(file);
  }
}

function handleFileUpload2(e) {
  const file = e.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (event) => {
      text2.value = event.target.result;
      compareTexts();
    };
    reader.readAsText(file);
  }
}

function initDiffChecker() {
  // Defer init until diff container is visible/loaded
  const diffContainer = document.getElementById('diffCheckerContainer');
  if (!diffContainer) {
    // Retry on next tick if container not ready
    setTimeout(initDiffChecker, 100);
    return;
  }
  // Now safe to query elements
  uploadBtn1 = document.getElementById('uploadBtn1');
  uploadBtn2 = document.getElementById('uploadBtn2');
  fileInput1 = document.getElementById('fileInput1');
  fileInput2 = document.getElementById('fileInput2');
  compareBtn = document.getElementById('compareBtn');
  clearBtn = document.getElementById('clearBtn');
  swapBtn = document.getElementById('swapBtn');
  text1 = document.getElementById('text1');
  text2 = document.getElementById('text2');
  linesLeft = document.getElementById('linesLeft');
  linesRight = document.getElementById('linesRight');
  diffSummary = document.getElementById('diffSummary');
  diffCountEl = document.getElementById('diffCount');
  lineCountEl = document.getElementById('lineCount');
  selectionInfo = document.getElementById('selectionInfo');

  // Null guards for all
  if (!uploadBtn1 || !uploadBtn2 || !fileInput1 || !fileInput2 || !compareBtn || !clearBtn || !swapBtn || !text1 || !text2 || !linesLeft || !linesRight || !diffSummary || !diffCountEl || !lineCountEl || !selectionInfo) {
    console.warn('Diff elements not fully loaded—retrying in 100ms');
    setTimeout(initDiffChecker, 100);
    return;
  }

  uploadBtn1.addEventListener("click", () => fileInput1.click());
  uploadBtn2.addEventListener("click", () => fileInput2.click());
  fileInput1.addEventListener("change", handleFileUpload1);
  fileInput2.addEventListener("change", handleFileUpload2);
  compareBtn.addEventListener("click", compareTexts);
  clearBtn.addEventListener("click", clearAll);
  swapBtn.addEventListener("click", swapTexts);
  setTimeout(compareTexts, 300);
}

// Call only after DOM ready or container visible
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initDiffChecker);
} else {
  initDiffChecker();
}
