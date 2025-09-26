function initApp() {
  (function () {
    const css = `:root { 
      --modal-bg: #272727; 
      --modal-surface: #171717; 
      --modal-ink: #eeeeee; 
      --modal-muted: #9aa8b7; 
      --accent-2: #60a5fa; 
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
      background-image: linear-gradient(45deg, transparent 50%, var(--modal-muted) 50%), linear-gradient(135deg, var(--modal-muted) 50%, transparent 50%); 
      background-position: calc(100% - 18px) calc(1em + 2px), calc(100% - 13px) calc(1em + 2px); 
      background-size: 6px 6px, 6px 6px; 
      background-repeat: no-repeat; 
      padding-right: 36px; 
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

    // Custom dropdown functionality
    function renderDropdownMenuPortal(trigger, options, callback) {
      document.querySelectorAll(".custom-dropdown-portal-menu").forEach((e) => e.remove());
      
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
      
      window.addEventListener("scroll", () => {
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
      }, { passive: true });
      
      return menu;
    }

    // Modal system variables
    let modalBackdrop = null;
    let modalResolver = null;
    let modalScope = {};

    function ensureModal() {
      if (modalBackdrop) return;
      
      modalBackdrop = document.createElement('div');
      modalBackdrop.className = 'modal-backdrop';
      modalBackdrop.setAttribute('aria-hidden', 'true');
      
      document.body.appendChild(modalBackdrop);
      
      modalBackdrop.addEventListener('click', (e) => {
        if (e.target === modalBackdrop) closeModal();
      });
      
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modalBackdrop.classList.contains('active')) {
          closeModal();
        }
      });
    }

    function closeModal(result = null) {
      if (modalBackdrop) {
        modalBackdrop.classList.remove('active');
        document.documentElement.style.overflow = '';
      }
      
      modalScope = {};
      
      if (modalResolver) {
        modalResolver(result);
        modalResolver = null;
      }
      
      setTimeout(() => {
        if (modalBackdrop) {
          modalBackdrop.innerHTML = '';
        }
      }, 300);
    }

    function applyModalStyles(element) {
      if (element.tagName === 'INPUT') {
        element.classList.add('modal-input');
      } else if (element.tagName === 'TEXTAREA') {
        element.classList.add('modal-textarea');
      } else if (element.tagName === 'SELECT') {
        element.classList.add('modal-select');
      } else if (element.tagName === 'BUTTON') {
        element.classList.add('modal-btn');
      }
      
      element.querySelectorAll('input, textarea, select, button').forEach(child => {
        applyModalStyles(child);
      });
    }

    function createModalScope(container) {
      const scope = {};
      
      container.querySelectorAll('[id]').forEach(element => {
        if (element.id) {
          scope[element.id] = element;
        }
      });
      
      return scope;
    }

    function validateModalFields(container) {
      let isValid = true;
      const fields = container.querySelectorAll('input, textarea, .custom-dropdown-trigger');
      
      fields.forEach(field => {
        field.style.borderColor = '';
        
        let isEmpty = false;
        
        if (field.tagName === 'INPUT' && (field.type === 'text' || field.type === 'email' || field.type === 'url')) {
          isEmpty = field.value.trim() === '';
        } else if (field.classList.contains('custom-dropdown-trigger')) {
          isEmpty = (field.dataset.value || '').trim() === '';
        } else if (field.tagName === 'TEXTAREA') {
          isEmpty = field.value.trim() === '';
        }
        
        if (isEmpty) {
          field.style.borderColor = 'var(--danger)';
          isValid = false;
          
          const clearValidation = () => {
            field.style.borderColor = '';
            field.removeEventListener('input', clearValidation);
            field.removeEventListener('change', clearValidation);
          };
          
          field.addEventListener('input', clearValidation);
          field.addEventListener('change', clearValidation);
        }
      });
      
      return isValid;
    }

    function collectFormValues(container) {
      const values = {};
      
      container.querySelectorAll('[id]').forEach(element => {
        if (element.id) {
          if (element.tagName === 'INPUT') {
            if (element.type === 'checkbox' || element.type === 'radio') {
              values[element.id] = element.checked;
            } else {
              values[element.id] = element.value;
            }
          } else if (element.tagName === 'TEXTAREA' || element.tagName === 'SELECT') {
            values[element.id] = element.value;
          } else if (element.classList.contains('custom-dropdown-trigger')) {
            values[element.id] = element.dataset.value || element.textContent;
          }
        }
      });
      
      return values;
    }

    window.showModal = function(options = {}) {
      ensureModal();
      
      return new Promise((resolve) => {
        modalResolver = resolve;
        modalScope = {};
        
        modalBackdrop.innerHTML = '';
        
        const modalWindow = document.createElement('div');
        modalWindow.className = 'modal-window';
        modalWindow.setAttribute('role', 'dialog');
        modalWindow.setAttribute('aria-modal', 'true');
        
        const headerDiv = document.createElement('div');
        headerDiv.className = 'modal-header';
        
        if (options.header) {
          if (typeof options.header === 'string') {
            headerDiv.innerHTML = options.header;
          } else if (options.header instanceof HTMLElement) {
            headerDiv.appendChild(options.header);
          }
        } else {
          const titleEl = document.createElement('h3');
          titleEl.className = 'modal-title';
          titleEl.textContent = options.title || '';
          titleEl.id = 'modal-title-' + Math.random().toString(36).slice(2);
          
          const closeBtn = document.createElement('button');
          closeBtn.className = 'modal-close';
          closeBtn.setAttribute('aria-label', 'Close dialog');
          closeBtn.innerHTML = '&#x2715;';
          closeBtn.addEventListener('click', closeModal);
          
          headerDiv.appendChild(titleEl);
          headerDiv.appendChild(closeBtn);
          modalWindow.setAttribute('aria-labelledby', titleEl.id);
        }
        
        const bodyDiv = document.createElement('div');
        bodyDiv.className = 'modal-body';
        
        if (options.body) {
          if (typeof options.body === 'string') {
            bodyDiv.innerHTML = options.body;
          } else if (options.body instanceof HTMLElement) {
            bodyDiv.appendChild(options.body);
          } else if (Array.isArray(options.body)) {
            bodyDiv.innerHTML = options.body.join('');
          }
        }
        
        const footerDiv = document.createElement('div');
        footerDiv.className = 'modal-footer';
        
        if (options.footer) {
          if (typeof options.footer === 'string') {
            footerDiv.innerHTML = options.footer;
          } else if (options.footer instanceof HTMLElement) {
            footerDiv.appendChild(options.footer);
          } else if (Array.isArray(options.footer)) {
            footerDiv.innerHTML = options.footer.join('');
          }
        } else {
          footerDiv.innerHTML = '<button class="modal-btn">OK</button>';
        }
        
        applyModalStyles(headerDiv);
        applyModalStyles(bodyDiv);
        applyModalStyles(footerDiv);
        
        modalScope = createModalScope(bodyDiv);
        
        footerDiv.querySelectorAll('button').forEach(button => {
          const onclickAttr = button.getAttribute('onclick');
          
          if (onclickAttr) {
            button.removeAttribute('onclick');
            
            button.addEventListener('click', () => {
              if (!validateModalFields(bodyDiv)) {
                showNotification('Please fill in all required fields.');
                return;
              }
              
              try {
                with (modalScope) {
                  eval(`(function() { ${onclickAttr} })()`);
                }
              } catch (error) {
                console.error('Error executing button action:', error);
              }
            });
          } else {
            button.addEventListener('click', () => {
              if (validateModalFields(bodyDiv)) {
                const values = collectFormValues(bodyDiv);
                closeModal({ action: button.textContent || button.id || 'unknown', values });
              } else {
                showNotification('Please fill in all required fields.');
              }
            });
          }
        });
        
        bodyDiv.querySelectorAll('[onclick]').forEach(element => {
          const onclickAttr = element.getAttribute('onclick');
          if (onclickAttr) {
            element.addEventListener('click', () => {
              try {
                with (modalScope) {
                  eval(`(function() { ${onclickAttr} })()`);
                }
              } catch (error) {
                console.error('Error executing element action:', error);
              }
            });
            element.removeAttribute('onclick');
          }
        });
        
        bodyDiv.querySelectorAll('.custom-dropdown-trigger').forEach(trigger => {
          const options = JSON.parse(trigger.dataset.options || '[]');
          trigger.addEventListener('click', () => {
            renderDropdownMenuPortal(trigger, options, (selected) => {
              trigger.textContent = selected.label;
              trigger.dataset.value = selected.value;
              trigger.dispatchEvent(new Event('change', { bubbles: true }));
            });
          });
        });

        modalWindow.appendChild(headerDiv);
        modalWindow.appendChild(bodyDiv);
        modalWindow.appendChild(footerDiv);
        modalBackdrop.appendChild(modalWindow);
        
        document.documentElement.style.overflow = 'hidden';
        modalBackdrop.classList.add('active');
        
        setTimeout(() => {
          const firstInput = bodyDiv.querySelector('input, textarea, select, button');
          if (firstInput) firstInput.focus();
        }, 100);
      });
    };

    window.modalSubmit = function() {
      const bodyEl = modalBackdrop.querySelector('.modal-body');
      if (validateModalFields(bodyEl)) {
        const values = collectFormValues(bodyEl);
        closeModal({ action: 'submit', values });
      } else {
        showNotification('Please fill in all required fields.');
      }
    };

    window.closeModal = closeModal;
    
    window.createModalElement = function(type, opts = {}) {
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
      
      if (type === "row") {
        const container = document.createElement("div");
        container.className = "modal-row";
        if (opts.position) {
          container.setAttribute("data-position", opts.position);
        }
        
        (opts.children || []).forEach((child) => {
          if (child instanceof Node) {
            container.appendChild(child);
          } else if (child.el) {
            container.appendChild(child.el);
          }
        });
        
        out.el = container;
        return out;
      }
      
      out.el = wrapper;
      return out;
    };

    ensureModal();

    window.handleFormat = function(t) {
      return preserveSelection(async function() {
        if (!currentNote || !noteTextarea) return;
        
        const s = noteTextarea.selectionStart,
              e = noteTextarea.selectionEnd,
              v = noteTextarea.value;
        
        if (s === e) {
          showNotification(`Please select text to ${t}!`);
          return;
        }
        
        const formatOptions = t === "italic" ? 
          "MarkDown (*text*),MarkUp (<i>text</i>)" :
          t === "underline" ? 
          "MarkDown (__text__),MarkUp (<u>text</u>)" :
          t === "bold" ? 
          "MarkDown (**text**),MarkUp (<b>text</b>)" :
          "MarkDown (```),MarkUp (<code>)";
        
        const optionsArray = [
          { label: "Select option", value: "" },
          { label: formatOptions.split(',')[0], value: "1" },
          { label: formatOptions.split(',')[1], value: "2" }
        ];
        
        const result = await showModal({
          header: `<div class="modal-title">${t[0].toUpperCase() + t.slice(1)} Text</div>`,
          body: `
            <label class="modal-label">Choose Format</label>
            <div class="custom-dropdown">
              <div id="formatType" class="custom-dropdown-trigger modal-input" data-options='${JSON.stringify(optionsArray)}'>Select option</div>
            </div>
          `,
          footer: `
            <button onclick="closeModal()">Cancel</button>
            <button onclick="handleFormatSubmit('${t}')" style="background: var(--accent-2); color: #052027;">OK</button>
          `
        });
        
        if (!result || result.action !== 'OK') return;
        
        const formatValue = result.format;
        if (!formatValue) return;
        
        const sel = v.slice(s, e);
        let formatted = '';
        
        if (t === "italic") formatted = formatValue === "2" ? `<i>${sel}</i>` : `*${sel}*`;
        else if (t === "underline") formatted = formatValue === "2" ? `<u>${sel}</u>` : `__${sel}__`;
        else if (t === "bold") formatted = formatValue === "2" ? `<b>${sel}</b>` : `**${sel}**`;
        else if (t === "code") formatted = formatValue === "2" ? `<code>${sel}</code>` : `\`\`\`\n${sel}\n\`\`\``;
        
        noteTextarea.value = v.slice(0, s) + formatted + v.slice(e);
        updateNoteMetadata();
        showNotification(`Text ${t} applied!`);
      })();
    };

    window.handleFormatSubmit = function(type) {
      const formatValue = modalScope.formatType ? modalScope.formatType.dataset.value : null;
      if (!formatValue) {
        showNotification("Please select a format!");
        return;
      }
      closeModal({ action: 'OK', format: formatValue, type: type });
    };

    window.handleBulletList = function() {
      return preserveSelection(async function() {
        if (!currentNote || !noteTextarea) return;
        
        const s = noteTextarea.selectionStart,
              e = noteTextarea.selectionEnd,
              v = noteTextarea.value;
        
        if (s === e) {
          showNotification("Please select text for bullet list!");
          return;
        }
        
        const optionsArray = [
          { label: "Select option", value: "" },
          { label: "MarkDown (- item)", value: "1" },
          { label: "MarkUp (&lt;ul&gt;&lt;li&gt;)", value: "2" }
        ];
        
        const result = await showModal({
          header: `<div class="modal-title">Bullet List</div>`,
          body: `
            <label class="modal-label">Choose Format</label>
            <div class="custom-dropdown">
              <div id="listFormat" class="custom-dropdown-trigger modal-input" data-options='${JSON.stringify(optionsArray)}'>Select option</div>
            </div>
          `,
          footer: `
            <button onclick="closeModal()">Cancel</button>
            <button onclick="handleListSubmit('bullet')" style="background: var(--accent-2); color: #052027;">OK</button>
          `
        });
        
        if (!result || result.action !== 'OK') return;
        
        const formatValue = result.format;
        if (!formatValue) return;
        
        const sel = v.slice(s, e),
              lines = sel.split(/\r?\n/);
        let formatted;
        
        if (formatValue === "2") {
          formatted = "<ul>\n" + lines.map(t => "<li>" + t + "</li>").join("\n") + "\n</ul>";
        } else {
          formatted = lines.map(t => "- " + t).join("\n");
        }
        
        noteTextarea.value = v.slice(0, s) + formatted + v.slice(e);
        updateNoteMetadata();
        showNotification("Bullet list applied!");
      })();
    };

    window.handleNumberedList = function() {
      return preserveSelection(async function() {
        if (!currentNote || !noteTextarea) return;
        
        const s = noteTextarea.selectionStart,
              e = noteTextarea.selectionEnd,
              v = noteTextarea.value;
        
        if (s === e) {
          showNotification("Please select text for numbered list!");
          return;
        }
        
        const optionsArray = [
          { label: "Select option", value: "" },
          { label: "MarkDown (1. item)", value: "1" },
          { label: "MarkUp (&lt;ol&gt;&lt;li&gt;)", value: "2" }
        ];
        
        const result = await showModal({
          header: `<div class="modal-title">Numbered List</div>`,
          body: `
            <label class="modal-label">Choose Format</label>
            <div class="custom-dropdown">
              <div id="listFormat" class="custom-dropdown-trigger modal-input" data-options='${JSON.stringify(optionsArray)}'>Select option</div>
            </div>
          `,
          footer: `
            <button onclick="closeModal()">Cancel</button>
            <button onclick="handleListSubmit('numbered')" style="background: var(--accent-2); color: #052027;">OK</button>
          `
        });
        
        if (!result || result.action !== 'OK') return;
        
        const formatValue = result.format;
        if (!formatValue) return;
        
        const sel = v.slice(s, e),
              lines = sel.split(/\r?\n/);
        let formatted;
        
        if (formatValue === "2") {
          formatted = "<ol>\n" + lines.map(t => "<li>" + t + "</li>").join("\n") + "\n</ol>";
        } else {
          formatted = lines.map((t, i) => (i + 1) + ". " + t).join("\n");
        }
        
        noteTextarea.value = v.slice(0, s) + formatted + v.slice(e);
        updateNoteMetadata();
        showNotification("Numbered list applied!");
      })();
    };

    window.handleListSubmit = function(type) {
      const formatValue = modalScope.listFormat ? modalScope.listFormat.dataset.value : null;
      if (!formatValue) {
        showNotification("Please select a format!");
        return;
      }
      closeModal({ action: 'OK', format: formatValue, listType: type });
    };

    window.handleInsertLink = function() {
      return preserveSelection(async function() {
        if (!currentNote || !noteTextarea) return;
        
        const s = noteTextarea.selectionStart,
              e = noteTextarea.selectionEnd,
              v = noteTextarea.value;
        
        const formatOptionsArray = [
          { label: "Select option", value: "" },
          { label: "Markdown", value: "markdown" },
          { label: "MarkUp", value: "markup" }
        ];
        
        const result = await showModal({
          header: `<div class="modal-title">Insert Link</div>`,
          body: `
            <div style="display: flex; gap: 10px; align-items: center;">
              <div style="flex: 1;">
                <label class="modal-label">URL</label>
                <input type="url" id="linkUrl" placeholder="Enter URL">
              </div>
            </div>
            <div style="display: flex; gap: 10px; align-items: center;">
              <div style="flex: 1;">
                <label class="modal-label">Link Text</label>
                <input type="text" id="linkText" placeholder="Enter link text">
              </div>
            </div>
            <div style="display: flex; gap: 10px; align-items: center;">
              <div style="flex: 1;">
                <label class="modal-label">Format</label>
                <div class="custom-dropdown">
                  <div id="linkFormat" class="custom-dropdown-trigger modal-input" data-options='${JSON.stringify(formatOptionsArray)}'>Select option</div>
                </div>
              </div>
            </div>
          `,
          footer: `
            <button onclick="closeModal()">Cancel</button>
            <button onclick="handleLinkSubmit()" style="background: var(--accent-2); color: #052027;">Submit</button>
          `
        });
        
        if (!result || result.action !== 'submit') return;
        
        const url = result.url;
        const text = result.text;
        const format = result.format;
        
        if (!url || !text || !format) return;
        
        const link = format === "markup" ? 
          `<a href="${url}">${text}</a>` : 
          `[${text}](${url})`;
        
        noteTextarea.value = v.slice(0, s) + link + v.slice(e);
        updateNoteMetadata();
        showNotification("Link inserted!");
      })();
    };

    window.handleLinkSubmit = function() {
      const url = modalScope.linkUrl ? modalScope.linkUrl.value.trim() : '';
      const text = modalScope.linkText ? modalScope.linkText.value.trim() : '';
      const format = modalScope.linkFormat ? modalScope.linkFormat.dataset.value : '';
      
      if (!url || !text || !format) {
        showNotification("Please fill in all fields!");
        return;
      }
      closeModal({ action: 'submit', url: url, text: text, format: format });
    };

    window.handleInsertImage = function() {
      return preserveSelection(async function() {
        if (!currentNote || !noteTextarea) return;
        
        const s = noteTextarea.selectionStart,
              e = noteTextarea.selectionEnd,
              v = noteTextarea.value;
        
        const formatOptionsArray = [
          { label: "Select option", value: "" },
          { label: "Markdown", value: "markdown" },
          { label: "MarkUp", value: "markup" }
        ];
        
        const result = await showModal({
          header: `<div class="modal-title">Insert Image</div>`,
          body: `
            <div style="display: flex; gap: 10px; align-items: center;">
              <div style="flex: 1;">
                <label class="modal-label">Image URL</label>
                <input type="url" id="imageUrl" placeholder="Enter image URL">
              </div>
            </div>
            <div style="display: flex; gap: 10px; align-items: center;">
              <div style="flex: 1;">
                <label class="modal-label">Format</label>
                <div class="custom-dropdown">
                  <div id="imageFormat" class="custom-dropdown-trigger modal-input" data-options='${JSON.stringify(formatOptionsArray)}'>Select option</div>
                </div>
              </div>
            </div>
          `,
          footer: `
            <button onclick="closeModal()">Cancel</button>
            <button onclick="handleImageSubmit()" style="background: var(--accent-2); color: #052027;">Insert</button>
          `
        });
        
        if (!result || result.action !== 'submit') return;
        
        const url = result.url;
        const format = result.format;
        
        if (!url || !format) return;
        
        const image = format === "markup" ? 
          `<img src="${url}" alt="Image" />` : 
          `![Image](${url})`;
        
        noteTextarea.value = s === e ? v + image : v.slice(0, s) + image + v.slice(e);
        updateNoteMetadata();
        showNotification("Image inserted!");
      })();
    };

    window.handleImageSubmit = function() {
      const url = modalScope.imageUrl ? modalScope.imageUrl.value.trim() : '';
      const format = modalScope.imageFormat ? modalScope.imageFormat.dataset.value : '';
      
      if (!url || !format) {
        showNotification("Please fill in all fields!");
        return;
      }
      closeModal({ action: 'submit', url: url, format: format });
    };

    window.handleUppercase = function() {
      const r = preserveSelection(function() {
        if (!currentNote || !noteTextarea) return;
        const s = noteTextarea.selectionStart,
              e = noteTextarea.selectionEnd,
              v = noteTextarea.value;
        if (!v) return;
        const f = s === e ? v.toUpperCase() : v.slice(0, s) + v.slice(s, e).toUpperCase() + v.slice(e);
        noteTextarea.value = f;
        updateNoteMetadata();
        showNotification("Converted to uppercase!");
      });
      return typeof r === "function" ? r() : r;
    };

    window.handleLowercase = function() {
      const r = preserveSelection(function() {
        if (!currentNote || !noteTextarea) return;
        const s = noteTextarea.selectionStart,
              e = noteTextarea.selectionEnd,
              v = noteTextarea.value;
        if (!v) return;
        const f = s === e ? v.toLowerCase() : v.slice(0, s) + v.slice(s, e).toLowerCase() + v.slice(e);
        noteTextarea.value = f;
        updateNoteMetadata();
        showNotification("Converted to lowercase!");
      });
      return typeof r === "function" ? r() : r;
    };

    window.handleAlignLeft = function() {
      if (!noteTextarea) return;
      noteTextarea.style.textAlign = "left";
      showNotification("Text aligned left!");
    };

    window.handleAlignCenter = function() {
      if (!noteTextarea) return;
      noteTextarea.style.textAlign = "center";
      showNotification("Text aligned center!");
    };

    window.handleAlignRight = function() {
      if (!noteTextarea) return;
      noteTextarea.style.textAlign = "right";
      showNotification("Text aligned right!");
    };

    window.increaseIndentation = function() {
      const r = preserveSelection(async function() {
        if (!currentNote || !noteTextarea) return;
        const s = noteTextarea.selectionStart,
              e = noteTextarea.selectionEnd;
        if (s === e) {
          showNotification("Please select text to indent!");
          return;
        }
        const t = noteTextarea.value.slice(s, e),
              i = "\t" + t.replace(/\n/g, "\n\t");
        noteTextarea.value = noteTextarea.value.slice(0, s) + i + noteTextarea.value.slice(e);
        updateNoteMetadata();
        showNotification("Text indented!");
      });
      return "function" == typeof r ? r() : r;
    };

    window.decreaseIndentation = function() {
      const r = preserveSelection(async function() {
        if (!currentNote || !noteTextarea) return;
        const s = noteTextarea.selectionStart,
              e = noteTextarea.selectionEnd;
        if (s === e) {
          showNotification("Please select text to un-indent!");
          return;
        }
        const t = noteTextarea.value.slice(s, e).split("\n"),
              i = t.map(e => e.startsWith("\t") ? e.slice(1) : e.startsWith("    ") ? e.slice(4) : e).join("\n");
        noteTextarea.value = noteTextarea.value.slice(0, s) + i + noteTextarea.value.slice(e);
        updateNoteMetadata();
        showNotification("Indentation removed!");
      });
      return "function" == typeof r ? r() : r;
    };

    window.handleSelectAll = function() {
      if (!currentNote || !noteTextarea) return;
      noteTextarea.setSelectionRange(0, noteTextarea.value.length);
      noteTextarea.blur();
      showNotification("All text selected!");
    };

    window.handleCopyNote = function() {
      if (!currentNote || !noteTextarea) return;
      const s = noteTextarea.selectionStart,
            e = noteTextarea.selectionEnd,
            t = s === e ? noteTextarea.value : noteTextarea.value.slice(s, e);
      navigator.clipboard.writeText(t)
        .then(() => showNotification("Copied to clipboard!"))
        .catch(() => showNotification("Copy failed (clipboard not available)."));
    };

    window.handleCutNote = function() {
      if (!currentNote || !noteTextarea) return;
      const s = noteTextarea.selectionStart,
            e = noteTextarea.selectionEnd,
            t = s === e ? noteTextarea.value : noteTextarea.value.slice(s, e);
      navigator.clipboard.writeText(t)
        .then(() => {
          noteTextarea.value = s === e ? "" : noteTextarea.value.slice(0, s) + noteTextarea.value.slice(e);
          noteTextarea.selectionStart = noteTextarea.selectionEnd = s;
          updateNoteMetadata();
          showNotification("Cut to clipboard!");
        })
        .catch(() => showNotification("Cut failed (clipboard not available)."));
    };

    window.handleClearNote = function() {
      const r = preserveSelection(async function() {
        if (!currentNote || !noteTextarea) return;
        const s = noteTextarea.selectionStart,
              e = noteTextarea.selectionEnd,
              v = noteTextarea.value;
        if (s === e) {
          noteTextarea.value = "";
        } else {
          noteTextarea.value = v.slice(0, s) + v.slice(e);
        }
        updateNoteMetadata();
        showNotification("Note cleared!");
      });
      return "function" == typeof r ? r() : r;
    };

    window.handlePasteNote = function() {
      const r = async function() {
        if (!currentNote || !noteTextarea) return;
        if (!navigator.clipboard || !navigator.permissions) {
          showNotification("Paste not supported in this browser.");
          return;
        }
        try {
          const perm = await navigator.permissions.query({ name: "clipboard-read" });
          if (perm.state === "denied") {
            showNotification("Clipboard access denied. Please allow it in your browser settings.");
            return;
          }
          const clip = await navigator.clipboard.readText();
          const s = noteTextarea.selectionStart,
                e = noteTextarea.selectionEnd;
          noteTextarea.value = noteTextarea.value.slice(0, s) + clip + noteTextarea.value.slice(e);
          const n = s + clip.length;
          noteTextarea.selectionStart = noteTextarea.selectionEnd = n;
          updateNoteMetadata();
          showNotification("Pasted from clipboard!");
        } catch {
          showNotification("Paste failed (permission denied or empty clipboard).");
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
