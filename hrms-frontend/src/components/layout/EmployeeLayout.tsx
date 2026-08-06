import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../hooks/useRedux';
import { logout } from '../../store/authSlice';
import api from '../../api/axios';
import { LayoutDashboard, Clock, CalendarDays, Wallet, Bell, LogOut, Menu, X, ChevronDown, CheckSquare, Package, User } from 'lucide-react';

const allNavItems = [
  { path: '/emp', label: 'Dashboard', icon: LayoutDashboard, roles: ['EMPLOYEE', 'HR_ADMIN', 'HR_EXECUTIVE', 'ADMIN', 'MANAGER', 'TEAM_LEAD'] },
  { path: '/emp/attendance', label: 'Attendance', icon: Clock, roles: ['EMPLOYEE', 'HR_ADMIN', 'HR_EXECUTIVE', 'ADMIN', 'MANAGER', 'TEAM_LEAD'] },
  { path: '/emp/leave', label: 'Leave', icon: CalendarDays, roles: ['EMPLOYEE', 'HR_ADMIN', 'HR_EXECUTIVE', 'ADMIN', 'MANAGER', 'TEAM_LEAD'] },
  { path: '/emp/leave-approvals', label: 'Leave Approvals', icon: CheckSquare, roles: ['HR_ADMIN', 'HR_EXECUTIVE', 'ADMIN', 'MANAGER', 'TEAM_LEAD'] },
  { path: '/emp/assets', label: 'My Assets', icon: Package, roles: ['EMPLOYEE', 'HR_ADMIN', 'HR_EXECUTIVE', 'ADMIN', 'MANAGER', 'TEAM_LEAD'] },
  { path: '/emp/payslips', label: 'Payslips', icon: Wallet, roles: ['EMPLOYEE', 'HR_ADMIN', 'HR_EXECUTIVE', 'ADMIN', 'MANAGER', 'TEAM_LEAD'] },
  { path: '/emp/exit', label: 'Resignation', icon: LogOut, roles: ['EMPLOYEE', 'HR_ADMIN', 'HR_EXECUTIVE', 'ADMIN', 'MANAGER', 'TEAM_LEAD'] },
  { path: '/emp/notifications', label: 'Notifications', icon: Bell, roles: ['EMPLOYEE', 'HR_ADMIN', 'HR_EXECUTIVE', 'ADMIN', 'MANAGER', 'TEAM_LEAD'] },
  { path: '/emp/profile', label: 'My Profile', icon: User, roles: ['EMPLOYEE', 'HR_ADMIN', 'HR_EXECUTIVE', 'ADMIN', 'MANAGER', 'TEAM_LEAD'] },
];

export default function EmployeeLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const location = useLocation();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);

  const fetchUnreadCount = async () => {
    try {
      const res = await api.get('/notifications/unread-count/');
      setUnreadCount(res.data.data?.unread_count || 0);
    } catch (err) {
      console.error('Error fetching unread notification count:', err);
    }
  };

  useEffect(() => {
    fetchUnreadCount();
    window.addEventListener('notifications-updated', fetchUnreadCount);
    const interval = setInterval(fetchUnreadCount, 15000);
    return () => {
      window.removeEventListener('notifications-updated', fetchUnreadCount);
      clearInterval(interval);
    };
  }, []);

  const navItems = allNavItems.filter((item) => item.roles.includes(user?.role || 'EMPLOYEE'));

  const handleLogout = () => {
    dispatch(logout());
    window.location.href = '/emp/login';
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <aside className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-gradient-to-b from-[#0f172a] to-[#0f172a] text-white border-r border-slate-800/40 transition-all duration-300 flex flex-col`}>
        <div className="p-4 flex items-center justify-between">
          {sidebarOpen && (
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 bg-[#ea580c] rounded-lg flex items-center justify-center font-bold text-lg shadow-md shadow-orange-500/10">H</div>
              <span className="text-xl font-bold tracking-tight">HRMS</span>
            </div>
          )}
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer">
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        <nav className="flex-1 mt-4 px-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path || (item.path !== '/emp' && location.pathname.startsWith(item.path));
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 ${
                  isActive
                    ? 'bg-[#ea580c] text-white shadow-md shadow-orange-500/15'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                }`}
              >
                <item.icon size={20} />
                {sidebarOpen && <span className="font-semibold text-sm">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {sidebarOpen && (
          <div className="p-4 border-t border-slate-800/80">
            <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-1">Logged in as</div>
            <div className="text-sm font-bold text-white truncate">{user?.full_name || user?.email}</div>
            <div className="text-[11px] font-medium text-slate-400 mt-0.5">{user?.role?.replace('_', ' ')}</div>
          </div>
        )}
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between shadow-sm">
          <h1 className="text-lg font-semibold text-gray-800">
            {navItems.find((n) => location.pathname === n.path || (n.path !== '/emp' && location.pathname.startsWith(n.path)))?.label || 'Employee Portal'}
          </h1>
          <div className="flex items-center gap-4">
            <Link to="/emp/notifications" className="relative p-2 text-gray-500 hover:text-[#ea580c] hover:bg-orange-50/50 rounded-lg transition-colors">
              <Bell size={20} />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-[#ea580c] rounded-full text-white text-[9px] flex items-center justify-center font-extrabold animate-pulse">
                  {unreadCount}
                </span>
              )}
            </Link>
            <div className="relative">
              <button onClick={() => setDropdownOpen(!dropdownOpen)} className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <div className="w-8 h-8 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center font-semibold text-sm">
                  {user?.first_name?.[0]}{user?.last_name?.[0]}
                </div>
                <ChevronDown size={16} className="text-gray-400" />
              </button>
              {dropdownOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setDropdownOpen(false)} />
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-100 z-20 py-2">
                    <div className="px-4 py-2 border-b border-gray-100">
                      <p className="font-semibold text-gray-800">{user?.full_name}</p>
                      <p className="text-xs text-gray-500">{user?.email}</p>
                    </div>
                    <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full">
                      <LogOut size={16} /> Logout
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
