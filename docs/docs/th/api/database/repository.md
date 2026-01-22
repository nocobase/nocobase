:::tip
เอกสารนี้แปลโดย AI หากมีข้อมูลที่ไม่ถูกต้อง โปรดดู[เวอร์ชันภาษาอังกฤษ](/en)
:::


# รีโพสิทอรี

## ภาพรวม

บนออบเจกต์ `Collection` ที่กำหนด เราสามารถเรียกใช้ออบเจกต์ `Repository` ของมันได้ เพื่อดำเนินการอ่านและเขียนข้อมูลในตารางครับ/ค่ะ

```javascript
const { UserCollection } = require('./collections');

const UserRepository = UserCollection.repository;

const user = await UserRepository.findOne({
  filter: {
    id: 1,
  },
});

user.name = 'new name';
await user.save();
```

### การสอบถามข้อมูล

#### การสอบถามข้อมูลพื้นฐาน

บนออบเจกต์ `Repository` ให้เรียกใช้เมธอดที่เกี่ยวข้องกับ `find*` เพื่อดำเนินการสอบถามข้อมูล เมธอดการสอบถามข้อมูลทั้งหมดรองรับการส่งพารามิเตอร์ `filter` เพื่อใช้ในการกรองข้อมูลครับ/ค่ะ

```javascript
// SELECT * FROM users WHERE id = 1
userRepository.find({
  filter: {
    id: 1,
  },
});
```

#### ตัวดำเนินการ

พารามิเตอร์ `filter` ใน `Repository` ยังมีตัวดำเนินการหลากหลายรูปแบบให้ใช้งาน เพื่อให้สามารถสอบถามข้อมูลได้หลากหลายยิ่งขึ้นครับ/ค่ะ

```javascript
// SELECT * FROM users WHERE age > 18
userRepository.find({
  filter: {
    age: {
      $gt: 18,
    },
  },
});

// SELECT * FROM users WHERE age > 18 OR name LIKE '%张%'
userRepository.find({
  filter: {
    $or: [{ age: { $gt: 18 } }, { name: { $like: '%张%' } }],
  },
});
```

สำหรับรายละเอียดเพิ่มเติมเกี่ยวกับตัวดำเนินการ โปรดดูที่ [ตัวดำเนินการกรองข้อมูล (Filter Operators)](/api/database/operators) ครับ/ค่ะ

#### การควบคุมฟิลด์

ในการดำเนินการสอบถามข้อมูล เราสามารถควบคุมฟิลด์ที่จะแสดงผลได้ผ่านพารามิเตอร์ `fields`, `except` และ `appends` ครับ/ค่ะ

- `fields`: ระบุฟิลด์ที่จะแสดงผล
- `except`: ยกเว้นฟิลด์ที่จะแสดงผล
- `appends`: เพิ่มฟิลด์ที่เกี่ยวข้องเพื่อแสดงผล

```javascript
// ผลลัพธ์ที่ได้จะประกอบด้วยฟิลด์ id และ name เท่านั้น
userRepository.find({
  fields: ['id', 'name'],
});

// ผลลัพธ์ที่ได้จะไม่รวมฟิลด์ password
userRepository.find({
  except: ['password'],
});

// ผลลัพธ์ที่ได้จะรวมข้อมูลจากออบเจกต์ posts ที่เกี่ยวข้องด้วย
userRepository.find({
  appends: ['posts'],
});
```

#### การสอบถามข้อมูลฟิลด์ที่เกี่ยวข้อง

พารามิเตอร์ `filter` รองรับการกรองข้อมูลตามฟิลด์ที่เกี่ยวข้อง เช่น

```javascript
// สอบถามออบเจกต์ user ที่มี posts ที่เกี่ยวข้องซึ่งมีออบเจกต์ที่มี title เป็น 'post title'
userRepository.find({
  filter: {
    'posts.title': 'post title',
  },
});
```

ฟิลด์ที่เกี่ยวข้องยังสามารถซ้อนกันได้ครับ/ค่ะ

