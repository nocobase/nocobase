# Repository - Репозиторий

## Обзор

Для данного объекта `Collection` вы можете получить его объект `Repository` для выполнения операций чтения и записи в коллекции.

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

### Запрос

#### Базовый запрос

В объекте `Repository` вызовите связанные методы `find*` для выполнения операций запроса. Все методы запроса поддерживают передачу параметра `filter` для фильтрации данных.

```javascript
// ВЫБРАТЬ * ИЗ пользователей ГДЕ id = 1
userRepository.find({
  filter: {
    id: 1,
  },
});
```

#### Операторы

Параметр `filter` в `Repository` также предоставляет множество операторов для выполнения более разнообразных операций запроса.

```javascript
// ВЫБЕРИТЕ * ИЗ пользователей ГДЕ возраст > 18 лет
userRepository.find({
  filter: {
    age: {
      $gt: 18,
    },
  },
});

// ВЫБЕРИТЕ * ИЗ пользователей, ГДЕ возраст > 18 ИЛИ имя КАК '%John%'
userRepository.find({
  filter: {
    $or: [{ age: { $gt: 18 } }, { name: { $like: '%John%' } }],
  },
});
```

Более подробную информацию об операторах см. в разделе [Операторы фильтров](/api/database/operators).

#### Управление полем

При выполнении операции запроса вы можете управлять полями вывода с помощью параметров `fields`, `except` и `appends`.

- `fields`: укажите поля вывода.
- `except`: исключить поля вывода.
- `appends`: добавить связанные поля к выводу.

```javascript
// Результат будет включать только поля идентификатора и имени.
userRepository.find({
  fields: ['id', 'name'],
});

// Результат не будет включать поле пароля.
userRepository.find({
  except: ['password'],
});

// Результат будет включать данные из связанных сообщений объекта.
userRepository.find({
  appends: ['posts'],
});
```

#### Запрос полей связи

Параметр `filter` поддерживает фильтрацию по полям связи, например:

```javascript
// Запрос объектов пользователей, связанные с сообщениями которых есть объект с заголовком 'post title'
userRepository.find({
  filter: {
    'posts.title': 'post title',
  },
});
```

Поля связи также могут быть вложенными.

```javascript
// Запрос объектов пользователей, комментарии к сообщениям которых содержат ключевые слова.
await userRepository.find({
  filter: {
    'posts.comments.content': {
      $like: '%keywords%',
    },
  },
});
```

#### Сортировка

Вы можете отсортировать результаты запроса, используя параметр `sort`.

```javascript
// ВЫБРАТЬ * ИЗ пользователей СОРТИРОВАТЬ ПО возрасту
await userRepository.find({
  sort: 'age',
});

// ВЫБРАТЬ * ИЗ пользователей СОРТИРОВАТЬ ПО ВОЗРАСТУ по убыванию
await userRepository.find({
  sort: '-age',
});

// ВЫБРАТЬ * ИЗ пользователей Упорядочить по возрасту по убыванию, по имени по возрастанию
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

Создайте новые объекты данных через `Repository`.

```javascript
await userRepository.create({
  name: 'John Doe',
  age: 18,
});
// ВСТАВИТЬ В пользователей (имя, возраст) ЗНАЧЕНИЯ ('John Doe', 18)

