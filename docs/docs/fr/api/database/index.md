:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::

# Base de données

## Aperçu

La Base de données est un outil d'interaction avec les bases de données fourni par NocoBase, offrant des fonctionnalités très pratiques pour les applications sans code et à code réduit. Actuellement, les bases de données prises en charge sont :

- SQLite 3.8.8+
- MySQL 8.0.17+
- PostgreSQL 10.0+

### Connexion à la base de données

Dans le constructeur `Database`, vous pouvez configurer la connexion à la base de données en lui passant le paramètre `options`.

```javascript
const { Database } = require('@nocobase/database');

// Paramètres de configuration pour la base de données SQLite
const database = new Database({
  dialect: 'mysql',
  host: 'localhost',
  port: 3306,
  database: 'nocobase',
  username: 'root',
  password: 'password'
})

// Paramètres de configuration pour les bases de données MySQL \ PostgreSQL
const database = new Database({
  dialect: /* 'postgres' ou 'mysql' */,
  database: 'database',
  username: 'username',
  password: 'password',
  host: 'localhost',
  port: 'port'
})

```

Pour des paramètres de configuration détaillés, veuillez consulter [Constructeur](#constructeur).

### Définition du modèle de données

La `Base de données` définit la structure de la base de données via les `collection`s. Un objet `collection` représente une table dans la base de données.

```javascript
// Définir une collection
const UserCollection = database.collection({
  name: 'users',
  fields: [
    {
      name: 'name',
      type: 'string',
    },
    {
      name: 'age',
      type: 'integer',
    },
  ],
});
```

Une fois la structure de la base de données définie, vous pouvez utiliser la méthode `sync()` pour la synchroniser.

```javascript
await database.sync();
```

Pour une utilisation plus détaillée des `collection`s, veuillez consulter [Collection](/api/database/collection).

### Lecture/Écriture des données

La `Base de données` manipule les données via les `Repository`s.

```javascript
const UserRepository = UserCollection.repository();

// Créer
await UserRepository.create({
  name: '张三',
  age: 18,
});

// Rechercher
const user = await UserRepository.findOne({
  filter: {
    name: '张三',
  },
});

// Modifier
await UserRepository.update({
  values: {
    age: 20,
  },
});

// Supprimer
await UserRepository.destroy(user.id);
```

Pour une utilisation plus détaillée des opérations CRUD, veuillez consulter [Repository](/api/database/repository).

## Constructeur

**Signature**

- `constructor(options: DatabaseOptions)`

Crée une instance de base de données.

**Paramètres**

| Paramètre                 | Type           | Valeur par défaut | Description                                                                                                                |
| ---------------------- | -------------- | ------------- | ------------------------------------------------------------------------------------------------------------------- |
| `options.host`         | `string`       | `'localhost'` | Hôte de la base de données                                                                                                          |
| `options.port`         | `number`       | -             | Port du service de base de données, avec un port par défaut correspondant à la base de données utilisée                                                                      |
| `options.username`     | `string`       | -             | Nom d'utilisateur de la base de données                                                                                                        |
| `options.password`     | `string`       | -             | Mot de passe de la base de données                                                                                                          |
| `options.database`     | `string`       | -             | Nom de la base de données                                                                                                          |
| `options.dialect`      | `string`       | `'mysql'`     | Type de base de données                                                                                                          |
| `options.storage?`     | `string`       | `':memory:'`  | Mode de stockage pour SQLite                                                                                                   |
| `options.logging?`     | `boolean`      | `false`       | Activer la journalisation                                                                                                        |
| `options.define?`      | `Object`       | `{}`          | Paramètres de définition de table par défaut                                                                                                    |
| `options.tablePrefix?` | `string`       | `''`          | Extension NocoBase, préfixe des noms de table                                                                                             |
| `options.migrator?`    | `UmzugOptions` | `{}`          | Extension NocoBase, paramètres liés au gestionnaire de migrations, se référer à l'implémentation [Umzug](https://github.com/sequelize/umzug/blob/main/src/types.ts#L15) |

## Méthodes liées aux migrations

### `addMigration()`

Ajoute un fichier de migration unique.

**Signature**

- `addMigration(options: MigrationItem)`

**Paramètres**

| Paramètre               | Type               | Valeur par défaut | Description                   |
| -------------------- | ------------------ | ------ | ---------------------- |
| `options.name`       | `string`           | -      | Nom du fichier de migration           |
| `options.context?`   | `string`           | -      | Contexte du fichier de migration       |
| `options.migration?` | `typeof Migration` | -      | Classe personnalisée pour le fichier de migration     |
| `options.up`         | `Function`         | -      | Méthode `up` du fichier de migration   |
| `options.down`       | `Function`         | -      | Méthode `down` du fichier de migration |

**Exemple**

```ts
db.addMigration({
  name: '20220916120411-test-1',
  async up() {
    const queryInterface = this.context.db.sequelize.getQueryInterface();
    await queryInterface.query(/* vos requêtes SQL de migration */);
  },
});
```

### `addMigrations()`

Ajoute les fichiers de migration d'un répertoire spécifié.

**Signature**

- `addMigrations(options: AddMigrationsOptions): void`

**Paramètres**

| Paramètre               | Type       | Valeur par défaut | Description             |
| -------------------- | ---------- | -------------- | ---------------- |
| `options.directory`  | `string`   | `''`           | Répertoire où se trouvent les fichiers de migration |
| `options.extensions` | `string[]` | `['js', 'ts']` | Extensions de fichier       |
| `options.namespace?` | `string`   | `''`           | Espace de noms         |
| `options.context?`   | `Object`   | `{ db }`       | Contexte du fichier de migration |

**Exemple**

```ts
db.addMigrations({
  directory: path.resolve(__dirname, './migrations'),
  namespace: 'test',
});
```

## Méthodes utilitaires

### `inDialect()`

Vérifie si le type de base de données actuel est l'un des types spécifiés.

**Signature**

- `inDialect(dialect: string[]): boolean`

**Paramètres**

| Paramètre    | Type       | Valeur par défaut | Description                                             |
| --------- | ---------- | ------ | ------------------------------------------------ |
| `dialect` | `string[]` | -      | Type de base de données, les valeurs possibles sont `mysql`/`postgres`/`mariadb` |

### `getTablePrefix()`

Récupère le préfixe des noms de table à partir de la configuration.

**Signature**

- `getTablePrefix(): string`

## Configuration des collections

### `collection()`

Définit une collection. Cet appel est similaire à la méthode `define` de Sequelize, créant la structure de la table uniquement en mémoire. Pour la persister dans la base de données, vous devez appeler la méthode `sync`.

**Signature**

- `collection(options: CollectionOptions): Collection`

**Paramètres**

Tous les paramètres de configuration `options` sont cohérents avec le constructeur de la classe `collection`, veuillez consulter [Collection](/api/database/collection#constructeur).

**Événements**

- `'beforeDefineCollection'` : Déclenché avant la définition d'une collection.
- `'afterDefineCollection'` : Déclenché après la définition d'une collection.

**Exemple**

```ts
db.collection({
  name: 'books',
  fields: [
    {
      type: 'string',
      name: 'title',
    },
    {
      type: 'float',
      name: 'price',
    },
  ],
});

// synchroniser la collection en tant que table dans la base de données
await db.sync();
```

### `getCollection()`

Récupère une collection définie.

**Signature**

- `getCollection(name: string): Collection`

**Paramètres**

| Paramètre | Type     | Valeur par défaut | Description |
| ------ | -------- | ------ | ---- |
| `name` | `string` | -      | Nom de la collection |

**Exemple**

```ts
const collection = db.getCollection('books');
```

### `hasCollection()`

Vérifie si une collection spécifiée a été définie.

**Signature**

- `hasCollection(name: string): boolean`

**Paramètres**

| Paramètre | Type     | Valeur par défaut | Description |
| ------ | -------- | ------ | ---- |
| `name` | `string` | -      | Nom de la collection |

**Exemple**

```ts
db.collection({ name: 'books' });

db.hasCollection('books'); // true

db.hasCollection('authors'); // false
```

### `removeCollection()`

Supprime une collection définie. Elle est uniquement supprimée de la mémoire ; pour persister le changement, vous devez appeler la méthode `sync`.

**Signature**

- `removeCollection(name: string): void`

**Paramètres**

| Paramètre | Type     | Valeur par défaut | Description |
| ------ | -------- | ------ | ---- |
| `name` | `string` | -      | Nom de la collection |

**Événements**

- `'beforeRemoveCollection'` : Déclenché avant la suppression d'une collection.
- `'afterRemoveCollection'` : Déclenché après la suppression d'une collection.

**Exemple**

```ts
db.collection({ name: 'books' });

db.removeCollection('books');
```

### `import()`

Importe tous les fichiers d'un répertoire en tant que configurations de collection en mémoire.

**Signature**

- `async import(options: { directory: string; extensions?: ImportFileExtension[] }): Promise<Map<string, Collection>>`

**Paramètres**

| Paramètre               | Type       | Valeur par défaut | Description             |
| -------------------- | ---------- | -------------- | ---------------- |
| `options.directory`  | `string`   | -              | Chemin du répertoire à importer |
| `options.extensions` | `string[]` | `['ts', 'js']` | Extensions de fichier à scanner     |

**Exemple**

La collection définie dans le fichier `./collections/books.ts` est la suivante :

```ts
export default {
  name: 'books',
  fields: [
    {
      type: 'string',
      name: 'title',
    },
  ],
};
```

Importez la configuration pertinente lors du chargement du plugin :

```ts
class Plugin {
  async load() {
    await this.app.db.import({
      directory: path.resolve(__dirname, './collections'),
    });
  }
}
```

## Enregistrement et récupération des extensions

### `registerFieldTypes()`

Enregistre des types de champs personnalisés.

**Signature**

- `registerFieldTypes(fieldTypes: MapOf<typeof Field>): void`

**Paramètres**

`fieldTypes` est une paire clé-valeur où la clé est le nom du type de champ et la valeur est la classe du type de champ.

**Exemple**

```ts
import { Field } from '@nocobase/database';

class MyField extends Field {
  // ...
}

db.registerFieldTypes({
  myField: MyField,
});
```

### `registerModels()`

Enregistre des classes de modèles de données personnalisées.

**Signature**

- `registerModels(models: MapOf<ModelStatic<any>>): void`

**Paramètres**

`models` est une paire clé-valeur où la clé est le nom du modèle de données et la valeur est la classe du modèle de données.

**Exemple**

```ts
import { Model } from '@nocobase/database';

class MyModel extends Model {
  // ...
}

db.registerModels({
  myModel: MyModel,
});

db.collection({
  name: 'myCollection',
  model: 'myModel',
});
```

### `registerRepositories()`

Enregistre des classes de `Repository` personnalisées.

**Signature**

- `registerRepositories(repositories: MapOf<RepositoryType>): void`

**Paramètres**

`repositories` est une paire clé-valeur où la clé est le nom du `Repository` et la valeur est la classe du `Repository`.

**Exemple**

```ts
import { Repository } from '@nocobase/database';

class MyRepository extends Repository {
  // ...
}

db.registerRepositories({
  myRepository: MyRepository,
});

db.collection({
  name: 'myCollection',
  repository: 'myRepository',
});
```

### `registerOperators()`

Enregistre des opérateurs de requête de données personnalisés.

**Signature**

- `registerOperators(operators: MapOf<OperatorFunc>)`

**Paramètres**

`operators` est une paire clé-valeur où la clé est le nom de l'opérateur et la valeur est la fonction qui génère l'instruction de comparaison.

**Exemple**

```ts
db.registerOperators({
  $dateOn(value) {
    return {
      [Op.and]: [
        { [Op.gte]: stringToDate(value) },
        { [Op.lt]: getNextDay(value) },
      ],
    };
  },
});

db.getRepository('books').count({
  filter: {
    createdAt: {
      // opérateur enregistré
      $dateOn: '2020-01-01',
    },
  },
});
```

### `getModel()`

Récupère une classe de modèle de données définie. Si aucune classe de modèle personnalisée n'a été enregistrée précédemment, elle renverra la classe de modèle Sequelize par défaut. Le nom par défaut est le même que celui défini pour la collection.

**Signature**

- `getModel(name: string): Model`

**Paramètres**

| Paramètre | Type     | Valeur par défaut | Description           |
| ------ | -------- | ------ | -------------- |
| `name` | `string` | -      | Nom du modèle enregistré |

**Exemple**

```ts
db.registerModels({
  books: class MyModel extends Model {},
});

const ModelClass = db.getModel('books');

console.log(ModelClass.prototype instanceof MyModel); // true
```

Note : La classe de modèle obtenue à partir d'une collection n'est pas strictement égale à la classe de modèle enregistrée, mais en hérite. Étant donné que les propriétés de la classe de modèle de Sequelize sont modifiées pendant le processus d'initialisation, NocoBase gère automatiquement cette relation d'héritage. À l'exception de l'inégalité des classes, toutes les autres définitions peuvent être utilisées normalement.

### `getRepository()`

Récupère une classe de `Repository` personnalisée. Si aucune classe de `Repository` personnalisée n'a été enregistrée précédemment, elle renverra la classe de `Repository` NocoBase par défaut. Le nom par défaut est le même que celui défini pour la collection.

Les classes de `Repository` sont principalement utilisées pour les opérations CRUD basées sur les modèles de données, veuillez consulter [Repository](/api/database/repository).

**Signature**

- `getRepository(name: string): Repository`
- `getRepository(name: string, relationId?: string | number): Repository`

**Paramètres**

| Paramètre       | Type                 | Valeur par défaut | Description               |
| ------------ | -------------------- | ------ | ------------------ |
| `name`       | `string`             | -      | Nom du `Repository` enregistré |
| `relationId` | `string` \| `number` | -      | Valeur de la clé étrangère pour les données relationnelles   |

Lorsque le nom est un nom d'association tel que `'tables.relations'`, il renverra la classe de `Repository` associée. Si le deuxième paramètre est fourni, le `Repository` sera basé sur la valeur de la clé étrangère des données relationnelles lors de son utilisation (requêtes, mises à jour, etc.).

**Exemple**

Supposons qu'il existe deux collections, *articles* et *auteurs*, et que la collection d'articles contient une clé étrangère pointant vers la collection d'auteurs :

```ts
const AuthorsRepo = db.getRepository('authors');
const author1 = AuthorsRepo.create({ name: 'author1' });

const PostsRepo = db.getRepository('authors.posts', author1.id);
const post1 = AuthorsRepo.create({ title: 'post1' });
asset(post1.authorId === author1.id); // vrai
```

## Événements de la base de données

### `on()`

Écoute les événements de la base de données.

**Signature**

- `on(event: string, listener: (...args: any[]) => void | Promise<void>): void`

**Paramètres**

| Paramètre   | Type     | Valeur par défaut | Description       |
| -------- | -------- | ------ | ---------- |
| event    | string   | -      | Nom de l'événement   |
| listener | Function | -      | Écouteur d'événement |

Les noms d'événements prennent en charge les événements de modèle de Sequelize par défaut. Pour les événements globaux, écoutez en utilisant le format `<sequelize_model_global_event>`, et pour les événements de modèle uniques, utilisez le format `<nom_du_modèle>.<sequelize_model_event>`.

Pour les descriptions des paramètres et des exemples détaillés de tous les types d'événements intégrés, veuillez consulter la section [Événements intégrés](#événements-intégrés).

### `off()`

Supprime une fonction d'écoute d'événement.

**Signature**

- `off(name: string, listener: Function)`

**Paramètres**

| Paramètre   | Type     | Valeur par défaut | Description       |
| -------- | -------- | ------ | ---------- |
| name     | string   | -      | Nom de l'événement   |
| listener | Function | -      | Écouteur d'événement |

**Exemple**

```ts
const listener = async (model, options) => {
  console.log(model);
};

db.on('afterCreate', listener);

db.off('afterCreate', listener);
```

## Opérations sur la base de données

### `auth()`

Authentification de la connexion à la base de données. Peut être utilisée pour s'assurer que l'application a établi une connexion avec les données.

**Signature**

- `auth(options: QueryOptions & { retry?: number } = {}): Promise<boolean>`

**Paramètres**

| Paramètre                 | Type                  | Valeur par défaut | Description               |
| ---------------------- | --------------------- | ------- | ------------------ |
| `options?`             | `Object`              | -       | Options d'authentification           |
| `options.retry?`       | `number`              | `10`    | Nombre de tentatives en cas d'échec de l'authentification |
| `options.transaction?` | `Transaction`         | -       | Objet de transaction           |
| `options.logging?`     | `boolean \| Function` | `false` | Activer l'impression des journaux       |

**Exemple**

```ts
await db.auth();
```

### `reconnect()`

Se reconnecte à la base de données.

**Exemple**

```ts
await db.reconnect();
```

### `closed()`

Vérifie si la connexion à la base de données est fermée.

**Signature**

- `closed(): boolean`

### `close()`

Ferme la connexion à la base de données. Équivalent à `sequelize.close()`.

### `sync()`

Synchronise la structure des collections de la base de données. Équivalent à `sequelize.sync()`, pour les paramètres, veuillez consulter la [documentation Sequelize](https://sequelize.org/api/v6/class/src/sequelize.js~sequelize#instance-method-sync).

### `clean()`

Nettoie la base de données, supprimant toutes les collections.

**Signature**

- `clean(options: CleanOptions): Promise<void>`

**Paramètres**

| Paramètre                | Type          | Valeur par défaut | Description               |
| --------------------- | ------------- | ------- | ------------------ |
| `options.drop`        | `boolean`     | `false` | Supprimer toutes les collections |
| `options.skip`        | `string[]`    | -       | Configuration des noms de collections à ignorer     |
| `options.transaction` | `Transaction` | -       | Objet de transaction           |

**Exemple**

Supprime toutes les collections à l'exception de la collection `users`.

```ts
await db.clean({
  drop: true,
  skip: ['users'],
});
```

## Exportations au niveau du paquet

### `defineCollection()`

Crée le contenu de configuration d'une collection.

**Signature**

- `defineCollection(name: string, config: CollectionOptions): CollectionOptions`

**Paramètres**

| Paramètre              | Type                | Valeur par défaut | Description                                |
| ------------------- | ------------------- | ------ | ----------------------------------- |
| `collectionOptions` | `CollectionOptions` | -      | Identique à tous les paramètres de `db.collection()` |

**Exemple**

Pour un fichier de configuration de collection à importer par `db.import()` :

```ts
import { defineCollection } from '@nocobase/database';

export default defineCollection({
  name: 'users',
  fields: [
    {
      type: 'string',
      name: 'name',
    },
  ],
});
```

### `extendCollection()`

Étend le contenu de la configuration d'une structure de collection déjà en mémoire, principalement pour le contenu de fichier importé par la méthode `import()`. Cette méthode est une méthode de haut niveau exportée par le paquet `@nocobase/database` et n'est pas appelée via une instance de base de données. L'alias `extend` peut également être utilisé.

**Signature**

- `extendCollection(collectionOptions: CollectionOptions, mergeOptions?: MergeOptions): ExtendedCollectionOptions`

**Paramètres**

| Paramètre              | Type                | Valeur par défaut | Description                                                           |
| ------------------- | ------------------- | ------ | -------------------------------------------------------------- |
| `collectionOptions` | `CollectionOptions` | -      | Identique à tous les paramètres de `db.collection()`                            |
| `mergeOptions?`     | `MergeOptions`      | -      | Paramètres pour le paquet npm [deepmerge](https://npmjs.com/package/deepmerge) |

**Exemple**

Définition originale de la collection books (books.ts) :

```ts
export default {
  name: 'books',
  fields: [{ name: 'title', type: 'string' }],
};
```

Définition étendue de la collection books (books.extend.ts) :

```ts
import { extend } from '@nocobase/database';

// étendre à nouveau
export default extend({
  name: 'books',
  fields: [{ name: 'price', type: 'number' }],
});
```

Si les deux fichiers ci-dessus sont importés lors de l'appel à `import()`, après avoir été étendus à nouveau avec `extend()`, la collection books aura les champs `title` et `price`.

Cette méthode est très utile pour étendre les structures de collection déjà définies par des plugins existants.

## Événements intégrés

La base de données déclenche les événements correspondants suivants à différentes étapes de son cycle de vie. S'y abonner avec la méthode `on()` permet un traitement spécifique pour répondre à certains besoins métier.

### `'beforeSync'` / `'afterSync'`

Déclenché avant et après la synchronisation d'une nouvelle configuration de structure de collection (champs, index, etc.) avec la base de données. Il est généralement déclenché lors de l'exécution de `collection.sync()` (appel interne) et est souvent utilisé pour gérer la logique d'extensions de champs spécifiques.

**Signature**

```ts
on(eventName: `${string}.beforeSync` | 'beforeSync' | `${string}.afterSync` | 'afterSync', listener: SyncListener): this
```

**Type**

```ts
import type { SyncOptions, HookReturn } from 'sequelize/types';

type SyncListener = (options?: SyncOptions) => HookReturn;
```

**Exemple**

```ts
const users = db.collection({
  name: 'users',
  fields: [{ type: 'string', name: 'username' }],
});

db.on('beforeSync', async (options) => {
  // faire quelque chose
});

db.on('users.afterSync', async (options) => {
  // faire quelque chose
});

await users.sync();
```

### `'beforeValidate'` / `'afterValidate'`

Avant de créer ou de mettre à jour des données, un processus de validation est effectué sur la base des règles définies dans la collection. Des événements correspondants sont déclenchés avant et après la validation. Cela se produit lors de l'appel de `repository.create()` ou `repository.update()`.

**Signature**

```ts
on(eventName: `${string}.beforeValidate` | 'beforeValidate' | `${string}.afterValidate` | 'afterValidate', listener: ValidateListener): this
```

**Type**

```ts
import type { ValidationOptions } from 'sequelize/types/lib/instance-validator';
import type { HookReturn } from 'sequelize/types';
import type { Model } from '@nocobase/database';

type ValidateListener = (
  model: Model,
  options?: ValidationOptions,
) => HookReturn;
```

**Exemple**

```ts
db.collection({
  name: 'tests',
  fields: [
    {
      type: 'string',
      name: 'email',
      validate: {
        isEmail: true,
      },
    },
  ],
});

// tous les modèles
db.on('beforeValidate', async (model, options) => {
  // faire quelque chose
});
// modèle tests
db.on('tests.beforeValidate', async (model, options) => {
  // faire quelque chose
});

// tous les modèles
db.on('afterValidate', async (model, options) => {
  // faire quelque chose
});
// modèle tests
db.on('tests.afterValidate', async (model, options) => {
  // faire quelque chose
});

const repository = db.getRepository('tests');
await repository.create({
  values: {
    email: 'abc', // vérifie le format de l'e-mail
  },
});
// ou
await repository.update({
  filterByTk: 1,
  values: {
    email: 'abc', // vérifie le format de l'e-mail
  },
});
```

### `'beforeCreate'` / `'afterCreate'`

Des événements correspondants sont déclenchés avant et après la création d'un enregistrement. Cela se produit lors de l'appel de `repository.create()`.

**Signature**

```ts
on(eventName: `${string}.beforeCreate` | 'beforeCreate' | `${string}.afterCreate` | 'afterCreate', listener: CreateListener): this
```

**Type**

```ts
import type { CreateOptions, HookReturn } from 'sequelize/types';
import type { Model } from '@nocobase/database';

export type CreateListener = (
  model: Model,
  options?: CreateOptions,
) => HookReturn;
```

**Exemple**

```ts
db.on('beforeCreate', async (model, options) => {
  // faire quelque chose
});

db.on('books.afterCreate', async (model, options) => {
  const { transaction } = options;
  const result = await model.constructor.findByPk(model.id, {
    transaction,
  });
  console.log(result);
});
```

### `'beforeUpdate'` / `'afterUpdate'`

Des événements correspondants sont déclenchés avant et après la mise à jour d'un enregistrement. Cela se produit lors de l'appel de `repository.update()`.

**Signature**

```ts
on(eventName: `${string}.beforeUpdate` | 'beforeUpdate' | `${string}.afterUpdate` | 'afterUpdate', listener: UpdateListener): this
```

**Type**

```ts
import type { UpdateOptions, HookReturn } from 'sequelize/types';
import type { Model } from '@nocobase/database';

export type UpdateListener = (
  model: Model,
  options?: UpdateOptions,
) => HookReturn;
```

**Exemple**

```ts
db.on('beforeUpdate', async (model, options) => {
  // faire quelque chose
});

db.on('books.afterUpdate', async (model, options) => {
  // faire quelque chose
});
```

### `'beforeSave'` / `'afterSave'`

Des événements correspondants sont déclenchés avant et après la création ou la mise à jour d'un enregistrement. Cela se produit lors de l'appel de `repository.create()` ou `repository.update()`.

**Signature**

```ts
on(eventName: `${string}.beforeSave` | 'beforeSave' | `${string}.afterSave` | 'afterSave', listener: SaveListener): this
```

**Type**

```ts
import type { SaveOptions, HookReturn } from 'sequelize/types';
import type { Model } from '@nocobase/database';

export type SaveListener = (model: Model, options?: SaveOptions) => HookReturn;
```

**Exemple**

```ts
db.on('beforeSave', async (model, options) => {
  // faire quelque chose
});

db.on('books.afterSave', async (model, options) => {
  // faire quelque chose
});
```

### `'beforeDestroy'` / `'afterDestroy'`

Des événements correspondants sont déclenchés avant et après la suppression d'un enregistrement. Cela se produit lors de l'appel de `repository.destroy()`.

**Signature**

```ts
on(eventName: `${string}.beforeDestroy` | 'beforeDestroy' | `${string}.afterDestroy` | 'afterDestroy', listener: DestroyListener): this
```

**Type**

```ts
import type { DestroyOptions, HookReturn } from 'sequelize/types';
import type { Model } from '@nocobase/database';

export type DestroyListener = (
  model: Model,
  options?: DestroyOptions,
) => HookReturn;
```

**Exemple**

```ts
db.on('beforeDestroy', async (model, options) => {
  // faire quelque chose
});

db.on('books.afterDestroy', async (model, options) => {
  // faire quelque chose
});
```

### `'afterCreateWithAssociations'`

Cet événement est déclenché après la création d'un enregistrement avec des données d'association hiérarchiques. Il se produit lors de l'appel de `repository.create()`.

**Signature**

```ts
on(eventName: `${string}.afterCreateWithAssociations` | 'afterCreateWithAssociations', listener: CreateWithAssociationsListener): this
```

**Type**

```ts
import type { CreateOptions, HookReturn } from 'sequelize/types';
import type { Model } from '@nocobase/database';

export type CreateWithAssociationsListener = (
  model: Model,
  options?: CreateOptions,
) => HookReturn;
```

**Exemple**

```ts
db.on('afterCreateWithAssociations', async (model, options) => {
  // faire quelque chose
});

db.on('books.afterCreateWithAssociations', async (model, options) => {
  // faire quelque chose
});
```

### `'afterUpdateWithAssociations'`

Cet événement est déclenché après la mise à jour d'un enregistrement avec des données d'association hiérarchiques. Il se produit lors de l'appel de `repository.update()`.

**Signature**

```ts
on(eventName: `${string}.afterUpdateWithAssociations` | 'afterUpdateWithAssociations', listener: CreateWithAssociationsListener): this
```

**Type**

```ts
import type { UpdateOptions, HookReturn } from 'sequelize/types';
import type { Model } from '@nocobase/database';

export type UpdateWithAssociationsListener = (
  model: Model,
  options?: UpdateOptions,
) => HookReturn;
```

**Exemple**

```ts
db.on('afterUpdateWithAssociations', async (model, options) => {
  // faire quelque chose
});

db.on('books.afterUpdateWithAssociations', async (model, options) => {
  // faire quelque chose
});
```

### `'afterSaveWithAssociations'`

Cet événement est déclenché après la création ou la mise à jour d'un enregistrement avec des données d'association hiérarchiques. Il se produit lors de l'appel de `repository.create()` ou `repository.update()`.

**Signature**

```ts
on(eventName: `${string}.afterSaveWithAssociations` | 'afterSaveWithAssociations', listener: SaveWithAssociationsListener): this
```

**Type**

```ts
import type { SaveOptions, HookReturn } from 'sequelize/types';
import type { Model } from '@nocobase/database';

export type SaveWithAssociationsListener = (
  model: Model,
  options?: SaveOptions,
) => HookReturn;
```

**Exemple**

```ts
db.on('afterSaveWithAssociations', async (model, options) => {
  // faire quelque chose
});

db.on('books.afterSaveWithAssociations', async (model, options) => {
  // faire quelque chose
});
```

### `'beforeDefineCollection'`

Déclenché avant la définition d'une collection, par exemple lors de l'appel de `db.collection()`.

Note : Cet événement est synchrone.

**Signature**

```ts
on(eventName: 'beforeDefineCollection', listener: BeforeDefineCollectionListener): this
```

**Type**

```ts
import type { CollectionOptions } from '@nocobase/database';

export type BeforeDefineCollectionListener = (
  options: CollectionOptions,
) => void;
```

**Exemple**

```ts
db.on('beforeDefineCollection', (options) => {
  // faire quelque chose
});
```

### `'afterDefineCollection'`

Déclenché après la définition d'une collection, par exemple lors de l'appel de `db.collection()`.

Note : Cet événement est synchrone.

**Signature**

```ts
on(eventName: 'afterDefineCollection', listener: AfterDefineCollectionListener): this
```

**Type**

```ts
import type { Collection } from '@nocobase/database';

export type AfterDefineCollectionListener = (options: Collection) => void;
```

**Exemple**

```ts
db.on('afterDefineCollection', (collection) => {
  // faire quelque chose
});
```

### `'beforeRemoveCollection'` / `'afterRemoveCollection'`

Déclenché avant et après la suppression d'une collection de la mémoire, par exemple lors de l'appel de `db.removeCollection()`.

Note : Cet événement est synchrone.

**Signature**

```ts
on(eventName: 'beforeRemoveCollection' | 'afterRemoveCollection', listener: RemoveCollectionListener): this
```

**Type**

```ts
import type { Collection } from '@nocobase/database';

export type RemoveCollectionListener = (options: Collection) => void;
```

**Exemple**

```ts
db.on('beforeRemoveCollection', (collection) => {
  // faire quelque chose
});

db.on('afterRemoveCollection', (collection) => {
  // faire quelque chose
});
```