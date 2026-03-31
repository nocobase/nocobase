:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::

# Dépôt

## Aperçu

Sur un objet `Collection` donné, vous pouvez obtenir son objet `Repository` pour effectuer des opérations de lecture et d'écriture sur la collection.

```javascript
const { UserCollection } = require('./collections');

const UserRepository = UserCollection.repository;

const user = await UserRepository.findOne({
  filter: {
    id: 1,
  },
});

user.name = 'nouveau nom';
await user.save();
```

### Requête

#### Requête de base

Sur l'objet `Repository`, vous pouvez appeler les méthodes `find*` pour effectuer des opérations de requête. Toutes ces méthodes prennent en charge le paramètre `filter` pour filtrer les données.

```javascript
// SELECT * FROM users WHERE id = 1
userRepository.find({
  filter: {
    id: 1,
  },
});
```

#### Opérateurs

Le paramètre `filter` du `Repository` offre également une variété d'opérateurs pour des requêtes plus complexes.

```javascript
// SELECT * FROM users WHERE age > 18
userRepository.find({
  filter: {
    age: {
      $gt: 18,
    },
  },
});

// SELECT * FROM users WHERE age > 18 OR name LIKE '%Jean%'
userRepository.find({
  filter: {
    $or: [{ age: { $gt: 18 } }, { name: { $like: '%Jean%' } }],
  },
});
```

Pour plus de détails sur les opérateurs, veuillez consulter [Opérateurs de filtre](/api/database/operators).

#### Contrôle des champs

Lors d'une opération de requête, vous pouvez contrôler les champs de sortie à l'aide des paramètres `fields`, `except` et `appends`.

- `fields`: Spécifie les champs à inclure dans la sortie.
- `except`: Exclut les champs de la sortie.
- `appends`: Ajoute les champs associés à la sortie.

```javascript
// Le résultat n'inclura que les champs id et name.
userRepository.find({
  fields: ['id', 'name'],
});

// Le résultat n'inclura pas le champ password.
userRepository.find({
  except: ['password'],
});

// Le résultat inclura les données de l'objet associé posts.
userRepository.find({
  appends: ['posts'],
});
```

#### Requête sur les champs associés

Le paramètre `filter` permet de filtrer par champs associés, par exemple :

```javascript
// Recherche les objets utilisateur dont les posts associés contiennent un objet avec le titre 'post title'.
userRepository.find({
  filter: {
    'posts.title': 'post title',
  },
});
```

Les champs associés peuvent également être imbriqués.

```javascript
// Recherche les objets utilisateur dont les commentaires des posts contiennent des mots-clés.
await userRepository.find({
  filter: {
    'posts.comments.content': {
      $like: '%keywords%',
    },
  },
});
```

#### Tri

Vous pouvez trier les résultats de la requête à l'aide du paramètre `sort`.

```javascript
// SELECT * FROM users ORDER BY age
await userRepository.find({
  sort: 'age',
});

// SELECT * FROM users ORDER BY age DESC
await userRepository.find({
  sort: '-age',
});

// SELECT * FROM users ORDER BY age DESC, name ASC
await userRepository.find({
  sort: ['-age', 'name'],
});
```

Vous pouvez également trier par les champs des objets associés.

```javascript
await userRepository.find({
  sort: 'profile.createdAt',
});
```

### Création

#### Création de base

Créez de nouveaux objets de données via le `Repository`.

```javascript
await userRepository.create({
  name: 'Jean Dupont',
  age: 18,
});
// INSERT INTO users (name, age) VALUES ('Jean Dupont', 18)

// Prend en charge la création en masse.
await userRepository.create([
  {
    name: 'Jean Dupont',
    age: 18,
  },
  {
    name: 'Marie Curie',
    age: 20,
  },
]);
```

#### Création d'associations

Lors de la création, vous pouvez également créer des objets associés simultanément. Similaire aux requêtes, l'utilisation imbriquée d'objets associés est également prise en charge, par exemple :

```javascript
await userRepository.create({
  name: 'Jean Dupont',
  age: 18,
  posts: [
    {
      title: 'titre du post',
      content: 'contenu du post',
      tags: [
        {
          name: 'tag1',
        },
        {
          name: 'tag2',
        },
      ],
    },
  ],
});
// Lors de la création d'un utilisateur, un post est créé et associé à l'utilisateur, et des tags sont créés et associés au post.
```

