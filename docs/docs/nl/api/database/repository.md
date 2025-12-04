:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::

# Repository

## Overzicht

Binnen een gegeven `collectie`-object kunt u het bijbehorende `Repository`-object opvragen om lees- en schrijfbewerkingen op de datatabel uit te voeren.

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

#### Basis Query

Op het `Repository`-object roept u de `find*`-gerelateerde methoden aan om query-bewerkingen uit te voeren. Alle query-methoden ondersteunen het doorgeven van een `filter`-parameter om gegevens te filteren.

```javascript
// SELECT * FROM users WHERE id = 1
userRepository.find({
  filter: {
    id: 1,
  },
});
```

#### Operatoren

De `filter`-parameter in `Repository` biedt ook diverse operatoren om complexere query-bewerkingen uit te voeren.

```javascript
// SELECT * FROM users WHERE age > 18
userRepository.find({
  filter: {
    age: {
      $gt: 18,
    },
  },
});

// SELECT * FROM users WHERE age > 18 OR name LIKE '%张%'
userRepository.find({
  filter: {
    $or: [{ age: { $gt: 18 } }, { name: { $like: '%张%' } }],
  },
});
```

Voor meer gedetailleerde informatie over operatoren raadpleegt u [Filter-operatoren](/api/database/operators).

#### Veldbeheer

Bij het uitvoeren van een query-bewerking kunt u de uitvoervelden beheren via de parameters `fields`, `except` en `appends`.

- `fields`: Specificeer uitvoervelden
- `except`: Sluit uitvoervelden uit
- `appends`: Voeg gerelateerde velden toe aan de uitvoer

```javascript
// Het resultaat bevat alleen de velden id en name
userRepository.find({
  fields: ['id', 'name'],
});

// Het resultaat bevat het wachtwoordveld niet
userRepository.find({
  except: ['password'],
});

// Het resultaat bevat gegevens van het gerelateerde object posts
userRepository.find({
  appends: ['posts'],
});
```

#### Query's uitvoeren op gerelateerde velden

De `filter`-parameter ondersteunt het filteren op gerelateerde velden, bijvoorbeeld:

```javascript
// Zoek naar gebruikersobjecten waarvan de gerelateerde posts een object met de titel 'post title' hebben
userRepository.find({
  filter: {
    'posts.title': 'post title',
  },
});
```

Gerelateerde velden kunnen ook genest worden.

```javascript
// Zoek naar gebruikersobjecten waarvan de opmerkingen van hun posts trefwoorden bevatten
await userRepository.find({
  filter: {
    'posts.comments.content': {
      $like: '%keywords%',
    },
  },
});
```

#### Sorteren

U kunt de query-resultaten sorteren met behulp van de `sort`-parameter.

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

U kunt ook sorteren op de velden van gerelateerde objecten.

```javascript
await userRepository.find({
  sort: 'profile.createdAt',
});
```

### Aanmaken

#### Basis Aanmaken

Maak nieuwe gegevens-objecten aan via de `Repository`.

```javascript
await userRepository.create({
  name: '张三',
  age: 18,
});
// INSERT INTO users (name, age) VALUES ('张三', 18)

// Ondersteunt bulk aanmaken
await userRepository.create([
  {
    name: '张三',
    age: 18,
  },
  {
    name: '李四',
    age: 20,
  },
]);
```

#### Relaties aanmaken

Bij het aanmaken kunt u ook gelijktijdig gerelateerde objecten aanmaken. Net als bij query's wordt ook genest gebruik van gerelateerde objecten ondersteund, bijvoorbeeld:

```javascript
await userRepository.create({
  name: '张三',
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
// Bij het aanmaken van een gebruiker wordt een post aangemaakt en gekoppeld aan de gebruiker, en worden tags aangemaakt en gekoppeld aan de post.
```

Als het gerelateerde object al in de database bestaat, kunt u de ID ervan doorgeven om een relatie ermee tot stand te brengen tijdens het aanmaken.

```javascript
const tag1 = await tagRepository.findOne({
  filter: {
    name: 'tag1',
  },
});

await userRepository.create({
  name: '张三',
  age: 18,
  posts: [
    {
      title: 'post title',
      content: 'post content',
      tags: [
        {
          id: tag1.id, // Leg een relatie met een bestaand gerelateerd object
        },
        {
          name: 'tag2',
        },
      ],
    },
  ],
});
```

### Bijwerken

#### Basis Bijwerken

Nadat u een gegevens-object hebt verkregen, kunt u de eigenschappen ervan direct wijzigen op het gegevens-object (`Model`) en vervolgens de `save`-methode aanroepen om de wijzigingen op te slaan.

```javascript
const user = await userRepository.findOne({
  filter: {
    name: '张三',
  },
});

user.age = 20;
await user.save();
```

