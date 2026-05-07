import React, { useState } from 'react';
import { BookOpen, Mail, Lock, AlertCircle, Loader2, User } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export default function LoginPage() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [tab, setTab] = useState<'STUDENT' | 'FACULTY' | 'ADMIN'>('STUDENT');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [department, setDepartment] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'register') {
        if (!name.trim()) {
          setError('Please enter your full name.');
          return;
        }
        if (tab === 'STUDENT' && !department.trim()) {
          setError('School is required for student registration.');
          return;
        }
        await register({
          name: name.trim(),
          email: email.trim(),
          password,
          role: tab,
          department: department.trim() || undefined,
        });
      } else {
        await login(email.trim(), password, tab);
      }
    } catch (err: unknown) {
      let msg = err instanceof Error ? err.message : 'Something went wrong. Please try again.';
      if (msg.includes('Wrong login tab:')) {
        if (tab === 'FACULTY') {
          msg =
            'Invalid credentials for Faculty login. Only faculty accounts can sign in on this tab — switch tabs if you have a different role.';
        } else if (tab === 'ADMIN') {
          msg =
            'Invalid credentials for Admin login. Only administrator accounts can sign in here — use Student or Faculty for other accounts.';
        } else {
          msg =
            'Invalid credentials for Student login. Only student accounts can sign in on this tab — switch tabs if you have a different role.';
        }
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-brand-slate p-4">
      <div className="absolute left-0 top-0 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-indigo/5 blur-3xl motion-safe:animate-fade-in" />
      <div className="absolute bottom-0 right-0 h-96 w-96 translate-x-1/2 translate-y-1/2 rounded-full bg-brand-indigo/8 blur-3xl motion-safe:animate-fade-in" />

      <div className="relative z-10 w-full max-w-md page-fade">
        <div className="mb-8 text-center">
          <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-navy shadow-lg transition-all duration-300 ease-out hover:scale-105 hover:shadow-xl hover:shadow-brand-indigo/20">
            <BookOpen className="text-brand-indigo" size={32} />
          </div>
          <h1 className="text-3xl font-bold text-brand-navy tracking-tight">Retentio LMS</h1>
          <p className="text-slate-500 font-medium mt-1">Learning Management System</p>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-xl transition-shadow duration-300 ease-out hover:shadow-2xl hover:shadow-brand-indigo/10">
          <div className="flex border-b border-slate-100">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setError('');
              }}
              className={`flex-1 py-3 text-sm font-bold tracking-wide transition-colors duration-200 ease-out ${
                mode === 'login'
                  ? 'border-b-2 border-brand-indigo bg-brand-indigo/5 text-brand-indigo'
                  : 'text-slate-400 hover:bg-slate-50 hover:text-slate-700'
              }`}
            >
              Sign in
            </button>
            <button
              type="button"
              disabled={tab === 'ADMIN'}
              onClick={() => {
                setMode('register');
                setError('');
              }}
              className={`flex-1 py-3 text-sm font-bold tracking-wide transition-colors duration-200 ease-out ${
                tab === 'ADMIN'
                  ? 'cursor-not-allowed text-slate-300'
                  : mode === 'register'
                    ? 'border-b-2 border-brand-indigo bg-brand-indigo/5 text-brand-indigo'
                    : 'text-slate-400 hover:bg-slate-50 hover:text-slate-700'
              }`}
            >
              Create account
            </button>
          </div>

          <div className="flex border-b border-slate-100">
            {(['STUDENT', 'FACULTY', 'ADMIN'] as const).map((role) => (
              <button
                key={role}
                type="button"
                onClick={() => {
                  setTab(role);
                  setError('');
                  if (role === 'ADMIN') setMode('login');
                }}
                className={`flex-1 py-3 text-xs font-bold tracking-wide transition-colors duration-200 ease-out sm:text-sm ${
                  tab === role
                    ? 'border-b-2 border-brand-indigo bg-brand-indigo/5 text-brand-indigo'
                    : 'text-slate-400 hover:bg-slate-50 hover:text-slate-700'
                }`}
              >
                {role === 'STUDENT' ? '🎓 Student' : role === 'FACULTY' ? '👨‍🏫 Faculty' : '🛡️ Admin'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-5">
            <div>
              <p className="text-lg font-bold text-brand-navy mb-1">
                {mode === 'register'
                  ? tab === 'STUDENT'
                    ? 'Register as student'
                    : 'Register as faculty'
                  : tab === 'STUDENT'
                    ? 'Student login'
                    : tab === 'FACULTY'
                      ? 'Faculty login'
                      : 'Administrator login'}
              </p>
              <p className="text-sm text-slate-500">
                {tab === 'ADMIN'
                  ? 'Enter your email and password.'
                  : mode === 'register'
                    ? tab === 'STUDENT'
                      ? 'Create your account — then complete the retention profile (dropout model fields) before the dashboard.'
                      : 'Create your account — you will be signed in automatically.'
                    : 'Enter your email and password.'}
              </p>
            </div>

            {error && (
              <div className="flex items-start gap-3 p-3 bg-brand-rose/5 border border-brand-rose/20 rounded-lg">
                <AlertCircle size={16} className="text-brand-rose mt-0.5 shrink-0" />
                <p className="text-sm text-brand-rose font-medium">{error}</p>
              </div>
            )}

            {mode === 'register' && tab !== 'ADMIN' && (
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Full name</label>
                <div className="relative">
                  <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    id="register-name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Jane Doe"
                    required={mode === 'register'}
                    className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-indigo/20 focus:border-brand-indigo transition-all bg-slate-50"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Email</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@university.edu"
                  required
                  className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-indigo/20 focus:border-brand-indigo transition-all bg-slate-50"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  id="login-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-indigo/20 focus:border-brand-indigo transition-all bg-slate-50"
                />
              </div>
            </div>

            {mode === 'register' && tab !== 'ADMIN' && (
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                  {tab === 'STUDENT' ? 'School (required)' : 'Department (optional)'}
                </label>
                <input
                  id="register-dept"
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder={tab === 'STUDENT' ? 'e.g. GP, MS, or your school name' : 'e.g. Computer Science'}
                  required={mode === 'register' && tab === 'STUDENT'}
                  className="w-full px-4 py-3 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-indigo/20 focus:border-brand-indigo transition-all bg-slate-50"
                />
              </div>
            )}

            <button
              id="login-submit"
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-indigo py-3 text-sm font-bold text-white shadow-md transition-all duration-200 ease-out hover:-translate-y-0.5 hover:bg-brand-indigo/90 hover:shadow-lg hover:shadow-brand-indigo/30 active:translate-y-0 active:scale-[0.99] disabled:translate-y-0 disabled:opacity-60 disabled:shadow-md disabled:hover:shadow-md"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  {mode === 'register' ? 'Creating account…' : 'Signing in…'}
                </>
              ) : mode === 'register' ? (
                'Create account'
              ) : (
                'Sign in'
              )}
            </button>

            <p className="text-xs text-center text-slate-400">
              {mode === 'login' && tab !== 'ADMIN' ? (
                <>
                  New here?{' '}
                  <button
                    type="button"
                    className="font-semibold text-brand-indigo hover:underline"
                    onClick={() => {
                      setMode('register');
                      setError('');
                    }}
                  >
                    Create an account
                  </button>
                </>
              ) : mode === 'login' ? null : (
                <>
                  Already have an account?{' '}
                  <button
                    type="button"
                    className="font-semibold text-brand-indigo hover:underline"
                    onClick={() => {
                      setMode('login');
                      setError('');
                    }}
                  >
                    Sign in
                  </button>
                </>
              )}
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
