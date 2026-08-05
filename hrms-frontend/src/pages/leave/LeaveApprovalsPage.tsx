import { useEffect, useState } from 'react';
import api from '../../api/axios';
import type { LeaveApplication } from '../../types';
import { formatDate, getStatusColor } from '../../lib/utils';
import { CheckCircle, XCircle, Clock, MessageSquare } from 'lucide-react';

export default function LeaveApprovalsPage() {
  const [applications, setApplications] = useState<LeaveApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('PENDING');
  const [actionModal, setActionModal] = useState<{ type: 'approve' | 'reject'; app: LeaveApplication } | null>(null);
  const [comment, setComment] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => { fetchApplications(); }, [statusFilter]);

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/leave/applications/?status=${statusFilter}`);
      setApplications(res.data.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleAction = async () => {
    if (!actionModal) return;
    setProcessing(true);
    try {
      const pendingApproval = actionModal.app.approvals?.find((a: any) => a.status === 'PENDING');
      if (!pendingApproval) { alert('No pending approval found'); setProcessing(false); return; }

      const endpoint = actionModal.type === 'approve' ? '/leave/approve/' : '/leave/reject/';
      await api.post(endpoint, { approval_id: pendingApproval.id, comments: comment });
      setActionModal(null);
      setComment('');
      fetchApplications();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Action failed');
    } finally { setProcessing(false); }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Leave Approvals</h2>
        <p className="text-gray-500">Review and approve employee leave requests</p>
      </div>

      <div className="flex gap-2">
        {['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'].map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              statusFilter === status
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {applications.length === 0 ? (
          <div className="card p-12 text-center text-gray-400">No leave applications found</div>
        ) : applications.map((app) => (
          <div key={app.id} className="card p-5 hover:shadow-md transition-shadow">
            <div className="flex flex-col lg:flex-row lg:items-start gap-4">
              <div className="flex items-center gap-3 flex-shrink-0">
                <div className="w-10 h-10 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center font-semibold text-sm">
                  {app.employee_name?.split(' ').map((n: string) => n[0]).join('')}
                </div>
                <div>
                  <div className="font-semibold text-gray-800">{app.employee_name}</div>
                  <div className="text-xs text-gray-400">{app.employee_id}</div>
                </div>
              </div>

              <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                <div>
                  <div className="text-gray-400 text-xs">Leave Type</div>
                  <div className="font-medium">{app.leave_type_name}</div>
                </div>
                <div>
                  <div className="text-gray-400 text-xs">From</div>
                  <div className="font-medium">{formatDate(app.start_date)}</div>
                </div>
                <div>
                  <div className="text-gray-400 text-xs">To</div>
                  <div className="font-medium">{formatDate(app.end_date)}</div>
                </div>
                <div>
                  <div className="text-gray-400 text-xs">Days</div>
                  <div className="font-medium">{app.total_days}</div>
                </div>
              </div>

              <div className="flex-1 lg:max-w-md">
                <div className="text-xs text-gray-400 mb-1">Reason</div>
                <div className="p-3 bg-gray-50 rounded-lg text-sm text-gray-700 border border-gray-100 min-h-[40px]">
                  {app.reason || <span className="text-gray-400 italic">No reason provided</span>}
                </div>
              </div>

              <div className="flex flex-col items-end gap-2 flex-shrink-0">
                <span className={`badge ${getStatusColor(app.status)}`}>{app.status}</span>
                {app.status === 'PENDING' && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => setActionModal({ type: 'approve', app })}
                      className="flex items-center gap-1.5 px-3 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors text-sm font-medium"
                    >
                      <CheckCircle size={16} /> Approve
                    </button>
                    <button
                      onClick={() => setActionModal({ type: 'reject', app })}
                      className="flex items-center gap-1.5 px-3 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors text-sm font-medium"
                    >
                      <XCircle size={16} /> Reject
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {actionModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">
              {actionModal.type === 'approve' ? 'Approve Leave' : 'Reject Leave'}
            </h3>
            <div className="space-y-3 mb-4">
              <p><span className="font-medium">Employee:</span> {actionModal.app.employee_name}</p>
              <p><span className="font-medium">Type:</span> {actionModal.app.leave_type_name}</p>
              <p><span className="font-medium">Dates:</span> {formatDate(actionModal.app.start_date)} - {formatDate(actionModal.app.end_date)}</p>
              <p><span className="font-medium">Days:</span> {actionModal.app.total_days}</p>
              <div className="bg-gray-50 p-3 rounded-lg">
                <span className="font-medium text-gray-700">Reason:</span>
                <p className="text-gray-600 mt-1">{actionModal.app.reason || 'No reason provided'}</p>
              </div>
            </div>
            <div className="mb-4">
              <label className="label">Comments (optional)</label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="input-field"
                rows={3}
                placeholder="Add comments..."
              />
            </div>
            <div className="flex gap-3">
              <button onClick={() => { setActionModal(null); setComment(''); }} className="btn-secondary flex-1">
                Cancel
              </button>
              <button
                onClick={handleAction}
                disabled={processing}
                className={`flex-1 py-2 rounded-lg font-medium text-white flex items-center justify-center gap-2 ${
                  actionModal.type === 'approve'
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {processing ? (
                  <><Clock size={16} className="animate-spin" /> Processing...</>
                ) : (
                  actionModal.type === 'approve' ? 'Approve' : 'Reject'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
