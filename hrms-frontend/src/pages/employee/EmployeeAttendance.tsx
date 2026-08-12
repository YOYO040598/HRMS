import { useEffect, useState } from 'react';
import api from '../../api/axios';
import { formatDate } from '../../lib/utils';
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
          // Trigger correct pose on load if currently checked in
          if (latest.date === todayStr && latest.check_in) {
            const [h, m] = latest.check_in.split(':').map(Number);
            if (h > 9 || (h === 9 && m > 0)) {
              window.dispatchEvent(new Event('attendance-late'));
            } else {
              window.dispatchEvent(new Event('attendance-success'));
            }
          } else {
            window.dispatchEvent(new Event('attendance-ready'));
          }
        } else {
          if (latest.date === todayStr) {
            setTodayAttendance(latest);
          } else {
            setTodayAttendance(null);
            window.dispatchEvent(new Event('attendance-ready'));
          }
        }
      } else {
        setTodayAttendance(null);
        window.dispatchEvent(new Event('attendance-ready'));
      }
      setRecentAttendance(monthlyRes.data.data?.attendances?.slice(0, 15) || []);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const handleCheckIn = async () => {
    setActionLoading(true);
    try {
      const res = await api.post('/attendance/check-in/');
      setMessage({ type: 'success', text: res.data.message });
      
      const now = new Date();
      const currentHour = now.getHours();
      const currentMin = now.getMinutes();
      if (currentHour > 9 || (currentHour === 9 && currentMin > 0)) {
        window.dispatchEvent(new Event('attendance-late'));
      } else {
        window.dispatchEvent(new Event('attendance-success'));
      }

      fetchAttendance();
    } catch (err: any) { setMessage({ type: 'error', text: err.response?.data?.message || 'Check-in failed' }); }
    finally { setActionLoading(false); }
  };

  const handleCheckOut = async () => {
    setActionLoading(true);
    try {
      const res = await api.post('/attendance/check-out/');
      setMessage({ type: 'success', text: res.data.message });
      window.dispatchEvent(new Event('mascot-wave'));
      fetchAttendance();
    } catch (err: any) { setMessage({ type: 'error', text: err.response?.data?.message || 'Check-out failed' }); }
    finally { setActionLoading(false); }
  };

  const isCheckedIn = todayAttendance?.check_in && !todayAttendance?.check_out;
  const isCheckedOut = todayAttendance?.check_out;

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#14B8A6]" /></div>;

  return (
    <div className="space-y-8 p-1 sm:p-2 text-[#F8FAFC]">
      {/* Custom Styles for Interactive Hover List */}
      <style>{`
        .glass-card-premium {
          background: rgba(13, 23, 40, 0.72);
          backdrop-filter: blur(18px);
          -webkit-backdrop-filter: blur(18px);
          border: 1px solid rgba(148, 163, 184, 0.12);
        }
        .history-row {
          transition: all 0.2s ease-in-out;
        }
        .history-row:hover {
          background-color: rgba(20, 184, 166, 0.08);
        }
      `}</style>

      {/* Title */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-[#2DD4BF] uppercase tracking-widest mb-1.5">
            <Sparkles size={14} /> Tracking Module
          </div>
          <h2 className="text-3xl font-extrabold text-[#F8FAFC] tracking-tight">My Attendance</h2>
          <p className="text-sm text-[#94A3B8] font-medium mt-1">Clock in or clock out to record your daily working hours.</p>
        </div>
      </div>

      {/* Check In/Out Bento Card with Spatial Design */}
      <div className="glass-card-premium rounded-3xl p-8 text-[#F8FAFC] relative overflow-hidden shadow-lg border border-[#1D3045]/40">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 relative z-10">
          <div>
            <div className="text-5xl font-black font-mono tracking-tight mb-2 text-[#F8FAFC]">
              {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
            </div>
            <div className="text-sm text-[#94A3B8] font-bold uppercase tracking-widest flex items-center gap-2">
              <Calendar size={16} className="text-[#2DD4BF]" />
              {currentTime.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            {!isCheckedIn && !isCheckedOut && (
              <button 
                onClick={handleCheckIn} 
                disabled={actionLoading} 
                className="flex items-center justify-center gap-2 bg-gradient-to-r from-[#14B8A6] to-[#2DD4BF] text-[#060B16] px-8 py-4 rounded-2xl font-bold text-base hover:opacity-90 active:scale-[0.98] transition-all shadow-md cursor-pointer border-none"
              >
                <LogIn size={20} /> Check In
              </button>
            )}
            {isCheckedIn && (
              <>
                <div className="flex items-center justify-center gap-2.5 bg-[#14B8A6]/10 border border-[#14B8A6]/20 px-5 py-4 rounded-2xl text-[#2DD4BF]">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#2DD4BF] opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-[#2DD4BF]"></span>
                  </span>
                  <span className="font-bold text-sm">Checked in at {new Date(todayAttendance.check_in).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}</span>
                </div>
                <button 
                  onClick={handleCheckOut} 
                  disabled={actionLoading} 
                  className="flex items-center justify-center gap-2 bg-rose-600 hover:bg-rose-700 text-white px-8 py-4 rounded-2xl font-bold text-base active:scale-[0.98] transition-all shadow-md cursor-pointer border-none"
                >
                  <LogOut size={20} /> Check Out
                </button>
              </>
            )}
            {isCheckedOut && (
              <div className="flex items-center justify-center gap-2.5 bg-[#14B8A6]/15 border border-[#14B8A6]/25 px-6 py-4 rounded-2xl text-[#2DD4BF]">
                <CheckCircle size={20} />
                <span className="font-bold text-sm">Day Completed - {todayAttendance.total_hours}h Tracked</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {message.text && (
        <div className={`p-4 rounded-2xl flex items-center gap-2.5 text-sm font-semibold border ${message.type === 'success' ? 'bg-[#14B8A6]/10 border-[#14B8A6]/25 text-[#2DD4BF]' : 'bg-rose-500/10 border-rose-500/20 text-rose-400'}`}>
          {message.type === 'success' ? <CheckCircle size={18} /> : <AlertTriangle size={18} />}
          {message.text}
        </div>
      )}

      {/* Attendance History Bento Card */}
      <div className="glass-card-premium rounded-3xl border border-[#1D3045]/40 overflow-hidden shadow-lg">
        <h3 className="text-lg font-bold text-[#F8FAFC] p-6 pb-4 border-b border-[#1D3045]/40 flex items-center gap-2">
          <Clock size={18} className="text-[#94A3B8]" /> Attendance logs & history
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#1D3045]/40 text-left text-xs font-bold text-[#94A3B8] uppercase tracking-wider">
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Check In</th>
                <th className="px-6 py-4">Check Out</th>
                <th className="px-6 py-4">Hours</th>
                <th className="px-6 py-4">Overtime</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1D3045]/20 text-xs text-[#F8FAFC]">
              {recentAttendance.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-[#64748B] text-sm font-medium">No attendance logs available</td></tr>
              ) : recentAttendance.map((att) => (
                <tr key={att.id} className="history-row">
                  <td className="px-6 py-4 font-bold text-[#F8FAFC]">{formatDate(att.date)}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold ${
                      att.status === 'PRESENT' ? 'bg-[#14B8A6]/10 text-[#2DD4BF] border border-[#14B8A6]/20' : 'bg-[#1D3045]/30 text-[#94A3B8] border border-[#1D3045]/40'
                    }`}>{att.status}</span>
                  </td>
                  <td className="px-6 py-4 text-[#94A3B8] font-semibold">{att.check_in ? new Date(att.check_in).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }) : '-'}</td>
                  <td className="px-6 py-4 text-[#94A3B8] font-semibold">{att.check_out ? new Date(att.check_out).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }) : '-'}</td>
                  <td className="px-6 py-4 text-[#F8FAFC] font-bold">{att.total_hours || 0}h</td>
                  <td className="px-6 py-4 text-[#94A3B8] font-semibold">{att.overtime_hours || 0}h</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
