---
pkg: "@nocobase/plugin-field-m2m-array"
title: "Plusieurs-à-plusieurs (tableau)"
description: "Utiliser un champ tableau pour enregistrer plusieurs clés uniques de la table cible et établir une relation plusieurs-à-plusieurs, par exemple entre des articles et des étiquettes, sans table intermédiaire."
keywords: "plusieurs-à-plusieurs tableau,M2M Array,relation par tableau,BelongsToMany,NocoBase"
---
# Plusieurs-à-plusieurs (tableau)

## Introduction

Prend en charge l'utilisation d'un champ tableau dans une table de données pour enregistrer plusieurs clés uniques de la table cible et ainsi établir une relation plusieurs-à-plusieurs avec celle-ci. Par exemple, il existe deux entités, les articles et les étiquettes. Un article peut être associé à plusieurs étiquettes ; dans la table des articles, un champ tableau enregistre les ID des enregistrements correspondants de la table des étiquettes.

:::warning{title=Attention}

- Dans la mesure du possible, utilisez une table intermédiaire pour établir une relation [plusieurs-à-plusieurs](../data-modeling/collection-fields/associations/m2m/index.md) standard, afin d'éviter d'utiliser ce type de relation.
- Pour les relations plusieurs-à-plusieurs établies à l'aide d'un champ tableau, seul PostgreSQL prend actuellement en charge le filtrage des données de la table source à l'aide des champs de la table cible. Par exemple, dans l'exemple ci-dessus, vous pouvez filtrer les articles à l'aide d'autres champs de la table des étiquettes, comme le titre.
  :::

### Configuration du champ

![many-to-many(array) field configuration](https://static-docs.nocobase.com/202407051108180.png)

## Description des paramètres

### Collection source

Table source, c'est-à-dire la table dans laquelle se trouve le champ actuel.

### Collection cible

Table cible, à laquelle la relation est établie.

### Clé étrangère

Champ tableau qui stocke la clé cible de la table cible dans la table source.

Correspondance des types de champs tableau :

| NocoBase | PostgreSQL | MySQL  | SQLite |
| -------- | ---------- | ------ | ------ |
| `set`    | `array`    | `JSON` | `JSON` |

### Clé cible

Champ correspondant aux valeurs stockées dans le champ tableau de la table source ; il doit être unique.
