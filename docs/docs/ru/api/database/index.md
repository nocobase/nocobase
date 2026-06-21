# Database - База данных

## Обзор

Database — это инструмент взаимодействия с базой данных, предоставляемый NocoBase, предлагающий удобные возможности взаимодействия с базой данных для приложений без кода и с низким кодом. В настоящее время поддерживаются следующие базы данных:

- SQLite 3.8.8+
- MySQL 8.0.17+
- PostgreSQL 10.0+

### Подключение к базе данных

В конструкторе `Database` можно настроить подключение к базе данных, передав параметр `options`.

```javascript
const { Database } = require('@nocobase/database');

// Параметры конфигурации базы данных SQLite
const database = new Database({
  dialect: 'mysql',
  host: 'localhost',
  port: 3306,
  database: 'nocobase',
  username: 'root',
  password: 'password'
})

// Параметры конфигурации базы данных MySQL\PostgreSQL
const database = new Database({
  dialect: /* 'postgres' или 'mysql' */,
  database: 'database',
  username: 'username',
  password: 'password',
  host: 'localhost',
  port: 'port'
})

```

Подробные параметры конфигурации см. в разделе [Конструктор](#constructor).

### Определение модели данных

`Database` определяет структуру базы данных через `Collection`. Объект `Collection` представляет таблицу в базе данных.

```javascript
// Определить коллекцию
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

После определения структуры базы данных вы можете использовать метод `sync()` для синхронизации структуры базы данных.

```javascript
await database.sync();
```

Более подробную информацию об использовании `Collection` см. в [Коллекция](/api/database/collection).

### Чтение/запись данных

`Database` оперирует данными через `Repository`.

```javascript
const UserRepository = UserCollection.repository();

// Создание
await UserRepository.create({
  name: 'John',
  age: 18,
});

// Запрос
const user = await UserRepository.findOne({
  filter: {
    name: 'John',
  },
});

// Обновление
await UserRepository.update({
  values: {
    age: 20,
  },
});

// Удаление
await UserRepository.destroy(user.id);
```

Более подробную информацию об использовании данных CRUD см. в [Репозиторий](/api/database/repository).

## Конструктор

**Сигнатура**

- `constructor(options: DatabaseOptions)`

Создает экземпляр базы данных.

**Параметры**

| Параметр | Тип | По умолчанию | Описание |
| ---------------------- | -------------- | ------------- | ------------------------------------------------------------------------------------------------------------------- |
| `options.host` | `string` | `'localhost'` | Хост базы данных |
| `options.port` | `number` | - | Порт службы базы данных с портом по умолчанию, соответствующим используемой базе данных |
| `options.username` | `string` | - | Имя пользователя базы данных |
| `options.password` | `string` | - | Пароль к базе данных |
| `options.database` | `string` | - | Имя базы данных |
| `options.dialect` | `string` | `'mysql'` | Тип базы данных |
| `options.storage?` | `string` | `':memory:'` | Режим хранения для SQLite |
| `options.logging?` | `boolean` | `false` | Включить ли ведение журнала |
| `options.define?` | `Object` | `{}` | Параметры определения таблицы по умолчанию |
| `options.tablePrefix?` | `string` | `''` | Расширение NocoBase, префикс имени таблицы |
| `options.migrator?` | `UmzugOptions` | `{}` | Расширение NocoBase, параметры, связанные с менеджером миграции, см. в реализации [Umzug](https://github.com/sequelize/umzug/blob/main/src/types.ts#L15) |

## Методы, связанные с миграцией

### `addMigration()`

Добавляет один файл миграции.

**Сигнатура**

- `addMigration(options: MigrationItem)`

**Параметры**

| Параметр | Тип | По умолчанию | Описание |
| -------------------- | ------------------ | ------ | ---------------------- |
| `options.name` | `string` | - | Имя файла миграции |
| `options.context?` | `string` | - | Контекст файла миграции |
| `options.migration?` | `typeof Migration` | - | Пользовательский класс для файла миграции |
| `options.up` | `Function` | - | `up` метод файла миграции |
| `options.down` | `Function` | - | `down` метод файла миграции |

**Пример**

```ts
db.addMigration({
  name: '20220916120411-test-1',
  async up() {
    const queryInterface = this.context.db.sequelize.getQueryInterface();
    await queryInterface.query(/* ваши SQL-запросы о миграции */);
  },
});
```

### `addMigrations()`

Добавляет файлы миграции из указанного каталога.

**Сигнатура**

- `addMigrations(options: AddMigrationsOptions): void`

**Параметры**

| Параметр | Тип | По умолчанию | Описание |
| -------------------- | ---------- | -------------- | ---------------- |
| `options.directory` | `string` | `''` | Каталог, в котором расположены файлы миграции |
| `options.extensions` | `string[]` | `['js', 'ts']` | Расширения файлов |
| `options.namespace?` | `string` | `''` | Пространство имен |
| `options.context?` | `Object` | `{ db }` | Контекст файла миграции |

**Пример**

```ts
db.addMigrations({
  directory: path.resolve(__dirname, './migrations'),
  namespace: 'test',
});
```

## Служебные методы

### `inDialect()`

Проверяет, является ли текущий тип базы данных одним из указанных типов.

**Сигнатура**

- `inDialect(dialect: string[]): boolean`

**Параметры**

| Параметр | Тип | По умолчанию | Описание |
| --------- | ---------- | ------ | ------------------------------------------------ |
| `dialect` | `string[]` | - | Тип базы данных, возможные значения: `mysql`/`postgres`/`mariadb` |

### `getTablePrefix()`

Получает префикс имени таблицы из конфигурации.

**Сигнатура**

- `getTablePrefix(): string`

## Конфигурация коллекции

### `collection()`

Определяет коллекцию. Этот вызов аналогичен методу `define` Sequelize, создающему структуру таблицы только в памяти. Чтобы сохранить его в базе данных, вам нужно вызвать метод `sync`.

**Сигнатура**

- `collection(options: CollectionOptions): Collection`

**Параметры**

Все параметры конфигурации `options` соответствуют конструктору класса `Collection`, см. [Collection](/api/database/collection#constructor).

**События**

- `'beforeDefineCollection'`: срабатывает перед определением коллекции.
- `'afterDefineCollection'`: срабатывает после определения коллекции.

**Пример**

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

// синхронизировать коллекцию как таблицу с базой данных
await db.sync();
```

### `getCollection()`

Получает определенную коллекцию.

**Сигнатура**

- `getCollection(name: string): Collection`

**Параметры**

| Параметр | Тип | По умолчанию | Описание |
| ------ | -------- | ------ | ---- |
| `name` | `string` | - | Название коллекции |

**Пример**

```ts
const collection = db.getCollection('books');
```

### `hasCollection()`

Проверяет, определена ли указанная коллекция.

**Сигнатура**

- `hasCollection(name: string): boolean`

**Параметры**

| Параметр | Тип | По умолчанию | Описание |
| ------ | -------- | ------ | ---- |
| `name` | `string` | - | Название коллекции |

**Пример**

```ts
db.collection({ name: 'books' });

db.hasCollection('books'); // истинный

db.hasCollection('authors'); // ЛОЖЬ
```

### `removeCollection()`

Удаляет определенную коллекцию. Оно только удаляется из памяти; чтобы сохранить изменение, вам нужно вызвать метод `sync`.

**Сигнатура**

- `removeCollection(name: string): void`

**Параметры**

| Параметр | Тип | По умолчанию | Описание |
| ------ | -------- | ------ | ---- |
| `name` | `string` | - | Название коллекции |

**События**

- `'beforeRemoveCollection'`: срабатывает перед удалением коллекции.
- `'afterRemoveCollection'`: срабатывает после удаления коллекции.

**Пример**

```ts
db.collection({ name: 'books' });

db.removeCollection('books');
```

### `import()`

Импортирует все файлы в каталоге как конфигурации коллекции в память.

**Сигнатура**

- `async import(options: { directory: string; extensions?: ImportFileExtension[] }): Promise<Map<string, Collection>>`

**Параметры**

| Параметр | Тип | По умолчанию | Описание |
| -------------------- | ---------- | -------------- | ---------------- |
| `options.directory` | `string` | - | Путь к каталогу для импорта |
| `options.extensions` | `string[]` | `['ts', 'js']` | Сканировать определенные суффиксы |

**Пример**

Коллекция, определенная в файле `./collections/books.ts`, выглядит следующим образом:

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

Импортируйте соответствующую конфигурацию при загрузке плагина:

```ts
class Plugin {
  async load() {
    await this.app.db.import({
      directory: path.resolve(__dirname, './collections'),
    });
  }
}
```

## Регистрация и получение расширений

### `registerFieldTypes()`

Регистрирует типы настраиваемых полей.

**Сигнатура**

- `registerFieldTypes(fieldTypes: MapOf<typeof Field>): void`

**Параметры**

`fieldTypes` — это пара ключ-значение, где ключ — это имя типа поля, а значение — класс типа поля.

**Пример**

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

Регистрирует пользовательские классы модели данных.

**Сигнатура**

- `registerModels(models: MapOf<ModelStatic<any>>): void`

**Параметры**

`models` — это пара ключ-значение, где ключ — это имя модели, а значение — класс модели.

**Пример**

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

Регистрирует пользовательские классы репозитория.

**Сигнатура**

- `registerRepositories(repositories: MapOf<RepositoryType>): void`

**Параметры**

`repositories` — это пара ключ-значение, где ключ — это имя репозитория, а значение — класс репозитория.

**Пример**

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

Регистрирует пользовательские операторы запроса данных.

**Сигнатура**

- `registerOperators(operators: MapOf<OperatorFunc>)`

**Параметры**

`operators` — это пара ключ-значение, где ключ — это имя оператора, а значение — это функция, генерирующая оператор сравнения.

**Пример**

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
      // зарегистрированный оператор
      $dateOn: '2020-01-01',
    },
  },
});
```

### `getModel()`

Получает определенный класс модели данных. Если ранее не был зарегистрирован пользовательский класс модели, он вернет класс модели Sequelize по умолчанию. Имя по умолчанию совпадает с именем коллекции.

**Сигнатура**

- `getModel(name: string): Model`

**Параметры**

| Параметр | Тип | По умолчанию | Описание |
| ------ | -------- | ------ | -------------- |
| `name` | `string` | - | Зарегистрированное название модели |

**Пример**

```ts
db.registerModels({
  books: class MyModel extends Model {},
});

