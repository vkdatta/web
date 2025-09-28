// DiffChecker - Complete Application
window.text1 = null;
window.text2 = null;
window.compareBtn = null;
window.clearBtn = null;
window.swapBtn = null;
window.linesLeft = null;
window.linesRight = null;
window.diffSummary = null;
window.diffCountEl = null;
window.lineCountEl = null;
window.saveSelLeftBtn = null;
window.saveSelRightBtn = null;
window.applySwapBtn = null;
window.swapDirectionEl = null;
window.selectionInfo = null;
window.uploadBtn1 = null;
window.uploadBtn2 = null;
window.fileInput1 = null;
window.fileInput2 = null;
window.savedLeft = null;
window.savedRight = null;
window.state = { s1flat: '', s2flat: '', lines1: [], lines2: [], map1: [], map2: [], lineStarts1: [], lineStarts2: [] };
window.WORD_DIFF_THRESHOLD = 5000;
window.LINE_DIFF_THRESHOLD = 500;

// Initialize Diff Checker
window.initDiffChecker = function() {
    console.log('Initializing Diff Checker...');
    
    // Initialize DOM references
    window.text1 = document.getElementById('diffText1');
    window.text2 = document.getElementById('diffText2');
    window.compareBtn = document.getElementById('compareBtn');
    window.clearBtn = document.getElementById('clearBtn');
    window.swapBtn = document.getElementById('swapBtn');
    window.linesLeft = document.getElementById('linesLeft');
    window.linesRight = document.getElementById('linesRight');
    window.diffSummary = document.getElementById('diffSummary');
    window.diffCountEl = document.getElementById('diffCount');
    window.lineCountEl = document.getElementById('lineCount');
    window.saveSelLeftBtn = document.getElementById('saveSelLeft');
    window.saveSelRightBtn = document.getElementById('saveSelRight');
    window.applySwapBtn = document.getElementById('applySwap');
    window.swapDirectionEl = document.getElementById('swapDirection');
    window.selectionInfo = document.getElementById('selectionInfo');
    window.uploadBtn1 = document.getElementById('uploadBtn1');
    window.uploadBtn2 = document.getElementById('uploadBtn2');
    window.fileInput1 = document.getElementById('fileInput1');
    window.fileInput2 = document.getElementById('fileInput2');

    // Setup event listeners
    window.setupDiffCheckerEventListeners();
    
    console.log('Diff Checker initialized');
};

// Setup event listeners for Diff Checker
window.setupDiffCheckerEventListeners = function() {
    window.safeAddListener(window.compareBtn, 'click', window.compareTexts);
    window.safeAddListener(window.clearBtn, 'click', window.clearAll);
    window.safeAddListener(window.swapBtn, 'click', window.swapTexts);
    window.safeAddListener(window.uploadBtn1, 'click', function() { window.fileInput1.click(); });
    window.safeAddListener(window.uploadBtn2, 'click', function() { window.fileInput2.click(); });
    window.safeAddListener(window.fileInput1, 'change', window.handleFileUpload1);
    window.safeAddListener(window.fileInput2, 'change', window.handleFileUpload2);
};

// Compare texts
window.compareTexts = function() {
    if (!window.text1 || !window.text2) return;
    
    const orig1 = window.text1.value || '';
    const orig2 = window.text2.value || '';
    const largeFile = orig1.length + orig2.length > window.WORD_DIFF_THRESHOLD;
    
    if (window.diffSummary) {
        window.diffSummary.textContent = largeFile ?
            'Processing large file (line-level diff only)...' :
            'Comparing texts...';
    }
    
    setTimeout(function() {
        try {
            const lines1 = orig1.split(/\r?\n/);
            const lines2 = orig2.split(/\r?\n/);
            const L = Math.max(lines1.length, lines2.length);
            
            if (largeFile || lines1.length > window.LINE_DIFF_THRESHOLD || lines2.length > window.LINE_DIFF_THRESHOLD) {
                window.fastLineDiff(lines1, lines2);
            } else {
                window.detailedDiff(lines1, lines2);
            }
            
            if (window.lineCountEl) window.lineCountEl.textContent = L;
            if (window.diffSummary) {
                window.diffSummary.textContent = window.diffCountEl && window.diffCountEl.textContent === '0' ?
                    'Texts are identical!' : 'Comparison complete';
            }
            
            window.setupScrollSync();
        } catch (e) {
            if (window.diffSummary) window.diffSummary.textContent = 'Error during comparison';
        }
    }, 50);
};

