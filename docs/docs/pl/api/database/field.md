:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::

# Pole

## Przegląd

Klasa zarządzająca polami kolekcji (klasa abstrakcyjna). Jest to również klasa bazowa dla wszystkich typów pól. Każdy inny typ pola jest implementowany poprzez dziedziczenie po tej klasie.

Informacje na temat dostosowywania pól znajdą Państwo w [Rozszerzanie typów pól].

## Konstruktor

Zazwyczaj nie jest wywoływany bezpośrednio przez deweloperów, lecz głównie poprzez metodę `db.collection({ fields: [] })` jako punkt wejścia proxy.

Rozszerzanie pola odbywa się głównie poprzez dziedziczenie po abstrakcyjnej klasie `Field`, a następnie rejestrowanie jej w instancji Database.

**Sygnatura**

- `constructor(options: FieldOptions, context: FieldContext)`

**Parametry**

| Parametr             | Typ            | Domyślne | Opis                                                              |
| :------------------- | :------------- | :------- | :---------------------------------------------------------------- |
| `options`            | `FieldOptions` | -        | Obiekt konfiguracji pola                                          |
| `options.name`       | `string`       | -        | Nazwa pola                                                        |
| `options.type`       | `string`       | -        | Typ pola, odpowiadający nazwie typu pola zarejestrowanego w `db`  |
| `context`            | `FieldContext` | -        | Obiekt kontekstu pola                                             |
| `context.database`   | `Database`     | -        | Instancja bazy danych                                             |
| `context.collection` | `Collection`   | -        | Instancja kolekcji                                                |

## Składowe instancji

### `name`

Nazwa pola.

### `type`

Typ pola.

### `dataType`

Typ przechowywania pola w bazie danych.

### `options`

Parametry konfiguracji inicjalizacji pola.

### `context`

Obiekt kontekstu pola.

## Metody konfiguracyjne

### `on()`

Skrócona metoda definiowania zdarzeń oparta na zdarzeniach kolekcji. Odpowiednik `db.on(this.collection.name + '.' + eventName, listener)`.

Zazwyczaj nie ma potrzeby nadpisywania tej metody podczas dziedziczenia.

**Sygnatura**

- `on(eventName: string, listener: (...args: any[]) => void)`

**Parametry**

| Parametr    | Typ                        | Domyślne | Opis                          |
| :---------- | :------------------------- | :------- | :---------------------------- |
| `eventName` | `string`                   | -        | Nazwa zdarzenia               |
| `listener`  | `(...args: any[]) => void` | -        | Obiekt nasłuchujący zdarzenia |

### `off()`

Skrócona metoda usuwania zdarzeń oparta na zdarzeniach kolekcji. Odpowiednik `db.off(this.collection.name + '.' + eventName, listener)`.

Zazwyczaj nie ma potrzeby nadpisywania tej metody podczas dziedziczenia.

**Sygnatura**

- `off(eventName: string, listener: (...args: any[]) => void)`

**Parametry**

| Parametr    | Typ                        | Domyślne | Opis                          |
| :---------- | :------------------------- | :------- | :---------------------------- |
| `eventName` | `string`                   | -        | Nazwa zdarzenia               |
| `listener`  | `(...args: any[]) => void` | -        | Obiekt nasłuchujący zdarzenia |

### `bind()`

Zawartość wykonywana, gdy pole jest dodawane do kolekcji. Zazwyczaj używana do dodawania obiektów nasłuchujących zdarzenia kolekcji i innych operacji.

Podczas dziedziczenia należy najpierw wywołać odpowiadającą metodę `super.bind()`.

**Sygnatura**

- `bind()`

### `unbind()`

Zawartość wykonywana, gdy pole jest usuwane z kolekcji. Zazwyczaj używana do usuwania obiektów nasłuchujących zdarzenia kolekcji i innych operacji.

Podczas dziedziczenia należy najpierw wywołać odpowiadającą metodę `super.unbind()`.

**Sygnatura**

- `unbind()`

### `get()`

Pobiera wartość elementu konfiguracji pola.

**Sygnatura**

- `get(key: string): any`

**Parametry**

| Parametr | Typ      | Domyślne | Opis                        |
| :------- | :------- | :------- | :-------------------------- |
| `key`    | `string` | -        | Nazwa elementu konfiguracji |

**Przykład**

```ts
const field = db.collection('users').getField('name');

// Pobiera wartość elementu konfiguracji nazwy pola, zwraca 'name'
console.log(field.get('name'));
```

