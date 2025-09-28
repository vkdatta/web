window.notes = [];
window.currentNote = null;
window.visibleNotes = localStorage.getItem('visibleNotes') ? parseInt(localStorage.getItem('visibleNotes')) : 1;
window.isHomepage = true;
window.currentApp = 'home';
window.fontSize = localStorage.getItem('fontSize') ? parseInt(localStorage.getItem('fontSize')) : 14;
window.undoStack = [];
window.redoStack = [];
window.dob = localStorage.getItem('dob') || '';
window.maxNotes = 15;
window.homepage = document.getElementById('homepage');
window.noteAppContainer = document.getElementById('noteAppContainer');
window.diffCheckerContainer = document.getElementById('diffCheckerContainer');
window.topbar = document.getElementById('topbar');
window.themeToggle = document.getElementById('themeToggle');
window.undoBtn = document.getElementById('undoBtn');
window.redoBtn = document.getElementById('redoBtn');
window.homeBtn = document.getElementById('homeBtn');
window.sidebar1 = document.getElementById('sidebar1');
window.sidebar1Toggle = document.getElementById('sidebar1Toggle');
window.noteList = document.getElementById('noteList');
window.noteTextarea = document.getElementById('noteTextarea');
window.showNextNoteBtn = document.getElementById('showNextNoteBtn');
window.hideLastNoteBtn = document.getElementById('hideLastNoteBtn');
window.sidebar2Toggle = document.getElementById('sidebar2Toggle');
window.secondarySidebar = document.getElementById('secondarySidebar');
window.notification = document.getElementById('notification');
window.noteAppBtn = document.getElementById('noteAppBtn');
window.diffCheckerBtn = document.getElementById('diffCheckerBtn');
window.infoName = document.getElementById('infoName');
window.infoCharsWith = document.getElementById('infoCharsWith');
window.infoCharsWithout = document.getElementById('infoCharsWithout');
window.infoWords = document.getElementById('infoWords');
window.infoReadTime = document.getElementById('infoReadTime');
window.infoExtension = document.getElementById('infoExtension');

