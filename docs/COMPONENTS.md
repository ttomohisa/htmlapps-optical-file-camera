# Reusable UI components

`components/` contains UI snippets that can be reused when creating a new single-HTML app from this template.

They are not automatically loaded by the builder. Copy or adapt the component into `src/index.template.html` so the release remains one self-contained HTML file.

## Confirmation dialog

`components/confirm-dialog.html` is the preferred replacement for `window.confirm()`. The starter's Clear action uses the same `AppConfirm.ask()` pattern.

- Centered modal on desktop
- Bottom-sheet presentation on smartphones
- Safe-area aware
- Cancel with `Esc`, the close button, or a backdrop tap
- Restores focus to the previous control
- `tone: 'danger'` for destructive actions
- Dependency-free and offline
- Returns `Promise<boolean>`

### Example

```js
const ok = await AppConfirm.ask({
  title: language === 'ja' ? '確認' : 'Confirm',
  message: language === 'ja'
    ? 'この履歴を削除しますか？'
    : 'Delete this history item?',
  confirmLabel: language === 'ja' ? '削除する' : 'Delete',
  cancelLabel: language === 'ja' ? 'キャンセル' : 'Cancel',
  tone: 'danger'
});

if (!ok) return;
deleteHistoryItem();
```

Finished apps should normally pass localized labels from their own translation object. Preserve `Esc`, backdrop cancellation, focus restoration, keyboard access, and smartphone safe-area handling when adapting the component.

## Mobile bottom navigation / action bar

`components/mobile-bottom-bar.html` is the canonical fixed smartphone bottom bar for apps that benefit from persistent access to several sections or workflow actions. It is hidden on desktop by default and becomes a safe-area-aware fixed bar at `600px` and below.

Use it for patterns such as:

- `Source / Range / Run / Save` in a media editor.
- `Scan / Pages / PDF` in a document workflow.
- Section navigation where three to five destinations remain useful throughout the mobile flow.
- A workflow action that starts disabled and becomes available only after a result exists, such as Save or Share.

Do not add a bottom bar only because it exists in the template. If an app has a single primary action and no persistent navigation need, an in-flow button is usually clearer.

### Markup model

Each button has a stable `data-mobile-key`. A button can either navigate to a section with `data-mobile-target`, or run an application action with `data-mobile-action`. Keep the visible label short and pair it with an icon.

```html
<nav class="app-mobile-bottom-bar" id="mobileBottomBar" style="--app-mobile-bottom-items: 4" aria-label="Mobile actions">
  <button class="app-mobile-bottom-item is-active" data-mobile-key="source" data-mobile-target="sourceSection" aria-current="page">…</button>
  <button class="app-mobile-bottom-item" data-mobile-key="range" data-mobile-target="rangeSection">…</button>
  <button class="app-mobile-bottom-item primary" data-mobile-key="run" data-mobile-action="run">…</button>
  <button class="app-mobile-bottom-item" data-mobile-key="save" data-mobile-action="save" disabled>…</button>
</nav>
```

Add `has-mobile-bottom-bar` to `<body>` so page content receives bottom padding and is not hidden behind the fixed bar. Change `--app-mobile-bottom-items` when using three or five items.

### Optional helper API

After copying the component script, mount the bar and provide handlers for application-specific actions:

```js
const mobileBar = AppMobileBottomBar.mount(
  document.getElementById('mobileBottomBar'),
  {
    actions: {
      run: () => runJob(),
      save: () => saveResult()
    }
  }
);

mobileBar.setEnabled('save', false);
// After a valid result exists:
mobileBar.setEnabled('save', true);
```

The helper handles section scrolling, active destination state, and `IntersectionObserver`-based section tracking when available. Application code remains responsible for deciding when actions are enabled.

### UX rules

- Prefer **3 to 5 items**. Four is a good default for action-heavy tools.
- Use an icon **and** a short text label; do not rely on icons alone.
- Keep unavailable actions actually `disabled`, not merely dimmed.
- Enable Save / Share only after a valid result exists.
- Avoid duplicate fixed CTAs. If the bottom bar contains the primary mobile action, a second full-width fixed button should normally be removed.
- An in-flow primary button may still be useful at the natural end of a long editing section.
- Keep `env(safe-area-inset-bottom)` padding and enough body bottom padding so content cannot hide behind the bar.
- The bar is for smartphone ergonomics; desktop layout should keep normal in-flow controls.
- Preserve visible focus, `aria-current` for active navigation items, and native `disabled` semantics.
