# Repository Guidelines

## Project Structure & Module Organization

- `manifest.json`: Chrome/Edge extension manifest (MV3). New Tab entry is `src/index.html`; service worker is `src/background.js`.
- `src/`: extension UI and logic. Key files include `src/script.js` (new tab), `src/sidepanel.html` + `src/sidepanel-manager.js` (side panel), and `src/content.js` (floating button content script).
- `_locales/`: i18n message bundles (`_locales/<lang>/messages.json`) used by `__MSG_*__` strings and `data-i18n` attributes.
- `images/`: icons and static assets referenced by the manifest/UI.

## Build, Test, and Development Commands

- `npm ci`: install dependencies (reproducible).
- `npx tailwindcss -i ./src/styles.css -o ./src/output.css --content "./src/**/*.{html,js}"`: regenerate Tailwind output (avoid hand-editing `src/output.css`).

Local run (manual):
- Chrome/Edge → `chrome://extensions` → enable Developer mode → “Load unpacked” → select repo root → open a new tab.
- After edits: click “Reload” on the extension card and refresh any affected pages/side panel.

## Coding Style & Naming Conventions

- Indentation: 2 spaces in JS/CSS/HTML; prefer small, readable functions over large refactors.
- JavaScript: prefer `const`/`let`, early returns, and modular helpers; keep filenames kebab-case (e.g., `search-engine-dropdown.js`).
- Assets: place images under `images/` and update paths referenced by `manifest.json` and `src/*.html`.

## Testing Guidelines

- No automated test suite is configured (`npm test` is a placeholder). Verify changes by loading the unpacked extension and checking new tab rendering, bookmark operations, search flows, and side panel behavior.

## Versioning

- Use Chrome extension-compatible SemVer: `MAJOR.MINOR.PATCH` (numeric only; no `-alpha` / `+build` suffixes).
- Keep versions in sync: bump both `manifest.json#version` and `package.json#version` together.
- Bump rules: `PATCH` = fixes, `MINOR` = new features, `MAJOR` = breaking changes or permission/behavior changes that may impact users.

## Commit & Pull Request Guidelines

- Use Conventional Commits (English preferred): `type(scope): summary`.
  - Types: `feat`, `fix`, `docs`, `refactor`, `chore`, `test`, `build`, `ci`.
  - Keep the summary imperative and specific (no trailing period), e.g. `fix(newtab): prevent white flash in dark mode`.
  - If needed: `feat!: ...` or a `BREAKING CHANGE:` footer.
- PRs should include: what changed, how to verify, and screenshots/GIFs for UI changes. Call out any `manifest.json` permission changes explicitly.
