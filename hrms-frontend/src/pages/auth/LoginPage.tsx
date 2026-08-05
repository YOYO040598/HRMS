import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../hooks/useRedux';
import { login, clearError } from '../../store/authSlice';
import { Eye, EyeOff, Mail, Lock, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { loading, error } = useAppSelector((state) => state.auth);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await dispatch(login({ email, password }));
    if (login.fulfilled.match(result)) {
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-800 text-white p-12 flex-col justify-between">
        <div>
          <div className="flex items-center gap-3 mb-16">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
              <span className="text-2xl font-bold">H</span>
            </div>
            <span className="text-3xl font-bold">HRMS</span>
          </div>

          <h1 className="text-5xl font-bold leading-tight mb-6">
            Human Resource<br />Management System
          </h1>
          <p className="text-xl text-indigo-100 leading-relaxed max-w-lg">
            Streamline your HR operations with our comprehensive platform. Manage employees, attendance, payroll, and more.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-6 mt-12">
          {[
            { num: '500+', label: 'Employees' },
            { num: '50+', label: 'Companies' },
            { num: '99%', label: 'Uptime' },
            { num: '24/7', label: 'Support' },
          ].map((stat) => (
            <div key={stat.label} className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
              <div className="text-3xl font-bold">{stat.num}</div>
              <div className="text-indigo-200 text-sm">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-gray-50">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">H</div>
            <span className="text-2xl font-bold text-gray-800">HRMS</span>
          </div>

          <h2 className="text-3xl font-bold text-gray-800 mb-2">Welcome back</h2>
          <p className="text-gray-500 mb-8">Sign in to your account to continue</p>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="label">Email address</label>
              <div className="relative">
                <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); dispatch(clearError()); }}
                  className="input-field pl-10"
                  placeholder="Enter your email"
                  required
                />
              </div>
            </div>

            <div>
              <label className="label">Password</label>
              <div className="relative">
                <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field pl-10 pr-10"
                  placeholder="Enter your password"
                  required
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full py-3 flex items-center justify-center gap-2 text-base">
              {loading ? <><Loader2 size={20} className="animate-spin" /> Signing in...</> : 'Sign in'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            Don't have an account?{' '}
            <Link to="/register" className="text-indigo-600 font-semibold hover:text-indigo-700">Create account</Link>
          </p>

          <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-100">
            <p className="text-xs font-medium text-blue-800 mb-2">Demo Credentials:</p>
            <p className="text-xs text-blue-600">Admin: admin@hrms.com / Admin@123</p>
            <p className="text-xs text-blue-600 mt-1">Employee: Login with your Employee ID (get from HR)</p>
          </div>

          <p className="mt-4 text-center text-sm text-gray-500">
            Employee? <Link to="/emp/login" className="text-emerald-600 font-semibold hover:text-emerald-700">Sign in as Employee</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
