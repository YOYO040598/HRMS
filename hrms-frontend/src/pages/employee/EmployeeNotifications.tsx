import { useEffect, useState } from 'react';
import api from '../../api/axios';
import type { Notification } from '../../types';
import { formatDate } from '../../lib/utils';
import { Bell, CheckCheck } from 'lucide-react';

export default function EmployeeNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

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

  const getTypeIcon = (type: string) => {
    const icons: Record<string, string> = {
      LEAVE: 'bg-amber-100 text-amber-600',
      ATTENDANCE: 'bg-emerald-100 text-emerald-600',
      PAYROLL: 'bg-blue-100 text-blue-600',
      ASSET: 'bg-purple-100 text-purple-600',
      EXIT: 'bg-red-100 text-red-600',
      SYSTEM: 'bg-gray-100 text-gray-600',
    };
    return icons[type] || 'bg-gray-100 text-gray-600';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Notifications</h2>
          <p className="text-gray-500">Stay updated with your activities</p>
        </div>
        <button onClick={markAllRead} className="btn-secondary flex items-center gap-2"><CheckCheck size={18} /> Mark all read</button>
      </div>

      <div className="card divide-y divide-gray-100">
        {loading ? (
          <div className="p-12 text-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto" /></div>
        ) : notifications.length === 0 ? (
          <div className="p-12 text-center text-gray-400">No notifications yet</div>
        ) : notifications.map((n) => (
          <div key={n.id} className={`p-4 flex items-start gap-4 hover:bg-gray-50 transition-colors ${!n.is_read ? 'bg-emerald-50/50' : ''}`}>
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${getTypeIcon(n.notification_type)}`}>
              <Bell size={18} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h4 className={`font-medium ${!n.is_read ? 'text-gray-900' : 'text-gray-700'}`}>{n.title}</h4>
                {!n.is_read && <span className="w-2 h-2 bg-emerald-500 rounded-full flex-shrink-0" />}
              </div>
              <p className="text-sm text-gray-500 mt-0.5">{n.message}</p>
              <p className="text-xs text-gray-400 mt-1">{formatDate(n.created_at)}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
