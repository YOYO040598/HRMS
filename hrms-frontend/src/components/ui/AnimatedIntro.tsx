import { useState, useEffect } from 'react';

type IntroPhase = 'prep-throw' | 'paint-flying' | 'logo-reveal' | 'card-morph' | 'complete';

interface AnimatedIntroProps {
  onComplete: () => void;
}

export default function AnimatedIntro({ onComplete }: AnimatedIntroProps) {
  const [phase, setPhase] = useState<IntroPhase>('prep-throw');
  const [splatDrops, setSplatDrops] = useState<{ x: number; y: number; delay: number; color: string }[]>([]);

  useEffect(() => {
    // Generate some random splash drops for the logo-reveal phase
    const drops = Array.from({ length: 14 }).map(() => {
      const angle = Math.random() * Math.PI * 2;
      const distance = 80 + Math.random() * 120;
      const colors = ['#14B8A6', '#2DD4BF', '#06B6D4', '#0891B2', '#38BDF8'];
      return {
        x: Math.cos(angle) * distance,
        y: Math.sin(angle) * distance,
        delay: Math.random() * 0.4,
        color: colors[Math.floor(Math.random() * colors.length)],
      };
    });
    setSplatDrops(drops);
  }, []);

  useEffect(() => {
    // Phase timeline transitions:
    // 0s - 1.5s: Character winds up
    // 1.5s - 2.5s: Paint splash flies to screen
    // 2.5s - 4.2s: Splat hits screen, forms organic splat, logo appears inside
    // 4.2s - 5.8s: Splat morphs into login card, logo slides up
    // 5.8s: Complete

    const flyTimer = setTimeout(() => setPhase('paint-flying'), 1500);
    const splatTimer = setTimeout(() => setPhase('logo-reveal'), 2500);
    const morphTimer = setTimeout(() => setPhase('card-morph'), 4200);
    const completeTimer = setTimeout(() => {
      setPhase('complete');
      onComplete();
    }, 5800);

    return () => {
      clearTimeout(flyTimer);
      clearTimeout(splatTimer);
      clearTimeout(morphTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  const handleSkip = () => {
    setPhase('complete');
    onComplete();
  };

  if (phase === 'complete') return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-[#070b12] flex items-center justify-center">
      <style>{`
        @keyframes char-windup {
          0% { transform: translate(-50px, 100px) rotate(0deg); }
          50% { transform: translate(-30px, 110px) rotate(-15deg); }
          100% { transform: translate(-30px, 110px) rotate(-20deg); }
        }
        @keyframes char-throw {
          0% { transform: translate(-30px, 110px) rotate(-20deg); }
          20% { transform: translate(10px, 90px) rotate(25deg); }
          100% { transform: translate(20px, 150px) rotate(15deg); opacity: 0; }
        }
        @keyframes brush-stroke {
          0% { stroke-dashoffset: 100; opacity: 0; }
          50% { stroke-dashoffset: 0; opacity: 1; }
          100% { stroke-dashoffset: -100; opacity: 0; }
        }
        @keyframes fly-splash {
          0% { transform: translate(-35vw, 25vh) scale(0.1) rotate(0deg); opacity: 0.2; }
          40% { opacity: 1; }
          100% { transform: translate(0, 0) scale(1.6) rotate(180deg); opacity: 1; }
        }
        @keyframes drop-splat {
          0% { transform: translate(0, 0) scale(0); opacity: 0; }
          30% { opacity: 1; }
          100% { transform: translate(var(--dx), var(--dy)) scale(0.8); opacity: 0; }
        }
        @keyframes splat-grow {
          0% { transform: scale(0.2); border-radius: 40% 60% 50% 50%; }
          100% { transform: scale(1); border-radius: 43% 57% 65% 35% / 40% 45% 55% 60%; }
        }
        @keyframes logo-pop {
          0% { transform: scale(0) rotate(-45deg); opacity: 0; }
          70% { transform: scale(1.1) rotate(5deg); opacity: 1; }
          100% { transform: scale(1) rotate(0deg); opacity: 1; }
        }
        .character-wind {
          animation: char-windup 1.5s cubic-bezier(0.25, 1, 0.5, 1) forwards;
        }
        .character-slash {
          animation: char-throw 1.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .splash-blob {
          animation: fly-splash 1.0s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .splat-base {
          animation: splat-grow 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
          background: linear-gradient(135deg, #14B8A6 0%, #2DD4BF 50%, #06B6D4 100%);
          box-shadow: 0 0 40px rgba(45, 212, 191, 0.4);
        }
        .splat-drop {
          animation: drop-splat 1.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .logo-emblem {
          animation: logo-pop 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) 0.3s forwards;
        }
        .transition-card {
          transition: all 1.2s cubic-bezier(0.16, 1, 0.3, 1);
        }
      `}</style>

      {/* Background Starry Sky */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0A1120] via-[#120F24] to-[#070b12] overflow-hidden select-none pointer-events-none">
        <div className="absolute top-[10%] left-[20%] w-1 h-1 bg-white rounded-full animate-pulse" />
        <div className="absolute top-[25%] left-[80%] w-1.5 h-1.5 bg-[#2DD4BF]/40 rounded-full animate-ping" />
        <div className="absolute top-[15%] left-[45%] w-1 h-1 bg-cyan-200 rounded-full animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-[40%] left-[65%] w-1 h-1 bg-white rounded-full animate-pulse" style={{ animationDelay: '0.6s' }} />
      </div>

      {/* Skip button */}
      <button
        onClick={handleSkip}
        className="absolute top-6 right-6 z-50 px-4 py-2 bg-black/40 hover:bg-black/60 border border-white/10 hover:border-white/30 text-white/80 hover:text-white text-xs font-bold rounded-full transition-all cursor-pointer shadow-lg"
      >
        Skip Intro ➔
      </button>

      {/* 👦 CHARACTER & BRUSH THROW */}
      {['prep-throw', 'paint-flying'].includes(phase) && (
        <div
          className={`absolute bottom-0 left-0 z-20 ${
            phase === 'paint-flying' ? 'character-slash' : 'character-wind'
          }`}
          style={{ transformOrigin: 'bottom center' }}
        >
          <svg viewBox="0 0 160 200" className="w-[200px] h-[250px] overflow-visible">
            {/* Paint Bucket with splash */}
            <g transform="translate(10, 110)">
              <rect x="0" y="10" width="22" height="24" rx="2" fill="#475569" stroke="#1E293B" strokeWidth="1" />
              <path d="M 0 10 Q 11 -2 22 10" fill="none" stroke="#64748B" strokeWidth="1.5" />
              {/* Teal paint overflow */}
              <path d="M -2 10 Q 11 16 24 10 L 22 15 Q 11 19 0 15 Z" fill="#2DD4BF" />
              {/* Dripping paint drop */}
              <circle cx="5" cy="22" r="2" fill="#2DD4BF" />
            </g>

            {/* Left Arm swinging bucket */}
            <path
              d={phase === 'paint-flying' ? 'M 60 90 Q 30 70 12 115' : 'M 60 90 Q 35 110 22 120'}
              fill="none"
              stroke="#2E1C0C"
              strokeWidth="9"
              strokeLinecap="round"
            />

            {/* Torso & Legs */}
            <rect x="52" y="130" width="12" height="40" fill="#1E293B" rx="4" />
            <rect x="74" y="130" width="12" height="40" fill="#1E293B" rx="4" />
            <ellipse cx="56" cy="172" rx="9" ry="6" fill="#F8FAFC" />
            <ellipse cx="82" cy="172" rx="9" ry="6" fill="#F8FAFC" />

            <path d="M 46 85 L 86 85 L 80 132 L 52 132 Z" fill="#0D9488" /> {/* Teal painter overalls */}
            <circle cx="66" cy="100" r="7" fill="#14B8A6" opacity="0.3" />

            {/* Right Arm winding up brush */}
            <path
              d={phase === 'paint-flying' ? 'M 80 95 Q 110 80 130 50' : 'M 80 95 Q 105 115 125 125'}
              fill="none"
              stroke="#2E1C0C"
              strokeWidth="9"
              strokeLinecap="round"
            />
            {/* Paint brush in right hand */}
            <g transform={phase === 'paint-flying' ? 'translate(125, 40) rotate(-45)' : 'translate(120, 115) rotate(45)'}>
              <rect x="0" y="0" width="5" height="25" fill="#B45309" rx="1" />
              <rect x="-2" y="20" width="9" height="8" fill="#94A3B8" />
              <path d="M -2 28 Q 2.5 38 7 28" fill="#2DD4BF" />
            </g>

            {/* Neck & Head */}
            <rect x="61" y="66" width="12" height="12" fill="#FDBA74" />
            <circle cx="67" cy="52" r="22" fill="#FDBA74" />

            {/* Cap/Hair */}
            <path d="M 43 45 Q 67 22 91 45" fill="#1E293B" />
            <rect x="42" y="42" width="50" height="4" fill="#14B8A6" rx="1" /> {/* Cap brim */}

            {/* Eyes */}
            <ellipse cx="58" cy="53" r="3" fill="#1E293B" />
            <ellipse cx="76" cy="53" r="3" fill="#1E293B" />
            <circle cx="59" cy="51.5" r="0.8" fill="#FFFFFF" />
            <circle cx="77" cy="51.5" r="0.8" fill="#FFFFFF" />

            {/* Happy Smile */}
            <path d="M 64 61 Q 67 64 70 61" fill="none" stroke="#1E293B" strokeWidth="2.2" strokeLinecap="round" />
          </svg>
        </div>
      )}

      {/* 🎨 FLYING PAINT SPLASH */}
      {phase === 'paint-flying' && (
        <div className="absolute z-30 splash-blob pointer-events-none">
          <svg viewBox="0 0 100 100" className="w-[120px] h-[120px]">
            {/* Dynamic splash vector shape */}
            <path
              d="M 50 12 C 60 12, 68 25, 78 30 C 88 35, 98 48, 92 60 C 86 72, 70 76, 58 88 C 46 100, 32 98, 20 88 C 8 78, 2 64, 10 52 C 18 40, 25 35, 32 20 C 39 5, 40 12, 50 12 Z"
              fill="url(#paintGrad)"
            />
            <defs>
              <linearGradient id="paintGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#14B8A6" />
                <stop offset="50%" stopColor="#2DD4BF" />
                <stop offset="100%" stopColor="#06B6D4" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      )}

      {/* 💥 SPLAT ON SCREEN & LOGO REVEAL */}
      {phase === 'logo-reveal' && (
        <div className="relative flex items-center justify-center z-30 select-none pointer-events-none">
          {/* Splat Base Circle */}
          <div className="w-[280px] h-[280px] splat-base flex items-center justify-center relative">
            
            {/* Floating HRMS Logo inside the Splat */}
            <div className="logo-emblem flex flex-col items-center justify-center text-center">
              <svg viewBox="0 0 100 100" className="w-24 h-24 filter drop-shadow-[0_0_15px_rgba(255,255,255,0.8)]">
                {/* Modern styled 'H' lettermark */}
                <path d="M 25 15 L 25 85" stroke="#FFFFFF" strokeWidth="12" strokeLinecap="round" />
                <path d="M 75 15 L 75 85" stroke="#FFFFFF" strokeWidth="12" strokeLinecap="round" />
                <path d="M 25 50 L 75 50" stroke="#FFFFFF" strokeWidth="12" strokeLinecap="round" />
                {/* Custom paint brush splash element overlay */}
                <path d="M 12 30 C 18 15, 30 18, 25 35" stroke="#000000" strokeWidth="3" fill="none" opacity="0.1" />
              </svg>
              <h2 className="text-[#FFFFFF] text-2xl font-black tracking-widest mt-2 uppercase filter drop-shadow-[0_2px_8px_rgba(0,0,0,0.3)]">
                YOYO HRMS
              </h2>
            </div>

          </div>

          {/* Decorative Splat Drop Particles bursting outwards */}
          {splatDrops.map((d, i) => (
            <div
              key={i}
              className="absolute w-5 h-5 rounded-full splat-drop"
              style={{
                backgroundColor: d.color,
                '--dx': `${d.x}px`,
                '--dy': `${d.y}px`,
                animationDelay: `${d.delay}s`,
                top: 'calc(50% - 10px)',
                left: 'calc(50% - 10px)',
              } as React.CSSProperties}
            />
          ))}
        </div>
      )}

      {/* 🎴 CARD MORPH PHASE */}
      {phase === 'card-morph' && (
        <div
          className="transition-card flex flex-col items-center justify-center p-8 select-none pointer-events-none"
          style={{
            width: '420px',
            height: '460px',
            borderRadius: '24px',
            background: 'rgba(13, 23, 40, 0.72)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(45, 212, 191, 0.25)',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255,255,255,0.1)',
          }}
        >
          {/* Logo slides up to the top */}
          <div className="flex flex-col items-center animate-slideUp duration-1000">
            <svg viewBox="0 0 100 100" className="w-16 h-16 animate-pulse">
              <path d="M 25 15 L 25 85" stroke="#2DD4BF" strokeWidth="12" strokeLinecap="round" />
              <path d="M 75 15 L 75 85" stroke="#2DD4BF" strokeWidth="12" strokeLinecap="round" />
              <path d="M 25 50 L 75 50" stroke="#14B8A6" strokeWidth="12" strokeLinecap="round" />
            </svg>
            <h1 className="text-xl font-extrabold tracking-widest text-[#F8FAFC] uppercase mt-2">
              YOYO HRMS
            </h1>
            <p className="text-xs text-[#2DD4BF] font-semibold mt-1">Enterprise Management Portal</p>
          </div>

          {/* Frosted glow rings expanding around card border */}
          <div className="absolute inset-0 rounded-[24px] border border-cyan-400/20 opacity-30 blur-[2px] pointer-events-none" />
        </div>
      )}
    </div>
  );
}