function initApp() {
  (function () {
    const css = `:root { 
      --modal-bg: #272727; 
      --modal-surface: #171717; 
      --modal-ink: #eeeeee; 
      --modal-muted: #9aa8b7; 
      --accent-2: linear-gradient(45deg, #6a5acd, #60a5fa); 
      --danger: #ff6b6b; 
      --glass: rgba(255,255,255,0.02); 
      --border: rgba(255,255,255,0.06); 
      --shadow: 0 10px 30px rgba(2,6,23,0.6); 
      --radius: 12px; 
      --gap: 12px; 
      --transition-speed: 180ms; 
      --z-modal: 99999; 
      --focus-ring: 3px; 
      --input-bg: #373737; 
    } 
    
    .modal-backdrop { 
      position: fixed; 
      inset: 0; 
      display: none; 
      align-items: flex-start; 
      justify-content: center; 
      background: linear-gradient(180deg, rgba(3,6,12,0.6), rgba(6,8,14,0.7)); 
      z-index: var(--z-modal); 
      padding: 20px; 
      -webkit-tap-highlight-color: transparent; 
    } 
    
    .modal-backdrop.active { 
      display: flex; 
    } 
    
    .modal-window { 
      width: 780px; 
      max-width: calc(100% - 40px); 
      background: linear-gradient(180deg, var(--modal-surface), var(--modal-bg)); 
      color: var(--modal-ink); 
      border-radius: var(--radius); 
      box-shadow: var(--shadow); 
      overflow: hidden; 
      display: flex; 
      flex-direction: column; 
      max-height: calc(100vh - 4vh); 
      border: 1px solid var(--border); 
      transform: translateY(-8px); 
      opacity: 0; 
      transition: transform var(--transition-speed) ease, opacity var(--transition-speed) ease; 
      margin-top: 2vh; 
    } 
    
    .modal-backdrop.active .modal-window { 
      transform: translateY(0); 
      opacity: 1; 
    } 
    
    .modal-header { 
      padding: 14px 18px; 
      border-bottom: 1px solid rgba(255,255,255,0.03); 
      display: flex; 
      align-items: center; 
      justify-content: space-between; 
      gap: var(--gap); 
    } 
    
    .modal-title { 
      margin: 0; 
      font-size: 1.05rem; 
      font-weight: 700; 
      color: var(--modal-ink); 
      line-height: 1; 
    } 
    
    .modal-close { 
      background: transparent; 
      border: none; 
      color: var(--modal-muted); 
      font-size: 18px; 
      padding: 6px; 
      cursor: pointer; 
      border-radius: 8px; 
    } 
    
    .modal-close:focus { 
      outline: none; 
      box-shadow: 0 0 0 var(--focus-ring) rgba(102,126,234,0.12); 
    } 
    
    .modal-body { 
      padding: 16px 18px; 
      overflow: auto; 
      display: flex; 
      flex-direction: column; 
      gap: 12px; 
      color: var(--modal-ink); 
      font-size: 14px; 
    } 
    
    .modal-row { 
      display: flex; 
      gap: 10px; 
      align-items: center; 
      flex-wrap: nowrap; 
      justify-content: center; 
    } 
    
    .modal-row[data-position="left"] { 
      justify-content: flex-start; 
    } 
    
    .modal-row[data-position="right"] { 
      justify-content: flex-end; 
    } 
    
    .modal-row .modal-element { 
      flex: 1 1 auto; 
      min-width: 110px; 
    } 
    
    .modal-label { 
      display: block; 
      font-size: 13px; 
      color: var(--modal-muted); 
      margin-bottom: 6px; 
    } 
    
    .modal-message { 
      color: var(--modal-ink); 
      background: transparent; 
      padding: 2px 0; 
      font-size: 14px; 
    } 
    
    .modal-input, .modal-select, .modal-textarea, .custom-dropdown-trigger { 
      width: 100%; 
      padding: 10px 12px; 
      border-radius: 8px; 
      border: 1px solid var(--border); 
      background: var(--input-bg); 
      color: var(--modal-ink); 
      font-size: 14px; 
      box-sizing: border-box; 
      outline: none; 
      font-family: 'Source Code Pro', monospace; 
      transition: box-shadow var(--transition-speed), transform var(--transition-speed), background var(--transition-speed); 
    } 
    
    .modal-input::placeholder, .modal-textarea::placeholder { 
      color: rgba(230,238,248,0.32); 
    } 
    
    .modal-input:focus, .modal-select:focus, .modal-textarea:focus, .custom-dropdown-trigger:focus { 
      box-shadow: 0 0 0 var(--focus-ring) rgba(100,116,255,0.08); 
      border-color: rgba(100,116,255,0.18); 
      transform: translateY(-1px); 
    } 
    
    .modal-textarea { 
      min-height: 84px; 
      resize: vertical; 
    } 
    
    .custom-dropdown-trigger {
      -webkit-appearance: none; 
      -moz-appearance: none; 
      appearance: none; 
      padding-right: 32px; 
      position: relative;
    }
    
    .custom-dropdown-trigger::after {
      content: '\\25BC';
      position: absolute;
      right: 12px;
      top: 50%;
      transform: translateY(-50%);
      color: var(--modal-muted);
      font-size: 12px;
      pointer-events: none;
    }
    
    .custom-dropdown { 
      position: relative; 
    } 
    
    .custom-dropdown-portal-menu { 
      position: absolute !important; 
      min-width: 180px; 
      box-shadow: 0 8px 20px rgba(2,6,23,0.6); 
      z-index: 100001 !important; 
      background: var(--modal-surface); 
      border-radius: 8px; 
      border: 1px solid var(--border); 
      max-height: 70vh; 
      overflow: auto; 
      left: 0; 
      top: 0; 
      display: none; 
    } 
    
    .custom-dropdown-portal-menu.active { 
      display: block; 
    } 
    
    .custom-dropdown-option { 
      padding: 8px 10px; 
      font-size: 14px; 
      cursor: pointer; 
      color: var(--modal-ink); 
    } 
    
    .custom-dropdown-option[aria-selected="true"] { 
      background: rgba(96,165,250,0.06); 
    } 
    
    .custom-dropdown-option:hover { 
      background: rgba(255,255,255,0.02); 
    } 
    
    .modal-btn, .modal-inline-button, .modal-action { 
      padding: 8px 12px; 
      border-radius: 10px; 
      border: 1px solid transparent; 
      cursor: pointer; 
      font-size: 14px; 
      transition: transform var(--transition-speed), box-shadow var(--transition-speed); 
    } 
    
    .modal-btn:focus { 
      outline: none; 
      box-shadow: 0 0 0 var(--focus-ring) rgba(99,102,241,0.12); 
    } 
    
    .modal-btn:hover { 
      transform: translateY(-1px); 
    } 
    
    .modal-footer { 
      padding: 12px 16px; 
      border-top: 1px solid rgba(255,255,255,0.03); 
      display: flex; 
      gap: 10px; 
      justify-content: flex-end; 
      flex-wrap: wrap; 
    } 
    
    .hidden { 
      display: none !important; 
    } 
    
    .small { 
      font-size: 13px; 
    } 
    
    .center { 
      text-align: center; 
    } 
    
    .modal-input[type="checkbox"], .modal-input[type="radio"] { 
      appearance: none; 
      width: 16px; 
      height: 16px; 
      border: 2px solid var(--border); 
      background: var(--input-bg); 
      position: relative; 
      border-radius: 4px; 
      display: inline-block; 
      vertical-align: middle; 
    } 
    
    .modal-input[type="checkbox"]:checked { 
      background: var(--accent-2); 
    } 
    
    .modal-input[type="checkbox"]:checked::before { 
      content: '\\2713'; 
      position: absolute; 
      top: -2px; 
      left: 1px; 
      color: #000; 
      font-size: 14px; 
    } 
    
    .modal-input[type="radio"] { 
      border-radius: 50%; 
    } 
    
    .modal-input[type="radio"]:checked::before { 
      content: ''; 
      position: absolute; 
      top: 3px; 
      left: 3px; 
      width: 8px; 
      height: 8px; 
      background: var(--accent-2); 
      border-radius: 50%; 
    } 
    
    @media (max-width: 560px) { 
      .modal-window { 
        width: 100%; 
        max-width: 100%; 
        border-radius: 8px; 
        padding: 0; 
      } 
      .modal-body { 
        padding: 12px; 
      } 
      .modal-header { 
        padding: 10px 12px; 
      } 
      .modal-footer { 
        padding: 10px; 
      } 
    }`;

    if (!document.getElementById("modal-dark-css")) {
      const s = document.createElement("style");
      s.id = "modal-dark-css";
      s.textContent = css;
      document.head.appendChild(s);
    }

    function renderDropdownMenuPortal(trigger, options, callback) {
      document
        .querySelectorAll(".custom-dropdown-portal-menu")
        .forEach((e) => e.remove());

      const menu = document.createElement("div");
      menu.className = "custom-dropdown-portal-menu active";
      menu.setAttribute("role", "listbox");

      options.forEach((o) => {
        const opt = document.createElement("div");
        opt.className = "custom-dropdown-option";
        opt.tabIndex = 0;
        opt.dataset.value = typeof o === "object" ? o.value : o;
        opt.textContent = typeof o === "object" ? o.label : o;
        opt.setAttribute("role", "option");

        opt.addEventListener("click", () => {
          callback(o);
          menu.remove();
        });

        opt.addEventListener("keydown", (ev) => {
          if (ev.key === "Enter") {
            ev.preventDefault();
            opt.click();
          }
        });

        menu.appendChild(opt);
      });

      document.body.appendChild(menu);
      const rect = trigger.getBoundingClientRect();
      menu.style.width = rect.width + "px";
      let left = rect.left + window.scrollX;
      const rightEdge = left + rect.width;
      const viewportWidth = window.innerWidth;

      if (rightEdge > viewportWidth) {
        left -= rightEdge - viewportWidth;
      }
      if (left < 0) left = 0;

      menu.style.left = left + "px";
      menu.style.top = rect.bottom + window.scrollY + "px";

      function closeOnOutside(ev) {
        if (!menu.contains(ev.target) && ev.target !== trigger) {
          menu.remove();
          document.removeEventListener("mousedown", closeOnOutside);
        }
      }

      document.addEventListener("mousedown", closeOnOutside);

      window.addEventListener(
        "scroll",
        () => {
          if (document.body.contains(menu)) {
            const rect = trigger.getBoundingClientRect();
            let leftNew = rect.left + window.scrollX;
            const rightNewEdge = leftNew + rect.width;

            if (rightNewEdge > window.innerWidth) {
              leftNew -= rightNewEdge - window.innerWidth;
            }
            if (leftNew < 0) leftNew = 0;

            menu.style.left = leftNew + "px";
            menu.style.top = rect.bottom + window.scrollY + "px";
            menu.style.width = rect.width + "px";
          }
        },
        { passive: true }
      );

      return menu;
    }

    // Modal system variables
    let modalBackdrop = null;
    let modalResolver = null;
    let modalScope = {};

    function ensureModal() {
      if (modalBackdrop) return;

      modalBackdrop = document.createElement("div");
      modalBackdrop.className = "modal-backdrop";
      modalBackdrop.setAttribute("aria-hidden", "true");

      document.body.appendChild(modalBackdrop);

      modalBackdrop.addEventListener("click", (e) => {
        if (e.target === modalBackdrop) closeModal();
      });

      document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && modalBackdrop.classList.contains("active")) {
          closeModal();
        }
      });
    }

    function closeModal(result = null) {
      if (modalBackdrop) {
        modalBackdrop.classList.remove("active");
        document.documentElement.style.overflow = "";
      }

      modalScope = {};

      if (modalResolver) {
        modalResolver(result);
        modalResolver = null;
      }

      setTimeout(() => {
        if (modalBackdrop) {
          modalBackdrop.innerHTML = "";
        }
      }, 300);
    }

    function applyModalStyles(element) {
      if (element.tagName === "INPUT") {
        element.classList.add("modal-input");
      } else if (element.tagName === "TEXTAREA") {
        element.classList.add("modal-textarea");
      } else if (element.tagName === "SELECT") {
        element.classList.add("modal-select");
      } else if (element.tagName === "BUTTON") {
        element.classList.add("modal-btn");
      }

      element
        .querySelectorAll("input, textarea, select, button")
        .forEach((child) => {
          applyModalStyles(child);
        });
    }

    function createModalScope(container) {
      const scope = {};

      container.querySelectorAll("[id]").forEach((element) => {
        if (element.id) {
          scope[element.id] = element;
        }
      });

      return scope;
    }

    function validateModalFields(container) {
      let isValid = true;
      const fields = container.querySelectorAll(
        "input, textarea, .custom-dropdown-trigger"
      );

      fields.forEach((field) => {
        field.style.borderColor = "";

        if (field.hasAttribute("data-skip-validation")) {
          return;
        }

        let isEmpty = false;

        if (
          field.tagName === "INPUT" &&
          (field.type === "text" ||
            field.type === "email" ||
            field.type === "url")
        ) {
          isEmpty = field.value.trim() === "";
        } else if (field.classList.contains("custom-dropdown-trigger")) {
          isEmpty = (field.dataset.value || "").trim() === "";
        } else if (field.tagName === "TEXTAREA") {
          isEmpty = field.value.trim() === "";
        }

        if (isEmpty) {
          field.style.borderColor = "var(--danger)";
          isValid = false;

          const clearValidation = () => {
            field.style.borderColor = "";
            field.removeEventListener("input", clearValidation);
            field.removeEventListener("change", clearValidation);
          };

          field.addEventListener("input", clearValidation);
          field.addEventListener("change", clearValidation);
        }
      });

      return isValid;
    }

    function collectFormValues(container) {
      const values = {};

      container.querySelectorAll("[id]").forEach((element) => {
        if (element.id) {
          if (element.tagName === "INPUT") {
            if (element.type === "checkbox" || element.type === "radio") {
              values[element.id] = element.checked;
            } else {
              values[element.id] = element.value;
            }
          } else if (
            element.tagName === "TEXTAREA" ||
            element.tagName === "SELECT"
          ) {
            values[element.id] = element.value;
          } else if (element.classList.contains("custom-dropdown-trigger")) {
            values[element.id] = element.dataset.value || element.textContent;
          }
        }
      });

      return values;
    }

    window.showModal = function (options = {}) {
      ensureModal();

      return new Promise((resolve) => {
        modalResolver = resolve;
        modalScope = {};

        modalBackdrop.innerHTML = "";

        const modalWindow = document.createElement("div");
        modalWindow.className = "modal-window";
        modalWindow.setAttribute("role", "dialog");
        modalWindow.setAttribute("aria-modal", "true");

        const headerDiv = document.createElement("div");
        headerDiv.className = "modal-header";

        if (options.header) {
          if (typeof options.header === "string") {
            headerDiv.innerHTML = options.header;
          } else if (options.header instanceof HTMLElement) {
            headerDiv.appendChild(options.header);
          }
        } else {
          const titleEl = document.createElement("h3");
          titleEl.className = "modal-title";
          titleEl.textContent = options.title || "";
          titleEl.id = "modal-title-" + Math.random().toString(36).slice(2);

          const closeBtn = document.createElement("button");
          closeBtn.className = "modal-close";
          closeBtn.setAttribute("aria-label", "Close dialog");
          closeBtn.innerHTML = "&#x2715;";
          closeBtn.addEventListener("click", closeModal);

          headerDiv.appendChild(titleEl);
          headerDiv.appendChild(closeBtn);
          modalWindow.setAttribute("aria-labelledby", titleEl.id);
        }

        const bodyDiv = document.createElement("div");
        bodyDiv.className = "modal-body";

        if (options.body) {
          if (typeof options.body === "string") {
            bodyDiv.innerHTML = options.body;
          } else if (options.body instanceof HTMLElement) {
            bodyDiv.appendChild(options.body);
          } else if (Array.isArray(options.body)) {
            bodyDiv.innerHTML = options.body.join("");
          }
        }

        const footerDiv = document.createElement("div");
        footerDiv.className = "modal-footer";

        if (options.footer) {
          if (typeof options.footer === "string") {
            footerDiv.innerHTML = options.footer;
          } else if (options.footer instanceof HTMLElement) {
            footerDiv.appendChild(options.footer);
          } else if (Array.isArray(options.footer)) {
            footerDiv.innerHTML = options.footer.join("");
          }
        } else {
          footerDiv.innerHTML = '<button class="modal-btn">OK</button>';
        }

        applyModalStyles(headerDiv);
        applyModalStyles(bodyDiv);
        applyModalStyles(footerDiv);

        modalScope = createModalScope(bodyDiv);

        footerDiv.querySelectorAll("button").forEach((button) => {
          const onclickAttr = button.getAttribute("onclick");

          if (onclickAttr) {
            button.removeAttribute("onclick");

            button.addEventListener("click", () => {
              if (onclickAttr !== "closeModal()") {
                if (!validateModalFields(bodyDiv)) {
                  showNotification("Please fill in all required fields.");
                  return;
                }
              }

              try {
                with (modalScope) {
                  eval(`(function() { ${onclickAttr} })()`);
                }
              } catch (error) {
                console.error("Error executing button action:", error);
              }
            });
          } else {
            button.addEventListener("click", () => {
              if (validateModalFields(bodyDiv)) {
                const values = collectFormValues(bodyDiv);
                closeModal({
                  action: button.textContent || button.id || "unknown",
                  values
                });
              } else {
                showNotification("Please fill in all required fields.");
              }
            });
          }
        });

        bodyDiv.querySelectorAll("[onclick]").forEach((element) => {
          const onclickAttr = element.getAttribute("onclick");
          if (onclickAttr) {
            element.addEventListener("click", () => {
              try {
                with (modalScope) {
                  eval(`(function() { ${onclickAttr} })()`);
                }
              } catch (error) {
                console.error("Error executing element action:", error);
              }
            });
            element.removeAttribute("onclick");
          }
        });

        bodyDiv
          .querySelectorAll(".custom-dropdown-trigger")
          .forEach((trigger) => {
            const options = JSON.parse(trigger.dataset.options || "[]");
            trigger.addEventListener("click", () => {
              renderDropdownMenuPortal(trigger, options, (selected) => {
                trigger.textContent = selected.label;
                trigger.dataset.value = selected.value;
                trigger.dispatchEvent(new Event("change", { bubbles: true }));
              });
            });
          });

        modalWindow.appendChild(headerDiv);
        modalWindow.appendChild(bodyDiv);
        modalWindow.appendChild(footerDiv);
        modalBackdrop.appendChild(modalWindow);

        document.documentElement.style.overflow = "hidden";
        modalBackdrop.classList.add("active");

        setTimeout(() => {
          const firstInput = bodyDiv.querySelector(
            "input, textarea, select, button"
          );
          if (firstInput) firstInput.focus();
        }, 100);
      });
    };

    window.modalSubmit = function () {
      const bodyEl = modalBackdrop.querySelector(".modal-body");
      if (validateModalFields(bodyEl)) {
        const values = collectFormValues(bodyEl);
        closeModal({ action: "submit", values });
      } else {
        showNotification("Please fill in all required fields.");
      }
    };

    window.closeModal = closeModal;

    window.createModalElement = function (type, opts = {}) {
      const out = { el: null, input: null };
      type = type.toLowerCase();
      const wrapper = document.createElement("div");
      wrapper.className = "modal-element";

      if (opts.label) {
        const lbl = document.createElement("label");
        lbl.className = "modal-label";
        lbl.textContent = opts.label;
        wrapper.appendChild(lbl);
      }

      if (type === "message") {
        const p = document.createElement("div");
        p.className = "modal-message";
        p.textContent = opts.text || "";
        out.el = wrapper;
        wrapper.appendChild(p);
        return out;
      }

      if (type === "input") {
        const input = document.createElement("input");
        input.className = "modal-input";
        input.type = opts.inputType || "text";
        if (opts.placeholder) input.placeholder = opts.placeholder;
        if (opts.value) input.value = opts.value;
        if (opts.key) input.dataset.modalKey = opts.key;
        if (opts.visibleIf) wrapper.dataset.visibleIf = opts.visibleIf;
        wrapper.appendChild(input);
        out.el = wrapper;
        out.input = input;
        return out;
      }

      if (type === "textarea") {
        const ta = document.createElement("textarea");
        ta.className = "modal-textarea";
        ta.rows = opts.rows || 3;
        if (opts.placeholder) ta.placeholder = opts.placeholder;
        if (opts.key) ta.dataset.modalKey = opts.key;
        if (opts.visibleIf) wrapper.dataset.visibleIf = opts.visibleIf;
        wrapper.appendChild(ta);
        out.el = wrapper;
        out.input = ta;
        return out;
      }

      if (type === "checkbox" || type === "radio") {
        const input = document.createElement("input");
        input.className = "modal-input";
        input.type = type;
        if (opts.key) input.dataset.modalKey = opts.key;
        if (opts.visibleIf) wrapper.dataset.visibleIf = opts.visibleIf;
        wrapper.appendChild(input);
        out.el = wrapper;
        out.input = input;
        return out;
      }

      if (type === "select") {
        const wrapper2 = document.createElement("div");
        wrapper2.className = "custom-dropdown";
        const trigger = document.createElement("div");
        trigger.className = "custom-dropdown-trigger modal-input";
        trigger.tabIndex = 0;

        const options = opts.options || [{ label: "Select option", value: "" }];
        trigger.textContent = options[0].label;
        trigger.dataset.value = options[0].value;
        trigger.dataset.options = JSON.stringify(options);

        trigger.addEventListener("click", () => {
          renderDropdownMenuPortal(trigger, options, (selected) => {
            trigger.textContent = selected.label;
            trigger.dataset.value = selected.value;
            trigger.dispatchEvent(new Event("change"));
          });
        });

        if (opts.key) trigger.dataset.modalKey = opts.key;
        wrapper2.appendChild(trigger);
        if (opts.visibleIf) wrapper2.dataset.visibleIf = opts.visibleIf;
        wrapper.appendChild(wrapper2);
        out.el = wrapper;
        out.input = trigger;
        return out;
      }

      if (type === "button") {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "modal-inline-button modal-btn";
        btn.textContent = opts.value || opts.label || "Button";
        if (opts.ariaLabel) btn.setAttribute("aria-label", opts.ariaLabel);

        const lowerLabel = (opts.value || opts.label || "").toLowerCase();
        if (lowerLabel.includes("cancel") || lowerLabel.includes("close")) {
          btn.style.background = "#373737";
          btn.style.color = "var(--modal-ink)";
        } else {
          btn.style.background = "var(--accent-2)";
          btn.style.color = "#052027";
        }

        if (typeof opts.onClick === "function") {
          btn.addEventListener("click", opts.onClick);
        }

        if (opts.visibleIf) wrapper.dataset.visibleIf = opts.visibleIf;
        wrapper.appendChild(btn);
        out.el = wrapper;
        out.input = btn;
        return out;
      }

      if (type === "row") ...(truncated 78541 characters)...ialize(e) {
          try {
            const t = typeof e === "string" ? JSON.parse(e) : e;
            this._undo = t.undo || [];
            this._redo = t.redo || [];
            this._trim();
            this._persist();
            return true;
          } catch (n) {
            return false;
          }
        }
        _notify(e) {
          try {
            window.showNotification && showNotification(e);
          } catch (t) {
            console.log(e);
          }
        }
        _applyFrame(e) {
          if (!this.target) return;
          this._suppress = true;
          this.target.value = e.value;
          restoreSelectionState(this.target, e);
          if (window.currentNote) window.currentNote.content = e.value;
          if (typeof window.updateNoteMetadata === "function")
            window.updateNoteMetadata();
          this._suppress = false;
        }
        _createFrame(e) {
          return {
            value: e.value,
            start: e.start,
            end: e.end,
            dir: e.dir,
            ts: e.ts
          };
        }
        _undoPush(e) {
          if (
            this._undo.length &&
            shallowEqual(this._undo[this._undo.length - 1], e)
          )
            return;
          this._undo.push(e);
          this._trim();
          this._persist();
        }
        _redoPush(e) {
          if (
            this._redo.length &&
            shallowEqual(this._redo[this._redo.length - 1], e)
          )
            return;
          this._redo.push(e);
          this._trim();
          this._persist();
        }
        _trim() {
          const e = this.maxEntries;
          while (this._undo.length > e) this._undo.shift();
          while (this._redo.length > e) this._redo.shift();
          if (this.opts.memoryBudgetBytes) {
            let t = approxBytes({ undo: this._undo, redo: this._redo });
            while (t > this.opts.memoryBudgetBytes && this._undo.length > 1) {
              this._undo.shift();
              t = approxBytes({ undo: this._undo, redo: this._redo });
            }
          }
        }
        _persist() {
          try {
            localStorage.setItem(
              this.persistKey,
              JSON.stringify({
                undo: this._undo,
                redo: this._redo,
                expires: now() + this.persistTTL
              })
            );
          } catch (e) {}
        }
        _loadPersist() {
          try {
            const e = localStorage.getItem(this.persistKey);
            if (!e) return;
            const t = JSON.parse(e);
            if (t.expires && t.expires > now()) {
              this._undo = (t.undo || []).slice(-this.maxEntries);
              this._redo = (t.redo || []).slice(-this.maxEntries);
            }
          } catch (n) {}
        }
        _commitInitial() {
          if (!this.target) return;
          const e = snapshot(this.target);
          this._undo = [this._createFrame(e)];
          this._redo = [];
          this._persist();
        }
        _installListeners() {
          if (!this.target) return;
          this.target.addEventListener("input", this._onInput);
          this.target.addEventListener("paste", this._onCutPaste);
          this.target.addEventListener("cut", this._onCutPaste);
          this.target.addEventListener("keydown", this._onKeydown);
          this.target.addEventListener(
            "compositionstart",
            this._onCompositionStart
          );
          this.target.addEventListener(
            "compositionend",
            this._onCompositionEnd
          );
          this._observer = new MutationObserver(() => {
            if (this._suppress) return;
            this._scheduleCommit();
          });
          this._observer.observe(this.target, {
            characterData: true,
            childList: true,
            subtree: true
          });
          if (window.undoBtn)
            window.undoBtn.addEventListener("click", () => {
              const e = now();
              if (e - this._lastUndoClick <= this.powerWindowMs) {
                this._undoPower = clamp(
                  this._undoPower + 1,
                  1,
                  this.maxEntries
                );
              } else {
                this._undoPower = 1;
              }
              this._lastUndoClick = e;
              this._redoPower = 1;
              this._lastRedoClick = 0;
              this.performUndo();
            });
          if (window.redoBtn)
            window.redoBtn.addEventListener("click", () => {
              const e = now();
              if (e - this._lastRedoClick <= this.powerWindowMs) {
                this._redoPower = clamp(
                  this._redoPower + 1,
                  1,
                  this.maxEntries
                );
              } else {
                this._redoPower = 1;
              }
              this._lastRedoClick = e;
              this._undoPower = 1;
              this._lastUndoClick = 0;
              this.performRedo();
            });
        }
        _uninstallListeners() {
          if (!this.target) return;
          try {
            this.target.removeEventListener("input", this._onInput);
            this.target.removeEventListener("paste", this._onCutPaste);
            this.target.removeEventListener("cut", this._onCutPaste);
            this.target.removeEventListener("keydown", this._onKeydown);
            this.target.removeEventListener(
              "compositionstart",
              this._onCompositionStart
            );
            this.target.removeEventListener(
              "compositionend",
              this._onCompositionEnd
            );
          } catch (e) {}
          this._disconnectObserver();
          if (window.undoBtn)
            window.undoBtn.removeEventListener("click", this.performUndo);
          if (window.redoBtn)
            window.redoBtn.removeEventListener("click", this.performRedo);
        }
        _disconnectObserver() {
          if (this._observer) {
            try {
              this._observer.disconnect();
            } catch (e) {}
            this._observer = null;
          }
        }
        _onInput(e) {
          if (this._suppress) return;
          if (this._composition) return this._scheduleCommit();
          this._scheduleCommit();
        }
        _onCutPaste(e) {
          if (this._suppress) return;
          this._scheduleCommit(0);
        }
        _onKeydown(e) {
          if ((e.ctrlKey || e.metaKey) && !e.altKey) {
            if (e.key === "z" || e.key === "Z") {
              if (e.shiftKey) {
                e.preventDefault();
                this.performRedo();
              } else {
                e.preventDefault();
                this.performUndo();
              }
            } else if (e.key === "y" || e.key === "Y") {
              e.preventDefault();
              this.performRedo();
            }
          }
        }
        _onCompositionStart() {
          this._composition = true;
        }
        _onCompositionEnd() {
          this._composition = false;
          setTimeout(() => {
            this._scheduleCommit(0);
          }, this.imeDebounce);
        }
        _scheduleCommit(e) {
          clearTimeout(this._coalesceTimer);
          if (e === 0) {
            this._commitImmediate("immediate");
            return;
          }
          this._coalesceTimer = setTimeout(() => {
            this._commitImmediate("coalesced");
          }, this.coalesceMs);
        }
        _commitImmediate(e) {
          clearTimeout(this._coalesceTimer);
          if (!this.target) return;
          const t = snapshot(this.target);
          if (this._suppress) return;
          const n = this._undo[this._undo.length - 1];
          if (n && shallowEqual(n, t)) return;
          if (
            n &&
            diffIsSmall(n, t) &&
            now() - n.ts < this.coalesceMs &&
            !this._composition
          ) {
            this._undo[this._undo.length - 1] = this._createFrame(t);
            this._undo[this._undo.length - 1].ts = now();
          } else {
            this._undoPush(this._createFrame(t));
          }
          this._redo = [];
          this._persist();
        }
        _wrapProgrammatics() {
          if (!this.target) return;
          const e = this.target,
            t = this;
          try {
            if (!e.__undov_value_wrapped) {
              const n =
                Object.getOwnPropertyDescriptor(e, "value") ||
                Object.getOwnPropertyDescriptor(
                  HTMLTextAreaElement.prototype,
                  "value"
                );
              const r =
                n.get ||
                function () {
                  return this.value;
                };
              const i =
                n.set ||
                function (e) {
                  this.value = e;
                };
              Object.defineProperty(e, "value", {
                configurable: true,
                enumerable: n.enumerable,
                get: function () {
                  return r.call(this);
                },
                set: function (e) {
                  if (t._suppress) return i.call(this, e);
                  i.call(this, e);
                  t.recordNow("setter");
                }
              });
              e.__undov_value_wrapped = true;
              this._wrapped.value = true;
            }
          } catch (n) {}
          try {
            if (
              typeof e.setRangeText === "function" &&
              !e.__undov_setRangeText_wrapped
            ) {
              const n = e.setRangeText;
              e.setRangeText = function () {
                if (t._suppress) return n.apply(this, arguments);
                const e = snapshot(this);
                const r = n.apply(this, arguments);
                t.recordNow("setRangeText");
                return r;
              };
              e.__undov_setRangeText_wrapped = true;
              this._wrapped.setRangeText = true;
            }
          } catch (n) {}
        }
        _unwrapProgrammatics() {
          const e = this.target;
          try {
            if (e && e.__undov_value_wrapped) delete e.__undov_value_wrapped;
            if (e && e.__undov_setRangeText_wrapped)
              delete e.__undov_setRangeText_wrapped;
          } catch (t) {}
        }
      }
      function autoWire() {
        const e =
          document.getElementById("noteTextarea") ||
          document.querySelector("textarea");
        if (!e) return null;
        window.__HistoryManagerInstance &&
          window.__HistoryManagerInstance.destroy();
        window.__HistoryManagerInstance = new HistoryManager(e);
        window.performUndo = () =>
          window.__HistoryManagerInstance.performUndo();
        window.performRedo = () =>
          window.__HistoryManagerInstance.performRedo();
        window.clearUndoHistory = () => window.__HistoryManagerInstance.clear();
        window.recordState = (e) =>
          window.__HistoryManagerInstance.recordNow(e);
        window.serializeUndoHistory = () =>
          window.__HistoryManagerInstance.serialize();
        window.deserializeUndoHistory = (e) =>
          window.__HistoryManagerInstance.deserialize(e);
        return window.__HistoryManagerInstance;
      }
      if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", autoWire, { once: true });
      } else {
        setTimeout(autoWire, 0);
      }
      window.HistoryManager = HistoryManager;
    })();

    window.saveNotes = () =>
      localStorage.setItem("notes", JSON.stringify(notes));

    window.updateNoteMetadata = function () {
      if (!window.currentNote || !window.noteTextarea) return;
      window.undoStack.push({
        content: window.currentNote.content,
        selectionStart: window.noteTextarea.selectionStart,
        selectionEnd: window.noteTextarea.selectionEnd
      });
      window.redoStack = [];
      window.currentNote.content = window.noteTextarea.value;
      window.currentNote.lastEdited = new Date().toISOString();
      saveNotes();
      updateDocumentInfo();
    };

    window.updateDocumentInfo = function () {
      if (!window.currentNote)
        return (
          (document.getElementById("infoName").textContent = "-"),
          (document.getElementById("infoStats").textContent =
            "{0 | 0 | 0} / 0m"),
          void 0
        );
      var e = window.currentNote,
        t = e.title,
        n = e.content,
        o = e.extension,
        l = n.length,
        a = n.replace(/\s/g, "").length,
        i = n
          .trim()
          .split(/\s+/)
          .filter((w) => w).length,
        r = Math.ceil(i / 200),
        c = r < 60 ? r + "m" : (r / 60).toFixed(1) + "h";
      (document.getElementById("infoName").textContent =
        t + (o ? "." + o : "")),
        (document.getElementById("infoDexLabs").textContent = "Dex Labs"),
        (document.getElementById(
          "infoStats"
        ).textContent = `{${a} | ${l} | ${i}} / ${c}`);
    };

    (window.applyFontSize = function () {
      noteTextarea.style.fontSize = `${fontSize}px`;
      localStorage.setItem("fontSize", fontSize);
    }),
      (window.increaseFontSize = function () {
        fontSize = Math.min(fontSize + 2, 42);
        window.applyFontSize();
        showNotification(`Font size increased to ${fontSize}px`);
      }),
      (window.decreaseFontSize = function () {
        fontSize = Math.max(fontSize - 2, 10);
        window.applyFontSize();
        showNotification(`Font size decreased to ${fontSize}px`);
      });

    window.populateNoteList = function () {
      if (!noteList) return;
      noteList.innerHTML = "";
      notes.slice(0, Math.max(1, visibleNotes)).forEach((n) => {
        const t = document.createElement("li");
        t.className = "note-item";
        t.dataset.id = n.id;
        t.innerHTML = `<span class="note-title">${n.title}</span><span class="note-badge">${n.content.length} chars | .${n.extension}</span>`;
        t.onclick = () => {
          showNoteApp(n.id);
        };
        if (currentNote && currentNote.id === n.id) t.classList.add("selected");
        noteList.appendChild(t);
      });
    };

    window.openNote = function (e) {
      const t = notes.find((n) => n.id === e);
      if (!t) return;
      if (t.password)
        checkPassword(t, () => {
          currentNote = t;
          noteTextarea.value = t.content;
          updateDocumentInfo();
          document
            .querySelectorAll(".note-item")
            .forEach((e) => e.classList.remove("selected"));
          const e = document.querySelector(`.note-item[data-id="${t.id}"]`);
          e && e.classList.add("selected");
        });
      else {
        currentNote = t;
        noteTextarea.value = t.content;
        updateDocumentInfo();
        document
          .querySelectorAll(".note-item")
          .forEach((e) => e.classList.remove("selected"));
        const e = document.querySelector(`.note-item[data-id="${t.id}"]`);
        e && e.classList.add("selected");
      }
    };

    window.getNextEmptyNote = function () {
      return notes.find((e) => !e.content);
    };

    window.showNotification = function (e) {
      if (window.notification) {
        window.notification.textContent = e;
        window.notification.classList.add("show");
        setTimeout(() => window.notification.classList.remove("show"), 3e3);
      }
    };

    window.handleNewDocument = () => {
      if (visibleNotes >= maxNotes) {
        showNotification("Max notes limit reached! Clear a note to continue.");
        return;
      }
      const e = getNextEmptyNote();
      if (e) {
        visibleNotes = 1;
        updateNoteVisibility();
        openNote(e.id);
        showNotification("New document created!");
      } else {
        const t = {
          id: Date.now().toString(),
          title: `note${notes.length + 1}.txt`,
          content: "",
          extension: "txt",
          lastEdited: new Date().toISOString(),
          password: ""
        };
        notes.push(t);
        visibleNotes = 1;
        updateNoteVisibility();
        openNote(t.id);
        showNotification("New document created!");
      }
    };

    window.handleOpenFile = function () {
      const e = getNextEmptyNote();
      if (!e) {
        showNotification("No empty notes available! Clear a note to continue.");
        return;
      }
      const t = document.createElement("input");
      t.type = "file";
      t.accept =
        ".txt,.md,.csv,.json,.xml,.yml,.yaml,.js,.ts,.jsx,.tsx,.html,.css,.py,.java,.c,.cpp,.h,.go,.rb,.php,.rs,.swift,.sh,.bat,Dockerfile,Makefile,.env,.ini,.toml,.conf,.log,.dockerignore";
      t.onchange = function (o) {
        const n = o.target.files[0];
        if (n) {
          const r = new FileReader();
          (r.onload = function (o) {
            let x = n.name.split("."),
              a = x.pop().toLowerCase(),
              base = x.join(".");
            e.title = base;
            e.content = o.target.result;
            e.extension = a;
            e.lastEdited = new Date().toISOString();
            visibleNotes = 1;
            updateNoteVisibility();
            openNote(e.id);
            showNotification("File opened!");
          }),
            r.readAsText(n);
        }
      };
      t.click();
    };

    window.handlePasteNote = function () {
      const r = async function () {
        if (!currentNote || !noteTextarea) return;
        if (!navigator.clipboard || !navigator.permissions) {
          showNotification("Paste not supported in this browser.");
          return;
        }
        try {
          const perm = await navigator.permissions.query({
            name: "clipboard-read"
          });
          if (perm.state === "denied") {
            showNotification(
              "Clipboard access denied. Please allow it in your browser settings."
            );
            return;
          }
          const clip = await navigator.clipboard.readText();
          const s = noteTextarea.selectionStart,
            e = noteTextarea.selectionEnd;
          noteTextarea.value =
            noteTextarea.value.slice(0, s) + clip + noteTextarea.value.slice(e);
          const n = s + clip.length;
          noteTextarea.selectionStart = noteTextarea.selectionEnd = n;
          updateNoteMetadata();
          showNotification("Pasted from clipboard!");
        } catch {
          showNotification(
            "Paste failed (permission denied or empty clipboard)."
          );
        }
      };
      r();
    };
  })();
}

