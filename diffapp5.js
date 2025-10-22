// newdiffapp.js
let text1, text2, linesLeft, linesRight, diffSummary, diffCountEl, lineCountEl, uploadBtn1, uploadBtn2, fileInput1, fileInput2, compareBtn, clearBtn, swapBtn, selectionInfo;
let state = { lines1: [], lines2: [], s1flat: '', s2flat: '', map1: [], map2: [], lineStarts1: [], lineStarts2: [] };
const WORD_DIFF_THRESHOLD = 10000;
const LINE_DIFF_THRESHOLD = 1000;
let savedLeft = null;
let savedRight = null;
let ignoreWhitespace = false;
let ignoreCase = false;
function initDiffChecker() {
  const diffContainer = document.getElementById('diffCheckerContainer');
  if (!diffContainer) return;
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
  const ignoreWhitespaceChk = document.getElementById('ignoreWhitespace');
  const ignoreCaseChk = document.getElementById('ignoreCase');
  if (ignoreWhitespaceChk) ignoreWhitespaceChk.addEventListener('change', (e) => ignoreWhitespace = e.target.checked);
  if (ignoreCaseChk) ignoreCaseChk.addEventListener('change', (e) => ignoreCase = e.target.checked);
  if (!uploadBtn1 || !uploadBtn2 || !fileInput1 || !fileInput2 || !compareBtn || !clearBtn || !swapBtn || !text1 || !text2 || !linesLeft || !linesRight || !diffSummary || !diffCountEl || !lineCountEl || !selectionInfo) return;
  uploadBtn1.addEventListener('click', () => fileInput1.click());
  uploadBtn2.addEventListener('click', () => fileInput2.click());
  fileInput1.addEventListener('change', handleFileUpload1);
  fileInput2.addEventListener('change', handleFileUpload2);
  compareBtn.addEventListener('click', compareTexts);
  clearBtn.addEventListener('click', clearAll);
  swapBtn.addEventListener('click', swapTexts);
  text1.addEventListener('input', compareTexts);
  text2.addEventListener('input', compareTexts);
  setTimeout(compareTexts, 300);
}
function clearAll() {
  text1.value = '';
  text2.value = '';
  linesLeft.innerHTML = 'Original text will appear here after comparison';
  linesRight.innerHTML = 'Changed text will appear here after comparison';
  linesLeft.className = 'diff-lines initial-message';
  linesRight.className = 'diff-lines initial-message';
  diffSummary.textContent = 'Ready to compare';
  diffCountEl.textContent = '0';
  lineCountEl.textContent = '0';
  savedLeft = null;
  savedRight = null;
  selectionInfo.textContent = 'None';
}
function swapTexts() {
  const temp = text1.value;
  text1.value = text2.value;
  text2.value = temp;
  compareTexts();
}
function escapeHTML(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}
function compareTexts() {
  const orig1 = (ignoreWhitespace ? text1.value.replace(/\s+/g, ' ') : text1.value) || '';
  const orig2 = (ignoreWhitespace ? text2.value.replace(/\s+/g, ' ') : text2.value) || '';
  const largeFile = orig1.length + orig2.length > WORD_DIFF_THRESHOLD;
  const caseOrig1 = ignoreCase ? orig1.toLowerCase() : orig1;
  const caseOrig2 = ignoreCase ? orig2.toLowerCase() : orig2;
  diffSummary.textContent = largeFile ? 'Processing large file (line-level diff only)...' : 'Comparing texts...';
  setTimeout(() => {
    try {
      const lines1 = caseOrig1.split(/\r?\n/);
      const lines2 = caseOrig2.split(/\r?\n/);
      const L = Math.max(lines1.length, lines2.length);
      let flat1 = '', flat2 = '';
      const map1 = [], map2 = [], lineStarts1 = [], lineStarts2 = [];
      for (let i = 0; i < lines1.length; i++) {
        lineStarts1[i] = flat1.length;
        const ln = lines1[i];
        for (let k = 0; k < ln.length; k++) {
          map1[flat1.length] = { line: i, offset: k };
          flat1 += ln[k];
        }
        if (i < lines1.length - 1) flat1 += '\n';
      }
      for (let i = 0; i < lines2.length; i++) {
        lineStarts2[i] = flat2.length;
        const ln = lines2[i];
        for (let k = 0; k < ln.length; k++) {
          map2[flat2.length] = { line: i, offset: k };
          flat2 += ln[k];
        }
        if (i < lines2.length - 1) flat2 += '\n';
      }
      state.s1flat = flat1;
      state.s2flat = flat2;
      state.map1 = map1;
      state.map2 = map2;
      state.lineStarts1 = lineStarts1;
      state.lineStarts2 = lineStarts2;
      state.lines1 = lines1;
      state.lines2 = lines2;
      if (largeFile || lines1.length > LINE_DIFF_THRESHOLD || lines2.length > LINE_DIFF_THRESHOLD) {
        fastLineDiff(lines1, lines2, orig1.split(/\r?\n/), orig2.split(/\r?\n/));
      } else {
        detailedDiff(lines1, lines2, orig1.split(/\r?\n/), orig2.split(/\r?\n/));
      }
      lineCountEl.textContent = L;
      diffSummary.textContent = diffCountEl.textContent === '0' ? 'Texts are identical!' : 'Comparison complete';
      diffSummary.style.color = diffCountEl.textContent === '0' ? 'var(--added-text)' : 'var(--color)';
      setupScrollSync();
    } catch (e) {
      diffSummary.textContent = 'Error during comparison';
      diffSummary.style.color = 'var(--removed-text)';
    }
  }, 50);
}
function setupScrollSync() {
  const panes = document.querySelectorAll('.diff-pane-scroller');
  if (panes.length < 2) return;
  const leftPane = panes[0];
  const rightPane = panes[1];
  leftPane.addEventListener('scroll', syncScrollEvent);
  rightPane.addEventListener('scroll', syncScrollEvent);
  function syncScrollEvent() {
    const target = this === leftPane ? rightPane : leftPane;
    target.scrollTop = this.scrollTop;
    target.scrollLeft = this.scrollLeft;
  }
}
function fastLineDiff(caseLines1, caseLines2, origLines1, origLines2) {
  let leftHtml = '', rightHtml = '';
  let diffs = 0;
  const L = Math.max(caseLines1.length, caseLines2.length);
  for (let i = 0; i < L; i++) {
    const a = caseLines1[i] || '';
    const b = caseLines2[i] || '';
    const origA = origLines1[i] || '';
    const origB = origLines2[i] || '';
    if (a === b) {
      leftHtml += `<div class="diff-line-row" data-line="${i}"><div class="diff-gutter-cell"><span>${i + 1}</span><button class="swap-btn" data-line="${i}" data-side="left">↔</button></div><div class="diff-content-cell">${escapeHTML(origA)}</div></div>`;
      rightHtml += `<div class="diff-line-row" data-line="${i}"><div class="diff-gutter-cell"><span>${i + 1}</span><button class="swap-btn" data-line="${i}" data-side="right">↔</button></div><div class="diff-content-cell">${escapeHTML(origB)}</div></div>`;
    } else {
      const prefix = commonPrefix(a, b);
      const suffix = commonSuffix(a, b);
      const aMid = a.substring(prefix.length, a.length - suffix.length);
      const bMid = b.substring(prefix.length, b.length - suffix.length);
      const origPrefix = origA.substring(0, prefix.length);
      const origSuffix = origA.substring(origA.length - suffix.length);
      const origAMid = origA.substring(prefix.length, origA.length - suffix.length);
      const origBMid = origB.substring(prefix.length, origB.length - suffix.length);
      const origBSuffix = origB.substring(origB.length - suffix.length);
      diffs++;
      leftHtml += `<div class="diff-line-row removed" data-line="${i}"><div class="diff-gutter-cell"><span>${i + 1}</span><button class="swap-btn" data-line="${i}" data-side="left">↔</button></div><div class="diff-content-cell">${escapeHTML(origPrefix)}<span class="word-removed-strong">${escapeHTML(origAMid)}</span>${escapeHTML(origSuffix)}</div></div>`;
      rightHtml += `<div class="diff-line-row added" data-line="${i}"><div class="diff-gutter-cell"><span>${i + 1}</span><button class="swap-btn" data-line="${i}" data-side="right">↔</button></div><div class="diff-content-cell">${escapeHTML(origPrefix)}<span class="word-added-strong">${escapeHTML(origBMid)}</span>${escapeHTML(origBSuffix)}</div></div>`;
    }
  }
  linesLeft.innerHTML = leftHtml;
  linesRight.innerHTML = rightHtml;
  diffCountEl.textContent = diffs;
  document.querySelectorAll('.swap-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      swapLine(parseInt(btn.dataset.line), btn.dataset.side);
      e.stopPropagation();
    });
  });
}
function detailedDiff(caseLines1, caseLines2, origLines1, origLines2) {
  let leftHtml = '', rightHtml = '';
  let diffs = 0;
  const L = Math.max(caseLines1.length, caseLines2.length);
  for (let i = 0; i < L; i++) {
    const a = caseLines1[i] || '';
    const b = caseLines2[i] || '';
    const origA = origLines1[i] || '';
    const origB = origLines2[i] || '';
    if (a === b) {
      leftHtml += `<div class="diff-line-row" data-line="${i}"><div class="diff-gutter-cell"><span>${i + 1}</span><button class="swap-btn" data-line="${i}" data-side="left">↔</button></div><div class="diff-content-cell">${escapeHTML(origA)}</div></div>`;
      rightHtml += `<div class="diff-line-row" data-line="${i}"><div class="diff-gutter-cell"><span>${i + 1}</span><button class="swap-btn" data-line="${i}" data-side="right">↔</button></div><div class="diff-content-cell">${escapeHTML(origB)}</div></div>`;
    } else {
      const prefix = commonPrefix(a, b);
      const suffix = commonSuffix(a, b);
      const aMid = a.substring(prefix.length, a.length - suffix.length);
      const bMid = b.substring(prefix.length, b.length - suffix.length);
      const origPrefix = origA.substring(0, prefix.length);
      const origSuffix = origA.substring(origA.length - suffix.length);
      const origAMid = origA.substring(prefix.length, origA.length - suffix.length);
      const origBMid = origB.substring(prefix.length, origB.length - suffix.length);
      const origBSuffix = origB.substring(origB.length - suffix.length);
      diffs++;
      leftHtml += `<div class="diff-line-row removed" data-line="${i}"><div class="diff-gutter-cell"><span>${i + 1}</span><button class="swap-btn" data-line="${i}" data-side="left">↔</button></div><div class="diff-content-cell">${escapeHTML(origPrefix)}<span class="char-removed-strong">${escapeHTML(origAMid)}</span>${escapeHTML(origSuffix)}</div></div>`;
      rightHtml += `<div class="diff-line-row added" data-line="${i}"><div class="diff-gutter-cell"><span>${i + 1}</span><button class="swap-btn" data-line="${i}" data-side="right">↔</button></div><div class="diff-content-cell">${escapeHTML(origPrefix)}<span class="char-added-strong">${escapeHTML(origBMid)}</span>${escapeHTML(origBSuffix)}</div></div>`;
    }
  }
  linesLeft.innerHTML = leftHtml;
  linesRight.innerHTML = rightHtml;
  diffCountEl.textContent = diffs;
  document.querySelectorAll('.swap-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      swapLine(parseInt(btn.dataset.line), btn.dataset.side);
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
  const lines1 = [...state.lines1];
  const lines2 = [...state.lines2];
  const origLines1 = text1.value.split(/\r?\n/);
  const origLines2 = text2.value.split(/\r?\n/);
  if (lineIndex >= lines1.length) lines1[lineIndex] = '';
  if (lineIndex >= lines2.length) lines2[lineIndex] = '';
  if (side === 'left') {
    lines1[lineIndex] = lines2[lineIndex];
    origLines1[lineIndex] = origLines2[lineIndex] || '';
  } else {
    lines2[lineIndex] = lines1[lineIndex];
    origLines2[lineIndex] = origLines1[lineIndex] || '';
  }
  text1.value = origLines1.join('\n');
  text2.value = origLines2.join('\n');
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
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initDiffChecker);
} else {
  initDiffChecker();
}
