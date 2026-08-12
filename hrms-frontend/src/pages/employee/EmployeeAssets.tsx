import { useEffect, useState } from 'react';
import api from '../../api/axios';
import { formatDate } from '../../lib/utils';
import { Package, AlertCircle, ThumbsUp, ThumbsDown, Check, X, ShieldAlert, Cpu, Laptop, Smartphone, Wifi, CreditCard, Box, MessageSquare, Plus, CheckCircle, AlertTriangle } from 'lucide-react';

interface AssetAssignment {
  id: string;
  asset: string;
  asset_name: string;
  asset_code: string;
  assigned_date: string;
  expected_return_date: string | null;
  condition_at_assignment: string;
  notes: string;
  is_returned: boolean;
  is_acknowledged: boolean;
  acknowledged_at: string | null;
  acceptance_status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  employee_comments: string;
  asset_category: 'LAPTOP' | 'DESKTOP' | 'MOBILE' | 'SIM_CARD' | 'ID_CARD' | 'ACCESSORIES';
  asset_brand: string;
  asset_model_name: string;
  asset_specifications: Record<string, any>;
}

interface AssetRequest {
  id: string;
  asset_category: string;
  reason: string;
  request_date: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  approved_by_name: string | null;
  comments: string;
  assigned_asset_name: string | null;
  assigned_asset_code: string | null;
}

const CATEGORIES = ['LAPTOP', 'DESKTOP', 'MOBILE', 'SIM_CARD', 'ID_CARD', 'ACCESSORIES'];

