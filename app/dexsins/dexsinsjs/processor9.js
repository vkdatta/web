/**
 * Pre‑processor: synchronously resolves <dextools-import> tags
 * Place this script FIRST in <head>. Do NOT use async/defer.
 */
(function() {
  'use strict';
  var TAG = 'dextools-import';
  var MAX_DEPTH = 32;

  function resolveURL(src) {
    try {
      return new URL(src.trim(), document.baseURI || location.href).href;
    } catch (_) {
      return src.trim();
    }
  }

  function applyData(html, el) {
    var dataset = el.dataset;
    return html.replace(/\{\{\s*([a-zA-Z0-9_-]+)\s*\}\}/g, function(match, key) {
      var camel = key.replace(/-([a-z])/g, function(_, l) { return l.toUpperCase(); });
      if (key in dataset) return dataset[key];
      if (camel in dataset) return dataset[camel];
      return match;
    });
  }

  function inject(anchor, html) {
    var tpl = document.createElement('template');
    tpl.innerHTML = html;
    var frag = document.createDocumentFragment();
    var nodes = Array.prototype.slice.call(tpl.content.childNodes);
    for (var i = 0; i < nodes.length; i++) {
      var node = nodes[i];
      if (node.nodeType === Node.ELEMENT_NODE && node.nodeName === 'SCRIPT') {
        var s = document.createElement('script');
        for (var j = 0; j < node.attributes.length; j++) {
          var attr = node.attributes[j];
          s.setAttribute(attr.name, attr.value);
        }
        s.textContent = node.textContent;
        frag.appendChild(s);
      } else {
        frag.appendChild(document.importNode(node, true));
      }
    }
    anchor.parentNode.insertBefore(frag, anchor);
    anchor.parentNode.removeChild(anchor);
  }

  function processTag(el) {
    var src = el.getAttribute('src');
    if (!src || !src.trim()) {
      console.warn('[preprocessor] missing src, removing tag');
      el.parentNode.removeChild(el);
      return;
    }

    var depth = parseInt(el.getAttribute('data-dxt-depth') || '0', 10);
    if (depth > MAX_DEPTH) {
      console.error('[preprocessor] max depth exceeded:', src);
      el.parentNode.removeChild(el);
      return;
    }

    var url = resolveURL(src);
    var xhr = new XMLHttpRequest();
    try {
      xhr.open('GET', url, false);   // synchronous
      xhr.send(null);
    } catch (e) {
      console.error('[preprocessor] network error:', url, e);
      el.parentNode.removeChild(el);
      return;
    }

    if (xhr.status >= 200 && xhr.status < 300) {
      var html = xhr.responseText;
      inject(el, applyData(html, el));
    } else {
      console.error('[preprocessor] HTTP', xhr.status, url);
      el.parentNode.removeChild(el);
    }
  }

  // Process all existing tags in document order
  var tags = document.getElementsByTagName(TAG);
  // Convert to array because getElementsByTagName is live and we'll be removing elements
  var tagsArray = [];
  for (var i = 0; i < tags.length; i++) tagsArray.push(tags[i]);
  for (var i = 0; i < tagsArray.length; i++) processTag(tagsArray[i]);

  // Optional: define a no‑op custom element so any future dynamic additions fail gracefully
  if (!customElements.get(TAG)) {
    customElements.define(TAG, class extends HTMLElement {
      connectedCallback() {
        console.warn('[preprocessor] dynamic <dextools-import> ignored – pre‑processor already ran.');
        this.remove();
      }
    });
  }
})();
