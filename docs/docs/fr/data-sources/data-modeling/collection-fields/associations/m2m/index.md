---
title: "Relation plusieurs-à-plusieurs"
description: "Les champs de relation plusieurs-à-plusieurs (M2M) permettent d'associer deux entités selon une relation plusieurs-à-plusieurs, généralement à l'aide d'une table intermédiaire, comme dans le cas étudiants-cours."
keywords: "plusieurs-à-plusieurs,M2M,BelongsToMany,table intermédiaire,champ de relation,NocoBase"
---

# Relation plusieurs-à-plusieurs

Dans un système d'inscription aux cours, il existe deux entités : les étudiants et les cours. Un étudiant peut suivre plusieurs cours, et un cours peut également être suivi par plusieurs étudiants : il s'agit d'une relation plusieurs-à-plusieurs. Dans une base de données relationnelle, une table intermédiaire, par exemple une table d'inscription, est généralement utilisée pour représenter la relation plusieurs-à-plusieurs entre les étudiants et les cours. Cette table permet d'enregistrer les cours choisis par chaque étudiant ainsi que les étudiants inscrits à chaque cours. Cette conception représente efficacement la relation plusieurs-à-plusieurs entre les étudiants et les cours.

La relation ER est la suivante

![texte alternatif](https://static-docs.nocobase.com/0e9921228e1ee375dc639431bb89782c.png)

Configuration des champs

![texte alternatif](https://static-docs.nocobase.com/8e2739ac5d44fb46f30e2da42ca87a82.png)

## Description des paramètres

### Collection source

Table source, c'est-à-dire la table dans laquelle se trouve le champ actuel.

### Collection cible

Table cible, avec laquelle l'association est établie.

### Collection intermédiaire

Table intermédiaire. Lorsqu'une relation plusieurs-à-plusieurs existe entre deux entités, une table intermédiaire est nécessaire pour stocker cette relation. La table intermédiaire contient deux clés étrangères qui permettent d'enregistrer l'association entre les deux entités.

### Clé source

Champ référencé par la contrainte de clé étrangère, qui doit être unique.

### Clé étrangère 1

Champ de la table intermédiaire utilisé pour établir l'association avec la table source.

### Clé étrangère 2

Champ de la table intermédiaire utilisé pour établir l'association avec la table cible.

### Clé cible

Champ référencé par la contrainte de clé étrangère, qui doit être unique.

### ON DELETE

ON DELETE désigne la règle appliquée aux références de clé étrangère dans la table enfant lors de la suppression d'un enregistrement dans la table parent. Il s'agit d'une option utilisée lors de la définition d'une contrainte de clé étrangère. Les options ON DELETE courantes sont les suivantes :

- CASCADE : lors de la suppression d'un enregistrement dans la table parent, tous les enregistrements associés de la table enfant sont automatiquement supprimés.
- SET NULL : lors de la suppression d'un enregistrement dans la table parent, la valeur de la clé étrangère correspondante dans la table enfant est définie sur NULL.
- RESTRICT : option par défaut. Lorsqu'une tentative de suppression d'un enregistrement dans la table parent est effectuée, la suppression est refusée si des enregistrements associés existent dans la table enfant.
- NO ACTION : similaire à RESTRICT. Si des enregistrements associés existent dans la table enfant, la suppression de l'enregistrement dans la table parent est refusée.