// ===================== HTML Tools (Remove / Escape / Unescape) =====================

export function htmlToPlainText(html) {
  if (!html) return "";
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  doc.querySelectorAll("script, style, noscript, template").forEach((el) => el.remove());

  const state = {
    olCounters: [],
    inPre: false,
    out: "",
    lastWasNewline: true
  };

  function append(text) {
    if (!text) return;
    if (state.inPre) {
      state.out += text;
      state.lastWasNewline = text.endsWith("\n");
      return;
    }
    state.out += text;
    state.lastWasNewline = state.out.endsWith("\n");
  }

  function ensureNewline(count = 1) {
    if (!state.lastWasNewline) {
      state.out += "\n".repeat(count);
      state.lastWasNewline = true;
    } else if (count > 1) {
      const trailing = state.out.match(/\n+$/);
      const have = trailing ? trailing[0].length : 0;
      if (have < count) state.out += "\n".repeat(count - have);
    }
  }

  function walk(node, depth = 0) {
    if (!node) return;
    const nodeType = node.nodeType;
    if (nodeType === Node.TEXT_NODE) {
      let text = node.nodeValue;
      if (!text) return;
      if (state.inPre) {
        append(text);
        return;
      }
      text = text.replace(/\s+/g, " ");
      if (state.lastWasNewline) text = text.replace(/^\s+/, "");
      append(text);
      return;
    }

    if (nodeType === Node.ELEMENT_NODE) {
      const tag = node.tagName.toLowerCase();
      switch (tag) {
        case "title":
          ensureNewline(0);
          append(node.textContent.trim());
          ensureNewline(2);
          break;
        case "h1":
        case "h2":
        case "h3":
        case "h4":
        case "h5":
        case "h6":
          ensureNewline(0);
          append(node.textContent.trim());
          ensureNewline(2);
          break;
        case "p":
        case "div":
        case "section":
        case "article":
        case "header":
        case "footer":
          ensureNewline(0);
          for (let ch = node.firstChild; ch; ch = ch.nextSibling) walk(ch, depth + 1);
          ensureNewline(2);
          break;
        case "br":
          append("\n");
          ensureNewline(0);
          break;
        case "pre":
          ensureNewline(0);
          state.inPre = true;
          append(node.textContent.replace(/\r\n?/g, "\n"));
          state.inPre = false;
          ensureNewline(2);
          break;
        case "code":
          if (node.closest && node.closest("pre")) {
            for (let ch = node.firstChild; ch; ch = ch.nextSibling) walk(ch, depth + 1);
          } else {
            append("`" + node.textContent.trim() + "`");
          }
          break;
        case "blockquote": {
          ensureNewline(0);
          const quoteText = (function () {
            const tmpState = { out: "" };
            function tmpWalk(n) {
              if (n.nodeType === Node.TEXT_NODE) tmpState.out += n.nodeValue.replace(/\s+/g, " ");
              else if (n.nodeType === Node.ELEMENT_NODE) {
                for (let c = n.firstChild; c; c = c.nextSibling) tmpWalk(c);
              }
            }
            tmpWalk(node);
            return tmpState.out.trim();
          })();
          quoteText.split(/\n+/).forEach((line) => {
            if (line.trim()) append("> " + line.trim() + "\n");
          });
          ensureNewline(1);
          break;
        }
        case "ul":
          for (let ch = node.firstChild; ch; ch = ch.nextSibling) walk(ch, depth + 1);
          ensureNewline(0);
          break;
        case "ol":
          state.olCounters.push(0);
          for (let ch = node.firstChild; ch; ch = ch.nextSibling) walk(ch, depth + 1);
          state.olCounters.pop();
          ensureNewline(0);
          break;
        case "li": {
          const parentTag = node.parentElement ? node.parentElement.tagName.toLowerCase() : "";
          if (parentTag === "ol") {
            if (state.olCounters.length === 0) state.olCounters.push(0);
            state.olCounters[state.olCounters.length - 1]++;
            const numbering = state.olCounters.join(".") + ".";
            const indent = "  ".repeat(state.olCounters.length - 1);
            append(indent + numbering + " ");
            for (let ch = node.firstChild; ch; ch = ch.nextSibling) walk(ch, depth + 1);
            ensureNewline(1);
          } else {
            let level = 0;
            let p = node.parentElement;
            while (p) {
              if (p.tagName && p.tagName.toLowerCase() === "ul") level++;
              p = p.parentElement;
            }
            const indent = "  ".repeat(Math.max(0, level - 1));
            append(indent + "• ");
            for (let ch = node.firstChild; ch; ch = ch.nextSibling) walk(ch, depth + 1);
            ensureNewline(1);
          }
          break;
        }
        case "table":
          ensureNewline(0);
          for (let r of node.querySelectorAll("tr")) {
            const cells = [];
            for (let c of r.children) cells.push(c.textContent.replace(/\s+/g, " ").trim());
            append(cells.join("\t") + "\n");
          }
          ensureNewline(1);
          break;
        case "a": {
          const href = node.getAttribute("href");
          const anchorText = node.textContent.replace(/\s+/g, " ").trim();
          if (href) append(anchorText + " (" + href + ")");
          else append(anchorText);
          break;
        }
        case "img": {
          const alt = node.getAttribute("alt");
          if (alt) append(alt);
          break;
        }
        default:
          for (let ch = node.firstChild; ch; ch = ch.nextSibling) walk(ch, depth + 1);
          break;
      }
    }
  }

  const title = (doc.querySelector("title") && doc.querySelector("title").textContent) || "";
  if (title.trim()) {
    append(title.trim());
    ensureNewline(2);
  }

  walk(doc.body || doc.documentElement, 0);

  let out = state.out || "";
  out = out.replace(/\r\n|\r/g, "\n");
  out = out.replace(/[ \t]+/g, " ");
  out = out.replace(/\n{3,}/g, "\n\n");
  out = out.trim();
  out = out.replace(/&#(\d+);/g, (_, d) => String.fromCharCode(parseInt(d, 10)));

  return out;
}

export function escapeHtmlText(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function unescapeHtmlText(text) {
  return text
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&");
}

export async function handleHTML() {
  if (!currentNote || !noteTextarea) return;
  const r = await showModal({
    header: `<div class="modal-title">HTML Tools</div>`,
    body: `<div style="display:flex;flex-direction:column;gap:10px;"><div><label class="modal-label">Choose Action</label><div class="custom-dropdown"><div id="htmlAction" class="custom-dropdown-trigger modal-input" data-options='[{"label":"Select Action","value":""},{"label":"Remove HTML","value":"remove_html"},{"label":"Escape HTML","value":"escape_html"},{"label":"Unescape HTML","value":"unescape_html"}]' data-value="">Select Action</div></div></div></div>`,
    footer: `<button onclick="closeModal()">Cancel</button><button onclick="handleHTMLSubmit()">Apply</button>`,
    html: true
  });
  if (!r || r.action !== "submit") return;
  const { htmlAction } = r;
  let text = noteTextarea.value;

  if (htmlAction === "remove_html") {
    try {
      text = htmlToPlainText(text);
    } catch (err) {
      console.error("RemoveHTML error:", err);
      showNotification("RemoveHTML failed: " + (err && err.message ? err.message : String(err)));
      return;
    }
  } else if (htmlAction === "escape_html") {
    text = escapeHtmlText(text);
  } else if (htmlAction === "unescape_html") {
    text = unescapeHtmlText(text);
  }

  noteTextarea.value = text;
  if (typeof updateNoteMetadata === "function") updateNoteMetadata();
  showNotification("HTML processed successfully!");
}

export function handleHTMLSubmit() {
  const htmlAction = modalScope.htmlAction ? modalScope.htmlAction.dataset.value : "";
  if (!htmlAction) return showNotification("Please select an action!");
  closeModal({ action: "submit", htmlAction });
}

document.addEventListener("click", (e) => {
  if (!modalScope) return;
  const actionElem = modalScope.htmlAction;
  if (!actionElem) return;
  // Reserved for future conditional UI (e.g. options specific to an action)
});
