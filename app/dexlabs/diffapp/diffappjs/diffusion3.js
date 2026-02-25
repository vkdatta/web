document.addEventListener('contextmenu', e => {
    if (e.target.closest('body')) e.preventDefault();
  });

  const diffElements = {
    raw: document.getElementById('diffRawInput'),
    morph: document.getElementById('diffMorphInput'),
    gRaw: document.getElementById('diffRawGutter'),
    gMorph: document.getElementById('diffMorphGutter'),
    scrollD1: document.getElementById('diffDiff1Scroll'),
    scrollD2: document.getElementById('diffDiff2Scroll'),
    d1: document.getElementById('diffDiff1Lines'),
    d2: document.getElementById('diffDiff2Lines'),
    optBreaks: document.getElementById('diffOptBreaks'),
    optInline: document.getElementById('diffOptInline'),
    optSync: document.getElementById('diffOptSyncScroll'),
    overlay: document.getElementById('diffCustomOverlay')
  };

  let diffSavedText = '';
  let diffCurrentSelection = { viewId: null, startLine: -1, endLine: -1, text: '', isLineSelection: false, startOffset: 0, endOffset: 0 };

  const diffScrollTargets = [diffElements.raw, diffElements.morph, diffElements.scrollD1, diffElements.scrollD2];
  let diffIsSyncing = false;
  let diffGlobalScrollTop = 0;
  let diffGlobalScrollLeft = 0;

  function diffUpdateGutter(textarea, gutter) {
    const lines = textarea.value.split('\n').length;
    let html = '';
    for (let i = 1; i <= lines; i++) html += i + '<br>';
    gutter.innerHTML = html;
  }

  diffScrollTargets.forEach(target => {
    target.addEventListener('scroll', (e) => {
      if (e.target === diffElements.raw) diffElements.gRaw.scrollTop = diffElements.raw.scrollTop;
      if (e.target === diffElements.morph) diffElements.gMorph.scrollTop = diffElements.morph.scrollTop;

      if (!diffElements.optSync.checked || diffIsSyncing) return;
      diffIsSyncing = true;
      
      diffGlobalScrollTop = e.target.scrollTop;
      diffGlobalScrollLeft = e.target.scrollLeft;

      diffScrollTargets.forEach(t => {
        if (t !== e.target && t.offsetParent !== null) {
          t.scrollTop = diffGlobalScrollTop;
          t.scrollLeft = diffGlobalScrollLeft;
        }
      });

      requestAnimationFrame(() => { diffIsSyncing = false; });
    });
  });

  function diffNavigate(viewId, btnElement) {
    document.querySelectorAll('.diff-view').forEach(v => v.classList.remove('active'));
    document.querySelectorAll('.diff-topbar-button').forEach(b => b.classList.remove('active'));
    document.getElementById(viewId).classList.add('active');
    
    if (btnElement) btnElement.classList.add('active');
    diffHideOverlay();

    if (diffElements.optSync.checked) {
      requestAnimationFrame(() => {
        const activeView = document.getElementById(viewId);
        const target = activeView.querySelector('.diff-editor, .diff-lines-container');
        if (target) {
          diffIsSyncing = true;
          target.scrollTop = diffGlobalScrollTop;
          target.scrollLeft = diffGlobalScrollLeft;
          requestAnimationFrame(() => { diffIsSyncing = false; });
        }
      });
    }
  }

  function diffusion() {
    let t1 = diffElements.raw.value || '';
    let t2 = diffElements.morph.value || '';
    const respect = diffElements.optBreaks.checked;
    const inline = diffElements.optInline.checked;

    diffUpdateGutter(diffElements.raw, diffElements.gRaw);
    diffUpdateGutter(diffElements.morph, diffElements.gMorph);

    if (!respect) {
      t1 = t1.replace(/\r?\n/g, ' ');
      t2 = t2.replace(/\r?\n/g, ' ');
    }

    const l1 = respect ? t1.split(/\r?\n/) : [t1];
    const l2 = respect ? t2.split(/\r?\n/) : [t2];
    const max = Math.max(l1.length, l2.length);
    
    let h1 = '', h2 = '', diffs = 0;

    for (let i = 0; i < max; i++) {
      const a = l1[i] || '';
      const b = l2[i] || '';
      const ln = i + 1;

      if (a === b) {
        const row = `<div class="diff-line-row" data-line="${i}"><div class="diff-gutter-cell">${ln}</div><div class="diff-content-cell">${diffEscapeHTML(a) || '&nbsp;'}</div></div>`;
        h1 += row; h2 += row;
      } else {
        diffs++;
        if (inline && a.length + b.length < 800) {
          const pre = diffCommonPrefix(a, b);
          const suf = diffCommonSuffix(a, b);
          const aMid = a.slice(pre.length, a.length - suf.length);
          const bMid = b.slice(pre.length, b.length - suf.length);
          
          h1 += `<div class="diff-line-row diff-removed" data-line="${i}"><div class="diff-gutter-cell">${ln}</div><div class="diff-content-cell">${diffEscapeHTML(pre)}<span class="diff-word-removed-strong">${diffEscapeHTML(aMid)}</span>${diffEscapeHTML(suf)}</div></div>`;
          h2 += `<div class="diff-line-row diff-added" data-line="${i}"><div class="diff-gutter-cell">${ln}</div><div class="diff-content-cell">${diffEscapeHTML(pre)}<span class="diff-word-added-strong">${diffEscapeHTML(bMid)}</span>${diffEscapeHTML(suf)}</div></div>`;
        } else {
          h1 += `<div class="diff-line-row diff-removed" data-line="${i}"><div class="diff-gutter-cell">${ln}</div><div class="diff-content-cell">${diffEscapeHTML(a) || '&nbsp;'}</div></div>`;
          h2 += `<div class="diff-line-row diff-added" data-line="${i}"><div class="diff-gutter-cell">${ln}</div><div class="diff-content-cell">${diffEscapeHTML(b) || '&nbsp;'}</div></div>`;
        }
      }
    }

    diffElements.d1.innerHTML = h1 || '<div style="padding:0 16px; color:#666;">No content</div>';
    diffElements.d2.innerHTML = h2 || '<div style="padding:0 16px; color:#666;">No content</div>';
    
    document.getElementById('diffStatDiff').textContent = diffs;
    document.getElementById('diffStatLine').textContent = max;
    document.getElementById('diffStatStatus').textContent = diffs === 0 ? 'Identical' : 'Differences Found';
  }

  function diffHandleFile(input, type) {
    const file = input.files[0];
    if (!file) return;
    const r = new FileReader();
    r.onload = (e) => {
      if (type === 'raw') diffElements.raw.value = e.target.result;
      else diffElements.morph.value = e.target.result;
      diffusion();
    };
    r.readAsText(file);
    input.value = ''; 
  }

  function diffSwapTexts() {
    const temp = diffElements.raw.value;
    diffElements.raw.value = diffElements.morph.value;
    diffElements.morph.value = temp;
    diffusion();
  }

  function diffClearText(type) {
    if (type === 'raw') diffElements.raw.value = '';
    else diffElements.morph.value = '';
    diffusion();
  }

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

  document.addEventListener('mousedown', (e) => {
    if (!diffElements.overlay.contains(e.target) && !e.target.closest('.diff-line-row')) diffHideOverlay();
  });
  
  document.addEventListener('touchstart', (e) => {
    if (!diffElements.overlay.contains(e.target) && !e.target.closest('.diff-line-row')) diffHideOverlay();
  });

  document.getElementById('diffOverlaySave').onclick = () => {
    diffSavedText = diffCurrentSelection.text;
    document.getElementById('diffStatSaved').textContent = diffSavedText;
    diffHideOverlay();
  };

  function diffGetLines(isRaw) {
    const text = isRaw ? diffElements.raw.value : diffElements.morph.value;
    return diffElements.optBreaks.checked ? text.split(/\r?\n/) : [text.replace(/\r?\n/g, ' ')];
  }

  function diffSetLines(isRaw, linesArray) {
    const result = linesArray.join('\n');
    if (isRaw) diffElements.raw.value = result;
    else diffElements.morph.value = result;
  }

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

  function diffEscapeHTML(s) { return String(s).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'})[m] || '&#039;'); }
  function diffCommonPrefix(a, b) { let i=0; while(i<a.length && i<b.length && a[i]===b[i]) i++; return a.slice(0,i); }
  function diffCommonSuffix(a, b) { let i=0; while(i<a.length && i<b.length && a[a.length-1-i]===b[b.length-1-i]) i++; return a.slice(a.length-i); }

  [diffElements.raw, diffElements.morph].forEach(t => t.addEventListener('input', diffusion));
  diffusion();
