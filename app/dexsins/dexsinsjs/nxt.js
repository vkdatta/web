/*<![CDATA[*/
(function(){
"use strict";

const SVGNS = "http://www.w3.org/2000/svg";
const R = 11;              // node circle radius
const BODY_INDENT = 14;    // px each level indents (creates the gutter for branches)
const CIRCLE_GAP = 7;     // circle centre sits this far left of a card's edge

/* Phosphor "regular" icons */
const SVG_EYE='<svg viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M247.31,124.76c-.35-.79-8.82-19.58-27.65-38.41C194.57,61.26,162.88,48,128,48S61.43,61.26,36.34,86.35C17.51,105.18,9,124,8.69,124.76a8,8,0,0,0,0,6.5c.35.79,8.82,19.57,27.65,38.4C61.43,194.74,93.12,208,128,208s66.57-13.26,91.66-38.34c18.83-18.83,27.3-37.61,27.65-38.4A8,8,0,0,0,247.31,124.76ZM128,192c-30.78,0-57.67-11.19-79.93-33.25A133.16,133.16,0,0,1,25,128,133.16,133.16,0,0,1,48.07,97.25C70.33,75.19,97.22,64,128,64s57.67,11.19,79.93,33.25A133.16,133.16,0,0,1,231,128,133.16,133.16,0,0,1,207.93,158.75C185.67,180.81,158.78,192,128,192Zm0-112a48,48,0,1,0,48,48A48,48,0,0,0,128,80Zm0,80a32,32,0,1,1,32-32A32,32,0,0,1,128,160Z"></path></svg>';
const SVG_EYE_SLASH='<svg viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M53.92,34.62A8,8,0,1,0,42.08,45.38L61.32,66.55C25,88.84,9.38,123.2,8.69,124.76a8,8,0,0,0,0,6.5c.35.79,8.82,19.57,27.65,38.4C61.43,194.74,93.12,208,128,208a127.11,127.11,0,0,0,52.07-11L204.79,224a8,8,0,1,0,11.84-10.76ZM128,192c-30.78,0-57.67-11.19-79.93-33.25A133.47,133.47,0,0,1,25,128c4.69-8.79,19.66-33.39,47.35-49.38l18,19.75a48,48,0,0,0,63.66,70l14.73,16.2A112,112,0,0,1,128,192Zm-32-64a32,32,0,0,1,52.94-24.29L107.71,148.94A31.83,31.83,0,0,1,96,128Zm32,32a31.6,31.6,0,0,1-5.29-.45l45.34-45.34A31.9,31.9,0,0,1,128,160ZM247.31,131.26c-.35.79-8.82,19.57-27.65,38.4a8,8,0,0,1-11.32-11.32A133.16,133.16,0,0,0,231,128c-7.16-13.46-38.57-64-103-64a118.05,118.05,0,0,0-16.5,1.16A8,8,0,1,1,109.28,49.4,133.7,133.7,0,0,1,128,48c34.88,0,66.57,13.26,91.66,38.34,18.83,18.83,27.3,37.62,27.65,38.41A8,8,0,0,1,247.31,131.26Z"></path></svg>';

function injectStyles(){
  if(document.getElementById("ns-styles")) return;
  const style = document.createElement("style");
  style.id = "ns-styles";
  style.textContent = `
    @font-face{ font-family:'dexy'; src:url('https://vkfonts.storage.googleapis.com/dexy.woff2') format('woff2'); font-weight:normal; font-style:normal; font-display:swap; }
    @font-face{ font-family:'classy'; src:url('https://vkfonts.storage.googleapis.com/classy.woff2') format('woff2'); font-weight:normal; font-style:normal; font-display:swap; }

    .post-body{
      --ns-grey:#171717;
      --ns-green:#474747;
      position:relative;
      padding-left:40px;
      font-family:'classy',system-ui,-apple-system,sans-serif;
    }

    /* the tree: one static svg, drawn ABOVE the cards so nothing covers it */
    .ns-tree{
      position:absolute;
      top:0; left:0;
      width:100%; height:100%;
      pointer-events:none;
      z-index:5;
      overflow:visible;
    }
    .ns-edge{ fill:none; stroke:var(--ns-grey); stroke-width:2; stroke-linecap:round; }
    .ns-edge.is-on{ stroke:var(--ns-green); }
    .ns-dot{ fill:#0c0c0e; stroke:var(--ns-grey); stroke-width:2; }
    .ns-dot.is-on{ stroke:var(--ns-green); }
    .ns-num{ fill:var(--ns-grey); font-family:'classy',system-ui,sans-serif; font-size:11px; text-anchor:middle; dominant-baseline:central; }
    .ns-num.is-on{ fill:var(--ns-green); }

    .nested-section{
      position:relative;
      z-index:0;
      display:block;
      padding: 0 5px 0 5px;
      margin: 0 5px 0 5px;
      border-radius:25px;
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

    /* ===== restored pill heading (centred, uniform size across all levels) ===== */
    .ns-heading{
      position:relative;
      margin: 0 0 10px 0;
      padding:7px 14px;
      color:#fff;
      font-family:'dexy',sans-serif;
      font-size:15px;
      font-weight:normal;
      letter-spacing:3px;
      text-align:center;
      background:#272727;
      border:1px solid rgba(255,255,255,0.08);
      border-radius:50px;
      white-space:normal;
      overflow-wrap:break-word;
      word-break:break-word;
      hyphens:auto;
      cursor:pointer;
      user-select:none;
      -webkit-user-select:none;
      -webkit-tap-highlight-color:transparent;
    }
    .ns-heading:focus-visible{ outline:2px solid rgba(255,255,255,0.25); outline-offset:3px; }

    .ns-body{
      display:block;
      padding-left:${BODY_INDENT}px;
      font-family:'classy',system-ui,sans-serif;
    }
    .nested-section.ns-collapsed > .ns-body{ display:none; }

    .ns-toggle{
      position:absolute;
      right:8px; top:50%;
      transform:translateY(-50%);
      display:inline-flex; align-items:center; justify-content:center;
      width:28px; height:28px;
      padding:0; margin:0;
      color:#c9c9c9;
      background:rgba(255,255,255,0.05);
      border:1px solid rgba(255,255,255,0.1);
      border-radius:50%;
      cursor:pointer; line-height:0; flex:0 0 auto;
      transition:background .15s ease, color .15s ease, border-color .15s ease;
      -webkit-tap-highlight-color:transparent;
      touch-action:manipulation;
    }
    .ns-toggle:hover{ background:rgba(255,255,255,0.12); color:#fff; border-color:rgba(255,255,255,0.25); }
    .ns-toggle svg{ width:15px; height:15px; display:block; fill:currentColor; pointer-events:none; }

    @media (max-width:600px){
      .post-body{ padding-left:22px; }
      .ns-body{ padding-left:20px; }
    }
  `;
  document.head.appendChild(style);
}

/* ---------- tree geometry ---------- */
let activeIndex = 0;

function el(name, attrs){
  const n = document.createElementNS(SVGNS, name);
  for(const k in attrs) n.setAttribute(k, attrs[k]);
  return n;
}

function topAncestor(sec){
  let cur = sec, top = sec;
  while(true){
    const parent = cur.parentElement ? cur.parentElement.closest(".nested-section") : null;
    if(!parent) break;
    top = parent; cur = parent;
  }
  return top;
}

function branchPath(x1, y1, x2, y2){
  const mx = x1 + (x2 - x1) * 0.5;
  return `M ${x1} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}`;
}

function buildTree(){
  const post = document.querySelector(".post-body");
  if(!post || !post.getAttribute("data-applied")) return;

  let svg = post.querySelector(":scope > .ns-tree");
  if(!svg){ svg = el("svg", {class:"ns-tree"}); post.insertBefore(svg, post.firstChild); }
  while(svg.firstChild) svg.removeChild(svg.firstChild);

  const svgRect = svg.getBoundingClientRect();
  const tops = Array.from(post.children).filter(c => c.nodeType === 1 && c.classList.contains("nested-section"));
  const sections = Array.from(post.querySelectorAll(".nested-section")).filter(s => s.offsetParent !== null || tops.indexOf(s) !== -1);

  const pt = new Map();
  sections.forEach(sec => {
    const heading = sec.querySelector(":scope > .ns-heading");
    if(!heading) return;
    const sr = sec.getBoundingClientRect();
    const hr = heading.getBoundingClientRect();
    if(hr.width === 0 && hr.height === 0) return;
    const fs = parseFloat(getComputedStyle(heading).fontSize) || 15;
    const x = sr.left - svgRect.left - CIRCLE_GAP;            // circle in the gutter, left of the card
    const y = hr.top - svgRect.top + Math.min(hr.height / 2, fs * 1.8);
    const lm = /ns-level-(\d)/.exec(sec.className);
    pt.set(sec, { x, y, top: topAncestor(sec), level: lm ? lm[1] : "" });
  });

  const visTops = tops.filter(t => pt.has(t));

  // root trunk + branches to each top node
  if(visTops.length){
    let rootX = Math.min.apply(null, visTops.map(t => pt.get(t).x)) - 16;
    if(rootX < 2) rootX = 2;
    const firstY = pt.get(visTops[0]).y;
    const lastY = pt.get(visTops[visTops.length - 1]).y;
    const trunk = el("line", {class:"ns-edge", x1:rootX, y1:firstY, x2:rootX, y2:lastY});
    trunk.setAttribute("data-top", "-1");
    svg.appendChild(trunk);
    visTops.forEach((t, i) => {
      const P = pt.get(t);
      const b = el("path", {class:"ns-edge", d:branchPath(rootX, P.y, P.x - R, P.y)});
      b.setAttribute("data-top", String(i));
      svg.appendChild(b);
    });
  }

  // spine + branches for every parent that has visible children
  sections.forEach(parent => {
    if(!pt.has(parent)) return;
    const body = parent.querySelector(":scope > .ns-body");
    if(!body) return;
    const kids = Array.from(body.children).filter(c => c.classList && c.classList.contains("nested-section") && pt.has(c));
    if(!kids.length) return;
    const P = pt.get(parent);
    const topIdx = visTops.indexOf(P.top);
    const lastY = pt.get(kids[kids.length - 1]).y;
    const spine = el("line", {class:"ns-edge", x1:P.x, y1:P.y + R, x2:P.x, y2:lastY});
    spine.setAttribute("data-top", String(topIdx));
    svg.appendChild(spine);
    kids.forEach(k => {
      const K = pt.get(k);
      const b = el("path", {class:"ns-edge", d:branchPath(P.x, K.y, K.x - R, K.y)});
      b.setAttribute("data-top", String(topIdx));
      svg.appendChild(b);
    });
  });

  // node circles + numbers on top
  sections.forEach(sec => {
    if(!pt.has(sec)) return;
    const P = pt.get(sec);
    const topIdx = visTops.indexOf(P.top);
    const c = el("circle", {class:"ns-dot", cx:P.x, cy:P.y, r:R});
    c.setAttribute("data-top", String(topIdx));
    svg.appendChild(c);
    const t = el("text", {class:"ns-num", x:P.x, y:P.y});
    t.setAttribute("data-top", String(topIdx));
    t.textContent = P.level;
    svg.appendChild(t);
  });

  recolorTree();
}

function recolorTree(){
  const post = document.querySelector(".post-body");
  if(!post) return;
  const svg = post.querySelector(":scope > .ns-tree");
  if(!svg) return;
  svg.querySelectorAll("[data-top]").forEach(node => {
    node.classList.toggle("is-on", node.getAttribute("data-top") === String(activeIndex));
  });
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
    activeIndex = 0;
    tops[0].classList.add("ns-active");
    tops[0].classList.remove("ns-dim");
    recolorTree();
    return;
  }

  const vh = window.innerHeight || document.documentElement.clientHeight;
  let best = 0, bestVisible = -1;
  tops.forEach(function(sec, i){
    const r = sec.getBoundingClientRect();
    const visible = Math.max(0, Math.min(r.bottom, vh) - Math.max(r.top, 0));
    if(visible > bestVisible){ bestVisible = visible; best = i; }
  });
  activeIndex = best;

  tops.forEach(function(sec, i){
    if(i === best){ sec.classList.add("ns-active"); sec.classList.remove("ns-dim"); }
    else { sec.classList.remove("ns-active"); sec.classList.add("ns-dim"); }
  });
  recolorTree();
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
    buildTree();
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
  function flatten(node){
    Array.from(node.childNodes).forEach(function(child){
      const isHeading = child.nodeType === 1 && /^H[1-6]$/.test(child.tagName);
      const isImport = child.nodeType === 1 && child.hasAttribute && child.hasAttribute("data-import");
      if(
        child.nodeType === 1 &&
        (child.tagName === "DIV" || child.tagName === "SPAN") &&
        !isHeading && !isImport &&
        !child.className.includes("nested-section") &&
        !child.className.includes("separator")
      ){ flatten(child); } else { flatNodes.push(child); }
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
    const hasContent = Array.from(body.childNodes).some(function(n){
      if(n.nodeType === 3) return n.textContent.trim().length > 0;
      if(n.nodeType === 1){ const tg = n.tagName.toLowerCase(); return tg !== "br" && tg !== "hr"; }
      return false;
    }) || body.querySelector(":scope > .nested-section");

    if(hasContent) heading.appendChild(makeToggle());

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

  buildTree();
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
  setTimeout(function(){ applyNestedSections(); buildTree(); scheduleFocus(); }, 220);
});

if(document.fonts && document.fonts.ready){ document.fonts.ready.then(function(){ buildTree(); }); }

let sizeRaf = null;
window.addEventListener("resize", function(){
  if(sizeRaf) return;
  sizeRaf = requestAnimationFrame(function(){ sizeRaf = null; buildTree(); });
});
window.addEventListener("scroll", scheduleFocus, {passive:true});

const observer = new MutationObserver(function(){
  const post = document.querySelector(".post-body");
  if(post && !post.getAttribute("data-applied")) debouncedApply();
});
observer.observe(document.body, {childList:true, subtree:true});

})();
/*]]>*/
