  function diffHandleFile(input, type) {
    const file = input.files[0];
    if (!file) return;
    const r = new FileReader();
    r.onload = (e) => {
      if (type === 'raw') diffElements.raw.value = e.target.result;
      else diffElements.morph.value = e.target.result;
      diffusion();
    };
    r.readAsText(file);
    input.value = ''; 
  }

  function diffSwapTexts() {
    const temp = diffElements.raw.value;
    diffElements.raw.value = diffElements.morph.value;
    diffElements.morph.value = temp;
    diffusion();
  }

  function diffClearText(type) {
    if (type === 'raw') diffElements.raw.value = '';
    else diffElements.morph.value = '';
    diffusion();
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
  } catch (err) {
    console.error('Paste failed:', err);
  }
}
