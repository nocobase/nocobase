:::tip Уведомление о переводе ИИ
Эта документация была автоматически переведена ИИ.
:::

# Тестирование

NocoBase предлагает полный набор инструментов для тестирования, которые помогают разработчикам быстро проверять корректность логики базы данных, API-интерфейсов и реализации функционала в процессе разработки плагинов. В этом руководстве мы расскажем, как писать, запускать и организовывать эти тесты.

## Зачем писать тесты

Преимущества написания автоматизированных тестов при разработке плагинов:

- Быстрая проверка корректности моделей базы данных, API и бизнес-логики.
- Предотвращение регрессионных ошибок (автоматическая проверка совместимости плагинов после обновления ядра).
- Поддержка автоматического запуска тестов в средах непрерывной интеграции (CI).
- Возможность тестирования функционала плагинов без запуска полного сервиса.

## Основы тестовой среды

NocoBase предоставляет два основных инструмента для тестирования:

| Инструмент | Описание | Назначение |
|-----------|-----------|------------|
| `createMockDatabase` | Создает экземпляр базы данных в памяти | Тестирование моделей и логики базы данных |
| `createMockServer` | Создает полный экземпляр приложения (включая базу данных, плагины, API и т.д.) | Тестирование бизнес-процессов и поведения интерфейсов |

## Использование `createMockDatabase` для тестирования базы данных

`createMockDatabase` подходит для тестирования функционала, напрямую связанного с базами данных, такого как определения моделей, типы полей, связи, операции CRUD и т.д.

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

### Тестирование операций CRUD

```ts
const Posts = db.collection({
  name: 'posts',
  fields: [{ type: 'string', name: 'title' }],
});
await db.sync();

// Create
const post = await db.getRepository('posts').create({ values: { title: 'Initial Title' } });
expect(post.get('title')).toBe('Initial Title');

// Update
await db.getRepository('posts').update({
  filterByTk: post.get('id'),
  values: { title: 'Updated Title' },
});
const updated = await db.getRepository('posts').findOne({ filterByTk: post.get('id') });
expect(updated.get('title')).toBe('Updated Title');
```

### Тестирование связей моделей

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

`createMockServer` автоматически создает полный экземпляр приложения, включающий базу данных, плагины и API-маршруты, что делает его идеальным для тестирования интерфейсов плагинов.

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
// Query user list
const list = await app.agent().get('/users:list');
expect(list.body.rows.length).toBeGreaterThan(0);

// Update user
const update = await app.agent().post(`/users:update/${id}`).send({ username: 'newname' });
expect(update.body.username).toBe('newname');
```

### Имитация статуса входа или тестирование разрешений

Вы можете включить плагин `auth` при создании `MockServer`, а затем использовать интерфейс входа для получения токена или сессии:

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

Также можно использовать более простой метод `login()`

```ts
await app.agent().login(userOrId);
```

## Организация тестовых файлов в плагинах

Рекомендуется хранить файлы тестов, связанные с серверной логикой, в папке `./src/server/__tests__` вашего плагина.

```bash
packages/plugins/@my-project/plugin-hello/
├── src/                     # Source code directory
│   └── server/              # Server-side code
│       ├── __tests__/       # Test files directory
│       │   ├── db.test.ts   # Database related tests (using createMockDatabase)
│       │   └── api.test.ts  # API related tests
```

## Запуск тестов

```bash
# Specify directory
yarn test packages/plugins/@my-project/plugin-hello/src/server
# Specify file
yarn test packages/plugins/@my-project/plugin-hello/src/server/__tests__/db.test.ts
```