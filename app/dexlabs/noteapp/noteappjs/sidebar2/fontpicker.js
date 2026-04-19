// ════════════════════════════════════════════════════════════════════
//  fontpicker.js
//  Depends on (globals from other scripts):
//    modal.js   → ensureModal, closeModal, modalBackdrop
//    app        → noteTextarea, currentNote
//    app        → updateNoteMetadata, showNotification
// ════════════════════════════════════════════════════════════════════

(function () {
  'use strict';

  // ── 1. CSS ──────────────────────────────────────────────────────
  if (!document.getElementById('fp-styles')) {
    const s = document.createElement('style');
    s.id = 'fp-styles';
    s.textContent = `
      .fp-body {
        display: flex;
        gap: 0;
        flex: 1;
        min-height: 0;
        overflow: hidden;
      }
      .fp-panel {
        flex: 1;
        min-width: 0;
        display: flex;
        flex-direction: column;
        gap: 10px;
        padding: 16px 18px;
        overflow: hidden;
      }
      .fp-panel + .fp-panel {
        border-left: 1px solid rgba(255,255,255,0.05);
      }
      .fp-panel-label {
        font-size: 11px;
        font-weight: 700;
        color: var(--blueink);
        text-transform: uppercase;
        letter-spacing: 0.7px;
        flex-shrink: 0;
      }
      .fp-search {
        position: relative;
        display: flex;
        align-items: center;
        flex-shrink: 0;
      }
      .fp-search-icon {
        position: absolute;
        left: 10px;
        font-size: 16px;
        color: var(--blueink);
        pointer-events: none;
      }
      .fp-search-input {
        width: 100%;
        box-sizing: border-box;
        padding: 7px 10px 7px 32px;
        background: #1e2124;
        border: 1px solid var(--border);
        border-radius: 20px;
        color: #eeeeee;
        font-size: 13px;
        outline: none;
        font-family: inherit;
        transition: border-color 0.2s;
      }
      .fp-search-input:focus {
        border-color: rgba(100, 116, 255, 0.55);
      }
      .fp-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(128px, 1fr));
        gap: 7px;
        overflow-y: auto;
        flex: 1;
        padding-right: 3px;
        align-content: start;
      }
      .fp-grid::-webkit-scrollbar { width: 3px; }
      .fp-grid::-webkit-scrollbar-thumb {
        background: var(--border);
        border-radius: 10px;
      }
      .fp-card {
        cursor: pointer;
        border: 1px solid var(--border);
        border-radius: 10px;
        padding: 10px;
        background: #1e2124;
        transition: border-color 0.18s, background 0.18s, transform 0.15s;
        user-select: none;
        -webkit-user-select: none;
        overflow: hidden;
      }
      .fp-card:hover {
        border-color: rgba(100, 116, 255, 0.4);
        transform: translateY(-1px);
      }
      .fp-card.fp-selected {
        border-color: rgba(100, 116, 255, 0.7);
        background: rgba(100, 116, 255, 0.09);
      }
      .fp-card-name {
        font-size: 10px;
        font-weight: 700;
        color: var(--blueink);
        margin-bottom: 7px;
        letter-spacing: 0.4px;
        text-transform: uppercase;
      }
      .fp-card-row {
        font-size: 13px;
        line-height: 1.55;
        color: #d8d8d8;
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
      }
      .fp-card-row.fp-muted {
        opacity: 0.42;
        font-size: 12px;
      }
      .fp-card-row + .fp-card-row {
        margin-top: 2px;
      }
      .fp-empty {
        grid-column: 1 / -1;
        font-size: 13px;
        color: var(--blueink);
        text-align: center;
        padding: 28px 0;
        opacity: 0.7;
      }
      @media (max-width: 580px) {
        .fp-body          { flex-direction: column; overflow-y: auto; }
        .fp-panel         { max-height: 260px; }
        .fp-panel + .fp-panel {
          border-left: none;
          border-top: 1px solid rgba(255,255,255,0.05);
        }
      }
    `;
    document.head.appendChild(s);
  }

  // ── 2. Font registry ────────────────────────────────────────────
  // Each font declares only the character sets it actually has.
  // upper    → A-Z (26 chars), index 0 = A … 25 = Z
  // lower    → a-z (26 chars), index 0 = a … 25 = z
  // numerals → 1-9,0 (10 chars), index 0 = '1' … 8 = '9', 9 = '0'

  const FONTS = {
    typewriter: {
      label:    'Typewriter',
      upper:    [...'𝙰𝙱𝙲𝙳𝙴𝙵𝙶𝙷𝙸𝙹𝙺𝙻𝙼𝙽𝙾𝙿𝚀𝚁𝚂𝚃𝚄𝚅𝚆𝚇𝚈𝚉'],
      lower:    [...'𝚊𝚋𝚌𝚍𝚎𝚏𝚐𝚑𝚒𝚓𝚔𝚕𝚖𝚗𝚘𝚙𝚚𝚛𝚜𝚝𝚞𝚟𝚠𝚡𝚢𝚣'],
      numerals: [...'𝟷𝟸𝟹𝟺𝟻𝟼𝟽𝟾𝟿𝟶'],
    },
    smallcap: {
      label:    'Smallcap',
      upper:    [...'ᴀʙᴄᴅᴇғɢʜɪᴊᴋʟᴍɴᴏᴘǫʀsᴛᴜᴠᴡxʏᴢ'],
      numerals: [...'𝟷𝟸𝟹𝟺𝟻𝟼𝟽𝟾𝟿𝟶'],
    },
    empire: {
      label:    'Empire',
      upper:    [...'𝕬𝕭𝕮𝕯𝕰𝕱𝕲𝕳𝕴𝕵𝕶𝕷𝕸𝕹𝕺𝕻𝕼𝕽𝕾𝕿𝖀𝖁𝖂𝖃𝖄𝖅'],
      lower:    [...'𝖆𝖇𝖈𝖉𝖊𝖋𝖌𝖍𝖎𝖏𝖐𝖑𝖒𝖓𝖔𝖕𝖖𝖗𝖘𝖙𝖚𝖛𝖜𝖝𝖞𝖟'],
    },
    whiteball: {
      label:    'White Ball',
      upper:    [...'ⒶⒷⒸⒹⒺⒻⒼⒽⒾⒿⓀⓁⓂⓃⓄⓅⓆⓇⓈⓉⓊⓋⓌⓍⓎⓏ'],
      lower:    [...'ⓐⓑⓒⓓⓔⓕⓖⓗⓘⓙⓚⓛⓜⓝⓞⓟⓠⓡⓢⓣⓤⓥⓦⓧⓨⓩ'],
      numerals: [...'①②③④⑤⑥⑦⑧⑨⓪'],
    },
    blackball: {
      label:    'Black Ball',
      upper:    [...'🅐🅑🅒🅓🅔🅕🅖🅗🅘🅙🅚🅛🅜🅝🅞🅟🅠🅡🅢🅣🅤🅥🅦🅧🅨🅩'],
      numerals: [...'➊➋➌➍➎➏➐➑➒⓿'],
    },
    blackdice: {
      label:    'Black Dice',
      upper:    [...'🅰🅱🅲🅳🅴🅵🅶🅷🅸🅹🅺🅻🅼🅽🅾🅿🆀🆁🆂🆃🆄🆅🆆🆇🆈🆉'],
    },
  };

  // ── 3. Module state ─────────────────────────────────────────────
  const state = {
    textFont:      null,   // key into FONTS or null = "no change"
    numeralFont:   null,   // key into FONTS (numeral-capable only) or null
    liveSyncActive: false,
    liveSyncFn:    null,   // reference stored for removeEventListener
  };

  // ── 4. Reverse map — glyph → ASCII ──────────────────────────────
  // Built once, cached. Used to decode already-converted text back
  // to plain ASCII before re-encoding with a different font.
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
    // Spread via iterator so surrogate pairs (emoji) are handled as single code points
    return [...text].map(ch => m[ch] ?? ch).join('');
  }

  // ── 5. Conversion engine ────────────────────────────────────────
  // textFontKey    → drives A-Z and a-z replacement
  // numeralFontKey → drives 0-9 replacement
  // null key = pass-through for that category

  function convert(text, textFontKey, numeralFontKey) {
    const tf = textFontKey    ? FONTS[textFontKey]    : null;
    const nf = numeralFontKey ? FONTS[numeralFontKey] : null;

    return [...text].map(ch => {
      const c = ch.charCodeAt(0);
      if (c >= 65 && c <= 90  && tf?.upper)    return tf.upper[c - 65];        // A-Z
      if (c >= 97 && c <= 122 && tf?.lower)    return tf.lower[c - 97];        // a-z
      if (c >= 49 && c <= 57  && nf?.numerals) return nf.numerals[c - 49];     // 1-9
      if (c === 48             && nf?.numerals) return nf.numerals[9];          // 0 → index 9
      return ch;  // spaces, punctuation, emoji — untouched
    }).join('');
  }

  // Decode current textarea → convert → write back, preserve caret
  function applyConversion() {
    if (!noteTextarea) return;
    const pos  = noteTextarea.selectionStart;
    const raw  = toAscii(noteTextarea.value);
    noteTextarea.value = convert(raw, state.textFont, state.numeralFont);
    try { noteTextarea.setSelectionRange(pos, pos); } catch (_) {}
    if (typeof updateNoteMetadata === 'function') updateNoteMetadata();
  }

  // ── 6. Font card ─────────────────────────────────────────────────
  // panelType = 'text' | 'numeral'
  // onSelect(key, cardEl)

  function buildCard(key, font, panelType, onSelect) {
    const card = document.createElement('div');
    card.className = 'fp-card';

    const isActive = panelType === 'text'
      ? state.textFont === key
      : state.numeralFont === key;
    if (isActive) card.classList.add('fp-selected');

    // Name badge
    const name = document.createElement('div');
    name.className = 'fp-card-name';
    name.textContent = font.label;
    card.appendChild(name);

    if (panelType === 'text') {
      // Upper preview — first 4 + ellipsis + last 2
      if (font.upper) {
        const r = document.createElement('div');
        r.className = 'fp-card-row';
        r.textContent = font.upper.slice(0, 4).join('') + '…' + font.upper.slice(-2).join('');
        card.appendChild(r);
      }
      // Lower preview
      if (font.lower) {
        const r = document.createElement('div');
        r.className = 'fp-card-row';
        r.textContent = font.lower.slice(0, 4).join('') + '…' + font.lower.slice(-2).join('');
        card.appendChild(r);
      }
      // Numeral hint (muted) — just to indicate availability
      if (font.numerals) {
        const r = document.createElement('div');
        r.className = 'fp-card-row fp-muted';
        r.textContent = font.numerals.slice(0, 4).join('') + '…';
        card.appendChild(r);
      }
    } else {
      // Numeral panel — show all 10 numerals as primary preview
      const r = document.createElement('div');
      r.className = 'fp-card-row';
      r.textContent = font.numerals.join('');
      card.appendChild(r);

      // Muted letter hint so user knows which font they picked
      if (font.upper) {
        const hint = document.createElement('div');
        hint.className = 'fp-card-row fp-muted';
        hint.textContent = font.upper.slice(0, 3).join('') + '…';
        card.appendChild(hint);
      }
    }

    card.addEventListener('click', () => onSelect(key, card));
    return card;
  }

  // ── 7. Panel ──────────────────────────────────────────────────────
  function buildPanel(panelType) {
    // Numeral panel only shows fonts that actually have numerals
    const keys = panelType === 'numeral'
      ? Object.keys(FONTS).filter(k => FONTS[k].numerals)
      : Object.keys(FONTS);

    const panel = document.createElement('div');
    panel.className = 'fp-panel';

    // Label
    const lbl = document.createElement('div');
    lbl.className = 'fp-panel-label';
    lbl.textContent = panelType === 'text' ? 'Text Font' : 'Numeral Font';
    panel.appendChild(lbl);

    // Search
    const searchWrap = document.createElement('div');
    searchWrap.className = 'fp-search';
    const icon = document.createElement('span');
    icon.className = 'material-symbols-rounded fp-search-icon';
    icon.textContent = 'search';
    const searchInput = document.createElement('input');
    searchInput.className = 'fp-search-input';
    searchInput.type = 'text';
    searchInput.placeholder = 'Search fonts…';
    searchInput.autocomplete = 'off';
    searchWrap.append(icon, searchInput);
    panel.appendChild(searchWrap);

    // Grid
    const grid = document.createElement('div');
    grid.className = 'fp-grid';
    panel.appendChild(grid);

    // Card selection handler
    const onSelect = (key, clickedCard) => {
      grid.querySelectorAll('.fp-card').forEach(c => c.classList.remove('fp-selected'));
      clickedCard.classList.add('fp-selected');
      if (panelType === 'text') state.textFont = key;
      else state.numeralFont = key;
      // If live sync is running, re-apply immediately on font change
      if (state.liveSyncActive) applyConversion();
    };

    // Render cards (re-runs on search input)
    const renderCards = (filter = '') => {
      grid.innerHTML = '';
      let count = 0;
      keys.forEach(key => {
        if (filter && !FONTS[key].label.toLowerCase().includes(filter.toLowerCase())) return;
        grid.appendChild(buildCard(key, FONTS[key], panelType, onSelect));
        count++;
      });
      if (count === 0) {
        const empty = document.createElement('div');
        empty.className = 'fp-empty';
        empty.textContent = 'No matches';
        grid.appendChild(empty);
      }
    };

    renderCards();
    searchInput.addEventListener('input', e => renderCards(e.target.value.trim()));
    return panel;
  }

  // ── 8. Apply Once ──────────────────────────────────────────────
  window.handleFontApplyOnce = function () {
    if (!state.textFont && !state.numeralFont) {
      showNotification('Pick at least one font first!');
      return;
    }
    applyConversion();
    showNotification('Font applied!');
    closeModal();
  };

  // ── 9. Live Sync toggle ─────────────────────────────────────────
  // Attaches an input listener to noteTextarea.
  // On every keystroke: decode current value → re-encode → write back.
  // Listener ref is stored so it can be detached cleanly.

  window.handleFontLiveSyncToggle = function () {
    if (state.liveSyncActive) {
      // ─ Turn OFF ─
      if (state.liveSyncFn) {
        noteTextarea.removeEventListener('input', state.liveSyncFn);
        state.liveSyncFn = null;
      }
      state.liveSyncActive = false;
      showNotification('Live Sync off');
      closeModal();
      return;
    }

    // ─ Turn ON ─
    if (!state.textFont && !state.numeralFont) {
      showNotification('Pick at least one font first!');
      return;
    }

    // Apply immediately so the textarea is in converted state before we attach
    applyConversion();

    state.liveSyncFn = function () {
      // Runs after every user keystroke.
      // decode converts already-styled chars back to ASCII,
      // so mixed states (typed char + existing styled chars) are handled cleanly.
      const pos       = noteTextarea.selectionStart;
      const converted = convert(toAscii(noteTextarea.value), state.textFont, state.numeralFont);
      if (converted === noteTextarea.value) return; // nothing changed — bail early
      noteTextarea.value = converted;
      try { noteTextarea.setSelectionRange(pos, pos); } catch (_) {}
      if (typeof updateNoteMetadata === 'function') updateNoteMetadata();
    };

    noteTextarea.addEventListener('input', state.liveSyncFn);
    state.liveSyncActive = true;
    showNotification('Live Sync on!');
    closeModal();
  };

  // ── 10. Open modal ──────────────────────────────────────────────
  // Bypasses showModal() to avoid its default footer button listener,
  // but reuses the same modalBackdrop, CSS classes, and closeModal().

  window.openFontPickerModal = function () {
    if (!currentNote || !noteTextarea) return;

    ensureModal();
    modalBackdrop.innerHTML = '';

    // ── Window
    const win = document.createElement('div');
    win.className = 'modal-window';
    win.style.cssText = 'width:880px; max-width:calc(100vw - 40px); max-height:calc(100vh - 6vh); display:flex; flex-direction:column;';

    // ── Header
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

    // ── Body (two panels side-by-side, flex:1 so it fills window height)
    const body = document.createElement('div');
    body.className = 'fp-body';
    body.style.flex = '1';
    body.style.minHeight = '0';
    body.style.overflow = 'hidden';
    body.appendChild(buildPanel('text'));
    body.appendChild(buildPanel('numeral'));

    // ── Footer
    const footer = document.createElement('div');
    footer.className = 'modal-footer';

    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'modal-btn';
    cancelBtn.textContent = 'Cancel';
    cancelBtn.style.marginRight = 'auto';
    cancelBtn.addEventListener('click', () => closeModal());

    const applyBtn = document.createElement('button');
    applyBtn.className = 'modal-btn';
    applyBtn.textContent = 'Apply Once';
    applyBtn.addEventListener('click', window.handleFontApplyOnce);

    const syncBtn = document.createElement('button');
    // Reflect current live sync state when modal is reopened
    syncBtn.className = 'modal-btn' + (state.liveSyncActive ? ' active' : '');
    syncBtn.innerHTML = state.liveSyncActive
      ? '<span class="material-symbols-rounded" style="font-size:15px;vertical-align:-3px;margin-right:5px">sync</span>Live Sync ON'
      : '<span class="material-symbols-rounded" style="font-size:15px;vertical-align:-3px;margin-right:5px">sync</span>Live Sync';
    syncBtn.addEventListener('click', window.handleFontLiveSyncToggle);

    footer.append(cancelBtn, applyBtn, syncBtn);

    win.append(header, body, footer);
    modalBackdrop.appendChild(win);
    document.documentElement.style.overflow = 'hidden';
    modalBackdrop.classList.add('active');
  };

})();
