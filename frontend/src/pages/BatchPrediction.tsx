import React, { useState, useRef } from 'react';
import { UploadCloud, FileText, Download, CheckCircle, AlertOctagon, HelpCircle } from 'lucide-react';
import { GlassCard } from '../components/GlassCard';
import { useToast } from '../components/NotificationToast';
import { predictionsApi } from '../utils/api';

export const BatchPrediction: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<'idle' | 'uploading' | 'completed' | 'failed'>('idle');
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { showToast } = useToast();

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.name.endsWith('.csv')) {
      setFile(droppedFile);
      setStatus('idle');
    } else {
      showToast('Only CSV files are supported.', 'error');
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setStatus('idle');
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setStatus('uploading');
    setProgress(20);
    
    // Simulate upload timer transitions
    const interval = setInterval(() => {
      setProgress((prev) => (prev >= 90 ? 90 : prev + 15));
    }, 300);

    try {
      const res = await predictionsApi.predictBatch(file);
      clearInterval(interval);
      setProgress(100);
      setStatus('completed');
      setResults(res.predictions || []);
      showToast(`Successfully evaluated ${res.total_rows} passenger rows!`, 'success');
    } catch (err: any) {
      clearInterval(interval);
      setStatus('failed');
      const msg = err.response?.data?.detail || 'CSV upload evaluation failed.';
      showToast(msg, 'error');
    }
  };

  // Helper to trigger download of a sample CSV template so users have clean mock data
  const downloadCSVTemplate = () => {
    const headers = 'pclass,name,sex,age,sibsp,parch,fare,embarked\n';
    const sampleRows = 
      '1,Rose DeWitt Bukater,female,17,0,1,150.0,S\n' +
      '3,Jack Dawson,male,20,0,0,7.25,S\n' +
      '1,John Jacob Astor,male,47,1,0,227.5,C\n' +
      '3,Kate Connolly,female,22,0,0,7.75,Q\n';
    
    const blob = new Blob([headers + sampleRows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'titanic_batch_prediction_template.csv';
    link.click();
    URL.revokeObjectURL(url);
    showToast('Batch prediction CSV template downloaded.', 'success');
  };

  // Export results to CSV client-side
  const exportBatchResults = () => {
    if (results.length === 0) return;
    const headers = 'name,pclass,sex,age,fare,probability,survived\n';
    const rows = results.map(r => 
      `"${r.name}",${r.pclass},${r.sex},${r.age},${r.fare},${r.probability},${r.survived}`
    ).join('\n');

    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `batch_prediction_results_${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    showToast('Batch prediction results exported.', 'success');
  };

  return (
    <div className="space-y-8 p-6 max-w-7xl mx-auto animate-fade-in">
      <div className="flex justify-between items-start flex-col md:flex-row gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Batch Prediction Portal
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Evaluate hundreds of passenger parameters simultaneously by uploading a CSV dataset.
          </p>
        </div>
        
        <button
          onClick={downloadCSVTemplate}
          className="px-4 py-2.5 rounded-xl border dark:border-white/5 border-slate-200/80 bg-slate-100 dark:bg-white/5 text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1.5"
        >
          <Download className="w-3.5 h-3.5" /> Download CSV Template
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Upload Panel */}
        <div className="lg:col-span-4">
          <GlassCard className="p-6 border-white/5">
            <h3 className="text-md font-bold text-slate-800 dark:text-white border-b dark:border-white/5 border-slate-200 pb-3 mb-6">
              File Uploader
            </h3>
            
            <div 
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="border border-dashed dark:border-white/10 border-slate-200 hover:border-indigo-500/50 hover:bg-indigo-500/5 dark:hover:bg-white/5 transition-all duration-300 rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer min-h-[220px]"
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileSelect}
                accept=".csv"
                className="hidden" 
              />
              
              <UploadCloud className="w-10 h-10 text-slate-400 mb-3 animate-bounce" />
              <span className="text-sm font-semibold text-slate-800 dark:text-slate-300">
                {file ? file.name : 'Select or drop CSV here'}
              </span>
              <span className="text-xs text-slate-400 mt-1">Maximum size: 5MB</span>
            </div>

            {file && (
              <div className="mt-6 space-y-4">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-100 dark:bg-white/5 border dark:border-white/5 border-slate-200/50">
                  <FileText className="w-5 h-5 text-indigo-500 flex-shrink-0" />
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{file.name}</span>
                    <span className="text-[10px] text-slate-400 font-medium">{(file.size / 1024).toFixed(1)} KB</span>
                  </div>
                </div>

                {status === 'uploading' && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs text-slate-400 font-semibold">
                      <span>Analyzing features...</span>
                      <span>{progress}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-indigo-500 to-cyan-500 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
                    </div>
                  </div>
                )}

                {status === 'completed' && (
                  <div className="flex items-center gap-2 text-xs font-semibold text-emerald-500">
                    <CheckCircle className="w-4 h-4" /> Assessment metrics processed.
                  </div>
                )}

                {status === 'failed' && (
                  <div className="flex items-center gap-2 text-xs font-semibold text-rose-500">
                    <AlertOctagon className="w-4 h-4" /> Processing failed.
                  </div>
                )}

                {status !== 'uploading' && (
                  <button
                    onClick={handleUpload}
                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-indigo-500/10 hover:shadow-indigo-500/25 transition-all duration-300"
                  >
                    Run Batch Inference
                  </button>
                )}
              </div>
            )}
          </GlassCard>
        </div>

        {/* Results Data Table */}
        <div className="lg:col-span-8">
          {results.length > 0 ? (
            <GlassCard className="p-6 border-white/5">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-md font-bold text-slate-800 dark:text-white">Batch Assessment Preview</h3>
                
                <button
                  onClick={exportBatchResults}
                  className="px-4 py-2 rounded-xl bg-indigo-500/15 border border-indigo-500/20 text-xs font-bold text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/25 transition-all duration-200 flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" /> Export Results CSV
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b dark:border-white/5 border-slate-200/80 text-xs uppercase font-bold text-slate-400 tracking-wider">
                      <th className="py-3 px-4">Passenger Name</th>
                      <th className="py-3 px-4">Class</th>
                      <th className="py-3 px-4">Gender</th>
                      <th className="py-3 px-4">Age</th>
                      <th className="py-3 px-4">Probability</th>
                      <th className="py-3 px-4 text-right">Result</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y dark:divide-white/5 divide-slate-200/50">
                    {results.map((r, i) => (
                      <tr key={i} className="text-sm hover:bg-slate-100/30 dark:hover:bg-white/5 transition-colors">
                        <td className="py-3.5 px-4 font-semibold text-slate-800 dark:text-slate-200">{r.name}</td>
                        <td className="py-3.5 px-4 text-slate-500">Class {r.pclass}</td>
                        <td className="py-3.5 px-4 text-slate-500 capitalize">{r.sex}</td>
                        <td className="py-3.5 px-4 text-slate-500">{r.age.toFixed(0)}</td>
                        <td className="py-3.5 px-4 font-bold text-slate-800 dark:text-slate-300">{(r.probability * 100).toFixed(0)}%</td>
                        <td className="py-3.5 px-4 text-right">
                          <span className={`inline-flex px-2.5 py-1 rounded-full font-bold text-[10px] uppercase tracking-wider
                            ${r.survived ? 'text-emerald-500 bg-emerald-500/10' : 'text-rose-500 bg-rose-500/10'}`}
                          >
                            {r.survived ? 'Survived' : 'Perished'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </GlassCard>
          ) : (
            <GlassCard className="p-12 border-white/5 border-dashed flex flex-col items-center justify-center text-center text-slate-400 dark:text-slate-500 min-h-[300px]">
              <div className="p-4 rounded-full bg-slate-100 dark:bg-slate-900/60 text-slate-400 dark:text-slate-600 mb-4 border border-dashed dark:border-white/5 border-slate-200">
                <FileText className="w-8 h-8" />
              </div>
              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-300">Batch Assessment Output</h4>
              <p className="text-xs text-slate-400 max-w-[320px] mt-1.5 leading-relaxed">
                Provide a comma-separated values (CSV) file containing passenger lists to parse results and export models data.
              </p>
            </GlassCard>
          )}
        </div>
      </div>
    </div>
  );
};
