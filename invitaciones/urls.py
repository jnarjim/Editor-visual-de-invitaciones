from django.urls import path
from . import views

app_name = 'invitaciones'

urlpatterns = [
    path('', views.editor_view, name='editor_home'),  # <-- ruta vacía
    path('editor/', views.editor_view, name='editor'),
    path('guardar/', views.guardar_invitacion, name='guardar_invitacion'),
]
