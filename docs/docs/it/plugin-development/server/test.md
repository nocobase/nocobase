:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::

# Test

NocoBase offre un set completo di strumenti di test per aiutare gli sviluppatori a verificare rapidamente la correttezza della logica del database, delle interfacce API e dell'implementazione delle funzionalità durante lo sviluppo dei plugin. Questa guida Le mostrerà come scrivere, eseguire e organizzare questi test.

## Perché scrivere test

I vantaggi di scrivere test automatizzati nello sviluppo di plugin:

- Verificare rapidamente la correttezza dei modelli di database, delle API e della logica di business.
- Evitare errori di regressione (rilevamento automatico della compatibilità dei plugin dopo gli aggiornamenti del core).
- Supportare gli ambienti di integrazione continua (CI) per l'esecuzione automatica dei test.
- Supportare il testing delle funzionalità dei plugin senza avviare il servizio completo.

## Basi dell'ambiente di test

NocoBase fornisce due strumenti di test principali:

| Strumento | Descrizione | Scopo |
|-----------|-------------|-------|
| `createMockDatabase` | Crea un'istanza di database in memoria | Testare modelli e logica del database |
| `createMockServer` | Crea un'istanza completa dell'applicazione (include database, plugin, API, ecc.) | Testare processi di business e comportamento delle interfacce |

## Utilizzo di `createMockDatabase` per i test del database

`createMockDatabase` è adatto per testare funzionalità direttamente correlate ai database, come definizioni di modelli, tipi di campo, relazioni, operazioni CRUD e altro.

### Esempio di base

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

### Test delle operazioni CRUD

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

### Test delle associazioni tra modelli

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

## Utilizzo di `createMockServer` per i test delle API

`createMockServer` crea automaticamente un'istanza completa dell'applicazione che include database, plugin e route API, rendendolo ideale per testare le interfacce dei plugin.

### Esempio di base

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

### Test di query e aggiornamenti delle API

```ts
// Query user list
const list = await app.agent().get('/users:list');
expect(list.body.rows.length).toBeGreaterThan(0);

// Update user
const update = await app.agent().post(`/users:update/${id}`).send({ username: 'newname' });
expect(update.body.username).toBe('newname');
```

### Simulazione dello stato di accesso o test dei permessi

Può abilitare il plugin `auth` durante la creazione di `MockServer`, quindi utilizzare l'interfaccia di accesso per ottenere un token o una sessione:

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

Può anche utilizzare il metodo `login()` più semplice

```ts
await app.agent().login(userOrId);
```

## Organizzazione dei file di test nei plugin

Si consiglia di archiviare i file di test relativi alla logica lato server nella cartella `./src/server/__tests__` del plugin.

```bash
packages/plugins/@my-project/plugin-hello/
├── src/                     # Source code directory
│   └── server/              # Server-side code
│       ├── __tests__/       # Test files directory
│       │   ├── db.test.ts   # Database related tests (using createMockDatabase)
│       │   └── api.test.ts  # API related tests
```

## Esecuzione dei test

```bash
# Specify directory
yarn test packages/plugins/@my-project/plugin-hello/src/server
# Specify file
yarn test packages/plugins/@my-project/plugin-hello/src/server/__tests__/db.test.ts
```