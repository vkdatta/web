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
