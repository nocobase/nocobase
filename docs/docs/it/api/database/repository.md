:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::

# Repository

## Panoramica

Su un dato oggetto `collezione`, può ottenere il suo oggetto `Repository` per eseguire operazioni di lettura e scrittura sulla tabella dei dati.

```javascript
const { UserCollection } = require('./collections');

const UserRepository = UserCollection.repository;

const user = await UserRepository.findOne({
  filter: {
    id: 1,
  },
});

user.name = 'new name';
await user.save();
```

### Query

#### Query di base

Sull'oggetto `Repository`, chiami i metodi correlati `find*` per eseguire operazioni di query. Tutti i metodi di query supportano il passaggio di un parametro `filter` per filtrare i dati.

```javascript
// SELECT * FROM users WHERE id = 1
userRepository.find({
  filter: {
    id: 1,
  },
});
```

#### Operatori

Il parametro `filter` nel `Repository` offre anche una varietà di operatori per eseguire operazioni di query più diverse.

```javascript
// SELECT * FROM users WHERE age > 18
userRepository.find({
  filter: {
    age: {
      $gt: 18,
    },
  },
});

// SELECT * FROM users WHERE age > 18 OR name LIKE '%John%'
userRepository.find({
  filter: {
    $or: [{ age: { $gt: 18 } }, { name: { $like: '%John%' } }],
  },
});
```

Per maggiori dettagli sugli operatori, consulti [Operatori di filtro](/api/database/operators).

#### Controllo dei campi

Quando esegue un'operazione di query, può controllare i campi di output tramite i parametri `fields`, `except` e `appends`.

- `fields`: Specifica i campi di output
- `except`: Esclude i campi di output
- `appends`: Aggiunge campi associati all'output

```javascript
// Il risultato includerà solo i campi id e name
userRepository.find({
  fields: ['id', 'name'],
});

// Il risultato non includerà il campo password
userRepository.find({
  except: ['password'],
});

// Il risultato includerà i dati dall'oggetto associato posts
userRepository.find({
  appends: ['posts'],
});
```

#### Query sui campi di associazione

Il parametro `filter` supporta il filtraggio per campi di associazione, ad esempio:

```javascript
// Esegue una query per oggetti utente i cui post associati hanno un oggetto con il titolo 'post title'
userRepository.find({
  filter: {
    'posts.title': 'post title',
  },
});
```

I campi di associazione possono anche essere annidati.

```javascript
// Esegue una query per oggetti utente in cui i commenti dei loro post contengono parole chiave
await userRepository.find({
  filter: {
    'posts.comments.content': {
      $like: '%keywords%',
    },
  },
});
```

#### Ordinamento

Può ordinare i risultati della query utilizzando il parametro `sort`.

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

Può anche ordinare per i campi degli oggetti associati.

```javascript
await userRepository.find({
  sort: 'profile.createdAt',
});
```

### Creazione

#### Creazione di base

Creare nuovi oggetti dati tramite il `Repository`.

```javascript
await userRepository.create({
  name: 'John Doe',
  age: 18,
});
// INSERT INTO users (name, age) VALUES ('John Doe', 18)

// Supporta la creazione in blocco
await userRepository.create([
  {
    name: 'John Doe',
    age: 18,
  },
  {
    name: 'Jane Smith',
    age: 20,
  },
]);
```

#### Creazione di associazioni

Durante la creazione, può anche creare oggetti associati contemporaneamente. Similmente alle query, è supportato anche l'uso annidato di oggetti associati, ad esempio:

```javascript
await userRepository.create({
  name: 'John Doe',
  age: 18,
  posts: [
    {
      title: 'post title',
      content: 'post content',
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
// Quando crea un utente, viene creato un post e associato all'utente, e i tag vengono creati e associati al post.
```

Se l'oggetto associato esiste già nel database, può passare il suo ID per stabilire un'associazione con esso durante la creazione.

```javascript
const tag1 = await tagRepository.findOne({
  filter: {
    name: 'tag1',
  },
});

await userRepository.create({
  name: 'John Doe',
  age: 18,
  posts: [
    {
      title: 'post title',
      content: 'post content',
      tags: [
        {
          id: tag1.id, // Stabilisce un'associazione con un oggetto associato esistente
        },
        {
          name: 'tag2',
        },
      ],
    },
  ],
});
```

### Aggiornamento

#### Aggiornamento di base

Dopo aver ottenuto un oggetto dati, può modificarne direttamente le proprietà sull'oggetto dati (`Model`) e quindi chiamare il metodo `save` per salvare le modifiche.

```javascript
const user = await userRepository.findOne({
  filter: {
    name: 'John Doe',
  },
});

user.age = 20;
await user.save();
```

L'oggetto dati `Model` eredita dal Model di Sequelize. Per le operazioni sul `Model`, consulti [Sequelize Model](https://sequelize.org/master/manual/model-basics.html).

