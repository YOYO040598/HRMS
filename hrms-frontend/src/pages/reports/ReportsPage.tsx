import { useEffect, useState } from 'react';
import api from '../../api/axios';
import type { DashboardStats, Payroll } from '../../types';
import { formatCurrency } from '../../lib/utils';
import { monthNames } from '../../lib/utils';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import {
  Users, UserCheck, CalendarDays, Wallet, TrendingUp,
  Download, Filter, ChevronLeft, ChevronRight
} from 'lucide-react';

const COLORS = ['#4f46e5', '#059669', '#d97706', '#dc2626', '#7c3aed', '#0891b2'];

type TabKey = 'overview' | 'attendance' | 'leave' | 'payroll' | 'employees';

const tabs: { key: TabKey; label: string }[] = [
  { key: 'overview', label: 'Overview' },
  { key: 'attendance', label: 'Attendance' },
  { key: 'leave', label: 'Leave' },
  { key: 'payroll', label: 'Payroll' },
  { key: 'employees', label: 'Employees' },
];

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [loading, setLoading] = useState(true);

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [deptBreakdown, setDeptBreakdown] = useState<any[]>([]);
  const [leaveData, setLeaveData] = useState<any[]>([]);
  const [attendanceData, setAttendanceData] = useState<any[]>([]);
  const [payrollData, setPayrollData] = useState<Payroll[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);

  const [attMonth, setAttMonth] = useState(new Date().getMonth() + 1);
  const [attYear, setAttYear] = useState(new Date().getFullYear());
  const [payrollMonth, setPayrollMonth] = useState(new Date().getMonth() + 1);
  const [payrollYear, setPayrollYear] = useState(new Date().getFullYear());

  useEffect(() => {
    fetchAllData();
  }, []);

  useEffect(() => {
    if (activeTab === 'attendance') fetchAttendance();
    if (activeTab === 'payroll') fetchPayroll();
  }, [activeTab, attMonth, attYear, payrollMonth, payrollYear]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [statsRes, deptRes, leaveRes] = await Promise.all([
        api.get('/dashboard/stats/'),
        api.get('/dashboard/department-breakdown/'),
        api.get('/dashboard/leave-distribution/'),
      ]);
      setStats(statsRes.data.data);
      setDeptBreakdown(deptRes.data.data);
      setLeaveData(leaveRes.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAttendance = async () => {
    try {
      const res = await api.get('/attendance/monthly/', { params: { month: attMonth, year: attYear } });
      setAttendanceData(res.data.data?.attendances || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchPayroll = async () => {
    try {
      const res = await api.get('/payroll/payrolls/', { params: { month: payrollMonth, year: payrollYear } });
      setPayrollData(res.data.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchEmployees = async () => {
    try {
      const res = await api.get('/employees/', { params: { page_size: 500 } });
      setEmployees(res.data.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (activeTab === 'employees' && employees.length === 0) fetchEmployees();
  }, [activeTab]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Reports</h2>
        <p className="text-gray-500">Comprehensive analytics and reports</p>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.key
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <SummaryCard title="Total Employees" value={stats?.total_employees || 0} icon={Users} color="bg-indigo-500" />
            <SummaryCard title="Present Today" value={stats?.present_today || 0} icon={UserCheck} color="bg-emerald-500" />
            <SummaryCard title="Pending Leaves" value={stats?.pending_leaves || 0} icon={CalendarDays} color="bg-amber-500" />
            <SummaryCard title="Payroll Total" value={formatCurrency(stats?.payroll_stats?.total_net || 0)} icon={Wallet} color="bg-purple-500" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Department Breakdown</h3>
              {deptBreakdown.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={deptBreakdown}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="code" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="total_employees" fill="#4f46e5" radius={[4, 4, 0, 0]} name="Total Employees" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-gray-400">No department data</div>
              )}
            </div>

            <div className="card">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Leave Distribution</h3>
              {leaveData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={leaveData}
                      dataKey="count"
                      nameKey="leave_type__name"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      label={({ leave_type__name, percent }) => `${leave_type__name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {leaveData.map((_: any, index: number) => (
                        <Cell key={index} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-gray-400">No leave data</div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100">
              <div className="text-2xl font-bold text-emerald-600">{stats?.active_leaves_today || 0}</div>
              <div className="text-sm text-emerald-700">Employees on leave today</div>
            </div>
            <div className="p-4 bg-amber-50 rounded-xl border border-amber-100">
              <div className="text-2xl font-bold text-amber-600">{stats?.new_joins_this_month || 0}</div>
              <div className="text-sm text-amber-700">New joins this month</div>
            </div>
            <div className="p-4 bg-purple-50 rounded-xl border border-purple-100">
              <div className="text-2xl font-bold text-purple-600">{formatCurrency(stats?.payroll_stats?.total_gross || 0)}</div>
              <div className="text-sm text-purple-700">Total gross salary</div>
            </div>
          </div>
        </div>
      )}

      {/* Attendance Tab */}
      {activeTab === 'attendance' && (
        <div className="space-y-6">
          <div className="card">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-800">Monthly Attendance</h3>
              <div className="flex items-center gap-3">
                <select
                  value={attMonth}
                  onChange={(e) => setAttMonth(Number(e.target.value))}
                  className="input-field w-40"
                >
                  {monthNames.map((name, i) => (
                    <option key={i} value={i + 1}>{name}</option>
                  ))}
                </select>
                <select
                  value={attYear}
                  onChange={(e) => setAttYear(Number(e.target.value))}
                  className="input-field w-28"
                >
                  {[2024, 2025, 2026, 2027].map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="p-4 bg-indigo-50 rounded-xl">
                <div className="text-2xl font-bold text-indigo-600">{attendanceData.length}</div>
                <div className="text-sm text-indigo-700">Total Records</div>
              </div>
              <div className="p-4 bg-emerald-50 rounded-xl">
                <div className="text-2xl font-bold text-emerald-600">
                  {attendanceData.filter((a) => a.status === 'PRESENT').length}
                </div>
                <div className="text-sm text-emerald-700">Present Days</div>
              </div>
              <div className="p-4 bg-red-50 rounded-xl">
                <div className="text-2xl font-bold text-red-600">
                  {attendanceData.filter((a) => a.status === 'ABSENT').length}
                </div>
                <div className="text-sm text-red-700">Absent Days</div>
              </div>
              <div className="p-4 bg-amber-50 rounded-xl">
                <div className="text-2xl font-bold text-amber-600">
                  {attendanceData.filter((a) => a.status === 'LATE').length}
                </div>
                <div className="text-sm text-amber-700">Late Days</div>
              </div>
            </div>

            {attendanceData.length > 0 ? (
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={attendanceData.slice(0, 30)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11 }}
                    tickFormatter={(d) => new Date(d).getDate().toString()}
                  />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip
                    labelFormatter={(d) => new Date(d).toLocaleDateString()}
                    formatter={(value: number, name: string) => [value, name === 'total_hours' ? 'Hours' : name]}
                  />
                  <Bar dataKey="total_hours" fill="#4f46e5" radius={[4, 4, 0, 0]} name="Total Hours" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[350px] flex items-center justify-center text-gray-400">No attendance data for this period</div>
            )}
          </div>
        </div>
      )}

      {/* Leave Tab */}
      {activeTab === 'leave' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Leave Distribution</h3>
              {leaveData.length > 0 ? (
                <ResponsiveContainer width="100%" height={350}>
                  <PieChart>
                    <Pie
                      data={leaveData}
                      dataKey="count"
                      nameKey="leave_type__name"
                      cx="50%"
                      cy="50%"
                      outerRadius={120}
                      label={({ leave_type__name, percent }) => `${leave_type__name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {leaveData.map((_: any, index: number) => (
                        <Cell key={index} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[350px] flex items-center justify-center text-gray-400">No leave data</div>
              )}
            </div>

            <div className="card">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Leave Summary</h3>
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-xl">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-600">Total Leave Requests</span>
                    <span className="text-lg font-bold text-gray-800">
                      {leaveData.reduce((sum: number, l: any) => sum + (l.count || 0), 0)}
                    </span>
                  </div>
                </div>
                {leaveData.map((item: any, index: number) => (
                  <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                    <span className="flex-1 text-sm font-medium text-gray-700">{item.leave_type__name}</span>
                    <span className="text-sm font-bold text-gray-800">{item.count}</span>
                    <span className="text-xs text-gray-500">
                      {((item.count / (leaveData.reduce((sum: number, l: any) => sum + (l.count || 0), 0) || 1)) * 100).toFixed(0)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payroll Tab */}
      {activeTab === 'payroll' && (
        <div className="space-y-6">
          <div className="card">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-800">Payroll Report</h3>
              <div className="flex items-center gap-3">
                <select
                  value={payrollMonth}
                  onChange={(e) => setPayrollMonth(Number(e.target.value))}
                  className="input-field w-40"
                >
                  {monthNames.map((name, i) => (
                    <option key={i} value={i + 1}>{name}</option>
                  ))}
                </select>
                <select
                  value={payrollYear}
                  onChange={(e) => setPayrollYear(Number(e.target.value))}
                  className="input-field w-28"
                >
                  {[2024, 2025, 2026, 2027].map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="p-4 bg-indigo-50 rounded-xl">
                <div className="text-2xl font-bold text-indigo-600">
                  {formatCurrency(payrollData.reduce((s, p) => s + Number(p.gross_salary), 0))}
                </div>
                <div className="text-sm text-indigo-700">Total Gross</div>
              </div>
              <div className="p-4 bg-red-50 rounded-xl">
                <div className="text-2xl font-bold text-red-600">
                  {formatCurrency(payrollData.reduce((s, p) => s + Number(p.total_deductions), 0))}
                </div>
                <div className="text-sm text-red-700">Total Deductions</div>
              </div>
              <div className="p-4 bg-emerald-50 rounded-xl">
                <div className="text-2xl font-bold text-emerald-600">
                  {formatCurrency(payrollData.reduce((s, p) => s + Number(p.net_salary), 0))}
                </div>
                <div className="text-sm text-emerald-700">Total Net</div>
              </div>
            </div>

            {payrollData.length > 0 ? (
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={payrollData.slice(0, 20)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="employee_name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Bar dataKey="gross_salary" fill="#4f46e5" radius={[4, 4, 0, 0]} name="Gross" />
                  <Bar dataKey="total_deductions" fill="#dc2626" radius={[4, 4, 0, 0]} name="Deductions" />
                  <Bar dataKey="net_salary" fill="#059669" radius={[4, 4, 0, 0]} name="Net" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[350px] flex items-center justify-center text-gray-400">No payroll data for this period</div>
            )}
          </div>

          {payrollData.length > 0 && (
            <div className="card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="table-header">
                      <th className="px-6 py-3">Employee</th>
                      <th className="px-6 py-3">Gross</th>
                      <th className="px-6 py-3">Deductions</th>
                      <th className="px-6 py-3">Net</th>
                      <th className="px-6 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {payrollData.map((p) => (
                      <tr key={p.id} className="hover:bg-gray-50">
                        <td className="table-cell font-medium">{p.employee_name}</td>
                        <td className="table-cell">{formatCurrency(Number(p.gross_salary))}</td>
                        <td className="table-cell text-red-600">{formatCurrency(Number(p.total_deductions))}</td>
                        <td className="table-cell font-semibold text-emerald-600">{formatCurrency(Number(p.net_salary))}</td>
                        <td className="table-cell">
                          <span className={`badge ${p.status === 'PAID' ? 'badge-success' : p.status === 'PROCESSED' ? 'badge-info' : 'badge-warning'}`}>
                            {p.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Employees Tab */}
      {activeTab === 'employees' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">By Department</h3>
              {deptBreakdown.length > 0 ? (
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={deptBreakdown}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="code" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="total_employees" fill="#4f46e5" radius={[4, 4, 0, 0]} name="Total" />
                    <Bar dataKey="present_today" fill="#059669" radius={[4, 4, 0, 0]} name="Present Today" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[350px] flex items-center justify-center text-gray-400">No data</div>
              )}
            </div>

            <div className="card">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">By Status</h3>
              {employees.length > 0 ? (
                <ResponsiveContainer width="100%" height={350}>
                  <PieChart>
                    <Pie
                      data={Object.entries(
                        employees.reduce((acc: Record<string, number>, emp: any) => {
                          acc[emp.status] = (acc[emp.status] || 0) + 1;
                          return acc;
                        }, {})
                      ).map(([name, value]) => ({ name, value }))}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={120}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {Object.keys(
                        employees.reduce((acc: Record<string, number>, emp: any) => {
                          acc[emp.status] = (acc[emp.status] || 0) + 1;
                          return acc;
                        }, {})
                      ).map((_, index) => (
                        <Cell key={index} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[350px] flex items-center justify-center text-gray-400">No data</div>
              )}
            </div>

            <div className="card">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">By Employment Type</h3>
              {employees.length > 0 ? (
                <ResponsiveContainer width="100%" height={350}>
                  <PieChart>
                    <Pie
                      data={Object.entries(
                        employees.reduce((acc: Record<string, number>, emp: any) => {
                          const type = emp.employment_type?.replace('_', ' ') || 'Unknown';
                          acc[type] = (acc[type] || 0) + 1;
                          return acc;
                        }, {})
                      ).map(([name, value]) => ({ name, value }))}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={120}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {Object.keys(
                        employees.reduce((acc: Record<string, number>, emp: any) => {
                          const type = emp.employment_type?.replace('_', ' ') || 'Unknown';
                          acc[type] = (acc[type] || 0) + 1;
                          return acc;
                        }, {})
                      ).map((_, index) => (
                        <Cell key={index} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[350px] flex items-center justify-center text-gray-400">No data</div>
              )}
            </div>

            <div className="card">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Employee Summary</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                  <span className="text-sm font-medium text-gray-600">Total Employees</span>
                  <span className="text-lg font-bold text-gray-800">{employees.length}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-emerald-50 rounded-xl">
                  <span className="text-sm font-medium text-emerald-700">Active</span>
                  <span className="text-lg font-bold text-emerald-600">
                    {employees.filter((e) => e.status === 'ACTIVE').length}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-red-50 rounded-xl">
                  <span className="text-sm font-medium text-red-700">Exited</span>
                  <span className="text-lg font-bold text-red-600">
                    {employees.filter((e) => e.status === 'EXITED').length}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-amber-50 rounded-xl">
                  <span className="text-sm font-medium text-amber-700">On Notice</span>
                  <span className="text-lg font-bold text-amber-600">
                    {employees.filter((e) => e.status === 'ON_NOTICE').length}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SummaryCard({ title, value, icon: Icon, color }: { title: string; value: string | number; icon: any; color: string }) {
  return (
    <div className="stat-card">
      <div className="flex items-start justify-between mb-3">
        <div className={`${color} w-10 h-10 rounded-lg flex items-center justify-center text-white`}>
          <Icon size={20} />
        </div>
      </div>
      <div className="text-2xl font-bold text-gray-800">{value}</div>
      <div className="text-sm text-gray-500">{title}</div>
    </div>
  );
}
