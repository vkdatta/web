//<![CDATA[
document.addEventListener('DOMContentLoaded', function() {
  const isMobile = window.location.search.includes('m=1');
  const menuItems = document.querySelectorAll('#products [onclick], #products [expr\\:onclick]');
  menuItems.forEach(item => {
    let clickAttr = item.getAttribute('onclick');
    if (!clickAttr) return;
    let urlMatch = clickAttr.match(/(['"])(.*?)\1/);
    if (!urlMatch || !urlMatch[2]) return;
    let href = urlMatch[2];
    if (href.includes('?m=1search')) {
      href = href.replace('?m=1search', '/search');
    }
    else if (href.startsWith('?m=1')) {
      href = href.substring(4);
      if (!href.startsWith('/')) href = '/' + href;
    }
    if (isMobile && !href.includes('m=1')) {
      href += (href.includes('?') ? '&' : '?') + 'm=1';
    }
    item.setAttribute('onclick', `location.href='${href}'`);
  });
  const allElements = document.querySelectorAll('#products .non-collapse, #products .collapse');
  allElements.forEach((el, index) => {
    setTimeout(() => {
      el.classList.add('visible');
    }, 150 + (index * 40));
  });
});
//]]>
