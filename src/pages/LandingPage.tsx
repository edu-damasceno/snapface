interface LandingPageProps {
  onStart: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onStart }) => {
  return (
    <div className="relative flex h-full w-full flex-col items-center bg-black overflow-hidden">
      {/* Background gradient glow */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 90% 60% at 50% 40%, rgba(99,102,241,0.15) 0%, rgba(59,130,246,0.06) 40%, rgba(0,0,0,0) 70%)',
        }}
      />

      {/* Top section — title */}
      <div
        className="relative z-10 w-full px-8 text-center"
        style={{ paddingTop: 'max(env(safe-area-inset-top, 20px), 64px)' }}
      >
        <h1 className="text-4xl font-bold tracking-tight text-white">SnapFace</h1>
        <p className="mt-2 text-xs tracking-[0.25em] text-white/30 uppercase">Foto 3x4 com IA</p>
      </div>

      {/* Center — description + CTA */}
      <div className="relative z-10 flex flex-1 flex-col items-center justify-center gap-8 px-8">
        <p className="max-w-[280px] text-center text-base leading-relaxed text-white/60">
          Posicione o rosto e relaxe — a IA detecta e captura <strong className="text-white">automaticamente</strong>.
        </p>

        <button
          onClick={onStart}
          style={{
            background: 'linear-gradient(135deg, #ffffff 0%, #e0e0e0 100%)',
            boxShadow: '0 0 30px rgba(255,255,255,0.12), 0 4px 20px rgba(0,0,0,0.3)',
          }}
          className="rounded-full px-14 py-4 text-base font-semibold text-black transition-all active:scale-95 active:opacity-90"
        >
          Tirar minha foto
        </button>

        <p className="text-[11px] text-white/25">
          Será solicitado acesso à câmera
        </p>
      </div>

      {/* Bottom features */}
      <div
        className="relative z-10 w-full"
        style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 16px), 32px)' }}
      >
        <div className="flex justify-center gap-8 px-6">
          {[
            {
              label: 'Sem apertar nada',
              svg: (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              ),
            },
            {
              label: 'Formato documento',
              svg: (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0" />
                </svg>
              ),
            },
            {
              label: 'Privacidade total',
              svg: (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              ),
            },
          ].map((item) => (
            <div key={item.label} className="flex flex-col items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/[0.07] text-white/50">
                {item.svg}
              </div>
              <span className="max-w-[80px] text-center text-[10px] leading-tight text-white/35">{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
