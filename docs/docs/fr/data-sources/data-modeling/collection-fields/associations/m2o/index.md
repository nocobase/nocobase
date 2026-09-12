---
title: "Plusieurs-à-un"
description: "Champ de relation plusieurs-à-un (M2O), plusieurs entités associées à une même entité parente, comme des élèves et une classe."
keywords: "Plusieurs-à-un,M2O,BelongsTo,association,NocoBase"
---


# Plusieurs-à-un

Prenons une base de données de bibliothèque contenant deux entités : les livres et les auteurs. Un auteur peut écrire plusieurs livres, mais chaque livre n’a qu’un seul auteur (dans la plupart des cas). Il s’agit donc d’une relation plusieurs-à-un entre les auteurs et les livres. Plusieurs livres peuvent être associés au même auteur, mais chaque livre ne peut avoir qu’un seul auteur.

La relation ER est la suivante

![texte alternatif](https://static-docs.nocobase.com/eaeeac974844db05c75cf0deeedf3652.png)

Configuration du champ

![texte alternatif](https://static-docs.nocobase.com/3b4484ebb98d82f832f3dbf752bd84c9.png)

## Description des paramètres

### Collection source

Table source, c’est-à-dire la table dans laquelle se trouve le champ actuel.

### Collection cible

Table cible, à laquelle la relation est établie.

### Clé étrangère

Champ de la table source utilisé pour établir la relation entre les deux tables.

### Clé cible

Champ référencé par la contrainte de clé étrangère, qui doit être unique.

### ON DELETE

ON DELETE désigne la règle appliquée aux références de clé étrangère dans la table enfant lors de la suppression d’un enregistrement dans la table parente. Il s’agit d’une option permettant de définir une contrainte de clé étrangère. Les options ON DELETE courantes incluent :

- CASCADE : lors de la suppression d’un enregistrement dans la table parente, tous les enregistrements associés de la table enfant sont automatiquement supprimés.
- SET NULL : lors de la suppression d’un enregistrement dans la table parente, la valeur de la clé étrangère associée dans la table enfant est définie sur NULL.
- RESTRICT : option par défaut ; si des enregistrements associés existent dans la table enfant lors de la tentative de suppression d’un enregistrement de la table parente, la suppression de ce dernier est refusée.
- NO ACTION : similaire à RESTRICT ; si des enregistrements associés existent dans la table enfant, la suppression de l’enregistrement de la table parente est refusée.