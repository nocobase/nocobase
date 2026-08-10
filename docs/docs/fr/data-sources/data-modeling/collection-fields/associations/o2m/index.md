---
title: "Un-à-plusieurs"
description: "Champ de relation un-à-plusieurs (O2M), une entité associée à plusieurs entités enfants, comme auteur-articles."
keywords: "un-à-plusieurs,O2M,HasMany,association,NocoBase"
---

# Un-à-plusieurs

La relation entre une classe et ses élèves : une classe peut avoir plusieurs élèves, mais un élève ne peut appartenir qu'à une seule classe. Dans ce cas, la classe et les élèves forment une relation un-à-plusieurs.

La relation ER est la suivante

![texte alternatif](https://static-docs.nocobase.com/9475f044d123d28ac8e56a077411f8dc.png)

Configuration du champ

![texte alternatif](https://static-docs.nocobase.com/a608ce54821172dad7e8ab760107ff4e.png)

## Description des paramètres

### Source collection

Table source, c'est-à-dire la table dans laquelle se trouve le champ actuel.

### Target collection

Table cible, celle à laquelle la table source est associée.

### Source key

Champ référencé par la contrainte de clé étrangère, qui doit être unique.

### Foreign key

Champ de la table cible utilisé pour établir l'association entre les deux tables.

### Target key

Champ de la table cible utilisé pour afficher chaque enregistrement de la section de relation ; il s'agit généralement d'un champ unique.

### ON DELETE

ON DELETE désigne la règle appliquée aux références de clé étrangère de la table enfant lors de la suppression d'un enregistrement de la table parent. Il s'agit d'une option utilisée lors de la définition d'une contrainte de clé étrangère. Les options ON DELETE courantes sont les suivantes :

- CASCADE : lors de la suppression d'un enregistrement de la table parent, tous les enregistrements associés de la table enfant sont automatiquement supprimés.
- SET NULL : lors de la suppression d'un enregistrement de la table parent, la valeur de la clé étrangère correspondante dans la table enfant est définie sur NULL.
- RESTRICT : option par défaut ; si des enregistrements associés existent dans la table enfant lors d'une tentative de suppression d'un enregistrement de la table parent, la suppression de l'enregistrement parent est refusée.
- NO ACTION : similaire à RESTRICT ; si des enregistrements associés existent dans la table enfant, la suppression de l'enregistrement parent est refusée.