// Поддерживает массовое создание
await userRepository.create([
  {
    name: 'John Doe',
    age: 18,
  },
  {
    name: 'Jane Smith',
    age: 20,
  },
]);
```

#### Создание связей

При создании вы также можете одновременно создавать связанные объекты. Подобно запросам, также поддерживается вложенное использование связанных объектов, например:

```javascript
await userRepository.create({
  name: 'John Doe',
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
// При создании пользователя создается сообщение и связывается с ним, а теги создаются и связываются с сообщением.
```

Если связанный объект уже существует в базе данных, вы можете передать его идентификатор, чтобы установить с ним связь во время создания.

```javascript
const tag1 = await tagRepository.findOne({
  filter: {
    name: 'tag1',
  },
});

await userRepository.create({
  name: 'John Doe',
  age: 18,
  posts: [
    {
      title: 'post title',
      content: 'post content',
      tags: [
        {
          id: tag1.id, // Установить связь с существующим связанным объектом
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

После получения объекта данных вы можете напрямую изменить его свойства в объекте данных (`Model`), а затем вызвать метод `save`, чтобы сохранить изменения.

```javascript
const user = await userRepository.findOne({
  filter: {
    name: 'John Doe',
  },
});

user.age = 20;
await user.save();
```

Объект данных `Model` наследуется от модели Sequelize. Для операций с `Model` см. [Sequelize Model](https://sequelize.org/master/manual/model-basics.html).)

Вы также можете обновить данные через `Repository`:

```javascript
// Обновить записи данных, соответствующие критериям фильтра.
await userRepository.update({
  filter: {
    name: 'John Doe',
  },
  values: {
    age: 20,
  },
});
```

При обновлении вы можете контролировать, какие поля обновляются, с помощью параметров `whitelist` и `blacklist`, например:

```javascript
await userRepository.update({
  filter: {
    name: 'John Doe',
  },
  values: {
    age: 20,
    name: 'Jane Smith',
  },
  whitelist: ['age'], // Обновите только поле возраста
});
```

#### Обновление полей связи

При обновлении можно задать связанные объекты, например:

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
        id: tag1.id, // Установить связь с тегом 1
      },
      {
        name: 'tag2', // Создайте новый тег и установите связь
      },
    ],
  },
});

await postRepository.update({
  filter: {
    id: 1,
  },
  values: {
    tags: null, // Отвязать публикацию от тегов
  },
});
```

### Удаление

Вы можете вызвать метод `destroy()` в `Repository`, чтобы выполнить операцию удаления. При удалении необходимо указать критерии фильтра:

```javascript
await userRepository.destroy({
  filter: {
    status: 'blocked',
  },
});
```

## Конструктор

Обычно не вызывается напрямую разработчиками. В основном он создается после регистрации типа через `db.registerRepositories()` и указания соответствующего зарегистрированного типа репозитория в параметрах `db.collection()`.

**Сигнатура**

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
  // здесь ссылка на зарегистрированный репозиторий
  repository: 'books',
});

await db.sync();

const books = db.getRepository('books') as MyRepository;
await books.myQuery('SELECT * FROM books;');
```

## Свойства

### `database`

Экземпляр управления базой данных контекста.

### `collection`

Соответствующий экземпляр управления коллекцией.

### `model`

Соответствующий класс модели.

## Методы экземпляра

### `find()`

Запрашивает набор данных из базы данных, позволяя указать условия фильтрации, сортировку и т. д.

**Сигнатура**

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
// Запрос записей, в которых имя 'foo' и возраст больше 18 лет.
repository.find({
  filter: {
    name: 'foo',
    age: {
      $gt: 18,
    },
  },
});
```

Дополнительные операторы см. в разделе [Операторы запросов](./operators.md).

#### `filterByTk: TargetKey`

Запрашивает данные с помощью `TargetKey`, что является удобным методом для параметра `filter`. Конкретное поле для `TargetKey` может быть [настроено](./collection.md#filtertargetkey) в `Collection`, по умолчанию оно равно `primaryKey`.

```typescript
// По умолчанию находит запись с id = 1
repository.find({
  filterByTk: 1,
});
```

#### `fields: string[]`

Столбцы запроса, используемые для управления результатами полей данных. После передачи этого параметра будут возвращены только указанные поля.

#### `except: string[]`

Исключенные столбцы, используемые для управления результатами полей данных. После передачи этого параметра переданные поля не будут выведены.

#### `appends: string[]`

Добавленные столбцы, используемые для загрузки связанных данных. После передачи этого параметра также будут выведены указанные поля связи.

#### `sort: string[] | string`

Указывает метод сортировки результатов запроса. Параметром является имя поля, которое по умолчанию имеет порядок возрастания `asc`. Для порядка по убыванию `desc` добавьте символ `-` перед именем поля, например, `['-id', 'name']`, что означает сортировку по `id desc, name asc`.

#### `limit: number`

Ограничивает количество результатов, аналогично `limit` в `SQL`.

#### `offset: number`

Смещение запроса, такое же, как `offset` в `SQL`.

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

Запрашивает из базы данных один фрагмент данных, соответствующий определенным критериям. Эквивалент `Model.findOne()` в Sequelize.

**Сигнатура**

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

Запрашивает общее количество записей данных, соответствующих определенным критериям, из базы данных. Эквивалент `Model.count()` в Sequelize.

**Сигнатура**

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
    title: 'The Great Gatsby',
  },
});
```

### `findAndCount()`

Запрашивает набор данных и общее количество результатов, соответствующих определенным критериям, из базы данных. Эквивалент `Model.findAndCountAll()` в Sequelize.

**Сигнатура**

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

Параметры запроса такие же, как `find()`. Возвращаемое значение представляет собой массив, где первый элемент — это результат запроса, а второй элемент — общее количество.

### `create()`

Вставляет новую запись в коллекцию. Эквивалент `Model.create()` в Sequelize. Когда создаваемый объект данных содержит информацию о полях отношений, соответствующие записи данных отношений также будут созданы или обновлены.

**Сигнатура**

- `async create<M extends Model>(options: CreateOptions): Promise<M>`

<embed src="./shared/create-options.md"></embed>

**Пример**

```ts
const posts = db.getRepository('posts');

const result = await posts.create({
  values: {
    title: 'NocoBase 1.0 Release Notes',
    tags: [
      // Если существует первичный ключ таблицы связи, он обновляет данные.
      { id: 1 },
      // Когда нет значения первичного ключа, создаются новые данные.
      { name: 'NocoBase' },
    ],
  },
});
```

### `createMany()`

Вставляет в коллекцию несколько новых записей. Эквивалентно многократному вызову метода `create()`.

**Сигнатура**

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
      title: 'NocoBase 1.0 Release Notes',
      tags: [
        // Если существует первичный ключ таблицы связи, он обновляет данные.
        { id: 1 },
        // Когда нет значения первичного ключа, создаются новые данные.
        { name: 'NocoBase' },
      ],
    },
    {
      title: 'NocoBase 1.1 Release Notes',
      tags: [{ id: 1 }],
    },
  ],
});
```

### `update()`

Обновляет данные в коллекции. Эквивалент `Model.update()` в Sequelize. Когда обновляемый объект данных содержит информацию о полях отношений, соответствующие записи данных отношений также будут созданы или обновлены.

**Сигнатура**

- `async update<M extends Model>(options: UpdateOptions): Promise<M>`

<embed src="./shared/update-options.md"></embed>

**Пример**

```ts
const posts = db.getRepository('posts');

const result = await posts.update({
  filterByTk: 1,
  values: {
    title: 'NocoBase 1.0 Release Notes',
    tags: [
      // Если существует первичный ключ таблицы связи, он обновляет данные.
      { id: 1 },
      // Когда нет значения первичного ключа, создаются новые данные.
      { name: 'NocoBase' },
    ],
  },
});
```

### `destroy()`

Удаляет данные из коллекции. Эквивалент `Model.destroy()` в Sequelize.

**Сигнатура**

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

- `filter`: определяет условия фильтрации для удаляемых записей. Подробную информацию об использовании фильтра см. в методе [`find()`](#find).
- `filterByTk`: определяет условия фильтрации записей, которые будут удалены с помощью TargetKey.
- `truncate`: следует ли усекать собираемые данные, действует, если не передан параметр `filter` или `filterByTk`.
- `transaction`: Объект транзакции. Если параметр транзакции не передан, метод автоматически создаст внутреннюю транзакцию.