import type { ValidationDetails } from '../contexts/FaceDetectionContext';

// Circle size as percentage of the smaller container dimension
export const CIRCLE_SIZE_PCT = 0.75;

interface FaceGuideProps {
  isFaceDetected: boolean;
  validationDetails: ValidationDetails | undefined;
  isStable: boolean;
  isActive: boolean;
}

export const FaceGuide: React.FC<FaceGuideProps> = ({
  isFaceDetected,
  validationDetails,
  isStable,
  isActive,
}) => {
  const getBorderColor = () => {
    if (!isFaceDetected) return 'rgba(255,255,255,0.2)';
    if (isActive) return 'rgba(74,222,128,1)';
    if (isStable) return 'rgba(74,222,128,1)';
    if (validationDetails?.overall) return 'rgba(74,222,128,1)';
    return 'rgba(250,204,21,1)';
  };

  // Responsive circle: uses min(90vw, 55dvh) clamped, matching OneDocs
  const circleSize = 'clamp(260px, min(90vw, 55dvh), 390px)';

  return (
    <div className="pointer-events-none absolute inset-0">
      {/* Dark overlay with circular transparent cutout */}
      <div
        className="absolute inset-0"
        style={{
          background: 'rgba(0,0,0,0.65)',
          maskImage: `radial-gradient(circle ${circleSize} at center, transparent 49%, black 50%)`,
          WebkitMaskImage: `radial-gradient(circle ${circleSize} at center, transparent 49%, black 50%)`,
        }}
      />

      {/* Circular border */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div
          className={`transition-colors duration-200 ${isActive ? 'animate-pulse' : ''}`}
          style={{
            width: circleSize,
            height: circleSize,
            borderRadius: '50%',
            border: `3px solid ${getBorderColor()}`,
          }}
        />
      </div>
    </div>
  );
};