Si l'objet associé existe déjà dans la base de données, vous pouvez passer son ID pour établir une association avec lui lors de la création.

```javascript
const tag1 = await tagRepository.findOne({
  filter: {
    name: 'tag1',
  },
});

await userRepository.create({
  name: 'Jean Dupont',
  age: 18,
  posts: [
    {
      title: 'titre du post',
      content: 'contenu du post',
      tags: [
        {
          id: tag1.id, // Établit une association avec un objet associé existant.
        },
        {
          name: 'tag2',
        },
      ],
    },
  ],
});
```

### Mise à jour

#### Mise à jour de base

Après avoir récupéré un objet de données, vous pouvez directement modifier ses propriétés sur l'objet de données (`Model`), puis appeler la méthode `save` pour enregistrer les modifications.

```javascript
const user = await userRepository.findOne({
  filter: {
    name: 'Jean Dupont',
  },
});

user.age = 20;
await user.save();
```

L'objet de données `Model` hérite du modèle Sequelize. Pour les opérations sur le `Model`, veuillez consulter [Sequelize Model](https://sequelize.org/master/manual/model-basics.html).

Vous pouvez également mettre à jour les données via le `Repository` :

```javascript
// Met à jour les enregistrements de données qui correspondent aux critères de filtre.
await userRepository.update({
  filter: {
    name: 'Jean Dupont',
  },
  values: {
    age: 20,
  },
});
```

Lors de la mise à jour, vous pouvez contrôler les champs à mettre à jour à l'aide des paramètres `whitelist` et `blacklist`, par exemple :

```javascript
await userRepository.update({
  filter: {
    name: 'Jean Dupont',
  },
  values: {
    age: 20,
    name: 'Marie Curie',
  },
  whitelist: ['age'], // Met à jour uniquement le champ age.
});
```

#### Mise à jour des champs associés

Lors de la mise à jour, vous pouvez définir des objets associés, par exemple :

```javascript
const tag1 = tagRepository.findOne({
  filter: {
    id: 1,
  },
});

await postRepository.update({
  filter: {
    id: 1,
  },
  values: {
    title: 'nouveau titre de post',
    tags: [
      {
        id: tag1.id, // Établit une association avec tag1.
      },
      {
        name: 'tag2', // Crée un nouveau tag et établit une association.
      },
    ],
  },
});

await postRepository.update({
  filter: {
    id: 1,
  },
  values: {
    tags: null, // Dissocie le post des tags.
  },
});
```

### Suppression

Vous pouvez appeler la méthode `destroy()` du `Repository` pour effectuer une opération de suppression. Vous devez spécifier des critères de filtre lors de la suppression :

```javascript
await userRepository.destroy({
  filter: {
    status: 'bloqué',
  },
});
```

## Constructeur

Généralement, il n'est pas appelé directement par les développeurs. Il est principalement instancié après l'enregistrement du type via `db.registerRepositories()` et la spécification du type de dépôt enregistré correspondant dans les paramètres de `db.collection()`.

**Signature**

- `constructor(collection: Collection)`

**Exemple**

```ts
import { Repository } from '@nocobase/database';

class MyRepository extends Repository {
  async myQuery(sql) {
    return this.database.sequelize.query(sql);
  }
}

db.registerRepositories({
  books: MyRepository,
});

db.collection({
  name: 'books',
  // ici, lien vers le dépôt enregistré
  repository: 'books',
});

await db.sync();

const books = db.getRepository('books') as MyRepository;
await books.myQuery('SELECT * FROM books;');
```

## Membres d'instance

### `database`

L'instance de gestion de base de données du contexte.

### `collection`

L'instance de gestion de collection correspondante.

### `model`

La classe de modèle correspondante.

## Méthodes d'instance

### `find()`

Interroge une collection de données dans la base de données, permettant de spécifier des conditions de filtre, le tri, etc.

**Signature**

- `async find(options?: FindOptions): Promise<Model[]>`

**Type**

