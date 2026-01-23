:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::

# Repository

## Översikt

På ett givet `samling`-objekt kan ni hämta dess `Repository`-objekt för att utföra läs- och skrivoperationer på samlingen.

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

### Frågor

#### Grundläggande frågor

På `Repository`-objektet kan ni anropa `find*`-relaterade metoder för att utföra frågor. Alla frågemetoder stöder att ni skickar in en `filter`-parameter för att filtrera data.

```javascript
// SELECT * FROM users WHERE id = 1
userRepository.find({
  filter: {
    id: 1,
  },
});
```

#### Operatorer

`filter`-parametern i `Repository` erbjuder också en mängd olika operatorer för att utföra mer varierade frågor.

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

För mer information om operatorer, se [Filter Operators](/api/database/operators).

#### Fältkontroll

När ni utför en fråga kan ni styra vilka fält som ska visas genom parametrarna `fields`, `except` och `appends`.

- `fields`: Anger vilka fält som ska visas
- `except`: Exkluderar fält från att visas
- `appends`: Lägger till relaterade fält i utdata

```javascript
// Resultatet kommer endast att inkludera fälten id och name
userRepository.find({
  fields: ['id', 'name'],
});

// Resultatet kommer inte att inkludera fältet password
userRepository.find({
  except: ['password'],
});

// Resultatet kommer att inkludera data från det relaterade objektet posts
userRepository.find({
  appends: ['posts'],
});
```

#### Fråga relaterade fält

`filter`-parametern stöder filtrering baserat på relaterade fält, till exempel:

```javascript
// Fråga efter användarobjekt vars relaterade posts har ett objekt med titeln 'post title'
userRepository.find({
  filter: {
    'posts.title': 'post title',
  },
});
```

Relaterade fält kan också kapslas.

```javascript
// Fråga efter användarobjekt där kommentarerna i deras posts innehåller nyckelord
await userRepository.find({
  filter: {
    'posts.comments.content': {
      $like: '%keywords%',
    },
  },
});
```

#### Sortering

Ni kan sortera frågeresultaten med hjälp av `sort`-parametern.

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

Ni kan också sortera efter fält i relaterade objekt.

```javascript
await userRepository.find({
  sort: 'profile.createdAt',
});
```

### Skapa

#### Grundläggande skapande

Skapa nya dataobjekt via `Repository`.

```javascript
await userRepository.create({
  name: 'John Doe',
  age: 18,
});
// INSERT INTO users (name, age) VALUES ('John Doe', 18)

// Stöder masskapande
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

#### Skapa relationer

När ni skapar kan ni samtidigt skapa relaterade objekt. Liksom vid frågor stöds även kapslad användning av relaterade objekt, till exempel:

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
// När en användare skapas, skapas även en post som associeras med användaren, och taggar skapas och associeras med posten.
```

Om det relaterade objektet redan finns i databasen kan ni skicka in dess ID. Då upprättas en relation med det befintliga objektet vid skapandet.

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
          id: tag1.id, // Upprätta en relation med ett befintligt relaterat objekt
        },
        {
          name: 'tag2',
        },
      ],
    },
  ],
});
```

### Uppdatera

#### Grundläggande uppdatering

När ni har hämtat ett dataobjekt kan ni direkt ändra dess egenskaper på dataobjektet (`Model`) och sedan anropa `save`-metoden för att spara ändringarna.

```javascript
const user = await userRepository.findOne({
  filter: {
    name: 'John Doe',
  },
});

user.age = 20;
await user.save();
```

Dataobjektet `Model` ärver från Sequelize Model. För operationer på `Model`, se [Sequelize Model](https://sequelize.org/master/manual/model-basics.html).

Ni kan också uppdatera data via `Repository`:

```javascript
// Uppdatera dataposter som uppfyller filterkriterierna
await userRepository.update({
  filter: {
    name: 'John Doe',
  },
  values: {
    age: 20,
  },
});
```

Vid uppdatering kan ni styra vilka fält som ska uppdateras med parametrarna `whitelist` och `blacklist`, till exempel:

```javascript
await userRepository.update({
  filter: {
    name: 'John Doe',
  },
  values: {
    age: 20,
    name: 'Jane Smith',
  },
  whitelist: ['age'], // Uppdatera endast fältet age
});
```

#### Uppdatera relaterade fält

Vid uppdatering kan ni ställa in relaterade objekt, till exempel:

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
        id: tag1.id, // Upprätta en relation med tag1
      },
      {
        name: 'tag2', // Skapa en ny tagg och upprätta en relation
      },
    ],
  },
});

await postRepository.update({
  filter: {
    id: 1,
  },
  values: {
    tags: null, // Koppla bort posten från taggarna
  },
});
```

