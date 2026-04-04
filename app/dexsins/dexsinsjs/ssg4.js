#!/usr/bin/env node
'use strict';

const fs   = require('fs');
const path = require('path');

const args    = process.argv.slice(2).filter(a => !a.startsWith('--'));
const flags   = new Set(process.argv.slice(2).filter(a => a.startsWith('--')));
const [srcArg, outArg] = args;

if (!srcArg || !outArg) {
  console.error('Usage: node dextools-preprocess.js <src> <out> [--watch]');
  process.exit(1);
}

const srcRoot = path.resolve(srcArg);
const outRoot = path.resolve(outArg);

const siteRoot = fs.statSync(srcRoot).isDirectory() ? srcRoot : path.dirname(srcRoot);

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, m => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[m]));
}

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function processHtml(html, fileDir, visited = new Set()) {
  const TAG_RE = /<dextools-import((?:\s+[\w:.-]+(?:=(?:"[^"]*"|'[^']*'|[^\s/>]*))?)*)\s*(?:\/>|>[\s\S]*?<\/dextools-import\s*>)/gi;

  return html.replace(TAG_RE, (match, attrStr) => {
    const srcMatch = attrStr.match(/\bsrc=(?:"([^"]*)"|'([^']*)')/i);
    if (!srcMatch) {
      warn('Skipping <dextools-import> with no src attribute');
      return match;
    }

    const src = srcMatch[1] ?? srcMatch[2];

    if (/^(https?:)?\/\//i.test(src)) return match;

    const componentPath = path.resolve(
      src.startsWith('/')
        ? path.join(siteRoot, src)
        : path.join(fileDir, src)
    );

    if (visited.has(componentPath)) {
      warn(`Circular import detected — skipping: ${componentPath}`);
      return `<!-- [Dextools] circular import: ${escapeHtml(src)} -->`;
    }

    if (!fs.existsSync(componentPath)) {
      warn(`Component not found: ${componentPath}`);
      return `<!-- [Dextools] not found: ${escapeHtml(src)} -->`;
    }

    let componentHtml = fs.readFileSync(componentPath, 'utf8');

    const DATA_ATTR_RE = /\bdata-([\w-]+)=(?:"([^"]*)"|'([^']*)')/gi;
    let m;
    while ((m = DATA_ATTR_RE.exec(attrStr)) !== null) {
      const key = m[1];
      const val = escapeHtml(m[2] ?? m[3]);
      componentHtml = componentHtml.replace(
        new RegExp(`{{${escapeRegex(key)}}}`, 'g'),
        val
      );
    }

    const childVisited = new Set(visited);
    childVisited.add(componentPath);
    componentHtml = processHtml(componentHtml, path.dirname(componentPath), childVisited);

    return componentHtml;
  });
}

function processFile(inputFile, outputFile) {
  try {
    const raw       = fs.readFileSync(inputFile, 'utf8');
    const processed = processHtml(raw, path.dirname(inputFile));

    fs.mkdirSync(path.dirname(outputFile), { recursive: true });
    fs.writeFileSync(outputFile, processed, 'utf8');

    log(`${rel(inputFile)} → ${rel(outputFile)}`);
  } catch (err) {
    warn(`Failed to process ${inputFile}: ${err.message}`);
  }
}

function processDir(srcDir, outDir) {
  for (const entry of fs.readdirSync(srcDir, { withFileTypes: true })) {
    const srcFull = path.join(srcDir, entry.name);
    const outFull = path.join(outDir,  entry.name);

    if (entry.isDirectory()) {
      processDir(srcFull, outFull);
    } else if (entry.isFile()) {
      if (/\.html?$/i.test(entry.name)) {
        processFile(srcFull, outFull);
      } else {
        fs.mkdirSync(outDir, { recursive: true });
        fs.copyFileSync(srcFull, outFull);
      }
    }
  }
}

function build() {
  const stat = fs.statSync(srcRoot);
  if (stat.isDirectory()) {
    processDir(srcRoot, outRoot);
  } else {
    processFile(srcRoot, outRoot);
  }
  log('Build complete.');
}

function watch() {
  log(`Watching ${rel(srcRoot)} for changes…`);

  let debounceTimer = null;
  const rebuild = () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      log('Change detected — rebuilding…');
      build();
    }, 80);
  };

  fs.watch(srcRoot, { recursive: true }, (eventType, filename) => {
    if (filename) rebuild();
  });
}

function rel(p)       { return path.relative(process.cwd(), p); }
function log(msg)     { console.log(`[Dextools] ${msg}`); }
function warn(msg)    { console.warn(`[Dextools] WARN ${msg}`); }

build();
if (flags.has('--watch')) watch();
