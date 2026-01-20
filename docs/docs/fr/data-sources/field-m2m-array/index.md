---
pkg: "@nocobase/plugin-field-m2m-array"
---
:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::


# Relation plusieurs-à-plusieurs (array)

## Introduction

Cette fonctionnalité vous permet d'utiliser des champs de type array dans une collection de données pour stocker plusieurs clés uniques de la table cible, établissant ainsi une relation plusieurs-à-plusieurs entre les deux tables. Par exemple, imaginez les entités Articles et Tags. Un article peut être lié à plusieurs tags, et la table des articles stockerait les ID des enregistrements correspondants de la table des tags dans un champ de type array.

:::warning{title=Attention}

- Dans la mesure du possible, nous vous recommandons d'utiliser une collection intermédiaire pour établir une relation [plusieurs-à-plusieurs](../data-modeling/collection-fields/associations/m2m/index.md) standard, plutôt que de vous fier à cette méthode.
- Actuellement, seul PostgreSQL prend en charge le filtrage des données de la collection source à l'aide de champs de la table cible pour les relations plusieurs-à-plusieurs établies avec des champs de type array. Par exemple, dans le scénario ci-dessus, vous pouvez filtrer les articles en fonction d'autres champs de la table des tags, comme le titre.
  :::

### Configuration du champ

![many-to-many(array) field configuration](https://static-docs.nocobase.com/202407051108180.png)

## Description des paramètres

### Source collection

La collection source, c'est-à-dire la collection où se trouve le champ actuel.

### Target collection

La collection cible, celle avec laquelle la relation est établie.

### Foreign key

Le champ de type array dans la collection source qui stocke la clé cible de la table cible.

Les correspondances pour les types de champs de type array sont les suivantes :

| NocoBase | PostgreSQL | MySQL  | SQLite |
| -------- | ---------- | ------ | ------ |
| `set`    | `array`    | `JSON` | `JSON` |

### Target key

Le champ de la collection cible qui correspond aux valeurs stockées dans le champ de type array de la table source. Ce champ doit être unique.