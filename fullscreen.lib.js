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

    // Desktop: double-click
    document.addEventListener('dblclick', e => {
      e.preventDefault();
      toggleFullscreen();
    });

    // Mobile: double-tap (pointerdown with detail === 2)
    document.addEventListener('pointerdown', e => {
      if (e.detail === 2) {
        e.preventDefault(); // prevent zoom
        toggleFullscreen();
      }
    });

    // Prevent mobile double-tap zoom
    document.documentElement.style.touchAction = 'manipulation';
  });