### Ta bort

Ni kan anropa `destroy()`-metoden i `Repository` för att utföra en borttagningsoperation. Vid borttagning måste ni ange filterkriterier:

```javascript
await userRepository.destroy({
  filter: {
    status: 'blocked',
  },
});
```

## Konstruktor

Den anropas vanligtvis inte direkt av utvecklare. Istället instansieras den främst efter att typen har registrerats via `db.registerRepositories()` och den motsvarande registrerade repository-typen har specificerats i parametrarna för `db.collection()`.

**Signatur**

- `constructor(collection: samling)`

**Exempel**

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
  // här länkar till det registrerade repositoryt
  repository: 'books',
});

await db.sync();

const books = db.getRepository('books') as MyRepository;
await books.myQuery('SELECT * FROM books;');
```

## Instansmedlemmar

### `database`

Databasadministrationsinstansen för kontexten.

### `collection`

Den motsvarande samlingsadministrationsinstansen.

### `model`

Den motsvarande modellklassen.

## Instansmetoder

### `find()`

Hämtar en datamängd från databasen, där ni kan ange filtervillkor, sortering med mera.

**Signatur**

- `async find(options?: FindOptions): Promise<Model[]>`

**Typ**

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

**Detaljer**

#### `filter: Filter`

Frågevillkor som används för att filtrera dataresultat. I de skickade frågeparametrarna är `key` namnet på fältet att fråga, och `value` kan vara det värde ni vill söka efter, eller användas tillsammans med operatorer för annan villkorlig datafiltrering.

```typescript
// Fråga efter poster där name är 'foo' och age är större än 18
repository.find({
  filter: {
    name: 'foo',
    age: {
      $gt: 18,
    },
  },
});
```

För fler operatorer, se [Frågeoperatorer](./operators.md).

#### `filterByTk: TargetKey`

Frågar data med `TargetKey`, vilket är en bekväm metod för `filter`-parametern. Vilket specifikt fält `TargetKey` är kan [konfigureras](./collection.md#filtertargetkey) i `samling`, och standardvärdet är `primaryKey`.

```typescript
// Som standard hittar den posten med id = 1
repository.find({
  filterByTk: 1,
});
```

#### `fields: string[]`

Frågekolumner, används för att styra datafältens resultat. Efter att denna parameter har skickats in kommer endast de angivna fälten att returneras.

#### `except: string[]`

Exkluderade kolumner, används för att styra datafältens resultat. Efter att denna parameter har skickats in kommer de angivna fälten inte att visas.

#### `appends: string[]`

Tillagda kolumner, används för att ladda relaterad data. Efter att denna parameter har skickats in kommer de angivna relaterade fälten också att visas.

#### `sort: string[] | string`

Anger sorteringsmetoden för frågeresultaten. Parametern är fältnamnet, som standard sorteras i stigande `asc` ordning. För fallande `desc` ordning, lägg till ett `-`-tecken före fältnamnet, t.ex. `['-id', 'name']`, vilket betyder sortera efter `id desc, name asc`.

#### `limit: number`

Begränsar antalet resultat, samma som `limit` i `SQL`.

#### `offset: number`

Frågeförskjutning, samma som `offset` i `SQL`.

**Exempel**

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

Hämtar en enskild datapost från databasen som uppfyller specifika kriterier. Motsvarar `Model.findOne()` i Sequelize.

**Signatur**

- `async findOne(options?: FindOneOptions): Promise<Model | null>`

<embed src="./shared/find-one.md"></embed>

**Exempel**

```ts
const posts = db.getRepository('posts');

const result = await posts.findOne({
  filterByTk: 1,
});
```

### `count()`

Hämtar det totala antalet dataposter som uppfyller specifika kriterier från databasen. Motsvarar `Model.count()` i Sequelize.

**Signatur**

- `count(options?: CountOptions): Promise<number>`

**Typ**

```typescript
interface CountOptions
  extends Omit<SequelizeCountOptions, 'distinct' | 'where' | 'include'>,
    Transactionable {
  filter?: Filter;
}
```

**Exempel**

```ts
const books = db.getRepository('books');

