import React, { useState } from 'react';
import { Brain, Ship, ArrowRight, UserPlus, Info, Check, Shield } from 'lucide-react';
import { GlassCard } from '../components/GlassCard';
import { useToast } from '../components/NotificationToast';
import { predictionsApi } from '../utils/api';

interface PredictionCenterProps {
  onNavigateToEAI: (predictionData: any) => void;
}

export const PredictionCenter: React.FC<PredictionCenterProps> = ({ onNavigateToEAI }) => {
  const [name, setName] = useState('Rose DeWitt');
  const [pclass, setPclass] = useState(1);
  const [sex, setSex] = useState('female');
  const [age, setAge] = useState(22);
  const [sibsp, setSibsp] = useState(0);
  const [parch, setParch] = useState(0);
  const [fare, setFare] = useState(72.5);
  const [embarked, setEmbarked] = useState('C');
  
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const { showToast } = useToast();

  const handlePredict = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await predictionsApi.predictSingle({
        name,
        pclass,
        sex,
        age,
        sibsp,
        parch,
        fare,
        embarked
      });
      setResult(res);
      showToast('Survival intelligence computed successfully!', 'success');
    } catch (err: any) {
      showToast(err.response?.data?.detail || 'Inference engine error.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const getCombinedProb = () => {
    if (!result) return 0;
    return (result.survived_prob_rf + result.survived_prob_xgb) / 2;
  };

  return (
    <div className="space-y-8 p-6 max-w-7xl mx-auto animate-fade-in">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
          Inference Engine
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
          Perform a single passenger survival prediction with real-time model variance scores and SHAP values.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Input Parameters Form */}
        <div className="lg:col-span-7">
          <GlassCard className="p-6 border-white/5">
            <h3 className="text-md font-bold text-slate-800 dark:text-white border-b dark:border-white/5 border-slate-200 pb-3 mb-6 flex items-center gap-2">
              <Brain className="w-5 h-5 text-indigo-500" /> Passenger Parameters
            </h3>
            
            <form onSubmit={handlePredict} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">Passenger Name</label>
                  <input 
                    type="text" 
                    value={name} 
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl text-sm border dark:border-white/10 dark:bg-slate-950/40 text-slate-800 dark:text-white focus:border-indigo-500/50 outline-none transition-all duration-200"
                    placeholder="E.g. Rose Bukater"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">Ticket Class (Pclass)</label>
                  <select 
                    value={pclass} 
                    onChange={(e) => setPclass(Number(e.target.value))}
                    className="w-full px-4 py-3 rounded-xl text-sm border dark:border-white/10 dark:bg-slate-950/40 text-slate-800 dark:text-white focus:border-indigo-500/50 outline-none transition-all duration-200"
                  >
                    <option value={1}>First Class (Luxury Upper Deck)</option>
                    <option value={2}>Second Class (Middle Deck)</option>
                    <option value={3}>Third Class (Standard Lower Deck)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">Gender</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setSex('female')}
                      className={`py-3 rounded-xl border text-sm font-semibold transition-all duration-200
                        ${sex === 'female' 
                          ? 'border-indigo-500/30 bg-indigo-500/10 text-indigo-600 dark:text-cyan-400' 
                          : 'border-slate-200 dark:border-white/5 hover:bg-slate-100 dark:hover:bg-white/5 text-slate-500'}`}
                    >
                      Female
                    </button>
                    <button
                      type="button"
                      onClick={() => setSex('male')}
                      className={`py-3 rounded-xl border text-sm font-semibold transition-all duration-200
                        ${sex === 'male' 
                          ? 'border-indigo-500/30 bg-indigo-500/10 text-indigo-600 dark:text-cyan-400' 
                          : 'border-slate-200 dark:border-white/5 hover:bg-slate-100 dark:hover:bg-white/5 text-slate-500'}`}
                    >
                      Male
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">Embarkation Port</label>
                  <select 
                    value={embarked} 
                    onChange={(e) => setEmbarked(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl text-sm border dark:border-white/10 dark:bg-slate-950/40 text-slate-800 dark:text-white focus:border-indigo-500/50 outline-none transition-all duration-200"
                  >
                    <option value="S">Southampton (UK)</option>
                    <option value="C">Cherbourg (France)</option>
                    <option value="Q">Queenstown (Ireland)</option>
                  </select>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Passenger Age: {age} yrs</label>
                </div>
                <input 
                  type="range" 
                  min="0.5" 
                  max="80" 
                  step="0.5"
                  value={age} 
                  onChange={(e) => setAge(Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 dark:bg-slate-850 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">Siblings & Spouses</label>
                  <select 
                    value={sibsp} 
                    onChange={(e) => setSibsp(Number(e.target.value))}
                    className="w-full px-4 py-3 rounded-xl text-sm border dark:border-white/10 dark:bg-slate-950/40 text-slate-800 dark:text-white focus:border-indigo-500/50 outline-none transition-all duration-200"
                  >
                    {[0,1,2,3,4,5,8].map((n) => (
                      <option key={n} value={n}>{n} family members</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">Parents & Children</label>
                  <select 
                    value={parch} 
                    onChange={(e) => setParch(Number(e.target.value))}
                    className="w-full px-4 py-3 rounded-xl text-sm border dark:border-white/10 dark:bg-slate-950/40 text-slate-800 dark:text-white focus:border-indigo-500/50 outline-none transition-all duration-200"
                  >
                    {[0,1,2,3,4,5,6].map((n) => (
                      <option key={n} value={n}>{n} family members</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 font-sans">Ticket Fare: ${fare.toFixed(2)}</label>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="350" 
                  step="1"
                  value={fare} 
                  onChange={(e) => setFare(Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 dark:bg-slate-850 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-bold text-sm shadow-lg shadow-indigo-500/10 hover:shadow-indigo-500/25 transition-all duration-300 flex items-center justify-center gap-2"
              >
                <span>{loading ? 'Evaluating Passenger Factors...' : 'Run Survival Assessment'}</span>
                {!loading && <ArrowRight className="w-4 h-4" />}
              </button>
            </form>
          </GlassCard>
        </div>

        {/* Prediction Output / Dashboard Gauge */}
        <div className="lg:col-span-5 h-full">
          {result ? (
            <GlassCard className="p-8 border-white/5 flex flex-col items-center justify-between text-center relative overflow-hidden animate-fade-in h-full">
              {/* Glow filter backdrop */}
              <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full blur-[100px] opacity-15 pointer-events-none ${result.predicted_survived ? 'bg-emerald-500' : 'bg-rose-500'}`} />

              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Survival Estimation</span>
                <h4 className="text-xl font-extrabold text-slate-800 dark:text-white mt-1.5">{result.name}</h4>
              </div>

              {/* Speedometer Ring representation */}
              <div className="relative my-10 flex items-center justify-center w-52 h-52">
                <svg className="w-full h-full transform -rotate-90">
                  {/* Gauge background track */}
                  <circle
                    cx="104"
                    cy="104"
                    r="84"
                    strokeWidth="10"
                    stroke="rgba(148, 163, 184, 0.1)"
                    fill="transparent"
                  />
                  {/* Gauge active path */}
                  <circle
                    cx="104"
                    cy="104"
                    r="84"
                    strokeWidth="10"
                    stroke={result.predicted_survived ? '#10b981' : '#f43f5e'}
                    strokeDasharray={2 * Math.PI * 84}
                    strokeDashoffset={2 * Math.PI * 84 * (1 - getCombinedProb())}
                    strokeLinecap="round"
                    fill="transparent"
                    className="transition-all duration-1000 ease-out"
                  />
                </svg>
                {/* Speedometer text */}
                <div className="absolute text-center">
                  <span className="text-4xl font-black text-slate-800 dark:text-white font-sans tracking-tight">
                    {(getCombinedProb() * 100).toFixed(0)}%
                  </span>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold block uppercase mt-0.5">Probability</span>
                </div>
              </div>

              {/* Prediction Badge */}
              <div className="space-y-4 w-full">
                <div className={`inline-flex px-6 py-2.5 rounded-full font-bold text-xs uppercase tracking-widest border border-white/5 
                  ${result.predicted_survived 
                    ? 'text-emerald-500 bg-emerald-500/10 shadow-lg shadow-emerald-500/5' 
                    : 'text-rose-500 bg-rose-500/10 shadow-lg shadow-rose-500/5'}`}
                >
                  {result.predicted_survived ? 'Predicted Survived' : 'Predicted Perished'}
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs font-semibold py-4 border-y dark:border-white/5 border-slate-200/50">
                  <div className="border-r dark:border-white/5 border-slate-200/50">
                    <span className="text-slate-400 block mb-0.5">Random Forest</span>
                    <span className="text-slate-800 dark:text-slate-200 font-bold text-sm">{(result.survived_prob_rf * 100).toFixed(0)}%</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">XGBoost Ensemble</span>
                    <span className="text-slate-800 dark:text-slate-200 font-bold text-sm">{(result.survived_prob_xgb * 100).toFixed(0)}%</span>
                  </div>
                </div>

                <button 
                  onClick={() => onNavigateToEAI(result)}
                  className="w-full text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors flex items-center justify-center gap-1.5 mt-2"
                >
                  <span>View Full Explainable AI (XAI) Analysis</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </GlassCard>
          ) : (
            <GlassCard className="p-8 border-white/5 flex flex-col items-center justify-center text-center text-slate-400 dark:text-slate-500 h-full border-dashed">
              <div className="p-4 rounded-full bg-slate-100 dark:bg-slate-900/60 text-slate-400 dark:text-slate-600 mb-4 border border-dashed dark:border-white/5 border-slate-200">
                <Brain className="w-10 h-10 animate-pulse" />
              </div>
              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-300">Survival Report Sandbox</h4>
              <p className="text-xs text-slate-400 max-w-[280px] mt-1.5 leading-relaxed">
                Adjust the passenger factors on the left and run the assessment model to populate the diagnostic reports.
              </p>
            </GlassCard>
          )}
        </div>
      </div>
    </div>
  );
};
