:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::

# Baza danych

## Przegląd

Baza danych to narzędzie do interakcji z bazami danych oferowane przez NocoBase, które zapewnia niezwykle wygodne funkcje interakcji z bazą danych dla aplikacji no-code i low-code. Obecnie obsługiwane bazy danych to:

- SQLite 3.8.8+
- MySQL 8.0.17+
- PostgreSQL 10.0+

### Łączenie z bazą danych

W konstruktorze `Database` mogą Państwo skonfigurować połączenie z bazą danych, przekazując parametr `options`.

```javascript
const { Database } = require('@nocobase/database');

// Parametry konfiguracji bazy danych SQLite
const database = new Database({
  dialect: 'mysql',
  host: 'localhost',
  port: 3306,
  database: 'nocobase',
  username: 'root',
  password: 'password'
})

// Parametry konfiguracji bazy danych MySQL \ PostgreSQL
const database = new Database({
  dialect: /* 'postgres' lub 'mysql' */,
  database: 'database',
  username: 'username',
  password: 'password',
  host: 'localhost',
  port: 'port'
})

```

Szczegółowe parametry konfiguracji znajdą Państwo w sekcji [Konstruktor](#constructor).

### Definicja modelu danych

`Database` definiuje strukturę bazy danych za pomocą `kolekcji`. Obiekt `kolekcja` reprezentuje tabelę w bazie danych.

```javascript
// Definiowanie kolekcji
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

Po zdefiniowaniu struktury bazy danych mogą Państwo użyć metody `sync()` do jej synchronizacji.

```javascript
await database.sync();
```

Bardziej szczegółowe informacje na temat użycia `kolekcji` znajdą Państwo w sekcji [Kolekcja](/api/database/collection).

### Odczyt i zapis danych

`Database` operuje na danych za pośrednictwem `Repository`.

```javascript
const UserRepository = UserCollection.repository();

// Tworzenie
await UserRepository.create({
  name: 'Jan',
  age: 18,
});

// Zapytanie
const user = await UserRepository.findOne({
  filter: {
    name: 'Jan',
  },
});

// Modyfikacja
await UserRepository.update({
  values: {
    age: 20,
  },
});

// Usuwanie
await UserRepository.destroy(user.id);
```

Bardziej szczegółowe informacje na temat operacji CRUD na danych znajdą Państwo w sekcji [Repository](/api/database/repository).

## Konstruktor

**Sygnatura**

- `constructor(options: DatabaseOptions)`

Tworzy instancję bazy danych.

**Parametry**

| Parametr                 | Typ           | Wartość domyślna | Opis                                                                                                                |
| ---------------------- | -------------- | ------------- | ------------------------------------------------------------------------------------------------------------------- |
| `options.host`         | `string`       | `'localhost'` | Host bazy danych                                                                                                          |
| `options.port`         | `number`       | -             | Port usługi bazy danych, z domyślnym portem odpowiadającym używanej bazie danych                                       |
| `options.username`     | `string`       | -             | Nazwa użytkownika bazy danych                                                                                                        |
| `options.password`     | `string`       | -             | Hasło bazy danych                                                                                                          |
| `options.database`     | `string`       | -             | Nazwa bazy danych                                                                                                          |
| `options.dialect`      | `string`       | `'mysql'`     | Typ bazy danych                                                                                                          |
| `options.storage?`     | `string`       | `':memory:'`  | Tryb przechowywania danych dla SQLite                                                                                                   |
| `options.logging?`     | `boolean`      | `false`       | Czy włączyć logowanie                                                                                                        |
| `options.define?`      | `Object`       | `{}`          | Domyślne parametry definicji tabeli                                                                                                    |
| `options.tablePrefix?` | `string`       | `''`          | Rozszerzenie NocoBase, prefiks nazwy tabeli                                                                                             |
| `options.migrator?`    | `UmzugOptions` | `{}`          | Rozszerzenie NocoBase, parametry związane z menedżerem migracji, proszę zapoznać się z implementacją [Umzug](https://github.com/sequelize/umzug/blob/main/src/types.ts#L15) |

## Metody związane z migracjami

### `addMigration()`

Dodaje pojedynczy plik migracji.

**Sygnatura**

- `addMigration(options: MigrationItem)`

**Parametry**

| Parametr               | Typ               | Wartość domyślna | Opis                                     |
| -------------------- | ------------------ | ------ | ---------------------------------------- |
| `options.name`       | `string`           | -      | Nazwa pliku migracji                     |
| `options.context?`   | `string`           | -      | Kontekst pliku migracji                  |
| `options.migration?` | `typeof Migration` | -      | Niestandardowa klasa dla pliku migracji |
| `options.up`         | `Function`         | -      | Metoda `up` pliku migracji               |
| `options.down`       | `Function`         | -      | Metoda `down` pliku migracji             |

**Przykład**

```ts
db.addMigration({
  name: '20220916120411-test-1',
  async up() {
    const queryInterface = this.context.db.sequelize.getQueryInterface();
    await queryInterface.query(/* Państwa zapytania SQL migracji */);
  },
});
```

### `addMigrations()`

Dodaje pliki migracji z określonego katalogu.

**Sygnatura**

- `addMigrations(options: AddMigrationsOptions): void`

**Parametry**

| Parametr               | Typ       | Wartość domyślna | Opis                                |
| -------------------- | ---------- | -------------- | ----------------------------------- |
| `options.directory`  | `string`   | `''`           | Katalog, w którym znajdują się pliki migracji |
| `options.extensions` | `string[]` | `['js', 'ts']` | Rozszerzenia plików                 |
| `options.namespace?` | `string`   | `''`           | Przestrzeń nazw                     |
| `options.context?`   | `Object`   | `{ db }`       | Kontekst pliku migracji             |

**Przykład**

```ts
db.addMigrations({
  directory: path.resolve(__dirname, './migrations'),
  namespace: 'test',
});
```

## Metody pomocnicze

### `inDialect()`

Sprawdza, czy bieżący typ bazy danych jest jednym z określonych typów.

**Sygnatura**

- `inDialect(dialect: string[]): boolean`

**Parametry**

| Parametr    | Typ       | Wartość domyślna | Opis                                             |
| --------- | ---------- | ------ | ------------------------------------------------ |
| `dialect` | `string[]` | -      | Typ bazy danych, możliwe wartości to `mysql`/`postgres`/`mariadb` |

### `getTablePrefix()`

Pobiera prefiks nazwy tabeli z konfiguracji.

**Sygnatura**

- `getTablePrefix(): string`

## Konfiguracja kolekcji

### `collection()`

Definiuje kolekcję. To wywołanie jest podobne do metody `define` w Sequelize, tworząc strukturę tabeli tylko w pamięci. Aby utrwalić ją w bazie danych, należy wywołać metodę `sync`.

**Sygnatura**

- `collection(options: CollectionOptions): Collection`

**Parametry**

Wszystkie parametry konfiguracji `options` są zgodne z konstruktorem klasy `kolekcja`, proszę zapoznać się z sekcją [Kolekcja](/api/database/collection#constructor).

**Zdarzenia**

- `'beforeDefineCollection'`: Wywoływane przed zdefiniowaniem kolekcji.
- `'afterDefineCollection'`: Wywoływane po zdefiniowaniu kolekcji.

**Przykład**

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

// synchronizuje kolekcję jako tabelę z bazą danych
await db.sync();
```

### `getCollection()`

Pobiera zdefiniowaną kolekcję.

**Sygnatura**

- `getCollection(name: string): Collection`

**Parametry**

| Parametr | Typ     | Wartość domyślna | Opis          |
| ------ | -------- | ------ | ------------- |
| `name` | `string` | -      | Nazwa kolekcji |

**Przykład**

```ts
const collection = db.getCollection('books');
```

### `hasCollection()`

Sprawdza, czy określona kolekcja została zdefiniowana.

**Sygnatura**

- `hasCollection(name: string): boolean`

**Parametry**

| Parametr | Typ     | Wartość domyślna | Opis          |
| ------ | -------- | ------ | ------------- |
| `name` | `string` | -      | Nazwa kolekcji |

**Przykład**

```ts
db.collection({ name: 'books' });

db.hasCollection('books'); // true

db.hasCollection('authors'); // false
```

### `removeCollection()`

Usuwa zdefiniowaną kolekcję. Jest ona usuwana tylko z pamięci; aby utrwalić zmianę, należy wywołać metodę `sync`.

**Sygnatura**

- `removeCollection(name: string): void`

**Parametry**

| Parametr | Typ     | Wartość domyślna | Opis          |
| ------ | -------- | ------ | ------------- |
| `name` | `string` | -      | Nazwa kolekcji |

**Zdarzenia**

- `'beforeRemoveCollection'`: Wywoływane przed usunięciem kolekcji.
- `'afterRemoveCollection'`: Wywoływane po usunięciu kolekcji.

**Przykład**

```ts
db.collection({ name: 'books' });

db.removeCollection('books');
```

### `import()`

Importuje wszystkie pliki z katalogu jako konfiguracje kolekcji do pamięci.

**Sygnatura**

- `async import(options: { directory: string; extensions?: ImportFileExtension[] }): Promise<Map<string, Collection>>`

**Parametry**

| Parametr               | Typ       | Wartość domyślna | Opis                                |
| -------------------- | ---------- | -------------- | ----------------------------------- |
| `options.directory`  | `string`   | -              | Ścieżka do katalogu do zaimportowania |
| `options.extensions` | `string[]` | `['ts', 'js']` | Skanuj w poszukiwaniu określonych rozszerzeń |

**Przykład**

kolekcja zdefiniowana w pliku `./collections/books.ts` wygląda następująco:

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

Importowanie odpowiedniej konfiguracji podczas ładowania wtyczki:

```ts
class Plugin {
  async load() {
    await this.app.db.import({
      directory: path.resolve(__dirname, './collections'),
    });
  }
}
```

## Rejestracja i pobieranie rozszerzeń

### `registerFieldTypes()`

Rejestruje niestandardowe typy pól.

**Sygnatura**

- `registerFieldTypes(fieldTypes: MapOf<typeof Field>): void`

**Parametry**

`fieldTypes` to para klucz-wartość, gdzie kluczem jest nazwa typu pola, a wartością jest klasa typu pola.

**Przykład**

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

Rejestruje niestandardowe klasy modeli danych.

**Sygnatura**

- `registerModels(models: MapOf<ModelStatic<any>>): void`

**Parametry**

`models` to para klucz-wartość, gdzie kluczem jest nazwa modelu danych, a wartością jest klasa modelu danych.

**Przykład**

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

Rejestruje niestandardowe klasy repozytoriów danych.

**Sygnatura**

- `registerRepositories(repositories: MapOf<RepositoryType>): void`

**Parametry**

`repositories` to para klucz-wartość, gdzie kluczem jest nazwa repozytorium danych, a wartością jest klasa repozytorium danych.

**Przykład**

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

Rejestruje niestandardowe operatory zapytań danych.

**Sygnatura**

- `registerOperators(operators: MapOf<OperatorFunc>)`

**Parametry**

`operators` to para klucz-wartość, gdzie kluczem jest nazwa operatora, a wartością jest funkcja generująca instrukcję porównania operatora.

**Przykład**

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
      // zarejestrowany operator
      $dateOn: '2020-01-01',
    },
  },
});
```

### `getModel()`

Pobiera zdefiniowaną klasę modelu danych. Jeśli wcześniej nie zarejestrowano niestandardowej klasy modelu, zostanie zwrócona domyślna klasa modelu Sequelize. Domyślna nazwa jest taka sama jak nazwa zdefiniowanej kolekcji.

**Sygnatura**

- `getModel(name: string): Model`

**Parametry**

| Parametr | Typ     | Wartość domyślna | Opis                         |
| ------ | -------- | ------ | ---------------------------- |
| `name` | `string` | -      | Nazwa zarejestrowanego modelu |

**Przykład**

```ts
db.registerModels({
  books: class MyModel extends Model {},
});

