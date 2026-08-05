import { useEffect, useState } from 'react';
import api from '../../api/axios';
import type { LeaveType } from '../../types';
import { Plus, Pencil, Trash2, X, Loader2, CalendarDays } from 'lucide-react';

export default function LeaveTypeManagementPage() {
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const [form, setForm] = useState({
    name: '',
    days_per_year: 12,
    is_paid: true,
    is_carry_forward: false,
    max_carry_forward_days: 0,
    is_encashable: false,
  });

  useEffect(() => { fetchLeaveTypes(); }, []);

  const fetchLeaveTypes = async () => {
    try {
      const res = await api.get('/leave/types/');
      setLeaveTypes(res.data.data);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const openAddModal = () => {
    setEditingId(null);
    setFormError('');
    setForm({ name: '', days_per_year: 12, is_paid: true, is_carry_forward: false, max_carry_forward_days: 0, is_encashable: false });
    setShowModal(true);
  };

  const openEditModal = (lt: LeaveType) => {
    setEditingId(lt.id);
    setFormError('');
    setForm({
      name: lt.name || '',
      days_per_year: lt.days_per_year || 12,
      is_paid: lt.is_paid ?? true,
      is_carry_forward: lt.is_carry_forward ?? false,
      max_carry_forward_days: lt.max_carry_forward_days || 0,
      is_encashable: lt.is_encashable ?? false,
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this leave type?')) return;
    try {
      await api.delete(`/leave/types/${id}/`);
      fetchLeaveTypes();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError('');
    try {
      const body = {
        ...form,
        days_per_year: Number(form.days_per_year),
        max_carry_forward_days: Number(form.max_carry_forward_days),
      };
      if (editingId) {
        await api.put(`/leave/types/${editingId}/`, body);
      } else {
        await api.post('/leave/types/', body);
      }
      setShowModal(false);
      fetchLeaveTypes();
    } catch (err: any) {
      setFormError(err.response?.data?.message || err.response?.data?.errors?.[0] || 'Failed to save');
    } finally { setSubmitting(false); }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Leave Types</h2>
          <p className="text-gray-500">Configure leave types and policies</p>
        </div>
        <button onClick={openAddModal} className="btn-primary flex items-center gap-2"><Plus size={18} /> Add Leave Type</button>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="table-header">
                <th className="px-6 py-3">Name</th>
                <th className="px-6 py-3">Days/Year</th>
                <th className="px-6 py-3">Paid</th>
                <th className="px-6 py-3">Carry Forward</th>
                <th className="px-6 py-3">Max Carry Forward</th>
                <th className="px-6 py-3">Encashable</th>
                <th className="px-6 py-3">Active</th>
                <th className="px-6 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {leaveTypes.length === 0 ? (
                <tr><td colSpan={8} className="px-6 py-8 text-center text-gray-400">No leave types configured</td></tr>
              ) : leaveTypes.map((lt) => (
                <tr key={lt.id} className="hover:bg-gray-50">
                  <td className="table-cell font-medium">
                    <div className="flex items-center gap-2">
                      <CalendarDays size={16} className="text-indigo-500" />
                      {lt.name}
                    </div>
                  </td>
                  <td className="table-cell">{lt.days_per_year}</td>
                  <td className="table-cell">{lt.is_paid ? <span className="text-green-600 font-medium">Yes</span> : <span className="text-gray-400">No</span>}</td>
                  <td className="table-cell">{lt.is_carry_forward ? <span className="text-green-600 font-medium">Yes</span> : <span className="text-gray-400">No</span>}</td>
                  <td className="table-cell">{lt.is_carry_forward ? lt.max_carry_forward_days : '-'}</td>
                  <td className="table-cell">{lt.is_encashable ? <span className="text-green-600 font-medium">Yes</span> : <span className="text-gray-400">No</span>}</td>
                  <td className="table-cell"><span className={`badge ${lt.is_active ? 'badge-success' : 'badge-danger'}`}>{lt.is_active ? 'Active' : 'Inactive'}</span></td>
                  <td className="table-cell">
                    <div className="flex items-center gap-1">
                      <button onClick={() => openEditModal(lt)} className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"><Pencil size={16} /></button>
                      <button onClick={() => handleDelete(lt.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={16} /></button>
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
          <div className="bg-white rounded-2xl w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-800">{editingId ? 'Edit' : 'Add'} Leave Type</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              {formError && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{formError}</div>}

              <div>
                <label className="label">Name *</label>
                <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input-field" required placeholder="e.g., Casual Leave, Sick Leave" />
              </div>

              <div>
                <label className="label">Days Per Year *</label>
                <input type="number" min="1" max="365" value={form.days_per_year} onChange={(e) => setForm({ ...form, days_per_year: Number(e.target.value) })} className="input-field" required />
              </div>

              <div className="flex items-center gap-2">
                <input type="checkbox" id="is_paid" checked={form.is_paid} onChange={(e) => setForm({ ...form, is_paid: e.target.checked })} className="w-4 h-4 text-indigo-600 rounded" />
                <label htmlFor="is_paid" className="text-sm text-gray-600">Paid leave</label>
              </div>

              <div className="flex items-center gap-2">
                <input type="checkbox" id="is_carry_forward" checked={form.is_carry_forward} onChange={(e) => setForm({ ...form, is_carry_forward: e.target.checked })} className="w-4 h-4 text-indigo-600 rounded" />
                <label htmlFor="is_carry_forward" className="text-sm text-gray-600">Allow carry forward</label>
              </div>

              {form.is_carry_forward && (
                <div>
                  <label className="label">Max Carry Forward Days</label>
                  <input type="number" min="0" max={form.days_per_year} value={form.max_carry_forward_days} onChange={(e) => setForm({ ...form, max_carry_forward_days: Number(e.target.value) })} className="input-field" />
                </div>
              )}

              <div className="flex items-center gap-2">
                <input type="checkbox" id="is_encashable" checked={form.is_encashable} onChange={(e) => setForm({ ...form, is_encashable: e.target.checked })} className="w-4 h-4 text-indigo-600 rounded" />
                <label htmlFor="is_encashable" className="text-sm text-gray-600">Encashable</label>
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-100">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" disabled={submitting} className="btn-primary flex-1 flex items-center justify-center gap-2">
                  {submitting ? <><Loader2 size={16} className="animate-spin" /> Saving...</> : editingId ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
