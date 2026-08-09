  function diffCommit(type) { if (typeof diffCommitPane === 'function') diffCommitPane(type); }

  function diffHandleFile(input, type) {
    const file = input.files[0];
    if (!file) return;
    const r = new FileReader();
    r.onload = (e) => {
      if (type === 'raw') diffElements.raw.value = e.target.result;
      else diffElements.morph.value = e.target.result;
      diffusion();
      diffCommit(type);
    };
    r.readAsText(file);
    input.value = '';
  }

  function diffSwapTexts() {
    const temp = diffElements.raw.value;
    diffElements.raw.value = diffElements.morph.value;
    diffElements.morph.value = temp;
    diffusion();
    if (typeof diffSwapBindings === 'function') diffSwapBindings();
  }

  function diffClearText(type) {
    if (type === 'raw') diffElements.raw.value = '';
    else diffElements.morph.value = '';
    diffusion();
    diffCommit(type);
  }

async function diffCopyText(type) {
  try {
    const text = type === 'raw'
      ? diffElements.raw.value
      : diffElements.morph.value;

    if (!text) return;

    await navigator.clipboard.writeText(text);
  } catch (err) {
    console.error('Copy failed:', err);
  }
}

async function diffPasteText(type) {
  try {
    const text = await navigator.clipboard.readText();
    if (!text) return;

    if (type === 'raw') {
      diffElements.raw.value = text;
    } else {
      diffElements.morph.value = text;
    }

    diffusion();
    diffCommit(type);
  } catch (err) {
    console.error('Paste failed:', err);
  }
}
