window.handleRename = function () { 
  const e = preserveSelection(async function () { 
    if (!currentNote) return void showNotification("No note selected"); 
    const t = currentNote.title || "", 
          n = currentNote.extension || "", 
          o = await showModal({ 
            header: '<div class="modal-title">Rename Note</div>', 
            body: `<div style="display:flex;gap:10px;align-items:center;"><div style="flex:1;"><label class="modal-label">Name</label><input type="text" id="newTitle" placeholder="Enter Name" value="${t.replace( /"/g, "&quot;" )}"></div></div><div style="display:flex;gap:10px;align-items:center;"><div style="flex:1;"><label class="modal-label">Extension</label><input type="text" id="newExtension" placeholder="Enter Extension" value="${n.replace( /"/g, "&quot;" )}"></div></div>`, 
            footer: '<button onclick="closeModal()">Cancel</button><button onclick="handleRenameSubmit()" class="modal-btn">OK</button>' 
          }); 
    if (!o || "OK" !== o.action) return; 
    let a = String(o.newTitle || "").trim(), 
        i = String(o.newExtension || "").trim(); 
    if (!a && !i) return; 
    (a = a || t), 
    (i = i || n), 
    (currentNote.title = a), 
    (currentNote.extension = i.replace(/^\./, "").toLowerCase()), 
    (currentNote.lastEdited = new Date().toISOString()); 
    const l = notes.findIndex((e) => e.id === currentNote.id); 
    -1 !== l && ((notes[l].title = a), (notes[l].extension = currentNote.extension), (notes[l].lastEdited = currentNote.lastEdited)), 
    updateNoteMetadata(), 
    populateNoteList(), // Immediate list refresh
    updateDocumentInfo(), // Immediate stats
    showNotification("Note updated!"); 
    currentHighlightLanguage = 'none';
    immediatePlainRender(); // Instant plain
    noteBackdrop.style.color = 'var(--color)'; // Force visibility
    noteBackdrop.offsetHeight; // Reflow
    scheduleUpdate(true); // Immediate highlight
  }); 
  return "function" == typeof e ? e() : e; 
};
window.handleRenameSubmit = function () { 
  closeModal({ 
    action: "OK", 
    newTitle: modalScope.newTitle ? modalScope.newTitle.value : "", 
    newExtension: modalScope.newExtension ? modalScope.newExtension.value : "" 
  });
  setTimeout(() => {
    currentHighlightLanguage = 'none';
    immediatePlainRender();
    scheduleUpdate(true);
  }, 50);
};
