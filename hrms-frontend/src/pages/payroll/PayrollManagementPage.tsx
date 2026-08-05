import { useEffect, useState } from 'react';
import api from '../../api/axios';
import type { Payslip, Employee } from '../../types';
import { formatCurrency, getStatusColor, monthNames } from '../../lib/utils';
import { Wallet, PlayCircle, CheckCircle, Banknote, Plus, X, Download, RefreshCw, Upload, FileText, Eye, ShieldAlert, History, Calendar, CheckSquare, Square, Trash2 } from 'lucide-react';

type Tab = 'generate' | 'upload' | 'published' | 'bulk' | 'audit_logs';

interface GenerateForm {
  employee_id: string;
  month: number;
  year: number;
  earnings: { name: string; amount: number }[];
  deductions: { name: string; amount: number }[];
  notes: string;
}

const DEFAULT_EARNINGS = [
  { name: 'Basic Salary', amount: 0 },
  { name: 'HRA', amount: 0 },
  { name: 'Special Allowance', amount: 0 },
  { name: 'Conveyance Allowance', amount: 0 },
  { name: 'Medical Allowance', amount: 0 },
  { name: 'Bonus', amount: 0 },
];

const DEFAULT_DEDUCTIONS = [
  { name: 'Provident Fund (PF)', amount: 0 },
  { name: 'Professional Tax', amount: 0 },
  { name: 'ESI', amount: 0 },
  { name: 'Income Tax (TDS)', amount: 0 },
];

