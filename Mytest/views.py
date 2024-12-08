from django.shortcuts import render
from pyblade.pyBladeRender import pyBladerender


# Create your views here.

def index(request):
    pyBladerender
    return pyBladerender(request,'index.html', {})
def test_(request):
    return pyBladerender(request,'test.html',{})

