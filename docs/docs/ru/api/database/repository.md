:::tip Уведомление о переводе ИИ
Эта документация была автоматически переведена ИИ.
:::

# Репозиторий

## Обзор

Для заданного объекта `Collection` вы можете получить его объект `Repository` для выполнения операций чтения и записи данных в коллекции.

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

### Запросы

#### Базовые запросы

В объекте `Repository` вы можете вызывать методы, начинающиеся с `find*`, для выполнения операций запроса. Все методы запроса поддерживают передачу параметра `filter` для фильтрации данных.

```javascript
// SELECT * FROM users WHERE id = 1
userRepository.find({
  filter: {
    id: 1,
  },
});
```

#### Операторы

Параметр `filter` в `Repository` также предоставляет различные операторы для выполнения более разнообразных операций запроса.

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

Более подробную информацию об операторах см. в разделе [Операторы фильтрации](/api/database/operators).

#### Управление полями

При выполнении операции запроса вы можете управлять выходными полями с помощью параметров `fields`, `except` и `appends`.

- `fields`: Указывает выходные поля
- `except`: Исключает выходные поля
- `appends`: Добавляет связанные поля в вывод

```javascript
// Результат будет содержать только поля id и name
userRepository.find({
  fields: ['id', 'name'],
});

// Результат не будет содержать поле password
userRepository.find({
  except: ['password'],
});

// Результат будет содержать данные из связанного объекта posts
userRepository.find({
  appends: ['posts'],
});
```

#### Запросы по связанным полям

Параметр `filter` поддерживает фильтрацию по связанным полям, например:

```javascript
// Запрос объектов user, чьи связанные posts содержат объект с заголовком 'post title'
userRepository.find({
  filter: {
    'posts.title': 'post title',
  },
});
```

Связанные поля также могут быть вложенными.

```javascript
// Запрос объектов user, где комментарии их постов содержат ключевые слова
await userRepository.find({
  filter: {
    'posts.comments.content': {
      $like: '%keywords%',
    },
  },
});
```

#### Сортировка

Вы можете сортировать результаты запроса с помощью параметра `sort`.

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

Вы также можете сортировать по полям связанных объектов.

```javascript
await userRepository.find({
  sort: 'profile.createdAt',
});
```

### Создание

#### Базовое создание

Создавайте новые объекты данных с помощью `Repository`.

```javascript
await userRepository.create({
  name: '张三',
  age: 18,
});
// INSERT INTO users (name, age) VALUES ('张三', 18)

// Поддерживается массовое создание
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

#### Создание связей

При создании вы можете одновременно создавать связанные объекты. Аналогично запросам, поддерживается также вложенное использование связанных объектов, например:

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
// При создании пользователя создается пост, связанный с пользователем, и теги, связанные с постом.
```

Если связанный объект уже существует в базе данных, вы можете передать его ID, чтобы установить связь с ним при создании.

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
          id: tag1.id, // Устанавливает связь с существующим связанным объектом
        },
        {
          name: 'tag2',
        },
      ],
    },
  ],
});
```

### Обновление

#### Базовое обновление

Получив объект данных, вы можете напрямую изменять его свойства в объекте данных (`Model`), а затем вызвать метод `save` для сохранения изменений.

```javascript
const user = await userRepository.findOne({
  filter: {
    name: '张三',
  },
});

user.age = 20;
await user.save();
```

Объект данных `Model` наследуется от Sequelize Model. Операции с `Model` см. в [Sequelize Model](https://sequelize.org/master/manual/model-basics.html).

Вы также можете обновлять данные через `Repository`:

```javascript
// Изменяет записи данных, соответствующие условиям фильтрации
await userRepository.update({
  filter: {
    name: '张三',
  },
  values: {
    age: 20,
  },
});
```

При обновлении вы можете контролировать, какие поля обновляются, используя параметры `whitelist` и `blacklist`, например:

```javascript
await userRepository.update({
  filter: {
    name: '张三',
  },
  values: {
    age: 20,
    name: '李四',
  },
  whitelist: ['age'], // Обновляет только поле age
});
```

#### Обновление связанных полей

При обновлении вы можете устанавливать связанные объекты, например:

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
        id: tag1.id, // Устанавливает связь с tag1
      },
      {
        name: 'tag2', // Создает новый тег и устанавливает связь
      },
    ],
  },
});

await postRepository.update({
  filter: {
    id: 1,
  },
  values: {
    tags: null, // Отменяет связь поста с тегами
  },
});
```

