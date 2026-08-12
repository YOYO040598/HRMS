import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../hooks/useRedux';
import { logout } from '../../store/authSlice';
import api from '../../api/axios';
import { LayoutDashboard, Clock, CalendarDays, Wallet, Bell, LogOut, Menu, X, ChevronDown, CheckSquare, Package, User, Search, Settings, Shield, Sun } from 'lucide-react';
import dashboardBg from '../../assets/dashboard_bg.jpg';
import AnimeCatAssistant from '../ui/AnimeCatAssistant';

const allNavItems = [
  { path: '/emp', label: 'Dashboard', icon: LayoutDashboard, roles: ['EMPLOYEE', 'HR_ADMIN', 'HR_EXECUTIVE', 'ADMIN', 'MANAGER', 'TEAM_LEAD'] },
  { path: '/emp/attendance', label: 'Attendance', icon: Clock, roles: ['EMPLOYEE', 'HR_ADMIN', 'HR_EXECUTIVE', 'ADMIN', 'MANAGER', 'TEAM_LEAD'] },
  { path: '/emp/leave', label: 'Leave', icon: CalendarDays, roles: ['EMPLOYEE', 'HR_ADMIN', 'HR_EXECUTIVE', 'ADMIN', 'MANAGER', 'TEAM_LEAD'] },
  { path: '/emp/leave-approvals', label: 'Leave Approvals', icon: CheckSquare, roles: ['HR_ADMIN', 'HR_EXECUTIVE', 'ADMIN', 'MANAGER', 'TEAM_LEAD'] },
  { path: '/emp/assets', label: 'My Assets', icon: Package, roles: ['EMPLOYEE', 'HR_ADMIN', 'HR_EXECUTIVE', 'ADMIN', 'MANAGER', 'TEAM_LEAD'] },
  { path: '/emp/payslips', label: 'Payslips', icon: Wallet, roles: ['EMPLOYEE', 'HR_ADMIN', 'HR_EXECUTIVE', 'ADMIN', 'MANAGER', 'TEAM_LEAD'] },
  { path: '/emp/exit', label: 'Resignation', icon: LogOut, roles: ['EMPLOYEE', 'HR_ADMIN', 'HR_EXECUTIVE', 'ADMIN', 'MANAGER', 'TEAM_LEAD'] },
  { path: '/emp/profile', label: 'My Profile', icon: User, roles: ['EMPLOYEE', 'HR_ADMIN', 'HR_EXECUTIVE', 'ADMIN', 'MANAGER', 'TEAM_LEAD'] },
];

