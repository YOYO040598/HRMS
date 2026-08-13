import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../../api/axios';
import { formatCurrency, monthNames, formatDate } from '../../lib/utils';
import { Download, Wallet, FileText, Eye, X, Upload, Trash2, Plus, Loader2 } from 'lucide-react';
import type { Payslip } from '../../types';

interface EmployeeDoc {
  id: string;
  document_type: 'AADHAAR' | 'PAN' | 'RESUME' | 'APPOINTMENT_LETTER' | 'OTHER';
  title: string;
  file: string;
  description: string;
  expiry_date: string | null;
  created_at: string;
}

const DOCUMENT_TYPES = [
  { value: 'AADHAAR', label: 'Aadhaar Card' },
  { value: 'PAN', label: 'PAN Card' },
  { value: 'RESUME', label: 'Resume / CV' },
  { value: 'APPOINTMENT_LETTER', label: 'Appointment Letter' },
  { value: 'OTHER', label: 'Other Document' },
];

export default function EmployeePayslips() {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const initialTab = searchParams.get('tab') === 'documents' ? 'documents' : 'payslips';

  const [activeTab, setActiveTab] = useState<'payslips' | 'documents'>(initialTab);
  const [payslips, setPayslips] = useState<Payslip[]>([]);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState<number>(0);
  const [year, setYear] = useState(new Date().getFullYear());
  const [downloading, setDownloading] = useState<string | null>(null);
  const [viewPayslip, setViewPayslip] = useState<Payslip | null>(null);
  const [passwordProtect, setPasswordProtect] = useState(false);

  // Documents state
  const [documents, setDocuments] = useState<EmployeeDoc[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [docType, setDocType] = useState('OTHER');
  const [docTitle, setDocTitle] = useState('');
  const [docDescription, setDocDescription] = useState('');
  const [docExpiry, setDocExpiry] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  // Sync tab with URL search parameter
  useEffect(() => {
    const tabParam = new URLSearchParams(location.search).get('tab');
    if (tabParam === 'documents') {
      setActiveTab('documents');
    } else {
      setActiveTab('payslips');
    }
  }, [location.search]);

  useEffect(() => {
    if (activeTab === 'payslips') {
      fetchPayslips();
    } else {
      fetchDocuments();
    }
  }, [activeTab, month, year]);

  const fetchPayslips = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { year: String(year) };
      if (month > 0) params.month = String(month);
      const res = await api.get('/payroll/my-payslips/', { params });
      setPayslips(res.data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDocuments = async () => {
    setLoadingDocs(true);
    try {
      const res = await api.get('/employees/documents/');
      setDocuments(res.data.data || res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingDocs(false);
    }
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
    } finally {
      setDownloading(null);
    }
  };

  const handleViewPayslip = (p: Payslip) => {
    setViewPayslip(p);
    window.dispatchEvent(new Event('payslip-celebrate'));
  };

  const handleUploadDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      alert('Please select a file to upload');
      return;
    }
    setUploading(true);
    const formData = new FormData();
    formData.append('document_type', docType);
    formData.append('title', docTitle || selectedFile.name);
    formData.append('description', docDescription);
    if (docExpiry) {
      formData.append('expiry_date', docExpiry);
    }
    formData.append('file', selectedFile);

    try {
      await api.post('/employees/documents/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setShowUploadModal(false);
      setDocTitle('');
      setDocDescription('');
      setDocExpiry('');
      setSelectedFile(null);
      fetchDocuments();
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to upload document');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteDocument = async (docId: string) => {
    if (!window.confirm('Are you sure you want to delete this document?')) return;
    try {
      await api.delete(`/employees/documents/${docId}/`);
      fetchDocuments();
    } catch (err) {
      console.error(err);
      alert('Failed to delete document');
    }
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

      {/* Tabs and header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-[#1D3045]/60 pb-4 gap-4">
        <div className="text-left">
          <h2 className="text-3xl font-extrabold tracking-tight text-[#F8FAFC]">
            {activeTab === 'payslips' ? 'My Payslips' : 'Other Documents'}
          </h2>
          <p className="text-[#94A3B8] text-sm mt-1">
            {activeTab === 'payslips' 
              ? 'View and download your monthly salary slips' 
              : 'Manage your official onboarding and reference files'}
          </p>
        </div>

        {/* Tab Toggle Switches */}
        <div className="flex bg-[#0D1728]/80 border border-[#1D3045] p-1 rounded-full shadow-inner">
          <button
            onClick={() => setActiveTab('payslips')}
            className={`px-5 py-2 text-xs font-bold rounded-full transition-all duration-200 cursor-pointer ${
              activeTab === 'payslips'
                ? 'bg-gradient-to-br from-[#14B8A6] to-[#2DD4BF] text-[#060B16] shadow-md'
                : 'text-[#94A3B8] hover:text-[#F8FAFC]'
            }`}
          >
            Payslips
          </button>
          <button
            onClick={() => setActiveTab('documents')}
            className={`px-5 py-2 text-xs font-bold rounded-full transition-all duration-200 cursor-pointer ${
              activeTab === 'documents'
                ? 'bg-gradient-to-br from-[#14B8A6] to-[#2DD4BF] text-[#060B16] shadow-md'
                : 'text-[#94A3B8] hover:text-[#F8FAFC]'
            }`}
          >
            Other Documents
          </button>
        </div>
      </div>

      {activeTab === 'payslips' ? (
        /* ==================== PAYSLIPS TAB ==================== */
        <>
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
                <div className="w-10 h-10 bg-[#38BDF8]/10 rounded-xl flex items-center justify-center">
                  <FileText size={20} className="text-[#38BDF8]" />
                </div>
                <span className="text-xs font-bold text-[#94A3B8] uppercase tracking-wider">Total Generated</span>
              </div>
              <div className="text-3xl font-black text-[#38BDF8]">{payslips.length} Slips</div>
            </div>
          </div>

          <div className="glass-card-premium rounded-3xl p-6 border border-[#1D3045]/40 text-left">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <h3 className="text-lg font-bold text-[#F8FAFC]">Salary History</h3>
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                  <label className="text-xs font-bold text-[#94A3B8] uppercase">Month:</label>
                  <select
                    value={month}
                    onChange={(e) => setMonth(Number(e.target.value))}
                    className="bg-[#0D1728] border border-[#1D3045] rounded-xl px-3 py-1.5 text-xs text-[#F8FAFC] outline-none"
                  >
                    <option value={0}>All Months</option>
                    {monthNames.map((name, i) => (
                      <option key={name} value={i + 1}>{name}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-xs font-bold text-[#94A3B8] uppercase">Year:</label>
                  <input
                    type="number"
                    value={year}
                    onChange={(e) => setYear(Number(e.target.value))}
                    className="bg-[#0D1728] border border-[#1D3045] rounded-xl px-3 py-1.5 text-xs text-[#F8FAFC] outline-none w-20"
                  />
                </div>
                <label className="flex items-center gap-2 text-xs font-bold text-[#94A3B8] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={passwordProtect}
                    onChange={(e) => setPasswordProtect(e.target.checked)}
                    className="rounded border-[#1D3045] bg-[#0D1728] text-[#14B8A6] outline-none"
                  />
                  Password Protect PDF
                </label>
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center h-48">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#14B8A6]" />
              </div>
            ) : payslips.length === 0 ? (
              <div className="text-center py-16 text-[#64748B] text-sm">No payslips found for the selected period</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#1D3045]/60 text-xs font-bold text-[#94A3B8] uppercase">
                      <th className="px-6 py-4 text-left">Period</th>
                      <th className="px-6 py-4 text-right">Gross Salary</th>
                      <th className="px-6 py-4 text-right">Deductions</th>
                      <th className="px-6 py-4 text-right">Net Paid</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1D3045]/40">
                    {payslips.map((p) => (
                      <tr key={p.id} className="history-row">
                        <td className="px-6 py-4 font-bold text-[#F8FAFC]">
                          {monthNames[p.month - 1]} {p.year}
                        </td>
                        <td className="px-6 py-4 text-right font-semibold text-[#94A3B8]">
                          {formatCurrency(p.gross_salary)}
                        </td>
                        <td className="px-6 py-4 text-right font-semibold text-rose-400">
                          {formatCurrency(p.total_deductions)}
                        </td>
                        <td className="px-6 py-4 text-right font-black text-[#2DD4BF]">
                          {formatCurrency(p.net_salary)}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => handleViewPayslip(p)}
                              className="p-1.5 text-[#94A3B8] hover:text-[#2DD4BF] hover:bg-[#111D30] rounded-lg transition-all cursor-pointer border-none bg-transparent"
                              title="View Details"
                            >
                              <Eye size={16} />
                            </button>
                            {p.has_pdf && (
                              <button
                                onClick={() => handleDownload(p.id)}
                                disabled={downloading === p.id}
                                className="p-1.5 text-[#94A3B8] hover:text-[#2DD4BF] hover:bg-[#111D30] rounded-lg transition-all cursor-pointer border-none bg-transparent disabled:opacity-50"
                                title="Download PDF"
                              >
                                <Download size={16} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      ) : (
        /* ==================== DOCUMENTS TAB ==================== */
        <>
          <div className="flex justify-between items-center mb-4 text-left">
            <h3 className="text-lg font-bold text-[#F8FAFC]">Onboarding & Personal Folders</h3>
            <button
              onClick={() => setShowUploadModal(true)}
              className="flex items-center gap-2 bg-gradient-to-br from-[#14B8A6] to-[#2DD4BF] text-[#060B16] font-bold text-xs px-4 py-2.5 rounded-full hover:opacity-90 transition-all cursor-pointer shadow-lg shadow-[#14B8A6]/20 border-none"
            >
              <Plus size={14} /> Upload Document
            </button>
          </div>

          {loadingDocs ? (
            <div className="flex items-center justify-center h-48">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#14B8A6]" />
            </div>
          ) : documents.length === 0 ? (
            <div className="glass-card-premium rounded-3xl p-12 text-center border border-[#1D3045]/40 text-[#64748B]">
              <Upload className="mx-auto w-12 h-12 mb-3 text-[#64748B]" />
              <p className="font-bold text-[#94A3B8]">No personal documents uploaded yet</p>
              <p className="text-xs mt-1 max-w-sm mx-auto">Upload your Aadhaar Card, PAN Card, Resume, and other onboarding documents here.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-left">
              {documents.map((doc) => {
                const docTypeLabel = DOCUMENT_TYPES.find(t => t.value === doc.document_type)?.label || doc.document_type;
                return (
                  <div key={doc.id} className="glass-card-premium rounded-3xl p-5 border border-[#1D3045]/40 hover:border-[#14B8A6]/30 transition-all flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="px-2.5 py-1 text-[10px] font-bold bg-[#14B8A6]/10 text-[#2DD4BF] border border-[#14B8A6]/20 rounded-full uppercase">
                          {docTypeLabel}
                        </span>
                        <span className="text-[10px] text-[#64748B] font-semibold">{formatDate(doc.created_at)}</span>
                      </div>
                      <h4 className="font-bold text-base text-[#F8FAFC] line-clamp-1">{doc.title}</h4>
                      <p className="text-xs text-[#94A3B8] mt-1.5 line-clamp-2 h-8 leading-relaxed">
                        {doc.description || 'No description provided'}
                      </p>
                      {doc.expiry_date && (
                        <p className="text-[10px] text-amber-400 font-semibold mt-2">
                          Expires: {formatDate(doc.expiry_date)}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center justify-between border-t border-[#1D3045]/40 mt-4 pt-3.5">
                      <a
                        href={doc.file}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1.5 text-xs font-bold text-[#2DD4BF] hover:underline"
                      >
                        <Eye size={13} /> View Document
                      </a>
                      <button
                        onClick={() => handleDeleteDocument(doc.id)}
                        className="p-1.5 text-[#64748B] hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors border-none bg-transparent cursor-pointer"
                        title="Delete Document"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Document Upload Modal */}
          {showUploadModal && (
            <div className="fixed inset-0 bg-[#060B16]/80 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fadeIn">
              <div className="bg-[#0D1728] border border-[#1D3045] rounded-3xl shadow-xl w-full max-w-md overflow-hidden">
                <div className="flex items-center justify-between p-5 border-b border-[#1D3045]">
                  <h3 className="text-base font-bold text-[#F8FAFC]">Upload Document</h3>
                  <button
                    onClick={() => setShowUploadModal(false)}
                    className="p-1.5 text-[#94A3B8] hover:text-[#F8FAFC] border-none bg-transparent cursor-pointer"
                  >
                    <X size={18} />
                  </button>
                </div>

                <form onSubmit={handleUploadDocument} className="p-5 space-y-4 text-left">
                  <div>
                    <label className="block text-xs font-bold text-[#94A3B8] uppercase tracking-wider mb-1.5">Document Type</label>
                    <select
                      value={docType}
                      onChange={(e) => setDocType(e.target.value)}
                      className="w-full bg-[#0D1728] border border-[#1D3045] rounded-xl px-3 py-2 text-xs text-[#F8FAFC] outline-none focus:border-[#14B8A6]/80"
                    >
                      {DOCUMENT_TYPES.map((t) => (
                        <option key={t.value} value={t.value}>{t.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#94A3B8] uppercase tracking-wider mb-1.5">Document Title</label>
                    <input
                      type="text"
                      placeholder="e.g. Aadhaar Card Front"
                      value={docTitle}
                      onChange={(e) => setDocTitle(e.target.value)}
                      className="w-full bg-[#0D1728] border border-[#1D3045] rounded-xl px-3 py-2 text-xs text-[#F8FAFC] outline-none focus:border-[#14B8A6]/80"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#94A3B8] uppercase tracking-wider mb-1.5">Description (Optional)</label>
                    <textarea
                      placeholder="Enter short description..."
                      value={docDescription}
                      onChange={(e) => setDocDescription(e.target.value)}
                      className="w-full bg-[#0D1728] border border-[#1D3045] rounded-xl px-3 py-2 text-xs text-[#F8FAFC] outline-none focus:border-[#14B8A6]/80 h-20 resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#94A3B8] uppercase tracking-wider mb-1.5">Expiry Date (Optional)</label>
                    <input
                      type="date"
                      value={docExpiry}
                      onChange={(e) => setDocExpiry(e.target.value)}
                      className="w-full bg-[#0D1728] border border-[#1D3045] rounded-xl px-3 py-2 text-xs text-[#F8FAFC] outline-none focus:border-[#14B8A6]/80"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#94A3B8] uppercase tracking-wider mb-1.5">File Upload</label>
                    <div className="border border-dashed border-[#1D3045] rounded-xl p-4 flex flex-col items-center justify-center bg-[#0D1728]/40 hover:bg-[#0D1728] transition-colors cursor-pointer relative">
                      <input
                        type="file"
                        onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                        required
                      />
                      <Upload size={20} className="text-[#94A3B8] mb-1" />
                      <span className="text-xs font-bold text-[#94A3B8]">
                        {selectedFile ? selectedFile.name : 'Select document file'}
                      </span>
                      <span className="text-[10px] text-[#64748B] mt-0.5">PDF, JPG, PNG up to 10MB</span>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={uploading}
                    className="w-full bg-gradient-to-r from-[#14B8A6] to-[#2DD4BF] text-[#060B16] font-bold py-2.5 rounded-xl hover:opacity-90 transition-all cursor-pointer shadow-md disabled:opacity-50 border-none flex items-center justify-center gap-2 mt-2 text-xs"
                  >
                    {uploading ? (
                      <>
                        <Loader2 size={14} className="animate-spin" /> Uploading...
                      </>
                    ) : (
                      'Save Document'
                    )}
                  </button>
                </form>
              </div>
            </div>
          )}
        </>
      )}

      {/* Details View Modal */}
      {viewPayslip && (
        <div className="fixed inset-0 bg-[#060B16]/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-[#0D1728] border border-[#1D3045] rounded-3xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-[#1D3045]">
              <h3 className="text-lg font-bold text-[#F8FAFC]">
                Payslip - {monthNames[viewPayslip.month - 1]} {viewPayslip.year}
              </h3>
              <button
                onClick={() => setViewPayslip(null)}
                className="p-2 text-[#94A3B8] hover:text-[#F8FAFC] border-none bg-transparent cursor-pointer"
              >
                <X size={20} />
              </button>
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
                <button
                  onClick={() => handleDownload(viewPayslip.id)}
                  disabled={downloading === viewPayslip.id}
                  className="bg-gradient-to-r from-[#14B8A6] to-[#2DD4BF] text-[#060B16] font-bold py-3 rounded-xl hover:opacity-90 disabled:opacity-50 transition-all cursor-pointer border-none flex items-center gap-2 w-full justify-center text-sm"
                >
                  <Download size={16} />{' '}
                  {downloading === viewPayslip.id ? 'Downloading...' : 'Download Payslip'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
