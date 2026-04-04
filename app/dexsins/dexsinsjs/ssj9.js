(function () {
  'use strict';

  var TAG = 'dextools-import';
  var DEPTH_ATTR = 'data-dxt-depth';
  var MAX_DEPTH = 32;
  var LOG_PREFIX = '[dextools-preprocessor]';

  function resolveURL(src) {
    try {
      return new URL(src, document.baseURI || window.location.href).href;
    } catch (_) {
      return src;
    }
  }

  function fetchSync(url) {
    var xhr = new XMLHttpRequest();
    try {
      xhr.open('GET', url, false);
      xhr.send(null);
    } catch (networkErr) {
      console.error(LOG_PREFIX, 'Network error fetching "' + url + '":', networkErr);
      return null;
    }
    if (xhr.status >= 200 && xhr.status < 300) {
      return xhr.responseText;
    }
    console.error(
      LOG_PREFIX,
      'HTTP ' + xhr.status + ' (' + xhr.statusText + ') fetching "' + url + '"'
    );
    return null;
  }

  function injectHTML(anchorElement, html, depth) {
    var tpl = document.createElement('template');
    tpl.innerHTML = html;

    var parent = anchorElement.parentNode;
    var fragment = document.createDocumentFragment();
    var nodes = Array.prototype.slice.call(tpl.content.childNodes);

    nodes.forEach(function (node) {
      if (
        node.nodeType === Node.ELEMENT_NODE &&
        node.nodeName === 'SCRIPT'
      ) {
        var live = document.createElement('script');
        var attrs = Array.prototype.slice.call(node.attributes);
        attrs.forEach(function (attr) {
          live.setAttribute(attr.name, attr.value);
        });
        if (node.textContent) {
          live.textContent = node.textContent;
        }
        fragment.appendChild(live);

      } else if (
        node.nodeType === Node.ELEMENT_NODE &&
        node.nodeName.toLowerCase() === TAG.toUpperCase()
      ) {
        node.setAttribute(DEPTH_ATTR, String(depth + 1));
        fragment.appendChild(document.importNode(node, true));

      } else {
        fragment.appendChild(document.importNode(node, true));
      }
    });

    parent.insertBefore(fragment, anchorElement);
    parent.removeChild(anchorElement);
  }

  var DextoolsImport = (function (_super) {
    function DextoolsImport() {
      return _super.call(this) || this;
    }

    DextoolsImport.prototype = Object.create(HTMLElement.prototype);
    DextoolsImport.prototype.constructor = DextoolsImport;

    DextoolsImport.prototype.connectedCallback = function () {
      var src = this.getAttribute('src');

      if (!src || !src.trim()) {
        console.warn(LOG_PREFIX, '<dextools-import> has no src attribute — skipping.');
        this.parentNode && this.parentNode.removeChild(this);
        return;
      }

      var depth = parseInt(this.getAttribute(DEPTH_ATTR) || '0', 10);
      if (depth > MAX_DEPTH) {
        console.error(
          LOG_PREFIX,
          'Max import depth (' + MAX_DEPTH + ') exceeded. Possible circular import at "' + src + '"'
        );
        this.parentNode && this.parentNode.removeChild(this);
        return;
      }

      var url = resolveURL(src.trim());
      var html = fetchSync(url);

      if (html !== null) {
        injectHTML(this, html, depth);
      } else {
        this.parentNode && this.parentNode.removeChild(this);
      }
    };

    return DextoolsImport;
  }(HTMLElement));

  if (!customElements.get(TAG)) {
    customElements.define(TAG, DextoolsImport);
  }

})();
