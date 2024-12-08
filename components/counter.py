from .base import Component

class Counter(Component):
    def __init__(self, id):
        super().__init__(id)
        self.state = {'count': 0}

    def increment(self):
        self.state['count'] += 1
        return self.state

    def decrement(self):
        self.state['count'] -= 1
        return self.state

    def render(self):
        return f"""
       <div id="app">
        <h2>Compteur: {self.state['count']}</h2>
        <button b-click="increment">+</button>
        <button b-click="decrement">-</button>
    </div>
        """
