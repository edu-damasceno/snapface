import type { ValidationDetails } from '../contexts/FaceDetectionContext';

interface GuidanceTextProps {
  isFaceDetected: boolean;
  validationDetails: ValidationDetails | undefined;
  isStable: boolean;
  countdown: number;
}

export const GuidanceText: React.FC<GuidanceTextProps> = ({
  isFaceDetected,
  validationDetails,
  isStable,
  countdown,
}) => {
  const getText = () => {
    if (countdown > 0) return String(countdown);
    if (!isFaceDetected) return 'Posicione seu rosto no centro';
    if (validationDetails?.distanceType === 'too_far') return 'Aproxime-se';
    if (validationDetails?.distanceType === 'too_close') return 'Afaste-se';
    if (!validationDetails?.faceOrientation) return 'Olhe para frente';
    if (!validationDetails?.facePosition) return 'Centralize o rosto';
    if (!validationDetails?.faceInFrame) return 'Rosto fora do quadro';
    if (isStable) return 'Mantenha a posição...';
    if (validationDetails?.overall) return 'Estabilizando...';
    return 'Posicione seu rosto no centro';
  };

  const isCountdown = countdown > 0;

  return (
    <div className="pointer-events-none absolute bottom-24 left-0 right-0 text-center">
      <span
        className={`inline-block rounded-full bg-black/60 px-6 py-2 font-medium text-white backdrop-blur-sm ${
          isCountdown ? 'text-4xl font-bold px-8 py-4' : 'text-sm'
        }`}
      >
        {getText()}
      </span>
    </div>
  );
};