### Удаление

Вы можете вызвать метод `destroy()` в `Repository` для выполнения операции удаления. При удалении необходимо указать условия фильтрации:

```javascript
await userRepository.destroy({
  filter: {
    status: 'blocked',
  },
});
```

## Конструктор

Обычно не вызывается напрямую разработчиками. В основном он инстанцируется после регистрации типа через `db.registerRepositories()` и указания соответствующего зарегистрированного типа репозитория в параметрах `db.collection()`.

**Подпись**

- `constructor(collection: Collection)`

**Пример**

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
  // here link to the registered repository
  repository: 'books',
});

await db.sync();

const books = db.getRepository('books') as MyRepository;
await books.myQuery('SELECT * FROM books;');
```

## Члены экземпляра

### `database`

Экземпляр управления базой данных контекста.

### `collection`

Соответствующий экземпляр управления коллекцией.

### `model`

Соответствующий класс модели данных.

## Методы экземпляра

### `find()`

Запрашивает набор данных из базы данных, позволяя указывать условия фильтрации, сортировку и т.д.

**Подпись**

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

**Подробности**

#### `filter: Filter`

Условие запроса, используемое для фильтрации результатов данных. В переданных параметрах запроса `key` — это имя поля для запроса, а `value` может быть значением для запроса или использоваться с операторами для другой условной фильтрации данных.

```typescript
// Запрос записей, где name равно foo, а age больше 18
repository.find({
  filter: {
    name: 'foo',
    age: {
      $gt: 18,
    },
  },
});
```

Более подробную информацию об операторах см. в разделе [Операторы запросов](./operators.md).

#### `filterByTk: TargetKey`

Запрашивает данные по `TargetKey`, что является удобным методом для параметра `filter`. Конкретное поле для `TargetKey` может быть [сконфигурировано](./collection.md#filtertargetkey) в `Collection`, по умолчанию это `primaryKey`.

```typescript
// По умолчанию находит запись с id = 1
repository.find({
  filterByTk: 1,
});
```

#### `fields: string[]`

Столбцы запроса, используемые для управления результатами полей данных. После передачи этого параметра будут возвращены только указанные поля.

#### `except: string[]`

Исключенные столбцы, используемые для управления результатами полей данных. После передачи этого параметра переданные поля не будут выводиться.

#### `appends: string[]`

Добавленные столбцы, используемые для загрузки связанных данных. После передачи этого параметра указанные связанные поля также будут выводиться.

#### `sort: string[] | string`

Указывает метод сортировки результатов запроса. Параметр — это имя поля, которое по умолчанию сортируется по возрастанию (`asc`). Для сортировки по убыванию (`desc`) добавьте символ `-` перед именем поля, например: `['-id', 'name']`, что означает сортировку по `id desc, name asc`.

#### `limit: number`

Ограничивает количество результатов, аналогично `limit` в `SQL`.

#### `offset: number`

Смещение запроса, аналогично `offset` в `SQL`.

**Пример**

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

Запрашивает одну запись данных из базы данных, соответствующую определенным критериям. Эквивалентно `Model.findOne()` в Sequelize.

**Подпись**

- `async findOne(options?: FindOneOptions): Promise<Model | null>`

<embed src="./shared/find-one.md"></embed>

**Пример**

```ts
const posts = db.getRepository('posts');

const result = await posts.findOne({
  filterByTk: 1,
});
```

### `count()`

Запрашивает общее количество записей данных из базы данных, соответствующих определенным критериям. Эквивалентно `Model.count()` в Sequelize.

**Подпись**

- `count(options?: CountOptions): Promise<number>`

**Тип**

```typescript
interface CountOptions
  extends Omit<SequelizeCountOptions, 'distinct' | 'where' | 'include'>,
    Transactionable {
  filter?: Filter;
}
```

**Пример**

```ts
const books = db.getRepository('books');

