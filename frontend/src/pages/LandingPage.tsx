import React from 'react';
import { ShieldCheck, Ship, ArrowRight, BrainCircuit, BarChart4, FileText, Activity } from 'lucide-react';
import { GlassCard } from '../components/GlassCard';

interface LandingPageProps {
  onStart: () => void;
  user: any;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onStart, user }) => {
  return (
    <div className="min-h-screen overflow-x-hidden relative bg-slate-950 text-slate-100 flex flex-col justify-between">
      {/* Background Decorative Glowing Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-500/10 blur-[150px] animate-pulse-slow" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-cyan-500/10 blur-[150px] animate-pulse-slow" style={{ animationDelay: '4s' }} />

      {/* Landing Header */}
      <header className="max-w-7xl mx-auto w-full px-6 py-6 flex items-center justify-between border-b border-white/5 relative z-10">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-tr from-indigo-500 to-cyan-500 text-white flex-shrink-0 shadow-lg shadow-indigo-500/15">
            <Ship className="w-5 h-5 animate-pulse" />
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold text-lg leading-tight tracking-tight text-white">
              Titanic Suite
            </span>
            <span className="text-[10px] font-semibold tracking-wider text-cyan-400 uppercase">
              Intelligence
            </span>
          </div>
        </div>
        
        <button
          onClick={onStart}
          className="px-5 py-2.5 rounded-xl border border-white/10 hover:border-indigo-500/30 hover:bg-indigo-500/5 text-sm font-medium transition-all duration-300 flex items-center gap-2"
        >
          <span>{user ? 'Go to App' : 'Sign In'}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto w-full px-6 py-16 md:py-24 relative z-10 flex-grow flex flex-col md:flex-row items-center gap-12">
        <div className="flex-1 text-center md:text-left">
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-xs font-semibold mb-6 uppercase tracking-wider">
            <Activity className="w-3.5 h-3.5" /> Enterprise Machine Learning Platform
          </span>
          <h1 className="text-4xl md:text-6xl font-extrabold font-sans tracking-tight leading-tight text-white mb-6">
            Predict & Analyze <br />
            <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
              Titanic Survival Probabilities
            </span>
          </h1>
          <p className="text-slate-400 text-base md:text-lg max-w-xl leading-relaxed mb-8">
            An advanced dual-classifier intelligence system powered by Random Forest and XGBoost. Perform single-passenger audits, process batch CSV datasets, check Explainable AI (XAI) feature values, and download PDF reports.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center md:justify-start gap-4">
            <button
              onClick={onStart}
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-semibold text-md shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 hover:scale-[1.02] transition-all duration-300 flex items-center justify-center gap-2.5"
            >
              <span>Launch Intelligence App</span>
              <ArrowRight className="w-5 h-5" />
            </button>
            <a
              href="https://github.com/datasciencedojo/datasets/blob/master/titanic.csv"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto px-8 py-4 rounded-xl border border-white/10 hover:border-white/20 hover:bg-white/5 text-slate-300 font-semibold text-md transition-all duration-300 flex items-center justify-center gap-2"
            >
              <span>Dataset Source</span>
            </a>
          </div>
        </div>

        {/* Hero Interactive Widget Representation */}
        <div className="flex-1 w-full max-w-md md:max-w-none">
          <GlassCard className="relative p-8 border-white/10 dark:bg-slate-950/20">
            <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-6">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">ML Model Diagnostics</span>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
            </div>
            
            <div className="space-y-5">
              <div>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="font-semibold text-slate-300">Random Forest Classifier Accuracy</span>
                  <span className="font-bold text-indigo-400">81.6%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-indigo-500 to-cyan-500 rounded-full" style={{ width: '81.6%' }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="font-semibold text-slate-300">XGBoost Ensemble Accuracy</span>
                  <span className="font-bold text-cyan-400">83.1%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-cyan-500 to-teal-400 rounded-full" style={{ width: '83.1%' }} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5">
                <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Baseline Survival</span>
                  <p className="text-xl font-extrabold text-white mt-0.5">38.3%</p>
                </div>
                <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Features Scored</span>
                  <p className="text-xl font-extrabold text-white mt-0.5">7 Factors</p>
                </div>
              </div>
            </div>
          </GlassCard>
        </div>
      </main>

      {/* Features Showcase */}
      <section className="bg-slate-900/30 border-y border-white/5 relative z-10 py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-xl mx-auto mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">Complete Intelligence Suite Features</h2>
            <p className="text-slate-400 text-sm">
              We provide enterprise-grade capabilities to predict, visualize, audit, and export survival metrics.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <GlassCard hoverEffect={true} className="p-6">
              <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-400 w-fit mb-4">
                <BrainCircuit className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Dual ML Classifiers</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Run inputs through both Random Forest and XGBoost estimators simultaneously. Compare variances and probabilities on a combined scale.
              </p>
            </GlassCard>

            <GlassCard hoverEffect={true} className="p-6">
              <div className="p-3 rounded-xl bg-cyan-500/10 text-cyan-400 w-fit mb-4">
                <BarChart4 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Explainable AI (XAI)</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Review local SHAP approximation vectors for every prediction. See exactly how factors like Gender, Age, and Ticket Class alter survival probabilities.
              </p>
            </GlassCard>

            <GlassCard hoverEffect={true} className="p-6">
              <div className="p-3 rounded-xl bg-rose-500/10 text-rose-400 w-fit mb-4">
                <FileText className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Executive Reports</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Export and stream predictions as clean CSV database records, or compile full analytical summaries inside downloadable PDFs.
              </p>
            </GlassCard>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto w-full px-6 py-8 flex flex-col md:flex-row items-center justify-between border-t border-white/5 text-xs text-slate-500 relative z-10">
        <span>&copy; {new Date().getFullYear()} Titanic Survival Intelligence Suite. All rights reserved.</span>
        <span className="flex items-center gap-1.5 mt-4 md:mt-0">
          <ShieldCheck className="w-4 h-4 text-indigo-500" /> Secure JWT Sandbox Enforcing CORS Policies
        </span>
      </footer>
    </div>
  );
};
