import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import type { DashboardStats } from '../../types';
import { formatCurrency, getStatusColor } from '../../lib/utils';
import {
  Users, UserCheck, UserX, CalendarDays, Package, Wallet,
  TrendingUp, ArrowRight, Clock, FileWarning, Sparkles, LogOut, ChevronRight
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#5e6ad2', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#5e6ad2]" />
      </div>
    );
  }

  const getGreeting = () => {
    const hours = new Date().getHours();
    if (hours < 12) return 'Good Morning';
    if (hours < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <div className="space-y-8 p-1 sm:p-2">
      {/* Custom Styles for Spatial Bento Cards */}
      <style>{`
        .bento-card {
          transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
          border: 1px solid rgba(226, 232, 240, 0.6);
        }
        .bento-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 20px 40px -10px rgba(0, 0, 0, 0.05), 0 10px 20px -10px rgba(94, 106, 210, 0.05);
          border-color: rgba(94, 106, 210, 0.3);
        }
        @keyframes drift {
          0% { transform: translate(0px, 0px) scale(1); }
          50% { transform: translate(40px, -30px) scale(1.1); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-drift { animation: drift 12s infinite ease-in-out; }
      `}</style>

      {/* Greeting Title */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-[#5e6ad2] uppercase tracking-widest mb-1.5">
            <Sparkles size={14} /> Organization Overview
          </div>
          <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">System Dashboard</h2>
          <p className="text-sm text-gray-500 font-medium mt-1">Here is a real-time summary of your workforce.</p>
        </div>
        <div className="text-sm text-gray-400 font-semibold bg-white border border-gray-200/50 px-4 py-2 rounded-xl shadow-sm">
          📅 {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
        </div>
      </div>

      {/* Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 auto-rows-auto">
        
        {/* Welcome Banner Bento */}
        <div className="md:col-span-4 bg-gradient-to-tr from-[#5e6ad2] to-[#7c89f8] rounded-3xl p-8 text-white relative overflow-hidden shadow-lg shadow-[#5e6ad2]/15 min-h-[160px] flex flex-col justify-center">
          <div className="absolute -top-12 -right-12 w-64 h-64 bg-white/10 rounded-full blur-3xl animate-drift pointer-events-none" />
          <div className="absolute -bottom-8 -left-8 w-48 h-48 bg-[#a5b4fc]/20 rounded-full blur-2xl pointer-events-none" />
          
          <div className="relative z-10">
            <h3 className="text-3xl font-extrabold tracking-tight">{getGreeting()}, Administrator!</h3>
            <p className="text-sm text-indigo-100 font-medium mt-1.5 opacity-90">All operations are running smoothly. Here is what requires your attention today.</p>
          </div>
        </div>

        {/* Total Employees Stat */}
        <Link to="/employees" className="bento-card bg-white rounded-3xl p-6 flex flex-col justify-between min-h-[160px] group">
          <div className="flex justify-between items-start">
            <div className="w-10 h-10 bg-indigo-50 rounded-2xl flex items-center justify-center text-[#5e6ad2]">
              <Users size={20} />
            </div>
            <ChevronRight size={16} className="text-gray-300 group-hover:text-[#5e6ad2] transition-colors" />
          </div>
          <div>
            <div className="text-3xl font-black text-gray-900 mt-1">{stats?.total_employees || 0}</div>
            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mt-1">Total Employees</div>
          </div>
        </Link>

        {/* Present / Absent Bento block */}
        <div className="bento-card md:col-span-2 bg-white rounded-3xl p-6 flex flex-col justify-between min-h-[160px]">
          <div className="flex justify-between items-start">
            <div className="w-10 h-10 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600">
              <UserCheck size={20} />
            </div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">Live Status</span>
          </div>
          <div className="grid grid-cols-2 divide-x divide-gray-100">
            <Link to="/attendance" className="pr-4 hover:opacity-80 transition-opacity">
              <div className="text-2xl font-black text-emerald-600">{stats?.present_today || 0}</div>
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Present Today</div>
            </Link>
            <Link to="/attendance" className="pl-4 hover:opacity-80 transition-opacity">
              <div className="text-2xl font-black text-rose-600">{stats?.absent_today || 0}</div>
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Absent Today</div>
            </Link>
          </div>
        </div>

        {/* Payroll Summary Card */}
        <Link to="/payroll" className="bento-card bg-white rounded-3xl p-6 flex flex-col justify-between min-h-[160px] group">
          <div className="flex justify-between items-start">
            <div className="w-10 h-10 bg-cyan-50 rounded-2xl flex items-center justify-center text-cyan-600">
              <Wallet size={20} />
            </div>
            <ChevronRight size={16} className="text-gray-300 group-hover:text-cyan-600 transition-colors" />
          </div>
          <div>
            <div className="text-2xl font-black text-gray-900 mt-1">{formatCurrency(stats?.payroll_stats?.total_net || 0)}</div>
            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mt-1">Payroll (Net Outflow)</div>
          </div>
        </Link>

        {/* Quick Actions Panel */}
        <div className="md:col-span-4 grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link to="/attendance" className="bento-card bg-white rounded-2xl p-4 flex items-center gap-3 hover:border-indigo-300 transition-colors shadow-sm">
            <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
              <Clock size={20} />
            </div>
            <div>
              <div className="font-bold text-sm text-gray-800">Attendance</div>
              <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Review Logs</div>
            </div>
          </Link>
          <Link to="/leave" className="bento-card bg-white rounded-2xl p-4 flex items-center gap-3 hover:border-amber-300 transition-colors shadow-sm">
            <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600">
              <CalendarDays size={20} />
            </div>
            <div>
              <div className="font-bold text-sm text-gray-800">Leaves</div>
              <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{stats?.pending_leaves || 0} Pending</div>
            </div>
          </Link>
          <Link to="/assets" className="bento-card bg-white rounded-2xl p-4 flex items-center gap-3 hover:border-purple-300 transition-colors shadow-sm">
            <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center text-purple-600">
              <Package size={20} />
            </div>
            <div>
              <div className="font-bold text-sm text-gray-800">Assets</div>
              <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{stats?.asset_stats?.total || 0} items</div>
            </div>
          </Link>
          <Link to="/payroll" className="bento-card bg-white rounded-2xl p-4 flex items-center gap-3 hover:border-cyan-300 transition-colors shadow-sm">
            <div className="w-10 h-10 bg-cyan-50 rounded-xl flex items-center justify-center text-cyan-600">
              <Wallet size={20} />
            </div>
            <div>
              <div className="font-bold text-sm text-gray-800">Payroll</div>
              <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Run Cycles</div>
            </div>
          </Link>
        </div>

        {/* Charts */}
        {/* Department Headcount Bar Chart */}
        <div className="bento-card md:col-span-2 bg-white rounded-3xl p-6">
          <h3 className="text-lg font-bold text-gray-900 tracking-tight mb-4 flex items-center gap-2">
            <TrendingUp size={18} className="text-[#5e6ad2]" /> Department Headcount
          </h3>
          {deptBreakdown.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={deptBreakdown}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="code" tick={{ fontSize: 11, fontWeight: 600, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 11, fontWeight: 600, fill: '#64748b' }} />
                <Tooltip contentStyle={{ borderRadius: '16px', border: '1px solid rgba(226, 232, 240, 0.8)', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05)' }} />
                <Bar dataKey="total_employees" fill="#5e6ad2" radius={[6, 6, 0, 0]} name="Total" />
                <Bar dataKey="present_today" fill="#10b981" radius={[6, 6, 0, 0]} name="Present" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-gray-400 text-sm">No department data</div>
          )}
        </div>

        {/* Leave Distribution Pie Chart */}
        <div className="bento-card md:col-span-2 bg-white rounded-3xl p-6">
          <h3 className="text-lg font-bold text-gray-900 tracking-tight mb-4 flex items-center gap-2">
            <CalendarDays size={18} className="text-amber-500" /> Leave Distribution
          </h3>
          {leaveData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={leaveData} dataKey="count" nameKey="leave_type__name" cx="50%" cy="50%" outerRadius={90} label={({ leave_type__name, percent }) => `${leave_type__name} ${(percent * 100).toFixed(0)}%`}>
                  {leaveData.map((_, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '16px', border: '1px solid rgba(226, 232, 240, 0.8)', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05)' }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-gray-400 text-sm">No leave distribution data</div>
          )}
        </div>

        {/* Quick Overview Metrics */}
        <div className="bento-card md:col-span-4 bg-white rounded-3xl p-6">
          <h3 className="text-lg font-bold text-gray-900 tracking-tight mb-4 flex items-center gap-2">
            <Sparkles size={18} className="text-purple-600" /> Operations Checklist
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link to="/leave" className="p-5 bg-emerald-500/[0.03] hover:bg-emerald-500/[0.06] border border-emerald-500/10 rounded-2xl flex flex-col justify-between min-h-[120px] transition-colors">
              <div className="text-3xl font-black text-emerald-600">{stats?.active_leaves_today || 0}</div>
              <div className="text-xs font-bold text-emerald-800 uppercase tracking-wide">Out of Office Today</div>
            </Link>
            <div className="p-5 bg-amber-500/[0.03] border border-amber-500/10 rounded-2xl flex flex-col justify-between min-h-[120px]">
              <div className="text-3xl font-black text-amber-600">{stats?.new_joins_this_month || 0}</div>
              <div className="text-xs font-bold text-amber-800 uppercase tracking-wide">New Onboardings Month</div>
            </div>
            <Link to="/exit" className="p-5 bg-purple-500/[0.03] hover:bg-purple-500/[0.06] border border-purple-500/10 rounded-2xl flex flex-col justify-between min-h-[120px] transition-colors">
              <div className="text-3xl font-black text-purple-600">{stats?.pending_resignations || 0}</div>
              <div className="text-xs font-bold text-purple-800 uppercase tracking-wide">Pending Exit Clearances</div>
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
