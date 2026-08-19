Single HTML App Template
========================

1. Read README.ja.md.
2. Rewrite APP_SPEC.md for the new application.
3. Update app.config.json.
4. Inspect components/ and reuse generic UI snippets where they fit. Prefer components/confirm-dialog.html over window.confirm() for meaningful destructive actions, and components/mobile-bottom-bar.html for persistent smartphone navigation/actions.
5. Give the repository to the coding LLM and tell it to read AGENTS.md first.
6. Run build-standalone.bat on Windows.
7. Open dist\index.html and dist\index.self-extract.html directly and test both with the network disabled.

Do not edit either generated HTML in dist\ manually.
