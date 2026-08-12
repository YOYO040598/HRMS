import { useEffect, useState } from 'react';
import api from '../../api/axios';
import type { LeaveApplication, LeaveBalance, LeaveType } from '../../types';
import { formatDate } from '../../lib/utils';
import { Plus, Clock, XCircle, Trash2, Sparkles, CalendarDays } from 'lucide-react';

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
      window.dispatchEvent(new Event('leave-submitted'));
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

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#14B8A6]" /></div>;

  return (
    <div className="space-y-8 p-1 sm:p-2 text-[#F8FAFC]">
      {/* Custom Styles */}
      <style>{`
        .glass-card-premium {
          background: rgba(13, 23, 40, 0.72);
          backdrop-filter: blur(18px);
          -webkit-backdrop-filter: blur(18px);
          border: 1px solid rgba(148, 163, 184, 0.12);
        }
        .bento-card {
          transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .bento-card:hover {
          transform: translateY(-5px);
          border-color: rgba(20, 184, 166, 0.3) !important;
          box-shadow: 0 10px 25px -5px rgba(20, 184, 166, 0.1);
        }
        .history-row {
          transition: all 0.2s ease-in-out;
        }
        .history-row:hover {
          background-color: rgba(20, 184, 166, 0.08);
        }
      `}</style>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-[#2DD4BF] uppercase tracking-widest mb-1.5">
            <Sparkles size={14} /> Leave Management
          </div>
          <h2 className="text-3xl font-extrabold text-[#F8FAFC] tracking-tight">My Leaves</h2>
          <p className="text-sm text-[#94A3B8] font-medium mt-1">Submit new leave applications and monitor your balance.</p>
        </div>
        <button 
          onClick={() => setShowForm(true)} 
          className="bg-gradient-to-r from-[#14B8A6] to-[#2DD4BF] text-[#060B16] font-bold px-6 py-3 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 text-sm cursor-pointer border-none self-start sm:self-center"
        >
          <Plus size={18} /> Apply Leave
        </button>
      </div>

      {/* Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {balances.map((bal) => (
          <div key={bal.id} className="bento-card glass-card-premium rounded-3xl p-6 flex flex-col justify-between min-h-[160px] border border-[#1D3045]/40">
            <div>
              <div className="text-xs font-bold text-[#94A3B8] uppercase tracking-wider mb-1">{bal.leave_type_name}</div>
              <div className="text-3xl font-black text-[#F8FAFC]">{bal.available_days} <span className="text-xs font-semibold text-[#94A3B8]">days left</span></div>
            </div>
            <div>
              <div className="w-full bg-[#1D3045]/40 rounded-full h-1.5 mt-4 overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-[#14B8A6] to-[#2DD4BF] h-1.5 rounded-full transition-all duration-500 progress-bar-glow" 
                  style={{ width: `${Math.max(0, Math.min(100, (Number(bal.used_days) / Number(bal.total_days)) * 100))}%` }} 
                />
              </div>
              <div className="flex justify-between text-[10px] font-bold text-[#94A3B8] uppercase mt-2">
                <span>Used: {bal.used_days} / {bal.total_days}</span>
                <span className="text-[#2DD4BF]">Pending: {bal.pending_days}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Apply Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-[#060B16]/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-[#0D1728] rounded-3xl w-full max-w-lg p-8 shadow-2xl border border-[#1D3045]">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-black text-[#F8FAFC] tracking-tight flex items-center gap-2">
                <CalendarDays className="text-[#2DD4BF]" /> Request Time Off
              </h3>
              <button onClick={() => setShowForm(false)} className="text-[#94A3B8] hover:text-[#F8FAFC] transition-colors cursor-pointer border-none bg-transparent"><XCircle size={24} /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-1.5 text-left">
                <label className="text-[11px] font-bold uppercase tracking-wider text-[#94A3B8]">Leave Type</label>
                <select value={form.leave_type} onChange={(e) => setForm({ ...form, leave_type: e.target.value })} className="w-full bg-[#111D30] border border-[#1D3045] rounded-xl px-4 py-3 text-xs text-[#F8FAFC] font-semibold focus:outline-none focus:border-[#2DD4BF]/50 cursor-pointer" required>
                  <option value="" className="bg-[#0D1728]">Select leave type</option>
                  {leaveTypes.map((lt) => <option key={lt.id} value={lt.id} className="bg-[#0D1728]">{lt.name} ({lt.days_per_year} days/year)</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5 text-left">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-[#94A3B8]">Start Date</label>
                  <input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} className="w-full bg-[#111D30] border border-[#1D3045] rounded-xl px-4 py-3 text-xs text-[#F8FAFC] font-semibold focus:outline-none focus:border-[#2DD4BF]/50 cursor-pointer" required />
                </div>
                <div className="space-y-1.5 text-left">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-[#94A3B8]">End Date</label>
                  <input type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} className="w-full bg-[#111D30] border border-[#1D3045] rounded-xl px-4 py-3 text-xs text-[#F8FAFC] font-semibold focus:outline-none focus:border-[#2DD4BF]/50 cursor-pointer" required />
                </div>
              </div>
              <div className="space-y-1.5 text-left">
                <label className="text-[11px] font-bold uppercase tracking-wider text-[#94A3B8]">Reason</label>
                <textarea value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} className="w-full bg-[#111D30] border border-[#1D3045] rounded-xl px-4 py-3 text-xs text-[#F8FAFC] font-semibold focus:outline-none focus:border-[#2DD4BF]/50" rows={3} placeholder="Provide details about your leave application" required />
              </div>
              <div className="flex items-center gap-2 py-1">
                <input 
                  type="checkbox" 
                  id="emergency" 
                  checked={form.is_emergency} 
                  onChange={(e) => setForm({ ...form, is_emergency: e.target.checked })} 
                  className="w-4 h-4 text-[#14B8A6] focus:ring-[#14B8A6]/20 border-[#1D3045] bg-[#111D30] rounded cursor-pointer" 
                />
                <label htmlFor="emergency" className="text-xs font-bold uppercase tracking-wider text-[#94A3B8] cursor-pointer">This is an emergency leave</label>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 bg-transparent border border-[#1D3045] hover:bg-[#111D30] text-[#94A3B8] font-bold py-3 rounded-xl transition-all cursor-pointer">Cancel</button>
                <button type="submit" disabled={submitting} className="bg-[#14B8A6] hover:bg-[#0d9488] text-[#060B16] font-bold py-3 rounded-xl transition-all shadow-md flex-1 flex items-center justify-center gap-2 text-sm cursor-pointer border-none">
                  {submitting ? <><Clock size={16} className="animate-spin" /> Processing...</> : 'Submit Application'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Applications Table Bento */}
      <div className="glass-card-premium rounded-3xl border border-[#1D3045]/40 overflow-hidden shadow-lg">
        <h3 className="text-lg font-bold text-[#F8FAFC] p-6 pb-4 border-b border-[#1D3045]/40 flex items-center gap-2">
          <Clock size={18} className="text-[#94A3B8]" /> My Leave Requests
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#1D3045]/40 text-left text-xs font-bold text-[#94A3B8] uppercase tracking-wider">
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
            <tbody className="divide-y divide-[#1D3045]/20 text-xs text-[#F8FAFC]">
              {applications.length === 0 ? (
                <tr><td colSpan={9} className="px-6 py-12 text-center text-[#64748B] text-sm font-medium">No leave requests found</td></tr>
              ) : applications.map((app) => (
                <tr key={app.id} className="history-row">
                  <td className="px-6 py-4 font-bold text-[#F8FAFC]">{app.leave_type_name}</td>
                  <td className="px-6 py-4 font-semibold text-[#94A3B8]">{formatDate(app.start_date)}</td>
                  <td className="px-6 py-4 font-semibold text-[#94A3B8]">{formatDate(app.end_date)}</td>
                  <td className="px-6 py-4 font-bold text-[#F8FAFC]">{app.total_days}</td>
                  <td className="px-6 py-4 max-w-[200px]">
                    <div className="truncate text-xs font-semibold text-[#94A3B8]" title={app.reason || ''}>
                      {app.reason || <span className="text-[#64748B] italic font-medium">-</span>}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold ${
                      app.status === 'APPROVED' ? 'bg-[#14B8A6]/10 text-[#2DD4BF] border border-[#14B8A6]/20' :
                      app.status === 'PENDING' ? 'bg-[#F59E0B]/10 text-[#F59E0B] border border-[#F59E0B]/20' :
                      'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                    }`}>{app.status}</span>
                  </td>
                  <td className="px-6 py-4 text-xs font-bold text-[#94A3B8]">{app.is_emergency ? 'Yes' : 'No'}</td>
                  <td className="px-6 py-4 text-[11px] font-bold text-[#64748B]">{formatDate(app.applied_at)}</td>
                  <td className="px-6 py-4">
                    {app.status === 'PENDING' && (
                      <button
                        onClick={() => handleCancel(app.id)}
                        className="text-rose-400 hover:text-rose-300 p-1.5 rounded-lg hover:bg-rose-500/10 transition-colors cursor-pointer border-none bg-transparent"
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
