import { useEffect, useState } from 'react';
import api from '../../api/axios';
import type { Asset } from '../../types';
import { getStatusColor, formatCurrency, formatDate } from '../../lib/utils';
import { Package, Search } from 'lucide-react';

export default function AssetsPage() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => { fetchAssets(); }, [search, statusFilter]);

  const fetchAssets = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (statusFilter) params.append('status', statusFilter);
      const res = await api.get('/assets/', { params });
      setAssets(res.data.data);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Assets</h2>
        <p className="text-gray-500">Manage company assets and assignments</p>
      </div>

      <div className="card">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} className="input-field pl-10" placeholder="Search assets..." />
          </div>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="input-field w-48">
            <option value="">All Status</option>
            <option value="AVAILABLE">Available</option>
            <option value="ASSIGNED">Assigned</option>
            <option value="MAINTENANCE">Maintenance</option>
            <option value="RETIRED">Retired</option>
          </select>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="table-header">
                <th className="px-6 py-3">Asset</th>
                <th className="px-6 py-3">Code</th>
                <th className="px-6 py-3">Category</th>
                <th className="px-6 py-3">Brand</th>
                <th className="px-6 py-3">Purchase Price</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Assigned To</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={7} className="px-6 py-12 text-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto" /></td></tr>
              ) : assets.length === 0 ? (
                <tr><td colSpan={7} className="px-6 py-8 text-center text-gray-400">No assets found</td></tr>
              ) : assets.map((a) => (
                <tr key={a.id} className="hover:bg-gray-50">
                  <td className="table-cell font-medium">{a.name}</td>
                  <td className="table-cell font-mono text-xs">{a.asset_code}</td>
                  <td className="table-cell">{a.category?.replace('_', ' ')}</td>
                  <td className="table-cell">{a.brand}</td>
                  <td className="table-cell">{formatCurrency(a.purchase_price)}</td>
                  <td className="table-cell"><span className={`badge ${getStatusColor(a.status)}`}>{a.status}</span></td>
                  <td className="table-cell">{a.assigned_to_name || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
