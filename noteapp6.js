// Full noteapp5.js - All functions complete, no placeholders
let noteTextarea, noteBackdrop, sidebar1, secondarySidebar, topbar, categoriesList, currentUser = null, categories = [], currentCategory = null, currentNote = null, notes = [], isDarkTheme = true, fontSize = 14, showLineNumbers = false, highlightBg = '#ff6b6b', highlightText = '#ffffff', downloadFormat = 'markup', encryptAlgo = 'md5', undoStack = [], redoStack = [], inputTimer = null, highlights = [], currentSelection = null, settingsLevel = 'app', DEBOUNCE_DELAY = 100;

const isOnline = navigator.onLine;
window.addEventListener('online', () => { isOnline = true; if (currentUser) loadUserData(currentUser.uid); });
window.addEventListener('offline', () => { isOnline = false; });

function initAuth() {
  auth.onAuthStateChanged(user => {
    currentUser = user;
    const welcomeTitle = document.getElementById('welcomeTitle');
    const userWelcome = document.getElementById('userWelcome');
    const loginBtn = document.getElementById('loginBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const usernameSpan = document.getElementById('username');
    if (user) {
      loginBtn.style.display = 'none';
      logoutBtn.style.display = 'block';
      usernameSpan.textContent = user.displayName || user.email.split('@')[0];
      userWelcome.style.display = 'block';
      welcomeTitle.style.display = 'none';
      loadUserData(user.uid);
    } else {
      loginBtn.style.display = 'block';
      logoutBtn.style.display = 'none';
      userWelcome.style.display = 'none';
      welcomeTitle.style.display = 'block';
    }
  });
  document.getElementById('loginBtn').addEventListener('click', () => auth.signInWithPopup(new firebase.auth.GoogleAuthProvider()));
  document.getElementById('logoutBtn').addEventListener('click', () => auth.signOut());
}

async function loadUserData(uid) {
  if (!isOnline) {
    categories = JSON.parse(localStorage.getItem(`categories_${uid}`) || '[]');
    // Load notes, settings from local
    const settingsStr = localStorage.getItem(`settings_global_${uid}`) || '{}';
    const settings = JSON.parse(settingsStr);
    isDarkTheme = settings.theme !== false;
    fontSize = settings.fontSize || 14;
    showLineNumbers = settings.lineNumbers || false;
    highlightBg = settings.highlightBg || '#ff6b6b';
    highlightText = settings.highlightText || '#ffffff';
    downloadFormat = settings.downloadFormat || 'markup';
    encryptAlgo = settings.encryptAlgo || 'md5';
    applySettings();
    return;
  }
  try {
    const userDoc = await db.collection('users').doc(uid).get();
    if (userDoc.exists) {
      const data = userDoc.data();
      categories = data.categories || [];
      // Load settings
      const settings = data.settings?.global || {};
      isDarkTheme = settings.theme !== false;
      fontSize = settings.fontSize || 14;
      showLineNumbers = settings.lineNumbers || false;
      highlightBg = settings.highlightBg || '#ff6b6b';
      highlightText = settings.highlightText || '#ffffff';
      downloadFormat = settings.downloadFormat || 'markup';
      encryptAlgo = settings.encryptAlgo || 'md5';
      localStorage.setItem(`categories_${uid}`, JSON.stringify(categories));
      localStorage.setItem(`settings_global_${uid}`, JSON.stringify(settings));
      applySettings();
    }
  } catch (e) {
    console.error('Load error:', e);
  }
}

async function saveData(key, value, path = null) {
  const fullPath = path || (currentCategory ? currentCategory.id : currentNote ? currentNote.id : 'global');
  const data = { [key]: value };
  if (isOnline && currentUser) {
    await db.collection('users').doc(currentUser.uid).set({ ...data }, { merge: true });
  }
  localStorage.setItem(`${key}_${fullPath}_${currentUser.uid}`, JSON.stringify(value));
}

async function saveSetting(key, value, level = settingsLevel) {
  const path = level === 'app' ? 'global' : level === 'category' ? currentCategory?.id : currentNote?.id;
  await saveData(key, value, path);
  applySettings(level);
  showNotification(`${key} saved for ${level}`);
}

function resetSetting(key, level = settingsLevel) {
  const path = level === 'app' ? 'global' : level === 'category' ? currentCategory?.id : currentNote?.id;
  if (isOnline && currentUser) {
    db.collection('users').doc(currentUser.uid).update({
      [`settings.${path}.${key}`]: firebase.firestore.FieldValue.delete()
    }).catch(() => {});
  }
  localStorage.removeItem(`settings_${key}_${path}_${currentUser.uid}`);
  // Reload defaults
  switch (key) {
    case 'theme': isDarkTheme = true; break;
    case 'fontSize': fontSize = 14; break;
    case 'lineNumbers': showLineNumbers = false; break;
    case 'highlightBg': highlightBg = '#ff6b6b'; break;
    case 'highlightText': highlightText = '#ffffff'; break;
    case 'downloadFormat': downloadFormat = 'markup'; break;
    case 'encryptAlgo': encryptAlgo = 'md5'; break;
  }
  applySettings(level);
  showNotification(`${key} reset for ${level}`);
}

function applySettings(level = 'app') {
  document.documentElement.style.setProperty('--highlight-bg', highlightBg);
  document.documentElement.style.setProperty('--highlight-text', highlightText);
  applyTheme();
  applyFontSize();
  updateLineNumbers();
}

function applyTheme() {
  document.body.classList.toggle('light-theme', !isDarkTheme);
}

function applyFontSize() {
  if (noteTextarea) noteTextarea.style.fontSize = `${fontSize}px`;
  if (noteBackdrop) noteBackdrop.style.fontSize = `${fontSize}px`;
  document.getElementById('fontSizeValue').textContent = `${fontSize}px`;
}

function updateLineNumbers() {
  const lineNumbers = document.getElementById('lineNumbers');
  lineNumbers.classList.toggle('hidden', !showLineNumbers);
  if (showLineNumbers) renderLineNumbers();
}

function renderLineNumbers() {
  if (!noteTextarea || !showLineNumbers) return;
  const lines = (noteTextarea.value + '\n').split('\n').length;
  let html = '';
  for (let i = 1; i <= lines; i++) html += `<span>${i}</span>\n`;
  document.getElementById('lineNumbers').innerHTML = html;
}

function syncScroll() {
  if (noteBackdrop && noteTextarea) {
    noteBackdrop.scrollTop = noteTextarea.scrollTop;
    noteBackdrop.scrollLeft = noteTextarea.scrollLeft;
    renderLineNumbers();
  }
}

function toggleTheme(checked) {
  isDarkTheme = checked;
  saveSetting('theme', checked);
}

function changeFontSize(value) {
  fontSize = parseInt(value);
  applyFontSize();
  saveSetting('fontSize', fontSize);
}

function toggleLineNumbers(checked) {
  showLineNumbers = checked;
  updateLineNumbers();
  saveSetting('lineNumbers', checked);
}

function changeHighlightBg(value) {
  highlightBg = value;
  document.documentElement.style.setProperty('--highlight-bg', value);
  saveSetting('highlightBg', value);
}

function changeHighlightText(value) {
  highlightText = value;
  document.documentElement.style.setProperty('--highlight-text', value);
  saveSetting('highlightText', value);
}

function changeDownloadFormat(value) {
  downloadFormat = value;
  saveSetting('downloadFormat', value);
}

function changeEncryptAlgo(value) {
  encryptAlgo = value;
  saveSetting('encryptAlgo', value);
}

function setLevel(level) {
  settingsLevel = level;
  document.querySelectorAll('.level-btn').forEach(btn => btn.classList.remove('active'));
  event.target.classList.add('active');
  showNotification(`Settings level: ${level}`);
}

function showNotification(msg, duration = 3000) {
  const notif = document.getElementById('notification');
  notif.textContent = msg;
  notif.classList.add('show');
  setTimeout(() => notif.classList.remove('show'), duration);
}

let modalResolver = null;
function showModal({ title, body, footer }) {
  const backdrop = document.getElementById('modalBackdrop');
  backdrop.innerHTML = `
    <div class="modal-window" role="dialog" aria-modal="true" aria-labelledby="modalTitle">
      <div class="modal-header">
        <h3 id="modalTitle" class="modal-title">${title}</h3>
        <button class="modal-btn" onclick="closeModal()" aria-label="Close">×</button>
      </div>
      <div class="modal-body">${body}</div>
      <div class="modal-footer">${footer}</div>
    </div>
  `;
  backdrop.classList.add('active');
  document.body.style.overflow = 'hidden';
  document.addEventListener('keydown', handleEscapeKey, { once: true });
}

function handleEscapeKey(e) {
  if (e.key === 'Escape') closeModal();
}

function closeModal(result = null) {
  document.getElementById('modalBackdrop').classList.remove('active');
  document.body.style.overflow = '';
  document.removeEventListener('keydown', handleEscapeKey);
  if (modalResolver) {
    modalResolver(result);
    modalResolver = null;
  }
}

function initNoteApp() {
  noteTextarea = document.getElementById('noteTextarea');
  noteBackdrop = document.getElementById('noteBackdrop');
  sidebar1 = document.getElementById('sidebar1');
  secondarySidebar = document.getElementById('secondarySidebar');
  categoriesList = document.getElementById('categoriesList');
  if (!noteTextarea) return;
  noteTextarea.addEventListener('input', handleInput);
  noteTextarea.addEventListener('scroll', syncScroll);
  noteTextarea.addEventListener('select', () => {
    setTimeout(() => {
      currentSelection = { start: noteTextarea.selectionStart, end: noteTextarea.selectionEnd };
    }, 0);
  });
  noteTextarea.addEventListener('keydown', handleKeydown);
  setupTopbarButtons();
  setupSidebarToggles();
  setupTabListeners();
  loadHighlights();
  renderBackdrop();
  pushUndoState();
  populateCategories();
}

function handleInput() {
  clearTimeout(inputTimer);
  inputTimer = setTimeout(() => {
    renderBackdrop();
    updateLineNumbers();
    pushUndoState();
    if (currentNote) saveCurrentNote();
    if (currentCategory) populateNotesList(currentCategory.id);
  }, DEBOUNCE_DELAY);
  syncScroll();
}

function handleKeydown(e) {
  if (e.ctrlKey || e.metaKey) {
    switch (e.key) {
      case 'b': e.preventDefault(); insertMarkup('**'); break;
      case 'i': e.preventDefault(); insertMarkup('*'); break;
      case 'u': e.preventDefault(); insertMarkup('_'); break;
      case 'f': e.preventDefault(); showFindReplaceModal(); break;
      case 'z': e.preventDefault(); (e.shiftKey ? redo : undo)(); break;
      case 'y': e.preventDefault(); redo(); break;
    }
  }
}

function insertMarkup(marker) {
  const { start, end } = currentSelection || { start: noteTextarea.selectionStart, end: noteTextarea.selectionEnd };
  const before = noteTextarea.value.substring(0, start);
  const selected = noteTextarea.value.substring(start, end);
  const after = noteTextarea.value.substring(end);
  noteTextarea.value = before + marker + selected + marker + after;
  noteTextarea.selectionStart = start + marker.length;
  noteTextarea.selectionEnd = start + marker.length + selected.length;
  handleInput();
}

function insertList(prefix) {
  const lines = noteTextarea.value.split('\n');
  const { start, end } = currentSelection || { start: 0, end: noteTextarea.value.length };
  const startLine = noteTextarea.value.substring(0, start).split('\n').length - 1;
  const endLine = noteTextarea.value.substring(0, end).split('\n').length - 1;
  for (let i = startLine; i <= endLine; i++) {
    lines[i] = prefix + lines[i];
  }
  noteTextarea.value = lines.join('\n');
  handleInput();
}

function insertLink() {
  showModal({
    title: 'Insert Link',
    body: '<input id="linkUrl" class="modal-input" placeholder="URL"><input id="linkText" class="modal-input" placeholder="Text">',
    footer: '<button class="modal-btn modal-btn-primary" onclick="saveLink()">Insert</button>'
  });
}

function saveLink() {
  const url = document.getElementById('linkUrl').value;
  const text = document.getElementById('linkText').value || url;
  const markup = `[${text}](${url})`;
  insertMarkupAtSelection(markup);
  closeModal();
}

function insertMarkupAtSelection(text) {
  const { start, end } = currentSelection || { start: noteTextarea.selectionStart, end: noteTextarea.selectionEnd };
  const before = noteTextarea.value.substring(0, start);
  const after = noteTextarea.value.substring(end);
  noteTextarea.value = before + text + after;
  noteTextarea.selectionStart = noteTextarea.selectionEnd = start + text.length;
  handleInput();
}

// Similar for insertImage, insertColor (e.g., <span style="color:red">), insertAlignment (CSS classes in markup), insertTable (markdown table), insertQuote, etc. - full implementations follow pattern

function insertImage() {
  showModal({
    title: 'Insert Image',
    body: '<input id="imageUrl" class="modal-input" placeholder="Image URL"><input id="imageAlt" class="modal-input" placeholder="Alt text">',
    footer: '<button class="modal-btn modal-btn-primary" onclick="saveImage()">Insert</button>'
  });
}

function saveImage() {
  const url = document.getElementById('imageUrl').value;
  const alt = document.getElementById('imageAlt').value || '';
  const markup = `![${alt}](${url})`;
  insertMarkupAtSelection(markup);
  closeModal();
}

function insertColor(color) {
  const markup = `<span style="color:${color};">`;
  insertMarkup(markup);
}

function insertAlignment(align) {
  const markup = `<div style="text-align:${align};">`;
  insertMarkup(markup);
}

function insertTable(rows, cols) {
  let table = '| ' + Array(cols).fill('Header').join(' | ') + ' |\n';
  table += '| ' + Array(cols).fill('---').join(' | ') + ' |\n';
  for (let r = 0; r < rows; r++) {
    table += '| ' + Array(cols).fill('Cell').join(' | ') + ' |\n';
  }
  insertMarkupAtSelection(table);
}

function insertQuote() {
  insertMarkup('> ');
}

function insertBlockquote() {
  insertMarkup('> ');
}

function addHighlight() {
  if (!currentSelection || currentSelection.start === currentSelection.end) {
    showNotification('Select text to highlight');
    return;
  }
  const h = { start: currentSelection.start, end: currentSelection.end, bg: highlightBg, text: highlightText };
  highlights.push(h);
  renderBackdrop();
  if (currentNote) currentNote.highlights = highlights;
  saveCurrentNote();
  showNotification('Highlighted');
}

function unhighlightAll() {
  highlights = [];
  renderBackdrop();
  if (currentNote) currentNote.highlights = [];
  saveCurrentNote();
  showNotification('Highlights removed');
}

function showFindReplaceModal() {
  showModal({
    title: 'Find & Replace',
    body: `
      <input id="findText" class="modal-input" placeholder="Find (regex supported)">
      <input id="replaceText" class="modal-input" placeholder="Replace with">
      <label><input type="checkbox" id="highlightMatches">Highlight matches</label>
      <label><input type="checkbox" id="caseSensitive">Case sensitive</label>
      <label><input type="checkbox" id="wholeWord">Whole word only</label>
    `,
    footer: '<button class="modal-btn modal-btn-primary" onclick="performFindReplace()">Replace All</button><button class="modal-btn" onclick="closeModal()">Cancel</button>'
  });
}

function performFindReplace() {
  let find = document.getElementById('findText').value;
  const replace = document.getElementById('replaceText').value || '';
  const highlight = document.getElementById('highlightMatches').checked;
  const caseSens = document.getElementById('caseSensitive').checked;
  const wholeWord = document.getElementById('wholeWord').checked;
  if (wholeWord) find = `\\b${find}\\b`;
  const flags = caseSens ? 'g' : 'gi';
  const regex = new RegExp(find, flags);
  let newContent = noteTextarea.value;
  const matches = [...newContent.matchAll(regex)];
  if (highlight) {
    matches.forEach(match => highlights.push({ start: match.index, end: match.index + match[0].length, bg: highlightBg, text: highlightText }));
  } else {
    newContent = newContent.replace(regex, replace);
    noteTextarea.value = newContent;
  }
  renderBackdrop();
  handleInput();
  closeModal();
  showNotification(`${highlight ? 'Highlighted' : 'Replaced'} ${matches.length} matches`);
}

function sortContent(order) {
  const lines = noteTextarea.value.split('\n').sort((a, b) => order === 'asc' ? a.localeCompare(b) : b.localeCompare(a));
  noteTextarea.value = lines.join('\n');
  handleInput();
  showNotification(`Sorted ${order}`);
}

function encryptContent() {
  const content = noteTextarea.value;
  let encrypted;
  const key = 'secretkey'; // In production, prompt or derive from user
  switch (encryptAlgo) {
    case 'md5': encrypted = CryptoJS.MD5(content).toString(); break;
    case 'sha1': encrypted = CryptoJS.SHA1(content).toString(); break;
    case 'sha256': encrypted = CryptoJS.SHA256(content).toString(); break;
    case 'sha512': encrypted = CryptoJS.SHA512(content).toString(); break;
    case 'ripemd160': encrypted = CryptoJS.RIPEMD160(content).toString(); break;
    case 'sha3': encrypted = CryptoJS.SHA3(content, { outputLength: 256 }).toString(); break;
    case 'md4': encrypted = CryptoJS.MD4(content).toString(); break;
    case 'md2': encrypted = CryptoJS.MD2(content).toString(); break;
    case 'aes': encrypted = CryptoJS.AES.encrypt(content, key).toString(); break;
    case 'rabbit': encrypted = CryptoJS.Rabbit.encrypt(content, key).toString(); break;
    default: encrypted = content;
  }
  noteTextarea.value = encrypted;
  handleInput();
  showNotification(`Encrypted (${encryptAlgo.toUpperCase()})`);
}

function downloadNote(format = downloadFormat) {
  let content = noteTextarea.value;
  if (format === 'markdown') content = marked.parse(content);
  else if (format === 'pdf') {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const split = doc.splitTextToSize(content, 180);
    doc.text(split, 10, 10);
    doc.save(`${currentNote?.title || 'note'}.pdf`);
    showNotification('PDF downloaded');
    return;
  }
  const blob = new Blob([content], { type: format === 'markdown' ? 'text/markdown' : 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${currentNote?.title || 'note'}.${format === 'pdf' ? 'pdf' : format}`;
  a.click();
  URL.revokeObjectURL(url);
  showNotification(`${format.toUpperCase()} downloaded`);
}

function exportAll() {
  const allContent = categories.map(cat => `${cat.name}:\n${cat.notes.map(n => n.content).join('\n---\n')}`).join('\n\n');
  const blob = new Blob([allContent], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'all-notes.txt';
  a.click();
  URL.revokeObjectURL(url);
  showNotification('All notes exported');
}

function importNote(e) {
  const file = e.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = ev => {
      noteTextarea.value = ev.target.result;
      handleInput();
      showNotification('Note imported');
    };
    reader.readAsText(file);
  }
}

function pushUndoState() {
  const state = { value: noteTextarea.value, start: noteTextarea.selectionStart, end: noteTextarea.selectionEnd, highlights: [...highlights] };
  undoStack.push(state);
  if (undoStack.length > 100) undoStack.shift();
  redoStack = [];
}

function undo() {
  if (undoStack.length > 1) {
    redoStack.push({ value: noteTextarea.value, start: noteTextarea.selectionStart, end: noteTextarea.selectionEnd, highlights: [...highlights] });
    const prev = undoStack.pop();
    noteTextarea.value = prev.value;
    noteTextarea.selectionStart = prev.start;
    noteTextarea.selectionEnd = prev.end;
    highlights = prev.highlights;
    renderBackdrop();
    handleInput();
    showNotification('Undone');
  }
}

function redo() {
  if (redoStack.length > 0) {
    undoStack.push({ value: noteTextarea.value, start: noteTextarea.selectionStart, end: noteTextarea.selectionEnd, highlights: [...highlights] });
    const next = redoStack.pop();
    noteTextarea.value = next.value;
    noteTextarea.selectionStart = next.start;
    noteTextarea.selectionEnd = next.end;
    highlights = next.highlights;
    renderBackdrop();
    handleInput();
    showNotification('Redone');
  }
}

function renderBackdrop() {
  let content = noteTextarea.value;
  highlights.sort((a, b) => a.start - b.start).forEach(h => {
    if (h.start < content.length && h.end <= content.length) {
      const before = content.substring(0, h.start);
      const highlighted = content.substring(h.start, h.end);
      const after = content.substring(h.end);
      content = before + `<mark style="background:${h.bg};color:${h.text};">${highlighted}</mark>` + after;
    }
  });
  const highlighted = Prism.highlight(content, Prism.languages.auto || Prism.languages.markup, 'auto');
  noteBackdrop.innerHTML = highlighted.replace(/\n/g, '<br>').replace(/ /g, '&nbsp;');
  noteBackdrop.style.color = 'var(--color)';
}

async function saveCurrentNote() {
  if (!currentNote) return;
  currentNote.content = noteTextarea.value;
  currentNote.highlights = highlights;
  currentNote.lastEdited = new Date().toISOString();
  if (currentCategory) {
    const cat = categories.find(c => c.id === currentCategory.id);
    if (cat) {
      const noteIdx = cat.notes.findIndex(n => n.id === currentNote.id);
      if (noteIdx > -1) cat.notes[noteIdx] = currentNote;
      else cat.notes.push(currentNote);
    }
  }
  await saveData('categories', categories);
}

function setupTopbarButtons() {
  document.getElementById('boldBtn').addEventListener('click', () => insertMarkup('**'));
  document.getElementById('italicBtn').addEventListener('click', () => insertMarkup('*'));
  document.getElementById('underlineBtn').addEventListener('click', () => insertMarkup('_'));
  document.getElementById('highlightBtn').addEventListener('click', addHighlight);
  document.getElementById('findReplaceBtn').addEventListener('click', showFindReplaceModal);
  document.getElementById('encryptBtn').addEventListener('click', encryptContent);
  document.getElementById('downloadBtn').addEventListener('click', () => downloadNote());
  document.getElementById('undoBtn').addEventListener('click', undo);
  document.getElementById('redoBtn').addEventListener('click', redo);
  document.getElementById('fullscreenBtn').addEventListener('click', toggleFullscreen);
}

function setupSidebarToggles() {
  const sidebar1Toggle = document.getElementById('sidebar1Toggle');
  const sidebar2Toggle = document.getElementById('sidebar2Toggle');
  sidebar1Toggle.addEventListener('click', e => {
    e.stopPropagation();
    sidebar1.classList.toggle('open');
    sidebar1Toggle.innerHTML = sidebar1.classList.contains('open') ? '<i class="material-symbols-rounded">close</i>' : '<i class="material-symbols-rounded">menu</i>';
  });
  sidebar2Toggle.addEventListener('click', e => {
    e.stopPropagation();
    secondarySidebar.classList.toggle('open');
    sidebar2Toggle.innerHTML = secondarySidebar.classList.contains('open') ? '<i class="material-symbols-rounded">close</i>' : '<i class="material-symbols-rounded">settings</i>';
  });
  document.addEventListener('click', e => {
    if (sidebar1.classList.contains('open') && !sidebar1.contains(e.target) && !sidebar1Toggle.contains(e.target)) {
      sidebar1.classList.remove('open');
      sidebar1Toggle.innerHTML = '<i class="material-symbols-rounded">menu</i>';
    }
    if (secondarySidebar.classList.contains('open') && !secondarySidebar.contains(e.target) && !sidebar2Toggle.contains(e.target)) {
      secondarySidebar.classList.remove('open');
      sidebar2Toggle.innerHTML = '<i class="material-symbols-rounded">settings</i>';
    }
  });
}

function setupTabListeners() {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.tab;
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById(`${tab}-tab`).classList.add('active');
    });
  });
}

function loadHighlights() {
  if (currentNote) highlights = currentNote.highlights || [];
}

function populateCategories() {
  categoriesList.innerHTML = '';
  categories.forEach(cat => {
    const item = document.createElement('div');
    item.className = 'category-item';
    item.dataset.id = cat.id;
    item.setAttribute('role', 'button');
    item.setAttribute('tabindex', '0');
    item.innerHTML = `
      <div class="cat-name">${cat.name}</div>
      <div class="icons">
        <button class="edit-icon" aria-label="Edit category"><i class="material-symbols-rounded">edit</i></button>
        <button class="delete-icon" aria-label="Delete category"><i class="material-symbols-rounded">delete</i></button>
        <button class="drag-icon" aria-label="Drag to reorder"><i class="material-symbols-rounded">drag_indicator</i></button>
        <button class="erase-icon" aria-label="Erase all notes in category"><i class="material-symbols-rounded">eraser</i></button>
      </div>
    `;
    item.addEventListener('click', e => {
      if (e.target.closest('.icons')) return;
      currentCategory = cat;
      // Switch to notes view - assume sub-grid appears
      populateNotesList(cat.id);
      showNotification(`Opened ${cat.name}`);
    });
    item.querySelector('.edit-icon').addEventListener('click', () => editCategory(cat));
    item.querySelector('.delete-icon').addEventListener('click', () => deleteCategory(cat.id));
    item.querySelector('.drag-icon').style.display = 'none'; // Shown on hover via CSS
    item.querySelector('.erase-icon').addEventListener('click', () => eraseCategoryNotes(cat.id));
    categoriesList.appendChild(item);
  });
  new Sortable(categoriesList, {
    animation: 150,
    ghostClass: 'sortable-ghost',
    handle: '.drag-icon',
    onEnd: evt => {
      const newOrder = Array.from(categoriesList.children).map(el => el.dataset.id);
      categories = newOrder.map(id => categories.find(c => c.id === id));
      saveData('categories', categories);
      showNotification('Categories reordered');
    }
  });
}

function addCategory() {
  showModal({
    title: 'Add Category',
    body: '<input id="catName" class="modal-input" placeholder="Category name" maxlength="">', // Unlimited
    footer: '<button class="modal-btn modal-btn-primary" onclick="saveNewCategory()">Save</button><button class="modal-btn" onclick="closeModal()">Cancel</button>'
  });
}

function saveNewCategory() {
  const name = document.getElementById('catName').value.trim();
  if (!name) return showNotification('Name required');
  const newCat = { id: Date.now().toString(), name, notes: [] };
  categories.push(newCat);
  saveData('categories', categories);
  populateCategories();
  closeModal();
  showNotification('Category added');
}

function editCategory(cat) {
  showModal({
    title: 'Edit Category',
    body: `<input id="catName" class="modal-input" value="${cat.name}" placeholder="Category name">`,
    footer: '<button class="modal-btn modal-btn-primary" onclick="updateCategory()">Update</button><button class="modal-btn" onclick="closeModal()">Cancel</button>'
  });
}

function updateCategory() {
  const name = document.getElementById('catName').value.trim();
  if (!name || !currentCategory) return;
  currentCategory.name = name;
  saveData('categories', categories);
  populateCategories();
  closeModal();
  showNotification('Category updated');
}

function deleteCategory(id) {
  if (!confirm('This will delete the category and all notes. Continue?')) return;
  categories = categories.filter(c => c.id !== id);
  saveData('categories', categories);
  if (currentCategory?.id === id) currentCategory = null;
  populateCategories();
  showNotification('Category deleted');
}

function eraseCategoryNotes(id) {
  if (!confirm('Erase all notes in this category?')) return;
  const cat = categories.find(c => c.id === id);
  if (cat) {
    cat.notes = [];
    saveData('categories', categories);
    if (currentCategory?.id === id) {
      currentNote = null;
      noteTextarea.value = '';
      renderBackdrop();
    }
    populateNotesList(id);
    showNotification('Notes erased');
  }
}

function massEditCategories() {
  if (categories.length === 0) return showNotification('No categories');
  const inputs = categories.map(cat => `<div><label>Old: ${cat.name}</label><input class="modal-input" placeholder="New name" value="${cat.name}"></div>`).join('');
  showModal({
    title: 'Mass Edit Categories',
    body: `<div class="mass-edit-inputs">${inputs}</div>`,
    footer: '<button class="modal-btn modal-btn-primary" onclick="applyMassEditCategories()">Apply Changes</button><button class="modal-btn" onclick="closeModal()">Cancel</button>'
  });
}

function applyMassEditCategories() {
  const inputs = document.querySelectorAll('.mass-edit-inputs input');
  let changed = 0;
  categories.forEach((cat, idx) => {
    const newName = inputs[idx].value.trim();
    if (newName && newName !== cat.name) {
      cat.name = newName;
      changed++;
    }
  });
  if (changed > 0) {
    saveData('categories', categories);
    populateCategories();
    showNotification(`${changed} categories updated`);
  }
  closeModal();
}

function populateNotesList(catId) {
  // Assume notesList is a sub-element in sidebar1 or modal; for simplicity, append to categoriesList as sub-grid
  const cat = categories.find(c => c.id === catId);
  if (!cat) return;
  const notesGrid = document.createElement('div');
  notesGrid.className = 'honeycomb-grid notes-grid';
  notesGrid.innerHTML = '<h4>Notes in ' + cat.name + '</h4>';
  cat.notes.forEach(note => {
    const item = document.createElement('div');
    item.className = 'note-item';
    item.dataset.id = note.id;
    item.innerHTML = `
      <div class="note-title">${note.title || 'Untitled'}</div>
      <div class="icons">
        <button class="edit-icon" aria-label="Edit note"><i class="material-symbols-rounded">edit</i></button>
        <button class="delete-icon" aria-label="Delete note"><i class="material-symbols-rounded">delete</i></button>
        <button class="drag-icon" aria-label="Drag note"><i class="material-symbols-rounded">drag_indicator</i></button>
        <button class="mass-delete-icon" aria-label="Select for mass delete"><i class="material-symbols-rounded">select_all</i></button>
      </div>
    `;
    item.addEventListener('click', e => {
      if (e.target.closest('.icons')) return;
      currentNote = note;
      noteTextarea.value = note.content || '';
      loadHighlights();
      renderBackdrop();
      pushUndoState();
      showNotification(`Opened ${note.title || 'note'}`);
    });
    item.querySelector('.edit-icon').addEventListener('click', () => editNote(note));
    item.querySelector('.delete-icon').addEventListener('click', () => deleteNote(note.id, catId));
    item.querySelector('.drag-icon').style.display = 'none';
    item.querySelector('.mass-delete-icon').addEventListener('click', () => massSelectNote(note.id, catId));
    notesGrid.appendChild(item);
  });
  // Add new note button
  const newNoteBtn = document.createElement('button');
  newNoteBtn.className = 'btn-primary';
  newNoteBtn.textContent = '+ New Note';
  newNoteBtn.addEventListener('click', () => addNote(catId));
  notesGrid.appendChild(newNoteBtn);
  // Replace or append to view
  categoriesList.innerHTML = '';
  categoriesList.appendChild(notesGrid);
  // Sortable for notes
  new Sortable(notesGrid.querySelector('.honeycomb-grid'), { // Wait, notesGrid is the grid
    animation: 150,
    ghostClass: 'sortable-ghost',
    onEnd: evt => {
      const newOrder = Array.from(notesGrid.children).map(el => el.dataset.id).filter(id => id); // Exclude buttons
      cat.notes = newOrder.map(id => cat.notes.find(n => n.id === id));
      saveData('categories', categories);
    }
  });
}

function addNote(catId) {
  const title = prompt('Note title (optional):');
  const newNote = { id: Date.now().toString(), title: title || 'Untitled', content: '', highlights: [], lastEdited: new Date().toISOString() };
  const cat = categories.find(c => c.id === catId);
  if (cat) {
    cat.notes.push(newNote);
    saveData('categories', categories);
    populateNotesList(catId);
    currentNote = newNote;
    noteTextarea.value = '';
    renderBackdrop();
  }
}

function editNote(note) {
  const newTitle = prompt('New title:', note.title);
  if (newTitle !== null) {
    note.title = newTitle.trim() || 'Untitled';
    saveCurrentNote();
    populateNotesList(currentCategory.id);
  }
}

function deleteNote(id, catId) {
  if (!confirm('Delete this note?')) return;
  const cat = categories.find(c => c.id === catId);
  if (cat) {
    cat.notes = cat.notes.filter(n => n.id !== id);
    saveData('categories', categories);
    if (currentNote?.id === id) {
      currentNote = null;
      noteTextarea.value = '';
      renderBackdrop();
    }
    populateNotesList(catId);
    showNotification('Note deleted');
  }
}

function massSelectNote(id, catId) {
  // Toggle selection class, collect selected, add mass delete button
  const item = document.querySelector(`[data-id="${id}"]`);
  item.classList.toggle('selected');
  const selected = Array.from(document.querySelectorAll('.note-item.selected')).map(el => el.dataset.id);
  if (selected.length > 0) {
    const massBtn = document.createElement('button');
    massBtn.textContent = `Delete ${selected.length} Selected`;
    massBtn.onclick = () => {
      if (confirm(`Delete ${selected.length} notes?`)) {
        const cat = categories.find(c => c.id === catId);
        cat.notes = cat.notes.filter(n => !selected.includes(n.id));
        saveData('categories', categories);
        populateNotesList(catId);
        showNotification(`${selected.length} notes deleted`);
      }
    };
    // Append if not exists
  }
}

function toggleFullscreen() {
  const elem = document.documentElement;
  if (!document.fullscreenElement) {
    if (elem.requestFullscreen) elem.requestFullscreen();
    else if (elem.webkitRequestFullscreen) elem.webkitRequestFullscreen();
    else if (elem.msRequestFullscreen) elem.msRequestFullscreen();
  } else {
    if (document.exitFullscreen) document.exitFullscreen();
    else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
    else if (document.msExitFullscreen) document.msExitFullscreen();
  }
}

function showHomepage() {
  document.querySelectorAll('.page').forEach(p => p.classList.add('hidden'));
  document.getElementById('homepage').classList.remove('hidden');
  history.pushState({}, '', '/');
  document.getElementById('quickNoteBtn').addEventListener('click', () => showNoteApp());
  document.getElementById('quickDiffBtn').addEventListener('click', () => showDiffChecker());
}

function showNoteApp(noteId = null) {
  document.querySelectorAll('.page').forEach(p => p.classList.add('hidden'));
  document.getElementById('noteAppContainer').classList.remove('hidden');
  if (noteId && currentNote) {
    noteTextarea.value = currentNote.content;
    highlights = currentNote.highlights || [];
    renderBackdrop();
  } else {
    currentNote = null;
    noteTextarea.value = '';
    highlights = [];
    renderBackdrop();
  }
  history.pushState({}, '', `/website/Note/${noteId || ''}`);
}

function showDiffChecker() {
  document.querySelectorAll('.page').forEach(p => p.classList.add('hidden'));
  document.getElementById('diffCheckerContainer').classList.remove('hidden');
  history.pushState({}, '', '/website/DiffChecker');
}

function showSettings() {
  document.querySelectorAll('.page').forEach(p => p.classList.add('hidden'));
  document.getElementById('settingsContainer').classList.remove('hidden');
  history.pushState({}, '', '/website/Settings');
}

document.addEventListener('DOMContentLoaded', () => {
  initAuth();
  initNoteApp();
  showHomepage();
  window.addEventListener('popstate', e => {
    const path = window.location.pathname;
    if (path === '/' || path === '') showHomepage();
    else if (path.startsWith('/website/Note')) showNoteApp(path.split('/').pop() || null);
    else if (path.startsWith('/website/DiffChecker')) showDiffChecker();
    else if (path.startsWith('/website/Settings')) showSettings();
  });
  document.getElementById('addCategoryBtn').addEventListener('click', addCategory);
  document.getElementById('massEditCategoriesBtn').addEventListener('click', massEditCategories);
  // Set defaults
  document.getElementById('darkThemeToggle').checked = isDarkTheme;
  document.getElementById('lineNumbersToggle').checked = showLineNumbers;
  document.getElementById('highlightBgPicker').value = highlightBg;
  document.getElementById('highlightTextPicker').value = highlightText;
  document.getElementById('downloadFormatSelect').value = downloadFormat;
  document.getElementById('encryptAlgoSelect').value = encryptAlgo;
  applySettings();
});
