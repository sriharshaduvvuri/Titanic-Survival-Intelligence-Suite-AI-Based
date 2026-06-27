import React, { useState } from 'react';
import { User, Shield, Moon, Sun, Languages, BrainCircuit, Save, Lock } from 'lucide-react';
import { GlassCard } from '../components/GlassCard';
import { useToast } from '../components/NotificationToast';
import { authApi } from '../utils/api';

interface SettingsProps {
  user: any;
  onUpdateUser: (updatedUser: any) => void;
  theme: string;
  toggleTheme: () => void;
}

export const Settings: React.FC<SettingsProps> = ({
  user,
  onUpdateUser,
  theme,
  toggleTheme
}) => {
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [language, setLanguage] = useState(user?.language || 'en');
  const [defaultModel, setDefaultModel] = useState('both');
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password && password !== confirmPassword) {
      showToast('Passwords do not match.', 'error');
      return;
    }

    setSaving(true);
    try {
      const payload: any = {
        full_name: fullName,
        language: language
      };
      if (password) {
        payload.password = password;
      }
      
      const updated = await authApi.updateProfile(payload);
      localStorage.setItem('titanic_user', JSON.stringify(updated));
      onUpdateUser(updated);
      setPassword('');
      setConfirmPassword('');
      showToast('Profile configuration updated successfully!', 'success');
    } catch (err: any) {
      showToast(err.response?.data?.detail || 'Failed to save settings.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8 p-6 max-w-4xl mx-auto animate-fade-in">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          System Settings
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
          Adjust profile details, toggle system themes, and select default ML parameters.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        {/* Navigation/Sidebar-like controls */}
        <div className="space-y-3">
          <GlassCard className="p-4 border-white/5 space-y-1">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest p-2">Configurations</div>
            <div className="flex items-center gap-3 p-3 rounded-xl bg-indigo-500/10 text-indigo-500 font-semibold text-sm cursor-pointer border border-indigo-500/10">
              <User className="w-4 h-4" /> Account Settings
            </div>
            <div 
              onClick={toggleTheme}
              className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-100/50 dark:hover:bg-white/5 text-slate-600 dark:text-slate-400 font-semibold text-sm cursor-pointer border border-transparent transition-all"
            >
              <div className="flex items-center gap-3">
                {theme === 'dark' ? <Moon className="w-4 h-4 text-indigo-400" /> : <Sun className="w-4 h-4 text-amber-500" />}
                Theme Options
              </div>
              <span className="text-[10px] uppercase font-bold text-slate-400">{theme}</span>
            </div>
          </GlassCard>
        </div>

        {/* Profile Settings forms */}
        <div className="md:col-span-2 space-y-6">
          <GlassCard className="p-6 border-white/5">
            <h3 className="text-md font-bold text-slate-800 dark:text-white border-b dark:border-white/5 border-slate-200 pb-3 mb-6 flex items-center gap-2">
              <Shield className="w-5 h-5 text-indigo-500" /> Account Security Details
            </h3>

            <form onSubmit={handleSaveProfile} className="space-y-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">Email Address (Read-only)</label>
                <input 
                  type="email" 
                  value={user?.email || ''} 
                  disabled
                  className="w-full px-4 py-3 rounded-xl text-sm border dark:border-white/10 dark:bg-slate-900/10 text-slate-400 outline-none select-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">Display Name</label>
                <input 
                  type="text" 
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  placeholder="Rose Bukater"
                  className="w-full px-4 py-3 rounded-xl text-sm border dark:border-white/10 dark:bg-slate-950/40 text-slate-800 dark:text-white outline-none focus:border-indigo-500/50 transition-all"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">New Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
                    <input 
                      type="password" 
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 rounded-xl text-sm border dark:border-white/10 dark:bg-slate-950/40 text-slate-800 dark:text-white outline-none focus:border-indigo-500/50 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">Confirm Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
                    <input 
                      type="password" 
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 rounded-xl text-sm border dark:border-white/10 dark:bg-slate-950/40 text-slate-800 dark:text-white outline-none focus:border-indigo-500/50 transition-all"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-1">
                    <Languages className="w-3.5 h-3.5 text-indigo-500" /> System Language
                  </label>
                  <select 
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl text-sm border dark:border-white/10 dark:bg-slate-950/40 text-slate-800 dark:text-white outline-none focus:border-indigo-500/50 transition-all"
                  >
                    <option value="en">English (US)</option>
                    <option value="es">Español (ES)</option>
                    <option value="fr">Français (FR)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-1">
                    <BrainCircuit className="w-3.5 h-3.5 text-indigo-500" /> Inference Estimator
                  </label>
                  <select 
                    value={defaultModel}
                    onChange={(e) => setDefaultModel(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl text-sm border dark:border-white/10 dark:bg-slate-950/40 text-slate-800 dark:text-white outline-none focus:border-indigo-500/50 transition-all"
                  >
                    <option value="both">Average RF & XGBoost (Recommended)</option>
                    <option value="rf">Random Forest Classifier Only</option>
                    <option value="xgb">XGBoost Ensemble Classifier Only</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-bold text-xs uppercase tracking-wider disabled:opacity-50 transition-all duration-300 flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? 'Saving...' : 'Save Configuration'}</span>
              </button>
            </form>
          </GlassCard>
        </div>
      </div>
    </div>
  );
};
