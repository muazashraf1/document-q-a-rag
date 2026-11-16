'use client';

import React, { useState, useEffect } from 'react';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import Header from '@/components/Header';
import Uploader from '@/components/Uploader';
import DocumentList from '@/components/DocumentList';
import ChatPane from '@/components/ChatPane';

const API_BASE_URL = 'http://localhost:8000/api';

interface DocumentFile {
  id: number;
  title: string;
  file: string;
  uploaded_at: string;
  language: string;
}

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

export default function Home() {
  // --- STATE MANAGEMENT ---
  const [documents, setDocuments] = useState<DocumentFile[]>([]);
  const [selectedDocId, setSelectedDocId] = useState<string>('');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('en');
  const [file, setFile] = useState<File | null>(null);
  
  const [chatHistory, setChatHistory] = useState<Message[]>([]);
  const [queryText, setQueryText] = useState<string>('');
  
  const [uploading, setUploading] = useState<boolean>(false);
  const [querying, setQuerying] = useState<boolean>(false);
  const [dragActive, setDragActive] = useState<boolean>(false);
  
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');

  // --- STARTUP ACTIONS ---
  useEffect(() => {
    fetchDocuments();
  }, []);

  // --- FETCH DOCUMENTS ---
  const fetchDocuments = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/upload/`);
      if (response.ok) {
        const data = await response.json();
        setDocuments(data);
      }
    } catch (err) {
      console.error("Failed to fetch documents", err);
    }
  };

  // --- NOTIFICATION HANDLER ---
  const showNotification = (msg: string, type: 'success' | 'error') => {
    if (type === 'success') {
      setSuccessMsg(msg);
      setTimeout(() => setSuccessMsg(''), 4000);
    } else {
      setErrorMsg(msg);
      setTimeout(() => setErrorMsg(''), 6000);
    }
  };

  // --- UPLOAD HANDLER ---
  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setUploading(true);
    setErrorMsg('');
    setSuccessMsg('');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', file.name.replace(".pdf", ""));
    formData.append('language', selectedLanguage);

    try {
      const response = await fetch(`${API_BASE_URL}/upload/`, {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        showNotification("Document processed and vector embeddings generated successfully!", "success");
        setFile(null);
        fetchDocuments();
      } else {
        const errorData = await response.json();
        showNotification(errorData.error || "Failed to process PDF file.", "error");
      }
    } catch (err) {
      showNotification("Could not connect to backend server.", "error");
    } finally {
      setUploading(false);
    }
  };

  // --- QUERY SUBMIT ---
  const handleQuery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!queryText.trim()) return;

    const userMessage: Message = { role: 'user', text: queryText };
    setChatHistory(prev => [...prev, userMessage]);
    const currentQuery = queryText;
    setQueryText('');
    setQuerying(true);

    try {
      const response = await fetch(`${API_BASE_URL}/query/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: currentQuery,
          document_id: selectedDocId ? parseInt(selectedDocId) : null,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const assistantMessage: Message = {
          role: 'assistant',
          text: data.answer,
          sources: data.sources,
        };
        setChatHistory(prev => [...prev, assistantMessage]);
      } else {
        const errData = await response.json();
        setChatHistory(prev => [
          ...prev, 
          { role: 'assistant', text: `⚠️ Error: ${errData.error || "Failed to get response."}` }
        ]);
      }
    } catch (err) {
      setChatHistory(prev => [
        ...prev, 
        { role: 'assistant', text: "⚠️ Error: Connection to backend failed." }
      ]);
    } finally {
      setQuerying(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
      
      {/* 1. Header component */}
      <Header />

      {/* Notification overlays */}
      {successMsg && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-2 px-4 py-3 bg-emerald-950/80 border border-emerald-500/30 text-emerald-300 rounded-xl backdrop-blur-md shadow-lg transition-all animate-bounce">
          <CheckCircle2 className="h-5 w-5" />
          <span className="text-sm font-medium">{successMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-2 px-4 py-3 bg-rose-950/80 border border-rose-500/30 text-rose-300 rounded-xl backdrop-blur-md shadow-lg transition-all">
          <AlertCircle className="h-5 w-5" />
          <span className="text-sm font-medium">{errorMsg}</span>
        </div>
      )}

      {/* 2. Dashboard layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch flex-1">
        
        {/* Sidebar / Left column: Ingestion and library */}
        <section className="lg:col-span-4 flex flex-col gap-6">
          <Uploader 
            file={file}
            setFile={setFile}
            selectedLanguage={selectedLanguage}
            setSelectedLanguage={setSelectedLanguage}
            uploading={uploading}
            handleUpload={handleUpload}
            dragActive={dragActive}
            setDragActive={setDragActive}
            showNotification={showNotification}
          />
          <DocumentList 
            documents={documents}
            selectedDocId={selectedDocId}
            setSelectedDocId={setSelectedDocId}
          />
        </section>

        {/* Main Content / Right column: Chat Panel */}
        <ChatPane 
          chatHistory={chatHistory}
          queryText={queryText}
          setQueryText={setQueryText}
          querying={querying}
          handleQuery={handleQuery}
          selectedDocId={selectedDocId}
        />

      </div>

    </div>
  );
}
