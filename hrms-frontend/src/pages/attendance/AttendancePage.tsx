import { useEffect, useState } from 'react';
import api from '../../api/axios';
import type { Attendance } from '../../types';
import { formatDate, getStatusColor } from '../../lib/utils';
import { LogIn, LogOut, Clock, CheckCircle, AlertTriangle } from 'lucide-react';

export default function AttendancePage() {
  const [todayAttendance, setTodayAttendance] = useState<Attendance | null>(null);
  const [recentAttendance, setRecentAttendance] = useState<Attendance[]>([]);
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
        api.get('/attendance/records/', { params: { date: new Date().toISOString().split('T')[0] } }),
        api.get('/attendance/monthly/'),
      ]);
      const todayRecords = todayRes.data.data;
      if (todayRecords.length > 0) {
        setTodayAttendance(todayRecords[0]);
      }
      setRecentAttendance(monthlyRes.data.data?.attendances?.slice(0, 10) || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async () => {
    setActionLoading(true);
    try {
      const res = await api.post('/attendance/check-in/');
      setMessage({ type: 'success', text: res.data.message });
      fetchAttendance();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Check-in failed' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleCheckOut = async () => {
    setActionLoading(true);
    try {
      const res = await api.post('/attendance/check-out/');
      setMessage({ type: 'success', text: res.data.message });
      fetchAttendance();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Check-out failed' });
    } finally {
      setActionLoading(false);
    }
  };

  const isCheckedIn = todayAttendance?.check_in && !todayAttendance?.check_out;
  const isCheckedOut = todayAttendance?.check_out;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Attendance</h2>
        <p className="text-gray-500">Track your daily attendance</p>
      </div>

      {/* Check In/Out Card */}
      <div className="bg-gradient-to-tr from-[#ea580c] to-[#f97316] rounded-2xl p-8 text-white shadow-lg shadow-orange-500/10">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <div className="text-6xl font-mono font-bold mb-2">
              {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
            </div>
            <div className="text-xl text-orange-100">
              {currentTime.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            {!isCheckedIn && !isCheckedOut && (
              <button onClick={handleCheckIn} disabled={actionLoading} className="flex items-center justify-center gap-2 bg-white text-[#ea580c] px-8 py-4 rounded-xl font-bold text-lg hover:bg-orange-50 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50">
                <LogIn size={24} /> Check In
              </button>
            )}
            {isCheckedIn && (
              <>
                <div className="flex items-center justify-center gap-2 bg-white/10 border border-white/20 px-6 py-4 rounded-xl">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-400"></span>
                  </span>
                  <span className="font-semibold ml-2">Checked in at {new Date(todayAttendance!.check_in!).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}</span>
                </div>
                <button onClick={handleCheckOut} disabled={actionLoading} className="flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white px-8 py-4 rounded-xl font-bold text-lg active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50">
                  <LogOut size={24} /> Check Out
                </button>
              </>
            )}
            {isCheckedOut && (
              <div className="flex items-center justify-center gap-2 bg-white/20 border border-white/30 px-6 py-4 rounded-xl">
                <CheckCircle size={20} className="text-emerald-300" />
                <span className="font-semibold">Day completed - {todayAttendance!.total_hours}h worked</span>
              </div>
            )}
          </div>
        </div>

        {todayAttendance && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
            <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
              <div className="text-sm text-orange-200">Status</div>
              <div className="font-bold text-lg">{todayAttendance.status}</div>
            </div>
            <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
              <div className="text-sm text-orange-200">Hours Worked</div>
              <div className="font-bold text-lg">{todayAttendance.total_hours || 0}h</div>
            </div>
            <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
              <div className="text-sm text-orange-200">Overtime</div>
              <div className="font-bold text-lg">{todayAttendance.overtime_hours || 0}h</div>
            </div>
            <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
              <div className="text-sm text-orange-200">Check Out</div>
              <div className="font-bold text-lg">
                {todayAttendance.check_out
                  ? new Date(todayAttendance.check_out).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
                  : '--:--'}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Message */}
      {message.text && (
        <div className={`p-4 rounded-xl flex items-center gap-2 ${message.type === 'success' ? 'bg-emerald-50 border border-emerald-200 text-emerald-700' : 'bg-red-50 border border-red-200 text-red-700'}`}>
          {message.type === 'success' ? <CheckCircle size={18} /> : <AlertTriangle size={18} />}
          {message.text}
        </div>
      )}

      {/* Recent Attendance */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Attendance</h3>
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
