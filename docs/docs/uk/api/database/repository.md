:::tip Повідомлення про переклад ШІ
Ця документація була автоматично перекладена штучним інтелектом.
:::


# Репозиторій

## Огляд

Для заданого об'єкта `Collection` ви можете отримати його об'єкт `Repository` для виконання операцій читання та запису даних у таблиці.

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

### Запити

#### Базовий запит

На об'єкті `Repository` ви можете викликати методи `find*` для виконання операцій запиту. Усі методи запиту підтримують передачу параметра `filter` для фільтрації даних.

```javascript
// SELECT * FROM users WHERE id = 1
userRepository.find({
  filter: {
    id: 1,
  },
});
```

#### Оператори

Параметр `filter` у `Repository` також надає різноманітні оператори для виконання більш гнучких операцій запиту.

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

Детальніше про оператори дивіться у розділі [Оператори фільтрації](/api/database/operators).

#### Керування полями

Під час виконання операції запиту ви можете керувати полями, що виводяться, за допомогою параметрів `fields`, `except` та `appends`.

- `fields`: Вказує поля для виведення
- `except`: Виключає поля з виведення
- `appends`: Додає пов'язані поля до результату

```javascript
// Результат міститиме лише поля id та name
userRepository.find({
  fields: ['id', 'name'],
});

// Результат не міститиме поля password
userRepository.find({
  except: ['password'],
});

// Результат міститиме дані з пов'язаного об'єкта posts
userRepository.find({
  appends: ['posts'],
});
```

#### Запити полів асоціацій

Параметр `filter` підтримує фільтрацію за полями асоціацій, наприклад:

```javascript
// Запит об'єктів user, чиї пов'язані posts мають об'єкт із заголовком 'post title'
userRepository.find({
  filter: {
    'posts.title': 'post title',
  },
});
```

Поля асоціацій також можуть бути вкладеними.

```javascript
// Запит об'єктів user, де коментарі їхніх posts містять ключові слова
await userRepository.find({
  filter: {
    'posts.comments.content': {
      $like: '%keywords%',
    },
  },
});
```

#### Сортування

За допомогою параметра `sort` ви можете сортувати результати запиту.

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

Ви також можете сортувати за полями об'єктів асоціацій.

```javascript
await userRepository.find({
  sort: 'profile.createdAt',
});
```

### Створення

#### Базове створення

Створюйте нові об'єкти даних за допомогою `Repository`.

```javascript
await userRepository.create({
  name: '张三',
  age: 18,
});
// INSERT INTO users (name, age) VALUES ('张三', 18)

// Підтримує масове створення
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

#### Створення асоціацій

Під час створення ви також можете одночасно створювати об'єкти асоціацій. Подібно до запитів, підтримується також вкладене використання об'єктів асоціацій, наприклад:

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
// Під час створення користувача, створюється пост та асоціюється з користувачем, а також створюються теги та асоціюються з постом.
```

Якщо об'єкт асоціації вже існує в базі даних, ви можете передати його ID для встановлення асоціації з ним під час створення.

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
          id: tag1.id, // Встановлення асоціації з існуючим об'єктом асоціації
        },
        {
          name: 'tag2',
        },
      ],
    },
  ],
});
```

### Оновлення

#### Базове оновлення

Отримавши об'єкт даних, ви можете безпосередньо змінювати його властивості на об'єкті даних (`Model`), а потім викликати метод `save` для збереження змін.

```javascript
const user = await userRepository.findOne({
  filter: {
    name: '张三',
  },
});

user.age = 20;
await user.save();
```

Об'єкт даних `Model` успадковує функціонал від Sequelize Model. Щоб дізнатися про операції з `Model`, зверніться до [Sequelize Model](https://sequelize.org/master/manual/model-basics.html).

Ви також можете оновлювати дані за допомогою `Repository`:

```javascript
// Оновлення записів даних, що відповідають критеріям фільтрації
await userRepository.update({
  filter: {
    name: '张三',
  },
  values: {
    age: 20,
  },
});
```

Під час оновлення ви можете контролювати поля, що оновлюються, за допомогою параметрів `whitelist` та `blacklist`, наприклад:

```javascript
await userRepository.update({
  filter: {
    name: '张三',
  },
  values: {
    age: 20,
    name: '李四',
  },
  whitelist: ['age'], // Оновлювати лише поле age
});
```

#### Оновлення полів асоціацій

Під час оновлення ви можете встановлювати об'єкти асоціацій, наприклад:

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
        id: tag1.id, // Встановити асоціацію з tag1
      },
      {
        name: 'tag2', // Створити новий тег та встановити асоціацію
      },
    ],
  },
});

await postRepository.update({
  filter: {
    id: 1,
  },
  values: {
    tags: null, // Скасувати асоціацію поста з тегами
  },
});
```