const ModelClass = db.getModel('books');

console.log(ModelClass.prototype instanceof MyModel); // true
```

Uwaga: Klasa modelu uzyskana z kolekcji nie jest ściśle równa zarejestrowanej klasie modelu, lecz dziedziczy po niej. Ponieważ właściwości klasy modelu Sequelize są modyfikowane podczas inicjalizacji, NocoBase automatycznie obsługuje tę relację dziedziczenia. Poza nierównością klas, wszystkie inne definicje mogą być używane normalnie.

### `getRepository()`

Pobiera niestandardową klasę repozytorium danych. Jeśli wcześniej nie zarejestrowano niestandardowej klasy repozytorium danych, zostanie zwrócona domyślna klasa repozytorium danych NocoBase. Domyślna nazwa jest taka sama jak nazwa zdefiniowanej kolekcji.

Klasy repozytoriów danych są używane głównie do operacji CRUD opartych na modelach danych, proszę zapoznać się z sekcją [Repository](/api/database/repository).

**Sygnatura**

- `getRepository(name: string): Repository`
- `getRepository(name: string, relationId?: string | number): Repository`

**Parametry**

| Parametr       | Typ                 | Wartość domyślna | Opis                                |
| ------------ | -------------------- | ------ | ----------------------------------- |
| `name`       | `string`             | -      | Nazwa zarejestrowanego repozytorium danych |
| `relationId` | `string` \| `number` | -      | Wartość klucza obcego dla danych relacyjnych   |

Gdy nazwa ma postać nazwy powiązanej, np. `'tables.relations'`, zostanie zwrócona powiązana klasa repozytorium danych. Jeśli podano drugi parametr, repozytorium danych będzie używane (zapytania, modyfikacje itp.) w oparciu o wartość klucza obcego danych relacyjnych.

**Przykład**

Załóżmy, że istnieją dwie kolekcje: *posty* i *autorzy*, a kolekcja postów posiada klucz obcy wskazujący na kolekcję autorów:

```ts
const AuthorsRepo = db.getRepository('authors');
const author1 = AuthorsRepo.create({ name: 'author1' });

