from django.shortcuts import render
from django.http import HttpResponse
from django.views.generic import View


class IndexView(View):
    """
    インデックスビュー
    """

    def get(self, request, *args, **kwargs):
        # テンプレートのレンダリング
        return render(request, 'sweep/main.html')


index = IndexView.as_view()


def main(request):
    return render(request, 'sweep/index.html', {'sweep': main})
# Create your views here.
