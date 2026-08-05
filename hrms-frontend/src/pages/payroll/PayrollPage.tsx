import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAppSelector } from '../../hooks/useRedux';
import api from '../../api/axios';
import type { Payroll } from '../../types';
import { formatDate, formatCurrency, getStatusColor } from '../../lib/utils';
import { Wallet, Filter, Settings, Layers } from 'lucide-react';
import { monthNames } from '../../lib/utils';

export default function PayrollPage() {
  const { user } = useAppSelector((state) => state.auth);
  const isHrOrAdmin = user?.role === 'ADMIN' || user?.role === 'HR_ADMIN';
  const [payrolls, setPayrolls] = useState<Payroll[]>([]);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => { fetchPayrolls(); }, [month, year, statusFilter]);

  const fetchPayrolls = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ month: String(month), year: String(year) });
      if (statusFilter) params.append('status', statusFilter);
      const res = await api.get('/payroll/payrolls/', { params });
      setPayrolls(res.data.data);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const totalGross = payrolls.reduce((sum, p) => sum + Number(p.gross_salary), 0);
  const totalDeductions = payrolls.reduce((sum, p) => sum + Number(p.total_deductions), 0);
  const totalNet = payrolls.reduce((sum, p) => sum + Number(p.net_salary), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Payroll</h2>
          <p className="text-gray-500">Manage employee payroll and salary</p>
        </div>
        {isHrOrAdmin && (
          <div className="flex flex-wrap gap-2">
            <Link to="/payroll/salary-structures" className="btn-secondary flex items-center gap-1.5 py-2 px-3 text-sm">
              <Layers size={16} /> Salary Structures
            </Link>
            <Link to="/payroll/reimbursements" className="btn-secondary flex items-center gap-1.5 py-2 px-3 text-sm">
              <Wallet size={16} /> Reimbursements
            </Link>
            <Link to="/payroll/manage" className="btn-primary flex items-center gap-1.5 py-2 px-3 text-sm">
              <Settings size={16} /> Manage Payroll & Payslips
            </Link>
          </div>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="stat-card">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center"><Wallet size={20} className="text-indigo-600" /></div>
            <span className="text-sm text-gray-500">Total Gross</span>
          </div>
          <div className="text-2xl font-bold text-gray-800">{formatCurrency(totalGross)}</div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center"><Wallet size={20} className="text-red-600" /></div>
            <span className="text-sm text-gray-500">Total Deductions</span>
          </div>
          <div className="text-2xl font-bold text-gray-800">{formatCurrency(totalDeductions)}</div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center"><Wallet size={20} className="text-emerald-600" /></div>
            <span className="text-sm text-gray-500">Total Net Pay</span>
          </div>
          <div className="text-2xl font-bold text-gray-800">{formatCurrency(totalNet)}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex flex-col sm:flex-row gap-4 items-end">
          <div>
            <label className="label">Month</label>
            <select value={month} onChange={(e) => setMonth(Number(e.target.value))} className="input-field w-48">
              {monthNames.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Year</label>
            <select value={year} onChange={(e) => setYear(Number(e.target.value))} className="input-field w-32">
              {[2024, 2025, 2026, 2027].map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Status</label>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="input-field w-40">
              <option value="">All</option>
              <option value="DRAFT">Draft</option>
              <option value="PROCESSED">Processed</option>
              <option value="APPROVED">Approved</option>
              <option value="PAID">Paid</option>
            </select>
          </div>
        </div>
      </div>

      {/* Payroll Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="table-header">
                <th className="px-6 py-3">Employee</th>
                <th className="px-6 py-3">Period</th>
                <th className="px-6 py-3">Basic</th>
                <th className="px-6 py-3">Gross</th>
                <th className="px-6 py-3">Deductions</th>
                <th className="px-6 py-3">Net Pay</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Paid Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={8} className="px-6 py-12 text-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto" /></td></tr>
              ) : payrolls.length === 0 ? (
                <tr><td colSpan={8} className="px-6 py-8 text-center text-gray-400">No payroll records for this period</td></tr>
              ) : payrolls.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="table-cell">
                    <div>
                      <div className="font-medium text-gray-800">{p.employee_name}</div>
                      <div className="text-xs text-gray-400">{p.employee_id}</div>
                    </div>
                  </td>
                  <td className="table-cell">{monthNames[p.month - 1]} {p.year}</td>
                  <td className="table-cell">{formatCurrency(p.basic_salary)}</td>
                  <td className="table-cell">{formatCurrency(p.gross_salary)}</td>
                  <td className="table-cell text-red-600">{formatCurrency(p.total_deductions)}</td>
                  <td className="table-cell font-semibold text-emerald-600">{formatCurrency(p.net_salary)}</td>
                  <td className="table-cell"><span className={`badge ${getStatusColor(p.status)}`}>{p.status}</span></td>
                  <td className="table-cell">{p.paid_date ? formatDate(p.paid_date) : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
