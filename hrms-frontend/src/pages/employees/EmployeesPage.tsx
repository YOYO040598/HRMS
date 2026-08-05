import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import type { Employee, Company, Department, Designation, Team, Location } from '../../types';
import { formatDate, getStatusColor } from '../../lib/utils';
import { Search, Plus, ChevronLeft, ChevronRight, Eye, X, Loader2 } from 'lucide-react';

export default function EmployeesPage() {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showAddForm, setShowAddForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const [companies, setCompanies] = useState<Company[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [designations, setDesignations] = useState<Designation[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);

  const [form, setForm] = useState({
    first_name: '', last_name: '', email: '', password: '',
    employee_id: '', company: '', department: '', designation: '',
    team: '', manager: '', employment_type: 'FULL_TIME',
    status: 'ACTIVE', date_of_joining: '', work_email: '', phone_number: '',
    location: '',
  });

  useEffect(() => { fetchEmployees(); }, [page, search, statusFilter]);
  useEffect(() => { if (showAddForm) fetchFormData(); }, [showAddForm]);

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page) });
      if (search) params.append('search', search);
      if (statusFilter) params.append('status', statusFilter);
      const res = await api.get(`/employees/?${params}`);
      setEmployees(res.data.data);
      setTotalPages(res.data.pagination?.total_pages || 1);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const fetchFormData = async () => {
    try {
      const [compRes, deptRes, desigRes, teamRes, locRes] = await Promise.all([
        api.get('/organization/companies/'),
        api.get('/organization/departments/'),
        api.get('/organization/designations/'),
        api.get('/organization/teams/'),
        api.get('/organization/locations/'),
      ]);
      setCompanies(compRes.data.data);
      setDepartments(deptRes.data.data);
      setDesignations(desigRes.data.data);
      setTeams(teamRes.data.data);
      setLocations(locRes.data.data);
      if (companies.length === 0 && compRes.data.data.length > 0) {
        setForm((prev) => ({ ...prev, company: compRes.data.data[0].id }));
      }
    } catch (err) { console.error(err); }
  };

  const handleGenerateId = async () => {
    try {
      const res = await api.get('/employees/generate-id/');
      updateForm('employee_id', res.data.data);
    } catch (err) { console.error(err); }
  };

  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError('');
    try {
      await api.post('/employees/', form);
      setShowAddForm(false);
      setForm({
        first_name: '', last_name: '', email: '', password: '',
        employee_id: '', company: form.company, department: '', designation: '',
        team: '', manager: '', employment_type: 'FULL_TIME',
        status: 'ACTIVE', date_of_joining: '', work_email: '', phone_number: '',
        location: '',
      });
      fetchEmployees();
    } catch (err: any) {
      setFormError(err.response?.data?.message || err.response?.data?.errors?.[0] || 'Failed to create employee');
    } finally { setSubmitting(false); }
  };

  const updateForm = (field: string, value: string) => setForm((prev) => ({ ...prev, [field]: value }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Employees</h2>
          <p className="text-gray-500">Manage your organization's employees</p>
        </div>
        <button onClick={() => setShowAddForm(true)} className="btn-primary flex items-center gap-2">
          <Plus size={18} /> Add Employee
        </button>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="input-field pl-10" placeholder="Search by name, email, or ID..." />
          </div>
          <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className="input-field w-full sm:w-48">
            <option value="">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
            <option value="ON_NOTICE">On Notice</option>
            <option value="EXITED">Exited</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="table-header">
                <th className="px-6 py-3">Employee</th>
                <th className="px-6 py-3">ID</th>
                <th className="px-6 py-3">Department</th>
                <th className="px-6 py-3">Designation</th>
                <th className="px-6 py-3">Type</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Joined</th>
                <th className="px-6 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={8} className="px-6 py-12 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto" />
                </td></tr>
              ) : employees.length === 0 ? (
                <tr><td colSpan={8} className="px-6 py-12 text-center text-gray-400">No employees found</td></tr>
              ) : employees.map((emp) => (
                <tr key={emp.id} className="hover:bg-gray-50 transition-colors">
                  <td className="table-cell">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center font-semibold text-sm">
                        {emp.user_full_name?.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </div>
                      <div>
                        <div className="font-medium text-gray-800">{emp.user_full_name}</div>
                      </div>
                    </div>
                  </td>
                  <td className="table-cell font-mono text-xs">{emp.employee_id}</td>
                  <td className="table-cell">{emp.department_name || '-'}</td>
                  <td className="table-cell">{emp.designation_name || '-'}</td>
                  <td className="table-cell">{emp.employment_type?.replace('_', ' ')}</td>
                  <td className="table-cell"><span className={`badge ${getStatusColor(emp.status)}`}>{emp.status}</span></td>
                  <td className="table-cell">{formatDate(emp.date_of_joining)}</td>
                  <td className="table-cell">
                    <button onClick={() => navigate(`/employees/${emp.id}`)} className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                      <Eye size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-3 border-t border-gray-100">
            <span className="text-sm text-gray-500">Page {page} of {totalPages}</span>
            <div className="flex items-center gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50">
                <ChevronLeft size={16} />
              </button>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50">
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add Employee Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl">
              <h3 className="text-xl font-bold text-gray-800">Add New Employee</h3>
              <button onClick={() => setShowAddForm(false)} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
            </div>
            <form onSubmit={handleAddEmployee} className="p-6 space-y-4">
              {formError && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{formError}</div>}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">First Name *</label>
                  <input type="text" value={form.first_name} onChange={(e) => updateForm('first_name', e.target.value)} className="input-field" required />
                </div>
                <div>
                  <label className="label">Last Name *</label>
                  <input type="text" value={form.last_name} onChange={(e) => updateForm('last_name', e.target.value)} className="input-field" required />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Email *</label>
                  <input type="email" value={form.email} onChange={(e) => updateForm('email', e.target.value)} className="input-field" required />
                </div>
                <div>
                  <label className="label">Password *</label>
                  <input type="password" value={form.password} onChange={(e) => updateForm('password', e.target.value)} className="input-field" required minLength={6} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Employee ID *</label>
                  <div className="flex gap-2">
                    <input type="text" value={form.employee_id} onChange={(e) => updateForm('employee_id', e.target.value)} className="input-field flex-1" required />
                    <button type="button" onClick={handleGenerateId} className="btn-secondary whitespace-nowrap text-sm">Generate ID</button>
                  </div>
                </div>
                <div>
                  <label className="label">Phone</label>
                  <input type="text" value={form.phone_number} onChange={(e) => updateForm('phone_number', e.target.value)} className="input-field" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Company *</label>
                  <select value={form.company} onChange={(e) => updateForm('company', e.target.value)} className="input-field" required>
                    <option value="">Select company</option>
                    {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Department</label>
                  <select value={form.department} onChange={(e) => updateForm('department', e.target.value)} className="input-field">
                    <option value="">Select department</option>
                    {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Team</label>
                  <select value={form.team} onChange={(e) => updateForm('team', e.target.value)} className="input-field">
                    <option value="">Select team</option>
                    {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Designation</label>
                  <select value={form.designation} onChange={(e) => updateForm('designation', e.target.value)} className="input-field">
                    <option value="">Select designation</option>
                    {designations.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Location</label>
                  <select value={form.location} onChange={(e) => updateForm('location', e.target.value)} className="input-field">
                    <option value="">Select location</option>
                    {locations.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Employment Type</label>
                  <select value={form.employment_type} onChange={(e) => updateForm('employment_type', e.target.value)} className="input-field">
                    <option value="FULL_TIME">Full Time</option>
                    <option value="PART_TIME">Part Time</option>
                    <option value="CONTRACT">Contract</option>
                    <option value="INTERN">Intern</option>
                    <option value="PROBATION">Probation</option>
                  </select>
                </div>
                <div>
                  <label className="label">Date of Joining *</label>
                  <input type="date" value={form.date_of_joining} onChange={(e) => updateForm('date_of_joining', e.target.value)} className="input-field" required />
                </div>
              </div>

              <div>
                <label className="label">Work Email</label>
                <input type="email" value={form.work_email} onChange={(e) => updateForm('work_email', e.target.value)} className="input-field" />
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-100">
                <button type="button" onClick={() => setShowAddForm(false)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" disabled={submitting} className="btn-primary flex-1 flex items-center justify-center gap-2">
                  {submitting ? <><Loader2 size={16} className="animate-spin" /> Creating...</> : 'Create Employee'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
