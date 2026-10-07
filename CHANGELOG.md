# Changelog

## v1.0.1

- Standardize the header language switch to EN / JA with localized target-language labels and tooltips.
- Use 完全ローカル処理 for the existing Japanese local-processing badge; retain the English no-upload message and bilingual privacy guidance.
- Add header regression coverage for repeated language changes, localized Help controls and the configured version.

- Add an explicit local JSON verification receipt for the current restored file, including its sanitized filename, actual byte size and full verified SHA-256.
- Keep original-file and receipt downloads bound to one immutable result; ignore obsolete SHA-256/gzip completions and failures after reset or replacement.
- Explain receipt metadata privacy and checksum limitations in Japanese/English UI and help.
- Add synthetic restore regression tests to repository validation, covering both source and generated HTML.

## v1.0.0

- Initial public release of Optical File.
- Generate Animated WebP files made from camera-friendly QR frames.
- Restore files primarily through another device camera, with direct WebP analysis as an alternative.
- Limit source files to 1 MiB and use a low-luminance QR carrier to reduce display glare.
- Repeat compact metadata QR frames and retain valid data blocks even before metadata is detected.
- Verify chunks with CRC32 and reconstructed files with SHA-256.
- Show a clean fallback card instead of a broken-image icon when an Animated WebP preview cannot be displayed.
