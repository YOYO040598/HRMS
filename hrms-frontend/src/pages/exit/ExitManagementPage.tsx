import { useEffect, useState } from 'react';
import api from '../../api/axios';
import type { Resignation, FullAndFinal, ExperienceLetter, Employee } from '../../types';
import { formatDate, formatCurrency, getStatusColor } from '../../lib/utils';
import { LogOut, Plus, CheckCircle, XCircle, FileText, Clock, X, Loader2, Search } from 'lucide-react';

type Tab = 'resignations' | 'fnf' | 'experience';

export default function ExitManagementPage() {
  const [activeTab, setActiveTab] = useState<Tab>('resignations');
  const [loading, setLoading] = useState(true);

  // Resignations
  const [resignations, setResignations] = useState<Resignation[]>([]);
  const [showResignModal, setShowResignModal] = useState(false);
  const [resignForm, setResignForm] = useState({ employee_id: '', last_working_day: '', reason: '', notice_period_days: 30, force_exit: false });
  const [submitting, setSubmitting] = useState(false);

  // F&F
  const [fnfList, setFnfList] = useState<FullAndFinal[]>([]);
  const [showCompleteFnfModal, setShowCompleteFnfModal] = useState<string | null>(null);
  const [fnfForm, setFnfForm] = useState({ final_amount: '', notes: '' });

  // Experience Letters
  const [letters, setLetters] = useState<ExperienceLetter[]>([]);

  // Employees
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [employeeSearch, setEmployeeSearch] = useState('');

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    try {
      const [resignRes, fnfRes, letterRes] = await Promise.all([
        api.get('/exit/resignations/'),
        api.get('/exit/fnf/'),
        api.get('/exit/experience-letters/'),
      ]);
      setResignations(resignRes.data.data || resignRes.data.results || []);
      setFnfList(fnfRes.data.data || fnfRes.data.results || []);
      setLetters(letterRes.data.data || letterRes.data.results || []);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const fetchEmployees = async () => {
    try {
      const res = await api.get('/employees/');
      setEmployees(res.data.data || res.data.results || []);
    } catch (err) { console.error(err); }
  };

  const handleCreateResignation = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/exit/apply/', resignForm);
      setShowResignModal(false);
      setResignForm({ employee_id: '', last_working_day: '', reason: '', notice_period_days: 30, force_exit: false });
      fetchAll();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to submit resignation');
    } finally { setSubmitting(false); }
  };

  const handleApprove = async (id: string) => {
    try {
      await api.post('/exit/approve/', { resignation_id: id });
      fetchAll();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to approve');
    }
  };

  const handleReject = async (id: string) => {
    const comments = prompt('Rejection reason:');
    if (comments === null) return;
    try {
      await api.post('/exit/reject/', { resignation_id: id, comments });
      fetchAll();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to reject');
    }
  };

  const handleRelieve = async (id: string) => {
    if (!confirm('Are you sure you want to relieve this employee?')) return;
    try {
      await api.post('/exit/relieve/', { resignation_id: id });
      fetchAll();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to relieve');
    }
  };

  const handleInitFnf = async (resignationId: string) => {
    try {
      await api.post('/exit/init-fnf/', { resignation_id: resignationId });
      fetchAll();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to initiate F&F');
    }
  };

  const handleCompleteFnf = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showCompleteFnfModal) return;
    setSubmitting(true);
    try {
      await api.post('/exit/complete-fnf/', {
        fnf_id: showCompleteFnfModal,
        final_amount: Number(fnfForm.final_amount),
        notes: fnfForm.notes,
      });
      setShowCompleteFnfModal(null);
      setFnfForm({ final_amount: '', notes: '' });
      fetchAll();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to complete F&F');
    } finally { setSubmitting(false); }
  };

  const handleGenerateLetter = async (employeeId: string) => {
    try {
      await api.post('/exit/experience-letter/', { employee_id: employeeId });
      fetchAll();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to generate letter');
    }
  };

  const openResignModal = () => {
    fetchEmployees();
    setShowResignModal(true);
  };

  const filteredEmployees = employees.filter((e) =>
    e.user_full_name?.toLowerCase().includes(employeeSearch.toLowerCase()) ||
    e.employee_id?.toLowerCase().includes(employeeSearch.toLowerCase())
  );

  const tabs = [
    { key: 'resignations' as Tab, label: 'Resignations', icon: LogOut },
    { key: 'fnf' as Tab, label: 'F&F Settlements', icon: Wallet },
    { key: 'experience' as Tab, label: 'Experience Letters', icon: FileText },
  ];

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Exit Management</h2>
        <p className="text-gray-500">Manage resignations, settlements, and experience letters</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {tabs.map((t) => (
          <button key={t.key} onClick={() => setActiveTab(t.key)} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === t.key ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            <t.icon size={16} /> {t.label}
          </button>
        ))}
      </div>

      {/* Resignations Tab */}
      {activeTab === 'resignations' && (
        <>
          <div className="flex justify-end">
            <button onClick={openResignModal} className="btn-primary flex items-center gap-2"><Plus size={18} /> New Resignation</button>
          </div>
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="table-header">
                    <th className="px-6 py-3">Employee</th>
                    <th className="px-6 py-3">Employee ID</th>
                    <th className="px-6 py-3">Last Working Day</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3">Applied Date</th>
                    <th className="px-6 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {resignations.length === 0 ? (
                    <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-400">No resignation records</td></tr>
                  ) : resignations.map((r) => (
                    <tr key={r.id} className="hover:bg-gray-50">
                      <td className="table-cell font-medium">{r.employee_name}</td>
                      <td className="table-cell font-mono text-xs">{r.employee_id}</td>
                      <td className="table-cell">{formatDate(r.last_working_day)}</td>
                      <td className="table-cell"><span className={`badge ${getStatusColor(r.status)}`}>{r.status}</span></td>
                      <td className="table-cell">{formatDate(r.applied_date)}</td>
                      <td className="table-cell">
                        <div className="flex items-center gap-1">
                          {r.status === 'PENDING' && (
                            <>
                              <button onClick={() => handleApprove(r.id)} className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors" title="Approve">
                                <CheckCircle size={16} />
                              </button>
                              <button onClick={() => handleReject(r.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Reject">
                                <XCircle size={16} />
                              </button>
                            </>
                          )}
                          {r.status === 'APPROVED' && !r.is_relieved && (
                            <button onClick={() => handleRelieve(r.id)} className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="Relieve">
                              <LogOut size={16} />
                            </button>
                          )}
                          {r.status === 'APPROVED' && r.is_relieved && (
                            <span className="text-xs text-green-600 font-medium">Relieved</span>
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

      {/* F&F Tab */}
      {activeTab === 'fnf' && (
        <>
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="table-header">
                    <th className="px-6 py-3">Employee</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3">Final Amount</th>
                    <th className="px-6 py-3">Pending Dues</th>
                    <th className="px-6 py-3">Assets Returned</th>
                    <th className="px-6 py-3">Documents Submitted</th>
                    <th className="px-6 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {fnfList.length === 0 ? (
                    <tr><td colSpan={7} className="px-6 py-8 text-center text-gray-400">No F&F settlements</td></tr>
                  ) : fnfList.map((f) => (
                    <tr key={f.id} className="hover:bg-gray-50">
                      <td className="table-cell font-medium">{f.employee_name}</td>
                      <td className="table-cell"><span className={`badge ${getStatusColor(f.status)}`}>{f.status}</span></td>
                      <td className="table-cell font-semibold">{formatCurrency(f.final_settlement_amount)}</td>
                      <td className="table-cell text-red-600">{formatCurrency(f.pending_dues)}</td>
                      <td className="table-cell">{f.assets_returned ? <span className="text-green-600 font-medium">Yes</span> : <span className="text-red-500">No</span>}</td>
                      <td className="table-cell">{f.documents_submitted ? <span className="text-green-600 font-medium">Yes</span> : <span className="text-red-500">No</span>}</td>
                      <td className="table-cell">
                        {f.status === 'INITIATED' && (
                          <button onClick={() => setShowCompleteFnfModal(f.id)} className="btn-primary text-xs px-3 py-1">Complete F&F</button>
                        )}
                        {f.status === 'COMPLETED' && (
                          <span className="text-xs text-green-600 font-medium">Completed</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Experience Letters Tab */}
      {activeTab === 'experience' && (
        <>
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="table-header">
                    <th className="px-6 py-3">Employee</th>
                    <th className="px-6 py-3">Issue Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {letters.length === 0 ? (
                    <tr><td colSpan={2} className="px-6 py-8 text-center text-gray-400">No experience letters generated</td></tr>
                  ) : letters.map((l) => (
                    <tr key={l.id} className="hover:bg-gray-50">
                      <td className="table-cell font-medium">{l.employee_name}</td>
                      <td className="table-cell">{formatDate(l.issue_date)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* New Resignation Modal */}
      {showResignModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-800">New Resignation</h3>
              <button onClick={() => setShowResignModal(false)} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
            </div>
            <form onSubmit={handleCreateResignation} className="space-y-4">
              <div>
                <label className="label">Employee *</label>
                <input
                  type="text"
                  placeholder="Search employee..."
                  value={employeeSearch}
                  onChange={(e) => setEmployeeSearch(e.target.value)}
                  className="input-field mb-1"
                />
                <select
                  value={resignForm.employee_id}
                  onChange={(e) => setResignForm({ ...resignForm, employee_id: e.target.value })}
                  className="input-field"
                  required
                >
                  <option value="">Select employee</option>
                  {filteredEmployees.map((emp) => (
                    <option key={emp.id} value={emp.id}>{emp.user_full_name} ({emp.employee_id})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Last Working Day *</label>
                <input type="date" value={resignForm.last_working_day} onChange={(e) => setResignForm({ ...resignForm, last_working_day: e.target.value })} className="input-field" required />
              </div>
              <div>
                <label className="label">Notice Period (Days) *</label>
                <input type="number" min="0" value={resignForm.notice_period_days} onChange={(e) => setResignForm({ ...resignForm, notice_period_days: Number(e.target.value) })} className="input-field" required />
              </div>
              <div>
                <label className="label">Reason *</label>
                <textarea value={resignForm.reason} onChange={(e) => setResignForm({ ...resignForm, reason: e.target.value })} className="input-field" rows={3} placeholder="Reason for resignation" required />
              </div>
              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="force_exit"
                  checked={resignForm.force_exit}
                  onChange={(e) => setResignForm({ ...resignForm, force_exit: e.target.checked })}
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                />
                <label htmlFor="force_exit" className="text-sm font-semibold text-gray-700 cursor-pointer">
                  Approve immediately (Force Exit)
                </label>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowResignModal(false)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" disabled={submitting} className="btn-primary flex-1 flex items-center justify-center gap-2">
                  {submitting ? <><Loader2 size={16} className="animate-spin" /> Submitting...</> : 'Submit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Complete F&F Modal */}
      {showCompleteFnfModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-800">Complete F&F Settlement</h3>
              <button onClick={() => setShowCompleteFnfModal(null)} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
            </div>
            <form onSubmit={handleCompleteFnf} className="space-y-4">
              <div>
                <label className="label">Final Settlement Amount *</label>
                <input type="number" min="0" step="0.01" value={fnfForm.final_amount} onChange={(e) => setFnfForm({ ...fnfForm, final_amount: e.target.value })} className="input-field" required placeholder="0.00" />
              </div>
              <div>
                <label className="label">Notes</label>
                <textarea value={fnfForm.notes} onChange={(e) => setFnfForm({ ...fnfForm, notes: e.target.value })} className="input-field" rows={3} placeholder="Settlement notes..." />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowCompleteFnfModal(null)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" disabled={submitting} className="btn-primary flex-1 flex items-center justify-center gap-2">
                  {submitting ? <><Loader2 size={16} className="animate-spin" /> Completing...</> : 'Complete F&F'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function Wallet({ size, className }: { size: number; className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1" />
      <path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4" />
    </svg>
  );
}
