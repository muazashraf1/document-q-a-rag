# URL configuration for the api app endpoints
from django.urls import path
from .views import DocumentUploadView, QueryView

urlpatterns = [
    # PDF Upload karne aur list retrieve karne ka endpoint
    path('upload/', DocumentUploadView.as_view(), name='document-upload'),
    
    # Text Query aur LLM answer generate karne ka endpoint
    path('query/', QueryView.as_view(), name='document-query'),
]
