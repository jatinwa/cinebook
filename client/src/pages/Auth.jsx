import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Film } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const { login, register, loading, error, isLoggedIn } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isLoggedIn) navigate('/');
  }, [isLoggedIn, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const action = isLogin
      ? login({ email: form.email, password: form.password })
      : register(form);
    const result = await action;
    if (result.meta?.requestStatus === 'fulfilled') {
      toast.success(isLogin ? 'Welcome back!' : 'Account created!');
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-brand-dark">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-brand-red rounded-xl mb-4">
            <Film size={28} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">CineBook</h1>
          <p className="text-brand-muted mt-1">Book your favourite movies</p>
        </div>

        {/* Card */}
        <div className="card p-8">
          {/* Tabs */}
          <div className="flex rounded-lg bg-brand-dark p-1 mb-8">
            {['Login', 'Register'].map((tab) => (
              <button
                key={tab}
                onClick={() => setIsLogin(tab === 'Login')}
                className={`flex-1 py-2.5 rounded-md text-sm font-semibold transition-all ${
                  (tab === 'Login') === isLogin
                    ? 'bg-brand-red text-white'
                    : 'text-brand-muted hover:text-white'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-md p-3 mb-4 text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <label className="block text-sm text-brand-muted mb-1.5">Full Name</label>
                <input
                  type="text"
                  className="input"
                  placeholder="John Doe"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>
            )}
            <div>
              <label className="block text-sm text-brand-muted mb-1.5">Email</label>
              <input
                type="email"
                className="input"
                placeholder="you@example.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-sm text-brand-muted mb-1.5">Password</label>
              <input
                type="password"
                className="input"
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
              />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
              {loading ? 'Please wait...' : isLogin ? 'Sign In' : 'Create Account'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}