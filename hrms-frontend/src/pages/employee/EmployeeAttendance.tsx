import { useEffect, useState } from 'react';
import api from '../../api/axios';
import { formatDate, getStatusColor } from '../../lib/utils';
import { LogIn, LogOut, CheckCircle, AlertTriangle, Sparkles, Clock, Calendar } from 'lucide-react';

export default function EmployeeAttendance() {
  const [todayAttendance, setTodayAttendance] = useState<any>(null);
  const [recentAttendance, setRecentAttendance] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    fetchAttendance();
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchAttendance = async () => {
    try {
      const [todayRes, monthlyRes] = await Promise.all([
        api.get('/attendance/records/'),
        api.get('/attendance/monthly/'),
      ]);
      const records = todayRes.data.data || todayRes.data.results || [];
      if (records.length > 0) {
        const latest = records[0];
        const todayStr = new Date().toISOString().split('T')[0];
        if (!latest.check_out) {
          setTodayAttendance(latest);
        } else {
          if (latest.date === todayStr) {
            setTodayAttendance(latest);
          } else {
            setTodayAttendance(null);
          }
        }
      } else {
        setTodayAttendance(null);
      }
      setRecentAttendance(monthlyRes.data.data?.attendances?.slice(0, 15) || []);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const handleCheckIn = async () => {
    setActionLoading(true);
    try {
      const res = await api.post('/attendance/check-in/');
      setMessage({ type: 'success', text: res.data.message });
      fetchAttendance();
    } catch (err: any) { setMessage({ type: 'error', text: err.response?.data?.message || 'Check-in failed' }); }
    finally { setActionLoading(false); }
  };

  const handleCheckOut = async () => {
    setActionLoading(true);
    try {
      const res = await api.post('/attendance/check-out/');
      setMessage({ type: 'success', text: res.data.message });
      fetchAttendance();
    } catch (err: any) { setMessage({ type: 'error', text: err.response?.data?.message || 'Check-out failed' }); }
    finally { setActionLoading(false); }
  };

  const isCheckedIn = todayAttendance?.check_in && !todayAttendance?.check_out;
  const isCheckedOut = todayAttendance?.check_out;

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#ea580c]" /></div>;

  return (
    <div className="space-y-8 p-1 sm:p-2">
      {/* Custom Styles for Interactive Hover List */}
      <style>{`
        .history-row {
          transition: all 0.2s ease-in-out;
        }
        .history-row:hover {
          background-color: rgba(250, 246, 237, 0.6);
          transform: translateX(2px);
        }
        @keyframes pulse-ring {
          0% { transform: scale(0.95); opacity: 0.5; }
          50% { transform: scale(1.1); opacity: 0.3; }
          100% { transform: scale(0.95); opacity: 0.5; }
        }
        .pulse-effect {
          animation: pulse-ring 3s infinite ease-in-out;
        }
      `}</style>

      {/* Title */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-[#ea580c] uppercase tracking-widest mb-1.5">
            <Sparkles size={14} /> Tracking Module
          </div>
          <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">My Attendance</h2>
          <p className="text-sm text-gray-500 font-medium mt-1">Clock in or clock out to record your daily working hours.</p>
        </div>
      </div>

      {/* Check In/Out Bento Card with Spatial Design */}
      <div className="bg-gradient-to-tr from-[#ea580c] to-[#f97316] rounded-3xl p-8 text-white relative overflow-hidden shadow-lg shadow-[#ea580c]/15">
        <div className="absolute -top-12 -right-12 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 relative z-10">
          <div>
            <div className="text-5xl font-black font-mono tracking-tight mb-2">
              {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
            </div>
            <div className="text-sm text-orange-100 font-bold uppercase tracking-widest flex items-center gap-2">
              <Calendar size={16} />
              {currentTime.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            {!isCheckedIn && !isCheckedOut && (
              <button 
                onClick={handleCheckIn} 
                disabled={actionLoading} 
                className="flex items-center justify-center gap-2 bg-white text-[#ea580c] px-8 py-4 rounded-2xl font-bold text-base hover:bg-orange-50 active:scale-[0.98] transition-all shadow-md cursor-pointer disabled:opacity-50"
              >
                <LogIn size={20} /> Check In
              </button>
            )}
            {isCheckedIn && (
              <>
                <div className="flex items-center justify-center gap-2.5 bg-white/10 border border-white/20 px-5 py-4 rounded-2xl">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-400"></span>
                  </span>
                  <span className="font-bold text-sm">Checked in at {new Date(todayAttendance.check_in).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}</span>
                </div>
                <button 
                  onClick={handleCheckOut} 
                  disabled={actionLoading} 
                  className="flex items-center justify-center gap-2 bg-[#dc2626] hover:bg-[#b91c1c] text-white px-8 py-4 rounded-2xl font-bold text-base active:scale-[0.98] transition-all shadow-md cursor-pointer disabled:opacity-50"
                >
                  <LogOut size={20} /> Check Out
                </button>
              </>
            )}
            {isCheckedOut && (
              <div className="flex items-center justify-center gap-2.5 bg-white/10 border border-white/20 px-6 py-4 rounded-2xl">
                <CheckCircle size={20} className="text-emerald-300" />
                <span className="font-bold text-sm">Day Completed - {todayAttendance.total_hours}h Tracked</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {message.text && (
        <div className={`p-4 rounded-2xl flex items-center gap-2.5 text-sm font-semibold border ${message.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'}`}>
          {message.type === 'success' ? <CheckCircle size={18} /> : <AlertTriangle size={18} />}
          {message.text}
        </div>
      )}

      {/* Attendance History Bento Card */}
      <div className="bg-white rounded-3xl border border-[#e8e1d5]/60 overflow-hidden shadow-[0_4px_20px_-2px_rgba(28,25,23,0.03)]">
        <h3 className="text-lg font-bold text-gray-900 p-6 pb-4 border-b border-gray-100 flex items-center gap-2">
          <Clock size={18} className="text-gray-400" /> Attendance logs & history
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="table-header">
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Check In</th>
                <th className="px-6 py-4">Check Out</th>
                <th className="px-6 py-4">Hours</th>
                <th className="px-6 py-4">Overtime</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {recentAttendance.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-400 text-sm font-medium">No attendance logs available</td></tr>
              ) : recentAttendance.map((att) => (
                <tr key={att.id} className="history-row">
                  <td className="table-cell font-bold text-slate-900">{formatDate(att.date)}</td>
                  <td className="table-cell"><span className={`badge ${getStatusColor(att.status)}`}>{att.status}</span></td>
                  <td className="table-cell text-slate-500 font-semibold">{att.check_in ? new Date(att.check_in).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }) : '-'}</td>
                  <td className="table-cell text-slate-500 font-semibold">{att.check_out ? new Date(att.check_out).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }) : '-'}</td>
                  <td className="table-cell text-slate-800 font-bold">{att.total_hours || 0}h</td>
                  <td className="table-cell text-slate-800 font-semibold">{att.overtime_hours || 0}h</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
