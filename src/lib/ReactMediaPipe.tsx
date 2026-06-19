/**
 * React MediaPipe Component
 *
 * React component for selfie capture using MediaPipe FaceLandmarker.
 * Ported from OneDocs with cleanup (removed: logger, clarity, newRelic, cameraCleanup).
 */

import React, {
  useEffect,
  useRef,
  forwardRef,
  useImperativeHandle,
  useCallback,
  useState,
} from "react";
import { MediaPipeFaceDetection } from "./MediaPipeFaceDetection";
import type { MediaPipeFaceData } from "./MediaPipeFaceDetection";
import { useWakeLock } from "../hooks/useWakeLock";

type CameraState = 'idle' | 'initializing' | 'ready' | 'error' | 'stopping' | 'stopped';

export interface MediaPipeProcessedFrame {
  isFaceDetected(): boolean;
  getFace(): MediaPipeFaceCompatible | null;
}

export interface MediaPipeFaceCompatible {
  getWidth(): number;
  getHeight(): number;
  getFacePosition(): number;
  direction: {
    isLookLeft(): boolean;
    isLookRight(): boolean;
    isLookUp(): boolean;
    isLookDown(): boolean;
    getRotation(): { x: number; y: number; z: number };
  };
  getSmileIntensity(): number;
  getLandmarks(): any;
  getBoundingBox(): MediaPipeFaceData['boundingBox'];
}

export interface MediaPipeCapturedImage {
  toDataURL(): string;
  toBlob(): Promise<Blob>;
}

export interface VideoDimensions {
  /** CSS display width of the video element */
  clientWidth: number;
  /** CSS display height of the video element */
  clientHeight: number;
  /** Native video resolution width */
  videoWidth: number;
  /** Native video resolution height */
  videoHeight: number;
}

export interface ReactMediaPipeRef {
  captureImage(): Promise<MediaPipeCapturedImage>;
  getVideoDimensions(): VideoDimensions | null;
  stopSelfie(): void;
}

interface ReactMediaPipeProps {
  classes?: string[];
  styles?: React.CSSProperties;
  children?: React.ReactNode;
  onFaceFrameProcessed?: (frame: MediaPipeProcessedFrame) => void;
  loadingComponent?: React.ReactNode;
  faceDetectionInterval?: number;
  onCameraError?: (error: string) => void;
  onLoadingChange?: (isLoading: boolean) => void;
  enableDetection?: boolean;
  onDetectionReady?: () => void;
  jpegQuality?: number;
}