### Видалення

Ви можете викликати метод `destroy()` у `Repository` для виконання операції видалення. Під час видалення необхідно вказати критерії фільтрації:

```javascript
await userRepository.destroy({
  filter: {
    status: 'blocked',
  },
});
```

## Конструктор

Зазвичай не викликається безпосередньо розробниками. В основному він створюється екземпляром після реєстрації типу за допомогою `db.registerRepositories()` та вказівки відповідного зареєстрованого типу репозиторію в параметрах `db.collection()`.

**Підпис**

- `constructor(collection: Collection)`

**Приклад**

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
  // тут посилання на зареєстрований репозиторій
  repository: 'books',
});

await db.sync();

const books = db.getRepository('books') as MyRepository;
await books.myQuery('SELECT * FROM books;');
```

## Члени екземпляра

### `database`

Екземпляр для керування базою даних контексту.

### `collection`

Відповідний екземпляр для керування колекцією.

### `model`

Відповідний клас моделі.

## Методи екземпляра

### `find()`

Запитує набір даних з бази даних, дозволяючи вказувати умови фільтрації, сортування тощо.

**Підпис**

- `async find(options?: FindOptions): Promise<Model[]>`

**Тип**

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

**Деталі**

#### `filter: Filter`

Умова фільтрації, що використовується для фільтрації результатів даних. У переданих параметрах запиту `key` — це ім'я поля для запиту, а `value` може бути значенням для запиту або використовуватися разом з операторами для фільтрації даних за іншими умовами.

```typescript
// Запит записів, де name дорівнює 'foo', а age більше 18
repository.find({
  filter: {
    name: 'foo',
    age: {
      $gt: 18,
    },
  },
});
```

Детальніше про оператори дивіться у розділі [Оператори запиту](./operators.md).

#### `filterByTk: TargetKey`

Запитує дані за `TargetKey`, що є зручним методом для параметра `filter`. Конкретне поле для `TargetKey` можна [налаштувати](./collection.md#filtertargetkey) у `Collection`, за замовчуванням це `primaryKey`.

```typescript
// За замовчуванням знаходить запис з id = 1
repository.find({
  filterByTk: 1,
});
```

#### `fields: string[]`

Поля для запиту, що використовуються для керування полями даних у результатах. Після передачі цього параметра будуть повернуті лише вказані поля.

#### `except: string[]`

Поля для виключення, що використовуються для керування полями даних у результатах. Після передачі цього параметра передані поля не будуть включені у вивід.

#### `appends: string[]`

Поля для додавання, що використовуються для завантаження даних асоціацій. Після передачі цього параметра вказані поля асоціацій також будуть включені у вивід.

#### `sort: string[] | string`

Визначає спосіб сортування для результатів запиту. Параметром є ім'я поля, яке за замовчуванням сортується за зростанням (`asc`). Для сортування за спаданням (`desc`) додайте символ `-` перед назвою поля, наприклад, `['-id', 'name']`, що означає сортування за `id` за спаданням, а потім за `name` за зростанням.

#### `limit: number`

Обмежує кількість результатів, так само як `limit` у `SQL`.

#### `offset: number`

Зміщення запиту, так само як `offset` у `SQL`.

**Приклад**

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

Запитує один запис даних з бази даних, який відповідає певним критеріям. Еквівалентно `Model.findOne()` у Sequelize.

**Підпис**

- `async findOne(options?: FindOneOptions): Promise<Model | null>`

<embed src="./shared/find-one.md"></embed>

**Приклад**

```ts
const posts = db.getRepository('posts');

const result = await posts.findOne({
  filterByTk: 1,
});
```

### `count()`

Запитує загальну кількість записів даних, що відповідають певним критеріям, з бази даних. Еквівалентно `Model.count()` у Sequelize.

**Підпис**

- `count(options?: CountOptions): Promise<number>`

**Тип**

```typescript
interface CountOptions
  extends Omit<SequelizeCountOptions, 'distinct' | 'where' | 'include'>,
    Transactionable {
  filter?: Filter;
}
```

**Приклад**

```ts
const books = db.getRepository('books');

