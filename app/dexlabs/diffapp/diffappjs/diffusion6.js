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

function myersDiff(old, newArr) {
  const n = old.length, m = newArr.length;
  const max = n + m;
  const v = { 1: 0 };
  const trace = [];
  for (let d = 0; d <= max; d++) {
    trace.push({ ...v });
    for (let k = -d; k <= d; k += 2) {
      let x;
      if (k === -d || (k !== d && v[k - 1] < v[k + 1])) {
        x = v[k + 1];
      } else {
        x = v[k - 1] + 1;
      }
      let y = x - k;
      while (x < n && y < m && old[x] === newArr[y]) {
        x++; y++;
      }
      v[k] = x;
      if (x >= n && y >= m) {
        const script = [];
        let i = n, j = m;
        for (let dBack = d; dBack > 0; dBack--) {
          const lastV = trace[dBack];
          const kBack = i - j;
          const cameFromLeft = (kBack === -dBack || (kBack !== dBack && lastV[kBack - 1] < lastV[kBack + 1]));
          const prevK = cameFromLeft ? kBack + 1 : kBack - 1;
          const prevX = lastV[prevK];
          const prevY = prevX - prevK;
          while (i > prevX && j > prevY) {
            script.unshift({ type: 'equal', value: old[i - 1] });
            i--; j--;
          }
          if (i > prevX) {
            script.unshift({ type: 'delete', value: old[i - 1] });
            i--;
          } else if (j > prevY) {
            script.unshift({ type: 'insert', value: newArr[j - 1] });
            j--;
          }
        }
        while (i > 0 && j > 0) {
          script.unshift({ type: 'equal', value: old[i - 1] });
          i--; j--;
        }
        return script;
      }
    }
  }
  return [];
}
  
function buildDiffRows(script) {
  const rows = [];
  for (let i = 0; i < script.length; i++) {
    const op = script[i];
    if (op.type === 'equal') {
      rows.push({ left: op.value, right: op.value });
    } else if (op.type === 'delete') {
      if (i + 1 < script.length && script[i + 1].type === 'insert') {
        rows.push({ left: op.value, right: script[i + 1].value });
        i++;
      } else {
        rows.push({ left: op.value, right: null });
      }
    } else {
      rows.push({ left: null, right: op.value });
    }
  }
  return rows;
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
  const lines1 = respect ? t1.split(/\r?\n/) : [t1];
  const lines2 = respect ? t2.split(/\r?\n/) : [t2];
  const script = myersDiff(lines1, lines2);
  const rows = buildDiffRows(script);
  let h1 = '', h2 = '';
  let leftNum = 1, rightNum = 1;
  let diffCount = 0;
  for (const row of rows) {
    const leftLine = row.left;
    const rightLine = row.right;
    const leftClass = leftLine !== null && rightLine !== null
      ? 'diff-replace'
      : (leftLine !== null ? 'diff-removed' : '');
    const rightClass = rightLine !== null && leftLine !== null
      ? 'diff-replace'
      : (rightLine !== null ? 'diff-added' : '');
    if (leftLine !== rightLine) diffCount++;
    let leftContent, rightContent;
    if (leftLine !== null && rightLine !== null && inline && leftLine.length + rightLine.length < 800) {
      const pre = diffCommonPrefix(leftLine, rightLine);
      const suf = diffCommonSuffix(leftLine, rightLine);
      const leftMid = leftLine.slice(pre.length, leftLine.length - suf.length);
      const rightMid = rightLine.slice(pre.length, rightLine.length - suf.length);
      leftContent = diffEscapeHTML(pre) + '<span class="diff-word-removed-strong">' + diffEscapeHTML(leftMid) + '</span>' + diffEscapeHTML(suf);
      rightContent = diffEscapeHTML(pre) + '<span class="diff-word-added-strong">' + diffEscapeHTML(rightMid) + '</span>' + diffEscapeHTML(suf);
    } else {
      leftContent = leftLine !== null ? diffEscapeHTML(leftLine) : '&nbsp;';
      rightContent = rightLine !== null ? diffEscapeHTML(rightLine) : '&nbsp;';
    }
    const leftGutter = leftLine !== null ? leftNum++ : '&nbsp;';
    const rightGutter = rightLine !== null ? rightNum++ : '&nbsp;';
    h1 += `<div class="diff-line-row ${leftClass}" data-line="${leftLine !== null ? leftNum - 1 : ''}">` +
          `<div class="diff-gutter-cell">${leftGutter}</div>` +
          `<div class="diff-content-cell">${leftContent}</div></div>`;
    h2 += `<div class="diff-line-row ${rightClass}" data-line="${rightLine !== null ? rightNum - 1 : ''}">` +
          `<div class="diff-gutter-cell">${rightGutter}</div>` +
          `<div class="diff-content-cell">${rightContent}</div></div>`;
  }
  diffElements.d1.innerHTML = h1 || '<div style="padding:0 16px; color:#666;">No content</div>';
  diffElements.d2.innerHTML = h2 || '<div style="padding:0 16px; color:#666;">No content</div>';
  document.getElementById('diffStatDiff').textContent = diffCount;
  document.getElementById('diffStatLine').textContent = Math.max(lines1.length, lines2.length);
  document.getElementById('diffStatStatus').textContent = diffCount === 0 ? 'Identical' : 'Differences Found';
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

  
  function diffEscapeHTML(s) { return String(s).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'})[m] || '&#039;'); }
  function diffCommonPrefix(a, b) { let i=0; while(i<a.length && i<b.length && a[i]===b[i]) i++; return a.slice(0,i); }
  function diffCommonSuffix(a, b) { let i=0; while(i<a.length && i<b.length && a[a.length-1-i]===b[b.length-1-i]) i++; return a.slice(a.length-i); }

  [diffElements.raw, diffElements.morph].forEach(t => t.addEventListener('input', diffusion));
  diffusion();