export default function EmployeeAssets() {
  const [assignments, setAssignments] = useState<AssetAssignment[]>([]);
  const [requests, setRequests] = useState<AssetRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'inventory' | 'requests'>('inventory');

  // Acknowledgement State
  const [showAckModal, setShowAckModal] = useState<AssetAssignment | null>(null);
  const [ackStatus, setAckStatus] = useState<'ACCEPTED' | 'REJECTED'>('ACCEPTED');
  const [comments, setComments] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Asset Request State
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [reqCategory, setReqCategory] = useState('LAPTOP');
  const [reqReason, setReqReason] = useState('');
  const [requesting, setRequesting] = useState(false);

  useEffect(() => {
    fetchMyAssets();
  }, []);

  const fetchMyAssets = async () => {
    setLoading(true);
    try {
      const [assetsRes, requestsRes] = await Promise.all([
        api.get('/assets/my-assets/'),
        api.get('/assets/requests/'),
      ]);
      setAssignments(assetsRes.data.data || assetsRes.data);
      setRequests(requestsRes.data.data || requestsRes.data);
      window.dispatchEvent(new Event('mascot-asset'));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAcknowledge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showAckModal) return;
    setSubmitting(true);
    try {
      await api.post(`/assets/assignments/${showAckModal.id}/acknowledge/`, {
        status: ackStatus,
        comments,
      });
      setShowAckModal(null);
      setComments('');
      fetchMyAssets();
    } catch (err) {
      console.error(err);
      alert('Failed to acknowledge assignment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRequestAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    setRequesting(true);
    try {
      await api.post('/assets/requests/', {
        asset_category: reqCategory,
        reason: reqReason,
      });
      setShowRequestModal(false);
      setReqReason('');
      fetchMyAssets();
    } catch (err) {
      console.error(err);
      alert('Failed to submit asset request');
    } finally {
      setRequesting(false);
    }
  };

  const handleRequestReturn = async (a: AssetAssignment) => {
    const reason = window.prompt("Please state the reason for replacement/return request:");
    if (reason === null) return;
    if (!reason.trim()) {
      alert("A reason is required to submit a return request");
      return;
    }
    try {
      await api.post('/assets/requests/', {
        request_type: 'RETURN',
        asset_category: a.asset_category,
        assigned_asset: a.asset,
        reason: reason,
      });
      alert("Return request registered successfully. IT support will process the return check-off.");
      fetchMyAssets();
    } catch (err) {
      console.error(err);
      alert("Failed to submit return request");
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'LAPTOP':
        return <Laptop className="text-[#2DD4BF]" size={24} />;
      case 'DESKTOP':
        return <Cpu className="text-blue-400" size={24} />;
      case 'MOBILE':
        return <Smartphone className="text-[#2DD4BF]" size={24} />;
      case 'SIM_CARD':
        return <Wifi className="text-amber-400" size={24} />;
      case 'ID_CARD':
        return <CreditCard className="text-rose-400" size={24} />;
      default:
        return <Box className="text-[#94A3B8]" size={24} />;
    }
  };

  const getRequestStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-[#14B8A6]/10 text-[#2DD4BF] border border-[#14B8A6]/20 px-2.5 py-1 rounded-lg"><CheckCircle size={12} /> Approved</span>;
      case 'REJECTED':
        return <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20 px-2.5 py-1 rounded-lg"><AlertTriangle size={12} /> Rejected</span>;
      default:
        return <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2.5 py-1 rounded-lg animate-pulse"><AlertCircle size={12} /> Pending</span>;
    }
  };

  const renderSpecs = (assignment: AssetAssignment) => {
    const specs = assignment.asset_specifications || {};
    if (Object.keys(specs).length === 0) return <span className="text-[#64748B] text-xs">No specifications recorded</span>;

    return (
      <div className="mt-3 pt-3 border-t border-[#1D3045]/40 grid grid-cols-2 gap-2 text-xs">
        {Object.entries(specs).map(([key, val]) => {
          if (val === undefined || val === null || val === '') return null;
          const displayKey = key.replace(/_/g, ' ').toUpperCase();
          const displayVal = typeof val === 'boolean' ? (val ? 'Yes' : 'No') : String(val);
          return (
            <div key={key} className="flex flex-col">
              <span className="text-[10px] text-[#94A3B8] font-medium">{displayKey}</span>
              <span className="text-[#F8FAFC] font-semibold truncate">{displayVal}</span>
            </div>
          );
        })}
      </div>
    );
  };

  const pendingAssignments = assignments.filter((a) => a.acceptance_status === 'PENDING');

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#14B8A6]" />
      </div>
    );
  }

  return (
    <div className="space-y-6 text-[#F8FAFC]">
      <style>{`
        .glass-card-premium {
          background: rgba(13, 23, 40, 0.72);
          backdrop-filter: blur(18px);
          -webkit-backdrop-filter: blur(18px);
          border: 1px solid rgba(148, 163, 184, 0.12);
        }
        .bento-card-hover {
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .bento-card-hover:hover {
          transform: translateY(-4px);
          border-color: rgba(20, 184, 166, 0.3) !important;
          box-shadow: 0 10px 25px -5px rgba(20, 184, 166, 0.1);
        }
      `}</style>

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-extrabold text-[#F8FAFC] tracking-tight">My Assigned Assets</h2>
          <p className="text-[#94A3B8] text-sm font-medium mt-1">View currently assigned equipment and request new hardware</p>
        </div>
        <button onClick={() => setShowRequestModal(true)} className="bg-gradient-to-r from-[#14B8A6] to-[#2DD4BF] text-[#060B16] font-bold px-4 py-2.5 rounded-xl transition-all shadow-md flex items-center gap-2 text-sm cursor-pointer border-none">
          <Plus size={18} /> Request Asset
        </button>
      </div>

      {/* Action Required Alert */}
      {pendingAssignments.length > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm animate-pulse text-amber-400">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-amber-500/20 rounded-lg flex items-center justify-center text-amber-300 shrink-0">
              <ShieldAlert size={22} />
            </div>
            <div className="text-left">
              <h4 className="font-semibold text-amber-300 text-sm">Digital Acknowledgement Pending</h4>
              <p className="text-amber-400/80 text-xs mt-0.5">
                You have {pendingAssignments.length} hardware assignment{pendingAssignments.length > 1 ? 's' : ''} awaiting receipt confirmation.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-[#1D3045]/40">
        <div className="flex gap-6">
          <button
            onClick={() => setActiveTab('inventory')}
            className={`pb-3 font-bold text-sm transition-colors border-b-2 border-none bg-transparent cursor-pointer ${
              activeTab === 'inventory' ? 'border-b-2 border-[#2DD4BF] text-[#2DD4BF]' : 'text-[#94A3B8] hover:text-[#F8FAFC]'
            }`}
            style={{ borderBottom: activeTab === 'inventory' ? '2px solid #2DD4BF' : '2px solid transparent' }}
          >
            Active Inventory ({assignments.length})
          </button>
          <button
            onClick={() => setActiveTab('requests')}
            className={`pb-3 font-bold text-sm transition-colors border-b-2 border-none bg-transparent cursor-pointer ${
              activeTab === 'requests' ? 'border-b-2 border-[#2DD4BF] text-[#2DD4BF]' : 'text-[#94A3B8] hover:text-[#F8FAFC]'
            }`}
            style={{ borderBottom: activeTab === 'requests' ? '2px solid #2DD4BF' : '2px solid transparent' }}
          >
            My Requests ({requests.length})
          </button>
        </div>
      </div>

      {activeTab === 'inventory' ? (
        <div className="space-y-6 text-left">
          {/* Pending Sign-off Grid */}
          {pendingAssignments.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-[#94A3B8] uppercase tracking-wider">Awaiting Sign-off</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pendingAssignments.map((a) => (
                  <div key={a.id} className="glass-card-premium rounded-xl p-5 flex flex-col justify-between border border-amber-500/30">
                    <div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-amber-500/10 rounded-lg">{getCategoryIcon(a.asset_category)}</div>
                          <div>
                            <h4 className="font-bold text-[#F8FAFC] text-sm">{a.asset_name}</h4>
                            <span className="text-[10px] bg-amber-500/15 text-amber-400 px-2 py-0.5 rounded-full font-mono font-medium">
                              {a.asset_code}
                            </span>
                          </div>
                        </div>
                        <span className="text-xs text-amber-400 font-semibold bg-amber-500/10 px-2.5 py-1 rounded-lg">
                          Pending
                        </span>
                      </div>

                      {renderSpecs(a)}

                      {a.notes && (
                        <div className="mt-3 bg-[#111D30]/60 p-2.5 rounded-lg border border-[#1D3045]/40 text-xs text-[#94A3B8]">
                          <span className="font-semibold block text-[10px] uppercase text-[#64748B]">Notes from IT:</span>
                          {a.notes}
                        </div>
                      )}
                    </div>

                    <div className="mt-5 pt-3 border-t border-[#1D3045]/40 flex items-center justify-between gap-4">
                      <span className="text-[10px] text-[#94A3B8]">Assigned: {formatDate(a.assigned_date)}</span>
                      <button
                        onClick={() => {
                          setAckStatus('ACCEPTED');
                          setShowAckModal(a);
                        }}
                        className="bg-gradient-to-r from-[#14B8A6] to-[#2DD4BF] text-[#060B16] text-xs font-bold px-4 py-2 rounded-xl transition-all active:scale-[0.98] flex items-center gap-1.5 shadow-sm cursor-pointer border-none"
                      >
                        <Check size={14} /> Verify & Confirm Receipt
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Confirmed Assets Grid */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-[#94A3B8] uppercase tracking-wider">Active Inventory</h3>
            {assignments.filter(a => a.acceptance_status !== 'PENDING').length === 0 ? (
              <div className="glass-card-premium rounded-xl p-12 text-center shadow-sm">
                <Package size={40} className="text-[#64748B] mx-auto mb-3" />
                <p className="text-[#94A3B8] text-sm font-medium">No active assets assigned to your profile.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {assignments.filter(a => a.acceptance_status !== 'PENDING').map((a) => (
                  <div key={a.id} className="glass-card-premium bento-card-hover rounded-xl shadow-sm p-5 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-[#14B8A6]/10 text-[#2DD4BF] rounded-lg">{getCategoryIcon(a.asset_category)}</div>
                          <div>
                            <h4 className="font-bold text-[#F8FAFC] text-sm">{a.asset_name}</h4>
                            <span className="text-[10px] bg-[#111D30] text-[#94A3B8] border border-[#1D3045]/60 px-2 py-0.5 rounded-full font-mono font-medium">
                              {a.asset_code}
                            </span>
                          </div>
                        </div>
                        <span
                          className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                            a.acceptance_status === 'ACCEPTED'
                              ? 'bg-[#14B8A6]/10 text-[#2DD4BF] border border-[#14B8A6]/20'
                              : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          }`}
                        >
                          {a.acceptance_status}
                        </span>
                      </div>

                      {renderSpecs(a)}

                      {a.employee_comments && (
                        <div className="mt-3 bg-[#111D30]/60 p-2.5 rounded-lg border border-[#1D3045]/40 text-xs text-[#94A3B8] flex items-start gap-1.5">
                          <MessageSquare size={14} className="text-[#64748B] shrink-0 mt-0.5" />
                          <div>
                            <span className="font-semibold block text-[10px] uppercase text-[#64748B]">Your comments:</span>
                            {a.employee_comments}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="mt-5 pt-3 border-t border-[#1D3045]/40 flex items-center justify-between">
                      <span className="text-[10px] text-[#94A3B8]">Confirmed: {a.acknowledged_at ? formatDate(a.acknowledged_at) : formatDate(a.assigned_date)}</span>
                      <button
                        onClick={() => handleRequestReturn(a)}
                        className="text-[#94A3B8] hover:text-[#2DD4BF] hover:bg-[#111D30] text-xs font-bold px-3 py-1.5 rounded-xl transition-colors border border-[#1D3045] cursor-pointer bg-transparent"
                      >
                        Request Return
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Requests Tab */
        <div className="space-y-4 text-left">
          {requests.length === 0 ? (
            <div className="glass-card-premium rounded-xl p-12 text-center shadow-sm">
              <Package size={40} className="text-[#64748B] mx-auto mb-3" />
              <p className="text-[#94A3B8] text-sm font-medium">You haven't submitted any hardware requests.</p>
              <button onClick={() => setShowRequestModal(true)} className="bg-gradient-to-r from-[#14B8A6] to-[#2DD4BF] text-[#060B16] font-bold px-4 py-2.5 rounded-xl mt-4 inline-flex items-center gap-1.5 text-xs border-none cursor-pointer">
                <Plus size={16} /> Request New Hardware
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {requests.map((r) => (
                <div key={r.id} className="glass-card-premium rounded-xl p-5 shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-[#111D30] rounded-lg">{getCategoryIcon(r.asset_category)}</div>
                      <div>
                        <h4 className="font-bold text-[#F8FAFC] text-sm capitalize">{r.asset_category.replace(/_/g, ' ').toLowerCase()} Request</h4>
                        <span className="text-[10px] text-[#94A3B8] font-medium">Requested on {formatDate(r.request_date)}</span>
                      </div>
                    </div>
                    {getRequestStatusBadge(r.status)}
                  </div>
                  
                  <div className="bg-[#111D30]/60 p-3 rounded-lg border border-[#1D3045]/40 text-xs">
                    <span className="font-bold text-[10px] uppercase text-[#64748B] block mb-1">Reason for request:</span>
                    <p className="text-[#94A3B8] italic">"{r.reason}"</p>
                  </div>

                  {r.status === 'APPROVED' && r.assigned_asset_name && (
                    <div className="bg-[#14B8A6]/10 p-3 rounded-lg border border-[#14B8A6]/20 text-xs flex items-center justify-between">
                      <div>
                        <span className="font-bold text-[10px] uppercase text-[#2DD4BF] block">Assigned hardware:</span>
                        <span className="font-semibold text-[#F8FAFC] text-sm mt-0.5">{r.assigned_asset_name}</span>
                      </div>
                      <span className="text-[10px] font-mono bg-[#14B8A6]/20 text-[#2DD4BF] px-2 py-0.5 rounded font-bold">{r.assigned_asset_code}</span>
                    </div>
                  )}

                  {r.comments && (
                    <div className="bg-[#111D30]/60 p-3 rounded-lg border border-[#1D3045]/40 text-xs">
                      <span className="font-bold text-[10px] uppercase text-[#64748B] block mb-1">Remarks from Approver:</span>
                      <p className="text-[#94A3B8]">{r.comments}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Acknowledgement Modal */}
      {showAckModal && (
        <div className="fixed inset-0 bg-[#060B16]/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-[#0D1728] rounded-3xl border border-[#1D3045] shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-[#1D3045] flex items-center justify-between">
              <h3 className="text-lg font-bold text-[#F8FAFC]">Hardware Sign-off</h3>
              <button onClick={() => setShowAckModal(null)} className="p-2 text-[#94A3B8] hover:text-[#F8FAFC] rounded-lg border-none bg-transparent cursor-pointer">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleAcknowledge} className="p-6 space-y-4 text-left">
              <div>
                <span className="text-xs text-[#94A3B8] font-semibold block uppercase">Item details</span>
                <p className="font-bold text-[#F8FAFC] text-base">{showAckModal.asset_name} ({showAckModal.asset_code})</p>
                <p className="text-xs text-[#94A3B8] mt-0.5">Condition at handover: <span className="font-semibold text-amber-400">{showAckModal.condition_at_assignment}</span></p>
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-[#94A3B8]">Verification Action</label>
                <div className="grid grid-cols-2 gap-3 mt-1">
                  <button
                    type="button"
                    onClick={() => setAckStatus('ACCEPTED')}
                    className={`py-3 px-4 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer bg-transparent ${
                      ackStatus === 'ACCEPTED'
                        ? 'border-[#2DD4BF] bg-[#14B8A6]/10 text-[#2DD4BF] shadow-sm'
                        : 'border-[#1D3045] hover:bg-[#111D30] text-[#94A3B8]'
                    }`}
                  >
                    <ThumbsUp size={16} /> Confirm Receipt
                  </button>
                  <button
                    type="button"
                    onClick={() => setAckStatus('REJECTED')}
                    className={`py-3 px-4 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer bg-transparent ${
                      ackStatus === 'REJECTED'
                        ? 'border-rose-500 bg-rose-500/10 text-rose-400 shadow-sm'
                        : 'border-[#1D3045] hover:bg-[#111D30] text-[#94A3B8]'
                    }`}
                  >
                    <ThumbsDown size={16} /> Flag Issue / Reject
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-[#94A3B8]">Comments / Remarks</label>
                <textarea
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  className="w-full bg-[#111D30] border border-[#1D3045] rounded-xl px-4 py-3 text-xs text-[#F8FAFC] font-semibold focus:outline-none focus:border-[#2DD4BF]/50 min-h-[80px] mt-1"
                  placeholder={
                    ackStatus === 'ACCEPTED'
                      ? 'Add any comments on receiving condition...'
                      : 'Detail the issue or reason for rejection...'
                  }
                  required={ackStatus === 'REJECTED'}
                />
              </div>

              <div className="flex items-center gap-3 pt-4 border-t border-[#1D3045] justify-end">
                <button type="button" onClick={() => setShowAckModal(null)} className="btn-secondary px-4 py-2 border border-[#1D3045] rounded-xl text-xs font-bold text-[#94A3B8] bg-transparent hover:bg-[#111D30] cursor-pointer">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className={`text-[#060B16] text-xs font-bold px-5 py-2.5 rounded-xl shadow-sm cursor-pointer transition-colors border-none ${
                    ackStatus === 'ACCEPTED' ? 'bg-[#14B8A6] hover:bg-[#0d9488]' : 'bg-rose-600 hover:bg-rose-700 text-white'
                  }`}
                >
                  {submitting ? 'Submitting...' : 'Submit Acknowledgement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Asset Request Modal */}
      {showRequestModal && (
        <div className="fixed inset-0 bg-[#060B16]/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-[#0D1728] rounded-3xl border border-[#1D3045] shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-[#1D3045] flex items-center justify-between">
              <h3 className="text-lg font-bold text-[#F8FAFC]">Request Hardware</h3>
              <button onClick={() => setShowRequestModal(false)} className="p-2 text-[#94A3B8] hover:text-[#F8FAFC] rounded-lg border-none bg-transparent cursor-pointer">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleRequestAsset} className="p-6 space-y-4 text-left">
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-[#94A3B8]">Asset Category *</label>
                <select value={reqCategory} onChange={(e) => setReqCategory(e.target.value)} className="w-full bg-[#111D30] border border-[#1D3045] rounded-xl px-4 py-3 text-xs text-[#F8FAFC] font-semibold focus:outline-none focus:border-[#2DD4BF]/50 mt-1 cursor-pointer" required>
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat} className="bg-[#0D1728]">{cat.replace(/_/g, ' ')}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-[#94A3B8]">Reason for Request *</label>
                <textarea
                  value={reqReason}
                  onChange={(e) => setReqReason(e.target.value)}
                  className="w-full bg-[#111D30] border border-[#1D3045] rounded-xl px-4 py-3 text-xs text-[#F8FAFC] font-semibold focus:outline-none focus:border-[#2DD4BF]/50 min-h-[100px] mt-1"
                  placeholder="Explain why you need this hardware/SIM (e.g. broken device, new project requirements, card lost)..."
                  required
                />
              </div>

              <div className="flex items-center gap-3 pt-4 border-t border-[#1D3045] justify-end">
                <button type="button" onClick={() => setShowRequestModal(false)} className="btn-secondary px-4 py-2 border border-[#1D3045] rounded-xl text-xs font-bold text-[#94A3B8] bg-transparent hover:bg-[#111D30] cursor-pointer">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={requesting}
                  className="bg-[#14B8A6] hover:bg-[#0d9488] text-[#060B16] text-xs font-bold px-5 py-2.5 rounded-xl shadow-sm cursor-pointer border-none"
                >
                  {requesting ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
