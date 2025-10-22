// newnoteapp.js
let noteTextarea, noteBackdrop, sidebar1, secondarySidebar, topbar, homepage, noteAppContainer, diffCheckerContainer;
let undoStack = [];
let redoStack = [];
let inputTimer = null;
let highlights = [];
let currentSelection = null;
const DEBOUNCE_DELAY = 300;
function initNoteApp() {
  noteTextarea = document.getElementById('noteTextarea');
  noteBackdrop = document.getElementById('noteBackdrop');
  sidebar1 = document.getElementById('sidebar1');
  secondarySidebar = document.getElementById('secondarySidebar');
  topbar = document.querySelector('.topbar');
  noteAppContainer = document.getElementById('noteAppContainer');
  if (!noteTextarea || !noteBackdrop) return;
  noteTextarea.addEventListener('input', handleInput);
  noteTextarea.addEventListener('scroll', syncScroll);
  noteTextarea.addEventListener('select', handleSelection);
  noteTextarea.addEventListener('keydown', handleKeydown);
  setupTopbarButtons();
  setupSidebarToggles();
  loadHighlights();
  renderBackdrop();
  pushUndoState();
}
function handleInput() {
  clearTimeout(inputTimer);
  inputTimer = setTimeout(() => {
    renderBackdrop();
    updateLineNumbers();
    pushUndoState();
    saveCurrentNote();
    if (currentCategory) populateNotesList(currentCategory.id);
  }, DEBOUNCE_DELAY);
  syncScroll();
}
function handleSelection() {
  const selection = window.getSelection();
  if (selection.rangeCount > 0) {
    const range = selection.getRangeAt(0);
    const start = range.startOffset;
    const end = range.endOffset;
    currentSelection = { start, end };
  }
}
function handleKeydown(e) {
  if (e.ctrlKey || e.metaKey) {
    switch (e.key) {
      case 'b':
        e.preventDefault();
        insertMarkup('**');
        break;
      case 'i':
        e.preventDefault();
        insertMarkup('*');
        break;
      case 'u':
        e.preventDefault();
        insertMarkup('_');
        break;
      case 'f':
        e.preventDefault();
        showFindReplaceModal();
        break;
      case 'z':
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
        break;
      case 'y':
        e.preventDefault();
        redo();
        break;
    }
  } else if (e.key === 'Escape') {
    closeModal();
  }
}
function insertMarkup(marker) {
  const selection = noteTextarea.selectionStart;
  const before = noteTextarea.value.substring(0, selection);
  const after = noteTextarea.value.substring(selection);
  noteTextarea.value = before + marker + marker + after;
  noteTextarea.selectionStart = noteTextarea.selectionEnd = selection + marker.length;
  handleInput();
}
function setupTopbarButtons() {
  document.getElementById('boldBtn').addEventListener('click', () => insertMarkup('**'));
  document.getElementById('italicBtn').addEventListener('click', () => insertMarkup('*'));
  document.getElementById('underlineBtn').addEventListener('click', () => insertMarkup('_'));
  document.getElementById('highlightBtn').addEventListener('click', addHighlight);
  document.getElementById('findReplaceBtn').addEventListener('click', showFindReplaceModal);
  document.getElementById('encryptBtn').addEventListener('click', encryptContent);
  document.getElementById('downloadBtn').addEventListener('click', downloadNote);
  document.getElementById('undoBtn').addEventListener('click', undo);
  document.getElementById('redoBtn').addEventListener('click', redo);
  document.getElementById('fullscreenBtn').addEventListener('click', toggleFullscreen);
  document.getElementById('showSettingsBtn').addEventListener('click', showSettingsModal);
  document.getElementById('addCategoryBtn').addEventListener('click', addCategory);
  document.getElementById('exportAllBtn').addEventListener('click', exportAll);
}
function setupSidebarToggles() {
  const sidebar1Toggle = document.getElementById('sidebar1Toggle');
  const sidebar2Toggle = document.getElementById('sidebar2Toggle');
  sidebar1Toggle.addEventListener('click', (e) => {
    e.stopPropagation();
    sidebar1.classList.toggle('open');
    const isOpen = sidebar1.classList.contains('open');
    sidebar1Toggle.innerHTML = isOpen ? '<i class="material-symbols-rounded">close</i>' : '<i class="material-symbols-rounded">menu</i>';
  });
  sidebar2Toggle.addEventListener('click', (e) => {
    e.stopPropagation();
    secondarySidebar.classList.toggle('open');
    const isOpen = secondarySidebar.classList.contains('open');
    sidebar2Toggle.innerHTML = isOpen ? '<i class="material-symbols-rounded">close</i>' : '<i class="material-symbols-rounded">settings</i>';
  });
  document.addEventListener('click', (e) => {
    if (!sidebar1.contains(e.target) && !sidebar1Toggle.contains(e.target) && sidebar1.classList.contains('open')) {
      sidebar1.classList.remove('open');
      sidebar1Toggle.innerHTML = '<i class="material-symbols-rounded">menu</i>';
    }
    if (!secondarySidebar.contains(e.target) && !sidebar2Toggle.contains(e.target) && secondarySidebar.classList.contains('open')) {
      secondarySidebar.classList.remove('open');
      sidebar2Toggle.innerHTML = '<i class="material-symbols-rounded">settings</i>';
    }
  });
  secondarySidebar.addEventListener('click', (e) => e.stopPropagation());
}
function addCategory() {
  showModal({
    title: 'Add Category',
    body: '<input id="newCategoryName" class="modal-input" placeholder="Category Name">',
    footer: '<button class="modal-btn modal-btn-primary">Add</button><button class="modal-btn" onclick="closeModal()">Cancel</button>',
    validate: (container) => validateModalFields(container),
    callback: (values) => {
      const newCat = {
        id: Date.now().toString(),
        name: values.newCategoryName,
        notes: []
      };
      categories.push(newCat);
      saveUserData(currentUser.uid);
      populateCategories();
    }
  });
}
function populateCategories() {
  const container = document.getElementById('categoriesContainer');
  container.innerHTML = '';
  categories.forEach((cat) => {
    const item = document.createElement('div');
    item.className = 'category-item';
    item.innerHTML = `
      <span>${cat.name}</span>
      <div class="icons">
        <button class="drag-icon" data-id="${cat.id}"><i class="material-symbols-rounded">drag_indicator</i></button>
        <button class="edit-icon" data-id="${cat.id}"><i class="material-symbols-rounded">edit</i></button>
        <button class="delete-icon" data-id="${cat.id}"><i class="material-symbols-rounded">delete</i></button>
        <button class="erase-icon" data-id="${cat.id}"><i class="material-symbols-rounded">auto_awesome_mosaic</i></button>
      </div>
    `;
    item.addEventListener('click', (e) => {
      if (!e.target.closest('.icons')) {
        currentCategory = cat;
        populateNotesList(cat.id);
      }
    });
    item.querySelector('.edit-icon').addEventListener('click', () => editCategory(cat.id));
    item.querySelector('.delete-icon').addEventListener('click', () => deleteCategory(cat.id));
    item.querySelector('.erase-icon').addEventListener('click', () => eraseCategoryNotes(cat.id));
    container.appendChild(item);
  });
  new Sortable(container, {
    animation: 150,
    ghostClass: 'sortable-ghost',
    onEnd: (evt) => {
      const item = categories[evt.oldIndex];
      categories.splice(evt.oldIndex, 1);
      categories.splice(evt.newIndex, 0, item);
      saveUserData(currentUser.uid);
    }
  });
}
function editCategory(catId) {
  const cat = categories.find(c => c.id === catId);
  showModal({
    title: 'Edit Category',
    body: `<input id="editCategoryName" class="modal-input" value="${cat.name}">`,
    footer: '<button class="modal-btn modal-btn-primary">Save</button><button class="modal-btn" onclick="closeModal()">Cancel</button>',
    validate: (container) => validateModalFields(container),
    callback: (values) => {
      cat.name = values.editCategoryName;
      saveUserData(currentUser.uid);
      populateCategories();
    }
  });
}
function deleteCategory(catId) {
  if (!confirm('Delete category and all notes?')) return;
  categories = categories.filter(c => c.id !== catId);
  notes = notes.filter(n => !n.categoryId || n.categoryId !== catId);
  saveUserData(currentUser.uid);
  populateCategories();
}
function eraseCategoryNotes(catId) {
  if (!confirm('Erase all notes in category?')) return;
  const cat = categories.find(c => c.id === catId);
  cat.notes.forEach(noteId => {
    notes = notes.filter(n => n.id !== noteId);
  });
  cat.notes = [];
  saveUserData(currentUser.uid);
  if (currentCategory && currentCategory.id === catId) populateNotesList(catId);
}
function populateNotesList(catId) {
  const container = document.querySelector('#categoriesContainer');
  const notesContainer = document.createElement('div');
  notesContainer.id = 'notesContainer';
  notesContainer.style.gridTemplateColumns = 'repeat(auto-fit, minmax(150px, 1fr))';
  container.appendChild(notesContainer);
  const catNotes = notes.filter(n => n.categoryId === catId);
  catNotes.forEach((note) => {
    const item = document.createElement('div');
    item.className = 'note-item';
    item.innerHTML = `
      <span>${note.title}</span>
      <div class="icons">
        <button class="drag-icon" data-id="${note.id}"><i class="material-symbols-rounded">drag_indicator</i></button>
        <button class="edit-icon" data-id="${note.id}"><i class="material-symbols-rounded">edit</i></button>
        <button class="delete-icon" data-id="${note.id}"><i class="material-symbols-rounded">delete</i></button>
        <button class="erase-icon" data-id="${note.id}"><i class="material-symbols-rounded">eraser</i></button>
      </div>
    `;
    item.addEventListener('click', (e) => {
      if (!e.target.closest('.icons')) {
        loadNote(note.id);
      }
    });
    item.querySelector('.edit-icon').addEventListener('click', () => editNote(note.id));
    item.querySelector('.delete-icon').addEventListener('click', () => deleteNote(note.id));
    item.querySelector('.erase-icon').addEventListener('click', () => eraseNote(note.id));
    notesContainer.appendChild(item);
  });
  new Sortable(notesContainer, {
    animation: 150,
    ghostClass: 'sortable-ghost',
    onEnd: (evt) => {
      const item = catNotes[evt.oldIndex];
      catNotes.splice(evt.oldIndex, 1);
      catNotes.splice(evt.newIndex, 0, item);
      saveUserData(currentUser.uid);
    }
  });
  const addNoteBtn = document.createElement('button');
  addNoteBtn.className = 'note-item';
  addNoteBtn.innerHTML = '<i class="material-symbols-rounded">add</i>';
  addNoteBtn.addEventListener('click', () => createNewNote(catId));
  notesContainer.appendChild(addNoteBtn);
}
function createNewNote(catId = null) {
  const newNote = {
    id: Date.now().toString(),
    title: 'New Note',
    content: '',
    categoryId: catId,
    lastEdited: new Date().toISOString(),
    highlights: [],
    metadata: {}
  };
  notes.push(newNote);
  currentNote = newNote;
  noteTextarea.value = '';
  document.getElementById('currentNoteTitle').textContent = newNote.title;
  renderBackdrop();
  saveUserData(currentUser.uid);
  if (currentCategory) populateNotesList(currentCategory.id);
  pushUndoState();
}
function loadNote(noteId) {
  currentNote = notes.find(n => n.id === noteId);
  if (currentNote) {
    noteTextarea.value = currentNote.content;
    document.getElementById('currentNoteTitle').textContent = currentNote.title;
    highlights = currentNote.highlights || [];
    renderBackdrop();
    updateLineNumbers();
    pushUndoState();
  }
}
function saveCurrentNote() {
  if (currentNote) {
    currentNote.content = noteTextarea.value;
    currentNote.lastEdited = new Date().toISOString();
    currentNote.highlights = highlights;
    saveUserData(currentUser.uid);
  }
}
function editNote(noteId) {
  const note = notes.find(n => n.id === noteId);
  showModal({
    title: 'Edit Note Title',
    body: `<input id="editNoteTitle" class="modal-input" value="${note.title}">`,
    footer: '<button class="modal-btn modal-btn-primary">Save</button><button class="modal-btn" onclick="closeModal()">Cancel</button>',
    validate: (container) => validateModalFields(container),
    callback: (values) => {
      note.title = values.editNoteTitle;
      if (currentNote && currentNote.id === noteId) {
        document.getElementById('currentNoteTitle').textContent = note.title;
      }
      saveUserData(currentUser.uid);
      if (currentCategory) populateNotesList(currentCategory.id);
    }
  });
}
function deleteNote(noteId) {
  if (!confirm('Delete note?')) return;
  notes = notes.filter(n => n.id !== noteId);
  if (currentNote && currentNote.id === noteId) {
    createNewNote(currentCategory ? currentCategory.id : null);
  }
  saveUserData(currentUser.uid);
  if (currentCategory) populateNotesList(currentCategory.id);
}
function eraseNote(noteId) {
  if (!confirm('Erase note content?')) return;
  const note = notes.find(n => n.id === noteId);
  note.content = '';
  note.highlights = [];
  if (currentNote && currentNote.id === noteId) {
    noteTextarea.value = '';
    renderBackdrop();
  }
  saveUserData(currentUser.uid);
}
function addHighlight() {
  if (!currentSelection) return;
  const colorPrompt = prompt('Enter background color (hex):');
  if (!colorPrompt) return;
  const textColorPrompt = prompt('Enter text color (hex):');
  if (!textColorPrompt) return;
  const newHighlight = {
    id: Date.now().toString(),
    start: currentSelection.start,
    end: currentSelection.end,
    bg: colorPrompt,
    text: textColorPrompt
  };
  highlights.push(newHighlight);
  renderBackdrop();
  saveCurrentNote();
}
function loadHighlights() {
  if (currentNote) {
    highlights = currentNote.highlights || [];
  }
}
function renderBackdrop() {
  let content = noteTextarea.value;
  highlights.forEach((h) => {
    if (h.start < content.length && h.end <= content.length) {
      const before = content.substring(0, h.start);
      const highlighted = content.substring(h.start, h.end);
      const after = content.substring(h.end);
      content = before + `<span class="highlight-span" style="background:${h.bg};color:${h.text};">${highlighted}</span>` + after;
    }
  });
  Prism.highlightElement(noteBackdrop);
  noteBackdrop.innerHTML = content.replace(/\n/g, '<br>').replace(/ /g, '&nbsp;');
  Prism.plugins.autoloader ? Prism.plugins.autoloader.loadLanguages(['javascript', 'css', 'html', 'markdown']) : null;
}
function showFindReplaceModal() {
  const body = `
    <input id="findText" class="modal-input" placeholder="Find">
    <input id="replaceText" class="modal-input" placeholder="Replace">
    <label><input type="checkbox" id="useRegex"> Use Regex</label>
    <label><input type="checkbox" id="highlightMatches"> Highlight Matches</label>
  `;
  const footer = '<button class="modal-btn modal-btn-primary" onclick="performFindReplace()">Replace</button><button class="modal-btn" onclick="closeModal()">Cancel</button>';
  showModal({
    title: 'Find & Replace',
    body: body,
    footer: footer
  });
}
function performFindReplace() {
  const findText = document.getElementById('findText').value;
  const replaceText = document.getElementById('replaceText').value;
  const useRegex = document.getElementById('useRegex').checked;
  const highlightMatches = document.getElementById('highlightMatches').checked;
  let newContent = noteTextarea.value;
  let regex = useRegex ? new RegExp(escapeRegExp(findText), 'g') : new RegExp(escapeRegExp(findText).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
  if (highlightMatches) {
    newContent = newContent.replace(regex, `<span class="highlight-span">${replaceText}</span>`);
  } else {
    newContent = newContent.replace(regex, replaceText);
  }
  noteTextarea.value = newContent;
  handleInput();
  closeModal();
  showNotification(`Replaced ${newContent.match(regex) ? newContent.match(regex).length : 0} occurrences`);
}
function encryptContent() {
  const content = noteTextarea.value;
  let encrypted;
  switch (encryptAlgo) {
    case 'md5':
      encrypted = CryptoJS.MD5(content).toString();
      break;
    case 'sha1':
      encrypted = CryptoJS.SHA1(content).toString();
      break;
    case 'sha256':
      encrypted = CryptoJS.SHA256(content).toString();
      break;
    case 'aes':
      encrypted = CryptoJS.AES.encrypt(content, 'secret').toString();
      break;
    case 'sha512':
      encrypted = CryptoJS.SHA512(content).toString();
      break;
    case 'ripemd160':
      encrypted = CryptoJS.RIPEMD160(content).toString();
      break;
    case 'sha3':
      encrypted = CryptoJS.SHA3(content).toString();
      break;
    case 'md4':
      encrypted = CryptoJS.MD4(content).toString();
      break;
    case 'md2':
      encrypted = CryptoJS.MD2(content).toString();
      break;
    default:
      encrypted = content;
  }
  noteTextarea.value = encrypted;
  handleInput();
  showNotification(`Content encrypted with ${encryptAlgo.toUpperCase()}`);
}
function downloadNote() {
  let content = noteTextarea.value;
  if (downloadFormat === 'markdown') {
    content = marked.parse(content);
  }
  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${currentNote ? currentNote.title : 'note'}.${downloadFormat}`;
  a.click();
  URL.revokeObjectURL(url);
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
}
function pushUndoState() {
  const state = noteTextarea.value;
  undoStack.push(state);
  if (undoStack.length > 50) undoStack.shift();
  redoStack = [];
}
function undo() {
  if (undoStack.length > 1) {
    redoStack.push(noteTextarea.value);
    noteTextarea.value = undoStack[undoStack.length - 2];
    undoStack.pop();
    renderBackdrop();
  }
}
function redo() {
  if (redoStack.length > 0) {
    undoStack.push(noteTextarea.value);
    noteTextarea.value = redoStack.pop();
    renderBackdrop();
  }
}
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
function populateSidebars() {
  populateCategories();
  if (currentCategory) populateNotesList(currentCategory.id);
}
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initNoteApp);
} else {
  initNoteApp();
}
