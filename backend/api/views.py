from django.shortcuts import render

# Create your views here.
import os
import google.generativeai as genai
from django.shortcuts import get_object_or_404
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework import status
from pgvector.django import CosineDistance

from .models import Document, DocumentChunk
from .serializers import DocumentSerializer
from .pipeline import extract_text_from_pdf, chunk_text, generate_embeddings

class DocumentUploadView(APIView):
    """
    POST: Upload PDF file, extract text, chunk it, and save chunks with BGE-M3 embeddings.
    GET: List all uploaded documents metadata.
    """
    parser_classes = (MultiPartParser, FormParser)

    def get(self, request):
        documents = Document.objects.all().order_by('-uploaded_at')
        serializer = DocumentSerializer(documents, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = DocumentSerializer(data=request.data)
        if serializer.is_valid():
            # 1. Document meta save karna
            document = serializer.save()
            
            try:
                # 2. Uploaded PDF file ka absolute system path nikalna
                pdf_path = document.file.path
                
                # 3. PDF se plain text extract karna
                extracted_text = extract_text_from_pdf(pdf_path)
                
                if not extracted_text:
                    document.delete()
                    return Response(
                        {"error": "PDF file is empty or text could not be extracted."},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                
                # 4. Text ke semantic overlapping chunks banana
                chunks = chunk_text(extracted_text, chunk_size=800, overlap=150)
                
                if chunks:
                    # 5. Har chunk ke liye Gemini model se embedding generate karna
                    user_key = request.headers.get('X-Gemini-Key') or os.environ.get("GEMINI_API_KEY")
                    embeddings = generate_embeddings(chunks, api_key=user_key, task_type="retrieval_document")
                    
                    # 6. Bulk creation for database performance optimization
                    chunk_objects = []
                    for idx, (chunk_content, embedding) in enumerate(zip(chunks, embeddings)):
                        chunk_objects.append(
                            DocumentChunk(
                                document=document,
                                content=chunk_content,
                                chunk_index=idx,
                                embedding=embedding.tolist() if hasattr(embedding, 'tolist') else embedding
                            )
                        )
                    # Database mein aik hi query ke zariye bulk save karna
                    DocumentChunk.objects.bulk_create(chunk_objects)
                
                return Response(serializer.data, status=status.HTTP_201_CREATED)
                
            except Exception as e:
                # Agar koi error aaye to saved document ko cleanup karna
                document.delete()
                return Response(
                    {"error": f"Failed to process document: {str(e)}"},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class QueryView(APIView):
    """
    POST: Run vector similarity search and generate LLM response using Google Gemini.
    """
    def post(self, request):
        query_text = request.data.get('query')
        document_id = request.data.get('document_id') # Optional filter
        
        if not query_text:
            return Response({"error": "Query text is required."}, status=status.HTTP_400_BAD_REQUEST)
            
        # 1. API Key handle karna: environment variable ya header ke zariye
        gemini_api_key = (
            request.headers.get('X-Gemini-Key') 
            or os.environ.get("GEMINI_API_KEY", "")
        )
        if not gemini_api_key:
            return Response(
                {"error": "Google Gemini API Key is missing. Please set the GEMINI_API_KEY environment variable or provide it in the 'X-Gemini-Key' header."},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        try:
            # 2. Query ko vector mein convert karna
            raw_emb = generate_embeddings([query_text], api_key=gemini_api_key, task_type="retrieval_query")[0]
            query_vector = raw_emb.tolist() if hasattr(raw_emb, 'tolist') else raw_emb
            
            # 3. Vector Similarity Search using Cosine Distance
            chunk_queryset = DocumentChunk.objects.all()
            if document_id:
                chunk_queryset = chunk_queryset.filter(document_id=document_id)
                
            matched_chunks = chunk_queryset.annotate(
                distance=CosineDistance('embedding', query_vector)
            ).order_by('distance')[:5] # Top 5 relevant chunks
            
            if not matched_chunks:
                return Response({
                    "answer": "No relevant document context found. Please upload documents first.",
                    "sources": []
                })
            
            # 4. Gemini Prompt Context ready karna
            context_text = "\n---\n".join([
                f"Source: {chunk.document.title} (Page Chunk: {chunk.chunk_index})\nContent: {chunk.content}"
                for chunk in matched_chunks
            ])
            
            # 5. Dynamic Prompt construction
            prompt = f"""
You are an intelligent multilingual AI assistant specializing in document question-answering.
Answer the user's question accurately, clearly, and comprehensively using ONLY the provided document context.

Instructions:
1. Ground your answer completely in the given Context.
2. If the user asks in Urdu/Roman Urdu, respond in natural, friendly Roman Urdu or Urdu. If in English, respond in English.
3. If the document is in a different language (e.g. Spanish/French), understand it and answer in the language the user asked in.
4. If the context does not contain the answer, politely state that the information is not present in the uploaded document.

Context:
{context_text}

User Question: {query_text}

Answer:
"""
            
            # 6. Google Gemini API call (Free tier)
            genai.configure(api_key=gemini_api_key)
            model = genai.GenerativeModel("gemini-3.8-flash")
            response = model.generate_content(prompt)
            
            # 7. Response return karna jisme Sources include honge
            sources_data = [
                {
                    "document_title": chunk.document.title,
                    "content": chunk.content,
                    "chunk_index": chunk.chunk_index,
                    "language": chunk.document.language,
                    "similarity": round(1 - chunk.distance, 4) # Cosine similarity = 1 - Cosine Distance
                }
                for chunk in matched_chunks
            ]
            
            return Response({
                "answer": response.text,
                "sources": sources_data
            })
            
        except Exception as e:
            return Response(
                {"error": f"An error occurred: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
