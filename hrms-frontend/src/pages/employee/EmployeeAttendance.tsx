import { useEffect, useState } from 'react';
import api from '../../api/axios';
import { formatDate, getStatusColor } from '../../lib/utils';
import { LogIn, LogOut, CheckCircle, AlertTriangle } from 'lucide-react';

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
        // If the latest record has no check_out, then the employee is checked in
        if (!latest.check_out) {
          setTodayAttendance(latest);
        } else {
          // If the latest record has check_out, check if it was checked in today
          const todayStr = new Date().toISOString().split('T')[0];
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

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">My Attendance</h2>
        <p className="text-gray-500">Track your daily check-in and check-out</p>
      </div>

      {/* Check In/Out Card */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl p-8 text-white">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <div className="text-6xl font-mono font-bold mb-2">
              {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
            </div>
            <div className="text-xl text-emerald-100">
              {currentTime.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            {!isCheckedIn && !isCheckedOut && (
              <button onClick={handleCheckIn} disabled={actionLoading} className="flex items-center justify-center gap-2 bg-white text-emerald-600 px-8 py-4 rounded-xl font-bold text-lg hover:bg-emerald-50 transition-colors disabled:opacity-50">
                <LogIn size={24} /> Check In
              </button>
            )}
            {isCheckedIn && (
              <>
                <div className="flex items-center justify-center gap-2 bg-emerald-500/20 border border-emerald-300/30 px-6 py-4 rounded-xl">
                  <CheckCircle size={20} />
                  <span className="font-semibold">Checked in at {new Date(todayAttendance.check_in).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}</span>
                </div>
                <button onClick={handleCheckOut} disabled={actionLoading} className="flex items-center justify-center gap-2 bg-red-500 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-red-600 transition-colors disabled:opacity-50">
                  <LogOut size={24} /> Check Out
                </button>
              </>
            )}
            {isCheckedOut && (
              <div className="flex items-center justify-center gap-2 bg-white/20 border border-white/30 px-6 py-4 rounded-xl">
                <CheckCircle size={20} />
                <span className="font-semibold">Day completed - {todayAttendance.total_hours}h worked</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {message.text && (
        <div className={`p-4 rounded-xl flex items-center gap-2 ${message.type === 'success' ? 'bg-emerald-50 border border-emerald-200 text-emerald-700' : 'bg-red-50 border border-red-200 text-red-700'}`}>
          {message.type === 'success' ? <CheckCircle size={18} /> : <AlertTriangle size={18} />}
          {message.text}
        </div>
      )}

      <div className="card overflow-hidden">
        <h3 className="text-lg font-semibold text-gray-800 p-6 pb-0">Attendance History</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="table-header">
                <th className="px-6 py-3">Date</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Check In</th>
                <th className="px-6 py-3">Check Out</th>
                <th className="px-6 py-3">Hours</th>
                <th className="px-6 py-3">Overtime</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {recentAttendance.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-400">No attendance records yet</td></tr>
              ) : recentAttendance.map((att) => (
                <tr key={att.id} className="hover:bg-gray-50">
                  <td className="table-cell font-medium">{formatDate(att.date)}</td>
                  <td className="table-cell"><span className={`badge ${getStatusColor(att.status)}`}>{att.status}</span></td>
                  <td className="table-cell">{att.check_in ? new Date(att.check_in).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }) : '-'}</td>
                  <td className="table-cell">{att.check_out ? new Date(att.check_out).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }) : '-'}</td>
                  <td className="table-cell">{att.total_hours || 0}h</td>
                  <td className="table-cell">{att.overtime_hours || 0}h</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
