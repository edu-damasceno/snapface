/**
 * MediaPipe Face Detection Wrapper
 *
 * Wrapper for MediaPipe FaceLandmarker with 468 landmarks
 * for high precision face detection including glasses/accessories.
 */

import { FaceLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';

export interface MediaPipeFaceData {
  width: number;
  height: number;
  position: number;
  direction: {
    isLookLeft: boolean;
    isLookRight: boolean;
    isLookUp: boolean;
    isLookDown: boolean;
  };
  landmarks?: number[][];
  rotation?: {
    x: number; // pitch (up/down)
    y: number; // yaw (left/right)
    z: number; // roll (tilt)
  };
  boundingBox?: {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
    isPartiallyOutOfFrame: boolean;
    outOfFrameEdges?: {
      left: boolean;
      right: boolean;
      top: boolean;
      bottom: boolean;
    };
  };
}

export interface MediaPipeProcessedFrame {
  isFaceDetected: () => boolean;
  getFaceData: () => MediaPipeFaceData | null;
}

export class MediaPipeFaceDetection {
  private faceLandmarker: FaceLandmarker | null = null;
  private initialized: boolean = false;
  private videoElement: HTMLVideoElement | null = null;
  private wasmPath: string;

  // Hysteresis thresholds for direction detection
  private readonly ANGLE_CENTER_TO_SIDE = 35;
  private readonly ANGLE_SIDE_TO_CENTER = 25;

  // Previous state for hysteresis
  private prevLookLeft = false;
  private prevLookRight = false;
  private prevLookUp = false;
  private prevLookDown = false;

  constructor(wasmPath: string = '/wasm/mediapipe') {
    this.wasmPath = wasmPath;
  }

  private resetHysteresisState(): void {
    this.prevLookLeft = false;
    this.prevLookRight = false;
    this.prevLookUp = false;
    this.prevLookDown = false;
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      const vision = await FilesetResolver.forVisionTasks(this.wasmPath);

      this.faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
          delegate: "CPU" // GPU fails on Samsung S25 (Snapdragon 8 Elite) — CPU works universally
        },
        runningMode: "VIDEO",
        numFaces: 1,
        minFaceDetectionConfidence: 0.3,
        minFacePresenceConfidence: 0.3,
        minTrackingConfidence: 0.3,
        outputFaceBlendshapes: false,
        outputFacialTransformationMatrixes: false
      });

      this.initialized = true;
    } catch (error) {
      console.error('[MediaPipe] Initialization failed:', error);
      throw error;
    }
  }

  setVideoElement(video: HTMLVideoElement): void {
    this.videoElement = video;
  }

  async detectFace(timestamp: number): Promise<MediaPipeProcessedFrame> {
    if (!this.faceLandmarker || !this.videoElement) {
      this.resetHysteresisState();
      return this.createEmptyFrame();
    }

    try {
      const result = this.faceLandmarker.detectForVideo(this.videoElement, timestamp);

      if (!result.faceLandmarks || result.faceLandmarks.length === 0) {
        this.resetHysteresisState();
        return this.createEmptyFrame();
      }

      const landmarks = result.faceLandmarks[0];
      const faceData = this.calculateFaceData(landmarks, this.videoElement.videoWidth, this.videoElement.videoHeight);

      return {
        isFaceDetected: () => true,
        getFaceData: () => faceData
      };
    } catch (error) {
      console.error('[MediaPipe] Detection error:', error);
      return this.createEmptyFrame();
    }
  }

  private calculateFaceData(landmarks: any[], videoWidth: number, videoHeight: number): MediaPipeFaceData {
    const landmarksPixels = landmarks.map(lm => [
      lm.x * videoWidth,
      lm.y * videoHeight,
      lm.z * videoWidth
    ]);

    const xs = landmarksPixels.map(lm => lm[0]);
    const ys = landmarksPixels.map(lm => lm[1]);

    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);

    const width = maxX - minX;
    const height = maxY - minY;
    const centerX = (minX + maxX) / 2;

    const videoCenterX = videoWidth / 2;
    const position = Math.abs(centerX - videoCenterX);

    const rotation = this.calculateHeadRotation(landmarksPixels);
    const direction = this.detectDirection(rotation.y, rotation.x);

    const EDGE_MARGIN_HORIZONTAL = 10;
    const EDGE_MARGIN_VERTICAL = 30;

    const outOfFrameEdges = {
      left: minX < EDGE_MARGIN_HORIZONTAL,
      right: maxX > (videoWidth - EDGE_MARGIN_HORIZONTAL),
      top: minY < EDGE_MARGIN_VERTICAL,
      bottom: maxY > (videoHeight - EDGE_MARGIN_VERTICAL)
    };
    const isPartiallyOutOfFrame = outOfFrameEdges.left || outOfFrameEdges.right ||
                                   outOfFrameEdges.top || outOfFrameEdges.bottom;

    return {
      width,
      height,
      position,
      direction,
      landmarks: landmarksPixels,
      rotation,
      boundingBox: { minX, maxX, minY, maxY, isPartiallyOutOfFrame, outOfFrameEdges }
    };
  }

  private calculateHeadRotation(landmarks: number[][]): { x: number; y: number; z: number } {
    const noseTip = landmarks[1];
    const leftEye = landmarks[33];
    const rightEye = landmarks[263];
    const leftMouth = landmarks[61];
    const rightMouth = landmarks[291];

    const eyeCenterX = (leftEye[0] + rightEye[0]) / 2;
    const noseOffsetX = noseTip[0] - eyeCenterX;
    const faceWidth = Math.abs(rightEye[0] - leftEye[0]);
    const yaw = (noseOffsetX / faceWidth) * 120;

    const eyeCenterY = (leftEye[1] + rightEye[1]) / 2;
    const mouthCenterY = (leftMouth[1] + rightMouth[1]) / 2;
    const faceCenterY = (eyeCenterY + mouthCenterY) / 2;
    const noseOffsetY = noseTip[1] - faceCenterY;
    const faceHeight = Math.abs(mouthCenterY - eyeCenterY);
    const pitch = -(noseOffsetY / faceHeight) * 120;

    const eyeAngle = Math.atan2(rightEye[1] - leftEye[1], rightEye[0] - leftEye[0]);
    const roll = eyeAngle * (180 / Math.PI);

    return { x: pitch, y: yaw, z: roll };
  }

  private detectDirection(yaw: number, pitch: number): {
    isLookLeft: boolean;
    isLookRight: boolean;
    isLookUp: boolean;
    isLookDown: boolean;
  } {
    let isLookLeft = this.prevLookLeft;
    let isLookRight = this.prevLookRight;

    if (this.prevLookLeft) {
      if (yaw <= this.ANGLE_SIDE_TO_CENTER) isLookLeft = false;
    } else {
      if (yaw > this.ANGLE_CENTER_TO_SIDE) isLookLeft = true;
    }

    if (this.prevLookRight) {
      if (yaw >= -this.ANGLE_SIDE_TO_CENTER) isLookRight = false;
    } else {
      if (yaw < -this.ANGLE_CENTER_TO_SIDE) isLookRight = true;
    }

    let isLookUp = this.prevLookUp;
    let isLookDown = this.prevLookDown;

    if (this.prevLookUp) {
      if (pitch <= this.ANGLE_SIDE_TO_CENTER) isLookUp = false;
    } else {
      if (pitch > this.ANGLE_CENTER_TO_SIDE) isLookUp = true;
    }

    if (this.prevLookDown) {
      if (pitch >= -this.ANGLE_SIDE_TO_CENTER) isLookDown = false;
    } else {
      if (pitch < -this.ANGLE_CENTER_TO_SIDE) isLookDown = true;
    }

    this.prevLookLeft = isLookLeft;
    this.prevLookRight = isLookRight;
    this.prevLookUp = isLookUp;
    this.prevLookDown = isLookDown;

    return { isLookLeft, isLookRight, isLookUp, isLookDown };
  }

  private createEmptyFrame(): MediaPipeProcessedFrame {
    return {
      isFaceDetected: () => false,
      getFaceData: () => null
    };
  }

  dispose(): void {
    if (this.faceLandmarker) {
      this.faceLandmarker.close();
      this.faceLandmarker = null;
    }
    this.initialized = false;
  }
}
