# NewTabMark

[English](README.md) | [Chinese (Simplified)](README.zh-CN.md)

NewTabMark replaces the browser New Tab page with a bookmarks dashboard, and provides a Side Panel plus an optional floating button for quick access while browsing.

## Features (Implemented)

- New Tab bookmarks dashboard (pick a “home” folder, sidebar tree, path navigation)
- Drag-and-drop ordering for folders/bookmarks
- Bookmark actions: copy URL, generate QR code, open all bookmarks in a folder
- Search: switchable engines + custom engines; `Ctrl/Cmd+Enter` opens the query in all engines
- Suggestions: search across bookmarks and browsing history
- Side Panel: `Alt+B` / `Command+B` toggle, with basic navigation controls
- Floating button overlay (content script), toggleable in Settings
- Personalization: light/dark theme, background/wallpaper options
- i18n via `_locales/<lang>/messages.json`

## Install (Developer Mode)

1. Open `chrome://extensions` and enable **Developer mode**
2. Run `npm install` (it will also build and generate `dist/` which `manifest.json` points to; if not, run `npm run build`)
3. Click **Load unpacked** and select the repo root (the folder containing `manifest.json`)
4. After changes, re-run `npm run build`, click **Reload** on the extension card, and open a new tab to verify

## Project Layout

- `manifest.json`: extension entry points, permissions, commands
- `newtab.html` / `sidepanel.html`: Vite entry HTML
- `src/`: UI and logic (legacy templates `src/index.html` + `src/sidepanel.html`, plus React/Vite entry code)
- `dist/`: Vite build output (referenced by `manifest.json`)
- `_locales/`: i18n message bundles
- `images/`: icons and static assets

## Permissions Notes

This extension uses privileged APIs such as `bookmarks`, `history`, `storage`, and `sidePanel`. It also declares `http://*/*` and `https://*/*` host permissions to support on-page features (e.g., the floating button content script).

## Upstream / Credits

Special thanks to the upstream project that this codebase originally started from:
`https://github.com/Alanrk/TabMark-Bookmark-New-Tab`

This repository is now developed independently and is not affiliated with the upstream authors. Refer to upstream for original history and licensing context.
