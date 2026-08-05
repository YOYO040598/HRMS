import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import { formatDate } from '../../lib/utils';
import { LogOut, Calendar, Clock, HelpCircle, CheckCircle, AlertTriangle, AlertCircle, XCircle, X, Plus } from 'lucide-react';

interface ExitApproval {
  id: string;
  approver_name: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  level: number;
  comments: string;
  approved_at: string | null;
}

interface Resignation {
  id: string;
  last_working_day: string;
  reason: string;
  status: 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'ACCEPTED' | 'CANCELLED';
  notice_period_days: number;
  applied_date: string;
  comments: string;
  is_relieved: boolean;
  relieved_date: string | null;
  approvals: ExitApproval[];
}

export default function EmployeeExit() {
  const [resignations, setResignations] = useState<Resignation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showResignModal, setShowResignModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [lastWorkingDay, setLastWorkingDay] = useState('');
  const [noticePeriod, setNoticePeriod] = useState(30);
  const [reason, setReason] = useState('');

  useEffect(() => {
    fetchResignations();
  }, []);

  const fetchResignations = async () => {
    setLoading(true);
    try {
      const res = await api.get('/exit/resignations/');
      setResignations(res.data.data || res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/exit/apply/', {
        last_working_day: lastWorkingDay,
        notice_period_days: noticePeriod,
        reason: reason,
      });
      setShowResignModal(false);
      setLastWorkingDay('');
      setReason('');
      fetchResignations();
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to submit resignation request');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
      case 'ACCEPTED':
        return <span className="inline-flex items-center gap-1.5 text-xs font-bold bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-lg border border-emerald-200"><CheckCircle size={14} /> Approved / Accepted</span>;
      case 'REJECTED':
        return <span className="inline-flex items-center gap-1.5 text-xs font-bold bg-rose-50 text-rose-700 px-3 py-1.5 rounded-lg border border-rose-200"><XCircle size={14} /> Rejected</span>;
      default:
        return <span className="inline-flex items-center gap-1.5 text-xs font-bold bg-amber-50 text-amber-700 px-3 py-1.5 rounded-lg border border-amber-200 animate-pulse"><AlertCircle size={14} /> Pending Approval</span>;
    }
  };

  const getApprovalStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return 'text-emerald-600 bg-emerald-50 border-emerald-200';
      case 'REJECTED':
        return 'text-rose-600 bg-rose-50 border-rose-200';
      default:
        return 'text-amber-600 bg-amber-50 border-amber-200';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#ea580c]" />
      </div>
    );
  }

  const activeResignation = resignations.find(r => ['PENDING', 'APPROVED', 'ACCEPTED', 'DRAFT'].includes(r.status));
  const previousResignations = resignations.filter(r => r.id !== activeResignation?.id);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Resignation & Exit</h2>
          <p className="text-gray-500 text-sm">Submit resignation, track approvals, and view exit check-offs</p>
        </div>
        {!activeResignation && (
          <button
            onClick={() => setShowResignModal(true)}
            className="btn-primary flex items-center gap-2 cursor-pointer"
          >
            <Plus size={18} /> Submit Resignation
          </button>
        )}
      </div>

      {activeResignation ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main details */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-gray-50 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-rose-50 rounded-xl text-rose-700">
                    <LogOut size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-800 text-base">Active Resignation File</h3>
                    <p className="text-xs text-gray-400 font-medium">Applied on {formatDate(activeResignation.applied_date)}</p>
                  </div>
                </div>
                {getStatusBadge(activeResignation.status)}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm pt-2">
                <div className="bg-gray-50/50 p-4 rounded-xl border border-gray-100">
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-1">Last Working Day</span>
                  <div className="flex items-center gap-1.5 font-bold text-gray-700">
                    <Calendar size={16} className="text-gray-400" />
                    {formatDate(activeResignation.last_working_day)}
                  </div>
                </div>
                <div className="bg-gray-50/50 p-4 rounded-xl border border-gray-100">
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-1">Notice Period</span>
                  <div className="flex items-center gap-1.5 font-bold text-gray-700">
                    <Clock size={16} className="text-gray-400" />
                    {activeResignation.notice_period_days} Days
                  </div>
                </div>
                <div className="col-span-2 sm:col-span-1 bg-gray-50/50 p-4 rounded-xl border border-gray-100">
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-1">Relieving Status</span>
                  <div className="font-semibold text-gray-700">
                    {activeResignation.is_relieved ? (
                      <span className="text-emerald-700 font-bold">Relieved on {formatDate(activeResignation.relieved_date || '')}</span>
                    ) : (
                      <span className="text-amber-700 font-bold">Not Relieved yet</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-gray-50/50 p-4 rounded-xl border border-gray-100 text-sm">
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-1">Reason for Resignation</span>
                <p className="text-gray-700 italic">"{activeResignation.reason}"</p>
              </div>

              {activeResignation.comments && (
                <div className="bg-indigo-50/30 p-4 rounded-xl border border-indigo-100 text-sm">
                  <span className="text-[10px] text-indigo-800 font-bold uppercase tracking-wider block mb-1">Approver Remarks</span>
                  <p className="text-indigo-950 font-medium">{activeResignation.comments}</p>
                </div>
              )}
            </div>
          </div>

          {/* Approvals Chain */}
          <div className="space-y-6">
            <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-6 space-y-4">
              <h3 className="font-bold text-gray-800 text-base">Approval Tracking</h3>
              <p className="text-xs text-gray-400">Exit approval chain checks required for full settlement.</p>

              <div className="space-y-4 pt-2">
                {activeResignation.approvals && activeResignation.approvals.length > 0 ? (
                  activeResignation.approvals.map((app) => (
                    <div key={app.id} className="flex gap-4 items-start">
                      <div className="flex flex-col items-center shrink-0 mt-1">
                        <div className={`w-6 h-6 rounded-full border flex items-center justify-center text-xs font-bold ${
                          app.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-700 border-emerald-500' :
                          app.status === 'REJECTED' ? 'bg-rose-50 text-rose-700 border-rose-500' :
                          'bg-amber-50 text-amber-700 border-amber-500 animate-pulse'
                        }`}>
                          {app.level}
                        </div>
                        <div className="w-0.5 h-12 bg-gray-100" />
                      </div>
                      <div className="flex-1 bg-gray-50/50 p-3 rounded-xl border border-gray-100 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-gray-700">{app.approver_name || 'Approver'}</span>
                          <span className="text-[9px] font-bold uppercase tracking-wider">{app.status}</span>
                        </div>
                        <p className="text-[10px] text-gray-400 mt-0.5">Level {app.level} Exit Clearance</p>
                        {app.comments && (
                          <p className="text-gray-600 mt-2 italic bg-white p-2 rounded-lg border border-gray-100">"{app.comments}"</p>
                        )}
                        {app.approved_at && (
                          <p className="text-[9px] text-gray-400 mt-1.5">Processed: {formatDate(app.approved_at)}</p>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6 text-xs text-gray-400 italic">No approvals chain configured yet.</div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Empty State */
        <div className="bg-white border border-gray-100 rounded-xl p-12 text-center shadow-sm max-w-xl mx-auto mt-6">
          <LogOut size={48} className="text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-gray-800 mb-2">No Active Exit File</h3>
          <p className="text-gray-500 text-sm mb-6">
            You do not have any pending or approved resignation records. To initiate your offboarding process, click the button below to submit a formal resignation.
          </p>
          <button
            onClick={() => setShowResignModal(true)}
            className="btn-primary inline-flex items-center gap-2 text-sm cursor-pointer"
          >
            <Plus size={16} /> Submit Resignation Request
          </button>
        </div>
      )}

      {/* Resignation History */}
      {previousResignations.length > 0 && (
        <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-6 space-y-4">
          <h3 className="font-bold text-gray-800 text-base">Previous Resignations History</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-500">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50/50">
                <tr>
                  <th className="px-4 py-3">Applied Date</th>
                  <th className="px-4 py-3">Last Working Day</th>
                  <th className="px-4 py-3">Notice Period</th>
                  <th className="px-4 py-3">Reason</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {previousResignations.map((pr) => (
                  <tr key={pr.id} className="hover:bg-gray-50/50">
                    <td className="px-4 py-3 font-medium text-gray-900">{formatDate(pr.applied_date)}</td>
                    <td className="px-4 py-3">{formatDate(pr.last_working_day)}</td>
                    <td className="px-4 py-3">{pr.notice_period_days} Days</td>
                    <td className="px-4 py-3 max-w-xs truncate" title={pr.reason}>{pr.reason}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-bold ${
                        pr.status === 'REJECTED' ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-gray-100 text-gray-700'
                      }`}>
                        {pr.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600 max-w-xs truncate" title={pr.comments || '-'}>{pr.comments || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Resign Modal */}
      {showResignModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-800">Submit Resignation</h3>
              <button onClick={() => setShowResignModal(false)} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleApply} className="p-6 space-y-4">
              <div>
                <label className="label">Notice Period (Days) *</label>
                <input
                  type="number"
                  value={noticePeriod}
                  onChange={(e) => setNoticePeriod(Number(e.target.value))}
                  className="input-field mt-1"
                  min="1"
                  required
                />
              </div>

              <div>
                <label className="label">Requested Last Working Day *</label>
                <input
                  type="date"
                  value={lastWorkingDay}
                  onChange={(e) => setLastWorkingDay(e.target.value)}
                  className="input-field mt-1"
                  required
                />
              </div>

              <div>
                <label className="label">Reason for Resignation *</label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="input-field min-h-[100px] mt-1"
                  placeholder="State the reason for leaving (e.g. personal growth, higher studies)..."
                  required
                />
              </div>

              <div className="flex items-center gap-3 pt-4 border-t border-gray-100 justify-end">
                <button type="button" onClick={() => setShowResignModal(false)} className="btn-secondary">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary text-white font-bold cursor-pointer"
                >
                  {submitting ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