export default function PayrollManagementPage() {
  const [tab, setTab] = useState<Tab>('published');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [payslips, setPayslips] = useState<Payslip[]>([]);
  const [loading, setLoading] = useState(true);
  const [monthFilter, setMonthFilter] = useState(new Date().getMonth() + 1);
  const [yearFilter, setYearFilter] = useState(new Date().getFullYear());
  const [statusFilter, setStatusFilter] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [publishingId, setPublishingId] = useState<string | null>(null);
  const [viewPayslip, setViewPayslip] = useState<Payslip | null>(null);

  // Bulk upload states
  const [bulkFile, setBulkFile] = useState<File | null>(null);
  const [bulkMonth, setBulkMonth] = useState(new Date().getMonth() + 1);
  const [bulkYear, setBulkYear] = useState(new Date().getFullYear());
  const [parsedPayslips, setParsedPayslips] = useState<any[]>([]);
  const [selectedPayslipIds, setSelectedPayslipIds] = useState<string[]>([]);
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduleTime, setScheduleTime] = useState('');
  const [bulkUploading, setBulkUploading] = useState(false);
  const [bulkProcessing, setBulkProcessing] = useState(false);

  // Audit log states
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [actionFilter, setActionFilter] = useState('');
  const [employeeIdFilter, setEmployeeIdFilter] = useState('');

  const [generateForm, setGenerateForm] = useState<GenerateForm>({
    employee_id: '',
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    earnings: DEFAULT_EARNINGS.map(e => ({ ...e })),
    deductions: DEFAULT_DEDUCTIONS.map(d => ({ ...d })),
    notes: '',
  });

  const [uploadForm, setUploadForm] = useState({
    employee_id: '',
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    pdf_file: null as File | null,
  });

  useEffect(() => {
    fetchEmployees();
    fetchPayslips();
  }, [monthFilter, yearFilter, statusFilter]);

  useEffect(() => {
    if (tab === 'audit_logs') {
      fetchAuditLogs();
    }
  }, [tab, actionFilter, employeeIdFilter]);

  useEffect(() => {
    if (generateForm.employee_id) {
      const fetchPreview = async () => {
        try {
          const res = await api.get('/payroll/employee-salary-preview/', {
            params: { employee_id: generateForm.employee_id }
          });
          if (res.data.success && res.data.data) {
            setGenerateForm(prev => ({
              ...prev,
              earnings: res.data.data.earnings,
              deductions: res.data.data.deductions
            }));
          }
        } catch (err) {
          console.error('Failed to fetch salary preview', err);
        }
      };
      fetchPreview();
    } else {
      setGenerateForm(prev => ({
        ...prev,
        earnings: DEFAULT_EARNINGS.map(e => ({ ...e })),
        deductions: DEFAULT_DEDUCTIONS.map(d => ({ ...d }))
      }));
    }
  }, [generateForm.employee_id]);

  const fetchEmployees = async () => {
    try {
      const res = await api.get('/employees/', { params: { page_size: 100 } });
      setEmployees(res.data.data || []);
    } catch (err) { console.error(err); }
  };

  const fetchPayslips = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {
        month: String(monthFilter),
        year: String(yearFilter),
      };
      if (statusFilter) params.status = statusFilter;
      const res = await api.get('/payroll/payslips/', { params });
      setPayslips(res.data.data || []);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const handleGeneratePayslip = async () => {
    if (!generateForm.employee_id) { alert('Select an employee'); return; }
    const hasEarnings = generateForm.earnings.some(e => e.amount > 0);
    if (!hasEarnings) { alert('Enter at least one earning amount'); return; }
    setSubmitting(true);
    try {
      const payload = {
        employee_id: generateForm.employee_id,
        month: generateForm.month,
        year: generateForm.year,
        earnings: generateForm.earnings.filter(e => e.amount > 0),
        deductions: generateForm.deductions.filter(d => d.amount > 0),
        notes: generateForm.notes,
      };
      await api.post('/payroll/generate-payslip/', payload);
      alert('Payslip generated successfully!');
      setGenerateForm({
        employee_id: '',
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
        earnings: DEFAULT_EARNINGS.map(e => ({ ...e })),
        deductions: DEFAULT_DEDUCTIONS.map(d => ({ ...d })),
        notes: '',
      });
      fetchPayslips();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to generate payslip');
    } finally { setSubmitting(false); }
  };

  const handleUploadPayslip = async () => {
    if (!uploadForm.employee_id) { alert('Select an employee'); return; }
    if (!uploadForm.pdf_file) { alert('Select a file to upload'); return; }
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('employee_id', uploadForm.employee_id);
      formData.append('month', String(uploadForm.month));
      formData.append('year', String(uploadForm.year));
      formData.append('pdf_file', uploadForm.pdf_file);
      await api.post('/payroll/upload-payslip/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      alert('Payslip uploaded successfully!');
      setUploadForm({
        employee_id: '',
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
        pdf_file: null,
      });
      fetchPayslips();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to upload payslip');
    } finally { setSubmitting(false); }
  };

  const handlePublish = async (payslipId: string) => {
    setPublishingId(payslipId);
    try {
      await api.post('/payroll/publish-payslip/', { payslip_id: payslipId });
      fetchPayslips();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to publish payslip');
    } finally { setPublishingId(null); }
  };

  const handleDownload = async (payslipId: string) => {
    setDownloadingId(payslipId);
    try {
      const res = await api.get(`/payroll/${payslipId}/admin-download/`, { responseType: 'blob' });
      const blob = new Blob([res.data]);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `payslip-${payslipId}.txt`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert('Failed to download payslip');
    } finally { setDownloadingId(null); }
  };

  const fetchAuditLogs = async () => {
    setLogsLoading(true);
    try {
      const params: Record<string, string> = {};
      if (actionFilter) params.action = actionFilter;
      if (employeeIdFilter) params.employee_id = employeeIdFilter;
      const res = await api.get('/payroll/audit-logs/', { params });
      setAuditLogs(res.data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLogsLoading(false);
    }
  };

  const handleBulkUpload = async () => {
    if (!bulkFile) { alert('Select a Zip or Merged PDF file to upload'); return; }
    setBulkUploading(true);
    setParsedPayslips([]);
    setSelectedPayslipIds([]);
    try {
      const formData = new FormData();
      formData.append('month', String(bulkMonth));
      formData.append('year', String(bulkYear));
      formData.append('file', bulkFile);
      const res = await api.post('/payroll/bulk-upload-payslip/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const data = res.data.data || [];
      setParsedPayslips(data);
      setSelectedPayslipIds(data.map((p: any) => p.id));
      alert(`Bulk upload processed successfully! Parsed ${data.length} records.`);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to process bulk upload');
    } finally {
      setBulkUploading(false);
    }
  };

  const handleBulkConfirm = async (action: 'publish' | 'draft' | 'delete') => {
    if (selectedPayslipIds.length === 0) { alert('Select at least one payslip'); return; }
    setBulkProcessing(true);
    try {
      const payload: Record<string, any> = {
        payslip_ids: selectedPayslipIds,
        action,
      };
      if (action === 'publish' && isScheduled && scheduleTime) {
        payload.publish_at = new Date(scheduleTime).toISOString();
      }
      await api.post('/payroll/bulk-confirm-payslip/', payload);
      alert(`Bulk operation completed successfully.`);
      setParsedPayslips([]);
      setSelectedPayslipIds([]);
      setBulkFile(null);
      setTab('published');
      fetchPayslips();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to process bulk confirmation');
    } finally {
      setBulkProcessing(false);
    }
  };

  const updateEarning = (index: number, field: 'name' | 'amount', value: string | number) => {
    const updated = [...generateForm.earnings];
    if (field === 'amount') {
      updated[index] = { ...updated[index], amount: Number(value) || 0 };
    } else {
      updated[index] = { ...updated[index], name: String(value) };
    }
    setGenerateForm({ ...generateForm, earnings: updated });
  };

  const updateDeduction = (index: number, field: 'name' | 'amount', value: string | number) => {
    const updated = [...generateForm.deductions];
    if (field === 'amount') {
      updated[index] = { ...updated[index], amount: Number(value) || 0 };
    } else {
      updated[index] = { ...updated[index], name: String(value) };
    }
    setGenerateForm({ ...generateForm, deductions: updated });
  };

  const totalEarnings = generateForm.earnings.reduce((sum, e) => sum + e.amount, 0);
  const totalDeductions = generateForm.deductions.reduce((sum, d) => sum + d.amount, 0);
  const netPay = totalEarnings - totalDeductions;

  const getEmployeeName = (empId: string) => {
    const emp = employees.find(e => e.employee_id === empId || e.id === empId);
    return emp ? emp.user_full_name : empId;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Payroll Management</h2>
          <p className="text-gray-500">Generate, upload, and manage employee payslips</p>
        </div>
        <button onClick={fetchPayslips} className="btn-secondary flex items-center gap-2">
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      <div className="flex gap-1 border-b border-gray-200">
        {([
          { key: 'published', label: 'Published Payslips', icon: FileText },
          { key: 'generate', label: 'Generate Payslip', icon: Plus },
          { key: 'upload', label: 'Upload Payslip', icon: Upload },
          { key: 'bulk', label: 'Bulk Operations', icon: Calendar },
          { key: 'audit_logs', label: 'Audit Logs', icon: History },
        ] as const).map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              tab === key
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Icon size={16} /> {label}
          </button>
        ))}
      </div>

      {tab === 'published' && (
        <>
          <div className="card">
            <div className="flex flex-col sm:flex-row gap-4 items-end">
              <div>
                <label className="label">Month</label>
                <select value={monthFilter} onChange={(e) => setMonthFilter(Number(e.target.value))} className="input-field w-48">
                  {monthNames.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Year</label>
                <select value={yearFilter} onChange={(e) => setYearFilter(Number(e.target.value))} className="input-field w-32">
                  {[2024, 2025, 2026, 2027].map((y) => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Status</label>
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="input-field w-40">
                  <option value="">All</option>
                  <option value="DRAFT">Draft</option>
                  <option value="PUBLISHED">Published</option>
                </select>
              </div>
            </div>
          </div>

          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="table-header">
                    <th className="px-6 py-3 text-left">Employee</th>
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
                    <tr><td colSpan={7} className="px-6 py-12 text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto" />
                    </td></tr>
                  ) : payslips.length === 0 ? (
                    <tr><td colSpan={7} className="px-6 py-8 text-center text-gray-400">No payslips found for this period</td></tr>
                  ) : payslips.map((p) => (
                    <tr key={p.id} className="hover:bg-gray-50">
                      <td className="table-cell">
                        <div>
                          <div className="font-medium text-gray-800">{p.employee_name}</div>
                          <div className="text-xs text-gray-400">{p.employee_id}</div>
                        </div>
                      </td>
                      <td className="table-cell">{monthNames[p.month - 1]} {p.year}</td>
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
                            <button onClick={() => handleDownload(p.id)} disabled={downloadingId === p.id}
                              className="p-1.5 rounded-lg text-indigo-600 hover:bg-indigo-50 disabled:opacity-50 transition-colors" title="Download">
                              <Download size={16} />
                            </button>
                          )}
                          {p.status === 'DRAFT' && (
                            <button onClick={() => handlePublish(p.id)} disabled={publishingId === p.id}
                              className="btn-success text-xs px-3 py-1.5 flex items-center gap-1">
                              <CheckCircle size={14} /> Publish
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
        </>
      )}

      {tab === 'generate' && (
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Generate Payslip</h3>
          <p className="text-sm text-gray-500 mb-6">Enter salary components to generate a payslip with a text file.</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="label">Employee</label>
              <select value={generateForm.employee_id} onChange={(e) => setGenerateForm({ ...generateForm, employee_id: e.target.value })} className="input-field">
                <option value="">Select Employee</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.employee_id}>{emp.employee_id} - {emp.user_full_name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Month</label>
              <select value={generateForm.month} onChange={(e) => setGenerateForm({ ...generateForm, month: Number(e.target.value) })} className="input-field">
                {monthNames.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Year</label>
              <select value={generateForm.year} onChange={(e) => setGenerateForm({ ...generateForm, year: Number(e.target.value) })} className="input-field">
                {[2024, 2025, 2026, 2027].map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <div className="w-2 h-2 bg-emerald-500 rounded-full" /> Earnings
              </h4>
              <div className="space-y-2">
                {generateForm.earnings.map((e, i) => (
                  <div key={i} className="flex gap-2">
                    <input type="text" value={e.name} onChange={(ev) => updateEarning(i, 'name', ev.target.value)}
                      className="input-field flex-1" placeholder="Component name" />
                    <input type="number" value={e.amount || ''} onChange={(ev) => updateEarning(i, 'amount', ev.target.value)}
                      className="input-field w-32" placeholder="Amount" min="0" />
                  </div>
                ))}
              </div>
              <div className="mt-3 p-3 bg-emerald-50 rounded-lg flex justify-between items-center">
                <span className="text-sm font-medium text-emerald-700">Total Earnings</span>
                <span className="text-lg font-bold text-emerald-700">{formatCurrency(totalEarnings)}</span>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <div className="w-2 h-2 bg-red-500 rounded-full" /> Deductions
              </h4>
              <div className="space-y-2">
                {generateForm.deductions.map((d, i) => (
                  <div key={i} className="flex gap-2">
                    <input type="text" value={d.name} onChange={(ev) => updateDeduction(i, 'name', ev.target.value)}
                      className="input-field flex-1" placeholder="Component name" />
                    <input type="number" value={d.amount || ''} onChange={(ev) => updateDeduction(i, 'amount', ev.target.value)}
                      className="input-field w-32" placeholder="Amount" min="0" />
                  </div>
                ))}
              </div>
              <div className="mt-3 p-3 bg-red-50 rounded-lg flex justify-between items-center">
                <span className="text-sm font-medium text-red-700">Total Deductions</span>
                <span className="text-lg font-bold text-red-700">{formatCurrency(totalDeductions)}</span>
              </div>
            </div>
          </div>

          <div className="p-4 bg-gray-50 rounded-lg mb-6 flex justify-between items-center">
            <span className="text-base font-semibold text-gray-700">Net Pay</span>
            <span className="text-2xl font-bold text-indigo-600">{formatCurrency(netPay)}</span>
          </div>

          <div className="mb-6">
            <label className="label">Notes (optional)</label>
            <textarea value={generateForm.notes} onChange={(e) => setGenerateForm({ ...generateForm, notes: e.target.value })}
              className="input-field" rows={2} placeholder="Any additional notes..." />
          </div>

          <button onClick={handleGeneratePayslip} disabled={submitting || !generateForm.employee_id}
            className="btn-primary flex items-center gap-2">
            {submitting ? 'Generating...' : <><FileText size={16} /> Generate Payslip</>}
          </button>
        </div>
      )}

      {tab === 'upload' && (
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Upload Payslip</h3>
          <p className="text-sm text-gray-500 mb-6">Upload a pre-made payslip file (PDF or text) for an employee.</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="label">Employee</label>
              <select value={uploadForm.employee_id} onChange={(e) => setUploadForm({ ...uploadForm, employee_id: e.target.value })} className="input-field">
                <option value="">Select Employee</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.employee_id}>{emp.employee_id} - {emp.user_full_name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Month</label>
              <select value={uploadForm.month} onChange={(e) => setUploadForm({ ...uploadForm, month: Number(e.target.value) })} className="input-field">
                {monthNames.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Year</label>
              <select value={uploadForm.year} onChange={(e) => setUploadForm({ ...uploadForm, year: Number(e.target.value) })} className="input-field">
                {[2024, 2025, 2026, 2027].map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          </div>

          <div className="mb-6">
            <label className="label">Payslip File</label>
            <input type="file" accept=".pdf,.txt,.png,.jpg"
              onChange={(e) => setUploadForm({ ...uploadForm, pdf_file: e.target.files?.[0] || null })}
              className="input-field" />
            {uploadForm.pdf_file && (
              <p className="text-sm text-emerald-600 mt-1">Selected: {uploadForm.pdf_file.name}</p>
            )}
          </div>

          <button onClick={handleUploadPayslip} disabled={submitting || !uploadForm.employee_id || !uploadForm.pdf_file}
            className="btn-primary flex items-center gap-2">
            {submitting ? 'Uploading...' : <><Upload size={16} /> Upload & Save</>}
          </button>
        </div>
      )}

      {tab === 'bulk' && (
        <div className="space-y-6">
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Bulk Upload & Auto-Parsing</h3>
            <p className="text-sm text-gray-500 mb-6">Upload a ZIP archive containing multiple employee payslips or a single merged PDF containing all payslips. The system will split and auto-match them using Regex/OCR text-extraction.</p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div>
                <label className="label">Month</label>
                <select value={bulkMonth} onChange={(e) => setBulkMonth(Number(e.target.value))} className="input-field">
                  {monthNames.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Year</label>
                <select value={bulkYear} onChange={(e) => setBulkYear(Number(e.target.value))} className="input-field">
                  {[2024, 2025, 2026, 2027].map((y) => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
              <div>
                <label className="label">ZIP / Merged PDF File</label>
                <input type="file" accept=".zip,.pdf"
                  onChange={(e) => setBulkFile(e.target.files?.[0] || null)}
                  className="input-field" />
              </div>
            </div>

            <div className="flex items-center gap-2 mb-6">
              <input type="checkbox" id="scheduled_pub" checked={isScheduled} onChange={(e) => setIsScheduled(e.target.checked)} className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500" />
              <label htmlFor="scheduled_pub" className="text-sm font-medium text-gray-700">Schedule Release Date (Draft until scheduled date)</label>
            </div>

            {isScheduled && (
              <div className="mb-6 max-w-xs">
                <label className="label">Release Time</label>
                <input type="datetime-local" value={scheduleTime} onChange={(e) => setScheduleTime(e.target.value)} className="input-field" />
              </div>
            )}

            <button onClick={handleBulkUpload} disabled={bulkUploading || !bulkFile} className="btn-primary flex items-center gap-2">
              {bulkUploading ? 'Uploading & Parsing...' : <><Upload size={16} /> Upload & Process Batch</>}
            </button>
          </div>

          {parsedPayslips.length > 0 && (
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">Parsed Payslips Preview</h3>
                <div className="flex gap-2">
                  <button onClick={() => handleBulkConfirm('publish')} disabled={bulkProcessing} className="btn-success text-sm flex items-center gap-1.5 py-2 px-3 bg-emerald-600 hover:bg-emerald-700">
                    <CheckCircle size={16} /> Confirm & Publish Selected
                  </button>
                  <button onClick={() => handleBulkConfirm('draft')} disabled={bulkProcessing} className="btn-secondary text-sm flex items-center gap-1.5 py-2 px-3">
                    <FileText size={16} /> Save as Draft
                  </button>
                  <button onClick={() => handleBulkConfirm('delete')} disabled={bulkProcessing} className="btn-danger text-sm flex items-center gap-1.5 py-2 px-3 bg-red-600 hover:bg-red-700">
                    <Trash2 size={16} /> Discard Batch
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="table-header">
                      <th className="px-4 py-3 text-center w-12">
                        <button onClick={() => {
                          if (selectedPayslipIds.length === parsedPayslips.length) setSelectedPayslipIds([]);
                          else setSelectedPayslipIds(parsedPayslips.map(p => p.id));
                        }} className="text-gray-500 hover:text-gray-700">
                          {selectedPayslipIds.length === parsedPayslips.length ? <CheckSquare size={18} className="text-indigo-600 mx-auto" /> : <Square size={18} className="mx-auto" />}
                        </button>
                      </th>
                      <th className="px-4 py-3 text-left">Source Page/File</th>
                      <th className="px-4 py-3 text-left">Parsed Employee ID</th>
                      <th className="px-4 py-3 text-left">Matched Profile</th>
                      <th className="px-4 py-3 text-right">Extracted Net Pay</th>
                      <th className="px-4 py-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {parsedPayslips.map((p) => (
                      <tr key={p.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-center">
                          <button onClick={() => {
                            if (selectedPayslipIds.includes(p.id)) setSelectedPayslipIds(selectedPayslipIds.filter(id => id !== p.id));
                            else setSelectedPayslipIds([...selectedPayslipIds, p.id]);
                          }} className="text-gray-500 hover:text-gray-700">
                            {selectedPayslipIds.includes(p.id) ? <CheckSquare size={18} className="text-indigo-600 mx-auto" /> : <Square size={18} className="mx-auto" />}
                          </button>
                        </td>
                        <td className="table-cell px-4">{p.filename}</td>
                        <td className="table-cell px-4 font-mono text-sm">{p.parsed_employee_id || 'Not Found'}</td>
                        <td className="table-cell px-4">
                          <span className={`badge ${p.matched ? 'badge-success' : 'badge-danger'}`}>
                            {p.employee_name}
                          </span>
                        </td>
                        <td className="table-cell px-4 text-right font-medium text-gray-800">{formatCurrency(p.net_salary)}</td>
                        <td className="table-cell px-4 text-center">
                          <span className="text-xs font-semibold px-2 py-0.5 bg-yellow-100 text-yellow-800 rounded-full">Pending Verification</span>
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

      {tab === 'audit_logs' && (
        <div className="space-y-6">
          <div className="card">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">Action Filter</label>
                <select value={actionFilter} onChange={(e) => setActionFilter(e.target.value)} className="input-field">
                  <option value="">All Actions</option>
                  <option value="UPLOAD">Upload</option>
                  <option value="PUBLISH">Publish</option>
                  <option value="DOWNLOAD">Download</option>
                  <option value="VIEW">View</option>
                  <option value="DELETE">Delete</option>
                </select>
              </div>
              <div>
                <label className="label">Search Employee ID</label>
                <input type="text" value={employeeIdFilter} onChange={(e) => setEmployeeIdFilter(e.target.value)} placeholder="e.g. EMP001" className="input-field" />
              </div>
            </div>
          </div>

          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="table-header">
                    <th className="px-6 py-3 text-left">Timestamp</th>
                    <th className="px-6 py-3 text-left">Performed By</th>
                    <th className="px-6 py-3 text-center">Action</th>
                    <th className="px-6 py-3 text-left">Target Employee</th>
                    <th className="px-6 py-3 text-left">IP Address</th>
                    <th className="px-6 py-3 text-left">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {logsLoading ? (
                    <tr><td colSpan={6} className="px-6 py-12 text-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto" /></td></tr>
                  ) : auditLogs.length === 0 ? (
                    <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-400">No audit logs found</td></tr>
                  ) : auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50 text-sm">
                      <td className="table-cell">{new Date(log.timestamp).toLocaleString()}</td>
                      <td className="table-cell font-medium">{log.user_name || 'System'}</td>
                      <td className="table-cell text-center">
                        <span className={`badge ${
                          log.action === 'UPLOAD' ? 'badge-info' :
                          log.action === 'PUBLISH' ? 'badge-success' :
                          log.action === 'DOWNLOAD' ? 'bg-indigo-100 text-indigo-800' :
                          log.action === 'DELETE' ? 'badge-danger' : 'bg-gray-100 text-gray-800'
                        }`}>{log.action}</span>
                      </td>
                      <td className="table-cell">
                        {log.employee_id ? `${log.employee_name} (${log.employee_id})` : 'N/A'}
                      </td>
                      <td className="table-cell font-mono text-xs">{log.ip_address || 'N/A'}</td>
                      <td className="table-cell text-gray-500 max-w-xs truncate" title={log.details}>{log.details}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {viewPayslip && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-800">Payslip Details</h3>
              <button onClick={() => setViewPayslip(null)} className="p-2 text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div><span className="text-sm text-gray-500">Employee</span><p className="font-medium">{viewPayslip.employee_name} ({viewPayslip.employee_id})</p></div>
                <div><span className="text-sm text-gray-500">Period</span><p className="font-medium">{monthNames[viewPayslip.month - 1]} {viewPayslip.year}</p></div>
                <div><span className="text-sm text-gray-500">Department</span><p className="font-medium">{viewPayslip.department_name || 'N/A'}</p></div>
                <div><span className="text-sm text-gray-500">Designation</span><p className="font-medium">{viewPayslip.designation_name || 'N/A'}</p></div>
                <div><span className="text-sm text-gray-500">Status</span><p><span className={getStatusColor(viewPayslip.status)}>{viewPayslip.status}</span></p></div>
                <div><span className="text-sm text-gray-500">Generated By</span><p className="font-medium">{viewPayslip.generated_by_name || 'N/A'}</p></div>
              </div>

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

              <div className="p-4 bg-indigo-50 rounded-lg flex justify-between items-center">
                <span className="text-base font-semibold text-indigo-800">Net Pay</span>
                <span className="text-2xl font-bold text-indigo-700">{formatCurrency(viewPayslip.net_salary)}</span>
              </div>

              {viewPayslip.has_pdf && (
                <div className="mt-4">
                  <button onClick={() => handleDownload(viewPayslip.id)} disabled={downloadingId === viewPayslip.id}
                    className="btn-primary flex items-center gap-2 w-full justify-center">
                    <Download size={16} /> {downloadingId === viewPayslip.id ? 'Downloading...' : 'Download Payslip'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
