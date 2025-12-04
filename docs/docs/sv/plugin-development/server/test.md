:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::

# Test

NocoBase erbjuder en komplett uppsättning testverktyg som hjälper utvecklare att snabbt verifiera korrektheten i databaslogik, API-gränssnitt och funktionsimplementeringar under utvecklingen av en **plugin**. Den här guiden beskriver hur ni skriver, kör och organiserar dessa tester.

## Varför skriva tester?

Fördelarna med att skriva automatiserade tester vid **plugin**-utveckling:

- Snabbt verifiera att databasmodeller, API:er och affärslogik är korrekta
- Undvika regressionsfel (upptäcker automatiskt **plugin**-kompatibilitet efter uppgraderingar av kärnan)
- Stödja att tester körs automatiskt i miljöer för kontinuerlig integration (CI)
- Möjliggöra testning av **plugin**-funktionalitet utan att starta hela tjänsten

## Grundläggande testmiljö

NocoBase tillhandahåller två centrala testverktyg:

| Verktyg | Beskrivning | Syfte |
|------|------|-------|
| `createMockDatabase` | Skapar en databasinstans i minnet | Testar databasmodeller och logik |
| `createMockServer` | Skapar en komplett applikationsinstans (inkluderar databas, plugin, API:er, etc.) | Testar affärsprocesser och gränssnittsbeteende |

## Använda `createMockDatabase` för databastestning

`createMockDatabase` är lämpligt för att testa funktionalitet som är direkt relaterad till databaser, såsom modelldefinitioner, fälttyper, relationer, CRUD-operationer med mera.

### Grundläggande exempel

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

### Testa CRUD-operationer

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

### Testa modellassociationer

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

## Använda `createMockServer` för API-testning

`createMockServer` skapar automatiskt en komplett applikationsinstans som inkluderar databas, **plugin** och API-vägar, vilket gör det idealiskt för att testa **plugin**-gränssnitt.

### Grundläggande exempel

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

### Testa API-frågor och uppdateringar

```ts
// Query user list
const list = await app.agent().get('/users:list');
expect(list.body.rows.length).toBeGreaterThan(0);

// Update user
const update = await app.agent().post(`/users:update/${id}`).send({ username: 'newname' });
expect(update.body.username).toBe('newname');
```

### Simulera inloggningsstatus eller behörighetstestning

Ni kan aktivera **plugin**-en `auth` när ni skapar `MockServer`, och sedan använda inloggningsgränssnittet för att få en token eller session:

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

Ni kan också använda den enklare metoden `login()`

```ts
await app.agent().login(userOrId);
```

## Organisera testfiler i plugin

Vi rekommenderar att ni lagrar testfiler relaterade till serverlogik i **plugin**-ens mapp `./src/server/__tests__`.

```bash
packages/plugins/@my-project/plugin-hello/
├── src/                     # Source code directory
│   └── server/              # Server-side code
│       ├── __tests__/       # Test files directory
│       │   ├── db.test.ts   # Database related tests (using createMockDatabase)
│       │   └── api.test.ts  # API related tests
```

## Köra tester

```bash
# Specify directory
yarn test packages/plugins/@my-project/plugin-hello/src/server
# Specify file
yarn test packages/plugins/@my-project/plugin-hello/src/server/__tests__/db.test.ts
```