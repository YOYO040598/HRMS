import { useEffect, useState } from 'react';
import api from '../../api/axios';
import { useAppSelector } from '../../hooks/useRedux';
import { formatDate, getStatusColor } from '../../lib/utils';
import { Clock, CalendarDays, Wallet, TrendingUp, LogIn, LogOut } from 'lucide-react';

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
        // If it is active (no check_out) or belongs to today
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
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Welcome back, {user?.first_name}!</h2>
        <p className="text-gray-500">Here's your overview for today</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="stat-card">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center"><Clock size={20} className="text-emerald-600" /></div>
            <span className="text-sm text-gray-500">Today's Status</span>
          </div>
          <div className="text-2xl font-bold text-gray-800">{stats.todayStatus || 'Not Checked In'}</div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center"><TrendingUp size={20} className="text-blue-600" /></div>
            <span className="text-sm text-gray-500">Hours Today</span>
          </div>
          <div className="text-2xl font-bold text-gray-800">{stats.hoursWorked}h</div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center"><CalendarDays size={20} className="text-amber-600" /></div>
            <span className="text-sm text-gray-500">Leaves Used</span>
          </div>
          <div className="text-2xl font-bold text-gray-800">{stats.usedLeaves}</div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center"><CalendarDays size={20} className="text-purple-600" /></div>
            <span className="text-sm text-gray-500">Pending Leaves</span>
          </div>
          <div className="text-2xl font-bold text-gray-800">{stats.pendingLeaves}</div>
        </div>
      </div>

      {/* Today's Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Today's Attendance</h3>
          <div className="space-y-3">
            <div className="flex justify-between"><span className="text-gray-500">Check In</span><span className="font-medium">{stats.checkIn ? new Date(stats.checkIn).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }) : '--:--'}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Check Out</span><span className="font-medium">{stats.checkOut ? new Date(stats.checkOut).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }) : '--:--'}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Hours Worked</span><span className="font-medium">{stats.hoursWorked}h</span></div>
          </div>
        </div>

        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Attendance</h3>
          <div className="space-y-2">
            {recentAttendance.length === 0 ? <p className="text-gray-400 text-sm">No records</p> : recentAttendance.map((att) => (
              <div key={att.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <span className="text-sm text-gray-600">{formatDate(att.date)}</span>
                <span className={`badge ${getStatusColor(att.status)}`}>{att.status}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
