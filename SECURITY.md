# Security Policy

## Supported version

Security fixes target the latest version on the default branch.

## Reporting a vulnerability

Do not publish sensitive vulnerability details in a public issue. Use the repository owner's private security reporting channel when available.

Include:

- Affected commit or version.
- Reproduction steps.
- Expected and actual behavior.
- Security impact.
- A minimal test file when file parsing is involved.

## Trust model

The default template is a static browser application with no backend. Its primary protections are:

- No runtime network connection (`connect-src 'none'`).
- Explicitly pinned and embedded third-party files.
- SHA-256 records in the generated dependency manifest.
- No analytics, telemetry, remote fonts, or silent update checks.
- User-initiated downloads rather than automatic uploads.

A generated HTML file is executable code. Distribute it through a trusted channel and verify hashes for high-trust workflows.

## Input files

Applications created from this template may parse untrusted local files. Implementations should:

- Validate type, size, and structure before expensive processing.
- Avoid unbounded allocation or recursion.
- Handle malformed data without exposing stack traces to users.
- Release Blob URLs, workers, canvas resources, and large buffers.
- Make destructive transformations reversible where practical.
- Never upload a selected file unless the product explicitly requires it and the user is clearly informed.

## Dependency review

Before adding or upgrading a package:

- Confirm the package identity and exact version.
- Review its license and required notices.
- Inspect the browser bundle and package scripts.
- Confirm every runtime support asset is embedded.
- Rebuild with a clean cache.
- Test with the network disabled.

## Optical File data carrier

Optical File intentionally embeds the selected source bytes into visible QR frames inside the generated Animated WebP. The Animated WebP must therefore be treated as carrying the same confidentiality level as the original file.

- Optical File does **not** encrypt generated Animated WebPs.
- CRC32 is used only to reject corrupted QR chunks; it is not a security primitive.
- SHA-256 verifies reconstructed content; it does not hide the content.
- Restore input is untrusted Animated WebP content. The implementation bounds source metadata, chunk count, source size, and accepted chunk indexes before allocation.
- The source limit is 1 MiB to reduce memory and CPU denial-of-service risk in the browser.

## Camera restore

Camera frames are processed locally in memory for QR decoding and are not uploaded or persisted by Optical File. Camera access is requested only when the user starts camera restore and the media tracks are stopped when scanning ends or the page is left.