const ModelClass = db.getModel('books');

console.log(ModelClass.prototype instanceof MyModel); // истинный
```

Примечание. Класс модели, полученный из коллекции, не строго равен зарегистрированному классу модели, а наследуется от него. Поскольку свойства класса модели Sequelize изменяются во время инициализации, NocoBase автоматически обрабатывает эти отношения наследования. За исключением классового неравенства, все остальные определения можно использовать нормально.

### `getRepository()`

Получает пользовательский класс репозитория. Если ранее не был зарегистрирован пользовательский класс репозитория, будет возвращен класс репозитория NocoBase по умолчанию. Имя по умолчанию совпадает с именем коллекции.

Классы репозитория в основном используются для операций CRUD на основе моделей данных, см. [Репозиторий](/api/database/repository).

**Сигнатура**

- `getRepository(name: string): Repository`
- `getRepository(name: string, relationId?: string | number): Repository`

**Параметры**

| Параметр | Тип | По умолчанию | Описание |
| ------------ | -------------------- | ------ | ------------------ |
| `name` | `string` | - | Зарегистрированное имя репозитория |
| `relationId` | `string` \| `number` | - | Значение внешнего ключа для реляционных данных |

Если имя является именем ассоциации, например `'tables.relations'`, оно вернет связанный класс репозитория. Если указан второй параметр, репозиторий будет основан на значении внешнего ключа реляционных данных при использовании (запрос, обновление и т. д.).

**Пример**

Предположим, есть две коллекции: *posts* и *authors*, и коллекция Posts имеет внешний ключ, указывающий на коллекцию авторов:

```ts
const AuthorsRepo = db.getRepository('authors');
const author1 = AuthorsRepo.create({ name: 'author1' });

