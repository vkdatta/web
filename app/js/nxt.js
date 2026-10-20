/*<![CDATA[*/
(function(){
"use strict";

const BODY_INDENT = 0;     // no per-level indent — every heading sits flush-left at all
                           // levels; depth is shown by the level badge instead

/* Delluna icons */
const SVG_EYE='<delluna-icon name="visibility"></delluna-icon>';
const SVG_EYE_SLASH='<delluna-icon name="visibility_off"></delluna-icon>';

function injectStyles(){
  if(document.getElementById("ns-styles")) return;
  const style = document.createElement("style");
  style.id = "ns-styles";
  style.textContent = `
    @font-face{ font-family:'dexy'; src:url('https://vkfonts.storage.googleapis.com/dexy.woff2') format('woff2'); font-weight:normal; font-style:normal; font-display:swap; }
    @font-face{ font-family:'classy'; src:url('https://vkfonts.storage.googleapis.com/classy.woff2') format('woff2'); font-weight:normal; font-style:normal; font-display:swap; }

    .nested-section{
      position:relative;
      z-index:0;
      display:block;
      padding:0;
      margin:0;
      border-radius:10px;
      box-sizing:border-box;
      width:100%;
      max-width:100%;
      min-width:0;
      color:#cacaca;
      text-align:left;
      overflow-x:hidden;
      overflow-wrap:break-word;
      word-wrap:break-word;
      transition:opacity .3s ease;
    }
    .nested-section *{ max-width:100%; box-sizing:border-box; min-width:0; }

    /* non-active session dims to 50% (top-level only, set from JS) */
    .nested-section.ns-dim{ opacity:0.5; }
    .nested-section.ns-active{ opacity:1; }

    /* pill heading: badge on the left, title fills the middle, toggle on the right */
    .ns-heading{
      margin: 0 0 10px 0;
      padding:8px 12px;
      min-height:33px;            /* 28px controls + breathing room */
      display:flex;
      align-items:center;
      gap:8px;
      color:#fff;
      font-family:'classy',system-ui,sans-serif;
      font-size:15px;
      font-weight:normal;
      letter-spacing:3px;
      background:var(--dx-surface-raised,#111);
      border:1px solid var(--dx-border,rgba(255,255,255,0.1));
      border-radius:10px;
      cursor:pointer;
      user-select:none;
      -webkit-user-select:none;
      -webkit-tap-highlight-color:transparent;
    }
    .ns-heading:focus-visible{ outline:2px solid rgba(255,255,255,0.25); outline-offset:3px; }

    .ns-title{
      flex:1 1 auto;
      min-width:0;
      text-align:left;
      white-space:normal;
      overflow-wrap:break-word;
      word-break:break-word;
      hyphens:auto;
    }
    /* keep an empty heading (<h1></h1>) the same height as a filled one */
    .ns-title:empty::before{ content:"\\00a0"; }

    /* level-number bubble, moved out of the old tree and into the heading */
    .ns-badge{
      flex:0 0 auto;
      display:inline-flex; align-items:center; justify-content:center;
      width:28px; height:28px;
      color:#c9c9c9;
      background:rgba(255,255,255,0.05);
      border:1px solid var(--dx-border,rgba(255,255,255,0.1));
      border-radius:10px;
      font-family:'classy',system-ui,sans-serif;
      font-size:12px; line-height:1; letter-spacing:0;
      pointer-events:none; user-select:none;
    }

    .ns-body{
      display:block;
      padding-left:${BODY_INDENT}px;
      font-family:'classy',system-ui,sans-serif;
    }
    .nested-section.ns-collapsed > .ns-body{ display:none; }

    .ns-toggle{
      display:inline-flex; align-items:center; justify-content:center;
      width:28px; height:28px;
      padding:0; margin:0;
      color:#c9c9c9;
      background:rgba(255,255,255,0.05);
      border:1px solid var(--dx-border,rgba(255,255,255,0.1));
      border-radius:10px;
      cursor:pointer; line-height:0; flex:0 0 auto;
      transition:background .15s ease, color .15s ease, border-color .15s ease;
      -webkit-tap-highlight-color:transparent;
      touch-action:manipulation;
    }
    .ns-toggle:hover{ background:rgba(255,255,255,0.12); color:#fff; border-color:rgba(255,255,255,0.25); }
    .ns-toggle delluna-icon{ width:16px !important; height:16px !important; min-width:16px !important; min-height:16px !important; flex:0 0 16px !important; pointer-events:none; }
  `;
  document.head.appendChild(style);
}

/* ---------- active session detection ---------- */
let focusRaf = null;
function scheduleFocus(){
  if(focusRaf) return;
  focusRaf = requestAnimationFrame(function(){ focusRaf = null; updateFocus(); });
}
function updateFocus(){
  const post = document.querySelector(".post-body");
  if(!post) return;
  const tops = Array.from(post.children).filter(c => c.nodeType === 1 && c.classList.contains("nested-section"));
  if(!tops.length) return;

  if(tops.length === 1){
    tops[0].classList.add("ns-active");
    tops[0].classList.remove("ns-dim");
    return;
  }

  const vh = window.innerHeight || document.documentElement.clientHeight;

  // A section stays ACTIVE unless more than 70% of the space it takes up is
  // scrolled off-screen (i.e. dim only when < 30% of its own height is visible).
  // This lets several sections be active at once when they share the screen,
  // instead of anointing a single "most visible" winner.
  const next = new Set();
  let best = 0, bestVisible = -1;
  tops.forEach(function(sec, i){
    const r = sec.getBoundingClientRect();
    const visible = Math.max(0, Math.min(r.bottom, vh) - Math.max(r.top, 0));
    const height  = r.height || 1;
    const selfFrac = visible / height;          // how much of the section is on screen
    const viewFrac = vh > 0 ? visible / vh : 0;  // how much of the screen it fills

    // active if >=30% of itself is visible, OR it dominates the viewport
    // (guards a section taller than the screen from wrongly dimming while it fills it)
    if(selfFrac >= 0.30 || viewFrac >= 0.60) next.add(i);

    if(visible > bestVisible){ bestVisible = visible; best = i; }
  });

  // never dim everything: if nothing cleared the bar, keep the most-visible one lit
  if(next.size === 0) next.add(best);

  tops.forEach(function(sec, i){
    if(next.has(i)){ sec.classList.add("ns-active"); sec.classList.remove("ns-dim"); }
    else { sec.classList.remove("ns-active"); sec.classList.add("ns-dim"); }
  });
}

/* ---------- collapse toggle ---------- */
function makeToggle(){
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "ns-toggle";
  btn.setAttribute("aria-label", "Hide section");
  btn.setAttribute("aria-expanded", "true");
  btn.innerHTML = SVG_EYE;

  btn.addEventListener("keydown", function(e){
    if(e.key === "Enter" || e.key === " "){ e.preventDefault(); btn.click(); }
  });
  btn.addEventListener("click", function(e){
    e.preventDefault();
    e.stopPropagation();
    const section = btn.closest(".nested-section");
    if(!section) return;
    const collapsed = section.classList.toggle("ns-collapsed");
    btn.innerHTML = collapsed ? SVG_EYE_SLASH : SVG_EYE;
    btn.setAttribute("aria-expanded", collapsed ? "false" : "true");
    btn.setAttribute("aria-label", collapsed ? "Show section" : "Hide section");
    scheduleFocus();
  });
  return btn;
}

/* ---------- build nested structure ---------- */
function applyNestedSections(){
  injectStyles();

  const post = document.querySelector(".post-body");
  if(!post || post.getAttribute("data-applied")) return;

  const flatNodes = [];
  // We only unwrap a <div>/<span> when we must dig into it to reach a heading.
  // Any wrapper that does NOT contain a heading is kept whole, so everything it
  // carries — inline styles, classes, align, backgrounds, borders, etc. — survives
  // instead of being stripped by flattening. Non-div/span elements are always kept.
  function containsHeading(elm){
    return !!(elm.querySelector && elm.querySelector("h1,h2,h3,h4,h5,h6"));
  }
  function flatten(node){
    Array.from(node.childNodes).forEach(function(child){
      const isHeading = child.nodeType === 1 && /^H[1-6]$/.test(child.tagName);
      const isImport = child.nodeType === 1 && child.hasAttribute && child.hasAttribute("data-import");
      const isWrapper =
        child.nodeType === 1 &&
        (child.tagName === "DIV" || child.tagName === "SPAN") &&
        !isHeading && !isImport &&
        !child.className.includes("nested-section") &&
        !child.className.includes("separator");
      if(isWrapper && containsHeading(child)){ flatten(child); }
      else { flatNodes.push(child); }
    });
  }
  flatten(post);
  if(!flatNodes.length) return;

  const fragment = document.createDocumentFragment();
  let stack = [{element: fragment, level: 0}];

  flatNodes.forEach(function(node){
    if(node.nodeType === 3 && !node.textContent.trim() && stack.length === 1) return;
    if(node.nodeType === 1 && node.tagName === "ISOLATE"){ fragment.appendChild(node); return; }

    let level = -1;
    if(node.nodeType === 1 && /^H[1-6]$/.test(node.tagName)) level = parseInt(node.tagName.substring(1));

    if(level > 0){
      while(stack.length > 1 && stack[stack.length - 1].level >= level) stack.pop();
      const wrapper = document.createElement("div");
      wrapper.className = "nested-section ns-level-" + level;
      wrapper.setAttribute("role", "region");
      node.classList.add("ns-heading");
      ["fontSize","margin","color","fontFamily","whiteSpace","background","border","borderRadius","padding","letterSpacing","textAlign"]
        .forEach(function(p){ node.style.removeProperty(p); });
      const body = document.createElement("div");
      body.className = "ns-body";
      stack[stack.length - 1].element.appendChild(wrapper);
      wrapper.appendChild(node);
      wrapper.appendChild(body);
      stack.push({element: body, level: level});
    } else {
      stack[stack.length - 1].element.appendChild(node);
    }
  });

  fragment.querySelectorAll(".nested-section").forEach(function(sec){
    const body = sec.querySelector(":scope > .ns-body");
    const heading = sec.querySelector(":scope > .ns-heading");
    if(!body || !heading) return;

    // wrap the heading's own text so the badge (left) and toggle (right) can flank it
    const title = document.createElement("span");
    title.className = "ns-title";
    while(heading.firstChild) title.appendChild(heading.firstChild);

    // level-number bubble on the LEFT (the old tree node, now inside the heading)
    const lm = /ns-level-(\d)/.exec(sec.className);
    if(lm){
      const badge = document.createElement("span");
      badge.className = "ns-badge";
      badge.setAttribute("aria-hidden", "true");
      badge.textContent = lm[1];
      heading.appendChild(badge);
    }

    heading.appendChild(title);

    const hasContent = Array.from(body.childNodes).some(function(n){
      if(n.nodeType === 3) return n.textContent.trim().length > 0;
      if(n.nodeType === 1){ const tg = n.tagName.toLowerCase(); return tg !== "br" && tg !== "hr"; }
      return false;
    }) || body.querySelector(":scope > .nested-section");

    if(hasContent){
      const btn = makeToggle();
      heading.appendChild(btn);   // toggle on the RIGHT
      // default state: collapsed at every level; user opens sections as needed
      sec.classList.add("ns-collapsed");
      btn.innerHTML = SVG_EYE_SLASH;
      btn.setAttribute("aria-expanded", "false");
      btn.setAttribute("aria-label", "Show section");
    }

    heading.setAttribute("tabindex", "0");
    heading.setAttribute("role", "button");
    heading.addEventListener("click", function(e){
      if(e.target.closest(".ns-toggle")) return;
      const t = heading.querySelector(".ns-toggle");
      if(t) t.click();
    });
    heading.addEventListener("keydown", function(e){
      if(e.key === "Enter" || e.key === " "){
        e.preventDefault();
        const t = heading.querySelector(".ns-toggle");
        if(t) t.click();
      }
    });
  });

  post.innerHTML = "";
  post.appendChild(fragment);
  post.setAttribute("data-applied", "true");

  scheduleFocus();
}

/* ---------- boot ---------- */
let applyTimeout = null;
function debouncedApply(){ clearTimeout(applyTimeout); applyTimeout = setTimeout(applyNestedSections, 100); }

if(document.readyState === "loading"){
  document.addEventListener("DOMContentLoaded", applyNestedSections);
} else {
  applyNestedSections();
}

window.addEventListener("load", function(){
  setTimeout(function(){ applyNestedSections(); scheduleFocus(); }, 220);
});

let sizeRaf = null;
window.addEventListener("resize", function(){
  if(sizeRaf) return;
  sizeRaf = requestAnimationFrame(function(){ sizeRaf = null; scheduleFocus(); });
});
window.addEventListener("scroll", scheduleFocus, {passive:true});

const observer = new MutationObserver(function(){
  const post = document.querySelector(".post-body");
  if(post && !post.getAttribute("data-applied")) debouncedApply();
});
observer.observe(document.body, {childList:true, subtree:true});

})();
/*]]>*/
