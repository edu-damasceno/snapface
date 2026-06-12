import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import type { ReactNode } from 'react';
import type { MediaPipeProcessedFrame } from '../lib/ReactMediaPipe';

export interface FaceData {
  width: number;
  height: number;
  position: number;
  direction: {
    isLookLeft: boolean;
    isLookRight: boolean;
    isLookUp: boolean;
    isLookDown: boolean;
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

export interface ValidationDetails {
  faceSize: boolean;
  facePosition: boolean;
  faceOrientation: boolean;
  faceInFrame: boolean;
  overall: boolean;
  distanceType?: 'too_far' | 'too_close' | 'correct';
  direction?: {
    isLookLeft: boolean;
    isLookRight: boolean;
    isLookUp: boolean;
    isLookDown: boolean;
  };
}

export interface FaceDetectionContextType {
  currentFaceData: FaceData | undefined;
  validationDetails: ValidationDetails | undefined;
  isFaceDetected: boolean;
  isCaptureReady: boolean;
  isVisuallyValid: boolean;
  isCaptureValid: boolean;
  lookLeft: boolean;
  lookRight: boolean;
  lookUp: boolean;
  lookDown: boolean;
  isFacingCenter: boolean;

  updateFaceData: (faceData: FaceData | undefined) => void;
  updateValidationDetails: (details: ValidationDetails | undefined) => void;
  updateDirectionStates: (left: boolean, right: boolean, up: boolean, down: boolean, center: boolean) => void;
  setIsCaptureReady: (ready: boolean) => void;
  setIsVisuallyValid: (valid: boolean) => void;
  setIsCaptureValid: (valid: boolean) => void;
  onFaceFrameProcessed: (processed: MediaPipeProcessedFrame) => void;
}

const FaceDetectionContext = createContext<FaceDetectionContextType | undefined>(undefined);

export const useFaceDetection = (): FaceDetectionContextType => {
  const context = useContext(FaceDetectionContext);
  if (!context) {
    throw new Error('useFaceDetection must be used within a FaceDetectionProvider');
  }
  return context;
};

interface FaceDetectionProviderProps {
  children: ReactNode;
}

export const FaceDetectionProvider: React.FC<FaceDetectionProviderProps> = ({ children }) => {
  const [currentFaceData, setCurrentFaceData] = useState<FaceData | undefined>(undefined);
  const [validationDetails, setValidationDetails] = useState<ValidationDetails | undefined>(undefined);
  const [isCaptureReady, setIsCaptureReady] = useState(false);
  const [isVisuallyValid, setIsVisuallyValid] = useState(false);
  const [isCaptureValid, setIsCaptureValid] = useState(false);
  const [lookLeft, setLookLeft] = useState(false);
  const [lookRight, setLookRight] = useState(false);
  const [lookUp, setLookUp] = useState(false);
  const [lookDown, setLookDown] = useState(false);
  const [isFacingCenter, setIsFacingCenter] = useState(false);

  // Refs for hysteresis — prevent flickering at boundaries
  const prevLookLeftRef = useRef(false);
  const prevLookRightRef = useRef(false);
  const prevLookUpRef = useRef(false);
  const prevLookDownRef = useRef(false);

  const isFaceDetected = !!currentFaceData;

  const updateFaceData = useCallback((faceData: FaceData | undefined) => {
    setCurrentFaceData(faceData);
  }, []);

  const updateValidationDetails = useCallback((details: ValidationDetails | undefined) => {
    setValidationDetails(details);
  }, []);

  const updateDirectionStates = useCallback((left: boolean, right: boolean, up: boolean, down: boolean, center: boolean) => {
    setLookLeft(left);
    setLookRight(right);
    setLookUp(up);
    setLookDown(down);
    setIsFacingCenter(center);
  }, []);

  const onFaceFrameProcessed = useCallback((processed: MediaPipeProcessedFrame) => {
    if (!processed.isFaceDetected()) {
      updateFaceData(undefined);
      updateDirectionStates(false, false, false, false, false);
      return;
    }

    const face = processed.getFace();
    if (!face) return;

    const faceWidth = face.getWidth();
    const faceHeight = face.getHeight();
    const facePosition = face.getFacePosition();
    const rotation = face.direction.getRotation();
    const angleX = rotation.x;
    const angleY = rotation.y;

    // Hysteresis for direction detection
    const ANGLE_CENTER_TO_SIDE = 35;
    const ANGLE_SIDE_TO_CENTER = 25;

    let isLookLeft = prevLookLeftRef.current;
    let isLookRight = prevLookRightRef.current;

    if (prevLookLeftRef.current) {
      if (angleY <= ANGLE_SIDE_TO_CENTER) isLookLeft = false;
    } else {
      if (angleY > ANGLE_CENTER_TO_SIDE) isLookLeft = true;
    }

    if (prevLookRightRef.current) {
      if (angleY >= -ANGLE_SIDE_TO_CENTER) isLookRight = false;
    } else {
      if (angleY < -ANGLE_CENTER_TO_SIDE) isLookRight = true;
    }

    let isLookUp = prevLookUpRef.current;
    let isLookDown = prevLookDownRef.current;

    if (prevLookUpRef.current) {
      if (angleX <= ANGLE_SIDE_TO_CENTER) isLookUp = false;
    } else {
      if (angleX > ANGLE_CENTER_TO_SIDE) isLookUp = true;
    }

    if (prevLookDownRef.current) {
      if (angleX >= -ANGLE_SIDE_TO_CENTER) isLookDown = false;
    } else {
      if (angleX < -ANGLE_CENTER_TO_SIDE) isLookDown = true;
    }

    prevLookLeftRef.current = isLookLeft;
    prevLookRightRef.current = isLookRight;
    prevLookUpRef.current = isLookUp;
    prevLookDownRef.current = isLookDown;

    const boundingBox = face.getBoundingBox();

    const faceData: FaceData = {
      width: faceWidth,
      height: faceHeight,
      position: facePosition,
      direction: {
        isLookLeft: face.direction.isLookLeft(),
        isLookRight: face.direction.isLookRight(),
        isLookUp: face.direction.isLookUp(),
        isLookDown: face.direction.isLookDown()
      },
      ...(boundingBox && { boundingBox })
    };

    updateFaceData(faceData);

    const center = !isLookLeft && !isLookRight;
    updateDirectionStates(isLookLeft, isLookRight, isLookUp, isLookDown, center);
  }, [updateFaceData, updateDirectionStates]);

  const contextValue: FaceDetectionContextType = {
    currentFaceData,
    validationDetails,
    isFaceDetected,
    isCaptureReady,
    isVisuallyValid,
    isCaptureValid,
    lookLeft,
    lookRight,
    lookUp,
    lookDown,
    isFacingCenter,
    updateFaceData,
    updateValidationDetails,
    updateDirectionStates,
    setIsCaptureReady,
    setIsVisuallyValid,
    setIsCaptureValid,
    onFaceFrameProcessed,
  };

  return (
    <FaceDetectionContext.Provider value={contextValue}>
      {children}
    </FaceDetectionContext.Provider>
  );
};
