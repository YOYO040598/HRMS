import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { Search, Users, Eye, Filter } from 'lucide-react';

interface TeamMember {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  employee_id: string;
  department_name: string;
  designation_name: string;
  date_of_joining: string;
  phone: string;
  is_active: boolean;
}

const DEPARTMENTS = ['ALL'];

export default function ManagerTeam() {
  const navigate = useNavigate();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('ALL');

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    try {
      setLoading(true);
      const res = await api.get('/employees/', { params: { search } });
      setMembers(res.data.results || res.data);
    } catch (error) {
      console.error('Error fetching team members:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchMembers();
  };

  const filteredMembers = members.filter((m) => {
    if (departmentFilter !== 'ALL' && m.department_name !== departmentFilter) return false;
    return true;
  });

  const departments = ['ALL', ...new Set(members.map(m => m.department_name).filter(Boolean))];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">My Team</h1>
        <span className="text-sm text-gray-500">{filteredMembers.length} members</span>
      </div>

      <div className="card p-4">
        <div className="flex items-center gap-4 flex-wrap">
          <form onSubmit={handleSearch} className="flex-1 min-w-[250px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name or employee ID..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>
          </form>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            >
              {departments.map((dept) => (
                <option key={dept} value={dept}>{dept === 'ALL' ? 'All Departments' : dept}</option>
              ))}
            </select>
          </div>
          <button onClick={fetchMembers} className="btn-primary flex items-center gap-2">
            <Search className="w-4 h-4" />
            Search
          </button>
        </div>
      </div>

      <div className="card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="table-header text-left">Employee</th>
                <th className="table-header text-left">Employee ID</th>
                <th className="table-header text-left">Department</th>
                <th className="table-header text-left">Designation</th>
                <th className="table-header text-left">Status</th>
                <th className="table-header text-left">Join Date</th>
                <th className="table-header text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="table-cell text-center py-8 text-gray-500">
                    Loading team members...
                  </td>
                </tr>
              ) : filteredMembers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="table-cell text-center py-8 text-gray-500">
                    <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>No team members found.</p>
                  </td>
                </tr>
              ) : (
                filteredMembers.map((member) => (
                  <tr key={member.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="table-cell">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                          <span className="text-sm font-medium text-emerald-700">
                            {member.first_name?.[0]}{member.last_name?.[0]}
                          </span>
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">
                            {member.first_name} {member.last_name}
                          </div>
                          <div className="text-xs text-gray-500">{member.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="table-cell text-gray-600">{member.employee_id}</td>
                    <td className="table-cell text-gray-600">{member.department_name}</td>
                    <td className="table-cell text-gray-600">{member.designation_name}</td>
                    <td className="table-cell">
                      <span className={`badge ${member.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                        {member.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="table-cell text-gray-600">{member.date_of_joining || '-'}</td>
                    <td className="table-cell">
                      <button
                        onClick={() => navigate(`/employees/${member.id}`)}
                        className="p-1.5 rounded-lg bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
