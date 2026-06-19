import { useCallback, useRef } from 'react';
import { useFaceDetection } from '../contexts/FaceDetectionContext';
import type { FaceData, ValidationDetails } from '../contexts/FaceDetectionContext';
import {
  RELAXED_FACE_DEVIATION,
  TOO_FAR_THRESHOLD,
  TOO_CLOSE_THRESHOLD,
  DISTANCE_HYSTERESIS,
} from '../utils/constants';

/**
 * Hook that validates face data and updates the FaceDetectionContext.
 * Extracted from OneDocs CapturePreview with distance hysteresis.
 */
export const useFaceValidation = (faceDeviation: number = RELAXED_FACE_DEVIATION, smileRequired: boolean = false) => {
  const {
    currentFaceData,
    setIsVisuallyValid,
    setIsCaptureValid,
    updateValidationDetails,
  } = useFaceDetection();

  const prevDistanceTypeRef = useRef<'too_far' | 'too_close' | 'correct'>('correct');
  const lastCaptureValidationRef = useRef<number>(0);

  const validate = useCallback((faceData: FaceData | undefined) => {
    if (!faceData) {
      const details: ValidationDetails = {
        faceSize: false,
        facePosition: false,
        faceOrientation: false,
        faceInFrame: false,
        overall: false,
      };
      updateValidationDetails(details);
      setIsVisuallyValid(false);
      setIsCaptureValid(false);
      return details;
    }

    const facePositionDeviation = faceData.position;
    const isLookingSideways = faceData.direction.isLookLeft || faceData.direction.isLookRight;
    const isLookingVertical = faceData.direction.isLookUp || faceData.direction.isLookDown;
    const isFaceInFrame = faceData.boundingBox ? !faceData.boundingBox.isPartiallyOutOfFrame : true;

    // Distance detection with hysteresis
    const TOO_FAR_EXIT = TOO_FAR_THRESHOLD - DISTANCE_HYSTERESIS;
    const TOO_CLOSE_EXIT = TOO_CLOSE_THRESHOLD + DISTANCE_HYSTERESIS;

    let distanceType: 'too_far' | 'too_close' | 'correct' = prevDistanceTypeRef.current;

    if (prevDistanceTypeRef.current === 'too_far') {
      if (faceData.width >= TOO_FAR_THRESHOLD) distanceType = 'correct';
      if (faceData.width > TOO_CLOSE_THRESHOLD) distanceType = 'too_close';
    } else if (prevDistanceTypeRef.current === 'too_close') {
      if (faceData.width <= TOO_CLOSE_THRESHOLD) distanceType = 'correct';
      if (faceData.width < TOO_FAR_THRESHOLD) distanceType = 'too_far';
    } else {
      if (faceData.width < TOO_FAR_EXIT) distanceType = 'too_far';
      else if (faceData.width > TOO_CLOSE_EXIT) distanceType = 'too_close';
    }

    prevDistanceTypeRef.current = distanceType;

    const faceSize = distanceType === 'correct';
    const facePosition = facePositionDeviation <= faceDeviation;
    const faceOrientation = !isLookingSideways && !isLookingVertical;

    const positionValid = faceSize && facePosition && faceOrientation && isFaceInFrame;
    const smileDetected = (faceData.smileIntensity ?? 0) > 0.4;
    const overall = smileRequired ? positionValid && smileDetected : positionValid;

    const details: ValidationDetails = {
      faceSize,
      facePosition,
      faceOrientation,
      faceInFrame: isFaceInFrame,
      overall,
      smileDetected,
      distanceType,
      direction: faceData.direction,
    };

    updateValidationDetails(details);
    setIsVisuallyValid(overall);

    // Capture validation is more stable — only update every 200ms
    const now = Date.now();
    if (now - lastCaptureValidationRef.current > 200) {
      setIsCaptureValid(overall);
      lastCaptureValidationRef.current = now;
    }

    return details;
  }, [faceDeviation, smileRequired, updateValidationDetails, setIsVisuallyValid, setIsCaptureValid]);

  return { validate, currentFaceData };
};
