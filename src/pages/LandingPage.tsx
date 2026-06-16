interface LandingPageProps {
  onStart: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onStart }) => {
  return (
    <div className="relative flex h-full w-full flex-col items-center justify-between bg-black overflow-hidden">
      {/* Background gradient glow */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse 80% 50% at 50% 30%, rgba(99,102,241,0.12) 0%, rgba(0,0,0,0) 70%)',
        }}
      />

      {/* Top section */}
      <div
        className="relative z-10 w-full px-8 text-center"
        style={{ paddingTop: 'max(env(safe-area-inset-top, 20px), 64px)' }}
      >
        <h1 className="text-4xl font-bold tracking-tight text-white">SnapFace</h1>
        <p className="mt-1 text-sm tracking-widest text-white/40 uppercase">Foto 3x4 com IA</p>
      </div>

      {/* Center content */}
      <div className="relative z-10 flex flex-col items-center gap-10 px-8">
        <p className="max-w-xs text-center text-lg leading-relaxed text-white/70">
          Posicione o rosto e relaxe — a IA detecta e captura <strong className="text-white">automaticamente</strong>.
        </p>

        {/* CTA */}
        <button
          onClick={onStart}
          className="rounded-full bg-white px-12 py-5 text-lg font-semibold text-black shadow-[0_0_40px_rgba(255,255,255,0.15)] transition-all active:scale-95 active:shadow-none"
        >
          Tirar minha foto
        </button>

        <p className="text-xs text-white/30">
          Será solicitado acesso à câmera
        </p>
      </div>

      {/* Bottom features */}
      <div
        className="relative z-10 w-full px-8"
        style={{
          paddingBottom: 'max(env(safe-area-inset-bottom, 16px), 36px)',
          background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 100%)',
        }}
      >
        <div className="flex justify-center gap-4 pt-12">
          {[
            { icon: '✦', label: 'Sem apertar nada' },
            { icon: '◧', label: 'Formato documento' },
            { icon: '◉', label: 'Privacidade total' },
          ].map((item) => (
            <div
              key={item.label}
              className="flex flex-col items-center gap-2"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 backdrop-blur-md">
                <span className="text-sm text-white/80">{item.icon}</span>
              </div>
              <span className="text-[11px] text-white/50">{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
