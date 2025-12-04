:::tip
เอกสารนี้แปลโดย AI หากมีข้อมูลที่ไม่ถูกต้อง โปรดดู[เวอร์ชันภาษาอังกฤษ](/en)
:::


# ฐานข้อมูล

## ภาพรวม

`Database` เป็นเครื่องมือสำหรับโต้ตอบกับฐานข้อมูลที่ NocoBase จัดหาให้ ซึ่งช่วยให้แอปพลิเคชันแบบ No-code และ Low-code สามารถโต้ตอบกับฐานข้อมูลได้อย่างสะดวกสบายครับ/ค่ะ ฐานข้อมูลที่รองรับในปัจจุบันได้แก่:

- SQLite 3.8.8+
- MySQL 8.0.17+
- PostgreSQL 10.0+

### การเชื่อมต่อฐานข้อมูล

ใน Constructor ของ `Database` เราสามารถกำหนดค่าการเชื่อมต่อฐานข้อมูลได้โดยการส่งพารามิเตอร์ `options` เข้าไปครับ/ค่ะ

```javascript
const { Database } = require('@nocobase/database');

// พารามิเตอร์การกำหนดค่าฐานข้อมูล SQLite
const database = new Database({
  dialect: 'mysql',
  host: 'localhost',
  port: 3306,
  database: 'nocobase',
  username: 'root',
  password: 'password'
})

// พารามิเตอร์การกำหนดค่าฐานข้อมูล MySQL \ PostgreSQL
const database = new Database({
  dialect: /* 'postgres' หรือ 'mysql' */,
  database: 'database',
  username: 'username',
  password: 'password',
  host: 'localhost',
  port: 'port'
})

```

