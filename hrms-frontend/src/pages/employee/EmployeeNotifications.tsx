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
      await api.post('/notifications/mark-all-read/');
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      window.dispatchEvent(new Event('notifications-updated'));
    } catch (err) { console.error(err); }
  };

  const markAsRead = async (id: string) => {
    try {
      await api.post(`/notifications/${id}/mark-as-read/`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
      window.dispatchEvent(new Event('notifications-updated'));
    } catch (err) {
      console.error(err);
    }
  };

  const getTypeIcon = (type: string) => {
    const icons: Record<string, string> = {
      LEAVE: 'bg-amber-150/50 text-amber-700 border border-amber-200/50',
      ATTENDANCE: 'bg-orange-100/50 text-[#ea580c] border border-orange-200/30',
      PAYROLL: 'bg-blue-100/50 text-blue-700 border border-blue-200/30',
      ASSET: 'bg-purple-100/50 text-purple-700 border border-purple-200/30',
      EXIT: 'bg-rose-100/50 text-rose-700 border border-rose-200/30',
      SYSTEM: 'bg-stone-100/50 text-stone-700 border border-stone-200/30',
    };
    return icons[type] || 'bg-stone-100 text-stone-600';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Notifications</h2>
          <p className="text-gray-500">Stay updated with your activities</p>
        </div>
        <button onClick={markAllRead} className="btn-secondary flex items-center gap-2 cursor-pointer"><CheckCheck size={18} /> Mark all read</button>
      </div>

      <div className="card divide-y divide-gray-100/80 p-0 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#ea580c] mx-auto" /></div>
        ) : notifications.length === 0 ? (
          <div className="p-12 text-center text-gray-400 font-medium">No notifications yet</div>
        ) : notifications.map((n) => (
          <div 
            key={n.id} 
            onClick={() => !n.is_read && markAsRead(n.id)}
            className={`p-5 flex items-start gap-4 hover:bg-[#faf6ed]/50 transition-all cursor-pointer ${!n.is_read ? 'bg-orange-50/20' : ''}`}
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${getTypeIcon(n.notification_type)}`}>
              <Bell size={18} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h4 className={`text-sm font-bold ${!n.is_read ? 'text-[#ea580c]' : 'text-gray-700'}`}>{n.title}</h4>
                {!n.is_read && (
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#ea580c] opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-[#ea580c]"></span>
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 font-semibold mt-1">{n.message}</p>
              <p className="text-[10px] text-gray-400 font-bold mt-1.5">{formatDate(n.created_at)}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
