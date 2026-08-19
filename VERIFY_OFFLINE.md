# Optical File offline verification

1. Run `build-standalone.bat`.
2. Open `dist/index.html` directly with `file://`.
3. Open browser developer tools, clear the Network panel, and enable offline mode.
4. Reload the page and confirm the embedded QR libraries initialize without a network request.
5. In **Create Animated WebP**, select a small binary/text fixture (10-100 KiB is convenient for testing).
6. Generate an Animated WebP in the default 4-QR mode, save it, and note the source SHA-256 if independently available.
7. Open the app on a second device, choose **Restore from Animated QR**, start the camera, and point it at the first device while the Animated WebP is shown fullscreen. Confirm chunks accumulate and the file restores after SHA-256 verification.
8. Also select the generated WebP directly and start analysis. Frames should be decoded without waiting for real-time playback.
8. Confirm all chunks are accepted, final SHA-256 verification succeeds, and the restored file is byte-identical to the source.
10. Repeat with **Compatible · QR** mode and confirm its QR frame-rate cap is applied.
10. Stop a scan part-way through and start it again; confirm accepted chunks remain and progress continues.
12. Try a non-Optical-File Animated WebP and confirm the app reports that metadata was not detected.
12. Confirm Japanese/English switching, narrow mobile layout, keyboard focus, and help content.
13. Confirm there is no failed external resource request and no console error.

For GitHub Pages, one initial request downloads the HTML. Clear the Network panel after the page loads, switch the browser offline, and run the same flow.

## Self-extracting variant

Open `dist/index.self-extract.html` directly and repeat the same checks. Confirm the loader text is readable, the favicon matches `dist/index.html`, and the expanded application completes the create/restore flow without a runtime network connection.
