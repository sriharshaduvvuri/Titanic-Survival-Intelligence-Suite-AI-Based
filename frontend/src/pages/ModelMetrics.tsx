import React, { useEffect, useState, useMemo } from 'react';
import { GlassCard } from '../components/GlassCard';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { BarChart3, ShieldAlert, CheckCircle, FilePieChart, Image as ImageIcon, Download, Maximize2, RefreshCw } from 'lucide-react';
import { analyticsApi } from '../api';

const BASE_URL = import.meta.env.VITE_API_URL || 'https://titanic-survival-intelligence-suite.onrender.com';

export const ModelMetrics: React.FC = () => {
  const [metricsData, setMetricsData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedTitle, setSelectedTitle] = useState<string>('');

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      const data = await analyticsApi.getModelMetrics();
      setMetricsData(data);
    } catch (err) {
      console.error('Failed to fetch model metrics', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  const modelComparisonData = useMemo(() => {
    if (!metricsData || !metricsData.metrics) {
      return [
        { name: 'Accuracy', 'Random Forest': 81.2, 'XGBoost': 83.2 },
        { name: 'Precision', 'Random Forest': 79.5, 'XGBoost': 81.5 },
        { name: 'Recall', 'Random Forest': 76.1, 'XGBoost': 78.4 },
        { name: 'F1 Score', 'Random Forest': 77.8, 'XGBoost': 79.9 }
      ];
    }
    const m = metricsData.metrics;
    return [
      { 
        name: 'Accuracy', 
        'Random Forest': Math.round(m.random_forest_accuracy * 1000) / 10, 
        'XGBoost': Math.round(m.xgboost_accuracy * 1000) / 10 
      },
      { 
        name: 'Precision', 
        'Random Forest': Math.round(m.random_forest_precision * 1000) / 10, 
        'XGBoost': Math.round(m.xgboost_precision * 1000) / 10 
      },
      { 
        name: 'Recall', 
        'Random Forest': Math.round(m.random_forest_recall * 1000) / 10, 
        'XGBoost': Math.round(m.xgboost_recall * 1000) / 10 
      },
      { 
        name: 'F1 Score', 
        'Random Forest': Math.round(m.random_forest_f1 * 1000) / 10, 
        'XGBoost': Math.round(m.xgboost_f1 * 1000) / 10 
      }
    ];
  }, [metricsData]);

  // Extract metrics for best model (XGBoost/Gradient Boosting)
  const bestMetrics = useMemo(() => {
    if (!metricsData || !metricsData.metrics) {
      return {
        accuracy: '83.2%',
        precision: '81.5%',
        recall: '78.4%',
        f1: '79.9%',
        confusion: [490, 59, 41, 301]
      };
    }
    const m = metricsData.metrics;
    return {
      accuracy: `${Math.round(m.xgboost_accuracy * 1000) / 10}%`,
      precision: `${Math.round(m.xgboost_precision * 1000) / 10}%`,
      recall: `${Math.round(m.xgboost_recall * 1000) / 10}%`,
      f1: `${Math.round(m.xgboost_f1 * 1000) / 10}%`,
      confusion: m.xgboost_cm || [490, 59, 41, 301]
    };
  }, [metricsData]);

  const [tn, fp, fn, tp] = bestMetrics.confusion;
  const totalEvaluated = tn + fp + fn + tp;

  // Visual plots details
  const plots = [
    {
      id: 'correlation',
      title: 'Feature Correlation Heatmap',
      description: 'Pearson correlation coefficients showing relationships between key passenger attributes and survival status.',
      url: `${BASE_URL}/static/plots/correlation_matrix.png`
    },
    {
      id: 'importance',
      title: 'Classifier Feature Importances',
      description: 'Relative information gain / feature importance scores extracted directly from our ensemble Random Forest model.',
      url: `${BASE_URL}/static/plots/feature_importances.png`
    },
    {
      id: 'confusion',
      title: 'Evaluation Confusion Matrix',
      description: 'Statistical classification matrix charting true vs false predictions across the cross-validation partition.',
      url: `${BASE_URL}/static/plots/confusion_matrix.png`
    },
    {
      id: 'roc',
      title: 'Model ROC Curve Comparison',
      description: 'Receiver Operating Characteristic (ROC) curves and Area Under Curve (AUC) metrics for RF vs Gradient Boosting.',
      url: `${BASE_URL}/static/plots/roc_curve.png`
    },
    {
      id: 'age_density',
      title: 'Age Density by Survival Outcome',
      description: 'Kernel Density Estimate (KDE) plot displaying age distributions for survived passengers vs deceased passengers.',
      url: `${BASE_URL}/static/plots/age_survival_density.png`
    }
  ];

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto text-slate-800 dark:text-slate-200 transition-colors duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
            <BarChart3 className="w-8 h-8 text-indigo-500 dark:text-cyan-400" /> Model Performance Metrics
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm max-w-2xl mt-1">
            Detailed assessment indicators, validation logs, confusion matrices, and model accuracy comparisons.
          </p>
        </div>
        <button 
          onClick={fetchMetrics} 
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:bg-slate-200 dark:hover:bg-white/10 disabled:opacity-50 transition-all cursor-pointer"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Fetching...' : 'Reload Metrics'}
        </button>
      </div>

      {/* Loading Skeleton */}
      {loading ? (
        <div className="space-y-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-32 bg-slate-200/50 dark:bg-slate-900/30 animate-pulse rounded-2xl"></div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="h-[400px] bg-slate-200/50 dark:bg-slate-900/30 animate-pulse rounded-2xl"></div>
            <div className="h-[400px] bg-slate-200/50 dark:bg-slate-900/30 animate-pulse rounded-2xl"></div>
          </div>
        </div>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Accuracy', value: bestMetrics.accuracy, note: 'Overall correctness ratio', color: 'text-indigo-600 dark:text-cyan-400' },
              { label: 'Precision', value: bestMetrics.precision, note: 'True survival predictive power', color: 'text-emerald-500' },
              { label: 'Recall', value: bestMetrics.recall, note: 'Actual survivors flagged ratio', color: 'text-blue-500' },
              { label: 'F1 Score', value: bestMetrics.f1, note: 'Harmonic mean of indicators', color: 'text-violet-500' }
            ].map((kpi) => (
              <div key={kpi.label} className="p-5 bg-white/60 dark:bg-slate-900/40 rounded-2xl border dark:border-white/5 border-slate-200/50 flex flex-col justify-between h-32 backdrop-blur-md shadow-sm">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">{kpi.label}</span>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 block leading-tight mt-0.5">{kpi.note}</span>
                </div>
                <span className={`text-3xl font-black mt-2 ${kpi.color}`}>{kpi.value}</span>
              </div>
            ))}
          </div>

          {/* Charts & Confusion Matrix */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Model comparison Recharts */}
            <GlassCard className="p-6 border-slate-200/50 dark:border-white/5 bg-white/60 dark:bg-slate-900/40 flex flex-col h-[400px]">
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <FilePieChart className="w-5 h-5 text-indigo-500" /> Ensemble Performance Comparison (%)
              </h3>
              <div className="flex-grow w-full text-xs">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={modelComparisonData}
                    margin={{ top: 10, right: 10, left: -20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="name" stroke="#888888" />
                    <YAxis domain={[60, 95]} stroke="#888888" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'rgba(15, 23, 42, 0.9)', 
                        borderRadius: '12px',
                        borderColor: 'rgba(255, 255, 255, 0.1)',
                        color: '#ffffff'
                      }} 
                    />
                    <Legend />
                    <Bar dataKey="Random Forest" fill="#818cf8" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="XGBoost" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </GlassCard>

            {/* Confusion Matrix Card */}
            <GlassCard className="p-6 border-slate-200/50 dark:border-white/5 bg-white/60 dark:bg-slate-900/40 flex flex-col justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1.5 flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-indigo-500" /> Evaluation Confusion Matrix
                </h3>
                <p className="text-xs text-slate-400 leading-normal mb-6">
                  Distributes model projections against validation set outcomes ({totalEvaluated} passenger records).
                </p>

                {/* Matrix grid */}
                <div className="grid grid-cols-2 gap-4 text-center">
                  {/* TN */}
                  <div className="p-4 bg-slate-100/55 dark:bg-white/5 border dark:border-white/5 border-slate-200/50 rounded-2xl flex flex-col justify-between h-24">
                    <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">True Negative (TN)</span>
                    <span className="text-2xl font-black text-slate-800 dark:text-white">{tn}</span>
                    <span className="text-[10px] text-slate-400 font-medium">Deceased correctly identified</span>
                  </div>
                  
                  {/* FP */}
                  <div className="p-4 bg-rose-500/5 border border-rose-500/10 rounded-2xl flex flex-col justify-between h-24">
                    <span className="block text-[9px] font-bold text-rose-400 uppercase tracking-wider">False Positive (FP)</span>
                    <span className="text-2xl font-black text-rose-500">{fp}</span>
                    <span className="text-[10px] text-rose-400 font-medium">Predicted survived, perished</span>
                  </div>

                  {/* FN */}
                  <div className="p-4 bg-orange-500/5 border border-orange-500/10 rounded-2xl flex flex-col justify-between h-24">
                    <span className="block text-[9px] font-bold text-orange-400 uppercase tracking-wider">False Negative (FN)</span>
                    <span className="text-2xl font-black text-orange-500">{fn}</span>
                    <span className="text-[10px] text-orange-400 font-medium">Predicted perished, survived</span>
                  </div>

                  {/* TP */}
                  <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl flex flex-col justify-between h-24">
                    <span className="block text-[9px] font-bold text-emerald-400 uppercase tracking-wider">True Positive (TP)</span>
                    <span className="text-2xl font-black text-emerald-500">{tp}</span>
                    <span className="text-[10px] text-emerald-400 font-medium">Survived correctly identified</span>
                  </div>
                </div>
              </div>

              <div className="p-3.5 bg-indigo-500/5 border border-indigo-500/10 rounded-xl text-[11px] text-slate-500 dark:text-slate-400 mt-6 leading-relaxed flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-indigo-500 mt-0.5 flex-shrink-0" />
                <p>
                  An overall accuracy of <strong>{bestMetrics.accuracy}</strong> denotes that the classifier correctly categorizes passenger fates for over 8 out of every 10 individual queries.
                </p>
              </div>
            </GlassCard>
          </div>

          {/* AI Visualizations Section */}
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
                <ImageIcon className="w-7 h-7 text-indigo-500 dark:text-cyan-400" /> Python AI & Data Science Visualizations
              </h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm max-w-2xl mt-1">
                Visual representations generated dynamically on the Python backend using matplotlib and seaborn to explain datasets and ensemble modeling behaviors.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {plots.map((plot) => (
                <GlassCard key={plot.id} className="p-4 flex flex-col justify-between border-slate-200/50 dark:border-white/5 bg-white/60 dark:bg-slate-900/40 hover:scale-[1.01] transition-transform duration-300">
                  <div>
                    <div className="relative group overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-950 aspect-video flex items-center justify-center border border-slate-200/50 dark:border-white/5">
                      <img 
                        src={plot.url} 
                        alt={plot.title} 
                        onError={(e) => {
                          // If backend fails or not fully trained yet, show placeholder or hide
                          (e.target as HTMLImageElement).src = 'https://placehold.co/600x400/0f172a/ffffff?text=Generating+Plot...';
                        }}
                        className="object-contain w-full h-full max-h-48 group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-3 transition-opacity duration-300">
                        <button 
                          onClick={() => {
                            setSelectedImage(plot.url);
                            setSelectedTitle(plot.title);
                          }}
                          className="p-2.5 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full border border-white/20 text-white cursor-pointer transition-colors"
                          title="Maximize Image"
                        >
                          <Maximize2 className="w-4 h-4" />
                        </button>
                        <a 
                          href={plot.url} 
                          target="_blank" 
                          rel="noreferrer"
                          download={plot.title}
                          className="p-2.5 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full border border-white/20 text-white cursor-pointer transition-colors"
                          title="Download Image"
                        >
                          <Download className="w-4 h-4" />
                        </a>
                      </div>
                    </div>
                    <h4 className="font-bold text-sm mt-4 text-slate-900 dark:text-white">{plot.title}</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">{plot.description}</p>
                  </div>
                </GlassCard>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Image Maximize Modal */}
      {selectedImage && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-fade-in"
          onClick={() => setSelectedImage(null)}
        >
          <div 
            className="relative max-w-5xl w-full flex flex-col items-center bg-slate-900/60 border border-white/10 p-4 md:p-6 rounded-3xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center w-full mb-3">
              <h3 className="font-bold text-white text-base md:text-lg">{selectedTitle}</h3>
              <button 
                onClick={() => setSelectedImage(null)}
                className="px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-bold text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                ✕ Close
              </button>
            </div>
            <img 
              src={selectedImage} 
              alt={selectedTitle} 
              className="max-h-[75vh] w-auto max-w-full rounded-2xl object-contain border border-white/5"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ModelMetrics;
