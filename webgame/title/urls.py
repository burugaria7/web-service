from django.urls import path, include
from . import views

app_name = 'title'
urlpatterns = [
    # ex: title/
    path('', views.index, name='index'),
    path('minesweeper/', include('minesweeper.urls')),
    path('tictactoe/', include('tictactoe.urls')),
]
