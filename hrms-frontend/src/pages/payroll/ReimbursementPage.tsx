import { useEffect, useState } from 'react';
import api from '../../api/axios';
import type { Reimbursement } from '../../types';
import { formatDate, formatCurrency, getStatusColor } from '../../lib/utils';
import { CheckCircle, XCircle, Filter } from 'lucide-react';

export default function ReimbursementPage() {
  const [reimbursements, setReimbursements] = useState<Reimbursement[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectComment, setRejectComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { fetchReimbursements(); }, [statusFilter]);

  const fetchReimbursements = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);
      const res = await api.get('/payroll/reimbursements/', { params });
      setReimbursements(res.data.data);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const approveReimbursement = async (id: string) => {
    try {
      await api.post('/payroll/approve-reimbursement/', { reimbursement_id: id });
      fetchReimbursements();
    } catch (err) { console.error(err); }
  };

  const rejectReimbursement = async () => {
    if (!rejectId) return;
    setSubmitting(true);
    try {
      await api.post('/payroll/reject-reimbursement/', { reimbursement_id: rejectId, comments: rejectComment });
      setRejectId(null);
      setRejectComment('');
      fetchReimbursements();
    } catch (err) { console.error(err); } finally { setSubmitting(false); }
  };

  const totalPending = reimbursements.filter((r) => r.status === 'PENDING').reduce((sum, r) => sum + Number(r.amount), 0);
  const totalApproved = reimbursements.filter((r) => r.status === 'APPROVED').reduce((sum, r) => sum + Number(r.amount), 0);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Reimbursements</h2>
        <p className="text-gray-500">Manage employee expense reimbursement requests</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="stat-card">
          <span className="text-sm text-gray-500">Total Requests</span>
          <div className="text-2xl font-bold text-gray-800 mt-1">{reimbursements.length}</div>
        </div>
        <div className="stat-card">
          <span className="text-sm text-gray-500">Pending Amount</span>
          <div className="text-2xl font-bold text-amber-600 mt-1">{formatCurrency(totalPending)}</div>
        </div>
        <div className="stat-card">
          <span className="text-sm text-gray-500">Approved Amount</span>
          <div className="text-2xl font-bold text-emerald-600 mt-1">{formatCurrency(totalApproved)}</div>
        </div>
      </div>

      {/* Filter */}
      <div className="card">
        <div className="flex items-center gap-4">
          <Filter size={16} className="text-gray-400" />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="input-field w-48">
            <option value="">All Status</option>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="table-header">
                <th className="px-6 py-3">Employee</th>
                <th className="px-6 py-3">Expense Type</th>
                <th className="px-6 py-3">Amount</th>
                <th className="px-6 py-3">Description</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Date</th>
                <th className="px-6 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={7} className="px-6 py-12 text-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto" /></td></tr>
              ) : reimbursements.length === 0 ? (
                <tr><td colSpan={7} className="px-6 py-8 text-center text-gray-400">No reimbursement requests found</td></tr>
              ) : reimbursements.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="table-cell font-medium text-gray-800">{r.employee_name}</td>
                  <td className="table-cell">{r.expense_type}</td>
                  <td className="table-cell font-semibold">{formatCurrency(r.amount)}</td>
                  <td className="table-cell max-w-xs truncate text-gray-500">{r.description || '-'}</td>
                  <td className="table-cell"><span className={`badge ${getStatusColor(r.status)}`}>{r.status}</span></td>
                  <td className="table-cell">{formatDate(r.created_at)}</td>
                  <td className="table-cell">
                    {r.status === 'PENDING' && (
                      <div className="flex items-center gap-1">
                        <button onClick={() => approveReimbursement(r.id)} className="btn-success text-xs px-3 py-1.5 flex items-center gap-1">
                          <CheckCircle size={14} /> Approve
                        </button>
                        <button onClick={() => { setRejectId(r.id); setRejectComment(''); }} className="btn-danger text-xs px-3 py-1.5 flex items-center gap-1">
                          <XCircle size={14} /> Reject
                        </button>
                      </div>
                    )}
                    {r.status === 'REJECTED' && r.comments && (
                      <span className="text-xs text-gray-400" title={r.comments}>View note</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Reject Modal */}
      {rejectId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-800">Reject Reimbursement</h3>
              <button onClick={() => { setRejectId(null); setRejectComment(''); }} className="p-2 text-gray-400 hover:text-gray-600">
                <XCircle size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="label">Reason for Rejection</label>
                <textarea value={rejectComment} onChange={(e) => setRejectComment(e.target.value)} className="input-field" rows={3} placeholder="Enter reason for rejection..." />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button onClick={() => { setRejectId(null); setRejectComment(''); }} className="btn-secondary">Cancel</button>
                <button onClick={rejectReimbursement} disabled={submitting} className="btn-danger">
                  {submitting ? 'Rejecting...' : 'Reject'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
