:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::


# Testování

NocoBase nabízí kompletní sadu testovacích nástrojů, které vývojářům pomáhají rychle ověřit správnost databázové logiky, API rozhraní a implementace funkcí během vývoje **pluginů**. Tento článek představí, jak tyto testy psát, spouštět a organizovat.

## Proč psát testy

Výhody psaní automatizovaných testů při vývoji **pluginů**:

- Rychle ověříte správnost databázových modelů, API a obchodní logiky.
- Předejdete regresním chybám (automatická detekce kompatibility **pluginů** po aktualizaci jádra).
- Podporuje automatické spouštění testů v prostředí kontinuální integrace (CI).
- Umožňuje testovat funkcionalitu **pluginů** bez spuštění kompletní služby.

## Základy testovacího prostředí

NocoBase poskytuje dva klíčové testovací nástroje:

| Nástroj | Popis | Účel |
|---|---|---|
| `createMockDatabase` | Vytvoří instanci databáze v paměti | Testování databázových modelů a logiky |
| `createMockServer` | Vytvoří kompletní instanci aplikace (včetně databáze, **pluginů**, API atd.) | Testování obchodních procesů a chování rozhraní |

## Použití `createMockDatabase` pro testování databáze

`createMockDatabase` je vhodný pro testování funkcionality přímo související s databázemi, jako jsou definice modelů, typy polí, vztahy, CRUD operace a podobně.

### Základní příklad

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

### Testování CRUD operací

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

### Testování asociací modelů

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

## Použití `createMockServer` pro testování API

`createMockServer` automaticky vytvoří kompletní instanci aplikace, která zahrnuje databázi, **pluginy** a API routy, což je ideální pro testování rozhraní **pluginů**.

### Základní příklad

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

### Testování dotazů a aktualizací API

```ts
// Query user list
const list = await app.agent().get('/users:list');
expect(list.body.rows.length).toBeGreaterThan(0);

// Update user
const update = await app.agent().post(`/users:update/${id}`).send({ username: 'newname' });
expect(update.body.username).toBe('newname');
```

### Simulace stavu přihlášení nebo testování oprávnění

Při vytváření `MockServer` můžete povolit **plugin** `auth` a poté použít přihlašovací rozhraní k získání tokenu nebo session:

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

Můžete také použít jednodušší metodu `login()`:

```ts
await app.agent().login(userOrId);
```

## Organizace testovacích souborů v **pluginech**

Doporučujeme ukládat testovací soubory související s logikou na straně serveru do složky `./src/server/__tests__` vašeho **pluginu**.

```bash
packages/plugins/@my-project/plugin-hello/
├── src/                     # Adresář zdrojového kódu
│   └── server/              # Kód na straně serveru
│       ├── __tests__/       # Adresář testovacích souborů
│       │   ├── db.test.ts   # Testy související s databází (používající createMockDatabase)
│       │   └── api.test.ts  # Testy související s API
```

## Spouštění testů

```bash
# Určení adresáře
yarn test packages/plugins/@my-project/plugin-hello/src/server
# Určení souboru
yarn test packages/plugins/@my-project/plugin-hello/src/server/__tests__/db.test.ts
```