```javascript
// สอบถามออบเจกต์ user ที่ comments ของ posts มี keywords
await userRepository.find({
  filter: {
    'posts.comments.content': {
      $like: '%keywords%',
    },
  },
});
```

#### การเรียงลำดับ

เราสามารถเรียงลำดับผลลัพธ์การสอบถามข้อมูลได้โดยใช้พารามิเตอร์ `sort` ครับ/ค่ะ

```javascript
// SELECT * FROM users ORDER BY age
await userRepository.find({
  sort: 'age',
});

// SELECT * FROM users ORDER BY age DESC
await userRepository.find({
  sort: '-age',
});

// SELECT * FROM users ORDER BY age DESC, name ASC
await userRepository.find({
  sort: ['-age', 'name'],
});
```

นอกจากนี้ยังสามารถเรียงลำดับตามฟิลด์ของออบเจกต์ที่เกี่ยวข้องได้ครับ/ค่ะ

```javascript
await userRepository.find({
  sort: 'profile.createdAt',
});
```

### การสร้างข้อมูล

#### การสร้างข้อมูลพื้นฐาน

สร้างออบเจกต์ข้อมูลใหม่ผ่าน `Repository` ครับ/ค่ะ

```javascript
await userRepository.create({
  name: '张三',
  age: 18,
});
// INSERT INTO users (name, age) VALUES ('张三', 18)

// รองรับการสร้างข้อมูลจำนวนมาก
await userRepository.create([
  {
    name: '张三',
    age: 18,
  },
  {
    name: '李四',
    age: 20,
  },
]);
```

#### การสร้างความสัมพันธ์

ในขณะที่สร้างข้อมูล เราสามารถสร้างออบเจกต์ที่เกี่ยวข้องไปพร้อมกันได้ครับ/ค่ะ คล้ายกับการสอบถามข้อมูล ยังรองรับการใช้ออบเจกต์ที่เกี่ยวข้องแบบซ้อนกัน เช่น

```javascript
await userRepository.create({
  name: '张三',
  age: 18,
  posts: [
    {
      title: 'post title',
      content: 'post content',
      tags: [
        {
          name: 'tag1',
        },
        {
          name: 'tag2',
        },
      ],
    },
  ],
});
// ในขณะที่สร้างผู้ใช้ จะมีการสร้าง post และเชื่อมโยงกับผู้ใช้ และสร้าง tags และเชื่อมโยงกับ post
```

หากออบเจกต์ที่เกี่ยวข้องมีอยู่ในฐานข้อมูลแล้ว สามารถส่ง ID ของออบเจกต์นั้นเข้าไปได้ครับ/ค่ะ ระบบจะสร้างความสัมพันธ์กับออบเจกต์ที่เกี่ยวข้องนั้นในขณะที่สร้างข้อมูล

```javascript
const tag1 = await tagRepository.findOne({
  filter: {
    name: 'tag1',
  },
});

await userRepository.create({
  name: '张三',
  age: 18,
  posts: [
    {
      title: 'post title',
      content: 'post content',
      tags: [
        {
          id: tag1.id, // สร้างความสัมพันธ์กับออบเจกต์ที่เกี่ยวข้องที่มีอยู่แล้ว
        },
        {
          name: 'tag2',
        },
      ],
    },
  ],
});
```

### การอัปเดตข้อมูล

#### การอัปเดตข้อมูลพื้นฐาน

หลังจากได้รับออบเจกต์ข้อมูลแล้ว เราสามารถแก้ไขคุณสมบัติบนออบเจกต์ข้อมูล (`Model`) ได้โดยตรง จากนั้นเรียกใช้เมธอด `save` เพื่อบันทึกการเปลี่ยนแปลงครับ/ค่ะ

```javascript
const user = await userRepository.findOne({
  filter: {
    name: '张三',
  },
});

user.age = 20;
await user.save();
```

