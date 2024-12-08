from .base import Component, view, bladeRedirect, bladeNavigate

class SubmitForm(Component):
    def __init__(self, id):
        super().__init__(id)
        self.state = {
            'name': '',
            'email': 0,
            'submitted': False,
            'search_':''
        }       
    def search(self, ar):
        self.state["search_"] = ar[0]
        print('ar', ar)
        return self.get_html()
    def submit(self,ar):
        self.state['submitted'] = True
        self.state['name'] = ar
        print(ar, 'argument')
        return self.get_html()
    def updateValue(self, ar):
        print(ar)
        return self.get_html()
    def uploadFile(self, ar):
       print(ar)
    def redirect(self):
        print("je suis")
        return bladeRedirect('/test')  
    def navigation(self):
        return bladeNavigate('/test') 
    def render(self):
        return view('index.html', context={"name": self.state['name'], 'search':self.state["search_"]})  