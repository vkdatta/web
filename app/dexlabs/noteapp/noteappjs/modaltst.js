class AutoModernDropdown {
  constructor(trigger) {
    this.trigger = trigger;
    this.optionsData = [];
    this.menu = null;
    this.isOpen = false;
    this.onChangeCallback = null;

    this.parseOptions();
    this.init();
  }

  parseOptions() {
    try {
      this.optionsData = JSON.parse(this.trigger.dataset.options || '[]');
    } catch(e) {
      this.optionsData = [];
    }

    const currentValue = this.trigger.dataset.value || '';
    const matched = this.optionsData.find(opt => String(opt.value) === String(currentValue));
    if (matched) {
      this.trigger.textContent = matched.label;
    }
  }

  init() {
    if (!this.trigger.hasAttribute('tabindex')) this.trigger.setAttribute('tabindex', '0');

    this.trigger.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggle();
    });

    this.trigger.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        this.toggle();
      }
    });
  }

  createMenu() {
    if (this.menu) return;

    this.menu = document.createElement('div');
    this.menu.className = 'custom-dropdown-portal-menu';

    const searchHTML = `
      <div class="dropdown-search">
        <div class="search-wrapper">
          <span class="material-symbols-outlined search-icon">search</span>
          <input type="text" class="search-input" placeholder="Search options..." autocomplete="off">
        </div>
      </div>`;
    this.menu.innerHTML = searchHTML;

    const optionsList = document.createElement('div');
    optionsList.className = 'options-list';
    this.optionsListElement = optionsList;

    this.optionsData.forEach(option => {
      const item = document.createElement('div');
      item.className = 'custom-dropdown-option';
      item.textContent = option.label;
      item.dataset.value = option.value;
      
      if (String(option.value) === String(this.trigger.dataset.value)) {
        item.setAttribute('aria-selected', 'true');
      }

      item.addEventListener('click', () => this.selectOption(option));
      optionsList.appendChild(item);
    });

    this.menu.appendChild(optionsList);

    this.noResults = document.createElement('div');
    this.noResults.className = 'no-results';
    this.noResults.textContent = 'No results found';
    this.noResults.style.display = 'none';
    this.menu.appendChild(this.noResults);

    document.body.appendChild(this.menu);

    const searchInput = this.menu.querySelector('.search-input');
    searchInput.addEventListener('input', () => this.filterOptions(searchInput.value));
  }

  filterOptions(query) {
    const q = query.toLowerCase().trim();
    let visible = 0;

    this.optionsListElement.querySelectorAll('.custom-dropdown-option').forEach(item => {
      const matches = !q || item.textContent.toLowerCase().includes(q);
      item.style.display = matches ? 'flex' : 'none';
      if (matches) visible++;
    });

    this.noResults.style.display = visible === 0 ? 'block' : 'none';
  }

  positionMenu() {
    const rect = this.trigger.getBoundingClientRect();
    let top = rect.bottom + window.scrollY + 8;
    let left = rect.left + window.scrollX;

    if (window.innerHeight - rect.bottom < 340 && rect.top > 300) {
      top = rect.top + window.scrollY - 8;
      this.menu.style.transformOrigin = 'bottom left';
    }

    const width = Math.max(rect.width, 260);
    if (left + width > window.innerWidth - 20) left = window.innerWidth - width - 20;

    this.menu.style.minWidth = `${rect.width}px`;
    this.menu.style.width = `${rect.width}px`;
    this.menu.style.top = `${top}px`;
    this.menu.style.left = `${left}px`;
  }

  toggle() {
    this.isOpen ? this.close() : this.open();
  }

  open() {
    document.querySelectorAll('.custom-dropdown-portal-menu').forEach(menu => {
      if (menu !== this.menu) menu.remove();
    });
    
    this.createMenu();
    this.positionMenu();

    requestAnimationFrame(() => this.menu.classList.add('active'));
    this.trigger.setAttribute('aria-expanded', 'true');
    this.isOpen = true;

    setTimeout(() => {
      this.menu.querySelector('.search-input').focus();
      document.addEventListener('click', this.handleOutsideClick);
      window.addEventListener('resize', this.handleResize);
      window.addEventListener('scroll', this.handleScroll, { passive: true });
    }, 10);
  }

  close() {
    if (!this.menu) return;
    this.menu.classList.remove('active');
    setTimeout(() => {
      if (this.menu) {
        this.menu.remove();
        this.menu = null;
      }
    }, 230);
    this.trigger.setAttribute('aria-expanded', 'false');
    this.isOpen = false;
    document.removeEventListener('click', this.handleOutsideClick);
    window.removeEventListener('resize', this.handleResize);
    window.removeEventListener('scroll', this.handleScroll);
  }

  handleOutsideClick = (e) => {
    if (this.menu && !this.menu.contains(e.target) && e.target !== this.trigger) this.close();
  };

  handleResize = () => {
    if (this.isOpen) this.positionMenu();
  };

  handleScroll = () => {
    if (this.isOpen) this.positionMenu();
  };

  selectOption(option) {
    this.trigger.textContent = option.label;
    this.trigger.dataset.value = option.value;
    this.trigger.dispatchEvent(new Event('change', { bubbles: true }));
    this.close();
    if (this.onChangeCallback) this.onChangeCallback(option);
  }

  onChange(callback) {
    this.onChangeCallback = callback;
  }
}

function initModernDropdowns() {
  document.querySelectorAll('.custom-dropdown-trigger[data-options]').forEach(trigger => {
    new AutoModernDropdown(trigger);
  });
}

document.addEventListener('DOMContentLoaded', initModernDropdowns);




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
      (field.type === "text" || field.type === "email" || field.type === "url")
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
    bodyDiv.querySelectorAll(".custom-dropdown-trigger").forEach((trigger) => {
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
      btn.style.color = "#eeeeee";
    } else {
      btn.style.background = "var(--accent2)";
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
