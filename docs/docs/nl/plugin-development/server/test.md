:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::

# Testen

NocoBase biedt een complete set testtools om ontwikkelaars te helpen bij het snel verifiëren van de correctheid van databaselogica, API-interfaces en functionaliteitsimplementaties tijdens de ontwikkeling van plugins. Deze handleiding beschrijft hoe u deze tests schrijft, uitvoert en organiseert.

## Waarom tests schrijven

Voordelen van het schrijven van geautomatiseerde tests bij pluginontwikkeling:

- Snel verifiëren of databasemodellen, API's en bedrijfslogica correct zijn
- Regressiefouten voorkomen (automatisch de plugincompatibiliteit detecteren na core-upgrades)
- Ondersteuning voor het automatisch uitvoeren van tests in Continuous Integration (CI)-omgevingen
- Ondersteuning voor het testen van pluginfunctionaliteit zonder de volledige service te starten

## Basisprincipes van de testomgeving

NocoBase biedt twee essentiële testtools:

| Tool                 | Beschrijving                                           | Doel                                             |
| -------------------- | ------------------------------------------------------ | ------------------------------------------------ |
| `createMockDatabase` | Maakt een in-memory database-instantie aan             | Test databasemodellen en -logica                 |
| `createMockServer`   | Maakt een complete applicatie-instantie aan (incl. database, plugins, API's, etc.) | Test bedrijfsprocessen en API-gedrag             |

## `createMockDatabase` gebruiken voor databasetests

`createMockDatabase` is geschikt voor het testen van functionaliteit die direct gerelateerd is aan databases, zoals modeldefinities, veldtypen, relaties, CRUD-bewerkingen, enz.

### Basisvoorbeeld

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

### CRUD-bewerkingen testen

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

### Modelrelaties testen

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

## `createMockServer` gebruiken voor API-tests

`createMockServer` creëert automatisch een complete applicatie-instantie, inclusief database, plugins en API-routes, waardoor het ideaal is voor het testen van plugin-interfaces.

### Basisvoorbeeld

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

### API-query's en -updates testen

```ts
// Query user list
const list = await app.agent().get('/users:list');
expect(list.body.rows.length).toBeGreaterThan(0);

// Update user
const update = await app.agent().post(`/users:update/${id}`).send({ username: 'newname' });
expect(update.body.username).toBe('newname');
```

### Inlogstatus of rechten testen simuleren

U kunt de `auth`-plugin inschakelen bij het aanmaken van een `MockServer`, en vervolgens de login-interface gebruiken om een token of sessie te verkrijgen:

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

U kunt ook de eenvoudigere `login()`-methode gebruiken

```ts
await app.agent().login(userOrId);
```

## Testbestanden organiseren in plugins

Het wordt aanbevolen om testbestanden die gerelateerd zijn aan server-side logica op te slaan in de `./src/server/__tests__`-map van de plugin.

```bash
packages/plugins/@my-project/plugin-hello/
├── src/                     # Map met broncode
│   └── server/              # Server-side code
│       ├── __tests__/       # Map met testbestanden
│       │   ├── db.test.ts   # Databaserelateerde tests (met createMockDatabase)
│       │   └── api.test.ts  # API-gerelateerde tests
```

## Tests uitvoeren

```bash
# Map specificeren
yarn test packages/plugins/@my-project/plugin-hello/src/server
# Bestand specificeren
yarn test packages/plugins/@my-project/plugin-hello/src/server/__tests__/db.test.ts
```