const PostsRepo = db.getRepository('authors.posts', author1.id);
const post1 = AuthorsRepo.create({ title: 'post1' });
asset(post1.authorId === author1.id); // истинный
```

## События базы данных

### `on()`

Прослушивает события базы данных.

**Сигнатура**

- `on(event: string, listener: (...args: any[]) => void | Promise<void>): void`

**Параметры**

| Параметр | Тип | По умолчанию | Описание |
| -------- | -------- | ------ | ---------- |
| событие | строка | - | Название события |
| слушатель | Функция | - | Слушатель событий |

Имена событий по умолчанию поддерживают события модели Sequelize. Для глобальных событий прослушивайте формат `<sequelize_model_global_event>`, а для отдельных событий модели используйте формат `<model_name>.<sequelize_model_event>`.

Описания параметров и подробные примеры всех встроенных типов событий см. в разделе [Встроенные события](#built-in-events).

### `off()`

Удаляет функцию прослушивателя событий.

**Сигнатура**

- `off(name: string, listener: Function)`

**Параметры**

| Параметр | Тип | По умолчанию | Описание |
| -------- | -------- | ------ | ---------- |
| имя | строка | - | Название события |
| слушатель | Функция | - | Слушатель событий |

**Пример**

```ts
const listener = async (model, options) => {
  console.log(model);
};