### `merge()`

Łączy wartości elementów konfiguracji pola.

**Sygnatura**

- `merge(options: { [key: string]: any }): void`

**Parametry**

| Parametr  | Typ                      | Domyślne | Opis                                |
| :-------- | :----------------------- | :------- | :---------------------------------- |
| `options` | `{ [key: string]: any }` | -        | Obiekt elementów konfiguracji do połączenia |

**Przykład**

```ts
const field = db.collection('users').getField('name');

field.merge({
  // Dodaje konfigurację indeksu
  index: true,
});
```

### `remove()`

Usuwa pole z kolekcji (tylko z pamięci).

**Przykład**

```ts
const books = db.getCollections('books');

books.getField('isbn').remove();

// naprawdę usuwa z bazy danych
await books.sync();
```

## Metody bazy danych

### `removeFromDb()`

Usuwa pole z bazy danych.

**Sygnatura**

- `removeFromDb(options?: Transactionable): Promise<void>`

**Parametry**

| Parametr               | Typ           | Domyślne | Opis                 |
| :--------------------- | :------------ | :------- | :------------------- |
| `options.transaction?` | `Transaction` | -        | Instancja transakcji |

### `existsInDb()`

Sprawdza, czy pole istnieje w bazie danych.

**Sygnatura**

- `existsInDb(options?: Transactionable): Promise<boolean>`

**Parametry**

| Parametr               | Typ           | Domyślne | Opis                 |
| :--------------------- | :------------ | :------- | :------------------- |
| `options.transaction?` | `Transaction` | -        | Instancja transakcji |

## Lista wbudowanych typów pól

NocoBase zawiera wbudowane, często używane typy pól. Mogą Państwo bezpośrednio używać odpowiadającej nazwy typu podczas definiowania pól dla kolekcji. Różne typy pól mają różne konfiguracje parametrów, szczegóły znajdą Państwo na poniższej liście.

Wszystkie elementy konfiguracji dla typów pól, z wyjątkiem tych dodatkowo opisanych poniżej, są przekazywane do Sequelize. Oznacza to, że wszystkie obsługiwane przez Sequelize elementy konfiguracji pól (takie jak `allowNull`, `defaultValue` itp.) mogą być tutaj używane.

Ponadto, typy pól po stronie serwera rozwiązują głównie problemy związane z przechowywaniem danych w bazie danych i niektórymi algorytmami, i są zasadniczo niezwiązane z typami wyświetlania pól i używanymi komponentami po stronie front-endu. Informacje o typach pól front-endowych znajdą Państwo w odpowiednich instrukcjach samouczka.

### `'boolean'`

Typ wartości logicznej.

**Przykład**

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

Typ liczby całkowitej (32-bitowej).

**Przykład**

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

Typ dużej liczby całkowitej (64-bitowej).

**Przykład**

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

Typ liczby zmiennoprzecinkowej podwójnej precyzji (64-bitowej).

**Przykład**

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

Typ liczby rzeczywistej (tylko dla PG).

### `'decimal'`

Typ liczby dziesiętnej.

### `'string'`

Typ ciągu znaków. Odpowiednik typu `VARCHAR` w większości baz danych.

**Przykład**

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

Typ tekstowy. Odpowiednik typu `TEXT` w większości baz danych.

**Przykład**

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

Typ hasła (rozszerzenie NocoBase). Szyfruje hasła w oparciu o metodę `scrypt` z natywnego pakietu `crypto` Node.js.

**Przykład**

```ts
db.collection({
  name: 'users',
  fields: [
    {
      type: 'password',
      name: 'password',
      length: 64, // Długość, domyślnie 64
      randomBytesSize: 8, // Długość losowych bajtów, domyślnie 8
    },
  ],
});
```

**Parametry**

| Parametr          | Typ      | Domyślne | Opis                    |
| :---------------- | :------- | :------- | :---------------------- |
| `length`          | `number` | 64       | Długość znaku           |
| `randomBytesSize` | `number` | 8        | Rozmiar losowych bajtów |

### `'date'`

Typ daty.

### `'time'`

Typ czasu.

### `'array'`

Typ tablicowy (tylko dla PG).

### `'json'`

Typ JSON.

### `'jsonb'`

Typ JSONB (tylko dla PG, inne będą kompatybilne jako typ `'json'`).

### `'uuid'`

Typ UUID.

### `'uid'`

