---
title: "Un-à-un"
description: "Champ de relation un-à-un (O2O), où deux entités de table correspondent une à une, utilisé pour stocker séparément différents aspects d’une entité."
keywords: "Un-à-un,O2O,HasOne,BelongsTo,Champ de relation,NocoBase"
---

# Un-à-un

La relation entre les employés et leurs profils personnels : chaque employé ne peut avoir qu’un seul profil personnel, et chaque profil personnel ne peut correspondre qu’à un seul employé. Dans ce cas, les employés et les profils personnels sont liés par une relation un-à-un.

Pour une relation un-à-un, la clé étrangère peut être placée dans la table source ou dans la table cible. Si elle représente « possède un », il est plus approprié de placer la clé étrangère dans la table cible ; si elle représente une « appartenance », il est plus approprié de la placer dans la table source.

Dans l’exemple ci-dessus, un employé ne possède qu’un seul profil personnel, et le profil personnel appartient à l’employé. Il est donc préférable de placer cette clé étrangère dans la table des profils personnels.

## Un-à-un (possède un)

Indique qu’un employé possède un profil personnel

Relation ER

![texte alternatif](https://static-docs.nocobase.com/4359e128936bbd7c9ff51bcff1d646dd.png)

Configuration du champ

![texte alternatif](https://static-docs.nocobase.com/7665a87e094b4fb50c9426a108f87105.png)

## Un-à-un (appartenance)

Indique qu’un profil personnel appartient à un employé

Relation ER

![](https://static-docs.nocobase.com/31e7cc3e630220cf1e98753ca24ac72d.png)

Configuration du champ

![texte alternatif](https://static-docs.nocobase.com/4f09eeb3c7717d61a349842da43c187c.png)

## Description des paramètres

### Source collection

Table source, c’est-à-dire la table dans laquelle se trouve le champ actuel.

### Target collection

Table cible, avec laquelle la relation est établie.

### Foreign key

Utilisée pour établir la relation entre les deux tables. Pour une relation un-à-un, la clé étrangère peut être placée dans la table source ou dans la table cible. Si elle représente « possède un », il est plus approprié de placer la clé étrangère dans la table cible ; si elle représente une « appartenance », il est plus approprié de la placer dans la table source.

### Source key <- Foreign key (clé étrangère dans la table cible)

Champ référencé par la contrainte de clé étrangère, qui doit être unique. Lorsque la clé étrangère se trouve dans la table cible, elle représente « possède un ».

### Target key <- Foreign key (clé étrangère dans la table source)

Champ référencé par la contrainte de clé étrangère, qui doit être unique. Lorsque la clé étrangère se trouve dans la table source, elle représente une « appartenance ».

### ON DELETE

ON DELETE désigne la règle d’opération appliquée aux références de clé étrangère dans la table enfant lors de la suppression d’un enregistrement dans la table parente. Il s’agit d’une option utilisée lors de la définition d’une contrainte de clé étrangère. Les options ON DELETE courantes incluent :

- CASCADE : lors de la suppression d’un enregistrement dans la table parente, tous les enregistrements associés de la table enfant sont automatiquement supprimés.
- SET NULL : lors de la suppression d’un enregistrement dans la table parente, la valeur de clé étrangère associée dans la table enfant est définie sur NULL.
- RESTRICT : option par défaut ; si des enregistrements associés existent dans la table enfant lors d’une tentative de suppression d’un enregistrement de la table parente, la suppression de l’enregistrement parent est refusée.
- NO ACTION : similaire à RESTRICT ; si des enregistrements associés existent dans la table enfant, la suppression de l’enregistrement parent est refusée.