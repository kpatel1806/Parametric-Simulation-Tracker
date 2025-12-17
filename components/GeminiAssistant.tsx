import React, { useState } from 'react';
import { Sparkles, Send, Loader2, Info } from 'lucide-react';
import { analyzeProgress } from '../services/geminiService';
import { ParametricStats } from '../types';

interface GeminiAssistantProps {
  stats: ParametricStats;
}

export const GeminiAssistant: React.FC<GeminiAssistantProps> = ({ stats }) => {
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const predefinedQueries = [
    "What are the critical QC notes for HVAC systems?",
    "How many simulations are remaining and estimated time?",
    "Identify potential risks in the current batch plan.",
    "Explain the 'System Effect' vs 'Implementation Artifact' note."
  ];

  const handleAnalyze = async (text: string) => {
    if (!text.trim()) return;
    setLoading(true);
    setQuery(text); // Ensure input reflects clicked preset
    
    const result = await analyzeProgress(stats, text);
    setResponse(result || "No response generated.");
    setLoading(false);
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-indigo-100 overflow-hidden flex flex-col h-[600px]">
      <div className="bg-indigo-600 p-4 flex items-center gap-2">
        <Sparkles className="w-5 h-5 text-yellow-300" />
        <h2 className="text-white font-semibold">Gemini Intelligence</h2>
      </div>
      
      <div className="flex-1 p-6 overflow-y-auto bg-slate-50">
        {!response && !loading && (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
             <div className="bg-indigo-100 p-4 rounded-full">
                <Info className="w-8 h-8 text-indigo-600" />
             </div>
             <div>
                <h3 className="text-lg font-medium text-slate-800">Review Quality Control</h3>
                <p className="text-sm text-slate-500 max-w-xs mx-auto mt-1">
                  Ask me about simulation constraints, regression variables, or progress analysis based on your parametric plan.
                </p>
             </div>
             <div className="grid grid-cols-1 gap-2 w-full max-w-md mt-4">
                {predefinedQueries.map((q, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleAnalyze(q)}
                    className="text-xs text-left bg-white border border-indigo-100 hover:border-indigo-300 hover:bg-indigo-50 p-3 rounded-lg transition-colors text-slate-700"
                  >
                    {q}
                  </button>
                ))}
             </div>
          </div>
        )}

        {loading && (
           <div className="flex flex-col items-center justify-center h-full space-y-3">
             <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
             <p className="text-sm text-slate-500">Analyzing plan data...</p>
           </div>
        )}

        {response && !loading && (
          <div className="prose prose-sm max-w-none text-slate-700">
            <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                <h4 className="font-semibold text-xs text-indigo-600 uppercase mb-2 tracking-wider">Analysis Result</h4>
                <div className="whitespace-pre-wrap">{response}</div>
            </div>
            <button 
                onClick={() => setResponse(null)} 
                className="mt-4 text-xs text-slate-500 hover:text-indigo-600 underline"
            >
                Clear and ask another question
            </button>
          </div>
        )}
      </div>

      <div className="p-4 bg-white border-t border-slate-200">
        <div className="flex gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAnalyze(query)}
            placeholder="Ask about your simulation plan..."
            className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm"
          />
          <button
            onClick={() => handleAnalyze(query)}
            disabled={loading || !query.trim()}
            className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white px-4 py-2 rounded-lg transition-colors flex items-center justify-center"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