Può anche aggiornare i dati tramite il `Repository`:

```javascript
// Aggiorna i record di dati che soddisfano i criteri del filtro
await userRepository.update({
  filter: {
    name: 'John Doe',
  },
  values: {
    age: 20,
  },
});
```

Durante l'aggiornamento, può controllare quali campi vengono aggiornati utilizzando i parametri `whitelist` e `blacklist`, ad esempio:

```javascript
await userRepository.update({
  filter: {
    name: 'John Doe',
  },
  values: {
    age: 20,
    name: 'Jane Smith',
  },
  whitelist: ['age'], // Aggiorna solo il campo age
});
```

#### Aggiornamento dei campi di associazione

Durante l'aggiornamento, può impostare oggetti associati, ad esempio:

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
    title: 'new post title',
    tags: [
      {
        id: tag1.id, // Stabilisce un'associazione con tag1
      },
      {
        name: 'tag2', // Crea un nuovo tag e stabilisce un'associazione
      },
    ],
  },
});

await postRepository.update({
  filter: {
    id: 1,
  },
  values: {
    tags: null, // Disassocia il post dai tag
  },
});
```

### Eliminazione

Può chiamare il metodo `destroy()` nel `Repository` per eseguire un'operazione di eliminazione. Deve specificare i criteri di filtro durante l'eliminazione:

```javascript
await userRepository.destroy({
  filter: {
    status: 'blocked',
  },
});
```

## Costruttore

Normalmente non viene chiamato direttamente dagli sviluppatori. Viene principalmente istanziato dopo aver registrato il tipo tramite `db.registerRepositories()` e specificando il tipo di repository registrato corrispondente nei parametri di `db.collection()`.

**Firma**

- `constructor(collection: Collection)`

**Esempio**

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
  // qui si collega al repository registrato
  repository: 'books',
});

await db.sync();

const books = db.getRepository('books') as MyRepository;
await books.myQuery('SELECT * FROM books;');
```

## Membri dell'istanza

### `database`

L'istanza di gestione del database del contesto.

### `collection`

L'istanza di gestione della collezione corrispondente.

### `model`

La classe del modello corrispondente.

## Metodi dell'istanza

### `find()`

Esegue una query su un set di dati dal database, consentendo la specifica di condizioni di filtro, ordinamento, ecc.

**Firma**

- `async find(options?: FindOptions): Promise<Model[]>`

**Tipo**

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

**Dettagli**

#### `filter: Filter`

Condizione di query utilizzata per filtrare i risultati dei dati. Nei parametri di query passati, la `key` è il nome del campo da interrogare e il `value` può essere il valore da interrogare o utilizzato con operatori per altri filtri condizionali sui dati.

```typescript
// Esegue una query per i record in cui il nome è 'foo' e l'età è maggiore di 18
repository.find({
  filter: {
    name: 'foo',
    age: {
      $gt: 18,
    },
  },
});
```

Per maggiori operatori, consulti [Operatori di query](./operators.md).

#### `filterByTk: TargetKey`