Het gegevens-object `Model` erft van het Sequelize Model. Voor bewerkingen op het `Model` raadpleegt u [Sequelize Model](https://sequelize.org/master/manual/model-basics.html).

U kunt ook gegevens bijwerken via de `Repository`:

```javascript
// Wijzig gegevensrecords die voldoen aan de filtercriteria
await userRepository.update({
  filter: {
    name: '张三',
  },
  values: {
    age: 20,
  },
});
```

Bij het bijwerken kunt u bepalen welke velden worden bijgewerkt met behulp van de parameters `whitelist` en `blacklist`, bijvoorbeeld:

```javascript
await userRepository.update({
  filter: {
    name: '张三',
  },
  values: {
    age: 20,
    name: '李四',
  },
  whitelist: ['age'], // Werk alleen het 'age'-veld bij
});
```

#### Gerelateerde velden bijwerken

Bij het bijwerken kunt u gerelateerde objecten instellen, bijvoorbeeld:

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
        id: tag1.id, // Leg een relatie met tag1
      },
      {
        name: 'tag2', // Maak een nieuwe tag aan en leg een relatie
      },
    ],
  },
});

await postRepository.update({
  filter: {
    id: 1,
  },
  values: {
    tags: null, // Verbreek de relatie tussen de post en de tags
  },
});
```

### Verwijderen

U kunt de `destroy()`-methode in de `Repository` aanroepen om een verwijderbewerking uit te voeren. U moet filtercriteria opgeven bij het verwijderen:

```javascript
await userRepository.destroy({
  filter: {
    status: 'blocked',
  },
});
```

## Constructor

Meestal wordt deze niet direct door ontwikkelaars aangeroepen. Het wordt voornamelijk geïnstantieerd na het registreren van het type via `db.registerRepositories()` en het specificeren van het overeenkomstige geregistreerde repository-type in de parameters van `db.collection()`.

**Signatuur**

- `constructor(collection: Collection)`

**Voorbeeld**

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
  // hier link naar de geregistreerde repository
  repository: 'books',
});

await db.sync();

const books = db.getRepository('books') as MyRepository;
await books.myQuery('SELECT * FROM books;');
```

## Instantieleden

### `database`

De databasebeheer-instantie van de context.

### `collection`

De overeenkomstige collectiebeheer-instantie.

### `model`

De overeenkomstige modelklasse.

## Instantiemethoden

### `find()`

Haalt een dataset op uit de database, waarbij filtercondities, sortering, enz. kunnen worden gespecificeerd.

**Signatuur**

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

**Details**

#### `filter: Filter`

Query-conditie die wordt gebruikt om gegevensresultaten te filteren. In de doorgegeven query-parameters is de `key` de veldnaam om op te zoeken, en de `value` kan de te zoeken waarde zijn of worden gebruikt met operatoren voor andere voorwaardelijke gegevensfiltering.

```typescript
// Zoek naar records waarbij de naam 'foo' is en de leeftijd groter is dan 18
repository.find({
  filter: {
    name: 'foo',
    age: {
      $gt: 18,
    },
  },
});
```

Voor meer operatoren raadpleegt u [Query-operatoren](./operators.md).

#### `filterByTk: TargetKey`

