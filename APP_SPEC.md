# Optical File — App Specification

## Purpose

Convert a small local file to a self-contained Animated WebP made of QR frames, and reconstruct the original file either from another device camera or from that WebP without uploading data.

## Create flow

1. Read source bytes locally.
2. Calculate SHA-256.
3. Optionally gzip when compression reduces transfer size.
4. Split the transfer bytes into 200-byte blocks in camera-first mode, or 160-byte blocks per QR in the optional four-QR mode.
5. Encode each block as a BK2D QR payload with CRC32.
6. Encode transfer metadata as a compact BK3M Base45/binary QR. The metadata frame is inserted at the start, approximately every 12 data frames, and again near the end.
7. Pack one large QR code per frame by default, or four smaller QR codes in the optional faster mode.
8. Encode each canvas frame as WebP and assemble the frames into one Animated WebP using the WebP `VP8X`, `ANIM`, and `ANMF` chunks.

The default playback rate is 6 fps. Generation does not wait for real-time playback.

## Restore flow

### Camera (primary)

1. Start the rear camera and show a square alignment guide.
2. On another device, display the generated Animated WebP at a 1:1 aspect ratio.
3. Scan frames continuously. Valid data QR blocks may be CRC-checked and retained even before metadata is detected.
4. When a repeated metadata QR is detected, merge the already-collected blocks into the active transfer.
5. Stop automatically once all chunks are present and SHA-256 verifies.

### WebP file (secondary)

1. Load the Animated WebP locally.
2. Use `ImageDecoder` to access frames directly rather than waiting for animation playback.
3. Decode QR codes with `BarcodeDetector` where available, otherwise the embedded jsQR implementation.
4. Retain valid blocks across repeated scans.
5. Validate each block with CRC32.
6. Reassemble, gunzip when needed, and validate the final bytes with SHA-256.

## Limits

- Source hard limit: 1 MiB
- Default: 1 QR / frame, 200 bytes / QR, 6 fps
- Optional faster mode: 4 QR / frame, 160 bytes / QR
- Output: `.webp` only

## Runtime network

None.


## Camera-first carrier

The default carrier uses one lower-density QR per frame on a low-luminance gray background. Camera exposure compensation is applied when supported.