Esegue una query sui dati tramite `TargetKey`, che è un metodo conveniente per il parametro `filter`. Il campo specifico per `TargetKey` può essere [configurato](./collection.md#filtertargetkey) nella `collezione`, con `primaryKey` come valore predefinito.

```typescript
// Per impostazione predefinita, trova il record con id = 1
repository.find({
  filterByTk: 1,
});
```

#### `fields: string[]`

Colonne di query, utilizzate per controllare i risultati dei campi dati. Dopo aver passato questo parametro, verranno restituiti solo i campi specificati.

#### `except: string[]`

Colonne escluse, utilizzate per controllare i risultati dei campi dati. Dopo aver passato questo parametro, i campi passati non verranno inclusi nell'output.

#### `appends: string[]`

Colonne aggiunte, utilizzate per caricare dati associati. Dopo aver passato questo parametro, verranno inclusi nell'output anche i campi di associazione specificati.

#### `sort: string[] | string`

Specifica il metodo di ordinamento per i risultati della query. Il parametro è il nome del campo, che per impostazione predefinita è l'ordine crescente `asc`. Per l'ordine decrescente `desc`, aggiunga un simbolo `-` prima del nome del campo, ad esempio `['-id', 'name']`, che significa ordinare per `id desc, name asc`.

#### `limit: number`

Limita il numero di risultati, come `limit` in `SQL`.

#### `offset: number`

Offset della query, come `offset` in `SQL`.

**Esempio**

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

Esegue una query su un singolo dato dal database che soddisfa criteri specifici. Equivalente a `Model.findOne()` di Sequelize.

**Firma**

- `async findOne(options?: FindOneOptions): Promise<Model | null>`

<embed src="./shared/find-one.md"></embed>

**Esempio**

```ts
const posts = db.getRepository('posts');

const result = await posts.findOne({
  filterByTk: 1,
});
```

### `count()`

Esegue una query sul numero totale di voci di dati che soddisfano criteri specifici dal database. Equivalente a `Model.count()` di Sequelize.

**Firma**

- `count(options?: CountOptions): Promise<number>`

**Tipo**

```typescript
interface CountOptions
  extends Omit<SequelizeCountOptions, 'distinct' | 'where' | 'include'>,
    Transactionable {
  filter?: Filter;
}
```

**Esempio**

```ts
const books = db.getRepository('books');

const count = await books.count({
  filter: {
    title: 'The Great Gatsby',
  },
});
```

### `findAndCount()`

Esegue una query su un set di dati e sul numero totale di risultati che soddisfano criteri specifici dal database. Equivalente a `Model.findAndCountAll()` di Sequelize.

**Firma**

- `async findAndCount(options?: FindAndCountOptions): Promise<[Model[], number]>`

**Tipo**

```typescript
type FindAndCountOptions = Omit<
  SequelizeAndCountOptions,
  'where' | 'include' | 'order'
> &
  CommonFindOptions;
```

**Dettagli**

I parametri di query sono gli stessi di `find()`. Il valore restituito è un array in cui il primo elemento è il risultato della query e il secondo elemento è il conteggio totale.

### `create()`

Inserisce un nuovo record nella collezione. Equivalente a `Model.create()` di Sequelize. Quando l'oggetto dati da creare contiene informazioni sui campi di relazione, i record di dati di relazione corrispondenti verranno creati o aggiornati.

**Firma**

- `async create<M extends Model>(options: CreateOptions): Promise<M>`

<embed src="./shared/create-options.md"></embed>

**Esempio**

```ts
const posts = db.getRepository('posts');

const result = await posts.create({
  values: {
    title: 'NocoBase 1.0 Release Notes',
    tags: [
      // Quando esiste la chiave primaria della tabella di associazione, aggiorna i dati
      { id: 1 },
      // Quando non c'è un valore di chiave primaria, crea nuovi dati
      { name: 'NocoBase' },
    ],
  },
});
```

### `createMany()`

Inserisce più nuovi record nella collezione. Equivalente a chiamare il metodo `create()` più volte.

**Firma**

- `createMany(options: CreateManyOptions): Promise<Model[]>`

**Tipo**

```typescript
interface CreateManyOptions extends BulkCreateOptions {
  records: Values[];
}
```

**Dettagli**

- `records`: Un array di oggetti dati per i record da creare.
- `transaction`: Oggetto transazione. Se non viene passato alcun parametro di transazione, il metodo creerà automaticamente una transazione interna.

**Esempio**

```ts
const posts = db.getRepository('posts');

const results = await posts.createMany({
  records: [
    {
      title: 'NocoBase 1.0 Release Notes',
      tags: [
        // Quando esiste la chiave primaria della tabella di associazione, aggiorna i dati
        { id: 1 },
        // Quando non c'è un valore di chiave primaria, crea nuovi dati
        { name: 'NocoBase' },
      ],
    },
    {
      title: 'NocoBase 1.1 Release Notes',
      tags: [{ id: 1 }],
    },
  ],
});
```

### `update()`

Aggiorna i dati nella collezione. Equivalente a `Model.update()` di Sequelize. Quando l'oggetto dati da aggiornare contiene informazioni sui campi di relazione, i record di dati di relazione corrispondenti verranno creati o aggiornati.

**Firma**

- `async update<M extends Model>(options: UpdateOptions): Promise<M>`

<embed src="./shared/update-options.md"></embed>

**Esempio**

```ts
const posts = db.getRepository('posts');

const result = await posts.update({
  filterByTk: 1,
  values: {
    title: 'NocoBase 1.0 Release Notes',
    tags: [
      // Quando esiste la chiave primaria della tabella di associazione, aggiorna i dati
      { id: 1 },
      // Quando non c'è un valore di chiave primaria, crea nuovi dati
      { name: 'NocoBase' },
    ],
  },
});
```

### `destroy()`

Elimina i dati dalla collezione. Equivalente a `Model.destroy()` di Sequelize.

**Firma**

- `async destroy(options?: TargetKey | TargetKey[] | DestroyOptions): Promise<number>`

**Tipo**

```typescript
interface DestroyOptions extends SequelizeDestroyOptions {
  filter?: Filter;
  filterByTk?: TargetKey | TargetKey[];
  truncate?: boolean;
  context?: any;
}
```

**Dettagli**

- `filter`: Specifica le condizioni di filtro per i record da eliminare. Per l'uso dettagliato di Filter, consulti il metodo [`find()`](#find).
- `filterByTk`: Specifica le condizioni di filtro per i record da eliminare tramite TargetKey.
- `truncate`: Indica se troncare i dati della collezione, efficace quando non viene passato alcun parametro `filter` o `filterByTk`.
- `transaction`: Oggetto transazione. Se non viene passato alcun parametro di transazione, il metodo creerà automaticamente una transazione interna.