import { useEffect, useState } from 'react';
import api from '../../api/axios';
import type { Asset, Employee } from '../../types';
import { formatCurrency, formatDate, getStatusColor } from '../../lib/utils';
import { Package, Search, Plus, UserPlus, RotateCcw, X } from 'lucide-react';

const CATEGORIES = ['LAPTOP', 'DESKTOP', 'MONITOR', 'KEYBOARD', 'MOUSE', 'PHONE', 'TABLET', 'CHAIR', 'DESK', 'OTHER'];
const CONDITIONS = ['NEW', 'GOOD', 'FAIR', 'POOR'];

interface AssetStats {
  total: number;
  available: number;
  assigned: number;
  maintenance: number;
}

const defaultAsset = {
  name: '', asset_code: '', category: 'LAPTOP', brand: '', model_name: '', serial_number: '',
  purchase_date: '', purchase_price: 0, warranty_expiry: '', condition: 'NEW', company: '',
};

export default function AssetManagementPage() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [stats, setStats] = useState<AssetStats>({ total: 0, available: 0, assigned: 0, maintenance: 0 });
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  const [showAddModal, setShowAddModal] = useState(false);
  const [assetForm, setAssetForm] = useState(defaultAsset);
  const [saving, setSaving] = useState(false);

  const [showAssignModal, setShowAssignModal] = useState<string | null>(null);
  const [assignForm, setAssignForm] = useState({ employee_id: '', condition_at_assignment: 'GOOD', expected_return_date: '', notes: '' });
  const [assigning, setAssigning] = useState(false);

  const [showReturnModal, setShowReturnModal] = useState<string | null>(null);
  const [returnForm, setReturnForm] = useState({ condition: 'GOOD', remarks: '', damage_report: '', is_damaged: false });
  const [returning, setReturning] = useState(false);

  useEffect(() => { fetchAll(); }, [search, statusFilter, categoryFilter]);

  const fetchAll = async () => {
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

  const handleAddAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/assets/', assetForm);
      setShowAddModal(false);
      setAssetForm(defaultAsset);
      fetchAll();
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
      fetchAll();
    } catch (err) { console.error(err); } finally { setAssigning(false); }
  };

  const handleReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showReturnModal) return;
    setReturning(true);
    try {
      await api.post('/assets/return/', { assignment_id: showReturnModal, ...returnForm });
      setShowReturnModal(null);
      setReturnForm({ condition: 'GOOD', remarks: '', damage_report: '', is_damaged: false });
      fetchAll();
    } catch (err) { console.error(err); } finally { setReturning(false); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Asset Management</h2>
          <p className="text-gray-500">Track and manage company assets and assignments</p>
        </div>
        <button onClick={() => { setAssetForm(defaultAsset); setShowAddModal(true); }} className="btn-primary flex items-center gap-2">
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
                <th className="px-6 py-3">Purchase Price</th>
                <th className="px-6 py-3">Condition</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Assigned To</th>
                <th className="px-6 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={9} className="px-6 py-12 text-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto" /></td></tr>
              ) : assets.length === 0 ? (
                <tr><td colSpan={9} className="px-6 py-8 text-center text-gray-400">No assets found</td></tr>
              ) : assets.map((a) => (
                <tr key={a.id} className="hover:bg-gray-50">
                  <td className="table-cell font-medium text-gray-800">{a.name}</td>
                  <td className="table-cell font-mono text-xs">{a.asset_code}</td>
                  <td className="table-cell">{a.category?.replace('_', ' ')}</td>
                  <td className="table-cell">{a.brand} {a.model_name}</td>
                  <td className="table-cell">{formatCurrency(a.purchase_price)}</td>
                  <td className="table-cell">{a.condition}</td>
                  <td className="table-cell"><span className={`badge ${getStatusColor(a.status)}`}>{a.status}</span></td>
                  <td className="table-cell">{a.assigned_to_name || '-'}</td>
                  <td className="table-cell">
                    <div className="flex items-center gap-1">
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
              ))}
            </tbody>
          </table>
        </div>
      </div>

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
                  <select value={assetForm.category} onChange={(e) => setAssetForm({ ...assetForm, category: e.target.value })} className="input-field" required>
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
                  <input type="number" step="0.01" value={assetForm.purchase_price} onChange={(e) => setAssetForm({ ...assetForm, purchase_price: Number(e.target.value) })} className="input-field" required />
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
                <div className="col-span-2">
                  <label className="label">Company</label>
                  <input type="text" value={assetForm.company} onChange={(e) => setAssetForm({ ...assetForm, company: e.target.value })} className="input-field" />
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

      {/* Assign Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-800">Assign Asset</h3>
              <button onClick={() => setShowAssignModal(null)} className="p-2 text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <form onSubmit={handleAssign} className="p-6 space-y-4">
              <div>
                <label className="label">Employee *</label>
                <select value={assignForm.employee_id} onChange={(e) => setAssignForm({ ...assignForm, employee_id: e.target.value })} className="input-field" required>
                  <option value="">Select employee</option>
                  {employees.map((e) => <option key={e.id} value={e.id}>{e.user_full_name} ({e.employee_code})</option>)}
                </select>
              </div>
              <div>
                <label className="label">Condition at Assignment</label>
                <select value={assignForm.condition_at_assignment} onChange={(e) => setAssignForm({ ...assignForm, condition_at_assignment: e.target.value })} className="input-field">
                  {CONDITIONS.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Expected Return Date</label>
                <input type="date" value={assignForm.expected_return_date} onChange={(e) => setAssignForm({ ...assignForm, expected_return_date: e.target.value })} className="input-field" />
              </div>
              <div>
                <label className="label">Notes</label>
                <textarea value={assignForm.notes} onChange={(e) => setAssignForm({ ...assignForm, notes: e.target.value })} className="input-field" rows={2} placeholder="Any notes about this assignment..." />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button type="button" onClick={() => setShowAssignModal(null)} className="btn-secondary">Cancel</button>
                <button type="submit" disabled={assigning} className="btn-primary">
                  {assigning ? 'Assigning...' : 'Assign'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Return Modal */}
      {showReturnModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-800">Return Asset</h3>
              <button onClick={() => setShowReturnModal(null)} className="p-2 text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <form onSubmit={handleReturn} className="p-6 space-y-4">
              <div>
                <label className="label">Condition on Return *</label>
                <select value={returnForm.condition} onChange={(e) => setReturnForm({ ...returnForm, condition: e.target.value })} className="input-field" required>
                  {CONDITIONS.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="is_damaged" checked={returnForm.is_damaged} onChange={(e) => setReturnForm({ ...returnForm, is_damaged: e.target.checked })} className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                <label htmlFor="is_damaged" className="text-sm text-gray-700">Asset is damaged</label>
              </div>
              {returnForm.is_damaged && (
                <div>
                  <label className="label">Damage Report</label>
                  <textarea value={returnForm.damage_report} onChange={(e) => setReturnForm({ ...returnForm, damage_report: e.target.value })} className="input-field" rows={3} placeholder="Describe the damage..." />
                </div>
              )}
              <div>
                <label className="label">Remarks</label>
                <textarea value={returnForm.remarks} onChange={(e) => setReturnForm({ ...returnForm, remarks: e.target.value })} className="input-field" rows={2} placeholder="Any additional remarks..." />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button type="button" onClick={() => setShowReturnModal(null)} className="btn-secondary">Cancel</button>
                <button type="submit" disabled={returning} className="btn-warning">
                  {returning ? 'Returning...' : 'Return Asset'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
