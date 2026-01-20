:::tip Повідомлення про переклад ШІ
Ця документація була автоматично перекладена штучним інтелектом.
:::


# База даних

## Огляд

`Database` — це інструмент для взаємодії з базами даних, який надає NocoBase. Він забезпечує дуже зручні можливості взаємодії з базами даних для no-code та low-code застосунків. Наразі підтримуються такі бази даних:

- SQLite 3.8.8+
- MySQL 8.0.17+
- PostgreSQL 10.0+

### Підключення до бази даних

У конструкторі `Database` ви можете налаштувати підключення до бази даних, передавши параметр `options`.

```javascript
const { Database } = require('@nocobase/database');

// Параметри конфігурації бази даних SQLite
const database = new Database({
  dialect: 'mysql',
  host: 'localhost',
  port: 3306,
  database: 'nocobase',
  username: 'root',
  password: 'password'
})

// Параметри конфігурації бази даних MySQL \ PostgreSQL
const database = new Database({
  dialect: /* 'postgres' або 'mysql' */,
  database: 'database',
  username: 'username',
  password: 'password',
  host: 'localhost',
  port: 'port'
})

```

Детальніші параметри конфігурації дивіться у розділі [Конструктор](#конструктор).

### Визначення моделі даних

`Database` визначає структуру бази даних за допомогою `колекції`. Об'єкт `колекції` представляє таблицю в базі даних.

```javascript
// Визначення колекції
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

Після визначення структури бази даних ви можете використовувати метод `sync()` для її синхронізації.

```javascript
await database.sync();
```

Детальніше про використання `колекції` дивіться у розділі [Колекція](/api/database/collection).

### Читання та запис даних

`Database` виконує операції з даними за допомогою `Repository`.

```javascript
const UserRepository = UserCollection.repository();

// Створити
await UserRepository.create({
  name: 'John',
  age: 18,
});

// Запит
const user = await UserRepository.findOne({
  filter: {
    name: 'John',
  },
});

// Оновити
await UserRepository.update({
  values: {
    age: 20,
  },
});

// Видалити
await UserRepository.destroy(user.id);
```

Детальніше про використання CRUD операцій з даними дивіться у розділі [Repository](/api/database/repository).

## Конструктор

**Підпис**

- `constructor(options: DatabaseOptions)`

Створює екземпляр бази даних.

**Параметри**

| Параметр | Тип | За замовчуванням | Опис |
|---|---|---|---|
| `options.host` | `string` | `'localhost'` | Хост бази даних |
| `options.port` | `number` | - | Порт служби бази даних, має відповідний порт за замовчуванням залежно від використовуваної бази даних |
| `options.username` | `string` | - | Ім'я користувача бази даних |
| `options.password` | `string` | - | Пароль бази даних |
| `options.database` | `string` | - | Ім'я бази даних |
| `options.dialect` | `string` | `'mysql'` | Тип бази даних |
| `options.storage?` | `string` | `':memory:'` | Режим зберігання для SQLite |
| `options.logging?` | `boolean` | `false` | Чи вмикати логування |
| `options.define?` | `Object` | `{}` | Параметри визначення таблиці за замовчуванням |
| `options.tablePrefix?` | `string` | `''` | Розширення NocoBase, префікс імені таблиці |
| `options.migrator?` | `UmzugOptions` | `{}` | Розширення NocoBase, параметри, пов'язані з менеджером міграцій, дивіться реалізацію [Umzug](https://github.com/sequelize/umzug/blob/main/src/types.ts#L15) |

## Методи, пов'язані з міграціями

### `addMigration()`

Додає один файл міграції.

**Підпис**

- `addMigration(options: MigrationItem)`

**Параметри**

| Параметр | Тип | За замовчуванням | Опис |
|---|---|---|---|
| `options.name` | `string` | - | Ім'я файлу міграції |
| `options.context?` | `string` | - | Контекст файлу міграції |
| `options.migration?` | `typeof Migration` | - | Користувацький клас для файлу міграції |
| `options.up` | `Function` | - | Метод `up` файлу міграції |
| `options.down` | `Function` | - | Метод `down` файлу міграції |

**Приклад**

```ts
db.addMigration({
  name: '20220916120411-test-1',
  async up() {
    const queryInterface = this.context.db.sequelize.getQueryInterface();
    await queryInterface.query(/* ваші SQL-запити для міграції */);
  },
});
```

### `addMigrations()`

Додає файли міграції з вказаної директорії.

**Підпис**

- `addMigrations(options: AddMigrationsOptions): void`

**Параметри**

| Параметр | Тип | За замовчуванням | Опис |
|---|---|---|---|
| `options.directory` | `string` | `''` | Директорія, де знаходяться файли міграції |
| `options.extensions` | `string[]` | `['js', 'ts']` | Розширення файлів |
| `options.namespace?` | `string` | `''` | Простір імен |
| `options.context?` | `Object` | `{ db }` | Контекст файлу міграції |

**Приклад**

```ts
db.addMigrations({
  directory: path.resolve(__dirname, './migrations'),
  namespace: 'test',
});
```

## Допоміжні методи

### `inDialect()`

Перевіряє, чи поточний тип бази даних відповідає одному із зазначених типів.

**Підпис**

- `inDialect(dialect: string[]): boolean`

**Параметри**

| Параметр | Тип | За замовчуванням | Опис |
|---|---|---|---|
| `dialect` | `string[]` | - | Тип бази даних, можливі значення: `mysql`/`postgres`/`mariadb` |

### `getTablePrefix()`

Отримує префікс імені таблиці з конфігурації.

**Підпис**

- `getTablePrefix(): string`

## Конфігурація колекцій

### `collection()`

Визначає колекцію. Цей виклик схожий на метод `define` у Sequelize, він створює структуру таблиці лише в пам'яті. Щоб зберегти її в базі даних, потрібно викликати метод `sync`.

**Підпис**

- `collection(options: CollectionOptions): Collection`

**Параметри**

Усі параметри конфігурації `options` відповідають конструктору класу `колекції`, дивіться [Колекція](/api/database/collection#конструктор).

**Події**

- `'beforeDefineCollection'`: Спрацьовує перед визначенням колекції.
- `'afterDefineCollection'`: Спрацьовує після визначення колекції.

**Приклад**

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

// синхронізувати колекцію як таблицю в БД
await db.sync();
```

### `getCollection()`

Отримує визначену колекцію.

**Підпис**

- `getCollection(name: string): Collection`

**Параметри**

| Параметр | Тип | За замовчуванням | Опис |
|---|---|---|---|
| `name` | `string` | - | Ім'я колекції |

**Приклад**

```ts
const collection = db.getCollection('books');
```

### `hasCollection()`

Перевіряє, чи визначено вказану колекцію.

**Підпис**

- `hasCollection(name: string): boolean`

**Параметри**

| Параметр | Тип | За замовчуванням | Опис |
|---|---|---|---|
| `name` | `string` | - | Ім'я колекції |

**Приклад**

```ts
db.collection({ name: 'books' });

db.hasCollection('books'); // true

db.hasCollection('authors'); // false
```

### `removeCollection()`

Видаляє визначену колекцію. Вона видаляється лише з пам'яті; щоб зберегти зміни, потрібно викликати метод `sync`.

**Підпис**

- `removeCollection(name: string): void`

**Параметри**

| Параметр | Тип | За замовчуванням | Опис |
|---|---|---|---|
| `name` | `string` | - | Ім'я колекції |

**Події**

- `'beforeRemoveCollection'`: Спрацьовує перед видаленням колекції.
- `'afterRemoveCollection'`: Спрацьовує після видалення колекції.

**Приклад**

```ts
db.collection({ name: 'books' });

db.removeCollection('books');
```

### `import()`

Імпортує всі файли з директорії як конфігурації колекцій у пам'ять.

**Підпис**

- `async import(options: { directory: string; extensions?: ImportFileExtension[] }): Promise<Map<string, Collection>>`

**Параметри**

| Параметр | Тип | За замовчуванням | Опис |
|---|---|---|---|
| `options.directory` | `string` | - | Шлях до директорії для імпорту |
| `options.extensions` | `string[]` | `['ts', 'js']` | Сканувати за певними суфіксами |

**Приклад**

Колекція, визначена у файлі `./collections/books.ts`, виглядає так:

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

Імпортуйте відповідну конфігурацію під час завантаження плагіна:

```ts
class Plugin {
  async load() {
    await this.app.db.import({
      directory: path.resolve(__dirname, './collections'),
    });
  }
}
```

## Реєстрація та отримання розширень

### `registerFieldTypes()`

Реєструє користувацькі типи полів.

**Підпис**

- `registerFieldTypes(fieldTypes: MapOf<typeof Field>): void`

**Параметри**

`fieldTypes` — це пара ключ-значення, де ключ — це назва типу поля, а значення — клас типу поля.

**Приклад**

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

Реєструє користувацькі класи моделей даних.

**Підпис**

- `registerModels(models: MapOf<ModelStatic<any>>): void`

**Параметри**

`models` — це пара ключ-значення, де ключ — це назва моделі даних, а значення — клас моделі даних.

**Приклад**

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

Реєструє користувацькі класи репозиторіїв.

**Підпис**

- `registerRepositories(repositories: MapOf<RepositoryType>): void`

**Параметри**

`repositories` — це пара ключ-значення, де ключ — це назва репозиторію, а значення — клас репозиторію.

**Приклад**

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

Реєструє користувацькі оператори запитів даних.

**Підпис**

- `registerOperators(operators: MapOf<OperatorFunc>)`

**Параметри**

`operators` — це пара ключ-значення, де ключ — це назва оператора, а значення — функція, що генерує оператор порівняння.

**Приклад**

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
      // зареєстрований оператор
      $dateOn: '2020-01-01',
    },
  },
});
```

### `getModel()`

Отримує визначений клас моделі даних. Якщо користувацький клас моделі не був зареєстрований раніше, буде повернуто стандартний клас моделі Sequelize. Назва за замовчуванням збігається з назвою, визначеною для колекції.

**Підпис**

- `getModel(name: string): Model`

**Параметри**

| Параметр | Тип | За замовчуванням | Опис |
|---|---|---|---|
| `name` | `string` | - | Зареєстроване ім'я моделі |

**Приклад**

```ts
db.registerModels({
  books: class MyModel extends Model {},
});

