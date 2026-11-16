from django.db import models
from pgvector.django import VectorField

class Document(models.Model):
    title = models.CharField(max_length=255)
    file = models.FileField(upload_to='documents/')
    uploaded_at = models.DateTimeField(auto_now_add=True)
    language = models.CharField(max_length=10, default='en') # 'en', 'es', 'fr', etc.

    def __str__(self):
        return self.title

class DocumentChunk(models.Model):
    document = models.ForeignKey(Document, on_delete=models.CASCADE, related_name='chunks')
    content = models.TextField()
    chunk_index = models.IntegerField()
    # paraphrase-multilingual-MiniLM-L12-v2 produces 384-dimensional vector embeddings
    embedding = VectorField(dimensions=384)

    def __str__(self):
        return f"{self.document.title} - Chunk {self.chunk_index}"

