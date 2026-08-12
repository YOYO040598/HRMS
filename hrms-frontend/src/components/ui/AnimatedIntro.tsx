import { useState, useEffect } from 'react';

type IntroPhase = 'walking' | 'opening' | 'zooming' | 'complete';

interface AnimatedIntroProps {
  onComplete: () => void;
}

export default function AnimatedIntro({ onComplete }: AnimatedIntroProps) {
  const [phase, setPhase] = useState<IntroPhase>('walking');
  const [walkStep, setWalkStep] = useState(0);

  useEffect(() => {
    // Leg swing cycle during walking phase
    let walkTimer: NodeJS.Timeout;
    if (phase === 'walking') {
      walkTimer = setInterval(() => {
        setWalkStep((prev) => (prev + 1) % 4);
      }, 150);
    }
    return () => clearInterval(walkTimer);
  }, [phase]);

  useEffect(() => {
    // Sequence Timeline:
    // 0s - 2.8s: Employee walks to futuristic door
    // 2.8s - 4.0s: Employee reaches door, keypad beeps, doors slide open with portal glow
    // 4.0s - 5.4s: Zooming through the door (zoom & scale-up)
    // 5.4s: Complete & reveal login card

    const openTimer = setTimeout(() => setPhase('opening'), 2800);
    const zoomTimer = setTimeout(() => setPhase('zooming'), 4000);
    const completeTimer = setTimeout(() => {
      setPhase('complete');
      onComplete();
    }, 5400);

    return () => {
      clearTimeout(openTimer);
      clearTimeout(zoomTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  const handleSkip = () => {
    setPhase('complete');
    onComplete();
  };

  if (phase === 'complete') return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-[#050811] flex items-center justify-center">
      <style>{`
        @keyframes walk-accel {
          0% { transform: translate(-140px, 80px) scale(0.65); }
          100% { transform: translate(0px, 80px) scale(0.9); }
        }
        @keyframes employee-bob {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-4px); }
        }
        @keyframes door-left-open {
          0% { transform: translateX(0); }
          100% { transform: translateX(-78px); }
        }
        @keyframes door-right-open {
          0% { transform: translateX(0); }
          100% { transform: translateX(78px); }
        }
        @keyframes keypad-glow {
          0%, 100% { fill: #EF4444; filter: drop-shadow(0 0 2px #EF4444); }
          50% { fill: #10B981; filter: drop-shadow(0 0 8px #10B981); }
        }
        @keyframes portal-light-expand {
          0% { opacity: 0; transform: scaleX(0); }
          100% { opacity: 1; transform: scaleX(1); }
        }
        @keyframes zoom-in-camera {
          0% { transform: scale(1); opacity: 1; }
          100% { transform: scale(5.5); opacity: 0; filter: blur(6px); }
        }
        @keyframes resolve-login-card {
          0% { transform: scale(0.25); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
        .corridor-zoom {
          animation: ${phase === 'zooming' ? 'zoom-in-camera 1.4s cubic-bezier(0.16, 1, 0.3, 1) forwards' : 'none'};
          transform-origin: center center;
        }
        .employee-walk-cycle {
          animation: walk-accel 2.8s linear forwards;
        }
        .employee-bobbing {
          animation: employee-bob 0.3s ease-in-out infinite;
        }
        .door-slide-left {
          animation: door-left-open 1.2s cubic-bezier(0.25, 1, 0.5, 1) forwards;
        }
        .door-slide-right {
          animation: door-right-open 1.2s cubic-bezier(0.25, 1, 0.5, 1) forwards;
        }
        .portal-glow {
          animation: portal-light-expand 0.5s ease-out forwards;
          background: radial-gradient(circle, rgba(45, 212, 191, 0.95) 0%, rgba(20, 184, 166, 0.5) 40%, rgba(5, 8, 17, 0) 70%);
        }
        .keypad-led {
          animation: keypad-glow 1.5s infinite;
        }
        .card-resolve-box {
          animation: resolve-login-card 1.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>

      {/* Skip Button */}
      <button
        onClick={handleSkip}
        className="absolute top-6 right-6 z-50 px-4 py-2 bg-black/40 hover:bg-black/60 border border-white/10 hover:border-white/30 text-white/80 hover:text-white text-xs font-bold rounded-full transition-all cursor-pointer shadow-lg"
      >
        Skip Intro ➔
      </button>

      {/* 🚀 ZOOMING PORTAL WRAPPER */}
      {phase !== 'zooming' ? (
        <div className="absolute inset-0 flex items-center justify-center">
          {/* Corridor & Door Scene */}
          <div className="w-full h-full relative flex items-center justify-center">
            
            {/* Corridor perspective lines background */}
            <div className="absolute inset-0 bg-[#060a12]">
              <svg viewBox="0 0 1000 600" className="w-full h-full opacity-35" preserveAspectRatio="none">
                {/* Ceiling */}
                <polygon points="0,0 1000,0 600,200 400,200" fill="#0B132B" />
                {/* Floor */}
                <polygon points="0,600 1000,600 600,400 400,400" fill="#0D1B2A" />
                {/* Perspective guides */}
                <line x1="0" y1="0" x2="400" y2="200" stroke="#1E293B" strokeWidth="2" />
                <line x1="1000" y1="0" x2="600" y2="200" stroke="#1E293B" strokeWidth="2" />
                <line x1="0" y1="600" x2="400" y2="400" stroke="#1E293B" strokeWidth="2" />
                <line x1="1000" y1="600" x2="600" y2="400" stroke="#1E293B" strokeWidth="2" />
                
                {/* Floor grid gridlines */}
                <line x1="200" y1="500" x2="800" y2="500" stroke="#14B8A6" strokeWidth="0.8" opacity="0.3" />
                <line x1="300" y1="450" x2="700" y2="450" stroke="#14B8A6" strokeWidth="0.8" opacity="0.3" />
                <line x1="380" y1="410" x2="620" y2="410" stroke="#14B8A6" strokeWidth="0.8" opacity="0.3" />
              </svg>
            </div>

            {/* Glowing Door Frame in the center */}
            <div className="absolute z-10 w-[180px] h-[260px] flex items-center justify-center border-2 border-[#14B8A6]/60 shadow-[0_0_25px_rgba(20,184,166,0.3)] bg-[#050811] rounded-t-2xl overflow-hidden">
              
              {/* Portal Light (revealed when door opens) */}
              {phase === 'opening' && (
                <div className="absolute inset-0 portal-glow z-0 flex flex-col items-center justify-center">
                  {/* Outer space HRMS Login title behind the doors */}
                  <div className="text-center font-black tracking-widest text-[#FFFFFF] text-lg uppercase filter drop-shadow-[0_0_12px_rgba(255,255,255,0.8)] animate-pulse">
                    HRMS LOGIN
                  </div>
                </div>
              )}

              {/* Futuristic Keypad Card Reader next to door */}
              <div className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-7 bg-[#1E293B] border border-[#475569] rounded flex flex-col items-center justify-around py-1 z-25">
                <circle cx="2" cy="2" r="1.2" className="keypad-led" />
                <rect x="1" y="4" width="2" height="1.5" fill="#94A3B8" />
              </div>

              {/* Sliding door panels */}
              <div className="absolute inset-0 flex z-20">
                {/* Left Door Panel */}
                <div className={`w-1/2 h-full bg-[#111A2E] border-r border-[#1D3045] flex items-center justify-end pr-2 ${
                  phase === 'opening' ? 'door-slide-left' : ''
                }`}>
                  {/* Futuristic panel patterns */}
                  <div className="h-[80%] w-3 bg-[#1E293B]/40 rounded-full mr-2" />
                  <div className="h-[40%] w-1.5 bg-[#14B8A6]/20 rounded-full" />
                </div>
                {/* Right Door Panel */}
                <div className={`w-1/2 h-full bg-[#111A2E] border-l border-[#1D3045] flex items-center justify-start pl-2 ${
                  phase === 'opening' ? 'door-slide-right' : ''
                }`}>
                  <div className="h-[40%] w-1.5 bg-[#14B8A6]/20 rounded-full mr-2" />
                  <div className="h-[80%] w-3 bg-[#1E293B]/40 rounded-full" />
                </div>
              </div>

            </div>

            {/* 🚶 CARTOON EMPLOYEE */}
            {phase === 'walking' && (
              <div className="absolute z-20 employee-walk-cycle flex flex-col items-center">
                <div className="employee-bobbing">
                  <svg viewBox="0 0 100 160" className="w-[80px] h-[128px] overflow-visible">
                    {/* Head / Hair */}
                    <circle cx="50" cy="35" r="16" fill="#FDBA74" />
                    <path d="M 34 32 Q 50 12 66 32 Q 62 18 50 20 Q 38 18 34 32" fill="#1E1B4B" /> {/* Spike bangs */}
                    
                    {/* Backpack */}
                    <rect x="28" y="55" width="12" height="28" rx="3" fill="#0E7490" stroke="#0891B2" strokeWidth="1" />
                    
                    {/* Torso / Business Suit Jacket */}
                    <path d="M 38 52 L 62 52 L 58 95 L 42 95 Z" fill="#1E293B" /> {/* Navy Blazer */}
                    <polygon points="50,52 45,72 50,78 55,72" fill="#FFFFFF" /> {/* White collar shirt */}
                    <polygon points="49,70 51,70 50,88" fill="#EF4444" /> {/* Red tie */}

                    {/* Arms (Swinging profile arm) */}
                    <path
                      d={
                        walkStep % 2 === 0
                          ? 'M 40 54 Q 30 75 22 88'
                          : 'M 40 54 Q 45 75 52 88'
                      }
                      fill="none"
                      stroke="#1E293B"
                      strokeWidth="7"
                      strokeLinecap="round"
                    />

                    {/* Legs walking scissor action */}
                    {walkStep === 0 && (
                      <>
                        <line x1="44" y1="95" x2="32" y2="135" stroke="#1E293B" strokeWidth="8" strokeLinecap="round" />
                        <line x1="56" y1="95" x2="68" y2="135" stroke="#111827" strokeWidth="8" strokeLinecap="round" />
                      </>
                    )}
                    {walkStep === 1 && (
                      <>
                        <line x1="44" y1="95" x2="40" y2="135" stroke="#1E293B" strokeWidth="8" strokeLinecap="round" />
                        <line x1="56" y1="95" x2="60" y2="135" stroke="#111827" strokeWidth="8" strokeLinecap="round" />
                      </>
                    )}
                    {walkStep === 2 && (
                      <>
                        <line x1="44" y1="95" x2="60" y2="135" stroke="#1E293B" strokeWidth="8" strokeLinecap="round" />
                        <line x1="56" y1="95" x2="36" y2="135" stroke="#111827" strokeWidth="8" strokeLinecap="round" />
                      </>
                    )}
                    {walkStep === 3 && (
                      <>
                        <line x1="44" y1="95" x2="48" y2="135" stroke="#1E293B" strokeWidth="8" strokeLinecap="round" />
                        <line x1="56" y1="95" x2="52" y2="135" stroke="#111827" strokeWidth="8" strokeLinecap="round" />
                      </>
                    )}

                    {/* Shoes */}
                    <ellipse cx={walkStep % 2 === 0 ? '30' : '44'} cy="136" rx="6" ry="4" fill="#0F172A" />
                    <ellipse cx={walkStep % 2 === 0 ? '66' : '54'} cy="136" rx="6" ry="4" fill="#0F172A" />
                  </svg>
                </div>
              </div>
            )}

            {/* Standing static employee at door tapping panel */}
            {phase === 'opening' && (
              <div className="absolute z-20 flex flex-col items-center" style={{ transform: 'translate(0px, 80px) scale(0.9)' }}>
                <svg viewBox="0 0 100 160" className="w-[80px] h-[128px] overflow-visible">
                  <circle cx="50" cy="35" r="16" fill="#FDBA74" />
                  <path d="M 34 32 Q 50 12 66 32 Q 62 18 50 20 Q 38 18 34 32" fill="#1E1B4B" />
                  <rect x="28" y="55" width="12" height="28" rx="3" fill="#0E7490" stroke="#0891B2" strokeWidth="1" />
                  
                  {/* Torso */}
                  <path d="M 38 52 L 62 52 L 58 95 L 42 95 Z" fill="#1E293B" />
                  <polygon points="50,52 45,72 50,78 55,72" fill="#FFFFFF" />
                  <polygon points="49,70 51,70 50,88" fill="#EF4444" />

                  {/* Arm raised tapping key card panel */}
                  <path d="M 58 60 Q 72 52 82 56" fill="none" stroke="#1E293B" strokeWidth="7" strokeLinecap="round" />

                  {/* Standing static legs */}
                  <line x1="44" y1="95" x2="44" y2="135" stroke="#1E293B" strokeWidth="8" strokeLinecap="round" />
                  <line x1="56" y1="95" x2="56" y2="135" stroke="#1E293B" strokeWidth="8" strokeLinecap="round" />
                  <ellipse cx="44" cy="136" rx="6" ry="4" fill="#0F172A" />
                  <ellipse cx="56" cy="136" rx="6" ry="4" fill="#0F172A" />
                </svg>
              </div>
            )}

          </div>
        </div>
      ) : (
        /* 🎥 ZOOMING PORTAL SCENE */
        <div className="absolute inset-0 flex items-center justify-center corridor-zoom">
          {/* Sizable Portal gate scaling up rapidly to fly past camera */}
          <div className="w-[180px] h-[260px] border-4 border-[#14B8A6] shadow-[0_0_50px_rgba(20,184,166,0.8)] rounded-t-2xl flex flex-col items-center justify-center bg-[#050811]">
            <div className="text-center font-black tracking-widest text-[#FFFFFF] text-[10px] uppercase filter drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]">
              HRMS LOGIN
            </div>
          </div>
        </div>
      )}

      {/* 🎴 FINAL RESOLVED LOGIN BOX INTERFACE (faded in once zoomed) */}
      {phase === 'zooming' && (
        <div className="absolute z-40 card-resolve-box flex flex-col items-center justify-center p-8">
          <div
            className="flex flex-col items-center justify-center p-8"
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
        </div>
      )}
    </div>
  );
}