สำหรับพารามิเตอร์การกำหนดค่าโดยละเอียด โปรดดูที่ [Constructor](#constructor) ครับ/ค่ะ

### การกำหนดโมเดลข้อมูล

`Database` ใช้ `คอลเลกชัน` ในการกำหนดโครงสร้างฐานข้อมูล โดยที่ออบเจกต์ `คอลเลกชัน` หนึ่งตัวจะแทนตารางหนึ่งตารางในฐานข้อมูลครับ/ค่ะ

```javascript
// กำหนดคอลเลกชัน
const UserCollection = database.collection({
  name: 'users',
  fields: [
    {
      name: 'name',
      type: 'string',
    },
    {
      name: 'age',
      type: 'integer',
    },
  ],
});
```

หลังจากกำหนดโครงสร้างฐานข้อมูลเสร็จแล้ว เราสามารถใช้เมธอด `sync()` เพื่อซิงโครไนซ์โครงสร้างฐานข้อมูลได้เลยครับ/ค่ะ

```javascript
await database.sync();
```

สำหรับวิธีการใช้งาน `คอลเลกชัน` โดยละเอียดเพิ่มเติม โปรดดูที่ [คอลเลกชัน](/api/database/collection) ครับ/ค่ะ

### การอ่าน/เขียนข้อมูล

`Database` ดำเนินการกับข้อมูลผ่าน `Repository` ครับ/ค่ะ

```javascript
const UserRepository = UserCollection.repository();

// สร้าง
await UserRepository.create({
  name: '张三',
  age: 18,
});

// สืบค้น
const user = await UserRepository.findOne({
  filter: {
    name: '张三',
  },
});

// แก้ไข
await UserRepository.update({
  values: {
    age: 20,
  },
});

// ลบ
await UserRepository.destroy(user.id);
```

สำหรับวิธีการใช้งาน CRUD ของข้อมูลโดยละเอียดเพิ่มเติม โปรดดูที่ [Repository](/api/database/repository) ครับ/ค่ะ

## Constructor

**Signature**

- `constructor(options: DatabaseOptions)`

สร้างอินสแตนซ์ของฐานข้อมูลครับ/ค่ะ

**Parameters**

| ชื่อพารามิเตอร์        | ประเภท         | ค่าเริ่มต้น   | คำอธิบาย                                                                                                            |
| ---------------------- | -------------- | ------------- | ------------------------------------------------------------------------------------------------------------------- |
| `options.host`         | `string`       | `'localhost'` | โฮสต์ของฐานข้อมูล                                                                                                   |
| `options.port`         | `number`       | -             | พอร์ตบริการฐานข้อมูล ซึ่งมีพอร์ตเริ่มต้นที่สอดคล้องกับฐานข้อมูลที่ใช้งานครับ/ค่ะ                                    |
| `options.username`     | `string`       | -             | ชื่อผู้ใช้ฐานข้อมูล                                                                                                  |
| `options.password`     | `string`       | -             | รหัสผ่านฐานข้อมูล                                                                                                   |
| `options.database`     | `string`       | -             | ชื่อฐานข้อมูล                                                                                                       |
| `options.dialect`      | `string`       | `'mysql'`     | ประเภทฐานข้อมูล                                                                                                     |
| `options.storage?`     | `string`       | `':memory:'`  | โหมดการจัดเก็บสำหรับ SQLite                                                                                         |
| `options.logging?`     | `boolean`      | `false`       | เปิดใช้งานการบันทึก (logging) หรือไม่                                                                                |
| `options.define?`      | `Object`       | `{}`          | พารามิเตอร์การกำหนดตารางเริ่มต้น                                                                                    |
| `options.tablePrefix?` | `string`       | `''`          | ส่วนขยายของ NocoBase, คำนำหน้าชื่อตาราง                                                                             |
| `options.migrator?`    | `UmzugOptions` | `{}`          | ส่วนขยายของ NocoBase, พารามิเตอร์ที่เกี่ยวข้องกับตัวจัดการการย้ายข้อมูล (migration manager) โปรดดูการใช้งาน [Umzug](https://github.com/sequelize/umzug/blob/main/src/types.ts#L15) ครับ/ค่ะ |

## เมธอดที่เกี่ยวข้องกับการย้ายข้อมูล (Migration)

### `addMigration()`

เพิ่มไฟล์การย้ายข้อมูล (migration) เพียงไฟล์เดียว

**Signature**

- `addMigration(options: MigrationItem)`

**Parameters**

| ชื่อพารามิเตอร์      | ประเภท             | ค่าเริ่มต้น | คำอธิบาย                   |
| -------------------- | ------------------ | ------ | -------------------------- |
| `options.name`       | `string`           | -      | ชื่อไฟล์การย้ายข้อมูล       |
| `options.context?`   | `string`           | -      | บริบทของไฟล์การย้ายข้อมูล   |
| `options.migration?` | `typeof Migration` | -      | คลาสที่กำหนดเองสำหรับไฟล์การย้ายข้อมูล |
| `options.up`         | `Function`         | -      | เมธอด `up` ของไฟล์การย้ายข้อมูล |
| `options.down`       | `Function`         | -      | เมธอด `down` ของไฟล์การย้ายข้อมูล |

**Example**

```ts
db.addMigration({
  name: '20220916120411-test-1',
  async up() {
    const queryInterface = this.context.db.sequelize.getQueryInterface();
    await queryInterface.query(/* your migration sqls */);
  },
});
```

### `addMigrations()`

เพิ่มไฟล์การย้ายข้อมูลจากไดเรกทอรีที่ระบุ

**Signature**

- `addMigrations(options: AddMigrationsOptions): void`

**Parameters**

| ชื่อพารามิเตอร์      | ประเภท     | ค่าเริ่มต้น    | คำอธิบาย                  |
| -------------------- | ---------- | -------------- | ------------------------- |
| `options.directory`  | `string`   | `''`           | ไดเรกทอรีที่เก็บไฟล์การย้ายข้อมูล |
| `options.extensions` | `string[]` | `['js', 'ts']` | นามสกุลไฟล์                |
| `options.namespace?` | `string`   | `''`           | เนมสเปซ                   |
| `options.context?`   | `Object`   | `{ db }`       | บริบทของไฟล์การย้ายข้อมูล  |

**Example**

```ts
db.addMigrations({
  directory: path.resolve(__dirname, './migrations'),
  namespace: 'test',
});
```

## เมธอดอำนวยความสะดวก

### `inDialect()`

ตรวจสอบว่าประเภทฐานข้อมูลปัจจุบันเป็นประเภทที่ระบุหรือไม่

**Signature**

- `inDialect(dialect: string[]): boolean`

**Parameters**

| ชื่อพารามิเตอร์ | ประเภท     | ค่าเริ่มต้น | คำอธิบาย                                             |
| --------- | ---------- | ------ | ------------------------------------------------ |
| `dialect` | `string[]` | -      | ประเภทฐานข้อมูล ค่าที่เลือกได้คือ `mysql`/`postgres`/`mariadb` |

### `getTablePrefix()`

รับคำนำหน้าชื่อตารางจากการกำหนดค่า

**Signature**

- `getTablePrefix(): string`

## การกำหนดค่าคอลเลกชัน

### `collection()`

กำหนด `คอลเลกชัน` ครับ/ค่ะ การเรียกใช้เมธอดนี้คล้ายกับเมธอด `define` ของ Sequelize ซึ่งจะสร้างโครงสร้างตารางในหน่วยความจำเท่านั้น หากต้องการบันทึกลงในฐานข้อมูลอย่างถาวร คุณจะต้องเรียกใช้เมธอด `sync()` ครับ/ค่ะ

**Signature**

- `collection(options: CollectionOptions): Collection`

**Parameters**

พารามิเตอร์การกำหนดค่า `options` ทั้งหมดจะเหมือนกับ Constructor ของคลาส `คอลเลกชัน` โปรดดูที่ [คอลเลกชัน](/api/database/collection#constructor) ครับ/ค่ะ

**Events**

- `'beforeDefineCollection'`: ทริกเกอร์ก่อนที่จะกำหนด `คอลเลกชัน`
- `'afterDefineCollection'`: ทริกเกอร์หลังจากที่กำหนด `คอลเลกชัน` แล้ว

**Example**

```ts
db.collection({
  name: 'books',
  fields: [
    {
      type: 'string',
      name: 'title',
    },
    {
      type: 'float',
      name: 'price',
    },
  ],
});

// ซิงโครไนซ์คอลเลกชันเป็นตารางไปยังฐานข้อมูล
await db.sync();
```

### `getCollection()`

รับ `คอลเลกชัน` ที่กำหนดไว้แล้ว

**Signature**

- `getCollection(name: string): Collection`

**Parameters**

| ชื่อพารามิเตอร์ | ประเภท   | ค่าเริ่มต้น | คำอธิบาย        |
| ------ | -------- | ------ | -------------- |
| `name` | `string` | -      | ชื่อ `คอลเลกชัน` |

**Example**

```ts
const collection = db.getCollection('books');
```

### `hasCollection()`

ตรวจสอบว่าได้กำหนด `คอลเลกชัน` ที่ระบุไว้แล้วหรือไม่

**Signature**

- `hasCollection(name: string): boolean`

**Parameters**

| ชื่อพารามิเตอร์ | ประเภท   | ค่าเริ่มต้น | คำอธิบาย        |
| ------ | -------- | ------ | -------------- |
| `name` | `string` | -      | ชื่อ `คอลเลกชัน` |

**Example**

```ts
db.collection({ name: 'books' });

db.hasCollection('books'); // true

db.hasCollection('authors'); // false
```

### `removeCollection()`

ลบ `คอลเลกชัน` ที่กำหนดไว้แล้วครับ/ค่ะ การลบนี้จะเกิดขึ้นในหน่วยความจำเท่านั้น หากต้องการบันทึกการเปลี่ยนแปลงอย่างถาวร คุณจะต้องเรียกใช้เมธอด `sync()` ครับ/ค่ะ

**Signature**

- `removeCollection(name: string): void`

**Parameters**

| ชื่อพารามิเตอร์ | ประเภท   | ค่าเริ่มต้น | คำอธิบาย        |
| ------ | -------- | ------ | -------------- |
| `name` | `string` | -      | ชื่อ `คอลเลกชัน` |

**Events**

- `'beforeRemoveCollection'`: ทริกเกอร์ก่อนที่จะลบ `คอลเลกชัน`
- `'afterRemoveCollection'`: ทริกเกอร์หลังจากที่ลบ `คอลเลกชัน` แล้ว

**Example**

```ts
db.collection({ name: 'books' });

db.removeCollection('books');
```

### `import()`

นำเข้าไฟล์ทั้งหมดในไดเรกทอรีเป็นไฟล์กำหนดค่า `คอลเลกชัน` เข้าสู่หน่วยความจำครับ/ค่ะ

**Signature**

- `async import(options: { directory: string; extensions?: ImportFileExtension[] }): Promise<Map<string, Collection>>`

**Parameters**

| ชื่อพารามิเตอร์      | ประเภท     | ค่าเริ่มต้น    | คำอธิบาย                  |
| -------------------- | ---------- | -------------- | ------------------------- |
| `options.directory`  | `string`   | -              | พาธของไดเรกทอรีที่ต้องการนำเข้า |
| `options.extensions` | `string[]` | `['ts', 'js']` | สแกนนามสกุลไฟล์ที่ระบุ    |

**Example**

ไฟล์ `./collections/books.ts` กำหนด `คอลเลกชัน` ไว้ดังนี้ครับ/ค่ะ

```ts
export default {
  name: 'books',
  fields: [
    {
      type: 'string',
      name: 'title',
    },
  ],
};
```

นำเข้าการกำหนดค่าที่เกี่ยวข้องเมื่อปลั๊กอินโหลดครับ/ค่ะ

```ts
class Plugin {
  async load() {
    await this.app.db.import({
      directory: path.resolve(__dirname, './collections'),
    });
  }
}
```

## การลงทะเบียนและเรียกใช้ส่วนขยาย

### `registerFieldTypes()`

ลงทะเบียนประเภทฟิลด์ที่กำหนดเอง

**Signature**

- `registerFieldTypes(fieldTypes: MapOf<typeof Field>): void`

**Parameters**

`fieldTypes` คือคู่คีย์-ค่า โดยคีย์คือชื่อประเภทฟิลด์ และค่าคือคลาสประเภทฟิลด์ครับ/ค่ะ

**Example**

```ts
import { Field } from '@nocobase/database';

class MyField extends Field {
  // ...
}

db.registerFieldTypes({
  myField: MyField,
});
```

### `registerModels()`

ลงทะเบียนคลาสโมเดลข้อมูลที่กำหนดเอง

**Signature**

- `registerModels(models: MapOf<ModelStatic<any>>): void`

**Parameters**

`models` คือคู่คีย์-ค่า โดยคีย์คือชื่อโมเดลข้อมูล และค่าคือคลาสโมเดลข้อมูลครับ/ค่ะ

**Example**

```ts
import { Model } from '@nocobase/database';

class MyModel extends Model {
  // ...
}

db.registerModels({
  myModel: MyModel,
});

db.collection({
  name: 'myCollection',
  model: 'myModel',
});
```

### `registerRepositories()`

ลงทะเบียนคลาส Repository ที่กำหนดเอง

**Signature**

- `registerRepositories(repositories: MapOf<RepositoryType>): void`

**Parameters**

`repositories` คือคู่คีย์-ค่า โดยคีย์คือชื่อ Repository และค่าคือคลาส Repository ครับ/ค่ะ

**Example**

```ts
import { Repository } from '@nocobase/database';

class MyRepository extends Repository {
  // ...
}

db.registerRepositories({
  myRepository: MyRepository,
});

db.collection({
  name: 'myCollection',
  repository: 'myRepository',
});
```

### `registerOperators()`

ลงทะเบียนตัวดำเนินการ (operator) การสืบค้นข้อมูลที่กำหนดเอง

**Signature**

- `registerOperators(operators: MapOf<OperatorFunc>)`

**Parameters**

`operators` คือคู่คีย์-ค่า โดยคีย์คือชื่อตัวดำเนินการ และค่าคือฟังก์ชันที่สร้างคำสั่งเปรียบเทียบของตัวดำเนินการครับ/ค่ะ

**Example**

```ts
db.registerOperators({
  $dateOn(value) {
    return {
      [Op.and]: [
        { [Op.gte]: stringToDate(value) },
        { [Op.lt]: getNextDay(value) },
      ],
    };
  },
});

db.getRepository('books').count({
  filter: {
    createdAt: {
      // registered operator
      $dateOn: '2020-01-01',
    },
  },
});
```

### `getModel()`

รับคลาสโมเดลข้อมูลที่กำหนดไว้แล้วครับ/ค่ะ หากไม่มีการลงทะเบียนคลาสโมเดลที่กำหนดเองไว้ก่อนหน้านี้ ระบบจะส่งคืนคลาสโมเดลเริ่มต้นของ Sequelize โดยชื่อเริ่มต้นจะเหมือนกับชื่อที่กำหนดใน `คอลเลกชัน` ครับ/ค่ะ

**Signature**

- `getModel(name: string): Model`

**Parameters**

| ชื่อพารามิเตอร์ | ประเภท   | ค่าเริ่มต้น | คำอธิบาย            |
| ------ | -------- | ------ | ------------------ |
| `name` | `string` | -      | ชื่อโมเดลที่ลงทะเบียนไว้ |

**Example**

```ts
db.registerModels({
  books: class MyModel extends Model {},
});

const ModelClass = db.getModel('books');

console.log(ModelClass.prototype instanceof MyModel); // true
```

**หมายเหตุ:** คลาสโมเดลที่ได้จาก `คอลเลกชัน` จะไม่เท่ากับคลาสโมเดลที่ลงทะเบียนไว้โดยตรง แต่จะสืบทอดมาจากคลาสโมเดลที่ลงทะเบียนไว้ครับ/ค่ะ เนื่องจากคุณสมบัติของคลาสโมเดลใน Sequelize จะถูกแก้ไขในระหว่างกระบวนการเริ่มต้น NocoBase จึงจัดการความสัมพันธ์การสืบทอดนี้โดยอัตโนมัติครับ/ค่ะ นอกเหนือจากความไม่เท่ากันของคลาสแล้ว การกำหนดค่าอื่นๆ ทั้งหมดสามารถใช้งานได้ตามปกติครับ/ค่ะ

### `getRepository()`

รับคลาส Repository ที่กำหนดเองครับ/ค่ะ หากไม่มีการลงทะเบียนคลาส Repository ที่กำหนดเองไว้ก่อนหน้านี้ ระบบจะส่งคืนคลาส Repository เริ่มต้นของ NocoBase โดยชื่อเริ่มต้นจะเหมือนกับชื่อที่กำหนดใน `คอลเลกชัน` ครับ/ค่ะ

คลาส Repository ส่วนใหญ่จะใช้สำหรับการดำเนินการ CRUD (สร้าง, อ่าน, อัปเดต, ลบ) โดยอิงตามโมเดลข้อมูล โปรดดูที่ [Repository](/api/database/repository) ครับ/ค่ะ

**Signature**

- `getRepository(name: string): Repository`
- `getRepository(name: string, relationId?: string | number): Repository`

**Parameters**

| ชื่อพารามิเตอร์ | ประเภท               | ค่าเริ่มต้น | คำอธิบาย            |
| ------------ | -------------------- | ------ | ------------------ |
| `name`       | `string`             | -      | ชื่อ Repository ที่ลงทะเบียนไว้ |
| `relationId` | `string` \| `number` | -      | ค่า Foreign Key สำหรับข้อมูลความสัมพันธ์ |

เมื่อชื่อเป็นชื่อที่เกี่ยวข้อง เช่น `'tables.relations'` ระบบจะส่งคืนคลาส Repository ที่เกี่ยวข้องครับ/ค่ะ หากมีการระบุพารามิเตอร์ที่สอง Repository จะอิงตามค่า Foreign Key ของข้อมูลความสัมพันธ์เมื่อใช้งาน (เช่น การสืบค้น, การแก้ไข) ครับ/ค่ะ

**Example**

สมมติว่ามี `คอลเลกชัน` สองตารางคือ *บทความ* และ *ผู้เขียน* และ `คอลเลกชัน` บทความมี Foreign Key ที่ชี้ไปยัง `คอลเลกชัน` ผู้เขียนครับ/ค่ะ

```ts
const AuthorsRepo = db.getRepository('authors');
const author1 = AuthorsRepo.create({ name: 'author1' });

const PostsRepo = db.getRepository('authors.posts', author1.id);
const post1 = AuthorsRepo.create({ title: 'post1' });
asset(post1.authorId === author1.id); // true
```

## เหตุการณ์ของฐานข้อมูล

### `on()`

รับฟังเหตุการณ์ของฐานข้อมูล

**Signature**

- `on(event: string, listener: (...args: any[]) => void | Promise<void>): void`

**Parameters**

| ชื่อพารามิเตอร์ | ประเภท   | ค่าเริ่มต้น | คำอธิบาย        |
| -------- | -------- | ------ | -------------- |
| event    | string   | -      | ชื่อเหตุการณ์   |
| listener | Function | -      | ตัวรับฟังเหตุการณ์ |

ชื่อเหตุการณ์รองรับเหตุการณ์ Model ของ Sequelize โดยค่าเริ่มต้นครับ/ค่ะ สำหรับเหตุการณ์แบบ Global ให้รับฟังโดยใช้รูปแบบชื่อ `<sequelize_model_global_event>` และสำหรับเหตุการณ์ Model เดี่ยว ให้รับฟังโดยใช้รูปแบบชื่อ `<model_name>.<sequelize_model_event>` ครับ/ค่ะ

สำหรับคำอธิบายพารามิเตอร์และตัวอย่างโดยละเอียดของประเภทเหตุการณ์ในตัวทั้งหมด โปรดดูเนื้อหาในส่วน [เหตุการณ์ในตัว](#内置事件) ครับ/ค่ะ

### `off()`

ลบฟังก์ชันตัวรับฟังเหตุการณ์

**Signature**

- `off(name: string, listener: Function)`

**Parameters**

| ชื่อพารามิเตอร์ | ประเภท   | ค่าเริ่มต้น | คำอธิบาย        |
| -------- | -------- | ------ | -------------- |
| name     | string   | -      | ชื่อเหตุการณ์   |
| listener | Function | -      | ตัวรับฟังเหตุการณ์ |

**Example**

```ts
const listener = async (model, options) => {
  console.log(model);
};

db.on('afterCreate', listener);

db.off('afterCreate', listener);
```

## การดำเนินการกับฐานข้อมูล

### `auth()`

การยืนยันการเชื่อมต่อฐานข้อมูลครับ/ค่ะ สามารถใช้เพื่อยืนยันว่าแอปพลิเคชันได้สร้างการเชื่อมต่อกับข้อมูลแล้ว

**Signature**

- `auth(options: QueryOptions & { retry?: number } = {}): Promise<boolean>`

**Parameters**

| ชื่อพารามิเตอร์        | ประเภท                | ค่าเริ่มต้น | คำอธิบาย            |
| ---------------------- | --------------------- | ------- | ------------------ |
| `options?`             | `Object`              | -       | ตัวเลือกการยืนยัน   |
| `options.retry?`       | `number`              | `10`    | จำนวนครั้งที่ลองใหม่เมื่อการยืนยันล้มเหลว |
| `options.transaction?` | `Transaction`         | -       | ออบเจกต์ Transaction |
| `options.logging?`     | `boolean \| Function` | `false` | พิมพ์ล็อกหรือไม่     |

**Example**

```ts
await db.auth();
```

### `reconnect()`

เชื่อมต่อฐานข้อมูลใหม่

**Example**

```ts
await db.reconnect();
```

### `closed()`

ตรวจสอบว่าการเชื่อมต่อฐานข้อมูลถูกปิดแล้วหรือไม่

**Signature**

- `closed(): boolean`

### `close()`

ปิดการเชื่อมต่อฐานข้อมูล เทียบเท่ากับ `sequelize.close()` ครับ/ค่ะ

### `sync()`

ซิงโครไนซ์โครงสร้าง `คอลเลกชัน` ของฐานข้อมูลครับ/ค่ะ เทียบเท่ากับ `sequelize.sync()` สำหรับพารามิเตอร์ โปรดดู [เอกสารของ Sequelize](https://sequelize.org/api/v6/class/src/sequelize.js~sequelize#instance-method-sync) ครับ/ค่ะ

### `clean()`

ล้างฐานข้อมูล ซึ่งจะลบ `คอลเลกชัน` ทั้งหมด

**Signature**

- `clean(options: CleanOptions): Promise<void>`

**Parameters**

| ชื่อพารามิเตอร์       | ประเภท        | ค่าเริ่มต้น | คำอธิบาย            |
| --------------------- | ------------- | ------- | ------------------ |
| `options.drop`        | `boolean`     | `false` | ลบ `คอลเลกชัน` ทั้งหมดหรือไม่ |
| `options.skip`        | `string[]`    | -       | การกำหนดค่าชื่อ `คอลเลกชัน` ที่จะข้าม |
| `options.transaction` | `Transaction` | -       | ออบเจกต์ Transaction |

**Example**

ลบ `คอลเลกชัน` ทั้งหมด ยกเว้น `คอลเลกชัน` `users` ครับ/ค่ะ

```ts
await db.clean({
  drop: true,
  skip: ['users'],
});
```

## การส่งออกระดับแพ็กเกจ

### `defineCollection()`

สร้างเนื้อหาการกำหนดค่าสำหรับ `คอลเลกชัน`

**Signature**

- `defineCollection(name: string, config: CollectionOptions): CollectionOptions`

**Parameters**

| ชื่อพารามิเตอร์     | ประเภท              | ค่าเริ่มต้น | คำอธิบาย                                |
| ------------------- | ------------------- | ------ | --------------------------------------- |
| `collectionOptions` | `CollectionOptions` | -      | เหมือนกับพารามิเตอร์ทั้งหมดของ `db.collection()` ครับ/ค่ะ |

**Example**

สำหรับไฟล์กำหนดค่า `คอลเลกชัน` ที่จะถูกนำเข้าโดย `db.import()` ครับ/ค่ะ

```ts
import { defineCollection } from '@nocobase/database';

export default defineCollection({
  name: 'users',
  fields: [
    {
      type: 'string',
      name: 'name',
    },
  ],
});
```

### `extendCollection()`

ขยายเนื้อหาการกำหนดค่าโครงสร้าง `คอลเลกชัน` ที่อยู่ในหน่วยความจำ ซึ่งส่วนใหญ่ใช้สำหรับเนื้อหาไฟล์ที่นำเข้าโดยเมธอด `import()` ครับ/ค่ะ เมธอดนี้เป็นเมธอดระดับบนสุดที่ส่งออกโดยแพ็กเกจ `@nocobase/database` และไม่ได้ถูกเรียกผ่านอินสแตนซ์ของ `db` นอกจากนี้ยังสามารถใช้ชื่อเรียกแทน `extend` ได้ด้วยครับ/ค่ะ

**Signature**

- `extendCollection(collectionOptions: CollectionOptions, mergeOptions?: MergeOptions): ExtendedCollectionOptions`

**Parameters**

| ชื่อพารามิเตอร์     | ประเภท              | ค่าเริ่มต้น | คำอธิบาย                                                           |
| ------------------- | ------------------- | ------ | ------------------------------------------------------------------ |
| `collectionOptions` | `CollectionOptions` | -      | เหมือนกับพารามิเตอร์ทั้งหมดของ `db.collection()` ครับ/ค่ะ            |
| `mergeOptions?`     | `MergeOptions`      | -      | พารามิเตอร์สำหรับแพ็กเกจ npm [deepmerge](https://npmjs.com/package/deepmerge) ครับ/ค่ะ |

**Example**

การกำหนด `คอลเลกชัน` books ดั้งเดิม (books.ts):

```ts
export default {
  name: 'books',
  fields: [{ name: 'title', type: 'string' }],
};
```

การขยายการกำหนด `คอลเลกชัน` books (books.extend.ts):

```ts
import { extend } from '@nocobase/database';

// ขยายอีกครั้ง
export default extend({
  name: 'books',
  fields: [{ name: 'price', type: 'number' }],
});
```

หากไฟล์ทั้งสองข้างต้นถูกนำเข้าเมื่อเรียกใช้ `import()` หลังจากถูกขยายอีกครั้งด้วย `extend()` `คอลเลกชัน` books จะมีฟิลด์ `title` และ `price` ครับ/ค่ะ

เมธอดนี้มีประโยชน์อย่างมากในการขยายโครงสร้าง `คอลเลกชัน` ที่ถูกกำหนดไว้แล้วโดยปลั๊กอินที่มีอยู่ครับ/ค่ะ

## เหตุการณ์ในตัว

ฐานข้อมูลจะทริกเกอร์เหตุการณ์ที่เกี่ยวข้องต่อไปนี้ในแต่ละช่วงของวงจรชีวิตครับ/ค่ะ การสมัครรับเหตุการณ์เหล่านี้ด้วยเมธอด `on()` จะช่วยให้สามารถจัดการเฉพาะเจาะจงเพื่อตอบสนองความต้องการทางธุรกิจบางอย่างได้ครับ/ค่ะ

### `'beforeSync'` / `'afterSync'`

ทริกเกอร์ก่อนและหลังการซิงโครไนซ์การกำหนดค่าโครงสร้าง `คอลเลกชัน` ใหม่ (เช่น ฟิลด์, ดัชนี) ไปยังฐานข้อมูลครับ/ค่ะ โดยปกติจะทริกเกอร์เมื่อมีการเรียกใช้ `collection.sync()` (การเรียกภายใน) และมักใช้สำหรับการจัดการตรรกะสำหรับการขยายฟิลด์พิเศษบางอย่างครับ/ค่ะ

**Signature**

```ts
on(eventName: `${string}.beforeSync` | 'beforeSync' | `${string}.afterSync` | 'afterSync', listener: SyncListener): this
```

**Type**

```ts
import type { SyncOptions, HookReturn } from 'sequelize/types';

type SyncListener = (options?: SyncOptions) => HookReturn;
```

**Example**

```ts
const users = db.collection({
  name: 'users',
  fields: [{ type: 'string', name: 'username' }],
});

db.on('beforeSync', async (options) => {
  // ทำบางอย่าง
});

db.on('users.afterSync', async (options) => {
  // ทำบางอย่าง
});

await users.sync();
```

### `'beforeValidate'` / `'afterValidate'`

ก่อนที่จะสร้างหรืออัปเดตข้อมูล จะมีกระบวนการตรวจสอบข้อมูลตามกฎที่กำหนดใน `คอลเลกชัน` ครับ/ค่ะ เหตุการณ์ที่เกี่ยวข้องจะถูกทริกเกอร์ก่อนและหลังการตรวจสอบ ซึ่งจะเกิดขึ้นเมื่อมีการเรียกใช้ `repository.create()` หรือ `repository.update()` ครับ/ค่ะ

**Signature**

```ts
on(eventName: `${string}.beforeValidate` | 'beforeValidate' | `${string}.afterValidate` | 'afterValidate', listener: ValidateListener): this
```

**Type**

```ts
import type { ValidationOptions } from 'sequelize/types/lib/instance-validator';
import type { HookReturn } from 'sequelize/types';
import type { Model } from '@nocobase/database';

type ValidateListener = (
  model: Model,
  options?: ValidationOptions,
) => HookReturn;
```

**Example**

```ts
db.collection({
  name: 'tests',
  fields: [
    {
      type: 'string',
      name: 'email',
      validate: {
        isEmail: true,
      },
    },
  ],
});

// ทุกโมเดล
db.on('beforeValidate', async (model, options) => {
  // ทำบางอย่าง
});
// โมเดล tests
db.on('tests.beforeValidate', async (model, options) => {
  // ทำบางอย่าง
});

// ทุกโมเดล
db.on('afterValidate', async (model, options) => {
  // ทำบางอย่าง
});
// โมเดล tests
db.on('tests.afterValidate', async (model, options) => {
  // ทำบางอย่าง
});

const repository = db.getRepository('tests');
await repository.create({
  values: {
    email: 'abc', // ตรวจสอบรูปแบบอีเมล
  },
});
// หรือ
await repository.update({
  filterByTk: 1,
  values: {
    email: 'abc', // ตรวจสอบรูปแบบอีเมล
  },
});
```

### `'beforeCreate'` / `'afterCreate'`

เหตุการณ์ที่เกี่ยวข้องจะถูกทริกเกอร์ก่อนและหลังการสร้างเรคคอร์ดข้อมูลครับ/ค่ะ ซึ่งจะเกิดขึ้นเมื่อมีการเรียกใช้ `repository.create()` ครับ/ค่ะ

**Signature**

```ts
on(eventName: `${string}.beforeCreate` | 'beforeCreate' | `${string}.afterCreate` | 'afterCreate', listener: CreateListener): this
```

**Type**

```ts
import type { CreateOptions, HookReturn } from 'sequelize/types';
import type { Model } from '@nocobase/database';

export type CreateListener = (
  model: Model,
  options?: CreateOptions,
) => HookReturn;
```

**Example**

```ts
db.on('beforeCreate', async (model, options) => {
  // ทำบางอย่าง
});

db.on('books.afterCreate', async (model, options) => {
  const { transaction } = options;
  const result = await model.constructor.findByPk(model.id, {
    transaction,
  });
  console.log(result);
});
```

### `'beforeUpdate'` / `'afterUpdate'`

เหตุการณ์ที่เกี่ยวข้องจะถูกทริกเกอร์ก่อนและหลังการอัปเดตเรคคอร์ดข้อมูลครับ/ค่ะ ซึ่งจะเกิดขึ้นเมื่อมีการเรียกใช้ `repository.update()` ครับ/ค่ะ

**Signature**

```ts
on(eventName: `${string}.beforeUpdate` | 'beforeUpdate' | `${string}.afterUpdate` | 'afterUpdate', listener: UpdateListener): this
```

**Type**

```ts
import type { UpdateOptions, HookReturn } from 'sequelize/types';
import type { Model } from '@nocobase/database';

export type UpdateListener = (
  model: Model,
  options?: UpdateOptions,
) => HookReturn;
```

**Example**

```ts
db.on('beforeUpdate', async (model, options) => {
  // ทำบางอย่าง
});

db.on('books.afterUpdate', async (model, options) => {
  // ทำบางอย่าง
});
```

### `'beforeSave'` / `'afterSave'`

เหตุการณ์ที่เกี่ยวข้องจะถูกทริกเกอร์ก่อนและหลังการสร้างหรืออัปเดตเรคคอร์ดข้อมูลครับ/ค่ะ ซึ่งจะเกิดขึ้นเมื่อมีการเรียกใช้ `repository.create()` หรือ `repository.update()` ครับ/ค่ะ

**Signature**

```ts
on(eventName: `${string}.beforeSave` | 'beforeSave' | `${string}.afterSave` | 'afterSave', listener: SaveListener): this
```

**Type**

```ts
import type { SaveOptions, HookReturn } from 'sequelize/types';
import type { Model } from '@nocobase/database';

export type SaveListener = (model: Model, options?: SaveOptions) => HookReturn;
```

**Example**

```ts
db.on('beforeSave', async (model, options) => {
  // ทำบางอย่าง
});

db.on('books.afterSave', async (model, options) => {
  // ทำบางอย่าง
});
```

### `'beforeDestroy'` / `'afterDestroy'`

เหตุการณ์ที่เกี่ยวข้องจะถูกทริกเกอร์ก่อนและหลังการลบเรคคอร์ดข้อมูลครับ/ค่ะ ซึ่งจะเกิดขึ้นเมื่อมีการเรียกใช้ `repository.destroy()` ครับ/ค่ะ

**Signature**

```ts
on(eventName: `${string}.beforeDestroy` | 'beforeDestroy' | `${string}.afterDestroy` | 'afterDestroy', listener: DestroyListener): this
```

**Type**

```ts
import type { DestroyOptions, HookReturn } from 'sequelize/types';
import type { Model } from '@nocobase/database';

export type DestroyListener = (
  model: Model,
  options?: DestroyOptions,
) => HookReturn;
```

**Example**

```ts
db.on('beforeDestroy', async (model, options) => {
  // ทำบางอย่าง
});

db.on('books.afterDestroy', async (model, options) => {
  // ทำบางอย่าง
});
```

### `'afterCreateWithAssociations'`

เหตุการณ์นี้จะถูกทริกเกอร์หลังจากสร้างเรคคอร์ดข้อมูลที่มีความสัมพันธ์แบบลำดับชั้นครับ/ค่ะ ซึ่งจะเกิดขึ้นเมื่อมีการเรียกใช้ `repository.create()` ครับ/ค่ะ

**Signature**

```ts
on(eventName: `${string}.afterCreateWithAssociations` | 'afterCreateWithAssociations', listener: CreateWithAssociationsListener): this
```

**Type**

```ts
import type { CreateOptions, HookReturn } from 'sequelize/types';
import type { Model } from '@nocobase/database';

export type CreateWithAssociationsListener = (
  model: Model,
  options?: CreateOptions,
) => HookReturn;
```

**Example**

```ts
db.on('afterCreateWithAssociations', async (model, options) => {
  // ทำบางอย่าง
});

db.on('books.afterCreateWithAssociations', async (model, options) => {
  // ทำบางอย่าง
});
```

### `'afterUpdateWithAssociations'`

เหตุการณ์นี้จะถูกทริกเกอร์หลังจากอัปเดตเรคคอร์ดข้อมูลที่มีความสัมพันธ์แบบลำดับชั้นครับ/ค่ะ ซึ่งจะเกิดขึ้นเมื่อมีการเรียกใช้ `repository.update()` ครับ/ค่ะ

**Signature**

```ts
on(eventName: `${string}.afterUpdateWithAssociations` | 'afterUpdateWithAssociations', listener: CreateWithAssociationsListener): this
```

**Type**

```ts
import type { UpdateOptions, HookReturn } from 'sequelize/types';
import type { Model } from '@nocobase/database';

export type UpdateWithAssociationsListener = (
  model: Model,
  options?: UpdateOptions,
) => HookReturn;
```

**Example**

```ts
db.on('afterUpdateWithAssociations', async (model, options) => {
  // ทำบางอย่าง
});

db.on('books.afterUpdateWithAssociations', async (model, options) => {
  // ทำบางอย่าง
});
```

### `'afterSaveWithAssociations'`

เหตุการณ์นี้จะถูกทริกเกอร์หลังจากสร้างหรืออัปเดตเรคคอร์ดข้อมูลที่มีความสัมพันธ์แบบลำดับชั้นครับ/ค่ะ ซึ่งจะเกิดขึ้นเมื่อมีการเรียกใช้ `repository.create()` หรือ `repository.update()` ครับ/ค่ะ

**Signature**

```ts
on(eventName: `${string}.afterSaveWithAssociations` | 'afterSaveWithAssociations', listener: SaveWithAssociationsListener): this
```

**Type**

```ts
import type { SaveOptions, HookReturn } from 'sequelize/types';
import type { Model } from '@nocobase/database';

export type SaveWithAssociationsListener = (
  model: Model,
  options?: SaveOptions,
) => HookReturn;
```

**Example**

```ts
db.on('afterSaveWithAssociations', async (model, options) => {
  // ทำบางอย่าง
});

db.on('books.afterSaveWithAssociations', async (model, options) => {
  // ทำบางอย่าง
});
```

### `'beforeDefineCollection'`

ทริกเกอร์ก่อนที่จะกำหนด `คอลเลกชัน` เช่น เมื่อมีการเรียกใช้ `db.collection()` ครับ/ค่ะ

**หมายเหตุ:** เหตุการณ์นี้เป็นเหตุการณ์แบบ Synchronous ครับ/ค่ะ

**Signature**

```ts
on(eventName: 'beforeDefineCollection', listener: BeforeDefineCollectionListener): this
```

**Type**

```ts
import type { CollectionOptions } from '@nocobase/database';

export type BeforeDefineCollectionListener = (
  options: CollectionOptions,
) => void;
```

**Example**

```ts
db.on('beforeDefineCollection', (options) => {
  // ทำบางอย่าง
});
```

### `'afterDefineCollection'`

ทริกเกอร์หลังจากที่กำหนด `คอลเลกชัน` แล้ว เช่น เมื่อมีการเรียกใช้ `db.collection()` ครับ/ค่ะ

**หมายเหตุ:** เหตุการณ์นี้เป็นเหตุการณ์แบบ Synchronous ครับ/ค่ะ

**Signature**

```ts
on(eventName: 'afterDefineCollection', listener: AfterDefineCollectionListener): this
```

**Type**

```ts
import type { Collection } from '@nocobase/database';

export type AfterDefineCollectionListener = (options: Collection) => void;
```

**Example**

```ts
db.on('afterDefineCollection', (collection) => {
  // ทำบางอย่าง
});
```

### `'beforeRemoveCollection'` / `'afterRemoveCollection'`

ทริกเกอร์ก่อนและหลังการลบ `คอลเลกชัน` ออกจากหน่วยความจำ เช่น เมื่อมีการเรียกใช้ `db.removeCollection()` ครับ/ค่ะ

**หมายเหตุ:** เหตุการณ์นี้เป็นเหตุการณ์แบบ Synchronous ครับ/ค่ะ

**Signature**

```ts
on(eventName: 'beforeRemoveCollection' | 'afterRemoveCollection', listener: RemoveCollectionListener): this
```

**Type**

```ts
import type { Collection } from '@nocobase/database';

export type RemoveCollectionListener = (options: Collection) => void;
```

**Example**

```ts
db.on('beforeRemoveCollection', (collection) => {
  // ทำบางอย่าง
});

db.on('afterRemoveCollection', (collection) => {
  // ทำบางอย่าง
});
```