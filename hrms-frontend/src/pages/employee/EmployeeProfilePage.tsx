import { useEffect, useState } from 'react';
import api from '../../api/axios';
import { useAppSelector } from '../../hooks/useRedux';
import { User, Mail, Phone, Calendar, Loader2, Save, MapPin, ShieldAlert, HeartHandshake, Sparkles, Heart } from 'lucide-react';

export default function EmployeeProfilePage() {
  const { user } = useAppSelector((state) => state.auth);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    phone_number: '',
    email: '',
    personal_email: '',
    date_of_birth: '',
    gender: '',
    marital_status: '',
    blood_group: '',
    address_line_1: '',
    address_line_2: '',
    city: '',
    state: '',
    country: '',
    postal_code: '',
    emergency_contact_name: '',
    emergency_contact_relationship: '',
    emergency_contact_phone: '',
  });
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const res = await api.get('/employees/my-profile/');
      const data = res.data.data;
      setForm({
        first_name: data.first_name || '',
        last_name: data.last_name || '',
        phone_number: data.phone_number || '',
        email: data.email || '',
        personal_email: data.personal_email || '',
        date_of_birth: data.date_of_birth || '',
        gender: data.gender || '',
        marital_status: data.marital_status || '',
        blood_group: data.blood_group || '',
        address_line_1: data.address_line_1 || '',
        address_line_2: data.address_line_2 || '',
        city: data.city || '',
        state: data.state || '',
        country: data.country || '',
        postal_code: data.postal_code || '',
        emergency_contact_name: data.emergency_contact_name || '',
        emergency_contact_relationship: data.emergency_contact_relationship || '',
        emergency_contact_phone: data.emergency_contact_phone || '',
      });
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'Failed to load profile details' });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: '', text: '' });
    try {
      await api.put('/employees/my-profile/', form);
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
      window.dispatchEvent(new Event('profile-updated'));
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to update profile' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#059669]" />
      </div>
    );
  }

  return (
    <form onSubmit={handleUpdate} className="space-y-6 pb-12">
      {/* Bento Grid Header */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Profile Card Banner */}
        <div className="lg:col-span-2 bg-gradient-to-br from-[#059669] to-[#10b981] rounded-3xl p-6 text-white shadow-lg relative overflow-hidden flex flex-col justify-between min-h-[220px]">
          <div className="absolute right-0 bottom-0 translate-x-12 translate-y-12 opacity-10">
            <User size={260} />
          </div>
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 z-10">
            <div className="w-20 h-20 bg-white/20 backdrop-blur-md border border-white/30 rounded-2xl flex items-center justify-center font-extrabold text-3xl shadow-inner text-white">
              {form.first_name?.[0]}{form.last_name?.[0]}
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">{form.first_name} {form.last_name}</h2>
              <p className="text-white/80 font-medium mt-1 text-sm flex items-center gap-1.5">
                <Mail size={14} /> {form.email}
              </p>
              <div className="flex flex-wrap gap-2 mt-3">
                <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-bold border border-white/10 uppercase tracking-wider">
                  {user?.role?.replace('_', ' ')}
                </span>
                <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-bold border border-white/10 tracking-wider">
                  Active Employee
                </span>
              </div>
            </div>
          </div>
          
          <div className="mt-6 sm:mt-0 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 z-10 pt-4 border-t border-white/10">
            <div>
              <div className="text-[10px] uppercase font-bold tracking-wider text-white/60">Work Contact</div>
              <div className="text-sm font-semibold flex items-center gap-1 mt-0.5"><Phone size={12} /> {form.phone_number || 'Not Set'}</div>
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2.5 bg-white text-[#059669] hover:bg-emerald-50 font-bold text-sm rounded-xl flex items-center gap-2 shadow-md transition-all active:scale-95 cursor-pointer disabled:opacity-50 border-none"
              >
                {saving ? (
                  <><Loader2 size={16} className="animate-spin" /> Saving...</>
                ) : (
                  <><Save size={16} /> Save Profile</>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Quick Insights Bento Card */}
        <div className="bg-white/70 backdrop-blur-md border border-white/50 rounded-3xl p-6 flex flex-col justify-between shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <span className="w-10 h-10 rounded-xl bg-emerald-100/50 border border-emerald-200/20 flex items-center justify-center text-[#059669]">
              <Sparkles size={20} />
            </span>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Dashboard summary</span>
          </div>
          <div>
            <h3 className="text-lg font-extrabold text-gray-800">Complete Profile</h3>
            <p className="text-xs text-gray-500 font-medium mt-1">Keep your credentials up to date. HR and Administration will use these verified fields for official communications, medical needs, and emergencies.</p>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100/80 flex items-center justify-between">
            <span className="text-xs font-bold text-gray-400">Emergency Contacts Configured</span>
            <span className={`w-2.5 h-2.5 rounded-full ${form.emergency_contact_phone ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
          </div>
        </div>
      </div>

      {/* Save Status Messages */}
      {message.text && (
        <div className={`p-4 rounded-2xl text-sm font-bold shadow-sm transition-all border ${
          message.type === 'success' 
            ? 'bg-emerald-50/80 border-emerald-200/50 text-emerald-700 backdrop-blur-md' 
            : 'bg-red-50/80 border-red-200/50 text-red-700 backdrop-blur-md'
        }`}>
          {message.text}
        </div>
      )}

      {/* Main Bento Blocks */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Bento: Personal Information */}
        <div className="bg-white/70 backdrop-blur-md border border-white/50 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-3 border-b border-gray-100/80 pb-3">
            <span className="w-8 h-8 rounded-lg bg-emerald-100/50 flex items-center justify-center text-[#059669]">
              <User size={16} />
            </span>
            <h3 className="font-extrabold text-gray-800">Personal Information</h3>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">First Name</label>
              <input
                type="text"
                required
                value={form.first_name}
                onChange={(e) => setForm((prev) => ({ ...prev, first_name: e.target.value }))}
                className="input-field"
              />
            </div>
            <div>
              <label className="label">Last Name</label>
              <input
                type="text"
                required
                value={form.last_name}
                onChange={(e) => setForm((prev) => ({ ...prev, last_name: e.target.value }))}
                className="input-field"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Personal Email</label>
              <input
                type="email"
                placeholder="personal@email.com"
                value={form.personal_email}
                onChange={(e) => setForm((prev) => ({ ...prev, personal_email: e.target.value }))}
                className="input-field"
              />
            </div>
            <div>
              <label className="label">Mobile Number</label>
              <input
                type="text"
                placeholder="+91 XXXXX XXXXX"
                value={form.phone_number}
                onChange={(e) => setForm((prev) => ({ ...prev, phone_number: e.target.value }))}
                className="input-field"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Date of Birth</label>
              <div className="relative">
                <input
                  type="date"
                  value={form.date_of_birth}
                  onChange={(e) => setForm((prev) => ({ ...prev, date_of_birth: e.target.value }))}
                  className="input-field"
                />
              </div>
            </div>
            <div>
              <label className="label">Gender</label>
              <select
                value={form.gender}
                onChange={(e) => setForm((prev) => ({ ...prev, gender: e.target.value }))}
                className="input-field"
              >
                <option value="">Select Gender</option>
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Marital Status</label>
              <select
                value={form.marital_status}
                onChange={(e) => setForm((prev) => ({ ...prev, marital_status: e.target.value }))}
                className="input-field"
              >
                <option value="">Select Status</option>
                <option value="SINGLE">Single</option>
                <option value="MARRIED">Married</option>
                <option value="DIVORCED">Divorced</option>
                <option value="WIDOWED">Widowed</option>
              </select>
            </div>
            <div>
              <label className="label">Blood Group</label>
              <select
                value={form.blood_group}
                onChange={(e) => setForm((prev) => ({ ...prev, blood_group: e.target.value }))}
                className="input-field"
              >
                <option value="">Select Blood Group</option>
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
              </select>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Bento: Primary Address */}
          <div className="bg-white/70 backdrop-blur-md border border-white/50 rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-3 border-b border-gray-100/80 pb-3">
              <span className="w-8 h-8 rounded-lg bg-emerald-100/50 flex items-center justify-center text-[#059669]">
                <MapPin size={16} />
              </span>
              <h3 className="font-extrabold text-gray-800">Primary Address</h3>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="label">Address Line 1</label>
                <input
                  type="text"
                  placeholder="Street Address, P.O. Box"
                  value={form.address_line_1}
                  onChange={(e) => setForm((prev) => ({ ...prev, address_line_1: e.target.value }))}
                  className="input-field"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="label">Address Line 2</label>
                <input
                  type="text"
                  placeholder="Apartment, Suite, Unit"
                  value={form.address_line_2}
                  onChange={(e) => setForm((prev) => ({ ...prev, address_line_2: e.target.value }))}
                  className="input-field"
                />
              </div>
              <div>
                <label className="label">City</label>
                <input
                  type="text"
                  placeholder="City"
                  value={form.city}
                  onChange={(e) => setForm((prev) => ({ ...prev, city: e.target.value }))}
                  className="input-field"
                />
              </div>
              <div>
                <label className="label">State / Province</label>
                <input
                  type="text"
                  placeholder="State"
                  value={form.state}
                  onChange={(e) => setForm((prev) => ({ ...prev, state: e.target.value }))}
                  className="input-field"
                />
              </div>
              <div>
                <label className="label">Country</label>
                <input
                  type="text"
                  placeholder="Country"
                  value={form.country}
                  onChange={(e) => setForm((prev) => ({ ...prev, country: e.target.value }))}
                  className="input-field"
                />
              </div>
              <div>
                <label className="label">Postal Code</label>
                <input
                  type="text"
                  placeholder="Zip Code"
                  value={form.postal_code}
                  onChange={(e) => setForm((prev) => ({ ...prev, postal_code: e.target.value }))}
                  className="input-field"
                />
              </div>
            </div>
          </div>

          {/* Bento: Emergency Contact */}
          <div className="bg-white/70 backdrop-blur-md border border-white/50 rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-3 border-b border-gray-100/80 pb-3">
              <span className="w-8 h-8 rounded-lg bg-emerald-100/50 flex items-center justify-center text-[#059669]">
                <HeartHandshake size={16} />
              </span>
              <h3 className="font-extrabold text-gray-800">Emergency Contact</h3>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="label">Contact Name</label>
                <input
                  type="text"
                  placeholder="Full Name"
                  value={form.emergency_contact_name}
                  onChange={(e) => setForm((prev) => ({ ...prev, emergency_contact_name: e.target.value }))}
                  className="input-field"
                />
              </div>
              <div>
                <label className="label">Relationship</label>
                <input
                  type="text"
                  placeholder="e.g. Spouse, Parent, Sibling"
                  value={form.emergency_contact_relationship}
                  onChange={(e) => setForm((prev) => ({ ...prev, emergency_contact_relationship: e.target.value }))}
                  className="input-field"
                />
              </div>
              <div>
                <label className="label">Phone Number</label>
                <input
                  type="text"
                  placeholder="Contact Number"
                  value={form.emergency_contact_phone}
                  onChange={(e) => setForm((prev) => ({ ...prev, emergency_contact_phone: e.target.value }))}
                  className="input-field"
                />
              </div>
            </div>
          </div>
        </div>

      </div>
    </form>
  );
}
