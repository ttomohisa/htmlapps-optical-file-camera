# AGENTS.md — Single HTML App Contract

This file is the first instruction for any coding LLM or agent working in this repository.

## Read order

1. Read this file completely.
2. Read `APP_SPEC.md` completely.
3. Read `docs/ARCHITECTURE.md` and `docs/LLM_WORKFLOW.md`.
4. Inspect the current implementation before changing code.
5. Implement, build, verify, and update documentation in the same task.

## Non-negotiable product constraints

- Generate two one-file release variants: readable `dist/index.html` and gzip self-extracting `dist/index.self-extract.html`.
- Keep `scripts/build-self-extract.ps1` and the generated self-extract loader ASCII-only; encode loader UI text instead of placing non-ASCII literals in that PowerShell source.
- The self-extract loader must inherit the embedded favicon from `dist/index.html`; do not maintain a second favicon by hand.
- The app must work when `dist/index.html` is opened directly with `file://` unless `APP_SPEC.md` explicitly says otherwise.
- No runtime CDN, external font, analytics, telemetry, API request, or hidden network dependency.
- User-selected files and entered data must stay in the browser unless `APP_SPEC.md` explicitly defines an export initiated by the user.
- Keep a restrictive Content Security Policy with `connect-src 'none'` for the default template.
- Desktop and smartphone layouts are both first-class.
- Keyboard navigation, visible focus, labels, sufficient contrast, and reduced-motion behavior are required.
- Japanese and English should live in the same HTML when the app is intended for both languages.
- Do not use generic emoji as the main interface iconography. Prefer simple inline SVG icons.
- Do not edit `dist/index.html` or `dist/index.self-extract.html` manually. Edit `src/index.template.html`, config, and build scripts; then rebuild.

## Dependency rules

- Prefer browser-native APIs when they are reliable and reasonably small to implement.
- Add third-party packages only when they materially reduce risk or complexity.
- Add npm assets through `dependencies.json`; never paste minified third-party bundles into the source template.
- Pin exact versions. Do not use `latest`, ranges, tags, or unversioned URLs.
- Record the license and homepage in `dependencies.json` and update `THIRD_PARTY_NOTICES.md`.
- Imported module files must be self-contained. The generic loader does not rewrite relative imports.
- Workers, WASM, fonts, dictionaries, and support files must also be listed as embedded assets.

## Source organization

The template intentionally keeps the app in one source HTML so that an LLM can understand the complete runtime without chasing a large module graph.

Inside `src/index.template.html`:

- Keep design tokens and responsive rules near the top.
- Keep reusable embedded-asset loading code generic.
- Keep application state explicit and serializable where practical.
- Mark the replaceable app area with `APP:BEGIN` and `APP:END` comments.
- Keep translations in one clearly named object.
- Avoid global mutable state except the documented `window.StandaloneAssets` API and reusable component APIs such as `window.AppConfirm`.
- Add comments for non-obvious algorithms, browser workarounds, and performance-sensitive paths.

If the application becomes too large for safe single-file source editing, split development source under `src/` and update the builder to concatenate it. The release must still be one HTML file.

## Reusable UI components

- Inspect `components/` before implementing common UI from scratch.
- `components/confirm-dialog.html` is the canonical confirmation UI for this template. It is centered on desktop and becomes a safe-area-aware bottom sheet on smartphones.
- `components/mobile-bottom-bar.html` is the canonical fixed smartphone navigation / workflow bar when an app benefits from 3-5 persistent destinations or actions. It supports safe areas, icons + labels, disabled actions, section targets, and application actions.
- Component files are source snippets, not runtime dependencies. Copy or adapt the needed CSS, HTML, and JavaScript into `src/index.template.html` so the final release remains one self-contained HTML file.
- Prefer `AppConfirm.ask()` over `window.confirm()` for deletion, clear-all, overwrite, and other meaningful destructive actions.
- Use `tone: 'danger'` for destructive confirmation buttons.
- Pass localized title, message, and button labels from the application's translation object whenever practical.
- Preserve `Esc`, backdrop cancellation, visible focus, focus restoration, smartphone safe-area handling, and keyboard access when adapting a component.
- For mobile bottom bars, keep 3-5 concise icon + text items, reserve bottom body padding, use real `disabled` state for unavailable actions, and avoid a duplicate fixed primary CTA. Save / Share should stay disabled until a valid result exists.
- Avoid `window.alert()`, `window.confirm()`, and `window.prompt()` in finished product UI unless `APP_SPEC.md` explicitly requires native browser dialogs or there is a documented technical reason.
- See `docs/COMPONENTS.md` / `docs/COMPONENTS.ja.md` for usage and maintenance rules.

## Required checks before completion

Run:

```powershell
powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File .\scripts\check-repository.ps1
```

Then verify at minimum:

- Fresh load with empty local storage.
- Main happy path.
- Invalid, empty, and unusually large input.
- Undo/redo where destructive editing exists.
- Exported file contents and filename.
- Reload persistence where persistence exists.
- Japanese and English.
- Light-only visual behavior at desktop and mobile widths.
- Narrow smartphone width and desktop width.
- Keyboard-only operation.
- No console error.
- No runtime network request after the initial HTML load on GitHub Pages.
- Direct local opening of both generated HTML variants.

## Documentation required with code changes

Update these when relevant:

- `APP_SPEC.md`: behavior and acceptance criteria.
- `README.md` and `README.ja.md`: user-facing capabilities and usage.
- `CHANGELOG.md`: notable changes.
- `THIRD_PARTY_NOTICES.md`: dependency additions, removals, or upgrades.
- `SECURITY.md`: changed trust boundaries or file handling.
- `docs/COMPONENTS.md` and `docs/COMPONENTS.ja.md`: reusable UI component behavior and API.

## Completion report format

Return a concise report containing:

1. What changed.
2. Important design decisions.
3. Files changed.
4. Verification performed and result.
5. Known limitations or unverified items.

Do not claim a browser, device, build, or network test was performed unless it was actually performed.

## Help dialog

- Keep a compact help button in the upper-right header next to the language switcher.
- The button opens a native `<dialog>` titled “使い方と注意事項” / “How to use & notes”.
- Whenever application behavior changes, update the content between `APP:HELP:BEGIN` and `APP:HELP:END` in the same change.
- Include actual basic operations, privacy behavior, limitations, and data-loss risks. Do not leave starter-specific help in a finished app.
- The dialog must close with its close button, `Esc`, and a click on the backdrop.

## Build compatibility guardrails

- Do not depend on `Get-FileHash`; use .NET SHA-256 APIs.
- Avoid `::new()` in required PowerShell build and verification scripts.
- Verify only declared build placeholders, not arbitrary `__UPPERCASE__` runtime identifiers.
