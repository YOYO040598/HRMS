import { useEffect, useState } from 'react';
import api from '../../api/axios';
import { useAppSelector } from '../../hooks/useRedux';
import { User, Mail, Phone, Loader2, Save, MapPin, HeartHandshake, Sparkles } from 'lucide-react';

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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#14B8A6]" />
      </div>
    );
  }

  return (
    <form onSubmit={handleUpdate} className="space-y-6 pb-12 text-[#F8FAFC]">
      <style>{`
        .glass-card-premium {
          background: rgba(13, 23, 40, 0.72);
          backdrop-filter: blur(18px);
          -webkit-backdrop-filter: blur(18px);
          border: 1px solid rgba(148, 163, 184, 0.12);
        }
      `}</style>

      {/* Bento Grid Header */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-left">
        
        {/* Profile Card Banner */}
        <div className="lg:col-span-2 glass-card-premium rounded-3xl p-6 text-white shadow-lg relative overflow-hidden flex flex-col justify-between min-h-[220px] border border-[#1D3045]/40">
          <div className="absolute right-0 bottom-0 translate-x-12 translate-y-12 opacity-5">
            <User size={260} />
          </div>
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 z-10">
            <div className="w-20 h-20 bg-[#14B8A6]/20 backdrop-blur-md border border-[#14B8A6]/30 rounded-2xl flex items-center justify-center font-extrabold text-3xl shadow-inner text-white">
              {form.first_name?.[0]}{form.last_name?.[0]}
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#F8FAFC]">{form.first_name} {form.last_name}</h2>
              <p className="text-[#94A3B8] font-medium mt-1 text-sm flex items-center gap-1.5">
                <Mail size={14} className="text-[#2DD4BF]" /> {form.email}
              </p>
              <div className="flex flex-wrap gap-2 mt-3">
                <span className="px-3 py-1 bg-[#14B8A6]/10 backdrop-blur-md rounded-full text-xs font-bold border border-[#14B8A6]/20 uppercase tracking-wider text-[#2DD4BF]">
                  {user?.role?.replace('_', ' ')}
                </span>
                <span className="px-3 py-1 bg-[#111D30] backdrop-blur-md rounded-full text-xs font-bold border border-[#1D3045]/40 tracking-wider text-[#94A3B8]">
                  Active Employee
                </span>
              </div>
            </div>
          </div>
          
          <div className="mt-6 sm:mt-0 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 z-10 pt-4 border-t border-[#1D3045]/40">
            <div>
              <div className="text-[10px] uppercase font-bold tracking-wider text-[#94A3B8]">Work Contact</div>
              <div className="text-sm font-semibold flex items-center gap-1 mt-0.5 text-[#F8FAFC]"><Phone size={12} className="text-[#2DD4BF]" /> {form.phone_number || 'Not Set'}</div>
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2.5 bg-gradient-to-r from-[#14B8A6] to-[#2DD4BF] text-[#060B16] font-bold text-sm rounded-xl flex items-center gap-2 shadow-md transition-all active:scale-95 cursor-pointer disabled:opacity-50 border-none"
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
        <div className="glass-card-premium rounded-3xl p-6 flex flex-col justify-between shadow-sm relative overflow-hidden border border-[#1D3045]/40">
          <div className="flex items-center justify-between mb-4">
            <span className="w-10 h-10 rounded-xl bg-[#14B8A6]/10 border border-[#14B8A6]/20 flex items-center justify-center text-[#2DD4BF]">
              <Sparkles size={20} />
            </span>
            <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider">Dashboard summary</span>
          </div>
          <div>
            <h3 className="text-lg font-extrabold text-[#F8FAFC]">Complete Profile</h3>
            <p className="text-xs text-[#94A3B8] font-medium mt-1">Keep your credentials up to date. HR and Administration will use these verified fields for official communications, medical needs, and emergencies.</p>
          </div>
          <div className="mt-4 pt-4 border-t border-[#1D3045]/40 flex items-center justify-between">
            <span className="text-xs font-bold text-[#94A3B8]">Emergency Contacts Configured</span>
            <span className={`w-2.5 h-2.5 rounded-full ${form.emergency_contact_phone ? 'bg-[#2DD4BF]' : 'bg-amber-500'}`}></span>
          </div>
        </div>

      </div>

      {/* Save Status Messages */}
      {message.text && (
        <div className={`p-4 rounded-2xl text-sm font-bold shadow-sm transition-all border text-left ${
          message.type === 'success' 
            ? 'bg-[#14B8A6]/10 border-[#14B8A6]/25 text-[#2DD4BF]' 
            : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
        }`}>
          {message.text}
        </div>
      )}

      {/* Main Bento Blocks */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
        
        {/* Bento: Personal Information */}
        <div className="glass-card-premium rounded-3xl p-6 shadow-sm space-y-4 border border-[#1D3045]/40">
          <div className="flex items-center gap-3 border-b border-[#1D3045]/40 pb-3">
            <span className="w-8 h-8 rounded-lg bg-[#14B8A6]/10 flex items-center justify-center text-[#2DD4BF]">
              <User size={16} />
            </span>
            <h3 className="font-extrabold text-[#F8FAFC]">Personal Information</h3>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-[#94A3B8]">First Name</label>
              <input
                type="text"
                required
                value={form.first_name}
                onChange={(e) => setForm((prev) => ({ ...prev, first_name: e.target.value }))}
                className="w-full bg-[#111D30] border border-[#1D3045] rounded-xl px-4 py-2.5 text-xs text-[#F8FAFC] font-semibold focus:outline-none focus:border-[#2DD4BF]/50 mt-1"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-[#94A3B8]">Last Name</label>
              <input
                type="text"
                required
                value={form.last_name}
                onChange={(e) => setForm((prev) => ({ ...prev, last_name: e.target.value }))}
                className="w-full bg-[#111D30] border border-[#1D3045] rounded-xl px-4 py-2.5 text-xs text-[#F8FAFC] font-semibold focus:outline-none focus:border-[#2DD4BF]/50 mt-1"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-[#94A3B8]">Personal Email</label>
              <input
                type="email"
                placeholder="personal@email.com"
                value={form.personal_email}
                onChange={(e) => setForm((prev) => ({ ...prev, personal_email: e.target.value }))}
                className="w-full bg-[#111D30] border border-[#1D3045] rounded-xl px-4 py-2.5 text-xs text-[#F8FAFC] font-semibold focus:outline-none focus:border-[#2DD4BF]/50 mt-1"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-[#94A3B8]">Mobile Number</label>
              <input
                type="text"
                placeholder="+91 XXXXX XXXXX"
                value={form.phone_number}
                onChange={(e) => setForm((prev) => ({ ...prev, phone_number: e.target.value }))}
                className="w-full bg-[#111D30] border border-[#1D3045] rounded-xl px-4 py-2.5 text-xs text-[#F8FAFC] font-semibold focus:outline-none focus:border-[#2DD4BF]/50 mt-1"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-[#94A3B8]">Date of Birth</label>
              <div className="relative">
                <input
                  type="date"
                  value={form.date_of_birth}
                  onChange={(e) => setForm((prev) => ({ ...prev, date_of_birth: e.target.value }))}
                  className="w-full bg-[#111D30] border border-[#1D3045] rounded-xl px-4 py-2.5 text-xs text-[#F8FAFC] font-semibold focus:outline-none focus:border-[#2DD4BF]/50 mt-1 cursor-pointer"
                />
              </div>
            </div>
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-[#94A3B8]">Gender</label>
              <select
                value={form.gender}
                onChange={(e) => setForm((prev) => ({ ...prev, gender: e.target.value }))}
                className="w-full bg-[#111D30] border border-[#1D3045] rounded-xl px-4 py-2.5 text-xs text-[#F8FAFC] font-semibold focus:outline-none focus:border-[#2DD4BF]/50 mt-1 cursor-pointer"
              >
                <option value="" className="bg-[#0D1728]">Select Gender</option>
                <option value="MALE" className="bg-[#0D1728]">Male</option>
                <option value="FEMALE" className="bg-[#0D1728]">Female</option>
                <option value="OTHER" className="bg-[#0D1728]">Other</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-[#94A3B8]">Marital Status</label>
              <select
                value={form.marital_status}
                onChange={(e) => setForm((prev) => ({ ...prev, marital_status: e.target.value }))}
                className="w-full bg-[#111D30] border border-[#1D3045] rounded-xl px-4 py-2.5 text-xs text-[#F8FAFC] font-semibold focus:outline-none focus:border-[#2DD4BF]/50 mt-1 cursor-pointer"
              >
                <option value="" className="bg-[#0D1728]">Select Status</option>
                <option value="SINGLE" className="bg-[#0D1728]">Single</option>
                <option value="MARRIED" className="bg-[#0D1728]">Married</option>
                <option value="DIVORCED" className="bg-[#0D1728]">Divorced</option>
                <option value="WIDOWED" className="bg-[#0D1728]">Widowed</option>
              </select>
            </div>
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-[#94A3B8]">Blood Group</label>
              <select
                value={form.blood_group}
                onChange={(e) => setForm((prev) => ({ ...prev, blood_group: e.target.value }))}
                className="w-full bg-[#111D30] border border-[#1D3045] rounded-xl px-4 py-2.5 text-xs text-[#F8FAFC] font-semibold focus:outline-none focus:border-[#2DD4BF]/50 mt-1 cursor-pointer"
              >
                <option value="" className="bg-[#0D1728]">Select Blood Group</option>
                <option value="A+" className="bg-[#0D1728]">A+</option>
                <option value="A-" className="bg-[#0D1728]">A-</option>
                <option value="B+" className="bg-[#0D1728]">B+</option>
                <option value="B-" className="bg-[#0D1728]">B-</option>
                <option value="O+" className="bg-[#0D1728]">O+</option>
                <option value="O-" className="bg-[#0D1728]">O-</option>
                <option value="AB+" className="bg-[#0D1728]">AB+</option>
                <option value="AB-" className="bg-[#0D1728]">AB-</option>
              </select>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Bento: Primary Address */}
          <div className="glass-card-premium rounded-3xl p-6 shadow-sm space-y-4 border border-[#1D3045]/40">
            <div className="flex items-center gap-3 border-b border-[#1D3045]/40 pb-3">
              <span className="w-8 h-8 rounded-lg bg-[#14B8A6]/10 flex items-center justify-center text-[#2DD4BF]">
                <MapPin size={16} />
              </span>
              <h3 className="font-extrabold text-[#F8FAFC]">Primary Address</h3>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="text-[11px] font-bold uppercase tracking-wider text-[#94A3B8]">Address Line 1</label>
                <input
                  type="text"
                  placeholder="Street Address, P.O. Box"
                  value={form.address_line_1}
                  onChange={(e) => setForm((prev) => ({ ...prev, address_line_1: e.target.value }))}
                  className="w-full bg-[#111D30] border border-[#1D3045] rounded-xl px-4 py-2.5 text-xs text-[#F8FAFC] font-semibold focus:outline-none focus:border-[#2DD4BF]/50 mt-1"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="text-[11px] font-bold uppercase tracking-wider text-[#94A3B8]">Address Line 2</label>
                <input
                  type="text"
                  placeholder="Apartment, Suite, Unit"
                  value={form.address_line_2}
                  onChange={(e) => setForm((prev) => ({ ...prev, address_line_2: e.target.value }))}
                  className="w-full bg-[#111D30] border border-[#1D3045] rounded-xl px-4 py-2.5 text-xs text-[#F8FAFC] font-semibold focus:outline-none focus:border-[#2DD4BF]/50 mt-1"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-[#94A3B8]">City</label>
                <input
                  type="text"
                  placeholder="City"
                  value={form.city}
                  onChange={(e) => setForm((prev) => ({ ...prev, city: e.target.value }))}
                  className="w-full bg-[#111D30] border border-[#1D3045] rounded-xl px-4 py-2.5 text-xs text-[#F8FAFC] font-semibold focus:outline-none focus:border-[#2DD4BF]/50 mt-1"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-[#94A3B8]">State / Province</label>
                <input
                  type="text"
                  placeholder="State"
                  value={form.state}
                  onChange={(e) => setForm((prev) => ({ ...prev, state: e.target.value }))}
                  className="w-full bg-[#111D30] border border-[#1D3045] rounded-xl px-4 py-2.5 text-xs text-[#F8FAFC] font-semibold focus:outline-none focus:border-[#2DD4BF]/50 mt-1"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-[#94A3B8]">Country</label>
                <input
                  type="text"
                  placeholder="Country"
                  value={form.country}
                  onChange={(e) => setForm((prev) => ({ ...prev, country: e.target.value }))}
                  className="w-full bg-[#111D30] border border-[#1D3045] rounded-xl px-4 py-2.5 text-xs text-[#F8FAFC] font-semibold focus:outline-none focus:border-[#2DD4BF]/50 mt-1"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-[#94A3B8]">Postal Code</label>
                <input
                  type="text"
                  placeholder="Zip Code"
                  value={form.postal_code}
                  onChange={(e) => setForm((prev) => ({ ...prev, postal_code: e.target.value }))}
                  className="w-full bg-[#111D30] border border-[#1D3045] rounded-xl px-4 py-2.5 text-xs text-[#F8FAFC] font-semibold focus:outline-none focus:border-[#2DD4BF]/50 mt-1"
                />
              </div>
            </div>
          </div>

          {/* Bento: Emergency Contact */}
          <div className="glass-card-premium rounded-3xl p-6 shadow-sm space-y-4 border border-[#1D3045]/40">
            <div className="flex items-center gap-3 border-b border-[#1D3045]/40 pb-3">
              <span className="w-8 h-8 rounded-lg bg-[#14B8A6]/10 flex items-center justify-center text-[#2DD4BF]">
                <HeartHandshake size={16} />
              </span>
              <h3 className="font-extrabold text-[#F8FAFC]">Emergency Contact</h3>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="text-[11px] font-bold uppercase tracking-wider text-[#94A3B8]">Contact Name</label>
                <input
                  type="text"
                  placeholder="Full Name"
                  value={form.emergency_contact_name}
                  onChange={(e) => setForm((prev) => ({ ...prev, emergency_contact_name: e.target.value }))}
                  className="w-full bg-[#111D30] border border-[#1D3045] rounded-xl px-4 py-2.5 text-xs text-[#F8FAFC] font-semibold focus:outline-none focus:border-[#2DD4BF]/50 mt-1"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-[#94A3B8]">Relationship</label>
                <input
                  type="text"
                  placeholder="e.g. Spouse, Parent, Sibling"
                  value={form.emergency_contact_relationship}
                  onChange={(e) => setForm((prev) => ({ ...prev, emergency_contact_relationship: e.target.value }))}
                  className="w-full bg-[#111D30] border border-[#1D3045] rounded-xl px-4 py-2.5 text-xs text-[#F8FAFC] font-semibold focus:outline-none focus:border-[#2DD4BF]/50 mt-1"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-[#94A3B8]">Phone Number</label>
                <input
                  type="text"
                  placeholder="Contact Number"
                  value={form.emergency_contact_phone}
                  onChange={(e) => setForm((prev) => ({ ...prev, emergency_contact_phone: e.target.value }))}
                  className="w-full bg-[#111D30] border border-[#1D3045] rounded-xl px-4 py-2.5 text-xs text-[#F8FAFC] font-semibold focus:outline-none focus:border-[#2DD4BF]/50 mt-1"
                />
              </div>
            </div>
          </div>
        </div>

      </div>
    </form>
  );
}