const PostsRepo = db.getRepository('authors.posts', author1.id);
const post1 = AuthorsRepo.create({ title: 'post1' });
asset(post1.authorId === author1.id); // true
```

## Zdarzenia bazy danych

### `on()`

Nasłuchuje zdarzeń bazy danych.

**Sygnatura**

- `on(event: string, listener: (...args: any[]) => void | Promise<void>): void`

**Parametry**

| Parametr | Typ      | Wartość domyślna | Opis            |
| -------- | -------- | ------ | --------------- |
| event    | string   | -      | Nazwa zdarzenia |
| listener | Function | -      | Słuchacz zdarzeń |

Nazwy zdarzeń domyślnie obsługują zdarzenia modelu Sequelize. W przypadku zdarzeń globalnych nasłuchujemy ich, używając formatu `<sequelize_model_global_event>`, a w przypadku zdarzeń pojedynczego modelu, używając formatu `<model_name>.<sequelize_model_event>`.

Opisy parametrów i szczegółowe przykłady wszystkich wbudowanych typów zdarzeń znajdą Państwo w sekcji [Wbudowane zdarzenia](#wbudowane-zdarzenia).

### `off()`

Usuwa funkcję nasłuchującą zdarzeń.

**Sygnatura**

- `off(name: string, listener: Function)`

**Parametry**

| Parametr | Typ      | Wartość domyślna | Opis            |
| -------- | -------- | ------ | --------------- |
| name     | string   | -      | Nazwa zdarzenia |
| listener | Function | -      | Słuchacz zdarzeń |

**Przykład**

```ts
const listener = async (model, options) => {
  console.log(model);
};