const count = await books.count({
  filter: {
    title: '三字经',
  },
});
```

### `findAndCount()`

Запрашивает набор данных и общее количество результатов, соответствующих определенным критериям, из базы данных. Эквивалентно `Model.findAndCountAll()` в Sequelize.

**Подпись**

- `async findAndCount(options?: FindAndCountOptions): Promise<[Model[], number]>`

**Тип**

```typescript
type FindAndCountOptions = Omit<
  SequelizeAndCountOptions,
  'where' | 'include' | 'order'
> &
  CommonFindOptions;
```

**Подробности**

Параметры запроса такие же, как у `find()`. Возвращаемое значение — это массив, где первый элемент — результат запроса, а второй — общее количество результатов.

### `create()`

Вставляет новую запись в коллекцию. Эквивалентно `Model.create()` в Sequelize. Когда создаваемый объект данных содержит информацию о полях связей, соответствующие записи данных связей также будут созданы или обновлены.

**Подпись**

- `async create<M extends Model>(options: CreateOptions): Promise<M>`

<embed src="./shared/create-options.md"></embed>

**Пример**

```ts
const posts = db.getRepository('posts');

const result = await posts.create({
  values: {
    title: 'NocoBase 1.0 发布日志',
    tags: [
      // При наличии значения первичного ключа связанной таблицы данные обновляются
      { id: 1 },
      // При отсутствии значения первичного ключа создаются новые данные
      { name: 'NocoBase' },
    ],
  },
});
```

### `createMany()`

Вставляет несколько новых записей в коллекцию. Эквивалентно многократному вызову метода `create()`.

**Подпись**

- `createMany(options: CreateManyOptions): Promise<Model[]>`

**Тип**

```typescript
interface CreateManyOptions extends BulkCreateOptions {
  records: Values[];
}
```

**Подробности**

- `records`: Массив объектов данных для создаваемых записей.
- `transaction`: Объект транзакции. Если параметр транзакции не передан, метод автоматически создаст внутреннюю транзакцию.

**Пример**

```ts
const posts = db.getRepository('posts');

const results = await posts.createMany({
  records: [
    {
      title: 'NocoBase 1.0 发布日志',
      tags: [
        // При наличии значения первичного ключа связанной таблицы данные обновляются
        { id: 1 },
        // При отсутствии значения первичного ключа создаются новые данные
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

Обновляет данные в коллекции. Эквивалентно `Model.update()` в Sequelize. Когда обновляемый объект данных содержит информацию о полях связей, соответствующие записи данных связей также будут созданы или обновлены.

**Подпись**

- `async update<M extends Model>(options: UpdateOptions): Promise<M>`

<embed src="./shared/update-options.md"></embed>

**Пример**

```ts
const posts = db.getRepository('posts');

const result = await posts.update({
  filterByTk: 1,
  values: {
    title: 'NocoBase 1.0 发布日志',
    tags: [
      // При наличии значения первичного ключа связанной таблицы данные обновляются
      { id: 1 },
      // При отсутствии значения первичного ключа создаются новые данные
      { name: 'NocoBase' },
    ],
  },
});
```

### `destroy()`

Удаляет данные из коллекции. Эквивалентно `Model.destroy()` в Sequelize.

**Подпись**

- `async destroy(options?: TargetKey | TargetKey[] | DestroyOptions): Promise<number>`

**Тип**

```typescript
interface DestroyOptions extends SequelizeDestroyOptions {
  filter?: Filter;
  filterByTk?: TargetKey | TargetKey[];
  truncate?: boolean;
  context?: any;
}
```

**Подробности**

- `filter`: Указывает условия фильтрации для удаляемых записей. Подробное использование Filter см. в методе [`find()`](#find).
- `filterByTk`: Указывает условия фильтрации для удаляемых записей по TargetKey.
- `truncate`: Следует ли очищать данные коллекции, действует, если параметры `filter` или `filterByTk` не переданы.
- `transaction`: Объект транзакции. Если параметр транзакции не передан, метод автоматически создаст внутреннюю транзакцию.