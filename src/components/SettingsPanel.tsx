import { useSettings } from '../hooks/useSettings';

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({ isOpen, onClose }) => {
  const { settings, updateSetting } = useSettings();

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/50" onClick={onClose} />
      <div className="fixed right-0 top-0 bottom-0 z-50 w-80 max-w-[85vw] overflow-y-auto bg-gray-900 p-6">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Configurações</h2>
          <button onClick={onClose} className="rounded-full p-2 text-gray-400 active:bg-white/10">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Capture delay */}
        <div className="mb-6">
          <label className="mb-2 block text-sm font-medium text-gray-300">
            Delay da captura
          </label>
          <div className="flex gap-2">
            {[1, 2, 3].map(s => (
              <button
                key={s}
                onClick={() => updateSetting('captureDelay', s)}
                className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${
                  settings.captureDelay === s
                    ? 'bg-white text-black'
                    : 'bg-white/10 text-gray-300 active:bg-white/20'
                }`}
              >
                {s}s
              </button>
            ))}
          </div>
        </div>

        {/* JPEG Quality */}
        <div className="mb-6">
          <label className="mb-2 block text-sm font-medium text-gray-300">
            Qualidade da foto
          </label>
          <div className="flex gap-2">
            {([
              { value: 0.85, label: 'Padrão' },
              { value: 0.95, label: 'Alta' },
              { value: 1.0, label: 'Máxima' },
            ] as const).map(({ value, label }) => (
              <button
                key={value}
                onClick={() => updateSetting('jpegQuality', value)}
                className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${
                  settings.jpegQuality === value
                    ? 'bg-white text-black'
                    : 'bg-white/10 text-gray-300 active:bg-white/20'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Mirror saved photo */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-300">
              Espelhar foto salva
            </label>
            <button
              onClick={() => updateSetting('mirrorSavedPhoto', !settings.mirrorSavedPhoto)}
              className={`relative h-6 w-11 rounded-full transition-colors ${
                settings.mirrorSavedPhoto ? 'bg-green-500' : 'bg-gray-600'
              }`}
            >
              <div
                className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
                  settings.mirrorSavedPhoto ? 'translate-x-5' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>
          <p className="mt-1 text-xs text-gray-500">
            O preview é sempre espelhado. Esta opção controla a foto salva.
          </p>
        </div>
      </div>
    </>
  );
};
