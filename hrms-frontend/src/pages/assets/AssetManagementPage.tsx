import { useEffect, useState } from 'react';
import api from '../../api/axios';
import type { Asset, Employee } from '../../types';
import { formatCurrency, formatDate, getStatusColor } from '../../lib/utils';
import { Package, Search, Plus, UserPlus, RotateCcw, X, Info, Laptop, Cpu, Smartphone, Wifi, CreditCard, Box, CheckCircle, AlertTriangle, AlertCircle, Eye, Check, XCircle } from 'lucide-react';

const CATEGORIES = ['LAPTOP', 'DESKTOP', 'MOBILE', 'SIM_CARD', 'ID_CARD', 'ACCESSORIES'];
const CONDITIONS = ['NEW', 'GOOD', 'FAIR', 'POOR'];

interface AssetStats {
  total: number;
  available: number;
  assigned: number;
  maintenance: number;
}

interface UpgradedAsset extends Asset {
  specifications?: Record<string, any>;
  acceptance_status?: 'PENDING' | 'ACCEPTED' | 'REJECTED' | null;
}

interface AssetRequest {
  id: string;
  employee: string;
  employee_name: string;
  employee_code: string;
  asset_category: string;
  reason: string;
  request_date: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  approved_by_name: string | null;
  comments: string;
  assigned_asset: string | null;
  assigned_asset_name: string | null;
  assigned_asset_code: string | null;
}

const defaultAsset = {
  name: '', asset_code: '', category: 'LAPTOP', brand: '', model_name: '', serial_number: '',
  purchase_date: '', purchase_price: '', warranty_expiry: '', condition: 'NEW', company: '',
  specifications: {},
};

