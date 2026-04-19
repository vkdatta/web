(function () {
  'use strict';

  if (!document.getElementById('fp-styles')) {
    const s = document.createElement('style');
    s.id = 'fp-styles';
    s.textContent = `
      .fp-toggle-row { display: flex; gap: 8px; margin-bottom: 12px; }
      .fp-toggle-btn { flex: 1; padding: 8px 12px; border: 1px solid rgba(255,255,255,0.1); background: rgba(255,255,255,0.05); backdrop-filter: blur(10px); color: #aaa; border-radius: 8px; cursor: pointer; transition: all 0.2s; }
      .fp-toggle-btn:hover { background: rgba(255,255,255,0.08); color: #eee; }
      .fp-toggle-btn.active { background: rgba(0,0,0,0.4); backdrop-filter: blur(12px); border-color: rgba(255,255,255,0.25); color: #fff; box-shadow: 0 4px 20px rgba(0,0,0,0.5); }
      .fp-section { display: none; }
      .fp-section.active { display: block; }
      .fp-list { max-height: 260px; overflow-y: auto; display: flex; flex-direction: column; gap: 6px; }
      .fp-card { cursor: pointer; border: 1px solid rgba(255,255,255,0.06); border-radius: 10px; padding: 10px 14px; background: rgba(255,255,255,0.03); transition: all 0.2s; display: flex; align-items: center; justify-content: space-between; }
      .fp-card:hover { border-color: rgba(255,255,255,0.15); transform: translateY(-1px); background: rgba(255,255,255,0.05); }
      .fp-card.selected { background: rgba(0,0,0,0.5); backdrop-filter: blur(10px); border-color: rgba(255,255,255,0.2); box-shadow: 0 4px 24px rgba(0,0,0,0.4); }
      .fp-card-title { font-weight: 600; color: #eee; }
      .fp-card-sample { color: #888; margin-top: 3px; font-size: 0.95em; }
      .fp-card-badge { font-size: 0.7em; color: #666; background: rgba(255,255,255,0.05); padding: 3px 8px; border-radius: 4px; border: 1px solid rgba(255,255,255,0.08); letter-spacing: 0.5px; }
      .fp-actions { display: flex; gap: 8px; margin-top: 12px; padding-top: 12px; border-top: 1px solid rgba(255,255,255,0.05); }
      .fp-actions button { flex: 1; }
      @media (max-width: 480px) { .fp-list { max-height: 180px; } }
    `;
    document.head.appendChild(s);
  }

  const FONTS = {
    typewriter: { label: 'Typewriter', upper: '𝙰𝙱𝙲𝙳𝙴𝙵𝙶𝙷𝙸𝙹𝙺𝙻𝙼𝙽𝙾𝙿𝚀𝚁𝚂𝚃𝚄𝚅𝚆𝚇𝚈𝚉', lower: '𝚊𝚋𝚌𝚍𝚎𝚏𝚐𝚑𝚒𝚓𝚔𝚕𝚖𝚗𝚘𝚙𝚚𝚛𝚜𝚝𝚞𝚟𝚠𝚡𝚢𝚣', numerals: '𝟷𝟸𝟹𝟺𝟻𝟼𝟽𝟾𝟿𝟶' },
    smallcap: { label: 'Smallcap', upper: 'ᴀʙᴄᴅᴇғɢʜɪᴊᴋʟᴍɴᴏᴘǫʀsᴛᴜᴠᴡxʏᴢ', numerals: '𝟷𝟸𝟹𝟺𝟻𝟼𝟽𝟾𝟿𝟶' },
    empire: { label: 'Empire', upper: '𝕬𝕭𝕮𝕯𝕰𝕱𝕲𝕳𝕴𝕵𝕶𝕷𝕸𝕹𝕺𝕻𝕼𝕽𝕾𝕿𝖀𝖁𝖂𝖃𝖄𝖅', lower: '𝖆𝖇𝖈𝖉𝖊𝖋𝖌𝖍𝖎𝖏𝖐𝖑𝖒𝖓𝖔𝖕𝖖𝖗𝖘𝖙𝖚𝖛𝖜𝖝𝖞𝖟' },
    whiteball: { label: 'White Ball', upper: 'ⒶⒷⒸⒹⒺⒻⒼⒽⒾⒿⓀⓁⓂⓃⓄⓅⓆⓇⓈⓉⓊⓋⓌⓍⓎⓏ', lower: 'ⓐⓑⓒⓓⓔⓕⓖⓗⓘⓙⓚⓛⓜⓝⓞⓟⓠⓡⓢⓣⓤⓥⓦⓧⓨⓩ', numerals: '①②③④⑤⑥⑦⑧⑨⓪' },
    blackball: { label: 'Black Ball', upper: '🅐🅑🅒🅓🅔🅕🅖🅗🅘🅙🅚🅛🅜🅝🅞🅟🅠🅡🅢🅣🅤🅥🅦🅧🅨🅩', numerals: '➊➋➌➍➎➏➐➑➒⓿' },
    blackdice: { label: 'Black Dice', upper: '🅰🅱🅲🅳🅴🅵🅶🅷🅸🅹🅺🅻🅼🅽🅾🅿🆀🆁🆂🆃🆄🆅🆆🆇🆈🆉' },
  };

  window.registerFont = function(key, label, sets) {
    if (FONTS[key]) { console.warn(`Font "${key}" exists`); return false; }
    FONTS[key] = { label, ...sets };
    _rmap = null;
    return true;
  };

  let selectedTextFont = null;
  let selectedNumFont = null;
  let liveSync = false;
  let liveSyncHandler = null;
  let _rmap = null;

  function buildReverseMap() {
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
    const m = buildReverseMap();
    return [...text].map(ch => m[ch] ?? ch).join('');
  }

  function convert(text, tKey, nKey) {
    const tf = tKey ? FONTS[tKey] : null;
    const nf = nKey ? FONTS[nKey] : null;
    return [...text].map(ch => {
      const c = ch.charCodeAt(0);
      if (c >= 65 && c <= 90 && tf?.upper)    return tf.upper[c - 65];
      if (c >= 97 && c <= 122) {
        if (tf?.lower) return tf.lower[c - 97];
        if (tf?.upper) return tf.upper[c - 97];
      }
      if (c >= 49 && c <= 57 && nf?.numerals) return nf.numerals[c - 49];
      if (c === 48             && nf?.numerals) return nf.numerals[9];
      return ch;
    }).join('');
  }

  function preview(key) {
    const font = FONTS[key];
    const parts = [];
    if (font.upper)    parts.push(convert('ABC', key, null));
    if (font.lower)    parts.push(convert('abc', key, null));
    if (font.numerals) parts.push(convert('123', null, key));
    return parts.join('  ');
  }

  function badge(font) {
    const caps = [];
    if (font.upper)    caps.push('A–Z');
    if (font.lower)    caps.push('a–z');
    if (font.numerals) caps.push('0–9');
    return caps.join(' · ');
  }

  function createCard(key, type, onSelect) {
    const font = FONTS[key];
    const isSel = (type === 'text' ? selectedTextFont : selectedNumFont) === key;
    const card = document.createElement('div');
    card.className = 'fp-card' + (isSel ? ' selected' : '');
    card.innerHTML = `<div><div class="fp-card-title">${font.label}</div><div class="fp-card-sample">${preview(key)}</div></div><div class="fp-card-badge">${badge(font)}</div>`;
    card.onclick = () => {
      document.querySelectorAll(`.fp-section[data-type="${type}"] .fp-card`).forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      onSelect(key);
    };
    return card;
  }

  function buildSection(type) {
    const keys = type === 'numeral' 
      ? Object.keys(FONTS).filter(k => FONTS[k].numerals)
      : Object.keys(FONTS);
    
    const section = document.createElement('div');
    section.className = 'fp-section' + (type === 'text' ? ' active' : '');
    section.dataset.type = type;

    const list = document.createElement('div');
    list.className = 'fp-list';
    keys.forEach(key => list.appendChild(createCard(key, type, k => {
      if (type === 'text') selectedTextFont = k; else selectedNumFont = k;
    })));
    section.appendChild(list);

    const actions = document.createElement('div');
    actions.className = 'fp-actions';

    const revertBtn = document.createElement('button');
    revertBtn.className = 'modal-btn';
    revertBtn.textContent = 'Revert';
    revertBtn.onclick = () => {
      if (liveSync) { noteTextarea.removeEventListener('input', liveSyncHandler); liveSync = false; liveSyncHandler = null; }
      noteTextarea.value = toAscii(noteTextarea.value);
      selectedTextFont = selectedNumFont = null;
      document.querySelectorAll('.fp-card.selected').forEach(c => c.classList.remove('selected'));
      if (typeof updateNoteMetadata === 'function') updateNoteMetadata();
      showNotification('Reverted to original');
    };

    const applyBtn = document.createElement('button');
    applyBtn.className = 'modal-btn';
    applyBtn.textContent = 'Apply Once';
    applyBtn.onclick = () => {
      if (!selectedTextFont && !selectedNumFont) return showNotification('Select a font first');
      const pos = noteTextarea.selectionStart;
      noteTextarea.value = convert(toAscii(noteTextarea.value), selectedTextFont, selectedNumFont);
      try { noteTextarea.setSelectionRange(pos, pos); } catch(_) {}
      if (typeof updateNoteMetadata === 'function') updateNoteMetadata();
      showNotification('Font applied');
    };

    const syncBtn = document.createElement('button');
    syncBtn.className = 'modal-btn' + (liveSync ? ' active' : '');
    syncBtn.textContent = 'Live Sync';
    syncBtn.onclick = () => {
      if (liveSync) {
        noteTextarea.removeEventListener('input', liveSyncHandler);
        liveSync = false; liveSyncHandler = null;
        syncBtn.classList.remove('active');
        showNotification('Live sync off');
      } else {
        if (!selectedTextFont && !selectedNumFont) return showNotification('Select a font first');
        applyBtn.click();
        liveSyncHandler = () => {
          const pos = noteTextarea.selectionStart;
          const val = toAscii(noteTextarea.value);
          const converted = convert(val, selectedTextFont, selectedNumFont);
          if (converted !== noteTextarea.value) {
            noteTextarea.value = converted;
            try { noteTextarea.setSelectionRange(pos, pos); } catch(_) {}
            if (typeof updateNoteMetadata === 'function') updateNoteMetadata();
          }
        };
        noteTextarea.addEventListener('input', liveSyncHandler);
        liveSync = true;
        syncBtn.classList.add('active');
        showNotification('Live sync on');
      }
    };

    actions.append(revertBtn, applyBtn, syncBtn);
    section.appendChild(actions);
    return section;
  }

  window.openFontPickerModal = async function() {
    if (!currentNote || !noteTextarea) return;

    const body = document.createElement('div');
    const toggleRow = document.createElement('div');
    toggleRow.className = 'fp-toggle-row';

    const textBtn = document.createElement('button');
    textBtn.className = 'fp-toggle-btn active';
    textBtn.textContent = 'Text Font';

    const numBtn = document.createElement('button');
    numBtn.className = 'fp-toggle-btn';
    numBtn.textContent = 'Number Font';

    toggleRow.append(textBtn, numBtn);

    const textSection = buildSection('text');
    const numSection = buildSection('numeral');

    textBtn.onclick = () => { textBtn.classList.add('active'); numBtn.classList.remove('active'); textSection.classList.add('active'); numSection.classList.remove('active'); };
    numBtn.onclick = () => { numBtn.classList.add('active'); textBtn.classList.remove('active'); numSection.classList.add('active'); textSection.classList.remove('active'); };

    body.append(toggleRow, textSection, numSection);

    await showModal({
      title: 'Choose Fonts',
      body: body,
      footer: '<button class="modal-btn" onclick="closeModal()">Cancel</button><button class="modal-btn" onclick="closeModal(\'save\')">Save</button>'
    });
  };
})();
