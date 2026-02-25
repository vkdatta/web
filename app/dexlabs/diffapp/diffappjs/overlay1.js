let diffCurrentSelection = { 
    viewId: null, 
    startLine: -1, 
    endLine: -1, 
    text: '', 
    isLineSelection: false, 
    startOffset: 0, 
    endOffset: 0 
};

document.querySelectorAll('.diff-view').forEach(view => {
    view.addEventListener('contextmenu', e => e.preventDefault());
});

function getCaretCharacterOffsetWithin(element, range, isStart) {
    const preSelectionRange = range.cloneRange();
    preSelectionRange.selectNodeContents(element);
    if (isStart) {
        preSelectionRange.setEnd(range.startContainer, range.startOffset);
    } else {
        preSelectionRange.setEnd(range.endContainer, range.endOffset);
    }
    return preSelectionRange.toString().length;
}

function diffGetLines(isRaw) {
    const text = isRaw ? diffElements.raw.value : diffElements.morph.value;
    return diffElements.optBreaks.checked ? text.split(/\r?\n/) : [text.replace(/\r?\n/g, ' ')];
}

function diffSetLines(isRaw, linesArray) {
    const result = linesArray.join('\n');
    if (isRaw) diffElements.raw.value = result;
    else diffElements.morph.value = result;
}

function diffHideOverlay() { 
    if (diffElements.overlay) diffElements.overlay.classList.remove('visible'); 
}

document.addEventListener('selectionchange', () => {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0 || sel.isCollapsed) return diffHideOverlay();

    const range = sel.getRangeAt(0);
    const container = range.commonAncestorContainer;
    const element = container.nodeType === 3 ? container.parentElement : container;
    
    const view = element.closest('.diff-view');
    if (!view || (view.id !== 'diffDiff1View' && view.id !== 'diffDiff2View')) return diffHideOverlay();

    const startRow = (range.startContainer.nodeType === 3 ? range.startContainer.parentElement : range.startContainer).closest('.diff-line-row');
    const endRow = (range.endContainer.nodeType === 3 ? range.endContainer.parentElement : range.endContainer).closest('.diff-line-row');
    
    if (!startRow || !endRow) return diffHideOverlay();

    const startContent = startRow.querySelector('.diff-content-cell') || startRow;
    const endContent = endRow.querySelector('.diff-content-cell') || endRow;
    const gutter = startRow.querySelector('.diff-gutter-cell');
    let isLineSelection = gutter && (range.intersectsNode(gutter) || gutter.contains(range.startContainer));

    diffCurrentSelection = {
        viewId: view.id,
        startLine: parseInt(startRow.dataset.line) - 1, 
        endLine: parseInt(endRow.dataset.line) - 1,
        text: sel.toString(),
        isLineSelection: isLineSelection,
        startOffset: getCaretCharacterOffsetWithin(startContent, range, true),
        endOffset: getCaretCharacterOffsetWithin(endContent, range, false)
    };

    const rect = range.getBoundingClientRect();
    if (rect.width === 0) return;
    
    diffElements.overlay.classList.add('visible');
    
    const scrollY = window.pageYOffset || document.documentElement.scrollTop;
    const scrollX = window.pageXOffset || document.documentElement.scrollLeft;
    
    let topPos = rect.bottom + scrollY + 10;
    let leftPos = rect.left + scrollX + (rect.width / 2) - (diffElements.overlay.offsetWidth / 2);
    
    if (leftPos < 10) leftPos = 10;
    if (leftPos + diffElements.overlay.offsetWidth > window.innerWidth - 10) {
        leftPos = window.innerWidth - diffElements.overlay.offsetWidth - 10;
    }

    diffElements.overlay.style.top = topPos + 'px';
    diffElements.overlay.style.left = leftPos + 'px';
});

document.getElementById('diffOverlaySave').onclick = async () => {
    try {
        await navigator.clipboard.writeText(diffCurrentSelection.text);
        diffHideOverlay();
    } catch (err) {
        console.error(err);
    }
};

document.getElementById('diffOverlaySwapLine').onclick = () => {
    if (diffCurrentSelection.startLine < 0) return;
    const isSourceRaw = diffCurrentSelection.viewId === 'diffDiff1View';
    const sourceLines = diffGetLines(isSourceRaw);
    const targetLines = diffGetLines(!isSourceRaw);

    for (let i = diffCurrentSelection.startLine; i <= diffCurrentSelection.endLine; i++) {
        if (sourceLines[i] !== undefined) {
            sourceLines[i] = targetLines[i] !== undefined ? targetLines[i] : '';
        }
    }
    diffSetLines(isSourceRaw, sourceLines);
    if (typeof diffusion === 'function') diffusion();
    diffHideOverlay();
};

document.getElementById('diffOverlaySwapSaved').onclick = async () => {
    if (diffCurrentSelection.startLine < 0) return;
    
    try {
        const clipboardText = await navigator.clipboard.readText();
        if (clipboardText === undefined) return;

        const isSourceRaw = diffCurrentSelection.viewId === 'diffDiff1View';
        const lines = diffGetLines(isSourceRaw);
        const savedLines = clipboardText.split(/\r?\n/);
        const { startLine, endLine, startOffset, endOffset } = diffCurrentSelection;

        if (diffCurrentSelection.isLineSelection || startLine !== endLine) {
            for (let i = startLine; i <= endLine; i++) {
                if (lines[i] !== undefined) {
                    lines[i] = (i - startLine < savedLines.length) ? savedLines[i - startLine] : '';
                }
            }
        } else {
            const lineText = lines[startLine] || '';
            lines[startLine] = lineText.substring(0, startOffset) + clipboardText + lineText.substring(endOffset);
        }

        diffSetLines(isSourceRaw, lines);
        if (typeof diffusion === 'function') diffusion();
        diffHideOverlay();
    } catch (err) {
        console.error(err);
    }
};

document.addEventListener('pointerdown', (e) => {
    if (!diffElements.overlay.contains(e.target) && !e.target.closest('.diff-line-row')) {
        diffHideOverlay();
    }
});
