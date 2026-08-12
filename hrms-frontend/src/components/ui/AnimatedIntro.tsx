import { useState, useEffect } from 'react';

type IntroPhase = 'idle' | 'lighting' | 'boom' | 'complete';

interface AnimatedIntroProps {
  onComplete: () => void;
}

export default function AnimatedIntro({ onComplete }: AnimatedIntroProps) {
  const [phase, setPhase] = useState<IntroPhase>('idle');
  const [boyPos, setBoyPos] = useState({ x: 0, y: 0 });
  const [sparkCount, setSparkCount] = useState<number>(0);

  useEffect(() => {
    // Phase Timeline:
    // 0s - 3s: Idle
    // 3s - 5s: Lighting fuse and stepping back
    // 5s - 6.5s: Explosion (Boom) and flash
    // 6.5s: Complete & reveal login card

    const lightingTimer = setTimeout(() => {
      setPhase('lighting');
      // Step back boy
      setBoyPos({ x: -120, y: 0 });
    }, 2800);

    const boomTimer = setTimeout(() => {
      setPhase('boom');
    }, 4800);

    const completeTimer = setTimeout(() => {
      setPhase('complete');
      onComplete();
    }, 6500);

    return () => {
      clearTimeout(lightingTimer);
      clearTimeout(boomTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  // Create sparks during lighting phase
  useEffect(() => {
    if (phase === 'lighting') {
      const interval = setInterval(() => {
        setSparkCount((c) => (c + 1) % 12);
      }, 80);
      return () => clearInterval(interval);
    }
  }, [phase]);

  const handleSkip = () => {
    setPhase('complete');
    onComplete();
  };

  if (phase === 'complete') return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-[#070b12] flex items-center justify-center">
      <style>{`
        @keyframes drift-clouds {
          0% { transform: translateX(-10%); }
          100% { transform: translateX(110%); }
        }
        @keyframes boy-breathe {
          0%, 100% { transform: translateY(0px) scaleY(1); }
          50% { transform: translateY(-3px) scaleY(0.98); }
        }
        @keyframes fuse-spark {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.6); opacity: 0.6; }
        }
        @keyframes explosion-expand {
          0% { transform: scale(0); opacity: 0; }
          10% { opacity: 1; }
          40% { transform: scale(1.8) rotate(15deg); opacity: 1; }
          100% { transform: scale(3.5) rotate(-10deg); opacity: 0; }
        }
        @keyframes screen-flash {
          0% { opacity: 0; }
          5% { opacity: 1; }
          20% { opacity: 1; }
          100% { opacity: 0; }
        }
        @keyframes spark-fly {
          0% { transform: translate(0, 0) scale(1); opacity: 1; }
          100% { transform: translate(var(--dx), var(--dy)) scale(0.1); opacity: 0; }
        }
        .cloud-slow {
          animation: drift-clouds 90s linear infinite;
        }
        .boy-character {
          animation: boy-breathe 2s ease-in-out infinite;
          transition: transform 1.2s cubic-bezier(0.25, 1, 0.5, 1);
        }
        .spark-node {
          animation: spark-fly 0.6s ease-out forwards;
        }
        .explosion-cloud {
          animation: explosion-expand 1.7s cubic-bezier(0.1, 0.8, 0.3, 1) forwards;
        }
        .flash-overlay {
          animation: screen-flash 0.8s ease-out forwards;
        }
      `}</style>

      {/* 🏙️ Dark Evening / Colorful Town Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0A1120] via-[#120F24] to-[#1E122A] overflow-hidden">
        {/* Twinkling Stars */}
        <div className="absolute inset-0 opacity-40">
          <div className="absolute top-[10%] left-[20%] w-1 h-1 bg-white rounded-full animate-ping" />
          <div className="absolute top-[25%] left-[80%] w-1.5 h-1.5 bg-yellow-200 rounded-full animate-pulse" />
          <div className="absolute top-[15%] left-[45%] w-1 h-1 bg-cyan-200 rounded-full animate-ping" style={{ animationDelay: '1.2s' }} />
          <div className="absolute top-[40%] left-[65%] w-1 h-1 bg-white rounded-full animate-pulse" style={{ animationDelay: '0.6s' }} />
          <div className="absolute top-[30%] left-[10%] w-1.5 h-1.5 bg-pink-200 rounded-full animate-ping" style={{ animationDelay: '2s' }} />
        </div>

        {/* Slow Drifting Silhouette Clouds */}
        <div className="absolute top-[15%] left-0 right-0 h-24 opacity-10 pointer-events-none">
          <div className="absolute w-[350px] h-12 bg-white rounded-full blur-md cloud-slow" />
          <div className="absolute w-[280px] h-10 bg-white rounded-full blur-md cloud-slow" style={{ animationDelay: '-30s', top: '20px' }} />
        </div>

        {/* Colorful Town Silhouette */}
        <div className="absolute bottom-0 left-0 right-0 h-[35vh] flex items-end justify-between pointer-events-none select-none z-10">
          <svg viewBox="0 0 1440 320" className="w-full h-full text-[#111625]" preserveAspectRatio="none">
            {/* Background Layer (Distant town) */}
            <path
              fill="#181432"
              d="M0,220 L60,200 L60,260 L120,240 L180,240 L180,290 L240,280 L300,210 L300,260 L360,250 L420,200 L420,270 L480,260 L540,230 L600,210 L600,280 L660,260 L720,240 L780,220 L780,290 L840,270 L900,230 L960,220 L960,280 L1020,260 L1080,210 L1140,230 L1200,240 L1200,290 L1260,270 L1320,220 L1380,240 L1440,210 L1440,320 L0,320 Z"
            />
            {/* Midground Layer (Closer town silhouette + glowing windows) */}
            <path
              fill="#0F0D1E"
              d="M0,250 L80,230 L160,240 L160,290 L240,270 L320,250 L400,220 L400,290 L480,270 L560,260 L640,230 L640,280 L720,260 L800,250 L880,220 L880,290 L960,270 L1040,250 L1120,240 L1200,210 L1280,250 L1360,240 L1440,230 L1440,320 L0,320 Z"
            />
          </svg>

          {/* Glowing Town Windows */}
          <div className="absolute bottom-12 left-[15%] w-3 h-5 bg-amber-400/30 rounded blur-[1px] shadow-lg shadow-amber-400/50" />
          <div className="absolute bottom-20 left-[25%] w-4 h-4 bg-teal-400/40 rounded blur-[1px] shadow-lg shadow-teal-400/50" />
          <div className="absolute bottom-16 left-[48%] w-3 h-6 bg-purple-400/30 rounded blur-[1px]" />
          <div className="absolute bottom-24 left-[75%] w-5 h-4 bg-amber-400/40 rounded blur-[1px]" />
          <div className="absolute bottom-14 left-[88%] w-3 h-5 bg-emerald-400/30 rounded blur-[1px]" />
        </div>
      </div>

      {/* Skip Intro Button */}
      <button
        onClick={handleSkip}
        className="absolute top-6 right-6 z-50 px-4 py-2 bg-black/40 hover:bg-black/60 border border-white/10 hover:border-white/30 text-white/80 hover:text-white text-xs font-bold rounded-full transition-all cursor-pointer shadow-lg"
      >
        Skip Intro ➔
      </button>

      {/* 💥 EXPLOSION SCENE (Boom overlay) */}
      {phase === 'boom' && (
        <>
          {/* Flash overlay */}
          <div className="fixed inset-0 bg-white z-40 flash-overlay pointer-events-none" />

          {/* Explosive Cloud Group */}
          <div className="absolute z-40 flex items-center justify-center">
            {/* Outer Sparks / Spikes */}
            <svg viewBox="0 0 200 200" className="w-[500px] h-[500px] overflow-visible pointer-events-none">
              {/* Central expanding cloud */}
              <circle cx="100" cy="100" r="28" fill="#FF7E21" className="explosion-cloud" style={{ animationDelay: '0s' }} />
              <circle cx="112" cy="90" r="24" fill="#FFB71C" className="explosion-cloud" style={{ animationDelay: '0.1s' }} />
              <circle cx="88" cy="110" r="26" fill="#FF3B30" className="explosion-cloud" style={{ animationDelay: '0.05s' }} />
              <circle cx="95" cy="85" r="22" fill="#FFE266" className="explosion-cloud" style={{ animationDelay: '0.15s' }} />
              
              {/* Ring / Shockwave */}
              <circle cx="100" cy="100" r="50" fill="none" stroke="#2DD4BF" strokeWidth="8" className="explosion-cloud opacity-40" style={{ animationDelay: '0.1s' }} />

              {/* Spikes */}
              <path
                d="M 100 30 L 110 80 L 170 60 L 120 100 L 160 150 L 100 120 L 40 150 L 80 100 L 30 60 L 90 80 Z"
                fill="#FFE266"
                className="explosion-cloud opacity-80"
                style={{ animationDelay: '0.05s' }}
              />
            </svg>
          </div>
        </>
      )}

      {/* 👦 ANIME BOY CHARACTER & FIRECRACKER */}
      {phase !== 'boom' && (
        <div
          className="absolute bottom-2 z-20 flex flex-col items-center boy-character"
          style={{
            left: 'calc(50% + 50px)',
            transform: `translate(${boyPos.x}px, ${boyPos.y}px)`,
          }}
        >
          {/* Spark Particles from Firecracker */}
          {phase === 'lighting' && (
            <div className="absolute left-[-22px] top-[40px] pointer-events-none z-30">
              {Array.from({ length: 6 }).map((_, i) => {
                const angle = (i * 60 + sparkCount * 30) * (Math.PI / 180);
                const distance = 15 + Math.random() * 25;
                const dx = Math.cos(angle) * distance;
                const dy = Math.sin(angle) * distance - 8;
                return (
                  <div
                    key={i}
                    className="absolute w-2 h-2 rounded-full bg-gradient-to-r from-amber-400 to-red-500 spark-node"
                    style={{
                      '--dx': `${dx}px`,
                      '--dy': `${dy}px`,
                    } as React.CSSProperties}
                  />
                );
              })}
              {/* Central glowing fuse node */}
              <div className="absolute -left-1 -top-1 w-2.5 h-2.5 rounded-full bg-yellow-300 animate-ping" />
            </div>
          )}

          {/* Cartoon Character SVG */}
          <svg viewBox="0 0 120 180" className="w-[180px] h-[270px] overflow-visible">
            {/* Firecracker */}
            {phase !== 'boom' && (
              <g className="transition-transform duration-200">
                {/* Fuse string */}
                <path d="M 12 110 Q 5 105 2 112" fill="none" stroke="#64748B" strokeWidth="1.5" />
                {/* Red body */}
                <rect x="12" y="105" width="8" height="15" rx="1" fill="#EF4444" stroke="#7F1D1D" strokeWidth="1" />
                <rect x="12" y="110" width="8" height="3" fill="#FBBF24" /> {/* Gold ring */}
              </g>
            )}

            {/* Arms */}
            {/* Left Arm holding match/lighter */}
            <path
              d={phase === 'lighting' ? 'M 60 90 Q 35 98 12 110' : 'M 60 90 Q 40 110 32 120'}
              fill="none"
              stroke="#2E1C0C"
              strokeWidth="10"
              strokeLinecap="round"
            />
            {/* Right Arm */}
            <path d="M 80 90 Q 95 110 98 125" fill="none" stroke="#2E1C0C" strokeWidth="10" strokeLinecap="round" />

            {/* Legs */}
            <rect x="52" y="130" width="12" height="40" fill="#2563EB" rx="4" /> {/* Left Leg */}
            <rect x="74" y="130" width="12" height="40" fill="#2563EB" rx="4" /> {/* Right Leg */}
            {/* Sneakers */}
            <ellipse cx="56" cy="172" rx="9" ry="6" fill="#F8FAFC" />
            <ellipse cx="82" cy="172" rx="9" ry="6" fill="#F8FAFC" />

            {/* Torso / Clothes */}
            <path d="M 46 85 L 86 85 L 80 132 L 52 132 Z" fill="#D97706" /> {/* Mustard Hoodie */}
            <circle cx="66" cy="100" r="7" fill="#F59E0B" /> {/* Pocket */}

            {/* Neck */}
            <rect x="61" y="66" width="12" height="12" fill="#FDBA74" />

            {/* Cute Head */}
            <circle cx="67" cy="52" r="22" fill="#FDBA74" /> {/* Face skin */}

            {/* Anime Hair (Black/Espresso spiked style) */}
            <path
              d="M 42 48 Q 50 25 72 26 Q 90 28 92 48 Q 98 40 88 32 Q 72 20 54 26 Q 40 32 42 48"
              fill="#1E1B4B"
            />
            <path d="M 45 42 L 54 50 L 58 44 L 66 52 L 72 45 L 78 52 L 85 44" fill="#1E1B4B" /> {/* Bangs */}

            {/* Eyes */}
            {phase === 'lighting' ? (
              // Focused squinty eyes
              <>
                <path d="M 52 52 Q 56 50 60 52" fill="none" stroke="#0F172A" strokeWidth="2.5" strokeLinecap="round" />
                <path d="M 72 52 Q 76 50 80 52" fill="none" stroke="#0F172A" strokeWidth="2.5" strokeLinecap="round" />
              </>
            ) : (
              // Big curious eyes
              <>
                <circle cx="56" cy="53" r="3.5" fill="#0F172A" />
                <circle cx="76" cy="53" r="3.5" fill="#0F172A" />
                <circle cx="57" cy="51.5" r="1" fill="#FFFFFF" />
                <circle cx="77" cy="51.5" r="1" fill="#FFFFFF" />
              </>
            )}

            {/* Mouth */}
            <path d="M 63 60 Q 66 63 69 60" fill="none" stroke="#0F172A" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>
      )}
    </div>
  );
}
