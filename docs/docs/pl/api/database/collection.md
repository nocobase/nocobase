:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::

# Kolekcja

## Przegląd

`Kolekcja` służy do definiowania modeli danych w systemie, takich jak nazwy modeli, pola, indeksy, powiązania i inne informacje.
Zazwyczaj wywołuje się ją za pośrednictwem metody `collection` instancji `Database` jako punkt wejścia proxy.

```javascript
const { Database } = require('@nocobase/database')

// Tworzenie instancji bazy danych
const db = new Database({...});

// Definiowanie modelu danych
db.collection({
  name: 'users',
  // Definiowanie pól modelu
  fields: [
    // Pole skalarne
    {
      name: 'name',
      type: 'string',
    },

    // Pole powiązania
    {
      name: 'profile',
      type: 'hasOne' // 'hasMany', 'belongsTo', 'belongsToMany'
    }
  ],
});
```

Więcej typów pól znajdą Państwo w [Pola](/api/database/field).

## Konstruktor

**Sygnatura**

- `constructor(options: CollectionOptions, context: CollectionContext)`

**Parametry**

| Parametr              | Typ                                                         | Wartość domyślna | Opis                                                                                   |
| --------------------- | ----------------------------------------------------------- | ------ | -------------------------------------------------------------------------------------- |
| `options.name`        | `string`                                                    | -      | Identyfikator kolekcji                                                                        |
| `options.tableName?`  | `string`                                                    | -      | Nazwa tabeli bazy danych. Jeśli nie zostanie podana, użyta zostanie wartość z `options.name`.                                           |
| `options.fields?`     | `FieldOptions[]`                                            | -      | Definicje pól. Szczegóły znajdą Państwo w [Pola](./field).                                                        |
| `options.model?`      | `string \| ModelStatic<Model>`                              | -      | Typ modelu Sequelize. Jeśli użyto `string`, nazwa modelu musi być wcześniej zarejestrowana w bazie danych. |
| `options.repository?` | `string \| RepositoryType`                                  | -      | Typ repozytorium danych. Jeśli użyto `string`, typ repozytorium musi być wcześniej zarejestrowany w bazie danych.                |
| `options.sortable?`   | `string \| boolean \| { name?: string; scopeKey?: string }` | -      | Konfiguracja pola do sortowania danych. Domyślnie brak sortowania.                                                         |
| `options.autoGenId?`  | `boolean`                                                   | `true` | Czy automatycznie generować unikalny klucz główny. Domyślnie `true`.                                                    |
| `context.database`    | `Database`                                                  | -      | Baza danych w bieżącym kontekście.                                                                 |

**Przykład**

Tworzenie kolekcji postów:

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
    // Istniejąca instancja bazy danych
    database: db,
  },
);
```

## Składowe instancji

### `options`

Początkowe parametry konfiguracji dla kolekcji. Identyczne jak parametr `options` konstruktora.

### `context`

Kontekst, do którego należy bieżąca kolekcja, obecnie głównie instancja bazy danych.

### `name`

Nazwa kolekcji.

### `db`

Instancja bazy danych, do której należy.

### `filterTargetKey`

Nazwa pola używanego jako klucz główny.

### `isThrough`

Czy jest to kolekcja pośrednia.

### `model`

Odpowiada typowi modelu Sequelize.

### `repository`

Instancja repozytorium.

## Metody konfiguracji pól

### `getField()`

Pobiera obiekt pola o odpowiadającej nazwie, zdefiniowany w kolekcji.

**Sygnatura**

- `getField(name: string): Field`

**Parametry**

| Parametr | Typ     | Wartość domyślna | Opis     |
| ------ | -------- | ------ | -------- |
| `name` | `string` | -      | Nazwa pola |

**Przykład**

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

Ustawia pole dla kolekcji.

**Sygnatura**

- `setField(name: string, options: FieldOptions): Field`

**Parametry**

| Parametr  | Typ           | Wartość domyślna | Opis                            |
| --------- | -------------- | ------ | ------------------------------- |
| `name`    | `string`       | -      | Nazwa pola                        |
| `options` | `FieldOptions` | -      | Konfiguracja pola. Szczegóły znajdą Państwo w [Pola](./field). |

**Przykład**

```ts
const posts = db.collection({ name: 'posts' });