db.on('afterCreate', listener);

db.off('afterCreate', listener);
```

## Операции с базой данных

### `auth()`

Аутентификация подключения к базе данных. Может использоваться для проверки того, что приложение установило соединение с данными.

**Сигнатура**

- `auth(options: QueryOptions & { retry?: number } = {}): Promise<boolean>`

**Параметры**

| Параметр | Тип | По умолчанию | Описание |
| ---------------------- | --------------------- | ------- | ------------------ |
| `options?` | `Object` | - | Варианты аутентификации |
| `options.retry?` | `number` | `10` | Количество попыток при неудачной аутентификации |
| `options.transaction?` | `Transaction` | - | Объект транзакции |
| `options.logging?` | `boolean \| Function` | `false` | Печатать ли журналы |

**Пример**

```ts
await db.auth();
```

### `reconnect()`

Повторно подключается к базе данных.

**Пример**

```ts
await db.reconnect();
```

### `closed()`

Проверяет, закрыто ли соединение с базой данных.

**Сигнатура**

- `closed(): boolean`

### `close()`

Закрывает соединение с базой данных. Эквивалент `sequelize.close()`.

### `sync()`

Синхронизирует структуру коллекции базы данных. Эквивалент `sequelize.sync()`, параметры см. в [документации Sequelize](https://sequelize.org/api/v6/class/src/sequelize.js~sequelize#instance-method-sync).)

### `clean()`

Очищает базу данных, удаляя все коллекции.

**Сигнатура**

- `clean(options: CleanOptions): Promise<void>`

**Параметры**

| Параметр | Тип | По умолчанию | Описание |
| --------------------- | ------------- | ------- | ------------------ |
| `options.drop` | `boolean` | `false` | Удалить ли все коллекции |
| `options.skip` | `string[]` | - | Настройка имен коллекций для пропуска |
| `options.transaction` | `Transaction` | - | Объект транзакции |

**Пример**

Удаляет все коллекции, кроме коллекции `users`.

```ts
await db.clean({
  drop: true,
  skip: ['users'],
});
```

## Экспорт на уровне пакета

### `defineCollection()`

Создает содержимое конфигурации для коллекции.

**Сигнатура**

- `defineCollection(name: string, config: CollectionOptions): CollectionOptions`

**Параметры**

| Параметр | Тип | По умолчанию | Описание |
| ------------------- | ------------------- | ------ | ----------------------------------- |
| `collectionOptions` | `CollectionOptions` | - | То же, что и все параметры `db.collection()` |

**Пример**

Чтобы файл конфигурации коллекции был импортирован `db.import()`:

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

Расширяет содержимое конфигурации коллекции, уже находящейся в памяти, в основном для содержимого файла, импортированного методом `import()`. Этот метод является методом верхнего уровня, экспортируемым пакетом `@nocobase/database`, и не вызывается через экземпляр базы данных. Также можно использовать псевдоним `extend`.

**Сигнатура**

- `extendCollection(collectionOptions: CollectionOptions, mergeOptions?: MergeOptions): ExtendedCollectionOptions`

**Параметры**

| Параметр | Тип | По умолчанию | Описание |
| ------------------- | ------------------- | ------ | -------------------------------------------------------------- |
| `collectionOptions` | `CollectionOptions` | - | То же, что и все параметры `db.collection()` |
| `mergeOptions?` | `MergeOptions` | - | Параметры пакета npm [deepmerge](https://npmjs.com/package/deepmerge) |

**Пример**

Определение коллекции оригинальных книг (books.ts):

```ts
export default {
  name: 'books',
  fields: [{ name: 'title', type: 'string' }],
};
```

Определение расширенной коллекции книг (books.extend.ts):

```ts
import { extend } from '@nocobase/database';

