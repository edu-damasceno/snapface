import { useCallback, useEffect, useRef, useState } from 'react';
import { FaceDetectionProvider, useFaceDetection } from '../contexts/FaceDetectionContext';
import { useGallery } from '../contexts/GalleryContext';
import { ReactMediaPipe } from '../lib/ReactMediaPipe';
import type { ReactMediaPipeRef } from '../lib/ReactMediaPipe';
import { useAutoCapture } from '../hooks/useAutoCapture';
import { useFaceValidation } from '../hooks/useFaceValidation';
import { useCaptureFormat } from '../hooks/useCaptureFormat';
import { useSettings } from '../hooks/useSettings';
import { processImage } from '../utils/formatProcessor';
import { CaptureFlash } from '../components/CaptureFlash';
import { FaceGuide } from '../components/FaceGuide';
import { GuidanceText } from '../components/GuidanceText';
import { FormatSelector } from '../components/FormatSelector';
import { ThumbnailStrip } from '../components/ThumbnailStrip';
import { PhotoPreview } from '../components/PhotoPreview';
import { SettingsPanel } from '../components/SettingsPanel';
import { COOLDOWN_MS } from '../utils/constants';

const CameraContent: React.FC = () => {
  const mediaPipeRef = useRef<ReactMediaPipeRef>(null);
  const {
    currentFaceData,
    validationDetails,
    isFaceDetected,
    isCaptureValid,
    onFaceFrameProcessed,
  } = useFaceDetection();
  const { validate } = useFaceValidation();
  const { currentFormat, selectFormat } = useCaptureFormat();
  const { settings } = useSettings();
  const { photos, addPhoto, removePhoto } = useGallery();

  const [flashTrigger, setFlashTrigger] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showFormatSelector, setShowFormatSelector] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [previewPhotoId, setPreviewPhotoId] = useState<string | null>(null);
  const cooldownRef = useRef(false);

  // Update validation deviation when format changes
  useEffect(() => {
    validate(currentFaceData);
  }, [currentFaceData, validate]);

  // Auto-capture callback
  const handleAutoCapture = useCallback(async (): Promise<boolean> => {
    if (cooldownRef.current || !mediaPipeRef.current) return false;

    try {
      const image = await mediaPipeRef.current.captureImage();
      const rawBlob = await image.toBlob();

      // Process image with current format
      const processedBlob = await processImage(rawBlob, {
        format: currentFormat,
        faceWidthInPreview: currentFaceData?.width,
        mirror: settings.mirrorSavedPhoto,
        jpegQuality: settings.jpegQuality,
      });

      setFlashTrigger(prev => prev + 1);
      addPhoto(processedBlob, currentFormat.id);

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
  }, [currentFormat, currentFaceData?.width, settings.mirrorSavedPhoto, settings.jpegQuality, addPhoto]);

  const { countdown, isStable, isActive } = useAutoCapture(
    currentFaceData,
    validationDetails,
    isCaptureValid && !isPaused,
    handleAutoCapture,
    {
      enabled: !isPaused,
      countdownDuration: settings.captureDelay * 1000,
    }
  );

  return (
    <div className="relative flex h-full w-full flex-col bg-black">
      {/* Camera view */}
      <div className="relative flex-1 overflow-hidden">
        <ReactMediaPipe
          ref={mediaPipeRef}
          classes={['w-full', 'h-full', 'relative']}
          styles={{ position: 'relative' }}
          onFaceFrameProcessed={onFaceFrameProcessed}
          enableDetection={!isPaused}
          onLoadingChange={setIsLoading}
          jpegQuality={settings.jpegQuality}
          loadingComponent={
            <div className="flex h-full w-full items-center justify-center bg-black">
              <div className="text-center">
                <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-white/20 border-t-white" />
                <p className="text-sm text-gray-400">Carregando câmera...</p>
              </div>
            </div>
          }
        >
          {!isLoading && (
            <>
              <FaceGuide
                isFaceDetected={isFaceDetected}
                validationDetails={validationDetails}
                isStable={isStable}
                isActive={isActive}
                guideShape={currentFormat.guideShape}
              />
              <GuidanceText
                isFaceDetected={isFaceDetected}
                validationDetails={validationDetails}
                isStable={isStable}
                countdown={countdown}
              />
            </>
          )}
        </ReactMediaPipe>

        {/* Settings button */}
        {!isLoading && (
          <button
            onClick={() => setShowSettings(true)}
            className="absolute right-4 top-4 rounded-full bg-black/40 p-2 text-white backdrop-blur-sm active:bg-black/60"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        )}
      </div>

      {/* Thumbnail strip */}
      <ThumbnailStrip
        photos={photos}
        onPhotoClick={setPreviewPhotoId}
      />

      {/* Bottom bar */}
      <div className="flex items-center justify-between bg-black px-4 py-3">
        {/* Photo count */}
        <div className="min-w-[70px] text-xs text-gray-500">
          {photos.length > 0 && `${photos.length} foto${photos.length > 1 ? 's' : ''}`}
        </div>

        {/* Pause/Resume */}
        <button
          onClick={() => setIsPaused(prev => !prev)}
          className="rounded-full bg-white/10 px-5 py-2 text-sm font-medium text-white active:bg-white/20"
        >
          {isPaused ? 'Retomar' : 'Pausar'}
        </button>

        {/* Format selector */}
        <button
          onClick={() => setShowFormatSelector(true)}
          className="min-w-[70px] text-right text-xs text-gray-400 active:text-white"
        >
          {currentFormat.icon} {currentFormat.label}
        </button>
      </div>

      {/* Overlays */}
      <CaptureFlash trigger={flashTrigger} />

      <FormatSelector
        isOpen={showFormatSelector}
        currentFormat={currentFormat}
        onSelect={selectFormat}
        onClose={() => setShowFormatSelector(false)}
      />

      <SettingsPanel
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
      />

      {previewPhotoId && (
        <PhotoPreview
          photos={photos}
          initialPhotoId={previewPhotoId}
          onClose={() => setPreviewPhotoId(null)}
          onDelete={removePhoto}
        />
      )}
    </div>
  );
};

const CameraPage: React.FC = () => {
  return (
    <FaceDetectionProvider>
      <CameraContent />
    </FaceDetectionProvider>
  );
};

export default CameraPage;
