import React, { useState } from 'react';
import { Mail, Lock, User, Eye, EyeOff, Ship, ArrowLeft, ArrowRight } from 'lucide-react';
import { GlassCard } from '../components/GlassCard';
import { useToast } from '../components/NotificationToast';
import { authApi } from '../utils/api';

interface LoginProps {
  onAuthSuccess: (user: any, token: string) => void;
  onBack: () => void;
}

type AuthMode = 'login' | 'register' | 'forgot';

export const Login: React.FC<LoginProps> = ({ onAuthSuccess, onBack }) => {
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { showToast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      showToast('Email is required', 'warning');
      return;
    }
    if (mode !== 'forgot' && !password) {
      showToast('Password is required', 'warning');
      return;
    }
    if (mode === 'register' && !fullName) {
      showToast('Full name is required', 'warning');
      return;
    }

    setIsLoading(true);
    try {
      if (mode === 'login') {
        const res = await authApi.login({ email, password });
        localStorage.setItem('titanic_auth_token', res.access_token);
        localStorage.setItem('titanic_user', JSON.stringify(res.user));
        showToast(`Welcome back, ${res.user.full_name || 'User'}!`, 'success');
        onAuthSuccess(res.user, res.access_token);
      } else if (mode === 'register') {
        const res = await authApi.register({ email, password, full_name: fullName });
        localStorage.setItem('titanic_auth_token', res.access_token);
        localStorage.setItem('titanic_user', JSON.stringify(res.user));
        showToast('Registration successful! Welcome to the suite.', 'success');
        onAuthSuccess(res.user, res.access_token);
      } else if (mode === 'forgot') {
        await authApi.forgotPassword(email);
        showToast('Reset directions dispatched successfully!', 'success');
        setMode('login');
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.detail || 'Authentication operation failed.';
      showToast(errorMsg, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6 relative">
      {/* Background Orbs */}
      <div className="absolute top-1/4 left-1/4 w-80 h-80 rounded-full bg-indigo-500/10 blur-[100px] animate-pulse-slow" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-cyan-500/10 blur-[100px] animate-pulse-slow" style={{ animationDelay: '3s' }} />

      <div className="max-w-md w-full relative z-10">
        {/* Back Button */}
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-slate-400 hover:text-white mb-8 text-sm transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Landing Page
        </button>

        <div className="text-center mb-8">
          <div className="inline-flex p-3 rounded-2xl bg-gradient-to-tr from-indigo-500 to-cyan-500 text-white shadow-lg shadow-indigo-500/10 mb-4">
            <Ship className="w-7 h-7" />
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight text-white font-sans">
            {mode === 'login' && 'Sign In to Titanic Suite'}
            {mode === 'register' && 'Create Intelligence Account'}
            {mode === 'forgot' && 'Reset Access Password'}
          </h2>
          <p className="text-slate-400 text-xs mt-1.5 leading-relaxed">
            {mode === 'login' && 'Enter credentials to access model metrics and analytics.'}
            {mode === 'register' && 'Sign up to register predictions and generate reports.'}
            {mode === 'forgot' && 'Provide your registered email address for reset instructions.'}
          </p>
        </div>

        <GlassCard className="p-8 border-white/5 dark:bg-slate-900/40">
          <form onSubmit={handleSubmit} className="space-y-5">
            {mode === 'register' && (
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    required
                    placeholder="Rose Bukater"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-white/10 bg-slate-950/40 text-sm focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 outline-none transition-all duration-200"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
                <input
                  type="email"
                  required
                  placeholder="analyst@titanic.ai"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-white/10 bg-slate-950/40 text-sm focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 outline-none transition-all duration-200"
                />
              </div>
            </div>

            {mode !== 'forgot' && (
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">Password</label>
                  {mode === 'login' && (
                    <button 
                      type="button"
                      onClick={() => setMode('forgot')}
                      className="text-xs text-indigo-400 hover:text-indigo-300 font-medium"
                    >
                      Forgot?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-3 rounded-xl border border-white/10 bg-slate-950/40 text-sm focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 outline-none transition-all duration-200"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3.5 text-slate-500 hover:text-slate-300"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-semibold text-sm shadow-lg shadow-indigo-500/10 hover:shadow-indigo-500/20 disabled:opacity-50 transition-all duration-300 flex items-center justify-center gap-2"
            >
              <span>{isLoading ? 'Processing...' : (mode === 'login' ? 'Sign In' : mode === 'register' ? 'Register Account' : 'Send Instructions')}</span>
              {!isLoading && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>

          {/* Mode Switchers */}
          <div className="mt-6 text-center border-t border-white/5 pt-6 text-xs text-slate-400">
            {mode === 'login' && (
              <span>
                Don't have an account?{' '}
                <button onClick={() => setMode('register')} className="text-indigo-400 hover:text-indigo-300 font-bold">
                  Create one
                </button>
              </span>
            )}
            {mode === 'register' && (
              <span>
                Already have an account?{' '}
                <button onClick={() => setMode('login')} className="text-indigo-400 hover:text-indigo-300 font-bold">
                  Sign In
                </button>
              </span>
            )}
            {mode === 'forgot' && (
              <button onClick={() => setMode('login')} className="text-indigo-400 hover:text-indigo-300 font-bold">
                Return to Sign In
              </button>
            )}
          </div>
        </GlassCard>
      </div>
    </div>
  );
};
