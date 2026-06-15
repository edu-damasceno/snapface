interface FrameRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

// Face detection thresholds
export const FACE_WIDTH = 250;
export const FACE_DEVIATION = 85; // Strict mode (document)
export const RELAXED_FACE_DEVIATION = 120; // Relaxed mode (social/free)

// Distance thresholds (px of face width in preview, calibrated for 720x560)
export const TOO_FAR_THRESHOLD = 200;
export const TOO_CLOSE_THRESHOLD = 320;
export const DISTANCE_HYSTERESIS = 10;

// Auto-capture
export const COOLDOWN_MS = 1500;
export const MAX_PHOTOS_PER_SESSION = 50;

// Frames
export const SELFIE_FRAME: FrameRect = {
  x: 0,
  y: 0,
  width: 720,
  height: 560,
};

export const CAPTURE_FRAME: FrameRect = {
  x: 225,
  y: 100,
  width: 270,
  height: 360,
};

export const FACE_FRAME: FrameRect = {
  x: 0,
  y: 0,
  width: 200,
  height: 200,
};

export const CROP_FRAME_3x4: FrameRect = {
  x: 150,
  y: 0,
  width: 420,
  height: 560,
};

export const HIGH_RES_FRAME_3x4: FrameRect = {
  x: 0,
  y: 0,
  width: 1440,
  height: 1920,
};