const ModelClass = db.getModel('books');

console.log(ModelClass.prototype instanceof MyModel); // true
```

Примітка: Клас моделі, отриманий з колекції, не є строго ідентичним зареєстрованому класу моделі, а успадковує його. Оскільки властивості класу моделі Sequelize змінюються під час ініціалізації, NocoBase автоматично обробляє цей зв'язок успадкування. За винятком нерівності класів, усі інші визначення можуть використовуватися нормально.

### `getRepository()`

Отримує користувацький клас репозиторію. Якщо користувацький клас репозиторію не був зареєстрований раніше, буде повернуто стандартний клас репозиторію NocoBase. Назва за замовчуванням збігається з назвою, визначеною для колекції.

Класи репозиторіїв в основному використовуються для операцій CRUD на основі моделей даних, дивіться [Repository](/api/database/repository).

**Підпис**

- `getRepository(name: string): Repository`
- `getRepository(name: string, relationId?: string | number): Repository`

**Параметри**

| Параметр | Тип | За замовчуванням | Опис |
|---|---|---|---|
| `name` | `string` | - | Зареєстроване ім'я репозиторію |
| `relationId` | `string` \| `number` | - | Значення зовнішнього ключа для реляційних даних |

Коли назва є асоціативною, наприклад `'tables.relations'`, буде повернуто пов'язаний клас репозиторію. Якщо надано другий параметр, репозиторій використовуватиметься на основі значення зовнішнього ключа реляційних даних (під час запитів, оновлень тощо).

**Приклад**

Припустимо, є дві колекції: *статті* та *автори*, і колекція статей має зовнішній ключ, що вказує на колекцію авторів:

```ts
const AuthorsRepo = db.getRepository('authors');
const author1 = AuthorsRepo.create({ name: 'author1' });

