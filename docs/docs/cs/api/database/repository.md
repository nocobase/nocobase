:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::


# Repozitář

## Přehled

Na daném objektu `kolekce` můžete získat jeho objekt `Repozitář`, abyste mohli provádět operace čtení a zápisu s daty v kolekci.

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

### Dotazování

#### Základní dotazování

Na objektu `Repozitář` můžete volat metody začínající `find*` pro provádění dotazovacích operací. Všechny dotazovací metody podporují předání parametru `filter` pro filtrování dat.

```javascript
// SELECT * FROM users WHERE id = 1
userRepository.find({
  filter: {
    id: 1,
  },
});
```

#### Operátory

Parametr `filter` v `Repozitáři` navíc nabízí různé operátory pro provádění rozmanitějších dotazovacích operací.

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

Další podrobnosti o operátorech naleznete v [Operátory filtru](/api/database/operators).

#### Ovládání polí

Při provádění dotazovací operace můžete ovládat výstupní pole pomocí parametrů `fields`, `except` a `appends`.

- `fields`: Určuje výstupní pole
- `except`: Vylučuje výstupní pole
- `appends`: Připojuje související pole k výstupu

```javascript
// Výsledek bude obsahovat pouze pole id a name
userRepository.find({
  fields: ['id', 'name'],
});

// Výsledek nebude obsahovat pole password
userRepository.find({
  except: ['password'],
});

// Výsledek bude obsahovat data ze souvisejícího objektu posts
userRepository.find({
  appends: ['posts'],
});
```

#### Dotazování na související pole

Parametr `filter` podporuje filtrování podle souvisejících polí, například:

```javascript
// Dotaz na objekty uživatelů, jejichž související příspěvky (posts) mají objekt s názvem 'post title'
userRepository.find({
  filter: {
    'posts.title': 'post title',
  },
});
```

Související pole mohou být také vnořená.

```javascript
// Dotaz na objekty uživatelů, kde komentáře jejich příspěvků (posts) obsahují klíčová slova
await userRepository.find({
  filter: {
    'posts.comments.content': {
      $like: '%keywords%',
    },
  },
});
```

#### Řazení

Výsledky dotazu můžete seřadit pomocí parametru `sort`.

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

Můžete také řadit podle polí souvisejících objektů.

```javascript
await userRepository.find({
  sort: 'profile.createdAt',
});
```

### Vytváření

#### Základní vytváření

Vytvářejte nové datové objekty pomocí `Repozitáře`.

```javascript
await userRepository.create({
  name: '张三',
  age: 18,
});
// INSERT INTO users (name, age) VALUES ('张三', 18)

// Podporuje hromadné vytváření
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

#### Vytváření asociací

Při vytváření můžete současně vytvářet i související objekty. Podobně jako u dotazování je podporováno i vnořené použití souvisejících objektů, například:

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
// Při vytváření uživatele se zároveň vytvoří příspěvek (post) a přidruží se k uživateli, a vytvoří se tagy, které se přidruží k příspěvku.
```

Pokud související objekt již existuje v databázi, můžete předat jeho ID a při vytváření se s ním naváže asociace.

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
          id: tag1.id, // Naváže asociaci s existujícím souvisejícím objektem
        },
        {
          name: 'tag2',
        },
      ],
    },
  ],
});
```

### Aktualizace

#### Základní aktualizace

Po získání datového objektu můžete přímo upravit jeho vlastnosti na datovém objektu (`Model`) a poté zavolat metodu `save` pro uložení změn.

```javascript
const user = await userRepository.findOne({
  filter: {
    name: '张三',
  },
});

user.age = 20;
await user.save();
```

Datový objekt `Model` dědí ze Sequelize Model. Pro operace s `Model` se prosím podívejte na [Sequelize Model](https://sequelize.org/master/manual/model-basics.html).

Data můžete aktualizovat také pomocí `Repozitáře`:

```javascript
// Aktualizuje datové záznamy, které splňují kritéria filtru
await userRepository.update({
  filter: {
    name: '张三',
  },
  values: {
    age: 20,
  },
});
```

Při aktualizaci můžete ovládat, která pole se aktualizují, pomocí parametrů `whitelist` a `blacklist`, například:

```javascript
await userRepository.update({
  filter: {
    name: '张三',
  },
  values: {
    age: 20,
    name: '李四',
  },
  whitelist: ['age'], // Aktualizuje pouze pole age
});
```

#### Aktualizace souvisejících polí

Při aktualizaci můžete nastavit související objekty, například:

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
        id: tag1.id, // Naváže asociaci s tag1
      },
      {
        name: 'tag2', // Vytvoří nový tag a naváže asociaci
      },
    ],
  },
});

await postRepository.update({
  filter: {
    id: 1,
  },
  values: {
    tags: null, // Zruší asociaci příspěvku (post) s tagy
  },
});
```

