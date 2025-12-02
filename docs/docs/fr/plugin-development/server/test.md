:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::

# Tests

NocoBase met à votre disposition un ensemble complet d'outils de test pour aider les développeurs à vérifier rapidement l'exactitude de la logique de la base de données, des interfaces API et des implémentations de fonctionnalités lors du développement de plugins. Ce guide vous expliquera comment écrire, exécuter et organiser ces tests.

## Pourquoi rédiger des tests ?

Avantages de rédiger des tests automatisés lors du développement de plugins :

- Vérifier rapidement l'exactitude des modèles de base de données, des API et de la logique métier.
- Éviter les erreurs de régression (détection automatique de la compatibilité des plugins après les mises à niveau du cœur).
- Permettre l'exécution automatique des tests dans les environnements d'intégration continue (CI).
- Tester les fonctionnalités des plugins sans avoir à démarrer le service complet.

## Bases de l'environnement de test

NocoBase met à votre disposition deux outils de test essentiels :

| Outil                | Description                                                 | Objectif                                            |
| ------------------- | ----------------------------------------------------------- | --------------------------------------------------- |
| `createMockDatabase` | Créer une instance de base de données en mémoire            | Tester les modèles et la logique de la base de données |
| `createMockServer`   | Créer une instance d'application complète (incluant base de données, plugins, API, etc.) | Tester les processus métier et le comportement des interfaces |

## Utiliser `createMockDatabase` pour les tests de base de données

`createMockDatabase` est idéal pour tester les fonctionnalités directement liées aux bases de données, telles que les définitions de modèles, les types de champs, les relations, les opérations CRUD, etc.

### Exemple de base

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

### Tester les opérations CRUD

```ts
const Posts = db.collection({
  name: 'posts',
  fields: [{ type: 'string', name: 'title' }],
});
await db.sync();

// Créer
const post = await db.getRepository('posts').create({ values: { title: 'Initial Title' } });
expect(post.get('title')).toBe('Initial Title');

// Mettre à jour
await db.getRepository('posts').update({
  filterByTk: post.get('id'),
  values: { title: 'Updated Title' },
});
const updated = await db.getRepository('posts').findOne({ filterByTk: post.get('id') });
expect(updated.get('title')).toBe('Updated Title');
```

### Tester les associations de modèles

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

## Utiliser `createMockServer` pour les tests d'API

`createMockServer` crée automatiquement une instance d'application complète incluant la base de données, les plugins et les routes API, ce qui le rend idéal pour tester les interfaces de vos plugins.

### Exemple de base

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

### Tester les requêtes et les mises à jour d'API

```ts
// Interroger la liste des utilisateurs
const list = await app.agent().get('/users:list');
expect(list.body.rows.length).toBeGreaterThan(0);

// Mettre à jour l'utilisateur
const update = await app.agent().post(`/users:update/${id}`).send({ username: 'newname' });
expect(update.body.username).toBe('newname');
```

### Simuler l'état de connexion ou tester les permissions

Vous pouvez activer le plugin `auth` lors de la création de `MockServer`, puis utiliser l'interface de connexion pour obtenir un jeton (token) ou une session :

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

Vous pouvez également utiliser la méthode `login()` plus simple :

```ts
await app.agent().login(userOrId);
```

## Organiser les fichiers de test dans les plugins

Nous vous recommandons de stocker les fichiers de test liés à la logique côté serveur dans le dossier `./src/server/__tests__` de votre plugin.

```bash
packages/plugins/@my-project/plugin-hello/
├── src/                     # Répertoire du code source
│   └── server/              # Code côté serveur
│       ├── __tests__/       # Répertoire des fichiers de test
│       │   ├── db.test.ts   # Tests liés à la base de données (avec createMockDatabase)
│       │   └── api.test.ts  # Tests liés aux API
```

## Exécuter les tests

```bash
# Spécifier le répertoire
yarn test packages/plugins/@my-project/plugin-hello/src/server
# Spécifier le fichier
yarn test packages/plugins/@my-project/plugin-hello/src/server/__tests__/db.test.ts
```