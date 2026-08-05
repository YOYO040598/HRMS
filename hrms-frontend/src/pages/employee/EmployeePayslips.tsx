import { useEffect, useState } from 'react';
import api from '../../api/axios';
import { formatCurrency, getStatusColor, monthNames } from '../../lib/utils';
import { Download, Wallet, FileText, CheckCircle, Eye, X } from 'lucide-react';
import type { Payslip } from '../../types';

export default function EmployeePayslips() {
  const [payslips, setPayslips] = useState<Payslip[]>([]);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState<number>(0);
  const [year, setYear] = useState(new Date().getFullYear());
  const [downloading, setDownloading] = useState<string | null>(null);
  const [viewPayslip, setViewPayslip] = useState<Payslip | null>(null);
  const [passwordProtect, setPasswordProtect] = useState(false);

  useEffect(() => { fetchPayslips(); }, [month, year]);

  const fetchPayslips = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { year: String(year) };
      if (month > 0) params.month = String(month);
      const res = await api.get('/payroll/my-payslips/', { params });
      setPayslips(res.data.data || []);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const handleDownload = async (payslipId: string) => {
    setDownloading(payslipId);
    try {
      const res = await api.get(`/payroll/${payslipId}/download/`, {
        params: { password_protected: passwordProtect },
        responseType: 'blob'
      });
      
      const contentType = res.headers['content-type'] || '';
      const isPdf = contentType.includes('application/pdf') || passwordProtect;
      const ext = isPdf ? 'pdf' : 'txt';
      
      const blob = new Blob([res.data], { type: isPdf ? 'application/pdf' : 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `payslip-${payslipId}.${ext}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert('Failed to download payslip');
    } finally { setDownloading(null); }
  };

  const totalEarned = payslips.reduce((sum, p) => sum + Number(p.net_salary), 0);
  const totalDeductions = payslips.reduce((sum, p) => sum + Number(p.total_deductions), 0);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">My Payslips</h2>
        <p className="text-gray-500">View and download your monthly salary slips</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="stat-card">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center">
              <Wallet size={20} className="text-emerald-600" />
            </div>
            <span className="text-sm text-gray-500">Total Earned</span>
          </div>
          <div className="text-2xl font-bold text-emerald-600">{formatCurrency(totalEarned)}</div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center">
              <Wallet size={20} className="text-red-600" />
            </div>
            <span className="text-sm text-gray-500">Total Deductions</span>
          </div>
          <div className="text-2xl font-bold text-red-600">{formatCurrency(totalDeductions)}</div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center">
              <FileText size={20} className="text-indigo-600" />
            </div>
            <span className="text-sm text-gray-500">Total Payslips</span>
          </div>
          <div className="text-2xl font-bold text-gray-800">{payslips.length}</div>
        </div>
      </div>

      <div className="card">
        <div className="flex flex-col sm:flex-row gap-4 items-end justify-between">
          <div className="flex gap-4 items-end">
            <div>
              <label className="label">Month</label>
              <select value={month} onChange={(e) => setMonth(Number(e.target.value))} className="input-field w-48">
                <option value={0}>All Months</option>
                {monthNames.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Year</label>
              <select value={year} onChange={(e) => setYear(Number(e.target.value))} className="input-field w-32">
                {[2024, 2025, 2026, 2027].map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          </div>
          <div className="flex flex-col items-start gap-1 pb-1">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="pass_protect"
                checked={passwordProtect}
                onChange={(e) => setPasswordProtect(e.target.checked)}
                className="h-4 w-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
              />
              <label htmlFor="pass_protect" className="text-sm font-medium text-gray-700">
                Password-protect PDF Download
              </label>
            </div>
            <p className="text-xs text-gray-400">
              Password format: YYYYMMDD[EmployeeID] (e.g. 19900515EMP001)
            </p>
          </div>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="table-header">
                <th className="px-6 py-3 text-left">Period</th>
                <th className="px-6 py-3 text-right">Gross</th>
                <th className="px-6 py-3 text-right">Deductions</th>
                <th className="px-6 py-3 text-right">Net Pay</th>
                <th className="px-6 py-3 text-center">Status</th>
                <th className="px-6 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={6} className="px-6 py-12 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto" />
                </td></tr>
              ) : payslips.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-400">No payslips found for this period</td></tr>
              ) : payslips.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="table-cell font-medium text-gray-900">{monthNames[p.month - 1]} {p.year}</td>
                  <td className="table-cell text-right">{formatCurrency(p.gross_salary)}</td>
                  <td className="table-cell text-right text-red-600">{formatCurrency(p.total_deductions)}</td>
                  <td className="table-cell text-right font-semibold text-emerald-600">{formatCurrency(p.net_salary)}</td>
                  <td className="table-cell text-center">
                    <span className={getStatusColor(p.status)}>{p.status}</span>
                  </td>
                  <td className="table-cell">
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => setViewPayslip(p)}
                        className="p-1.5 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors" title="View Details">
                        <Eye size={16} />
                      </button>
                      {p.has_pdf && (
                        <button
                          onClick={() => handleDownload(p.id)}
                          disabled={downloading === p.id}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                        >
                          <Download size={14} />
                          {downloading === p.id ? 'Downloading...' : 'Download'}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {viewPayslip && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-800">Payslip - {monthNames[viewPayslip.month - 1]} {viewPayslip.year}</h3>
              <button onClick={() => setViewPayslip(null)} className="p-2 text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <div className="p-6">
              {viewPayslip.earnings && viewPayslip.earnings.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Earnings</h4>
                  <div className="bg-emerald-50 rounded-lg p-3">
                    {viewPayslip.earnings.map((e) => (
                      <div key={e.id} className="flex justify-between py-1">
                        <span className="text-gray-700">{e.name}</span>
                        <span className="font-medium text-emerald-700">{formatCurrency(e.amount)}</span>
                      </div>
                    ))}
                    <div className="flex justify-between pt-2 mt-2 border-t border-emerald-200">
                      <span className="font-semibold text-emerald-800">Gross Salary</span>
                      <span className="font-bold text-emerald-800">{formatCurrency(viewPayslip.gross_salary)}</span>
                    </div>
                  </div>
                </div>
              )}

              {viewPayslip.payslip_deductions && viewPayslip.payslip_deductions.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Deductions</h4>
                  <div className="bg-red-50 rounded-lg p-3">
                    {viewPayslip.payslip_deductions.map((d) => (
                      <div key={d.id} className="flex justify-between py-1">
                        <span className="text-gray-700">{d.name}</span>
                        <span className="font-medium text-red-700">{formatCurrency(d.amount)}</span>
                      </div>
                    ))}
                    <div className="flex justify-between pt-2 mt-2 border-t border-red-200">
                      <span className="font-semibold text-red-800">Total Deductions</span>
                      <span className="font-bold text-red-800">{formatCurrency(viewPayslip.total_deductions)}</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="p-4 bg-indigo-50 rounded-lg flex justify-between items-center mb-4">
                <span className="text-base font-semibold text-indigo-800">Net Pay</span>
                <span className="text-2xl font-bold text-indigo-700">{formatCurrency(viewPayslip.net_salary)}</span>
              </div>

              {viewPayslip.has_pdf && (
                <button onClick={() => handleDownload(viewPayslip.id)} disabled={downloading === viewPayslip.id}
                  className="btn-primary flex items-center gap-2 w-full justify-center">
                  <Download size={16} /> {downloading === viewPayslip.id ? 'Downloading...' : 'Download Payslip'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
