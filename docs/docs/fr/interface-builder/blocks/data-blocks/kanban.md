---
pkg: "@nocobase/plugin-kanban"
title: "Bloc Kanban"
description: "Bloc Kanban : affiche les enregistrements de données en colonnes par groupe, prend en charge le changement de style, la création rapide, la configuration des popups, le tri par glisser-déposer et l'ouverture des cartes au clic."
keywords: "bloc kanban,Kanban,regroupement de données,tri par glisser-déposer,création rapide,paramètres de popup,disposition des cartes,interface builder,NocoBase"
---

# Kanban

## Introduction

Le bloc Kanban affiche les enregistrements de données en colonnes regroupées. Il est adapté aux scénarios qui nécessitent de visualiser et de faire avancer les données par étapes, comme le suivi de l'état des tâches, le suivi des étapes de vente ou le traitement des tickets.

![](https://static-docs.nocobase.com/Kanban-04-17-2026_01_51_PM.png)

## Options de configuration du bloc

![](https://static-docs.nocobase.com/Kanban-04-22-2026_09_53_PM.png)

### Paramètres de regroupement

Le bloc Kanban doit d'abord spécifier un champ de regroupement. Le système répartit les enregistrements dans différentes colonnes selon la valeur du champ.

- Le champ de regroupement prend en charge les champs à choix unique et les champs many-to-one.
- Pour un champ à choix unique, le titre et la couleur de la colonne reprennent directement l'étiquette et la couleur configurées dans les options du champ.
- Pour un champ many-to-one, les options de regroupement sont chargées à partir des enregistrements de la table associée.
- Lorsque le champ de regroupement est un champ many-to-one, vous pouvez configurer en plus :
	- Champ titre : détermine quel champ associé est affiché dans l'en-tête de colonne.
	- Champ couleur : détermine la couleur d'arrière-plan de l'en-tête et du conteneur de la colonne.
- L'option «Sélectionner les valeurs de regroupement» permet de contrôler quelles colonnes sont affichées et leur ordre d'affichage.
- Les enregistrements dont la valeur de regroupement est vide sont affichés dans la colonne «Inconnu».

![](https://static-docs.nocobase.com/Kanban-04-22-2026_09_53_PM%20(1).png)
![](https://static-docs.nocobase.com/Kanban-04-22-2026_09_54_PM.png)

### Style

Le Kanban prend en charge deux styles de colonne :

- `Classic` : conserve un arrière-plan de colonne par défaut plus léger.
- `Filled` : utilise la couleur de la colonne pour rendre l'en-tête et l'arrière-plan du conteneur de la colonne. Adapté aux scénarios où les couleurs d'état sont plus marquées.

![](https://static-docs.nocobase.com/Kanban-04-22-2026_09_54_PM%20(1).png)

### Paramètres de glisser-déposer

Une fois le glisser-déposer activé, vous pouvez faire glisser les cartes pour ajuster leur ordre.

- Après avoir activé «Activer le tri par glisser-déposer», vous pouvez ensuite choisir le «Champ de tri par glisser-déposer».
- Le tri par glisser-déposer dépend du champ de tri ; le champ de tri doit correspondre au champ de regroupement courant.
- Lorsque vous faites glisser une carte vers une autre colonne, la valeur du champ de regroupement et la position de tri de l'enregistrement sont mises à jour simultanément.

Pour plus d'informations, consultez [Champ de tri](/data-sources/field-sort)

![](https://static-docs.nocobase.com/Kanban-04-22-2026_09_55_PM.png)

### Création rapide

Une fois la «Création rapide» activée, un bouton plus apparaît à droite du titre de chaque colonne.

- Cliquer sur le plus de l'en-tête de colonne ouvre la popup de création avec la colonne courante comme contexte.
- Le formulaire de création est automatiquement pré-rempli avec la valeur de regroupement correspondant à la colonne courante.
- Si la colonne courante est la colonne «Inconnu», le champ de regroupement est pré-rempli avec une valeur vide.

![](https://static-docs.nocobase.com/Kanban-04-22-2026_09_57_PM.png)

### Paramètres de popup

Les «Paramètres de popup» au niveau du bloc contrôlent le comportement de la popup ouverte par le bouton de création rapide de l'en-tête de colonne.

- Vous pouvez configurer le mode d'ouverture, par exemple tiroir, boîte de dialogue ou page.
- Vous pouvez configurer la taille de la popup.
- Vous pouvez lier un modèle de popup ou continuer à ajouter du contenu de bloc dans la popup.

### Nombre d'éléments par page et par colonne

Permet de contrôler le nombre d'enregistrements chargés initialement dans chaque colonne. Lorsqu'il y a beaucoup d'enregistrements dans une colonne, vous pouvez continuer à faire défiler pour en charger davantage.

### Largeur de colonne

Permet de définir la largeur de chaque colonne, afin d'ajuster l'affichage en fonction de la densité du contenu des cartes.

### Définir la portée des données

Utilisée pour limiter la portée des données affichées dans le bloc Kanban.

Par exemple : afficher uniquement les tâches créées par le responsable courant, ou uniquement les enregistrements appartenant à un projet spécifique.

Pour plus d'informations, consultez [Définir la portée des données](/interface-builder/blocks/block-settings/data-scope)


## Configurer les champs

L'intérieur d'une carte Kanban utilise une disposition de champs de type détails pour afficher les informations résumées de l'enregistrement.

### Ajouter un champ

![](https://static-docs.nocobase.com/Kanban-04-17-2026_01_55_PM.png)

Pour les options de configuration des champs, consultez [Champ de détails](/interface-builder/fields/generic/detail-form-item)

### Paramètres de la carte

La carte elle-même prend en charge les paramètres suivants :

- Activer l'ouverture au clic : une fois activé, cliquer sur la carte ouvre l'enregistrement courant.
- Paramètres de popup : permettent de configurer séparément le mode d'ouverture, la taille et le modèle de popup au clic sur la carte.
- Disposition : permet d'ajuster la disposition d'affichage des champs dans la carte.

![](https://static-docs.nocobase.com/Kanban-04-22-2026_09_56_PM.png)

![](https://static-docs.nocobase.com/Kanban-04-17-2026_01_55_PM%20(2).png)

## Configurer les actions

Le bloc Kanban prend en charge la configuration d'actions globales en haut. Les types d'actions visibles varient en fonction des capacités d'action activées dans l'environnement courant.

![](https://static-docs.nocobase.com/Kanban-04-22-2026_10_02_PM.png)

### Actions globales

- [Ajouter](/interface-builder/actions/types/add-new)
- [Popup](/interface-builder/actions/types/pop-up)
- [Lien](/interface-builder/actions/types/link)
- [Rafraîchir](/interface-builder/actions/types/refresh)
- [Requête personnalisée](/interface-builder/actions/types/custom-request)
- [JS Action](/interface-builder/actions/types/js-action)
- [Employé IA](/interface-builder/actions/types/ai-employee)
