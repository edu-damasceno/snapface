import { CAPTURE_FORMATS } from '../types/CaptureFormat';
import type { CaptureFormat } from '../types/CaptureFormat';

interface FormatSelectorProps {
  isOpen: boolean;
  currentFormat: CaptureFormat;
  onSelect: (formatId: string) => void;
  onClose: () => void;
}

export const FormatSelector: React.FC<FormatSelectorProps> = ({
  isOpen,
  currentFormat,
  onSelect,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/50"
        onClick={onClose}
      />

      {/* Bottom sheet */}
      <div className="fixed bottom-0 left-0 right-0 z-50 rounded-t-2xl bg-gray-900 p-6 pb-8">
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-gray-600" />
        <h3 className="mb-4 text-lg font-semibold text-white">Formato da foto</h3>

        <div className="grid grid-cols-3 gap-3">
          {CAPTURE_FORMATS.map((format) => {
            const isSelected = format.id === currentFormat.id;
            return (
              <button
                key={format.id}
                onClick={() => {
                  onSelect(format.id);
                  onClose();
                }}
                className={`flex flex-col items-center gap-2 rounded-xl p-3 transition-colors ${
                  isSelected
                    ? 'bg-white/20 ring-2 ring-white'
                    : 'bg-white/5 active:bg-white/10'
                }`}
              >
                <span className="text-2xl">{format.icon}</span>
                <span className="text-xs text-gray-300">{format.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
};
