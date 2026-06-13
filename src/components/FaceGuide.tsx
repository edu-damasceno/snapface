import type { ValidationDetails } from '../contexts/FaceDetectionContext';

interface FaceGuideProps {
  isFaceDetected: boolean;
  validationDetails: ValidationDetails | undefined;
  isStable: boolean;
  isActive: boolean;
  guideShape: 'oval' | 'rectangle';
}

export const FaceGuide: React.FC<FaceGuideProps> = ({
  isFaceDetected,
  validationDetails,
  isStable,
  isActive,
  guideShape,
}) => {
  const getBorderColor = () => {
    if (!isFaceDetected) return 'border-white/20';
    if (isActive) return 'border-green-400 animate-pulse';
    if (isStable) return 'border-green-400';
    if (validationDetails?.overall) return 'border-green-400';
    return 'border-yellow-400';
  };

  const shapeClasses = guideShape === 'oval'
    ? 'h-64 w-52 rounded-[50%]'
    : 'h-72 w-56 rounded-2xl';

  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
      <div
        className={`border-4 transition-colors duration-200 ${shapeClasses} ${getBorderColor()}`}
      />
    </div>
  );
};
