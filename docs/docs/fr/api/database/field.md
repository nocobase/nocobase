:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::

# Champ

## Aperçu

Classe de gestion des champs de collection (classe abstraite). C'est également la classe de base pour tous les types de champs. Tout autre type de champ est implémenté en héritant de cette classe.

Pour savoir comment personnaliser les champs, veuillez consulter [Étendre les types de champs].

## Constructeur

Les développeurs n'appellent généralement pas directement ce constructeur. Il est principalement invoqué via la méthode `db.collection({ fields: [] })` comme point d'entrée proxy.

Lorsque vous étendez un champ, vous l'implémentez principalement en héritant de la classe abstraite `Field`, puis en l'enregistrant dans l'instance `Database`.

**Signature**

- `constructor(options: FieldOptions, context: FieldContext)`

**Paramètres**

| Paramètre            | Type           | Valeur par défaut | Description                                     |
| -------------------- | -------------- | ------ | ----------------------------------------------- |
| `options`            | `FieldOptions` | -      | Objet de configuration du champ                 |
| `options.name`       | `string`       | -      | Nom du champ                                    |
| `options.type`       | `string`       | -      | Type de champ, correspondant au nom du type de champ enregistré dans la base de données |
| `context`            | `FieldContext` | -      | Objet de contexte du champ                      |
| `context.database`   | `Database`     | -      | Instance de base de données                     |
| `context.collection` | `Collection`   | -      | Instance de collection                          |

## Membres d'instance

### `name`

Nom du champ.

### `type`

Type du champ.

### `dataType`

Type de stockage du champ dans la base de données.

### `options`

Paramètres de configuration d'initialisation du champ.

### `context`

Objet de contexte du champ.

## Méthodes de configuration

### `on()`

Une méthode de définition raccourcie basée sur les événements de collection. Équivaut à `db.on(this.collection.name + '.' + eventName, listener)`.

Il n'est généralement pas nécessaire de surcharger cette méthode lors de l'héritage.

**Signature**

- `on(eventName: string, listener: (...args: any[]) => void)`

**Paramètres**

| Paramètre   | Type                       | Valeur par défaut | Description       |
| ----------- | -------------------------- | ------ | ----------------- |
| `eventName` | `string`                   | -      | Nom de l'événement |
| `listener`  | `(...args: any[]) => void` | -      | Écouteur d'événement |

### `off()`

Une méthode de suppression raccourcie basée sur les événements de collection. Équivaut à `db.off(this.collection.name + '.' + eventName, listener)`.

Il n'est généralement pas nécessaire de surcharger cette méthode lors de l'héritage.

**Signature**

- `off(eventName: string, listener: (...args: any[]) => void)`

**Paramètres**

| Paramètre   | Type                       | Valeur par défaut | Description       |
| ----------- | -------------------------- | ------ | ----------------- |
| `eventName` | `string`                   | -      | Nom de l'événement |
| `listener`  | `(...args: any[]) => void` | -      | Écouteur d'événement |

### `bind()`

Contenu exécuté lorsqu'un champ est ajouté à une collection. Il est généralement utilisé pour ajouter des écouteurs d'événements de collection et d'autres traitements.

Lors de l'héritage, vous devez d'abord appeler la méthode `super.bind()` correspondante.

**Signature**

- `bind()`

### `unbind()`

Contenu exécuté lorsqu'un champ est supprimé d'une collection. Il est généralement utilisé pour supprimer des écouteurs d'événements de collection et d'autres traitements.

Lors de l'héritage, vous devez d'abord appeler la méthode `super.unbind()` correspondante.

**Signature**

- `unbind()`

### `get()`

Récupère la valeur d'un élément de configuration du champ.

**Signature**

- `get(key: string): any`

**Paramètres**

| Paramètre | Type     | Valeur par défaut | Description                |
| --------- | -------- | ------ | -------------------------- |
| `key`     | `string` | -      | Nom de l'élément de configuration |

**Exemple**

```ts
const field = db.collection('users').getField('name');

// Récupère la valeur de l'élément de configuration du nom du champ, renvoie 'name'
console.log(field.get('name'));
```

### `merge()`

Fusionne les valeurs des éléments de configuration d'un champ.

**Signature**

- `merge(options: { [key: string]: any }): void`

**Paramètres**

| Paramètre | Type                     | Valeur par défaut | Description                        |
| --------- | ------------------------ | ------ | ---------------------------------- |
| `options` | `{ [key: string]: any }` | -      | L'objet d'éléments de configuration à fusionner |

**Exemple**

```ts
const field = db.collection('users').getField('name');

field.merge({
  // Ajoute une configuration d'index
  index: true,
});
```

