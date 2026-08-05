import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../hooks/useRedux';
import { register, clearError } from '../../store/authSlice';
import { Eye, EyeOff, Mail, Lock, User, Loader2 } from 'lucide-react';

export default function RegisterPage() {
  const [form, setForm] = useState({ first_name: '', last_name: '', email: '', password: '', password_confirm: '' });
  const [showPassword, setShowPassword] = useState(false);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { loading, error } = useAppSelector((state) => state.auth);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await dispatch(register(form));
    if (register.fulfilled.match(result)) {
      navigate('/');
    }
  };

  const update = (field: string, value: string) => setForm((prev) => ({ ...prev, [field]: value }));

  return (
    <div className="min-h-screen flex">
      {/* Left Panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-800 text-white p-12 flex-col justify-center">
        <div className="max-w-lg">
          <div className="flex items-center gap-3 mb-12">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
              <span className="text-2xl font-bold">H</span>
            </div>
            <span className="text-3xl font-bold">HRMS</span>
          </div>
          <h1 className="text-5xl font-bold leading-tight mb-6">Get Started</h1>
          <p className="text-xl text-indigo-100">Create your account to start managing your HR operations.</p>
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex-1 flex items-center justify-center p-8 bg-gray-50">
        <div className="w-full max-w-md">
          <h2 className="text-3xl font-bold text-gray-800 mb-2">Create account</h2>
          <p className="text-gray-500 mb-8">Fill in the details to get started</p>

          {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">First name</label>
                <div className="relative">
                  <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type="text" value={form.first_name} onChange={(e) => update('first_name', e.target.value)} className="input-field pl-10" placeholder="First name" required />
                </div>
              </div>
              <div>
                <label className="label">Last name</label>
                <input type="text" value={form.last_name} onChange={(e) => update('last_name', e.target.value)} className="input-field" placeholder="Last name" required />
              </div>
            </div>

            <div>
              <label className="label">Email address</label>
              <div className="relative">
                <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="email" value={form.email} onChange={(e) => update('email', e.target.value)} className="input-field pl-10" placeholder="Enter your email" required />
              </div>
            </div>

            <div>
              <label className="label">Password</label>
              <div className="relative">
                <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type={showPassword ? 'text' : 'password'} value={form.password} onChange={(e) => update('password', e.target.value)} className="input-field pl-10 pr-10" placeholder="Create password" required />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div>
              <label className="label">Confirm Password</label>
              <div className="relative">
                <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="password" value={form.password_confirm} onChange={(e) => update('password_confirm', e.target.value)} className="input-field pl-10" placeholder="Confirm password" required />
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full py-3 flex items-center justify-center gap-2 text-base">
              {loading ? <><Loader2 size={20} className="animate-spin" /> Creating account...</> : 'Create account'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            Already have an account? <Link to="/login" className="text-indigo-600 font-semibold hover:text-indigo-700">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