### Mazání

Můžete volat metodu `destroy()` v `Repozitáři` pro provedení operace mazání. Při mazání je třeba zadat kritéria filtru:

```javascript
await userRepository.destroy({
  filter: {
    status: 'blocked',
  },
});
```

## Konstruktor

Obvykle není volán přímo vývojáři. Instanciace probíhá hlavně po registraci typu pomocí `db.registerRepositories()` a zadání odpovídajícího registrovaného typu repozitáře v parametrech `db.collection()`.

**Podpis**

- `constructor(collection: Collection)`

**Příklad**

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
  // zde odkaz na registrovaný repozitář
  repository: 'books',
});

await db.sync();

const books = db.getRepository('books') as MyRepository;
await books.myQuery('SELECT * FROM books;');
```

## Členové instance

### `database`

Instance pro správu databáze v daném kontextu.

### `collection`

Odpovídající instance pro správu kolekce.

### `model`

Odpovídající třída modelu.

## Metody instance

### `find()`

Dotazuje datovou sadu z databáze, s možností specifikace podmínek filtru, řazení atd.

**Podpis**

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

**Podrobnosti**

#### `filter: Filter`

Podmínka dotazu, používaná k filtrování výsledků dat. V předaných parametrech dotazu je `key` název pole k dotazování a `value` může být hodnota k dotazování nebo může být použita s operátory pro další podmíněné filtrování dat.

```typescript
// Dotaz na záznamy, kde name je 'foo' a age je větší než 18
repository.find({
  filter: {
    name: 'foo',
    age: {
      $gt: 18,
    },
  },
});
```

Další operátory naleznete v [Operátory dotazu](./operators.md).

#### `filterByTk: TargetKey`

Dotazuje data pomocí `TargetKey`, což je pohodlná metoda pro parametr `filter`. Konkrétní pole pro `TargetKey` lze [konfigurovat](./collection.md#filtertargetkey) v `kolekci`, výchozí hodnota je `primaryKey`.

```typescript
// Ve výchozím nastavení najde záznam s id = 1
repository.find({
  filterByTk: 1,
});
```

#### `fields: string[]`

Sloupce dotazu, používané k ovládání výsledků datových polí. Po předání tohoto parametru budou vrácena pouze zadaná pole.

#### `except: string[]`

Vyloučené sloupce, používané k ovládání výsledků datových polí. Po předání tohoto parametru nebudou předaná pole ve výstupu.

#### `appends: string[]`

Připojené sloupce, používané k načítání souvisejících dat. Po předání tohoto parametru budou ve výstupu také zadaná související pole.

#### `sort: string[] | string`

Určuje metodu řazení výsledků dotazu. Parametrem je název pole, které se ve výchozím nastavení řadí vzestupně (`asc`). Pro sestupné řazení (`desc`) přidejte před název pole symbol `-`, např.: `['-id', 'name']`, což znamená řadit podle `id desc, name asc`.

#### `limit: number`

Omezuje počet výsledků, stejně jako `limit` v `SQL`.

#### `offset: number`

Posun dotazu, stejně jako `offset` v `SQL`.

**Příklad**

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

Dotazuje z databáze jeden datový záznam, který splňuje specifická kritéria. Ekvivalent k `Model.findOne()` v Sequelize.

**Podpis**

- `async findOne(options?: FindOneOptions): Promise<Model | null>`

<embed src="./shared/find-one.md"></embed>

**Příklad**

```ts
const posts = db.getRepository('posts');

const result = await posts.findOne({
  filterByTk: 1,
});
```

### `count()`

Dotazuje z databáze celkový počet datových záznamů, které splňují specifická kritéria. Ekvivalent k `Model.count()` v Sequelize.

**Podpis**

- `count(options?: CountOptions): Promise<number>`

**Typ**

```typescript
interface CountOptions
  extends Omit<SequelizeCountOptions, 'distinct' | 'where' | 'include'>,
    Transactionable {
  filter?: Filter;
}
```

**Příklad**

```ts
const books = db.getRepository('books');

