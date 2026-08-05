import { useEffect, useState } from 'react';
import api from '../../api/axios';
import type { SalaryStructure } from '../../types';
import { Plus, Edit2, ToggleLeft, ToggleRight, X } from 'lucide-react';

const defaultForm = {
  name: '',
  description: '',
  basic_percentage: 40,
  hra_percentage: 20,
  special_allowance_percentage: 15,
  pf_percentage: 12,
  esi_percentage: 1.75,
  professional_tax: 200,
};

export default function SalaryStructurePage() {
  const [structures, setStructures] = useState<SalaryStructure[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(defaultForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchStructures(); }, []);

  const fetchStructures = async () => {
    setLoading(true);
    try {
      const res = await api.get('/payroll/salary-structures/');
      setStructures(res.data.data);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const openCreate = () => {
    setEditingId(null);
    setForm(defaultForm);
    setShowModal(true);
  };

  const openEdit = (s: SalaryStructure) => {
    setEditingId(s.id);
    setForm({
      name: s.name,
      description: s.description,
      basic_percentage: s.basic_percentage,
      hra_percentage: s.hra_percentage,
      special_allowance_percentage: s.special_allowance_percentage,
      pf_percentage: s.pf_percentage,
      esi_percentage: s.esi_percentage,
      professional_tax: s.professional_tax,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingId) {
        await api.put(`/payroll/salary-structures/${editingId}/`, form);
      } else {
        await api.post('/payroll/salary-structures/', form);
      }
      setShowModal(false);
      fetchStructures();
    } catch (err) { console.error(err); } finally { setSaving(false); }
  };

  const toggleActive = async (s: SalaryStructure) => {
    try {
      await api.put(`/payroll/salary-structures/${s.id}/`, { ...s, is_active: !s.is_active });
      fetchStructures();
    } catch (err) { console.error(err); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Salary Structures</h2>
          <p className="text-gray-500">Define salary components and percentage breakdowns</p>
        </div>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2">
          <Plus size={18} /> Create Structure
        </button>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="table-header">
                <th className="px-6 py-3">Name</th>
                <th className="px-6 py-3">Basic %</th>
                <th className="px-6 py-3">HRA %</th>
                <th className="px-6 py-3">Spl. Allow. %</th>
                <th className="px-6 py-3">PF %</th>
                <th className="px-6 py-3">ESI %</th>
                <th className="px-6 py-3">Prof. Tax</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={9} className="px-6 py-12 text-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto" /></td></tr>
              ) : structures.length === 0 ? (
                <tr><td colSpan={9} className="px-6 py-8 text-center text-gray-400">No salary structures defined yet</td></tr>
              ) : structures.map((s) => (
                <tr key={s.id} className="hover:bg-gray-50">
                  <td className="table-cell">
                    <div>
                      <div className="font-medium text-gray-800">{s.name}</div>
                      {s.description && <div className="text-xs text-gray-400 mt-0.5">{s.description}</div>}
                    </div>
                  </td>
                  <td className="table-cell">{s.basic_percentage}%</td>
                  <td className="table-cell">{s.hra_percentage}%</td>
                  <td className="table-cell">{s.special_allowance_percentage}%</td>
                  <td className="table-cell">{s.pf_percentage}%</td>
                  <td className="table-cell">{s.esi_percentage}%</td>
                  <td className="table-cell">₹{s.professional_tax}</td>
                  <td className="table-cell">
                    <span className={`badge ${s.is_active ? 'badge-success' : 'badge-danger'}`}>
                      {s.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="table-cell">
                    <div className="flex items-center gap-2">
                      <button onClick={() => openEdit(s)} className="p-1.5 text-gray-400 hover:text-indigo-600 transition-colors" title="Edit">
                        <Edit2 size={16} />
                      </button>
                      <button onClick={() => toggleActive(s)} className={`p-1.5 transition-colors ${s.is_active ? 'text-emerald-500 hover:text-red-500' : 'text-gray-400 hover:text-emerald-500'}`} title={s.is_active ? 'Deactivate' : 'Activate'}>
                        {s.is_active ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-800">
                {editingId ? 'Edit Salary Structure' : 'Create Salary Structure'}
              </h3>
              <button onClick={() => setShowModal(false)} className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="label">Name *</label>
                <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input-field" required />
              </div>
              <div>
                <label className="label">Description</label>
                <input type="text" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="input-field" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Basic % *</label>
                  <input type="number" step="0.01" value={form.basic_percentage} onChange={(e) => setForm({ ...form, basic_percentage: Number(e.target.value) })} className="input-field" required />
                </div>
                <div>
                  <label className="label">HRA % *</label>
                  <input type="number" step="0.01" value={form.hra_percentage} onChange={(e) => setForm({ ...form, hra_percentage: Number(e.target.value) })} className="input-field" required />
                </div>
                <div>
                  <label className="label">Special Allowance % *</label>
                  <input type="number" step="0.01" value={form.special_allowance_percentage} onChange={(e) => setForm({ ...form, special_allowance_percentage: Number(e.target.value) })} className="input-field" required />
                </div>
                <div>
                  <label className="label">PF % *</label>
                  <input type="number" step="0.01" value={form.pf_percentage} onChange={(e) => setForm({ ...form, pf_percentage: Number(e.target.value) })} className="input-field" required />
                </div>
                <div>
                  <label className="label">ESI % *</label>
                  <input type="number" step="0.01" value={form.esi_percentage} onChange={(e) => setForm({ ...form, esi_percentage: Number(e.target.value) })} className="input-field" required />
                </div>
                <div>
                  <label className="label">Professional Tax (₹) *</label>
                  <input type="number" step="0.01" value={form.professional_tax} onChange={(e) => setForm({ ...form, professional_tax: Number(e.target.value) })} className="input-field" required />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
                <button type="submit" disabled={saving} className="btn-primary">
                  {saving ? 'Saving...' : editingId ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