export default function EmployeeLayout({ children }: { children: React.ReactNode }) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [notificationDropdownOpen, setNotificationDropdownOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const location = useLocation();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.auth);

  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const fetchUnreadCount = async () => {
    try {
      const res = await api.get('/notifications/unread-count/');
      setUnreadCount(res.data.data?.unread_count || 0);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications/');
      setNotifications(res.data.data?.results?.slice(0, 4) || res.data.data?.slice(0, 4) || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    fetchUnreadCount();
    window.addEventListener('notifications-updated', fetchUnreadCount);
    const interval = setInterval(fetchUnreadCount, 20000);
    return () => {
      window.removeEventListener('notifications-updated', fetchUnreadCount);
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (notificationDropdownOpen) {
      fetchNotifications();
    }
  }, [notificationDropdownOpen]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = container.offsetWidth);
    let height = (canvas.height = container.offsetHeight);

    const mouse = { x: null as number | null, y: null as number | null };
    
    // Day/Night Cycle config
    let timeCycle = 0;
    
    // Cloud setup
    const clouds = [
      { x: width * 0.1, y: height * 0.15, scale: 0.8, speed: 0.08 },
      { x: width * 0.45, y: height * 0.1, scale: 1.1, speed: 0.05 },
      { x: width * 0.75, y: height * 0.2, scale: 0.6, speed: 0.12 }
    ];

    // Stars
    const stars: { x: number; y: number; size: number; phase: number }[] = [];
    for (let i = 0; i < 45; i++) {
      stars.push({
        x: Math.random() * width,
        y: Math.random() * (height * 0.45),
        size: Math.random() * 1.3 + 0.3,
        phase: Math.random() * Math.PI * 2
      });
    }

    // Grass specs along bottom hill
    const grassBlades: { x: number; height: number; phase: number; speed: number }[] = [];
    const step = 8;
    for (let x = 0; x < width; x += step) {
      grassBlades.push({
        x,
        height: Math.random() * 14 + 10,
        phase: Math.random() * Math.PI * 2,
        speed: 0.02 + Math.random() * 0.015
      });
    }

    // Fireflies setup
    class Firefly {
      x: number;
      y: number;
      vx: number;
      vy: number;
      radius: number;
      phase: number;
      speed: number;

      constructor(x?: number, y?: number) {
        this.x = x ?? Math.random() * width;
        this.y = y ?? (height * 0.5 + Math.random() * (height * 0.4));
        this.vx = (Math.random() - 0.5) * 0.35;
        this.vy = (Math.random() - 0.5) * 0.35;
        this.radius = Math.random() * 2 + 1;
        this.phase = Math.random() * Math.PI * 2;
        this.speed = 0.025 + Math.random() * 0.03;
      }

      update() {
        this.phase += this.speed;
        this.x += this.vx + Math.sin(this.phase) * 0.1;
        this.y += this.vy + Math.cos(this.phase) * 0.08;

        if (this.x < 0 || this.x > width) this.vx *= -1;
        if (this.y < height * 0.4 || this.y > height) this.vy *= -1;

        if (mouse.x !== null && mouse.y !== null) {
          const dx = mouse.x - this.x;
          const dy = mouse.y - this.y;
          const dist = Math.hypot(dx, dy);
          if (dist < 150) {
            this.x += dx * 0.003;
            this.y += dy * 0.003;
          }
        }
      }

      draw() {
        if (!ctx) return;
        const glow = (Math.sin(this.phase) + 1) / 2;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(163, 230, 53, ${0.2 + glow * 0.8})`;
        ctx.fill();
        
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius * 3.5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(163, 230, 53, ${glow * 0.12})`;
        ctx.fill();
      }
    }

    const fireflies: Firefly[] = [];
    for (let i = 0; i < 18; i++) {
      fireflies.push(new Firefly());
    }

    const handleResize = () => {
      if (!canvas || !container) return;
      width = canvas.width = container.offsetWidth;
      height = canvas.height = container.offsetHeight;
    };

    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    };

    const handleMouseLeave = () => {
      mouse.x = null;
      mouse.y = null;
    };

    const handleClick = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;
      // burst release fireflies on click
      for (let i = 0; i < 4; i++) {
        fireflies.push(new Firefly(clickX, clickY));
        if (fireflies.length > 35) fireflies.shift();
      }
    };

    window.addEventListener('resize', handleResize);
    container.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('mouseleave', handleMouseLeave);
    container.addEventListener('click', handleClick);

    const animate = () => {
      ctx.clearRect(0, 0, width, height);

      timeCycle += 0.0015;
      const cycle = (Math.sin(timeCycle) + 1) / 2; // day/night factor (0 = Night, 1 = Sunset/Golden hour)

      // Sky Sunset Gradient base
      const sunsetGrad = ctx.createLinearGradient(0, 0, 0, height);
      sunsetGrad.addColorStop(0, '#2E1065');
      sunsetGrad.addColorStop(0.5, '#F43F5E');
      sunsetGrad.addColorStop(1, '#F59E0B');
      ctx.fillStyle = sunsetGrad;
      ctx.fillRect(0, 0, width, height);

      // Night overlay transition
      ctx.globalAlpha = 1 - cycle;
      const nightGrad = ctx.createLinearGradient(0, 0, 0, height);
      nightGrad.addColorStop(0, '#020617');
      nightGrad.addColorStop(0.65, '#0A0F1D');
      nightGrad.addColorStop(1, '#1A183A');
      ctx.fillStyle = nightGrad;
      ctx.fillRect(0, 0, width, height);
      ctx.globalAlpha = 1.0;

      // Draw Sun/Moon
      if (cycle > 0.05) {
        ctx.globalAlpha = cycle * 0.85;
        const sunGrad = ctx.createRadialGradient(width * 0.72, height * 0.55, 0, width * 0.72, height * 0.55, 110);
        sunGrad.addColorStop(0, 'rgba(254, 240, 138, 0.95)');
        sunGrad.addColorStop(0.3, 'rgba(249, 115, 22, 0.55)');
        sunGrad.addColorStop(1, 'rgba(249, 115, 22, 0)');
        ctx.fillStyle = sunGrad;
        ctx.beginPath();
        ctx.arc(width * 0.72, height * 0.55, 110, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;
      }

      if (1 - cycle > 0.05) {
        ctx.globalAlpha = (1 - cycle) * 0.9;
        ctx.fillStyle = 'rgba(254, 240, 138, 0.9)';
        ctx.beginPath();
        ctx.arc(width * 0.28, height * 0.22, 22, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#020617';
        ctx.beginPath();
        ctx.arc(width * 0.28 + 7, height * 0.22 - 4, 20, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;
      }

      // Stars (Night only)
      if (1 - cycle > 0.1) {
        ctx.globalAlpha = 1 - cycle;
        for (let i = 0; i < stars.length; i++) {
          const s = stars[i];
          const twin = (Math.sin(timeCycle * 3 + s.phase) + 1) / 2;
          ctx.beginPath();
          ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255, 255, 255, ${0.2 + twin * 0.8})`;
          ctx.fill();
        }
        ctx.globalAlpha = 1.0;
      }

      // Clouds
      ctx.globalAlpha = 0.28;
      ctx.fillStyle = '#FFFFFF';
      for (let i = 0; i < clouds.length; i++) {
        const c = clouds[i];
        c.x += c.speed;
        if (c.x - 100 * c.scale > width) c.x = -150 * c.scale;
        
        ctx.beginPath();
        ctx.arc(c.x, c.y, 25 * c.scale, 0, Math.PI * 2);
        ctx.arc(c.x + 20 * c.scale, c.y - 10 * c.scale, 35 * c.scale, 0, Math.PI * 2);
        ctx.arc(c.x + 50 * c.scale, c.y, 28 * c.scale, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1.0;

      // Distant Hills silhouette
      ctx.fillStyle = cycle > 0.5 ? '#1E293B' : '#0B132B';
      ctx.beginPath();
      ctx.moveTo(0, height);
      for (let x = 0; x <= width; x += 30) {
        const y = height * 0.82 + Math.sin(x * 0.003) * 35;
        ctx.lineTo(x, y);
      }
      ctx.lineTo(width, height);
      ctx.fill();

      // Front hill silhouette
      ctx.fillStyle = cycle > 0.5 ? '#0F172A' : '#020617';
      ctx.beginPath();
      ctx.moveTo(0, height);
      for (let x = 0; x <= width; x += 20) {
        const y = height * 0.88 + Math.sin(x * 0.006) * 15;
        ctx.lineTo(x, y);
      }
      ctx.lineTo(width, height);
      ctx.fill();

      // Swaying tree on the left
      const treeX = width * 0.15;
      const treeY = height * 0.88 + Math.sin(treeX * 0.006) * 15;
      
      // Tree trunk
      ctx.fillStyle = '#111D30';
      ctx.beginPath();
      ctx.moveTo(treeX - 10, treeY + 10);
      ctx.quadraticCurveTo(treeX - 4, treeY - 40, treeX - 3, treeY - 80);
      ctx.lineTo(treeX + 3, treeY - 80);
      ctx.quadraticCurveTo(treeX + 4, treeY - 40, treeX + 10, treeY + 10);
      ctx.fill();

      // Foliage clusters sway with wind
      const windOffset = Math.sin(timeCycle * 2) * 5;
      const clusters = [
        { dx: -22, dy: -85, r: 35, phase: 0 },
        { dx: 22, dy: -80, r: 30, phase: 1 },
        { dx: 0, dy: -115, r: 40, phase: 2 }
      ];

      ctx.fillStyle = cycle > 0.5 ? '#1E293B' : '#111827';
      clusters.forEach((cl) => {
        ctx.beginPath();
        ctx.arc(treeX + cl.dx + windOffset, treeY + cl.dy + Math.cos(timeCycle * 1.5 + cl.phase) * 2, cl.r, 0, Math.PI * 2);
        ctx.fill();
      });

      // Tiny Sitting Character next to tree
      const charX = treeX + 22;
      const charY = treeY + 2;
      ctx.fillStyle = '#020617';
      // Head
      ctx.beginPath();
      ctx.arc(charX, charY - 13, 3, 0, Math.PI * 2);
      ctx.fill();
      // Body
      ctx.beginPath();
      ctx.ellipse(charX, charY - 6, 2.5, 4.5, 0, 0, Math.PI * 2);
      ctx.fill();

      // Swaying Grass Blades
      ctx.strokeStyle = cycle > 0.5 ? '#1E293B' : '#0B132B';
      ctx.lineWidth = 1.5;
      grassBlades.forEach((g) => {
        g.phase += g.speed;
        const grassBaseY = height * 0.88 + Math.sin(g.x * 0.006) * 15;
        const sway = Math.sin(g.phase) * 6;
        ctx.beginPath();
        ctx.moveTo(g.x, grassBaseY + 2);
        ctx.quadraticCurveTo(g.x + sway * 0.5, grassBaseY - g.height * 0.5, g.x + sway, grassBaseY - g.height);
        ctx.stroke();
      });

      // Fireflies update & draw
      fireflies.forEach((f) => {
        f.update();
        f.draw();
      });

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', handleResize);
      container.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('mouseleave', handleMouseLeave);
      container.removeEventListener('click', handleClick);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  const navItems = allNavItems.filter((item) => item.roles.includes(user?.role || 'EMPLOYEE'));

  const handleLogout = () => {
    dispatch(logout());
    window.location.href = '/emp/login';
  };

  const handleSearchNavigate = (path: string) => {
    setSearchOpen(false);
    setSearchQuery('');
    navigate(path);
  };

  const filteredNavItems = navItems.filter((item) =>
    item.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div 
      ref={containerRef}
      className="flex flex-col h-screen overflow-hidden relative"
    >
      {/* 7-Layer Canvas Background Overlay */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none z-0" />

      {/* 1. Left Corner Logo (Desktop Only) */}
      <div className="absolute top-6 left-8 z-40 hidden lg:flex items-center gap-2 pointer-events-auto">
        <Link to="/emp" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-[#14B8A6] to-[#2DD4BF] text-[#060B16] rounded-full flex items-center justify-center font-bold text-base shadow-md shadow-[#14B8A6]/20">
            H
          </div>
          <span className="text-lg font-bold tracking-tight text-[#F8FAFC]">HRMS</span>
        </Link>
      </div>

      {/* 2. Centered Pill Navigation Menu (Desktop Only) */}
      <nav className="absolute top-4 left-1/2 -translate-x-1/2 z-40 hidden md:flex items-center gap-1 bg-[#0D1728]/70 backdrop-blur-md border border-[#1D3045]/60 h-12 rounded-full px-4 shadow-xl transition-all pointer-events-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path || (item.path !== '/emp' && location.pathname.startsWith(item.path));
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center px-4 py-1.5 rounded-full text-xs font-bold transition-all duration-200 ${
                isActive
                  ? 'bg-[#14B8A6]/25 text-white border border-[#14B8A6]/30 shadow-md shadow-[#14B8A6]/10'
                  : 'text-[#94A3B8] hover:bg-[#111D30]/60 hover:text-[#F8FAFC]'
              }`}
            >
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* 3. Top-Right Corner Actions (Desktop Only) */}
      <div className="absolute top-4 right-8 z-40 hidden md:flex items-center gap-3 pointer-events-auto">
        {/* Search Box Input */}
        <div className="hidden lg:flex items-center relative w-44">
          <div 
            onClick={() => setSearchOpen(true)}
            className="flex items-center justify-between w-full bg-[#0D1728]/70 border border-[#1D3045]/60 px-2.5 py-1.5 rounded-full text-[11px] text-[#94A3B8] hover:border-[#2DD4BF]/50 cursor-pointer transition-all shadow-md"
          >
            <div className="flex items-center gap-1.5">
              <Search size={12} className="text-[#64748B]" />
              <span>Search...</span>
            </div>
            <kbd className="bg-[#111D30] text-[9px] text-[#64748B] px-1 py-0.2 rounded border border-[#1D3045]">⌘K</kbd>
          </div>
        </div>
        
        {/* Notification Bell Dropdown */}
        <div className="relative">
          <button 
            onClick={() => setNotificationDropdownOpen(!notificationDropdownOpen)}
            className="relative w-10 h-10 flex items-center justify-center text-[#94A3B8] hover:text-[#2DD4BF] bg-[#0D1728]/70 border border-[#1D3045]/60 rounded-full transition-colors cursor-pointer shadow-md"
          >
            <Bell size={17} />
            {unreadCount > 0 && (
              <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-[#EF4444] rounded-full animate-pulse" />
            )}
          </button>
          
          {notificationDropdownOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setNotificationDropdownOpen(false)} />
              <div className="absolute right-0 mt-2 w-72 bg-[#0D1728] border border-[#1D3045] rounded-xl shadow-xl z-20 overflow-hidden">
                <div className="px-4 py-3 border-b border-[#1D3045] flex items-center justify-between">
                  <span className="font-bold text-xs text-[#F8FAFC]">Notifications</span>
                  {unreadCount > 0 && (
                    <span className="text-[10px] text-[#EF4444] bg-[#EF4444]/10 border border-[#EF4444]/25 px-1.5 py-0.2 rounded font-semibold">
                      {unreadCount} Unread
                    </span>
                  )}
                </div>
                <div className="divide-y divide-[#1D3045]/60 text-xs text-[#94A3B8]">
                  {notifications.length === 0 ? (
                    <div className="p-4 text-center text-[#64748B]">No recent notifications</div>
                  ) : (
                    notifications.map((n) => (
                      <div key={n.id} className="p-3 hover:bg-[#111D30]/50 transition-all flex items-start gap-2.5 text-left">
                        <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                          n.title?.toLowerCase().includes('approved') ? 'bg-[#22C55E]' :
                          n.title?.toLowerCase().includes('marked') ? 'bg-[#22D3EE]' :
                          n.title?.toLowerCase().includes('payslip') ? 'bg-[#F59E0B]' :
                          'bg-[#38BDF8]'
                        }`} />
                        <div>
                          <p className="font-bold text-[#F8FAFC]">{n.title}</p>
                          <p className="text-[10px] text-[#64748B] mt-0.5">{n.message}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <Link 
                  to="/emp/notifications" 
                  onClick={() => setNotificationDropdownOpen(false)}
                  className="block text-center py-2 text-[10px] font-bold text-[#2DD4BF] hover:bg-[#111D30]/70 border-t border-[#1D3045]/80"
                >
                  View all notifications →
                </Link>
              </div>
            </>
          )}
        </div>

        {/* User Profile dropdown */}
        <div className="relative">
          <button 
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 p-1 bg-[#0D1728]/70 border border-[#1D3045]/60 rounded-full transition-colors cursor-pointer shadow-md h-10 pr-2.5"
          >
            <div className="w-8 h-8 bg-gradient-to-br from-[#14B8A6] to-[#2DD4BF] text-[#060B16] rounded-full flex items-center justify-center font-bold text-xs shadow-inner">
              {user?.first_name?.[0]}{user?.last_name?.[0]}
            </div>
            <div className="hidden xl:flex flex-col text-left shrink-0">
              <span className="text-xs font-bold text-[#F8FAFC] leading-none">{user?.first_name} {user?.last_name}</span>
            </div>
            <ChevronDown size={12} className="text-[#64748B]" />
          </button>

          {dropdownOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setDropdownOpen(false)} />
              <div className="absolute right-0 mt-2 w-56 bg-[#0D1728] border border-[#1D3045] rounded-xl shadow-xl z-20 py-1 text-[#F8FAFC]">
                <div className="px-4 py-2.5 border-b border-[#1D3045] text-left">
                  <p className="font-bold text-sm text-[#F8FAFC] truncate">{user?.full_name}</p>
                  <p className="text-[11px] text-[#94A3B8] truncate">{user?.email}</p>
                  <span className="mt-1 inline-block px-1.5 py-0.5 text-[9px] bg-[#14B8A6]/10 text-[#14B8A6] border border-[#14B8A6]/20 rounded font-semibold uppercase">{user?.role?.replace('_', ' ')}</span>
                </div>
                
                <Link 
                  to="/emp/profile" 
                  onClick={() => setDropdownOpen(false)}
                  className="flex items-center gap-2 px-4 py-2 text-xs font-semibold hover:bg-[#111D30] hover:text-[#F8FAFC]"
                >
                  <User size={14} className="text-[#94A3B8]" /> My Profile
                </Link>
                <Link 
                  to="/emp/profile" 
                  onClick={() => setDropdownOpen(false)}
                  className="flex items-center gap-2 px-4 py-2 text-xs font-semibold hover:bg-[#111D30] hover:text-[#F8FAFC]"
                >
                  <Settings size={14} className="text-[#94A3B8]" /> Settings
                </Link>
                <Link 
                  to="/emp/profile" 
                  onClick={() => setDropdownOpen(false)}
                  className="flex items-center gap-2 px-4 py-2 text-xs font-semibold hover:bg-[#111D30] hover:text-[#F8FAFC]"
                >
                  <Shield size={14} className="text-[#94A3B8]" /> Security
                </Link>
                <Link 
                  to="/emp/profile" 
                  onClick={() => setDropdownOpen(false)}
                  className="flex items-center gap-2 px-4 py-2 text-xs font-semibold hover:bg-[#111D30] hover:text-[#F8FAFC]"
                >
                  <Sun size={14} className="text-[#94A3B8]" /> Appearance
                </Link>
                
                <div className="border-t border-[#1D3045] mt-1 pt-1">
                  <button 
                    onClick={handleLogout}
                    className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-[#94A3B8] hover:bg-[#111D30] hover:text-[#F8FAFC] w-full text-left"
                  >
                    <LogOut size={14} className="text-[#64748B]" /> Logout
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* 4. Mobile/Tablet Navbar (Sticky Header style on top) */}
      <header className="md:hidden bg-[#0A1120]/45 backdrop-blur-md border-b border-[#1D3045]/40 h-16 flex items-center justify-between px-6 z-40 relative text-[#F8FAFC]">
        <Link to="/emp" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-[#14B8A6] to-[#2DD4BF] text-[#060B16] rounded-full flex items-center justify-center font-bold text-base shadow-md shadow-[#14B8A6]/20">
            H
          </div>
        </Link>

        <div className="flex items-center gap-3">
          {/* Notification bell mobile */}
          <div className="relative">
            <button 
              onClick={() => setNotificationDropdownOpen(!notificationDropdownOpen)}
              className="relative p-2 text-[#94A3B8] hover:text-[#2DD4BF] rounded-lg transition-colors cursor-pointer"
            >
              <Bell size={18} />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#EF4444] rounded-full animate-pulse" />
              )}
            </button>
            {notificationDropdownOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-[#0D1728] border border-[#1D3045] rounded-xl shadow-xl z-50 overflow-hidden text-xs text-[#94A3B8]">
                <div className="px-4 py-2 border-b border-[#1D3045] text-[#F8FAFC] font-bold">Notifications</div>
                <div className="divide-y divide-[#1D3045]/40 max-h-48 overflow-y-auto">
                  {notifications.map((n) => (
                    <div key={n.id} className="p-3 hover:bg-[#111D30]/40 text-left">
                      <p className="font-bold text-[#F8FAFC]">{n.title}</p>
                      <p className="text-[10px] text-[#64748B] mt-0.5">{n.message}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Profile Mobile */}
          <div className="relative">
            <button 
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="w-8 h-8 bg-gradient-to-br from-[#14B8A6] to-[#2DD4BF] text-[#060B16] rounded-full flex items-center justify-center font-bold text-xs shadow-md"
            >
              {user?.first_name?.[0]}{user?.last_name?.[0]}
            </button>
            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-[#0D1728] border border-[#1D3045] rounded-xl shadow-xl z-50 py-1 text-xs text-left">
                <Link to="/emp/profile" onClick={() => setDropdownOpen(false)} className="block px-4 py-2 hover:bg-[#111D30]">Profile</Link>
                <button onClick={handleLogout} className="block w-full text-left px-4 py-2 hover:bg-[#111D30] text-rose-400 font-bold">Logout</button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Body Grid */}
      <div className="flex-1 flex overflow-hidden relative z-10 pt-24">
        {/* Content Panel Area */}
        <main className="flex-1 overflow-y-auto p-6 pb-20 md:pb-6">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>

      {/* Bottom Nav on Mobile screen size */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-[#0A1120]/95 backdrop-blur-lg border-t border-[#1D3045] flex items-center justify-around z-30 px-2 text-[#94A3B8]">
        {navItems.slice(0, 4).map((item) => {
          const isActive = location.pathname === item.path || (item.path !== '/emp' && location.pathname.startsWith(item.path));
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center gap-1 py-1.5 px-3 rounded-lg ${
                isActive ? 'text-[#2DD4BF]' : 'text-[#94A3B8] hover:text-[#F8FAFC]'
              }`}
            >
              <item.icon size={18} />
              <span className="text-[10px] font-semibold">{item.label}</span>
            </Link>
          );
        })}
        <button 
          onClick={() => setSearchOpen(true)}
          className="flex flex-col items-center gap-1 py-1.5 px-3 rounded-lg text-[#94A3B8] hover:text-[#F8FAFC]"
        >
          <Search size={18} />
          <span className="text-[10px] font-semibold">Search</span>
        </button>
      </nav>

      {/* Ctrl+K Search Modal Dialog Overlay */}
      {searchOpen && (
        <>
          <div className="fixed inset-0 bg-[#060B16]/80 backdrop-blur-sm z-50" onClick={() => setSearchOpen(false)} />
          <div className="fixed top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/4 w-full max-w-lg bg-[#0D1728] border border-[#1D3045] rounded-xl shadow-2xl z-50 p-4 overflow-hidden animate-fadeIn">
            <div className="flex items-center gap-3 border-b border-[#1D3045] pb-3">
              <Search size={18} className="text-[#94A3B8]" />
              <input 
                autoFocus
                type="text" 
                placeholder="Search menu or pages..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent text-sm text-[#F8FAFC] placeholder-[#64748B] outline-none border-none"
              />
              <button onClick={() => setSearchOpen(false)} className="text-[#64748B] hover:text-[#F8FAFC] text-xs">ESC</button>
            </div>
            
            <div className="mt-3 max-h-60 overflow-y-auto space-y-1">
              <div className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider px-2 py-1">Pages</div>
              {filteredNavItems.length === 0 ? (
                <div className="p-3 text-xs text-[#64748B] text-center">No results found</div>
              ) : (
                filteredNavItems.map((item) => (
                  <button 
                    key={item.path}
                    onClick={() => handleSearchNavigate(item.path)}
                    className="flex items-center gap-3 w-full text-left px-2 py-2 rounded-lg text-xs font-semibold text-[#94A3B8] hover:bg-[#111D30] hover:text-[#F8FAFC] transition-colors"
                  >
                    <item.icon size={14} className="text-[#2DD4BF]" />
                    <span>{item.label}</span>
                  </button>
                ))
              )}
            </div>
          </div>
        </>
      )}
      <AnimeCatAssistant />
    </div>
  );
}