const count = await books.count({
  filter: {
    title: '三字经',
  },
});
```

### `findAndCount()`

Dotazuje z databáze datovou sadu a celkový počet výsledků, které splňují specifická kritéria. Ekvivalent k `Model.findAndCountAll()` v Sequelize.

**Podpis**

- `async findAndCount(options?: FindAndCountOptions): Promise<[Model[], number]>`

**Typ**

```typescript
type FindAndCountOptions = Omit<
  SequelizeAndCountOptions,
  'where' | 'include' | 'order'
> &
  CommonFindOptions;
```

**Podrobnosti**

Parametry dotazu jsou stejné jako u `find()`. Návratová hodnota je pole, kde první prvek je výsledek dotazu a druhý prvek je celkový počet výsledků.

### `create()`

Vloží nový záznam do kolekce. Ekvivalent k `Model.create()` v Sequelize. Pokud datový objekt, který má být vytvořen, obsahuje informace o relačních polích, budou odpovídající relační datové záznamy také vytvořeny nebo aktualizovány.

**Podpis**

- `async create<M extends Model>(options: CreateOptions): Promise<M>`

<embed src="./shared/create-options.md"></embed>

**Příklad**

```ts
const posts = db.getRepository('posts');

const result = await posts.create({
  values: {
    title: 'NocoBase 1.0 发布日志',
    tags: [
      // Pokud existuje hodnota primárního klíče relační tabulky, aktualizuje se záznam
      { id: 1 },
      // Pokud hodnota primárního klíče neexistuje, vytvoří se nový záznam
      { name: 'NocoBase' },
    ],
  },
});
```

### `createMany()`

Vloží více nových záznamů do kolekce. Ekvivalent k vícenásobnému volání metody `create()`.

**Podpis**

- `createMany(options: CreateManyOptions): Promise<Model[]>`

**Typ**

```typescript
interface CreateManyOptions extends BulkCreateOptions {
  records: Values[];
}
```

**Podrobnosti**

- `records`: Pole datových objektů pro záznamy, které mají být vytvořeny.
- `transaction`: Objekt transakce. Pokud není předán parametr transakce, metoda automaticky vytvoří interní transakci.

**Příklad**

```ts
const posts = db.getRepository('posts');

const results = await posts.createMany({
  records: [
    {
      title: 'NocoBase 1.0 发布日志',
      tags: [
        // Pokud existuje hodnota primárního klíče relační tabulky, aktualizuje se záznam
        { id: 1 },
        // Pokud hodnota primárního klíče neexistuje, vytvoří se nový záznam
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

Aktualizuje data v kolekci. Ekvivalent k `Model.update()` v Sequelize. Pokud datový objekt, který má být aktualizován, obsahuje informace o relačních polích, budou odpovídající relační datové záznamy také vytvořeny nebo aktualizovány.

**Podpis**

- `async update<M extends Model>(options: UpdateOptions): Promise<M>`

<embed src="./shared/update-options.md"></embed>

**Příklad**

```ts
const posts = db.getRepository('posts');

const result = await posts.update({
  filterByTk: 1,
  values: {
    title: 'NocoBase 1.0 发布日志',
    tags: [
      // Pokud existuje hodnota primárního klíče relační tabulky, aktualizuje se záznam
      { id: 1 },
      // Pokud hodnota primárního klíče neexistuje, vytvoří se nový záznam
      { name: 'NocoBase' },
    ],
  },
});
```

### `destroy()`

Maže data z kolekce. Ekvivalent k `Model.destroy()` v Sequelize.

**Podpis**

- `async destroy(options?: TargetKey | TargetKey[] | DestroyOptions): Promise<number>`

**Typ**

```typescript
interface DestroyOptions extends SequelizeDestroyOptions {
  filter?: Filter;
  filterByTk?: TargetKey | TargetKey[];
  truncate?: boolean;
  context?: any;
}
```

**Podrobnosti**

- `filter`: Určuje podmínky filtru pro záznamy, které mají být smazány. Podrobné použití filtru naleznete v metodě [`find()`](#find).
- `filterByTk`: Určuje podmínky filtru pro záznamy, které mají být smazány, pomocí TargetKey.
- `truncate`: Zda vyprázdnit data kolekce, účinné, pokud nejsou předány parametry `filter` nebo `filterByTk`.
- `transaction`: Objekt transakce. Pokud není předán parametr transakce, metoda automaticky vytvoří interní transakci.