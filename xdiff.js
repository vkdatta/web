window.clearAll = function() {
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
window.swapTexts = function() {
const temp = text1.value;
text1.value = text2.value;
text2.value = temp;
compareTexts();
}
window.escapeHTML = function(str) {
return str
.replace(/&/g, "&amp;")
.replace(/</g, "&lt;")
.replace(/>/g, "&gt;")
.replace(/"/g, "&quot;")
.replace(/'/g, "&#039;");
}
window.setupScrollSync = function() {
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
window.syncScroll = function() {
const target = this === leftPane ? rightPane : leftPane;
target.scrollTop = this.scrollTop;
target.scrollLeft = this.scrollLeft;
}
window.commonPrefix = function(a, b) {
let i = 0;
const min = Math.min(a.length, b.length);
while (i < min && a[i] === b[i]) i++;
return a.substring(0, i);
}
window.commonSuffix = function(a, b) {
let i = 0;
const min = Math.min(a.length, b.length);
while (i < min && a[a.length - 1 - i] === b[b.length - 1 - i]) i++;
return a.substring(a.length - i);
}
window.swapLine = function(lineIndex, side) {
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
window.initDiffChecker = function() {
if (!window.text1 || !window.text2) {
console.warn('Diff checker DOM elements not found');
return;
}
window.safeAddListener(window.uploadBtn1, 'click', () => window.fileInput1.click());
window.safeAddListener(window.uploadBtn2, 'click', () => window.fileInput2.click());
window.safeAddListener(window.fileInput1, 'change', window.handleFileUpload1);
window.safeAddListener(window.fileInput2, 'change', window.handleFileUpload2);
if (window.compareBtn) window.compareBtn.addEventListener('click', window.compareTexts);
if (window.clearBtn) window.clearBtn.addEventListener('click', window.clearAll);
if (window.swapBtn) window.swapBtn.addEventListener('click', window.swapTexts);
setTimeout(window.compareTexts, 300);
};
