'use client';

import React from 'react';
import { BookOpen, FileText } from 'lucide-react';

interface DocumentFile {
  id: number;
  title: string;
  file: string;
  uploaded_at: string;
  language: string;
}

interface DocumentListProps {
  documents: DocumentFile[];
  selectedDocId: string;
  setSelectedDocId: (id: string) => void;
}

export default function DocumentList({
  documents,
  selectedDocId,
  setSelectedDocId
}: DocumentListProps) {
  
  const toggleSelectDoc = (id: string) => {
    if (selectedDocId === id) {
      setSelectedDocId('');
    } else {
      setSelectedDocId(id);
    }
  };

  const getLanguageFlag = (lang: string) => {
    switch (lang) {
      case 'es': return '🇪🇸';
      case 'fr': return '🇫🇷';
      default: return '🇺🇸';
    }
  };

  return (
    <div className="glass p-5 rounded-2xl flex-1 flex flex-col min-h-[300px] shadow-xl shadow-black/10">
      <h2 className="font-semibold text-base flex items-center gap-2 text-white mb-4">
        <BookOpen className="h-5 w-5 text-violet-400" />
        Document Library
      </h2>

      {/* Filter Selector */}
      <div className="mb-4">
        <label className="text-[11px] font-bold text-gray-400 block mb-1">Active Search Filter:</label>
        <select
          value={selectedDocId}
          onChange={(e) => setSelectedDocId(e.target.value)}
          className="w-full p-2.5 rounded-xl text-xs glass-input text-white outline-none cursor-pointer border border-white/5"
        >
          <option value="">🔍 Search Across All Documents</option>
          {documents.map((doc) => (
            <option key={doc.id} value={doc.id} className="bg-[#090d16]">
              {getLanguageFlag(doc.language)} {doc.title}
            </option>
          ))}
        </select>
      </div>

      {/* Scrollable list of files */}
      <div className="flex-1 overflow-y-auto max-h-[320px] flex flex-col gap-2 pr-1">
        {documents.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
            <FileText className="h-8 w-8 text-white/5 mb-2" />
            <p className="text-gray-500 text-xs font-semibold">No documents uploaded yet</p>
          </div>
        ) : (
          documents.map((doc) => {
            const isSelected = selectedDocId === doc.id.toString();
            return (
              <div 
                key={doc.id} 
                onClick={() => toggleSelectDoc(doc.id.toString())}
                className={`p-3.5 rounded-xl flex items-center justify-between cursor-pointer border transition-all ${
                  isSelected 
                    ? 'bg-blue-600/10 border-blue-500/40 shadow-inner' 
                    : 'bg-white/[0.01] border-white/5 hover:border-white/10 hover:bg-white/[0.03]'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`p-1.5 rounded-lg ${isSelected ? 'bg-blue-500/20 text-blue-400' : 'bg-white/5 text-gray-400'}`}>
                    <FileText className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-white text-xs font-semibold truncate leading-tight">{doc.title}</p>
                    <p className="text-[10px] text-gray-400 mt-1">
                      {new Date(doc.uploaded_at).toLocaleDateString(undefined, {month: 'short', day: 'numeric', year: 'numeric'})}
                    </p>
                  </div>
                </div>
                <span className="text-[10px] px-2 py-0.5 bg-white/5 rounded-md text-gray-300 font-bold border border-white/5 ml-2 shrink-0">
                  {getLanguageFlag(doc.language)} {doc.language.toUpperCase()}
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
