---
pkg: "@nocobase/plugin-field-signature"
---

# Champ de table de données : signature manuscrite

## Introduction

Le champ de signature manuscrite permet aux utilisateurs d’écrire leur signature sur une zone de dessin à l’aide de la souris ou d’un écran tactile. Après l’enregistrement, l’image de la signature est écrite dans la **table de données de fichiers** sélectionnée et réutilise le processus de téléversement et de stockage des fichiers fourni par le **gestionnaire de fichiers**.

## Installation

1. Vérifiez que l’environnement actuel est en **édition professionnelle ou supérieure** et que la licence est valide.
2. Ouvrez le **gestionnaire de plugins**, recherchez **Champ de table de données : signature manuscrite** (`@nocobase/plugin-field-signature`) et activez-le.
3. Assurez-vous que le **gestionnaire de fichiers** (`@nocobase/plugin-file-manager`) est activé. Le champ de signature manuscrite dépend de ses capacités de table de données de fichiers, de téléversement et de stockage ; s’il n’est pas activé, l’image de la signature ne pourra pas être enregistrée.

## Mode d’emploi

### Ajouter un champ

Dans **Source de données** → sélectionnez une table de données → **Configurer les champs** → **Ajouter un champ** → dans le groupe Multimédia, sélectionnez **Signature manuscrite**.

### Configuration du champ

- **Table de données de fichiers** : obligatoire ; sélectionnez une table de données de fichiers destinée à enregistrer les fichiers (par exemple `attachments`). L’image de la signature y sera enregistrée.
- La configuration de stockage et les règles de téléversement effectivement utilisées par l’image de la signature sont déterminées par la table de données de fichiers sélectionnée.

### Configuration de l’interface

- Après avoir ajouté le champ de signature manuscrite à un formulaire, vous pouvez ajuster les **paramètres de signature** dans la configuration de l’interface du champ, notamment la couleur du trait, la couleur d’arrière-plan, la largeur et la hauteur de la zone de signature, ainsi que la largeur et la hauteur de la miniature.
- Dans les scénarios d’affichage en lecture seule, vous pouvez également ajuster la largeur et la hauteur de la miniature de la signature afin de contrôler les dimensions d’affichage de l’image.
### Opérations dans l’interface

- Cliquez sur la zone du champ pour ouvrir la zone de signature, puis confirmez une fois l’écriture terminée afin de téléverser la signature et de l’associer à l’enregistrement de fichier correspondant.
- Sur les appareils à petit écran, vous pouvez utiliser une interface de signature en mode paysage ou plein écran pour faciliter l’écriture.
![20260709232226](https://static-docs.nocobase.com/20260709232226.png)