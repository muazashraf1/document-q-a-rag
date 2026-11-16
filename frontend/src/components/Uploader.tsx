'use client';

import React from 'react';
import { UploadCloud, FileText, Languages, Loader2 } from 'lucide-react';

interface UploaderProps {
  file: File | null;
  setFile: (file: File | null) => void;
  selectedLanguage: string;
  setSelectedLanguage: (lang: string) => void;
  uploading: boolean;
  handleUpload: (e: React.FormEvent) => void;
  dragActive: boolean;
  setDragActive: (active: boolean) => void;
  showNotification: (msg: string, type: 'success' | 'error') => void;
}

export default function Uploader({
  file,
  setFile,
  selectedLanguage,
  setSelectedLanguage,
  uploading,
  handleUpload,
  dragActive,
  setDragActive,
  showNotification
}: UploaderProps) {
  
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.type === "application/pdf") {
        setFile(droppedFile);
      } else {
        showNotification("Only PDF files are allowed.", "error");
      }
    }
  };

  return (
    <div className="glass p-5 rounded-2xl flex flex-col gap-4 shadow-xl shadow-black/10">
      <h2 className="font-semibold text-base flex items-center gap-2 text-white">
        <UploadCloud className="h-5 w-5 text-blue-400" />
        Upload PDF Document
      </h2>

      <form onSubmit={handleUpload} className="flex flex-col gap-4">
        {/* Drag Area */}
        <div 
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          className={`border border-dashed rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer transition-all duration-300 ${
            dragActive 
              ? 'border-blue-500 bg-blue-500/10' 
              : file 
                ? 'border-emerald-500/40 bg-emerald-500/5' 
                : 'border-white/10 hover:border-white/20 hover:bg-white/5'
          }`}
        >
          <input 
            type="file" 
            accept=".pdf"
            onChange={(e) => e.target.files?.[0] && setFile(e.target.files[0])}
            className="hidden" 
            id="pdf-file-input"
          />
          <label htmlFor="pdf-file-input" className="w-full h-full flex flex-col items-center justify-center cursor-pointer text-center">
            <FileText className={`h-9 w-9 mb-3 transition-colors ${file ? 'text-emerald-400' : 'text-gray-400'}`} />
            
            {file ? (
              <div className="max-w-full">
                <p className="text-white text-sm font-semibold truncate px-2">{file.name}</p>
                <p className="text-emerald-400 text-xs mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB • Ready</p>
              </div>
            ) : (
              <div>
                <p className="text-white text-sm font-medium">Drag & drop PDF here</p>
                <p className="text-gray-400 text-xs mt-1">or click to browse files</p>
              </div>
            )}
          </label>
        </div>

        {/* Language selection dropdown */}
        <div className="flex items-center justify-between glass-panel px-3 py-2.5 rounded-xl border border-white/5">
          <span className="text-xs text-gray-400 flex items-center gap-1.5 font-medium">
            <Languages className="h-3.5 w-3.5 text-blue-400" />
            Document Language:
          </span>
          <select 
            value={selectedLanguage}
            onChange={(e) => setSelectedLanguage(e.target.value)}
            className="bg-transparent text-white text-xs font-bold outline-none cursor-pointer focus:text-blue-400"
          >
            <option value="en" className="bg-[#0b0f19] text-white">🇺🇸 English</option>
            <option value="es" className="bg-[#0b0f19] text-white">🇪🇸 Spanish</option>
            <option value="fr" className="bg-[#0b0f19] text-white">🇫🇷 French</option>
          </select>
        </div>

        {/* Action Upload button */}
        <button
          type="submit"
          disabled={!file || uploading}
          className={`w-full py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
            !file || uploading
              ? 'bg-white/5 text-gray-500 border border-white/5 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-500 text-white cursor-pointer active:scale-95 shadow-md shadow-blue-500/20'
          }`}
        >
          {uploading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin text-white" />
              Generating Embeddings...
            </>
          ) : (
            "Process and Save Chunks"
          )}
        </button>
      </form>
    </div>
  );
}