if (window.blogger && window.blogger.uiReady) {
  initApp();
} else {
  document.addEventListener("DOMContentLoaded", initApp);
  setTimeout(initApp, 100);
}

document.addEventListener("DOMContentLoaded", () => {
  const e = document.getElementById("fullscreenBtn"),
    n = document.getElementById("fullscreenIcon");
  function t() {
    const e = document.documentElement;
    document.fullscreenElement ||
    document.webkitFullscreenElement ||
    document.msFullscreenElement
      ? document.exitFullscreen
        ? document.exitFullscreen()
        : document.webkitExitFullscreen
        ? document.webkitExitFullscreen()
        : document.msExitFullscreen && document.msExitFullscreen()
      : e.requestFullscreen
      ? e.requestFullscreen()
      : e.webkitRequestFullscreen
      ? e.webkitRequestFullscreen()
      : e.msRequestFullscreen && e.msRequestFullscreen();
  }
  function c() {
    document.fullscreenElement ||
    document.webkitFullscreenElement ||
    document.msFullscreenElement
      ? (n.textContent = "fullscreen_exit")
      : (n.textContent = "fullscreen");
  }
  e.addEventListener("click", t),
    document.addEventListener("fullscreenchange", c),
    document.addEventListener("webkitfullscreenchange", c),
    document.addEventListener("msfullscreenchange", c);
});
window.safeAddListener = function (e, t, n) {
  e
    ? e.addEventListener(t, n)
    : console.warn(`Element for ${t} listener not found`);
};
window.setupEventListeners = function () {
  safeAddListener(homeBtn, "click", () => {
    showHomepage();
    showNotification("Returned to homepage");
  });
  safeAddListener(sidebar1Toggle, "click", (e) => {
    e.stopPropagation();
    sidebar1.classList.toggle("open");
    const t = sidebar1.classList.contains("open");
    sidebar1Toggle.innerHTML = t
      ? '<i class="material-symbols-rounded">close</i>'
      : '<i class="material-symbols-rounded">menu</i>';
  });
  document.addEventListener("click", (e) => {
    if (
      sidebar1 &&
      sidebar1Toggle &&
      !sidebar1.contains(e.target) &&
      !sidebar1Toggle.contains(e.target) &&
      sidebar1.classList.contains("open")
    ) {
      sidebar1.classList.remove("open");
      sidebar1Toggle.innerHTML = '<i class="material-symbols-rounded">menu</i>';
    }
  });
  safeAddListener(noteTextarea, "input", updateNoteMetadata);
  safeAddListener(showNextNoteBtn, "click", () => {
    if (visibleNotes < maxNotes) {
      visibleNotes++;
      updateNoteVisibility();
      showNotification(
        `Showing ${visibleNotes} note${visibleNotes !== 1 ? "s" : ""}`
      );
    } else showNotification("Max notes limit reached");
  });
  safeAddListener(hideLastNoteBtn, "click", () => {
    if (visibleNotes > 1) {
      visibleNotes--;
      updateNoteVisibility();
      showNotification(
        `Showing ${visibleNotes} note${visibleNotes !== 1 ? "s" : ""}`
      );
    } else showNotification("Must keep at least one note visible");
  });
  safeAddListener(sidebar2Toggle, "click", (e) => {
    e.stopPropagation();
    secondarySidebar.classList.toggle("open");
    const t = secondarySidebar.classList.contains("open");
    sidebar2Toggle.innerHTML = t
      ? '<i class="material-symbols-rounded">close</i>'
      : '<i class="material-symbols-rounded">apps</i>';
  });
  document.addEventListener("click", (e) => {
    if (
      secondarySidebar &&
      sidebar2Toggle &&
      !secondarySidebar.contains(e.target) &&
      !sidebar2Toggle.contains(e.target) &&
      secondarySidebar.classList.contains("open")
    ) {
      secondarySidebar.classList.remove("open");
      sidebar2Toggle.innerHTML = '<i class="material-symbols-rounded">apps</i>';
    }
  });
  safeAddListener(secondarySidebar, "click", (e) => e.stopPropagation());
  window.addEventListener("focus", checkPasswordRequirement);
};
document.addEventListener("DOMContentLoaded", () =>
  window.setupEventListeners()
);

