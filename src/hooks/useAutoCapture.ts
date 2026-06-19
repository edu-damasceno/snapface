import { useState, useEffect, useCallback, useRef } from 'react';
import type { FaceData, ValidationDetails } from '../contexts/FaceDetectionContext';

export interface AutoCaptureConfig {
  enabled: boolean;
  stabilityDuration: number;
  countdownDuration: number;
  maxMovementThreshold: number;
  maxWidthChangeThreshold: number;
  instantCapture: boolean;
}

export interface AutoCaptureState {
  isActive: boolean;
  countdown: number;
  isStable: boolean;
  canCapture: boolean;
}

const defaultConfig: AutoCaptureConfig = {
  enabled: true,
  stabilityDuration: 1000,
  countdownDuration: 3000,
  maxMovementThreshold: 25,
  maxWidthChangeThreshold: 15,
  instantCapture: false,
};

export const useAutoCapture = (
  currentFaceData: FaceData | undefined,
  validationDetails: ValidationDetails | undefined,
  isValidForCapture: boolean,
  onAutoCapture: () => Promise<boolean>,
  config: Partial<AutoCaptureConfig> = {}
) => {
  const fullConfig = { ...defaultConfig, ...config };

  const [state, setState] = useState<AutoCaptureState>({
    isActive: false,
    countdown: 0,
    isStable: false,
    canCapture: false,
  });

  const isMountedRef = useRef<boolean>(true);
  const stabilityStartRef = useRef<number>(0);
  const previousFaceDataRef = useRef<FaceData | undefined>(undefined);
  const stabilityTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const captureTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const instantCaptureArmedRef = useRef(true);
  const wasEnabledRef = useRef(fullConfig.enabled);

  // Keep latest callback in a ref to avoid stale closures in setTimeout/setInterval
  const onAutoCaptureRef = useRef(onAutoCapture);
  onAutoCaptureRef.current = onAutoCapture;

  const checkStability = useCallback((faceData: FaceData | undefined): boolean => {
    if (!faceData || !previousFaceDataRef.current) return false;

    const prev = previousFaceDataRef.current;
    const positionChange = Math.abs(faceData.position - prev.position);
    const widthChange = Math.abs(faceData.width - prev.width);

    return (
      positionChange <= fullConfig.maxMovementThreshold &&
      widthChange <= fullConfig.maxWidthChangeThreshold
    );
  }, [fullConfig.maxMovementThreshold, fullConfig.maxWidthChangeThreshold]);

  const clearAllTimeouts = useCallback(() => {
    if (stabilityTimeoutRef.current) {
      clearTimeout(stabilityTimeoutRef.current);
      stabilityTimeoutRef.current = null;
    }
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    if (captureTimeoutRef.current) {
      clearTimeout(captureTimeoutRef.current);
      captureTimeoutRef.current = null;
    }
  }, []);

  const startCountdown = useCallback(() => {
    let currentCount = 3;
    setState(prev => ({ ...prev, countdown: currentCount }));

    countdownIntervalRef.current = setInterval(() => {
      currentCount -= 1;

      if (currentCount > 0) {
        if (isMountedRef.current) {
          setState(prev => ({ ...prev, countdown: currentCount }));
        }
      } else {
        clearInterval(countdownIntervalRef.current!);
        countdownIntervalRef.current = null;

        if (isMountedRef.current) {
          setState(prev => ({ ...prev, countdown: 0 }));
        }

        captureTimeoutRef.current = setTimeout(async () => { // minimal delay for React to flush countdown=0
          if (!isMountedRef.current) return;

          // Use ref to always call the latest callback (avoids stale closure)
          const success = await onAutoCaptureRef.current();
          if (!isMountedRef.current) return;

          if (success) {
            setState({
              isStable: false,
              isActive: false,
              countdown: 0,
              canCapture: false,
            });
          } else {
            setState({
              isActive: false,
              countdown: 0,
              isStable: false,
              canCapture: true,
            });
            stabilityStartRef.current = 0;
          }
        }, 50);
      }
    }, 1000);
  }, []);

  const cancelAutoCapture = useCallback(() => {
    clearAllTimeouts();
    setState({
      isActive: false,
      countdown: 0,
      isStable: false,
      canCapture: false,
    });
    stabilityStartRef.current = 0;
  }, [clearAllTimeouts]);

  // Main effect to monitor conditions
  useEffect(() => {
    if (!fullConfig.enabled) {
      wasEnabledRef.current = false;
      cancelAutoCapture();
      return;
    }

    // After retake, user may still be smiling — require a fresh smile trigger
    if (fullConfig.instantCapture && !wasEnabledRef.current) {
      instantCaptureArmedRef.current = false;
    }
    wasEnabledRef.current = true;

    const isBasicallyValid = isValidForCapture &&
                           currentFaceData &&
                           validationDetails?.overall === true;

    if (!isBasicallyValid) {
      if (state.isActive) {
        cancelAutoCapture();
      }
      // Arm instant capture when conditions become invalid (face gone or smile stopped)
      if (fullConfig.instantCapture) {
        instantCaptureArmedRef.current = true;
      }
      previousFaceDataRef.current = currentFaceData;
      return;
    }

    // Instant capture: skip stability and countdown, capture immediately
    // Only fires when armed (requires conditions to go invalid first)
    if (fullConfig.instantCapture && !state.isActive && instantCaptureArmedRef.current) {
      instantCaptureArmedRef.current = false;
      setState({ isActive: true, countdown: 0, isStable: true, canCapture: true });
      (async () => {
        if (!isMountedRef.current) return;
        const success = await onAutoCaptureRef.current();
        if (!isMountedRef.current) return;
        if (success) {
          setState({ isStable: false, isActive: false, countdown: 0, canCapture: false });
        } else {
          instantCaptureArmedRef.current = true;
          setState({ isActive: false, countdown: 0, isStable: false, canCapture: true });
          stabilityStartRef.current = 0;
        }
      })();
      previousFaceDataRef.current = currentFaceData;
      return;
    }

    const isStable = checkStability(currentFaceData);

    if (isStable) {
      if (stabilityStartRef.current > 0) {
        const elapsed = Date.now() - stabilityStartRef.current;

        if (elapsed >= fullConfig.stabilityDuration && !state.isActive) {
          setState(prev => ({ ...prev, isActive: true, isStable: true, canCapture: true }));
          startCountdown();
        } else {
          setState(prev => ({ ...prev, isStable: true }));
        }
      } else {
        stabilityStartRef.current = Date.now();
        setState(prev => ({ ...prev, isStable: true }));
      }
    } else {
      if (stabilityStartRef.current > 0 || state.isActive) {
        cancelAutoCapture();
      }
      setState(prev => ({ ...prev, isStable: false }));
      stabilityStartRef.current = 0;
    }

    previousFaceDataRef.current = currentFaceData;
  }, [
    currentFaceData,
    validationDetails,
    isValidForCapture,
    fullConfig.enabled,
    fullConfig.instantCapture,
    fullConfig.stabilityDuration,
    checkStability,
    startCountdown,
    cancelAutoCapture,
    state.isActive
  ]);

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      clearAllTimeouts();
    };
  }, [clearAllTimeouts]);

  return {
    ...state,
    cancelAutoCapture,
    config: fullConfig,
  };
};
