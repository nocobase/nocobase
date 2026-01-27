:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::


# Test

NocoBase, eklenti geliştirme sürecinde veritabanı mantığının, API arayüzlerinin ve özellik uygulamalarının doğruluğunu hızlıca doğrulamanıza yardımcı olacak eksiksiz bir test araçları seti sunar. Bu makale, bu testleri nasıl yazacağınızı, çalıştıracağınızı ve organize edeceğinizi anlatacaktır.

## Neden Test Yazmalıyız?

Eklenti geliştirirken otomatik testler yazmanın faydaları şunlardır:

- Veritabanı modellerinin, API'lerin ve iş mantığının doğruluğunu hızla doğrulamanızı sağlar.
- Regresyon hatalarını önler (çekirdek yükseltmelerinden sonra eklenti uyumluluğunu otomatik olarak algılar).
- Sürekli entegrasyon (CI) ortamlarında testlerin otomatik olarak çalışmasını destekler.
- Tam hizmeti başlatmadan eklenti işlevselliğini test etmenize olanak tanır.

## Test Ortamı Temelleri

NocoBase iki temel test aracı sunar:

| Araç | Açıklama | Amaç |
|------|----------|-------|
| `createMockDatabase` | Bellek içi veritabanı örneği oluşturur | Veritabanı modellerini ve mantığını test etmek için |
| `createMockServer` | Tam bir uygulama örneği oluşturur (veritabanı, eklentiler, API'ler vb. dahil) | İş süreçlerini ve arayüz davranışlarını test etmek için |

## Veritabanı Testleri İçin `createMockDatabase` Kullanımı

`createMockDatabase`, model tanımları, alan türleri, ilişkiler, CRUD işlemleri gibi veritabanlarıyla doğrudan ilgili işlevleri test etmek için uygundur.

### Temel Örnek

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

### CRUD İşlemlerini Test Etme

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

### Model İlişkilerini Test Etme

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

## API Testleri İçin `createMockServer` Kullanımı

`createMockServer`, veritabanı, eklentiler ve API rotaları içeren eksiksiz bir uygulama örneğini otomatik olarak oluşturur ve bu da onu eklenti arayüzlerini test etmek için ideal kılar.

### Temel Örnek

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

### API Sorgularını ve Güncellemelerini Test Etme

```ts
// Query user list
const list = await app.agent().get('/users:list');
expect(list.body.rows.length).toBeGreaterThan(0);

// Update user
const update = await app.agent().post(`/users:update/${id}`).send({ username: 'newname' });
expect(update.body.username).toBe('newname');
```

### Oturum Açma Durumunu veya İzinleri Test Etme

`MockServer` oluştururken `auth` eklentisini etkinleştirebilir, ardından bir token veya oturum elde etmek için oturum açma arayüzünü kullanabilirsiniz:

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

Daha basit olan `login()` yöntemini de kullanabilirsiniz:

```ts
await app.agent().login(userOrId);
```

## Eklentilerde Test Dosyalarını Organize Etme

Sunucu tarafı mantığıyla ilgili test dosyalarını eklentinin `./src/server/__tests__` klasöründe saklamanız önerilir.

```bash
packages/plugins/@my-project/plugin-hello/
├── src/                     # Kaynak kodu dizini
│   └── server/              # Sunucu tarafı kodu
│       ├── __tests__/       # Test dosyaları dizini
│       │   ├── db.test.ts   # Veritabanı ile ilgili testler (createMockDatabase kullanarak)
│       │   └── api.test.ts  # API ile ilgili testler
```

## Testleri Çalıştırma

```bash
# Dizini belirtin
yarn test packages/plugins/@my-project/plugin-hello/src/server
# Dosyayı belirtin
yarn test packages/plugins/@my-project/plugin-hello/src/server/__tests__/db.test.ts
```