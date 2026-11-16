"""
URL configuration for config project.
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # Humari APIs ko '/api/' prefix ke sath include karna
    path('api/', include('api.urls')),
]

# Development mode mein uploaded PDF files ko fetch/access karne ki routing config
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
