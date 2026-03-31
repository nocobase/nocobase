:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::

# Test

NocoBase bietet eine umfassende Suite von Testwerkzeugen, die Entwicklern dabei helfen, die Korrektheit von Datenbanklogik, API-Schnittstellen und Funktionsimplementierungen während der Plugin-Entwicklung schnell zu überprüfen. Dieser Leitfaden erklärt, wie Sie diese Tests schreiben, ausführen und organisieren.

## Warum Tests schreiben?

Vorteile des Schreibens automatisierter Tests in der Plugin-Entwicklung:

- Schnelle Überprüfung der Korrektheit von Datenbankmodellen, APIs und Geschäftslogik
- Vermeidung von Regressionsfehlern (automatische Erkennung der Plugin-Kompatibilität nach Kern-Upgrades)
- Unterstützung von Continuous Integration (CI)-Umgebungen für die automatische Ausführung von Tests
- Ermöglicht das Testen der Plugin-Funktionalität, ohne den vollständigen Dienst starten zu müssen

## Grundlagen der Testumgebung

NocoBase stellt zwei zentrale Testwerkzeuge zur Verfügung:

| Werkzeug | Beschreibung | Zweck |
|----------|--------------|-------|
| `createMockDatabase` | Erstellt eine In-Memory-Datenbankinstanz | Zum Testen von Datenbankmodellen und -logik |
| `createMockServer` | Erstellt eine vollständige Anwendungsinstanz (inkl. Datenbank, Plugins, APIs usw.) | Zum Testen von Geschäftsprozessen und Schnittstellenverhalten |

## Datenbanktests mit `createMockDatabase`

`createMockDatabase` eignet sich hervorragend zum Testen von Funktionen, die direkt mit Datenbanken zusammenhängen, wie Modelldefinitionen, Feldtypen, Beziehungen, CRUD-Operationen und Ähnliches.

### Grundlegendes Beispiel

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

### Testen von CRUD-Operationen

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

### Testen von Modellbeziehungen

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

## API-Tests mit `createMockServer`

`createMockServer` erstellt automatisch eine vollständige Anwendungsinstanz, die eine Datenbank, Plugins und API-Routen umfasst. Dies macht es ideal zum Testen von Plugin-Schnittstellen.

### Grundlegendes Beispiel

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

### Testen von API-Abfragen und -Updates

```ts
// Query user list
const list = await app.agent().get('/users:list');
expect(list.body.rows.length).toBeGreaterThan(0);

// Update user
const update = await app.agent().post(`/users:update/${id}`).send({ username: 'newname' });
expect(update.body.username).toBe('newname');
```

### Simulation des Anmeldestatus oder von Berechtigungstests

Sie können das `auth`-Plugin beim Erstellen von `MockServer` aktivieren und dann die Anmeldeschnittstelle verwenden, um einen Token oder eine Session zu erhalten:

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

Alternativ können Sie auch die einfachere `login()`-Methode verwenden:

```ts
await app.agent().login(userOrId);
```

## Testdateien in Plugins organisieren

Es wird empfohlen, testbezogene Dateien für die serverseitige Logik im Ordner `./src/server/__tests__` des Plugins abzulegen.

```bash
packages/plugins/@my-project/plugin-hello/
├── src/                     # Quellcode-Verzeichnis
│   └── server/              # Serverseitiger Code
│       ├── __tests__/       # Verzeichnis für Testdateien
│       │   ├── db.test.ts   # Datenbankbezogene Tests (mit createMockDatabase)
│       │   └── api.test.ts  # API-bezogene Tests
```

## Tests ausführen

```bash
# Verzeichnis angeben
yarn test packages/plugins/@my-project/plugin-hello/src/server
# Datei angeben
yarn test packages/plugins/@my-project/plugin-hello/src/server/__tests__/db.test.ts
```