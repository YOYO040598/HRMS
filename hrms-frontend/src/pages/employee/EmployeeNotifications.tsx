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
      LEAVE: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
      ATTENDANCE: 'bg-[#14B8A6]/10 text-[#2DD4BF] border border-[#14B8A6]/20',
      PAYROLL: 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
      ASSET: 'bg-purple-500/10 text-purple-400 border border-purple-500/20',
      EXIT: 'bg-rose-500/10 text-rose-400 border border-rose-500/20',
      SYSTEM: 'bg-[#1D3045]/40 text-[#94A3B8] border border-[#1D3045]/60',
    };
    return icons[type] || 'bg-[#1D3045]/40 text-[#94A3B8]';
  };

  return (
    <div className="space-y-6 text-[#F8FAFC]">
      <style>{`
        .glass-card-premium {
          background: rgba(13, 23, 40, 0.72);
          backdrop-filter: blur(18px);
          -webkit-backdrop-filter: blur(18px);
          border: 1px solid rgba(148, 163, 184, 0.12);
        }
        .notification-row {
          transition: all 0.2s ease-in-out;
        }
        .notification-row:hover {
          background-color: rgba(20, 184, 166, 0.08);
        }
      `}</style>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="text-left">
          <h2 className="text-3xl font-extrabold tracking-tight text-[#F8FAFC]">Notifications</h2>
          <p className="text-[#94A3B8] text-sm mt-1">Stay updated with your activities</p>
        </div>
        <button onClick={markAllRead} className="px-4 py-2 bg-transparent border border-[#1D3045] hover:bg-[#111D30] text-[#94A3B8] hover:text-[#F8FAFC] rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer self-start sm:self-center">
          <CheckCheck size={18} /> Mark all read
        </button>
      </div>

      <div className="glass-card-premium rounded-3xl overflow-hidden shadow-lg border border-[#1D3045]/40 divide-y divide-[#1D3045]/30">
        {loading ? (
          <div className="p-12 text-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#14B8A6] mx-auto" /></div>
        ) : notifications.length === 0 ? (
          <div className="p-12 text-center text-[#64748B] font-semibold">No notifications yet</div>
        ) : notifications.map((n) => (
          <div 
            key={n.id} 
            onClick={() => !n.is_read && markAsRead(n.id)}
            className={`p-5 flex items-start gap-4 notification-row transition-all cursor-pointer text-left ${!n.is_read ? 'bg-[#14B8A6]/5' : ''}`}
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${getTypeIcon(n.notification_type)}`}>
              <Bell size={18} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h4 className={`text-sm font-bold ${!n.is_read ? 'text-[#2DD4BF]' : 'text-[#F8FAFC]'}`}>{n.title}</h4>
                {!n.is_read && (
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#2DD4BF] opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-[#2DD4BF]"></span>
                  </span>
                )}
              </div>
              <p className="text-xs text-[#94A3B8] font-semibold mt-1">{n.message}</p>
              <p className="text-[10px] text-[#64748B] font-bold mt-1.5">{formatDate(n.created_at)}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