### `remove()`

Supprime le champ de la collection (uniquement de la mémoire).

**Exemple**

```ts
const books = db.getCollections('books');

books.getField('isbn').remove();

// suppression réelle de la base de données
await books.sync();
```

## Méthodes de base de données

### `removeFromDb()`

Supprime le champ de la base de données.

**Signature**

- `removeFromDb(options?: Transactionable): Promise<void>`

**Paramètres**

| Paramètre              | Type          | Valeur par défaut | Description          |
| ---------------------- | ------------- | ------ | -------------------- |
| `options.transaction?` | `Transaction` | -      | Instance de transaction |

### `existsInDb()`

Détermine si le champ existe dans la base de données.

**Signature**

- `existsInDb(options?: Transactionable): Promise<boolean>`

**Paramètres**

| Paramètre              | Type          | Valeur par défaut | Description          |
| ---------------------- | ------------- | ------ | -------------------- |
| `options.transaction?` | `Transaction` | -      | Instance de transaction |

## Liste des types de champs intégrés

NocoBase intègre plusieurs types de champs couramment utilisés. Vous pouvez les spécifier directement en utilisant le nom de type correspondant lors de la définition des champs d'une collection. Les configurations des paramètres varient selon les types de champs ; veuillez consulter la liste ci-dessous pour plus de détails.

Tous les éléments de configuration des types de champs, à l'exception de ceux présentés ci-dessous, sont transmis à Sequelize. Ainsi, toutes les options de configuration de champ prises en charge par Sequelize (comme `allowNull`, `defaultValue`, etc.) peuvent être utilisées ici.

De plus, les types de champs côté serveur résolvent principalement les problèmes de stockage de base de données et certains algorithmes, et sont généralement indépendants des types d'affichage de champs et des composants utilisés côté client. Pour les types de champs front-end, veuillez vous référer aux instructions du tutoriel correspondant.

### `'boolean'`

Type de valeur booléenne.

**Exemple**

```js
db.collection({
  name: 'books',
  fields: [
    {
      type: 'boolean',
      name: 'published',
    },
  ],
});
```

### `'integer'`

Type entier (32 bits).

**Exemple**

```ts
db.collection({
  name: 'books',
  fields: [
    {
      type: 'integer',
      name: 'pages',
    },
  ],
});
```

### `'bigInt'`

Type grand entier (64 bits).

**Exemple**

```ts
db.collection({
  name: 'books',
  fields: [
    {
      type: 'bigInt',
      name: 'words',
    },
  ],
});
```

### `'double'`

Type flottant double précision (64 bits).

**Exemple**

```ts
db.collection({
  name: 'books',
  fields: [
    {
      type: 'double',
      name: 'price',
    },
  ],
});
```

### `'real'`

Type nombre réel (applicable uniquement à PostgreSQL).

### `'decimal'`

Type décimal.

### `'string'`

Type chaîne de caractères. Équivalent au type `VARCHAR` dans la plupart des bases de données.

**Exemple**

```ts
db.collection({
  name: 'books',
  fields: [
    {
      type: 'string',
      name: 'title',
    },
  ],
});
```

### `'text'`

Type texte. Équivalent au type `TEXT` dans la plupart des bases de données.

**Exemple**

```ts
db.collection({
  name: 'books',
  fields: [
    {
      type: 'text',
      name: 'content',
    },
  ],
});
```

### `'password'`

Type mot de passe (extension NocoBase). Chiffre les mots de passe en utilisant la méthode `scrypt` du paquet `crypto` natif de Node.js.

**Exemple**

```ts
db.collection({
  name: 'users',
  fields: [
    {
      type: 'password',
      name: 'password',
      length: 64, // Longueur, par défaut 64
      randomBytesSize: 8, // Longueur des octets aléatoires, par défaut 8
    },
  ],
});
```

**Paramètres**

| Paramètre         | Type     | Valeur par défaut | Description                |
| ----------------- | -------- | ------ | -------------------------- |
| `length`          | `number` | 64     | Longueur des caractères    |
| `randomBytesSize` | `number` | 8      | Taille des octets aléatoires |

### `'date'`

Type date.

### `'time'`

Type heure.

### `'array'`

Type tableau (applicable uniquement à PostgreSQL).

### `'json'`

Type JSON.

### `'jsonb'`

Type JSONB (applicable uniquement à PostgreSQL, les autres seront compatibles avec le type `'json'`).

### `'uuid'`

Type UUID.

### `'uid'`

Type UID (extension NocoBase). Un identifiant de type chaîne de caractères aléatoire courte.

### `'formula'`