db.on('afterCreate', listener);

db.off('afterCreate', listener);
```

## Operacje na bazie danych

### `auth()`

Uwierzytelnianie połączenia z bazą danych. Może być używane do upewnienia się, że aplikacja nawiązała połączenie z danymi.

**Sygnatura**

- `auth(options: QueryOptions & { retry?: number } = {}): Promise<boolean>`

**Parametry**

| Parametr                 | Typ                  | Wartość domyślna | Opis                        |
| ---------------------- | --------------------- | ------- | --------------------------- |
| `options?`             | `Object`              | -       | Opcje uwierzytelniania      |
| `options.retry?`       | `number`              | `10`    | Liczba ponownych prób w przypadku niepowodzenia uwierzytelniania |
| `options.transaction?` | `Transaction`         | -       | Obiekt transakcji           |
| `options.logging?`     | `boolean \| Function` | `false` | Czy drukować logi           |

**Przykład**

```ts
await db.auth();
```

### `reconnect()`

Ponownie łączy się z bazą danych.

**Przykład**

```ts
await db.reconnect();
```

### `closed()`

Sprawdza, czy połączenie z bazą danych zostało zamknięte.

**Sygnatura**

- `closed(): boolean`

### `close()`

Zamyka połączenie z bazą danych. Odpowiednik `sequelize.close()`.

### `sync()`

Synchronizuje strukturę kolekcji bazy danych. Odpowiednik `sequelize.sync()`, parametry znajdą Państwo w [dokumentacji Sequelize](https://sequelize.org/api/v6/class/src/sequelize.js~sequelize#instance-method-sync).

### `clean()`

Czyści bazę danych, usuwając wszystkie kolekcje.

**Sygnatura**

- `clean(options: CleanOptions): Promise<void>`

**Parametry**

| Parametr                | Typ           | Wartość domyślna | Opis                        |
| --------------------- | ------------- | ------- | --------------------------- |
| `options.drop`        | `boolean`     | `false` | Czy usunąć wszystkie kolekcje |
| `options.skip`        | `string[]`    | -       | Konfiguracja nazw kolekcji do pominięcia |
| `options.transaction` | `Transaction` | -       | Obiekt transakcji           |

**Przykład**

Usuwa wszystkie kolekcje z wyjątkiem kolekcji `users`.

```ts
await db.clean({
  drop: true,
  skip: ['users'],
});
```

## Eksporty na poziomie pakietu

### `defineCollection()`

Tworzy zawartość konfiguracji kolekcji.

**Sygnatura**

- `defineCollection(name: string, config: CollectionOptions): CollectionOptions`

**Parametry**

| Parametr              | Typ                | Wartość domyślna | Opis                                |
| ------------------- | ------------------- | ------ | ----------------------------------- |
| `collectionOptions` | `CollectionOptions` | -      | Takie same jak wszystkie parametry `db.collection()` |

**Przykład**

Dla pliku konfiguracyjnego kolekcji, który ma zostać zaimportowany przez `db.import()`:

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

Rozszerza zawartość konfiguracji struktury kolekcji już znajdującej się w pamięci, głównie dla zawartości plików importowanych metodą `import()`. Ta metoda jest metodą najwyższego poziomu eksportowaną przez pakiet `@nocobase/database` i nie jest wywoływana przez instancję `db`. Można również użyć aliasu `extend`.

**Sygnatura**

- `extendCollection(collectionOptions: CollectionOptions, mergeOptions?: MergeOptions): ExtendedCollectionOptions`

**Parametry**

| Parametr              | Typ                | Wartość domyślna | Opis                                                           |
| ------------------- | ------------------- | ------ | -------------------------------------------------------------- |
| `collectionOptions` | `CollectionOptions` | -      | Takie same jak wszystkie parametry `db.collection()` |
| `mergeOptions?`     | `MergeOptions`      | -      | Parametry dla pakietu npm [deepmerge](https://npmjs.com/package/deepmerge) |

**Przykład**

Oryginalna definicja kolekcji książek (books.ts):

```ts
export default {
  name: 'books',
  fields: [{ name: 'title', type: 'string' }],
};
```

Rozszerzona definicja kolekcji książek (books.extend.ts):

```ts
import { extend } from '@nocobase/database';

