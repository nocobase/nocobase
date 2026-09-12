---
title: "Test Plugin Server"
description: "Unit test, integration test, Mock, alat test untuk plugin server NocoBase."
keywords: "test plugin,unit test,integration test,test server,NocoBase"
---

# Test Pengujian

NocoBase menyediakan toolset test yang lengkap, untuk membantu Anda dengan cepat memvalidasi kebenaran logika database, API endpoint, dan implementasi fitur selama pengembangan plugin.

## Mengapa Menulis Test

Manfaat menulis automated test dalam pengembangan plugin:

- Validasi cepat apakah model database, API, logika bisnis benar  
- Menghindari error regresi (otomatis mendeteksi kompatibilitas plugin setelah upgrade core)  
- Mendukung continuous integration (CI) menjalankan test otomatis di environment  
- Mendukung testing fungsionalitas plugin tanpa menjalankan service lengkap  

## Dasar Environment Test

NocoBase menyediakan dua tools test inti:

| Tool | Penjelasan | Tujuan |
|------|------|------|
| `createMockDatabase` | Membuat instance database memori | Test model dan logika database |
| `createMockServer` | Membuat instance aplikasi lengkap (termasuk database, plugin, API, dll.) | Test alur bisnis dan perilaku endpoint |

## Test Database Menggunakan `createMockDatabase`

`createMockDatabase` cocok untuk test fungsi yang langsung terkait dengan database, seperti definisi model, tipe field, relasi, operasi CRUD, dll.

### Contoh Dasar

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

### Test Operasi CRUD

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

### Test Asosiasi Model

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

## Test API Menggunakan `createMockServer`

`createMockServer` akan otomatis membuat instance aplikasi lengkap yang berisi database, plugin, route API, cocok untuk test endpoint plugin.

### Contoh Dasar

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

### Test Query dan Update Endpoint

```ts
// Query daftar pengguna
const list = await app.agent().get('/users:list');
expect(list.body.rows.length).toBeGreaterThan(0);

// Update pengguna
const update = await app.agent().post(`/users:update/${id}`).send({ username: 'newname' });
expect(update.body.username).toBe('newname');
```

### Mensimulasikan Status Login atau Test Hak Akses

Anda dapat mengaktifkan plugin `auth` saat membuat `MockServer`, kemudian gunakan endpoint login untuk mendapatkan token atau session:

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

Juga dapat menggunakan method `login()` yang lebih sederhana:

```ts
await app.agent().login(userOrId);
```

## Mengorganisir File Test dalam Plugin

Disarankan menyimpan file test yang terkait dengan logika server di folder `./src/server/__tests__` plugin.

```bash
packages/plugins/@my-project/plugin-hello/
├── src/                     # Direktori source code
│   └── server/              # Kode server
│       ├── __tests__/       # Direktori file test
│       │   ├── db.test.ts   # Test terkait database (menggunakan createMockDatabase)
│       │   └── api.test.ts  # Test terkait API
```

## Menjalankan Test

```bash
# Tentukan direktori
yarn test packages/plugins/@my-project/plugin-hello/src/server
# Tentukan file
yarn test packages/plugins/@my-project/plugin-hello/src/server/__tests__/db.test.ts
```

## Tautan Terkait

- [Plugin](./plugin.md) — Siklus hidup plugin dan API inti
- [Collections Tabel Data](./collections.md) — Definisi dan konfigurasi tabel data
- [Database](./database.md) — Operasi database dan API Repository
- [Ikhtisar Pengembangan Server](./index.md) — Ringkasan setiap modul server
- [Ikhtisar Plugin Development](../index.md) — Pengantar menyeluruh tentang plugin development