// продлить снова
export default extend({
  name: 'books',
  fields: [{ name: 'price', type: 'number' }],
});
```

Если два вышеуказанных файла импортируются при вызове `import()`, после повторного расширения с помощью `extend()`, коллекция книг будет иметь поля `title` и `price`.

Этот метод очень полезен для расширения структур коллекций, уже определенных существующими плагинами.

## Встроенные события

База данных запускает следующие соответствующие события на разных этапах своего жизненного цикла. Подписка на них с помощью метода `on()` позволяет осуществлять конкретную обработку для удовлетворения определенных потребностей бизнеса.

### `'beforeSync'` / `'afterSync'`

Срабатывает до и после синхронизации новой конфигурации структуры коллекции (полей, индексов и т. д.) с базой данных. Обычно он срабатывает при выполнении `collection.sync()` (внутренний вызов) и обычно используется для обработки логики для специальных расширений полей.

**Сигнатура**

```ts
on(eventName: `${string}.beforeSync` | 'beforeSync' | `${string}.afterSync` | 'afterSync', listener: SyncListener): this
```

**Тип**

```ts
import type { SyncOptions, HookReturn } from 'sequelize/types';

type SyncListener = (options?: SyncOptions) => HookReturn;
```

**Пример**

```ts
const users = db.collection({
  name: 'users',
  fields: [{ type: 'string', name: 'username' }],
});

db.on('beforeSync', async (options) => {
  // выполнить что-либо
});

db.on('users.afterSync', async (options) => {
  // выполнить что-либо
});

await users.sync();
```

### `'beforeValidate'` / `'afterValidate'`

Перед созданием или обновлением данных происходит процесс проверки на основе правил, определенных в коллекции. Соответствующие события запускаются до и после проверки. Это срабатывает при вызове `repository.create()` или `repository.update()`.

**Сигнатура**

```ts
on(eventName: `${string}.beforeValidate` | 'beforeValidate' | `${string}.afterValidate` | 'afterValidate', listener: ValidateListener): this
```

**Тип**

```ts
import type { ValidationOptions } from 'sequelize/types/lib/instance-validator';
import type { HookReturn } from 'sequelize/types';
import type { Model } from '@nocobase/database';

