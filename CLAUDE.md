# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Dev Commands

- `npm run dev` — Start Vite dev server (HTTPS if `.certs/` dir exists)
- `npm run build` — TypeScript check + Vite production build
- `npm run lint` — ESLint
- `npm run preview` — Preview production build locally
- `npm run postinstall` — Copies MediaPipe WASM files to `public/wasm/` (runs automatically after `npm install`)

No test framework is configured.

## Architecture

SnapFace is a hands-free AI selfie capture PWA. The user points the camera at their face, the app validates positioning in real-time, and auto-captures after 3 seconds of stability.

### Pipeline

```
Camera (getUserMedia) → MediaPipe FaceLandmarker (468 landmarks, CPU mode)
→ Validation (size, position, orientation) → Stability detection → Auto-capture countdown
→ Format processing (crop, zoom, mirror) → Download/share
```

### Key modules

- **`src/lib/MediaPipeFaceDetection.ts`** — Low-level MediaPipe wrapper. Runs face landmark detection with hysteresis-based direction tracking (35° center→side, 25° side→center to prevent flickering).
- **`src/lib/ReactMediaPipe.tsx`** — React component managing camera lifecycle and detection loop (~20 FPS). Adaptive resolution: 1080p if ≥4GB RAM, else 720p.
- **`src/hooks/useFaceValidation.ts`** — Real-time validation with distance hysteresis. Thresholds in `src/utils/constants.ts` are calibrated for a 720px reference height.
- **`src/hooks/useAutoCapture.ts`** — Stability detection + 3s countdown before capture.
- **`src/utils/formatProcessor.ts`** — Crops to target aspect ratio with adaptive zoom based on detected face width, optional horizontal flip.
- **`src/types/CaptureFormat.ts`** — Format definitions (currently 3×4 document format, 1440×1920 output).
- **`src/contexts/FaceDetectionContext.tsx`** — Central state: face data, validation details, direction, capture readiness.

### Page flow

`App.tsx` switches between `LandingPage` and `CameraPage`. CameraPage wraps everything in `FaceDetectionProvider` and orchestrates the capture UI (circular guide overlay, guidance text, photo preview).

## Important Technical Decisions

- **GPU detection is disabled** — MediaPipe runs in CPU-only mode because GPU delegate fails on Samsung Snapdragon 8 Elite devices.
- **Tailwind CSS v4** via `@tailwindcss/vite` plugin (no tailwind.config file; uses CSS-based config in `src/index.css`).
- **PWA** configured with `vite-plugin-pwa` (auto-update strategy, Workbox, 15MB max cache). WASM files are included in offline cache.
- **Language**: UI text is in Portuguese (pt-BR).
