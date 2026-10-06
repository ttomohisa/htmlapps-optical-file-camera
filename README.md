# Optical File

[![GitHub Pages](https://github.com/ttomohisa/htmlapps-optical-file-camera/actions/workflows/deploy-pages.yml/badge.svg)](https://github.com/ttomohisa/htmlapps-optical-file-camera/actions/workflows/deploy-pages.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Single HTML](https://img.shields.io/badge/distribution-single%20HTML-0ea5e9)](https://ttomohisa.github.io/htmlapps-optical-file-camera/)

[日本語版 README](README.ja.md)

A privacy-focused, single-HTML app that turns a small file into an **Animated QR WebP** and restores it by scanning the animation with another device camera or by decoding the WebP directly.

## 🚀 Live demo

### [Open Optical File on GitHub Pages](https://ttomohisa.github.io/htmlapps-optical-file-camera/)

GitHub Pages delivers the initial HTML. After it loads, file reading, optional gzip compression, QR generation, Animated WebP creation, camera scanning, reconstruction, CRC32 checks, and SHA-256 verification are processed locally on your device. The selected files and camera frames are not uploaded by the app.

## Features

- Convert a file up to **1 MiB** into an Animated QR WebP (`.webp`)
- Restore the original file by pointing another device camera at the Animated QR
- Restore directly from the generated WebP without using a camera
- Save a local JSON verification receipt with the verified filename, byte size and complete SHA-256
- Camera-first default: **1 QR per frame at 6 fps**
- Optional faster mode with **4 QR codes per frame**
- Low-luminance QR carrier to reduce screen bloom and overexposure when filming another display
- Automatic negative camera exposure compensation when supported by the device
- Retain valid data blocks even when they are scanned before the metadata QR
- Repeat compact metadata roughly every two seconds so scanning can start mid-animation
- CRC32 validation for each data block
- SHA-256 verification for the reconstructed file
- Optional gzip compression when it meaningfully reduces the transfer size
- Japanese and English UI in the same HTML
- Responsive smartphone-first layout
- Embedded SVG favicon
- Embedded `qrcode` and `jsQR` runtime libraries
- Standalone HTML and self-extract HTML builds

## Quick start

### Use the web demo

Just [open the demo](https://ttomohisa.github.io/htmlapps-optical-file-camera/). No installation or account is required.

For camera restore, allow camera access when the browser asks for permission.

### Build a standalone HTML

1. Download or clone this repository.
2. Double-click `build-standalone.bat` on Windows.
3. The first build downloads the exact dependency versions pinned in `dependencies.json`.
4. Open the generated `dist/index.html`, or copy it wherever you need it.

The build also creates `dist/index.self-extract.html` unless the self-extract build is explicitly skipped.

Python, Node.js, and a local web server are not required. The builder uses Windows PowerShell and the built-in `tar.exe`.

## Usage

### Create an Animated QR

1. Open **Create Animated QR**.
2. Select a file up to **1 MiB**.
3. Normally, keep **Camera-first · 1 QR / frame** and **6 fps**.
4. Generate the Animated WebP.
5. Save the `.webp` file or show the result fullscreen for another device to scan.

The app may gzip the source before QR encoding when compression produces a meaningful reduction. The reconstructed output is always verified against the SHA-256 hash of the original file.

### Restore with a camera

1. Open Optical File on the receiving device.
2. Switch to **Restore from Animated QR**.
3. Start the camera and allow camera access.
4. Display the Animated QR fullscreen on the sending device.
5. Keep the whole QR inside the camera guide.
6. Leave the animation in view until all blocks are collected and verification finishes.
7. Save the reconstructed file.

The scanner can keep CRC-valid data blocks even before metadata is detected. Metadata is inserted repeatedly, so you do not need to wait for the animation to return to its first frame.

### Restore directly from the WebP

1. Open **Restore from Animated QR**.
2. Choose the generated `.webp` file.
3. Start WebP analysis.
4. When all blocks are collected and SHA-256 matches, save the reconstructed file.

Direct Animated WebP analysis uses the browser `ImageDecoder` API. If the current browser does not provide it, use camera restore or a compatible Chromium-based browser.

### Save a verification receipt

After a successful restore, choose **Save verification receipt** beside **Save original file**. The `.verification.json` file records the sanitized output filename, actual size, full verified SHA-256, app version, compression and compact transport counts. Both downloads refer to the same verified result. Reset or choosing another WebP clears it; unfinished checks cannot revive the previous result.

The receipt contains no file contents, QR data, camera data, session ID or history. Its filename and hash may still identify the file, so review it before sharing. A matching checksum is not encryption, authentication or a signed certificate. Receipts are created locally only when requested and are not retained by the app.

## Camera scanning tips

Screen-to-camera QR transfer is affected by display brightness, reflections, focus, exposure, viewing angle, and camera quality. For the most reliable result:

- Use **Camera-first · 1 QR / frame** first
- Display the Animated QR fullscreen
- Keep the sending screen and receiving camera roughly parallel
- Move the camera far enough back that the complete QR and its margin fit inside the guide
- Avoid strong reflections on the sending display
- If the image is blown out, lower the camera exposure with the in-app control when available
- Keep the animation visible through multiple loops if some blocks are missed

The app intentionally limits the source file to **1 MiB** so QR density can remain practical for camera scanning.

## Publish with GitHub Pages

The repository includes a workflow that builds the standalone HTML and deploys it to GitHub Pages automatically.

1. Push the repository to GitHub as `htmlapps-optical-file-camera`.
2. Open **Settings → Pages → Build and deployment → Source** and select **GitHub Actions**.
3. Push to `main`, or manually run **Deploy standalone app to GitHub Pages** from the Actions tab.
4. After a successful deployment, the app is available at `https://ttomohisa.github.io/htmlapps-optical-file-camera/`.

Each push to `main` builds and verifies `dist/index.html` and `dist/index.self-extract.html` before deployment. If GitHub Pages has not been enabled yet, the workflow still validates the build and explains the one-time setup in the workflow summary.

## Development and build layout

```text
.
├─ src/index.template.html          # Application template
├─ app.config.json                  # App metadata and build settings
├─ dependencies.json                # Pinned npm dependencies and embedded assets
├─ build-standalone.bat             # Windows build entry point
├─ build-standalone.ps1             # Standalone HTML builder
├─ scripts/
│  ├─ check-repository.ps1          # Repository/build validation
│  ├─ build-self-extract.ps1        # Self-extract HTML builder
│  ├─ verify-standalone.ps1         # Standalone HTML verification
│  └─ verify-self-extract.ps1       # Self-extract verification
├─ dist/
│  ├─ index.html                    # Generated standalone app
│  └─ index.self-extract.html       # Generated self-extract app
└─ .github/workflows/
   ├─ build-standalone.yml          # Pull request build validation
   └─ deploy-pages.yml              # GitHub Pages deployment
```

### Update dependencies

Edit the versions and asset paths in `dependencies.json`, then run:

```bat
build-standalone.bat
```

To discard the dependency cache and download the pinned packages again:

```bat
build-standalone.bat -ForceDownload
```

The build process automatically:

- Downloads the pinned npm package tarballs
- Extracts only the configured runtime assets
- Embeds those assets directly into the generated HTML
- Records dependency and asset SHA-256 hashes in the generated manifest
- Rejects unresolved placeholders and external runtime script/style references
- Verifies that `connect-src 'none'` remains in the Content Security Policy
- Generates the standalone HTML, self-extract HTML, and build manifests

## Privacy and runtime network protection

Optical File is designed to keep the selected file and camera data on the device.

The generated standalone HTML includes a Content Security Policy with:

```text
connect-src 'none'
```

The GitHub Pages version requires the initial page request, but after the app is loaded it does not upload the selected source file, generated WebP, camera frames, or reconstructed file.

For offline use, build and open `dist/index.html` locally. Browser camera access from a local file can vary by browser, so GitHub Pages / HTTPS is the recommended way to use camera restore.

## File format and integrity checks

Optical File uses its own animated-QR transport format.

- Source data may be gzip-compressed before QR encoding
- Data is split into numbered blocks
- Each data block carries a CRC32 checksum
- Metadata contains the information required to reconstruct the file
- Metadata QR frames are repeated during the animation
- The final reconstructed file is accepted only when its SHA-256 hash matches the original

These checks detect missing or corrupted data, but they are **not encryption** and are not a substitute for authenticated secure transfer.

## Limitations

- Source files are limited to **1 MiB**.
- Animated WebP output can be much larger than the original file.
- Screen-to-camera performance depends on the display, camera, distance, focus, exposure, and ambient reflections.
- Camera access requires browser permission and is most reliable from an HTTPS origin such as GitHub Pages.
- Direct WebP restore requires a browser with Animated WebP frame decoding through `ImageDecoder`.
- The generated WebP is **not encrypted**. Anyone who obtains it can reconstruct the embedded source file.
- This is intended for small optical transfers, not as a replacement for high-speed network or USB file transfer.

## Dependencies

| Library | Version | License | Purpose |
| --- | ---: | --- | --- |
| qrcode | 1.4.4 | MIT | QR code generation |
| jsQR | 1.4.0 | Apache-2.0 | QR code decoding fallback |

Camera capture, WebP assembly, hashing, compression, and reconstruction are implemented with browser APIs and application code. See [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) for dependency details.

## Related documents

- [APP_SPEC.md](APP_SPEC.md) — application and transport specification
- [SECURITY.md](SECURITY.md) — security notes and reporting
- [VERIFY_OFFLINE.md](VERIFY_OFFLINE.md) — offline verification guidance
- [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) — third-party licenses

## Contributing

Bug reports and feature proposals are welcome through GitHub Issues. See [CONTRIBUTING.md](CONTRIBUTING.md) for development guidance.

## License

Copyright © 2026 ttomohisa

Licensed under the [MIT License](LICENSE).

## Automated restore regression checks

Run `node --test scripts/restore-verification.test.cjs` with Node.js 22+ for synthetic, source-level restore/receipt tests. `scripts/check-repository.ps1` runs the same checks against source and generated readable HTML as well as the existing standalone/self-extract build verification. Node.js is required for this validation command; the ordinary standalone build and app runtime still need no Node.js installation. These tests do not exercise a browser, camera, QR pixels or actual optical transfer.