// Clear all
window.clearAll = function() {
    if (window.text1) window.text1.value = '';
    if (window.text2) window.text2.value = '';
    if (window.linesLeft) window.linesLeft.innerHTML = 'Original text will appear here after comparison';
    if (window.linesRight) window.linesRight.innerHTML = 'Changed text will appear here after comparison';
    if (window.diffSummary) window.diffSummary.textContent = 'Ready to compare';
    if (window.diffCountEl) window.diffCountEl.textContent = '0';
    if (window.lineCountEl) window.lineCountEl.textContent = '0';
    window.savedLeft = null;
    window.savedRight = null;
    if (window.selectionInfo) window.selectionInfo.textContent = 'None';
};

// Swap texts
window.swapTexts = function() {
    if (!window.text1 || !window.text2) return;
    const temp = window.text1.value;
    window.text1.value = window.text2.value;
    window.text2.value = temp;
    window.compareTexts();
};

// Fast line diff
window.fastLineDiff = function(lines1, lines2) {
    let leftHtml = '', rightHtml = '';
    let diffs = 0;
    const L = Math.max(lines1.length, lines2.length);
    
    for (let i = 0; i < L; i++) {
        const a = lines1[i] || '';
        const b = lines2[i] || '';
        
        if (a === b) {
            leftHtml += '<div class="line-row" data-line="' + i + '">' +
                '<div class="gutter-cell"><span>' + (i + 1) + '</span>' +
                '<button class="swap-btn" data-line="' + i + '" data-side="left">↔</button></div>' +
                '<div class="content-cell">' + window.escapeHTML(a) + '</div></div>';
            rightHtml += '<div class="line-row" data-line="' + i + '">' +
                '<div class="gutter-cell"><span>' + (i + 1) + '</span>' +
                '<button class="swap-btn" data-line="' + i + '" data-side="right">↔</button></div>' +
                '<div class="content-cell">' + window.escapeHTML(b) + '</div></div>';
        } else {
            diffs++;
            leftHtml += '<div class="line-row removed" data-line="' + i + '">' +
                '<div class="gutter-cell"><span>' + (i + 1) + '</span>' +
                '<button class="swap-btn" data-line="' + i + '" data-side="left">↔</button></div>' +
                '<div class="content-cell">' + (a ? window.escapeHTML(a) : '&nbsp;') + '</div></div>';
            rightHtml += '<div class="line-row added" data-line="' + i + '">' +
                '<div class="gutter-cell"><span>' + (i + 1) + '</span>' +
                '<button class="swap-btn" data-line="' + i + '" data-side="right">↔</button></div>' +
                '<div class="content-cell">' + (b ? window.escapeHTML(b) : '&nbsp;') + '</div></div>';
        }
    }
    
    if (window.linesLeft) window.linesLeft.innerHTML = leftHtml;
    if (window.linesRight) window.linesRight.innerHTML = rightHtml;
    if (window.diffCountEl) window.diffCountEl.textContent = diffs;
    
    // Add swap button listeners
    document.querySelectorAll('.swap-btn').forEach(function(btn) {
        btn.addEventListener('click', function(e) {
            window.swapLine(parseInt(this.dataset.line), this.dataset.side);
            e.stopPropagation();
        });
    });
};

