:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::

# Plusieurs-à-plusieurs

Dans un système de gestion des inscriptions aux cours, il existe deux entités : les étudiants et les cours. Un étudiant peut s'inscrire à plusieurs cours, et un cours peut accueillir plusieurs étudiants. Cela constitue une relation plusieurs-à-plusieurs. Dans une base de données relationnelle, pour représenter cette relation plusieurs-à-plusieurs entre les étudiants et les cours, on utilise généralement une `collection` intermédiaire, comme une `collection` d'inscriptions. Cette `collection` peut enregistrer les cours choisis par chaque étudiant et les étudiants inscrits à chaque cours. Cette conception permet de représenter efficacement la relation plusieurs-à-plusieurs entre les étudiants et les cours.

Diagramme ER :

![Diagramme ER](https://static-docs.nocobase.com/0e9921228e1ee375dc639431bb89782c.png)

Configuration des champs :

![Configuration des champs](https://static-docs.nocobase.com/8e2739ac5d44fb46f30e2da42ca87a82.png)

## Description des paramètres

### `Collection` source

La `collection` source est celle où se trouve le champ actuel.

### `Collection` cible

La `collection` cible est celle à laquelle vous souhaitez établir une association.

### `Collection` intermédiaire

La `collection` intermédiaire est utilisée lorsqu'une relation plusieurs-à-plusieurs existe entre deux entités. Elle sert à stocker cette relation. Une `collection` intermédiaire possède deux clés étrangères qui maintiennent l'association entre les deux entités.

### Clé source

Le champ de la `collection` source référencé par la clé étrangère. Il doit être unique.

### Clé étrangère 1

Le champ de la `collection` intermédiaire qui établit l'association avec la `collection` source.

### Clé étrangère 2

Le champ de la `collection` intermédiaire qui établit l'association avec la `collection` cible.

### Clé cible

Le champ de la `collection` cible référencé par la clé étrangère. Il doit être unique.

### ON DELETE

`ON DELETE` fait référence aux règles appliquées aux références de clés étrangères dans les `collections` enfants liées, lorsque des enregistrements sont supprimés dans la `collection` parente. C'est une option utilisée lors de la définition d'une contrainte de clé étrangère. Les options `ON DELETE` courantes sont les suivantes :

-   **CASCADE** : Lorsque vous supprimez un enregistrement dans la `collection` parente, tous les enregistrements liés dans la `collection` enfant sont automatiquement supprimés.
-   **SET NULL** : Lorsque vous supprimez un enregistrement dans la `collection` parente, les valeurs des clés étrangères des enregistrements liés dans la `collection` enfant sont définies sur `NULL`.
-   **RESTRICT** : C'est l'option par défaut. Elle empêche la suppression d'un enregistrement de la `collection` parente s'il existe des enregistrements liés dans la `collection` enfant.
-   **NO ACTION** : Similaire à `RESTRICT`, cette option empêche la suppression d'un enregistrement de la `collection` parente s'il existe des enregistrements liés dans la `collection` enfant.