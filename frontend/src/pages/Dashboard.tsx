import React, { useEffect, useState } from 'react';
import { 
  Users, 
  BrainCircuit, 
  Percent, 
  History, 
  ArrowUpRight, 
  Activity, 
  Clock, 
  UserCheck 
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  PieChart, 
  Pie, 
  Cell, 
  AreaChart, 
  Area 
} from 'recharts';
import { StatsWidget } from '../components/StatsWidget';
import { GlassCard } from '../components/GlassCard';
import { useToast } from '../components/NotificationToast';
import { analyticsApi, predictionsApi } from '../utils/api';

export const Dashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const { showToast } = useToast();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [analyticsRes, historyRes] = await Promise.all([
          analyticsApi.getAnalytics(),
          predictionsApi.getHistory()
        ]);
        setData(analyticsRes);
        setHistory(historyRes);
      } catch (err: any) {
        showToast('Error fetching dashboard insights.', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [showToast]);

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-80px)]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-semibold text-slate-400">Compiling Analytics...</span>
        </div>
      </div>
    );
  }

  const { kpis, gender_analysis, class_analysis, age_groups } = data;

  // Format age groups for Recharts
  const ageChartData = Object.entries(age_groups).map(([key, value]: [string, any]) => ({
    name: key.split(' ')[0], // Shorten label
    Survived: value.survived,
    Perished: value.perished,
    Rate: value.rate
  }));

  // Pie chart colors
  const COLORS = ['#6366f1', '#06b6d4', '#f43f5e', '#f59e0b', '#10b981'];

  return (
    <div className="space-y-8 p-6 max-w-7xl mx-auto animate-fade-in">
      {/* Upper Title */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Predictive Analytics Dashboard
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
          Real-time aggregates of Titanic passenger survival estimations.
        </p>
      </div>

      {/* KPI Stats widgets */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatsWidget 
          label="Total System Predictions" 
          value={kpis.total_predictions} 
          trend="+8%" 
          trendType="positive"
          accentColor="indigo"
          icon={<BrainCircuit className="w-6 h-6" />}
        />
        <StatsWidget 
          label="Active Users Logged" 
          value={kpis.active_users} 
          trend="+15%" 
          trendType="positive"
          accentColor="cyan"
          icon={<Users className="w-6 h-6" />}
        />
        <StatsWidget 
          label="Aggregate Model Accuracy" 
          value={`${(kpis.accuracy_score * 100).toFixed(1)}%`} 
          trend="+0.4%" 
          trendType="positive"
          accentColor="emerald"
          icon={<Percent className="w-6 h-6" />}
        />
        <StatsWidget 
          label="Survived Predictions Rate" 
          value={`${kpis.survival_rate.toFixed(1)}%`} 
          trend="-2.1%" 
          trendType="negative"
          accentColor="rose"
          icon={<Activity className="w-6 h-6" />}
        />
      </div>

      {/* Primary Graphs Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Gender Breakdown (BarChart comparing Survived vs Perished) */}
        <GlassCard>
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-md font-bold text-slate-800 dark:text-white flex items-center gap-2">
              Gender Survival Distribution
            </h3>
            <span className="text-xs font-semibold text-indigo-500 dark:text-cyan-400">RF & XGB Probabilities</span>
          </div>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={gender_analysis} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.03)" />
                <XAxis dataKey="category" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                <Tooltip />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
                <Bar dataKey="survived" name="Survived" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="perished" name="Perished" fill="#f43f5e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        {/* Age Groups Analysis */}
        <GlassCard>
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-md font-bold text-slate-800 dark:text-white">
              Age Group Survival Demographics
            </h3>
            <span className="text-xs text-slate-400">Total processed</span>
          </div>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ageChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.03)" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                <Tooltip />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
                <Bar dataKey="Survived" fill="#06b6d4" stackId="a" radius={[0, 0, 0, 0]} />
                <Bar dataKey="Perished" fill="#475569" stackId="a" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>
      </div>

      {/* Secondary Row (Class pie charts & recent activity) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Passenger Class Insights (Pie Donut Chart) */}
        <GlassCard className="col-span-1">
          <h3 className="text-md font-bold text-slate-800 dark:text-white mb-6">Passenger Class Breakdown</h3>
          <div className="h-64 relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={class_analysis}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={85}
                  paddingAngle={5}
                  dataKey="survived"
                  nameKey="category"
                >
                  {class_analysis.map((_entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute text-center">
              <span className="text-xs text-slate-400 font-semibold block uppercase">Total Survival</span>
              <span className="text-2xl font-black text-slate-800 dark:text-white">
                {class_analysis.reduce((sum: number, item: any) => sum + item.survived, 0)}
              </span>
            </div>
          </div>
          <div className="flex justify-center gap-4 flex-wrap mt-2">
            {class_analysis.map((entry: any, index: number) => (
              <div key={entry.category} className="flex items-center gap-1.5 text-xs text-slate-400">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                <span className="font-semibold text-slate-700 dark:text-slate-300">{entry.category}</span>
                <span>({entry.rate}%)</span>
              </div>
            ))}
          </div>
        </GlassCard>

        {/* Recent Activity Logs List */}
        <GlassCard className="col-span-2 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-md font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <History className="w-5 h-5 text-indigo-500" /> Recent Prediction Logs
              </h3>
              <span className="text-xs font-semibold text-indigo-500 dark:text-cyan-400 flex items-center gap-1">
                Active Audit Feed
              </span>
            </div>
            
            <div className="space-y-3.5 max-h-[260px] overflow-y-auto pr-1">
              {history.slice(0, 4).map((item) => (
                <div 
                  key={item.id} 
                  className="p-3.5 rounded-xl border dark:border-white/5 border-slate-200/60 bg-slate-100/30 dark:bg-white/5 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className={`w-2.5 h-2.5 rounded-full ${item.predicted_survived ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                    <div className="flex flex-col overflow-hidden">
                      <span className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">{item.name}</span>
                      <span className="text-xs text-slate-400 font-medium">
                        {item.sex} &bull; Age {item.age} &bull; Class {item.pclass}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <span className="text-sm font-bold text-slate-800 dark:text-white">
                        {(((item.survived_prob_rf + item.survived_prob_xgb) / 2) * 100).toFixed(0)}%
                      </span>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold block uppercase">Prob</span>
                    </div>
                    
                    <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold uppercase ${item.predicted_survived ? 'text-emerald-500 bg-emerald-500/10' : 'text-rose-500 bg-rose-500/10'}`}>
                      {item.predicted_survived ? 'Survived' : 'Perished'}
                    </span>
                  </div>
                </div>
              ))}
              {history.length === 0 && (
                <div className="text-center py-12 text-slate-400 text-sm">
                  <Clock className="w-8 h-8 mx-auto text-slate-500 mb-2 opacity-50" />
                  No predictions processed yet. Use the Prediction Center.
                </div>
              )}
            </div>
          </div>
        </GlassCard>
      </div>
    </div>
  );
};
