import { useEffect, useState } from 'react';
import api from '../../api/axios';
import type { Resignation } from '../../types';
import { formatDate, getStatusColor } from '../../lib/utils';
import { LogOut, Plus } from 'lucide-react';

export default function ExitPage() {
  const [resignations, setResignations] = useState<Resignation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchResignations(); }, []);

  const fetchResignations = async () => {
    try {
      const res = await api.get('/exit/resignations/');
      setResignations(res.data.data);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Exit Management</h2>
          <p className="text-gray-500">Manage employee resignations and exits</p>
        </div>
        <button className="btn-primary flex items-center gap-2"><Plus size={18} /> New Resignation</button>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="table-header">
                <th className="px-6 py-3">Employee</th>
                <th className="px-6 py-3">Employee ID</th>
                <th className="px-6 py-3">Last Working Day</th>
                <th className="px-6 py-3">Notice Period</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Relieved</th>
                <th className="px-6 py-3">Applied</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={7} className="px-6 py-12 text-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto" /></td></tr>
              ) : resignations.length === 0 ? (
                <tr><td colSpan={7} className="px-6 py-8 text-center text-gray-400">No resignation records</td></tr>
              ) : resignations.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="table-cell font-medium">{r.employee_name}</td>
                  <td className="table-cell font-mono text-xs">{r.employee_id}</td>
                  <td className="table-cell">{formatDate(r.last_working_day)}</td>
                  <td className="table-cell">{r.notice_period_days} days</td>
                  <td className="table-cell"><span className={`badge ${getStatusColor(r.status)}`}>{r.status}</span></td>
                  <td className="table-cell">{r.is_relieved ? 'Yes' : 'No'}</td>
                  <td className="table-cell">{formatDate(r.applied_date)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
