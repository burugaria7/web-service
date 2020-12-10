from django.urls import path
from . import views

app_name = 'sweep'
urlpatterns = [
    path('', views.main, name='index'),
    # ex: sweep/
    path('sweep/', views.index, name='main'),
]