// ponownie rozszerz
export default extend({
  name: 'books',
  fields: [{ name: 'price', type: 'number' }],
});
```

Jeśli powyższe dwa pliki zostaną zaimportowane podczas wywołania `import()`, a następnie ponownie rozszerzone za pomocą `extend()`, kolekcja książek będzie posiadała pola `title` i `price`.

Ta metoda jest bardzo przydatna do rozszerzania struktur kolekcji już zdefiniowanych przez istniejące wtyczki.

## Wbudowane zdarzenia

Baza danych wywołuje następujące zdarzenia w odpowiednich fazach swojego cyklu życia. Subskrybowanie ich za pomocą metody `on()` pozwala na specyficzne przetwarzanie, które może zaspokoić pewne potrzeby biznesowe.

### `'beforeSync'` / `'afterSync'`

Wywoływane przed i po synchronizacji nowej konfiguracji struktury kolekcji (pól, indeksów itp.) z bazą danych. Zazwyczaj jest wywoływane podczas wykonywania `collection.sync()` (wywołanie wewnętrzne) i jest ogólnie używane do obsługi logiki dla specjalnych rozszerzeń pól.

**Sygnatura**

```ts
on(eventName: `${string}.beforeSync` | 'beforeSync' | `${string}.afterSync` | 'afterSync', listener: SyncListener): this
```

**Typ**

```ts
import type { SyncOptions, HookReturn } from 'sequelize/types';

