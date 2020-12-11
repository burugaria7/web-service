from django.urls import path
from . import views

app_name = 'minesweeper'
urlpatterns = [
    # ex: minesweeper/
    path('', views.index, name='index'),
]