ออบเจกต์ข้อมูล `Model` สืบทอดมาจาก Sequelize Model ครับ/ค่ะ สำหรับการดำเนินการกับ `Model` สามารถดูเพิ่มเติมได้ที่ [Sequelize Model](https://sequelize.org/master/manual/model-basics.html)

นอกจากนี้ยังสามารถอัปเดตข้อมูลผ่าน `Repository` ได้ครับ/ค่ะ:

```javascript
// แก้ไขเรคคอร์ดข้อมูลที่ตรงตามเงื่อนไขการกรอง
await userRepository.update({
  filter: {
    name: '张三',
  },
  values: {
    age: 20,
  },
});
```

ในการอัปเดต เราสามารถควบคุมฟิลด์ที่จะอัปเดตได้ผ่านพารามิเตอร์ `whitelist` และ `blacklist` เช่น

```javascript
await userRepository.update({
  filter: {
    name: '张三',
  },
  values: {
    age: 20,
    name: '李四',
  },
  whitelist: ['age'], // อัปเดตเฉพาะฟิลด์ age เท่านั้น
});
```

#### การอัปเดตฟิลด์ที่เกี่ยวข้อง

ในการอัปเดต เราสามารถตั้งค่าออบเจกต์ที่เกี่ยวข้องได้ เช่น

```javascript
const tag1 = tagRepository.findOne({
  filter: {
    id: 1,
  },
});

await postRepository.update({
  filter: {
    id: 1,
  },
  values: {
    title: 'new post title',
    tags: [
      {
        id: tag1.id, // สร้างความสัมพันธ์กับ tag1
      },
      {
        name: 'tag2', // สร้าง tag ใหม่และสร้างความสัมพันธ์
      },
    ],
  },
});

await postRepository.update({
  filter: {
    id: 1,
  },
  values: {
    tags: null, // ยกเลิกความสัมพันธ์ระหว่าง post กับ tags
  },
});
```

### การลบข้อมูล

เราสามารถเรียกใช้เมธอด `destroy()` ใน `Repository` เพื่อดำเนินการลบข้อมูลได้ครับ/ค่ะ ในการลบข้อมูล จำเป็นต้องระบุเงื่อนไขการกรอง:

```javascript
await userRepository.destroy({
  filter: {
    status: 'blocked',
  },
});
```

## คอนสตรักเตอร์

โดยปกติแล้ว นักพัฒนาจะไม่เรียกใช้โดยตรงครับ/ค่ะ โดยหลักแล้ว หลังจากลงทะเบียนประเภทผ่าน `db.registerRepositories()` แล้ว จะมีการระบุประเภทรีโพสิทอรีที่ลงทะเบียนไว้ในพารามิเตอร์ของ `db.collection()` และดำเนินการสร้างอินสแตนซ์ให้สมบูรณ์ครับ/ค่ะ

**ซิกเนเจอร์**

- `constructor(collection: Collection)`

**ตัวอย่าง**

```ts
import { Repository } from '@nocobase/database';

class MyRepository extends Repository {
  async myQuery(sql) {
    return this.database.sequelize.query(sql);
  }
}

db.registerRepositories({
  books: MyRepository,
});

db.collection({
  name: 'books',
  // here link to the registered repository
  repository: 'books',
});

await db.sync();

const books = db.getRepository('books') as MyRepository;
await books.myQuery('SELECT * FROM books;');
```

## สมาชิกอินสแตนซ์

### `database`

อินสแตนซ์การจัดการฐานข้อมูลของบริบทที่อยู่ครับ/ค่ะ

### `collection`

อินสแตนซ์การจัดการคอลเลกชันที่เกี่ยวข้องครับ/ค่ะ

### `model`

คลาสโมเดลข้อมูลที่เกี่ยวข้องครับ/ค่ะ

## เมธอดอินสแตนซ์

### `find()`

สอบถามชุดข้อมูลจากฐานข้อมูล สามารถระบุเงื่อนไขการกรอง การเรียงลำดับ และอื่นๆ ได้ครับ/ค่ะ

**ซิกเนเจอร์**

- `async find(options?: FindOptions): Promise<Model[]>`

**ประเภท**

```typescript
type Filter = FilterWithOperator | FilterWithValue | FilterAnd | FilterOr;
type Appends = string[];
type Except = string[];
type Fields = string[];
type Sort = string[] | string;

interface SequelizeFindOptions {
  limit?: number;
  offset?: number;
}

interface FilterByTk {
  filterByTk?: TargetKey;
}

interface CommonFindOptions extends Transactionable {
  filter?: Filter;
  fields?: Fields;
  appends?: Appends;
  except?: Except;
  sort?: Sort;
}

type FindOptions = SequelizeFindOptions & CommonFindOptions & FilterByTk;
```

**รายละเอียด**

#### `filter: Filter`

เงื่อนไขการสอบถามข้อมูล ใช้สำหรับกรองผลลัพธ์ข้อมูล ในพารามิเตอร์การสอบถามข้อมูลที่ส่งเข้ามา `key` คือชื่อฟิลด์ที่ต้องการสอบถาม และ `value` สามารถส่งค่าที่ต้องการสอบถามได้ หรือใช้ร่วมกับตัวดำเนินการเพื่อกรองข้อมูลตามเงื่อนไขอื่นๆ ได้ครับ/ค่ะ

```typescript
// สอบถามเรคคอร์ดที่ name เป็น 'foo' และ age มากกว่า 18
repository.find({
  filter: {
    name: 'foo',
    age: {
      $gt: 18,
    },
  },
});
```

สำหรับตัวดำเนินการเพิ่มเติม โปรดดูที่ [ตัวดำเนินการสอบถามข้อมูล](./operators.md) ครับ/ค่ะ

#### `filterByTk: TargetKey`

สอบถามข้อมูลด้วย `TargetKey` ซึ่งเป็นเมธอดที่สะดวกสำหรับพารามิเตอร์ `filter` ครับ/ค่ะ `TargetKey` คือฟิลด์ใดโดยเฉพาะ สามารถ[กำหนดค่า](./collection.md#filtertargetkey)ได้ใน `Collection` โดยค่าเริ่มต้นคือ `primaryKey`

```typescript
// โดยค่าเริ่มต้น จะค้นหาเรคคอร์ดที่มี id = 1
repository.find({
  filterByTk: 1,
});
```

#### `fields: string[]`

คอลัมน์ที่ต้องการสอบถาม ใช้สำหรับควบคุมผลลัพธ์ของฟิลด์ข้อมูล หลังจากส่งพารามิเตอร์นี้แล้ว จะคืนค่าเฉพาะฟิลด์ที่ระบุเท่านั้นครับ/ค่ะ

#### `except: string[]`

คอลัมน์ที่จะยกเว้น ใช้สำหรับควบคุมผลลัพธ์ของฟิลด์ข้อมูล หลังจากส่งพารามิเตอร์นี้แล้ว ฟิลด์ที่ส่งเข้ามาจะไม่ถูกแสดงผลครับ/ค่ะ

#### `appends: string[]`

คอลัมน์ที่จะเพิ่ม ใช้สำหรับโหลดข้อมูลที่เกี่ยวข้อง หลังจากส่งพารามิเตอร์นี้แล้ว ฟิลด์ที่เกี่ยวข้องที่ระบุจะถูกแสดงผลพร้อมกันครับ/ค่ะ

#### `sort: string[] | string`

ระบุวิธีการเรียงลำดับผลลัพธ์การสอบถามข้อมูล พารามิเตอร์ที่ส่งเข้ามาคือชื่อฟิลด์ โดยค่าเริ่มต้นจะเรียงลำดับจากน้อยไปมาก (`asc`) หากต้องการเรียงลำดับจากมากไปน้อย (`desc`) สามารถเพิ่มสัญลักษณ์ `-` หน้าชื่อฟิลด์ได้ เช่น `['-id', 'name']` ซึ่งหมายถึงการเรียงลำดับตาม `id desc, name asc` ครับ/ค่ะ

#### `limit: number`

จำกัดจำนวนผลลัพธ์ เหมือนกับ `limit` ใน `SQL` ครับ/ค่ะ

#### `offset: number`

ค่าออฟเซ็ตการสอบถาม เหมือนกับ `offset` ใน `SQL` ครับ/ค่ะ

**ตัวอย่าง**

```ts
const posts = db.getRepository('posts');

const results = await posts.find({
  filter: {
    createdAt: {
      $gt: '2022-01-01T00:00:00.000Z',
    },
  },
  fields: ['title'],
  appends: ['user'],
});
```

### `findOne()`

สอบถามข้อมูลเพียงรายการเดียวจากฐานข้อมูลที่ตรงตามเงื่อนไขที่กำหนด เทียบเท่ากับ `Model.findOne()` ใน Sequelize ครับ/ค่ะ

**ซิกเนเจอร์**

- `async findOne(options?: FindOneOptions): Promise<Model | null>`

<embed src="./shared/find-one.md"></embed>

**ตัวอย่าง**

```ts
const posts = db.getRepository('posts');

const result = await posts.findOne({
  filterByTk: 1,
});
```

### `count()`

สอบถามจำนวนข้อมูลทั้งหมดจากฐานข้อมูลที่ตรงตามเงื่อนไขที่กำหนด เทียบเท่ากับ `Model.count()` ใน Sequelize ครับ/ค่ะ

**ซิกเนเจอร์**

- `count(options?: CountOptions): Promise<number>`

**ประเภท**

```typescript
interface CountOptions
  extends Omit<SequelizeCountOptions, 'distinct' | 'where' | 'include'>,
    Transactionable {
  filter?: Filter;
}
```

**ตัวอย่าง**

```ts
const books = db.getRepository('books');

const count = await books.count({
  filter: {
    title: '三字经',
  },
});
```

### `findAndCount()`

สอบถามชุดข้อมูลและจำนวนผลลัพธ์ทั้งหมดจากฐานข้อมูลที่ตรงตามเงื่อนไขที่กำหนด เทียบเท่ากับ `Model.findAndCountAll()` ใน Sequelize ครับ/ค่ะ

**ซิกเนเจอร์**

- `async findAndCount(options?: FindAndCountOptions): Promise<[Model[], number]>`

**ประเภท**

```typescript
type FindAndCountOptions = Omit<
  SequelizeAndCountOptions,
  'where' | 'include' | 'order'
> &
  CommonFindOptions;
```

**รายละเอียด**

พารามิเตอร์การสอบถามข้อมูลเหมือนกับเมธอด `find()` ครับ/ค่ะ ค่าที่ส่งกลับมาเป็นอาร์เรย์ โดยที่องค์ประกอบแรกคือผลลัพธ์การสอบถามข้อมูล และองค์ประกอบที่สองคือจำนวนผลลัพธ์ทั้งหมด

### `create()`

แทรกข้อมูลที่สร้างขึ้นใหม่หนึ่งรายการลงในตารางข้อมูล เทียบเท่ากับ `Model.create()` ใน Sequelize ครับ/ค่ะ เมื่อออบเจกต์ข้อมูลที่จะสร้างมีข้อมูลฟิลด์ความสัมพันธ์อยู่ด้วย ระบบจะสร้างหรืออัปเดตเรคคอร์ดข้อมูลความสัมพันธ์ที่เกี่ยวข้องไปพร้อมกัน

**ซิกเนเจอร์**

- `async create<M extends Model>(options: CreateOptions): Promise<M>`

<embed src="./shared/create-options.md"></embed>

**ตัวอย่าง**

```ts
const posts = db.getRepository('posts');

const result = await posts.create({
  values: {
    title: 'NocoBase 1.0 发布日志',
    tags: [
      // เมื่อมีค่า primary key ของตารางความสัมพันธ์ จะเป็นการอัปเดตข้อมูลนั้น
      { id: 1 },
      // เมื่อไม่มีค่า primary key จะเป็นการสร้างข้อมูลใหม่
      { name: 'NocoBase' },
    ],
  },
});
```

### `createMany()`

แทรกข้อมูลที่สร้างขึ้นใหม่หลายรายการลงในตารางข้อมูล เทียบเท่ากับการเรียกใช้เมธอด `create()` หลายครั้งครับ/ค่ะ

**ซิกเนเจอร์**

- `createMany(options: CreateManyOptions): Promise<Model[]>`

**ประเภท**

```typescript
interface CreateManyOptions extends BulkCreateOptions {
  records: Values[];
}
```

**รายละเอียด**

- `records`: อาร์เรย์ของออบเจกต์ข้อมูลสำหรับเรคคอร์ดที่จะสร้างครับ/ค่ะ
- `transaction`: ออบเจกต์ธุรกรรม หากไม่มีการส่งพารามิเตอร์ธุรกรรมเข้ามา เมธอดนี้จะสร้างธุรกรรมภายในโดยอัตโนมัติครับ/ค่ะ

**ตัวอย่าง**

```ts
const posts = db.getRepository('posts');

const results = await posts.createMany({
  records: [
    {
      title: 'NocoBase 1.0 发布日志',
      tags: [
        // เมื่อมีค่า primary key ของตารางความสัมพันธ์ จะเป็นการอัปเดตข้อมูลนั้น
        { id: 1 },
        // เมื่อไม่มีค่า primary key จะเป็นการสร้างข้อมูลใหม่
        { name: 'NocoBase' },
      ],
    },
    {
      title: 'NocoBase 1.1 发布日志',
      tags: [{ id: 1 }],
    },
  ],
});
```

### `update()`

อัปเดตข้อมูลในตารางข้อมูล เทียบเท่ากับ `Model.update()` ใน Sequelize ครับ/ค่ะ เมื่อออบเจกต์ข้อมูลที่จะอัปเดตมีข้อมูลฟิลด์ความสัมพันธ์อยู่ด้วย ระบบจะสร้างหรืออัปเดตเรคคอร์ดข้อมูลความสัมพันธ์ที่เกี่ยวข้องไปพร้อมกัน

**ซิกเนเจอร์**

- `async update<M extends Model>(options: UpdateOptions): Promise<M>`

<embed src="./shared/update-options.md"></embed>

**ตัวอย่าง**

```ts
const posts = db.getRepository('posts');

const result = await posts.update({
  filterByTk: 1,
  values: {
    title: 'NocoBase 1.0 发布日志',
    tags: [
      // เมื่อมีค่า primary key ของตารางความสัมพันธ์ จะเป็นการอัปเดตข้อมูลนั้น
      { id: 1 },
      // เมื่อไม่มีค่า primary key จะเป็นการสร้างข้อมูลใหม่
      { name: 'NocoBase' },
    ],
  },
});
```

### `destroy()`

ลบข้อมูลในตารางข้อมูล เทียบเท่ากับ `Model.destroy()` ใน Sequelize ครับ/ค่ะ

**ซิกเนเจอร์**

- `async destroy(options?: TargetKey | TargetKey[] | DestroyOptions): Promise<number>`

**ประเภท**

```typescript
interface DestroyOptions extends SequelizeDestroyOptions {
  filter?: Filter;
  filterByTk?: TargetKey | TargetKey[];
  truncate?: boolean;
  context?: any;
}
```

**รายละเอียด**

- `filter`: ระบุเงื่อนไขการกรองสำหรับเรคคอร์ดที่จะลบ สำหรับการใช้งาน `Filter` โดยละเอียด โปรดดูที่เมธอด [`find()`](#find) ครับ/ค่ะ
- `filterByTk`: ระบุเงื่อนไขการกรองสำหรับเรคคอร์ดที่จะลบด้วย TargetKey ครับ/ค่ะ
- `truncate`: จะล้างข้อมูลในตารางหรือไม่ มีผลเมื่อไม่มีการส่งพารามิเตอร์ `filter` หรือ `filterByTk` เข้ามาครับ/ค่ะ
- `transaction`: ออบเจกต์ธุรกรรม หากไม่มีการส่งพารามิเตอร์ธุรกรรมเข้ามา เมธอดนี้จะสร้างธุรกรรมภายในโดยอัตโนมัติครับ/ค่ะ