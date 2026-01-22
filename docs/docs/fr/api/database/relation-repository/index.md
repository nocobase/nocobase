:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::

# RelationRepository

`RelationRepository` est un objet `Repository` pour les types d'association. Il vous permet d'opérer sur des données associées sans avoir à charger l'association. Chaque type d'association dérive de `RelationRepository` pour fournir une implémentation spécifique :

- [`HasOneRepository`](#has-one-repository)
- `HasManyRepository`
- `BelongsToRepository`
- `BelongsToManyRepository`

## Constructeur

**Signature**

- `constructor(sourceCollection: Collection, association: string, sourceKeyValue: string | number)`

**Paramètres**

| Nom du paramètre   | Type               | Valeur par défaut | Description                                               |
| :----------------- | :----------------- | :---------------- | :-------------------------------------------------------- |
| `sourceCollection` | `Collection`       | -                 | La `collection` correspondant à la relation de référence dans l'association |
| `association`      | `string`           | -                 | Nom de l'association                                      |
| `sourceKeyValue`   | `string \| number` | -                 | La valeur de clé correspondante dans la relation de référence |

## Propriétés de la classe de base

### `db: Database`

Objet de base de données

### `sourceCollection`

La `collection` correspondant à la relation de référence dans l'association

### `targetCollection`

La `collection` correspondant à la relation référencée dans l'association

### `association`

L'objet d'association dans Sequelize correspondant à l'association actuelle

### `associationField`

Le champ dans la `collection` correspondant à l'association actuelle

### `sourceKeyValue`

La valeur de clé correspondante dans la relation de référence