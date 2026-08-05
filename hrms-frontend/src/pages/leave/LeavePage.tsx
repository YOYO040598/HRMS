import { useEffect, useState } from 'react';
import api from '../../api/axios';
import type { LeaveApplication, LeaveBalance, LeaveType } from '../../types';
import { formatDate, getStatusColor } from '../../lib/utils';
import { CalendarDays, Plus, Clock, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

export default function LeavePage() {
  const [applications, setApplications] = useState<LeaveApplication[]>([]);
  const [balances, setBalances] = useState<LeaveBalance[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ leave_type: '', start_date: '', end_date: '', reason: '', is_emergency: false });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [appsRes, balRes, typesRes] = await Promise.all([
        api.get('/leave/applications/'),
        api.get('/leave/balance-summary/'),
        api.get('/leave/types/'),
      ]);
      setApplications(appsRes.data.data);
      setBalances(balRes.data.data);
      setLeaveTypes(typesRes.data.data);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/leave/apply/', form);
      setShowForm(false);
      setForm({ leave_type: '', start_date: '', end_date: '', reason: '', is_emergency: false });
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to submit');
    } finally { setSubmitting(false); }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Leave Management</h2>
          <p className="text-gray-500">Apply for leave and track your balance</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-2"><Plus size={18} /> Apply Leave</button>
      </div>

      {/* Leave Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {balances.map((bal) => (
          <div key={bal.id} className="card">
            <div className="text-sm text-gray-500 mb-1">{bal.leave_type_name}</div>
            <div className="flex items-end justify-between">
              <div className="text-3xl font-bold text-gray-800">{bal.available_days}</div>
              <div className="text-sm text-gray-400">of {bal.total_days} days</div>
            </div>
            <div className="mt-3 w-full bg-gray-200 rounded-full h-2">
              <div className="bg-indigo-500 h-2 rounded-full transition-all" style={{ width: `${Math.max(0, (Number(bal.used_days) / Number(bal.total_days)) * 100)}%` }} />
            </div>
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>Used: {bal.used_days}</span>
              <span>Pending: {bal.pending_days}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Apply Leave Form */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-800">Apply for Leave</h3>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600"><XCircle size={24} /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">Leave Type</label>
                <select value={form.leave_type} onChange={(e) => setForm({ ...form, leave_type: e.target.value })} className="input-field" required>
                  <option value="">Select leave type</option>
                  {leaveTypes.map((lt) => <option key={lt.id} value={lt.id}>{lt.name} ({lt.days_per_year} days/year)</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Start Date</label>
                  <input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} className="input-field" required />
                </div>
                <div>
                  <label className="label">End Date</label>
                  <input type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} className="input-field" required />
                </div>
              </div>
              <div>
                <label className="label">Reason</label>
                <textarea value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} className="input-field" rows={3} placeholder="Enter reason for leave" required />
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="emergency" checked={form.is_emergency} onChange={(e) => setForm({ ...form, is_emergency: e.target.checked })} className="w-4 h-4 text-indigo-600 rounded" />
                <label htmlFor="emergency" className="text-sm text-gray-600">Emergency leave</label>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" disabled={submitting} className="btn-primary flex-1 flex items-center justify-center gap-2">
                  {submitting ? <><Clock size={16} className="animate-spin" /> Submitting...</> : 'Submit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Applications Table */}
      <div className="card overflow-hidden">
        <h3 className="text-lg font-semibold text-gray-800 p-6 pb-0">Leave Applications</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="table-header">
                <th className="px-6 py-3">Type</th>
                <th className="px-6 py-3">From</th>
                <th className="px-6 py-3">To</th>
                <th className="px-6 py-3">Days</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Emergency</th>
                <th className="px-6 py-3">Applied</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {applications.length === 0 ? (
                <tr><td colSpan={7} className="px-6 py-8 text-center text-gray-400">No leave applications yet</td></tr>
              ) : applications.map((app) => (
                <tr key={app.id} className="hover:bg-gray-50">
                  <td className="table-cell font-medium">{app.leave_type_name}</td>
                  <td className="table-cell">{formatDate(app.start_date)}</td>
                  <td className="table-cell">{formatDate(app.end_date)}</td>
                  <td className="table-cell">{app.total_days}</td>
                  <td className="table-cell"><span className={`badge ${getStatusColor(app.status)}`}>{app.status}</span></td>
                  <td className="table-cell">{app.is_emergency ? 'Yes' : 'No'}</td>
                  <td className="table-cell text-gray-400">{formatDate(app.applied_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