Haalt gegevens op via `TargetKey`, wat een handige methode is voor de `filter`-parameter. Het specifieke veld voor `TargetKey` kan worden [geconfigureerd](./collection.md#filtertargetkey) in de `collectie`, standaard is dit `primaryKey`.

```typescript
// Zoekt standaard het record met id = 1
repository.find({
  filterByTk: 1,
});
```

#### `fields: string[]`

Query-kolommen, gebruikt om de gegevensveldresultaten te beheren. Na het doorgeven van deze parameter worden alleen de gespecificeerde velden geretourneerd.

#### `except: string[]`

Uitgesloten kolommen, gebruikt om de gegevensveldresultaten te beheren. Na het doorgeven van deze parameter worden de doorgegeven velden niet uitgevoerd.

#### `appends: string[]`

Toegevoegde kolommen, gebruikt om gerelateerde gegevens te laden. Na het doorgeven van deze parameter worden de gespecificeerde relatievelden ook uitgevoerd.

#### `sort: string[] | string`

Specificeert de sorteermethode voor de query-resultaten. De parameter is de veldnaam, die standaard in oplopende (`asc`) volgorde wordt gesorteerd. Voor aflopende (`desc`) volgorde voegt u een `-` symbool toe vóór de veldnaam, bijv. `['-id', 'name']`, wat betekent sorteren op `id desc, name asc`.

#### `limit: number`

Beperkt het aantal resultaten, hetzelfde als `limit` in `SQL`.

#### `offset: number`

Query-offset, hetzelfde als `offset` in `SQL`.

**Voorbeeld**

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

Haalt één enkel gegevensitem op uit de database dat voldoet aan specifieke criteria. Equivalent aan `Model.findOne()` in Sequelize.

**Signatuur**

- `async findOne(options?: FindOneOptions): Promise<Model | null>`

<embed src="./shared/find-one.md"></embed>

**Voorbeeld**

```ts
const posts = db.getRepository('posts');

const result = await posts.findOne({
  filterByTk: 1,
});
```

### `count()`

Haalt het totale aantal gegevensitems op uit de database dat voldoet aan specifieke criteria. Equivalent aan `Model.count()` in Sequelize.

**Signatuur**

- `count(options?: CountOptions): Promise<number>`

**Type**

```typescript
interface CountOptions
  extends Omit<SequelizeCountOptions, 'distinct' | 'where' | 'include'>,
    Transactionable {
  filter?: Filter;
}
```

**Voorbeeld**

```ts
const books = db.getRepository('books');

const count = await books.count({
  filter: {
    title: '三字经',
  },
});
```

### `findAndCount()`

Haalt een dataset en het totale aantal resultaten op uit de database dat voldoet aan specifieke criteria. Equivalent aan `Model.findAndCountAll()` in Sequelize.

**Signatuur**

- `async findAndCount(options?: FindAndCountOptions): Promise<[Model[], number]>`

**Type**

```typescript
type FindAndCountOptions = Omit<
  SequelizeAndCountOptions,
  'where' | 'include' | 'order'
> &
  CommonFindOptions;
```

**Details**

De query-parameters zijn hetzelfde als `find()`. De retourwaarde is een array waarbij het eerste element het query-resultaat is en het tweede element het totale aantal.

### `create()`

Voegt een nieuw record toe aan de collectie. Equivalent aan `Model.create()` in Sequelize. Wanneer het aan te maken gegevens-object informatie over relatievelden bevat, worden de overeenkomstige relatiegegevensrecords ook aangemaakt of bijgewerkt.

**Signatuur**

- `async create<M extends Model>(options: CreateOptions): Promise<M>`

<embed src="./shared/create-options.md"></embed>

**Voorbeeld**

```ts
const posts = db.getRepository('posts');

const result = await posts.create({
  values: {
    title: 'NocoBase 1.0 发布日志',
    tags: [
      // Wanneer de primaire sleutel van de relatietabel bestaat, wordt de data bijgewerkt
      { id: 1 },
      // Wanneer er geen primaire sleutelwaarde is, wordt nieuwe data aangemaakt
      { name: 'NocoBase' },
    ],
  },
});
```

### `createMany()`

Voegt meerdere nieuwe records toe aan de collectie. Equivalent aan het meerdere keren aanroepen van de `create()`-methode.

**Signatuur**

- `createMany(options: CreateManyOptions): Promise<Model[]>`

**Type**

```typescript
interface CreateManyOptions extends BulkCreateOptions {
  records: Values[];
}
```

**Details**

- `records`: Een array van gegevens-objecten voor de aan te maken records.
- `transaction`: Transactie-object. Als er geen transactie-parameter wordt doorgegeven, maakt de methode automatisch een interne transactie aan.

**Voorbeeld**

```ts
const posts = db.getRepository('posts');

const results = await posts.createMany({
  records: [
    {
      title: 'NocoBase 1.0 发布日志',
      tags: [
        // Wanneer de primaire sleutel van de relatietabel bestaat, wordt de data bijgewerkt
        { id: 1 },
        // Wanneer er geen primaire sleutelwaarde is, wordt nieuwe data aangemaakt
        { name: 'NocoBase' },
      ],
    },
    {
      title: 'NocoBase 1.1 发布日志',
      tags: [{ id: 1 }],
    },
  ],
});
```

### `update()`

Werkt gegevens in de collectie bij. Equivalent aan `Model.update()` in Sequelize. Wanneer het bij te werken gegevens-object informatie over relatievelden bevat, worden de overeenkomstige relatiegegevensrecords ook aangemaakt of bijgewerkt.

**Signatuur**

- `async update<M extends Model>(options: UpdateOptions): Promise<M>`

<embed src="./shared/update-options.md"></embed>

**Voorbeeld**

```ts
const posts = db.getRepository('posts');

const result = await posts.update({
  filterByTk: 1,
  values: {
    title: 'NocoBase 1.0 发布日志',
    tags: [
      // Wanneer de primaire sleutel van de relatietabel bestaat, wordt de data bijgewerkt
      { id: 1 },
      // Wanneer er geen primaire sleutelwaarde is, wordt nieuwe data aangemaakt
      { name: 'NocoBase' },
    ],
  },
});
```

### `destroy()`

Verwijdert gegevens uit de collectie. Equivalent aan `Model.destroy()` in Sequelize.

**Signatuur**

- `async destory(options?: TargetKey | TargetKey[] | DestoryOptions): Promise<number>`

**Type**

```typescript
interface DestroyOptions extends SequelizeDestroyOptions {
  filter?: Filter;
  filterByTk?: TargetKey | TargetKey[];
  truncate?: boolean;
  context?: any;
}
```

**Details**

- `filter`: Specificeert de filtercondities voor de te verwijderen records. Voor gedetailleerd gebruik van Filter, raadpleegt u de [`find()`](#find)-methode.
- `filterByTk`: Specificeert de filtercondities voor de te verwijderen records op basis van TargetKey.
- `truncate`: Of de collectiegegevens moeten worden geleegd, effectief wanneer er geen `filter` of `filterByTk`-parameter wordt doorgegeven.
- `transaction`: Transactie-object. Als er geen transactie-parameter wordt doorgegeven, maakt de methode automatisch een interne transactie aan.