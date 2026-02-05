:::tip Повідомлення про переклад ШІ
Ця документація була автоматично перекладена штучним інтелектом.
:::


# Тестування

NocoBase пропонує повний набір інструментів для тестування, які допомагають розробникам швидко перевіряти коректність логіки бази даних, API-інтерфейсів та реалізації функціоналу під час розробки плагінів. У цьому посібнику ми розповімо, як писати, запускати та організовувати ці тести.

## Навіщо писати тести

Переваги написання автоматизованих тестів під час розробки плагінів:

- Швидка перевірка коректності моделей бази даних, API та бізнес-логіки.
- Запобігання регресійним помилкам (автоматичне виявлення сумісності плагінів після оновлення ядра).
- Підтримка автоматичного запуску тестів у середовищах безперервної інтеграції (CI).
- Можливість тестування функціоналу плагінів без запуску повного сервісу.

## Основи тестового середовища

NocoBase надає два основні інструменти для тестування:

| Інструмент | Опис | Призначення |
|-----------|------|-------------|
| `createMockDatabase` | Створює екземпляр бази даних у пам'яті | Тестування моделей та логіки бази даних |
| `createMockServer` | Створює повний екземпляр застосунку (включаючи базу даних, плагіни, API тощо) | Тестування бізнес-процесів та поведінки інтерфейсів |

## Використання `createMockDatabase` для тестування бази даних

`createMockDatabase` ідеально підходить для тестування функціоналу, безпосередньо пов'язаного з базами даних, такого як визначення моделей, типи полів, зв'язки, CRUD-операції тощо.

### Базовий приклад

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

### Тестування CRUD-операцій

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

### Тестування зв'язків моделей

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

## Використання `createMockServer` для тестування API

`createMockServer` автоматично створює повний екземпляр застосунку, що включає базу даних, плагіни та API-маршрути, що робить його ідеальним для тестування інтерфейсів плагінів.

### Базовий приклад

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

### Тестування запитів та оновлень API

```ts
// Query user list
const list = await app.agent().get('/users:list');
expect(list.body.rows.length).toBeGreaterThan(0);

// Update user
const update = await app.agent().post(`/users:update/${id}`).send({ username: 'newname' });
expect(update.body.username).toBe('newname');
```

### Симуляція статусу входу або тестування дозволів

Ви можете увімкнути плагін `auth` під час створення `MockServer`, а потім використати інтерфейс входу для отримання токена або сесії:

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

Також можна скористатися простішим методом `login()`:

```ts
await app.agent().login(userOrId);
```

## Організація тестових файлів у плагінах

Рекомендується зберігати тестові файли, пов'язані з логікою на стороні сервера, у папці `./src/server/__tests__` вашого плагіна.

```bash
packages/plugins/@my-project/plugin-hello/
├── src/                     # Каталог вихідного коду
│   └── server/              # Код на стороні сервера
│       ├── __tests__/       # Каталог тестових файлів
│       │   ├── db.test.ts   # Тести, пов'язані з базою даних (використовуючи createMockDatabase)
│       │   └── api.test.ts  # Тести, пов'язані з API
```

## Запуск тестів

```bash
# Вказати каталог
yarn test packages/plugins/@my-project/plugin-hello/src/server
# Вказати файл
yarn test packages/plugins/@my-project/plugin-hello/src/server/__tests__/db.test.ts
```