const PostsRepo = db.getRepository('authors.posts', author1.id);
const post1 = AuthorsRepo.create({ title: 'post1' });
asset(post1.authorId === author1.id); // true
```

## Події бази даних

### `on()`

Прослуховує події бази даних.

**Підпис**

- `on(event: string, listener: (...args: any[]) => void | Promise<void>): void`

**Параметри**

| Параметр | Тип | За замовчуванням | Опис |
|---|---|---|---|
| `event` | `string` | - | Назва події |
| `listener` | `Function` | - | Слухач події |

Назви подій за замовчуванням підтримують події моделі Sequelize. Для глобальних подій використовуйте формат `<sequelize_model_global_event>`, а для подій окремих моделей — формат `<model_name>.<sequelize_model_event>`.

Опис параметрів та детальні приклади всіх вбудованих типів подій дивіться у розділі [Вбудовані події](#вбудовані-події).

### `off()`

Видаляє функцію слухача події.

**Підпис**

- `off(name: string, listener: Function)`

**Параметри**

| Параметр | Тип | За замовчуванням | Опис |
|---|---|---|---|
| `name` | `string` | - | Назва події |
| `listener` | `Function` | - | Слухач події |

**Приклад**

```ts
const listener = async (model, options) => {
  console.log(model);
};

