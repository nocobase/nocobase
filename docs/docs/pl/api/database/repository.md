:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::

# Repozytorium

## Przegląd

Dla danego obiektu `Collection` mogą Państwo uzyskać dostęp do jego obiektu `Repository`, aby wykonywać operacje odczytu i zapisu na kolekcji.

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

### Zapytania

#### Podstawowe zapytania

Na obiekcie `Repository` należy wywołać metody związane z `find*`, aby wykonać operacje zapytań. Wszystkie metody zapytań obsługują przekazywanie parametru `filter` do filtrowania danych.

```javascript
// SELECT * FROM users WHERE id = 1
userRepository.find({
  filter: {
    id: 1,
  },
});
```

#### Operatory

Parametr `filter` w `Repository` oferuje również różnorodne operatory do wykonywania bardziej złożonych operacji zapytań.

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

Więcej szczegółów na temat operatorów znajdą Państwo w [Operatorach filtrowania](/api/database/operators).

#### Kontrola pól

Podczas wykonywania operacji zapytania mogą Państwo kontrolować pola wyjściowe za pomocą parametrów `fields`, `except` i `appends`.

- `fields`: Określa pola wyjściowe
- `except`: Wyklucza pola z wyniku
- `appends`: Dołącza powiązane pola do wyniku

```javascript
// Wynik będzie zawierał tylko pola id i name
userRepository.find({
  fields: ['id', 'name'],
});

// Wynik nie będzie zawierał pola password
userRepository.find({
  except: ['password'],
});

// Wynik będzie zawierał dane z powiązanego obiektu posts
userRepository.find({
  appends: ['posts'],
});
```

#### Zapytania o pola powiązane

Parametr `filter` obsługuje filtrowanie według pól powiązanych, na przykład:

```javascript
// Wyszukuje obiekty użytkowników, których powiązane posty mają obiekt z tytułem 'post title'
userRepository.find({
  filter: {
    'posts.title': 'post title',
  },
});
```

Pola powiązane mogą być również zagnieżdżone.

```javascript
// Wyszukuje obiekty użytkowników, których komentarze w postach zawierają słowa kluczowe
await userRepository.find({
  filter: {
    'posts.comments.content': {
      $like: '%keywords%',
    },
  },
});
```

#### Sortowanie

Mogą Państwo sortować wyniki zapytań za pomocą parametru `sort`.

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

Mogą Państwo również sortować według pól powiązanych obiektów.

```javascript
await userRepository.find({
  sort: 'profile.createdAt',
});
```

### Tworzenie

#### Podstawowe tworzenie

Tworzenie nowych obiektów danych za pośrednictwem `Repository`.

```javascript
await userRepository.create({
  name: '张三',
  age: 18,
});
// INSERT INTO users (name, age) VALUES ('张三', 18)

// Obsługuje tworzenie wsadowe
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

#### Tworzenie powiązań

Podczas tworzenia mogą Państwo jednocześnie tworzyć powiązane obiekty. Podobnie jak w przypadku zapytań, obsługiwane jest również zagnieżdżanie powiązanych obiektów, na przykład:

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
// Podczas tworzenia użytkownika, tworzony jest post i powiązany z użytkownikiem, a tagi są tworzone i powiązane z postem.
```

Jeśli powiązany obiekt już istnieje w bazie danych, mogą Państwo przekazać jego ID, aby ustanowić z nim powiązanie podczas tworzenia.

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
          id: tag1.id, // Ustanawia powiązanie z istniejącym powiązanym obiektem
        },
        {
          name: 'tag2',
        },
      ],
    },
  ],
});
```

### Aktualizacja

#### Podstawowa aktualizacja

Po uzyskaniu obiektu danych mogą Państwo bezpośrednio modyfikować jego właściwości na obiekcie danych (`Model`), a następnie wywołać metodę `save`, aby zapisać zmiany.

```javascript
const user = await userRepository.findOne({
  filter: {
    name: '张三',
  },
});