posts.setField('title', { type: 'string' });
```

### `setFields()`

Ustawia wiele pól dla kolekcji w trybie wsadowym.

**Sygnatura**

- `setFields(fields: FieldOptions[], resetFields = true): Field[]`

**Parametry**

| Parametr      | Typ             | Wartość domyślna | Opis                            |
| ------------- | ---------------- | ------ | ------------------------------- |
| `fields`      | `FieldOptions[]` | -      | Konfiguracja pól. Szczegóły znajdą Państwo w [Pola](./field). |
| `resetFields` | `boolean`        | `true` | Czy zresetować istniejące pola.            |

**Przykład**

```ts
const posts = db.collection({ name: 'posts' });

posts.setFields([
  { type: 'string', name: 'title' },
  { type: 'double', name: 'price' },
]);
```

### `removeField()`

Usuwa obiekt pola o odpowiadającej nazwie, zdefiniowany w kolekcji.

**Sygnatura**

- `removeField(name: string): void | Field`

**Parametry**

| Parametr | Typ     | Wartość domyślna | Opis     |
| ------ | -------- | ------ | -------- |
| `name` | `string` | -      | Nazwa pola |

**Przykład**

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

Resetuje (czyści) pola kolekcji.

**Sygnatura**

- `resetFields(): void`

**Przykład**

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

Sprawdza, czy obiekt pola o odpowiadającej nazwie jest zdefiniowany w kolekcji.

**Sygnatura**

- `hasField(name: string): boolean`

**Parametry**

| Parametr | Typ     | Wartość domyślna | Opis     |
| ------ | -------- | ------ | -------- |
| `name` | `string` | -      | Nazwa pola |

**Przykład**

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

Znajduje w kolekcji obiekt pola spełniający określone kryteria.

**Sygnatura**

- `findField(predicate: (field: Field) => boolean): Field | undefined`

**Parametry**

| Parametr    | Typ                        | Wartość domyślna | Opis     |
| ----------- | --------------------------- | ------ | -------- |
| `predicate` | `(field: Field) => boolean` | -      | Kryteria wyszukiwania |

**Przykład**

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

Iteruje po obiektach pól w kolekcji.

**Sygnatura**

- `forEachField(callback: (field: Field) => void): void`

**Parametry**

| Parametr   | Typ                      | Wartość domyślna | Opis     |
| ---------- | ------------------------ | ------ | -------- |
| `callback` | `(field: Field) => void` | -      | Funkcja zwrotna |

**Przykład**

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

## Metody konfiguracji indeksów

### `addIndex()`

Dodaje indeks do kolekcji.

**Sygnatura**

- `addIndex(index: string | string[] | { fields: string[], unique?: boolean,[key: string]: any })`

**Parametry**

| Parametr | Typ                                                         | Wartość domyślna | Opis                 |
| ------- | ------------------------------------------------------------ | ------ | -------------------- |
| `index` | `string \| string[]`                                         | -      | Nazwa(y) pola(pól) do indeksowania. |
| `index` | `{ fields: string[], unique?: boolean, [key: string]: any }` | -      | Pełna konfiguracja.             |

**Przykład**

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

Usuwa indeks z kolekcji.

**Sygnatura**

- `removeIndex(fields: string[])`

**Parametry**

| Parametr | Typ        | Wartość domyślna | Opis                     |
| -------- | ---------- | ------ | ------------------------ |
| `fields` | `string[]` | -      | Kombinacja nazw pól dla indeksu do usunięcia. |

**Przykład**

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

## Metody konfiguracji kolekcji

### `remove()`

Usuwa kolekcję.

**Sygnatura**

- `remove(): void`

**Przykład**

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

## Metody operacji na bazie danych

### `sync()`

Synchronizuje definicję kolekcji z bazą danych. Oprócz domyślnej logiki `Model.sync` w Sequelize, obsługuje również kolekcje odpowiadające polom powiązań.

**Sygnatura**

- `sync(): Promise<void>`

**Przykład**

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

Sprawdza, czy kolekcja istnieje w bazie danych.

**Sygnatura**

- `existsInDb(options?: Transactionable): Promise<boolean>`

**Parametry**

| Parametr               | Typ          | Wartość domyślna | Opis     |
| ---------------------- | ------------- | ------ | -------- |
| `options?.transaction` | `Transaction` | -      | Instancja transakcji |

**Przykład**

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

**Sygnatura**

- `removeFromDb(): Promise<void>`

**Przykład**

```ts
const books = db.collection({
  name: 'books',
});

// Synchronizuj kolekcję książek z bazą danych
await db.sync();

// Usuń kolekcję książek z bazy danych
await books.removeFromDb();
```