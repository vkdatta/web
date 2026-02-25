document.addEventListener('contextmenu', e => {
    if (e.target.closest('body')) e.preventDefault();
  });

function diffHideOverlay() { diffElements.overlay.classList.remove('visible'); }

  document.addEventListener('selectionchange', () => {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed) return diffHideOverlay();

    const range = sel.getRangeAt(0);
    const container = range.commonAncestorContainer;
    const element = container.nodeType === 3 ? container.parentElement : container;
    
    const view = element.closest('.diff-view');
    if (!view || (view.id !== 'diffDiff1View' && view.id !== 'diffDiff2View')) return diffHideOverlay();

    const startRow = (range.startContainer.nodeType === 3 ? range.startContainer.parentElement : range.startContainer).closest('.diff-line-row');
    const endRow = (range.endContainer.nodeType === 3 ? range.endContainer.parentElement : range.endContainer).closest('.diff-line-row');
    
    if (!startRow || !endRow) return diffHideOverlay();

    const gutter = startRow.querySelector('.diff-gutter-cell');
    let isLineSelection = false;
    if (gutter && (range.intersectsNode(gutter) || gutter.contains(range.startContainer) || gutter.contains(range.endContainer))) {
      isLineSelection = true;
    }

    diffCurrentSelection = {
      viewId: view.id,
      startLine: parseInt(startRow.dataset.line),
      endLine: parseInt(endRow.dataset.line),
      text: sel.toString(),
      isLineSelection: isLineSelection,
      startOffset: range.startOffset,
      endOffset: range.endOffset
    };

    const rect = range.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    
    diffElements.overlay.classList.add('visible');
    const ovRect = diffElements.overlay.getBoundingClientRect();
    
    let topPos = rect.bottom + 10;
    let leftPos = rect.left + (rect.width / 2) - (ovRect.width / 2);
    
    if (topPos + ovRect.height > window.innerHeight - 10) {
      topPos = rect.top - ovRect.height - 10;
    }
    
    if (leftPos + ovRect.width > window.innerWidth - 10) {
      leftPos = window.innerWidth - ovRect.width - 10; 
    }
    if (leftPos < 10) leftPos = 10;
    
    diffElements.overlay.style.top = topPos + 'px';
    diffElements.overlay.style.left = leftPos + 'px';
  });


document.getElementById('diffOverlaySave').onclick = () => {
    diffSavedText = diffCurrentSelection.text;
    document.getElementById('diffStatSaved').textContent = diffSavedText;
    diffHideOverlay();
  };

document.getElementById('diffOverlaySwapLine').onclick = () => {
    if (diffCurrentSelection.startLine < 0) return;
    const isSourceRaw = diffCurrentSelection.viewId === 'diffDiff1View';
    const sourceLines = diffGetLines(isSourceRaw);
    const targetLines = diffGetLines(!isSourceRaw);

    for (let i = diffCurrentSelection.startLine; i <= diffCurrentSelection.endLine; i++) {
      sourceLines[i] = targetLines[i] !== undefined ? targetLines[i] : '';
    }
    diffSetLines(isSourceRaw, sourceLines);
    diffusion();
    diffHideOverlay();
  };

  document.getElementById('diffOverlaySwapSaved').onclick = () => {
    if (!diffSavedText || diffCurrentSelection.startLine < 0) return;
    
    const isSourceRaw = diffCurrentSelection.viewId === 'diffDiff1View';
    const lines = diffGetLines(isSourceRaw);
    const savedLines = diffSavedText.split(/\r?\n/);
    const start = diffCurrentSelection.startLine;
    const end = diffCurrentSelection.endLine;

    if (diffCurrentSelection.isLineSelection) {
      for (let i = start; i <= end; i++) {
        lines[i] = (i - start < savedLines.length) ? savedLines[i - start] : '';
      }
    } else {
      if (start === end) {
        const lineText = lines[start] || '';
        lines[start] = lineText.substring(0, diffCurrentSelection.startOffset) + diffSavedText + lineText.substring(diffCurrentSelection.endOffset);
      } else {
        for (let i = start; i <= end; i++) {
          lines[i] = (i - start < savedLines.length) ? savedLines[i - start] : '';
        }
      }
    }
    diffSetLines(isSourceRaw, lines);
    diffusion();
    diffHideOverlay();
  };


 document.addEventListener('pointerdown', (e) => {
    if (!diffElements.overlay.contains(e.target) && !e.target.closest('.diff-line-row')) diffHideOverlay();
  });
