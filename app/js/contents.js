/*<![CDATA[*/
/*
  contents.js — left-side "Contents" drawer for the nested heading wrappers.

  Lists every heading of the article, nested by level (like the Grokipedia
  contents panel). Tapping an entry opens the wrappers above it and scrolls
  there. The header is just the title and a close button.

  Needs nxt.js (window.DexNest). grok.js / grok.css are optional (icons only).
*/
(function(){
"use strict";

var STYLE_ID = "dx-toc-styles";
var built = false;

function injectStyles(){
  if(document.getElementById(STYLE_ID)) return;
  var st = document.createElement("style");
  st.id = STYLE_ID;
  st.textContent = `
    .dx-toc-btn{
      position:fixed; z-index:20;
      left:16px; bottom:calc(16px + env(safe-area-inset-bottom, 0px));
      width:40px; height:40px; padding:0;
      display:flex; align-items:center; justify-content:center;
      background:var(--matte3,#272727); color:#cacaca;
      border:1px solid rgba(255,255,255,.06); border-radius:10px;
      cursor:pointer; line-height:0; transition:background .2s ease, opacity .2s ease, transform .15s ease;
      touch-action:manipulation;
    }
    .dx-toc-btn:hover,.dx-toc-btn:focus-visible{ background:#323232; box-shadow:none; }
    .dx-toc-btn:active{ transform:scale(.94); }
    .dx-toc-btn:focus-visible{ outline:2px solid var(--gk-accent,#8B78FF); outline-offset:2px; }
    .dx-toc-btn svg{ width:20px; height:20px; pointer-events:none; }
    .dx-toc-btn.dx-away{ opacity:0; pointer-events:none; }

    .dx-toc-backdrop{
      position:fixed; inset:0; z-index:29;
      background:rgba(0,0,0,.45);
      -webkit-backdrop-filter:blur(6px); backdrop-filter:blur(6px);
      opacity:0; visibility:hidden;
      transition:opacity .3s ease, visibility 0s linear .3s;
    }
    .dx-toc-backdrop.open{ opacity:1; visibility:visible; transition:opacity .3s ease, visibility 0s; }

    .dx-toc{
      position:fixed; z-index:30; top:0; bottom:0; left:0;
      width:min(88vw, 400px);
      display:flex; flex-direction:column;
      background:#161616; color:#cacaca;
      border-right:1px solid var(--dx-border,rgba(255,255,255,.1));
      box-shadow:0 0 60px rgba(0,0,0,.6);
      padding-top:env(safe-area-inset-top, 0px);
      transform:translateX(-102%); visibility:hidden;
      transition:transform .34s cubic-bezier(.2,.9,.25,1), visibility 0s linear .34s;
      font-family:classy,system-ui,sans-serif;
    }
    .dx-toc.open{ transform:none; visibility:visible; transition:transform .34s cubic-bezier(.2,.9,.25,1), visibility 0s; }

    .dx-toc-head{
      position:relative; z-index:3; flex:0 0 auto;
      display:flex; align-items:center; justify-content:space-between; gap:10px;
      padding:14px 14px 8px 22px;
    }
    .dx-toc-title{ font-family:classy,system-ui,sans-serif; font-size:17px; letter-spacing:.5px; text-transform:none; color:#d4d4d4; }
    .dx-toc-actions{ display:flex; align-items:center; gap:8px; }
    .dx-toc-actions .gk-btn{ width:40px; height:40px; }

    .dx-toc-list{ position:relative; flex:1 1 auto; overflow-y:auto; overscroll-behavior:contain; padding:6px 0 calc(28px + env(safe-area-inset-bottom, 0px)); }
    .dx-toc ul{ list-style:none; margin:0; padding:0; width:auto; display:block; }
    .dx-toc li{ display:block; margin:0; padding:0; }
    .dx-toc-item{
      --d:0;
      position:relative; display:flex !important; align-items:flex-start; gap:10px;
      padding:10px 18px 10px calc(22px + var(--d) * 18px);
      font-family:classy,system-ui,sans-serif !important; font-size:15px !important; letter-spacing:.5px !important;
      line-height:1.45; text-transform:none !important; text-decoration:none !important;
      color:#d4d4d4 !important; word-spacing:0 !important;
      transition:background .15s ease, color .15s ease;
      -webkit-tap-highlight-color:transparent;
    }
    .dx-toc-item::before{
      content:""; flex:0 0 auto; width:6px; height:6px; margin-top:.62em; border-radius:50%;
      background:rgb(var(--c,139,120,255)); opacity:.55; transition:opacity .15s, transform .15s;
    }
    .dx-toc-item:hover,.dx-toc-item:focus-visible{ background:rgba(255,255,255,.05); outline:none; }
    .dx-toc-item:hover::before{ opacity:1; }
    .dx-toc-item[aria-current="location"]{ color:#fff !important; background:rgba(var(--c,139,120,255),.12); }
    .dx-toc-item[aria-current="location"]::before{ opacity:1; transform:scale(1.35); }
    .dx-toc-item[aria-current="location"]::after{
      content:""; position:absolute; left:0; top:6px; bottom:6px; width:3px; border-radius:0 3px 3px 0;
      background:rgb(var(--c,139,120,255));
    }
    .dx-toc-item > span{ min-width:0; overflow-wrap:anywhere; }
    .dx-toc-item.dx-untitled > span{ opacity:.5; }

    @media (prefers-reduced-motion:reduce){
      .dx-toc,.dx-toc.open,.dx-toc-backdrop,.dx-toc-backdrop.open{ transition:none !important; }
    }
  `;
  document.head.appendChild(st);
}

function build(){
  var Nest = window.DexNest;
  if(built || !Nest) return;
  var secs = Nest.sections();
  if(!secs.length) return;
  built = true;
  injectStyles();

  var G = window.Grok;

  /* ---------- shell ---------- */
  var btn = document.createElement("button");
  btn.type = "button"; btn.className = "dx-toc-btn";
  btn.setAttribute("aria-label", "Contents"); btn.setAttribute("aria-haspopup", "dialog"); btn.setAttribute("aria-expanded", "false");
  btn.innerHTML = G ? G.icons.list : "≡";

  var backdrop = document.createElement("div"); backdrop.className = "dx-toc-backdrop";

  var panel = document.createElement("aside");
  panel.className = "dx-toc";
  panel.setAttribute("role", "dialog"); panel.setAttribute("aria-modal", "true"); panel.setAttribute("aria-label", "Contents");

  var head = document.createElement("div"); head.className = "dx-toc-head";
  var title = document.createElement("span"); title.className = "dx-toc-title"; title.textContent = "Contents";
  var actions = document.createElement("div"); actions.className = "dx-toc-actions";
  head.appendChild(title); head.appendChild(actions);

  var closeBtn = document.createElement("button");
  closeBtn.type = "button"; closeBtn.className = "gk-btn"; closeBtn.setAttribute("aria-label", "Close contents");
  closeBtn.innerHTML = G ? G.icons.close : "×";

  actions.appendChild(closeBtn);
  panel.appendChild(head);

  /* ---------- nested list ---------- */
  var nav = document.createElement("nav");
  nav.className = "dx-toc-list"; nav.setAttribute("aria-label", "Article contents");
  var rootUl = document.createElement("ul");
  nav.appendChild(rootUl);

  var liOf = new Map();       // section element -> its <li>
  var linkOf = new Map();     // section element -> its <a>
  var depthOf = new Map();
  secs.forEach(function(s){
    var li = document.createElement("li");
    var depth = s.parent ? (depthOf.get(s.parent) + 1) : 0;
    depthOf.set(s.el, depth);

    var a = document.createElement("a");
    a.className = "dx-toc-item" + (s.title ? "" : " dx-untitled");
    a.href = "#" + (s.id || "");
    a.style.setProperty("--d", depth);
    var c = getComputedStyle(s.el).getPropertyValue("--c").trim();
    if(c) a.style.setProperty("--c", c);
    var t = document.createElement("span"); t.textContent = s.title || "Untitled section";
    a.appendChild(t);
    a.addEventListener("click", function(e){
      e.preventDefault();
      close(false);
      Nest.goTo(s.el);
    });
    li.appendChild(a);
    liOf.set(s.el, li); linkOf.set(s.el, a);

    var host = s.parent ? liOf.get(s.parent) : null;
    if(host){
      var ul = host.querySelector(":scope > ul");
      if(!ul){ ul = document.createElement("ul"); host.appendChild(ul); }
      ul.appendChild(li);
    } else {
      rootUl.appendChild(li);
    }
  });
  panel.appendChild(nav);

  document.body.appendChild(btn);
  document.body.appendChild(backdrop);
  document.body.appendChild(panel);

  function visible(sec){ return !(sec.parentElement && sec.parentElement.closest(".nested-section.ns-collapsed")); }
  function markActive(){
    var line = (window.innerHeight || 700) * 0.3, cur = null;
    secs.forEach(function(s){
      if(!visible(s.el)) return;
      var h = s.el.querySelector(":scope > .ns-heading");
      if(h && h.getBoundingClientRect().top <= line) cur = s.el;
    });
    linkOf.forEach(function(a, el){
      if(el === cur) a.setAttribute("aria-current", "location"); else a.removeAttribute("aria-current");
    });
    var a = cur && linkOf.get(cur);
    if(a) nav.scrollTop = Math.max(0, a.offsetTop - nav.clientHeight / 2 + a.offsetHeight / 2);
  }

  /* ---------- open / close ---------- */
  var isOpen = false;
  function open(){
    if(isOpen) return;
    isOpen = true;
    markActive();
    panel.classList.add("open"); backdrop.classList.add("open");
    btn.setAttribute("aria-expanded", "true");
    document.documentElement.style.overflow = "hidden";
    setTimeout(function(){ closeBtn.focus({ preventScroll: true }); }, 30);
  }
  function close(returnFocus){
    if(!isOpen) return;
    isOpen = false;
    panel.classList.remove("open"); backdrop.classList.remove("open");
    btn.setAttribute("aria-expanded", "false");
    document.documentElement.style.overflow = "";
    if(returnFocus !== false) btn.focus({ preventScroll: true });
  }
  btn.addEventListener("click", open);
  closeBtn.addEventListener("click", function(){ close(); });
  backdrop.addEventListener("click", function(){ close(); });

  document.addEventListener("keydown", function(e){
    if(!isOpen) return;
    if(e.key === "Escape"){ close(); return; }
    if(e.key === "Tab"){                                   // keep focus inside the drawer
      var f = Array.prototype.slice.call(panel.querySelectorAll("a[href],button:not([disabled]),[tabindex='0']"))
        .filter(function(n){ return n.offsetParent !== null && n.tabIndex >= 0; });
      if(!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if(e.shiftKey && document.activeElement === first){ e.preventDefault(); last.focus(); }
      else if(!e.shiftKey && document.activeElement === last){ e.preventDefault(); first.focus(); }
    }
  });

  /* swipe the drawer to the left to close it */
  var sx = 0, sy = 0, tracking = false;
  panel.addEventListener("pointerdown", function(e){
    if(e.pointerType === "mouse") return;
    tracking = true; sx = e.clientX; sy = e.clientY;
  });
  panel.addEventListener("pointerup", function(e){
    if(!tracking) return; tracking = false;
    var dx = e.clientX - sx, dy = e.clientY - sy;
    if(dx < -70 && Math.abs(dy) < 45) close();
  });
  panel.addEventListener("pointercancel", function(){ tracking = false; });

  /* the site's full-screen menu sits above everything: tuck the button away while it's open */
  var menuToggle = document.getElementById("menu-toggle");
  if(menuToggle){
    var sync = function(){ btn.classList.toggle("dx-away", menuToggle.checked); if(menuToggle.checked) close(false); };
    menuToggle.addEventListener("change", sync); sync();
  }
}

if(window.DexNest && window.DexNest.ready) build();
document.addEventListener("dexnest:ready", build);
})();
/*]]>*/
