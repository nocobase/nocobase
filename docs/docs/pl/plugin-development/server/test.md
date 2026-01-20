:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::

# Testowanie

NocoBase oferuje kompletny zestaw narzędzi testowych, które pomagają deweloperom szybko weryfikować poprawność logiki bazy danych, interfejsów API oraz implementacji funkcji podczas tworzenia wtyczek. W tym przewodniku dowiedzą się Państwo, jak pisać, uruchamiać i organizować te testy.

## Dlaczego warto pisać testy

Korzyści z pisania testów automatycznych podczas tworzenia wtyczek:

- Szybka weryfikacja poprawności modeli bazy danych, API i logiki biznesowej
- Unikanie błędów regresji (automatyczne wykrywanie kompatybilności wtyczek po aktualizacji rdzenia)
- Wsparcie dla środowisk ciągłej integracji (CI) w celu automatycznego uruchamiania testów
- Możliwość testowania funkcjonalności wtyczek bez uruchamiania pełnej usługi

## Podstawy środowiska testowego

NocoBase udostępnia dwa podstawowe narzędzia testowe:

| Narzędzie | Opis | Cel |
|---|---|---|
| `createMockDatabase` | Tworzy instancję bazy danych w pamięci | Testowanie modeli i logiki bazy danych |
| `createMockServer` | Tworzy kompletną instancję aplikacji (z bazą danych, wtyczkami, API itp.) | Testowanie procesów biznesowych i zachowania interfejsów |

## Używanie `createMockDatabase` do testowania bazy danych

`createMockDatabase` jest idealne do testowania funkcji bezpośrednio związanych z bazą danych, takich jak definicje modeli, typy pól, relacje, operacje CRUD itp.

### Podstawowy przykład

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

### Testowanie operacji CRUD

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

### Testowanie powiązań modeli

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

## Używanie `createMockServer` do testowania API

`createMockServer` automatycznie tworzy kompletną instancję aplikacji, zawierającą bazę danych, wtyczki i trasy API, co czyni ją idealną do testowania interfejsów wtyczek.

### Podstawowy przykład

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

### Testowanie zapytań i aktualizacji API

```ts
// Query user list
const list = await app.agent().get('/users:list');
expect(list.body.rows.length).toBeGreaterThan(0);

// Update user
const update = await app.agent().post(`/users:update/${id}`).send({ username: 'newname' });
expect(update.body.username).toBe('newname');
```

### Symulowanie statusu logowania lub testowanie uprawnień

Mogą Państwo włączyć wtyczkę `auth` podczas tworzenia `MockServer`, a następnie użyć interfejsu logowania, aby uzyskać token lub sesję:

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

Mogą Państwo również użyć prostszej metody `login()`

```ts
await app.agent().login(userOrId);
```

## Organizowanie plików testowych we wtyczkach

Zaleca się przechowywanie plików testowych związanych z logiką po stronie serwera w folderze `./src/server/__tests__` wtyczki.

```bash
packages/plugins/@my-project/plugin-hello/
├── src/                     # Source code directory
│   └── server/              # Server-side code
│       ├── __tests__/       # Test files directory
│       │   ├── db.test.ts   # Database related tests (using createMockDatabase)
│       │   └── api.test.ts  # API related tests
```

## Uruchamianie testów

```bash
# Specify directory
yarn test packages/plugins/@my-project/plugin-hello/src/server
# Specify file
yarn test packages/plugins/@my-project/plugin-hello/src/server/__tests__/db.test.ts
```