type ValidateListener = (
  model: Model,
  options?: ValidationOptions,
) => HookReturn;
```

**Пример**

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

// все модели
db.on('beforeValidate', async (model, options) => {
  // выполнить что-либо
});
// модель тестов
db.on('tests.beforeValidate', async (model, options) => {
  // выполнить что-либо
});

// все модели
db.on('afterValidate', async (model, options) => {
  // выполнить что-либо
});
// модель тестов
db.on('tests.afterValidate', async (model, options) => {
  // выполнить что-либо
});

const repository = db.getRepository('tests');
await repository.create({
  values: {
    email: 'abc', // проверяет формат электронной почты
  },
});
// или
await repository.update({
  filterByTk: 1,
  values: {
    email: 'abc', // проверяет формат электронной почты
  },
});
```

### `'beforeCreate'` / `'afterCreate'`

Соответствующие события инициируются до и после создания записи. Это срабатывает при вызове `repository.create()`.

**Сигнатура**

```ts
on(eventName: `${string}.beforeCreate` | 'beforeCreate' | `${string}.afterCreate` | 'afterCreate', listener: CreateListener): this
```

**Тип**

```ts
import type { CreateOptions, HookReturn } from 'sequelize/types';
import type { Model } from '@nocobase/database';

export type CreateListener = (
  model: Model,
  options?: CreateOptions,
) => HookReturn;
```

**Пример**

```ts
db.on('beforeCreate', async (model, options) => {
  // выполнить что-либо
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

Соответствующие события запускаются до и после обновления записи. Это срабатывает при вызове `repository.update()`.

**Сигнатура**

```ts
on(eventName: `${string}.beforeUpdate` | 'beforeUpdate' | `${string}.afterUpdate` | 'afterUpdate', listener: UpdateListener): this
```

**Тип**

```ts
import type { UpdateOptions, HookReturn } from 'sequelize/types';
import type { Model } from '@nocobase/database';

export type UpdateListener = (
  model: Model,
  options?: UpdateOptions,
) => HookReturn;
```

**Пример**

```ts
db.on('beforeUpdate', async (model, options) => {
  // выполнить что-либо
});

db.on('books.afterUpdate', async (model, options) => {
  // выполнить что-либо
});
```

### `'beforeSave'` / `'afterSave'`

Соответствующие события запускаются до и после создания или обновления записи. Это срабатывает при вызове `repository.create()` или `repository.update()`.

**Сигнатура**

```ts
on(eventName: `${string}.beforeSave` | 'beforeSave' | `${string}.afterSave` | 'afterSave', listener: SaveListener): this
```

**Тип**

```ts
import type { SaveOptions, HookReturn } from 'sequelize/types';
import type { Model } from '@nocobase/database';

export type SaveListener = (model: Model, options?: SaveOptions) => HookReturn;
```

**Пример**

```ts
db.on('beforeSave', async (model, options) => {
  // выполнить что-либо
});

db.on('books.afterSave', async (model, options) => {
  // выполнить что-либо
});
```

### `'beforeDestroy'` / `'afterDestroy'`

Соответствующие события срабатывают до и после удаления записи. Это срабатывает при вызове `repository.destroy()`.

**Сигнатура**

```ts
on(eventName: `${string}.beforeDestroy` | 'beforeDestroy' | `${string}.afterDestroy` | 'afterDestroy', listener: DestroyListener): this
```

**Тип**

```ts
import type { DestroyOptions, HookReturn } from 'sequelize/types';
import type { Model } from '@nocobase/database';

export type DestroyListener = (
  model: Model,
  options?: DestroyOptions,
) => HookReturn;
```

**Пример**

```ts
db.on('beforeDestroy', async (model, options) => {
  // выполнить что-либо
});

db.on('books.afterDestroy', async (model, options) => {
  // выполнить что-либо
});
```

### `'afterCreateWithAssociations'`

Это событие инициируется после создания записи с данными иерархической связи. Он срабатывает при вызове `repository.create()`.

**Сигнатура**

```ts
on(eventName: `${string}.afterCreateWithAssociations` | 'afterCreateWithAssociations', listener: CreateWithAssociationsListener): this
```

**Тип**

```ts
import type { CreateOptions, HookReturn } from 'sequelize/types';
import type { Model } from '@nocobase/database';

