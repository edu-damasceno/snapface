# SnapFace

AI-powered hands-free selfie capture PWA. Point your camera, get guided into the right position, and let the app capture automatically — no button, no timer.

## Features

- **Hands-free auto-capture** — automatically takes the photo after 3 seconds of stability
- **Smile-triggered capture** — optional mode: position your face, smile, and the photo is taken instantly
- **Real-time face detection** — MediaPipe FaceLandmarker with 468 facial landmarks and blendshape smile detection
- **Smart guidance** — on-screen feedback for distance, centering, head orientation, and smile
- **Ambient color picker** — 14 background swatches with adaptive text contrast for readability
- **Document format** — 3×4 crop with adaptive zoom (1440×1920 output)
- **PWA** — installable, works offline with cached WASM models

## Recent improvements

- **Smile mode toggle** — labeled chip UI (`Captura ao sorrir`) with preference saved in a cookie
- **Instant smile capture** — no countdown when smile mode is active; requires a fresh smile after retake
- **Layout polish** — vertically centered confirmation screen, guidance/countdown aligned above the preview on desktop and mobile
- **Color wheel scroll** — full horizontal scroll on mobile (first/last swatches reachable)
- **Adaptive contrast** — title, guidance, toggle, and loading text switch light/dark based on background luminance

## Tech Stack

- React 19 + TypeScript
- [MediaPipe Face Landmarker](https://ai.google.dev/edge/mediapipe/solutions/vision/face_landmarker) (WASM, CPU mode)
- Tailwind CSS v4
- Vite + vite-plugin-pwa (Workbox)

## Getting Started

```bash
npm install
npm run dev
```

The `postinstall` script automatically copies MediaPipe WASM files to `public/wasm/`.

### Other commands

```bash
npm run build     # TypeScript check + production build
npm run preview   # Preview production build
npm run lint      # ESLint
```

## How It Works

1. **Camera** — opens the front camera via `getUserMedia` (1080p if device has 4GB+ RAM, otherwise 720p)
2. **Detection** — MediaPipe FaceLandmarker runs at ~20 FPS, tracking face position, head rotation, and smile intensity (blendshapes)
3. **Validation** — checks if the face is centered, at the right distance, facing forward, and (optionally) smiling
4. **Auto-capture** — default: stable face for 1s, then 3-2-1 countdown; smile mode: instant capture on smile
5. **Export** — preview with mirror/download/share/retake; image cropped to 3×4, ready to save

### Capture modes

| Mode | Trigger | Countdown |
|------|---------|-----------|
| **Default** | Face valid + stable | 3 seconds |
| **Smile** (`Captura ao sorrir`) | Face valid + smile detected | Instant |

Smile mode preference is persisted in the `snapface-smile-mode` cookie. Ambient background color is stored in `localStorage`.