window.loadNotes = function () {
  const e = localStorage.getItem("notes");
  return e
    ? JSON.parse(e)
    : [
        {
          id: "1",
          title: "example",
          content: 'console.log("Hello, World!");',
          extension: "js",
          lastEdited: new Date().toISOString(),
          password: ""
        },
        {
          id: "2",
          title: "example",
          content: "<h1>Hello, World!</h1>",
          extension: "html",
          lastEdited: new Date().toISOString(),
          password: ""
        },
        {
          id: "3",
          title: "example",
          content: "body { background: #fff; }",
          extension: "css",
          lastEdited: new Date().toISOString(),
          password: ""
        },
        {
          id: "4",
          title: "example",
          content: 'print("Hello, World!")',
          extension: "py",
          lastEdited: new Date().toISOString(),
          password: ""
        },
        {
          id: "5",
          title: "note5",
          content: "",
          extension: "txt",
          lastEdited: new Date().toISOString(),
          password: ""
        },
        {
          id: "6",
          title: "note6",
          content: "",
          extension: "txt",
          lastEdited: new Date().toISOString(),
          password: ""
        },
        {
          id: "7",
          title: "note7",
          content: "",
          extension: "txt",
          lastEdited: new Date().toISOString(),
          password: ""
        },
        {
          id: "8",
          title: "note8",
          content: "",
          extension: "txt",
          lastEdited: new Date().toISOString(),
          password: ""
        },
        {
          id: "9",
          title: "note9",
          content: "",
          extension: "txt",
          lastEdited: new Date().toISOString(),
          password: ""
        },
        {
          id: "10",
          title: "note10",
          content: "",
          extension: "txt",
          lastEdited: new Date().toISOString(),
          password: ""
        },
        {
          id: "11",
          title: "note11",
          content: "",
          extension: "txt",
          lastEdited: new Date().toISOString(),
          password: ""
        },
        {
          id: "12",
          title: "note12",
          content: "",
          extension: "txt",
          lastEdited: new Date().toISOString(),
          password: ""
        },
        {
          id: "13",
          title: "note13",
          content: "",
          extension: "txt",
          lastEdited: new Date().toISOString(),
          password: ""
        },
        {
          id: "14",
          title: "note14",
          content: "",
          extension: "txt",
          lastEdited: new Date().toISOString(),
          password: ""
        },
        {
          id: "15",
          title: "note15",
          content: "",
          extension: "txt",
          lastEdited: new Date().toISOString(),
          password: ""
        }
      ];
};
window.showHomepage = function () {
  if (homepage && noteAppContainer && diffCheckerContainer) {
    homepage.style.display = "flex";
    noteAppContainer.style.display = "none";
    diffCheckerContainer.style.display = "none";
    topbar.style.display = "none";
    isHomepage = true;
    currentApp = "home";
    history.pushState({ page: "home" }, "", "/");
  }
};
window.updateNoteVisibility = function () {
  localStorage.setItem("visibleNotes", visibleNotes);
  window.populateNoteList();
};
window.preserveSelection = function (handler) {
  return () => {
    const start = window.noteTextarea.selectionStart;
    const end = window.noteTextarea.selectionEnd;
    handler();
    window.noteTextarea.setSelectionRange(start, end);
  };
};
window.checkPasswordRequirement = function() {};
window.checkPassword = function(note, callback) {
  if (note.password) {
    showModal({
      title: "Enter Password",
      body: '<input type="password" id="passwordInput" placeholder="Password">',
      footer: '<button onclick="modalSubmit()">Submit</button>'
    }).then((result) => {
      if (result.action === "submit" && result.values.passwordInput === note.password) {
        callback();
      } else {
        showNotification("Incorrect password");
      }
    });
  } else {
    callback();
  }
};

window.init = () => {
  window.notes = window.loadNotes();
  window.updateNoteVisibility();
  window.applyFontSize();
  window.setupEventListeners();
  window.checkPasswordRequirement();
};
