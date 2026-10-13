import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Heart, Mail, Lock, AlertCircle, ArrowRight } from 'lucide-react';
import { useAuth } from '@/auth/AuthContext';
import { Button } from '@/components/ui';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(email, password);
      const target = user.role === 'member' ? '/member'
        : user.role === 'admin' ? '/admin'
        : user.role === 'treasurer' ? '/treasurer'
        : user.role === 'secretary' ? '/secretary'
        : user.role === 'chairperson' ? '/chairperson'
        : user.role === 'office' ? '/office'
        : '/super-admin';
      navigate(target);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const demoAccounts = [
    { role: 'Member', email: 'member@khwwc.co.ke' },
    { role: 'Admin', email: 'admin@khwwc.co.ke' },
    { role: 'Treasurer', email: 'treasurer@khwwc.co.ke' },
    { role: 'Secretary', email: 'secretary@khwwc.co.ke' },
    { role: 'Chairperson', email: 'chairperson@khwwc.co.ke' },
    { role: 'Super Admin', email: 'superadmin@khwwc.co.ke' },
  ];

  return (
    <div className="min-h-screen flex">
      {/* Left panel — N26 saturated teal brand surface */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary-500 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-500 via-primary-600 to-primary-800" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary-400/20 rounded-full blur-3xl -translate-y-1/3 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-primary-300/10 rounded-full blur-3xl translate-y-1/3" />

        <div className="relative z-10 flex flex-col justify-between p-12 text-white">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-lg bg-white/15 backdrop-blur flex items-center justify-center">
              <Heart size={24} strokeWidth={2.5} />
            </div>
            <div>
              <p className="text-lg font-bold leading-tight">KHWWC</p>
              <p className="text-xs text-primary-100 leading-tight">Kirinyaga Healthcare Workers Welfare</p>
            </div>
          </Link>

          <div className="max-w-md">
            <h1 className="text-3xl font-bold leading-tight mb-4 tracking-tight">Supporting those who care for our community</h1>
            <p className="text-primary-50 text-base leading-relaxed">
              Member portal for contributions, beneficiaries, statements, donations, events, and more. Sign in to access your welfare account.
            </p>
            <div className="mt-8 space-y-3">
              {['Manage contributions and payments', 'Access statements and documents', 'Track beneficiaries and notifications'].map(feature => (
                <div key={feature} className="flex items-center gap-3 text-sm text-primary-50">
                  <div className="w-5 h-5 rounded-full bg-white/15 flex items-center justify-center flex-shrink-0">
                    <Heart size={12} />
                  </div>
                  {feature}
                </div>
              ))}
            </div>
          </div>

          <p className="text-xs text-primary-200">© 2026 KHWWC. All rights reserved.</p>
        </div>
      </div>

      {/* Right panel — login form on clean white */}
      <div className="flex-1 flex items-center justify-center px-4 py-8 sm:px-6 lg:px-8 bg-white">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex items-center gap-2.5 mb-8 justify-center">
            <div className="w-10 h-10 rounded-lg bg-primary-500 flex items-center justify-center text-white">
              <Heart size={22} strokeWidth={2.5} />
            </div>
            <div>
              <p className="text-base font-bold text-neutral-900 leading-tight">KHWWC</p>
              <p className="text-xs text-neutral-400 leading-tight">Healthcare Workers Welfare</p>
            </div>
          </div>

          <h2 className="text-xl font-bold text-neutral-900 tracking-tight">Welcome back</h2>
          <p className="mt-1 text-sm text-neutral-500">Sign in to access your account</p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            {error && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-error-50 border border-error-200 text-sm text-error-700">
                <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="label">Email Address</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@khwwc.co.ke"
                  className="input-field pl-9"
                  required
                  autoFocus
                />
              </div>
            </div>

            <div>
              <label className="label">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="input-field pl-9"
                  required
                />
              </div>
            </div>

            <Button type="submit" size="lg" className="w-full" disabled={loading}>
              {loading ? (
                <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Signing in...</>
              ) : (
                <>Sign In <ArrowRight size={16} /></>
              )}
            </Button>
          </form>

          <div className="mt-6 p-4 rounded-lg bg-neutral-50 border border-neutral-100">
            <p className="text-xs font-medium text-neutral-500 mb-2.5">Demo accounts (any password works):</p>
            <div className="grid grid-cols-2 gap-1.5">
              {demoAccounts.map(acc => (
                <button
                  key={acc.email}
                  onClick={() => { setEmail(acc.email); setPassword('demo123'); }}
                  className="text-left px-2.5 py-1.5 rounded-md text-xs text-neutral-600 hover:bg-white hover:text-neutral-900 transition-colors"
                >
                  <p className="font-medium">{acc.role}</p>
                  <p className="text-neutral-400 truncate">{acc.email}</p>
                </button>
              ))}
            </div>
          </div>

          <p className="mt-6 text-center text-xs text-neutral-400">
            <Link to="/" className="hover:text-neutral-600">← Back to website</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
