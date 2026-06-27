import React, { useState } from 'react';
import { FileText, Download, Copy, Check, Info, FileSpreadsheet, Clipboard } from 'lucide-react';
import { GlassCard } from '../components/GlassCard';
import { useToast } from '../components/NotificationToast';
import { apiClient } from '../utils/api';

export const Reports: React.FC = () => {
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [downloadingCsv, setDownloadingCsv] = useState(false);
  const [copied, setCopied] = useState(false);
  const { showToast } = useToast();

  const handleDownloadPDF = async () => {
    setDownloadingPdf(true);
    try {
      const res = await apiClient.get('/api/reports/pdf', { responseType: 'blob' });
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `titanic_executive_report_${Date.now()}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      showToast('Analytical PDF report downloaded successfully.', 'success');
    } catch (err) {
      showToast('Failed to compile PDF report. Ensure backend is running.', 'error');
    } finally {
      setDownloadingPdf(false);
    }
  };

  const handleDownloadCSV = async () => {
    setDownloadingCsv(true);
    try {
      const res = await apiClient.get('/api/reports/csv', { responseType: 'blob' });
      const blob = new Blob([res.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `titanic_predictions_export_${Date.now()}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      showToast('Predictions CSV database exported successfully.', 'success');
    } catch (err) {
      showToast('Failed to export CSV. Ensure predictions have been generated.', 'error');
    } finally {
      setDownloadingCsv(false);
    }
  };

  const copyMarkdownSnapshot = async () => {
    try {
      const text = 
        `# TITANIC SURVIVAL INTELLIGENCE REPORT\n` +
        `* Generated: ${new Date().toLocaleString()}\n` +
        `* Classifier: Random Forest & XGBoost Ensemble\n` +
        `* Evaluated Parameters: Pclass, Sex, Age, SibSp, Parch, Fare, Embarked\n` +
        `* Combined Model Accuracy: 83.1%\n` +
        `* Survival Baseline Rate: 38.3%\n` +
        `* Primary Survival Factor: Female Gender\n`;
      
      await navigator.clipboard.writeText(text);
      setCopied(true);
      showToast('Markdown snapshot copied to clipboard.', 'success');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      showToast('Failed to copy snapshot.', 'error');
    }
  };

  return (
    <div className="space-y-8 p-6 max-w-7xl mx-auto animate-fade-in">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Reports Center
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
          Generate formal diagnostics, export analytical datasets, and capture system summaries.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* PDF Card */}
        <GlassCard className="p-6 flex flex-col justify-between h-[320px]">
          <div>
            <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-400 w-fit mb-4">
              <FileText className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">Executive PDF Report</h3>
            <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed">
              Compile a formal report summarizing overall model accuracy metrics, active session counts, gender graphs, and passenger prediction snapshots.
            </p>
          </div>
          
          <button
            onClick={handleDownloadPDF}
            disabled={downloadingPdf}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-bold text-xs uppercase tracking-wider disabled:opacity-50 transition-all duration-300 flex items-center justify-center gap-2"
          >
            {downloadingPdf ? 'Compiling PDF...' : 'Download PDF Summary'}
            {!downloadingPdf && <Download className="w-4 h-4" />}
          </button>
        </GlassCard>

        {/* CSV Card */}
        <GlassCard className="p-6 flex flex-col justify-between h-[320px]">
          <div>
            <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 w-fit mb-4">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">Predictions CSV Dataset</h3>
            <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed">
              Export prediction records generated during your active session into standard comma-separated files to perform custom offline Excel evaluations.
            </p>
          </div>
          
          <button
            onClick={handleDownloadCSV}
            disabled={downloadingCsv}
            className="w-full py-3.5 rounded-xl border border-emerald-500/30 hover:bg-emerald-500/5 text-emerald-500 font-bold text-xs uppercase tracking-wider disabled:opacity-50 transition-all duration-300 flex items-center justify-center gap-2"
          >
            {downloadingCsv ? 'Exporting CSV...' : 'Download CSV Dataset'}
            {!downloadingCsv && <Download className="w-4 h-4" />}
          </button>
        </GlassCard>

        {/* Snapshot Card */}
        <GlassCard className="p-6 flex flex-col justify-between h-[320px]">
          <div>
            <div className="p-3 rounded-xl bg-cyan-500/10 text-cyan-400 w-fit mb-4">
              <Clipboard className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">Diagnostics Snapshot</h3>
            <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed">
              Generate a formatted Markdown snapshot containing active model stats, baseline survival probabilities, and primary weight vectors.
            </p>
          </div>
          
          <button
            onClick={copyMarkdownSnapshot}
            className="w-full py-3.5 rounded-xl border border-cyan-500/30 hover:bg-cyan-500/5 text-cyan-400 font-bold text-xs uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-2"
          >
            {copied ? 'Snapshot Copied!' : 'Copy Markdown Snapshot'}
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          </button>
        </GlassCard>
      </div>

      {/* Info Warning Alert */}
      <div className="flex items-start gap-3 p-4 rounded-xl border dark:border-white/5 border-slate-200 bg-slate-100 dark:bg-white/5 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
        <Info className="w-4 h-4 text-indigo-500 flex-shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-slate-800 dark:text-slate-300 block mb-0.5">Report Compilation Notice:</span>
          Reports are dynamically generated on the FastAPI backend based on prediction records registered inside the SQLite database. Ensure you perform a few predictions to populate the graphs and diagnostic fields.
        </div>
      </div>
    </div>
  );
};
