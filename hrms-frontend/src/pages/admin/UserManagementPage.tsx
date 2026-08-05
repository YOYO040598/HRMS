import { useEffect, useState } from 'react';
import api from '../../api/axios';
import type { User } from '../../types';
import { formatDate, getRoleLabel } from '../../lib/utils';
import { Search, Shield, ShieldOff, ChevronLeft, ChevronRight, Loader2, X } from 'lucide-react';

interface Role {
  id: string;
  name: string;
  description: string;
}

interface UserRoleAssignment {
  id: string;
  user: string;
  role: string;
  role_name: string;
}

export default function UserManagementPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showRoleModal, setShowRoleModal] = useState<{ userId: string; userName: string; currentRoles: UserRoleAssignment[] } | null>(null);
  const [availableRoles, setAvailableRoles] = useState<Role[]>([]);

  useEffect(() => {
    fetchUsers();
    fetchRoles();
  }, [page, search, roleFilter]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page) });
      if (search) params.append('search', search);
      if (roleFilter) params.append('role', roleFilter);
      const res = await api.get(`/accounts/users/?${params}`);
      setUsers(res.data.data);
      setTotalPages(res.data.pagination?.total_pages || 1);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      const res = await api.get('/accounts/roles/');
      setRoles(res.data.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAssignRole = async (userId: string, roleId: string) => {
    setActionLoading(`${userId}-${roleId}`);
    try {
      await api.post('/accounts/user-roles/', { user_id: userId, role_id: roleId });
      fetchUsers();
      if (showRoleModal) {
        const res = await api.get(`/accounts/users/${showRoleModal.userId}/`);
        setShowRoleModal({
          ...showRoleModal,
          currentRoles: res.data.data?.roles || [],
        });
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to assign role');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRevokeRole = async (userId: string, roleId: string) => {
    setActionLoading(`${userId}-${roleId}`);
    try {
      await api.delete('/accounts/user-roles/', { data: { user_id: userId, role_id: roleId } });
      fetchUsers();
      if (showRoleModal) {
        const res = await api.get(`/accounts/users/${showRoleModal.userId}/`);
        setShowRoleModal({
          ...showRoleModal,
          currentRoles: res.data.data?.roles || [],
        });
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to revoke role');
    } finally {
      setActionLoading(null);
    }
  };

  const openRoleModal = async (user: User) => {
    try {
      const res = await api.get(`/accounts/users/${user.id}/`);
      const userData = res.data.data;
      const userRoles = userData.roles || [];

      const assigned = userRoles.map((ur: UserRoleAssignment) => ur.role);
      const available = roles.filter((r) => !assigned.includes(r.id));

      setShowRoleModal({
        userId: user.id,
        userName: user.full_name,
        currentRoles: userRoles,
      });
      setAvailableRoles(available);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">User Management</h2>
        <p className="text-gray-500">Manage users, roles, and permissions</p>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="input-field pl-10"
              placeholder="Search by name or email..."
            />
          </div>
          <select
            value={roleFilter}
            onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
            className="input-field w-full sm:w-48"
          >
            <option value="">All Roles</option>
            {roles.map((r) => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="table-header">
                <th className="px-6 py-3">User</th>
                <th className="px-6 py-3">Email</th>
                <th className="px-6 py-3">Role</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Joined</th>
                <th className="px-6 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto" />
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-400">No users found</td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                    <td className="table-cell">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center font-semibold text-sm">
                          {user.first_name?.[0]}{user.last_name?.[0]}
                        </div>
                        <div>
                          <div className="font-medium text-gray-800">{user.full_name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="table-cell text-gray-600">{user.email}</td>
                    <td className="table-cell">
                      <span className="badge badge-info">{getRoleLabel(user.role)}</span>
                    </td>
                    <td className="table-cell">
                      <span className={`badge ${user.is_active ? 'badge-success' : 'badge-danger'}`}>
                        {user.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="table-cell">{formatDate(user.date_joined)}</td>
                    <td className="table-cell">
                      <button
                        onClick={() => openRoleModal(user)}
                        className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                        title="Manage Roles"
                      >
                        <Shield size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-3 border-t border-gray-100">
            <span className="text-sm text-gray-500">Page {page} of {totalPages}</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Role Assignment Modal */}
      {showRoleModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl">
              <h3 className="text-xl font-bold text-gray-800">Manage Roles</h3>
              <button
                onClick={() => setShowRoleModal(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-gray-600">
                Assign or revoke roles for <span className="font-semibold">{showRoleModal.userName}</span>
              </p>

              {/* Current Roles */}
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Current Roles</h4>
                {showRoleModal.currentRoles.length > 0 ? (
                  <div className="space-y-2">
                    {showRoleModal.currentRoles.map((ur) => (
                      <div key={ur.id} className="flex items-center justify-between p-3 bg-indigo-50 rounded-xl">
                        <span className="text-sm font-medium text-indigo-800">{ur.role_name || getRoleLabel(ur.role)}</span>
                        <button
                          onClick={() => handleRevokeRole(showRoleModal.userId, ur.role)}
                          disabled={actionLoading === `${showRoleModal.userId}-${ur.role}`}
                          className="p-1.5 text-red-500 hover:bg-red-100 rounded-lg transition-colors"
                          title="Revoke Role"
                        >
                          {actionLoading === `${showRoleModal.userId}-${ur.role}` ? (
                            <Loader2 size={16} className="animate-spin" />
                          ) : (
                            <ShieldOff size={16} />
                          )}
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400 italic">No roles assigned</p>
                )}
              </div>

              {/* Available Roles */}
              {availableRoles.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Available Roles</h4>
                  <div className="space-y-2">
                    {availableRoles.map((role) => (
                      <div key={role.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                        <div>
                          <span className="text-sm font-medium text-gray-800">{role.name}</span>
                          {role.description && (
                            <p className="text-xs text-gray-500">{role.description}</p>
                          )}
                        </div>
                        <button
                          onClick={() => handleAssignRole(showRoleModal.userId, role.id)}
                          disabled={actionLoading === `${showRoleModal.userId}-${role.id}`}
                          className="p-1.5 text-indigo-600 hover:bg-indigo-100 rounded-lg transition-colors"
                          title="Assign Role"
                        >
                          {actionLoading === `${showRoleModal.userId}-${role.id}` ? (
                            <Loader2 size={16} className="animate-spin" />
                          ) : (
                            <Shield size={16} />
                          )}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-4 border-t border-gray-100">
                <button onClick={() => setShowRoleModal(null)} className="btn-secondary flex-1">
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
