/*<![CDATA[*/
/*
  nxt.js — nested heading wrapper

  Every <h1>…<h6> in .post-body becomes a collapsible "wrapper" (pill) and the
  content that follows it, up to the next heading of the same or higher level,
  becomes its body.

  Level cues (so you can tell H2 from H3 at a glance):
    1. the wrapper pill is indented by level (only the pill — content is not)
    2. every level has its own border / tint colour
    3. the level number sits on the RIGHT of the pill and doubles as the
       toggle: no strike = open, struck through = closed

  Default state: H1 sections open, everything else closed.
  (If a post has no H1 at all, its shallowest heading level opens instead, so
  the page is never a wall of closed pills.)

  Public API (used by contents.js):  window.DexNest
  Events on document:                dexnest:ready, dexnest:change
*/
(function(){
"use strict";

/* ---------- tweakables ---------- */
const INDENT_STEP = "clamp(6px, 2.4vw, 14px)";   // extra left indent per heading level (pill only)
const BADGE_PREFIX = "";                          // set to "H" to show "H2" instead of "2"
const LEVEL_RGB = {                               // per-level colour, "r,g,b"
  1: "139,120,255",   // violet  (site --purple)
  2: "77,163,255",    // blue
  3: "46,196,182",    // teal
  4: "139,212,80",    // green
  5: "242,177,52",    // amber
  6: "239,111,108"    // coral
};

const reducedMotion = function(){
  return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
};

function injectStyles(){
  if(document.getElementById("ns-styles")) return;

  let levelCss = "";
  for(let n = 1; n <= 6; n++){
    levelCss +=
      ".nested-section.ns-level-" + n + "{--c:" + LEVEL_RGB[n] + ";}\n" +
      ".nested-section.ns-level-" + n + " > .ns-heading{margin-left:calc(" + (n - 1) + " * var(--ns-indent));}\n";
  }

  const style = document.createElement("style");
  style.id = "ns-styles";
  style.textContent = `
    @font-face{ font-family:'dexy'; src:url('https://vkfonts.storage.googleapis.com/dexy.woff2') format('woff2'); font-weight:normal; font-style:normal; font-display:swap; }
    @font-face{ font-family:'classy'; src:url('https://vkfonts.storage.googleapis.com/classy.woff2') format('woff2'); font-weight:normal; font-style:normal; font-display:swap; }

    .nested-section{
      --ns-indent:${INDENT_STEP};
      --c:139,120,255;
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
    ${levelCss}

    /* non-active top-level session dims to 50% (set from JS) */
    .nested-section.ns-dim{ opacity:0.5; }
    .nested-section.ns-active{ opacity:1; }

    /* ---- the wrapper pill: title fills the left, level number sits on the right ---- */
    .ns-heading{
      margin-top:0; margin-right:0; margin-bottom:10px;
      padding:8px 8px 8px 14px;
      min-height:46px;
      display:flex;
      align-items:center;
      gap:10px;
      color:#fff;
      font-family:'classy',system-ui,sans-serif;
      font-size:15px;
      line-height:1.7;
      font-weight:normal;
      letter-spacing:3px;
      background:
        linear-gradient(rgba(var(--c),.07), rgba(var(--c),.07)),
        var(--dx-surface-raised,#111);
      border:1px solid rgba(var(--c),.5);
      border-radius:10px;
      user-select:none;
      -webkit-user-select:none;
      -webkit-tap-highlight-color:transparent;
      scroll-margin-top:12px;
      transition:background .15s ease, border-color .15s ease;
    }
    .nested-section:not(.ns-leaf) > .ns-heading{ cursor:pointer; }
    .nested-section:not(.ns-leaf) > .ns-heading:hover{
      background:
        linear-gradient(rgba(var(--c),.13), rgba(var(--c),.13)),
        var(--dx-surface-raised,#111);
      border-color:rgba(var(--c),.75);
    }
    .ns-heading:focus-visible{ outline:2px solid rgba(var(--c),.6); outline-offset:3px; }

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

    /* ---- level number = the toggle. open: plain.  closed: struck through ---- */
    .ns-num{
      position:relative;
      flex:0 0 auto;
      display:inline-flex; align-items:center; justify-content:center;
      width:30px; height:30px;
      color:rgb(var(--c));
      background:rgba(var(--c),.12);
      border:1px solid rgba(var(--c),.45);
      border-radius:10px;
      font-family:'classy',system-ui,sans-serif;
      font-size:13px; line-height:1; letter-spacing:0; word-spacing:0;
      pointer-events:none; user-select:none;
      transition:background .15s ease, opacity .2s ease;
    }
    .ns-num::after{
      content:"";
      position:absolute; left:5px; right:5px; top:50%;
      height:2px; margin-top:-1px;
      border-radius:2px;
      background:currentColor;
      transform:scaleX(0);
      transform-origin:left center;
      transition:transform .22s cubic-bezier(.2,.9,.25,1);
    }
    .nested-section.ns-collapsed > .ns-heading > .ns-num{ opacity:.8; }
    .nested-section.ns-collapsed > .ns-heading > .ns-num::after{ transform:scaleX(1); }
    .nested-section:not(.ns-leaf) > .ns-heading:hover > .ns-num{ background:rgba(var(--c),.24); }

    /* ---- body: animated open/close (grid 1fr <-> 0fr) ---- */
    .ns-body{
      display:grid;
      grid-template-rows:1fr;
      font-family:'classy',system-ui,sans-serif;
      transition:grid-template-rows .3s cubic-bezier(.2,.9,.25,1), visibility 0s;
    }
    .ns-inner{ min-height:0; overflow:hidden; }
    .nested-section.ns-collapsed > .ns-body{
      grid-template-rows:0fr;
      visibility:hidden;                         /* closed content can't be tabbed into */
      transition:grid-template-rows .3s cubic-bezier(.2,.9,.25,1), visibility 0s linear .3s;
    }
    @media (prefers-reduced-motion:reduce){
      .ns-body, .nested-section.ns-collapsed > .ns-body, .ns-num::after{ transition:none !important; }
    }
  `;
  document.head.appendChild(style);
}

/* ---------- registry + public API ---------- */
let registry = [];          // every section wrapper, in document order
let defaultLevel = 1;       // "open up to this level" in the default state
let built = false;

const levelOf   = function(sec){ const m = /ns-level-(\d)/.exec(sec.className); return m ? parseInt(m[1], 10) : 1; };
const parentOf  = function(sec){ return sec.parentElement ? sec.parentElement.closest(".nested-section") : null; };
const headingOf = function(sec){ return sec.querySelector(":scope > .ns-heading"); };
const titleOf   = function(sec){ const t = sec.querySelector(":scope > .ns-heading > .ns-title"); return t ? t.textContent.trim() : ""; };
const collapsible = function(sec){ return !sec.classList.contains("ns-leaf"); };
const isOpen    = function(sec){ return !sec.classList.contains("ns-collapsed"); };

function emit(){ document.dispatchEvent(new CustomEvent("dexnest:change")); }

/* returns true if the state actually changed */
function setOpen(sec, open){
  if(!sec || !collapsible(sec)) return false;
  if(isOpen(sec) === !!open) return false;
  sec.classList.toggle("ns-collapsed", !open);
  const h = headingOf(sec);
  if(h) h.setAttribute("aria-expanded", open ? "true" : "false");
  return true;
}

function openToLevel(n){
  registry.forEach(function(sec){ setOpen(sec, levelOf(sec) <= n); });
  scheduleFocus(); emit();
}

function goTo(sec, opts){
  if(!sec) return;
  let changed = false;
  for(let p = parentOf(sec); p; p = parentOf(p)) changed = setOpen(p, true) || changed;
  if(!(opts && opts.keepClosed)) changed = setOpen(sec, true) || changed;
  if(changed){ scheduleFocus(); emit(); }
  const h = headingOf(sec);
  if(!h) return;
  // let the open animation finish first, otherwise the target is still moving
  setTimeout(function(){
    h.scrollIntoView({ block:"start", behavior: reducedMotion() ? "auto" : "smooth" });
  }, changed && !reducedMotion() ? 320 : 0);
}

/* highest level L such that every collapsible section with level <= L is open; -1 if none */
function openDepth(){
  const levels = Array.from(new Set(registry.map(levelOf))).sort(function(a, b){ return a - b; });
  let depth = -1;
  for(let i = 0; i < levels.length; i++){
    const allOpen = registry.every(function(sec){
      return levelOf(sec) > levels[i] || !collapsible(sec) || isOpen(sec);
    });
    if(!allOpen) break;
    depth = i;
  }
  return depth;
}

window.DexNest = {
  get ready(){ return built; },
  sections: function(){
    return registry.map(function(sec){
      return { el: sec, level: levelOf(sec), title: titleOf(sec), id: (headingOf(sec) || {}).id || "",
               parent: parentOf(sec), collapsible: collapsible(sec), open: isOpen(sec) };
    });
  },
  levels: function(){ return Array.from(new Set(registry.map(levelOf))).sort(function(a, b){ return a - b; }); },
  defaultLevel: function(){ return defaultLevel; },
  isOpen: isOpen,
  setOpen: function(sec, open){ const c = setOpen(sec, open); if(c){ scheduleFocus(); emit(); } return c; },
  toggle:  function(sec){ return window.DexNest.setOpen(sec, !isOpen(sec)); },
  openToLevel: openToLevel,
  expandAll:   function(){ openToLevel(6); },
  collapseAll: function(){ openToLevel(0); },
  reset:       function(){ openToLevel(defaultLevel); },
  openDepth: openDepth,
  goTo: goTo
};

/* ---------- active session detection (top-level dimming) ---------- */
let focusRaf = null;
function scheduleFocus(){
  if(focusRaf) return;
  focusRaf = requestAnimationFrame(function(){ focusRaf = null; updateFocus(); });
}
function updateFocus(){
  const post = document.querySelector(".post-body");
  if(!post) return;
  const tops = Array.from(post.children).filter(function(c){ return c.nodeType === 1 && c.classList.contains("nested-section"); });
  if(!tops.length) return;

  if(tops.length === 1){
    tops[0].classList.add("ns-active");
    tops[0].classList.remove("ns-dim");
    return;
  }

  const vh = window.innerHeight || document.documentElement.clientHeight;

  // A section stays ACTIVE unless more than 70% of the space it takes up is
  // scrolled off-screen (i.e. dim only when < 30% of its own height is visible).
  const next = new Set();
  let best = 0, bestVisible = -1;
  tops.forEach(function(sec, i){
    const r = sec.getBoundingClientRect();
    const visible = Math.max(0, Math.min(r.bottom, vh) - Math.max(r.top, 0));
    const height  = r.height || 1;
    const selfFrac = visible / height;
    const viewFrac = vh > 0 ? visible / vh : 0;
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

/* ---------- build nested structure ---------- */
function applyNestedSections(){
  injectStyles();

  const post = document.querySelector(".post-body");
  if(!post || post.getAttribute("data-applied")) return;

  const flatNodes = [];
  // We only unwrap a <div>/<span> when we must dig into it to reach a heading.
  // Any wrapper that does NOT contain a heading is kept whole, so everything it
  // carries — inline styles, classes, align, backgrounds, borders, etc. — survives.
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
  const stack = [{element: fragment, level: 0}];

  flatNodes.forEach(function(node){
    if(node.nodeType === 3 && !node.textContent.trim() && stack.length === 1) return;
    if(node.nodeType === 1 && node.tagName === "ISOLATE"){ fragment.appendChild(node); return; }

    let level = -1;
    if(node.nodeType === 1 && /^H[1-6]$/.test(node.tagName)) level = parseInt(node.tagName.substring(1), 10);

    if(level > 0){
      while(stack.length > 1 && stack[stack.length - 1].level >= level) stack.pop();
      const wrapper = document.createElement("div");
      wrapper.className = "nested-section ns-level-" + level;
      wrapper.setAttribute("role", "region");
      node.classList.add("ns-heading");
      ["fontSize","margin","color","fontFamily","whiteSpace","background","border","borderRadius","padding","letterSpacing","textAlign"]
        .forEach(function(p){ node.style.removeProperty(p); });
      const body  = document.createElement("div");
      body.className = "ns-body";
      const inner = document.createElement("div");
      inner.className = "ns-inner";
      body.appendChild(inner);
      stack[stack.length - 1].element.appendChild(wrapper);
      wrapper.appendChild(node);
      wrapper.appendChild(body);
      stack.push({element: inner, level: level});
    } else {
      stack[stack.length - 1].element.appendChild(node);
    }
  });

  const secs = Array.from(fragment.querySelectorAll(".nested-section"));
  const levels = secs.map(levelOf);
  const hasH1 = levels.indexOf(1) !== -1;
  defaultLevel = secs.length ? (hasH1 ? 1 : Math.min.apply(null, levels)) : 1;

  secs.forEach(function(sec, idx){
    const body    = sec.querySelector(":scope > .ns-body");
    const inner   = sec.querySelector(":scope > .ns-body > .ns-inner");
    const heading = sec.querySelector(":scope > .ns-heading");
    if(!body || !inner || !heading) return;
    const level = levelOf(sec);

    // wrap the heading's own text so the level number can sit to its right
    const title = document.createElement("span");
    title.className = "ns-title";
    while(heading.firstChild) title.appendChild(heading.firstChild);
    heading.appendChild(title);

    const num = document.createElement("span");
    num.className = "ns-num";
    num.setAttribute("aria-hidden", "true");
    num.textContent = BADGE_PREFIX + level;
    heading.appendChild(num);

    if(!heading.id) heading.id = "ns-h-" + idx;
    body.id = "ns-body-" + idx;

    const hasContent = Array.from(inner.childNodes).some(function(n){
      if(n.nodeType === 3) return n.textContent.trim().length > 0;
      if(n.nodeType === 1){ const tg = n.tagName.toLowerCase(); return tg !== "br" && tg !== "hr"; }
      return false;
    });

    if(!hasContent){
      // nothing to hide: plain label, number is not a toggle and never struck through
      sec.classList.add("ns-leaf");
      return;
    }

    // default state: H1 open, every other level closed
    const startOpen = level === defaultLevel;
    if(!startOpen) sec.classList.add("ns-collapsed");

    heading.setAttribute("role", "button");
    heading.setAttribute("tabindex", "0");
    heading.setAttribute("aria-expanded", startOpen ? "true" : "false");
    heading.setAttribute("aria-controls", body.id);

    heading.addEventListener("click", function(e){
      if(e.target.closest("a")) return;          // links inside a heading still work
      window.DexNest.toggle(sec);
    });
    heading.addEventListener("keydown", function(e){
      if(e.target !== heading) return;
      if(e.key === "Enter" || e.key === " "){ e.preventDefault(); window.DexNest.toggle(sec); }
    });
  });

  post.innerHTML = "";
  post.appendChild(fragment);
  post.setAttribute("data-applied", "true");

  registry = Array.from(post.querySelectorAll(".nested-section"));
  built = true;

  scheduleFocus();
  document.dispatchEvent(new CustomEvent("dexnest:ready"));
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