db.on('afterCreate', listener);

db.off('afterCreate', listener);
```

## Операції з базою даних

### `auth()`

Перевірка підключення до бази даних. Може використовуватися для забезпечення встановлення з'єднання застосунку з даними.

**Підпис**

- `auth(options: QueryOptions & { retry?: number } = {}): Promise<boolean>`

**Параметри**

| Параметр | Тип | За замовчуванням | Опис |
|---|---|---|---|
| `options?` | `Object` | - | Параметри перевірки |
| `options.retry?` | `number` | `10` | Кількість повторних спроб у разі невдалої перевірки |
| `options.transaction?` | `Transaction` | - | Об'єкт транзакції |
| `options.logging?` | `boolean` \| `Function` | `false` | Чи виводити логи |

**Приклад**

```ts
await db.auth();
```

### `reconnect()`

Перепідключається до бази даних.

**Приклад**

```ts
await db.reconnect();
```

### `closed()`

Перевіряє, чи закрито з'єднання з базою даних.

**Підпис**

- `closed(): boolean`

### `close()`

Закриває з'єднання з базою даних. Еквівалентно `sequelize.close()`.

### `sync()`

Синхронізує структуру таблиць бази даних. Еквівалентно `sequelize.sync()`, параметри дивіться в [документації Sequelize](https://sequelize.org/api/v6/class/src/sequelize.js~sequelize#instance-method-sync).

### `clean()`

Очищає базу даних, видаляючи всі колекції.

**Підпис**

- `clean(options: CleanOptions): Promise<void>`

**Параметри**

| Параметр | Тип | За замовчуванням | Опис |
|---|---|---|---|
| `options.drop` | `boolean` | `false` | Чи видаляти всі колекції |
| `options.skip` | `string[]` | - | Конфігурація імен колекцій, які потрібно пропустити |
| `options.transaction` | `Transaction` | - | Об'єкт транзакції |

**Приклад**

Видаляє всі колекції, крім колекції `users`.

```ts
await db.clean({
  drop: true,
  skip: ['users'],
});
```

## Експорти на рівні пакета

### `defineCollection()`

Створює конфігурацію для колекції.

**Підпис**

- `defineCollection(name: string, config: CollectionOptions): CollectionOptions`

**Параметри**

| Параметр | Тип | За замовчуванням | Опис |
|---|---|---|---|
| `collectionOptions` | `CollectionOptions` | - | Те саме, що й усі параметри `db.collection()` |

**Приклад**

Для файлу конфігурації колекції, який буде імпортовано за допомогою `db.import()`:

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

Розширює конфігурацію структури колекції, що вже знаходиться в пам'яті, головним чином для вмісту файлів, імпортованих методом `import()`. Цей метод є методом верхнього рівня, експортованим пакетом `@nocobase/database`, і не викликається через екземпляр `db`. Також можна використовувати псевдонім `extend`.

**Підпис**

- `extendCollection(collectionOptions: CollectionOptions, mergeOptions?: MergeOptions): ExtendedCollectionOptions`

**Параметри**

| Параметр | Тип | За замовчуванням | Опис |
|---|---|---|---|
| `collectionOptions` | `CollectionOptions` | - | Те саме, що й усі параметри `db.collection()` |
| `mergeOptions?` | `MergeOptions` | - | Параметри для npm-пакета [deepmerge](https://npmjs.com/package/deepmerge) |

**Приклад**

Оригінальне визначення колекції `books` (books.ts):

```ts
export default {
  name: 'books',
  fields: [{ name: 'title', type: 'string' }],
};
```

Розширене визначення колекції `books` (books.extend.ts):

```ts
import { extend } from '@nocobase/database';

