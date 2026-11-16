import os
import pdfplumber
import re
import google.generativeai as genai

def extract_text_from_pdf(pdf_path):
    """
    pdfplumber library ka use kar ke PDF file se clean text extract karne ka function.
    """
    text = ""
    with pdfplumber.open(pdf_path) as pdf:
        for page in pdf.pages:
            content = page.extract_text()
            if content:
                # Multi-newlines ya trailing spaces ko clean karna
                text += content + "\n"
    
    # Text ko pre-process kar ke redundant spacing khatam karna
    text = re.sub(r'\n+', '\n', text)
    text = re.sub(r' +', ' ', text)
    return text.strip()

def chunk_text(text, chunk_size=800, overlap=150):
    """
    Recursive Character Splitter ki tarah text ko overlap ke sath chunks mein divide karna.
    - chunk_size: Ek chunk mein characters ki limit.
    - overlap: Agle chunk ke start mein pichle chunk ke kitne characters carry forward honge.
    """
    chunks = []
    if not text:
        return chunks
        
    start = 0
    text_length = len(text)
    
    while start < text_length:
        # End point calculate karna
        end = start + chunk_size
        
        # Agar end point text ke darmayan hai, to koshish karte hain ke words beech mein se na katein
        if end < text_length:
            # Piche ki taraf space ya newline find karna taake word-boundary pe break ho
            boundary = text.rfind(' ', start, end)
            if boundary != -1 and boundary > start:
                end = boundary
        
        chunk = text[start:end].strip()
        if chunk:
            chunks.append(chunk)
            
        # Agla chunk start karne ke liye overlap subtract karenge
        start = end - overlap
        if start >= text_length or end >= text_length:
            break
            
    return chunks

def generate_embeddings(texts, api_key=None, task_type=None):
    """
    Google Gemini Multilingual Embedding model ka use kar ke 384-dimensional vector embeddings generate karna.
    Yeh 0 local RAM/disk use karta hai aur instant result deta hai.
    """
    key = api_key or os.environ.get("GEMINI_API_KEY")
    if not key:
        raise ValueError("GEMINI_API_KEY is not set. Please add it to your .env file or environment.")
    genai.configure(api_key=key)
    
    if not texts:
        return []
        
    # Single text handling
    if isinstance(texts, str):
        texts = [texts]
        
    kwargs = {
        "model": "models/gemini-embedding-001",
        "output_dimensionality": 384
    }
    if task_type:
        kwargs["task_type"] = task_type
        
    # If single text
    if len(texts) == 1:
        kwargs["content"] = texts[0]
        res = genai.embed_content(**kwargs)
        return [res["embedding"]]
        
    # Batch texts
    kwargs["content"] = texts
    res = genai.embed_content(**kwargs)
    return res["embedding"]