const count = await books.count({
  filter: {
    title: '三字经',
  },
});
```

### `findAndCount()`

Запитує набір даних та їх загальну кількість, що відповідають певним критеріям, з бази даних. Еквівалентно `Model.findAndCountAll()` у Sequelize.

**Підпис**

- `async findAndCount(options?: FindAndCountOptions): Promise<[Model[], number]>`

**Тип**

```typescript
type FindAndCountOptions = Omit<
  SequelizeAndCountOptions,
  'where' | 'include' | 'order'
> &
  CommonFindOptions;
```

**Деталі**

Параметри запиту такі ж, як у `find()`. Повертається масив, де перший елемент — це результат запиту, а другий — загальна кількість.

### `create()`

Вставляє новий запис у таблицю даних. Еквівалентно `Model.create()` у Sequelize. Коли об'єкт даних, що створюється, містить інформацію про поля асоціацій, відповідні записи даних асоціацій також будуть створені або оновлені.

**Підпис**

- `async create<M extends Model>(options: CreateOptions): Promise<M>`

<embed src="./shared/create-options.md"></embed>

**Приклад**

```ts
const posts = db.getRepository('posts');

const result = await posts.create({
  values: {
    title: 'NocoBase 1.0 发布日志',
    tags: [
      // Якщо існує значення первинного ключа таблиці асоціацій, воно оновлює цей запис даних
      { id: 1 },
      // Якщо немає значення первинного ключа, воно створює новий запис даних
      { name: 'NocoBase' },
    ],
  },
});
```

### `createMany()`

Вставляє кілька нових записів у таблицю даних. Еквівалентно багаторазовому виклику методу `create()`.

**Підпис**

- `createMany(options: CreateManyOptions): Promise<Model[]>`

**Тип**

```typescript
interface CreateManyOptions extends BulkCreateOptions {
  records: Values[];
}
```

**Деталі**

- `records`: Масив об'єктів даних для записів, що створюються.
- `transaction`: Об'єкт транзакції. Якщо параметр транзакції не передано, метод автоматично створить внутрішню транзакцію.

**Приклад**

```ts
const posts = db.getRepository('posts');

const results = await posts.createMany({
  records: [
    {
      title: 'NocoBase 1.0 发布日志',
      tags: [
        // Якщо існує значення первинного ключа таблиці асоціацій, воно оновлює цей запис даних
        { id: 1 },
        // Якщо немає значення первинного ключа, воно створює новий запис даних
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

Оновлює дані в таблиці даних. Еквівалентно `Model.update()` у Sequelize. Коли об'єкт даних, що оновлюється, містить інформацію про поля асоціацій, відповідні записи даних асоціацій також будуть створені або оновлені.

**Підпис**

- `async update<M extends Model>(options: UpdateOptions): Promise<M>`

<embed src="./shared/update-options.md"></embed>

**Приклад**

```ts
const posts = db.getRepository('posts');

const result = await posts.update({
  filterByTk: 1,
  values: {
    title: 'NocoBase 1.0 发布日志',
    tags: [
      // Якщо існує значення первинного ключа таблиці асоціацій, воно оновлює цей запис даних
      { id: 1 },
      // Якщо немає значення первинного ключа, воно створює новий запис даних
      { name: 'NocoBase' },
    ],
  },
});
```

### `destroy()`

Видаляє дані з таблиці даних. Еквівалентно `Model.destroy()` у Sequelize.

**Підпис**

- `async destory(options?: TargetKey | TargetKey[] | DestoryOptions): Promise<number>`

**Тип**

```typescript
interface DestroyOptions extends SequelizeDestroyOptions {
  filter?: Filter;
  filterByTk?: TargetKey | TargetKey[];
  truncate?: boolean;
  context?: any;
}
```

**Деталі**

- `filter`: Вказує умови фільтрації для записів, що видаляються. Детальне використання Filter дивіться у методі [`find()`](#find).
- `filterByTk`: Вказує умови фільтрації для записів, що видаляються, за TargetKey.
- `truncate`: Чи очищати дані таблиці, діє, якщо не передано параметри `filter` або `filterByTk`.
- `transaction`: Об'єкт транзакції. Якщо параметр транзакції не передано, метод автоматично створить внутрішню транзакцію.