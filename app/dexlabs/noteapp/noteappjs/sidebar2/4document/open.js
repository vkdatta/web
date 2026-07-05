export function handleOpenFile() {
  const e = getNextEmptyNote();
  if (!e) {
    showNotification("No empty notes available! Clear a note to continue.");
    return;
  }
  const t = document.createElement("input");
  t.type = "file";
  t.accept =
    ".txt,.md,.csv,.json,.xml,.yml,.yaml,.js,.ts,.jsx,.tsx,.html,.css,.py,.java,.c,.cpp,.h,.go,.rb,.php,.rs,.swift,.sh,.bat,Dockerfile,Makefile,.env,.ini,.toml,.conf,.log,.dockerignore";
  t.onchange = function (o) {
    const n = o.target.files[0];
    if (n) {
      const r = new FileReader();
      (r.onload = function (o) {
        let x = n.name.split("."),
          a = x.pop().toLowerCase(),
          base = x.join(".");
        e.title = base;
        e.content = o.target.result;
        e.extension = a;
        e.lastEdited = new Date().toISOString();
        visibleNotes = 1;
        updateNoteVisibility();
        openNote(e.id);
        showNotification("File opened!");
      }),
        r.readAsText(n);
    }
  };
  t.click();
}
