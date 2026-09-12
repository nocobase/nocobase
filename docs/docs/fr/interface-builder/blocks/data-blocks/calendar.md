---
pkg: "@nocobase/plugin-calendar"
title: "Bloc Calendrier"
description: "Le bloc Calendrier affiche les événements et les données de date dans une vue calendrier, adapté aux scénarios tels que la planification de réunions ou d'activités. Il prend en charge la configuration du champ titre, des dates de début et de fin, l'affichage du calendrier lunaire et la portée des données."
keywords: "bloc calendrier, vue calendrier, gestion d'événements, planification de réunions, Calendar, NocoBase"
---

# Bloc Calendrier

## Introduction

Le bloc Calendrier affiche, dans une vue calendrier intuitive, les événements et les données liées aux dates. Il est adapté aux scénarios typiques tels que la planification de réunions ou d'activités.

![](https://static-docs.nocobase.com/Calendar-04-13-2026_03_27_PM.png)

## Installation

Ce bloc est un plugin intégré, aucune installation supplémentaire n'est nécessaire.

## Ajouter un bloc

![](https://static-docs.nocobase.com/Calendar-04-13-2026_03_39_PM.png)

Sélectionnez le bloc «Calendrier» et indiquez la collection correspondante pour terminer la création.

## Options de configuration du bloc

![](https://static-docs.nocobase.com/Calendar-04-23-2026_10_38_AM.png)

### Champ titre

Utilisé pour afficher les informations de titre sur la barre d'événement du calendrier.

Les types de champs actuellement pris en charge incluent : `input`, `select`, `phone`, `email`, `radioGroup`, `sequence`, etc. D'autres types peuvent être ajoutés via des plugins.

### Champ date de début

Utilisé pour spécifier l'heure de début de l'événement.

### Champ date de fin

Utilisé pour spécifier l'heure de fin de l'événement.

### Création rapide d'un événement

Cliquez sur une zone de date vide dans le calendrier pour ouvrir rapidement une fenêtre de création d'événement.

![](https://static-docs.nocobase.com/Add-new-04-23-2026_10_39_AM.png)

Lorsque vous cliquez sur un événement existant :
- L'événement courant est mis en surbrillance
- Une fenêtre de détails s'ouvre simultanément, pour faciliter la consultation ou la modification

### Afficher le calendrier lunaire

Une fois activée, les informations correspondantes du calendrier lunaire sont affichées dans le calendrier.

![](https://static-docs.nocobase.com/Calendar-04-23-2026_10_41_AM.png)

### Portée des données

Utilisée pour limiter la portée des données affichées dans le bloc Calendrier.

![](https://static-docs.nocobase.com/Calendar-04-13-2026_03_30_PM.png)

Pour plus d'informations, consultez : [Définir la portée des données](/interface-builder/blocks/block-settings/data-scope)

### Hauteur du bloc

Vous pouvez personnaliser la hauteur du bloc Calendrier afin d'éviter l'apparition d'une barre de défilement interne, et améliorer l'expérience générale de mise en page.

![](https://static-docs.nocobase.com/Calendar-04-13-2026_03_30_PM%20(1).png)

Pour plus d'informations, consultez : [Hauteur du bloc](/interface-builder/blocks/block-settings/block-height)

### Champ couleur

Utilisé pour configurer la couleur d'arrière-plan des événements du calendrier, afin d'améliorer la distinction visuelle.

Étapes d'utilisation :

1. Ajoutez un champ **liste déroulante à choix unique (Single select)** ou **boutons radio (Radio group)** dans la collection, et configurez les couleurs des options ;
2. Dans la configuration du bloc Calendrier, définissez ce champ comme «Champ couleur» ;
3. Lors de la création ou de la modification d'un événement, sélectionnez une couleur pour qu'elle prenne effet dans le calendrier.

![](https://static-docs.nocobase.com/Calendar-04-23-2026_10_41_AM%20(1).png)

### Premier jour de la semaine

Vous pouvez définir le jour de début de chaque semaine, au choix :
- Dimanche
- Lundi (par défaut)

Vous pouvez l'ajuster en fonction des habitudes locales pour que l'affichage du calendrier corresponde mieux aux besoins réels.


## Configurer les actions

![](https://static-docs.nocobase.com/Calendar-04-13-2026_03_32_PM.png)

### Aujourd'hui

Cliquez sur le bouton «Aujourd'hui» pour revenir rapidement à la vue calendrier de la date courante.

### Changer de page

Selon le mode de vue courant, basculez la période :
- Vue mois : mois précédent / mois suivant
- Vue semaine : semaine précédente / semaine suivante
- Vue jour : hier / demain

### Sélectionner une vue

Vous pouvez basculer entre les vues suivantes :
- Vue mois (par défaut)
- Vue semaine
- Vue jour

### Titre

Affiche la date correspondant à la vue courante.
