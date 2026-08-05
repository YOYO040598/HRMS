import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import type { RootState } from './store';
import Layout from './components/layout/Layout';
import EmployeeLayout from './components/layout/EmployeeLayout';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import EmployeeLoginPage from './pages/auth/EmployeeLoginPage';
import DashboardPage from './pages/dashboard/DashboardPage';
import EmployeesPage from './pages/employees/EmployeesPage';
import EmployeeDetailPage from './pages/employees/EmployeeDetailPage';
import AttendancePage from './pages/attendance/AttendancePage';
import LeavePage from './pages/leave/LeavePage';
import LeaveApprovalsPage from './pages/leave/LeaveApprovalsPage';
import LeaveTypeManagementPage from './pages/leave/LeaveTypeManagementPage';
import PayrollPage from './pages/payroll/PayrollPage';
import SalaryStructurePage from './pages/payroll/SalaryStructurePage';
import PayrollManagementPage from './pages/payroll/PayrollManagementPage';
import ReimbursementPage from './pages/payroll/ReimbursementPage';
import AssetsPage from './pages/assets/AssetsPage';
import AssetManagementPage from './pages/assets/AssetManagementPage';
import ExitPage from './pages/exit/ExitPage';
import ExitManagementPage from './pages/exit/ExitManagementPage';
import NotificationsPage from './pages/notifications/NotificationsPage';
import OrganizationPage from './pages/organization/OrganizationPage';
import OrganizationManagementPage from './pages/organization/OrganizationManagementPage';
import ReportsPage from './pages/reports/ReportsPage';
import UserManagementPage from './pages/admin/UserManagementPage';
import RoleManagementPage from './pages/admin/RoleManagementPage';
import ProfilePage from './pages/profile/ProfilePage';
import ManagerDashboard from './pages/manager/ManagerDashboard';
import ManagerLeaveApprovals from './pages/manager/ManagerLeaveApprovals';
import ManagerAttendanceApprovals from './pages/manager/ManagerAttendanceApprovals';
import ManagerTeam from './pages/manager/ManagerTeam';
import EmployeeDashboard from './pages/employee/EmployeeDashboard';
import EmployeeAttendance from './pages/employee/EmployeeAttendance';
import EmployeeLeave from './pages/employee/EmployeeLeave';
import EmployeePayslips from './pages/employee/EmployeePayslips';
import EmployeeNotifications from './pages/employee/EmployeeNotifications';
import EmployeeAssets from './pages/employee/EmployeeAssets';
import EmployeeExit from './pages/employee/EmployeeExit';

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, tokens } = useSelector((state: RootState) => state.auth);
  if (!user || !tokens) return <Navigate to="/login" replace />;
  return <Layout>{children}</Layout>;
}

function EmployeeRoute({ children }: { children: React.ReactNode }) {
  const { user, tokens, loginType } = useSelector((state: RootState) => state.auth);
  if (!user || !tokens || loginType !== 'employee') return <Navigate to="/emp/login" replace />;
  return <EmployeeLayout>{children}</EmployeeLayout>;
}

export default function App() {
  const { user, tokens, loginType } = useSelector((state: RootState) => state.auth);

  return (
    <BrowserRouter>
      <Routes>
        {/* Auth Routes */}
        <Route path="/login" element={user && tokens ? <Navigate to={loginType === 'employee' ? '/emp' : '/'} replace /> : <LoginPage />} />
        <Route path="/register" element={user && tokens ? <Navigate to="/" replace /> : <RegisterPage />} />
        <Route path="/emp/login" element={user && tokens && loginType === 'employee' ? <Navigate to="/emp" replace /> : <EmployeeLoginPage />} />

        {/* Admin Routes */}
        <Route path="/" element={<AdminRoute><DashboardPage /></AdminRoute>} />
        <Route path="/employees" element={<AdminRoute><EmployeesPage /></AdminRoute>} />
        <Route path="/employees/:id" element={<AdminRoute><EmployeeDetailPage /></AdminRoute>} />
        <Route path="/attendance" element={<AdminRoute><AttendancePage /></AdminRoute>} />
        <Route path="/leave" element={<AdminRoute><LeavePage /></AdminRoute>} />
        <Route path="/leave/approvals" element={<AdminRoute><LeaveApprovalsPage /></AdminRoute>} />
        <Route path="/leave/types" element={<AdminRoute><LeaveTypeManagementPage /></AdminRoute>} />
        <Route path="/payroll" element={<AdminRoute><PayrollPage /></AdminRoute>} />
        <Route path="/payroll/salary-structures" element={<AdminRoute><SalaryStructurePage /></AdminRoute>} />
        <Route path="/payroll/manage" element={<AdminRoute><PayrollManagementPage /></AdminRoute>} />
        <Route path="/payroll/reimbursements" element={<AdminRoute><ReimbursementPage /></AdminRoute>} />
        <Route path="/assets" element={<AdminRoute><AssetManagementPage /></AdminRoute>} />
        <Route path="/assets/manage" element={<AdminRoute><AssetManagementPage /></AdminRoute>} />
        <Route path="/exit" element={<AdminRoute><ExitManagementPage /></AdminRoute>} />
        <Route path="/exit/manage" element={<AdminRoute><ExitManagementPage /></AdminRoute>} />
        <Route path="/notifications" element={<AdminRoute><NotificationsPage /></AdminRoute>} />
        <Route path="/organization" element={<AdminRoute><OrganizationPage /></AdminRoute>} />
        <Route path="/organization/manage" element={<AdminRoute><OrganizationManagementPage /></AdminRoute>} />
        <Route path="/reports" element={<AdminRoute><ReportsPage /></AdminRoute>} />
        <Route path="/admin/users" element={<AdminRoute><UserManagementPage /></AdminRoute>} />
        <Route path="/admin/roles" element={<AdminRoute><RoleManagementPage /></AdminRoute>} />
        <Route path="/profile" element={<AdminRoute><ProfilePage /></AdminRoute>} />

        {/* Manager Routes */}
        <Route path="/manager" element={<AdminRoute><ManagerDashboard /></AdminRoute>} />
        <Route path="/manager/leave-approvals" element={<AdminRoute><ManagerLeaveApprovals /></AdminRoute>} />
        <Route path="/manager/attendance-approvals" element={<AdminRoute><ManagerAttendanceApprovals /></AdminRoute>} />
        <Route path="/manager/team" element={<AdminRoute><ManagerTeam /></AdminRoute>} />

        {/* Employee Self-Service Routes */}
        <Route path="/emp" element={<EmployeeRoute><EmployeeDashboard /></EmployeeRoute>} />
        <Route path="/emp/attendance" element={<EmployeeRoute><EmployeeAttendance /></EmployeeRoute>} />
        <Route path="/emp/leave" element={<EmployeeRoute><EmployeeLeave /></EmployeeRoute>} />
        <Route path="/emp/leave-approvals" element={<EmployeeRoute><LeaveApprovalsPage /></EmployeeRoute>} />
        <Route path="/emp/payslips" element={<EmployeeRoute><EmployeePayslips /></EmployeeRoute>} />
        <Route path="/emp/assets" element={<EmployeeRoute><EmployeeAssets /></EmployeeRoute>} />
        <Route path="/emp/exit" element={<EmployeeRoute><EmployeeExit /></EmployeeRoute>} />
        <Route path="/emp/notifications" element={<EmployeeRoute><EmployeeNotifications /></EmployeeRoute>} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
