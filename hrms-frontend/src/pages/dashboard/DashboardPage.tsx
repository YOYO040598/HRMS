import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import type { DashboardStats } from '../../types';
import { formatCurrency, getStatusColor } from '../../lib/utils';
import {
  Users, UserCheck, UserX, CalendarDays, Package, Wallet,
  TrendingUp, ArrowRight, Clock, FileWarning
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#4f46e5', '#059669', '#d97706', '#dc2626', '#7c3aed', '#0891b2'];

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [deptBreakdown, setDeptBreakdown] = useState<any[]>([]);
  const [leaveData, setLeaveData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
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
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    );
  }

  const statCards = [
    { title: 'Total Employees', value: stats?.total_employees || 0, icon: Users, color: 'bg-indigo-500', link: '/employees' },
    { title: 'Present Today', value: stats?.present_today || 0, icon: UserCheck, color: 'bg-emerald-500', link: '/attendance' },
    { title: 'Absent Today', value: stats?.absent_today || 0, icon: UserX, color: 'bg-red-500', link: '/attendance' },
    { title: 'Pending Leaves', value: stats?.pending_leaves || 0, icon: CalendarDays, color: 'bg-amber-500', link: '/leave' },
    { title: 'Total Assets', value: stats?.asset_stats?.total || 0, icon: Package, color: 'bg-purple-500', link: '/assets' },
    { title: 'Payroll This Month', value: formatCurrency(stats?.payroll_stats?.total_net || 0), icon: Wallet, color: 'bg-cyan-500', link: '/payroll' },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-6 text-white">
        <h2 className="text-2xl font-bold mb-1">Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}!</h2>
        <p className="text-indigo-100">Here's what's happening in your organization today.</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {statCards.map((card) => (
          <Link key={card.title} to={card.link} className="stat-card group">
            <div className="flex items-start justify-between mb-3">
              <div className={`${card.color} w-10 h-10 rounded-lg flex items-center justify-center text-white`}>
                <card.icon size={20} />
              </div>
              <ArrowRight size={16} className="text-gray-300 group-hover:text-indigo-500 transition-colors" />
            </div>
            <div className="text-2xl font-bold text-gray-800">{card.value}</div>
            <div className="text-sm text-gray-500">{card.title}</div>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Link to="/attendance" className="card flex items-center gap-4 hover:shadow-md transition-shadow border-l-4 border-l-indigo-500">
          <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center">
            <Clock size={24} className="text-indigo-600" />
          </div>
          <div>
            <div className="font-semibold text-gray-800">Quick Check-in</div>
            <div className="text-sm text-gray-500">Mark your attendance</div>
          </div>
        </Link>
        <Link to="/leave" className="card flex items-center gap-4 hover:shadow-md transition-shadow border-l-4 border-l-amber-500">
          <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center">
            <CalendarDays size={24} className="text-amber-600" />
          </div>
          <div>
            <div className="font-semibold text-gray-800">Apply Leave</div>
            <div className="text-sm text-gray-500">Submit leave request</div>
          </div>
        </Link>
        <Link to="/payroll" className="card flex items-center gap-4 hover:shadow-md transition-shadow border-l-4 border-l-emerald-500">
          <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center">
            <Wallet size={24} className="text-emerald-600" />
          </div>
          <div>
            <div className="font-semibold text-gray-800">View Payslips</div>
            <div className="text-sm text-gray-500">Download your payslips</div>
          </div>
        </Link>
        <Link to="/reports" className="card flex items-center gap-4 hover:shadow-md transition-shadow border-l-4 border-l-purple-500">
          <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center">
            <TrendingUp size={24} className="text-purple-600" />
          </div>
          <div>
            <div className="font-semibold text-gray-800">Reports</div>
            <div className="text-sm text-gray-500">View analytics</div>
          </div>
        </Link>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department Breakdown */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Department Headcount</h3>
          {deptBreakdown.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={deptBreakdown}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="code" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="total_employees" fill="#4f46e5" radius={[4, 4, 0, 0]} name="Total" />
                <Bar dataKey="present_today" fill="#059669" radius={[4, 4, 0, 0]} name="Present" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-gray-400">No department data</div>
          )}
        </div>

        {/* Leave Distribution */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Leave Distribution</h3>
          {leaveData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={leaveData} dataKey="count" nameKey="leave_type__name" cx="50%" cy="50%" outerRadius={100} label={({ leave_type__name, percent }) => `${leave_type__name} ${(percent * 100).toFixed(0)}%`}>
                  {leaveData.map((_, index) => (
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

      {/* Recent Activity */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Overview</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-emerald-50 rounded-xl">
            <div className="text-2xl font-bold text-emerald-600">{stats?.active_leaves_today || 0}</div>
            <div className="text-sm text-emerald-700">Employees on leave today</div>
          </div>
          <div className="p-4 bg-amber-50 rounded-xl">
            <div className="text-2xl font-bold text-amber-600">{stats?.new_joins_this_month || 0}</div>
            <div className="text-sm text-amber-700">New joins this month</div>
          </div>
          <div className="p-4 bg-purple-50 rounded-xl">
            <div className="text-2xl font-bold text-purple-600">{stats?.pending_resignations || 0}</div>
            <div className="text-sm text-purple-700">Pending resignations</div>
          </div>
        </div>
      </div>
    </div>
  );
}