export default function AssetManagementPage() {
  const [activeSubTab, setActiveSubTab] = useState<'inventory' | 'requests'>('inventory');

  // Inventory list states
  const [assets, setAssets] = useState<UpgradedAsset[]>([]);
  const [stats, setStats] = useState<AssetStats>({ total: 0, available: 0, assigned: 0, maintenance: 0 });
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  // Asset Requests states
  const [requests, setRequests] = useState<AssetRequest[]>([]);
  const [reqSearch, setReqSearch] = useState('');
  const [reqStatusFilter, setReqStatusFilter] = useState('');

  // Register New Asset Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [assetForm, setAssetForm] = useState<any>(defaultAsset);
  const [saving, setSaving] = useState(false);

  // Assign Asset Modal
  const [showAssignModal, setShowAssignModal] = useState<string | null>(null);
  const [assignForm, setAssignForm] = useState({ employee_id: '', condition_at_assignment: 'GOOD', expected_return_date: '', notes: '' });
  const [assigning, setAssigning] = useState(false);

  // Return Asset Modal
  const [showReturnModal, setShowReturnModal] = useState<string | null>(null);
  const [returnForm, setReturnForm] = useState({ condition: 'GOOD', remarks: '', damage_report: '', is_damaged: false });
  const [returning, setReturning] = useState(false);

  // Expand Row State
  const [expandedAsset, setExpandedAsset] = useState<string | null>(null);

  // Request Approval Modal State
  const [approvalModalRequest, setApprovalModalRequest] = useState<AssetRequest | null>(null);
  const [availableAssetsForApproval, setAvailableAssetsForApproval] = useState<UpgradedAsset[]>([]);
  const [selectedAssetForApproval, setSelectedAssetForApproval] = useState('');
  const [approvalComments, setApprovalComments] = useState('');
  const [approving, setApproving] = useState(false);

  // Request Rejection Modal State
  const [rejectionModalRequest, setRejectionModalRequest] = useState<AssetRequest | null>(null);
  const [rejectionComments, setRejectionComments] = useState('');
  const [rejecting, setRejecting] = useState(false);

  useEffect(() => {
    if (activeSubTab === 'inventory') {
      fetchInventory();
    } else {
      fetchRequests();
    }
  }, [activeSubTab, search, statusFilter, categoryFilter, reqSearch, reqStatusFilter]);

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (statusFilter) params.append('status', statusFilter);
      if (categoryFilter) params.append('category', categoryFilter);
      const [assetsRes, statsRes, empRes] = await Promise.all([
        api.get('/assets/', { params }),
        api.get('/assets/stats/'),
        api.get('/employees/'),
      ]);
      setAssets(assetsRes.data.data);
      setStats(statsRes.data.data);
      setEmployees(empRes.data.data);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (reqSearch) params.append('search', reqSearch);
      if (reqStatusFilter) params.append('status', reqStatusFilter);
      const [requestsRes, statsRes] = await Promise.all([
        api.get('/assets/requests/', { params }),
        api.get('/assets/stats/'),
      ]);
      setRequests(requestsRes.data.data || requestsRes.data);
      setStats(statsRes.data.data);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const handleAddAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/assets/', assetForm);
      setShowAddModal(false);
      setAssetForm(defaultAsset);
      fetchInventory();
    } catch (err) { console.error(err); } finally { setSaving(false); }
  };

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showAssignModal) return;
    setAssigning(true);
    try {
      await api.post('/assets/assign/', { asset_id: showAssignModal, ...assignForm });
      setShowAssignModal(null);
      setAssignForm({ employee_id: '', condition_at_assignment: 'GOOD', expected_return_date: '', notes: '' });
      fetchInventory();
    } catch (err) { console.error(err); } finally { setAssigning(false); }
  };

  const handleReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showReturnModal) return;
    setReturning(true);
    try {
      const target = assets.find(a => a.id === showReturnModal);
      const activeAssignment = target?.assignments?.find((as: any) => !as.is_returned);
      const assignmentId = activeAssignment?.id || showReturnModal;
      await api.post('/assets/return/', { assignment_id: assignmentId, ...returnForm });
      setShowReturnModal(null);
      setReturnForm({ condition: 'GOOD', remarks: '', damage_report: '', is_damaged: false });
      fetchInventory();
    } catch (err) { console.error(err); } finally { setReturning(false); }
  };

  const handleOpenApproveModal = async (req: AssetRequest) => {
    setLoading(true);
    try {
      const res = await api.get(`/assets/?category=${req.asset_category}&status=AVAILABLE`);
      const availableList = res.data.data || [];
      setAvailableAssetsForApproval(availableList);
      if (availableList.length > 0) {
        setSelectedAssetForApproval(availableList[0].id);
      } else {
        setSelectedAssetForApproval('');
      }
      setApprovalComments('');
      setApprovalModalRequest(req);
    } catch (err) {
      console.error(err);
      alert('Failed to load available assets for this category');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!approvalModalRequest || !selectedAssetForApproval) return;
    setApproving(true);
    try {
      await api.post(`/assets/requests/${approvalModalRequest.id}/approve/`, {
        asset_id: selectedAssetForApproval,
        comments: approvalComments,
      });
      setApprovalModalRequest(null);
      fetchRequests();
    } catch (err) {
      console.error(err);
      alert('Failed to approve request');
    } finally {
      setApproving(false);
    }
  };

  const handleOpenRejectModal = (req: AssetRequest) => {
    setRejectionComments('');
    setRejectionModalRequest(req);
  };

  const handleRejectRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectionModalRequest) return;
    setRejecting(true);
    try {
      await api.post(`/assets/requests/${rejectionModalRequest.id}/reject/`, {
        comments: rejectionComments,
      });
      setRejectionModalRequest(null);
      fetchRequests();
    } catch (err) {
      console.error(err);
      alert('Failed to reject request');
    } finally {
      setRejecting(false);
    }
  };

  const updateSpec = (key: string, value: any) => {
    setAssetForm((prev: any) => ({
      ...prev,
      specifications: {
        ...prev.specifications,
        [key]: value,
      },
    }));
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'LAPTOP': return <Laptop className="text-indigo-600" size={18} />;
      case 'DESKTOP': return <Cpu className="text-blue-600" size={18} />;
      case 'MOBILE': return <Smartphone className="text-emerald-600" size={18} />;
      case 'SIM_CARD': return <Wifi className="text-amber-600" size={18} />;
      case 'ID_CARD': return <CreditCard className="text-rose-600" size={18} />;
      default: return <Box className="text-gray-600" size={18} />;
    }
  };

  const getAcceptanceBadge = (status?: string | null) => {
    if (!status) return null;
    switch (status) {
      case 'ACCEPTED':
        return <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full"><CheckCircle size={10} /> Confirmed</span>;
      case 'REJECTED':
        return <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-rose-50 text-rose-700 px-2 py-0.5 rounded-full"><AlertTriangle size={10} /> Rejected</span>;
      default:
        return <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full animate-pulse"><AlertCircle size={10} /> Awaiting Sign-off</span>;
    }
  };

  const getRequestStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-lg"><CheckCircle size={12} /> Approved</span>;
      case 'REJECTED':
        return <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-rose-50 text-rose-700 px-2.5 py-1 rounded-lg"><XCircle size={12} /> Rejected</span>;
      default:
        return <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-amber-50 text-amber-700 px-2.5 py-1 rounded-lg animate-pulse"><AlertCircle size={12} /> Pending</span>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Asset Management</h2>
          <p className="text-gray-500">Track and manage company assets, assignments, and digital receipts</p>
        </div>
        <button onClick={() => { setAssetForm({ ...defaultAsset, category: 'LAPTOP', specifications: {} }); setShowAddModal(true); }} className="btn-primary flex items-center gap-2">
          <Plus size={18} /> Add Asset
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="stat-card">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center"><Package size={20} className="text-indigo-600" /></div>
            <span className="text-sm text-gray-500">Total Assets</span>
          </div>
          <div className="text-2xl font-bold text-gray-800">{stats.total}</div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center"><Package size={20} className="text-emerald-600" /></div>
            <span className="text-sm text-gray-500">Available</span>
          </div>
          <div className="text-2xl font-bold text-emerald-600">{stats.available}</div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center"><UserPlus size={20} className="text-blue-600" /></div>
            <span className="text-sm text-gray-500">Assigned</span>
          </div>
          <div className="text-2xl font-bold text-blue-600">{stats.assigned}</div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center"><RotateCcw size={20} className="text-amber-600" /></div>
            <span className="text-sm text-gray-500">Maintenance</span>
          </div>
          <div className="text-2xl font-bold text-amber-600">{stats.maintenance}</div>
        </div>
      </div>

      {/* Primary Sub-Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex gap-6">
          <button
            onClick={() => setActiveSubTab('inventory')}
            className={`pb-3 font-semibold text-sm transition-colors border-b-2 ${
              activeSubTab === 'inventory' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            Asset Inventory
          </button>
          <button
            onClick={() => setActiveSubTab('requests')}
            className={`pb-3 font-semibold text-sm transition-colors border-b-2 ${
              activeSubTab === 'requests' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            Asset Requests
          </button>
        </div>
      </div>

      {activeSubTab === 'inventory' ? (
        <>
          {/* Filters */}
          <div className="card">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} className="input-field pl-10" placeholder="Search assets by name, code, or brand..." />
              </div>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="input-field w-44">
                <option value="">All Status</option>
                <option value="AVAILABLE">Available</option>
                <option value="ASSIGNED">Assigned</option>
                <option value="MAINTENANCE">Maintenance</option>
                <option value="RETIRED">Retired</option>
              </select>
              <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="input-field w-44">
                <option value="">All Categories</option>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c.replace('_', ' ')}</option>)}
              </select>
            </div>
          </div>

          {/* Asset Table */}
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="table-header">
                    <th className="px-6 py-3">Asset</th>
                    <th className="px-6 py-3">Code</th>
                    <th className="px-6 py-3">Category</th>
                    <th className="px-6 py-3">Brand / Model</th>
                    <th className="px-6 py-3">Condition</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3">Assigned To</th>
                    <th className="px-6 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {loading ? (
                    <tr><td colSpan={8} className="px-6 py-12 text-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto" /></td></tr>
                  ) : assets.length === 0 ? (
                    <tr><td colSpan={8} className="px-6 py-8 text-center text-gray-400">No assets found</td></tr>
                  ) : assets.map((a) => (
                    <>
                      <tr key={a.id} className="hover:bg-gray-50 border-b border-gray-50">
                        <td className="table-cell">
                          <div className="font-semibold text-gray-800">{a.name}</div>
                          <div className="text-[10px] text-gray-400 font-mono mt-0.5">{a.serial_number || 'No S/N'}</div>
                        </td>
                        <td className="table-cell font-mono text-xs font-semibold">{a.asset_code}</td>
                        <td className="table-cell">
                          <div className="flex items-center gap-1.5 text-xs text-gray-600">
                            {getCategoryIcon(a.category)}
                            <span className="capitalize">{a.category?.toLowerCase().replace('_', ' ')}</span>
                          </div>
                        </td>
                        <td className="table-cell font-medium text-gray-600">{a.brand} {a.model_name}</td>
                        <td className="table-cell text-xs">{a.condition}</td>
                        <td className="table-cell"><span className={`badge ${getStatusColor(a.status)}`}>{a.status}</span></td>
                        <td className="table-cell">
                          <div className="flex flex-col gap-1">
                            <span className="font-medium text-gray-700">{a.assigned_to_name || '-'}</span>
                            {getAcceptanceBadge(a.acceptance_status)}
                          </div>
                        </td>
                        <td className="table-cell">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setExpandedAsset(expandedAsset === a.id ? null : a.id)}
                              className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                              title="View specifications"
                            >
                              <Info size={16} />
                            </button>
                            {a.status === 'AVAILABLE' && (
                              <button onClick={() => { setAssignForm({ employee_id: '', condition_at_assignment: a.condition || 'GOOD', expected_return_date: '', notes: '' }); setShowAssignModal(a.id); }} className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1">
                                <UserPlus size={14} /> Assign
                              </button>
                            )}
                            {a.status === 'ASSIGNED' && (
                              <button onClick={() => { setReturnForm({ condition: 'GOOD', remarks: '', damage_report: '', is_damaged: false }); setShowReturnModal(a.id); }} className="btn-warning text-xs px-3 py-1.5 flex items-center gap-1">
                                <RotateCcw size={14} /> Return
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                      {expandedAsset === a.id && (
                        <tr className="bg-indigo-50/40">
                          <td colSpan={8} className="px-6 py-4">
                            <div className="text-xs">
                              <h4 className="font-bold text-indigo-900 mb-2 uppercase tracking-wider text-[10px]">Specifications Checklist</h4>
                              {a.specifications && Object.keys(a.specifications).length > 0 ? (
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-white p-4 rounded-xl border border-indigo-50">
                                  {Object.entries(a.specifications).map(([key, val]) => (
                                    <div key={key}>
                                      <span className="text-[10px] text-gray-400 uppercase font-medium">{key.replace(/_/g, ' ')}</span>
                                      <span className="block font-semibold text-gray-700 text-sm mt-0.5">{typeof val === 'boolean' ? (val ? 'Yes' : 'No') : String(val)}</span>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <span className="text-gray-500 italic">No dynamic specifications recorded for this item.</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        /* Requests Tab */
        <>
          {/* Requests Filters */}
          <div className="card">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="text" value={reqSearch} onChange={(e) => setReqSearch(e.target.value)} className="input-field pl-10" placeholder="Search requests by employee name or code..." />
              </div>
              <select value={reqStatusFilter} onChange={(e) => setReqStatusFilter(e.target.value)} className="input-field w-44">
                <option value="">All Status</option>
                <option value="PENDING">Pending</option>
                <option value="APPROVED">Approved</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </div>
          </div>

          {/* Requests Table */}
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="table-header">
                    <th className="px-6 py-3">Employee</th>
                    <th className="px-6 py-3">Asset Category</th>
                    <th className="px-6 py-3">Reason</th>
                    <th className="px-6 py-3">Request Date</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3">Assigned Asset</th>
                    <th className="px-6 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {loading ? (
                    <tr><td colSpan={7} className="px-6 py-12 text-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto" /></td></tr>
                  ) : requests.length === 0 ? (
                    <tr><td colSpan={7} className="px-6 py-8 text-center text-gray-400">No requests found</td></tr>
                  ) : requests.map((r) => (
                    <tr key={r.id} className="hover:bg-gray-50">
                      <td className="table-cell">
                        <div className="font-semibold text-gray-800">{r.employee_name}</div>
                        <div className="text-[10px] text-gray-400 font-mono">{r.employee_code}</div>
                      </td>
                      <td className="table-cell">
                        <div className="flex flex-col">
                          <div className="flex items-center gap-1.5 text-xs text-gray-700 capitalize font-medium">
                            {getCategoryIcon(r.asset_category)}
                            {r.asset_category.replace(/_/g, ' ').toLowerCase()}
                          </div>
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded self-start mt-0.5 ${
                            r.request_type === 'RETURN' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
                          }`}>
                            {r.request_type === 'RETURN' ? 'Return Request' : 'Allocation Request'}
                          </span>
                        </div>
                      </td>
                      <td className="table-cell max-w-xs truncate text-xs text-gray-600" title={r.reason}>
                        {r.reason}
                      </td>
                      <td className="table-cell text-xs">{formatDate(r.request_date)}</td>
                      <td className="table-cell">{getRequestStatusBadge(r.status)}</td>
                      <td className="table-cell">
                        {r.status === 'APPROVED' && r.assigned_asset_name ? (
                          <div className="flex flex-col">
                            <span className="font-semibold text-xs text-gray-800">{r.assigned_asset_name}</span>
                            <span className="text-[9px] font-mono bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded self-start mt-0.5">{r.assigned_asset_code}</span>
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="table-cell">
                        {r.status === 'PENDING' && (
                          <div className="flex items-center gap-2">
                            {r.request_type === 'RETURN' ? (
                              <button
                                onClick={() => {
                                  if (r.assigned_asset) {
                                    setReturnForm({ condition: 'GOOD', remarks: '', damage_report: '', is_damaged: false });
                                    setShowReturnModal(r.assigned_asset);
                                  } else {
                                    alert("No assigned asset found on this return request");
                                  }
                                }}
                                className="bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors shadow-sm"
                              >
                                <RotateCcw size={12} /> Process Return
                              </button>
                            ) : (
                              <button
                                onClick={() => handleOpenApproveModal(r)}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors shadow-sm"
                              >
                                <Check size={12} /> Approve
                              </button>
                            )}
                            <button
                              onClick={() => handleOpenRejectModal(r)}
                              className="bg-rose-50 hover:bg-rose-100 text-rose-700 text-[11px] font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors border border-rose-200"
                            >
                              <X size={12} /> Reject
                            </button>
                          </div>
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

      {/* Add Asset Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-800">Add New Asset</h3>
              <button onClick={() => setShowAddModal(false)} className="p-2 text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <form onSubmit={handleAddAsset} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="label">Asset Name *</label>
                  <input type="text" value={assetForm.name} onChange={(e) => setAssetForm({ ...assetForm, name: e.target.value })} className="input-field" required />
                </div>
                <div>
                  <label className="label">Asset Code *</label>
                  <input type="text" value={assetForm.asset_code} onChange={(e) => setAssetForm({ ...assetForm, asset_code: e.target.value })} className="input-field" required />
                </div>
                <div>
                  <label className="label">Category *</label>
                  <select value={assetForm.category} onChange={(e) => setAssetForm({ ...assetForm, category: e.target.value, specifications: {} })} className="input-field" required>
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c.replace('_', ' ')}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Brand *</label>
                  <input type="text" value={assetForm.brand} onChange={(e) => setAssetForm({ ...assetForm, brand: e.target.value })} className="input-field" required />
                </div>
                <div>
                  <label className="label">Model Name</label>
                  <input type="text" value={assetForm.model_name} onChange={(e) => setAssetForm({ ...assetForm, model_name: e.target.value })} className="input-field" />
                </div>
                <div>
                  <label className="label">Serial Number</label>
                  <input type="text" value={assetForm.serial_number} onChange={(e) => setAssetForm({ ...assetForm, serial_number: e.target.value })} className="input-field" />
                </div>
                <div>
                  <label className="label">Purchase Date *</label>
                  <input type="date" value={assetForm.purchase_date} onChange={(e) => setAssetForm({ ...assetForm, purchase_date: e.target.value })} className="input-field" required />
                </div>
                <div>
                  <label className="label">Purchase Price (₹) *</label>
                  <input type="number" step="0.01" value={assetForm.purchase_price} onChange={(e) => setAssetForm({ ...assetForm, purchase_price: e.target.value === '' ? '' : Number(e.target.value) })} className="input-field" required />
                </div>
                <div>
                  <label className="label">Warranty Expiry</label>
                  <input type="date" value={assetForm.warranty_expiry} onChange={(e) => setAssetForm({ ...assetForm, warranty_expiry: e.target.value })} className="input-field" />
                </div>
                <div>
                  <label className="label">Condition</label>
                  <select value={assetForm.condition} onChange={(e) => setAssetForm({ ...assetForm, condition: e.target.value })} className="input-field">
                    {CONDITIONS.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                {/* Dynamic Category Specifications Section */}
                <div className="col-span-2 border-t border-gray-100 pt-4 mt-2">
                  <h4 className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-3">Specifications Schema Fields</h4>
                  <div className="grid grid-cols-2 gap-3 bg-gray-50 p-4 rounded-xl">
                    {assetForm.category === 'LAPTOP' && (
                      <>
                        <div>
                          <label className="text-[10px] font-bold text-gray-500 uppercase">Processor</label>
                          <input type="text" onChange={(e) => updateSpec('processor', e.target.value)} className="input-field mt-1" placeholder="e.g. Core i7" />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-gray-500 uppercase">RAM</label>
                          <input type="text" onChange={(e) => updateSpec('ram', e.target.value)} className="input-field mt-1" placeholder="e.g. 16GB" />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-gray-500 uppercase">Storage</label>
                          <input type="text" onChange={(e) => updateSpec('storage', e.target.value)} className="input-field mt-1" placeholder="e.g. 512GB SSD" />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-gray-500 uppercase">OS</label>
                          <input type="text" onChange={(e) => updateSpec('os', e.target.value)} className="input-field mt-1" placeholder="e.g. Windows 11" />
                        </div>
                        <div className="flex items-center gap-2 mt-4 col-span-2">
                          <input type="checkbox" id="charger" onChange={(e) => updateSpec('charger_included', e.target.checked)} className="rounded text-indigo-600 focus:ring-indigo-500" />
                          <label htmlFor="charger" className="text-xs font-semibold text-gray-700">Charger Included (Yes/No)</label>
                        </div>
                      </>
                    )}

                    {assetForm.category === 'DESKTOP' && (
                      <>
                        <div>
                          <label className="text-[10px] font-bold text-gray-500 uppercase">CPU Specs</label>
                          <input type="text" onChange={(e) => updateSpec('cpu_specs', e.target.value)} className="input-field mt-1" placeholder="e.g. Ryzen 9" />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-gray-500 uppercase">RAM</label>
                          <input type="text" onChange={(e) => updateSpec('ram', e.target.value)} className="input-field mt-1" placeholder="e.g. 32GB" />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-gray-500 uppercase">Storage</label>
                          <input type="text" onChange={(e) => updateSpec('storage', e.target.value)} className="input-field mt-1" placeholder="e.g. 1TB SSD" />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-gray-500 uppercase">Monitor Serial(s)</label>
                          <input type="text" onChange={(e) => updateSpec('connected_monitor_serial', e.target.value)} className="input-field mt-1" placeholder="e.g. SN-882299" />
                        </div>
                        <div className="flex items-center gap-2 mt-4 col-span-2">
                          <input type="checkbox" id="combo" onChange={(e) => updateSpec('keyboard_mouse_combo', e.target.checked)} className="rounded text-indigo-600 focus:ring-indigo-500" />
                          <label htmlFor="combo" className="text-xs font-semibold text-gray-700">Keyboard & Mouse Bundle Included</label>
                        </div>
                      </>
                    )}

                    {assetForm.category === 'MOBILE' && (
                      <>
                        <div>
                          <label className="text-[10px] font-bold text-gray-500 uppercase">IMEI 1</label>
                          <input type="text" onChange={(e) => updateSpec('imei_1', e.target.value)} className="input-field mt-1" placeholder="First IMEI" />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-gray-500 uppercase">IMEI 2</label>
                          <input type="text" onChange={(e) => updateSpec('imei_2', e.target.value)} className="input-field mt-1" placeholder="Second IMEI" />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-gray-500 uppercase">Storage Capacity</label>
                          <input type="text" onChange={(e) => updateSpec('storage', e.target.value)} className="input-field mt-1" placeholder="e.g. 128GB" />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-gray-500 uppercase">Color</label>
                          <input type="text" onChange={(e) => updateSpec('color', e.target.value)} className="input-field mt-1" placeholder="e.g. Space Gray" />
                        </div>
                      </>
                    )}

                    {assetForm.category === 'SIM_CARD' && (
                      <>
                        <div>
                          <label className="text-[10px] font-bold text-gray-500 uppercase">Mobile Number</label>
                          <input type="text" onChange={(e) => updateSpec('mobile_number', e.target.value)} className="input-field mt-1" placeholder="+91..." />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-gray-500 uppercase">ICCID</label>
                          <input type="text" onChange={(e) => updateSpec('iccid', e.target.value)} className="input-field mt-1" placeholder="SIM Serial ICCID" />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-gray-500 uppercase">Provider</label>
                          <input type="text" onChange={(e) => updateSpec('network_provider', e.target.value)} className="input-field mt-1" placeholder="Jio, Airtel, Vodafone..." />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-gray-500 uppercase">PIN/PUK Codes</label>
                          <input type="text" onChange={(e) => updateSpec('pin_puk_code', e.target.value)} className="input-field mt-1" placeholder="e.g. 4882 / 99229988" />
                        </div>
                        <div className="col-span-2">
                          <label className="text-[10px] font-bold text-gray-500 uppercase">Plan details / Data Limit</label>
                          <input type="text" onChange={(e) => updateSpec('plan_details', e.target.value)} className="input-field mt-1" placeholder="e.g. Corporate Unlimited 50GB" />
                        </div>
                      </>
                    )}

                    {assetForm.category === 'ID_CARD' && (
                      <>
                        <div>
                          <label className="text-[10px] font-bold text-gray-500 uppercase">Card Number</label>
                          <input type="text" onChange={(e) => updateSpec('card_number', e.target.value)} className="input-field mt-1" placeholder="e.g. ID-8822" />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-gray-500 uppercase">RFID Tag</label>
                          <input type="text" onChange={(e) => updateSpec('rfid_tag', e.target.value)} className="input-field mt-1" placeholder="e.g. RFID-002" />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-gray-500 uppercase">Access Levels</label>
                          <input type="text" onChange={(e) => updateSpec('access_levels_granted', e.target.value)} className="input-field mt-1" placeholder="e.g. Server Room Access" />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-gray-500 uppercase">Expiry Date</label>
                          <input type="date" onChange={(e) => updateSpec('expiry_date', e.target.value)} className="input-field mt-1" />
                        </div>
                      </>
                    )}

                    {assetForm.category === 'ACCESSORIES' && (
                      <>
                        <div>
                          <label className="text-[10px] font-bold text-gray-500 uppercase">Serial or SKU</label>
                          <input type="text" onChange={(e) => updateSpec('serial_number_sku', e.target.value)} className="input-field mt-1" placeholder="e.g. SKU-882" />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-gray-500 uppercase">Accessory Type</label>
                          <input type="text" onChange={(e) => updateSpec('type', e.target.value)} className="input-field mt-1" placeholder="Headset, Adapter, Docking Station..." />
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button type="button" onClick={() => setShowAddModal(false)} className="btn-secondary">Cancel</button>
                <button type="submit" disabled={saving} className="btn-primary">
                  {saving ? 'Saving...' : 'Add Asset'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Asset Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-800">Assign Asset</h3>
              <button onClick={() => setShowAssignModal(null)} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"><X size={18} /></button>
            </div>
            <form onSubmit={handleAssign} className="p-6 space-y-4">
              <div>
                <label className="label">Select Employee *</label>
                <select value={assignForm.employee_id} onChange={(e) => setAssignForm({ ...assignForm, employee_id: e.target.value })} className="input-field text-sm" required>
                  <option value="">Choose Employee...</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>{emp.user_full_name} ({emp.employee_id})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Handover Condition</label>
                <select value={assignForm.condition_at_assignment} onChange={(e) => setAssignForm({ ...assignForm, condition_at_assignment: e.target.value })} className="input-field text-sm">
                  <option value="GOOD">Good</option>
                  <option value="NEW">New</option>
                  <option value="FAIR">Fair</option>
                  <option value="POOR">Poor</option>
                </select>
              </div>
              <div>
                <label className="label">Expected Return Date</label>
                <input type="date" value={assignForm.expected_return_date} onChange={(e) => setAssignForm({ ...assignForm, expected_return_date: e.target.value })} className="input-field text-sm" />
              </div>
              <div>
                <label className="label">Notes / Instructions</label>
                <textarea value={assignForm.notes} onChange={(e) => setAssignForm({ ...assignForm, notes: e.target.value })} className="input-field min-h-[85px] text-sm" placeholder="Any instructions for employee..." />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button type="button" onClick={() => setShowAssignModal(null)} className="btn-secondary">Cancel</button>
                <button type="submit" disabled={assigning} className="btn-primary">{assigning ? 'Assigning...' : 'Confirm Assignment'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Return Asset Modal */}
      {showReturnModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-800">Return Asset Check-off</h3>
              <button onClick={() => setShowReturnModal(null)} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"><X size={18} /></button>
            </div>
            <form onSubmit={handleReturn} className="p-6 space-y-4">
              <div>
                <label className="label">Return Condition</label>
                <select value={returnForm.condition} onChange={(e) => setReturnForm({ ...returnForm, condition: e.target.value })} className="input-field text-sm">
                  <option value="GOOD">Good</option>
                  <option value="DAMAGED">Damaged / Requires Repair</option>
                  <option value="SCRAPPED">Scrapped</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="is_damaged" checked={returnForm.is_damaged} onChange={(e) => setReturnForm({ ...returnForm, is_damaged: e.target.checked })} className="rounded text-indigo-600 focus:ring-indigo-500 animate-pulse" />
                <label htmlFor="is_damaged" className="text-xs font-semibold text-gray-700">Flag as Damaged</label>
              </div>
              {returnForm.is_damaged && (
                <div>
                  <label className="label">Damage Report Details *</label>
                  <textarea value={returnForm.damage_report} onChange={(e) => setReturnForm({ ...returnForm, damage_report: e.target.value })} className="input-field min-h-[85px] text-sm" placeholder="Please detail the nature of damage..." required />
                </div>
              )}
              <div>
                <label className="label">Remarks / Inspection Notes</label>
                <textarea value={returnForm.remarks} onChange={(e) => setReturnForm({ ...returnForm, remarks: e.target.value })} className="input-field min-h-[85px] text-sm" placeholder="Additional remarks on return handover..." />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button type="button" onClick={() => setShowReturnModal(null)} className="btn-secondary">Cancel</button>
                <button type="submit" disabled={returning} className="btn-primary">{returning ? 'Processing...' : 'Confirm Return'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Approve Request Modal */}
      {approvalModalRequest && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-800">Approve Asset Request</h3>
              <button onClick={() => setApprovalModalRequest(null)} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"><X size={18} /></button>
            </div>
            <form onSubmit={handleApproveRequest} className="p-6 space-y-4">
              <div>
                <span className="text-xs text-gray-400 font-semibold block uppercase">Requested by</span>
                <p className="font-bold text-gray-800 text-sm">{approvalModalRequest.employee_name} ({approvalModalRequest.employee_code})</p>
                <span className="text-xs text-gray-400 font-semibold block uppercase mt-2">Requested Category</span>
                <p className="font-semibold text-gray-700 text-sm capitalize">{approvalModalRequest.asset_category.replace(/_/g, ' ').toLowerCase()}</p>
                <span className="text-xs text-gray-400 font-semibold block uppercase mt-2">Reason</span>
                <p className="text-xs text-gray-600 italic">"{approvalModalRequest.reason}"</p>
              </div>

              <div>
                <label className="label">Select Available Asset *</label>
                {availableAssetsForApproval.length === 0 ? (
                  <div className="text-xs text-rose-600 bg-rose-50 p-3 rounded-lg border border-rose-100 font-semibold mt-1">
                    No available {approvalModalRequest.asset_category.replace(/_/g, ' ').toLowerCase()}s found in stock! Please add/register one in inventory first.
                  </div>
                ) : (
                  <select
                    value={selectedAssetForApproval}
                    onChange={(e) => setSelectedAssetForApproval(e.target.value)}
                    className="input-field mt-1 text-sm font-semibold"
                    required
                  >
                    {availableAssetsForApproval.map((asset) => (
                      <option key={asset.id} value={asset.id}>
                        {asset.name} - {asset.asset_code} ({asset.brand})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="label">Approval Comments / Remarks</label>
                <textarea
                  value={approvalComments}
                  onChange={(e) => setApprovalComments(e.target.value)}
                  className="input-field min-h-[85px] mt-1 text-sm"
                  placeholder="Add details, pick-up instructions, or comments..."
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button type="button" onClick={() => setApprovalModalRequest(null)} className="btn-secondary">Cancel</button>
                <button
                  type="submit"
                  disabled={approving || availableAssetsForApproval.length === 0}
                  className="btn-primary bg-emerald-600 hover:bg-emerald-700"
                >
                  {approving ? 'Processing...' : 'Approve & Assign'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reject Request Modal */}
      {rejectionModalRequest && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-800">Reject Asset Request</h3>
              <button onClick={() => setRejectionModalRequest(null)} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"><X size={18} /></button>
            </div>
            <form onSubmit={handleRejectRequest} className="p-6 space-y-4">
              <div>
                <span className="text-xs text-gray-400 font-semibold block uppercase">Requested by</span>
                <p className="font-bold text-gray-800 text-sm">{rejectionModalRequest.employee_name} ({rejectionModalRequest.employee_code})</p>
                <span className="text-xs text-gray-400 font-semibold block uppercase mt-2">Requested Category</span>
                <p className="font-semibold text-gray-700 text-sm capitalize">{rejectionModalRequest.asset_category.replace(/_/g, ' ').toLowerCase()}</p>
              </div>

              <div>
                <label className="label">Rejection Reason *</label>
                <textarea
                  value={rejectionComments}
                  onChange={(e) => setRejectionComments(e.target.value)}
                  className="input-field min-h-[85px] mt-1 text-sm"
                  placeholder="Detail the reason for rejecting this request..."
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button type="button" onClick={() => setRejectionModalRequest(null)} className="btn-secondary">Cancel</button>
                <button
                  type="submit"
                  disabled={rejecting}
                  className="btn-primary bg-rose-600 hover:bg-rose-700"
                >
                  {rejecting ? 'Processing...' : 'Reject Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
