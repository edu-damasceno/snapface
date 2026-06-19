import { useCallback, useEffect, useRef, useState } from 'react';
import { FaceDetectionProvider, useFaceDetection } from '../contexts/FaceDetectionContext';
import { ReactMediaPipe } from '../lib/ReactMediaPipe';
import type { ReactMediaPipeRef } from '../lib/ReactMediaPipe';
import { useAutoCapture } from '../hooks/useAutoCapture';
import { useFaceValidation } from '../hooks/useFaceValidation';
import { processImage } from '../utils/formatProcessor';
import { DEFAULT_FORMAT } from '../types/CaptureFormat';
import { CaptureFlash } from '../components/CaptureFlash';
import { GuidanceText } from '../components/GuidanceText';
import { ColorWheel } from '../components/ColorWheel';

const CAPTURE_DELAY_MS = 3000;
const JPEG_QUALITY = 1.0;
const MAX_CAPTURE_RETRIES = 3;
const RETRY_DELAY_MS = 300;

const CameraContent: React.FC = () => {
  const mediaPipeRef = useRef<ReactMediaPipeRef>(null);
  const {
    currentFaceData,
    validationDetails,
    isFaceDetected,
    isCaptureValid,
    onFaceFrameProcessed,
  } = useFaceDetection();
  const [smileMode, setSmileMode] = useState(false);
  const { validate } = useFaceValidation(undefined, smileMode);

  const [flashTrigger, setFlashTrigger] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null);
  const [capturedUrl, setCapturedUrl] = useState<string | null>(null);
  const [rawPreviewUrl, setRawPreviewUrl] = useState<string | null>(null);
  const [isMirrored, setIsMirrored] = useState(false);
  const [ambientColor, setAmbientColor] = useState(() =>
    localStorage.getItem('snapface-ambient-color') || '#000000'
  );

  const handleColorSelect = useCallback((hex: string) => {
    setAmbientColor(hex);
    localStorage.setItem('snapface-ambient-color', hex);
  }, []);

  useEffect(() => {
    validate(currentFaceData);
  }, [currentFaceData, validate]);

  // Cleanup blob URLs on unmount or when photo changes
  useEffect(() => {
    return () => {
      if (capturedUrl) URL.revokeObjectURL(capturedUrl);
      if (rawPreviewUrl) URL.revokeObjectURL(rawPreviewUrl);
    };
  }, [capturedUrl, rawPreviewUrl]);

  const handleAutoCapture = useCallback(async (): Promise<boolean> => {
    if (!mediaPipeRef.current) return false;

    setFlashTrigger(prev => prev + 1);
    setIsProcessing(true);

    // Retry loop: up to MAX_CAPTURE_RETRIES attempts
    for (let attempt = 1; attempt <= MAX_CAPTURE_RETRIES; attempt++) {
      try {
        const image = await mediaPipeRef.current.captureImage();
        const rawBlob = await image.toBlob();

        const rawUrl = URL.createObjectURL(rawBlob);
        setRawPreviewUrl(rawUrl);

        const processedBlob = await processImage(rawBlob, {
          format: DEFAULT_FORMAT,
          faceWidthInPreview: currentFaceData?.width,
          mirror: false,
          jpegQuality: JPEG_QUALITY,
        });

        const url = URL.createObjectURL(processedBlob);
        setCapturedBlob(processedBlob);
        setCapturedUrl(url);
        setIsProcessing(false);

        return true;
      } catch (error) {
        console.error(`[CameraPage] Capture attempt ${attempt} failed:`, error);
        if (attempt < MAX_CAPTURE_RETRIES) {
          await new Promise(r => setTimeout(r, RETRY_DELAY_MS));
          continue;
        }
        setIsProcessing(false);
        return false;
      }
    }

    setIsProcessing(false);
    return false;
  }, [currentFaceData?.width]);

  const isCapturing = capturedBlob === null && !isProcessing;

  const { countdown, isStable, isActive } = useAutoCapture(
    currentFaceData,
    validationDetails,
    isCaptureValid && isCapturing,
    handleAutoCapture,
    {
      enabled: isCapturing,
      countdownDuration: CAPTURE_DELAY_MS,
    }
  );

  const handleRetake = useCallback(() => {
    if (capturedUrl) URL.revokeObjectURL(capturedUrl);
    if (rawPreviewUrl) URL.revokeObjectURL(rawPreviewUrl);
    setCapturedBlob(null);
    setCapturedUrl(null);
    setRawPreviewUrl(null);
    setIsMirrored(false);
  }, [capturedUrl, rawPreviewUrl]);

  /** If user toggled mirror, re-encode with horizontal flip; otherwise return original blob */
  const getFinalBlob = useCallback((): Promise<Blob> => {
    if (!capturedBlob) return Promise.reject(new Error('No photo'));
    if (!isMirrored) return Promise.resolve(capturedBlob);

    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext('2d')!;
        ctx.scale(-1, 1);
        ctx.translate(-canvas.width, 0);
        ctx.drawImage(img, 0, 0);
        canvas.toBlob((blob) => {
          canvas.width = 0;
          canvas.height = 0;
          resolve(blob ?? capturedBlob);
        }, 'image/jpeg', JPEG_QUALITY);
      };
      img.onerror = () => resolve(capturedBlob);
      img.src = URL.createObjectURL(capturedBlob);
    });
  }, [capturedBlob, isMirrored]);

  const handleDownload = useCallback(async () => {
    const blob = await getFinalBlob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `snapface_${Date.now()}.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [getFinalBlob]);

  const handleShare = useCallback(async () => {
    if (!('share' in navigator)) return;
    try {
      const blob = await getFinalBlob();
      const file = new File([blob], `snapface_${Date.now()}.jpg`, { type: 'image/jpeg' });
      await navigator.share({
        files: [file],
        title: 'SnapFace',
        text: 'Foto tirada com SnapFace — https://snapface.nerdlatino.com',
      });
    } catch {
      // User cancelled or share failed
    }
  }, [getFinalBlob]);

  // Confirmation screen — 3x4 photo matching capture layout
  if (capturedUrl) {
    return (
      <div className="relative flex h-full w-full items-center justify-center bg-black">
        {/* Instruction text — above frame */}
        <div
          className="absolute left-0 right-0"
          style={{ bottom: 'calc(50% + clamp(173px, min(33.75vw, 36.7dvh), 260px) + 24px)' }}
        >
          <p className="pointer-events-none text-center text-sm font-medium text-white/70">
            Ficou boa? Confira antes de salvar.
          </p>
        </div>

        {/* 3x4 photo — same size as capture frame */}
        <div
          className="overflow-hidden rounded-2xl"
          style={{
            width: 'clamp(195px, min(67.5vw, 41.25dvh), 293px)',
            height: 'clamp(260px, min(90vw, 55dvh), 390px)',
          }}
        >
          <img
            src={rawPreviewUrl || capturedUrl}
            alt="Foto capturada"
            className="h-full w-full object-cover"
            style={{ transform: isMirrored ? 'scaleX(-1)' : 'none' }}
          />
        </div>

        {/* Action buttons — below frame */}
        <div
          className="absolute inset-x-0"
          style={{
            top: 'calc(50% + clamp(173px, min(33.75vw, 36.7dvh), 260px) + 24px)',
          }}
        >
          <div className="flex items-start justify-center gap-6">
            {/* Espelhar */}
            <button
              onClick={() => setIsMirrored(prev => !prev)}
              className="flex flex-col items-center gap-2 active:opacity-70"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/15 backdrop-blur-md">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 7h16m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
              </div>
              <span className="text-xs text-white/70">Espelhar</span>
            </button>

            {/* Baixar */}
            <button
              onClick={handleDownload}
              className="flex flex-col items-center gap-2 active:opacity-70"
            >
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              </div>
              <span className="text-xs font-medium text-white">Baixar</span>
            </button>

            {'share' in navigator && (
              <>
                {/* Compartilhar */}
                <button
                  onClick={handleShare}
                  className="flex flex-col items-center gap-2 active:opacity-70"
                >
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/15 backdrop-blur-md">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                    </svg>
                  </div>
                  <span className="text-xs text-white/70">Compartilhar</span>
                </button>
              </>
            )}

            {/* Tirar outra */}
            <button
              onClick={handleRetake}
              className="flex flex-col items-center gap-2 active:opacity-70"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/15 backdrop-blur-md">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
              <span className="text-xs text-white/70">Tirar outra</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Camera view
  return (
    <div
      className="relative flex h-full w-full items-center justify-center"
      style={{ backgroundColor: ambientColor, transition: 'background-color 0.4s ease' }}
    >
      {/* App title + smile toggle */}
      <div
        className="absolute inset-x-0 top-0 flex items-center justify-center gap-3"
        style={{ paddingTop: 'max(env(safe-area-inset-top, 20px), 48px)' }}
      >
        <h1
          className="text-lg font-semibold tracking-wide text-white/90"
          style={{ textShadow: '0 1px 6px rgba(0,0,0,0.6)' }}
        >
          SnapFace
        </h1>
        <button
          onClick={() => setSmileMode(prev => !prev)}
          className="flex items-center justify-center rounded-full transition-opacity active:opacity-70"
          style={{
            width: 32,
            height: 32,
            backgroundColor: smileMode ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.1)',
            textShadow: '0 1px 6px rgba(0,0,0,0.6)',
          }}
          aria-label={smileMode ? 'Desativar captura com sorriso' : 'Ativar captura com sorriso'}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-5 w-5" style={{ color: smileMode ? 'rgba(250,204,21,1)' : 'rgba(255,255,255,0.5)' }}>
            <circle cx="12" cy="12" r="10" strokeWidth="1.5" />
            <circle cx="9" cy="10" r="1" fill="currentColor" stroke="none" />
            <circle cx="15" cy="10" r="1" fill="currentColor" stroke="none" />
            <path d="M8 14s1.5 2 4 2 4-2 4-2" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {/* Guidance text — absolute above preview frame */}
      {!isLoading && !isProcessing && (
        <div className="absolute left-0 right-0" style={{ bottom: 'calc(50% + clamp(173px, min(33.75vw, 36.7dvh), 260px) + 24px)' }}>
          <GuidanceText
            isFaceDetected={isFaceDetected}
            validationDetails={validationDetails}
            isStable={isStable}
            smileRequired={smileMode}
            countdown={countdown}
          />
        </div>
      )}

      {/* 3x4 video container — hidden during loading so spinner shows centered */}
      <div
        className="relative overflow-hidden rounded-2xl"
        style={{
          width: 'clamp(195px, min(67.5vw, 41.25dvh), 293px)',
          height: 'clamp(260px, min(90vw, 55dvh), 390px)',
          visibility: isLoading ? 'hidden' : 'visible',
        }}
      >
        <ReactMediaPipe
          ref={mediaPipeRef}
          classes={['w-full', 'h-full', 'relative']}
          styles={{ position: 'relative' }}
          onFaceFrameProcessed={onFaceFrameProcessed}
          enableDetection={isCapturing}
          onLoadingChange={setIsLoading}
          jpegQuality={JPEG_QUALITY}
        />

        {/* Crosshair guide — fades out when face is well positioned */}
        {!isLoading && (
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              opacity: isFaceDetected && isCaptureValid ? 0 : isFaceDetected ? 0.12 : 0.3,
              transition: 'opacity 0.5s ease',
            }}
          >
            {/* Horizontal line */}
            <div className="absolute left-[20%] right-[20%] top-1/2 h-px bg-white" />
            {/* Vertical line */}
            <div className="absolute bottom-[20%] top-[20%] left-1/2 w-px bg-white" />
          </div>
        )}

        {/* Dashed border overlay */}
        {!isLoading && (
          <div
            className="pointer-events-none absolute inset-0 rounded-2xl"
            style={{
              border: `3px dashed ${
                !isFaceDetected
                  ? 'rgba(255,255,255,0.3)'
                  : isActive || isStable || validationDetails?.overall
                    ? 'rgba(74,222,128,1)'
                    : 'rgba(250,204,21,1)'
              }`,
              transition: 'border-color 0.2s',
            }}
          />
        )}
      </div>

      <CaptureFlash trigger={flashTrigger} />

      {/* Color wheel — bottom of capture screen */}
      {isCapturing && !isLoading && (
        <div
          className="absolute inset-x-0 bottom-0"
          style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 16px), 24px)' }}
        >
          <ColorWheel selectedColor={ambientColor} onSelect={handleColorSelect} />
        </div>
      )}

      {/* Loading overlay — full screen, outside circular container */}
      {isLoading && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-white/20 border-t-white" />
          <p className="text-sm text-gray-400">Carregando câmera...</p>
        </div>
      )}

      {/* Processing overlay */}
      {isProcessing && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60">
          <div className="text-center">
            <div className="mx-auto mb-3 h-10 w-10 animate-spin rounded-full border-4 border-white/20 border-t-white" />
            <p className="text-sm font-medium text-white/80">Processando foto...</p>
          </div>
        </div>
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
