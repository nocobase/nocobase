---
pkg: "@nocobase/plugin-client"
---
:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::


# Gestionnaire de routes

## Introduction

Le gestionnaire de routes est un outil permettant de gérer les routes de la page principale du système, prenant en charge les versions `desktop` et `mobile`. Les routes créées à l'aide du gestionnaire de routes seront synchronisées avec le menu (vous pouvez les configurer pour qu'elles n'apparaissent pas dans le menu). Inversement, les éléments de menu ajoutés via le menu de la page seront également synchronisés avec la liste du gestionnaire de routes.

![20250107115449](https://static-docs.nocobase.com/20250107115449.png)

## Manuel d'utilisation

### Types de routes

Le système prend en charge quatre types de routes :

- Groupe (group) : Utilisé pour gérer les routes en les regroupant, et peut inclure des sous-routes.
- Page (page) : Page interne du système.
- Onglet (tab) : Utilisé pour basculer entre les onglets au sein d'une page.
- Lien (link) : Lien interne ou externe, qui permet de naviguer directement vers l'adresse configurée.

### Ajouter une route

Cliquez sur le bouton "Add new" en haut à droite pour créer une nouvelle route :

1. Sélectionnez le type de route (Type).
2. Saisissez le titre de la route (Title).
3. Sélectionnez l'icône de la route (Icon).
4. Définissez si la route doit apparaître dans le menu (Show in menu).
5. Définissez si les onglets de page doivent être activés (Enable page tabs).
6. Pour le type "Page", le système générera automatiquement un chemin de route unique (Path).

![20250124131803](https://static-docs.nocobase.com/20250124131803.png)

### Actions sur les routes

Chaque entrée de route prend en charge les actions suivantes :

- Add child : Ajouter une sous-route.
- Edit : Modifier la configuration de la route.
- View : Afficher la page de la route.
- Delete : Supprimer la route.

### Actions groupées

La barre d'outils supérieure propose les actions groupées suivantes :

- Refresh : Actualiser la liste des routes.
- Delete : Supprimer la route sélectionnée.
- Hide in menu : Masquer la route sélectionnée dans le menu.
- Show in menu : Afficher la route sélectionnée dans le menu.

### Filtrer les routes

Utilisez la fonction "Filter" en haut de page pour filtrer la liste des routes selon vos besoins.

:::info{title=Remarque}
La modification des configurations de route affectera directement la structure du menu de navigation du système. Veuillez procéder avec prudence et vous assurer de l'exactitude des configurations de route.
:::