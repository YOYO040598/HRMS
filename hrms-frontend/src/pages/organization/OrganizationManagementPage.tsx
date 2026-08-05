import { useEffect, useState } from 'react';
import api from '../../api/axios';
import type { Department, Designation, Location, Team, Employee } from '../../types';
import { Building2, MapPin, Users, Briefcase, Plus, Pencil, Trash2, X, Loader2 } from 'lucide-react';

type Tab = 'departments' | 'designations' | 'locations' | 'teams';

export default function OrganizationManagementPage() {
  const [activeTab, setActiveTab] = useState<Tab>('departments');
  const [loading, setLoading] = useState(true);

  const [departments, setDepartments] = useState<Department[]>([]);
  const [designations, setDesignations] = useState<Designation[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const [deptForm, setDeptForm] = useState({ name: '', code: '', description: '', parent: '', head: '' });
  const [desigForm, setDesigForm] = useState({ name: '', department: '', level: 1, min_salary: '', max_salary: '', description: '' });
  const [locForm, setLocForm] = useState({ name: '', address_line_1: '', city: '', state: '', country: '', postal_code: '', phone: '', is_default: false });
  const [teamForm, setTeamForm] = useState({ name: '', department: '', lead: '', description: '' });

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    try {
      const [deptRes, desigRes, locRes, teamRes, empRes] = await Promise.all([
        api.get('/organization/departments/'),
        api.get('/organization/designations/'),
        api.get('/organization/locations/'),
        api.get('/organization/teams/'),
        api.get('/employees/'),
      ]);
      setDepartments(deptRes.data.data);
      setDesignations(desigRes.data.data);
      setLocations(locRes.data.data);
      setTeams(teamRes.data.data);
      setEmployees(empRes.data.data);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const openAddModal = () => {
    setEditingId(null);
    setFormError('');
    resetForms();
    setShowModal(true);
  };

  const openEditModal = (tab: Tab, item: any) => {
    setEditingId(item.id);
    setFormError('');
    if (tab === 'departments') {
      setDeptForm({ name: item.name || '', code: item.code || '', description: item.description || '', parent: item.parent || '', head: item.head || '' });
    } else if (tab === 'designations') {
      setDesigForm({ name: item.name || '', department: item.department || '', level: item.level || 1, min_salary: item.min_salary || '', max_salary: item.max_salary || '', description: item.description || '' });
    } else if (tab === 'locations') {
      setLocForm({ name: item.name || '', address_line_1: item.address_line_1 || '', city: item.city || '', state: item.state || '', country: item.country || '', postal_code: item.postal_code || '', phone: item.phone || '', is_default: item.is_default || false });
    } else if (tab === 'teams') {
      setTeamForm({ name: item.name || '', department: item.department || '', lead: item.lead || '', description: item.description || '' });
    }
    setShowModal(true);
  };

  const resetForms = () => {
    setDeptForm({ name: '', code: '', description: '', parent: '', head: '' });
    setDesigForm({ name: '', department: '', level: 1, min_salary: '', max_salary: '', description: '' });
    setLocForm({ name: '', address_line_1: '', city: '', state: '', country: '', postal_code: '', phone: '', is_default: false });
    setTeamForm({ name: '', department: '', lead: '', description: '' });
  };

  const handleDelete = async (tab: Tab, id: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return;
    const endpoints: Record<Tab, string> = {
      departments: '/organization/departments/',
      designations: '/organization/designations/',
      locations: '/organization/locations/',
      teams: '/organization/teams/',
    };
    try {
      await api.delete(`${endpoints[tab]}${id}/`);
      fetchAll();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError('');
    const endpoints: Record<Tab, string> = {
      departments: '/organization/departments/',
      designations: '/organization/designations/',
      locations: '/organization/locations/',
      teams: '/organization/teams/',
    };
    const bodyMap: Record<Tab, any> = {
      departments: deptForm,
      designations: { ...desigForm, min_salary: Number(desigForm.min_salary) || 0, max_salary: Number(desigForm.max_salary) || 0 },
      locations: locForm,
      teams: teamForm,
    };
    try {
      const url = editingId ? `${endpoints[activeTab]}${editingId}/` : endpoints[activeTab];
      if (editingId) {
        await api.put(url, bodyMap[activeTab]);
      } else {
        await api.post(url, bodyMap[activeTab]);
      }
      setShowModal(false);
      fetchAll();
    } catch (err: any) {
      setFormError(err.response?.data?.message || err.response?.data?.errors?.[0] || 'Failed to save');
    } finally { setSubmitting(false); }
  };

  const tabs = [
    { key: 'departments' as Tab, label: 'Departments', icon: Users },
    { key: 'designations' as Tab, label: 'Designations', icon: Briefcase },
    { key: 'locations' as Tab, label: 'Locations', icon: MapPin },
    { key: 'teams' as Tab, label: 'Teams', icon: Building2 },
  ];

  const getModalTitle = () => {
    const prefix = editingId ? 'Edit' : 'Add';
    const labels: Record<Tab, string> = { departments: 'Department', designations: 'Designation', locations: 'Location', teams: 'Team' };
    return `${prefix} ${labels[activeTab]}`;
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Organization Management</h2>
        <p className="text-gray-500">Manage departments, designations, locations, and teams</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {tabs.map((t) => (
          <button key={t.key} onClick={() => setActiveTab(t.key)} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === t.key ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            <t.icon size={16} /> {t.label}
          </button>
        ))}
      </div>

      {/* Add Button */}
      <div className="flex justify-end">
        <button onClick={openAddModal} className="btn-primary flex items-center gap-2"><Plus size={18} /> Add {tabs.find(t => t.key === activeTab)?.label?.slice(0, -1)}</button>
      </div>

      {/* Departments Table */}
      {activeTab === 'departments' && (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="table-header">
                  <th className="px-6 py-3">Name</th>
                  <th className="px-6 py-3">Code</th>
                  <th className="px-6 py-3">Head</th>
                  <th className="px-6 py-3">Parent</th>
                  <th className="px-6 py-3">Employee Count</th>
                  <th className="px-6 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {departments.length === 0 ? (
                  <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-400">No departments</td></tr>
                ) : departments.map((d) => (
                  <tr key={d.id} className="hover:bg-gray-50">
                    <td className="table-cell font-medium">{d.name}</td>
                    <td className="table-cell font-mono text-xs">{d.code}</td>
                    <td className="table-cell">{d.head_name || '-'}</td>
                    <td className="table-cell">{d.parent_name || '-'}</td>
                    <td className="table-cell">{d.employee_count}</td>
                    <td className="table-cell">
                      <div className="flex items-center gap-1">
                        <button onClick={() => openEditModal('departments', d)} className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"><Pencil size={16} /></button>
                        <button onClick={() => handleDelete('departments', d.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Designations Table */}
      {activeTab === 'designations' && (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="table-header">
                  <th className="px-6 py-3">Name</th>
                  <th className="px-6 py-3">Department</th>
                  <th className="px-6 py-3">Level</th>
                  <th className="px-6 py-3">Min Salary</th>
                  <th className="px-6 py-3">Max Salary</th>
                  <th className="px-6 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {designations.length === 0 ? (
                  <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-400">No designations</td></tr>
                ) : designations.map((d) => (
                  <tr key={d.id} className="hover:bg-gray-50">
                    <td className="table-cell font-medium">{d.name}</td>
                    <td className="table-cell">{d.department_name || '-'}</td>
                    <td className="table-cell">{d.level}</td>
                    <td className="table-cell">{d.min_salary ? `₹${Number(d.min_salary).toLocaleString()}` : '-'}</td>
                    <td className="table-cell">{d.max_salary ? `₹${Number(d.max_salary).toLocaleString()}` : '-'}</td>
                    <td className="table-cell">
                      <div className="flex items-center gap-1">
                        <button onClick={() => openEditModal('designations', d)} className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"><Pencil size={16} /></button>
                        <button onClick={() => handleDelete('designations', d.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Locations Table */}
      {activeTab === 'locations' && (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="table-header">
                  <th className="px-6 py-3">Name</th>
                  <th className="px-6 py-3">City</th>
                  <th className="px-6 py-3">State</th>
                  <th className="px-6 py-3">Country</th>
                  <th className="px-6 py-3">Default</th>
                  <th className="px-6 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {locations.length === 0 ? (
                  <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-400">No locations</td></tr>
                ) : locations.map((l) => (
                  <tr key={l.id} className="hover:bg-gray-50">
                    <td className="table-cell font-medium">{l.name}</td>
                    <td className="table-cell">{l.city}</td>
                    <td className="table-cell">{l.state}</td>
                    <td className="table-cell">{l.country}</td>
                    <td className="table-cell">{l.is_default ? <span className="badge badge-success">Default</span> : '-'}</td>
                    <td className="table-cell">
                      <div className="flex items-center gap-1">
                        <button onClick={() => openEditModal('locations', l)} className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"><Pencil size={16} /></button>
                        <button onClick={() => handleDelete('locations', l.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Teams Table */}
      {activeTab === 'teams' && (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="table-header">
                  <th className="px-6 py-3">Name</th>
                  <th className="px-6 py-3">Department</th>
                  <th className="px-6 py-3">Lead</th>
                  <th className="px-6 py-3">Member Count</th>
                  <th className="px-6 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {teams.length === 0 ? (
                  <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-400">No teams</td></tr>
                ) : teams.map((t) => (
                  <tr key={t.id} className="hover:bg-gray-50">
                    <td className="table-cell font-medium">{t.name}</td>
                    <td className="table-cell">{t.department_name || '-'}</td>
                    <td className="table-cell">{t.lead_name || '-'}</td>
                    <td className="table-cell">{t.member_count}</td>
                    <td className="table-cell">
                      <div className="flex items-center gap-1">
                        <button onClick={() => openEditModal('teams', t)} className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"><Pencil size={16} /></button>
                        <button onClick={() => handleDelete('teams', t.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl">
              <h3 className="text-xl font-bold text-gray-800">{getModalTitle()}</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {formError && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{formError}</div>}

              {/* Department Fields */}
              {activeTab === 'departments' && (
                <>
                  <div>
                    <label className="label">Name *</label>
                    <input type="text" value={deptForm.name} onChange={(e) => setDeptForm({ ...deptForm, name: e.target.value })} className="input-field" required />
                  </div>
                  <div>
                    <label className="label">Code *</label>
                    <input type="text" value={deptForm.code} onChange={(e) => setDeptForm({ ...deptForm, code: e.target.value })} className="input-field" required />
                  </div>
                  <div>
                    <label className="label">Description</label>
                    <textarea value={deptForm.description} onChange={(e) => setDeptForm({ ...deptForm, description: e.target.value })} className="input-field" rows={3} />
                  </div>
                  <div>
                    <label className="label">Parent Department</label>
                    <select value={deptForm.parent} onChange={(e) => setDeptForm({ ...deptForm, parent: e.target.value })} className="input-field">
                      <option value="">None (Top Level)</option>
                      {departments.filter(d => d.id !== editingId).map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="label">Head</label>
                    <select value={deptForm.head} onChange={(e) => setDeptForm({ ...deptForm, head: e.target.value })} className="input-field">
                      <option value="">Select head</option>
                      {employees.map((emp) => <option key={emp.id} value={emp.id}>{emp.user_full_name} ({emp.employee_id})</option>)}
                    </select>
                  </div>
                </>
              )}

              {/* Designation Fields */}
              {activeTab === 'designations' && (
                <>
                  <div>
                    <label className="label">Name *</label>
                    <input type="text" value={desigForm.name} onChange={(e) => setDesigForm({ ...desigForm, name: e.target.value })} className="input-field" required />
                  </div>
                  <div>
                    <label className="label">Department *</label>
                    <select value={desigForm.department} onChange={(e) => setDesigForm({ ...desigForm, department: e.target.value })} className="input-field" required>
                      <option value="">Select department</option>
                      {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="label">Level *</label>
                    <input type="number" min="1" value={desigForm.level} onChange={(e) => setDesigForm({ ...desigForm, level: Number(e.target.value) })} className="input-field" required />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="label">Min Salary</label>
                      <input type="number" min="0" value={desigForm.min_salary} onChange={(e) => setDesigForm({ ...desigForm, min_salary: e.target.value })} className="input-field" />
                    </div>
                    <div>
                      <label className="label">Max Salary</label>
                      <input type="number" min="0" value={desigForm.max_salary} onChange={(e) => setDesigForm({ ...desigForm, max_salary: e.target.value })} className="input-field" />
                    </div>
                  </div>
                  <div>
                    <label className="label">Description</label>
                    <textarea value={desigForm.description} onChange={(e) => setDesigForm({ ...desigForm, description: e.target.value })} className="input-field" rows={3} />
                  </div>
                </>
              )}

              {/* Location Fields */}
              {activeTab === 'locations' && (
                <>
                  <div>
                    <label className="label">Name *</label>
                    <input type="text" value={locForm.name} onChange={(e) => setLocForm({ ...locForm, name: e.target.value })} className="input-field" required />
                  </div>
                  <div>
                    <label className="label">Address Line 1</label>
                    <input type="text" value={locForm.address_line_1} onChange={(e) => setLocForm({ ...locForm, address_line_1: e.target.value })} className="input-field" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="label">City *</label>
                      <input type="text" value={locForm.city} onChange={(e) => setLocForm({ ...locForm, city: e.target.value })} className="input-field" required />
                    </div>
                    <div>
                      <label className="label">State *</label>
                      <input type="text" value={locForm.state} onChange={(e) => setLocForm({ ...locForm, state: e.target.value })} className="input-field" required />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="label">Country *</label>
                      <input type="text" value={locForm.country} onChange={(e) => setLocForm({ ...locForm, country: e.target.value })} className="input-field" required />
                    </div>
                    <div>
                      <label className="label">Postal Code</label>
                      <input type="text" value={locForm.postal_code} onChange={(e) => setLocForm({ ...locForm, postal_code: e.target.value })} className="input-field" />
                    </div>
                  </div>
                  <div>
                    <label className="label">Phone</label>
                    <input type="text" value={locForm.phone} onChange={(e) => setLocForm({ ...locForm, phone: e.target.value })} className="input-field" />
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="is_default" checked={locForm.is_default} onChange={(e) => setLocForm({ ...locForm, is_default: e.target.checked })} className="w-4 h-4 text-indigo-600 rounded" />
                    <label htmlFor="is_default" className="text-sm text-gray-600">Set as default location</label>
                  </div>
                </>
              )}

              {/* Team Fields */}
              {activeTab === 'teams' && (
                <>
                  <div>
                    <label className="label">Name *</label>
                    <input type="text" value={teamForm.name} onChange={(e) => setTeamForm({ ...teamForm, name: e.target.value })} className="input-field" required />
                  </div>
                  <div>
                    <label className="label">Department *</label>
                    <select value={teamForm.department} onChange={(e) => setTeamForm({ ...teamForm, department: e.target.value })} className="input-field" required>
                      <option value="">Select department</option>
                      {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="label">Team Lead</label>
                    <select value={teamForm.lead} onChange={(e) => setTeamForm({ ...teamForm, lead: e.target.value })} className="input-field">
                      <option value="">Select lead</option>
                      {employees.map((emp) => <option key={emp.id} value={emp.id}>{emp.user_full_name} ({emp.employee_id})</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="label">Description</label>
                    <textarea value={teamForm.description} onChange={(e) => setTeamForm({ ...teamForm, description: e.target.value })} className="input-field" rows={3} />
                  </div>
                </>
              )}

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
