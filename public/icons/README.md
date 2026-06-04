# PWA Icons

Place the following icon files in this directory before deploying:

- `icon-192.png` — 192×192 px (required for Android home screen)
- `icon-512.png` — 512×512 px (required for splash screen + maskable)

You can generate these from a source SVG using:
```bash
npx sharp-cli --input logo.svg --output icon-192.png --resize 192 192
npx sharp-cli --input logo.svg --output icon-512.png --resize 512 512
```

Or use https://maskable.app to create maskable versions.
