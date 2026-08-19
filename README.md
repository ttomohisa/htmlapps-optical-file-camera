# Optical File

Optical File (QR Tape) turns a small file into an **Animated QR WebP** and reconstructs the original file either by scanning the Animated QR with another device camera or by decoding the WebP directly, entirely in the browser.

- No upload / no runtime network access
- Animated WebP output (`.webp`)
- **Camera restore** from an Animated QR displayed on another device
- Fast direct restore by loading the WebP file
- Camera-first mode: 1 QR code per frame
- Faster mode: 4 QR codes per frame
- CRC32 per data block and SHA-256 for the final file
- Optional gzip before QR encoding when it meaningfully reduces size
- Japanese / English UI
- Single-HTML build and self-extract build supported by the template

## Practical scope

The hard source limit is **1 MiB**. The default carrier intentionally uses lower-density QR codes so screen-to-camera scanning is more reliable.

## Build

On Windows, run:

```bat
build-standalone.bat
```

The build embeds the pinned npm assets into the single HTML.

## Restore compatibility

Direct WebP restore uses the browser `ImageDecoder` API. Camera restore uses `getUserMedia()` to scan the Animated QR displayed on another device and requires camera permission.

## Security and privacy

Everything runs locally. The generated WebP contains the original file data and is **not encrypted**. Anyone who has the WebP can reconstruct the source file.

See [SECURITY.md](SECURITY.md), [APP_SPEC.md](APP_SPEC.md), and [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).


## Camera scanning

The app uses a low-luminance gray QR carrier and defaults to one QR per frame to reduce screen bloom. Supported cameras also receive negative exposure compensation automatically.

## Faster metadata acquisition

Metadata uses a compact Base45 QR repeated roughly every two seconds. Valid data blocks can be CRC-checked and retained before metadata is seen, then merged automatically when metadata is detected.
