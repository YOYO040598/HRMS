import { useEffect, useState } from 'react';
import api from '../../api/axios';
import type { LeaveApplication, LeaveBalance, LeaveType } from '../../types';
import { formatDate, getStatusColor } from '../../lib/utils';
import { Plus, Clock, CheckCircle, XCircle, Trash2, Sparkles, CalendarDays } from 'lucide-react';

export default function EmployeeLeave() {
  const [applications, setApplications] = useState<LeaveApplication[]>([]);
  const [balances, setBalances] = useState<LeaveBalance[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ leave_type: '', start_date: '', end_date: '', reason: '', is_emergency: false });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [appsRes, typesRes] = await Promise.all([
        api.get('/leave/applications/'),
        api.get('/leave/types/'),
      ]);
      setApplications(appsRes.data.data);
      setLeaveTypes(typesRes.data.data);
    } catch (err) { console.error(err); }
    try {
      const balRes = await api.get('/leave/balance-summary/');
      setBalances(balRes.data.data);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/leave/apply/', form);
      setShowForm(false);
      setForm({ leave_type: '', start_date: '', end_date: '', reason: '', is_emergency: false });
      fetchData();
    } catch (err: any) { alert(err.response?.data?.message || 'Failed to submit'); }
    finally { setSubmitting(false); }
  };

  const handleCancel = async (appId: string) => {
    if (!confirm('Are you sure you want to cancel this leave request?')) return;
    try {
      await api.post('/leave/cancel/', { application_id: appId });
      fetchData();
    } catch (err: any) { alert(err.response?.data?.message || 'Failed to cancel'); }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#ea580c]" /></div>;

  return (
    <div className="space-y-8 p-1 sm:p-2">
      {/* Custom Styles */}
      <style>{`
        .bento-card {
          transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
          border: 1px solid rgba(226, 232, 240, 0.6);
        }
        .bento-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 20px 40px -10px rgba(0, 0, 0, 0.05), 0 10px 20px -10px rgba(234, 88, 12, 0.05);
          border-color: rgba(234, 88, 12, 0.3);
        }
        .history-row {
          transition: all 0.2s ease-in-out;
        }
        .history-row:hover {
          background-color: rgba(250, 246, 237, 0.6);
          transform: translateX(2px);
        }
      `}</style>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-[#ea580c] uppercase tracking-widest mb-1.5">
            <Sparkles size={14} /> Leave Management
          </div>
          <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">My Leaves</h2>
          <p className="text-sm text-gray-500 font-medium mt-1">Submit new leave applications and monitor your balance.</p>
        </div>
        <button 
          onClick={() => setShowForm(true)} 
          className="btn-primary flex items-center justify-center gap-2 px-6 py-3 cursor-pointer self-start sm:self-center"
        >
          <Plus size={18} /> Apply Leave
        </button>
      </div>

      {/* Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {balances.map((bal) => (
          <div key={bal.id} className="bento-card bg-white rounded-3xl p-6 flex flex-col justify-between min-h-[160px]">
            <div>
              <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">{bal.leave_type_name}</div>
              <div className="text-3xl font-black text-gray-900">{bal.available_days} <span className="text-xs font-semibold text-gray-400">days left</span></div>
            </div>
            <div>
              <div className="w-full bg-gray-100 rounded-full h-1.5 mt-4 overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-orange-500 to-[#ea580c] h-1.5 rounded-full transition-all duration-500" 
                  style={{ width: `${Math.max(0, Math.min(100, (Number(bal.used_days) / Number(bal.total_days)) * 100))}%` }} 
                />
              </div>
              <div className="flex justify-between text-[10px] font-bold text-gray-400 uppercase mt-2">
                <span>Used: {bal.used_days} / {bal.total_days}</span>
                <span className="text-amber-600">Pending: {bal.pending_days}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Apply Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-3xl w-full max-w-lg p-8 shadow-2xl border border-[#e8e1d5]/60">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
                <CalendarDays className="text-[#ea580c]" /> Request Time Off
              </h3>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"><XCircle size={24} /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-1.5">
                <label className="label">Leave Type</label>
                <select value={form.leave_type} onChange={(e) => setForm({ ...form, leave_type: e.target.value })} className="input-field cursor-pointer" required>
                  <option value="">Select leave type</option>
                  {leaveTypes.map((lt) => <option key={lt.id} value={lt.id}>{lt.name} ({lt.days_per_year} days/year)</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="label">Start Date</label>
                  <input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} className="input-field cursor-pointer" required />
                </div>
                <div className="space-y-1.5">
                  <label className="label">End Date</label>
                  <input type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} className="input-field cursor-pointer" required />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="label">Reason</label>
                <textarea value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} className="input-field" rows={3} placeholder="Provide details about your leave application" required />
              </div>
              <div className="flex items-center gap-2 py-1">
                <input 
                  type="checkbox" 
                  id="emergency" 
                  checked={form.is_emergency} 
                  onChange={(e) => setForm({ ...form, is_emergency: e.target.checked })} 
                  className="w-4 h-4 text-[#ea580c] focus:ring-[#ea580c] border-[#e8e1d5] rounded cursor-pointer" 
                />
                <label htmlFor="emergency" className="text-xs font-bold uppercase tracking-wider text-gray-500 cursor-pointer">This is an emergency leave</label>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" disabled={submitting} className="btn-primary flex-1 flex items-center justify-center gap-2">
                  {submitting ? <><Clock size={16} className="animate-spin" /> Processing...</> : 'Submit Application'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Applications Table Bento */}
      <div className="bg-white rounded-3xl border border-[#e8e1d5]/60 overflow-hidden shadow-[0_4px_20px_-2px_rgba(28,25,23,0.03)]">
        <h3 className="text-lg font-bold text-gray-900 p-6 pb-4 border-b border-gray-100 flex items-center gap-2">
          <Clock size={18} className="text-gray-400" /> My Leave Requests
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="table-header">
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">From</th>
                <th className="px-6 py-4">To</th>
                <th className="px-6 py-4">Days</th>
                <th className="px-6 py-4">Reason</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Emergency</th>
                <th className="px-6 py-4">Applied</th>
                <th className="px-6 py-4">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {applications.length === 0 ? (
                <tr><td colSpan={9} className="px-6 py-12 text-center text-gray-400 text-sm font-medium">No leave requests found</td></tr>
              ) : applications.map((app) => (
                <tr key={app.id} className="history-row">
                  <td className="table-cell font-bold text-slate-900">{app.leave_type_name}</td>
                  <td className="table-cell font-semibold text-slate-500">{formatDate(app.start_date)}</td>
                  <td className="table-cell font-semibold text-slate-500">{formatDate(app.end_date)}</td>
                  <td className="table-cell font-bold text-slate-800">{app.total_days}</td>
                  <td className="table-cell max-w-[200px]">
                    <div className="truncate text-xs font-semibold text-slate-600" title={app.reason || ''}>
                      {app.reason || <span className="text-gray-400 italic font-medium">-</span>}
                    </div>
                  </td>
                  <td className="table-cell"><span className={`badge ${getStatusColor(app.status)}`}>{app.status}</span></td>
                  <td className="table-cell text-xs font-bold text-slate-500">{app.is_emergency ? 'Yes' : 'No'}</td>
                  <td className="table-cell text-[11px] font-bold text-gray-400">{formatDate(app.applied_at)}</td>
                  <td className="table-cell">
                    {app.status === 'PENDING' && (
                      <button
                        onClick={() => handleCancel(app.id)}
                        className="text-[#dc2626] hover:text-[#b91c1c] p-1.5 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Cancel Leave"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
