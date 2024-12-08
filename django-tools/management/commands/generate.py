import os
from django.core.management.base import BaseCommand

class Command(BaseCommand):
    help = "Génère la structure de dossiers pour les modèles dans django-tools"

    def add_arguments(self, parser):
        # Ajouter l'argument pour le nom du modèle
        parser.add_argument('model_name', type=str, help="Nom du modèle à générer")

    def handle(self, *args, **options):
        model_name = options['model_name']

        # Vérifier si le nom du modèle est valide
        if not model_name.isidentifier():
            self.stdout.write(self.style.ERROR(f"Le nom du modèle '{model_name}' n'est pas valide."))
            return

        # Créer les dossiers nécessaires pour le modèle
        base_path = os.path.dirname(os.path.abspath(__file__))  # Récupère le chemin de la bibliothèque
        models_dir = os.path.join(base_path, '..', '..', 'models')

        # Création du dossier models
        os.makedirs(models_dir, exist_ok=True)

        # Création du fichier du modèle
        model_file_path = os.path.join(models_dir, f'{model_name.lower()}.py')
        with open(model_file_path, 'w') as f:
            f.write(f'# Modèle de base pour {model_name}\n')
            f.write(f'class {model_name.capitalize()}(models.Model):\n')
            f.write(f'    # Ajouter les champs du modèle ici\n')
            f.write(f'    pass\n')

        self.stdout.write(self.style.SUCCESS(f"Modèle '{model_name}' généré avec succès dans {model_file_path}"))