// Detailed diff
window.detailedDiff = function(lines1, lines2) {
    let leftHtml = '', rightHtml = '';
    let diffs = 0;
    const L = Math.max(lines1.length, lines2.length);
    
    for (let i = 0; i < L; i++) {
        const a = lines1[i] || '';
        const b = lines2[i] || '';
        
        if (a === b) {
            leftHtml += '<div class="line-row" data-line="' + i + '">' +
                '<div class="gutter-cell"><span>' + (i + 1) + '</span>' +
                '<button class="swap-btn" data-line="' + i + '" data-side="left">↔</button></div>' +
                '<div class="content-cell">' + window.escapeHTML(a) + '</div></div>';
            rightHtml += '<div class="line-row" data-line="' + i + '">' +
                '<div class="gutter-cell"><span>' + (i + 1) + '</span>' +
                '<button class="swap-btn" data-line="' + i + '" data-side="right">↔</button></div>' +
                '<div class="content-cell">' + window.escapeHTML(b) + '</div></div>';
        } else {
            const prefix = window.commonPrefix(a, b);
            const suffix = window.commonSuffix(a, b);
            const aMid = a.substring(prefix.length, a.length - suffix.length);
            const bMid = b.substring(prefix.length, b.length - suffix.length);
            diffs++;
            
            leftHtml += '<div class="line-row" data-line="' + i + '">' +
                '<div class="gutter-cell"><span>' + (i + 1) + '</span>' +
                '<button class="swap-btn" data-line="' + i + '" data-side="left">↔</button></div>' +
                '<div class="content-cell">' + window.escapeHTML(prefix) +
                '<span class="word-removed-strong">' + window.escapeHTML(aMid) + '</span>' +
                window.escapeHTML(suffix) + '</div></div>';
            rightHtml += '<div class="line-row" data-line="' + i + '">' +
                '<div class="gutter-cell"><span>' + (i + 1) + '</span>' +
                '<button class="swap-btn" data-line="' + i + '" data-side="right">↔</button></div>' +
                '<div class="content-cell">' + window.escapeHTML(prefix) +
                '<span class="word-added-strong">' + window.escapeHTML(bMid) + '</span>' +
                window.escapeHTML(suffix) + '</div></div>';
        }
    }
    
    if (window.linesLeft) window.linesLeft.innerHTML = leftHtml;
    if (window.linesRight) window.linesRight.innerHTML = rightHtml;
    if (window.diffCountEl) window.diffCountEl.textContent = diffs;
    
    document.querySelectorAll('.swap-btn').forEach(function(btn) {
        btn.addEventListener('click', function(e) {
            window.swapLine(parseInt(this.dataset.line), this.dataset.side);
            e.stopPropagation();
        });
    });
};

// Common prefix
window.commonPrefix = function(a, b) {
    let i = 0;
    const min = Math.min(a.length, b.length);
    while (i < min && a[i] === b[i]) i++;
    return a.substring(0, i);
};

// Common suffix
window.commonSuffix = function(a, b) {
    let i = 0;
    const min = Math.min(a.length, b.length);
    while (i < min && a[a.length - 1 - i] === b[b.length - 1 - i]) i++;
    return a.substring(a.length - i);
};

// Swap line
window.swapLine = function(lineIndex, side) {
    const lines1 = [].concat(window.state.lines1);
    const lines2 = [].concat(window.state.lines2);
    
    if (lineIndex >= lines1.length) lines1.length = lineIndex + 1;
    if (lineIndex >= lines2.length) lines2.length = lineIndex + 1;
    
    if (side === 'left') {
        lines1[lineIndex] = lines2[lineIndex] || '';
    } else {
        lines2[lineIndex] = lines1[lineIndex] || '';
    }
    
    if (window.text1) window.text1.value = lines1.join('\n');
    if (window.text2) window.text2.value = lines2.join('\n');
    window.compareTexts();
};

// Handle file upload
window.handleFileUpload1 = function(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(event) {
            if (window.text1) window.text1.value = event.target.result;
            window.compareTexts();
        };
        reader.readAsText(file);
    }
};

window.handleFileUpload2 = function(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(event) {
            if (window.text2) window.text2.value = event.target.result;
            window.compareTexts();
        };
        reader.readAsText(file);
    }
};

// Setup scroll sync
window.setupScrollSync = function() {
    const panes = document.querySelectorAll('.diff-pane-scroller');
    if (panes.length < 2) return;
    
    const leftPane = panes[0];
    const rightPane = panes[1];
    
    function syncScroll() {
        const target = this === leftPane ? rightPane : leftPane;
        target.scrollTop = this.scrollTop;
        target.scrollLeft = this.scrollLeft;
    }
    
    leftPane.addEventListener('scroll', syncScroll);
    rightPane.addEventListener('scroll', syncScroll);
};

// Escape HTML
window.escapeHTML = function(str) {
    return str.replace(/&/g, '&amp;')
              .replace(/</g, '&lt;')
              .replace(/>/g, '&gt;')
              .replace(/"/g, '&quot;')
              .replace(/'/g, '&#039;');
};

console.log('DiffChecker functions loaded');
