import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { authAPI } from '../services/api';
import { Zap, Eye, EyeOff, ArrowRight } from 'lucide-react';

export default function Login() {
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState('admin@finrisk.ai');
  const [password, setPassword] = useState('admin123');
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = isSignup
        ? await authAPI.signup({ email, username, password, full_name: fullName })
        : await authAPI.login(email, password);
      setAuth(res.data.user, res.data.access_token);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-surface-950 via-primary-900/20 to-surface-950" />
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-primary-600/10 rounded-full blur-3xl animate-float" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '1.5s' }} />

      {/* Grid pattern */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: 'linear-gradient(rgba(99,102,241,.5) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,.5) 1px, transparent 1px)',
        backgroundSize: '60px 60px',
      }} />

      <div className="relative z-10 w-full max-w-md px-6">
        {/* Logo */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 mb-4 glow-primary">
            <Zap className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold gradient-text">FinRisk AI</h1>
          <p className="text-surface-200/50 text-sm mt-1">AI Financial Risk & Compliance Intelligence</p>
        </div>

        {/* Form Card */}
        <div className="glass-card p-8 animate-fade-in" style={{ animationDelay: '0.2s' }}>
          <h2 className="text-xl font-semibold text-surface-100 mb-1">
            {isSignup ? 'Create Account' : 'Welcome Back'}
          </h2>
          <p className="text-surface-200/50 text-sm mb-6">
            {isSignup ? 'Set up your enterprise account' : 'Sign in to your intelligence platform'}
          </p>

          {error && (
            <div className="mb-4 px-4 py-3 rounded-xl bg-danger-500/10 border border-danger-500/20 text-danger-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignup && (
              <>
                <div>
                  <label className="block text-xs font-medium text-surface-200/60 mb-1.5 uppercase tracking-wider">Full Name</label>
                  <input
                    type="text" value={fullName} onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-surface-800/50 border border-primary-500/10 text-surface-100 placeholder:text-surface-200/30 focus:border-primary-500/40 focus:outline-none focus:ring-1 focus:ring-primary-500/20 transition-all"
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-surface-200/60 mb-1.5 uppercase tracking-wider">Username</label>
                  <input
                    type="text" value={username} onChange={(e) => setUsername(e.target.value)} required
                    className="w-full px-4 py-3 rounded-xl bg-surface-800/50 border border-primary-500/10 text-surface-100 placeholder:text-surface-200/30 focus:border-primary-500/40 focus:outline-none focus:ring-1 focus:ring-primary-500/20 transition-all"
                    placeholder="johndoe"
                  />
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-medium text-surface-200/60 mb-1.5 uppercase tracking-wider">Email</label>
              <input
                type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                className="w-full px-4 py-3 rounded-xl bg-surface-800/50 border border-primary-500/10 text-surface-100 placeholder:text-surface-200/30 focus:border-primary-500/40 focus:outline-none focus:ring-1 focus:ring-primary-500/20 transition-all"
                placeholder="you@company.com"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-surface-200/60 mb-1.5 uppercase tracking-wider">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} required
                  className="w-full px-4 py-3 rounded-xl bg-surface-800/50 border border-primary-500/10 text-surface-100 placeholder:text-surface-200/30 focus:border-primary-500/40 focus:outline-none focus:ring-1 focus:ring-primary-500/20 transition-all pr-12"
                  placeholder="••••••••"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-200/40 hover:text-surface-200/70">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit" disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 text-white font-semibold transition-all duration-300 disabled:opacity-50 glow-primary"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  {isSignup ? 'Create Account' : 'Sign In'}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => { setIsSignup(!isSignup); setError(''); }}
              className="text-sm text-primary-400 hover:text-primary-300 transition-colors"
            >
              {isSignup ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
            </button>
          </div>

          {!isSignup && (
            <div className="mt-4 p-3 rounded-xl bg-primary-500/5 border border-primary-500/10">
              <p className="text-[10px] text-surface-200/40 uppercase tracking-wider mb-1">Demo Credentials</p>
              <p className="text-xs text-surface-200/60">
                <span className="text-primary-400">Admin:</span> admin@finrisk.ai / admin123
              </p>
              <p className="text-xs text-surface-200/60">
                <span className="text-primary-400">Analyst:</span> analyst@finrisk.ai / analyst123
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
