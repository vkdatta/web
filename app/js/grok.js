/*
  grok.js — Bloom menu + fluid Stepper (swipe / scroll), ported from grok.html.
  window.Grok.bloom(host, opts)   -> { open, close, el }
  window.Grok.stepper(el, opts)   -> { get, set, refresh, el }
  Styles live in css/grok.css.
*/
(function(){
"use strict";
if(window.Grok) return;

var reduced = function(){ return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches; };
var I = function(p){ return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + p + '</svg>'; };
var ICONS = {
  dots:  '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><circle cx="6" cy="12" r="1.7"/><circle cx="12" cy="12" r="1.7"/><circle cx="18" cy="12" r="1.7"/></svg>',
  chev:  I('<path d="M9 6l6 6-6 6"/>'),
  left:  I('<path d="M15 6l-6 6 6 6"/>'),
  right: I('<path d="M9 6l6 6-6 6"/>'),
  close: I('<path d="M6 6l12 12M18 6L6 18"/>'),
  list:  I('<path d="M8 6h13M8 12h13M8 18h13"/><circle cx="3.5" cy="6" r=".6"/><circle cx="3.5" cy="12" r=".6"/><circle cx="3.5" cy="18" r=".6"/>'),
  expand:   I('<path d="M7 9l5-5 5 5M7 15l5 5 5-5"/>'),
  collapse: I('<path d="M7 4l5 5 5-5M7 20l5-5 5 5"/>'),
  reset:    I('<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/>')
};

/* ================= Bloom ================= */
var allBlooms = [];
var docListener = false;

function bloomPos(dir, anchor){
  var s = { top:"auto", bottom:"auto", left:"auto", right:"auto", transform:"none" };
  if(dir === "bottom" || dir === "top"){
    s[dir === "bottom" ? "top" : "bottom"] = "0";
    if(anchor === "start") s.left = "0";
    else if(anchor === "end") s.right = "0";
    else { s.left = "50%"; s.transform = "translateX(-50%)"; }
  } else {
    s[dir === "right" ? "left" : "right"] = "0";
    if(anchor === "start") s.top = "0";
    else if(anchor === "end") s.bottom = "0";
    else { s.top = "50%"; s.transform = "translateY(-50%)"; }
  }
  return s;
}
function applyPos(el, s){ for(var k in s) el.style[k] = s[k]; }

/*
  opts: {
    items: [{ id, label, icon (svg html), onSelect }],
    direction: 'bottom'|'top'|'left'|'right'   (default 'bottom')
    anchor:    'start'|'center'|'end'          (default 'start')
    trigger:   'dots' | 'label' | '<svg…>'     (default 'dots'),  label: text for 'label'
    chevrons:  bool,  width: px (default 176),  ariaLabel: string
  }
*/
function bloom(host, opts){
  opts = opts || {};
  var items = opts.items || [];
  var dir = opts.direction || "bottom", anchor = opts.anchor || "start";
  var MW = opts.width || 176, MH = items.length * 38 + 12;
  var shifts = { bottom:["0","-6px"], top:["0","6px"], right:["-6px","0"], left:["6px","0"] };

  var wrap = document.createElement("div"); wrap.className = "gk-bloom-wrap";
  var shell = document.createElement("div"); shell.className = "gk-bloom";
  shell.style.setProperty("--mw", MW + "px"); shell.style.setProperty("--mh", MH + "px");
  shell.style.setProperty("--sx", shifts[dir][0]); shell.style.setProperty("--sy", shifts[dir][1]);
  applyPos(shell, bloomPos(dir, anchor));

  var list = document.createElement("div"); list.className = "gk-bloom-items"; list.setAttribute("role", "menu");
  applyPos(list, bloomPos(dir, anchor));

  var trig = document.createElement("button");
  trig.type = "button"; trig.className = "gk-bloom-trigger";
  trig.setAttribute("aria-label", opts.ariaLabel || "Open menu");
  trig.setAttribute("aria-haspopup", "menu"); trig.setAttribute("aria-expanded", "false");
  trig.innerHTML = opts.trigger === "label" ? (opts.label || "Aa") : (opts.trigger && opts.trigger !== "dots" ? opts.trigger : ICONS.dots);

  items.forEach(function(it, i){
    var b = document.createElement("button");
    b.type = "button"; b.className = "gk-bloom-item"; b.setAttribute("role", "menuitem"); b.tabIndex = -1;
    b.style.setProperty("--i", i);
    b.innerHTML = (it.icon || "") + "<span>" + it.label + "</span>" + (opts.chevrons ? '<span class="gk-chev">' + ICONS.chev + "</span>" : "");
    b.addEventListener("click", function(e){
      e.stopPropagation(); close(); trig.focus();
      if(it.onSelect) it.onSelect(it);
      if(opts.onSelect) opts.onSelect(it);
    });
    list.appendChild(b);
  });
  shell.appendChild(list);
  wrap.appendChild(shell); wrap.appendChild(trig); host.appendChild(wrap);

  function setOpen(v){
    shell.classList.toggle("open", v);
    trig.classList.toggle("open", v);
    trig.setAttribute("aria-expanded", String(v));
    list.querySelectorAll(".gk-bloom-item").forEach(function(b){ b.tabIndex = v ? 0 : -1; });
    if(v) allBlooms.forEach(function(o){ if(o !== api) o.close(); });
  }
  function close(){ setOpen(false); }
  trig.addEventListener("click", function(e){ e.stopPropagation(); setOpen(!shell.classList.contains("open")); });
  shell.addEventListener("keydown", function(e){
    if(e.key === "Escape"){ if(shell.classList.contains("open")){ e.stopPropagation(); close(); trig.focus(); } }
    if(e.key === "ArrowDown" || e.key === "ArrowUp"){
      e.preventDefault();
      var els = Array.prototype.slice.call(list.querySelectorAll(".gk-bloom-item"));
      var idx = els.indexOf(document.activeElement);
      idx = e.key === "ArrowDown" ? (idx + 1) % els.length : (idx - 1 + els.length) % els.length;
      els[idx].focus();
    }
  });

  var api = { close: close, open: function(){ setOpen(true); }, isOpen: function(){ return shell.classList.contains("open"); }, el: wrap };
  allBlooms.push(api);
  if(!docListener){
    docListener = true;
    document.addEventListener("click", function(){ allBlooms.forEach(function(o){ o.close(); }); });
  }
  return api;
}

/* ================= Stepper ================= */
/*
  opts: {
    count, active (-1 = none), labels: [text…] (labelled variant), vertical,
    href: function(i) -> url (renders <a>), ariaLabel,
    scrub: true | false | 'auto'   swipe/drag across the steps to change them (auto = only when it all fits)
    onChange: function(index, previousIndex)
  }
  Long steppers scroll horizontally (native swipe); the active step is kept centred.
*/
function stepper(el, opts){
  opts = opts || {};
  var count = opts.count | 0;
  var vertical = !!opts.vertical || el.classList.contains("gk-vertical");
  var active = opts.active == null ? 0 : opts.active;
  var timer = null;

  el.innerHTML = "";
  el.classList.add("gk-steps");
  if(vertical) el.classList.add("gk-vertical");
  if(opts.labels) el.classList.add("gk-labeled");
  el.setAttribute("role", "group");
  el.setAttribute("aria-label", opts.ariaLabel || "Steps");

  var track = document.createElement("div"); track.className = "gk-steps-track"; el.appendChild(track);
  var slots = [];
  for(var i = 0; i < count; i++){
    (function(i){
      var s = document.createElement(opts.href ? "a" : "div");
      s.className = "gk-step";
      if(opts.href){ s.href = opts.href(i); }
      else { s.setAttribute("role", "button"); }
      s.setAttribute("aria-label", opts.labels ? String(opts.labels[i]) : "Step " + (i + 1));
      s.tabIndex = -1;
      var inner = document.createElement("span");
      if(opts.labels){ inner.className = "gk-step-label"; inner.textContent = opts.labels[i]; }
      else { inner.className = "gk-dot"; }
      s.appendChild(inner);
      s.addEventListener("click", function(e){ if(opts.href) e.preventDefault(); api.set(i); });
      s.addEventListener("keydown", function(e){
        var k = e.key, to = null;
        if(k === "Enter" || k === " "){ e.preventDefault(); api.set(i); return; }
        if(k === "ArrowRight" || k === "ArrowDown") to = Math.min(count - 1, i + 1);
        else if(k === "ArrowLeft" || k === "ArrowUp") to = Math.max(0, i - 1);
        else if(k === "Home") to = 0;
        else if(k === "End") to = count - 1;
        if(to !== null){ e.preventDefault(); api.set(to); slots[to].focus(); }
      });
      track.appendChild(s); slots.push(s);
    })(i);
  }
  var ind = document.createElement("div"); ind.className = "gk-ind"; track.appendChild(ind);

  function place(from, to){
    var a = slots[Math.min(from, to)], b = slots[Math.max(from, to)];
    if(!a || !b) return;
    if(vertical){ ind.style.top = a.offsetTop + "px"; ind.style.height = (b.offsetTop + b.offsetHeight - a.offsetTop) + "px"; }
    else        { ind.style.left = a.offsetLeft + "px"; ind.style.width = (b.offsetLeft + b.offsetWidth - a.offsetLeft) + "px"; }
  }
  function paint(){
    slots.forEach(function(s, i){
      s.classList.toggle("done", i < active);
      s.classList.toggle("on", i === active);
      if(i === active) s.setAttribute("aria-current", "step"); else s.removeAttribute("aria-current");
      s.tabIndex = (i === (active < 0 ? 0 : active)) ? 0 : -1;
    });
    ind.classList.toggle("gk-hidden", active < 0);
  }
  function scrollable(){ return vertical ? el.scrollHeight > el.clientHeight + 1 : el.scrollWidth > el.clientWidth + 1; }
  function updateFade(){
    var sc = scrollable();
    el.classList.toggle("gk-scrollable", sc);
    if(!sc || vertical){ return; }
    var max = el.scrollWidth - el.clientWidth;
    el.style.setProperty("--gk-fade-l", el.scrollLeft > 2 ? "18px" : "0px");
    el.style.setProperty("--gk-fade-r", el.scrollLeft < max - 2 ? "18px" : "0px");
  }
  function scrubOn(){ return opts.scrub === true || (opts.scrub !== false && !scrollable()); }
  function applyTouch(){ track.style.touchAction = scrubOn() ? (vertical ? "pan-x" : "pan-y") : ""; }
  function centre(smooth){
    var s = slots[active];
    if(!s || !scrollable()) return;
    var beh = smooth && !reduced() ? "smooth" : "auto";
    if(vertical) el.scrollTo({ top: Math.max(0, s.offsetTop - (el.clientHeight - s.offsetHeight) / 2), behavior: beh });
    else         el.scrollTo({ left: Math.max(0, s.offsetLeft - (el.clientWidth - s.offsetWidth) / 2), behavior: beh });
  }

  var api = {
    el: el,
    get: function(){ return active; },
    /* opts2.silent skips onChange (use when syncing from outside) */
    set: function(n, opts2){
      if(count === 0) return;
      n = Math.max(0, Math.min(count - 1, n));
      if(n === active) return;
      var prev = active; active = n;
      clearTimeout(timer);
      if(prev < 0){ place(n, n); }
      else { place(prev, n); timer = setTimeout(function(){ place(n, n); }, 130); }   // stretch over both, then settle
      paint(); centre(true);
      if(!(opts2 && opts2.silent) && opts.onChange) opts.onChange(n, prev);
    },
    clear: function(){ active = -1; paint(); },
    refresh: function(){ place(Math.max(active, 0), Math.max(active, 0)); updateFade(); applyTouch(); centre(false); }
  };

  /* swipe / drag across the steps to scrub (only when they all fit; otherwise the strip scrolls natively) */
  var scrubbing = false;
  function indexAt(x, y){
    var pos = vertical ? y : x;
    for(var i = 0; i < slots.length; i++){
      var r = slots[i].getBoundingClientRect();
      var a = vertical ? r.top : r.left, b = vertical ? r.bottom : r.right;
      if(pos >= a && pos <= b) return i;
    }
    var f = slots[0].getBoundingClientRect(), l = slots[slots.length - 1].getBoundingClientRect();
    return pos < (vertical ? f.top : f.left) ? 0 : slots.length - 1;
  }
  track.addEventListener("pointerdown", function(e){
    if(!scrubOn() || (e.pointerType === "mouse" && e.button !== 0) || !slots.length) return;
    scrubbing = true;
    try{ track.setPointerCapture(e.pointerId); }catch(_){}
    api.set(indexAt(e.clientX, e.clientY));
  });
  track.addEventListener("pointermove", function(e){ if(scrubbing) api.set(indexAt(e.clientX, e.clientY)); });
  ["pointerup", "pointercancel", "lostpointercapture"].forEach(function(t){ track.addEventListener(t, function(){ scrubbing = false; }); });

  el.addEventListener("scroll", updateFade, { passive: true });
  if(window.ResizeObserver){ new ResizeObserver(function(){ api.refresh(); }).observe(el); }

  paint(); place(Math.max(active, 0), Math.max(active, 0)); updateFade(); applyTouch();
  requestAnimationFrame(function(){ api.refresh(); });
  return api;
}

window.Grok = { bloom: bloom, stepper: stepper, icons: ICONS };
})();
