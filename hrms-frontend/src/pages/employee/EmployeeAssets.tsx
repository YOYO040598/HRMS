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

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'LAPTOP':
        return <Laptop className="text-indigo-600" size={24} />;
      case 'DESKTOP':
        return <Cpu className="text-blue-600" size={24} />;
      case 'MOBILE':
        return <Smartphone className="text-emerald-600" size={24} />;
      case 'SIM_CARD':
        return <Wifi className="text-amber-600" size={24} />;
      case 'ID_CARD':
        return <CreditCard className="text-rose-600" size={24} />;
      default:
        return <Box className="text-gray-600" size={24} />;
    }
  };

  const getRequestStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-lg"><CheckCircle size={12} /> Approved</span>;
      case 'REJECTED':
        return <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-rose-50 text-rose-700 px-2.5 py-1 rounded-lg"><AlertTriangle size={12} /> Rejected</span>;
      default:
        return <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-amber-50 text-amber-700 px-2.5 py-1 rounded-lg animate-pulse"><AlertCircle size={12} /> Pending</span>;
    }
  };

  const renderSpecs = (assignment: AssetAssignment) => {
    const specs = assignment.asset_specifications || {};
    if (Object.keys(specs).length === 0) return <span className="text-gray-400 text-xs">No specifications recorded</span>;

    return (
      <div className="mt-3 pt-3 border-t border-gray-100 grid grid-cols-2 gap-2 text-xs">
        {Object.entries(specs).map(([key, val]) => {
          if (val === undefined || val === null || val === '') return null;
          const displayKey = key.replace(/_/g, ' ').toUpperCase();
          const displayVal = typeof val === 'boolean' ? (val ? 'Yes' : 'No') : String(val);
          return (
            <div key={key} className="flex flex-col">
              <span className="text-[10px] text-gray-400 font-medium">{displayKey}</span>
              <span className="text-gray-700 font-semibold truncate">{displayVal}</span>
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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">My Assigned Assets</h2>
          <p className="text-gray-500 text-sm">View currently assigned equipment and request new hardware</p>
        </div>
        <button onClick={() => setShowRequestModal(true)} className="btn-primary flex items-center gap-2">
          <Plus size={18} /> Request Asset
        </button>
      </div>

      {/* Action Required Alert */}
      {pendingAssignments.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm animate-pulse">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center text-amber-700 shrink-0">
              <ShieldAlert size={22} />
            </div>
            <div>
              <h4 className="font-semibold text-amber-800 text-sm">Digital Acknowledgement Pending</h4>
              <p className="text-amber-700 text-xs mt-0.5">
                You have {pendingAssignments.length} hardware assignment{pendingAssignments.length > 1 ? 's' : ''} awaiting receipt confirmation.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex gap-6">
          <button
            onClick={() => setActiveTab('inventory')}
            className={`pb-3 font-semibold text-sm transition-colors border-b-2 ${
              activeTab === 'inventory' ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            Active Inventory ({assignments.length})
          </button>
          <button
            onClick={() => setActiveTab('requests')}
            className={`pb-3 font-semibold text-sm transition-colors border-b-2 ${
              activeTab === 'requests' ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            My Requests ({requests.length})
          </button>
        </div>
      </div>

      {activeTab === 'inventory' ? (
        <div className="space-y-6">
          {/* Pending Sign-off Grid */}
          {pendingAssignments.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Awaiting Sign-off</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pendingAssignments.map((a) => (
                  <div key={a.id} className="bg-white border-2 border-amber-300 rounded-xl shadow-sm hover:shadow-md transition-shadow p-5 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-amber-50 rounded-lg">{getCategoryIcon(a.asset_category)}</div>
                          <div>
                            <h4 className="font-bold text-gray-800 text-sm">{a.asset_name}</h4>
                            <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-mono font-medium">
                              {a.asset_code}
                            </span>
                          </div>
                        </div>
                        <span className="text-xs text-amber-600 font-semibold bg-amber-50 px-2.5 py-1 rounded-lg">
                          Pending
                        </span>
                      </div>

                      {renderSpecs(a)}

                      {a.notes && (
                        <div className="mt-3 bg-gray-50 p-2.5 rounded-lg border border-gray-100 text-xs text-gray-600">
                          <span className="font-semibold block text-[10px] uppercase text-gray-400">Notes from IT:</span>
                          {a.notes}
                        </div>
                      )}
                    </div>

                    <div className="mt-5 pt-3 border-t border-gray-100 flex items-center justify-between gap-4">
                      <span className="text-[10px] text-gray-400">Assigned: {formatDate(a.assigned_date)}</span>
                      <button
                        onClick={() => {
                          setAckStatus('ACCEPTED');
                          setShowAckModal(a);
                        }}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
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
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Active Inventory</h3>
            {assignments.filter(a => a.acceptance_status !== 'PENDING').length === 0 ? (
              <div className="bg-white border border-gray-100 rounded-xl p-12 text-center shadow-sm">
                <Package size={40} className="text-gray-300 mx-auto mb-3" />
                <p className="text-gray-400 text-sm font-medium">No active assets assigned to your profile.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {assignments.filter(a => a.acceptance_status !== 'PENDING').map((a) => (
                  <div key={a.id} className="bg-white border border-gray-150 rounded-xl shadow-sm hover:shadow-md transition-shadow p-5 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-emerald-50 rounded-lg">{getCategoryIcon(a.asset_category)}</div>
                          <div>
                            <h4 className="font-bold text-gray-800 text-sm">{a.asset_name}</h4>
                            <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-mono font-medium">
                              {a.asset_code}
                            </span>
                          </div>
                        </div>
                        <span
                          className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                            a.acceptance_status === 'ACCEPTED'
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-rose-50 text-rose-700'
                          }`}
                        >
                          {a.acceptance_status}
                        </span>
                      </div>

                      {renderSpecs(a)}

                      {a.employee_comments && (
                        <div className="mt-3 bg-gray-50 p-2.5 rounded-lg border border-gray-100 text-xs text-gray-600 flex items-start gap-1.5">
                          <MessageSquare size={14} className="text-gray-400 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-semibold block text-[10px] uppercase text-gray-400">Your comments:</span>
                            {a.employee_comments}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="mt-5 pt-3 border-t border-gray-100 flex items-center justify-between">
                      <span className="text-[10px] text-gray-400">Confirmed: {a.acknowledged_at ? formatDate(a.acknowledged_at) : formatDate(a.assigned_date)}</span>
                      <button
                        onClick={() => {
                          const reason = window.prompt("Please state the reason for replacement/return request:");
                          if (reason !== null) {
                            alert("Return/replacement request registered successfully. IT support will reach out to schedule inspection.");
                          }
                        }}
                        className="text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors border border-gray-200"
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
        <div className="space-y-4">
          {requests.length === 0 ? (
            <div className="bg-white border border-gray-100 rounded-xl p-12 text-center shadow-sm">
              <Package size={40} className="text-gray-300 mx-auto mb-3" />
              <p className="text-gray-400 text-sm font-medium">You haven't submitted any hardware requests.</p>
              <button onClick={() => setShowRequestModal(true)} className="btn-primary mt-4 inline-flex items-center gap-1.5 text-xs">
                <Plus size={16} /> Request New Hardware
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {requests.map((r) => (
                <div key={r.id} className="bg-white border border-gray-150 rounded-xl p-5 shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-emerald-50 rounded-lg">{getCategoryIcon(r.asset_category)}</div>
                      <div>
                        <h4 className="font-bold text-gray-800 text-sm capitalize">{r.asset_category.replace(/_/g, ' ').toLowerCase()} Request</h4>
                        <span className="text-[10px] text-gray-400 font-medium">Requested on {formatDate(r.request_date)}</span>
                      </div>
                    </div>
                    {getRequestStatusBadge(r.status)}
                  </div>
                  
                  <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 text-xs">
                    <span className="font-bold text-[10px] uppercase text-gray-400 block mb-1">Reason for request:</span>
                    <p className="text-gray-700 italic">"{r.reason}"</p>
                  </div>

                  {r.status === 'APPROVED' && r.assigned_asset_name && (
                    <div className="bg-emerald-50/50 p-3 rounded-lg border border-emerald-100 text-xs flex items-center justify-between">
                      <div>
                        <span className="font-bold text-[10px] uppercase text-emerald-800 block">Assigned hardware:</span>
                        <span className="font-semibold text-emerald-950 text-sm mt-0.5">{r.assigned_asset_name}</span>
                      </div>
                      <span className="text-[10px] font-mono bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold">{r.assigned_asset_code}</span>
                    </div>
                  )}

                  {r.comments && (
                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-150 text-xs">
                      <span className="font-bold text-[10px] uppercase text-gray-400 block mb-1">Remarks from Approver:</span>
                      <p className="text-gray-700">{r.comments}</p>
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-800">Hardware Sign-off</h3>
              <button onClick={() => setShowAckModal(null)} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleAcknowledge} className="p-6 space-y-4">
              <div>
                <span className="text-xs text-gray-400 font-semibold block uppercase">Item details</span>
                <p className="font-bold text-gray-800">{showAckModal.asset_name} ({showAckModal.asset_code})</p>
                <p className="text-xs text-gray-500 mt-0.5">Condition at handover: <span className="font-semibold">{showAckModal.condition_at_assignment}</span></p>
              </div>

              <div>
                <label className="label">Verification Action</label>
                <div className="grid grid-cols-2 gap-3 mt-1">
                  <button
                    type="button"
                    onClick={() => setAckStatus('ACCEPTED')}
                    className={`py-3 px-4 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                      ackStatus === 'ACCEPTED'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-700 shadow-sm'
                        : 'border-gray-200 hover:bg-gray-50 text-gray-600'
                    }`}
                  >
                    <ThumbsUp size={16} /> Confirm Receipt
                  </button>
                  <button
                    type="button"
                    onClick={() => setAckStatus('REJECTED')}
                    className={`py-3 px-4 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                      ackStatus === 'REJECTED'
                        ? 'border-rose-600 bg-rose-50 text-rose-700 shadow-sm'
                        : 'border-gray-200 hover:bg-gray-50 text-gray-600'
                    }`}
                  >
                    <ThumbsDown size={16} /> Flag Issue / Reject
                  </button>
                </div>
              </div>

              <div>
                <label className="label">Comments / Remarks</label>
                <textarea
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  className="input-field min-h-[80px]"
                  placeholder={
                    ackStatus === 'ACCEPTED'
                      ? 'Add any comments on receiving condition...'
                      : 'Detail the issue or reason for rejection...'
                  }
                  required={ackStatus === 'REJECTED'}
                />
              </div>

              <div className="flex items-center gap-3 pt-4 border-t border-gray-100 justify-end">
                <button type="button" onClick={() => setShowAckModal(null)} className="btn-secondary">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className={`text-white text-xs font-bold px-4 py-2.5 rounded-lg shadow-sm ${
                    ackStatus === 'ACCEPTED' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-800">Request Hardware</h3>
              <button onClick={() => setShowRequestModal(null)} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleRequestAsset} className="p-6 space-y-4">
              <div>
                <label className="label">Asset Category *</label>
                <select value={reqCategory} onChange={(e) => setReqCategory(e.target.value)} className="input-field mt-1" required>
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>{cat.replace(/_/g, ' ')}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">Reason for Request *</label>
                <textarea
                  value={reqReason}
                  onChange={(e) => setReqReason(e.target.value)}
                  className="input-field min-h-[100px] mt-1"
                  placeholder="Explain why you need this hardware/SIM (e.g. broken device, new project requirements, card lost)..."
                  required
                />
              </div>

              <div className="flex items-center gap-3 pt-4 border-t border-gray-100 justify-end">
                <button type="button" onClick={() => setShowRequestModal(null)} className="btn-secondary">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={requesting}
                  className="btn-primary"
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
