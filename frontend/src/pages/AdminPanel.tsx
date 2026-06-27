import React, { useEffect, useState } from 'react';
import { ShieldAlert, Users, Clock, FileText, Database, ShieldCheck, AreaChart as ChartIcon } from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip 
} from 'recharts';
import { GlassCard } from '../components/GlassCard';
import { useToast } from '../components/NotificationToast';
import { adminApi, apiClient } from '../utils/api';

export const AdminPanel: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'users' | 'logs' | 'files'>('users');
  const { showToast } = useToast();

  const fetchAdminData = async () => {
    try {
      const [statsRes, usersRes] = await Promise.all([
        adminApi.getStats(),
        adminApi.getUsers()
      ]);
      setStats(statsRes);
      setUsers(usersRes);
    } catch (err) {
      showToast('Error loading administrator details.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, [showToast]);

  const handleRoleToggle = async (userId: number, currentRole: string) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    try {
      await adminApi.updateUserRole(userId, newRole);
      showToast(`User role updated to ${newRole}.`, 'success');
      fetchAdminData();
    } catch (err: any) {
      showToast(err.response?.data?.detail || 'Error toggling role.', 'error');
    }
  };

  const handleDownloadBackup = async () => {
    try {
      const res = await apiClient.get('/api/admin/data/export', { responseType: 'blob' });
      const blob = new Blob([res.data], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `titanic_system_backup_${Date.now()}.json`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      showToast('System database JSON backup downloaded.', 'success');
    } catch (err) {
      showToast('Database backup failed. Check administrator session.', 'error');
    }
  };

  if (loading || !stats) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-80px)]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-semibold text-slate-400">Syncing Administration Console...</span>
        </div>
      </div>
    );
  }

  const { total_users, total_predictions, total_files, predictions_over_time, active_logs } = stats;

  return (
    <div className="space-y-8 p-6 max-w-7xl mx-auto animate-fade-in">
      {/* Title */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <ShieldCheck className="w-8 h-8 text-indigo-500" /> Administration Console
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Manage users, review system activity audit trails, and export diagnostic logs.
          </p>
        </div>

        <button
          onClick={handleDownloadBackup}
          className="px-5 py-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-xs font-bold text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/15 transition-all duration-200 flex items-center gap-2"
        >
          <Database className="w-4 h-4" /> Download DB Backup JSON
        </button>
      </div>

      {/* Admin stats timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Core numbers widgets */}
        <div className="lg:col-span-4 space-y-4">
          <GlassCard className="p-5 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400">Total Users</span>
              <p className="text-2xl font-black text-slate-800 dark:text-white mt-0.5">{total_users}</p>
            </div>
            <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-400"><Users className="w-5 h-5" /></div>
          </GlassCard>
          
          <GlassCard className="p-5 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400">Batch Datasets Loaded</span>
              <p className="text-2xl font-black text-slate-800 dark:text-white mt-0.5">{total_files}</p>
            </div>
            <div className="p-3 rounded-xl bg-cyan-500/10 text-cyan-400"><FileText className="w-5 h-5" /></div>
          </GlassCard>

          <GlassCard className="p-5 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400">Active Predictions</span>
              <p className="text-2xl font-black text-slate-800 dark:text-white mt-0.5">{total_predictions}</p>
            </div>
            <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400"><ShieldAlert className="w-5 h-5" /></div>
          </GlassCard>
        </div>

        {/* Prediction volume over time chart */}
        <div className="lg:col-span-8">
          <GlassCard className="p-6 border-white/5">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
              <ChartIcon className="w-4 h-4 text-indigo-500" /> Platform API Usage (Past Week)
            </h3>
            
            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={predictions_over_time} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorPreds" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.03)" />
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
                  <Tooltip />
                  <Area type="monotone" dataKey="predictions" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorPreds)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>
        </div>
      </div>

      {/* Tabs list (Users, Logs) */}
      <GlassCard className="p-6 border-white/5">
        <div className="flex gap-4 border-b dark:border-white/5 border-slate-200 pb-4 mb-6">
          <button
            onClick={() => setActiveTab('users')}
            className={`text-sm font-bold pb-2 transition-all duration-200 border-b-2
              ${activeTab === 'users' ? 'border-indigo-500 text-indigo-600 dark:text-cyan-400' : 'border-transparent text-slate-400'}`}
          >
            Registered Users ({users.length})
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={`text-sm font-bold pb-2 transition-all duration-200 border-b-2
              ${activeTab === 'logs' ? 'border-indigo-500 text-indigo-600 dark:text-cyan-400' : 'border-transparent text-slate-400'}`}
          >
            System Audit Trail ({active_logs.length})
          </button>
        </div>

        {activeTab === 'users' && (
          <div className="overflow-x-auto animate-fade-in">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b dark:border-white/5 border-slate-200 text-xs uppercase font-bold text-slate-400 tracking-wider">
                  <th className="py-3 px-4">Name</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Joined At</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y dark:divide-white/5 divide-slate-200/50">
                {users.map((u) => (
                  <tr key={u.id} className="text-sm hover:bg-slate-100/30 dark:hover:bg-white/5 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-slate-800 dark:text-slate-200">{u.full_name || 'Anonymous User'}</td>
                    <td className="py-3.5 px-4 text-slate-500">{u.email}</td>
                    <td className="py-3.5 px-4">
                      <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider
                        ${u.role === 'admin' ? 'text-indigo-500 bg-indigo-500/10' : 'text-slate-400 bg-slate-500/10'}`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-400">{new Date(u.created_at).toLocaleDateString()}</td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleRoleToggle(u.id, u.role)}
                        className="text-xs text-indigo-400 hover:text-indigo-300 font-bold transition-colors"
                      >
                        Toggle Role
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'logs' && (
          <div className="overflow-x-auto animate-fade-in max-h-[400px] overflow-y-auto pr-1">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b dark:border-white/5 border-slate-200 text-xs uppercase font-bold text-slate-400 tracking-wider">
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Details</th>
                  <th className="py-3 px-4 text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y dark:divide-white/5 divide-slate-200/50">
                {active_logs.map((log: any) => (
                  <tr key={log.id} className="text-sm hover:bg-slate-100/30 dark:hover:bg-white/5 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-slate-800 dark:text-slate-200">{log.user_email || 'System'}</td>
                    <td className="py-3.5 px-4">
                      <span className="text-[10px] px-2 py-0.5 rounded font-mono font-bold uppercase bg-slate-200/60 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border dark:border-white/5 border-slate-200">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 text-xs max-w-xs truncate" title={log.details}>{log.details || 'N/A'}</td>
                    <td className="py-3.5 px-4 text-slate-400 text-xs text-right">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </GlassCard>
    </div>
  );
};
