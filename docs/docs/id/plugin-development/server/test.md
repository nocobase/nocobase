:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::

## Pengujian

NocoBase menyediakan seperangkat alat pengujian lengkap untuk membantu pengembang memverifikasi kebenaran logika basis data, antarmuka API, dan implementasi fitur dengan cepat selama pengembangan **plugin**. Panduan ini akan menjelaskan cara menulis, menjalankan, dan mengelola pengujian tersebut.

## Mengapa Menulis Pengujian

Manfaat menulis pengujian otomatis dalam pengembangan **plugin**:

- Memverifikasi model basis data, API, dan logika bisnis dengan cepat
- Menghindari kesalahan regresi (secara otomatis mendeteksi kompatibilitas **plugin** setelah pembaruan inti)
- Mendukung lingkungan integrasi berkelanjutan (CI) untuk menjalankan pengujian secara otomatis
- Mendukung pengujian fungsionalitas **plugin** tanpa memulai layanan lengkap

## Dasar-dasar Lingkungan Pengujian

NocoBase menyediakan dua alat pengujian inti:

| Alat | Deskripsi | Tujuan |
|------|-----------|--------|
| `createMockDatabase` | Membuat instans basis data dalam memori | Menguji model dan logika basis data |
| `createMockServer` | Membuat instans aplikasi lengkap (termasuk basis data, **plugin**, API, dll.) | Menguji proses bisnis dan perilaku antarmuka |

## Menggunakan `createMockDatabase` untuk Pengujian Basis Data

`createMockDatabase` cocok untuk menguji fungsionalitas yang berhubungan langsung dengan basis data, seperti definisi model, tipe bidang, relasi, operasi CRUD, dan lain-lain.

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

### Menguji Operasi CRUD

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

### Menguji Asosiasi Model

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

## Menggunakan `createMockServer` untuk Pengujian API

`createMockServer` secara otomatis membuat instans aplikasi lengkap yang mencakup basis data, **plugin**, dan rute API, sehingga sangat ideal untuk menguji antarmuka **plugin**.

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

### Menguji Kueri dan Pembaruan API

```ts
// Query user list
const list = await app.agent().get('/users:list');
expect(list.body.rows.length).toBeGreaterThan(0);

// Update user
const update = await app.agent().post(`/users:update/${id}`).send({ username: 'newname' });
expect(update.body.username).toBe('newname');
```

### Mensimulasikan Status Login atau Pengujian Izin

Anda dapat mengaktifkan **plugin** `auth` saat membuat `MockServer`, lalu menggunakan antarmuka login untuk mendapatkan token atau sesi:

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

Anda juga bisa menggunakan metode `login()` yang lebih sederhana

```ts
await app.agent().login(userOrId);
```

## Mengelola Berkas Pengujian dalam **Plugin**

Disarankan untuk menyimpan berkas pengujian yang terkait dengan logika sisi server di folder `./src/server/__tests__` pada **plugin**.

```bash
packages/plugins/@my-project/plugin-hello/
├── src/                     # Source code directory
│   └── server/              # Server-side code
│       ├── __tests__/       # Test files directory
│       │   ├── db.test.ts   # Database related tests (using createMockDatabase)
│       │   └── api.test.ts  # API related tests
```

## Menjalankan Pengujian

```bash
# Tentukan direktori
yarn test packages/plugins/@my-project/plugin-hello/src/server
# Tentukan berkas
yarn test packages/plugins/@my-project/plugin-hello/src/server/__tests__/db.test.ts
```