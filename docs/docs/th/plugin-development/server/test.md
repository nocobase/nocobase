:::tip
เอกสารนี้แปลโดย AI หากมีข้อมูลที่ไม่ถูกต้อง โปรดดู[เวอร์ชันภาษาอังกฤษ](/en)
:::


# การทดสอบ

NocoBase มีชุดเครื่องมือทดสอบที่ครบครัน เพื่อช่วยให้นักพัฒนาสามารถตรวจสอบความถูกต้องของตรรกะฐานข้อมูล, API และการทำงานของฟีเจอร์ต่างๆ ได้อย่างรวดเร็วในระหว่างการพัฒนาปลั๊กอิน คู่มือนี้จะแนะนำวิธีการเขียน, รัน และจัดระเบียบการทดสอบเหล่านี้ครับ/ค่ะ

## ทำไมต้องเขียนการทดสอบ

ประโยชน์ของการเขียนการทดสอบอัตโนมัติในการพัฒนาปลั๊กอินมีดังนี้ครับ/ค่ะ:

- ช่วยให้ตรวจสอบความถูกต้องของโมเดลฐานข้อมูล, API และตรรกะทางธุรกิจได้อย่างรวดเร็ว
- ป้องกันข้อผิดพลาดที่อาจเกิดขึ้นซ้ำ (regression errors) (ระบบจะตรวจสอบความเข้ากันได้ของปลั๊กอินโดยอัตโนมัติหลังจากการอัปเกรด Core)
- รองรับการรันการทดสอบอัตโนมัติในสภาพแวดล้อม Continuous Integration (CI)
- รองรับการทดสอบฟังก์ชันการทำงานของปลั๊กอินโดยไม่ต้องเริ่มต้นบริการทั้งหมด

## พื้นฐานสภาพแวดล้อมการทดสอบ

NocoBase มีเครื่องมือทดสอบหลักสองอย่างดังนี้ครับ/ค่ะ:

| เครื่องมือ | คำอธิบาย | วัตถุประสงค์ |
|---|---|---|
| `createMockDatabase` | สร้างอินสแตนซ์ฐานข้อมูลในหน่วยความจำ | ทดสอบโมเดลและตรรกะของฐานข้อมูล |
| `createMockServer` | สร้างอินสแตนซ์แอปพลิเคชันที่สมบูรณ์ (รวมถึงฐานข้อมูล, ปลั๊กอิน, API และอื่นๆ) | ทดสอบกระบวนการทางธุรกิจและพฤติกรรมของอินเทอร์เฟซ |

## การใช้ `createMockDatabase` สำหรับการทดสอบฐานข้อมูล

`createMockDatabase` เหมาะสำหรับการทดสอบฟังก์ชันที่เกี่ยวข้องโดยตรงกับฐานข้อมูล เช่น การกำหนดโมเดล, ชนิดข้อมูลของฟิลด์, ความสัมพันธ์ และการดำเนินการ CRUD เป็นต้นครับ/ค่ะ

### ตัวอย่างพื้นฐาน

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

### การทดสอบการดำเนินการ CRUD

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

### การทดสอบความสัมพันธ์ของโมเดล

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

## การใช้ `createMockServer` สำหรับการทดสอบ API

`createMockServer` จะสร้างอินสแตนซ์แอปพลิเคชันที่สมบูรณ์ ซึ่งประกอบด้วยฐานข้อมูล, ปลั๊กอิน และ API routes โดยอัตโนมัติ ทำให้เหมาะอย่างยิ่งสำหรับการทดสอบอินเทอร์เฟซของปลั๊กอินครับ/ค่ะ

### ตัวอย่างพื้นฐาน

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

### การทดสอบการเรียกดูและอัปเดต API

```ts
// Query user list
const list = await app.agent().get('/users:list');
expect(list.body.rows.length).toBeGreaterThan(0);

// Update user
const update = await app.agent().post(`/users:update/${id}`).send({ username: 'newname' });
expect(update.body.username).toBe('newname');
```

### การจำลองสถานะการเข้าสู่ระบบหรือการทดสอบสิทธิ์

คุณสามารถเปิดใช้งานปลั๊กอิน `auth` เมื่อสร้าง `MockServer` จากนั้นใช้ API สำหรับการเข้าสู่ระบบเพื่อรับ token หรือ session ได้ครับ/ค่ะ:

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

หรือจะใช้วิธี `login()` ที่ง่ายกว่าก็ได้ครับ/ค่ะ

```ts
await app.agent().login(userOrId);
```

## การจัดระเบียบไฟล์ทดสอบในปลั๊กอิน

เราแนะนำให้จัดเก็บไฟล์ทดสอบที่เกี่ยวข้องกับตรรกะฝั่งเซิร์ฟเวอร์ไว้ในโฟลเดอร์ `./src/server/__tests__` ของปลั๊กอินครับ/ค่ะ

```bash
packages/plugins/@my-project/plugin-hello/
├── src/                     # Source code directory
│   └── server/              # Server-side code
│       ├── __tests__/       # Test files directory
│       │   ├── db.test.ts   # Database related tests (using createMockDatabase)
│       │   └── api.test.ts  # API related tests
```

## การรันการทดสอบ

```bash
# ระบุไดเรกทอรี
yarn test packages/plugins/@my-project/plugin-hello/src/server
# ระบุไฟล์
yarn test packages/plugins/@my-project/plugin-hello/src/server/__tests__/db.test.ts
```