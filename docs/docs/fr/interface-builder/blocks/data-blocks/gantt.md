---
pkg: '@nocobase/plugin-gantt'
title: 'Bloc Gantt'
description: 'Le bloc Gantt affiche les dates de début et de fin ainsi que la progression des enregistrements sur une chronologie. Il convient à la planification de projet, à la planification des tâches et au suivi des jalons, et prend en charge le champ de titre, les champs de date, le champ de progression, le champ de couleur, l’échelle de temps, le tableau de gauche et le popup d’événement.'
keywords: 'Bloc Gantt,Gantt,planification de projet,planification des tâches,chronologie,gestion de progression,construction d’interface,NocoBase'
---

# Bloc Gantt

## Introduction

Le bloc Gantt affiche les dates de début et de fin ainsi que la progression des enregistrements sur une chronologie. Il convient à la planification de projet, à la planification des tâches, au suivi des jalons et aux autres scénarios où tu dois voir la durée des tâches dans le temps.

![](https://static-docs.nocobase.com/Project-tasks-06-11-2026_11_30_AM.png)

## Installation

Ce bloc est un plugin intégré et ne nécessite aucune installation supplémentaire.

## Ajouter un bloc

Après avoir sélectionné le bloc Gantt et choisi une table de données, configure dans le popup les champs requis par le bloc Gantt :

1. Sélectionne le champ de titre, utilisé pour afficher le nom de la tâche
2. Sélectionne le champ de date de début, utilisé pour déterminer le début de la tâche
3. Sélectionne le champ de date de fin, utilisé pour déterminer la fin de la tâche
4. Sélectionne éventuellement le champ de progression, utilisé pour afficher et mettre à jour la progression par glisser-déposer
5. Sélectionne éventuellement le champ de couleur, utilisé pour distinguer les tâches
6. Sélectionne l’échelle de temps, utilisée pour contrôler la granularité de la chronologie

Une fois la configuration terminée, tu peux créer le bloc Gantt.

![](<https://static-docs.nocobase.com/Project-tasks-06-11-2026_11_27_AM%20(1).png>)

![](https://static-docs.nocobase.com/Project-tasks-06-11-2026_11_27_AM.png)

## Paramètres du bloc

![](https://static-docs.nocobase.com/Project-tasks-06-11-2026_11_28_AM.png)

### Champs Gantt

Les champs Gantt déterminent comment les enregistrements sont convertis en tâches sur la chronologie.

Ils incluent :

- Le champ de titre détermine le nom affiché sur la barre de tâche
- Le champ de date de début détermine où commence la barre de tâche
- Le champ de date de fin détermine où se termine la barre de tâche
- Le champ de progression détermine la progression affichée dans la barre de tâche
- Le champ de couleur détermine la couleur de la barre de tâche
- L’échelle de temps détermine si la chronologie s’affiche par heure, jour, semaine, mois, etc.

### Champ de titre

Utilisé pour afficher le nom de la tâche. En général, tu peux sélectionner un champ texte, comme le nom de la tâche, le nom du projet ou le titre.

### Champ de date de début

Utilisé pour préciser l’heure de début de la tâche. Le bloc Gantt utilise ce champ pour placer la tâche sur la chronologie.

### Champ de date de fin

Utilisé pour préciser l’heure de fin de la tâche. Lorsque la date de début et la date de fin sont identiques, la tâche s’affiche comme une période plus courte.

### Champ de progression

Utilisé pour afficher la progression d’une tâche, avec la possibilité de la mettre à jour en faisant glisser la poignée de progression sur la barre de tâche.

Le champ de progression utilise un champ flottant. Les données sont stockées de `0` à `1` et affichées sous forme de pourcentage dans le bloc Gantt. Par exemple, `0.6` s’affiche comme `60%`.

### Champ de couleur

Utilisé pour définir la couleur de la barre de tâche, afin de distinguer plus facilement les types, statuts ou priorités.

Le champ de couleur prend en charge :

- Champ de sélection unique
- Champ de couleur

Si un champ de sélection unique est utilisé, le bloc Gantt réutilise en priorité la couleur configurée sur l’option sélectionnée.

### Échelle de temps

Utilisée pour contrôler la granularité d’affichage de la chronologie.

Actuellement pris en charge :

- Heure
- Quart de journée
- Demi-journée
- Jour
- Semaine
- Mois
- Année
- Trimestre

Pour des tâches courtes, tu peux utiliser heure, demi-journée ou jour. Pour des tâches longues, tu peux utiliser semaine, mois, trimestre ou année.

### Afficher le tableau

Lorsque cette option est activée, le bloc Gantt affiche une zone de tableau à gauche. Tu peux y configurer des colonnes pour afficher les attributs clés des tâches.

Lorsqu’elle est désactivée, le bloc affiche seulement la chronologie à droite. C’est utile lorsque l’espace de page est limité ou que tu veux seulement consulter le planning.

### Largeur du tableau

Utilisée pour définir la largeur de la zone de tableau gauche. Cette option apparaît uniquement lorsque Afficher le tableau est activé.

Si le tableau contient beaucoup de champs, augmente la largeur. Si seuls quelques champs sont conservés, réduis la largeur pour laisser plus d’espace à la chronologie.

### Activer le glisser-déposer pour replanifier

Lorsque cette option est activée, tu peux faire glisser les barres de tâche sur la chronologie pour ajuster les dates de début et de fin.

Dans le détail :

- Faire glisser toute la barre de tâche ajuste à la fois la date de début et la date de fin
- Faire glisser les poignées des deux côtés ajuste la date de début ou la date de fin
- Faire glisser la poignée de progression met à jour le champ de progression

Si tu ne veux pas que les utilisateurs modifient le planning directement dans le bloc Gantt, désactive cette option.

### Faire défiler vers aujourd’hui au premier affichage

Lorsque cette option est activée, le bloc Gantt défile automatiquement vers aujourd’hui lors de son premier affichage.

Cette option convient aux projets dont les tâches s’étendent sur une longue période. À l’ouverture de la page, les utilisateurs voient d’abord les tâches proches de la date actuelle.

### Paramètres du popup d’événement

Utilisés pour configurer l’ouverture d’une barre de tâche après un clic.

Tu peux configurer :

- Mode d’ouverture, comme tiroir, dialogue ou page
- Taille du popup
- Modèle de popup

Après un clic sur une barre de tâche, NocoBase ouvre l’enregistrement actuel selon cette configuration, ce qui facilite la consultation ou la modification des détails de la tâche.

### Portée des données

Utilisée pour limiter les données affichées dans le bloc Gantt.

Par exemple : afficher uniquement les tâches du projet courant ou uniquement les tâches non terminées.

Pour plus de détails, consulte [Portée des données](../block-settings/data-scope).

### Taille de page

Utilisée pour contrôler le nombre d’enregistrements chargés par page. Quand il y a beaucoup d’enregistrements, les utilisateurs peuvent changer de page pour voir davantage de tâches.

### Afficher les numéros de ligne

Lorsque cette option est activée, le tableau gauche affiche les numéros de ligne, ce qui facilite la localisation des enregistrements quand les tâches sont nombreuses.

### Tableau arborescent

Si la table de données actuelle est une table arborescente, le bloc Gantt peut activer le mode tableau arborescent. Une fois activé, le tableau gauche affiche les enregistrements selon la hiérarchie parent-enfant, et la chronologie à droite affiche les tâches avec la même hiérarchie.

En mode tableau arborescent, tu peux aussi configurer Développer toutes les lignes par défaut.

## Configurer les champs

La zone de tableau gauche utilise des colonnes de tableau pour afficher les champs des enregistrements.

![](https://static-docs.nocobase.com/Project-tasks-06-11-2026_11_29_AM.png)

### Ajouter des champs

Après avoir activé Afficher le tableau, tu peux ajouter des colonnes de champs dans le tableau gauche. Les paramètres de champ peuvent se référer à [Colonne de tableau](../../fields/generic/table-column).

### Colonne d’actions

Le bloc Gantt inclut une colonne d’actions par défaut. Tu peux y ajouter des actions d’enregistrement comme afficher, modifier et supprimer.

Si les paramètres du popup d’événement sont déjà configurés, tu peux aussi cliquer directement sur la barre de tâche à droite pour ouvrir les détails de l’enregistrement.

## Configurer les actions

Le bloc Gantt permet de configurer des actions globales en haut du bloc. Les types d’action visibles dépendent des capacités activées dans l’environnement actuel.

![](<https://static-docs.nocobase.com/Project-tasks-06-11-2026_11_29_AM%20(1).png>)

### Actions intégrées

- Aujourd’hui : faire défiler rapidement vers aujourd’hui
- Développer/Réduire : développer ou réduire toutes les lignes en mode tableau arborescent

### Actions globales

- [Ajouter](../../actions/types/add-new)
- [Popup](../../actions/types/pop-up)
- [Lien](../../actions/types/link)
- [Actualiser](../../actions/types/refresh)
- [Filtre](../../actions/types/filter)
- [Modification en masse](../../actions/types/bulk-edit)
- [Mise à jour en masse](../../actions/types/bulk-update)
- [Déclencher un workflow](../../actions/types/trigger-workflow)
- [Requête personnalisée](../../actions/types/custom-request)
- [JS Item](../../actions/types/js-item)
- [JS Action](../../actions/types/js-action)
- [Employé IA](../../actions/types/ai-employee)
