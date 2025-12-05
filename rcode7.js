<script>
(function(){
'use strict';
const css = " .code-container{position:relative;margin:20px auto;max-width:80vw;font-size:14px;background:#000;border-radius:8px;border:1px solid #333;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.3);font-family:'Source Code Pro',Monaco,Consolas,'Courier New',monospace}.code-header{display:flex;justify-content:space-between;align-items:center;padding:5px;background:#1e1e1e;border-bottom:1px solid #404040;min-height:20px}.language-badge{margin-left:8px;color:#ccc;padding:2px 8px;border-radius:4px;font-size:12px;font-weight:500;background:transparent}.code-toolbar{display:flex;gap:6px;align-items:center;user-select:none}.code-btn{background:transparent;border:0;color:#cacaca;cursor:pointer;padding:4px;border-radius:4px;display:flex;align-items:center;justify-content:center;width:28px;height:28px;font-size:18px}.code-btn i{font-size:20px;line-height:1}.code-pre{margin:0;padding:16px;overflow-x:auto;white-space:pre;color:#d4d4d4;background:transparent;line-height:1.4;tab-size:4;font-family:'Source Code Pro',Monaco,Consolas,'Courier New',monospace}.code-pre.line-wrap{white-space:pre-wrap;word-wrap:break-word;overflow-x:hidden}.code-content{display:block;margin:0;font-size:inherit}.hidden-lines-indicator{display:none;padding:8px 16px;color:#888;font-size:12px;background:#2d2d2d;border-top:1px solid #333}.code-container.collapsed .hidden-lines-indicator{display:block}.code-container.collapsed .code-pre{max-height:0;overflow:hidden;padding:0;margin:0;border:none}.copy-success .code-btn i{transform:scale(1.1)}.namespace{opacity:.7}.token.doctype .token.doctype-tag{color:#569CD6}.token.doctype .token.name{color:#9cdcfe}.token.comment,.token.prolog{color:#6a9955}.token.punctuation{color:#d4d4d4}.token.property,.token.tag,.token.boolean,.token.number,.token.constant,.token.symbol,.token.inserted,.token.unit{color:#b5cea8}.token.selector,.token.attr-name,.token.string,.token.char,.token.builtin,.token.deleted{color:#ce9178}.token.operator,.token.entity{color:#d4d4d4}.token.keyword{color:#569CD6}.token.function{color:#dcdcaa}.token.regex{color:#d16969}.token.important{color:#569cd6}.token.constant{color:#9cdcfe}.token.class-name{color:#4ec9b0}.token.parameter{color:#9cdcfe}.token.selector{color:#d7ba7d}.token.tag{color:#569cd6}.token.attr-name{color:#9cdcfe}.token.attr-value{color:#ce9178}.token.entity{color:#569cd6}.token.namespace{color:#4ec9b0}";
function injectCSS(cssText){
  try{
    const style=document.createElement('style');
    style.textContent=cssText;
    document.head.appendChild(style);
    const test=document.createElement('div');
    test.className='code-container';
    test.style.position='absolute';
    test.style.left='-9999px';
    document.body.appendChild(test);
    const applied=getComputedStyle(test).backgroundColor.replace(/\s+/g,'');
    document.body.removeChild(test);
    if(applied&&!(applied==='rgba(0,0,0,0)'||applied==='transparent'))return style;
    document.head.removeChild(style);
  }catch(e){}
  try{
    const blob=new Blob([cssText],{type:'text/css'});
    const url=URL.createObjectURL(blob);
    const link=document.createElement('link');
    link.rel='stylesheet';
    link.href=url;
    document.head.appendChild(link);
    return link;
  }catch(e){}
  try{
    if('adoptedStyleSheets' in document && typeof CSSStyleSheet!=='undefined'){
      const s=new CSSStyleSheet();
      s.replaceSync(cssText);
      document.adoptedStyleSheets=document.adoptedStyleSheets.concat(s);
      return s;
    }
  }catch(e){}
  return null;
}
injectCSS(css);
(function(){
  const f=document.createElement('link');f.rel='stylesheet';f.href='https://fonts.googleapis.com/css2?family=Source+Code+Pro:wght@400;500;600&display=swap';document.head.appendChild(f);
  const i=document.createElement('link');i.rel='stylesheet';i.href='https://fonts.googleapis.com/icon?family=Material+Icons+Round';document.head.appendChild(i);
})();
class L{
  constructor(){
    this.loaded=new Set(['markup','css','clike','javascript']);
    this.loading=new Set();
    this.promises=new Map();
    this.extMap={html:'markup',htm:'markup',xml:'markup',svg:'markup',css:'css',js:'javascript',mjs:'javascript',cjs:'javascript',txt:'none'};
    this.primary={};
    for(const e in this.extMap)if(!this.primary[this.extMap[e]])this.primary[this.extMap[e]]=e;
  }
  detect(x){return this.extMap[(x||'').toLowerCase()]||'none'}
  displayName(a){const l=this.detect(a);return this.primary[l]||((a||'txt').toLowerCase())}
  async load(lang){
    if(!lang||lang==='none')return;
    if(this.loaded.has(lang))return;
    if(this.promises.has(lang))return this.promises.get(lang);
    const p=this._load(lang);
    this.promises.set(lang,p);
    return p;
  }
  async _load(lang){
    if(this.loaded.has(lang)||this.loading.has(lang))return;
    this.loading.add(lang);
    const s=document.createElement('script');
    s.src=`https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-${lang}.min.js`;
    return new Promise((res,rej)=>{
      s.onload=()=>{this.loaded.add(lang);this.loading.delete(lang);res()};
      s.onerror=()=>{this.loading.delete(lang);rej(new Error('load failed'))};
      document.head.appendChild(s);
    });
  }
  isLoaded(lang){return this.loaded.has(lang)}
}
const loader=new L();
function esc(x){const d=document.createElement('div');d.textContent=x;return d.innerHTML}
function debounce(fn,t=120){let h;return(...a)=>{clearTimeout(h);h=setTimeout(()=>fn(...a),t)}}
async function highlight(codeEl){
  const langAttr=codeEl.getAttribute('lang')||'txt';
  const lang=loader.detect(langAttr);
  const display=loader.displayName(langAttr);
  const raw=((codeEl.textContent||'').replace(/\r\n/g,'\n')).trim();
  codeEl.textContent=raw;
  const lines=raw?raw.split('\n').length:0;
  if(lang!=='none'){
    try{
      await loader.load(lang);
      if(window.Prism&&loader.isLoaded(lang)){codeEl.classList.add('code-content',`language-${lang}`);Prism.highlightElement(codeEl)}
      else codeEl.innerHTML=esc(raw);
    }catch(e){codeEl.innerHTML=esc(raw)}
  }else codeEl.innerHTML=esc(raw);
  return{display,lines};
}
function makeWrapper(codeEl,display,lines){
  const container=document.createElement('div');container.className='code-container';
  const header=document.createElement('div');header.className='code-header';
  const badge=document.createElement('span');badge.className='language-badge';badge.textContent=display||'txt';header.appendChild(badge);
  const toolbar=document.createElement('div');toolbar.className='code-toolbar';
  const collapse=document.createElement('button');collapse.className='code-btn collapse-btn';collapse.type='button';collapse.title='Collapse code block';collapse.innerHTML='<i class=\"material-icons-round\">unfold_less</i>';
  const wrap=document.createElement('button');wrap.className='code-btn wrap-btn';wrap.type='button';wrap.title='Toggle line wrap';wrap.innerHTML='<i class=\"material-icons-round\">wrap_text</i>';
  const copy=document.createElement('button');copy.className='code-btn copy-btn';copy.type='button';copy.title='Copy code';copy.innerHTML='<i class=\"material-icons-round\">content_copy</i>';
  toolbar.appendChild(collapse);toolbar.appendChild(wrap);toolbar.appendChild(copy);
  header.appendChild(toolbar);
  container.appendChild(header);
  const pre=document.createElement('pre');pre.className='code-pre';pre.appendChild(codeEl);
  container.appendChild(pre);
  const hidden=document.createElement('div');hidden.className='hidden-lines-indicator';hidden.innerHTML=`<span>${lines} lines hidden</span>`;container.appendChild(hidden);
  let c=false,w=false;
  collapse.addEventListener('click',function(){c=!c;container.classList.toggle('collapsed',c);collapse.innerHTML=c?'<i class=\"material-icons-round\">unfold_more</i>':'<i class=\"material-icons-round\">unfold_less</i>';collapse.title=c?'Expand code block':'Collapse code block'});
  wrap.addEventListener('click',function(){w=!w;pre.classList.toggle('line-wrap',w);wrap.innerHTML=w?'<i class=\"material-icons-round\">code</i>':'<i class=\"material-icons-round\">wrap_text</i>';wrap.title=w?'Unwrap lines':'Wrap lines'});
  copy.addEventListener('click',function(){const t=(codeEl.textContent||'');navigator.clipboard.writeText(t).then(()=>{const ic=copy.querySelector('i');const o=ic.innerHTML;ic.innerHTML='check';container.classList.add('copy-success');setTimeout(()=>{ic.innerHTML=o;container.classList.remove('copy-success')},1500)}).catch(()=>{})});
  return container;
}
const per=new WeakMap();
function observeCode(codeEl,rehighlight){
  if(per.has(codeEl))return;
  const d=debounce(()=>rehighlight(codeEl),120);
  const o=new MutationObserver((ms)=>{for(const m of ms)if(m.type==='characterData'||m.type==='childList'||(m.type==='attributes'&&m.attributeName==='lang')){d();break}});
  o.observe(codeEl,{characterData:true,subtree:true,childList:true,attributes:true});
  per.set(codeEl,o);
}
async function process(codeEl){
  if(!codeEl||codeEl.dataset.codeProcessed==='1')return;
  codeEl.dataset.codeProcessed='1';
  try{
    const {display,lines}=await highlight(codeEl);
    const wrapper=makeWrapper(codeEl,display,lines);
    const anc=codeEl.closest('pre')||codeEl;
    if(anc.parentNode)anc.parentNode.replaceChild(wrapper,anc);else document.body.appendChild(wrapper);
    const updateHidden=()=>{const txt=((codeEl.textContent||'').trim());const lc=txt?txt.split('\n').length:0;const span=wrapper.querySelector('.hidden-lines-indicator span');if(span)span.textContent=`${lc} lines hidden`};
    const rehighlight=async(el)=>{try{await highlight(el);updateHidden()}catch(e){}};
    observeCode(codeEl,rehighlight);
  }catch(e){
    try{const fallback=document.createElement('div');fallback.className='code-container';fallback.innerHTML=`<div class=\"code-header\"><span class=\"language-badge\">txt</span><div class=\"code-toolbar\"><button class=\"code-btn copy-btn\" type=\"button\" title=\"Copy code\"><i class=\"material-icons-round\">content_copy</i></button></div></div><pre class=\"code-pre\">${esc((codeEl.textContent||''))}</pre><div class=\"hidden-lines-indicator\"><span>${(codeEl.textContent||'').trim().split('\n').length} lines hidden</span></div>`;if(codeEl.parentNode)codeEl.parentNode.replaceChild(fallback,codeEl)}catch(e2){}}
}
const globalObs=new MutationObserver((ms)=>{
  for(const m of ms){
    if(m.type==='childList'){
      for(const n of m.addedNodes){
        if(!n||n.nodeType!==1)continue;
        if(n.tagName&&n.tagName.toLowerCase()==='code')process(n);else{const cs=n.querySelectorAll&&n.querySelectorAll('code');if(cs&&cs.length)cs.forEach(c=>process(c))}
      }
    }else if(m.type==='attributes'){
      const t=m.target;
      if((t.tagName==='INPUT'||t.tagName==='TEXTAREA')&&t.dataset&&t.dataset.codeTarget)updateFromInput(t);
    }
  }
});
globalObs.observe(document.documentElement||document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['value']});
function wireInput(inp){if(!inp||inp.__wired)return;inp.__wired=true;const u=()=>updateFromInput(inp);inp.addEventListener('input',u);const o=new MutationObserver(()=>u());o.observe(inp,{attributes:true,attributeFilter:['value']})}
function updateFromInput(inp){const sel=inp.dataset.codeTarget;if(!sel)return;try{const t=document.querySelector(sel);if(!t)return; if(t.tagName&&t.tagName.toLowerCase()==='code'){t.textContent=inp.value}else{const c=t.querySelector&&t.querySelector('code');if(c)c.textContent=inp.value;else t.innerHTML=`<code>${esc(inp.value)}</code>`}}catch(e){}}
async function init(){
  if(!window.Prism)await new Promise((r,j)=>{const s=document.createElement('script');s.src='https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/prism.min.js';s.onload=r;s.onerror=j;document.head.appendChild(s)});
  const codes=Array.from(document.querySelectorAll('code'));
  for(const c of codes)if(!(c.closest&&c.closest('.code-container')))await process(c);
  const inputs=Array.from(document.querySelectorAll('input[data-code-target],textarea[data-code-target]'));inputs.forEach(wireInput);
  setTimeout(()=>{const links=document.querySelectorAll('link[href*=\"fonts.googleapis\"]');if(links.length)links.forEach(l=>{l.crossOrigin='anonymous'})},500);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else setTimeout(init,0);
})();
</script>
