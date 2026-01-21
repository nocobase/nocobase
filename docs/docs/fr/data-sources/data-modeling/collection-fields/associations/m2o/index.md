:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::

# Plusieurs-à-un

Dans une base de données de bibliothèque, il y a deux entités : les livres et les auteurs. Un auteur peut écrire plusieurs livres, mais chaque livre n'a généralement qu'un seul auteur. Dans ce cas, la relation entre les auteurs et les livres est de type plusieurs-à-un. Plusieurs livres peuvent être associés au même auteur, mais chaque livre ne peut avoir qu'un seul auteur.

Diagramme ER :

![alt text](https://static-docs.nocobase.com/eaeeac974844db05c75cf0deeedf3652.png)

Configuration des champs :

![alt text](https://static-docs.nocobase.com/3b4484ebb98d82f832f3dbf752bd84c9.png)

## Description des paramètres

### Source collection
La collection source, c'est-à-dire la collection où se trouve le champ actuel.

### Target collection
La collection cible, c'est-à-dire la collection à laquelle elle est associée.

### Foreign key
Le champ de la collection source qui est utilisé pour établir l'association entre les deux collections.

### Target key
Le champ de la collection cible référencé par la clé étrangère. Il doit être unique.

### ON DELETE
ON DELETE fait référence aux règles appliquées aux références de clés étrangères dans les collections enfants associées lors de la suppression d'enregistrements dans la collection parente. C'est une option utilisée lors de la définition d'une contrainte de clé étrangère. Les options ON DELETE courantes incluent :

- **CASCADE** : Lorsque vous supprimez un enregistrement dans la collection parente, tous les enregistrements associés dans la collection enfant sont automatiquement supprimés.
- **SET NULL** : Lorsque vous supprimez un enregistrement dans la collection parente, les valeurs de clé étrangère des enregistrements associés dans la collection enfant sont définies sur NULL.
- **RESTRICT** : L'option par défaut. Elle empêche la suppression d'un enregistrement de la collection parente s'il existe des enregistrements associés dans la collection enfant.
- **NO ACTION** : Similaire à RESTRICT. Elle empêche la suppression d'un enregistrement de la collection parente s'il existe des enregistrements associés dans la collection enfant.