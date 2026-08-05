import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../hooks/useRedux';
import { login, clearError } from '../../store/authSlice';
import { Eye, EyeOff, Mail, Lock, Loader2, ArrowRight } from 'lucide-react';

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
    <div className="min-h-screen w-full relative flex items-center justify-center overflow-hidden bg-[#0d0c0a] p-4 sm:p-6">
      {/* CSS Animation Styles */}
      <style>{`
        @keyframes float-blob-1 {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(50px, -70px) scale(1.15); }
          66% { transform: translate(-30px, 40px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        @keyframes float-blob-2 {
          0% { transform: translate(0px, 0px) scale(1.1); }
          50% { transform: translate(-60px, 50px) scale(0.85); }
          100% { transform: translate(0px, 0px) scale(1.1); }
        }
        @keyframes float-blob-3 {
          0% { transform: translate(0px, 0px) scale(0.9); }
          50% { transform: translate(40px, 60px) scale(1.1); }
          100% { transform: translate(0px, 0px) scale(0.9); }
        }
        .blob-1 { animation: float-blob-1 15s infinite ease-in-out; }
        .blob-2 { animation: float-blob-2 18s infinite ease-in-out; }
        .blob-3 { animation: float-blob-3 12s infinite ease-in-out; }
      `}</style>

      {/* Vibrant Background Animated Blobs - Warm Orange Theme */}
      <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-[#ea580c]/20 blur-[120px] blob-1 pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[45vw] h-[45vw] rounded-full bg-[#f97316]/15 blur-[120px] blob-2 pointer-events-none" />
      <div className="absolute top-[30%] right-[10%] w-[35vw] h-[35vw] rounded-full bg-amber-600/10 blur-[100px] blob-3 pointer-events-none" />

      {/* Glassmorphic Login Container */}
      <div className="w-full max-w-[460px] relative z-10">
        <div className="bg-white/[0.03] backdrop-blur-[24px] -webkit-backdrop-blur-[24px] border border-white/[0.08] rounded-[32px] p-8 sm:p-10 shadow-[0_32px_64px_rgba(0,0,0,0.6)]">
          {/* Logo / Brand */}
          <div className="flex items-center gap-3 mb-6 justify-center">
            <div className="w-11 h-11 bg-gradient-to-tr from-[#ea580c] to-[#f97316] rounded-xl flex items-center justify-center font-bold text-white shadow-lg shadow-[#ea580c]/20">
              <span className="text-xl font-extrabold font-mono">H</span>
            </div>
            <span className="text-2xl font-bold tracking-tight text-white">HRMS <span className="text-xs font-semibold px-2 py-0.5 rounded bg-white/10 text-orange-300 ml-1">Admin</span></span>
          </div>

          {/* Toggle Tabs */}
          <div className="flex bg-white/[0.02] p-1 rounded-2xl border border-white/[0.06] mb-8">
            <button
              type="button"
              className="flex-1 py-3 text-xs font-extrabold uppercase tracking-wider rounded-xl transition-all text-white bg-[#ea580c] shadow-md shadow-[#ea580c]/20"
            >
              Admin / HR
            </button>
            <button
              type="button"
              onClick={() => navigate('/emp/login')}
              className="flex-1 py-3 text-xs font-extrabold uppercase tracking-wider rounded-xl transition-all text-gray-400 hover:text-white cursor-pointer"
            >
              Employee
            </button>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-300 text-xs font-semibold flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="block text-[11px] font-bold text-orange-300 uppercase tracking-wider">Email Address</label>
              <div className="relative">
                <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); dispatch(clearError()); }}
                  className="w-full pl-12 pr-4 py-3.5 bg-white/[0.02] border border-white/[0.08] rounded-xl focus:ring-2 focus:ring-[#ea580c]/40 focus:border-[#ea580c] transition-all outline-none text-white placeholder-gray-500 text-sm font-medium"
                  placeholder="name@company.com"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="block text-[11px] font-bold text-orange-300 uppercase tracking-wider">Password</label>
              </div>
              <div className="relative">
                <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-12 py-3.5 bg-white/[0.02] border border-white/[0.08] rounded-xl focus:ring-2 focus:ring-[#ea580c]/40 focus:border-[#ea580c] transition-all outline-none text-white placeholder-gray-500 text-sm font-medium"
                  placeholder="••••••••"
                  required
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors">
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-gradient-to-r from-[#ea580c] to-[#f97316] text-white font-bold rounded-xl hover:brightness-110 active:scale-[0.98] transition-all shadow-lg shadow-[#ea580c]/20 flex items-center justify-center gap-2 text-sm uppercase tracking-wider cursor-pointer border-none"
            >
              {loading ? (
                <><Loader2 size={18} className="animate-spin" /> Authenticating...</>
              ) : (
                <>Sign In <ArrowRight size={16} /></>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
