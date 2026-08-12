import { useEffect, useState } from 'react';
import api from '../../api/axios';
import { formatCurrency, monthNames } from '../../lib/utils';
import { Download, Wallet, FileText, Eye, X } from 'lucide-react';
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
      
      const contentType = String(res.headers['content-type'] || '');
      const isPdf = contentType.includes('application/pdf') || passwordProtect;
      const ext = isPdf ? 'pdf' : 'txt';
      
      const blob = new Blob([res.data], { type: isPdf ? 'application/pdf' : 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `payslip-${payslipId}.${ext}`;
      a.click();
      URL.revokeObjectURL(url);
      window.dispatchEvent(new Event('payslip-celebrate'));
    } catch (err) {
      alert('Failed to download payslip');
    } finally { setDownloading(null); }
  };

  const handleViewPayslip = (p: Payslip) => {
    setViewPayslip(p);
    window.dispatchEvent(new Event('payslip-celebrate'));
  };

  const totalEarned = payslips.reduce((sum, p) => sum + Number(p.net_salary), 0);
  const totalDeductions = payslips.reduce((sum, p) => sum + Number(p.total_deductions), 0);

  return (
    <div className="space-y-6 text-[#F8FAFC]">
      <style>{`
        .glass-card-premium {
          background: rgba(13, 23, 40, 0.72);
          backdrop-filter: blur(18px);
          -webkit-backdrop-filter: blur(18px);
          border: 1px solid rgba(148, 163, 184, 0.12);
        }
        .history-row {
          transition: all 0.2s ease-in-out;
        }
        .history-row:hover {
          background-color: rgba(20, 184, 166, 0.08);
        }
      `}</style>

      <div className="text-left">
        <h2 className="text-3xl font-extrabold tracking-tight text-[#F8FAFC]">My Payslips</h2>
        <p className="text-[#94A3B8] text-sm mt-1">View and download your monthly salary slips</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
        <div className="glass-card-premium rounded-3xl p-6 shadow-sm border border-[#1D3045]/40">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-[#14B8A6]/10 rounded-xl flex items-center justify-center">
              <Wallet size={20} className="text-[#2DD4BF]" />
            </div>
            <span className="text-xs font-bold text-[#94A3B8] uppercase tracking-wider">Total Earned</span>
          </div>
          <div className="text-3xl font-black text-[#2DD4BF]">{formatCurrency(totalEarned)}</div>
        </div>
        <div className="glass-card-premium rounded-3xl p-6 shadow-sm border border-[#1D3045]/40">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-rose-500/10 rounded-xl flex items-center justify-center">
              <Wallet size={20} className="text-rose-400" />
            </div>
            <span className="text-xs font-bold text-[#94A3B8] uppercase tracking-wider">Total Deductions</span>
          </div>
          <div className="text-3xl font-black text-rose-400">{formatCurrency(totalDeductions)}</div>
        </div>
        <div className="glass-card-premium rounded-3xl p-6 shadow-sm border border-[#1D3045]/40">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-[#14B8A6]/10 rounded-xl flex items-center justify-center">
              <FileText size={20} className="text-[#2DD4BF]" />
            </div>
            <span className="text-xs font-bold text-[#94A3B8] uppercase tracking-wider">Total Payslips</span>
          </div>
          <div className="text-3xl font-black text-[#F8FAFC]">{payslips.length}</div>
        </div>
      </div>

      <div className="glass-card-premium rounded-3xl p-6 border border-[#1D3045]/40 text-left">
        <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-end justify-between">
          <div className="flex flex-wrap gap-4 items-end">
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-[#94A3B8] block mb-1.5">Month</label>
              <select value={month} onChange={(e) => setMonth(Number(e.target.value))} className="bg-[#111D30] border border-[#1D3045] rounded-xl px-4 py-2.5 text-xs text-[#F8FAFC] font-semibold focus:outline-none focus:border-[#2DD4BF]/50 w-48 cursor-pointer">
                <option value={0} className="bg-[#0D1728]">All Months</option>
                {monthNames.map((m, i) => <option key={i} value={i + 1} className="bg-[#0D1728]">{m}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-[#94A3B8] block mb-1.5">Year</label>
              <select value={year} onChange={(e) => setYear(Number(e.target.value))} className="bg-[#111D30] border border-[#1D3045] rounded-xl px-4 py-2.5 text-xs text-[#F8FAFC] font-semibold focus:outline-none focus:border-[#2DD4BF]/50 w-32 cursor-pointer">
                {[2024, 2025, 2026, 2027].map((y) => <option key={y} value={y} className="bg-[#0D1728]">{y}</option>)}
              </select>
            </div>
          </div>
          <div className="flex flex-col items-start gap-1 pb-1">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="passwordProtect"
                checked={passwordProtect}
                onChange={(e) => setPasswordProtect(e.target.checked)}
                className="h-4 w-4 text-[#14B8A6] focus:ring-[#14B8A6]/20 border-[#1D3045] bg-[#111D30] rounded cursor-pointer"
              />
              <label htmlFor="passwordProtect" className="text-xs font-bold uppercase tracking-wider text-[#94A3B8] cursor-pointer">
                Password-protect PDF Download
              </label>
            </div>
            <p className="text-[10px] text-[#64748B] mt-0.5">
              Password format: YYYYMMDD[EmployeeID] (e.g. 19900515EMP001)
            </p>
          </div>
        </div>
      </div>

      <div className="glass-card-premium rounded-3xl border border-[#1D3045]/40 overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#1D3045]/40 text-left text-xs font-bold text-[#94A3B8] uppercase tracking-wider">
                <th className="px-6 py-4">Period</th>
                <th className="px-6 py-4 text-right">Gross</th>
                <th className="px-6 py-4 text-right">Deductions</th>
                <th className="px-6 py-4 text-right">Net Pay</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1D3045]/20 text-xs text-[#F8FAFC]">
               {loading ? (
                <tr><td colSpan={6} className="px-6 py-12 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#14B8A6] mx-auto" />
                </td></tr>
              ) : payslips.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-[#64748B] font-semibold">No payslips found for this period</td></tr>
              ) : payslips.map((p) => (
                <tr key={p.id} className="history-row">
                  <td className="px-6 py-4 font-bold text-[#F8FAFC]">{monthNames[p.month - 1]} {p.year}</td>
                  <td className="px-6 py-4 text-right font-semibold text-[#94A3B8]">{formatCurrency(p.gross_salary)}</td>
                  <td className="px-6 py-4 text-right font-semibold text-rose-400">{formatCurrency(p.total_deductions)}</td>
                  <td className="px-6 py-4 text-right font-bold text-[#2DD4BF]">{formatCurrency(p.net_salary)}</td>
                  <td className="px-6 py-4 text-center">
                    <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold ${
                      p.status === 'PAID' ? 'bg-[#14B8A6]/10 text-[#2DD4BF] border border-[#14B8A6]/20' : 'bg-[#1D3045]/30 text-[#94A3B8] border border-[#1D3045]/40'
                    }`}>{p.status}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-1.5">
                      <button onClick={() => handleViewPayslip(p)}
                        className="p-1.5 rounded-lg text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#111D30] transition-colors cursor-pointer border-none bg-transparent" title="View Details">
                        <Eye size={16} />
                      </button>
                      {p.has_pdf && (
                        <button
                          onClick={() => handleDownload(p.id)}
                          disabled={downloading === p.id}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-[#060B16] bg-gradient-to-r from-[#14B8A6] to-[#2DD4BF] hover:opacity-90 disabled:opacity-50 transition-all cursor-pointer shadow-sm border-none rounded-lg"
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
        <div className="fixed inset-0 bg-[#060B16]/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-[#0D1728] border border-[#1D3045] rounded-3xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-[#1D3045]">
              <h3 className="text-lg font-bold text-[#F8FAFC]">Payslip - {monthNames[viewPayslip.month - 1]} {viewPayslip.year}</h3>
              <button onClick={() => setViewPayslip(null)} className="p-2 text-[#94A3B8] hover:text-[#F8FAFC] border-none bg-transparent cursor-pointer"><X size={20} /></button>
            </div>
            <div className="p-6 text-left">
               {viewPayslip.earnings && viewPayslip.earnings.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#94A3B8] mb-2">Earnings</h4>
                  <div className="bg-[#111D30] rounded-xl p-4 border border-[#1D3045]/60">
                    {viewPayslip.earnings.map((e) => (
                      <div key={e.id} className="flex justify-between py-1.5 text-xs font-semibold">
                        <span className="text-[#94A3B8]">{e.name}</span>
                        <span className="font-bold text-[#2DD4BF]">{formatCurrency(e.amount)}</span>
                      </div>
                    ))}
                    <div className="flex justify-between pt-2.5 mt-2.5 border-t border-[#1D3045]/60 text-sm">
                      <span className="font-bold text-[#F8FAFC]">Gross Salary</span>
                      <span className="font-black text-[#2DD4BF]">{formatCurrency(viewPayslip.gross_salary)}</span>
                    </div>
                  </div>
                </div>
              )}

              {viewPayslip.payslip_deductions && viewPayslip.payslip_deductions.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#94A3B8] mb-2">Deductions</h4>
                  <div className="bg-rose-950/20 rounded-xl p-4 border border-rose-900/30">
                    {viewPayslip.payslip_deductions.map((d) => (
                      <div key={d.id} className="flex justify-between py-1.5 text-xs font-semibold">
                        <span className="text-[#94A3B8]">{d.name}</span>
                        <span className="font-medium text-rose-400">{formatCurrency(d.amount)}</span>
                      </div>
                    ))}
                    <div className="flex justify-between pt-2.5 mt-2.5 border-t border-rose-900/30">
                      <span className="font-semibold text-rose-300">Total Deductions</span>
                      <span className="font-bold text-rose-400">{formatCurrency(viewPayslip.total_deductions)}</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="p-4 bg-[#14B8A6]/10 border border-[#14B8A6]/20 rounded-xl flex justify-between items-center mb-4">
                <span className="text-base font-bold text-[#2DD4BF]">Net Pay</span>
                <span className="text-2xl font-black text-[#2DD4BF]">{formatCurrency(viewPayslip.net_salary)}</span>
              </div>

              {viewPayslip.has_pdf && (
                <button onClick={() => handleDownload(viewPayslip.id)} disabled={downloading === viewPayslip.id}
                  className="bg-gradient-to-r from-[#14B8A6] to-[#2DD4BF] text-[#060B16] font-bold py-3 rounded-xl hover:opacity-90 disabled:opacity-50 transition-all cursor-pointer border-none flex items-center gap-2 w-full justify-center text-sm">
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
