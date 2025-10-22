let modalBackdrop = null;
let modalResolver = null;
let modalScope = {};
let currentUser = null;
let notes = [];
let categories = [];
let currentCategory = null;
let currentNote = null;
let fontSize = 14;
let isDarkTheme = true;
let showLineNumbers = false;
let highlightBg = '#8b0000';
let highlightText = '#fff';
let downloadFormat = 'markup';
let encryptAlgo = 'md5';
let settingsLevel = 'app';
let undoStack = [];
let redoStack = [];
let inputTimer = null;
let noteTextarea, noteBackdrop, sidebar1, secondarySidebar, topbar, homepage, noteAppContainer, diffCheckerContainer, noteContainer;

function ensureModal() {
  if (modalBackdrop) return;
  modalBackdrop = document.createElement("div");
  modalBackdrop.className = "modal-backdrop";
  modalBackdrop.setAttribute("aria-hidden", "true");
  document.body.appendChild(modalBackdrop);
  modalBackdrop.addEventListener("click", (e) => {
    if (e.target === modalBackdrop) closeModal();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modalBackdrop.classList.contains("active")) {
      closeModal();
    }
  });
}
function closeModal(result = null) {
  if (modalBackdrop) {
    modalBackdrop.classList.remove("active");
    document.documentElement.style.overflow = "";
  }
  modalScope = {};
  if (modalResolver) {
    modalResolver(result);
    modalResolver = null;
  }
  setTimeout(() => {
    if (modalBackdrop) {
      modalBackdrop.innerHTML = "";
    }
  }, 300);
}
function applyModalStyles(element) {
  if (element.tagName === "INPUT") {
    element.classList.add("modal-input");
  } else if (element.tagName === "TEXTAREA") {
    element.classList.add("modal-textarea");
  } else if (element.tagName === "SELECT") {
    element.classList.add("modal-select");
  } else if (element.tagName === "BUTTON") {
    element.classList.add("modal-btn");
  }
  element.querySelectorAll("input, textarea, select, button").forEach((child) => {
    applyModalStyles(child);
  });
}
function createModalScope(container) {
  const scope = {};
  container.querySelectorAll("[id]").forEach((element) => {
    if (element.id) {
      scope[element.id] = element;
    }
  });
  return scope;
}
function validateModalFields(container) {
  let isValid = true;
  const fields = container.querySelectorAll("input, textarea, .custom-dropdown-trigger");
  fields.forEach((field) => {
    field.style.borderColor = "";
    if (field.hasAttribute("data-skip-validation")) {
      return;
    }
    let isEmpty = false;
    if (field.tagName === "INPUT" && (field.type === "text" || field.type === "email" || field.type === "url")) {
      isEmpty = field.value.trim() === "";
    } else if (field.classList.contains("custom-dropdown-trigger")) {
      isEmpty = (field.dataset.value || "").trim() === "";
    } else if (field.tagName === "TEXTAREA") {
      isEmpty = field.value.trim() === "";
    }
    if (isEmpty) {
      field.style.borderColor = "var(--danger)";
      isValid = false;
      const clearValidation = () => {
        field.style.borderColor = "";
        field.removeEventListener("input", clearValidation);
        field.removeEventListener("change", clearValidation);
      };
      field.addEventListener("input", clearValidation);
      field.addEventListener("change", clearValidation);
    }
  });
  return isValid;
}
function collectFormValues(container) {
  const values = {};
  container.querySelectorAll("[id]").forEach((element) => {
    if (element.id) {
      if (element.tagName === "INPUT") {
        if (element.type === "checkbox" || element.type === "radio") {
          values[element.id] = element.checked;
        } else {
          values[element.id] = element.value;
        }
      } else if (element.tagName === "TEXTAREA" || element.tagName === "SELECT") {
        values[element.id] = element.value;
      } else if (element.classList.contains("custom-dropdown-trigger")) {
        values[element.id] = element.dataset.value || element.textContent;
      }
    }
  });
  return values;
}
window.showModal = function (options = {}) {
  ensureModal();
  return new Promise((resolve) => {
    modalResolver = resolve;
    modalScope = {};
    modalBackdrop.innerHTML = "";
    const modalWindow = document.createElement("div");
    modalWindow.className = "modal-window";
    modalWindow.setAttribute("role", "dialog");
    modalWindow.setAttribute("aria-modal", "true");
    const headerDiv = document.createElement("div");
    headerDiv.className = "modal-header";
    if (options.header) {
      if (typeof options.header === "string") {
        headerDiv.innerHTML = options.header;
      } else if (options.header instanceof HTMLElement) {
        headerDiv.appendChild(options.header);
      }
    } else {
      const titleEl = document.createElement("h3");
      titleEl.className = "modal-title";
      titleEl.textContent = options.title || "";
      titleEl.id = "modal-title-" + Math.random().toString(36).slice(2);
      const closeBtn = document.createElement("button");
      closeBtn.className = "modal-close";
      closeBtn.setAttribute("aria-label", "Close dialog");
      closeBtn.innerHTML = "&#x2715;";
      closeBtn.addEventListener("click", closeModal);
      headerDiv.appendChild(titleEl);
      headerDiv.appendChild(closeBtn);
      modalWindow.setAttribute("aria-labelledby", titleEl.id);
    }
    const bodyDiv = document.createElement("div");
    bodyDiv.className = "modal-body";
    if (options.body) {
      if (typeof options.body === "string") {
        bodyDiv.innerHTML = options.body;
      } else if (options.body instanceof HTMLElement) {
        bodyDiv.appendChild(options.body);
      } else if (Array.isArray(options.body)) {
        bodyDiv.innerHTML = options.body.join("");
      }
    }
    const footerDiv = document.createElement("div");
    footerDiv.className = "modal-footer";
    if (options.footer) {
      if (typeof options.footer === "string") {
        footerDiv.innerHTML = options.footer;
      } else if (options.footer instanceof HTMLElement) {
        footerDiv.appendChild(options.footer);
      } else if (Array.isArray(options.footer)) {
        footerDiv.innerHTML = options.footer.join("");
      }
    } else {
      footerDiv.innerHTML = '<button class="modal-btn">OK</button>';
    }
    applyModalStyles(headerDiv);
    applyModalStyles(bodyDiv);
    applyModalStyles(footerDiv);
    modalScope = createModalScope(bodyDiv);
    footerDiv.querySelectorAll("button").forEach((button) => {
      const onclickAttr = button.getAttribute("onclick");
      if (onclickAttr) {
        button.removeAttribute("onclick");
        button.addEventListener("click", () => {
          if (onclickAttr !== "closeModal()") {
            if (!validateModalFields(bodyDiv)) {
              showNotification("Please fill in all required fields.");
              return;
            }
          }
          try {
            new Function('modalScope', `with (modalScope) { ${onclickAttr} }`).call(null, modalScope);
          } catch (error) {
            console.error("Error executing button action:", error);
          }
        });
      } else {
        button.addEventListener("click", () => {
          if (validateModalFields(bodyDiv)) {
            const values = collectFormValues(bodyDiv);
            closeModal({
              action: button.textContent || button.id || "unknown",
              values
            });
          } else {
            showNotification("Please fill in all required fields.");
          }
        });
      }
    });
    bodyDiv.querySelectorAll("[onclick]").forEach((element) => {
      const onclickAttr = element.getAttribute("onclick");
      if (onclickAttr) {
        element.removeAttribute("onclick");
        element.addEventListener("click", () => {
          if (!validateModalFields(bodyDiv)) {
            showNotification("Please fill in all required fields.");
            return;
          }
          try {
            new Function('modalScope', `with (modalScope) { ${onclickAttr} }`).call(null, modalScope);
          } catch (error) {
            console.error("Error executing onclick:", error);
          }
        });
      }
    });
    modalBackdrop.appendChild(modalWindow);
    modalBackdrop.classList.add("active");
    document.documentElement.style.overflow = "hidden";
  });
};
function renderDropdownMenuPortal(trigger, options, callback) {
  document
    .querySelectorAll(".custom-dropdown-portal-menu")
    .forEach((e) => e.remove());
  const menu = document.createElement("div");
  menu.className = "custom-dropdown-portal-menu active";
  menu.setAttribute("role", "listbox");
  options.forEach((o) => {
    const opt = document.createElement("div");
    opt.className = "custom-dropdown-option";
    opt.tabIndex = 0;
    opt.dataset.value = typeof o === "object" ? o.value : o;
    opt.textContent = typeof o === "object" ? o.label : o;
    opt.setAttribute("role", "option");
    opt.addEventListener("click", () => {
      callback(o);
      menu.remove();
    });
    opt.addEventListener("keydown", (ev) => {
      if (ev.key === "Enter") {
        ev.preventDefault();
        opt.click();
      }
    });
    menu.appendChild(opt);
  });
  document.body.appendChild(menu);
  const rect = trigger.getBoundingClientRect();
  menu.style.width = rect.width + "px";
  let left = rect.left + window.scrollX;
  const rightEdge = left + rect.width;
  const viewportWidth = window.innerWidth;
  if (rightEdge > viewportWidth) {
    left -= rightEdge - viewportWidth;
  }
  if (left < 0) left = 0;
  menu.style.left = left + "px";
  menu.style.top = rect.bottom + window.scrollY + "px";
  function closeOnOutside(ev) {
    if (!menu.contains(ev.target) && ev.target !== trigger) {
      menu.remove();
      document.removeEventListener("mousedown", closeOnOutside);
    }
  }
  document.addEventListener("mousedown", closeOnOutside);
  window.addEventListener(
    "scroll",
    () => {
      if (document.body.contains(menu)) {
        const rect = trigger.getBoundingClientRect();
        let leftNew = rect.left + window.scrollX;
        const rightNewEdge = leftNew + rect.width;
        if (rightNewEdge > window.innerWidth) {
          leftNew -= rightNewEdge - window.innerWidth;
        }
        if (leftNew < 0) leftNew = 0;
        menu.style.left = leftNew + "px";
        menu.style.top = rect.bottom + window.scrollY + "px";
        menu.style.width = rect.width + "px";
      }
    },
    { passive: true }
  );
  return menu;
}
async function initAuth() {
  const auth = window.firebase.auth;
  const provider = new window.GoogleAuthProvider();
  window.onAuthStateChanged(auth, async (user) => {
    currentUser = user;
    const welcomeMsg = document.getElementById('welcomeMsg');
    const loginBtn = document.getElementById('googleLoginBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    if (user) {
      welcomeMsg.textContent = `Welcome to Dex Labs, ${user.displayName}`;
      loginBtn.style.display = 'none';
      logoutBtn.style.display = 'inline-flex';
      await loadUserData(user.uid);
    } else {
      welcomeMsg.textContent = 'Welcome to Dex Labs';
      loginBtn.style.display = 'flex';
      logoutBtn.style.display = 'none';
      notes = [];
      categories = [];
      currentCategory = null;
      currentNote = null;
    }
    populateSidebars();
  });
  document.getElementById('googleLoginBtn').onclick = () => window.signInWithPopup(auth, provider).catch(console.error);
  document.getElementById('logoutBtn').onclick = () => window.signOut(auth).catch(console.error);
}
async function loadUserData(uid) {
  const { db, collection, doc, getDoc, getDocs, query, orderBy } = window.dbHelpers;
  try {
    const settingsDoc = await getDoc(doc(db, 'users', uid, 'settings', 'global'));
    if (settingsDoc.exists()) {
      const data = settingsDoc.data();
      isDarkTheme = data.theme?.app !== false;
      fontSize = data.fontSize?.app || 14;
      showLineNumbers = data.lineNumbers?.app || false;
      highlightBg = data.highlightBg?.app || '#8b0000';
      highlightText = data.highlightText?.app || '#fff';
      downloadFormat = data.downloadFormat?.app || 'markup';
      encryptAlgo = data.encryptAlgo?.app || 'md5';
      applyTheme();
      applyFontSize();
      updateHighlightColors();
    }
    const catQuery = query(collection(db, 'users', uid, 'categories'), orderBy('order'));
    const catSnap = await getDocs(catQuery);
    categories = [];
    for (const catDoc of catSnap.docs) {
      const catData = catDoc.data();
      catData.id = catDoc.id;
      catData.notes = await loadCategoryNotes(uid, catDoc.id);
      categories.push(catData);
    }
    if (categories.length === 0) {
      await createDefaultCategory(uid, 'Default');
    }
    currentCategory = categories[0];
    if (currentCategory.notes.length > 0) {
      currentNote = currentCategory.notes[0];
      loadNoteContent(currentNote);
    }
    populateSidebars();
  } catch (e) {
    console.error('Load error:', e);
    showNotification('Error loading data');
  }
}
async function saveNote(note, uid, catId) {
  const { db, doc, setDoc } = window.dbHelpers;
  const encryptedContent = encryptContent(note.content, encryptAlgo);
  await setDoc(doc(db, 'users', uid, 'categories', catId, 'notes', note.id), {
    ...note,
    content: encryptedContent,
    lastEdited: new Date().toISOString()
  });
}
async function loadCategoryNotes(uid, catId) {
  const { db, collection, getDocs } = window.dbHelpers;
  const noteSnap = await getDocs(collection(db, 'users', uid, 'categories', catId, 'notes'));
  const notes = [];
  for (const noteDoc of noteSnap.docs) {
    const noteData = noteDoc.data();
    noteData.id = noteDoc.id;
    noteData.content = decryptContent(noteData.content, encryptAlgo);
    notes.push(noteData);
  }
  return notes.sort((a, b) => new Date(b.lastEdited) - new Date(a.lastEdited));
}
async function createCategory(uid, name) {
  const { db, collection, addDoc, updateDoc } = window.dbHelpers;
  const newCatRef = await addDoc(collection(db, 'users', uid, 'categories'), { name, order: categories.length });
  await updateDoc(newCatRef, { id: newCatRef.id });
  const newCat = { id: newCatRef.id, name, order: categories.length, notes: [] };
  categories.push(newCat);
  currentCategory = newCat;
  populateSidebars();
}
async function deleteCategory(uid, catId) {
  if (!confirm('Delete category and all notes?')) return;
  const { db, doc, deleteDoc, collection, getDocs } = window.dbHelpers;
  const noteSnap = await getDocs(collection(db, 'users', uid, 'categories', catId, 'notes'));
  for (const noteDoc of noteSnap.docs) {
    await deleteDoc(noteDoc.ref);
  }
  await deleteDoc(doc(db, 'users', uid, 'categories', catId));
  categories = categories.filter(c => c.id !== catId);
  if (currentCategory.id === catId) {
    currentCategory = categories[0] || null;
  }
  populateSidebars();
}
async function createDefaultCategory(uid, name) {
  await createCategory(uid, name);
}
function encryptContent(content, algo) {
  switch (algo) {
    case 'md5': return CryptoJS.MD5(content).toString();
    case 'sha1': return CryptoJS.SHA1(content).toString();
    case 'sha256': return CryptoJS.SHA256(content).toString();
    case 'aes': return CryptoJS.AES.encrypt(content, 'userkey').toString(); // Use a prompt for key if needed
    default: return content;
  }
}
function decryptContent(encrypted, algo) {
  switch (algo) {
    case 'aes': return CryptoJS.AES.decrypt(encrypted, 'userkey').toString(CryptoJS.enc.Utf8);
    default: return encrypted;
  }
}
function populateSidebars() {
  const sidebar1El = document.getElementById('sidebar1');
  sidebar1El.innerHTML = '<div class="sidebar-header"><h2>Categories</h2><button id="addCategoryBtn" class="action-button"><i class="material-symbols-rounded">add</i></button></div><div class="category-grid"></div>';
  const grid = sidebar1El.querySelector('.category-grid');
  categories.forEach(cat => {
    const item = document.createElement('div');
    item.className = 'category-item';
    item.innerHTML = `
      <span>${cat.name}</span>
      <div class="icons">
        <button class="drag-icon" draggable="true">⋮⋮</button>
        <button class="edit-icon" onclick="editCategory('${cat.id}')">✏️</button>
        <button class="delete-icon" onclick="deleteCategory('${currentUser.uid}', '${cat.id}')">🗑️</button>
        <button class="erase-icon" onclick="eraseCategoryNotes('${cat.id}')">🧽</button>
      </div>
    `;
    item.onclick = (e) => { if (!e.target.closest('.icons')) openCategory(cat.id); };
    item.draggable = true;
    item.ondragstart = (e) => e.dataTransfer.setData('text/plain', cat.id);
    grid.appendChild(item);
  });
  sidebar1El.ondragover = (e) => e.preventDefault();
  sidebar1El.ondrop = (e) => {
    const id = e.dataTransfer.getData('text/plain');
    const draggedCat = categories.find(c => c.id === id);
    if (draggedCat) {
      const newOrder = prompt('New order position:');
      if (newOrder) {
        draggedCat.order = parseInt(newOrder);
        saveCategoryOrder(currentUser.uid);
      }
    }
  };
  document.getElementById('addCategoryBtn').onclick = () => {
    const name = prompt('Category name');
    if (name) createCategory(currentUser.uid, name);
  };
  if (currentCategory) {
    const noteGrid = document.createElement('div');
    noteGrid.className = 'note-grid';
    noteGrid.innerHTML = '<h3>Notes</h3>';
    currentCategory.notes.forEach(note => {
      const noteItem = document.createElement('div');
      noteItem.className = 'note-item';
      noteItem.innerHTML = `
        <span class="note-title">${note.title}</span>
        <div class="icons">
          <button class="drag-icon" draggable="true">⋮⋮</button>
          <button class="edit-icon" onclick="editNote('${note.id}')">✏️</button>
          <button class="delete-icon" onclick="deleteNote('${note.id}')">🗑️</button>
          <button class="erase-icon" onclick="eraseNote('${note.id}')">🧽</button>
        </div>
      `;
      noteItem.onclick = (e) => { if (!e.target.closest('.icons')) openNote(note.id); };
      noteGrid.appendChild(noteItem);
    });
    const addNoteBtn = document.createElement('button');
    addNoteBtn.className = 'action-button';
    addNoteBtn.innerHTML = '<i class="material-symbols-rounded">add</i>';
    addNoteBtn.onclick = () => createNote(currentUser.uid, currentCategory.id, 'New Note');
    noteGrid.appendChild(addNoteBtn);
    sidebar1El.appendChild(noteGrid);
  }
  const secSidebar = document.getElementById('secondarySidebar');
  secSidebar.innerHTML = `
    <div><h3>Tools</h3><button class="secondary-sidebar-item" onclick="showSettings()">Settings</button><button class="secondary-sidebar-item" onclick="massEditCategories()">Mass Edit Categories</button></div>
    <div><h3>Exports</h3><button class="secondary-sidebar-item" onclick="downloadNote()">Download Note</button><button class="secondary-sidebar-item" onclick="exportAll()">Export All</button></div>
  `;
}
function openCategory(catId) {
  currentCategory = categories.find(c => c.id === catId);
  if (currentCategory.notes.length > 0) {
    currentNote = currentCategory.notes[0];
    loadNoteContent(currentNote);
  }
  populateSidebars();
}
function openNote(noteId) {
  currentNote = currentCategory.notes.find(n => n.id === noteId);
  loadNoteContent(currentNote);
}
async function createNote(uid, catId, title) {
  const { db, collection, addDoc, updateDoc } = window.dbHelpers;
  const newNoteRef = await addDoc(collection(db, 'users', uid, 'categories', catId, 'notes'), { title, content: '', lastEdited: new Date().toISOString() });
  await updateDoc(newNoteRef, { id: newNoteRef.id });
  const newNote = { id: newNoteRef.id, title, content: '' };
  currentCategory.notes.push(newNote);
  currentNote = newNote;
  populateSidebars();
}
async function deleteNote(noteId) {
  if (!confirm('Delete note?')) return;
  const { db, doc, deleteDoc } = window.dbHelpers;
  await deleteDoc(doc(db, 'users', currentUser.uid, 'categories', currentCategory.id, 'notes', noteId));
  currentCategory.notes = currentCategory.notes.filter(n => n.id !== noteId);
  if (currentNote.id === noteId) {
    currentNote = currentCategory.notes[0] || null;
  }
  populateSidebars();
}
function eraseCategoryNotes(catId) {
  if (!confirm('Erase all notes in category?')) return;
  currentCategory.notes = [];
  showNotification('Erased');
  populateSidebars();
}
function editCategory(catId) {
  const newName = prompt('New category name');
  if (newName) {
    const cat = categories.find(c => c.id === catId);
    cat.name = newName;
    saveCategory(currentUser.uid, cat);
    populateSidebars();
  }
}
async function saveCategory(uid, cat) {
  const { db, doc, setDoc } = window.dbHelpers;
  await setDoc(doc(db, 'users', uid, 'categories', cat.id), cat);
}
async function saveCategoryOrder(uid) {
  const { db, doc, setDoc } = window.dbHelpers;
  for (const cat of categories) {
    await setDoc(doc(db, 'users', uid, 'categories', cat.id), { order: cat.order }, { merge: true });
  }
}
function massEditCategories() {
  showModal({
    title: 'Mass Edit Categories',
    body: '<div class="mass-edit-inputs" id="massInputs"></div><button onclick="addMassInput()">Add Field</button>',
    footer: '<button onclick="applyMassEdit()">Apply Old -> New</button>'
  });
  const container = document.getElementById('massInputs');
  for (let i = 0; i < 3; i++) addMassInput(container);
}
function addMassInput(container = document.getElementById('massInputs')) {
  const div = document.createElement('div');
  div.innerHTML = '<input placeholder="Old name" id="old' + Date.now() + '"><input placeholder="New name" id="new' + Date.now() + '">';
  container.appendChild(div);
}
function applyMassEdit() {
  const inputs = document.querySelectorAll('#massInputs input');
  for (let i = 0; i < inputs.length; i += 2) {
    const old = inputs[i].value;
    const newName = inputs[i+1].value;
    if (old && newName) {
      categories.forEach(cat => {
        if (cat.name === old) {
          cat.name = newName;
          saveCategory(currentUser.uid, cat);
        }
      });
    }
  }
  closeModal();
  populateSidebars();
  showNotification('Mass edit applied');
}
function loadNoteContent(note) {
  noteTextarea.value = note.content;
  updateBackdrop();
  pushUndo();
}
function updateNoteMetadata() {
  if (!currentNote || !currentUser) return;
  clearTimeout(inputTimer);
  inputTimer = setTimeout(async () => {
    currentNote.content = noteTextarea.value;
    currentNote.lastEdited = new Date().toISOString();
    await saveNote(currentNote, currentUser.uid, currentCategory.id);
    updateBackdrop();
    showNotification('Saved');
  }, 500);
}
function updateBackdrop() {
  let content = noteTextarea.value;
  content = marked.parse(content);
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = content;
  tempDiv.querySelectorAll('.highlight').forEach(span => {
    span.style.background = highlightBg;
    span.style.color = highlightText;
  });
  Prism.highlightElement(tempDiv);
  noteBackdrop.innerHTML = tempDiv.innerHTML;
  syncScroll();
  if (showLineNumbers) updateLineNumbers();
}
function updateLineNumbers() {
  const lines = noteTextarea.value.split('\n').length;
  const gutter = document.getElementById('lineNumbers');
  if (!gutter) {
    gutter = document.createElement('div');
    gutter.id = 'lineNumbers';
    gutter.className = 'line-numbers';
    noteContainer.insertBefore(gutter, noteTextarea.parentNode.firstChild);
  }
  gutter.innerHTML = Array.from({length: lines}, (_, i) => `<span>${i+1}</span>`).join('');
}
document.addEventListener('DOMContentLoaded', () => {
  noteTextarea = document.getElementById('noteTextarea');
  noteBackdrop = document.getElementById('noteBackdrop');
  sidebar1 = document.getElementById('sidebar1');
  secondarySidebar = document.getElementById('secondarySidebar');
  topbar = document.getElementById('topbar');
  homepage = document.getElementById('homepage');
  noteAppContainer = document.getElementById('noteAppContainer');
  diffCheckerContainer = document.getElementById('diffCheckerContainer');
  noteContainer = document.getElementById('noteContainer');
  noteTextarea.addEventListener('input', updateNoteMetadata);
  noteTextarea.addEventListener('input', pushUndo);
  noteTextarea.addEventListener('scroll', syncScroll);
  document.getElementById('boldBtn').onclick = () => wrapSelection('**');
  document.getElementById('italicBtn').onclick = () => wrapSelection('*');
  document.getElementById('underlineBtn').onclick = () => wrapSelection('__');
  document.getElementById('highlightBtn').onclick = () => {
    const {start, end} = getSelectionRange();
    if (start !== end) {
      wrapSelection('<span class="highlight">', '</span>');
      updateBackdrop();
    } else {
      showModal({title: 'Highlight Color', body: `<input type="color" id="hlColor" value="${highlightBg}"><input type="color" id="hlText" value="${highlightText}">`});
    }
  };
  document.getElementById('findReplaceBtn').onclick = showFindReplaceModal;
  document.getElementById('encryptBtn').onclick = () => {
    noteTextarea.value = encryptContent(noteTextarea.value, encryptAlgo);
    updateNoteMetadata();
  };
  document.getElementById('downloadBtn').onclick = downloadNote;
  document.getElementById('undoBtn').onclick = undo;
  document.getElementById('redoBtn').onclick = redo;
  document.getElementById('lineNumbersToggle').onclick = () => {
    showLineNumbers = !showLineNumbers;
    updateLineNumbers();
    saveSetting('lineNumbers', showLineNumbers, settingsLevel);
  };
  document.getElementById('settingsBtn').onclick = showSettings;
  document.getElementById('noteAppBtn').onclick = () => { if (currentUser) showNoteApp(); else showNotification('Login required'); };
  document.getElementById('diffCheckerBtn').onclick = () => { if (currentUser) showDiffChecker(); else showNotification('Login required'); };
  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case 'b': e.preventDefault(); wrapSelection('**'); break;
        case 'i': e.preventDefault(); wrapSelection('*'); break;
        case 'u': e.preventDefault(); wrapSelection('__'); break;
        case 'z': e.preventDefault(); undo(); break;
        case 'y': e.preventDefault(); redo(); break;
        case 'f': e.preventDefault(); showFindReplaceModal(); break;
      }
    }
  });
  initAuth();
  function showHomepage() {
    homepage.style.display = "flex";
    noteAppContainer.style.display = "none";
    diffCheckerContainer.style.display = "none";
    topbar.style.display = "none";
  }
  function showNoteApp() {
    homepage.style.display = "none";
    noteAppContainer.style.display = "flex";
    diffCheckerContainer.style.display = "none";
    topbar.style.display = "flex";
  }
  function showDiffChecker() {
    homepage.style.display = "none";
    noteAppContainer.style.display = "none";
    diffCheckerContainer.style.display = "flex";
    topbar.style.display = "flex";
  }
  window.addEventListener('popstate', () => {
    const path = window.location.pathname;
    if (path === '/' || path === '') showHomepage();
    else if (path.startsWith('/website/Note')) showNoteApp();
    else if (path.startsWith('/website/DiffChecker')) showDiffChecker();
  });
  showHomepage();
});
function wrapSelection(start, end = start) {
  const {start: selStart, end: selEnd} = getSelectionRange();
  if (selStart !== selEnd) {
    noteTextarea.value = noteTextarea.value.slice(0, selStart) + start + noteTextarea.value.slice(selStart, selEnd) + end + noteTextarea.value.slice(selEnd);
    updateNoteMetadata();
  }
}
function getSelectionRange() {
  return {start: noteTextarea.selectionStart, end: noteTextarea.selectionEnd};
}
function showFindReplaceModal() {
  showModal({
    title: 'Find & Replace',
    body: `
      <input id="findText" placeholder="Find (regex if checked)" style="width:100%;">
      <input type="checkbox" id="regexToggle"> Use Regex
      <input id="replaceText" placeholder="Replace with">
      <button onclick="performReplace()">Replace</button>
      <button onclick="performReplaceAll()">Replace All</button>
    `
  });
}
function performReplace() {
  const find = document.getElementById('findText').value;
  const replace = document.getElementById('replaceText').value;
  const useRegex = document.getElementById('regexToggle').checked;
  const regex = useRegex ? new RegExp(find, 'g') : new RegExp(escapeRegExp(find), 'g');
  noteTextarea.value = noteTextarea.value.replace(regex, replace);
  updateNoteMetadata();
  closeModal();
}
function performReplaceAll() {
  performReplace();
}
function pushUndo() {
  undoStack.push(noteTextarea.value);
  if (undoStack.length > 50) undoStack.shift();
  redoStack = [];
}
function undo() {
  if (undoStack.length > 1) {
    redoStack.push(noteTextarea.value);
    noteTextarea.value = undoStack.pop();
    updateNoteMetadata();
  }
}
function redo() {
  if (redoStack.length) {
    undoStack.push(noteTextarea.value);
    noteTextarea.value = redoStack.pop();
    updateNoteMetadata();
  }
}
function showSettings() {
  document.getElementById('settingsModal').classList.remove('hidden');
  document.getElementById('themeToggle').checked = isDarkTheme;
  document.getElementById('fontSizeSlider').value = fontSize;
  document.getElementById('lineNumbersToggle').checked = showLineNumbers;
  document.getElementById('highlightBg').value = highlightBg;
  document.getElementById('highlightText').value = highlightText;
  document.getElementById('encryptAlgo').value = encryptAlgo;
  document.getElementById('downloadFormat').value = downloadFormat;
  document.getElementById('noteBg').value = getComputedStyle(document.documentElement).getPropertyValue('--primary').trim() || '#000';
  document.getElementById('noteText').value = getComputedStyle(document.documentElement).getPropertyValue('--color').trim() || '#cacaca';
}
function saveSettings() {
  isDarkTheme = document.getElementById('themeToggle').checked;
  fontSize = parseInt(document.getElementById('fontSizeSlider').value);
  showLineNumbers = document.getElementById('lineNumbersToggle').checked;
  highlightBg = document.getElementById('highlightBg').value;
  highlightText = document.getElementById('highlightText').value;
  encryptAlgo = document.getElementById('encryptAlgo').value;
  downloadFormat = document.getElementById('downloadFormat').value;
  const noteBg = document.getElementById('noteBg').value;
  const noteText = document.getElementById('noteText').value;
  document.documentElement.style.setProperty('--primary', noteBg);
  document.documentElement.style.setProperty('--color', noteText);
  const themeLevel = document.getElementById('themeApply').value;
  const fontLevel = document.getElementById('fontApply').value;
  const lineLevel = document.getElementById('lineApply').value;
  const highlightLevel = document.getElementById('highlightApply').value;
  const encryptLevel = document.getElementById('encryptApply').value;
  const downloadLevel = document.getElementById('downloadApply').value;
  const colorLevel = document.getElementById('colorApply').value;
  saveSetting('theme', isDarkTheme, themeLevel);
  saveSetting('fontSize', fontSize, fontLevel);
  saveSetting('lineNumbers', showLineNumbers, lineLevel);
  saveSetting('highlightBg', highlightBg, highlightLevel);
  saveSetting('highlightText', highlightText, highlightLevel);
  saveSetting('encryptAlgo', encryptAlgo, encryptLevel);
  saveSetting('downloadFormat', downloadFormat, downloadLevel);
  saveSetting('noteBg', noteBg, colorLevel);
  saveSetting('noteText', noteText, colorLevel);
  applyTheme();
  applyFontSize();
  updateHighlightColors();
  updateLineNumbers();
  closeModal();
  showNotification('Settings saved');
}
async function saveSetting(key, value, level) {
  if (!currentUser) return;
  const { db, doc, updateDoc } = window.dbHelpers;
  const path = level === 'app' ? 'global' : level === 'category' ? currentCategory.id : currentNote.id;
  const settingsRef = doc(db, 'users', currentUser.uid, 'settings', path);
  await updateDoc(settingsRef, { [key]: value }, { merge: true });
}
function resetSetting(key, level) {
  saveSetting(key, null, level);
  showNotification(`${key} reset for ${level}`);
  loadUserData(currentUser.uid);
}
function applyTheme() {
  document.body.classList.toggle('light-theme', !isDarkTheme);
}
function applyFontSize() {
  noteTextarea.style.fontSize = `${fontSize}px`;
  noteBackdrop.style.fontSize = `${fontSize}px`;
}
function updateHighlightColors() {
  document.documentElement.style.setProperty('--highlight-bg', highlightBg);
  document.documentElement.style.setProperty('--highlight-text', highlightText);
}
function downloadNote() {
  let content = noteTextarea.value;
  if (downloadFormat === 'markdown') {
    content = marked.parse(content);
  }
  const blob = new Blob([content], {type: 'text/plain'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${currentNote ? currentNote.title : 'note'}.${downloadFormat}`;
  a.click();
  URL.revokeObjectURL(url);
}
function syncScroll() {
  noteBackdrop.scrollTop = noteTextarea.scrollTop;
  noteBackdrop.scrollLeft = noteTextarea.scrollLeft;
}
function showNotification(message) {
  const notification = document.getElementById('notification');
  notification.textContent = message;
  notification.classList.add("show");
  setTimeout(() => notification.classList.remove("show"), 3000);
}
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
window.toggleFullscreen = function () {
  const e = document.documentElement;
  !document.fullscreenElement &&
  !document.webkitFullscreenElement &&
  !document.msFullscreenElement
    ? e.requestFullscreen
      ? e.requestFullscreen()
      : e.webkitRequestFullscreen
      ? e.webkitRequestFullscreen()
      : e.msRequestFullscreen && e.msRequestFullscreen()
    : document.exitFullscreen
    ? document.exitFullscreen()
    : document.webkitExitFullscreen
    ? document.webkitExitFullscreen()
    : document.msExitFullscreen && document.msExitFullscreen();
};
function editNote(noteId) {
  const newTitle = prompt('New note title');
  if (newTitle) {
    const note = currentCategory.notes.find(n => n.id === noteId);
    note.title = newTitle;
    saveNote(note, currentUser.uid, currentCategory.id);
    populateSidebars();
  }
}
function eraseNote(noteId) {
  noteTextarea.value = '';
  updateNoteMetadata();
}
function exportAll() {
  const allContent = categories.map(cat => `${cat.name}:\n${cat.notes.map(n => n.content).join('\n---\n')}`).join('\n\n');
  const blob = new Blob([allContent], {type: 'text/plain'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'all-notes.txt';
  a.click();
  URL.revokeObjectURL(url);
}
