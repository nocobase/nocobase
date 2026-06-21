# Тестирование

NocoBase предоставляет полный набор инструментов тестирования, которые помогают разработчикам быстро проверить правильность логики базы данных, интерфейсов API и реализации функций во время разработки плагинов. В этом руководстве рассказывается, как писать, запускать и организовывать эти тесты.

## Зачем писать тесты

Преимущества написания автоматических тестов при разработке плагинов:

- Быстрая проверка правильности моделей баз данных, API и бизнес-логики.
- Избежание регрессионных ошибок (автоматическое определение совместимости плагинов после обновления ядра).
- Поддержка сред непрерывной интеграции (CI) для автоматического запуска тестов.
- Поддержка тестирования функциональности плагина без запуска полной службы.

## Основы тестовой среды

NocoBase предоставляет два основных инструмента тестирования:

| Инструмент | Описание | Цель |
| ------------------- | ----------- | ------- |
| `createMockDatabase` | Создать экземпляр базы данных в памяти | Тестирование моделей и логики баз данных |
| `createMockServer` | Создать полный экземпляр приложения (включая базу данных, плагины, API и т. д.) | Тестирование бизнес-процессов и поведения интерфейса |

## Использование `createMockDatabase` для тестирования базы данных

`createMockDatabase` подходит для тестирования функций, непосредственно связанных с базами данных, таких как определения моделей, типы полей, связи, операции CRUD и т. д.

### Базовый пример

```ts
import { createMockDatabase, Database } from '@nocobase/database';

describe('Database test', () => {
  let db: Database;

  beforeEach(async () => {
    db = await createMockDatabase();
    await db.clean({ drop: true });
  });

  afterEach(async () => {
    await db.close();
  });

  it('should create and query data', async () => {
    const User = db.collection({
      name: 'users',
      fields: [
        { type: 'string', name: 'username' },
        { type: 'integer', name: 'age' },
      ],
    });

    await User.sync();

    const user = await db.getRepository('users').create({
      values: { username: 'testuser', age: 25 },
    });

    const found = await db.getRepository('users').findOne({
      filter: { username: 'testuser' },
    });

    expect(found.get('age')).toBe(25);
  });
});
```

### Тестирование CRUD операций

```ts
const Posts = db.collection({
  name: 'posts',
  fields: [{ type: 'string', name: 'title' }],
});
await db.sync();

// Создать (Create)
const post = await db.getRepository('posts').create({ values: { title: 'Initial Title' } });
expect(post.get('title')).toBe('Initial Title');

// Обновить (Update)
await db.getRepository('posts').update({
  filterByTk: post.get('id'),
  values: { title: 'Updated Title' },
});
const updated = await db.getRepository('posts').findOne({ filterByTk: post.get('id') });
expect(updated.get('title')).toBe('Updated Title');
```

### Тестирование ассоциаций моделей

```ts
const Users = db.collection({
  name: 'users',
  fields: [
    { type: 'string', name: 'username' },
    { type: 'hasMany', name: 'posts' },
  ],
});

const Posts = db.collection({
  name: 'posts',
  fields: [
    { type: 'string', name: 'title' },
    { type: 'belongsTo', name: 'author' },
  ],
});
await db.sync();

const user = await db.getRepository('users').create({ values: { username: 'tester' } });
await db.getRepository('posts').create({
  values: { title: 'Post 1', authorId: user.get('id') },
});

const result = await db.getRepository('users').findOne({
  filterByTk: user.get('id'),
  appends: ['posts'],
});
expect(result.get('posts')).toHaveLength(1);
```

## Использование `createMockServer` для тестирования API

`createMockServer` автоматически создает полный экземпляр приложения, включая базу данных, плагины и маршруты API, что делает его идеальным для тестирования интерфейсов плагинов.

### Базовый пример

```ts
import { createMockServer, MockServer } from '@nocobase/test';

describe('User API test', () => {
  let app: MockServer;

  beforeEach(async () => {
    app = await createMockServer({ plugins: ['users', 'auth'] });
  });

  afterEach(async () => {
    await app.destroy();
  });

  it('should create a user', async () => {
    const response = await app.agent()
      .post('/users:create')
      .send({ username: 'test', email: 'a@b.com', password: '123456' });

    expect(response.status).toBe(200);
    expect(response.body.username).toBe('test');
  });
});
```

### Тестирование запросов и обновлений API

```ts
// Запросить список пользователей
const list = await app.agent().get('/users:list');
expect(list.body.rows.length).toBeGreaterThan(0);

// Обновить пользователя
const update = await app.agent().post(`/users:update/${id}`).send({ username: 'newname' });
expect(update.body.username).toBe('newname');
```

### Имитация статуса входа или проверка разрешений

Вы можете включить плагин `auth` при создании `MockServer`, а затем использовать интерфейс входа в систему для получения токена или сессии:

```ts
const res = await app
  .agent()
  .post('/auth:signin')
  .send({ 
    username: 'admin',
    password: 'admin123',
  });

const token = res.body.data.token;

await app
  .agent()
  .set('Authorization', `Bearer ${token}`)
  .get('/protected-endpoint');
```

Вы также можете использовать более простой метод `login()`.

```ts
await app.agent().login(userOrId);
```

## Организация тестовых файлов в плагинах

Рекомендуется хранить тестовые файлы, связанные с логикой на стороне сервера, в папке `./src/server/__tests__` плагина.

```bash
packages/plugins/@my-project/plugin-hello/
├── src/                     # Каталог исходного кода
│   └── server/              # Код серверной части
│       ├── __tests__/       # Каталог тестовых файлов
│       │   ├── db.test.ts   # Тесты, связанные с базой данных (с использованием createMockDatabase)
│       │   └── api.test.ts  # Тесты, связанные с API
```

## Запуск тестов

```bash
# Указать каталог
yarn test packages/plugins/@my-project/plugin-hello/src/server
# Указать файл
yarn test packages/plugins/@my-project/plugin-hello/src/server/__tests__/db.test.ts
```