import { useEffect, useState } from 'react';
import api from '../../api/axios';
import { useAppSelector } from '../../hooks/useRedux';
import { formatDate, getStatusColor } from '../../lib/utils';
import { Clock, CalendarDays, Wallet, TrendingUp, LogIn, LogOut, Briefcase, Sparkles, User, Bell } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function EmployeeDashboard() {
  const { user } = useAppSelector((state) => state.auth);
  const [stats, setStats] = useState({ todayStatus: '', checkIn: '', checkOut: '', hoursWorked: 0, pendingLeaves: 0, usedLeaves: 0 });
  const [recentAttendance, setRecentAttendance] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchDashboard(); }, []);

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
      const monthlyRes = await api.get('/attendance/monthly/');
      setRecentAttendance(monthlyRes.data.data?.attendances?.slice(0, 5) || []);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600" /></div>;

  return (
    <div className="space-y-8 p-1 sm:p-2">
      {/* Custom Styles for Spatial Bento Cards */}
      <style>{`
        .bento-card {
          background: rgba(255, 255, 255, 0.7) !important;
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
          border: 1px solid rgba(255, 255, 255, 0.5) !important;
        }
        .bento-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 20px 40px -10px rgba(0, 0, 0, 0.05), 0 10px 20px -10px rgba(234, 88, 12, 0.05);
          border-color: rgba(234, 88, 12, 0.3) !important;
        }
        @keyframes drift {
          0% { transform: translate(0px, 0px) scale(1); }
          50% { transform: translate(30px, -20px) scale(1.1); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-drift { animation: drift 10s infinite ease-in-out; }
      `}</style>

      {/* Top Bar Greeting */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-[#ea580c] uppercase tracking-widest mb-1.5">
            <Sparkles size={14} /> Employee Workspace
          </div>
          <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Welcome, {user?.first_name}!</h2>
          <p className="text-sm text-gray-500 font-medium mt-1">Here is your spatial work overview for today.</p>
        </div>
        <div className="text-sm text-gray-400 font-semibold bg-white border border-gray-200/50 px-4 py-2 rounded-xl shadow-sm">
          📍 {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
        </div>
      </div>

      {/* Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 auto-rows-auto">
        
        {/* Welcome Banner Bento Card */}
        <div className="md:col-span-2 bg-gradient-to-tr from-[#ea580c] to-[#f97316] rounded-3xl p-8 text-white relative overflow-hidden shadow-lg shadow-[#ea580c]/15 flex flex-col justify-between min-h-[220px]">
          {/* Ambient Glow Bubbles */}
          <div className="absolute -top-12 -right-12 w-48 h-48 bg-white/10 rounded-full blur-2xl animate-drift pointer-events-none" />
          <div className="absolute -bottom-8 -left-8 w-36 h-36 bg-white/10 rounded-full blur-xl pointer-events-none" />
          
          <div className="relative z-10">
            <span className="text-[10px] font-extrabold uppercase tracking-widest bg-white/20 px-2.5 py-1 rounded-full text-indigo-100">Active Profile</span>
            <h3 className="text-2xl font-bold mt-4 tracking-tight">{user?.first_name} {user?.last_name}</h3>
            <p className="text-sm text-indigo-100 mt-1.5 opacity-90">{user?.email}</p>
          </div>

          <div className="relative z-10 flex gap-6 mt-6 border-t border-white/10 pt-4">
            <div>
              <div className="text-xs text-indigo-200 uppercase font-bold tracking-wider">Role</div>
              <div className="text-sm font-semibold mt-0.5">{user?.role || 'Employee'}</div>
            </div>
            <div>
              <div className="text-xs text-indigo-200 uppercase font-bold tracking-wider">Department</div>
              <div className="text-sm font-semibold mt-0.5">{user?.department || 'Operations'}</div>
            </div>
          </div>
        </div>

        {/* Today's Status Card */}
        <div className="bento-card bg-white rounded-3xl p-6 flex flex-col justify-between min-h-[220px]">
          <div className="flex justify-between items-start">
            <div className="w-10 h-10 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600">
              <Clock size={20} />
            </div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">Status</span>
          </div>
          <div>
            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">Today's Attendance</div>
            <div className="text-2xl font-extrabold text-gray-900 mt-1 flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${stats.todayStatus ? 'bg-emerald-500 animate-pulse' : 'bg-rose-400'}`} />
              {stats.todayStatus || 'Not Checked In'}
            </div>
          </div>
        </div>

        {/* Working Hours Card */}
        <div className="bento-card bg-white rounded-3xl p-6 flex flex-col justify-between min-h-[220px]">
          <div className="flex justify-between items-start">
            <div className="w-10 h-10 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
              <TrendingUp size={20} />
            </div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">Activity</span>
          </div>
          <div>
            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">Hours Tracked</div>
            <div className="text-3xl font-black text-gray-900 mt-1">{stats.hoursWorked}<span className="text-lg font-bold text-gray-400 ml-0.5">h</span></div>
            {/* Progress Gauge */}
            <div className="w-full bg-gray-100 rounded-full h-1.5 mt-3 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-blue-500 to-indigo-500 h-1.5 rounded-full transition-all duration-500" 
                style={{ width: `${Math.min((stats.hoursWorked / 8) * 100, 100)}%` }} 
              />
            </div>
          </div>
        </div>

        {/* Leaves Balance Bento */}
        <div className="bento-card md:col-span-2 bg-white rounded-3xl p-6 flex flex-col justify-between min-h-[220px]">
          <div className="flex justify-between items-start">
            <div className="w-10 h-10 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600">
              <CalendarDays size={20} />
            </div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md">Time Off</span>
          </div>
          <div className="grid grid-cols-2 gap-4 divide-x divide-gray-100">
            <div className="pr-4">
              <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">Used Leaves</div>
              <div className="text-2xl font-black text-[#1e293b] mt-1">{stats.usedLeaves} <span className="text-xs font-medium text-gray-400">days</span></div>
            </div>
            <div className="pl-4">
              <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">Pending Approvals</div>
              <div className="text-2xl font-black text-amber-600 mt-1">{stats.pendingLeaves} <span className="text-xs font-medium text-gray-400">days</span></div>
            </div>
          </div>
        </div>

        {/* Quick Actions Bento */}
        <div className="bento-card md:col-span-2 bg-white rounded-3xl p-6 flex flex-col justify-between min-h-[220px]">
          <div className="flex justify-between items-start">
            <div className="w-10 h-10 bg-purple-50 rounded-2xl flex items-center justify-center text-purple-600">
              <Sparkles size={20} />
            </div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-purple-600 bg-purple-50 px-2 py-0.5 rounded-md">Quick Access</span>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Link to="/emp/attendance" className="p-3 bg-gray-50 hover:bg-orange-50/50 hover:text-[#ea580c] rounded-2xl text-center transition-all border border-gray-100/50">
              <Clock size={20} className="mx-auto mb-1.5 text-[#ea580c]" />
              <span className="text-xs font-bold block">Attendance</span>
            </Link>
            <Link to="/emp/leave" className="p-3 bg-gray-50 hover:bg-amber-50/50 hover:text-amber-600 rounded-2xl text-center transition-all border border-gray-100/50">
              <CalendarDays size={20} className="mx-auto mb-1.5 text-amber-600" />
              <span className="text-xs font-bold block">Apply Leave</span>
            </Link>
            <Link to="/emp/exit" className="p-3 bg-gray-50 hover:bg-rose-50/50 hover:text-rose-600 rounded-2xl text-center transition-all border border-gray-100/50">
              <LogOut size={20} className="mx-auto mb-1.5 text-rose-600" />
              <span className="text-xs font-bold block">Resignation</span>
            </Link>
          </div>
        </div>

        {/* Recent Activity Timeline */}
        <div className="bento-card md:col-span-4 bg-white rounded-3xl p-6">
          <h3 className="text-lg font-bold text-gray-900 tracking-tight mb-4 flex items-center gap-2">
            <Clock size={18} className="text-gray-400" /> Recent Activity Logs
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">Today's Details</div>
              <div className="p-4 bg-gray-50/60 rounded-2xl border border-gray-100/50 space-y-2 text-sm font-medium">
                <div className="flex justify-between"><span className="text-gray-400">Clock In Time</span><span className="text-gray-800">{stats.checkIn ? new Date(stats.checkIn).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }) : '--:--'}</span></div>
                <div className="flex justify-between"><span className="text-gray-400">Clock Out Time</span><span className="text-gray-800">{stats.checkOut ? new Date(stats.checkOut).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }) : '--:--'}</span></div>
                <div className="flex justify-between"><span className="text-gray-400">Net Shift Hours</span><span className="text-gray-800 font-bold">{stats.hoursWorked}h</span></div>
              </div>
            </div>
            <div>
              <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Attendance History</div>
              <div className="space-y-2">
                {recentAttendance.length === 0 ? (
                  <p className="text-gray-400 text-xs">No records available</p>
                ) : (
                  recentAttendance.map((att) => (
                    <div key={att.id} className="flex items-center justify-between py-2 border-b border-gray-100/50 last:border-0 text-sm font-medium">
                      <span className="text-gray-500">{formatDate(att.date)}</span>
                      <span className={`badge ${getStatusColor(att.status)}`}>{att.status}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