type SyncListener = (options?: SyncOptions) => HookReturn;
```

**Przykład**

```ts
const users = db.collection({
  name: 'users',
  fields: [{ type: 'string', name: 'username' }],
});

db.on('beforeSync', async (options) => {
  // wykonaj coś
});

db.on('users.afterSync', async (options) => {
  // wykonaj coś
});

await users.sync();
```

### `'beforeValidate'` / `'afterValidate'`

Przed utworzeniem lub aktualizacją danych następuje proces walidacji danych oparty na regułach zdefiniowanych w kolekcji. Odpowiednie zdarzenia są wywoływane przed i po walidacji. Jest to wywoływane podczas wywołania `repository.create()` lub `repository.update()`.

**Sygnatura**

```ts
on(eventName: `${string}.beforeValidate` | 'beforeValidate' | `${string}.afterValidate` | 'afterValidate', listener: ValidateListener): this
```

**Typ**

```ts
import type { ValidationOptions } from 'sequelize/types/lib/instance-validator';
import type { HookReturn } from 'sequelize/types';
import type { Model } from '@nocobase/database';

type ValidateListener = (
  model: Model,
  options?: ValidationOptions,
) => HookReturn;
```

**Przykład**

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

// wszystkie modele
db.on('beforeValidate', async (model, options) => {
  // wykonaj coś
});
// model tests
db.on('tests.beforeValidate', async (model, options) => {
  // wykonaj coś
});

// wszystkie modele
db.on('afterValidate', async (model, options) => {
  // wykonaj coś
});
// model tests
db.on('tests.afterValidate', async (model, options) => {
  // wykonaj coś
});

const repository = db.getRepository('tests');
await repository.create({
  values: {
    email: 'abc', // sprawdza format adresu e-mail
  },
});
// or
await repository.update({
  filterByTk: 1,
  values: {
    email: 'abc', // sprawdza format adresu e-mail
  },
});
```

