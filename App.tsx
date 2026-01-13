
import React, { useState, useRef } from 'react';
import { Layout } from './components/Layout';
import { processCandidate } from './geminiService';
import { AppState, CandidateResult } from './types';
import ReactMarkdown from 'https://esm.sh/react-markdown@9';

// Declare globals for libraries loaded via script tags
declare const pdfjsLib: any;
declare const mammoth: any;

const App: React.FC = () => {
  const [state, setState] = useState<AppState>({
    files: [],
    jobDescriptionText: '',
    isProcessing: false,
    results: [],
    error: null,
  });
  
  const [selectedResult, setSelectedResult] = useState<CandidateResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setState(prev => ({ ...prev, files: Array.from(e.target.files || []) }));
    }
  };

  const extractTextFromFile = async (file: File): Promise<string> => {
    const extension = file.name.split('.').pop()?.toLowerCase();

    if (extension === 'pdf') {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let fullText = '';
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map((item: any) => item.str).join(' ');
        fullText += pageText + '\n';
      }
      return fullText;
    } 
    
    if (extension === 'docx') {
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });
      return result.value;
    }

    // Default to plain text for .txt, .md, etc.
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsText(file);
    });
  };

  const handleBatchProcess = async () => {
    const validFiles = state.files.filter(f => f.name.match(/\.(txt|md|text|pdf|docx)$/i));
    
    if (validFiles.length === 0) {
      setState(prev => ({ ...prev, error: 'Please select a folder or files containing resumes (PDF, DOCX, TXT, MD).' }));
      return;
    }
    if (!state.jobDescriptionText.trim()) {
      setState(prev => ({ ...prev, error: 'Job Description is required for ranking.' }));
      return;
    }

    setState(prev => ({ ...prev, isProcessing: true, error: null, results: [] }));
    setSelectedResult(null);

    const processedResults: CandidateResult[] = [];

    try {
      for (const file of validFiles) {
        try {
          const text = await extractTextFromFile(file);
          if (!text.trim()) continue;

          const data = await processCandidate(text, state.jobDescriptionText);
          
          processedResults.push({
            fileName: file.name,
            markdown: data.profileMarkdown,
            score: data.score,
            name: data.name,
            currentRole: data.currentRole,
            originalFile: file
          });
          
          // Update UI progressively and sort by best score
          setState(prev => ({ 
            ...prev, 
            results: [...processedResults].sort((a, b) => b.score - a.score) 
          }));
        } catch (fileErr) {
          console.error(`Error processing ${file.name}:`, fileErr);
        }
      }
    } catch (err: any) {
      setState(prev => ({ ...prev, error: `Batch processing failed: ${err.message}` }));
    } finally {
      setState(prev => ({ ...prev, isProcessing: false }));
    }
  };

  const openOriginalResume = (file: File) => {
    const url = URL.createObjectURL(file);
    window.open(url, '_blank');
    // Cleanup URL after some time to prevent memory leaks
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  };

  return (
    <Layout>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Sidebar: Configuration & List */}
        <aside className="lg:col-span-4 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl space-y-6">
            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Pipeline Setup</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">1. Target Job Description</label>
                <textarea
                  value={state.jobDescriptionText}
                  onChange={(e) => setState(prev => ({ ...prev, jobDescriptionText: e.target.value }))}
                  placeholder="Paste the JD here to set ranking criteria..."
                  className="w-full h-32 bg-slate-950 border border-slate-700 rounded-lg p-3 text-sm text-slate-300 focus:ring-1 focus:ring-indigo-500 outline-none resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">2. Resume Batch (Folder)</label>
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-700 rounded-lg p-4 text-center cursor-pointer hover:border-indigo-500 transition-colors bg-slate-950/50"
                >
                  <input 
                    type="file" 
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden" 
                    multiple
                    //@ts-ignore - support folder upload
                    webkitdirectory="true"
                  />
                  <svg className="w-8 h-8 mx-auto text-slate-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                  </svg>
                  <span className="text-xs text-slate-400 block truncate px-2">
                    {state.files.length > 0 ? `${state.files.length} items found` : 'Select folder with resumes'}
                  </span>
                  <span className="text-[10px] text-slate-600 mt-1 block">Supports PDF, DOCX, TXT, MD</span>
                </div>
              </div>

              <button
                onClick={handleBatchProcess}
                disabled={state.isProcessing}
                className={`w-full py-3 rounded-lg font-bold text-white shadow-lg transition-all ${
                  state.isProcessing ? 'bg-slate-700 animate-pulse cursor-wait' : 'bg-indigo-600 hover:bg-indigo-500'
                }`}
              >
                {state.isProcessing ? 'Analyzing & Ranking...' : 'Start Ranking Batch'}
              </button>
            </div>
          </div>

          {/* Ranking List */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl flex-1">
            <div className="px-4 py-3 border-b border-slate-800 bg-slate-800/30 flex justify-between items-center">
              <h2 className="text-xs font-bold text-slate-400 uppercase">Rankings (Best First)</h2>
              <span className="text-[10px] px-2 py-0.5 bg-slate-800 rounded-full text-slate-500">{state.results.length} Scanned</span>
            </div>
            <div className="max-h-[500px] overflow-y-auto divide-y divide-slate-800">
              {state.results.length === 0 && !state.isProcessing && (
                <div className="p-8 text-center text-slate-600 text-sm italic">Upload resumes and a JD to begin ranking.</div>
              )}
              {state.results.map((res, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedResult(res)}
                  className={`w-full text-left p-4 hover:bg-slate-800/50 transition-colors flex items-center justify-between group ${selectedResult?.fileName === res.fileName ? 'bg-indigo-900/20 border-l-2 border-indigo-500' : ''}`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-slate-500">#{idx + 1}</span>
                      <h3 className="font-semibold text-slate-200 truncate">{res.name}</h3>
                    </div>
                    <p className="text-xs text-slate-500 truncate">{res.currentRole}</p>
                  </div>
                  <div className={`ml-4 text-sm font-bold mono px-2 py-1 rounded bg-slate-950 shadow-inner ${res.score > 80 ? 'text-emerald-400' : res.score > 50 ? 'text-amber-400' : 'text-slate-500'}`}>
                    {res.score}%
                  </div>
                </button>
              ))}
              {state.isProcessing && (
                 <div className="p-4 flex items-center gap-3 animate-pulse">
                   <div className="w-8 h-8 bg-slate-800 rounded-full"></div>
                   <div className="flex-1 space-y-2">
                     <div className="h-3 bg-slate-800 rounded w-3/4"></div>
                     <div className="h-2 bg-slate-800 rounded w-1/2"></div>
                   </div>
                 </div>
              )}
            </div>
          </div>
        </aside>

        {/* Main: Details Section */}
        <main className="lg:col-span-8">
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl min-h-[700px] flex flex-col">
            {!selectedResult ? (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-600 space-y-4 p-12">
                <div className="bg-slate-800 p-6 rounded-full opacity-20">
                  <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </div>
                <h2 className="text-xl font-medium text-slate-500">Select a candidate to view full analysis</h2>
                <p className="max-w-xs text-center text-sm">The recruiter AI extracts achievements, rate skills, and calculates matches based on JD constraints.</p>
              </div>
            ) : (
              <>
                <div className="px-6 py-4 border-b border-slate-800 bg-slate-800/30 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg mono shadow-inner ${selectedResult.score > 80 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-800 text-slate-400 border border-slate-700'}`}>
                      {selectedResult.score}
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-white leading-tight">{selectedResult.name}</h2>
                      <p className="text-xs text-slate-500 font-mono uppercase tracking-widest">{selectedResult.fileName}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => openOriginalResume(selectedResult.originalFile)}
                      className="px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors text-slate-200 flex items-center gap-2 text-xs font-semibold"
                      title="View original file"
                    >
                      <svg className="w-4 h-4 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                      Open Original
                    </button>
                    <button 
                      onClick={() => {
                          navigator.clipboard.writeText(selectedResult.markdown);
                          alert('Markdown profile copied to clipboard!');
                      }}
                      className="p-2 hover:bg-slate-700 rounded-lg transition-colors text-slate-400 flex items-center gap-2 text-xs"
                      title="Copy Profile Markdown"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                      </svg>
                      Copy Profile
                    </button>
                  </div>
                </div>
                <div className="p-8 flex-1 overflow-auto bg-slate-900 prose prose-invert prose-indigo max-w-none prose-h1:text-2xl prose-h2:text-lg prose-h2:mt-8 prose-h2:border-b prose-h2:border-slate-800 prose-h2:pb-2 prose-strong:text-indigo-300">
                  <ReactMarkdown>{selectedResult.markdown}</ReactMarkdown>
                </div>
              </>
            )}
          </div>
        </main>
      </div>
    </Layout>
  );
};

export default App;