// розширити ще раз
export default extend({
  name: 'books',
  fields: [{ name: 'price', type: 'number' }],
});
```

Якщо два файли вище імпортуються під час виклику `import()`, після повторного розширення за допомогою `extend()`, колекція `books` матиме поля `title` та `price`.

Цей метод дуже корисний для розширення структур колекцій, вже визначених існуючими плагінами.

## Вбудовані події

База даних викликає наступні відповідні події на різних етапах свого життєвого циклу. Підписка на них за допомогою методу `on()` дозволяє виконувати специфічну обробку для задоволення певних бізнес-потреб.

### `'beforeSync'` / `'afterSync'`

Спрацьовує до та після синхронізації нової конфігурації структури колекції (полів, індексів тощо) з базою даних. Зазвичай викликається при виконанні `collection.sync()` (внутрішній виклик) і, як правило, використовується для обробки логіки спеціальних розширень полів.

**Підпис**

```ts
on(eventName: `${string}.beforeSync` | 'beforeSync' | `${string}.afterSync` | 'afterSync', listener: SyncListener): this
```

**Тип**

```ts
import type { SyncOptions, HookReturn } from 'sequelize/types';

type SyncListener = (options?: SyncOptions) => HookReturn;
```

**Приклад**

```ts
const users = db.collection({
  name: 'users',
  fields: [{ type: 'string', name: 'username' }],
});

db.on('beforeSync', async (options) => {
  // зробити щось
});

db.on('users.afterSync', async (options) => {
  // зробити щось
});

await users.sync();
```

### `'beforeValidate'` / `'afterValidate'`

Перед створенням або оновленням даних відбувається процес валідації на основі правил, визначених у колекції. Відповідні події спрацьовують до та після валідації. Це відбувається при виклику `repository.create()` або `repository.update()`.

**Підпис**

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

**Приклад**

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

// всі моделі
db.on('beforeValidate', async (model, options) => {
  // зробити щось
});
// модель tests
db.on('tests.beforeValidate', async (model, options) => {
  // зробити щось
});

// всі моделі
db.on('afterValidate', async (model, options) => {
  // зробити щось
});
// модель tests
db.on('tests.afterValidate', async (model, options) => {
  // зробити щось
});

const repository = db.getRepository('tests');
await repository.create({
  values: {
    email: 'abc', // перевіряє формат email
  },
});
// або
await repository.update({
  filterByTk: 1,
  values: {
    email: 'abc', // перевіряє формат email
  },
});
```

### `'beforeCreate'` / `'afterCreate'`

Відповідні події спрацьовують до та після створення запису. Це відбувається при виклику `repository.create()`.

**Підпис**

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

**Приклад**

```ts
db.on('beforeCreate', async (model, options) => {
  // зробити щось
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

Відповідні події спрацьовують до та після оновлення запису. Це відбувається при виклику `repository.update()`.

**Підпис**

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

**Приклад**

```ts
db.on('beforeUpdate', async (model, options) => {
  // зробити щось
});

