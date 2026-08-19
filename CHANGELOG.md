# Changelog

## v1.0.0

- Initial public release of Optical File.
- Generate Animated WebP files made from camera-friendly QR frames.
- Restore files primarily through another device camera, with direct WebP analysis as an alternative.
- Limit source files to 1 MiB and use a low-luminance QR carrier to reduce display glare.
- Repeat compact metadata QR frames and retain valid data blocks even before metadata is detected.
- Verify chunks with CRC32 and reconstructed files with SHA-256.
- Show a clean fallback card instead of a broken-image icon when an Animated WebP preview cannot be displayed.
