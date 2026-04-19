(function () {
  'use strict';

  if (!document.getElementById('fp-styles')) {
    const s = document.createElement('style');
    s.id = 'fp-styles';
    s.textContent = `
      .fp-body {
        flex: 1;
        min-height: 0;
        overflow-y: auto;
        padding: 14px 16px;
        display: flex;
        flex-direction: column;
        gap: 16px;
      }
      .fp-body::-webkit-scrollbar { width: 3px; }
      .fp-body::-webkit-scrollbar-thumb {
        background: var(--border);
        border-radius: 10px;
      }
      .fp-section {
        display: flex;
        flex-direction: column;
        gap: 7px;
      }
      .fp-section-header {
        display: flex;
        align-items: center;
        gap: 10px;
        flex-shrink: 0;
      }
      .fp-panel-label {
        font-weight: 700;
        color: var(--blueink);
        text-transform: uppercase;
        letter-spacing: 0.7px;
        flex-shrink: 0;
        white-space: nowrap;
      }
      .fp-search {
        position: relative;
        display: flex;
        align-items: center;
        flex: 1;
      }
      .fp-search-icon {
        position: absolute;
        left: 9px;
        color: var(--blueink);
        pointer-events: none;
        line-height: 1;
      }
      .fp-search-input {
        width: 100%;
        box-sizing: border-box;
        padding: 5px 10px 5px 30px;
        background: #1e2124;
        border: 1px solid var(--border);
        border-radius: 20px;
        color: #eeeeee;
        outline: none;
        font-family: inherit;
        transition: border-color 0.2s;
      }
      .fp-search-input:focus {
        border-color: rgba(100, 116, 255, 0.55);
      }
      .fp-list {
        display: flex;
        flex-direction: column;
        gap: 5px;
      }
      .fp-card {
        cursor: pointer;
        border: 1px solid var(--border);
        border-radius: 10px;
        padding: 10px 14px;
        background: #1e2124;
        transition: border-color 0.18s, background 0.18s, transform 0.15s;
        user-select: none;
        -webkit-user-select: none;
        width: 100%;
        box-sizing: border-box;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
      }
      .fp-card:hover {
        border-color: rgba(100, 116, 255, 0.4);
        transform: translateY(-1px);
      }
      .fp-card.fp-selected {
        border-color: rgba(100, 116, 255, 0.7);
        background: rgba(100, 116, 255, 0.09);
      }
      .fp-card-preview {
        color: #d8d8d8;
        flex: 1;
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
        line-height: 1.4;
      }
      .fp-card-badge {
        font-weight: 700;
        color: var(--blueink);
        text-transform: uppercase;
        letter-spacing: 0.4px;
        background: rgba(100, 116, 255, 0.08);
        border: 1px solid rgba(100, 116, 255, 0.18);
        border-radius: 4px;
        padding: 2px 6px;
        flex-shrink: 0;
        white-space: nowrap;
      }
      .fp-divider {
        height: 1px;
        background: rgba(255,255,255,0.05);
        flex-shrink: 0;
      }
      .fp-empty {
        color: var(--blueink);
        text-align: center;
        padding: 12px 0;
        opacity: 0.7;
      }
    `;
    document.head.appendChild(s);
  }

  function createFont(label, sets) {
    const font = { label };
    if (sets.upper)    font.upper    = [...sets.upper];
    if (sets.lower)    font.lower    = [...sets.lower];
    if (sets.numerals) font.numerals = [...sets.numerals];
    return font;
  }

  /* 
     CENTRAL FONT REGISTRY
     To add a new font in the future:
     1. Add a new entry here with a unique key
     2. Provide upper / lower / numerals arrays (26 letters + 10 digits)
     3. Everything else (reverse map, conversion, cards, live sync) updates automatically
  */
  const FONTS = {
    typewriter: createFont('Typewriter', {
      upper:    '𝙰𝙱𝙲𝙳𝙴𝙵𝙶𝙷𝙸𝙹𝙺𝙻𝙼𝙽𝙾𝙿𝚀𝚁𝚂𝚃𝚄𝚅𝚆𝚇𝚈𝚉',
      lower:    '𝚊𝚋𝚌𝚍𝚎𝚏𝚐𝚑𝚒𝚓𝚔𝚕𝚖𝚗𝚘𝚙𝚚𝚛𝚜𝚝𝚞𝚟𝚠𝚡𝚢𝚣',
      numerals: '𝟷𝟸𝟹𝟺𝟻𝟼𝟽𝟾𝟿𝟶',
    }),
    smallcap: createFont('Smallcap', {
      upper:    'ᴀʙᴄᴅᴇғɢʜɪᴊᴋʟᴍɴᴏᴘǫʀsᴛᴜᴠᴡxʏᴢ',
      numerals: '𝟷𝟸𝟹𝟺𝟻𝟼𝟽𝟾𝟿𝟶',
    }),
    empire: createFont('Empire', {
      upper: '𝕬𝕭𝕮𝕯𝕰𝕱𝕲𝕳𝕴𝕵𝕶𝕷𝕸𝕹𝕺𝕻𝕼𝕽𝕾𝕿𝖀𝖁𝖂𝖃𝖄𝖅',
      lower: '𝖆𝖇𝖈𝖉𝖊𝖋𝖌𝖍𝖎𝖏𝖐𝖑𝖒𝖓𝖔𝖕𝖖𝖗𝖘𝖙𝖚𝖛𝖜𝖝𝖞𝖟',
    }),
    whiteball: createFont('White Ball', {
      upper:    'ⒶⒷⒸⒹⒺⒻⒼⒽⒾⒿⓀⓁⓂⓃⓄⓅⓆⓇⓈⓉⓊⓋⓌⓍⓎⓏ',
      lower:    'ⓐⓑⓒⓓⓔⓕⓖⓗⓘⓙⓚⓛⓜⓝⓞⓟⓠⓡⓢⓣⓤⓥⓦⓧⓨⓩ',
      numerals: '①②③④⑤⑥⑦⑧⑨⓪',
    }),
    blackball: createFont('Black Ball', {
      upper:    '🅐🅑🅒🅓🅔🅕🅖🅗🅘🅙🅚🅛🅜🅝🅞🅟🅠🅡🅢🅣🅤🅥🅦🅧🅨🅩',
      numerals: '➊➋➌➍➎➏➐➑➒⓿',
    }),
    blackdice: createFont('Black Dice', {
      upper: '🅰🅱🅲🅳🅴🅵🅶🅷🅸🅹🅺🅻🅼🅽🅾🅿🆀🆁🆂🆃🆄🆅🆆🆇🆈🆉',
    }),
  };

  const state = {
    textFont:       null,
    numeralFont:    null,
    originalText:   null,
    liveSyncActive: false,
    liveSyncFn:     null,
  };

  let _rmap = null;

  function getReverseMap() {
    if (_rmap) return _rmap;
    _rmap = {};
    Object.values(FONTS).forEach(f => {
      (f.upper    || []).forEach((ch, i) => { _rmap[ch] = String.fromCharCode(65 + i); });
      (f.lower    || []).forEach((ch, i) => { _rmap[ch] = String.fromCharCode(97 + i); });
      (f.numerals || []).forEach((ch, i) => { _rmap[ch] = i === 9 ? '0' : String(i + 1); });
    });
    return _rmap;
  }

  function toAscii(text) {
    const m = getReverseMap();
    return [...text].map(ch => m[ch] ?? ch).join('');
  }

  function convert(text, textFontKey, numeralFontKey) {
    const tf = textFontKey    ? FONTS[textFontKey]    : null;
    const nf = numeralFontKey ? FONTS[numeralFontKey] : null;
    return [...text].map(ch => {
      const c = ch.charCodeAt(0);
      if (c >= 65 && c <= 90 && tf?.upper) return tf.upper[c - 65];
      if (c >= 97 && c <= 122) {
        if (tf?.lower) return tf.lower[c - 97];
        if (tf?.upper) return tf.upper[c - 97];
      }
      if (c >= 49 && c <= 57  && nf?.numerals) return nf.numerals[c - 49];
      if (c === 48             && nf?.numerals) return nf.numerals[9];
      return ch;
    }).join('');
  }

  function applyConversion() {
    if (!noteTextarea) return;
    const pos = noteTextarea.selectionStart;
    noteTextarea.value = convert(toAscii(noteTextarea.value), state.textFont, state.numeralFont);
    try { noteTextarea.setSelectionRange(pos, pos); } catch (_) {}
    if (typeof updateNoteMetadata === 'function') updateNoteMetadata();
  }

  function renderLabelInFont(font) {
    return [...font.label].map(ch => {
      const c = ch.charCodeAt(0);
      if (c >= 65 && c <= 90 && font.upper) return font.upper[c - 65];
      if (c >= 97 && c <= 122) {
        if (font.lower) return font.lower[c - 97];
        if (font.upper) return font.upper[c - 97];
      }
      return ch;
    }).join('');
  }

  function renderSample(font, panelType) {
    if (panelType === 'numeral' && font.numerals) {
      return [...'0123456789'].map(ch => {
        const c = ch.charCodeAt(0);
        if (c === 48) return font.numerals[9];
        if (c >= 49 && c <= 57) return font.numerals[c - 49];
        return ch;
      }).join('');
    }
    return renderLabelInFont(font);
  }

  function buildCard(key, font, panelType, onSelect) {
    const card = document.createElement('div');
    card.className = 'fp-card';

    const isActive = panelType === 'text' ? state.textFont === key : state.numeralFont === key;
    if (isActive) card.classList.add('fp-selected');

    const preview = document.createElement('div');
    preview.className = 'fp-card-preview';
    preview.textContent = renderSample(font, panelType);
    card.appendChild(preview);

    const caps = [];
    if (font.upper)    caps.push('A–Z');
    if (font.lower)    caps.push('a–z');
    if (font.numerals) caps.push('0–9');
    const badge = document.createElement('div');
    badge.className = 'fp-card-badge';
    badge.textContent = caps.join(' · ');
    card.appendChild(badge);

    card.addEventListener('click', () => onSelect(key, card));
    return card;
  }

  function buildSection(panelType) {
    const keys = panelType === 'numeral'
      ? Object.keys(FONTS).filter(k => FONTS[k].numerals)
      : Object.keys(FONTS);

    const section = document.createElement('div');
    section.className = 'fp-section';

    const sectionHeader = document.createElement('div');
    sectionHeader.className = 'fp-section-header';

    const lbl = document.createElement('div');
    lbl.className = 'fp-panel-label';
    lbl.textContent = panelType === 'text' ? 'Text Font' : 'Numeral Font';
    sectionHeader.appendChild(lbl);

    const searchWrap = document.createElement('div');
    searchWrap.className = 'fp-search';
    const icon = document.createElement('span');
    icon.className = 'material-symbols-rounded fp-search-icon';
    icon.textContent = 'search';
    const searchInput = document.createElement('input');
    searchInput.className = 'fp-search-input';
    searchInput.type = 'text';
    searchInput.placeholder = 'Search…';
    searchInput.autocomplete = 'off';
    searchWrap.append(icon, searchInput);
    sectionHeader.appendChild(searchWrap);
    section.appendChild(sectionHeader);

    const list = document.createElement('div');
    list.className = 'fp-list';
    section.appendChild(list);

    const onSelect = (key, clickedCard) => {
      list.querySelectorAll('.fp-card').forEach(c => c.classList.remove('fp-selected'));
      clickedCard.classList.add('fp-selected');
      if (panelType === 'text') state.textFont = key;
      else state.numeralFont = key;
      if (state.liveSyncActive) applyConversion();
    };

    const renderCards = (filter = '') => {
      list.innerHTML = '';
      let count = 0;
      keys.forEach(key => {
        if (filter && !FONTS[key].label.toLowerCase().includes(filter.toLowerCase())) return;
        list.appendChild(buildCard(key, FONTS[key], panelType, onSelect));
        count++;
      });
      if (!count) {
        const empty = document.createElement('div');
        empty.className = 'fp-empty';
        empty.textContent = 'No matches';
        list.appendChild(empty);
      }
    };

    renderCards();
    searchInput.addEventListener('input', e => renderCards(e.target.value.trim()));
    return section;
  }

  window.handleFontApplyOnce = function () {
    if (!state.textFont && !state.numeralFont) {
      showNotification('Pick at least one font first!');
      return;
    }
    if (state.originalText === null) state.originalText = noteTextarea.value;
    applyConversion();
    showNotification('Font applied!');
    closeModal();
  };

  window.handleFontRevert = function () {
    if (state.originalText === null) {
      showNotification('Nothing to revert!');
      return;
    }
    if (state.liveSyncActive) {
      if (state.liveSyncFn) noteTextarea.removeEventListener('input', state.liveSyncFn);
      state.liveSyncFn     = null;
      state.liveSyncActive = false;
    }
    noteTextarea.value = state.originalText;
    state.originalText = null;
    state.textFont     = null;
    state.numeralFont  = null;
    if (typeof updateNoteMetadata === 'function') updateNoteMetadata();
    showNotification('Reverted to original!');
    closeModal();
  };

  window.handleFontLiveSyncToggle = function () {
    if (state.liveSyncActive) {
      if (state.liveSyncFn) noteTextarea.removeEventListener('input', state.liveSyncFn);
      state.liveSyncFn     = null;
      state.liveSyncActive = false;
      showNotification('Live Sync off');
      closeModal();
      return;
    }
    if (!state.textFont && !state.numeralFont) {
      showNotification('Pick at least one font first!');
      return;
    }
    if (state.originalText === null) state.originalText = noteTextarea.value;
    applyConversion();
    state.liveSyncFn = function () {
      const pos       = noteTextarea.selectionStart;
      const converted = convert(toAscii(noteTextarea.value), state.textFont, state.numeralFont);
      if (converted === noteTextarea.value) return;
      noteTextarea.value = converted;
      try { noteTextarea.setSelectionRange(pos, pos); } catch (_) {}
      if (typeof updateNoteMetadata === 'function') updateNoteMetadata();
    };
    noteTextarea.addEventListener('input', state.liveSyncFn);
    state.liveSyncActive = true;
    showNotification('Live Sync on!');
    closeModal();
  };

  window.openFontPickerModal = function () {
    if (!currentNote || !noteTextarea) return;

    ensureModal();
    modalBackdrop.innerHTML = '';

    const win = document.createElement('div');
    win.className = 'modal-window';
    // No hard-coded width → lets modal.css (including mobile @media) control size
    // Body is already flex + scrollable → never exceeds viewport

    const header = document.createElement('div');
    header.className = 'modal-header';
    const htitle = document.createElement('h3');
    htitle.className = 'modal-title';
    htitle.textContent = 'Choose Fonts';
    const hclose = document.createElement('button');
    hclose.className = 'modal-close';
    hclose.innerHTML = '&#x2715;';
    hclose.addEventListener('click', () => closeModal());
    header.append(htitle, hclose);

    const body = document.createElement('div');
    body.className = 'fp-body';           // already has overflow-y:auto + flex:1
    body.appendChild(buildSection('text'));

    const divider = document.createElement('div');
    divider.className = 'fp-divider';
    body.appendChild(divider);

    body.appendChild(buildSection('numeral'));

    const footer = document.createElement('div');
    footer.className = 'modal-footer';

    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'modal-btn';
    cancelBtn.textContent = 'Cancel';
    cancelBtn.style.marginRight = 'auto';
    cancelBtn.addEventListener('click', () => closeModal());

    const revertBtn = document.createElement('button');
    revertBtn.className = 'modal-btn';
    revertBtn.innerHTML = '<span class="material-symbols-rounded" style="vertical-align:-3px;margin-right:4px">history</span>Revert';
    revertBtn.style.opacity = state.originalText === null ? '0.4' : '1';
    revertBtn.addEventListener('click', window.handleFontRevert);

    const applyBtn = document.createElement('button');
    applyBtn.className = 'modal-btn';
    applyBtn.textContent = 'Apply Once';
    applyBtn.addEventListener('click', window.handleFontApplyOnce);

    const syncBtn = document.createElement('button');
    syncBtn.className = 'modal-btn' + (state.liveSyncActive ? ' active' : '');
    syncBtn.innerHTML = state.liveSyncActive
      ? '<span class="material-symbols-rounded" style="vertical-align:-3px;margin-right:4px">sync</span>Live Sync ON'
      : '<span class="material-symbols-rounded" style="vertical-align:-3px;margin-right:4px">sync</span>Live Sync';
    syncBtn.addEventListener('click', window.handleFontLiveSyncToggle);

    footer.append(cancelBtn, revertBtn, applyBtn, syncBtn);
    win.append(header, body, footer);
    modalBackdrop.appendChild(win);
    document.documentElement.style.overflow = 'hidden';
    modalBackdrop.classList.add('active');
  };

})();
