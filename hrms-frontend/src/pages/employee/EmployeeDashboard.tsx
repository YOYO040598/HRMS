import { useEffect, useState } from 'react';
import api from '../../api/axios';
import { useAppSelector } from '../../hooks/useRedux';
import { Clock, CalendarDays, Activity, FileText, CheckCircle, Gift, Megaphone } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function EmployeeDashboard() {
  const { user } = useAppSelector((state) => state.auth);
  const [stats, setStats] = useState({ todayStatus: '', checkIn: '', checkOut: '', hoursWorked: 0, pendingLeaves: 0, usedLeaves: 0 });
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    fetchDashboard();
    const t = setTimeout(() => setMounted(true), 80);
    return () => clearTimeout(t);
  }, []);

  const fetchDashboard = async () => {
    try {
      const [attRes, leaveRes] = await Promise.all([
        api.get('/attendance/records/'),
        api.get('/leave/balance-summary/'),
      ]);
      const records = attRes.data.data || attRes.data.results || [];
      if (records.length > 0) {
        const latest = records[0];
        const todayStr = new Date().toISOString().split('T')[0];
        if (!latest.check_out || latest.date === todayStr) {
          setStats((prev) => ({
            ...prev,
            todayStatus: latest.status,
            checkIn: latest.check_in || '',
            checkOut: latest.check_out || '',
            hoursWorked: latest.total_hours || 0,
          }));
        }
      }
      const balances = leaveRes.data.data;
      if (balances?.length > 0) {
        setStats((prev) => ({
          ...prev,
          pendingLeaves: balances.reduce((sum: number, b: any) => sum + Number(b.pending_days || 0), 0),
          usedLeaves: balances.reduce((sum: number, b: any) => sum + Number(b.used_days || 0), 0),
        }));
      }
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const getGreeting = () => {
    const hr = new Date().getHours();
    if (hr < 12) return 'Good morning';
    if (hr < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const formatHours = (val: number) => {
    const hrs = Math.floor(val);
    const mins = Math.round((val - hrs) * 60);
    return `${hrs}h ${mins}m`;
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#14B8A6]" /></div>;

  return (
    <div className="space-y-8 p-1 sm:p-2 relative z-10 text-[#F8FAFC] font-sans">
      
      {/* Visual Design Style Tokens */}
      <style>{`
        .glass-card-premium {
          background: rgba(13, 23, 40, 0.72);
          backdrop-filter: blur(18px);
          -webkit-backdrop-filter: blur(18px);
          border: 1px solid rgba(148, 163, 184, 0.12);
          transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
          transform-style: preserve-3d;
          perspective: 1000px;
        }
        .glass-card-premium:hover {
          transform: translateY(-3px) scale(1.005);
          border-color: rgba(45, 212, 191, 0.25);
          box-shadow: 0 12px 24px -10px rgba(45, 212, 191, 0.1);
        }
        .glow-value {
          text-shadow: 0 0 14px rgba(45, 212, 191, 0.3);
        }
        .progress-bar-glow {
          box-shadow: 0 0 8px rgba(45, 212, 191, 0.4);
        }
        @keyframes draw-chart-line {
          to { stroke-dashoffset: 0; }
        }
        .chart-path-anim {
          stroke-dasharray: 200;
          stroke-dashoffset: 200;
          animation: draw-chart-line 2.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .action-tile {
          background: rgba(13, 23, 40, 0.8);
          border: 1px solid rgba(148, 163, 184, 0.1);
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .action-tile:hover {
          transform: translateY(-2px);
          background: rgba(20, 184, 166, 0.08);
          border-color: #14B8A6;
        }
        .date-badge {
          background: rgba(20, 184, 166, 0.1);
          border: 1px solid rgba(20, 184, 166, 0.2);
          color: #2DD4BF;
        }
      `}</style>

      {/* Main Header / Welcome Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative z-10">
        <div>
          <h2 className="text-3xl font-black text-[#F8FAFC] tracking-tight">
            {getGreeting()}, {user?.first_name || 'Employee'}! 👋
          </h2>
          <p className="text-xs text-[#94A3B8] font-medium mt-1">Here's your workspace overview for today.</p>
        </div>
        <div className="text-xs text-[#94A3B8] font-semibold bg-[#0D1728]/90 border border-[#1D3045] px-4 py-2.5 rounded-2xl shadow-lg flex items-center gap-2 backdrop-blur-md">
          <Clock size={14} className="text-[#2DD4BF]" />
          <span>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}</span>
        </div>
      </div>

      {/* Bento Row 1: KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 relative z-10">
        
        {/* KPI 1: Attendance Status */}
        <div className="glass-card-premium rounded-2xl p-5 flex flex-col justify-between min-h-[140px]">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle size={12} className="text-[#22C55E]" /> Attendance Status
            </span>
            <span className="text-[9px] font-semibold px-2 py-0.5 rounded bg-[#22C55E]/10 text-[#22C55E] border border-[#22C55E]/20">
              On Time
            </span>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-black text-[#F8FAFC] tracking-tight flex items-center gap-2">
              {stats.todayStatus || 'PRESENT'} <span className="w-2 h-2 rounded-full bg-[#22C55E] animate-pulse" />
            </div>
            <p className="text-[10px] text-[#64748B] mt-1">
              {stats.checkIn ? `Checked in at ${new Date(stats.checkIn).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}` : 'Checked in at 11:42 AM'}
            </p>
          </div>
        </div>

        {/* KPI 2: Work Hours */}
        <div className="glass-card-premium rounded-2xl p-5 flex flex-col justify-between min-h-[140px]">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider flex items-center gap-1.5">
              <Clock size={12} className="text-[#2DD4BF]" /> Work Hours
            </span>
            <span className="text-[10px] font-mono text-[#64748B]">
              {Math.round(Math.min((stats.hoursWorked / 8) * 100, 100))}%
            </span>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-black text-[#F8FAFC] tracking-tight glow-value">
              {stats.hoursWorked > 0 ? formatHours(stats.hoursWorked) : '6h 42m'}
              <span className="text-xs font-medium text-[#64748B] ml-1.5">of 8h 00m</span>
            </div>
            <div className="w-full bg-[#1D3045] rounded-full h-1.5 mt-2.5 overflow-hidden">
              <div 
                className="bg-[#2DD4BF] h-1.5 rounded-full transition-all duration-1000 progress-bar-glow" 
                style={{ width: mounted ? `${Math.min((stats.hoursWorked / 8) * 100, 100) || 84}%` : '0%' }} 
              />
            </div>
          </div>
        </div>

        {/* KPI 3: Leave Balance */}
        <div className="glass-card-premium rounded-2xl p-5 flex flex-col justify-between min-h-[140px]">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#F59E0B]" /> Leave Balance
            </span>
            <Link to="/emp/leave" className="text-[10px] text-[#2DD4BF] font-semibold hover:underline">
              View All →
            </Link>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-black text-[#F8FAFC] tracking-tight">
              12 days
            </div>
            <p className="text-[10px] text-[#64748B] mt-1">Annual Leave remaining</p>
          </div>
        </div>

        {/* KPI 4: Payslip Card */}
        <div className="glass-card-premium rounded-2xl p-5 flex flex-col justify-between min-h-[140px]">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider flex items-center gap-1.5">
              <FileText size={12} className="text-[#22D3EE]" /> Payslip — July
            </span>
            <Link to="/emp/payslips" className="text-[10px] text-[#2DD4BF] font-semibold hover:underline">
              View →
            </Link>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-black text-[#F8FAFC] tracking-tight">
              ₹52,650
            </div>
            <p className="text-[10px] text-[#64748B] mt-1">Net Salary Credited</p>
          </div>
        </div>

      </div>

      {/* Bento Row 2: Employee Profile + Work Overview + Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 relative z-10">
        
        {/* Employee Profile Card (4 cols) */}
        <div className="lg:col-span-4 glass-card-premium rounded-2xl p-6 flex flex-col justify-between min-h-[260px]">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider">Employee Profile</span>
              <span className="text-[9px] font-mono text-[#64748B] uppercase tracking-widest">EMP ID: {user?.id || 'EMP1001'}</span>
            </div>
            
            <div className="flex items-center gap-4 mt-6">
              <div className="w-14 h-14 bg-gradient-to-br from-[#14B8A6] to-[#2DD4BF] text-[#060B16] rounded-full flex items-center justify-center font-bold text-lg ring-2 ring-[#14B8A6]/20">
                {user?.first_name?.[0]}{user?.last_name?.[0]}
              </div>
              <div>
                <h4 className="text-lg font-black text-[#F8FAFC] tracking-tight">{user?.full_name || 'John Doe'}</h4>
                <p className="text-xs text-[#94A3B8]">{user?.email || 'john.doe@hrms.com'}</p>
                <p className="text-[10px] text-[#64748B] mt-0.5">+91 98765 43210</p>
              </div>
            </div>
          </div>

          <div className="border-t border-[#1D3045] pt-4 mt-6 grid grid-cols-3 gap-2 text-center">
            <div>
              <div className="text-[9px] text-[#64748B] uppercase font-bold tracking-wider">Designation</div>
              <div className="text-xs font-semibold text-[#94A3B8] mt-1 truncate">{user?.role?.replace('_', ' ') || 'Employee'}</div>
            </div>
            <div>
              <div className="text-[9px] text-[#64748B] uppercase font-bold tracking-wider">Department</div>
              <div className="text-xs font-semibold text-[#94A3B8] mt-1 truncate">{(user as any)?.department || 'Operations'}</div>
            </div>
            <div>
              <div className="text-[9px] text-[#64748B] uppercase font-bold tracking-wider">Location</div>
              <div className="text-xs font-semibold text-[#94A3B8] mt-1 truncate">Pune</div>
            </div>
          </div>
        </div>

        {/* Work Overview Chart Card (4 cols) */}
        <div className="lg:col-span-4 glass-card-premium rounded-2xl p-6 flex flex-col justify-between min-h-[260px]">
          <div>
            <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider block">Today's Work Hours</span>
            <div className="mt-4">
              <svg className="w-full h-28 text-[#2DD4BF] overflow-visible" viewBox="0 0 100 40">
                <defs>
                  <linearGradient id="chart-grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#14B8A6" stopOpacity="0.15" />
                    <stop offset="100%" stopColor="#14B8A6" stopOpacity="0" />
                  </linearGradient>
                </defs>
                
                {/* Grid Lines */}
                <line x1="0" y1="10" x2="100" y2="10" stroke="#1D3045" strokeWidth="0.3" strokeDasharray="2" />
                <line x1="0" y1="20" x2="100" y2="20" stroke="#1D3045" strokeWidth="0.3" strokeDasharray="2" />
                <line x1="0" y1="30" x2="100" y2="30" stroke="#1D3045" strokeWidth="0.3" strokeDasharray="2" />
                
                {/* Gradient Fill */}
                <path d="M 0 35 L 20 28 L 40 18 L 65 10 L 85 8 L 100 12 L 100 35 Z" fill="url(#chart-grad)" />
                
                {/* Wave Line */}
                <path 
                  d="M 0 35 L 20 28 L 40 18 L 65 10 L 85 8 L 100 12" 
                  stroke="#2DD4BF" 
                  strokeWidth="1.5" 
                  fill="none" 
                  strokeLinecap="round" 
                  className="chart-path-anim"
                />
                
                {/* Glowing Dot */}
                <circle cx="85" cy="8" r="2" fill="#2DD4BF" />
                <circle cx="85" cy="8" r="1" fill="#F8FAFC" />
              </svg>
              <div className="flex justify-between text-[9px] text-[#64748B] mt-2 font-mono">
                <span>9AM</span>
                <span>11AM</span>
                <span>1PM</span>
                <span>3PM</span>
                <span>5PM</span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions (4 cols) */}
        <div className="lg:col-span-4 glass-card-premium rounded-2xl p-6 flex flex-col justify-between min-h-[260px]">
          <div>
            <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider block">Quick Actions</span>
            <div className="grid grid-cols-3 gap-3 mt-4">
              <Link to="/emp/attendance" className="action-tile p-3 rounded-xl text-center flex flex-col items-center justify-center min-h-[75px]">
                <Clock size={16} className="text-[#2DD4BF]" />
                <span className="text-[10px] font-bold mt-1.5 block text-[#94A3B8]">Attendance</span>
              </Link>
              <Link to="/emp/leave" className="action-tile p-3 rounded-xl text-center flex flex-col items-center justify-center min-h-[75px]">
                <CalendarDays size={16} className="text-[#2DD4BF]" />
                <span className="text-[10px] font-bold mt-1.5 block text-[#94A3B8]">Leave</span>
              </Link>
              <Link to="/emp/payslips" className="action-tile p-3 rounded-xl text-center flex flex-col items-center justify-center min-h-[75px]">
                <FileText size={16} className="text-[#2DD4BF]" />
                <span className="text-[10px] font-bold mt-1.5 block text-[#94A3B8]">Payslip</span>
              </Link>
              <Link to="/emp/assets" className="action-tile p-3 rounded-xl text-center flex flex-col items-center justify-center min-h-[75px]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#2DD4BF] mb-1" />
                <span className="text-[10px] font-bold mt-1 block text-[#94A3B8]">Assets</span>
              </Link>
              <Link to="/emp/exit" className="action-tile p-3 rounded-xl text-center flex flex-col items-center justify-center min-h-[75px]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#EF4444] mb-1" />
                <span className="text-[10px] font-bold mt-1 block text-[#94A3B8]">Resign</span>
              </Link>
              <Link to="/emp/profile" className="action-tile p-3 rounded-xl text-center flex flex-col items-center justify-center min-h-[75px]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#38BDF8] mb-1" />
                <span className="text-[10px] font-bold mt-1 block text-[#94A3B8]">Profile</span>
              </Link>
            </div>
          </div>
        </div>

      </div>

      {/* Bento Row 3: Upcoming Holidays + Announcements + Birthdays */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
        
        {/* Holidays */}
        <div className="glass-card-premium rounded-2xl p-6">
          <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider block">Upcoming Holidays</span>
          <div className="flex items-center gap-4 mt-4">
            <div className="date-badge w-12 h-12 rounded-xl flex flex-col items-center justify-center shrink-0">
              <span className="text-base font-black leading-none">15</span>
              <span className="text-[9px] font-bold uppercase leading-none mt-1">AUG</span>
            </div>
            <div>
              <h4 className="text-sm font-bold text-[#F8FAFC]">Independence Day</h4>
              <p className="text-[11px] text-[#64748B] mt-0.5">Friday, Aug 15, 2026 · <span className="text-[#2DD4BF]">3 days to go</span></p>
            </div>
          </div>
        </div>

        {/* Recent Announcements */}
        <div className="glass-card-premium rounded-2xl p-6 flex flex-col justify-between">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider">Recent Announcements</span>
            <Link to="/emp" className="text-[10px] text-[#2DD4BF] font-semibold hover:underline">View →</Link>
          </div>
          <div className="space-y-4 mt-4 text-xs font-semibold text-[#94A3B8]">
            <div className="flex gap-2">
              <Megaphone size={14} className="text-[#2DD4BF] shrink-0 mt-0.5" />
              <div>
                <p className="text-[#F8FAFC]">Office will remain closed on Aug 15.</p>
                <p className="text-[10px] text-[#64748B] mt-0.5">Aug 10, 2026 · HR Team</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Megaphone size={14} className="text-[#2DD4BF] shrink-0 mt-0.5" />
              <div>
                <p className="text-[#F8FAFC]">New attendance policy released.</p>
                <p className="text-[10px] text-[#64748B] mt-0.5">Aug 08, 2026 · HR Team</p>
              </div>
            </div>
          </div>
        </div>

        {/* Birthdays */}
        <div className="glass-card-premium rounded-2xl p-6">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider">Birthdays This Month</span>
            <Link to="/emp" className="text-[10px] text-[#2DD4BF] font-semibold hover:underline">View →</Link>
          </div>
          <div className="space-y-3 mt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 bg-[#1D3045] rounded-full flex items-center justify-center text-[10px] text-[#2DD4BF] font-bold">EJ</div>
                <div>
                  <p className="text-xs font-bold text-[#F8FAFC]">Emily Johnson</p>
                  <p className="text-[10px] text-[#64748B]">August 18</p>
                </div>
              </div>
              <Gift size={14} className="text-[#2DD4BF]" />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 bg-[#1D3045] rounded-full flex items-center justify-center text-[10px] text-[#2DD4BF] font-bold">RP</div>
                <div>
                  <p className="text-xs font-bold text-[#F8FAFC]">Rahul Patil</p>
                  <p className="text-[10px] text-[#64748B]">August 25</p>
                </div>
              </div>
              <Gift size={14} className="text-[#2DD4BF]" />
            </div>
          </div>
        </div>

      </div>

      {/* Bento Row 4: Recent Activity */}
      <div className="glass-card-premium rounded-2xl p-6 relative z-10">
        <h3 className="text-base font-black text-[#F8FAFC] tracking-tight mb-6 flex items-center gap-2">
          <Activity size={16} className="text-[#64748B]" /> Recent Activity
        </h3>
        
        <div className="relative border-l border-[#1D3045] ml-2.5 pl-6 space-y-6 text-xs font-semibold text-[#94A3B8]">
          <div className="relative">
            <span className="absolute -left-[30px] top-0.5 w-3.5 h-3.5 rounded-full bg-[#060B16] border-2 border-[#2DD4BF] flex items-center justify-center">
              <span className="w-1.5 h-1.5 rounded-full bg-[#2DD4BF]" />
            </span>
            <p className="text-[#F8FAFC] font-bold text-sm">Attendance marked</p>
            <p className="text-[10px] text-[#64748B] mt-0.5">Today · 11:42 AM</p>
          </div>
          <div className="relative">
            <span className="absolute -left-[30px] top-0.5 w-3.5 h-3.5 rounded-full bg-[#060B16] border-2 border-[#1D3045] flex items-center justify-center">
              <span className="w-1.5 h-1.5 rounded-full bg-[#64748B]" />
            </span>
            <p className="text-[#F8FAFC] font-bold text-sm">Leave request submitted</p>
            <p className="text-[10px] text-[#64748B] mt-0.5">Yesterday · 4:32 PM</p>
          </div>
          <div className="relative">
            <span className="absolute -left-[30px] top-0.5 w-3.5 h-3.5 rounded-full bg-[#060B16] border-2 border-[#1D3045] flex items-center justify-center">
              <span className="w-1.5 h-1.5 rounded-full bg-[#64748B]" />
            </span>
            <p className="text-[#F8FAFC] font-bold text-sm">Payslip generated</p>
            <p className="text-[10px] text-[#64748B] mt-0.5">Aug 01 · 10:10 AM</p>
          </div>
          <div className="relative">
            <span className="absolute -left-[30px] top-0.5 w-3.5 h-3.5 rounded-full bg-[#060B16] border-2 border-[#1D3045] flex items-center justify-center">
              <span className="w-1.5 h-1.5 rounded-full bg-[#64748B]" />
            </span>
            <p className="text-[#F8FAFC] font-bold text-sm">Profile updated</p>
            <p className="text-[10px] text-[#64748B] mt-0.5">Jul 29 · 2:20 PM</p>
          </div>
        </div>
      </div>

    </div>
  );
}
