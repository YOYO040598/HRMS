import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useAppSelector } from '../../hooks/useRedux';

type MascotPose =
  | 'default'
  | 'waving'
  | 'holding_clock'
  | 'checked_in_success'
  | 'checked_in_late'
  | 'holding_calendar'
  | 'leave_submitted'
  | 'leave_approved'
  | 'payslip_celebrate'
  | 'holding_package'
  | 'holding_suitcase'
  | 'checking_mirror'
  | 'holding_shield'
  | 'sleeping';

type IdleMode = 'laptop' | 'coffee' | 'tablet' | 'dashboard' | 'sleeping' | 'none';

export default function AnimeCatAssistant() {
  const location = useLocation();
  const currentPath = location.pathname;
  const { user } = useAppSelector((state) => state.auth);
  const name = user?.first_name || 'there';

  const [pose, setPose] = useState<MascotPose>('waving');
  const [idleMode, setIdleMode] = useState<IdleMode>('none');
  const [posX, setPosX] = useState(0); // position relative to right boundary
  const [facingLeft, setFacingLeft] = useState(true);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isMouseNearby, setIsMouseNearby] = useState(false);
  const [showBubble, setShowBubble] = useState(false);
  const [bubbleText, setBubbleText] = useState('Good morning!');
  const [isCelebrating, setIsCelebrating] = useState(false);

  const catRef = useRef<HTMLDivElement>(null);
  const idleTimerRef = useRef<NodeJS.Timeout | null>(null);
  const bubbleTimerRef = useRef<NodeJS.Timeout | null>(null);
  const walkIntervalRef = useRef<number | null>(null);

  // Behavior quotes
  const quotes = [
    'Need a break? ☕',
    'Doing great! ✨',
    'Let\'s check attendance! ⏰',
    'Time to request a leave? 🏖️',
    'Meow~',
    'Purrrrrr... 🐾',
    'Looking sharp today! 😎',
    'Zzz... HRMS is cozy... 😴',
  ];

  // 1. Initial greeting wave on Dashboard load
  useEffect(() => {
    if (currentPath === '/emp') {
      setPose('waving');
      setIdleMode('none');
      setBubbleText(`Good morning, ${name}! 👋`);
      setShowBubble(true);
      
      // Clear bubble after 3 seconds
      const bTimer = setTimeout(() => setShowBubble(false), 3000);
      
      // Transition to random idle loop after waving
      const pTimer = setTimeout(() => {
        setPose('default');
        startRandomIdleLoop();
      }, 2000);

      return () => {
        clearTimeout(bTimer);
        clearTimeout(pTimer);
      };
    } else {
      // Map path to non-dashboard default poses
      stopIdleLoop();
      setIdleMode('none');
      if (currentPath === '/emp/attendance') {
        setPose('holding_clock');
      } else if (currentPath === '/emp/leave') {
        setPose('holding_calendar');
      } else if (currentPath === '/emp/assets') {
        setPose('holding_package');
      } else if (currentPath === '/emp/exit') {
        setPose('holding_suitcase');
      } else if (currentPath === '/emp/profile') {
        setPose('checking_mirror');
      } else {
        setPose('default');
      }
    }
  }, [currentPath]);

  // 2. Random Idle cycle loop (only on Dashboard /emp)
  const startRandomIdleLoop = () => {
    stopIdleLoop();

    const triggerNextIdle = () => {
      if (location.pathname !== '/emp' || isCelebrating || isMouseNearby) return;

      const idles: IdleMode[] = ['laptop', 'coffee', 'tablet', 'dashboard', 'sleeping'];
      const chosen = idles[Math.floor(Math.random() * idles.length)];
      setIdleMode(chosen);
      if (chosen === 'sleeping') {
        setPose('sleeping');
      } else {
        setPose('default');
      }

      // 15% chance to show a bubble
      if (Math.random() < 0.15) {
        const phrases = [
          'Checking dashboard metrics... 📈',
          'Drinking coffee... ☕',
          'Cozy vibes here... ✨',
          'Need a quick break? 😊',
          'Zzz... (－ᴗ－)',
        ];
        setBubbleText(phrases[Math.floor(Math.random() * phrases.length)]);
        setShowBubble(true);
        if (bubbleTimerRef.current) clearTimeout(bubbleTimerRef.current);
        bubbleTimerRef.current = setTimeout(() => setShowBubble(false), 3000);
      }

      // Schedule next state transition in 6-12 seconds
      const nextDelay = 6000 + Math.random() * 6000;
      idleTimerRef.current = setTimeout(triggerNextIdle, nextDelay);
    };

    idleTimerRef.current = setTimeout(triggerNextIdle, 6000);
  };

  const stopIdleLoop = () => {
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    if (bubbleTimerRef.current) clearTimeout(bubbleTimerRef.current);
  };

  // 3. Event listeners for real HRMS actions
  useEffect(() => {
    const handleWaving = () => {
      setPose('waving');
      setBubbleText('Hello! 👋');
      setShowBubble(true);
      setTimeout(() => {
        setShowBubble(false);
        setPose('default');
      }, 2000);
    };

    const handleClockReady = () => {
      setPose('holding_clock');
      setBubbleText('Ready to start your day? 🕐');
      setShowBubble(true);
      setTimeout(() => setShowBubble(false), 3500);
    };

    const handleCheckinSuccess = () => {
      setPose('checked_in_success');
      setBubbleText("You're in! Have a productive day. 👍");
      setShowBubble(true);
      setTimeout(() => {
        setShowBubble(false);
        setPose('holding_clock');
      }, 4000);
    };

    const handleCheckinLate = () => {
      setPose('checked_in_late');
      setBubbleText('Running a little late today? 😅');
      setShowBubble(true);
      setTimeout(() => {
        setShowBubble(false);
        setPose('holding_clock');
      }, 4000);
    };

    const handleLeaveSubmitted = () => {
      setPose('leave_submitted');
      setBubbleText('Leave request sent! 📩');
      setShowBubble(true);
      setTimeout(() => {
        setShowBubble(false);
        setPose('holding_calendar');
      }, 4000);
    };

    const handleLeaveApproved = () => {
      setPose('leave_approved');
      setBubbleText('Your leave is approved! 🎉');
      setShowBubble(true);
      setIsCelebrating(true);
      setTimeout(() => {
        setShowBubble(false);
        setIsCelebrating(false);
        setPose('holding_calendar');
      }, 3500);
    };

    const handlePayslipReady = () => {
      setPose('payslip_celebrate');
      setBubbleText('Your payslip is ready! 📄✨');
      setShowBubble(true);
      setIsCelebrating(true);
      setTimeout(() => {
        setShowBubble(false);
        setIsCelebrating(false);
        setPose('default');
      }, 4000);
    };

    const handleNotification = () => {
      setPose('waving'); // Mascot looks surprise/waving
      setBubbleText('A new notification! 🔔');
      setShowBubble(true);
      setTimeout(() => setShowBubble(false), 3000);
    };

    const handleAsset = () => {
      setPose('holding_package');
      setBubbleText("Here's what you've been assigned. 📦");
      setShowBubble(true);
      setTimeout(() => setShowBubble(false), 3000);
    };

    const handleResignation = () => {
      setPose('holding_suitcase');
      setBubbleText("We'll miss having you around. 🧳");
      setShowBubble(true);
      setTimeout(() => setShowBubble(false), 3500);
    };

    const handleProfileUpdated = () => {
      setPose('checking_mirror');
      setBubbleText('Profile updated! Looking sharp! 😎');
      setShowBubble(true);
      setTimeout(() => {
        setShowBubble(false);
        setPose('default');
      }, 3500);
    };

    const handlePasswordChanged = () => {
      setPose('holding_shield');
      setBubbleText('Password secure! 🛡️');
      setShowBubble(true);
      setTimeout(() => {
        setShowBubble(false);
        setPose('default');
      }, 3000);
    };

    window.addEventListener('mascot-wave', handleWaving);
    window.addEventListener('attendance-ready', handleClockReady);
    window.addEventListener('attendance-success', handleCheckinSuccess);
    window.addEventListener('attendance-late', handleCheckinLate);
    window.addEventListener('leave-submitted', handleLeaveSubmitted);
    window.addEventListener('leave-approved', handleLeaveApproved);
    window.addEventListener('payslip-celebrate', handlePayslipReady);
    window.addEventListener('mascot-notification', handleNotification);
    window.addEventListener('mascot-asset', handleAsset);
    window.addEventListener('mascot-resignation', handleResignation);
    window.addEventListener('profile-updated', handleProfileUpdated);
    window.addEventListener('password-changed', handlePasswordChanged);

    return () => {
      window.removeEventListener('mascot-wave', handleWaving);
      window.removeEventListener('attendance-ready', handleClockReady);
      window.removeEventListener('attendance-success', handleCheckinSuccess);
      window.removeEventListener('attendance-late', handleCheckinLate);
      window.removeEventListener('leave-submitted', handleLeaveSubmitted);
      window.removeEventListener('leave-approved', handleLeaveApproved);
      window.removeEventListener('payslip-celebrate', handlePayslipReady);
      window.removeEventListener('mascot-notification', handleNotification);
      window.removeEventListener('mascot-asset', handleAsset);
      window.removeEventListener('mascot-resignation', handleResignation);
      window.removeEventListener('profile-updated', handleProfileUpdated);
      window.removeEventListener('password-changed', handlePasswordChanged);
    };
  }, []);

  // 4. Track mouse coordinates to look towards it
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!catRef.current) return;
      const rect = catRef.current.getBoundingClientRect();
      const catCenterX = rect.left + rect.width / 2;
      const catCenterY = rect.top + rect.height / 2;

      const dx = e.clientX - catCenterX;
      const dy = e.clientY - catCenterY;
      const distance = Math.hypot(dx, dy);

      if (distance < 240) {
        setIsMouseNearby(true);
        setMousePos({ x: dx, y: dy });
        setFacingLeft(dx < 0);
      } else {
        setIsMouseNearby(false);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Compute head transform to look at mouse
  let headStyle = {};
  let eyeLeftStyle = {};
  let eyeRightStyle = {};

  if (isMouseNearby && pose !== 'sleeping') {
    const dist = Math.hypot(mousePos.x, mousePos.y) || 1;
    const maxOffset = 6;
    const hx = (mousePos.x / dist) * maxOffset;
    const hy = (mousePos.y / dist) * maxOffset;

    headStyle = { transform: `translate(${hx}px, ${hy}px)` };
    eyeLeftStyle = { transform: `translate(${hx * 0.5}px, ${hy * 0.5}px)` };
    eyeRightStyle = { transform: `translate(${hx * 0.5}px, ${hy * 0.5}px)` };
  }

  // Handle click meow
  const handleClick = () => {
    if (pose === 'sleeping') {
      setPose('default');
      setIdleMode('none');
      setBubbleText('Yawn... back to work! ☀️');
    } else {
      setBubbleText('Mew! H-Buddy at your service! 🐱');
    }
    setShowBubble(true);
    if (bubbleTimerRef.current) clearTimeout(bubbleTimerRef.current);
    bubbleTimerRef.current = setTimeout(() => setShowBubble(false), 3000);
  };

  return (
    <div
      ref={catRef}
      onClick={handleClick}
      className={`fixed bottom-16 md:bottom-4 right-4 z-50 flex flex-col items-center select-none cursor-pointer transition-transform duration-200 ease-out ${
        isCelebrating || pose === 'payslip_celebrate' || pose === 'leave_approved'
          ? 'cat-celebrating'
          : ''
      }`}
      style={{
        transform: `translateX(-${posX}px)`,
      }}
    >
      <style>{`
        @keyframes sway {
          0%, 100% { transform: rotate(0deg); }
          50% { transform: rotate(15deg); }
        }
        @keyframes walk-cycle {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          25% { transform: translateY(-2px) rotate(4deg); }
          75% { transform: translateY(-2px) rotate(-4deg); }
        }
        @keyframes breath {
          0%, 100% { transform: scaleY(1); }
          50% { transform: scaleY(0.96); }
        }
        @keyframes tail-wiggle {
          0%, 100% { transform: rotate(0deg); }
          50% { transform: rotate(25deg); }
        }
        @keyframes float-zzz {
          0% { transform: translate(0, 0) scale(0.6); opacity: 0; }
          20% { opacity: 0.8; }
          100% { transform: translate(12px, -24px) scale(1.2); opacity: 0; }
        }
        @keyframes wave-paw {
          0%, 100% { transform: rotate(0deg); }
          50% { transform: rotate(-35deg); }
        }
        @keyframes celebrate-jump {
          0%, 100% { transform: translateY(0) scaleY(1); }
          30% { transform: translateY(-16px) scaleY(0.9); }
          50% { transform: translateY(0) scaleY(1.05); }
          70% { transform: translateY(-8px) scaleY(0.95); }
          90% { transform: translateY(0) scaleY(1.02); }
        }
        @keyframes star-burst {
          0% { transform: translate(0, 0) scale(0) rotate(0deg); opacity: 0; }
          50% { opacity: 1; }
          100% { transform: translate(var(--sx), var(--sy)) scale(1.2) rotate(180deg); opacity: 0; }
        }
        @keyframes clock-spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .cat-tail {
          transform-origin: 30px 48px;
          animation: sway 3s ease-in-out infinite;
        }
        .cat-tail-wiggle {
          transform-origin: 30px 48px;
          animation: tail-wiggle 1s ease-in-out infinite;
        }
        .cat-body-walk {
          animation: walk-cycle 0.6s linear infinite;
        }
        .cat-body-sleep {
          animation: breath 2s ease-in-out infinite;
          transform-origin: bottom center;
        }
        .waving-paw {
          transform-origin: 36px 50px;
          animation: wave-paw 1.2s ease-in-out infinite;
        }
        .cat-celebrating {
          animation: celebrate-jump 1s ease-in-out infinite;
        }
        .celeb-star {
          animation: star-burst 1.2s ease-out infinite;
        }
        .clock-hands-spin {
          transform-origin: 42px 46px;
          animation: clock-spin 1.5s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }
        .zzz-1 { animation: float-zzz 3s infinite 0.2s; }
        .zzz-2 { animation: float-zzz 3s infinite 1.2s; }
        .zzz-3 { animation: float-zzz 3s infinite 2.2s; }
      `}</style>

      {/* Bubble text */}
      {showBubble && (
        <div className="absolute bottom-[98px] right-0 bg-[#0D1728]/95 border border-[#14B8A6]/40 text-[#F8FAFC] text-[10px] font-bold px-3 py-1.5 rounded-2xl shadow-lg backdrop-blur-md whitespace-nowrap animate-fadeIn z-50 text-left">
          {bubbleText}
          <div className="absolute top-full right-8 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-[#14B8A6]/40" />
        </div>
      )}

      {/* Sleeping Zzz particles */}
      {pose === 'sleeping' && (
        <div className="absolute -top-6 -left-3 text-[10px] font-extrabold text-[#2DD4BF] pointer-events-none select-none">
          <span className="absolute zzz-1">Z</span>
          <span className="absolute zzz-2">z</span>
          <span className="absolute zzz-3">z</span>
        </div>
      )}

      {/* Celebration Star particles */}
      {(isCelebrating || pose === 'payslip_celebrate' || pose === 'leave_approved') && (
        <div className="absolute inset-0 pointer-events-none z-30">
          <div className="absolute left-[8px] top-[-15px] text-yellow-300 celeb-star text-xs font-bold" style={{ '--sx': '-20px', '--sy': '-40px' } as React.CSSProperties}>★</div>
          <div className="absolute left-[30px] top-[-20px] text-[#2DD4BF] celeb-star text-sm font-bold" style={{ '--sx': '0px', '--sy': '-60px' } as React.CSSProperties}>✦</div>
          <div className="absolute left-[60px] top-[-15px] text-pink-400 celeb-star text-xs font-bold" style={{ '--sx': '20px', '--sy': '-50px' } as React.CSSProperties}>★</div>
        </div>
      )}

      {/* Cat Body Wrap */}
      <div
        className={`w-24 h-24 flex items-center justify-center transition-transform duration-200 ${
          facingLeft ? 'scale-x-100' : 'scale-x-[-1]'
        } ${pose === 'sleeping' ? 'cat-body-sleep' : ''}`}
      >
        <svg viewBox="0 0 64 64" className="w-24 h-24 overflow-visible">
          {/* Shadows */}
          <ellipse cx="32" cy="54" rx="14" ry="3.5" fill="rgba(0, 0, 0, 0.35)" />

          {/* Tail */}
          {pose === 'sleeping' ? (
            <path
              d="M 44 48 C 50 48, 54 42, 50 36 C 47 33, 40 38, 38 42"
              fill="none"
              stroke="#1E293B"
              strokeWidth="5"
              strokeLinecap="round"
            />
          ) : (
            <path
              d="M 30 48 Q 24 32 26 18 T 20 8"
              fill="none"
              stroke="#1E293B"
              strokeWidth="5.5"
              strokeLinecap="round"
              className={isCelebrating || pose === 'payslip_celebrate' ? 'cat-tail-wiggle' : 'cat-tail'}
            />
          )}

          {/* Regular Paws */}
          {pose !== 'sleeping' && (
            <>
              {/* Left Front Paw */}
              <circle cx="28" cy="53" r="3.5" fill="#334155" />

              {/* Right Front Paw (Dynamic Waving or Holding items) */}
              {pose === 'waving' ? (
                <g className="waving-paw">
                  <circle cx="36" cy="51" r="3.5" fill="#334155" />
                  <path d="M 34 51 Q 38 43 42 42" stroke="#334155" strokeWidth="2.5" strokeLinecap="round" fill="none" />
                </g>
              ) : (
                <circle cx="36" cy="53" r="3.5" fill="#334155" />
              )}
            </>
          )}

          {/* Body */}
          {pose === 'sleeping' ? (
            <circle cx="32" cy="45" r="13" fill="#1E293B" />
          ) : (
            <ellipse cx="32" cy="43" rx="11" ry="12" fill="#1E293B" />
          )}

          {/* Held/Nearby Items */}
          {pose !== 'sleeping' && (
            <>
              {/* Clock (Attendance) */}
              {['holding_clock', 'checked_in_success', 'checked_in_late'].includes(pose) && (
                <g className="transition-all duration-300">
                  <circle cx="42" cy="46" r="7" fill="#FFFFFF" stroke="#1E293B" strokeWidth="1.2" />
                  {pose === 'checked_in_success' && (
                    <circle cx="42" cy="46" r="6" fill="#2DD4BF" opacity="0.3" />
                  )}
                  <g className={pose === 'checked_in_success' ? 'clock-hands-spin' : ''}>
                    <line x1="42" y1="46" x2="42" y2="42" stroke="#0F172A" strokeWidth="1.2" strokeLinecap="round" />
                    <line x1="42" y1="46" x2="45" y2="46" stroke="#0F172A" strokeWidth="1.2" strokeLinecap="round" />
                  </g>
                </g>
              )}

              {/* Calendar (Leave) */}
              {['holding_calendar', 'leave_approved'].includes(pose) && (
                <g className="transition-all duration-300">
                  <rect x="36" y="38" width="13" height="13" rx="1.5" fill="#FFFFFF" stroke="#1E293B" strokeWidth="1.2" />
                  <rect x="36" y="38" width="13" height="4" rx="0.5" fill="#EF4444" />
                  <circle cx="39" cy="46" r="0.6" fill="#94A3B8" />
                  <circle cx="42" cy="46" r="0.6" fill="#94A3B8" />
                  <circle cx="45" cy="46" r="0.6" fill="#94A3B8" />
                  <circle cx="39" cy="49" r="0.6" fill="#94A3B8" />
                  <circle cx="42" cy="49" r="0.6" fill="#94A3B8" />
                  <circle cx="45" cy="49" r="0.6" fill="#2DD4BF" />
                </g>
              )}

              {/* Envelope (Leave Request Sent) */}
              {pose === 'leave_submitted' && (
                <g className="transition-all duration-300">
                  <rect x="35" y="38" width="14" height="10" rx="1" fill="#F8FAFC" stroke="#1E293B" strokeWidth="1.2" />
                  <path d="M 35 38 L 42 43 L 49 38" stroke="#1E293B" fill="none" strokeWidth="1" />
                </g>
              )}

              {/* Payslip Document (Payslip ready) */}
              {pose === 'payslip_celebrate' && (
                <g className="transition-all duration-300">
                  <rect x="36" y="35" width="12" height="15" rx="1" fill="white" stroke="#1E293B" strokeWidth="1.2" />
                  <line x1="38" y1="39" x2="46" y2="39" stroke="#94A3B8" strokeWidth="1" />
                  <line x1="38" y1="43" x2="46" y2="43" stroke="#94A3B8" strokeWidth="1" />
                  <line x1="38" y1="47" x2="44" y2="47" stroke="#14B8A6" strokeWidth="1" />
                </g>
              )}

              {/* Package Box (Asset Assigned) */}
              {pose === 'holding_package' && (
                <g className="transition-all duration-300">
                  <rect x="34" y="38" width="14" height="12" rx="1.5" fill="#D97706" stroke="#92400E" strokeWidth="1.2" />
                  <line x1="41" y1="38" x2="41" y2="50" stroke="#B45309" strokeWidth="1" strokeDasharray="2,2" />
                  <line x1="34" y1="44" x2="48" y2="44" stroke="#B45309" strokeWidth="1" />
                </g>
              )}

              {/* Suitcase (Resignation) */}
              {pose === 'holding_suitcase' && (
                <g className="transition-all duration-300">
                  <rect x="35" y="41" width="13" height="11" rx="1.5" fill="#64748B" stroke="#475569" strokeWidth="1.2" />
                  <path d="M 39 41 L 39 38 L 44 38 L 44 41" stroke="#475569" fill="none" strokeWidth="1.5" />
                </g>
              )}

              {/* Mirror (Profile updated) */}
              {pose === 'checking_mirror' && (
                <g className="transition-all duration-300">
                  <circle cx="42" cy="42" r="5" fill="#38BDF8" stroke="#1E293B" strokeWidth="1.2" />
                  <line x1="42" y1="47" x2="42" y2="52" stroke="#1E293B" strokeWidth="2.2" strokeLinecap="round" />
                </g>
              )}

              {/* Shield (Password changed) */}
              {pose === 'holding_shield' && (
                <g className="transition-all duration-300">
                  <path d="M 35 38 L 42 35 L 49 38 L 49 44 C 49 49, 42 53, 42 53 C 42 53, 35 49, 35 44 Z" fill="#2DD4BF" stroke="#14B8A6" strokeWidth="1.2" />
                  <path d="M 39 44 L 41 46 L 45 42" stroke="white" fill="none" strokeWidth="1.5" strokeLinecap="round" />
                </g>
              )}

              {/* Laptop (Dashboard Idle 1) */}
              {idleMode === 'laptop' && (
                <g className="transition-all duration-300">
                  <path d="M 22 48 L 38 48 L 40 54 L 20 54 Z" fill="#475569" stroke="#1E293B" strokeWidth="1" />
                  <rect x="23" y="42" width="12" height="8" fill="#0F172A" stroke="#1E293B" strokeWidth="1" rx="0.5" />
                  <polygon points="23,42 35,42 37,48 21,48" fill="#2DD4BF" opacity="0.15" />
                </g>
              )}

              {/* Coffee Cup (Dashboard Idle 2) */}
              {idleMode === 'coffee' && (
                <g className="transition-all duration-300">
                  <rect x="40" y="45" width="7" height="9" rx="1.5" fill="#F8FAFC" stroke="#94A3B8" strokeWidth="1.2" />
                  <path d="M 47 47 Q 49.5 47 49.5 49.5 T 47 52" fill="none" stroke="#94A3B8" strokeWidth="1" />
                  <path d="M 41 42 C 41 42, 42 39, 43 42 M 44 42 C 44 42, 45 39, 46 42" stroke="#64748B" strokeWidth="0.8" fill="none" />
                </g>
              )}

              {/* Tablet (Dashboard Idle 3) */}
              {idleMode === 'tablet' && (
                <g className="transition-all duration-300">
                  <rect x="35" y="41" width="10" height="13" rx="1" fill="#0F172A" stroke="#1E293B" strokeWidth="1.2" />
                  <circle cx="40" cy="52" r="0.6" fill="#64748B" />
                  <rect x="36.5" y="43" width="7" height="8" fill="#14B8A6" opacity="0.2" />
                </g>
              )}
            </>
          )}

          {/* Head & Face Group */}
          <g style={headStyle} className="transition-transform duration-200 ease-out origin-center">
            {/* Ears */}
            <polygon points="17,24 23,10 30,21" fill="#1E293B" />
            <polygon points="19,22 23,12 28,20" fill="#E2E8F0" opacity="0.15" />

            <polygon points="47,24 41,10 34,21" fill="#1E293B" />
            <polygon points="45,22 41,12 36,20" fill="#E2E8F0" opacity="0.15" />

            {/* Head Sphere */}
            <circle cx="32" cy="27" r="12" fill="#1E293B" />

            {/* Collar with Emerald Bell */}
            {pose !== 'sleeping' && (
              <>
                <path d="M 23 34 Q 32 38 41 34" fill="none" stroke="#2DD4BF" strokeWidth="2" />
                <circle cx="32" cy="36" r="3.5" fill="#14B8A6" className="animate-pulse" />
              </>
            )}

            {/* Face Expressions */}
            {pose === 'sleeping' ? (
              <>
                <path d="M 23 27 Q 26 29 29 27" fill="none" stroke="#64748B" strokeWidth="2" strokeLinecap="round" />
                <path d="M 35 27 Q 38 29 41 27" fill="none" stroke="#64748B" strokeWidth="2" strokeLinecap="round" />
                <path d="M 31 31.5 Q 32 32.5 33 31.5" fill="none" stroke="#64748B" strokeWidth="1.5" strokeLinecap="round" />
              </>
            ) : pose === 'checked_in_success' ? (
              <>
                <rect x="20" y="22" width="10" height="5" rx="1.5" fill="#0F172A" stroke="#1E293B" strokeWidth="0.8" />
                <rect x="34" y="22" width="10" height="5" rx="1.5" fill="#0F172A" stroke="#1E293B" strokeWidth="0.8" />
                <line x1="30" y1="24.5" x2="34" y2="24.5" stroke="#0F172A" strokeWidth="1.5" />
                <path d="M 29 30.5 Q 32 33 35 30.5" fill="none" stroke="#F8FAFC" strokeWidth="1.5" strokeLinecap="round" />
              </>
            ) : pose === 'checked_in_late' ? (
              <>
                <ellipse cx="25" cy="25" rx="3.5" ry="3.5" fill="#2DD4BF" />
                <ellipse cx="39" cy="25" rx="3.5" ry="3.5" fill="#2DD4BF" />
                <ellipse cx="25" cy="25" rx="1.2" ry="2.2" fill="#0F172A" style={eyeLeftStyle} className="transition-transform duration-200" />
                <ellipse cx="39" cy="25" rx="1.2" ry="2.2" fill="#0F172A" style={eyeRightStyle} className="transition-transform duration-200" />
                <path d="M 45 16 C 45 16, 47 19, 47 21 C 47 22.5, 45.8 23.5, 44.5 23.5 C 43.2 23.5, 42 22.5, 42 21 C 42 19, 45 16, 45 16 Z" fill="#38BDF8" />
                <path d="M 29 31.5 Q 32 29.5 35 31.5" fill="none" stroke="#F8FAFC" strokeWidth="1.5" strokeLinecap="round" />
              </>
            ) : (isCelebrating || pose === 'payslip_celebrate' || pose === 'leave_approved') ? (
              <>
                <path d="M 21 25 L 24 21 L 28 25 M 21 23 L 28 23" stroke="#2DD4BF" strokeWidth="2" strokeLinecap="round" />
                <path d="M 35 25 L 38 21 L 42 25 M 35 23 L 42 23" stroke="#2DD4BF" strokeWidth="2" strokeLinecap="round" />
                <path d="M 28 29 Q 32 35 36 29 Z" fill="#F43F5E" />
              </>
            ) : (
              <>
                <ellipse cx="25" cy="25" rx="3.5" ry="3.5" fill="#2DD4BF" />
                <ellipse cx="39" cy="25" rx="3.5" ry="3.5" fill="#2DD4BF" />
                <ellipse cx="25" cy="25" rx="1.2" ry="2.2" fill="#0F172A" style={eyeLeftStyle} />
                <ellipse cx="39" cy="25" rx="1.2" ry="2.2" fill="#0F172A" style={eyeRightStyle} />
                <circle cx="26" cy="23.5" r="0.8" fill="#FFFFFF" />
                <circle cx="40" cy="23.5" r="0.8" fill="#FFFFFF" />
                <path d="M 29 30.5 Q 32 32.5 35 30.5" fill="none" stroke="#F8FAFC" strokeWidth="1.5" strokeLinecap="round" />
              </>
            )}

            {/* Nose & Whiskers */}
            {pose !== 'checked_in_success' && (
              <>
                <polygon points="31,29 33,29 32,30.2" fill="#F43F5E" />
                <path d="M 32 30.2 Q 31 31.5 30 31 M 32 30.2 Q 33 31.5 34 31" fill="none" stroke="#475569" strokeWidth="1" />
              </>
            )}

            {/* Whiskers */}
            {pose !== 'sleeping' && (
              <>
                <line x1="16" y1="28" x2="8" y2="27" stroke="#475569" strokeWidth="1" />
                <line x1="16" y1="30" x2="7" y2="30.5" stroke="#475569" strokeWidth="1" />
                <line x1="48" y1="28" x2="56" y2="27" stroke="#475569" strokeWidth="1" />
                <line x1="48" y1="30" x2="57" y2="30.5" stroke="#475569" strokeWidth="1" />
              </>
            )}
          </g>
        </svg>
      </div>
    </div>
  );
}
