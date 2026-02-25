document.addEventListener('contextmenu', e => {
    if (e.target.closest('body')) e.preventDefault();
  });

const diffElements = {
  raw: document.getElementById('diffRawInput'),
  morph: document.getElementById('diffMorphInput'),
  gRaw: document.getElementById('diffRawGutter'),
  gMorph: document.getElementById('diffMorphGutter'),
  scrollD1: document.getElementById('diffDiff1Scroll'),
  scrollD2: document.getElementById('diffDiff2Scroll'),
  d1: document.getElementById('diffDiff1Lines'),
  d2: document.getElementById('diffDiff2Lines'),
  optBreaks: document.getElementById('diffOptBreaks'),
  optInline: document.getElementById('diffOptInline'),
  optSync: document.getElementById('diffOptSyncScroll'),
  overlay: document.getElementById('diffCustomOverlay')
};

let diffSavedText = '';
let diffCurrentSelection = { viewId: null, startLine: -1, endLine: -1, text: '', isLineSelection: false, startOffset: 0, endOffset: 0 };
const diffScrollTargets = [diffElements.raw, diffElements.morph, diffElements.scrollD1, diffElements.scrollD2];
let diffIsSyncing = false;
let diffGlobalScrollTop = 0;
let diffGlobalScrollLeft = 0;

function diffUpdateGutter(textarea, gutter) {
  const text = (textarea.value || '').replace(/\r\n?/g, '\n');
  const lines = text.split('\n');
  if (lines.length > 0 && lines[lines.length - 1] === '') lines.pop();
  let html = '';
  for (let i = 1; i <= Math.max(1, lines.length); i++) html += i + '<br>';
  gutter.innerHTML = html;
}

