//<![CDATA[
document.addEventListener('DOMContentLoaded', function() {
  const isMobile = window.location.search.includes('m=1');
  const allButtons = document.querySelectorAll('.label-button');
  allButtons.forEach(btn => {
    if (btn.tagName.toLowerCase() !== 'a') return;
    let href = btn.getAttribute('href');
    if (!href) return;
    if (href.includes('?m=1search')) {
      href = href.replace('?m=1search', '/search');
    } else if (href.startsWith('?m=1')) {
      href = href.substring(4);
      if (!href.startsWith('/')) href = '/' + href;
    }
    if (isMobile && !href.includes('m=1')) {
      href += (href.includes('?') ? '&' : '?') + 'm=1';
    }
    btn.setAttribute('href', href);
  });
  const grid = document.querySelector(".buttons-grid");
  if (grid) {
    const gridButtons = Array.from(grid.querySelectorAll("a.label-button"));
    const gap = 15;
    function arrangeButtons() {
      const containerWidth = grid.parentElement.offsetWidth;
      let widest = 0;
      gridButtons.forEach(btn => {
        widest = Math.max(widest, btn.offsetWidth);
      });
      let maxFit = Math.floor((containerWidth + gap) / (widest + gap));
      if (window.innerWidth >= 900) {
        maxFit = Math.min(maxFit, 6);
      } else if (window.innerWidth >= 600) {
        maxFit = Math.min(maxFit, 4);
      } else {
        maxFit = Math.min(maxFit, 3);
      }
      grid.innerHTML = "";
      let index = 0;
      while (index < gridButtons.length) {
        const row = document.createElement("div");
        row.classList.add("row");
        for (let i = 0; i < maxFit && index < gridButtons.length; i++) {
          row.appendChild(gridButtons[index]);
          index++;
        }
        grid.appendChild(row);
      }
    }
    function debounce(func, wait) {
      let timeout;
      return function() {
        const context = this, args = arguments;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), wait);
      };
    }
    arrangeButtons();
    window.addEventListener("resize", debounce(arrangeButtons, 250));
  }
  allButtons.forEach((button, index) => {
    setTimeout(() => {
      button.classList.add('visible');
    }, 200 + (index * 50));
  });
});
//]]>