### `'beforeCreate'` / `'afterCreate'`

Odpowiednie zdarzenia są wywoływane przed i po utworzeniu rekordu. Jest to wywoływane podczas wywołania `repository.create()`.

**Sygnatura**

```ts
on(eventName: `${string}.beforeCreate` | 'beforeCreate' | `${string}.afterCreate` | 'afterCreate', listener: CreateListener): this
```

**Typ**

```ts
import type { CreateOptions, HookReturn } from 'sequelize/types';
import type { Model } from '@nocobase/database';

export type CreateListener = (
  model: Model,
  options?: CreateOptions,
) => HookReturn;
```

**Przykład**

```ts
db.on('beforeCreate', async (model, options) => {
  // wykonaj coś
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

Odpowiednie zdarzenia są wywoływane przed i po aktualizacji rekordu. Jest to wywoływane podczas wywołania `repository.update()`.

**Sygnatura**

```ts
on(eventName: `${string}.beforeUpdate` | 'beforeUpdate' | `${string}.afterUpdate` | 'afterUpdate', listener: UpdateListener): this
```

**Typ**

```ts
import type { UpdateOptions, HookReturn } from 'sequelize/types';
import type { Model } from '@nocobase/database';

export type UpdateListener = (
  model: Model,
  options?: UpdateOptions,
) => HookReturn;
```

**Przykład**

```ts
db.on('beforeUpdate', async (model, options) => {
  // wykonaj coś
});

db.on('books.afterUpdate', async (model, options) => {
  // wykonaj coś
});
```

### `'beforeSave'` / `'afterSave'`

Odpowiednie zdarzenia są wywoływane przed i po utworzeniu lub aktualizacji rekordu. Jest to wywoływane podczas wywołania `repository.create()` lub `repository.update()`.

**Sygnatura**

```ts
on(eventName: `${string}.beforeSave` | 'beforeSave' | `${string}.afterSave` | 'afterSave', listener: SaveListener): this
```

**Typ**

```ts
import type { SaveOptions, HookReturn } from 'sequelize/types';
import type { Model } from '@nocobase/database';

export type SaveListener = (model: Model, options?: SaveOptions) => HookReturn;
```

**Przykład**

```ts
db.on('beforeSave', async (model, options) => {
  // wykonaj coś
});

db.on('books.afterSave', async (model, options) => {
  // wykonaj coś
});
```

### `'beforeDestroy'` / `'afterDestroy'`

Odpowiednie zdarzenia są wywoływane przed i po usunięciu rekordu. Jest to wywoływane podczas wywołania `repository.destroy()`.

**Sygnatura**

```ts
on(eventName: `${string}.beforeDestroy` | 'beforeDestroy' | `${string}.afterDestroy` | 'afterDestroy', listener: DestroyListener): this
```

**Typ**

```ts
import type { DestroyOptions, HookReturn } from 'sequelize/types';
import type { Model } from '@nocobase/database';

export type DestroyListener = (
  model: Model,
  options?: DestroyOptions,
) => HookReturn;
```

**Przykład**

```ts
db.on('beforeDestroy', async (model, options) => {
  // wykonaj coś
});

db.on('books.afterDestroy', async (model, options) => {
  // wykonaj coś
});
```

### `'afterCreateWithAssociations'`

To zdarzenie jest wywoływane po utworzeniu rekordu z hierarchicznymi danymi powiązań. Jest to wywoływane podczas wywołania `repository.create()`.

**Sygnatura**

```ts
on(eventName: `${string}.afterCreateWithAssociations` | 'afterCreateWithAssociations', listener: CreateWithAssociationsListener): this
```

**Typ**

```ts
import type { CreateOptions, HookReturn } from 'sequelize/types';
import type { Model } from '@nocobase/database';

export type CreateWithAssociationsListener = (
  model: Model,
  options?: CreateOptions,
) => HookReturn;
```

**Przykład**

```ts
db.on('afterCreateWithAssociations', async (model, options) => {
  // wykonaj coś
});