db.on('books.afterUpdate', async (model, options) => {
  // зробити щось
});
```

### `'beforeSave'` / `'afterSave'`

Відповідні події спрацьовують до та після створення або оновлення запису. Це відбувається при виклику `repository.create()` або `repository.update()`.

**Підпис**

```ts
on(eventName: `${string}.beforeSave` | 'beforeSave' | `${string}.afterSave` | 'afterSave', listener: SaveListener): this
```

**Тип**

```ts
import type { SaveOptions, HookReturn } from 'sequelize/types';
import type { Model } from '@nocobase/database';

export type SaveListener = (model: Model, options?: SaveOptions) => HookReturn;
```

**Приклад**

```ts
db.on('beforeSave', async (model, options) => {
  // зробити щось
});

db.on('books.afterSave', async (model, options) => {
  // зробити щось
});
```

### `'beforeDestroy'` / `'afterDestroy'`

Відповідні події спрацьовують до та після видалення запису. Це відбувається при виклику `repository.destroy()`.

**Підпис**

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

**Приклад**

```ts
db.on('beforeDestroy', async (model, options) => {
  // зробити щось
});

db.on('books.afterDestroy', async (model, options) => {
  // зробити щось
});
```

### `'afterCreateWithAssociations'`

Ця подія спрацьовує після створення запису з ієрархічними асоціативними даними. Вона викликається при виклику `repository.create()`.

**Підпис**

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

**Приклад**

```ts
db.on('afterCreateWithAssociations', async (model, options) => {
  // зробити щось
});

db.on('books.afterCreateWithAssociations', async (model, options) => {
  // зробити щось
});
```

### `'afterUpdateWithAssociations'`

Ця подія спрацьовує після оновлення запису з ієрархічними асоціативними даними. Вона викликається при виклику `repository.update()`.

**Підпис**

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

**Приклад**

```ts
db.on('afterUpdateWithAssociations', async (model, options) => {
  // зробити щось
});

db.on('books.afterUpdateWithAssociations', async (model, options) => {
  // зробити щось
});
```

### `'afterSaveWithAssociations'`

Ця подія спрацьовує після створення або оновлення запису з ієрархічними асоціативними даними. Вона викликається при виклику `repository.create()` або `repository.update()`.

**Підпис**

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

**Приклад**

```ts
db.on('afterSaveWithAssociations', async (model, options) => {
  // зробити щось
});

db.on('books.afterSaveWithAssociations', async (model, options) => {
  // зробити щось
});
```

### `'beforeDefineCollection'`

Спрацьовує перед визначенням колекції, наприклад, при виклику `db.collection()`.

Примітка: Ця подія є синхронною.

**Підпис**

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

**Приклад**

```ts
db.on('beforeDefineCollection', (options) => {
  // зробити щось
});
```

### `'afterDefineCollection'`

Спрацьовує після визначення колекції, наприклад, при виклику `db.collection()`.

Примітка: Ця подія є синхронною.

**Підпис**

```ts
on(eventName: 'afterDefineCollection', listener: AfterDefineCollectionListener): this
```

**Тип**

```ts
import type { Collection } from '@nocobase/database';

export type AfterDefineCollectionListener = (options: Collection) => void;
```

**Приклад**

```ts
db.on('afterDefineCollection', (collection) => {
  // зробити щось
});
```

### `'beforeRemoveCollection'` / `'afterRemoveCollection'`

Спрацьовує до та після видалення колекції з пам'яті, наприклад, при виклику `db.removeCollection()`.

Примітка: Ця подія є синхронною.

**Підпис**

```ts
on(eventName: 'beforeRemoveCollection' | 'afterRemoveCollection', listener: RemoveCollectionListener): this
```

**Тип**

```ts
import type { Collection } from '@nocobase/database';

export type RemoveCollectionListener = (options: Collection) => void;
```

**Приклад**

```ts
db.on('beforeRemoveCollection', (collection) => {
  // зробити щось
});

db.on('afterRemoveCollection', (collection) => {
  // зробити щось
});
```