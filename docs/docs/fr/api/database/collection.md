:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::

# Collection

## Aperçu

Une `collection` est utilisée pour définir les modèles de données dans le système, incluant des informations telles que les noms de modèles, les champs, les index et les associations.
Vous l'appelez généralement via la méthode `collection` d'une instance `Database`, qui sert de point d'entrée.

```javascript
const { Database } = require('@nocobase/database')

// Crée une instance de base de données
const db = new Database({...});

// Définit un modèle de données
db.collection({
  name: 'users',
  // Définit les champs du modèle
  fields: [
    // Champ scalaire
    {
      name: 'name',
      type: 'string',
    },

    // Champ d'association
    {
      name: 'profile',
      type: 'hasOne' // 'hasMany', 'belongsTo', 'belongsToMany'
    }
  ],
});
```

Pour plus de types de champs, veuillez consulter [Fields](/api/database/field).

## Constructeur

**Signature**

- `constructor(options: CollectionOptions, context: CollectionContext)`

**Paramètres**

| Paramètre                     | Type                                                        | Valeur par défaut | Description                                                                                             |
| :---------------------------- | :---------------------------------------------------------- | :------------ | :------------------------------------------------------------------------------------------------------ |
| `options.name`                | `string`                                                    | -             | Identifiant de la collection                                                                            |
| `options.tableName?`          | `string`                                                    | -             | Nom de la table de base de données. Si non fourni, la valeur de `options.name` sera utilisée.           |
| `options.fields?`             | `FieldOptions[]`                                            | -             | Définitions des champs. Voir [Field](./field) pour plus de détails.                                     |
| `options.model?`              | `string \| ModelStatic<Model>`                              | -             | Type de modèle Sequelize. Si une `string` est utilisée, le nom du modèle doit avoir été préalablement enregistré sur la base de données. |
| `options.repository?`         | `string \| RepositoryType`                                  | -             | Type de dépôt de données. Si une `string` est utilisée, le type de dépôt doit avoir été préalablement enregistré sur la base de données. |
| `options.sortable?`           | `string \| boolean \| { name?: string; scopeKey?: string }` | -             | Configuration du champ de tri. Non triable par défaut.                                                  |
| `options.autoGenId?`          | `boolean`                                                   | `true`        | Indique si une clé primaire unique doit être générée automatiquement. Par défaut à `true`.              |
| `context.database`            | `Database`                                                  | -             | La base de données dans le contexte actuel.                                                             |

**Exemple**

Créez une collection d'articles :

```ts
const posts = new Collection(
  {
    name: 'posts',
    fields: [
      {
        type: 'string',
        name: 'title',
      },
      {
        type: 'double',
        name: 'price',
      },
    ],
  },
  {
    // Instance de base de données existante
    database: db,
  },
);
```

## Membres d'instance

### `options`

Paramètres de configuration initiaux de la collection. Identiques au paramètre `options` du constructeur.

### `context`

Le contexte auquel appartient la collection actuelle, principalement l'instance de base de données.

### `name`

Nom de la collection.

### `db`

L'instance de base de données à laquelle elle appartient.

### `filterTargetKey`

Le nom du champ utilisé comme clé primaire.

### `isThrough`

Indique s'il s'agit d'une collection intermédiaire.

### `model`

Correspond au type de modèle Sequelize.

### `repository`

Instance du dépôt de données.

## Méthodes de configuration des champs

### `getField()`

Récupère l'objet champ correspondant au nom défini dans la collection.

**Signature**

- `getField(name: string): Field`

**Paramètres**

| Paramètre | Type     | Valeur par défaut | Description  |
| :-------- | :------- | :------------ | :----------- |
| `name`    | `string` | -             | Nom du champ |

**Exemple**

```ts
const posts = db.collection({
  name: 'posts',
  fields: [
    {
      type: 'string',
      name: 'title',
    },
  ],
});

const field = posts.getField('title');
```

### `setField()`

Définit un champ pour la collection.

**Signature**

- `setField(name: string, options: FieldOptions): Field`

**Paramètres**

| Paramètre | Type           | Valeur par défaut | Description                                                 |
| :-------- | :------------- | :------------ | :---------------------------------------------------------- |
| `name`    | `string`       | -             | Nom du champ                                                |
| `options` | `FieldOptions` | -             | Configuration du champ. Voir [Field](./field) pour plus de détails. |

**Exemple**

```ts
const posts = db.collection({ name: 'posts' });

posts.setField('title', { type: 'string' });
```

### `setFields()`

Définit plusieurs champs pour la collection en une seule fois.

**Signature**

- `setFields(fields: FieldOptions[], resetFields = true): Field[]`

**Paramètres**

| Paramètre     | Type             | Valeur par défaut | Description                                                 |
| :------------ | :--------------- | :------------ | :---------------------------------------------------------- |
| `fields`      | `FieldOptions[]` | -             | Configuration des champs. Voir [Field](./field) pour plus de détails. |
| `resetFields` | `boolean`        | `true`        | Indique si les champs existants doivent être réinitialisés. |

**Exemple**

```ts
const posts = db.collection({ name: 'posts' });

posts.setFields([
  { type: 'string', name: 'title' },
  { type: 'double', name: 'price' },
]);
```

### `removeField()`

Supprime l'objet champ correspondant au nom défini dans la collection.

**Signature**

- `removeField(name: string): void | Field`

**Paramètres**