function diffusion() {

if (typeof Diff === 'undefined') {
        !function(e,n){"object"==typeof exports&&"undefined"!=typeof module?n(exports):"function"==typeof define&&define.amd?define(["exports"],n):n((e=e||self).Diff={})}(this,function(e){"use strict";function t(){}t.prototype={diff:function(s,a,e){var n,t=2<arguments.length&&void 0!==e?e:{},r=t.callback;"function"==typeof t&&(r=t,t={}),this.options=t;var u=this;function d(e){return r?(setTimeout(function(){r(void 0,e)},0),!0):e}s=this.castInput(s),a=this.castInput(a),s=this.removeEmpty(this.tokenize(s));var f=(a=this.removeEmpty(this.tokenize(a))).length,c=s.length,p=1,i=f+c;t.maxEditLength&&(i=Math.min(i,t.maxEditLength));var o=null!==(n=t.timeout)&&void 0!==n?n:1/0,l=Date.now()+o,h=[{oldPos:-1,lastComponent:void 0}],v=this.extractCommon(h[0],a,s,0);if(h[0].oldPos+1>=c&&f<=v+1)return d([{value:this.join(a),count:a.length}]);var m=-1/0,g=1/0;function w(){for(var e=Math.max(m,-p);e<=Math.min(g,p);e+=2){var n=void 0,t=h[e-1],r=h[e+1];t&&(h[e-1]=void 0);var i,o=!1;r&&(i=r.oldPos-e,o=r&&0<=i&&i<f);var l=t&&t.oldPos+1<c;if(o||l){if(n=!l||o&&t.oldPos+1<r.oldPos?u.addToPath(r,!0,void 0,0):u.addToPath(t,void 0,!0,1),v=u.extractCommon(n,a,s,e),n.oldPos+1>=c&&f<=v+1)return d(function(e,n,t,r,i){var o,l=[];for(;n;)l.push(n),o=n.previousComponent,delete n.previousComponent,n=o;l.reverse();for(var s=0,a=l.length,u=0,d=0;s<a;s++){var f,c,p=l[s];p.removed?(p.value=e.join(r.slice(d,d+p.count)),d+=p.count,s&&l[s-1].added&&(f=l[s-1],l[s-1]=l[s],l[s]=f)):(!p.added&&i?(c=(c=t.slice(u,u+p.count)).map(function(e,n){var t=r[d+n];return t.length>e.length?t:e}),p.value=e.join(c)):p.value=e.join(t.slice(u,u+p.count)),u+=p.count,p.added||(d+=p.count))}var h=l[a-1];1<a&&"string"==typeof h.value&&(h.added||h.removed)&&e.equals("",h.value)&&(l[a-2].value+=h.value,l.pop());return l}(u,n.lastComponent,a,s,u.useLongestToken));(h[e]=n).oldPos+1>=c&&(g=Math.min(g,e-1)),f<=v+1&&(m=Math.max(m,e+1))}else h[e]=void 0}p++}if(r)!function e(){setTimeout(function(){return i<p||Date.now()>l?r():void(w()||e())},0)}();else for(;p<=i&&Date.now()<=l;){var y=w();if(y)return y}},addToPath:function(e,n,t,r){var i=e.lastComponent;return i&&i.added===n&&i.removed===t?{oldPos:e.oldPos+r,lastComponent:{count:i.count+1,added:n,removed:t,previousComponent:i.previousComponent}}:{oldPos:e.oldPos+r,lastComponent:{count:1,added:n,removed:t,previousComponent:i}}},extractCommon:function(e,n,t,r){for(var i=n.length,o=t.length,l=e.oldPos,s=l-r,a=0;s+1<i&&l+1<o&&this.equals(n[s+1],t[l+1]);)s++,l++,a++;return a&&(e.lastComponent={count:a,previousComponent:e.lastComponent}),e.oldPos=l,s},equals:function(e,n){return this.options.comparator?this.options.comparator(e,n):e===n||this.options.ignoreCase&&e.toLowerCase()===n.toLowerCase()},removeEmpty:function(e){for(var n=[],t=0;t<e.length;t++)e[t]&&n.push(e[t]);return n},castInput:function(e){return e},tokenize:function(e){return e.split("")},join:function(e){return e.join("")}};var r=new t;function i(e,n){if("function"==typeof e)n.callback=e;else if(e)for(var t in e)e.hasOwnProperty(t)&&(n[t]=e[t]);return n}var o=/^[A-Za-z\xC0-\u02C6\u02C8-\u02D7\u02DE-\u02FF\u1E00-\u1EFF]+$/,l=/\S/,s=new t;s.equals=function(e,n){return this.options.ignoreCase&&(e=e.toLowerCase(),n=n.toLowerCase()),e===n||this.options.ignoreWhitespace&&!l.test(e)&&!l.test(n)},s.tokenize=function(e){for(var n=e.split(/([^\S\r\n]+|[()[\]{}'"\r\n]|\b)/),t=0;t<n.length-1;t++)!n[t+1]&&n[t+2]&&o.test(n[t])&&o.test(n[t+2])&&(n[t]+=n[t+2],n.splice(t+1,2),t--);return n};var a=new t;function L(e,n,t){return a.diff(e,n,t)}a.tokenize=function(e){this.options.stripTrailingCr&&(e=e.replace(/\r\n/g,"\n"));var n=[],t=e.split(/(\n|\r\n)/);t[t.length-1]||t.pop();for(var r=0;r<t.length;r++){var i=t[r];r%2&&!this.options.newlineIsToken?n[n.length-1]+=i:(this.options.ignoreWhitespace&&(i=i.trim()),n.push(i))}return n};var u=new t;u.tokenize=function(e){return e.split(/(\S.+?[.!?])(?=\s+|$)/)};var d=new t;function f(e){return(f="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(e){return typeof e}:function(e){return e&&"function"==typeof Symbol&&e.constructor===Symbol&&e!==Symbol.prototype?"symbol":typeof e})(e)}function n(n,e){var t,r=Object.keys(n);return Object.getOwnPropertySymbols&&(t=Object.getOwnPropertySymbols(n),e&&(t=t.filter(function(e){return Object.getOwnPropertyDescriptor(n,e).enumerable})),r.push.apply(r,t)),r}function c(i){for(var e=1;e<arguments.length;e++){var o=null!=arguments[e]?arguments[e]:{};e%2?n(Object(o),!0).forEach(function(e){var n,t,r;n=i,r=o[t=e],t in n?Object.defineProperty(n,t,{value:r,enumerable:!0,configurable:!0,writable:!0}):n[t]=r}):Object.getOwnPropertyDescriptors?Object.defineProperties(i,Object.getOwnPropertyDescriptors(o)):n(Object(o)).forEach(function(e){Object.defineProperty(i,e,Object.getOwnPropertyDescriptor(o,e))})}return i}function x(e){return function(e){if(Array.isArray(e))return p(e)}(e)||function(e){if("undefined"!=typeof Symbol&&Symbol.iterator in Object(e))return Array.from(e)}(e)||function(e,n){if(!e)return;if("string"==typeof e)return p(e,n);var t=Object.prototype.toString.call(e).slice(8,-1);"Object"===t&&e.constructor&&(t=e.constructor.name);if("Map"===t||"Set"===t)return Array.from(e);if("Arguments"===t||/^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t))return p(e,n)}(e)||function(){throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.")}()}function p(e,n){(null==n||n>e.length)&&(n=e.length);for(var t=0,r=new Array(n);t<n;t++)r[t]=e[t];return r}d.tokenize=function(e){return e.split(/([{}:;,]|\s+)/)};var h=Object.prototype.toString,v=new t;function m(e,n,t,r,i){var o,l;for(n=n||[],t=t||[],r&&(e=r(i,e)),o=0;o<n.length;o+=1)if(n[o]===e)return t[o];if("[object Array]"===h.call(e)){for(n.push(e),l=new Array(e.length),t.push(l),o=0;o<e.length;o+=1)l[o]=m(e[o],n,t,r,i);return n.pop(),t.pop(),l}if(e&&e.toJSON&&(e=e.toJSON()),"object"===f(e)&&null!==e){n.push(e),l={},t.push(l);var s,a=[];for(s in e)e.hasOwnProperty(s)&&a.push(s);for(a.sort(),o=0;o<a.length;o+=1)l[s=a[o]]=m(e[s],n,t,r,s);n.pop(),t.pop()}else l=e;return l}v.useLongestToken=!0,v.tokenize=a.tokenize,v.castInput=function(e){var n=this.options,t=n.undefinedReplacement,r=n.stringifyReplacer,i=void 0===r?function(e,n){return void 0===n?t:n}:r;return"string"==typeof e?e:JSON.stringify(m(e,null,null,i),i,"  ")},v.equals=function(e,n){return t.prototype.equals.call(v,e.replace(/,([\r\n])/g,"$1"),n.replace(/,([\r\n])/g,"$1"))};var g=new t;function C(e){var l=1<arguments.length&&void 0!==arguments[1]?arguments[1]:{},s=e.split(/\r\n|[\n\v\f\r\x85]/),a=e.match(/\r\n|[\n\v\f\r\x85]/g)||[],i=[],u=0;function n(){var e={};for(i.push(e);u<s.length;){var n=s[u];if(/^(\-\-\-|\+\+\+|@@)\s/.test(n))break;var t=/^(?:Index:|diff(?: -r \w+)+)\s+(.+?)\s*$/.exec(n);t&&(e.index=t[1]),u++}for(o(e),o(e),e.hunks=[];u<s.length;){var r=s[u];if(/^(Index:|diff|\-\-\-|\+\+\+)\s/.test(r))break;if(/^@@/.test(r))e.hunks.push(function(){var e=u,n=s[u++].split(/@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@/),t={oldStart:+n[1],oldLines:void 0===n[2]?1:+n[2],newStart:+n[3],newLines:void 0===n[4]?1:+n[4],lines:[],linedelimiters:[]};0===t.oldLines&&(t.oldStart+=1);0===t.newLines&&(t.newStart+=1);for(var r=0,i=0;u<s.length&&!(0===s[u].indexOf("--- ")&&u+2<s.length&&0===s[u+1].indexOf("+++ ")&&0===s[u+2].indexOf("@@"));u++){var o=0==s[u].length&&u!=s.length-1?" ":s[u][0];if("+"!==o&&"-"!==o&&" "!==o&&"\\"!==o)break;t.lines.push(s[u]),t.linedelimiters.push(a[u]||"\n"),"+"===o?r++:"-"===o?i++:" "===o&&(r++,i++)}r||1!==t.newLines||(t.newLines=0);i||1!==t.oldLines||(t.oldLines=0);if(l.strict){if(r!==t.newLines)throw new Error("Added line count did not match for hunk at line "+(e+1));if(i!==t.oldLines)throw new Error("Removed line count did not match for hunk at line "+(e+1))}return t}());else{if(r&&l.strict)throw new Error("Unknown line "+(u+1)+" "+JSON.stringify(r));u++}}}function o(e){var n,t,r,i=/^(---|\+\+\+)\s+(.*)$/.exec(s[u]);i&&(n="---"===i[1]?"old":"new",r=(t=i[2].split("\t",2))[0].replace(/\\\\/g,"\\"),/^".*"$/.test(r)&&(r=r.substr(1,r.length-2)),e[n+"FileName"]=r,e[n+"Header"]=(t[1]||"").trim(),u++)}for(;u<s.length;)n();return i}function w(e,n){var t=2<arguments.length&&void 0!==arguments[2]?arguments[2]:{};if("string"==typeof n&&(n=C(n)),Array.isArray(n)){if(1<n.length)throw new Error("applyPatch only works with a single input.");n=n[0]}var r,i,l=e.split(/\r\n|[\n\v\f\r\x85]/),o=e.match(/\r\n|[\n\v\f\r\x85]/g)||[],s=n.hunks,a=t.compareLine||function(e,n,t,r){return n===r},u=0,d=t.fuzzFactor||0,f=0,c=0;for(var p=0;p<s.length;p++){for(var h=s[p],v=l.length-h.oldLines,m=0,g=c+h.oldStart-1,w=function(n,t,r){var i=!0,o=!1,l=!1,s=1;return function e(){if(i&&!l){if(o?s++:i=!1,n+s<=r)return s;l=!0}if(!o)return l||(i=!0),t<=n-s?-s++:(o=!0,e())}}(g,f,v);void 0!==m;m=w())if(function(e,n){for(var t=0;t<e.lines.length;t++){var r=e.lines[t],i=0<r.length?r[0]:" ",o=0<r.length?r.substr(1):r;if(" "===i||"-"===i){if(!a(n+1,l[n],i,o)&&d<++u)return;n++}}return 1}(h,g+m)){h.offset=c+=m;break}if(void 0===m)return!1;f=h.offset+h.oldStart+h.oldLines}for(var y=0,L=0;L<s.length;L++){var x=s[L],S=x.oldStart+x.offset+y-1;y+=x.newLines-x.oldLines;for(var b=0;b<x.lines.length;b++){var k,F=x.lines[b],N=0<F.length?F[0]:" ",P=0<F.length?F.substr(1):F,j=x.linedelimiters&&x.linedelimiters[b]||"\n";" "===N?S++:"-"===N?(l.splice(S,1),o.splice(S,1)):"+"===N?(l.splice(S,0,P),o.splice(S,0,j),S++):"\\"===N&&("+"===(k=x.lines[b-1]?x.lines[b-1][0]:null)?r=!0:"-"===k&&(i=!0))}}if(r)for(;!l[l.length-1];)l.pop(),o.pop();else i&&(l.push(""),o.push("\n"));for(var O=0;O<l.length-1;O++)l[O]=l[O]+o[O];return l.join("")}function y(e,n,u,d,t,r,f){void 0===(f=f||{}).context&&(f.context=4);var c=L(u,d,f);if(c){c.push({value:"",lines:[]});for(var p=[],h=0,v=0,m=[],g=1,w=1,i=0;i<c.length;i++)!function(e){var n,t,r,i,o,l,s=c[e],a=s.lines||s.value.replace(/\n$/,"").split("\n");s.lines=a,s.added||s.removed?(h||(n=c[e-1],h=g,v=w,n&&(m=0<f.context?y(n.lines.slice(-f.context)):[],h-=m.length,v-=m.length)),m.push.apply(m,x(a.map(function(e){return(s.added?"+":"-")+e}))),s.added?w+=a.length:g+=a.length):(h&&(a.length<=2*f.context&&e<c.length-2?m.push.apply(m,x(y(a))):(t=Math.min(a.length,f.context),m.push.apply(m,x(y(a.slice(0,t)))),r={oldStart:h,oldLines:g-h+t,newStart:v,newLines:w-v+t,lines:m},e>=c.length-2&&a.length<=f.context&&(i=/\n$/.test(u),o=/\n$/.test(d),l=0==a.length&&m.length>r.oldLines,!i&&l&&0<u.length&&m.splice(r.oldLines,0,"\\ No newline at end of file"),(i||l)&&o||m.push("\\ No newline at end of file")),p.push(r),v=h=0,m=[])),g+=a.length,w+=a.length)}(i);return{oldFileName:e,newFileName:n,oldHeader:t,newHeader:r,hunks:p}}function y(e){return e.map(function(e){return" "+e})}}function S(e){if(Array.isArray(e))return e.map(S).join("\n");var n=[];e.oldFileName==e.newFileName&&n.push("Index: "+e.oldFileName),n.push("==================================================================="),n.push("--- "+e.oldFileName+(void 0===e.oldHeader?"":"\t"+e.oldHeader)),n.push("+++ "+e.newFileName+(void 0===e.newHeader?"":"\t"+e.newHeader));for(var t=0;t<e.hunks.length;t++){var r=e.hunks[t];0===r.oldLines&&--r.oldStart,0===r.newLines&&--r.newStart,n.push("@@ -"+r.oldStart+","+r.oldLines+" +"+r.newStart+","+r.newLines+" @@"),n.push.apply(n,r.lines)}return n.join("\n")+"\n"}function b(e,n,t,r,i,o,l){return S(y(e,n,t,r,i,o,l))}function k(e,n){if(n.length>e.length)return!1;for(var t=0;t<n.length;t++)if(n[t]!==e[t])return!1;return!0}function F(e){var n=function r(e){var i=0;var o=0;e.forEach(function(e){var n,t;"string"!=typeof e?(n=r(e.mine),t=r(e.theirs),void 0!==i&&(n.oldLines===t.oldLines?i+=n.oldLines:i=void 0),void 0!==o&&(n.newLines===t.newLines?o+=n.newLines:o=void 0)):(void 0===o||"+"!==e[0]&&" "!==e[0]||o++,void 0===i||"-"!==e[0]&&" "!==e[0]||i++)});return{oldLines:i,newLines:o}}(e.lines),t=n.oldLines,r=n.newLines;void 0!==t?e.oldLines=t:delete e.oldLines,void 0!==r?e.newLines=r:delete e.newLines}function N(e,n){if("string"!=typeof e)return e;if(/^@@/m.test(e)||/^Index:/m.test(e))return C(e)[0];if(!n)throw new Error("Must provide a base reference or pass in a patch");return y(void 0,void 0,n,e)}function P(e){return e.newFileName&&e.newFileName!==e.oldFileName}function j(e,n,t){return n===t?n:(e.conflict=!0,{mine:n,theirs:t})}function O(e,n){return e.oldStart<n.oldStart&&e.oldStart+e.oldLines<n.oldStart}function H(e,n){return{oldStart:e.oldStart,oldLines:e.oldLines,newStart:e.newStart+n,newLines:e.newLines,lines:e.lines}}function A(e,n,t,r){var i,o=M(n),l=function(e,n){var t=[],r=[],i=0,o=!1,l=!1;for(;i<n.length&&e.index<e.lines.length;){var s=e.lines[e.index],a=n[i];if("+"===a[0])break;if(o=o||" "!==s[0],r.push(a),i++,"+"===s[0])for(l=!0;"+"===s[0];)t.push(s),s=e.lines[++e.index];a.substr(1)===s.substr(1)?(t.push(s),e.index++):l=!0}"+"===(n[i]||"")[0]&&o&&(l=!0);if(l)return t;for(;i<n.length;)r.push(n[i++]);return{merged:r,changes:t}}(t,o);l.merged?(i=e.lines).push.apply(i,x(l.merged)):E(e,r?l:o,r?o:l)}function E(e,n,t){e.conflict=!0,e.lines.push({conflict:!0,mine:n,theirs:t})}function z(e,n,t){for(;n.offset<t.offset&&n.index<n.lines.length;){var r=n.lines[n.index++];e.lines.push(r),n.offset++}}function T(e,n){for(;n.index<n.lines.length;){var t=n.lines[n.index++];e.lines.push(t)}}function M(e){for(var n=[],t=e.lines[e.index][0];e.index<e.lines.length;){var r=e.lines[e.index];if("-"===t&&"+"===r[0]&&(t="+"),t!==r[0])break;n.push(r),e.index++}return n}function D(e){return e.reduce(function(e,n){return e&&"-"===n[0]},!0)}function I(e,n,t){for(var r=0;r<t;r++){var i=n[n.length-t+r].substr(1);if(e.lines[e.index+r]!==" "+i)return}return e.index+=t,1}g.tokenize=function(e){return e.slice()},g.join=g.removeEmpty=function(e){return e},e.Diff=t,e.applyPatch=w,e.applyPatches=function(e,o){"string"==typeof e&&(e=C(e));var n=0;!function r(){var i=e[n++];if(!i)return o.complete();o.loadFile(i,function(e,n){if(e)return o.complete(e);var t=w(n,i,o);o.patched(i,t,function(e){return e?o.complete(e):void r()})})}()},e.canonicalize=m,e.convertChangesToDMP=function(e){for(var n,t,r=[],i=0;i<e.length;i++)t=(n=e[i]).added?1:n.removed?-1:0,r.push([t,n.value]);return r},e.convertChangesToXML=function(e){for(var n,t=[],r=0;r<e.length;r++){var i=e[r];i.added?t.push("<ins>"):i.removed&&t.push("<del>"),t.push((n=i.value,n.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;"))),i.added?t.push("</ins>"):i.removed&&t.push("</del>")}return t.join("")},e.createPatch=function(e,n,t,r,i,o){return b(e,e,n,t,r,i,o)},e.createTwoFilesPatch=b,e.diffArrays=function(e,n,t){return g.diff(e,n,t)},e.diffChars=function(e,n,t){return r.diff(e,n,t)},e.diffCss=function(e,n,t){return d.diff(e,n,t)},e.diffJson=function(e,n,t){return v.diff(e,n,t)},e.diffLines=L,e.diffSentences=function(e,n,t){return u.diff(e,n,t)},e.diffTrimmedLines=function(e,n,t){var r=i(t,{ignoreWhitespace:!0});return a.diff(e,n,r)},e.diffWords=function(e,n,t){return t=i(t,{ignoreWhitespace:!0}),s.diff(e,n,t)},e.diffWordsWithSpace=function(e,n,t){return s.diff(e,n,t)},e.formatPatch=S,e.merge=function(e,n,t){e=N(e,t),n=N(n,t);var r={};(e.index||n.index)&&(r.index=e.index||n.index),(e.newFileName||n.newFileName)&&(P(e)?P(n)?(r.oldFileName=j(r,e.oldFileName,n.oldFileName),r.newFileName=j(r,e.newFileName,n.newFileName),r.oldHeader=j(r,e.oldHeader,n.oldHeader),r.newHeader=j(r,e.newHeader,n.newHeader)):(r.oldFileName=e.oldFileName,r.newFileName=e.newFileName,r.oldHeader=e.oldHeader,r.newHeader=e.newHeader):(r.oldFileName=n.oldFileName||e.oldFileName,r.newFileName=n.newFileName||e.newFileName,r.oldHeader=n.oldHeader||e.oldHeader,r.newHeader=n.newHeader||e.newHeader)),r.hunks=[];for(var i=0,o=0,l=0,s=0;i<e.hunks.length||o<n.hunks.length;){var a,u=e.hunks[i]||{oldStart:1/0},d=n.hunks[o]||{oldStart:1/0};O(u,d)?(r.hunks.push(H(u,l)),i++,s+=u.newLines-u.oldLines):O(d,u)?(r.hunks.push(H(d,s)),o++,l+=d.newLines-d.oldLines):(function(e,n,t,r,i){var o,l,s={offset:n,lines:t,index:0},a={offset:r,lines:i,index:0};z(e,s,a),z(e,a,s);for(;s.index<s.lines.length&&a.index<a.lines.length;){var u=s.lines[s.index],d=a.lines[a.index];"-"!==u[0]&&"+"!==u[0]||"-"!==d[0]&&"+"!==d[0]?"+"===u[0]&&" "===d[0]?(o=e.lines).push.apply(o,x(M(s))):"+"===d[0]&&" "===u[0]?(l=e.lines).push.apply(l,x(M(a))):"-"===u[0]&&" "===d[0]?A(e,s,a):"-"===d[0]&&" "===u[0]?A(e,a,s,!0):u===d?(e.lines.push(u),s.index++,a.index++):E(e,M(s),M(a)):function(e,n,t){var r,i,o,l=M(n),s=M(t);if(D(l)&&D(s)){if(k(l,s)&&I(t,l,l.length-s.length))return(r=e.lines).push.apply(r,x(l));if(k(s,l)&&I(n,s,s.length-l.length))return(i=e.lines).push.apply(i,x(s))}else if(function(e,n){return e.length===n.length&&k(e,n)}(l,s))return(o=e.lines).push.apply(o,x(l));E(e,l,s)}(e,s,a)}T(e,s),T(e,a),F(e)}(a={oldStart:Math.min(u.oldStart,d.oldStart),oldLines:0,newStart:Math.min(u.newStart+l,d.oldStart+s),newLines:0,lines:[]},u.oldStart,u.lines,d.oldStart,d.lines),o++,i++,r.hunks.push(a))}return r},e.parsePatch=C,e.reversePatch=function e(n){return Array.isArray(n)?n.map(e).reverse():c(c({},n),{},{oldFileName:n.newFileName,oldHeader:n.newHeader,newFileName:n.oldFileName,newHeader:n.oldHeader,hunks:n.hunks.map(function(e){return{oldLines:e.newLines,oldStart:e.newStart,newLines:e.oldLines,newStart:e.oldStart,linedelimiters:e.linedelimiters,lines:e.lines.map(function(e){return e.startsWith("-")?"+".concat(e.slice(1)):e.startsWith("+")?"-".concat(e.slice(1)):e})}})})},e.structuredPatch=y,Object.defineProperty(e,"__esModule",{value:!0})});
    }

  const rawVal = diffElements.raw.value || '';
  const morphVal = diffElements.morph.value || '';
  const respectBreaks = diffElements.optBreaks.checked;
  const isInline = diffElements.optInline.checked;

  diffUpdateGutter(diffElements.raw, diffElements.gRaw);
  diffUpdateGutter(diffElements.morph, diffElements.gMorph);

  let text1 = rawVal.replace(/\r\n?/g, '\n');
  let text2 = morphVal.replace(/\r\n?/g, '\n');

  if (!respectBreaks) {
    text1 = text1.replace(/\n/g, ' ');
    text2 = text2.replace(/\n/g, ' ');
  }

  const lineDiff = Diff.diffLines(text1, text2, { ignoreWhitespace: false, newlineIsToken: false });

  let htmlLeft = '', htmlRight = '';
  let line1 = 0, line2 = 0;
  let changeCount = 0;

  const escapeHTML = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const splitLines = (str) => {
    const arr = str.split('\n');
    if (arr.length > 0 && arr[arr.length - 1] === '') arr.pop();
    return arr;
  };

  for (let i = 0; i < lineDiff.length; i++) {
    const part = lineDiff[i];

    if (!part.removed && !part.added) {
      const lines = splitLines(part.value);
      lines.forEach(line => {
        line1++; line2++;
        const row = `<div class="diff-line-row" data-line="${line1-1}"><div class="diff-gutter-cell">${line1}</div><div class="diff-content-cell">${escapeHTML(line) || '&nbsp;'}</div></div>`;
        htmlLeft += row; htmlRight += row;
      });
      continue;
    }

    let removed = [], added = [];
    if (part.removed) {
      removed = splitLines(part.value);
      if (i + 1 < lineDiff.length && lineDiff[i + 1].added) {
        added = splitLines(lineDiff[i + 1].value);
        i++;
      }
    } else if (part.added) {
      added = splitLines(part.value);
      if (i + 1 < lineDiff.length && lineDiff[i + 1].removed) {
        removed = splitLines(lineDiff[i + 1].value);
        i++;
      }
    }

    const max = Math.max(removed.length, added.length);
    changeCount += max;

    for (let j = 0; j < max; j++) {
      const rLine = j < removed.length ? removed[j] : null;
      const aLine = j < added.length ? added[j] : null;

      if (rLine !== null) line1++;
      if (aLine !== null) line2++;

      let contentL = '&nbsp;', contentR = '&nbsp;';
      let classL = 'diff-empty', classR = 'diff-empty';

      if (rLine !== null && aLine !== null) {
        if (isInline && (rLine.length + aLine.length) < 1000) {
          const words = Diff.diffWords(rLine, aLine, { ignoreWhitespace: false });
          let left = '', right = '';
          words.forEach(w => {
            const esc = escapeHTML(w.value);
            if (w.removed) left += `<span class="diff-word-removed-strong">${esc}</span>`;
            else if (w.added) right += `<span class="diff-word-added-strong">${esc}</span>`;
            else { left += esc; right += esc; }
          });
          contentL = left || '&nbsp;'; contentR = right || '&nbsp;';
        } else {
          contentL = escapeHTML(rLine) || '&nbsp;';
          contentR = escapeHTML(aLine) || '&nbsp;';
        }
        classL = 'diff-removed'; classR = 'diff-added';
      } else if (rLine !== null) {
        contentL = escapeHTML(rLine) || '&nbsp;';
        classL = 'diff-removed';
      } else if (aLine !== null) {
        contentR = escapeHTML(aLine) || '&nbsp;';
        classR = 'diff-added';
      }

      htmlLeft += `<div class="diff-line-row ${classL}" data-line="${line1-1}"><div class="diff-gutter-cell">${rLine !== null ? line1 : '&nbsp;'}</div><div class="diff-content-cell">${contentL}</div></div>`;
      htmlRight += `<div class="diff-line-row ${classR}" data-line="${line2-1}"><div class="diff-gutter-cell">${aLine !== null ? line2 : '&nbsp;'}</div><div class="diff-content-cell">${contentR}</div></div>`;
    }
  }

  diffElements.d1.innerHTML = htmlLeft || '<div class="diff-no-content">No original content</div>';
  diffElements.d2.innerHTML = htmlRight || '<div class="diff-no-content">No modified content</div>';

  const statDiff = document.getElementById('diffStatDiff');
  const statLine = document.getElementById('diffStatLine');
  if (statDiff) statDiff.textContent = changeCount;
  if (statLine) statLine.textContent = Math.max(line1, line2);
}

diffScrollTargets.forEach(target => {
  target.addEventListener('scroll', (e) => {
    if (e.target === diffElements.raw) diffElements.gRaw.scrollTop = diffElements.raw.scrollTop;
    if (e.target === diffElements.morph) diffElements.gMorph.scrollTop = diffElements.morph.scrollTop;

    if (!diffElements.optSync.checked || diffIsSyncing) return;
    diffIsSyncing = true;
    
    diffGlobalScrollTop = e.target.scrollTop;
    diffGlobalScrollLeft = e.target.scrollLeft;

    diffScrollTargets.forEach(t => {
      if (t !== e.target && t.offsetParent !== null) {
        t.scrollTop = diffGlobalScrollTop;
        t.scrollLeft = diffGlobalScrollLeft;
      }
    });

    requestAnimationFrame(() => { diffIsSyncing = false; });
  });
});

function diffNavigate(viewId, btnElement) {
  document.querySelectorAll('.diff-view').forEach(v => v.classList.remove('active'));
  document.querySelectorAll('.diff-topbar-button').forEach(b => b.classList.remove('active'));
  document.getElementById(viewId).classList.add('active');
  if (btnElement) btnElement.classList.add('active');
  diffHideOverlay();
  if (diffElements.optSync.checked) {
    requestAnimationFrame(() => {
      const activeView = document.getElementById(viewId);
      const target = activeView.querySelector('.diff-editor, .diff-scroll-container > div');
      if (target) {
        diffIsSyncing = true;
        target.scrollTop = diffGlobalScrollTop;
        target.scrollLeft = diffGlobalScrollLeft;
        requestAnimationFrame(() => { diffIsSyncing = false; });
      }
    });
  }
}

function diffHandleFile(input, type) {
  const file = input.files[0];
  if (!file) return;
  const r = new FileReader();
  r.onload = (e) => {
    if (type === 'raw') diffElements.raw.value = e.target.result;
    else diffElements.morph.value = e.target.result;
    diffusion();
  };
  r.readAsText(file);
  input.value = ''; 
}

function diffSwapTexts() {
  const temp = diffElements.raw.value;
  diffElements.raw.value = diffElements.morph.value;
  diffElements.morph.value = temp;
  diffusion();
}

function diffClearText(type) {
  if (type === 'raw') diffElements.raw.value = '';
  else diffElements.morph.value = '';
  diffusion();
}

function diffHideOverlay() { 
  if(diffElements.overlay) diffElements.overlay.classList.remove('visible'); 
}

document.addEventListener('selectionchange', () => {
  const sel = window.getSelection();
  if (!sel || sel.isCollapsed) return diffHideOverlay();

  const range = sel.getRangeAt(0);
  const container = range.commonAncestorContainer;
  const element = container.nodeType === 3 ? container.parentElement : container;
  const view = element.closest('.diff-view');
  if (!view || (view.id !== 'diffDiff1View' && view.id !== 'diffDiff2View')) return diffHideOverlay();

  const startRow = (range.startContainer.nodeType === 3 ? range.startContainer.parentElement : range.startContainer).closest('.diff-line-row');
  const endRow = (range.endContainer.nodeType === 3 ? range.endContainer.parentElement : range.endContainer).closest('.diff-line-row');
  if (!startRow || !endRow) return diffHideOverlay();

  const gutter = startRow.querySelector('.diff-gutter-cell');
  let isLineSelection = false;
  if (gutter && (range.intersectsNode(gutter) || gutter.contains(range.startContainer))) isLineSelection = true;

  diffCurrentSelection = {
    viewId: view.id,
    startLine: parseInt(startRow.dataset.line),
    endLine: parseInt(endRow.dataset.line),
    text: sel.toString(),
    isLineSelection: isLineSelection,
    startOffset: range.startOffset,
    endOffset: range.endOffset
  };

  const rect = range.getBoundingClientRect();
  if (rect.width === 0) return;
  
  diffElements.overlay.classList.add('visible');
  const ovRect = diffElements.overlay.getBoundingClientRect();
  let topPos = rect.bottom + 10;
  let leftPos = rect.left + (rect.width / 2) - (ovRect.width / 2);
  if (topPos + ovRect.height > window.innerHeight) topPos = rect.top - ovRect.height - 10;
  if (leftPos + ovRect.width > window.innerWidth) leftPos = window.innerWidth - ovRect.width - 10;
  if (leftPos < 10) leftPos = 10;
  
  diffElements.overlay.style.top = topPos + 'px';
  diffElements.overlay.style.left = leftPos + 'px';
});

document.addEventListener('mousedown', (e) => {
  if (diffElements.overlay && !diffElements.overlay.contains(e.target) && !e.target.closest('.diff-line-row')) diffHideOverlay();
});

const saveBtn = document.getElementById('diffOverlaySave');
if (saveBtn) {
  saveBtn.onclick = () => {
    diffSavedText = diffCurrentSelection.text;
    const statSaved = document.getElementById('diffStatSaved');
    if (statSaved) statSaved.textContent = diffSavedText.substring(0, 20) + (diffSavedText.length > 20 ? '...' : '');
    diffHideOverlay();
  };
}

function diffGetLines(isRaw) {
  const text = (isRaw ? diffElements.raw.value : diffElements.morph.value).replace(/\r\n?/g, '\n');
  return diffElements.optBreaks.checked ? text.split('\n') : [text.replace(/\n/g, ' ')];
}

function diffSetLines(isRaw, linesArray) {
  const result = linesArray.join('\n');
  if (isRaw) diffElements.raw.value = result;
  else diffElements.morph.value = result;
}

const swapLineBtn = document.getElementById('diffOverlaySwapLine');
if (swapLineBtn) {
  swapLineBtn.onclick = () => {
    if (diffCurrentSelection.startLine < 0) return;
    const isSourceRaw = diffCurrentSelection.viewId === 'diffDiff1View';
    const sourceLines = diffGetLines(isSourceRaw);
    const targetLines = diffGetLines(!isSourceRaw);
    for (let i = diffCurrentSelection.startLine; i <= diffCurrentSelection.endLine; i++) {
      sourceLines[i] = targetLines[i] !== undefined ? targetLines[i] : '';
    }
    diffSetLines(isSourceRaw, sourceLines);
    diffusion();
    diffHideOverlay();
  };
}

const swapSavedBtn = document.getElementById('diffOverlaySwapSaved');
if (swapSavedBtn) {
  swapSavedBtn.onclick = () => {
    if (!diffSavedText || diffCurrentSelection.startLine < 0) return;
    const isSourceRaw = diffCurrentSelection.viewId === 'diffDiff1View';
    const lines = diffGetLines(isSourceRaw);
    const start = diffCurrentSelection.startLine;
    if (diffCurrentSelection.isLineSelection) {
      const savedLines = diffSavedText.split('\n');
      for (let i = 0; i < savedLines.length; i++) {
        lines[start + i] = savedLines[i];
      }
    } else {
      const lineText = lines[start] || '';
      lines[start] = lineText.substring(0, diffCurrentSelection.startOffset) + diffSavedText + lineText.substring(diffCurrentSelection.endOffset);
    }
    diffSetLines(isSourceRaw, lines);
    diffusion();
    diffHideOverlay();
  };
}

let diffDebounce;
[diffElements.raw, diffElements.morph].forEach(t => {
  if(t) t.addEventListener('input', () => {
    clearTimeout(diffDebounce);
    diffDebounce = setTimeout(diffusion, 50);
  });
});

[diffElements.optBreaks, diffElements.optInline].forEach(opt => {
  if(opt) opt.addEventListener('change', diffusion);
});

diffusion();
