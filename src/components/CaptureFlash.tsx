import { useEffect, useState } from 'react';

interface CaptureFlashProps {
  trigger: number; // Increment to trigger flash
}

export const CaptureFlash: React.FC<CaptureFlashProps> = ({ trigger }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (trigger === 0) return;
    setVisible(true);
    const timer = setTimeout(() => setVisible(false), 150);
    return () => clearTimeout(timer);
  }, [trigger]);

  if (!visible) return null;

  return (
    <div
      className="pointer-events-none fixed inset-0 z-50 bg-white animate-[flash_150ms_ease-out_forwards]"
      style={{
        animation: 'flash 150ms ease-out forwards',
      }}
    />
  );
};