export type CreateWithAssociationsListener = (
  model: Model,
  options?: CreateOptions,
) => HookReturn;
```

**Пример**

```ts
db.on('afterCreateWithAssociations', async (model, options) => {
  // выполнить что-либо
});

db.on('books.afterCreateWithAssociations', async (model, options) => {
  // выполнить что-либо
});
```

### `'afterUpdateWithAssociations'`

Это событие инициируется после обновления записи с данными иерархической связи. Он срабатывает при вызове `repository.update()`.

**Сигнатура**

```ts
on(eventName: `${string}.afterUpdateWithAssociations` | 'afterUpdateWithAssociations', listener: CreateWithAssociationsListener): this
```

**Тип**

```ts
import type { UpdateOptions, HookReturn } from 'sequelize/types';
import type { Model } from '@nocobase/database';

export type UpdateWithAssociationsListener = (
  model: Model,
  options?: UpdateOptions,
) => HookReturn;
```

**Пример**

```ts
db.on('afterUpdateWithAssociations', async (model, options) => {
  // выполнить что-либо
});

db.on('books.afterUpdateWithAssociations', async (model, options) => {
  // выполнить что-либо
});
```

### `'afterSaveWithAssociations'`

Это событие инициируется после создания или обновления записи с данными иерархической связи. Он срабатывает при вызове `repository.create()` или `repository.update()`.

**Сигнатура**

```ts
on(eventName: `${string}.afterSaveWithAssociations` | 'afterSaveWithAssociations', listener: SaveWithAssociationsListener): this
```

**Тип**

```ts
import type { SaveOptions, HookReturn } from 'sequelize/types';
import type { Model } from '@nocobase/database';

export type SaveWithAssociationsListener = (
  model: Model,
  options?: SaveOptions,
) => HookReturn;
```

**Пример**

```ts
db.on('afterSaveWithAssociations', async (model, options) => {
  // выполнить что-либо
});

db.on('books.afterSaveWithAssociations', async (model, options) => {
  // выполнить что-либо
});
```

### `'beforeDefineCollection'`

Срабатывает перед определением коллекции, например, при вызове `db.collection()`.

Примечание: Это синхронное событие.

**Сигнатура**

```ts
on(eventName: 'beforeDefineCollection', listener: BeforeDefineCollectionListener): this
```

**Тип**

```ts
import type { CollectionOptions } from '@nocobase/database';

export type BeforeDefineCollectionListener = (
  options: CollectionOptions,
) => void;
```

**Пример**

```ts
db.on('beforeDefineCollection', (options) => {
  // выполнить что-либо
});
```

### `'afterDefineCollection'`

Запускается после определения коллекции, например, при вызове `db.collection()`.

Примечание: Это синхронное событие.

**Сигнатура**

```ts
on(eventName: 'afterDefineCollection', listener: AfterDefineCollectionListener): this
```

**Тип**

```ts
import type { Collection } from '@nocobase/database';

export type AfterDefineCollectionListener = (options: Collection) => void;
```

**Пример**

```ts
db.on('afterDefineCollection', (collection) => {
  // выполнить что-либо
});
```

### `'beforeRemoveCollection'` / `'afterRemoveCollection'`

Срабатывает до и после удаления коллекции из памяти, например, при вызове `db.removeCollection()`.

Примечание: Это синхронное событие.

**Сигнатура**

```ts
on(eventName: 'beforeRemoveCollection' | 'afterRemoveCollection', listener: RemoveCollectionListener): this
```

**Тип**

```ts
import type { Collection } from '@nocobase/database';

export type RemoveCollectionListener = (options: Collection) => void;
```

**Пример**

```ts
db.on('beforeRemoveCollection', (collection) => {
  // выполнить что-либо
});

db.on('afterRemoveCollection', (collection) => {
  // выполнить что-либо
});
```