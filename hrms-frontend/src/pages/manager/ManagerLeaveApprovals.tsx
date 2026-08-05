import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { Check, X, Filter, RefreshCw } from 'lucide-react';
import type { LeaveApplication } from '../../types';
import { formatDate, getStatusColor } from '../../lib/utils';

export default function ManagerLeaveApprovals() {
  const [applications, setApplications] = useState<LeaveApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('PENDING');
  const [rejectModal, setRejectModal] = useState<{ open: boolean; app: LeaveApplication | null }>({
    open: false,
    app: null,
  });
  const [rejectComment, setRejectComment] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchApplications();
  }, [statusFilter]);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/leave/applications/?status=${statusFilter}`);
      setApplications(res.data.data);
    } catch (error) {
      console.error('Error fetching applications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (app: LeaveApplication) => {
    const pendingApproval = app.approvals?.find((a: any) => a.status === 'PENDING');
    if (!pendingApproval) {
      alert('No pending approval found');
      return;
    }
    try {
      setActionLoading(app.id as string);
      await api.post('/leave/approve/', { approval_id: pendingApproval.id });
      fetchApplications();
    } catch (error) {
      console.error('Error approving leave:', error);
      alert('Failed to approve leave.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async () => {
    if (!rejectModal.app) return;
    const pendingApproval = rejectModal.app.approvals?.find((a: any) => a.status === 'PENDING');
    if (!pendingApproval) {
      alert('No pending approval found');
      return;
    }
    try {
      setActionLoading(rejectModal.app.id as string);
      await api.post('/leave/reject/', {
        approval_id: pendingApproval.id,
        comments: rejectComment,
      });
      setRejectModal({ open: false, app: null });
      setRejectComment('');
      fetchApplications();
    } catch (error) {
      console.error('Error rejecting leave:', error);
      alert('Failed to reject leave.');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Leave Approvals</h1>
          <p className="text-gray-500">Review and approve employee leave requests</p>
        </div>
        <button onClick={fetchApplications} className="btn-secondary flex items-center gap-2">
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      <div className="card p-4">
        <div className="flex items-center gap-3">
          <Filter className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Filter by Status:</span>
          <div className="flex gap-2">
            {['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  statusFilter === status
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="table-header text-left">Employee</th>
                <th className="table-header text-left">Leave Type</th>
                <th className="table-header text-left">From</th>
                <th className="table-header text-left">To</th>
                <th className="table-header text-left">Days</th>
                <th className="table-header text-left">Reason</th>
                <th className="table-header text-left">Status</th>
                <th className="table-header text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="table-cell text-center py-8 text-gray-500">
                    Loading...
                  </td>
                </tr>
              ) : applications.length === 0 ? (
                <tr>
                  <td colSpan={8} className="table-cell text-center py-8 text-gray-500">
                    No leave applications found.
                  </td>
                </tr>
              ) : (
                applications.map((app) => (
                  <tr key={app.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="table-cell">
                      <div className="font-medium text-gray-900">{app.employee_name}</div>
                      <div className="text-xs text-gray-500">{app.employee_id}</div>
                    </td>
                    <td className="table-cell text-gray-600">{app.leave_type_name}</td>
                    <td className="table-cell text-gray-600">{formatDate(app.start_date)}</td>
                    <td className="table-cell text-gray-600">{formatDate(app.end_date)}</td>
                    <td className="table-cell text-gray-600">{app.total_days}</td>
                    <td className="table-cell text-gray-600 max-w-[200px] truncate" title={app.reason}>
                      {app.reason || '-'}
                    </td>
                    <td className="table-cell">
                      <span className={getStatusColor(app.status)}>{app.status}</span>
                    </td>
                    <td className="table-cell">
                      {app.status === 'PENDING' ? (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleApprove(app)}
                            disabled={actionLoading === app.id}
                            className="p-1.5 rounded-lg bg-emerald-100 text-emerald-700 hover:bg-emerald-200 disabled:opacity-50"
                            title="Approve"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setRejectModal({ open: true, app })}
                            disabled={actionLoading === app.id}
                            className="p-1.5 rounded-lg bg-red-100 text-red-700 hover:bg-red-200 disabled:opacity-50"
                            title="Reject"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">
                          {app.reviewed_by ? `by ${app.reviewed_by_name}` : '-'}
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {rejectModal.open && rejectModal.app && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Reject Leave Request</h3>
            <p className="text-sm text-gray-600 mb-2">
              {rejectModal.app.employee_name} - {rejectModal.app.leave_type_name} ({rejectModal.app.total_days} days)
            </p>
            {rejectModal.app.reason && (
              <p className="text-sm text-gray-500 mb-3">Reason: {rejectModal.app.reason}</p>
            )}
            <textarea
              value={rejectComment}
              onChange={(e) => setRejectComment(e.target.value)}
              placeholder="Enter rejection reason..."
              className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
              rows={4}
            />
            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => {
                  setRejectModal({ open: false, app: null });
                  setRejectComment('');
                }}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={actionLoading !== null}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
