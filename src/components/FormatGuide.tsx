import type { CaptureFormat } from '../types/CaptureFormat';

interface FormatGuideProps {
  format: CaptureFormat;
}

export const FormatGuide: React.FC<FormatGuideProps> = ({ format }) => {
  // Free format: no overlay
  if (format.id === 'free') return null;

  const [w, h] = format.aspectRatio;
  const ratio = w / h;

  // Calculate cutout size relative to viewport
  // Height: 70% of viewport, width derived from aspect ratio
  const cutoutStyle: React.CSSProperties = {
    aspectRatio: `${w}/${h}`,
    height: '70%',
    maxWidth: ratio > 1 ? '90%' : undefined,
  };

  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
      {/* Semi-transparent backdrop */}
      <div className="absolute inset-0 bg-black/40" />
      {/* Clear cutout */}
      <div
        className="relative z-10 rounded-lg border border-white/30"
        style={cutoutStyle}
      />
    </div>
  );
};