user.age = 20;
await user.save();
```

Obiekt danych `Model` dziedziczy po modelu Sequelize. Więcej informacji na temat operacji na `Model` znajdą Państwo w [Modelu Sequelize](https://sequelize.org/master/manual/model-basics.html).

Mogą Państwo również aktualizować dane za pośrednictwem `Repository`:

```javascript
// Aktualizuje rekordy danych spełniające kryteria filtrowania
await userRepository.update({
  filter: {
    name: '张三',
  },
  values: {
    age: 20,
  },
});
```

Podczas aktualizacji mogą Państwo kontrolować, które pola są aktualizowane za pomocą parametrów `whitelist` i `blacklist`, na przykład:

```javascript
await userRepository.update({
  filter: {
    name: '张三',
  },
  values: {
    age: 20,
    name: '李四',
  },
  whitelist: ['age'], // Aktualizuje tylko pole age
});
```

#### Aktualizacja pól powiązanych

Podczas aktualizacji mogą Państwo ustawiać powiązane obiekty, na przykład:

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
        id: tag1.id, // Ustanawia powiązanie z tag1
      },
      {
        name: 'tag2', // Tworzy nowy tag i ustanawia powiązanie
      },
    ],
  },
});

await postRepository.update({
  filter: {
    id: 1,
  },
  values: {
    tags: null, // Usuwa powiązanie postu z tagami
  },
});
```

### Usuwanie

Mogą Państwo wywołać metodę `destroy()` w `Repository`, aby wykonać operację usuwania. Podczas usuwania należy określić kryteria filtrowania:

```javascript
await userRepository.destroy({
  filter: {
    status: 'blocked',
  },
});
```

## Konstruktor

Zazwyczaj nie jest wywoływany bezpośrednio przez deweloperów. Jest on głównie instancjonowany po zarejestrowaniu typu za pomocą `db.registerRepositories()` i określeniu odpowiedniego zarejestrowanego typu repozytorium w parametrach `db.collection()`.

**Sygnatura**

- `constructor(collection: Collection)`

**Przykład**

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
  // tutaj odwołanie do zarejestrowanego repozytorium
  repository: 'books',
});

await db.sync();

const books = db.getRepository('books') as MyRepository;
await books.myQuery('SELECT * FROM books;');
```

## Składowe instancji

### `database`

Instancja zarządzania bazą danych kontekstu.

### `collection`

Odpowiednia instancja zarządzania kolekcją.

### `model`

Odpowiednia klasa modelu.

## Metody instancji

### `find()`

Pobiera zestaw danych z bazy danych, umożliwiając określenie warunków filtrowania, sortowania itp.

**Sygnatura**

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

**Szczegóły**

#### `filter: Filter`

Warunek zapytania używany do filtrowania wyników danych. W przekazanych parametrach zapytania, `key` to nazwa pola do zapytania, a `value` może być wartością do zapytania lub użyte z operatorami do filtrowania danych według innych warunków.

```typescript
// Wyszukuje rekordy, gdzie name to 'foo' i age jest większe niż 18
repository.find({
  filter: {
    name: 'foo',
    age: {
      $gt: 18,
    },
  },
});
```

Więcej operatorów znajdą Państwo w [Operatorach zapytań](./operators.md).

#### `filterByTk: TargetKey`

Pobiera dane za pomocą `TargetKey`, co jest wygodną metodą dla parametru `filter`. Konkretne pole dla `TargetKey` można [skonfigurować](./collection.md#filtertargetkey) w `Collection`, domyślnie jest to `primaryKey`.

```typescript
// Domyślnie wyszukuje rekord z id = 1
repository.find({
  filterByTk: 1,
});
```

#### `fields: string[]`

Kolumny zapytania, używane do kontrolowania wyników pól danych. Po przekazaniu tego parametru, zwrócone zostaną tylko określone pola.

#### `except: string[]`

Wykluczone kolumny, używane do kontrolowania wyników pól danych. Po przekazaniu tego parametru, przekazane pola nie zostaną zwrócone.

#### `appends: string[]`

Dołączone kolumny, używane do ładowania powiązanych danych. Po przekazaniu tego parametru, określone pola powiązane również zostaną zwrócone.

#### `sort: string[] | string`

Określa metodę sortowania wyników zapytania. Parametr to nazwa pola, która domyślnie sortuje w kolejności rosnącej (`asc`). Dla kolejności malejącej (`desc`) należy dodać symbol `-` przed nazwą pola, np. `['-id', 'name']`, co oznacza sortowanie według `id malejąco, name rosnąco`.

#### `limit: number`

Ogranicza liczbę wyników, tak samo jak `limit` w `SQL`.

#### `offset: number`

Przesunięcie zapytania, tak samo jak `offset` w `SQL`.

**Przykład**

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

Pobiera pojedynczy rekord danych z bazy danych spełniający określone kryteria. Odpowiednik `Model.findOne()` w Sequelize.

**Sygnatura**

- `async findOne(options?: FindOneOptions): Promise<Model | null>`

<embed src="./shared/find-one.md"></embed>

**Przykład**

```ts
const posts = db.getRepository('posts');

