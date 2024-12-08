import importlib
import pkgutil
from django.template import loader
from django.http import HttpResponse, JsonResponse
import json
from components.base import Component
from .liveBlade import LiveBlade  

def pyBladerender(request, template_name, context=None):
    if context is None:
        context = {}

    if request.method == "POST":
        return LiveBlade(request) 
    template = loader.get_template(template_name)
    rendered_content = template.render(context, request)
    return HttpResponse(rendered_content)