```typescript
type Filter = FilterWithOperator | FilterWithValue | FilterAnd | FilterOr;
type Appends = string[];
type Except = string[];
type Fields = string[];
type Sort = string[] | string;

interface SequelizeFindOptions {
  limit?: number;
  offset?: number;
}

interface FilterByTk {
  filterByTk?: TargetKey;
}

interface CommonFindOptions extends Transactionable {
  filter?: Filter;
  fields?: Fields;
  appends?: Appends;
  except?: Except;
  sort?: Sort;
}

type FindOptions = SequelizeFindOptions & CommonFindOptions & FilterByTk;
```

**Détails**

#### `filter: Filter`

Condition de requête utilisée pour filtrer les résultats. Dans les paramètres de requête passés, la `key` est le nom du champ à interroger, et la `value` peut être la valeur à rechercher ou être utilisée avec des opérateurs pour d'autres filtrages conditionnels.

```typescript
// Recherche les enregistrements où le nom est 'foo' et l'âge est supérieur à 18.
repository.find({
  filter: {
    name: 'foo',
    age: {
      $gt: 18,
    },
  },
});
```

Pour plus d'opérateurs, veuillez consulter [Opérateurs de requête](./operators.md).

#### `filterByTk: TargetKey`

Interroge les données par `TargetKey`, une méthode pratique pour le paramètre `filter`. Le champ spécifique pour `TargetKey` peut être [configuré](./collection.md#filtertargetkey) dans la `Collection`, par défaut il s'agit de la `primaryKey`.

```typescript
// Par défaut, recherche l'enregistrement avec l'id = 1.
repository.find({
  filterByTk: 1,
});
```

#### `fields: string[]`

Colonnes de requête, utilisées pour contrôler les champs de données résultants. Après avoir passé ce paramètre, seuls les champs spécifiés seront renvoyés.

#### `except: string[]`

Colonnes exclues, utilisées pour contrôler les champs de données résultants. Après avoir passé ce paramètre, les champs spécifiés ne seront pas inclus dans la sortie.

#### `appends: string[]`

Colonnes à ajouter, utilisées pour charger les données associées. Après avoir passé ce paramètre, les champs associés spécifiés seront également inclus dans la sortie.

#### `sort: string[] | string`

Spécifie la méthode de tri des résultats de la requête. Le paramètre est le nom du champ, qui est par défaut trié par ordre croissant (`asc`). Pour un tri par ordre décroissant (`desc`), ajoutez un symbole `-` devant le nom du champ, par exemple : `['-id', 'name']`, ce qui signifie trier par `id desc, name asc`.

#### `limit: number`

Limite le nombre de résultats, équivalent à `limit` en `SQL`.

#### `offset: number`

Décalage de la requête, équivalent à `offset` en `SQL`.

**Exemple**

```ts
const posts = db.getRepository('posts');

const results = await posts.find({
  filter: {
    createdAt: {
      $gt: '2022-01-01T00:00:00.000Z',
    },
  },
  fields: ['title'],
  appends: ['user'],
});
```

### `findOne()`

Interroge une seule donnée de la base de données qui correspond à des critères spécifiques. Équivalent à `Model.findOne()` dans Sequelize.

**Signature**

- `async findOne(options?: FindOneOptions): Promise<Model | null>`

<embed src="./shared/find-one.md"></embed>

**Exemple**

```ts
const posts = db.getRepository('posts');

const result = await posts.findOne({
  filterByTk: 1,
});
```

### `count()`

Interroge le nombre total d'enregistrements de données qui correspondent à des critères spécifiques dans la base de données. Équivalent à `Model.count()` dans Sequelize.

**Signature**

- `count(options?: CountOptions): Promise<number>`

**Type**

```typescript
interface CountOptions
  extends Omit<SequelizeCountOptions, 'distinct' | 'where' | 'include'>,
    Transactionable {
  filter?: Filter;
}
```

**Exemple**

```ts
const books = db.getRepository('books');

const count = await books.count({
  filter: {
    title: 'Le Classique des Trois Caractères',
  },
});
```

### `findAndCount()`

Interroge un ensemble de données et le nombre total de résultats qui correspondent à des critères spécifiques dans la base de données. Équivalent à `Model.findAndCountAll()` dans Sequelize.

**Signature**

- `async findAndCount(options?: FindAndCountOptions): Promise<[Model[], number]>`

**Type**

```typescript
type FindAndCountOptions = Omit<
  SequelizeAndCountOptions,
  'where' | 'include' | 'order'
> &
  CommonFindOptions;
```

**Détails**

Les paramètres de requête sont les mêmes que pour `find()`. La valeur de retour est un tableau dont le premier élément est le résultat de la requête et le second est le nombre total de résultats.

### `create()`

Insère un nouvel enregistrement dans la collection. Équivalent à `Model.create()` dans Sequelize. Lorsque l'objet de données à créer contient des informations sur les champs de relation, les enregistrements de données de relation correspondants seront également créés ou mis à jour.

**Signature**

- `async create<M extends Model>(options: CreateOptions): Promise<M>`

<embed src="./shared/create-options.md"></embed>

**Exemple**

```ts
const posts = db.getRepository('posts');

const result = await posts.create({
  values: {
    title: 'Notes de publication de NocoBase 1.0',
    tags: [
      // Si la valeur de la clé primaire de la table de relation existe, cela met à jour l'enregistrement.
      { id: 1 },
      // S'il n'y a pas de valeur de clé primaire, cela crée un nouvel enregistrement.
      { name: 'NocoBase' },
    ],
  },
});
```

### `createMany()`

Insère plusieurs nouveaux enregistrements dans la collection. Équivalent à appeler la méthode `create()` plusieurs fois.

**Signature**

- `createMany(options: CreateManyOptions): Promise<Model[]>`

**Type**

```typescript
interface CreateManyOptions extends BulkCreateOptions {
  records: Values[];
}
```

**Détails**

- `records` : Un tableau d'objets de données pour les enregistrements à créer.
- `transaction` : Objet de transaction. Si aucun paramètre de transaction n'est passé, cette méthode créera automatiquement une transaction interne.

**Exemple**

```ts
const posts = db.getRepository('posts');

const results = await posts.createMany({
  records: [
    {
      title: 'Notes de publication de NocoBase 1.0',
      tags: [
        // Si la valeur de la clé primaire de la table de relation existe, cela met à jour l'enregistrement.
        { id: 1 },
        // S'il n'y a pas de valeur de clé primaire, cela crée un nouvel enregistrement.
        { name: 'NocoBase' },
      ],
    },
    {
      title: 'Notes de publication de NocoBase 1.1',
      tags: [{ id: 1 }],
    },
  ],
});
```

### `update()`

Met à jour les données dans la collection. Équivalent à `Model.update()` dans Sequelize. Lorsque l'objet de données à mettre à jour contient des informations sur les champs de relation, les enregistrements de données de relation correspondants seront également créés ou mis à jour.

**Signature**

- `async update<M extends Model>(options: UpdateOptions): Promise<M>`

<embed src="./shared/update-options.md"></embed>

**Exemple**

```ts
const posts = db.getRepository('posts');

const result = await posts.update({
  filterByTk: 1,
  values: {
    title: 'Notes de publication de NocoBase 1.0',
    tags: [
      // Si la valeur de la clé primaire de la table de relation existe, cela met à jour l'enregistrement.
      { id: 1 },
      // S'il n'y a pas de valeur de clé primaire, cela crée un nouvel enregistrement.
      { name: 'NocoBase' },
    ],
  },
});
```

### `destroy()`

Supprime des données de la collection. Équivalent à `Model.destroy()` dans Sequelize.

**Signature**

- `async destroy(options?: TargetKey | TargetKey[] | DestroyOptions): Promise<number>`

**Type**

```typescript
interface DestroyOptions extends SequelizeDestroyOptions {
  filter?: Filter;
  filterByTk?: TargetKey | TargetKey[];
  truncate?: boolean;
  context?: any;
}
```

**Détails**

- `filter` : Spécifie les conditions de filtre pour les enregistrements à supprimer. Pour une utilisation détaillée de `Filter`, veuillez consulter la méthode [`find()`](#find).
- `filterByTk` : Spécifie les conditions de filtre pour les enregistrements à supprimer par `TargetKey`.
- `truncate` : Indique s'il faut tronquer les données de la table, ce qui est effectif si aucun paramètre `filter` ou `filterByTk` n'est passé.
- `transaction` : Objet de transaction. Si aucun paramètre de transaction n'est passé, cette méthode créera automatiquement une transaction interne.