const result = await posts.findOne({
  filterByTk: 1,
});
```

### `count()`

Pobiera całkowitą liczbę rekordów danych spełniających określone kryteria z bazy danych. Odpowiednik `Model.count()` w Sequelize.

**Sygnatura**

- `count(options?: CountOptions): Promise<number>`

**Typ**

```typescript
interface CountOptions
  extends Omit<SequelizeCountOptions, 'distinct' | 'where' | 'include'>,
    Transactionable {
  filter?: Filter;
}
```

**Przykład**

```ts
const books = db.getRepository('books');

const count = await books.count({
  filter: {
    title: '三字经',
  },
});
```

### `findAndCount()`

Pobiera zestaw danych i całkowitą liczbę wyników spełniających określone kryteria z bazy danych. Odpowiednik `Model.findAndCountAll()` w Sequelize.

**Sygnatura**

- `async findAndCount(options?: FindAndCountOptions): Promise<[Model[], number]>`

**Typ**

```typescript
type FindAndCountOptions = Omit<
  SequelizeAndCountOptions,
  'where' | 'include' | 'order'
> &
  CommonFindOptions;
```

**Szczegóły**

Parametry zapytania są takie same jak w `find()`. Wartość zwracana to tablica, gdzie pierwszy element to wynik zapytania, a drugi to całkowita liczba wyników.

### `create()`

Wstawia nowy rekord do kolekcji. Odpowiednik `Model.create()` w Sequelize. Gdy tworzony obiekt danych zawiera informacje o polach relacji, odpowiednie rekordy danych relacji zostaną również utworzone lub zaktualizowane.

**Sygnatura**

- `async create<M extends Model>(options: CreateOptions): Promise<M>`

<embed src="./shared/create-options.md"></embed>

**Przykład**

```ts
const posts = db.getRepository('posts');

const result = await posts.create({
  values: {
    title: 'NocoBase 1.0 发布日志',
    tags: [
      // Gdy istnieje wartość klucza głównego tabeli powiązań, aktualizuje dane
      { id: 1 },
      // Gdy nie ma wartości klucza głównego, tworzy nowe dane
      { name: 'NocoBase' },
    ],
  },
});
```

### `createMany()`

Wstawia wiele nowych rekordów do kolekcji. Odpowiednik wielokrotnego wywołania metody `create()`.

**Sygnatura**

- `createMany(options: CreateManyOptions): Promise<Model[]>`

**Typ**

```typescript
interface CreateManyOptions extends BulkCreateOptions {
  records: Values[];
}
```

**Szczegóły**

- `records`: Tablica obiektów danych dla rekordów do utworzenia.
- `transaction`: Obiekt transakcji. Jeśli parametr transakcji nie zostanie przekazany, metoda automatycznie utworzy wewnętrzną transakcję.

**Przykład**

```ts
const posts = db.getRepository('posts');

const results = await posts.createMany({
  records: [
    {
      title: 'NocoBase 1.0 发布日志',
      tags: [
        // Gdy istnieje wartość klucza głównego tabeli powiązań, aktualizuje dane
        { id: 1 },
        // Gdy nie ma wartości klucza głównego, tworzy nowe dane
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

Aktualizuje dane w kolekcji. Odpowiednik `Model.update()` w Sequelize. Gdy aktualizowany obiekt danych zawiera informacje o polach relacji, odpowiednie rekordy danych relacji zostaną również utworzone lub zaktualizowane.

**Sygnatura**

- `async update<M extends Model>(options: UpdateOptions): Promise<M>`

<embed src="./shared/update-options.md"></embed>

**Przykład**

```ts
const posts = db.getRepository('posts');

const result = await posts.update({
  filterByTk: 1,
  values: {
    title: 'NocoBase 1.0 发布日志',
    tags: [
      // Gdy istnieje wartość klucza głównego tabeli powiązań, aktualizuje dane
      { id: 1 },
      // Gdy nie ma wartości klucza głównego, tworzy nowe dane
      { name: 'NocoBase' },
    ],
  },
});
```

### `destroy()`

Usuwa dane z kolekcji. Odpowiednik `Model.destroy()` w Sequelize.

**Sygnatura**

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

**Szczegóły**

- `filter`: Określa warunki filtrowania dla rekordów do usunięcia. Szczegółowe użycie filtru znajdą Państwo w metodzie [`find()`](#find).
- `filterByTk`: Określa warunki filtrowania dla rekordów do usunięcia za pomocą TargetKey.
- `truncate`: Czy wyczyścić dane kolekcji, skuteczne, gdy nie przekazano parametru `filter` ani `filterByTk`.
- `transaction`: Obiekt transakcji. Jeśli parametr transakcji nie zostanie przekazany, metoda automatycznie utworzy wewnętrzną transakcję.