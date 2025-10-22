# Personal JavaScript Utilities

This repository contains personal JavaScript utilities for frontend enhancements including:

- **Autosave.js**: Automatically saves input values and textareas.
- **Fullscreen.js**: Enable fullscreen mode on double-tap anywhere.
- **NoteApp**: Personal note-taking application.
- **DiffApp**: Personal diff tool for comparing text.

All files are intended for **personal use** and can be directly included via CDN links.

---

## CDN Links

Include the scripts and stylesheets at the top of your HTML for easy usage:

<script src="https://cdn.jsdelivr.net/gh/vkdatta/web@main/autosave.js"></script>

<script src="https://cdn.jsdelivr.net/gh/vkdatta/web@main/fullscreen.js"></script>

<script src="https://cdn.jsdelivr.net/gh/vkdatta/web@main/noteapp.js"></script>

<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/vkdatta/web@main/noteapp.css">

<script src="https://cdn.jsdelivr.net/gh/vkdatta/web@main/diffapp.js"></script>

<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/vkdatta/web@main/diffapp.css">

---

## Features & Usage

### 1. Autosave.js

Automatically saves the values of <input>, <textarea>, and <radio> elements in localStorage.

Usage Example:

<input id="customername" placeholder="Enter customer name">

<textarea id="notes" placeholder="Write your notes"></textarea>

- Important: Each element must have a unique id for autosaving.
- Once a user types, the value will automatically be saved and restored on page reload.

---

### 2. Fullscreen.js

Double-tap anywhere on the page to toggle fullscreen mode.

Usage Example:

<script>
  // Fullscreen functionality is automatically initialized on page load
</script>

- Works on desktops and mobile devices.
- No extra setup required—just include the script.

---

### 3. NoteApp

A personal note-taking frontend app. Includes JS and CSS for layout and behavior.

Usage Example:

<div id="noteapp"></div>

<script src="https://cdn.jsdelivr.net/gh/vkdatta/web@main/noteapp.js"></script>

<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/vkdatta/web@main/noteapp.css">

---

### 4. DiffApp

Compare text differences directly in the browser. Includes JS and CSS.

Usage Example:

<div id="diffapp"></div>

<script src="https://cdn.jsdelivr.net/gh/vkdatta/web@main/diffapp.js"></script>

<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/vkdatta/web@main/diffapp.css">

---

## Notes

- All scripts save data locally in the browser—no server setup required.
- Works best in modern browsers with localStorage support.
- Unique IDs are mandatory for autosave functionality.
