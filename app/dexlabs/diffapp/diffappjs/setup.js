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
