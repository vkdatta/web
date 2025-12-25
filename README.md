# Personal JavaScript Utilities

This repository contains personal JavaScript utilities for frontend enhancements including:

- **Autosave.js**: Automatically saves input values and textareas.
- **Fullscreen.js**: Enable fullscreen mode on double-tap anywhere.
- **NoteApp**: Personal note-taking application.
- **DiffApp**: Personal diff tool for comparing text.
- **Codeblock.js**: syntax highlight any language with minimal setup.

All files are intended for **personal use** and can be directly included via CDN links.

---

## Features & Usage

### 1. Autosave.js

Automatically saves the values of <input>, <textarea>, and <radio> elements in localStorage.

Usage Example:

```<input id="customername" placeholder="Enter customer name">```

```<textarea id="notes" placeholder="Write your notes"></textarea>```

- Important: Each element must have a unique id for autosaving.
- Once a user types, the value will automatically be saved and restored on page reload.

---

### 2. Fullscreen.js

Double-tap anywhere on the page to toggle fullscreen mode.

Usage Example:

```<script>Fullscreen functionality is automatically initialized on page load</script>```

- Works on desktops and mobile devices.
- No extra setup required. just include the script.

---

### 3. NoteApp

A personal note-taking frontend app. Includes JS and CSS for layout and behavior.

---

### 4. DiffApp

Compare text differences directly in the browser. Includes JS and CSS.

---

### 5. codeblock.js

No more complex Prism setup for syntax highlighting. Just paste the codeblock.js script into your template and let it do its work. Simply name the file extension, and the script will handle the highlighting automatically. No other Prism scripts are required. This uses Prism and performs syntax highlighting out of the box. There’s no need for pre tags or anything else. It supports almost all languages in Prism and uses dark mode by default. You can change the CSS using the !important directive if you want to use a light theme.

Usage Example:

```<code lang="py">your python code</code>```

```<code lang="js">your javascript code</code>```

> __Warning:__ This only supports adding code blocks in HTML. Directly injecting text into code blocks via JavaScript requires manipulating the .code-content query selector. You also need to use :not() to include unsupported languages.
