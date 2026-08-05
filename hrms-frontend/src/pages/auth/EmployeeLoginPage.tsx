import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../hooks/useRedux';
import { employeeLogin, clearError } from '../../store/authSlice';
import { Eye, EyeOff, User, Lock, Loader2, ArrowRight } from 'lucide-react';

export default function EmployeeLoginPage() {
  const [employeeId, setEmployeeId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { loading, error } = useAppSelector((state) => state.auth);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await dispatch(employeeLogin({ employee_id: employeeId, password }));
    if (employeeLogin.fulfilled.match(result)) {
      navigate('/emp');
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-emerald-600 via-teal-600 to-emerald-800 text-white p-12 flex-col justify-between">
        <div>
          <div className="flex items-center gap-3 mb-16">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
              <span className="text-2xl font-bold">H</span>
            </div>
            <span className="text-3xl font-bold">HRMS</span>
          </div>
          <h1 className="text-5xl font-bold leading-tight mb-6">Employee Portal</h1>
          <p className="text-xl text-emerald-100 leading-relaxed max-w-lg">
            Access your attendance, leaves, payslips, and more. Your personal HR assistant on the go.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-6 mt-12">
          {[
            { icon: '✓', label: 'Check In / Out' },
            { icon: '✓', label: 'Apply Leave' },
            { icon: '✓', label: 'View Payslips' },
            { icon: '✓', label: 'Track Attendance' },
          ].map((item) => (
            <div key={item.label} className="bg-white/10 rounded-xl p-4 backdrop-blur-sm flex items-center gap-3">
              <span className="text-xl">{item.icon}</span>
              <span className="font-medium">{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex-1 flex items-center justify-center p-8 bg-gray-50">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-10 h-10 bg-emerald-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">H</div>
            <span className="text-2xl font-bold text-gray-800">HRMS</span>
          </div>

          <h2 className="text-3xl font-bold text-gray-800 mb-2">Employee Login</h2>
          <p className="text-gray-500 mb-8">Enter your Employee ID and password</p>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="label">Employee ID</label>
              <div className="relative">
                <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={employeeId}
                  onChange={(e) => { setEmployeeId(e.target.value); dispatch(clearError()); }}
                  className="input-field pl-10"
                  placeholder="Enter your Employee ID"
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

            <button type="submit" disabled={loading} className="btn-primary w-full py-3 flex items-center justify-center gap-2 text-base bg-emerald-600 hover:bg-emerald-700">
              {loading ? <><Loader2 size={20} className="animate-spin" /> Signing in...</> : <>Sign in <ArrowRight size={18} /></>}
            </button>
          </form>

          <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-100">
            <p className="text-xs font-medium text-blue-800 mb-2">How to get your Employee ID?</p>
            <p className="text-xs text-blue-600">Contact your HR department to get your Employee ID and initial password.</p>
          </div>

          <p className="mt-6 text-center text-sm text-gray-500">
            Admin? <Link to="/login" className="text-emerald-600 font-semibold hover:text-emerald-700">Sign in as Admin</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
