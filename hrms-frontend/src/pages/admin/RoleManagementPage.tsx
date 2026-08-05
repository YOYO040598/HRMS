import { useEffect, useState } from 'react';
import api from '../../api/axios';
import { Search, Plus, Pencil, Trash2, X, Loader2, Shield } from 'lucide-react';

interface Role {
  id: string;
  name: string;
  slug: string;
  description: string;
  user_count: number;
  is_active: boolean;
  created_at: string;
}

export default function RoleManagementPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const [form, setForm] = useState({
    name: '',
    description: '',
  });

  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    setLoading(true);
    try {
      const res = await api.get('/accounts/roles/');
      setRoles(res.data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredRoles = roles.filter(
    (r) =>
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.description?.toLowerCase().includes(search.toLowerCase())
  );

  const openCreateModal = () => {
    setEditingRole(null);
    setForm({ name: '', description: '' });
    setFormError('');
    setShowModal(true);
  };

  const openEditModal = (role: Role) => {
    setEditingRole(role);
    setForm({ name: role.name, description: role.description || '' });
    setFormError('');
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError('');
    try {
      if (editingRole) {
        await api.put(`/accounts/roles/${editingRole.id}/`, form);
      } else {
        await api.post('/accounts/roles/', form);
      }
      setShowModal(false);
      fetchRoles();
    } catch (err: any) {
      setFormError(err.response?.data?.message || err.response?.data?.errors?.[0] || 'Failed to save role');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (role: Role) => {
    if (!confirm(`Are you sure you want to delete the role "${role.name}"?`)) return;
    try {
      await api.delete(`/accounts/roles/${role.id}/`);
      fetchRoles();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete role');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Role Management</h2>
          <p className="text-gray-500">Create and manage system roles</p>
        </div>
        <button onClick={openCreateModal} className="btn-primary flex items-center gap-2">
          <Plus size={18} /> Create Role
        </button>
      </div>

      {/* Search */}
      <div className="card">
        <div className="relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-10"
            placeholder="Search roles..."
          />
        </div>
      </div>

      {/* Roles Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="table-header">
                <th className="px-6 py-3">Role</th>
                <th className="px-6 py-3">Description</th>
                <th className="px-6 py-3">Users</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto" />
                  </td>
                </tr>
              ) : filteredRoles.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-400">No roles found</td>
                </tr>
              ) : (
                filteredRoles.map((role) => (
                  <tr key={role.id} className="hover:bg-gray-50 transition-colors">
                    <td className="table-cell">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-indigo-100 text-indigo-700 rounded-lg flex items-center justify-center">
                          <Shield size={18} />
                        </div>
                        <span className="font-medium text-gray-800">{role.name}</span>
                      </div>
                    </td>
                    <td className="table-cell text-gray-600">{role.description || '-'}</td>
                    <td className="table-cell">
                      <span className="badge badge-info">{role.user_count || 0} users</span>
                    </td>
                    <td className="table-cell">
                      <span className={`badge ${role.is_active ? 'badge-success' : 'badge-danger'}`}>
                        {role.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="table-cell">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => openEditModal(role)}
                          className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(role)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl">
              <h3 className="text-xl font-bold text-gray-800">
                {editingRole ? 'Edit Role' : 'Create New Role'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{formError}</div>
              )}

              <div>
                <label className="label">Role Name *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                  className="input-field"
                  placeholder="e.g., HR Manager"
                  required
                />
              </div>

              <div>
                <label className="label">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                  className="input-field"
                  rows={3}
                  placeholder="Role description..."
                />
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-100">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary flex-1 flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <><Loader2 size={16} className="animate-spin" /> Saving...</>
                  ) : (
                    editingRole ? 'Update Role' : 'Create Role'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