| Paramètre | Type     | Valeur par défaut | Description  |
| :-------- | :------- | :------------ | :----------- |
| `name`    | `string` | -             | Nom du champ |

**Exemple**

```ts
const posts = db.collection({
  name: 'posts',
  fields: [
    {
      type: 'string',
      name: 'title',
    },
  ],
});

posts.removeField('title');
```

### `resetFields()`

Réinitialise (vide) les champs de la collection.

**Signature**

- `resetFields(): void`

**Exemple**

```ts
const posts = db.collection({
  name: 'posts',
  fields: [
    {
      type: 'string',
      name: 'title',
    },
  ],
});

posts.resetFields();
```

### `hasField()`

Vérifie si un objet champ correspondant au nom est défini dans la collection.

**Signature**

- `hasField(name: string): boolean`

**Paramètres**

| Paramètre | Type     | Valeur par défaut | Description  |
| :-------- | :------- | :------------ | :----------- |
| `name`    | `string` | -             | Nom du champ |

**Exemple**

```ts
const posts = db.collection({
  name: 'posts',
  fields: [
    {
      type: 'string',
      name: 'title',
    },
  ],
});

posts.hasField('title'); // true
```

### `findField()`

Recherche un objet champ dans la collection qui correspond aux critères.

**Signature**

- `findField(predicate: (field: Field) => boolean): Field | undefined`

**Paramètres**

| Paramètre   | Type                        | Valeur par défaut | Description         |
| :---------- | :-------------------------- | :------------ | :------------------ |
| `predicate` | `(field: Field) => boolean` | -             | Critères de recherche |

**Exemple**

```ts
const posts = db.collection({
  name: 'posts',
  fields: [
    {
      type: 'string',
      name: 'title',
    },
  ],
});

posts.findField((field) => field.name === 'title');
```

### `forEachField()`

Itère sur les objets champs de la collection.

**Signature**

- `forEachField(callback: (field: Field) => void): void`

**Paramètres**

| Paramètre  | Type                     | Valeur par défaut | Description      |
| :--------- | :----------------------- | :------------ | :--------------- |
| `callback` | `(field: Field) => void` | -             | Fonction de rappel |

**Exemple**

```ts
const posts = db.collection({
  name: 'posts',
  fields: [
    {
      type: 'string',
      name: 'title',
    },
  ],
});

posts.forEachField((field) => console.log(field.name));
```

## Méthodes de configuration des index

### `addIndex()`

Ajoute un index à la collection.

**Signature**

- `addIndex(index: string | string[] | { fields: string[], unique?: boolean,[key: string]: any })`

**Paramètres**

| Paramètre | Type                                                         | Valeur par défaut | Description                                |
| :-------- | :----------------------------------------------------------- | :------------ | :----------------------------------------- |
| `index`   | `string \| string[]`                                         | -             | Nom(s) du/des champ(s) à indexer.          |
| `index`   | `{ fields: string[], unique?: boolean, [key: string]: any }` | -             | Configuration complète.                    |

**Exemple**

```ts
const posts = db.collection({
  name: 'posts',
  fields: [
    {
      type: 'string',
      name: 'title',
    },
  ],
});

posts.addIndex({
  fields: ['title'],
  unique: true,
});
```

### `removeIndex()`

Supprime un index de la collection.

**Signature**

- `removeIndex(fields: string[])`

**Paramètres**

| Paramètre | Type       | Valeur par défaut | Description                                        |
| :-------- | :--------- | :------------ | :------------------------------------------------- |
| `fields`  | `string[]` | -             | Combinaison des noms de champs pour l'index à supprimer. |

**Exemple**

```ts
const posts = db.collection({
  name: 'posts',
  fields: [
    {
      type: 'string',
      name: 'title',
    },
  ],
  indexes: [
    {
      fields: ['title'],
      unique: true,
    },
  ],
});

posts.removeIndex(['title']);
```

## Méthodes de configuration de la collection

### `remove()`

Supprime la collection.

**Signature**

- `remove(): void`

**Exemple**

```ts
const posts = db.collection({
  name: 'posts',
  fields: [
    {
      type: 'string',
      name: 'title',
    },
  ],
});

posts.remove();
```

## Méthodes d'opération sur la base de données

### `sync()`

Synchronise la définition de la collection avec la base de données. En plus de la logique par défaut de `Model.sync` dans Sequelize, cette méthode gère également les collections correspondant aux champs d'association.

**Signature**

- `sync(): Promise<void>`

**Exemple**

```ts
const posts = db.collection({
  name: 'posts',
  fields: [
    {
      type: 'string',
      name: 'title',
    },
  ],
});

await posts.sync();
```

### `existsInDb()`

Vérifie si la collection existe dans la base de données.

**Signature**

- `existsInDb(options?: Transactionable): Promise<boolean>`

**Paramètres**

| Paramètre              | Type          | Valeur par défaut | Description           |
| :--------------------- | :------------ | :------------ | :-------------------- |
| `options?.transaction` | `Transaction` | -             | Instance de transaction |

**Exemple**

```ts
const posts = db.collection({
  name: 'posts',
  fields: [
    {
      type: 'string',
      name: 'title',
    },
  ],
});

const existed = await posts.existsInDb();

console.log(existed); // false
```

### `removeFromDb()`

**Signature**

- `removeFromDb(): Promise<void>`

**Exemple**

```ts
const books = db.collection({
  name: 'books',
});

// Synchronise la collection de livres avec la base de données
await db.sync();

// Supprime la collection de livres de la base de données
await books.removeFromDb();
```