from .base import Component
import time

class Timer(Component):
    def __init__(self, id):
        super().__init__(id)
        self.state = {'time': 0}

    def start(self):
        # Logique pour démarrer le timer (simulée ici)
        self.state['time'] += 1  # Incrémente le temps pour la démonstration
        return self.get_html()  # Retourne le HTML mis à jour

    def reset(self):
        self.state['time'] = 0
        return self.get_html()  # Retourne le HTML mis à jour

    def render(self):
        return f"""
        <div id="{self.id}">
            <h2>Timer: {self.state['time']} secondes</h2>
            <button onclick="callComponentMethod('{self.id}', 'start')">Démarrer</button>
            <button onclick="callComponentMethod('{self.id}', 'reset')">Réinitialiser</button>
        </div>
        """
