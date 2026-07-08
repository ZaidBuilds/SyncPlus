import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const { login, signup } = useAuth();
  const [mode, setMode] = useState('login'); // 'login' | 'signup'
  const [form, setForm] = useState({ full_name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);

  // Check if any users exist to decide the default mode
  useEffect(() => {
    const users = JSON.parse(localStorage.getItem('vantage_users') || '[]');
    if (users.length === 0) {
      setMode('signup');
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (mode === 'signup') {
        if (!form.full_name.trim()) throw new Error('Identity required');
        if (!form.email.trim()) throw new Error('Communication channel required');
        if (form.password.length < 4) throw new Error('Key must be at least 4 chars');
        
        signup({
          id: `user_${Date.now()}`,
          full_name: form.full_name.trim(),
          email: form.email.trim().toLowerCase(),
          password: form.password,
          role: 'owner',
        });
      } else {
        const users = JSON.parse(localStorage.getItem('vantage_users') || '[]');
        const found = users.find(u => u.email === form.email.trim().toLowerCase());
        
        if (!found) {
          // Check for old Vantage users as a fallback migration
          const oldUsers = JSON.parse(localStorage.getItem('syncplus_users') || '[]');
          const oldFound = oldUsers.find(u => u.email === form.email.trim().toLowerCase());
          
          if (oldFound) {
            setError('Account found in old system. Please Sign Up to migrate to Vantage.');
            setMode('signup');
            setForm(prev => ({ ...prev, full_name: oldFound.full_name }));
          } else {
            setError('No account found. Initialize your OS below.');
          }
          setLoading(false); 
          return;
        }
        
        if (found.password !== form.password) throw new Error('Access denied: Invalid key');
        login(found);
      }
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 flex items-center justify-center p-6 font-sans">
      
      {/* Simple Container */}
      <div className="w-full max-w-md bg-white p-8 rounded-lg">
        {/* Brand Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-slate-900">Vantage</h1>
          <p className="text-sm text-slate-600 mt-1">by northstack</p>
        </div>

        {/* Page Title */}
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-bold text-slate-900">
            {mode === 'login' ? 'Sign In' : 'Create Account'}
          </h2>
          <p className="text-sm text-slate-600 mt-2">
            {mode === 'login' ? 'Welcome back' : 'Get started with Vantage'}
          </p>
        </div>

        {/* Auth Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-4">
            {mode === 'signup' && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  placeholder="John Doe"
                  className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                  value={form.full_name}
                  onChange={e => setForm({ ...form, full_name: e.target.value })}
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
              <input
                type="email"
                placeholder="you@example.com"
                className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
              <div className="relative">
                <input
                  type={showPwd ? 'text' : 'password'}
                  placeholder="••••••••"
                  className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                />
                <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-700">
                  {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 p-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-slate-900 text-white py-2.5 rounded-lg font-medium text-sm hover:bg-slate-800 transition-colors disabled:opacity-50"
          >
            {loading ? 'Loading...' : mode === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        {/* Toggle Mode */}
        <div className="mt-6 text-center">
          <p className="text-sm text-slate-600">
            {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
            <button
              onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(''); }}
              className="text-slate-900 font-medium hover:underline"
            >
              {mode === 'login' ? 'Sign Up' : 'Sign In'}
            </button>
          </p>
        </div>
      </div>

    </div>
  );
}
