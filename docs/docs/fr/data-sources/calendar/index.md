---
pkg: "@nocobase/plugin-calendar"
---
:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::



# Bloc Calendrier

## Introduction

Le bloc Calendrier vous permet de visualiser et de gérer facilement les événements et les données liées aux dates sous forme de calendrier. Il est idéal pour la planification de réunions, l'organisation d'activités et la gestion efficace de votre temps.

## Installation

Ce plugin est préinstallé, aucune configuration supplémentaire n'est requise.

## Ajouter un bloc

![20250403220300](https://static-docs.nocobase.com/20250403220300.png)

1.  **Champ de titre** : Ce champ affiche les informations sur les barres d'événements du calendrier. Actuellement, il prend en charge les types de champs tels que `Single Line Text` (texte sur une seule ligne), `Single select` (sélection unique), `Phone` (téléphone), `Email` (e-mail), `Radio Group` (groupe de boutons radio) et `Sequence` (séquence). Vous pouvez étendre les types de champs de titre pris en charge par le bloc Calendrier via des plugins.
2.  **Heure de début** : Indique le début de la tâche.
3.  **Heure de fin** : Marque la fin de la tâche.

<video width="100%" height="440" controls>
      <source src="https://static-docs.nocobase.com/20240419201640.mp4" type="video/mp4">
</video>

Un clic sur une barre d'événement la met en surbrillance et ouvre une fenêtre contextuelle détaillée.

![20240408171928](https://static-docs.nocobase.com/20240408171928.png)

## Paramètres du bloc

![20240419203321](https://static-docs.nocobase.com/20240419203321.png)

### Afficher le calendrier lunaire

![20240419203603](https://static-docs.nocobase.com/20240419203603.png)

-
-

### Définir la plage de données

![20240419203751](https://static-docs.nocobase.com/20240419203751.png)

Pour plus d'informations, consultez .

### Définir la hauteur du bloc

Exemple : Ajustez la hauteur du bloc Calendrier des commandes. Aucune barre de défilement n'apparaîtra à l'intérieur du bloc calendrier.

![20240605215742](https://static-docs.nocobase.com/20240605215742.gif)

Pour plus d'informations, consultez

### Champ de couleur d'arrière-plan

:::info{title=Astuce}
Votre version de NocoBase doit être v1.4.0-beta ou supérieure.
:::

Cette option permet de configurer la couleur d'arrière-plan des événements du calendrier. Voici comment l'utiliser :

1.  Votre [collection](#) de données de calendrier doit contenir un champ de type **Sélection unique (Single select)** ou **Groupe de boutons radio (Radio group)**, et ce champ doit être configuré avec des couleurs.
2.  Ensuite, retournez à l'interface de configuration du bloc Calendrier et sélectionnez le champ que vous venez de configurer avec des couleurs dans le **Champ de couleur d'arrière-plan**.
3.  Enfin, vous pouvez essayer de sélectionner une couleur pour un événement du calendrier et de cliquer sur Soumettre. Vous verrez que la couleur a été appliquée.

![20240914192017_rec_](https://static-docs.nocobase.com/20240914192017_rec_.gif)

### Jour de début de semaine

> Pris en charge à partir de la version v1.7.7

Le bloc Calendrier permet de définir le jour de début de la semaine. Vous pouvez choisir le **dimanche** ou le **lundi** comme premier jour de la semaine.
Le jour de début par défaut est le **lundi**, ce qui permet aux utilisateurs d'adapter facilement l'affichage du calendrier aux habitudes régionales pour une meilleure expérience d'utilisation.

![20250707165958](https://static-docs.nocobase.com/20250707165958.png)

## Actions de configuration

![20240419203424](https://static-docs.nocobase.com/20240419203424.png)

### Aujourd'hui

Le bouton « Aujourd'hui » du bloc Calendrier offre une navigation rapide, permettant aux utilisateurs de revenir instantanément à la date actuelle après avoir exploré d'autres dates.

![20240419203514](https://static-docs.nocobase.com/20240419203514.png)

### Changer de vue

La vue par défaut est le mois.

![20240419203349](https://static-docs.nocobase.com/20240419203349.png)