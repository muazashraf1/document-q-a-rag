'use client';

import React from 'react';
import { Sparkles, CheckCircle2 } from 'lucide-react';

export default function Header() {
  return (
    <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 glass p-6 rounded-2xl shadow-xl shadow-black/20">
      <div>
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-600/20 text-blue-400 rounded-xl">
            <Sparkles className="h-6 w-6 glow-effect text-blue-400" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Multilingual Doc Q&A</h1>
        </div>
        <p className="text-gray-400 text-sm mt-1">Free RAG engine powered by local MiniLM and Google Gemini</p>
      </div>

      <div className="flex items-center gap-2.5 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-xs font-semibold text-emerald-400">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>
        Server API Key Enabled
      </div>
    </header>
  );
}
