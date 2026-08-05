import { useEffect, useState } from 'react';
import api from '../../api/axios';
import type { Notification } from '../../types';
import { formatDate } from '../../lib/utils';
import { Bell, CheckCheck, CheckCircle, XCircle, Clock } from 'lucide-react';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionModal, setActionModal] = useState<{ type: 'approve' | 'reject'; notification: Notification } | null>(null);
  const [comment, setComment] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => { fetchNotifications(); }, []);

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications/');
      setNotifications(res.data.data);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const markAllRead = async () => {
    try {
      await api.post('/notifications/preferences/');
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch (err) { console.error(err); }
  };

  const getApplicationIdFromUrl = (actionUrl: string) => {
    const match = actionUrl?.match(/\/leave\/applications\/([a-f0-9-]+)/);
    return match ? match[1] : null;
  };

  const handleAction = async () => {
    if (!actionModal) return;
    setProcessing(true);
    try {
      const appId = getApplicationIdFromUrl(actionModal.notification.action_url);
      if (!appId) { alert('Could not find leave application'); return; }

      const appRes = await api.get(`/leave/applications/${appId}/`);
      const app = appRes.data.data;
      const pendingApproval = app.approvals?.find((a: any) => a.status === 'PENDING');
      if (!pendingApproval) { alert('No pending approval found'); return; }

      const endpoint = actionModal.type === 'approve' ? '/leave/approve/' : '/leave/reject/';
      await api.post(endpoint, { approval_id: pendingApproval.id, comments: comment });

      setActionModal(null);
      setComment('');
      fetchNotifications();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Action failed');
    } finally { setProcessing(false); }
  };

  const getTypeIcon = (type: string) => {
    const icons: Record<string, string> = {
      LEAVE: 'bg-amber-100 text-amber-600',
      ATTENDANCE: 'bg-indigo-100 text-indigo-600',
      PAYROLL: 'bg-emerald-100 text-emerald-600',
      ASSET: 'bg-purple-100 text-purple-600',
      EXIT: 'bg-red-100 text-red-600',
      SYSTEM: 'bg-gray-100 text-gray-600',
    };
    return icons[type] || 'bg-gray-100 text-gray-600';
  };

  const isLeaveRequest = (n: Notification) => {
    return n.notification_type === 'LEAVE' && n.title === 'New Leave Application' && n.action_url?.includes('/leave/applications/');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Notifications</h2>
          <p className="text-gray-500">Stay updated with your HR activities</p>
        </div>
        <button onClick={markAllRead} className="btn-secondary flex items-center gap-2"><CheckCheck size={18} /> Mark all read</button>
      </div>

      <div className="card divide-y divide-gray-100">
        {loading ? (
          <div className="p-12 text-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto" /></div>
        ) : notifications.length === 0 ? (
          <div className="p-12 text-center text-gray-400">No notifications yet</div>
        ) : notifications.map((n) => (
          <div key={n.id} className={`p-4 flex items-start gap-4 hover:bg-gray-50 transition-colors ${!n.is_read ? 'bg-indigo-50/50' : ''}`}>
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${getTypeIcon(n.notification_type)}`}>
              <Bell size={18} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h4 className={`font-medium ${!n.is_read ? 'text-gray-900' : 'text-gray-700'}`}>{n.title}</h4>
                {!n.is_read && <span className="w-2 h-2 bg-indigo-500 rounded-full flex-shrink-0" />}
              </div>
              <p className="text-sm text-gray-500 mt-0.5">{n.message}</p>
              <p className="text-xs text-gray-400 mt-1">{formatDate(n.created_at)}</p>

              {isLeaveRequest(n) && (
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => setActionModal({ type: 'approve', notification: n })}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors text-sm font-medium"
                  >
                    <CheckCircle size={14} /> Approve
                  </button>
                  <button
                    onClick={() => setActionModal({ type: 'reject', notification: n })}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors text-sm font-medium"
                  >
                    <XCircle size={14} /> Reject
                  </button>
                </div>
              )}
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
            <p className="text-gray-600 mb-4">{actionModal.notification.message}</p>
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
