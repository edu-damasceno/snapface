import { useCallback, useEffect, useRef, useState } from 'react';
import { FaceDetectionProvider, useFaceDetection } from '../contexts/FaceDetectionContext';
import { ReactMediaPipe } from '../lib/ReactMediaPipe';
import type { ReactMediaPipeRef } from '../lib/ReactMediaPipe';
import { useAutoCapture } from '../hooks/useAutoCapture';
import { useFaceValidation } from '../hooks/useFaceValidation';
import { CaptureFlash } from '../components/CaptureFlash';
import { COOLDOWN_MS } from '../utils/constants';

interface CameraPageProps {
  onPhotoCapture?: (blob: Blob) => void;
}

const CameraContent: React.FC<CameraPageProps> = ({ onPhotoCapture }) => {
  const mediaPipeRef = useRef<ReactMediaPipeRef>(null);
  const {
    currentFaceData,
    validationDetails,
    isCaptureValid,
    onFaceFrameProcessed,
  } = useFaceDetection();
  const { validate } = useFaceValidation();

  const [flashTrigger, setFlashTrigger] = useState(0);
  const [photoCount, setPhotoCount] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const cooldownRef = useRef(false);

  // Validate face data on every frame
  useEffect(() => {
    validate(currentFaceData);
  }, [currentFaceData, validate]);

  // Auto-capture callback
  const handleAutoCapture = useCallback(async (): Promise<boolean> => {
    if (cooldownRef.current || !mediaPipeRef.current) return false;

    try {
      const image = await mediaPipeRef.current.captureImage();
      const blob = await image.toBlob();

      // Flash effect
      setFlashTrigger(prev => prev + 1);
      setPhotoCount(prev => prev + 1);

      onPhotoCapture?.(blob);

      // Cooldown
      cooldownRef.current = true;
      setTimeout(() => {
        cooldownRef.current = false;
      }, COOLDOWN_MS);

      return true;
    } catch (error) {
      console.error('[CameraPage] Capture failed:', error);
      return false;
    }
  }, [onPhotoCapture]);

  const { countdown, isStable, isActive } = useAutoCapture(
    currentFaceData,
    validationDetails,
    isCaptureValid && !isPaused,
    handleAutoCapture,
    { enabled: !isPaused }
  );

  // Determine border color based on state
  const getBorderColor = () => {
    if (!currentFaceData) return 'border-transparent';
    if (isActive) return 'border-green-400 animate-pulse';
    if (isStable) return 'border-green-400';
    if (validationDetails?.overall) return 'border-green-400';
    return 'border-yellow-400';
  };

  // Guidance text
  const getGuidanceText = () => {
    if (countdown > 0) return String(countdown);
    if (!currentFaceData) return 'Posicione seu rosto no centro';
    if (validationDetails?.distanceType === 'too_far') return 'Aproxime-se';
    if (validationDetails?.distanceType === 'too_close') return 'Afaste-se';
    if (!validationDetails?.faceOrientation) return 'Olhe para frente';
    if (!validationDetails?.facePosition) return 'Centralize o rosto';
    if (!validationDetails?.faceInFrame) return 'Rosto fora do quadro';
    if (isStable) return 'Mantenha a posição...';
    if (validationDetails?.overall) return 'Estabilizando...';
    return 'Posicione seu rosto no centro';
  };

  return (
    <div className="relative flex h-full w-full flex-col bg-black">
      {/* Camera view */}
      <div className="relative flex-1">
        <ReactMediaPipe
          ref={mediaPipeRef}
          classes={['w-full', 'h-full', 'relative']}
          styles={{ position: 'relative' }}
          onFaceFrameProcessed={onFaceFrameProcessed}
          enableDetection={!isPaused}
          onLoadingChange={setIsLoading}
          loadingComponent={
            <div className="flex h-full w-full items-center justify-center bg-black">
              <div className="text-center">
                <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-white/20 border-t-white" />
                <p className="text-sm text-gray-400">Carregando câmera...</p>
              </div>
            </div>
          }
        >
          {/* Face guide border */}
          {!isLoading && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div
                className={`h-64 w-52 rounded-[50%] border-4 transition-colors duration-200 ${getBorderColor()}`}
              />
            </div>
          )}

          {/* Guidance text */}
          {!isLoading && (
            <div className="pointer-events-none absolute bottom-24 left-0 right-0 text-center">
              <span
                className={`inline-block rounded-full bg-black/60 px-6 py-2 text-sm font-medium text-white backdrop-blur-sm ${
                  countdown > 0 ? 'text-4xl font-bold' : ''
                }`}
              >
                {getGuidanceText()}
              </span>
            </div>
          )}
        </ReactMediaPipe>
      </div>

      {/* Bottom bar */}
      <div className="flex items-center justify-between bg-black/90 px-6 py-4">
        {/* Photo count */}
        <div className="min-w-[60px] text-sm text-gray-400">
          {photoCount > 0 && `${photoCount} foto${photoCount > 1 ? 's' : ''}`}
        </div>

        {/* Pause/Resume button */}
        <button
          onClick={() => setIsPaused(prev => !prev)}
          className="rounded-full bg-white/10 px-6 py-3 text-sm font-medium text-white transition-colors active:bg-white/20"
        >
          {isPaused ? 'Retomar' : 'Pausar'}
        </button>

        {/* Placeholder for format selector */}
        <div className="min-w-[60px]" />
      </div>

      <CaptureFlash trigger={flashTrigger} />
    </div>
  );
};

const CameraPage: React.FC<CameraPageProps> = (props) => {
  return (
    <FaceDetectionProvider>
      <CameraContent {...props} />
    </FaceDetectionProvider>
  );
};

export default CameraPage;