const count = await books.count({
  filter: {
    title: 'The Great Gatsby',
  },
});
```

### `findAndCount()`

Hämtar en datamängd och det totala antalet resultat som uppfyller specifika kriterier från databasen. Motsvarar `Model.findAndCountAll()` i Sequelize.

**Signatur**

- `async findAndCount(options?: FindAndCountOptions): Promise<[Model[], number]>`

**Typ**

```typescript
type FindAndCountOptions = Omit<
  SequelizeAndCountOptions,
  'where' | 'include' | 'order'
> &
  CommonFindOptions;
```

**Detaljer**

Frågeparametrarna är desamma som för `find()`. Returvärdet är en array där det första elementet är frågeresultatet och det andra elementet är det totala antalet resultat.

### `create()`

Infogar en ny datapost i samlingen. Motsvarar `Model.create()` i Sequelize. När dataobjektet som ska skapas innehåller information om relationsfält, kommer motsvarande relationsdataposter att skapas eller uppdateras samtidigt.

**Signatur**

- `async create<M extends Model>(options: CreateOptions): Promise<M>`

<embed src="./shared/create-options.md"></embed>

**Exempel**

```ts
const posts = db.getRepository('posts');

const result = await posts.create({
  values: {
    title: 'NocoBase 1.0 Release Notes',
    tags: [
      // När primärnyckelvärdet för relationstabellen finns, uppdateras dataposten
      { id: 1 },
      // När det inte finns något primärnyckelvärde, skapas ny data
      { name: 'NocoBase' },
    ],
  },
});
```

### `createMany()`

Infogar flera nya dataposter i samlingen. Motsvarar att anropa `create()`-metoden flera gånger.

**Signatur**

- `createMany(options: CreateManyOptions): Promise<Model[]>`

**Typ**

```typescript
interface CreateManyOptions extends BulkCreateOptions {
  records: Values[];
}
```

**Detaljer**

- `records`: En array av dataobjekt för de poster som ska skapas.
- `transaction`: Transaktionsobjekt. Om ingen transaktionsparameter skickas in, kommer metoden automatiskt att skapa en intern transaktion.

**Exempel**

```ts
const posts = db.getRepository('posts');

const results = await posts.createMany({
  records: [
    {
      title: 'NocoBase 1.0 Release Notes',
      tags: [
        // När primärnyckelvärdet för relationstabellen finns, uppdateras dataposten
        { id: 1 },
        // När det inte finns något primärnyckelvärde, skapas ny data
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

Uppdaterar data i samlingen. Motsvarar `Model.update()` i Sequelize. När dataobjektet som ska uppdateras innehåller information om relationsfält, kommer motsvarande relationsdataposter att skapas eller uppdateras samtidigt.

**Signatur**

- `async update<M extends Model>(options: UpdateOptions): Promise<M>`

<embed src="./shared/update-options.md"></embed>

**Exempel**

```ts
const posts = db.getRepository('posts');

const result = await posts.update({
  filterByTk: 1,
  values: {
    title: 'NocoBase 1.0 Release Notes',
    tags: [
      // När primärnyckelvärdet för relationstabellen finns, uppdateras dataposten
      { id: 1 },
      // När det inte finns något primärnyckelvärde, skapas ny data
      { name: 'NocoBase' },
    ],
  },
});
```

### `destroy()`

Tar bort data från samlingen. Motsvarar `Model.destroy()` i Sequelize.

**Signatur**

- `async destory(options?: TargetKey | TargetKey[] | DestoryOptions): Promise<number>`

**Typ**

```typescript
interface DestroyOptions extends SequelizeDestroyOptions {
  filter?: Filter;
  filterByTk?: TargetKey | TargetKey[];
  truncate?: boolean;
  context?: any;
}
```

**Detaljer**

- `filter`: Anger filtervillkoren för de poster som ska tas bort. För detaljerad användning av Filter, se [`find()`](#find)-metoden.
- `filterByTk`: Anger filtervillkoren för de poster som ska tas bort med TargetKey.
- `truncate`: Om samlingens data ska tömmas, gäller när ingen `filter`- eller `filterByTk`-parameter skickas in.
- `transaction`: Transaktionsobjekt. Om ingen transaktionsparameter skickas in, kommer metoden automatiskt att skapa en intern transaktion.