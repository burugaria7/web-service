from django.urls import path
from . import views

app_name = 'tictactoe'
urlpatterns = [
    # ex: tictactoe/
    path('', views.index, name='index'),
]