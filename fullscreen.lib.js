document.addEventListener('DOMContentLoaded', () => {
  // Toggle fullscreen
  function toggleFullscreen() {
    const el = document.documentElement;
    if (
      !document.fullscreenElement &&
      !document.webkitFullscreenElement &&
      !document.msFullscreenElement
    ) {
      if (el.requestFullscreen) el.requestFullscreen();
      else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
      else if (el.msRequestFullscreen) el.msRequestFullscreen();
    } else {
      if (document.exitFullscreen) document.exitFullscreen();
      else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
      else if (document.msExitFullscreen) document.msExitFullscreen();
    }
  }

  // Helper: check if event target is an interactive/editable element
  function isInteractiveElement(target) {
    if (!target) return false;

    const tag = target.tagName.toLowerCase();
    const interactiveTags = [
      'input',
      'textarea',
      'select',
      'button',
      'label',
      'a'
    ];

    // If element is editable, or matches list above, skip fullscreen
    return (
      interactiveTags.includes(tag) ||
      target.isContentEditable ||
      target.type === 'checkbox' ||
      target.type === 'radio'
    );
  }

  // Desktop: double-click
  document.addEventListener('dblclick', e => {
    if (isInteractiveElement(e.target)) return; // skip fullscreen
    e.preventDefault();
    toggleFullscreen();
  });

  // Mobile: double-tap (pointerdown with detail === 2)
  document.addEventListener('pointerdown', e => {
    if (e.detail === 2) {
      if (isInteractiveElement(e.target)) return; // skip fullscreen
      e.preventDefault(); // prevent zoom
      toggleFullscreen();
    }
  });

  // Prevent mobile double-tap zoom globally (still allows input focus/typing)
  document.documentElement.style.touchAction = 'manipulation';
});
