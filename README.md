# Personal JavaScript Utilities

This repository contains personal JavaScript utilities for frontend enhancements including:

- **Autosave.js**: Automatically saves input values and textareas.
- **Fullscreen.js**: Enable fullscreen mode on double-tap anywhere.
- **NoteApp**: Personal note-taking application.
- **DiffApp**: Personal diff tool for comparing text.
- **Codeblock.js**: syntax highlight any language with minimal setup.
- **preprocessor.js**: Split large HTML file into multiple parts and bind them together. 

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

### 6. preprocessor.js 

preprocessor.js is extremely useful when working with large HTML files that become difficult to maintain and scale. By splitting sections of HTML into different HTML files or creating a file for repeated UI sections into smaller reusable chunks, you avoid duplication and keep your main files clean and readable. Instead of editing the same structure in multiple places, you update it once and reuse it everywhere. The data-* binding mechanism allows small variations (like titles, descriptions, or buttons) without breaking the shared structure. This makes development faster, reduces errors, and creates a modular system similar to components in modern frameworks without needing any build tools or libraries.

Without preprocessor 

```html
<!-- index.html -->
<div class="article-card">
  <div class="article-header">
    <h2>Why Remote Work Is Reshaping Cities</h2>
    <span class="author">By Ananya Rao</span>
  </div>
  <div class="article-body">
    <p>As remote work rises, smaller cities are seeing unexpected growth.</p>
    <p>Published in the Weekly Insight journal.</p>
    <p>Estimated reading time: 4 minutes.</p>
    <p>Category: Technology & Society.</p>
    <p>This article explores real-world implications.</p>
    <p>Includes expert opinions and data points.</p>
    <p>Updated regularly with new findings.</p>
    <p>Trusted by over 50,000 readers monthly.</p>
  </div>
  <div class="article-footer">
    <button>Read Full Article</button>
  </div>
</div>

<div class="article-card">
  <div class="article-header">
    <h2>The Rise of AI in Everyday Apps</h2>
    <span class="author">By Rahul Verma</span>
  </div>
  <div class="article-body">
    <p>From keyboards to photo editors, AI is quietly becoming part of daily life.</p>
    <p>Published in the Weekly Insight journal.</p>
    <p>Estimated reading time: 4 minutes.</p>
    <p>Category: Technology & Society.</p>
    <p>This article explores real-world implications.</p>
    <p>Includes expert opinions and data points.</p>
    <p>Updated regularly with new findings.</p>
    <p>Trusted by over 50,000 readers monthly.</p>
  </div>
  <div class="article-footer">
    <button>Read Full Article</button>
  </div>
</div>

<div class="article-card">
  <div class="article-header">
    <h2>Electric Vehicles Are Changing Urban Transport</h2>
    <span class="author">By Sneha Kapoor</span>
  </div>
  <div class="article-body">
    <p>EV adoption is accelerating as cities push for cleaner mobility.</p>
    <p>Published in the Weekly Insight journal.</p>
    <p>Estimated reading time: 4 minutes.</p>
    <p>Category: Technology & Society.</p>
    <p>This article explores real-world implications.</p>
    <p>Includes expert opinions and data points.</p>
    <p>Updated regularly with new findings.</p>
    <p>Trusted by over 50,000 readers monthly.</p>
  </div>
  <div class="article-footer">
    <button>Read Full Article</button>
  </div>
</div>

<div class="article-card">
  <div class="article-header">
    <h2>How Startups Are Redefining Finance</h2>
    <span class="author">By Arjun Mehta</span>
  </div>
  <div class="article-body">
    <p>Fintech startups are simplifying banking and investments globally.</p>
    <p>Published in the Weekly Insight journal.</p>
    <p>Estimated reading time: 4 minutes.</p>
    <p>Category: Technology & Society.</p>
    <p>This article explores real-world implications.</p>
    <p>Includes expert opinions and data points.</p>
    <p>Updated regularly with new findings.</p>
    <p>Trusted by over 50,000 readers monthly.</p>
  </div>
  <div class="article-footer">
    <button>Read Full Article</button>
  </div>
</div>
```
With preprocessor 

```html
<!-- article-card.html -->

<div class="article-card">
  <div class="article-header">
    <h2>{{title}}</h2>
    <span class="author">{{author}}</span>
  </div>
  <div class="article-body">
    <p>{{summary}}</p>
    <p>Published in the Weekly Insight journal.</p>
    <p>Estimated reading time: 4 minutes.</p>
    <p>Category: Technology & Society.</p>
    <p>This article explores real-world implications.</p>
    <p>Includes expert opinions and data points.</p>
    <p>Updated regularly with new findings.</p>
    <p>Trusted by over 50,000 readers monthly.</p>
  </div>
  <div class="article-footer">
    <button>Read Full Article</button>
  </div>
</div>
```

```html
<!-- index.html -->
<dextools-import 
  src="article-card.html"
  data-title="Why Remote Work Is Reshaping Cities"
  data-author="By Ananya Rao"
  data-summary="As remote work rises, smaller cities are seeing unexpected growth.">
</dextools-import>

<dextools-import 
  src="article-card.html"
  data-title="The Rise of AI in Everyday Apps"
  data-author="By Rahul Verma"
  data-summary="From keyboards to photo editors, AI is quietly becoming part of daily life.">
</dextools-import>

<dextools-import 
  src="article-card.html"
  data-title="Electric Vehicles Are Changing Urban Transport"
  data-author="By Sneha Kapoor"
  data-summary="EV adoption is accelerating as cities push for cleaner mobility.">
</dextools-import>

<dextools-import 
  src="article-card.html"
  data-title="How Startups Are Redefining Finance"
  data-author="By Arjun Mehta"
  data-summary="Fintech startups are simplifying banking and investments globally.">
</dextools-import>
```