db.on('books.afterCreateWithAssociations', async (model, options) => {
  // wykonaj coś
});
```

### `'afterUpdateWithAssociations'`

To zdarzenie jest wywoływane po aktualizacji rekordu z hierarchicznymi danymi powiązań. Jest to wywoływane podczas wywołania `repository.update()`.

**Sygnatura**

```ts
on(eventName: `${string}.afterUpdateWithAssociations` | 'afterUpdateWithAssociations', listener: CreateWithAssociationsListener): this
```

**Typ**

```ts
import type { UpdateOptions, HookReturn } from 'sequelize/types';
import type { Model } from '@nocobase/database';

export type UpdateWithAssociationsListener = (
  model: Model,
  options?: UpdateOptions,
) => HookReturn;
```

**Przykład**

```ts
db.on('afterUpdateWithAssociations', async (model, options) => {
  // wykonaj coś
});

db.on('books.afterUpdateWithAssociations', async (model, options) => {
  // wykonaj coś
});
```

### `'afterSaveWithAssociations'`

To zdarzenie jest wywoływane po utworzeniu lub aktualizacji rekordu z hierarchicznymi danymi powiązań. Jest to wywoływane podczas wywołania `repository.create()` lub `repository.update()`.

**Sygnatura**

```ts
on(eventName: `${string}.afterSaveWithAssociations` | 'afterSaveWithAssociations', listener: SaveWithAssociationsListener): this
```

**Typ**

```ts
import type { SaveOptions, HookReturn } from 'sequelize/types';
import type { Model } from '@nocobase/database';

export type SaveWithAssociationsListener = (
  model: Model,
  options?: SaveOptions,
) => HookReturn;
```

**Przykład**

```ts
db.on('afterSaveWithAssociations', async (model, options) => {
  // wykonaj coś
});

db.on('books.afterSaveWithAssociations', async (model, options) => {
  // wykonaj coś
});
```

### `'beforeDefineCollection'`

Wywoływane przed zdefiniowaniem kolekcji, np. podczas wywołania `db.collection()`.

Uwaga: To zdarzenie jest synchroniczne.

**Sygnatura**

```ts
on(eventName: 'beforeDefineCollection', listener: BeforeDefineCollectionListener): this
```

**Typ**

```ts
import type { CollectionOptions } from '@nocobase/database';

export type BeforeDefineCollectionListener = (
  options: CollectionOptions,
) => void;
```

**Przykład**

```ts
db.on('beforeDefineCollection', (options) => {
  // wykonaj coś
});
```

### `'afterDefineCollection'`

Wywoływane po zdefiniowaniu kolekcji, np. podczas wywołania `db.collection()`.

Uwaga: To zdarzenie jest synchroniczne.

**Sygnatura**

```ts
on(eventName: 'afterDefineCollection', listener: AfterDefineCollectionListener): this
```

**Typ**

```ts
import type { Collection } from '@nocobase/database';

export type AfterDefineCollectionListener = (options: Collection) => void;
```

**Przykład**

```ts
db.on('afterDefineCollection', (collection) => {
  // wykonaj coś
});
```

### `'beforeRemoveCollection'` / `'afterRemoveCollection'`

Wywoływane przed i po usunięciu kolekcji z pamięci, np. podczas wywołania `db.removeCollection()`.

Uwaga: To zdarzenie jest synchroniczne.

**Sygnatura**

```ts
on(eventName: 'beforeRemoveCollection' | 'afterRemoveCollection', listener: RemoveCollectionListener): this
```

**Typ**

```ts
import type { Collection } from '@nocobase/database';

export type RemoveCollectionListener = (options: Collection) => void;
```

**Przykład**

```ts
db.on('beforeRemoveCollection', (collection) => {
  // wykonaj coś
});

db.on('afterRemoveCollection', (collection) => {
  // wykonaj coś
});
```