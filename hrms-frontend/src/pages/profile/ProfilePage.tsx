import { useEffect, useState } from 'react';
import api from '../../api/axios';
import { useAppSelector } from '../../hooks/useRedux';
import { formatDate, getRoleLabel } from '../../lib/utils';
import { User, Mail, Phone, Shield, Calendar, Loader2, Save, Lock, CheckCircle } from 'lucide-react';

export default function ProfilePage() {
  const { user } = useAppSelector((state) => state.auth);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [profileData, setProfileData] = useState<any>(null);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [passwordMessage, setPasswordMessage] = useState({ type: '', text: '' });

  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    phone_number: '',
  });

  const [passwordForm, setPasswordForm] = useState({
    old_password: '',
    new_password: '',
    confirm_password: '',
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const res = await api.get('/accounts/profile/');
      const data = res.data.data;
      setProfileData(data);
      setForm({
        first_name: data.first_name || '',
        last_name: data.last_name || '',
        phone_number: data.phone_number || '',
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: '', text: '' });
    try {
      await api.put('/accounts/profile/', form);
      setMessage({ type: 'success', text: 'Profile updated successfully' });
      fetchProfile();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to update profile' });
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordSaving(true);
    setPasswordMessage({ type: '', text: '' });

    if (passwordForm.new_password !== passwordForm.confirm_password) {
      setPasswordMessage({ type: 'error', text: 'New passwords do not match' });
      setPasswordSaving(false);
      return;
    }

    if (passwordForm.new_password.length < 6) {
      setPasswordMessage({ type: 'error', text: 'New password must be at least 6 characters' });
      setPasswordSaving(false);
      return;
    }

    try {
      await api.post('/accounts/change-password/', {
        old_password: passwordForm.old_password,
        new_password: passwordForm.new_password,
      });
      setPasswordMessage({ type: 'success', text: 'Password changed successfully' });
      setPasswordForm({ old_password: '', new_password: '', confirm_password: '' });
    } catch (err: any) {
      setPasswordMessage({ type: 'error', text: err.response?.data?.message || 'Failed to change password' });
    } finally {
      setPasswordSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">My Profile</h2>
        <p className="text-gray-500">View and update your profile information</p>
      </div>

      {/* Profile Card */}
      <div className="card">
        <div className="flex items-center gap-6 mb-6 pb-6 border-b border-gray-100">
          <div className="w-20 h-20 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center font-bold text-2xl">
            {user?.first_name?.[0]}{user?.last_name?.[0]}
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-800">{user?.full_name}</h3>
            <p className="text-gray-500">{user?.email}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="badge badge-info">{getRoleLabel(user?.role || '')}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
            <Mail size={18} className="text-gray-400" />
            <div>
              <div className="text-xs text-gray-500">Email</div>
              <div className="text-sm font-medium text-gray-800">{profileData?.email || user?.email}</div>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
            <Phone size={18} className="text-gray-400" />
            <div>
              <div className="text-xs text-gray-500">Phone</div>
              <div className="text-sm font-medium text-gray-800">{profileData?.phone_number || 'Not set'}</div>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
            <Shield size={18} className="text-gray-400" />
            <div>
              <div className="text-xs text-gray-500">Role</div>
              <div className="text-sm font-medium text-gray-800">{getRoleLabel(user?.role || '')}</div>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
            <Calendar size={18} className="text-gray-400" />
            <div>
              <div className="text-xs text-gray-500">Member Since</div>
              <div className="text-sm font-medium text-gray-800">{formatDate(profileData?.date_joined || '')}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Profile Form */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Edit Profile</h3>
        <form onSubmit={handleUpdateProfile} className="space-y-4">
          {message.text && (
            <div className={`p-3 rounded-lg text-sm ${message.type === 'success' ? 'bg-emerald-50 border border-emerald-200 text-emerald-700' : 'bg-red-50 border border-red-200 text-red-700'}`}>
              {message.text}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">First Name</label>
              <input
                type="text"
                value={form.first_name}
                onChange={(e) => setForm((prev) => ({ ...prev, first_name: e.target.value }))}
                className="input-field"
                required
              />
            </div>
            <div>
              <label className="label">Last Name</label>
              <input
                type="text"
                value={form.last_name}
                onChange={(e) => setForm((prev) => ({ ...prev, last_name: e.target.value }))}
                className="input-field"
                required
              />
            </div>
          </div>

          <div>
            <label className="label">Phone Number</label>
            <input
              type="text"
              value={form.phone_number}
              onChange={(e) => setForm((prev) => ({ ...prev, phone_number: e.target.value }))}
              className="input-field"
              placeholder="+91 XXXXX XXXXX"
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="btn-primary flex items-center gap-2"
            >
              {saving ? (
                <><Loader2 size={16} className="animate-spin" /> Saving...</>
              ) : (
                <><Save size={16} /> Save Changes</>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Change Password Form */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Change Password</h3>
        <form onSubmit={handleChangePassword} className="space-y-4">
          {passwordMessage.text && (
            <div className={`p-3 rounded-lg text-sm ${passwordMessage.type === 'success' ? 'bg-emerald-50 border border-emerald-200 text-emerald-700' : 'bg-red-50 border border-red-200 text-red-700'}`}>
              {passwordMessage.text}
            </div>
          )}

          <div>
            <label className="label">Current Password</label>
            <input
              type="password"
              value={passwordForm.old_password}
              onChange={(e) => setPasswordForm((prev) => ({ ...prev, old_password: e.target.value }))}
              className="input-field"
              required
            />
          </div>

          <div>
            <label className="label">New Password</label>
            <input
              type="password"
              value={passwordForm.new_password}
              onChange={(e) => setPasswordForm((prev) => ({ ...prev, new_password: e.target.value }))}
              className="input-field"
              required
              minLength={6}
            />
          </div>

          <div>
            <label className="label">Confirm New Password</label>
            <input
              type="password"
              value={passwordForm.confirm_password}
              onChange={(e) => setPasswordForm((prev) => ({ ...prev, confirm_password: e.target.value }))}
              className="input-field"
              required
              minLength={6}
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={passwordSaving}
              className="btn-primary flex items-center gap-2"
            >
              {passwordSaving ? (
                <><Loader2 size={16} className="animate-spin" /> Changing...</>
              ) : (
                <><Lock size={16} /> Change Password</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
