:::tip إشعار الترجمة بالذكاء الاصطناعي
تمت ترجمة هذه الوثائق تلقائيًا بواسطة الذكاء الاصطناعي.
:::

# الاختبار

توفر NocoBase مجموعة كاملة من أدوات الاختبار لمساعدة المطورين على التحقق بسرعة من صحة منطق قاعدة البيانات وواجهات برمجة التطبيقات (API) وتطبيقات الميزات أثناء تطوير الإضافات. سيوضح هذا الدليل كيفية كتابة هذه الاختبارات وتشغيلها وتنظيمها.

## لماذا نكتب الاختبارات؟

فوائد كتابة الاختبارات الآلية في تطوير الإضافات:

- التحقق السريع من صحة نماذج قاعدة البيانات وواجهات برمجة التطبيقات (API) ومنطق الأعمال.
- تجنب أخطاء التراجع (Regression errors) (الكشف التلقائي عن توافق الإضافات بعد ترقيات النواة).
- دعم بيئات التكامل المستمر (CI) لتشغيل الاختبارات تلقائيًا.
- دعم اختبار وظائف الإضافات دون الحاجة لتشغيل الخدمة الكاملة.

## أساسيات بيئة الاختبار

توفر NocoBase أداتين أساسيتين للاختبار:

| الأداة | الوصف | الغرض |
| :------------------- | :------------------------------------------------ | :---------------------------------- |
| `createMockDatabase` | إنشاء نسخة قاعدة بيانات في الذاكرة | اختبار نماذج ومنطق قاعدة البيانات |
| `createMockServer` | إنشاء نسخة تطبيق كاملة (تتضمن قاعدة بيانات، إضافات، واجهات برمجة تطبيقات، إلخ.) | اختبار عمليات الأعمال وسلوك الواجهات |

## استخدام `createMockDatabase` لاختبار قاعدة البيانات

تُعد `createMockDatabase` مناسبة لاختبار الوظائف المتعلقة مباشرة بقواعد البيانات، مثل تعريفات النماذج وأنواع الحقول والعلاقات وعمليات CRUD وغيرها.

### مثال أساسي

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

### اختبار عمليات CRUD

```ts
const Posts = db.collection({
  name: 'posts',
  fields: [{ type: 'string', name: 'title' }],
});
await db.sync();

// إنشاء
const post = await db.getRepository('posts').create({ values: { title: 'Initial Title' } });
expect(post.get('title')).toBe('Initial Title');

// تحديث
await db.getRepository('posts').update({
  filterByTk: post.get('id'),
  values: { title: 'Updated Title' },
});
const updated = await db.getRepository('posts').findOne({ filterByTk: post.get('id') });
expect(updated.get('title')).toBe('Updated Title');
```

### اختبار ارتباطات النماذج

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

## استخدام `createMockServer` لاختبار واجهات برمجة التطبيقات (API)

تقوم `createMockServer` تلقائيًا بإنشاء نسخة تطبيق كاملة تتضمن قاعدة بيانات وإضافات ومسارات واجهات برمجة التطبيقات (API)، مما يجعلها مثالية لاختبار واجهات الإضافات.

### مثال أساسي

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

### اختبار استعلامات وتحديثات واجهة برمجة التطبيقات (API)

```ts
// استعلام قائمة المستخدمين
const list = await app.agent().get('/users:list');
expect(list.body.rows.length).toBeGreaterThan(0);

// تحديث المستخدم
const update = await app.agent().post(`/users:update/${id}`).send({ username: 'newname' });
expect(update.body.username).toBe('newname');
```

### محاكاة حالة تسجيل الدخول أو اختبار الأذونات

يمكنك تمكين إضافة `auth` عند إنشاء `MockServer`، ثم استخدام واجهة تسجيل الدخول للحصول على رمز مميز (token) أو جلسة (session):

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

يمكنك أيضًا استخدام طريقة `login()` الأبسط:

```ts
await app.agent().login(userOrId);
```

## تنظيم ملفات الاختبار في الإضافات

يُوصى بتخزين ملفات الاختبار المتعلقة بمنطق جانب الخادم في مجلد `./src/server/__tests__` الخاص بالإضافة.

```bash
packages/plugins/@my-project/plugin-hello/
├── src/                     # دليل الكود المصدري
│   └── server/              # كود جانب الخادم
│       ├── __tests__/       # دليل ملفات الاختبار
│       │   ├── db.test.ts   # اختبارات متعلقة بقاعدة البيانات (باستخدام createMockDatabase)
│       │   └── api.test.ts  # اختبارات متعلقة بواجهة برمجة التطبيقات (API)
```

## تشغيل الاختبارات

```bash
# تحديد الدليل
yarn test packages/plugins/@my-project/plugin-hello/src/server
# تحديد الملف
yarn test packages/plugins/@my-project/plugin-hello/src/server/__tests__/db.test.ts
```