export const ReactMediaPipe = forwardRef<ReactMediaPipeRef, ReactMediaPipeProps>(
  (
    {
      classes = [],
      styles = {},
      children,
      onFaceFrameProcessed,
      loadingComponent,
      faceDetectionInterval = 50, // ~20 FPS (CPU mode)
      onCameraError,
      onLoadingChange,
      enableDetection = true,
      onDetectionReady,
      jpegQuality = 0.9,
    },
    ref
  ) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const detectorRef = useRef<MediaPipeFaceDetection | null>(null);
    const animationFrameRef = useRef<number | null>(null);
    const isMountedRef = useRef(true);
    const cameraStateRef = useRef<CameraState>('idle');
    const lastDetectionTime = useRef<number>(0);

    const [loading, setLoading] = useState(true);
    const [, setCameraError] = useState<string | null>(null);
    const faceDetectionReadyRef = useRef(false);
    const isInitializingDetectorRef = useRef(false);

    const { acquireWakeLock, releaseWakeLock } = useWakeLock();

    const setCameraState = useCallback((newState: CameraState) => {
      cameraStateRef.current = newState;
    }, []);

    const getAdaptiveResolution = useCallback((): { width: number; height: number } => {
      const memoryInfo = (navigator as any).deviceMemory;
      if (memoryInfo && memoryInfo >= 4) {
        return { width: 1920, height: 1080 };
      }
      return { width: 1280, height: 720 };
    }, []);

    const setupVideoWithEvents = useCallback((video: HTMLVideoElement, stream: MediaStream): Promise<void> => {
      return new Promise((resolve, reject) => {
        const timeoutId = setTimeout(() => {
          cleanup();
          reject(new Error('Video metadata load timeout'));
        }, 5000);

        const onLoadedMetadata = () => {
          cleanup();
          resolve();
        };

        const onError = () => {
          cleanup();
          reject(new Error('Video element error during setup'));
        };

        const cleanup = () => {
          clearTimeout(timeoutId);
          video.removeEventListener('loadedmetadata', onLoadedMetadata);
          video.removeEventListener('error', onError);
        };

        video.addEventListener('loadedmetadata', onLoadedMetadata);
        video.addEventListener('error', onError);
        video.srcObject = stream;
        video.muted = true;
      });
    }, []);

    const createCompatibleFace = useCallback((faceData: MediaPipeFaceData): MediaPipeFaceCompatible => {
      return {
        getWidth: () => faceData.width,
        getHeight: () => faceData.height,
        getFacePosition: () => faceData.position,
        direction: {
          isLookLeft: () => faceData.direction.isLookLeft,
          isLookRight: () => faceData.direction.isLookRight,
          isLookUp: () => faceData.direction.isLookUp,
          isLookDown: () => faceData.direction.isLookDown,
          getRotation: () => faceData.rotation || { x: 0, y: 0, z: 0 }
        },
        getSmileIntensity: () => faceData.smileIntensity ?? 0,
        getLandmarks: () => ({
          getPositions: () => faceData.landmarks || []
        }),
        getBoundingBox: () => faceData.boundingBox
      };
    }, []);

    const detectFaceLoop = useCallback(() => {
      if (!enableDetection) return;
      if (!isMountedRef.current || cameraStateRef.current !== 'ready') return;
      if (!videoRef.current || !videoRef.current.srcObject) return;

      const video = videoRef.current;
      if (!video.videoWidth || !video.videoHeight) return;
      if (!detectorRef.current) return;

      const now = performance.now();

      if (now - lastDetectionTime.current >= faceDetectionInterval) {
        lastDetectionTime.current = now;

        detectorRef.current.detectFace(now).then((result) => {
          queueMicrotask(() => {
            if (!isMountedRef.current) return;

            if (!faceDetectionReadyRef.current) {
              faceDetectionReadyRef.current = true;
              onLoadingChange?.(false);
              onDetectionReady?.();
            }

            if (result.isFaceDetected() && onFaceFrameProcessed) {
              const faceData = result.getFaceData();
              if (faceData) {
                onFaceFrameProcessed({
                  isFaceDetected: () => true,
                  getFace: () => createCompatibleFace(faceData)
                });
              }
            } else if (!result.isFaceDetected() && onFaceFrameProcessed) {
              onFaceFrameProcessed({
                isFaceDetected: () => false,
                getFace: () => null
              });
            }
          });
        }).catch(error => {
          console.error('[MediaPipe] Detection error:', error);
          if (error instanceof Error && error.message.includes('Graph has errors')) {
            if (animationFrameRef.current) {
              cancelAnimationFrame(animationFrameRef.current);
              animationFrameRef.current = null;
            }
          }
        });
      }

      if (isMountedRef.current && cameraStateRef.current === 'ready') {
        animationFrameRef.current = requestAnimationFrame(detectFaceLoop);
      }
    }, [enableDetection, faceDetectionInterval, onFaceFrameProcessed, createCompatibleFace, onLoadingChange, onDetectionReady]);

    const initializeCameraOnly = useCallback(async () => {
      if (cameraStateRef.current !== 'idle') return;

      setCameraState('initializing');
      setLoading(true);
      onLoadingChange?.(true);

      try {
        const adaptiveResolution = getAdaptiveResolution();

        let stream: MediaStream;
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: {
              facingMode: 'user',
              width: { ideal: adaptiveResolution.width },
              height: { ideal: adaptiveResolution.height },
            },
            audio: false
          });
        } catch {
          // Fallback to minimal constraints
          stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'user' },
            audio: false
          });
        }

        streamRef.current = stream;

        if (videoRef.current) {
          try {
            await setupVideoWithEvents(videoRef.current, stream);
            const playPromise = videoRef.current.play();
            const timeoutPromise = new Promise<void>((_, reject) =>
              setTimeout(() => reject(new Error('Video play timeout')), 3000)
            );
            await Promise.race([playPromise, timeoutPromise]);
          } catch {
            // Video may still work even if autoplay fails
          }

          await acquireWakeLock();
          setCameraState('ready');
          setCameraError(null);
          setLoading(false);
        }
      } catch (error: any) {
        setCameraState('error');
        setCameraError(error.message || 'Unknown error');
        setLoading(false);
        onCameraError?.(error.message || 'Failed to initialize camera');
        onLoadingChange?.(false);
      }
    }, [setCameraState, onLoadingChange, onCameraError, acquireWakeLock, getAdaptiveResolution, setupVideoWithEvents]);

    const initializeDetector = useCallback(async () => {
      if (detectorRef.current || isInitializingDetectorRef.current) return;
      isInitializingDetectorRef.current = true;

      try {
        const detector = new MediaPipeFaceDetection();
        await detector.initialize();
        detectorRef.current = detector;

        if (videoRef.current) {
          detector.setVideoElement(videoRef.current);
        }

        if (isMountedRef.current && cameraStateRef.current === 'ready') {
          detectFaceLoop();
        }
      } catch (error) {
        console.error('[MediaPipe] Detector initialization error:', error);
      } finally {
        isInitializingDetectorRef.current = false;
      }
    }, [detectFaceLoop]);

    const cleanupCamera = useCallback(async () => {
      setCameraState('stopping');

      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }

      await new Promise(resolve => setTimeout(resolve, 50));
      await releaseWakeLock();

      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }

      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }

      if (detectorRef.current) {
        detectorRef.current.dispose();
        detectorRef.current = null;
      }

      setCameraState('stopped');
    }, [setCameraState, releaseWakeLock]);

    useImperativeHandle(
      ref,
      () => ({
        async captureImage(): Promise<MediaPipeCapturedImage> {
          if (!videoRef.current || cameraStateRef.current !== 'ready') {
            throw new Error('Camera not ready');
          }

          const video = videoRef.current;
          const canvas = document.createElement('canvas');
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;

          const ctx = canvas.getContext('2d');
          if (!ctx) throw new Error('Failed to get canvas context');

          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

          const quality = jpegQuality;
          return {
            toDataURL: () => canvas.toDataURL('image/jpeg', quality),
            toBlob: () => new Promise((resolve, reject) => {
              canvas.toBlob((blob) => {
                if (blob) resolve(blob);
                else reject(new Error('Failed to create blob'));
              }, 'image/jpeg', quality);
            })
          };
        },
        getVideoDimensions(): VideoDimensions | null {
          const video = videoRef.current;
          if (!video) return null;
          return {
            clientWidth: video.clientWidth,
            clientHeight: video.clientHeight,
            videoWidth: video.videoWidth,
            videoHeight: video.videoHeight,
          };
        },
        stopSelfie(): void {
          cleanupCamera();
        }
      }),
      [cleanupCamera, jpegQuality]
    );

    // Initialize camera on mount
    useEffect(() => {
      isMountedRef.current = true;
      initializeCameraOnly();

      return () => {
        isMountedRef.current = false;
        cleanupCamera();
      };
    }, [initializeCameraOnly, cleanupCamera]);

    // Initialize MediaPipe when enableDetection becomes true and camera is ready
    useEffect(() => {
      if (enableDetection && cameraStateRef.current === 'ready' && !loading) {
        if (detectorRef.current) {
          detectFaceLoop();
        } else {
          initializeDetector();
        }
      } else if (!enableDetection) {
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
          animationFrameRef.current = null;
        }
      }
    }, [enableDetection, loading, initializeDetector, detectFaceLoop]);

    return (
      <div ref={containerRef} className={classes.join(' ')} style={styles}>
        {loading && loadingComponent}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transform: 'scaleX(-1)',
            display: loading ? 'none' : 'block'
          }}
        />
        <canvas ref={canvasRef} style={{ display: 'none' }} />
        {children}
      </div>
    );
  }
);

ReactMediaPipe.displayName = 'ReactMediaPipe';
