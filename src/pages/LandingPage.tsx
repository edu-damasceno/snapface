import { useInstallPrompt } from '../hooks/useInstallPrompt';

interface LandingPageProps {
  onStart: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onStart }) => {
  const { canInstall, isInstalled, install } = useInstallPrompt();

  return (
    <div className="flex h-full flex-col items-center justify-center gap-8 p-8 bg-gradient-to-b from-gray-900 to-black">
      <div className="text-center">
        <h1 className="text-5xl font-bold text-white mb-2">SnapFace</h1>
        <p className="text-sm text-gray-500 tracking-widest uppercase">Foto 3x4 sem complicação</p>
      </div>

      <p className="text-lg text-gray-300 text-center max-w-sm leading-relaxed">
        Deixa a IA cuidar da sua foto. É só posicionar o rosto e relaxar — a captura acontece <strong className="text-white">sozinha</strong>.
      </p>

      <div className="flex flex-col items-center gap-3">
        <button
          onClick={onStart}
          className="rounded-full bg-white px-10 py-4 text-lg font-semibold text-black transition-transform active:scale-95 shadow-lg shadow-white/10"
        >
          Tirar minha foto
        </button>
        <p className="text-xs text-gray-600">
          Será solicitado acesso à câmera
        </p>
      </div>

      <div className="mt-8 flex flex-col items-center gap-4 text-sm text-gray-500">
        <div className="flex gap-6">
          <span>Sem apertar nada</span>
          <span>Formato documento</span>
          <span>Privacidade total</span>
        </div>

        {canInstall ? (
          <button
            onClick={install}
            className="mt-2 rounded-full border border-white/20 px-6 py-2 text-sm text-white/70 transition-colors active:bg-white/10"
          >
            Instalar app
          </button>
        ) : !isInstalled && (
          <p className="mt-2 max-w-xs text-center text-xs text-gray-400 leading-relaxed">
            Para instalar, abra o menu do navegador (⋮) e toque em <strong className="text-white/70">"Instalar app"</strong>
          </p>
        )}
      </div>
    </div>
  );
};

export default LandingPage;
