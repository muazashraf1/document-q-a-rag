'use client';

import React, { useRef, useEffect } from 'react';
import { MessageSquare, Sparkles, Send, Loader2 } from 'lucide-react';

interface Source {
  document_title: string;
  content: string;
  chunk_index: number;
  language: string;
  similarity: number;
}

interface Message {
  role: 'user' | 'assistant';
  text: string;
  sources?: Source[];
}

interface ChatPaneProps {
  chatHistory: Message[];
  queryText: string;
  setQueryText: (text: string) => void;
  querying: boolean;
  handleQuery: (e: React.FormEvent) => void;
  selectedDocId: string;
}

export default function ChatPane({
  chatHistory,
  queryText,
  setQueryText,
  querying,
  handleQuery,
  selectedDocId
}: ChatPaneProps) {
  
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, querying]);

  const getLanguageFlag = (lang: string) => {
    switch (lang) {
      case 'es': return '🇪🇸';
      case 'fr': return '🇫🇷';
      default: return '🇺🇸';
    }
  };

  return (
    <main className="lg:col-span-8 flex flex-col glass rounded-2xl min-h-[550px] overflow-hidden shadow-xl shadow-black/25 border border-white/10">
      
      {/* Chat Header */}
      <div className="border-b border-white/5 px-6 py-4 flex items-center justify-between bg-white/[0.01]">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-blue-400" />
          <span className="font-semibold text-white text-sm">Interactive Q&A Session</span>
        </div>
        {selectedDocId && (
          <span className="text-[10px] bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2.5 py-0.5 rounded-full font-bold">
            Filtering by 1 Document
          </span>
        )}
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 max-h-[500px]">
        {chatHistory.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <Sparkles className="h-10 w-10 text-blue-400/25 glow-effect mb-3 animate-pulse" />
            <p className="text-white font-semibold text-sm">Ask questions across languages</p>
            <p className="text-gray-400 text-xs mt-1 max-w-sm leading-relaxed">
              Upload documents (e.g. Spanish/French) and ask questions in English. The multilingual embedding alignments work dynamically!
            </p>
          </div>
        ) : (
          chatHistory.map((msg, index) => (
            <div key={index} className="flex flex-col gap-3">
              
              {/* Message Bubble */}
              <div className={`flex w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-2xl p-4 text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium shadow-md shadow-blue-500/15'
                    : 'glass-panel text-gray-200 border border-white/5 shadow-inner'
                }`}>
                  <p className="whitespace-pre-wrap">{msg.text}</p>
                </div>
              </div>

              {/* Matched Sources display */}
              {msg.role === 'assistant' && msg.sources && msg.sources.length > 0 && (
                <div className="pl-4 border-l border-white/5 flex flex-col gap-2">
                  <details className="cursor-pointer group">
                    <summary className="text-[11px] text-blue-400 hover:text-blue-300 font-bold select-none outline-none flex items-center gap-1.5 transition-colors">
                      <span>🔍 View Matched Sources ({msg.sources.length})</span>
                    </summary>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3 animate-fadeIn">
                      {msg.sources.map((src, sIdx) => (
                        <div 
                          key={sIdx} 
                          className="glass-panel p-3.5 rounded-xl border border-white/5 hover:bg-white/[0.02] hover:border-white/10 transition-all flex flex-col justify-between"
                        >
                          <div>
                            <div className="flex justify-between items-center gap-2 mb-2">
                              <span className="text-[10px] text-gray-300 font-bold truncate max-w-[65%]" title={src.document_title}>
                                {src.document_title}
                              </span>
                              <span className="text-[9px] bg-blue-500/10 text-blue-400 border border-blue-500/20 px-1.5 py-0.5 rounded font-mono font-bold">
                                {Math.round(src.similarity * 100)}% Match
                              </span>
                            </div>
                            <p className="text-[11px] text-gray-400 leading-relaxed italic line-clamp-4">
                              "{src.content}"
                            </p>
                          </div>
                          <div className="flex items-center gap-2 mt-3 pt-2.5 border-t border-white/5">
                            <span className="text-[9px] bg-white/5 border border-white/5 px-1.5 py-0.5 rounded text-gray-400 font-bold uppercase">
                              {getLanguageFlag(src.language)} {src.language.toUpperCase()}
                            </span>
                            <span className="text-[9px] text-gray-500 font-bold">
                              Chunk: {src.chunk_index}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </details>
                </div>
              )}

            </div>
          ))
        )}

        {/* Loading Spinner */}
        {querying && (
          <div className="flex justify-start">
            <div className="glass-panel rounded-2xl px-4 py-3 border border-white/5 flex items-center gap-2 text-gray-400 text-xs">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-400" />
              Searching context and invoking Gemini AI...
            </div>
          </div>
        )}
        
        <div ref={chatEndRef} />
      </div>

      {/* Query input area */}
      <form onSubmit={handleQuery} className="border-t border-white/5 p-4 flex gap-2 bg-white/[0.01]">
        <input
          type="text"
          placeholder="Ask a question about the uploaded documents..."
          value={queryText}
          onChange={(e) => setQueryText(e.target.value)}
          disabled={querying}
          className="flex-1 p-3.5 rounded-xl text-sm glass-input placeholder:text-gray-500"
        />
        <button
          type="submit"
          disabled={!queryText.trim() || querying}
          className={`p-3.5 rounded-xl transition-all flex items-center justify-center ${
            !queryText.trim() || querying
              ? 'bg-white/5 text-gray-500 border border-white/5 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-500 text-white cursor-pointer active:scale-95 shadow-md shadow-blue-500/20'
          }`}
        >
          <Send className="h-4 w-4" />
        </button>
      </form>

    </main>
  );
}
