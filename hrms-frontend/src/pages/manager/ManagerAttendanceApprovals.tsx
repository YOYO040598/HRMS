import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { Check, X, Filter, RefreshCw, Calendar } from 'lucide-react';

interface AttendanceRecord {
  id: number;
  employee: number;
  employee_name: string;
  date: string;
  status: string;
  check_in_time: string;
  check_out_time: string;
  working_hours: number;
  is_approved: boolean;
  approved_by: number | null;
  comments: string;
}

export default function ManagerAttendanceApprovals() {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().split('T')[0];
  });
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().split('T')[0]);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [rejectModal, setRejectModal] = useState<{ open: boolean; recordId: number | null }>({
    open: false,
    recordId: null
  });
  const [rejectComment, setRejectComment] = useState('');

  useEffect(() => {
    fetchRecords();
  }, [dateFrom, dateTo]);

  const fetchRecords = async () => {
    try {
      setLoading(true);
      const res = await api.get('/attendance/records/', {
        params: { is_approved: false, date_from: dateFrom, date_to: dateTo }
      });
      setRecords(res.data.results || res.data);
    } catch (error) {
      console.error('Error fetching attendance records:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (recordId: number) => {
    try {
      setActionLoading(recordId);
      await api.post('/attendance/approve/', { record_id: recordId, is_approved: true });
      fetchRecords();
    } catch (error) {
      console.error('Error approving attendance:', error);
      alert('Failed to approve attendance.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async () => {
    if (!rejectModal.recordId) return;
    try {
      setActionLoading(rejectModal.recordId);
      await api.post('/attendance/approve/', {
        record_id: rejectModal.recordId,
        is_approved: false,
        comments: rejectComment
      });
      setRejectModal({ open: false, recordId: null });
      setRejectComment('');
      fetchRecords();
    } catch (error) {
      console.error('Error rejecting attendance:', error);
      alert('Failed to reject attendance.');
    } finally {
      setActionLoading(null);
    }
  };

  const formatTime = (time: string | null) => {
    if (!time) return '-';
    return time.substring(0, 5);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Attendance Approvals</h1>
        <button onClick={fetchRecords} className="btn-secondary flex items-center gap-2">
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      <div className="card p-4">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Date Range:</span>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">From:</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">To:</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>
          <button
            onClick={fetchRecords}
            className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-sm hover:bg-emerald-700 flex items-center gap-1"
          >
            <Filter className="w-3.5 h-3.5" />
            Apply
          </button>
        </div>
      </div>

      <div className="card">
        <div className="px-4 py-3 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Pending Approval ({records.length})
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="table-header text-left">Employee</th>
                <th className="table-header text-left">Date</th>
                <th className="table-header text-left">Status</th>
                <th className="table-header text-left">Check In</th>
                <th className="table-header text-left">Check Out</th>
                <th className="table-header text-left">Hours</th>
                <th className="table-header text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="table-cell text-center py-8 text-gray-500">
                    Loading...
                  </td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan={7} className="table-cell text-center py-8 text-gray-500">
                    No pending attendance records found for the selected date range.
                  </td>
                </tr>
              ) : (
                records.map((record) => (
                  <tr key={record.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="table-cell font-medium text-gray-900">{record.employee_name}</td>
                    <td className="table-cell text-gray-600">{record.date}</td>
                    <td className="table-cell">
                      <span className={`badge ${getStatusBadge(record.status)}`}>{record.status}</span>
                    </td>
                    <td className="table-cell text-gray-600">{formatTime(record.check_in_time)}</td>
                    <td className="table-cell text-gray-600">{formatTime(record.check_out_time)}</td>
                    <td className="table-cell text-gray-600">
                      {record.working_hours ? `${record.working_hours.toFixed(1)}h` : '-'}
                    </td>
                    <td className="table-cell">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleApprove(record.id)}
                          disabled={actionLoading === record.id}
                          className="p-1.5 rounded-lg bg-emerald-100 text-emerald-700 hover:bg-emerald-200 disabled:opacity-50"
                          title="Approve"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setRejectModal({ open: true, recordId: record.id })}
                          disabled={actionLoading === record.id}
                          className="p-1.5 rounded-lg bg-red-100 text-red-700 hover:bg-red-200 disabled:opacity-50"
                          title="Reject"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {rejectModal.open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Reject Attendance Record</h3>
            <textarea
              value={rejectComment}
              onChange={(e) => setRejectComment(e.target.value)}
              placeholder="Enter rejection reason (optional)..."
              className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-none"
              rows={4}
            />
            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => {
                  setRejectModal({ open: false, recordId: null });
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

function getStatusBadge(status: string): string {
  switch (status) {
    case 'PRESENT': return 'bg-emerald-100 text-emerald-700';
    case 'WORK_FROM_HOME': return 'bg-blue-100 text-blue-700';
    case 'ABSENT': return 'bg-red-100 text-red-700';
    case 'LATE': return 'bg-amber-100 text-amber-700';
    case 'HALF_DAY': return 'bg-orange-100 text-orange-700';
    case 'ON_LEAVE': return 'bg-purple-100 text-purple-700';
    default: return 'bg-gray-100 text-gray-500';
  }
}
