import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../hooks/useRedux';
import { logout } from '../../store/authSlice';
import { LayoutDashboard, Clock, CalendarDays, Wallet, Bell, LogOut, Menu, X, ChevronDown, CheckSquare } from 'lucide-react';

const allNavItems = [
  { path: '/emp', label: 'Dashboard', icon: LayoutDashboard, roles: ['EMPLOYEE', 'HR_ADMIN', 'HR_EXECUTIVE', 'ADMIN', 'MANAGER', 'TEAM_LEAD'] },
  { path: '/emp/attendance', label: 'Attendance', icon: Clock, roles: ['EMPLOYEE', 'HR_ADMIN', 'HR_EXECUTIVE', 'ADMIN', 'MANAGER', 'TEAM_LEAD'] },
  { path: '/emp/leave', label: 'Leave', icon: CalendarDays, roles: ['EMPLOYEE', 'HR_ADMIN', 'HR_EXECUTIVE', 'ADMIN', 'MANAGER', 'TEAM_LEAD'] },
  { path: '/emp/leave-approvals', label: 'Leave Approvals', icon: CheckSquare, roles: ['HR_ADMIN', 'HR_EXECUTIVE', 'ADMIN', 'MANAGER', 'TEAM_LEAD'] },
  { path: '/emp/payslips', label: 'Payslips', icon: Wallet, roles: ['EMPLOYEE', 'HR_ADMIN', 'HR_EXECUTIVE', 'ADMIN', 'MANAGER', 'TEAM_LEAD'] },
  { path: '/emp/notifications', label: 'Notifications', icon: Bell, roles: ['EMPLOYEE', 'HR_ADMIN', 'HR_EXECUTIVE', 'ADMIN', 'MANAGER', 'TEAM_LEAD'] },
];

export default function EmployeeLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const location = useLocation();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);

  const navItems = allNavItems.filter((item) => item.roles.includes(user?.role || 'EMPLOYEE'));

  const handleLogout = () => {
    dispatch(logout());
    window.location.href = '/emp/login';
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <aside className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-gradient-to-b from-emerald-950 to-emerald-900 text-white transition-all duration-300 flex flex-col`}>
        <div className="p-4 flex items-center justify-between">
          {sidebarOpen && (
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 bg-emerald-500 rounded-lg flex items-center justify-center font-bold text-lg">H</div>
              <span className="text-xl font-bold">HRMS</span>
            </div>
          )}
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 hover:bg-emerald-800 rounded-lg transition-colors">
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
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/30'
                    : 'text-emerald-200 hover:bg-emerald-800 hover:text-white'
                }`}
              >
                <item.icon size={20} />
                {sidebarOpen && <span className="font-medium">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {sidebarOpen && (
          <div className="p-4 border-t border-emerald-800">
            <div className="text-xs text-emerald-300 mb-1">Logged in as</div>
            <div className="text-sm font-medium text-white truncate">{user?.full_name || user?.email}</div>
            <div className="text-xs text-emerald-400">{user?.role?.replace('_', ' ')}</div>
          </div>
        )}
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between shadow-sm">
          <h1 className="text-lg font-semibold text-gray-800">
            {navItems.find((n) => location.pathname === n.path || (n.path !== '/emp' && location.pathname.startsWith(n.path)))?.label || 'Employee Portal'}
          </h1>
          <div className="flex items-center gap-4">
            <Link to="/emp/notifications" className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
              <Bell size={20} />
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