Type formule (extension NocoBase). Permet de configurer des calculs de formules mathématiques basées sur [mathjs](https://www.npmjs.com/package/mathjs). La formule peut faire référence aux valeurs d'autres colonnes de la même enregistrement pour le calcul.

**Exemple**

```ts
db.collection({
  name: 'orders',
  fields: [
    {
      type: 'double',
      name: 'price',
    },
    {
      type: 'integer',
      name: 'quantity',
    },
    {
      type: 'formula',
      name: 'total',
      expression: 'price * quantity',
    },
  ],
});
```

### `'radio'`

Type radio (extension NocoBase). Au maximum une seule ligne de données dans toute la collection peut avoir la valeur `true` pour ce champ ; toutes les autres seront `false` ou `null`.

**Exemple**

Il n'y a qu'un seul utilisateur marqué comme `root` dans tout le système. Si la valeur `root` d'un autre utilisateur est définie sur `true`, toutes les autres enregistrements dont la valeur `root` était `true` seront automatiquement modifiées en `false` :

```ts
db.collection({
  name: 'users',
  fields: [
    {
      type: 'radio',
      name: 'root',
    },
  ],
});
```

### `'sort'`

Type de tri (extension NocoBase). Effectue un tri basé sur des nombres entiers, génère automatiquement un nouveau numéro de séquence pour les nouvelles enregistrements et réorganise les numéros de séquence lors du déplacement des données.

Si une collection définit l'option `sortable`, un champ correspondant sera également généré automatiquement.

**Exemple**

Les articles peuvent être triés en fonction de l'utilisateur auquel ils appartiennent :

```ts
db.collection({
  name: 'posts',
  fields: [
    {
      type: 'belongsTo',
      name: 'user',
    },
    {
      type: 'sort',
      name: 'priority',
      scopeKey: 'userId', // Trie les données regroupées par la même valeur de userId
    },
  ],
});
```

### `'virtual'`

Type virtuel. Ne stocke pas réellement de données, utilisé uniquement pour la définition de getters/setters spéciaux.

### `'belongsTo'`

Type d'association plusieurs-à-un. La clé étrangère est stockée dans sa propre collection, contrairement à `hasOne`/`hasMany`.

**Exemple**

Tout article appartient à un auteur :

```ts
db.collection({
  name: 'posts',
  fields: [
    {
      type: 'belongsTo',
      name: 'author',
      target: 'users', // Si non configuré, la valeur par défaut est le nom de la collection au pluriel
      foreignKey: 'authorId', // Si non configuré, la valeur par défaut est le format `<name> + Id`
      sourceKey: 'id', // Si non configuré, la valeur par défaut est l'ID de la collection cible
    },
  ],
});
```

### `'hasOne'`

Type d'association un-à-un. La clé étrangère est stockée dans la collection associée, contrairement à `belongsTo`.

**Exemple**

Chaque utilisateur possède un profil :

```ts
db.collection({
  name: 'users',
  fields: [
    {
      type: 'hasOne',
      name: 'profile',
      target: 'profiles', // Peut être omis
    },
  ],
});
```

### `'hasMany'`

Type d'association un-à-plusieurs. La clé étrangère est stockée dans la collection associée, contrairement à `belongsTo`.

**Exemple**

Chaque utilisateur peut avoir plusieurs articles :

```ts
db.collection({
  name: 'users',
  fields: [
    {
      type: 'hasMany',
      name: 'posts',
      foreignKey: 'authorId',
      sourceKey: 'id',
    },
  ],
});
```

### `'belongsToMany'`

Type d'association plusieurs-à-plusieurs. Utilise une collection intermédiaire pour stocker les clés étrangères des deux côtés. Si une collection existante n'est pas spécifiée comme collection intermédiaire, une collection intermédiaire sera automatiquement créée.

**Exemple**

Chaque article peut avoir plusieurs étiquettes, et chaque étiquette peut être associée à plusieurs articles :

```ts
db.collection({
  name: 'posts',
  fields: [
    {
      type: 'belongsToMany',
      name: 'tags',
      target: 'tags', // Peut être omis si le nom est identique
      through: 'postsTags', // La collection intermédiaire sera générée automatiquement si non configurée
      foreignKey: 'postId', // La clé étrangère de la collection source dans la collection intermédiaire
      sourceKey: 'id', // La clé primaire de la collection source
      otherKey: 'tagId', // La clé étrangère de la collection cible dans la collection intermédiaire
    },
  ],
});

db.collection({
  name: 'tags',
  fields: [
    {
      type: 'belongsToMany',
      name: 'posts',
      through: 'postsTags', // Le même groupe de relations pointe vers la même collection intermédiaire
    },
  ],
});
```