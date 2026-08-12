import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import { formatDate } from '../../lib/utils';
import { LogOut, Calendar, Clock, CheckCircle, AlertCircle, XCircle, X, Plus } from 'lucide-react';

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
      window.dispatchEvent(new Event('mascot-resignation'));
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
        return <span className="inline-flex items-center gap-1.5 text-xs font-bold bg-[#14B8A6]/10 text-[#2DD4BF] px-3 py-1.5 rounded-lg border border-[#14B8A6]/20"><CheckCircle size={14} /> Approved / Accepted</span>;
      case 'REJECTED':
        return <span className="inline-flex items-center gap-1.5 text-xs font-bold bg-rose-500/10 text-rose-400 px-3 py-1.5 rounded-lg border border-rose-500/20"><XCircle size={14} /> Rejected</span>;
      default:
        return <span className="inline-flex items-center gap-1.5 text-xs font-bold bg-amber-500/10 text-amber-400 px-3 py-1.5 rounded-lg border border-amber-500/20 animate-pulse"><AlertCircle size={14} /> Pending Approval</span>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#14B8A6]" />
      </div>
    );
  }

  const activeResignation = resignations.find(r => ['PENDING', 'APPROVED', 'ACCEPTED', 'DRAFT'].includes(r.status));
  const previousResignations = resignations.filter(r => r.id !== activeResignation?.id);

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

      <div className="flex items-center justify-between">
        <div className="text-left">
          <h2 className="text-3xl font-extrabold tracking-tight text-[#F8FAFC]">Resignation & Exit</h2>
          <p className="text-[#94A3B8] text-sm mt-1">Submit resignation, track approvals, and view exit check-offs</p>
        </div>
        {!activeResignation && (
          <button
            onClick={() => setShowResignModal(true)}
            className="bg-gradient-to-r from-[#14B8A6] to-[#2DD4BF] text-[#060B16] font-bold px-4 py-2.5 rounded-xl transition-all shadow-md flex items-center gap-2 text-sm cursor-pointer border-none"
          >
            <Plus size={18} /> Submit Resignation
          </button>
        )}
      </div>

      {activeResignation ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-left">
          {/* Main details */}
          <div className="lg:col-span-2 space-y-6">
            <div className="glass-card-premium rounded-3xl p-6 space-y-4 border border-[#1D3045]/40">
              <div className="flex items-center justify-between border-b border-[#1D3045]/40 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-rose-500/10 rounded-xl text-rose-400">
                    <LogOut size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-[#F8FAFC] text-base">Active Resignation File</h3>
                    <p className="text-xs text-[#94A3B8] font-medium">Applied on {formatDate(activeResignation.applied_date)}</p>
                  </div>
                </div>
                {getStatusBadge(activeResignation.status)}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm pt-2">
                <div className="bg-[#111D30]/60 p-4 rounded-xl border border-[#1D3045]/40">
                  <span className="text-[10px] text-[#64748B] font-bold uppercase tracking-wider block mb-1">Last Working Day</span>
                  <div className="flex items-center gap-1.5 font-bold text-[#F8FAFC]">
                    <Calendar size={16} className="text-[#94A3B8]" />
                    {formatDate(activeResignation.last_working_day)}
                  </div>
                </div>
                <div className="bg-[#111D30]/60 p-4 rounded-xl border border-[#1D3045]/40">
                  <span className="text-[10px] text-[#64748B] font-bold uppercase tracking-wider block mb-1">Notice Period</span>
                  <div className="flex items-center gap-1.5 font-bold text-[#F8FAFC]">
                    <Clock size={16} className="text-[#94A3B8]" />
                    {activeResignation.notice_period_days} Days
                  </div>
                </div>
                <div className="col-span-2 sm:col-span-1 bg-[#111D30]/60 p-4 rounded-xl border border-[#1D3045]/40">
                  <span className="text-[10px] text-[#64748B] font-bold uppercase tracking-wider block mb-1">Relieving Status</span>
                  <div className="font-semibold text-[#F8FAFC]">
                    {activeResignation.is_relieved ? (
                      <span className="text-[#2DD4BF] font-bold">Relieved on {formatDate(activeResignation.relieved_date || '')}</span>
                    ) : (
                      <span className="text-amber-400 font-bold">Not Relieved yet</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-[#111D30]/60 p-4 rounded-xl border border-[#1D3045]/40 text-sm">
                <span className="text-[10px] text-[#64748B] font-bold uppercase tracking-wider block mb-1">Reason for Resignation</span>
                <p className="text-[#94A3B8] italic">"{activeResignation.reason}"</p>
              </div>

              {activeResignation.comments && (
                <div className="bg-[#14B8A6]/10 p-4 rounded-xl border border-[#14B8A6]/20 text-sm">
                  <span className="text-[10px] text-[#2DD4BF] font-bold uppercase tracking-wider block mb-1">Approver Remarks</span>
                  <p className="text-[#F8FAFC] font-medium">{activeResignation.comments}</p>
                </div>
              )}
            </div>
          </div>

          {/* Approvals Chain */}
          <div className="space-y-6 text-left">
            <div className="glass-card-premium rounded-3xl p-6 space-y-4 border border-[#1D3045]/40">
              <h3 className="font-bold text-[#F8FAFC] text-base">Approval Tracking</h3>
              <p className="text-xs text-[#94A3B8]">Exit approval chain checks required for full settlement.</p>

              <div className="space-y-4 pt-2">
                {activeResignation.approvals && activeResignation.approvals.length > 0 ? (
                  activeResignation.approvals.map((app) => (
                    <div key={app.id} className="flex gap-4 items-start">
                      <div className="flex flex-col items-center shrink-0 mt-1">
                        <div className={`w-6 h-6 rounded-full border flex items-center justify-center text-xs font-bold ${
                          app.status === 'APPROVED' ? 'bg-[#14B8A6]/10 text-[#2DD4BF] border-[#14B8A6]/20' :
                          app.status === 'REJECTED' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                          'bg-amber-500/10 text-amber-400 border-amber-500/20 animate-pulse'
                        }`}>
                          {app.level}
                        </div>
                        <div className="w-0.5 h-12 bg-[#1D3045]/30" />
                      </div>
                      <div className="flex-1 bg-[#111D30]/60 p-3 rounded-xl border border-[#1D3045]/40 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-[#F8FAFC]">{app.approver_name || 'Approver'}</span>
                          <span className="text-[9px] font-bold uppercase tracking-wider text-[#94A3B8]">{app.status}</span>
                        </div>
                        <p className="text-[10px] text-[#64748B] mt-0.5">Level {app.level} Exit Clearance</p>
                        {app.comments && (
                          <p className="text-[#94A3B8] mt-2 italic bg-[#0D1728] p-2 rounded-lg border border-[#1D3045]/30">"{app.comments}"</p>
                        )}
                        {app.approved_at && (
                          <p className="text-[9px] text-[#64748B] mt-1.5">Processed: {formatDate(app.approved_at)}</p>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6 text-xs text-[#64748B] italic">No approvals chain configured yet.</div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Empty State */
        <div className="glass-card-premium border border-[#1D3045]/40 rounded-3xl p-12 text-center shadow-lg max-w-xl mx-auto mt-6">
          <LogOut size={48} className="text-[#64748B] mx-auto mb-4" />
          <h3 className="text-lg font-bold text-[#F8FAFC] mb-2">No Active Exit File</h3>
          <p className="text-[#94A3B8] text-sm mb-6">
            You do not have any pending or approved resignation records. To initiate your offboarding process, click the button below to submit a formal resignation.
          </p>
          <button
            onClick={() => setShowResignModal(true)}
            className="bg-gradient-to-r from-[#14B8A6] to-[#2DD4BF] text-[#060B16] font-bold px-6 py-3 rounded-xl transition-all shadow-md inline-flex items-center gap-2 text-sm border-none cursor-pointer"
          >
            <Plus size={16} /> Submit Resignation Request
          </button>
        </div>
      )}

      {/* Resignation History */}
      {previousResignations.length > 0 && (
        <div className="glass-card-premium border border-[#1D3045]/40 rounded-3xl p-6 shadow-sm space-y-4 text-left">
          <h3 className="font-bold text-[#F8FAFC] text-base">Previous Resignations History</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-[#1D3045]/40 text-[#94A3B8] text-xs font-bold uppercase tracking-wider">
                  <th className="px-4 py-3">Applied Date</th>
                  <th className="px-4 py-3">Last Working Day</th>
                  <th className="px-4 py-3">Notice Period</th>
                  <th className="px-4 py-3">Reason</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1D3045]/20 text-xs text-[#F8FAFC]">
                {previousResignations.map((pr) => (
                  <tr key={pr.id} className="history-row">
                    <td className="px-4 py-3 font-medium text-[#F8FAFC]">{formatDate(pr.applied_date)}</td>
                    <td className="px-4 py-3 text-[#94A3B8]">{formatDate(pr.last_working_day)}</td>
                    <td className="px-4 py-3 text-[#94A3B8]">{pr.notice_period_days} Days</td>
                    <td className="px-4 py-3 max-w-xs truncate text-[#94A3B8]" title={pr.reason}>{pr.reason}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-bold ${
                        pr.status === 'REJECTED' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 'bg-[#1D3045]/30 text-[#94A3B8] border border-[#1D3045]/40'
                      }`}>
                        {pr.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[#94A3B8] max-w-xs truncate" title={pr.comments || '-'}>{pr.comments || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Resign Modal */}
      {showResignModal && (
        <div className="fixed inset-0 bg-[#060B16]/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-[#0D1728] border border-[#1D3045] rounded-3xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-[#1D3045] flex items-center justify-between">
              <h3 className="text-lg font-bold text-[#F8FAFC]">Submit Resignation</h3>
              <button onClick={() => setShowResignModal(false)} className="p-2 text-[#94A3B8] hover:text-[#F8FAFC] rounded-lg border-none bg-transparent cursor-pointer">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleApply} className="p-6 space-y-4 text-left">
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-[#94A3B8]">Notice Period (Days) *</label>
                <input
                  type="number"
                  value={noticePeriod}
                  onChange={(e) => setNoticePeriod(Number(e.target.value))}
                  className="w-full bg-[#111D30] border border-[#1D3045] rounded-xl px-4 py-3 text-xs text-[#F8FAFC] font-semibold focus:outline-none focus:border-[#2DD4BF]/50 mt-1"
                  min="1"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-[#94A3B8]">Requested Last Working Day *</label>
                <input
                  type="date"
                  value={lastWorkingDay}
                  onChange={(e) => setLastWorkingDay(e.target.value)}
                  className="w-full bg-[#111D30] border border-[#1D3045] rounded-xl px-4 py-3 text-xs text-[#F8FAFC] font-semibold focus:outline-none focus:border-[#2DD4BF]/50 mt-1 cursor-pointer"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-[#94A3B8]">Reason for Resignation *</label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full bg-[#111D30] border border-[#1D3045] rounded-xl px-4 py-3 text-xs text-[#F8FAFC] font-semibold focus:outline-none focus:border-[#2DD4BF]/50 min-h-[100px] mt-1"
                  placeholder="State the reason for leaving (e.g. personal growth, higher studies)..."
                  required
                />
              </div>

              <div className="flex items-center gap-3 pt-4 border-t border-[#1D3045] justify-end">
                <button type="button" onClick={() => setShowResignModal(false)} className="btn-secondary px-4 py-2 border border-[#1D3045] rounded-xl text-xs font-bold text-[#94A3B8] bg-transparent hover:bg-[#111D30] cursor-pointer">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-gradient-to-r from-[#14B8A6] to-[#2DD4BF] text-[#060B16] font-bold px-5 py-2.5 rounded-xl shadow-sm cursor-pointer border-none"
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
