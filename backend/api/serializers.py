# Serializers for API requests and response formats
from rest_framework import serializers
from .models import Document, DocumentChunk

class DocumentSerializer(serializers.ModelSerializer):
    """
    Document model ko serialize karne ke liye serializer class.
    Frontend jab file upload karega, to title aur file coordinates yahan validate honge.
    """
    class Meta:
        model = Document
        fields = ['id', 'title', 'file', 'uploaded_at', 'language']
        read_only_fields = ['uploaded_at']

class DocumentChunkSerializer(serializers.ModelSerializer):
    """
    DocumentChunk model ko serialize karne ke liye serializer class.
    Note: Hum vector coordinates (embedding column) ko frontend pe nahi bhej rahe,
    kyunki unka size boht bara hota hai aur frontend ko sirf textual chunks display karne hote hain.
    """
    class Meta:
        model = DocumentChunk
        fields = ['id', 'document', 'content', 'chunk_index']
