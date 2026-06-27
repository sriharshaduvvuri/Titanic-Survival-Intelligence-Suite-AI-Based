import React, { useEffect, useState } from 'react';
import { BarChart4, Filter, Search, Grid, TrendingUp, HelpCircle } from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend 
} from 'recharts';
import { GlassCard } from '../components/GlassCard';
import { useToast } from '../components/NotificationToast';
import { analyticsApi, predictionsApi } from '../utils/api';

export const AnalyticsLab: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const { showToast } = useToast();

  // Filters state
  const [searchName, setSearchName] = useState('');
  const [filterSex, setFilterSex] = useState('all');
  const [filterPclass, setFilterPclass] = useState('all');
  const [filterEmbarked, setFilterEmbarked] = useState('all');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [analyticsRes, historyRes] = await Promise.all([
          analyticsApi.getAnalytics(),
          predictionsApi.getHistory()
        ]);
        setData(analyticsRes);
        setHistory(historyRes);
      } catch (err) {
        showToast('Error loading Analytics Lab datasets.', 'error');
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
          <span className="text-sm font-semibold text-slate-400">Syncing Analytics Lab...</span>
        </div>
      </div>
    );
  }

  const { embarked_analysis, correlation } = data;

  // Filter local history predictions list
  const filteredHistory = history.filter(item => {
    const matchesName = item.name.toLowerCase().includes(searchName.toLowerCase());
    const matchesSex = filterSex === 'all' || item.sex.toLowerCase() === filterSex.toLowerCase();
    const matchesClass = filterPclass === 'all' || item.pclass.toString() === filterPclass;
    const matchesEmbarked = filterEmbarked === 'all' || item.embarked.toUpperCase() === filterEmbarked.toUpperCase();
    return matchesName && matchesSex && matchesClass && matchesEmbarked;
  });

  // Unique features array for our correlation heatmap
  const featuresList = ['Pclass', 'Sex', 'Age', 'SibSp', 'Parch', 'Fare', 'Survived'];
  
  // Find correlation value between two features
  const getCorrelationValue = (f1: string, f2: string) => {
    if (f1 === f2) return 1.0;
    const match = correlation.find(
      (c: any) => 
        (c.feature1.toLowerCase() === f1.toLowerCase() && c.feature2.toLowerCase() === f2.toLowerCase()) ||
        (c.feature1.toLowerCase() === f2.toLowerCase() && c.feature2.toLowerCase() === f1.toLowerCase())
    );
    return match ? match.value : 0.0;
  };

  // Helper to determine background color strength for correlation heatmap cells
  const getHeatmapColor = (val: number) => {
    if (val === 1) return 'bg-indigo-600 text-white font-bold';
    if (val > 0.4) return 'bg-indigo-500/85 text-white font-semibold';
    if (val > 0.1) return 'bg-indigo-500/40 text-indigo-900 dark:text-cyan-200';
    if (val > -0.1) return 'bg-slate-200/50 dark:bg-slate-900/50 text-slate-500';
    if (val > -0.4) return 'bg-rose-500/30 text-rose-900 dark:text-rose-200';
    return 'bg-rose-500/85 text-white font-semibold';
  };

  return (
    <div className="space-y-8 p-6 max-w-7xl mx-auto animate-fade-in">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
          Analytics Lab
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
          Perform multi-variate analysis on demographic parameters and visualize factor dependencies.
        </p>
      </div>

      {/* Analytics controls filters */}
      <GlassCard className="p-6 border-white/5">
        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
          <Filter className="w-4 h-4 text-indigo-500" /> Filter Datasets & Queries
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-3.5 w-4 h-4 text-slate-500" />
            <input 
              type="text"
              placeholder="Search passenger name..."
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border text-xs dark:border-white/10 dark:bg-slate-950/40 text-slate-800 dark:text-white outline-none focus:border-indigo-500/50 transition-all duration-200"
            />
          </div>

          <div>
            <select
              value={filterSex}
              onChange={(e) => setFilterSex(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border text-xs dark:border-white/10 dark:bg-slate-950/40 text-slate-800 dark:text-white outline-none focus:border-indigo-500/50 transition-all duration-200"
            >
              <option value="all">All Genders</option>
              <option value="female">Females</option>
              <option value="male">Males</option>
            </select>
          </div>

          <div>
            <select
              value={filterPclass}
              onChange={(e) => setFilterPclass(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border text-xs dark:border-white/10 dark:bg-slate-950/40 text-slate-800 dark:text-white outline-none focus:border-indigo-500/50 transition-all duration-200"
            >
              <option value="all">All Ticket Classes</option>
              <option value="1">Class 1</option>
              <option value="2">Class 2</option>
              <option value="3">Class 3</option>
            </select>
          </div>

          <div>
            <select
              value={filterEmbarked}
              onChange={(e) => setFilterEmbarked(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border text-xs dark:border-white/10 dark:bg-slate-950/40 text-slate-800 dark:text-white outline-none focus:border-indigo-500/50 transition-all duration-200"
            >
              <option value="all">All Embarkations</option>
              <option value="C">Cherbourg</option>
              <option value="Q">Queenstown</option>
              <option value="S">Southampton</option>
            </select>
          </div>
        </div>
      </GlassCard>

      {/* Correlation Matrix & Embarkation Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Heatmap matrix representation */}
        <div className="lg:col-span-7">
          <GlassCard className="p-6 border-white/5">
            <h3 className="text-md font-bold text-slate-800 dark:text-white border-b dark:border-white/5 border-slate-200 pb-3 mb-6 flex items-center gap-2">
              <Grid className="w-5 h-5 text-indigo-500" /> Factor Correlation Heatmap
            </h3>

            {/* Heatmap container */}
            <div className="overflow-x-auto">
              <div className="min-w-[480px]">
                {/* Header row */}
                <div className="grid grid-cols-8 gap-1.5 mb-1.5 text-center text-[10px] font-bold uppercase tracking-wider text-slate-400 pr-1 pr-1.5">
                  <div className="text-left font-bold pl-2 pt-2">Feature</div>
                  {featuresList.map((f) => (
                    <div key={f} className="p-2 truncate">{f}</div>
                  ))}
                </div>

                {/* Heatmap grid cells */}
                <div className="space-y-1.5">
                  {featuresList.map((f1) => (
                    <div key={f1} className="grid grid-cols-8 gap-1.5 items-center text-center">
                      <div className="text-left text-[11px] font-bold text-slate-600 dark:text-slate-400 truncate pl-2">{f1}</div>
                      {featuresList.map((f2) => {
                        const val = getCorrelationValue(f1, f2);
                        return (
                          <div 
                            key={f2} 
                            className={`p-3 text-xs rounded-xl font-mono transition-all duration-200 hover:scale-105 select-none ${getHeatmapColor(val)}`}
                            title={`Correlation: ${f1} vs ${f2} = ${val}`}
                          >
                            {val === 1.0 ? '1.00' : val.toFixed(2)}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Heatmap Legend */}
            <div className="flex justify-between items-center mt-6 text-[10px] text-slate-500 font-semibold px-2 border-t dark:border-white/5 border-slate-200 pt-4">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded bg-rose-500" /> Strong Negative (-1.00)
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded bg-slate-200 dark:bg-slate-900" /> Neutral (0.00)
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded bg-indigo-600" /> Strong Positive (+1.00)
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Embarkation chart insights */}
        <div className="lg:col-span-5">
          <GlassCard className="p-6 border-white/5">
            <h3 className="text-md font-bold text-slate-800 dark:text-white border-b dark:border-white/5 border-slate-200 pb-3 mb-6 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-indigo-500" /> Embarkation Port Demographics
            </h3>
            
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={embarked_analysis} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.03)" />
                  <XAxis dataKey="category" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <Tooltip formatter={(value) => [`${value} passengers`, 'Count']} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
                  <Bar dataKey="survived" name="Survived" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="perished" name="Perished" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>
        </div>
      </div>

      {/* Filtered history data list preview */}
      <GlassCard className="p-6 border-white/5">
        <h3 className="text-md font-bold text-slate-800 dark:text-white mb-6">Interactive Query Results</h3>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b dark:border-white/5 border-slate-200/80 text-xs uppercase font-bold text-slate-400 tracking-wider">
                <th className="py-3 px-4">Passenger Name</th>
                <th className="py-3 px-4">Class</th>
                <th className="py-3 px-4">Gender</th>
                <th className="py-3 px-4">Age</th>
                <th className="py-3 px-4">Fare</th>
                <th className="py-3 px-4 text-right">Result</th>
              </tr>
            </thead>
            <tbody className="divide-y dark:divide-white/5 divide-slate-200/50">
              {filteredHistory.map((item) => (
                <tr key={item.id} className="text-sm hover:bg-slate-100/30 dark:hover:bg-white/5 transition-colors">
                  <td className="py-3.5 px-4 font-semibold text-slate-800 dark:text-slate-200">{item.name}</td>
                  <td className="py-3.5 px-4 text-slate-500">Class {item.pclass}</td>
                  <td className="py-3.5 px-4 text-slate-500 capitalize">{item.sex}</td>
                  <td className="py-3.5 px-4 text-slate-500">{item.age}</td>
                  <td className="py-3.5 px-4 text-slate-500">${item.fare.toFixed(2)}</td>
                  <td className="py-3.5 px-4 text-right">
                    <span className={`inline-flex px-2.5 py-1 rounded-full font-bold text-[10px] uppercase tracking-wider
                      ${item.predicted_survived ? 'text-emerald-500 bg-emerald-500/10' : 'text-rose-500 bg-rose-500/10'}`}
                    >
                      {item.predicted_survived ? 'Survived' : 'Perished'}
                    </span>
                  </td>
                </tr>
              ))}
              {filteredHistory.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-400 text-sm">
                    No predictions match the active query parameters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  );
};
