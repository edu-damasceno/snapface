# SnapFace

AI-powered hands-free selfie capture PWA. Point your camera, get guided into the right position, and let the app capture automatically — no button, no timer.

## Features

- **Hands-free auto-capture** — automatically takes the photo after 3 seconds of stability
- **Real-time face detection** — MediaPipe FaceLandmarker with 468 facial landmarks
- **Smart guidance** — on-screen feedback for distance, centering, and head orientation
- **Document format** — 3×4 crop with adaptive zoom (1440×1920 output)
- **PWA** — installable, works offline with cached WASM models

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
2. **Detection** — MediaPipe FaceLandmarker runs at ~20 FPS, tracking face position and head rotation
3. **Validation** — checks if the face is centered, at the right distance, and facing forward
4. **Auto-capture** — once all checks pass and the face is stable for 3 seconds, the photo is taken automatically
5. **Export** — the image is cropped and zoomed to the target format, ready to download or share
