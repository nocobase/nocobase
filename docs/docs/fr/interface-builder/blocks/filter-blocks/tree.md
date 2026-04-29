---
title: "Bloc de filtre Arbre"
description: "Bloc de filtre Arbre : affiche les conditions de filtrage sous forme d'arborescence, applique un filtrage hiérarchique sur les blocs de données. Adapté aux scénarios de filtrage en cascade pour les données arborescentes."
keywords: "filtre arbre, TreeFilter, filtre arborescent, filtre hiérarchique, rafraîchissement en cascade, interface builder, NocoBase"
---

# Filtre Arbre

## Introduction

Le bloc de filtre Arbre fournit une capacité de filtrage des données via une structure arborescente. Il est adapté aux scénarios de données présentant des relations hiérarchiques, par exemple les catégories de produits, l'organigramme, etc.  
L'utilisateur peut sélectionner des nœuds de différents niveaux pour appliquer un filtrage en cascade aux blocs de données associés.

## Comment l'utiliser

Le bloc de filtre Arbre doit être utilisé conjointement avec un bloc de données auquel il fournit la capacité de filtrage.

Étapes de configuration :

1. Activez le mode configuration, et ajoutez un bloc «Filtre Arbre» et un bloc de données (par exemple un «Bloc Tableau») dans la page.
2. Configurez le bloc de filtre Arbre en sélectionnant une collection arborescente (par exemple, une table des catégories de produits).
3. Définissez la relation de connexion entre le bloc de filtre Arbre et le bloc de données.
4. Une fois la configuration terminée, cliquez sur un nœud de l'arbre pour appliquer un filtre au bloc de données.

## Ajouter un bloc

En mode configuration, cliquez sur le bouton «Ajouter un bloc» de la page, puis dans la catégorie «Blocs de filtre», sélectionnez «Arbre» pour terminer l'ajout.

![](https://static-docs.nocobase.com/Tree-filter-04-07-2026_02_35_PM.png)

## Options de configuration du bloc

![](https://static-docs.nocobase.com/Tree-filter-04-07-2026_03_12_PM%20(1).png)

### Connecter un bloc de données

Le bloc de filtre Arbre doit être connecté à un bloc de données pour être actif.  
Via l'option «Connecter un bloc de données», vous pouvez établir une relation de cascade entre le filtre Arbre et les blocs de tableau, de liste, de graphique, etc. de la page, et ainsi obtenir la fonctionnalité de filtrage.

![](https://static-docs.nocobase.com/Tree-filter-04-07-2026_03_14_PM.png)

### Champ titre

Permet de spécifier le champ affiché pour les nœuds de l'arbre (le nom du nœud).

### Recherche

Une fois activée, vous pouvez rechercher rapidement et localiser des nœuds de l'arbre par mot-clé, ce qui améliore l'efficacité de la recherche.

### Tout déplier

Contrôle si tous les nœuds de l'arbre sont dépliés par défaut au premier chargement de la page.

### Filtrer les nœuds enfants

Une fois activé, lorsque vous sélectionnez un nœud, le filtrage inclut également les données de tous ses nœuds enfants.  
Adapté aux scénarios où vous devez consulter toutes les données des sous-niveaux par catégorie parente.
