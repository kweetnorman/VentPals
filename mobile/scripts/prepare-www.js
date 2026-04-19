#!/usr/bin/env node
/**
 * prepare-www.js
 *
 * Copies all VentPals web assets from the repo root into mobile/www/
 * so Capacitor can bundle them into the iOS and Android apps.
 *
 * Run:  node scripts/prepare-www.js
 *       (or via `npm run build` / `npm run cap:sync`)
 */

'use strict';

const fs   = require('fs');
const path = require('path');

// Repo root is one level above mobile/
const ROOT = path.resolve(__dirname, '..', '..');
const WWW  = path.resolve(__dirname, '..', 'www');

// Patterns to exclude from copying
const EXCLUDE_DIRS  = new Set(['mobile', 'node_modules', '.git', '.github', '.vscode']);
const EXCLUDE_FILES = new Set(['.DS_Store', 'Thumbs.db', '.gitignore', '.gitattributes']);
const EXCLUDE_EXTS  = new Set(['.md']);      // skip markdown docs

// ---------------------------------------------------------------------------

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function shouldExclude(name, isDir) {
  if (isDir)  return EXCLUDE_DIRS.has(name);
  if (EXCLUDE_FILES.has(name)) return true;
  const ext = path.extname(name).toLowerCase();
  return EXCLUDE_EXTS.has(ext);
}

function copyDir(src, dest) {
  ensureDir(dest);
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    if (shouldExclude(entry.name, entry.isDirectory())) continue;
    const srcPath  = path.join(src,  entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// ---------------------------------------------------------------------------

console.log('🌿 VentPals — preparing www/ from repo root …');

// 1. Clean previous build
if (fs.existsSync(WWW)) {
  fs.rmSync(WWW, { recursive: true, force: true });
}
ensureDir(WWW);

// 2. Copy everything from root → www/
copyDir(ROOT, WWW);

// 3. Inject the native-bridge.js loader into every HTML file so plugins
//    are available without modifying each page individually.
injectNativeBridgeLoader(WWW);

// 4. Write a simple offline fallback page
writeOfflinePage(WWW);

console.log('✅  www/ is ready — run `npx cap sync` next.');

// ---------------------------------------------------------------------------

function injectNativeBridgeLoader(wwwDir) {
  const snippet =
    '\n  <!-- VentPals native bridge (injected by prepare-www.js) -->' +
    '\n  <script src="/assets/js/native-bridge.js"></script>';

  walkHtml(wwwDir, (filePath) => {
    let html = fs.readFileSync(filePath, 'utf8');
    // Inject before </head> if not already present.
    // Check for both relative ("assets/js/native-bridge.js") and absolute
    // ("/assets/js/native-bridge.js") references to avoid double-injection.
    if (!html.includes('assets/js/native-bridge.js') && html.includes('</head>')) {
      html = html.replace('</head>', snippet + '\n</head>');
      fs.writeFileSync(filePath, html, 'utf8');
    }
  });
}

function walkHtml(dir, callback) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkHtml(full, callback);
    } else if (entry.name.endsWith('.html')) {
      callback(full);
    }
  }
}

function writeOfflinePage(wwwDir) {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>You're offline – VentPals</title>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body {
      font-family: system-ui, -apple-system, sans-serif;
      background: linear-gradient(135deg,#f5e6ff 0%,#fff8d6 50%,#e0f4ff 100%);
      min-height:100vh; display:flex; align-items:center; justify-content:center;
      color:#2E1A47; text-align:center; padding:24px;
    }
    .card {
      background:rgba(255,255,255,0.92); border-radius:24px;
      padding:40px 32px; max-width:360px;
      box-shadow:0 18px 48px rgba(17,24,39,0.10);
    }
    .icon { font-size:64px; margin-bottom:16px; }
    h1 { font-size:1.6rem; font-weight:800; color:#A259FF; margin-bottom:10px; }
    p { font-size:0.95rem; color:#6B7280; margin-bottom:24px; }
    button {
      background:linear-gradient(135deg,#A259FF,#7ED957);
      color:#fff; border:none; border-radius:999px;
      padding:14px 32px; font-size:1rem; font-weight:700;
      cursor:pointer; width:100%;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">🌿</div>
    <h1>You're offline</h1>
    <p>Your calming tools and saved progress are still here. Connect to the internet to unlock everything.</p>
    <button onclick="location.reload()">Try again</button>
  </div>
</body>
</html>
`;
  fs.writeFileSync(path.join(wwwDir, 'offline.html'), html, 'utf8');
}
