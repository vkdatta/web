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
    
    if (field.hasAttribute('data-skip-validation')) {
      return;
    }
    
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
              if (onclickAttr !== 'closeModal()') {
                if (!validateModalFields(bodyDiv)) {
                  showNotification('Please fill in all required fields.');
                  return;
                }
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

window.handleRename=function(){const e=window.preserveSelection(async function(){if(!window.currentNote)return void window.showNotification("No note selected");const t=window.currentNote.title||"",n=window.currentNote.extension||"",o=await showModal({header:'<div class="modal-title">Rename Note</div>',body:`<div style="display:flex;gap:10px;align-items:center;"><div style="flex:1;"><label class="modal-label">Name</label><input type="text" id="newTitle" placeholder="Enter Name" value="${t.replace(/"/g,"&quot;")}"></div></div><div style="display:flex;gap:10px;align-items:center;"><div style="flex:1;"><label class="modal-label">Extension</label><input type="text" id="newExtension" placeholder="Enter Extension" value="${n.replace(/"/g,"&quot;")}"></div></div>`,footer:'<button onclick="closeModal()">Cancel</button><button onclick="handleRenameSubmit()" style="background:var(--accent-2);color:#052027;">OK</button>'});if(!o||"OK"!==o.action)return;let a=String(o.newTitle||"").trim(),i=String(o.newExtension||"").trim();if(!a&&!i)return;a=a||t,i=i||n,window.currentNote.title=a,window.currentNote.extension=i.replace(/^\./,"").toLowerCase(),window.currentNote.lastEdited=(new Date).toISOString();const l=notes.findIndex(e=>e.id===window.currentNote.id);-1!==l&&(notes[l].title=a,notes[l].extension=window.currentNote.extension,notes[l].lastEdited=window.currentNote.lastEdited),window.updateNoteMetadata(),window.updateDocumentInfo(),window.populateNoteList(),window.showNotification("Note updated!")});return"function"==typeof e?e():e},window.handleRenameSubmit=function(){closeModal({action:"OK",newTitle:modalScope.newTitle?modalScope.newTitle.value:"",newExtension:modalScope.newExtension?modalScope.newExtension.value:""})};
window.handleDownload=async function(){if(!currentNote||!noteTextarea)return;const dfn=`${currentNote.title||'note'}.${currentNote.extension||'txt'}`.replace(/"/g,"&quot;");const res=await showModal({header:`<div class="modal-title">Download Note</div>`,body:`<div style="display: flex; gap: 10px; align-items: center;"><div style="flex: 1;"><label class="modal-label">Filename</label><input type="text" id="fileName" placeholder="Enter filename including extension" value="${dfn}"></div></div>`,footer:`<button onclick="closeModal()">Cancel</button><button onclick="handleDownloadSubmit()" data-skip-validation style="background: var(--accent-2); color: #052027;">Download</button>`});if(!res||res.action!=="Download")return;let f=String(res.fileName||"").trim();if(!f)return;f=f.replace(/\0/g,"").replace(/[/\\]+/g,"").replace(/["'<>:|?*]+/g,"");const p=f.split("."),ext=p.length>1?(p.pop()||"txt").toLowerCase():"txt",name=p.join(".")||"note",mimeMap={txt:"text/plain; charset=utf-8",text:"text/plain; charset=utf-8",md:"text/markdown; charset=utf-8",markdown:"text/markdown; charset=utf-8",csv:"text/csv; charset=utf-8",log:"text/plain; charset=utf-8",ini:"text/plain; charset=utf-8",conf:"text/plain; charset=utf-8",env:"text/plain; charset=utf-8",html:"text/html; charset=utf-8",htm:"text/html; charset=utf-8",css:"text/css; charset=utf-8",js:"application/javascript; charset=utf-8",mjs:"text/javascript; charset=utf-8",ts:"application/typescript; charset=utf-8",jsx:"text/jsx; charset=utf-8",tsx:"text/tsx; charset=utf-8",json:"application/json; charset=utf-8",xml:"application/xml; charset=utf-8",yaml:"text/yaml; charset=utf-8",yml:"text/yaml; charset=utf-8",png:"image/png",jpg:"image/jpeg",jpeg:"image/jpeg",webp:"image/webp",gif:"image/gif",svg:"image/svg+xml; charset=utf-8",ico:"image/vnd.microsoft.icon",woff:"font/woff",woff2:"font/woff2",ttf:"font/ttf",otf:"font/otf",mp3:"audio/mpeg",m4a:"audio/mp4",wav:"audio/wav",ogg:"audio/ogg",flac:"audio/flac",mp4:"video/mp4",m4v:"video/x-m4v",mov:"video/quicktime",webm:"video/webm",mkv:"video/x-matroska",avi:"video/x-msvideo",zip:"application/zip",tar:"application/x-tar",gz:"application/gzip",tgz:"application/gzip",bz2:"application/x-bzip2",xz:"application/x-xz",rar:"application/vnd.rar","7z":"application/x-7z-compressed",pdf:"application/pdf",doc:"application/msword",docx:"application/vnd.openxmlformats-officedocument.wordprocessingml.document",xls:"application/vnd.ms-excel",xlsx:"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",ppt:"application/vnd.ms-powerpoint",pptx:"application/vnd.openxmlformats-officedocument.presentationml.presentation",odt:"application/vnd.oasis.opendocument.text",ods:"application/vnd.oasis.opendocument.spreadsheet",odp:"application/vnd.oasis.opendocument.presentation",epub:"application/epub+zip",exe:"application/vnd.microsoft.portable-executable",dll:"application/octet-stream",bin:"application/octet-stream",wasm:"application/wasm",sh:"application/x-sh",bash:"application/x-sh",ps1:"text/plain; charset=utf-8",bat:"application/x-msdownload",sql:"text/x-sql; charset=utf-8",rtf:"application/rtf",svgz:"image/svg+xml; charset=utf-8",heic:"image/heic",heif:"image/heif"},textLike=["text/plain","text/markdown","text/csv","text/html","application/json","application/javascript","application/xml","text/yaml","text/jsx","text/tsx"],mime=mimeMap[ext]||(/\.(jpg|jpeg|png|gif|webp|svg|ico)$/i.test(ext)?`image/${ext}`:"application/octet-stream");if(textLike.some(t=>mime.indexOf(t)===0)&&!/charset=/.test(mime))mime+="; charset=utf-8";const fileName=`${name}.${ext}`,blob=new Blob([noteTextarea.value],{type:mime}),url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download=fileName;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1500);showNotification(`Note downloaded as ${fileName}!`);};window.handleDownloadSubmit=function(){const fileName=modalScope.fileName?modalScope.fileName.value:'';closeModal({action:'Download',fileName});};
window.handleFindReplace=async function(){if(!currentNote||!noteTextarea)return;const r=await showModal({header:`<div class="modal-title">Find and Replace</div>`,body:`<div style="display: flex; gap: 10px; align-items: center;"><div style="flex: 1;"><label class="modal-label">Find</label><input type="text" id="findText" placeholder="Enter text to find"></div></div><div style="display: flex; gap: 10px; align-items: center;"><div style="flex: 1;"><label class="modal-label">Replace</label><input type="text" id="replaceText" placeholder="Enter replacement text" data-skip-validation></div></div><div style="display: flex; align-items: center; margin-top: 8px;"><input type="checkbox" id="caseSensitive" style="color: var(--accent-2);margin-right: 6px"><label for="caseSensitive" class="modal-label">Case sensitive</label></div>`,footer:`<button onclick="closeModal()">Cancel</button><button onclick="handleFindReplaceSubmit()" style="background: var(--accent-2); color: #052027;">Replace</button>`});if(!r||r.action!=="Replace")return;const f=r.findText.trim(),p=r.replaceText,c=r.caseSensitive===true;if(!f){showNotification("Please enter text to find!");return}try{const e=f.replace(/[.*+?^${}()|[\]\\]/g,"\\$&"),t=new RegExp(e,c?"g":"gi");noteTextarea.value=noteTextarea.value.replace(t,p),updateNoteMetadata(),showNotification("Text replaced!")}catch(e){showNotification("Error in find and replace!")}};window.handleFindReplaceSubmit=function(){const e=modalScope.findText?modalScope.findText.value:"",t=modalScope.replaceText?modalScope.replaceText.value:"",c=modalScope.caseSensitive?modalScope.caseSensitive.checked:false;closeModal({action:"Replace",findText:e,replaceText:t,caseSensitive:c})};    
var MD5 = function(d){var r = M(V(Y(X(d),8*d.length)));return r.toLowerCase()};function M(d){for(var _,m="0123456789ABCDEF",f="",r=0;r<d.length;r++)_=d.charCodeAt(r),f+=m.charAt(_>>>4&15)+m.charAt(15&_);return f}function X(d){for(var _=Array(d.length>>2),m=0;m<_.length;m++)_[m]=0;for(m=0;m<8*d.length;m+=8)_[m>>5]|=(255&d.charCodeAt(m/8))<<m%32;return _}function V(d){for(var _="",m=0;m<32*d.length;m+=8)_+=String.fromCharCode(d[m>>5]>>>m%32&255);return _}function Y(d,_){d[_>>5]|=128<<_%32,d[14+(_+64>>>9<<4)]=_;for(var m=1732584193,f=-271733879,r=-1732584194,i=271733878,n=0;n<d.length;n+=16){var h=m,t=f,g=r,e=i;f=md5_ii(f=md5_ii(f=md5_ii(f=md5_ii(f=md5_hh(f=md5_hh(f=md5_hh(f=md5_hh(f=md5_gg(f=md5_gg(f=md5_gg(f=md5_gg(f=md5_ff(f=md5_ff(f=md5_ff(f=md5_ff(f,r=md5_ff(r,i=md5_ff(i,m=md5_ff(m,f,r,i,d[n+0],7,-680876936),f,r,d[n+1],12,-389564586),m,f,d[n+2],17,606105819),i,m,d[n+3],22,-1044525330),r=md5_ff(r,i=md5_ff(i,m=md5_ff(m,f,r,i,d[n+4],7,-176418897),f,r,d[n+5],12,1200080426),m,f,d[n+6],17,-1473231341),i,m,d[n+7],22,-45705983),r=md5_ff(r,i=md5_ff(i,m=md5_ff(m,f,r,i,d[n+8],7,1770035416),f,r,d[n+9],12,-1958414417),m,f,d[n+10],17,-42063),i,m,d[n+11],22,-1990404162),r=md5_ff(r,i=md5_ff(i,m=md5_ff(m,f,r,i,d[n+12],7,1804603682),f,r,d[n+13],12,-40341101),m,f,d[n+14],17,-1502002290),i,m,d[n+15],22,1236535329),r=md5_gg(r,i=md5_gg(i,m=md5_gg(m,f,r,i,d[n+1],5,-165796510),f,r,d[n+6],9,-1069501632),m,f,d[n+11],14,643717713),i,m,d[n+0],20,-373897302),r=md5_gg(r,i=md5_gg(i,m=md5_gg(m,f,r,i,d[n+5],5,-701558691),f,r,d[n+10],9,38016083),m,f,d[n+15],14,-660478335),i,m,d[n+4],20,-405537848),r=md5_gg(r,i=md5_gg(i,m=md5_gg(m,f,r,i,d[n+9],5,568446438),f,r,d[n+14],9,-1019803690),m,f,d[n+3],14,-187363961),i,m,d[n+8],20,1163531501),r=md5_gg(r,i=md5_gg(i,m=md5_gg(m,f,r,i,d[n+13],5,-1444681467),f,r,d[n+2],9,-51403784),m,f,d[n+7],14,1735328473),i,m,d[n+12],20,-1926607734),r=md5_hh(r,i=md5_hh(i,m=md5_hh(m,f,r,i,d[n+5],4,-378558),f,r,d[n+8],11,-2022574463),m,f,d[n+11],16,1839030562),i,m,d[n+14],23,-35309556),r=md5_hh(r,i=md5_hh(i,m=md5_hh(m,f,r,i,d[n+1],4,-1530992060),f,r,d[n+4],11,1272893353),m,f,d[n+7],16,-155497632),i,m,d[n+10],23,-1094730640),r=md5_hh(r,i=md5_hh(i,m=md5_hh(m,f,r,i,d[n+13],4,681279174),f,r,d[n+0],11,-358537222),m,f,d[n+3],16,-722521979),i,m,d[n+6],23,76029189),r=md5_hh(r,i=md5_hh(i,m=md5_hh(m,f,r,i,d[n+9],4,-640364487),f,r,d[n+12],11,-421815835),m,f,d[n+15],16,530742520),i,m,d[n+2],23,-995338651),r=md5_ii(r,i=md5_ii(i,m=md5_ii(m,f,r,i,d[n+0],6,-198630844),f,r,d[n+7],10,1126891415),m,f,d[n+14],15,-1416354905),i,m,d[n+5],21,-57434055),r=md5_ii(r,i=md5_ii(i,m=md5_ii(m,f,r,i,d[n+12],6,1700485571),f,r,d[n+3],10,-1894986606),m,f,d[n+10],15,-1051523),i,m,d[n+1],21,-2054922799),r=md5_ii(r,i=md5_ii(i,m=md5_ii(m,f,r,i,d[n+8],6,1873313359),f,r,d[n+15],10,-30611744),m,f,d[n+6],15,-1560198380),i,m,d[n+13],21,1309151649),r=md5_ii(r,i=md5_ii(i,m=md5_ii(m,f,r,i,d[n+4],6,-145523070),f,r,d[n+11],10,-1120210379),m,f,d[n+2],15,718787259),i,m,d[n+9],21,-343485551),m=safe_add(m,h),f=safe_add(f,t),r=safe_add(r,g),i=safe_add(i,e)}return Array(m,f,r,i)}function md5_cmn(d,_,m,f,r,i){return safe_add(bit_rol(safe_add(safe_add(_,d),safe_add(f,i)),r),m)}function md5_ff(d,_,m,f,r,i,n){return md5_cmn(_&m|~_&f,d,_,r,i,n)}function md5_gg(d,_,m,f,r,i,n){return md5_cmn(_&f|m&~f,d,_,r,i,n)}function md5_hh(d,_,m,f,r,i,n){return md5_cmn(_^m^f,d,_,r,i,n)}function md5_ii(d,_,m,f,r,i,n){return md5_cmn(m^(_|~f),d,_,r,i,n)}function safe_add(d,_){var m=(65535&d)+(65535&_);return(d>>16)+(_>>16)+(m>>16)<<16|65535&m}function bit_rol(d,_){return d<<_|d>>>32-_}
window.MD5 = () => {if (!noteTextarea) return;noteTextarea.value = MD5(noteTextarea.value);showNotification('MD5 Generated!');};
window.reverseText=preserveSelection(async()=>{if(!currentNote||!noteTextarea)return;const s=noteTextarea.selectionStart;const e=noteTextarea.selectionEnd;if(s===e){noteTextarea.value=noteTextarea.value.split('').reverse().join('')}else{const t=noteTextarea.value;const n=t.substring(s,e);const r=n.split('').reverse().join('');noteTextarea.value=t.substring(0,s)+r+t.substring(e)}updateNoteMetadata();showNotification('Text reversed!')});
window.reverseWords=preserveSelection(async()=>{if(!currentNote||!noteTextarea)return;const s=noteTextarea.selectionStart;const e=noteTextarea.selectionEnd;if(s===e){noteTextarea.value=noteTextarea.value.split(/\s+/).reverse().join(' ')}else{const t=noteTextarea.value;const n=t.substring(s,e);const r=n.split(/\s+/).reverse().join(' ');noteTextarea.value=t.substring(0,s)+r+t.substring(e)}updateNoteMetadata();showNotification('Words reversed!')});
window.capitalizeWords=preserveSelection(async()=>{if(!currentNote||!noteTextarea)return;const s=noteTextarea.selectionStart;const e=noteTextarea.selectionEnd;if(s===e){noteTextarea.value=noteTextarea.value.replace(/\b\w+/g,t=>t.charAt(0).toUpperCase()+t.slice(1).toLowerCase())}else{const t=noteTextarea.value;const n=t.substring(s,e);const r=n.replace(/\b\w+/g,t=>t.charAt(0).toUpperCase()+t.slice(1).toLowerCase());noteTextarea.value=t.substring(0,s)+r+t.substring(e)}updateNoteMetadata();showNotification('Words capitalized!')});
window.capitalizeSentences=preserveSelection(async()=>{if(!currentNote||!noteTextarea)return;const s=noteTextarea.selectionStart;const e=noteTextarea.selectionEnd;if(s===e){noteTextarea.value=noteTextarea.value.toLowerCase().replace(/(^\s*[a-z])|([.!?]\s*[a-z])/g,t=>t.toUpperCase())}else{const t=noteTextarea.value;const n=t.substring(s,e).toLowerCase();const r=n.replace(/(^\s*[a-z])|([.!?]\s*[a-z])/g,t=>t.toUpperCase());noteTextarea.value=t.substring(0,s)+r+t.substring(e)}updateNoteMetadata();showNotification('Sentences capitalized!')});
function escapeRegExp(s){return s.replace(/[.*+?^${}()|[\]\\]/g,"\\$&");}
window.handlePattern=async function(){if(!currentNote||!noteTextarea)return;const r=await showModal({header:`<div class="modal-title">Replace Between Delimiters</div>`,body:`<style>.modal-btn.active { background: var(--accent-2); color: #cacaca; }</style><div><label class="modal-label">Start delimiter</label><input type="text" id="startDelim" placeholder="Start delimiter (required)"></div><div><label class="modal-label">End delimiter</label><input type="text" id="endDelim" placeholder="End delimiter (required)"></div><div style="display:flex;align-items:center;gap:8px;margin-top:6px;"><input type="checkbox" id="includeDelims"><label for="includeDelims" class="modal-label">Include delimiters in replacement</label></div><div><label class="modal-label">Replacement text</label><input type="text" id="replaceText" placeholder="Replacement text" data-skip-validation></div><div style="margin-top:8px;font-weight:600;">Which instances to replace?</div><div style="display:flex;gap:8px;margin-top:4px;"><button type="button" id="allMode" class="modal-btn active" data-mode="all">All</button><button type="button" id="singleMode" class="modal-btn" data-mode="single">Single</button><button type="button" id="rangeMode" class="modal-btn" data-mode="range">Range</button></div><div id="singleContainer" style="display:none;margin-top:6px;"><label class="modal-label">Instance number (1-based)</label><input type="number" id="singleInstance" min="1" value="1"></div><div id="rangeContainer" style="display:none;margin-top:6px;display:flex;gap:8px;"><div><label class="modal-label">From (1-based)</label><input type="number" id="rangeFrom" min="1" value="1"></div><div><label class="modal-label">To (1-based)</label><input type="number" id="rangeTo" min="1" value="1"></div></div><div id="matchInfo" style="font-size:13px;color:var(--modal-muted);margin-top:6px;">Matches: 0</div>`,footer:`<button onclick="closeModal()">Cancel</button><button onclick="handlePatternSubmit()" style="background: var(--accent-2); color: #052027;">Replace</button>`});if(!r||r.action!=='submit')return;const{startDelim,endDelim,includeDelims,replaceText,mode,singleInstance,rangeFrom,rangeTo}=r;if(!startDelim) return showNotification('Start delimiter required');if(!endDelim) return showNotification('End delimiter required');const text=noteTextarea.value,pairs=findPairs(text,startDelim,endDelim);if(!pairs.length) return showNotification('No matches found');let from=1,to=pairs.length;if(mode==='single'){const n=parseInt(singleInstance,10);if(isNaN(n)||n<1) return showNotification('Invalid instance number');from=to=Math.min(Math.max(n,1),pairs.length);}else if(mode==='range'){const f=parseInt(rangeFrom,10),t=parseInt(rangeTo,10);if(isNaN(f)||isNaN(t)) return showNotification('Invalid range');from=Math.min(Math.max(f,1),pairs.length);to=Math.min(Math.max(t,from),pairs.length);}try{let out=text;for(let i=pairs.length-1;i>=0;i--){const pair=pairs[i],idx1=i+1;if(idx1<from||idx1>to)continue;const before=out.slice(0,pair.startIndex),after=out.slice(pair.endIndex);let middle;if(includeDelims){middle=replaceText;}else{middle=startDelim+replaceText+endDelim;}out=before+middle+after;}noteTextarea.value=out;typeof updateNoteMetadata==='function'&&updateNoteMetadata();const replacedCount=Math.max(0,Math.min(to,pairs.length)-from+1);showNotification(`Replacement done! (${replacedCount} instance(s) replaced)`);}catch(err){console.error('Replacement error',err);showNotification('Replacement failed — see console');}};
window.handlePatternSubmit=function(){const s=modalScope.startDelim?modalScope.startDelim.value.trim():'',e=modalScope.endDelim?modalScope.endDelim.value.trim():'',inc=modalScope.includeDelims?modalScope.includeDelims.checked:false,rep=modalScope.replaceText?modalScope.replaceText.value:'',mode=modalScope.allMode&&modalScope.allMode.classList.contains('active')?'all':modalScope.singleMode&&modalScope.singleMode.classList.contains('active')?'single':'range',si=modalScope.singleInstance?modalScope.singleInstance.value:'1',rf=modalScope.rangeFrom?modalScope.rangeFrom.value:'1',rt=modalScope.rangeTo?modalScope.rangeTo.value:'1';closeModal({action:'submit',startDelim:s,endDelim:e,includeDelims:inc,replaceText:rep,mode:mode,singleInstance:si,rangeFrom:rf,rangeTo:rt});};
document.addEventListener('click',function(e){if(!modalScope) return;const id=e.target&&e.target.id;if(id==='allMode'||id==='singleMode'||id==='rangeMode'){['allMode','singleMode','rangeMode'].forEach(i=>modalScope[i]&&modalScope[i].classList.remove('active'));e.target.classList.add('active');modalScope.singleContainer&&(modalScope.singleContainer.style.display=(id==='singleMode')?'block':'none');modalScope.rangeContainer&&(modalScope.rangeContainer.style.display=(id==='rangeMode')?'flex':'none');}});
document.addEventListener('input',function(e){if(!modalScope) return;const tid=e.target&&e.target.id;if(tid==='startDelim'||tid==='endDelim'){const s=modalScope.startDelim?modalScope.startDelim.value:'',f=modalScope.endDelim?modalScope.endDelim.value:'';if(!s||!f){modalScope.matchInfo&&(modalScope.matchInfo.textContent='Matches: 0');return}const pairs=findPairs(noteTextarea.value,s,f);modalScope.matchInfo&&(modalScope.matchInfo.textContent=`Matches: ${pairs.length}`);if(pairs.length){modalScope.rangeFrom&&(modalScope.rangeFrom.value='1');modalScope.rangeTo&&(modalScope.rangeTo.value=String(pairs.length));modalScope.singleInstance&&(modalScope.singleInstance.value='1');}}});
function findPairs(text,startDelim,endDelim){const pairs=[];if(!startDelim||!endDelim) return pairs;const sLen=startDelim.length,eLen=endDelim.length,stack=[];let i=0;while(i<text.length){if(text.substr(i,sLen)===startDelim){stack.push(i);i+=sLen;continue}if(text.substr(i,eLen)===endDelim){if(stack.length>0){const startIdx=stack.pop(),endIdx=i+eLen;pairs.push({startIndex:startIdx,endIndex:endIdx});}i+=eLen;continue}i++}return pairs.sort((a,b)=>a.startIndex-b.startIndex);}

window.handleAdd=async()=>{if(!currentNote||!noteTextarea)return;const r=await showModal({header:`<div class="modal-title">Add Text to Lines</div>`,body:`<div style="display:flex;flex-direction:column;gap:10px;"><div><label class="modal-label">Insert text</label><input type="text" id="insertText" class="modal-input" placeholder="Text to insert (use %L for line number, %N for new line)" data-skip-validation></div><div><label class="modal-label">Insert position</label><div class="custom-dropdown"><div id="insertPosition" class="custom-dropdown-trigger modal-input" data-options='[{"label":"Insert at start of line","value":"start"},{"label":"Insert at end of line","value":"end"},{"label":"Insert at specific column","value":"column"}]' data-value="start">Insert at start of line</div></div></div><div id="colContainer" style="display:none"><label class="modal-label">Column number</label><input type="number" id="columnNumber" class="modal-input" placeholder="Column number (1-based)" min="1"></div></div>`,footer:`<button onclick="closeModal()">Cancel</button><button onclick="handleAddSubmit()" style="background: var(--accent-2); color: #cacaca;">Add</button>`,html:true});if(!r||r.action!=="submit")return;const{insertText,insertPosition,columnNumber}=r;const col=parseInt(columnNumber,10)||1;const lines=noteTextarea.value.split("\n");let result="";for(let i=0;i<lines.length;i++){let line=lines[i];const replacement=insertText.replace(/%L/g,String(i+1)).replace(/%N/g,"\n");if(insertPosition==="start"){line=replacement+line;}else if(insertPosition==="end"){line=line+replacement;}else if(insertPosition==="column"){const idx=Math.max(0,col-1);if(line.length<idx){line=line.padEnd(idx," ");}line=line.slice(0,idx)+replacement+line.slice(idx);}result+=line+(i<lines.length-1?"\n":"");}noteTextarea.value=result;if(typeof updateNoteMetadata==="function")updateNoteMetadata();if(typeof updatecounts==="function")updatecounts();showNotification("Text added successfully!");};
window.handleAddSubmit=function(){const insertText=modalScope.insertText?modalScope.insertText.value:"";const insertPosition=modalScope.insertPosition?modalScope.insertPosition.dataset.value:"start";const columnNumber=modalScope.columnNumber?modalScope.columnNumber.value:"";closeModal({action:"submit",insertText,insertPosition,columnNumber});};
document.addEventListener("click",e=>{if(!modalScope)return;const positionElem=modalScope.insertPosition;if(!positionElem)return;const value=positionElem.dataset.value||"start";const colContainer=modalScope.colContainer;if(colContainer){colContainer.style.display=(value==="column")?"block":"none";}});    

window.handleCleanupText=async()=>{if(!currentNote||!noteTextarea)return;const r=await showModal({header:`<div class="modal-title">Cleanup Text</div>`,body:`<div style="display:flex;flex-direction:column;gap:10px;"><div><label class="modal-label">Choose Cleanup Style</label><div class="custom-dropdown"><div id="cleanupStyle" class="custom-dropdown-trigger modal-input" data-options='[{"label":"Select CleanUp Style","value":""},{"label":"Remove Linebreaks","value":"remove_linebreaks"},{"label":"Remove Parabreaks","value":"remove_parabreaks"},{"label":"Remove Both Line & Para Breaks","value":"remove_both"},{"label":"Whitespace Cleanup","value":"whitespace_cleanup"},{"label":"Trim Columns","value":"trim_columns"},{"label":"Tidy Lines","value":"tidy_lines"}]' data-value="">Select CleanUp Style</div></div></div><div id="trimContainer" style="display:none;flex-direction:column;gap:10px;"><div><label class="modal-label">Number of Columns</label><input type="number" id="trimNumber" class="modal-input" value="1" min="1"></div><div><label class="modal-label">Trim Side</label><div class="custom-dropdown"><div id="trimSide" class="custom-dropdown-trigger modal-input" data-options='[{"label":"Left","value":"left"},{"label":"Right","value":"right"}]' data-value="left">Left</div></div></div></div></div>`,footer:`<button onclick="closeModal()">Cancel</button><button onclick="handleCleanupSubmit()" style="background: var(--accent-2); color: #cacaca;">Cleanup</button>`,html:true});if(!r||r.action!=="submit")return;const{cleanupStyle,trimNumber,trimSide}=r;let text=noteTextarea.value;if(cleanupStyle==="remove_linebreaks"){text=text.replace(/\r\n|\r|\n/g,' ');}else if(cleanupStyle==="remove_parabreaks"){text=text.replace(/\n{3,}/g,'\n\n');}else if(cleanupStyle==="remove_both"){text=text.replace(/\r\n|\r|\n/g,' ').replace(/\s+/g,' ').trim();}else if(cleanupStyle==="whitespace_cleanup"){text=text.replace(/\t+/g,' ').replace(/ {2,}/g,' ').replace(/\n{3,}/g,'\n\n').replace(/^\n+|\n+$/g,'');}else if(cleanupStyle==="trim_columns"){const n=parseInt(trimNumber,10)||0;text=text.split('\n').map(line=>{if(trimSide==="left")return line.slice(n);if(trimSide==="right")return line.slice(0,-n);return line;}).join('\n');}else if(cleanupStyle==="tidy_lines"){text=text.split('\n').map(line=>line.trim()).join('\n');}noteTextarea.value=text;if(typeof updateNoteMetadata==="function")updateNoteMetadata();showNotification('Text cleaned successfully!');};window.handleCleanupSubmit=function(){const cleanupStyle=modalScope.cleanupStyle?modalScope.cleanupStyle.dataset.value:"";const trimNumber=modalScope.trimNumber?modalScope.trimNumber.value:"1";const trimSide=modalScope.trimSide?modalScope.trimSide.dataset.value:"left";if(!cleanupStyle)return showNotification("Please select a cleanup style!");closeModal({action:"submit",cleanupStyle,trimNumber,trimSide});};document.addEventListener("click",e=>{if(!modalScope)return;const styleElem=modalScope.cleanupStyle;if(!styleElem)return;const value=styleElem.dataset.value||"";const trimContainer=modalScope.trimContainer;if(trimContainer){trimContainer.style.display=(value==="trim_columns")?"flex":"none";}});

(function(){const DEFAULTS={maxEntries:50,powerWindowMs:3000,coalesceMs:500,memoryBudgetBytes:200000,persistKey:'myapp_undo_data_v5',persistTTL:864e5,imeDebounce:50};function approxBytes(e){try{return new Blob([JSON.stringify(e)]).size}catch(t){return JSON.stringify(e).length}}function now(){return Date.now()}function shallowEqual(e,t){return e&&t&&e.value===t.value&&e.start===t.start&&e.end===t.end}function clamp(e,t,n){return Math.max(t,Math.min(n,e))}function getSelectionState(e){if(!e)return{start:0,end:0,dir:'forward'};try{return{start:e.selectionStart||0,end:e.selectionEnd||0,dir:e.selectionDirection||'forward'}}catch(t){return{start:0,end:0,dir:'forward'}}}function restoreSelectionState(e,t){if(!e||!t)return;try{e.setSelectionRange(t.start,t.end,t.dir);}catch(n){}}function snapshot(e){return{value:e.value,...getSelectionState(e),ts:now()}}function diffIsSmall(e,t){if(!e||!t)return false;const n=e.value||'',r=t.value||'';if(Math.abs(n.length-r.length)>5)return false;let i=0;for(let o=0,a=0;o<n.length||a<r.length;){if(n[o]!==r[a]){i++;if(i>2)return false;o++;a++}else{o++;a++}}return true}class HistoryManager{constructor(e,t){this.opts=Object.assign({},DEFAULTS,t||{});this.maxEntries=this.opts.maxEntries;this.powerWindowMs=this.opts.powerWindowMs;this.coalesceMs=this.opts.coalesceMs;this.persistKey=this.opts.persistKey;this.persistTTL=this.opts.persistTTL;this.imeDebounce=this.opts.imeDebounce;this.target=null;this._onInput=this._onInput.bind(this);this._onCutPaste=this._onCutPaste.bind(this);this._onKeydown=this._onKeydown.bind(this);this._onCompositionStart=this._onCompositionStart.bind(this);this._onCompositionEnd=this._onCompositionEnd.bind(this);this._observer=null;this._composition=false;this._coalesceTimer=null;this._undo=[];this._redo=[];this._suppress=false;this._wrapped={};this._lastUndoClick=0;this._lastRedoClick=0;this._undoPower=1;this._redoPower=1;if(e)this.init(e)}init(e){if(!e||'TEXTAREA'!==e.tagName.toUpperCase())throw new Error('target must be textarea');this.destroy();this.target=e;this._loadPersist();this._installListeners();this._wrapProgrammatics();this._commitInitial()}destroy(){this._uninstallListeners();this._unwrapProgrammatics();this._disconnectObserver();this._undo=[];this._redo=[];this.target=null;this._suppress=false}performUndo(){if(!this.target)return;if(this._undo.length<=1){this._notify('Nothing to undo');return}let e=Math.min(this._undoPower,this._undo.length-1);this._suppress=true;for(let t=0;t<e;t++){let e=this._undo.pop();this._redo.push(e)}let t=this._undo[this._undo.length-1];t&&this._applyFrame(t);this._suppress=false;this._notify(`Undo performed (${e} step(s))`);this._persist()}performRedo(){if(!this.target)return;if(this._redo.length===0){this._notify('Nothing to redo');return}let e=Math.min(this._redoPower,this._redo.length);this._suppress=true;for(let t=0;t<e;t++){let e=this._redo.pop();this._undo.push(e)}let t=this._undo[this._undo.length-1];t&&this._applyFrame(t);this._suppress=false;this._notify(`Redo performed (${e} step(s))`);this._persist()}clear(){this._undo=[];this._redo=[];this._persist()}recordNow(e){if(!this.target)return;this._commitImmediate(e||'manual')}serialize(){return JSON.stringify({undo:this._undo,redo:this._redo,ts:now()})}deserialize(e){try{const t=typeof e==='string'?JSON.parse(e):e;this._undo=t.undo||[];this._redo=t.redo||[];this._trim();this._persist();return true}catch(n){return false}}_notify(e){try{window.showNotification&&showNotification(e)}catch(t){console.log(e)}}_applyFrame(e){if(!this.target)return;this._suppress=true;this.target.value=e.value;restoreSelectionState(this.target,e);if(window.currentNote)window.currentNote.content=e.value;if(typeof window.updateNoteMetadata==='function')window.updateNoteMetadata();this._suppress=false}_createFrame(e){return{value:e.value,start:e.start,end:e.end,dir:e.dir,ts:e.ts}}_undoPush(e){if(this._undo.length&&shallowEqual(this._undo[this._undo.length-1],e))return;this._undo.push(e);this._trim();this._persist()}_redoPush(e){if(this._redo.length&&shallowEqual(this._redo[this._redo.length-1],e))return;this._redo.push(e);this._trim();this._persist()}_trim(){const e=this.maxEntries;while(this._undo.length>e)this._undo.shift();while(this._redo.length>e)this._redo.shift();if(this.opts.memoryBudgetBytes){let t=approxBytes({undo:this._undo,redo:this._redo});while(t>this.opts.memoryBudgetBytes&&this._undo.length>1){this._undo.shift();t=approxBytes({undo:this._undo,redo:this._redo})}}}_persist(){try{localStorage.setItem(this.persistKey,JSON.stringify({undo:this._undo,redo:this._redo,expires:now()+this.persistTTL}))}catch(e){}}_loadPersist(){try{const e=localStorage.getItem(this.persistKey);if(!e)return;const t=JSON.parse(e);if(t.expires&&t.expires>now()){this._undo=(t.undo||[]).slice(-this.maxEntries);this._redo=(t.redo||[]).slice(-this.maxEntries)}}catch(n){}}_commitInitial(){if(!this.target)return;const e=snapshot(this.target);this._undo=[this._createFrame(e)];this._redo=[];this._persist()}_installListeners(){if(!this.target)return;this.target.addEventListener('input',this._onInput);this.target.addEventListener('paste',this._onCutPaste);this.target.addEventListener('cut',this._onCutPaste);this.target.addEventListener('keydown',this._onKeydown);this.target.addEventListener('compositionstart',this._onCompositionStart);this.target.addEventListener('compositionend',this._onCompositionEnd);this._observer=new MutationObserver(()=>{if(this._suppress)return;this._scheduleCommit()});this._observer.observe(this.target,{characterData:true,childList:true,subtree:true});if(window.undoBtn)window.undoBtn.addEventListener('click',()=>{const e=now();if(e-this._lastUndoClick<=this.powerWindowMs){this._undoPower=clamp(this._undoPower+1,1,this.maxEntries)}else{this._undoPower=1}this._lastUndoClick=e;this._redoPower=1;this._lastRedoClick=0;this.performUndo()});if(window.redoBtn)window.redoBtn.addEventListener('click',()=>{const e=now();if(e-this._lastRedoClick<=this.powerWindowMs){this._redoPower=clamp(this._redoPower+1,1,this.maxEntries)}else{this._redoPower=1}this._lastRedoClick=e;this._undoPower=1;this._lastUndoClick=0;this.performRedo()})}_uninstallListeners(){if(!this.target)return;try{this.target.removeEventListener('input',this._onInput);this.target.removeEventListener('paste',this._onCutPaste);this.target.removeEventListener('cut',this._onCutPaste);this.target.removeEventListener('keydown',this._onKeydown);this.target.removeEventListener('compositionstart',this._onCompositionStart);this.target.removeEventListener('compositionend',this._onCompositionEnd)}catch(e){}this._disconnectObserver();if(window.undoBtn)window.undoBtn.removeEventListener('click',this.performUndo);if(window.redoBtn)window.redoBtn.removeEventListener('click',this.performRedo)}_disconnectObserver(){if(this._observer){try{this._observer.disconnect()}catch(e){}this._observer=null}}_onInput(e){if(this._suppress)return;if(this._composition)return this._scheduleCommit();this._scheduleCommit()}_onCutPaste(e){if(this._suppress)return;this._scheduleCommit(0)}_onKeydown(e){if((e.ctrlKey||e.metaKey)&&!e.altKey){if(e.key==='z'||e.key==='Z'){if(e.shiftKey){e.preventDefault();this.performRedo()}else{e.preventDefault();this.performUndo()}}else if(e.key==='y'||e.key==='Y'){e.preventDefault();this.performRedo()}}}_onCompositionStart(){this._composition=true}_onCompositionEnd(){this._composition=false;setTimeout(()=>{this._scheduleCommit(0)},this.imeDebounce)}_scheduleCommit(e){clearTimeout(this._coalesceTimer);if(e===0){this._commitImmediate('immediate');return}this._coalesceTimer=setTimeout(()=>{this._commitImmediate('coalesced')},this.coalesceMs)}_commitImmediate(e){clearTimeout(this._coalesceTimer);if(!this.target)return;const t=snapshot(this.target);if(this._suppress)return;const n=this._undo[this._undo.length-1];if(n&&shallowEqual(n,t))return;if(n&&diffIsSmall(n,t)&&now()-n.ts<this.coalesceMs&&!this._composition){this._undo[this._undo.length-1]=this._createFrame(t);this._undo[this._undo.length-1].ts=now()}else{this._undoPush(this._createFrame(t))}this._redo=[];this._persist()}_wrapProgrammatics(){if(!this.target)return;const e=this.target,t=this;try{if(!e.__undov_value_wrapped){const n=Object.getOwnPropertyDescriptor(e,'value')||Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype,'value');const r=n.get||function(){return this.value};const i=n.set||function(e){this.value=e};Object.defineProperty(e,'value',{configurable:true,enumerable:n.enumerable,get:function(){return r.call(this)},set:function(e){if(t._suppress)return i.call(this,e);i.call(this,e);t.recordNow('setter')}});e.__undov_value_wrapped=true;this._wrapped.value=true}}catch(n){}try{if(typeof e.setRangeText==='function'&&!e.__undov_setRangeText_wrapped){const n=e.setRangeText;e.setRangeText=function(){if(t._suppress)return n.apply(this,arguments);const e=snapshot(this);const r=n.apply(this,arguments);t.recordNow('setRangeText');return r};e.__undov_setRangeText_wrapped=true;this._wrapped.setRangeText=true}}catch(n){}}_unwrapProgrammatics(){const e=this.target;try{if(e&&e.__undov_value_wrapped)delete e.__undov_value_wrapped;if(e&&e.__undov_setRangeText_wrapped)delete e.__undov_setRangeText_wrapped}catch(t){}}}function autoWire(){const e=document.getElementById('noteTextarea')||document.querySelector('textarea');if(!e)return null;window.__HistoryManagerInstance&&window.__HistoryManagerInstance.destroy();window.__HistoryManagerInstance=new HistoryManager(e);window.performUndo=()=>window.__HistoryManagerInstance.performUndo();window.performRedo=()=>window.__HistoryManagerInstance.performRedo();window.clearUndoHistory=()=>window.__HistoryManagerInstance.clear();window.recordState=(e)=>window.__HistoryManagerInstance.recordNow(e);window.serializeUndoHistory=()=>window.__HistoryManagerInstance.serialize();window.deserializeUndoHistory=(e)=>window.__HistoryManagerInstance.deserialize(e);return window.__HistoryManagerInstance}if(document.readyState==='loading'){document.addEventListener('DOMContentLoaded',autoWire,{once:true})}else{setTimeout(autoWire,0)}window.HistoryManager=HistoryManager;})();
        
 window.safeAddListener=function(e,t,n){e?e.addEventListener(t,n):console.warn(`Element for ${t} listener not found`)};
window.setupEventListeners=function(){safeAddListener(homeBtn,"click",()=>{showHomepage();showNotification("Returned to homepage")});safeAddListener(sidebar1Toggle,"click",e=>{e.stopPropagation();sidebar1.classList.toggle("open");const t=sidebar1.classList.contains("open");sidebar1Toggle.innerHTML=t?'<i class="material-symbols-rounded">close</i>':'<i class="material-symbols-rounded">menu</i>'});document.addEventListener("click",e=>{if(sidebar1&&sidebar1Toggle&&!sidebar1.contains(e.target)&&!sidebar1Toggle.contains(e.target)&&sidebar1.classList.contains("open")){sidebar1.classList.remove("open");sidebar1Toggle.innerHTML='<i class="material-symbols-rounded">menu</i>'}});safeAddListener(noteTextarea,"input",updateNoteMetadata);safeAddListener(showNextNoteBtn,"click",()=>{if(visibleNotes<maxNotes){visibleNotes++;updateNoteVisibility();showNotification(`Showing ${visibleNotes} note${visibleNotes!==1?"s":""}`)}else showNotification("Max notes limit reached")});safeAddListener(hideLastNoteBtn,"click",()=>{if(visibleNotes>1){visibleNotes--;updateNoteVisibility();showNotification(`Showing ${visibleNotes} note${visibleNotes!==1?"s":""}`)}else showNotification("Must keep at least one note visible")});safeAddListener(sidebar2Toggle,"click",e=>{e.stopPropagation();secondarySidebar.classList.toggle("open");const t=secondarySidebar.classList.contains("open");sidebar2Toggle.innerHTML=t?'<i class="material-symbols-rounded">close</i>':'<i class="material-symbols-rounded">apps</i>'});document.addEventListener("click",e=>{if(secondarySidebar&&sidebar2Toggle&&!secondarySidebar.contains(e.target)&&!sidebar2Toggle.contains(e.target)&&secondarySidebar.classList.contains("open")){secondarySidebar.classList.remove("open");sidebar2Toggle.innerHTML='<i class="material-symbols-rounded">apps</i>'}});safeAddListener(secondarySidebar,"click",e=>e.stopPropagation());window.addEventListener("focus",checkPasswordRequirement)};
document.addEventListener("DOMContentLoaded",()=>window.setupEventListeners());
    
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

document.addEventListener("DOMContentLoaded",()=>{const e=document.getElementById("fullscreenBtn"),n=document.getElementById("fullscreenIcon");function t(){const e=document.documentElement;document.fullscreenElement||document.webkitFullscreenElement||document.msFullscreenElement?document.exitFullscreen?document.exitFullscreen():document.webkitExitFullscreen?document.webkitExitFullscreen():document.msExitFullscreen&&document.msExitFullscreen():e.requestFullscreen?e.requestFullscreen():e.webkitRequestFullscreen?e.webkitRequestFullscreen():e.msRequestFullscreen&&e.msRequestFullscreen()}function c(){document.fullscreenElement||document.webkitFullscreenElement||document.msFullscreenElement?n.textContent="fullscreen_exit":n.textContent="fullscreen"}e.addEventListener("click",t),document.addEventListener("fullscreenchange",c),document.addEventListener("webkitfullscreenchange",c),document.addEventListener("msfullscreenchange",c)});