Typ UID (rozszerzenie NocoBase). Krótki, losowy identyfikator ciągu znaków.

### `'formula'`

Typ formuły (rozszerzenie NocoBase). Umożliwia konfigurowanie obliczeń formuł matematycznych opartych na [mathjs](https://www.npmjs.com/package/mathjs). Formuła może odwoływać się do wartości innych kolumn w tym samym rekordzie w celu obliczeń.

**Przykład**

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

Typ pola wyboru (rozszerzenie NocoBase). Co najwyżej jeden wiersz danych w całej kolekcji może mieć wartość tego pola ustawioną na `true`; wszystkie inne będą miały wartość `false` lub `null`.

**Przykład**

W całym systemie jest tylko jeden użytkownik oznaczony jako `root`. Po zmianie wartości `root` dowolnego innego użytkownika na `true`, wszystkie inne rekordy z `root` ustawionym na `true` zostaną zmienione na `false`:

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

Typ sortowania (rozszerzenie NocoBase). Sortuje na podstawie liczb całkowitych, automatycznie generuje nowy numer sekwencyjny dla nowych rekordów i zmienia kolejność numerów sekwencyjnych podczas przenoszenia danych.

Jeśli kolekcja definiuje opcję `sortable`, automatycznie zostanie wygenerowane również odpowiadające pole.

**Przykład**

Posty mogą być sortowane na podstawie użytkownika, do którego należą:

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
      scopeKey: 'userId', // Sortuje dane pogrupowane według tej samej wartości userId
    },
  ],
});
```

### `'virtual'`

Typ wirtualny. Nie przechowuje faktycznie danych, używany jest wyłącznie do definiowania specjalnych getterów/setterów.

### `'belongsTo'`

Typ skojarzenia wiele-do-jednego. Klucz obcy jest przechowywany w jego własnej tabeli, w przeciwieństwie do `hasOne`/`hasMany`.

**Przykład**

Każdy post należy do autora:

```ts
db.collection({
  name: 'posts',
  fields: [
    {
      type: 'belongsTo',
      name: 'author',
      target: 'users', // Jeśli nie skonfigurowano, domyślnie jest to nazwa kolekcji w liczbie mnogiej
      foreignKey: 'authorId', // Jeśli nie skonfigurowano, domyślnie jest to format <name> + Id
      sourceKey: 'id', // Jeśli nie skonfigurowano, domyślnie jest to id kolekcji docelowej
    },
  ],
});
```

### `'hasOne'`

Typ skojarzenia jeden-do-jednego. Klucz obcy jest przechowywany w powiązanej kolekcji, w przeciwieństwie do `belongsTo`.

**Przykład**

Każdy użytkownik ma profil:

```ts
db.collection({
  name: 'users',
  fields: [
    {
      type: 'hasOne',
      name: 'profile',
      target: 'profiles', // Można pominąć
    },
  ],
});
```

### `'hasMany'`

Typ skojarzenia jeden-do-wielu. Klucz obcy jest przechowywany w powiązanej kolekcji, w przeciwieństwie do `belongsTo`.

**Przykład**

Każdy użytkownik może mieć wiele postów:

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

Typ skojarzenia wiele-do-wielu. Używa kolekcji pośredniczącej do przechowywania kluczy obcych obu stron. Jeśli istniejąca kolekcja nie zostanie określona jako kolekcja pośrednicząca, zostanie ona automatycznie utworzona.

**Przykład**

Każdy post może mieć wiele tagów, a każdy tag może być dodany do wielu postów:

```ts
db.collection({
  name: 'posts',
  fields: [
    {
      type: 'belongsToMany',
      name: 'tags',
      target: 'tags', // Można pominąć, jeśli nazwa jest taka sama
      through: 'postsTags', // Kolekcja pośrednicząca zostanie automatycznie wygenerowana, jeśli nie zostanie skonfigurowana
      foreignKey: 'postId', // Klucz obcy kolekcji źródłowej w kolekcji pośredniczącej
      sourceKey: 'id', // Klucz podstawowy kolekcji źródłowej
      otherKey: 'tagId', // Klucz obcy kolekcji docelowej w kolekcji pośredniczącej
    },
  ],
});

db.collection({
  name: 'tags',
  fields: [
    {
      type: 'belongsToMany',
      name: 'posts',
      through: 'postsTags', // Ta sama grupa relacji wskazuje na tę samą kolekcję pośredniczącą
    },
  ],
});
```