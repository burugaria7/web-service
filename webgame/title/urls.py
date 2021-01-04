from django.urls import path, include
from . import views

app_name = 'title'
urlpatterns = [
    # ex: title/
    path('title/', views.index, name='index'),
    path('', views.auth, name='index'),
    path('title/minesweeper/', include('minesweeper.urls')),
    path('title/tictactoe/', include('tictactoe.urls')),
]
