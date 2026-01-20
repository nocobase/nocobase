:::tip
เอกสารนี้แปลโดย AI หากมีข้อมูลที่ไม่ถูกต้อง โปรดดู[เวอร์ชันภาษาอังกฤษ](/en)
:::


# คอลเลกชัน

## ภาพรวม

`คอลเลกชัน` ใช้สำหรับกำหนดโครงสร้างข้อมูล (data model) ในระบบ เช่น ชื่อโมเดล, ฟิลด์, อินเด็กซ์, ความสัมพันธ์ และข้อมูลอื่นๆ ครับ/ค่ะ
โดยทั่วไปแล้ว จะเรียกใช้งานผ่านเมธอด `collection` ของอินสแตนซ์ `Database` เป็นจุดเริ่มต้นครับ/ค่ะ

```javascript
const { Database } = require('@nocobase/database')

// สร้างอินสแตนซ์ฐานข้อมูล
const db = new Database({...});

// กำหนดโครงสร้างข้อมูล
db.collection({
  name: 'users',
  // กำหนดฟิลด์ของโมเดล
  fields: [
    // ฟิลด์แบบ Scalar
    {
      name: 'name',
      type: 'string',
    },

    // ฟิลด์ความสัมพันธ์
    {
      name: 'profile',
      type: 'hasOne' // 'hasMany', 'belongsTo', 'belongsToMany'
    }
  ],
});
```

สำหรับประเภทฟิลด์เพิ่มเติม โปรดดูที่ [Fields](/api/database/field) ครับ/ค่ะ

## Constructor

**รูปแบบการใช้งาน (Signature)**

- `constructor(options: CollectionOptions, context: CollectionContext)`

**พารามิเตอร์**

| ชื่อพารามิเตอร์                | ประเภท                                                        | ค่าเริ่มต้น | คำอธิบาย                                                                                   |
| --------------------- | ----------------------------------------------------------- | ------ | -------------------------------------------------------------------------------------- |
| `options.name`        | `string`                                                    | -      | ตัวระบุคอลเลกชัน                                                                        |
| `options.tableName?`  | `string`                                                    | -      | ชื่อตารางในฐานข้อมูล หากไม่ได้ระบุ จะใช้ค่าจาก `options.name` ครับ/ค่ะ            |
| `options.fields?`     | `FieldOptions[]`                                            | -      | การกำหนดฟิลด์ โปรดดูรายละเอียดที่ [Field](./field) ครับ/ค่ะ                         |
| `options.model?`      | `string \| ModelStatic<Model>`                              | -      | ประเภท Model ของ Sequelize หากใช้ `string` จะต้องมีการลงทะเบียนชื่อโมเดลนั้นไว้ใน db ก่อนครับ/ค่ะ |
| `options.repository?` | `string \| RepositoryType`                                  | -      | ประเภท Repository หากใช้ `string` จะต้องมีการลงทะเบียนประเภท Repository นั้นไว้ใน db ก่อนครับ/ค่ะ                |
| `options.sortable?`   | `string \| boolean \| { name?: string; scopeKey?: string }` | -      | การตั้งค่าฟิลด์ที่สามารถเรียงลำดับได้ โดยค่าเริ่มต้นจะไม่เรียงลำดับครับ/ค่ะ                          |
| `options.autoGenId?`  | `boolean`                                                   | `true` | จะสร้าง Primary Key ที่ไม่ซ้ำกันโดยอัตโนมัติหรือไม่ ค่าเริ่มต้นคือ `true` ครับ/ค่ะ                                                    |
| `context.database`    | `Database`                                                  | -      | อินสแตนซ์ฐานข้อมูลในบริบทปัจจุบัน                                                                 |

**ตัวอย่าง**

สร้างคอลเลกชันสำหรับโพสต์:

```ts
const posts = new Collection(
  {
    name: 'posts',
    fields: [
      {
        type: 'string',
        name: 'title',
      },
      {
        type: 'double',
        name: 'price',
      },
    ],
  },
  {
    // อินสแตนซ์ฐานข้อมูลที่มีอยู่แล้ว
    database: db,
  },
);
```

## สมาชิกของอินสแตนซ์

### `options`

พารามิเตอร์การตั้งค่าเริ่มต้นสำหรับคอลเลกชัน ซึ่งเหมือนกับพารามิเตอร์ `options` ของ Constructor ครับ/ค่ะ

### `context`

บริบทที่คอลเลกชันปัจจุบันสังกัดอยู่ ซึ่งส่วนใหญ่คืออินสแตนซ์ฐานข้อมูลครับ/ค่ะ

### `name`

ชื่อคอลเลกชันครับ/ค่ะ

### `db`

อินสแตนซ์ฐานข้อมูลที่คอลเลกชันนี้สังกัดอยู่ครับ/ค่ะ

### `filterTargetKey`

ชื่อฟิลด์ที่ใช้เป็น Primary Key ครับ/ค่ะ

### `isThrough`

เป็นคอลเลกชันแบบ Through หรือไม่ครับ/ค่ะ

### `model`

ประเภท Model ที่ตรงกับ Sequelize ครับ/ค่ะ

### `repository`

อินสแตนซ์ Repository ครับ/ค่ะ

## เมธอดสำหรับตั้งค่าฟิลด์

### `getField()`

ใช้สำหรับดึงออบเจกต์ฟิลด์ที่มีชื่อตรงกันซึ่งถูกกำหนดไว้ในคอลเลกชันครับ/ค่ะ

**รูปแบบการใช้งาน (Signature)**

- `getField(name: string): Field`

**พารามิเตอร์**

| ชื่อพารามิเตอร์ | ประเภท     | ค่าเริ่มต้น | คำอธิบาย     |
| ------ | -------- | ------ | -------- |
| `name` | `string` | -      | ชื่อฟิลด์ |

**ตัวอย่าง**

```ts
const posts = db.collection({
  name: 'posts',
  fields: [
    {
      type: 'string',
      name: 'title',
    },
  ],
});

const field = posts.getField('title');
```

### `setField()`

ใช้สำหรับตั้งค่าฟิลด์ให้กับคอลเลกชันครับ/ค่ะ

**รูปแบบการใช้งาน (Signature)**

- `setField(name: string, options: FieldOptions): Field`

**พารามิเตอร์**

| ชื่อพารามิเตอร์    | ประเภท           | ค่าเริ่มต้น | คำอธิบาย                            |
| --------- | -------------- | ------ | ------------------------------- |
| `name`    | `string`       | -      | ชื่อฟิลด์                        |
| `options` | `FieldOptions` | -      | การตั้งค่าฟิลด์ โปรดดูรายละเอียดที่ [Field](./field) ครับ/ค่ะ |

**ตัวอย่าง**

```ts
const posts = db.collection({ name: 'posts' });

posts.setField('title', { type: 'string' });
```

### `setFields()`

ใช้สำหรับตั้งค่าหลายฟิลด์ให้กับคอลเลกชันพร้อมกันครับ/ค่ะ

**รูปแบบการใช้งาน (Signature)**

- `setFields(fields: FieldOptions[], resetFields = true): Field[]`

**พารามิเตอร์**

| ชื่อพารามิเตอร์        | ประเภท             | ค่าเริ่มต้น | คำอธิบาย                            |
| ------------- | ---------------- | ------ | ------------------------------- |
| `fields`      | `FieldOptions[]` | -      | การตั้งค่าฟิลด์ โปรดดูรายละเอียดที่ [Field](./field) ครับ/ค่ะ |
| `resetFields` | `boolean`        | `true` | จะรีเซ็ตฟิลด์ที่มีอยู่แล้วหรือไม่            |

**ตัวอย่าง**

```ts
const posts = db.collection({ name: 'posts' });

posts.setFields([
  { type: 'string', name: 'title' },
  { type: 'double', name: 'price' },
]);
```

### `removeField()`

ใช้สำหรับลบออบเจกต์ฟิลด์ที่มีชื่อตรงกันซึ่งถูกกำหนดไว้ในคอลเลกชันครับ/ค่ะ

**รูปแบบการใช้งาน (Signature)**

- `removeField(name: string): void | Field`

**พารามิเตอร์**

| ชื่อพารามิเตอร์ | ประเภท     | ค่าเริ่มต้น | คำอธิบาย     |
| ------ | -------- | ------ | -------- |
| `name` | `string` | -      | ชื่อฟิลด์ |

**ตัวอย่าง**

```ts
const posts = db.collection({
  name: 'posts',
  fields: [
    {
      type: 'string',
      name: 'title',
    },
  ],
});

posts.removeField('title');
```

### `resetFields()`

ใช้สำหรับรีเซ็ต (ล้าง) ฟิลด์ทั้งหมดของคอลเลกชันครับ/ค่ะ

**รูปแบบการใช้งาน (Signature)**

- `resetFields(): void`

**ตัวอย่าง**

```ts
const posts = db.collection({
  name: 'posts',
  fields: [
    {
      type: 'string',
      name: 'title',
    },
  ],
});

posts.resetFields();
```

### `hasField()`

ใช้สำหรับตรวจสอบว่ามีออบเจกต์ฟิลด์ที่มีชื่อตรงกันถูกกำหนดไว้ในคอลเลกชันหรือไม่ครับ/ค่ะ

**รูปแบบการใช้งาน (Signature)**

- `hasField(name: string): boolean`

**พารามิเตอร์**

| ชื่อพารามิเตอร์ | ประเภท     | ค่าเริ่มต้น | คำอธิบาย     |
| ------ | -------- | ------ | -------- |
| `name` | `string` | -      | ชื่อฟิลด์ |

**ตัวอย่าง**

```ts
const posts = db.collection({
  name: 'posts',
  fields: [
    {
      type: 'string',
      name: 'title',
    },
  ],
});

posts.hasField('title'); // true
```

### `findField()`

ใช้สำหรับค้นหาออบเจกต์ฟิลด์ในคอลเลกชันที่ตรงตามเงื่อนไขที่กำหนดครับ/ค่ะ

**รูปแบบการใช้งาน (Signature)**

- `findField(predicate: (field: Field) => boolean): Field | undefined`

**พารามิเตอร์**

| ชื่อพารามิเตอร์      | ประเภท                        | ค่าเริ่มต้น | คำอธิบาย     |
| ----------- | --------------------------- | ------ | -------- |
| `predicate` | `(field: Field) => boolean` | -      | เงื่อนไขการค้นหา |

**ตัวอย่าง**

```ts
const posts = db.collection({
  name: 'posts',
  fields: [
    {
      type: 'string',
      name: 'title',
    },
  ],
});

posts.findField((field) => field.name === 'title');
```

### `forEachField()`

ใช้สำหรับวนซ้ำ (iterate) ออบเจกต์ฟิลด์ทั้งหมดในคอลเลกชันครับ/ค่ะ

**รูปแบบการใช้งาน (Signature)**

- `forEachField(callback: (field: Field) => void): void`

**พารามิเตอร์**

| ชื่อพารามิเตอร์     | ประเภท                     | ค่าเริ่มต้น | คำอธิบาย     |
| ---------- | ------------------------ | ------ | -------- |
| `callback` | `(field: Field) => void` | -      | ฟังก์ชัน Callback |

**ตัวอย่าง**

```ts
const posts = db.collection({
  name: 'posts',
  fields: [
    {
      type: 'string',
      name: 'title',
    },
  ],
});

posts.forEachField((field) => console.log(field.name));
```

## เมธอดสำหรับตั้งค่าอินเด็กซ์

### `addIndex()`

ใช้สำหรับเพิ่มอินเด็กซ์ให้กับคอลเลกชันครับ/ค่ะ

**รูปแบบการใช้งาน (Signature)**

- `addIndex(index: string | string[] | { fields: string[], unique?: boolean,[key: string]: any })`

**พารามิเตอร์**

| ชื่อพารามิเตอร์  | ประเภท                                                         | ค่าเริ่มต้น | คำอธิบาย                 |
| ------- | ------------------------------------------------------------ | ------ | -------------------- |
| `index` | `string \| string[]`                                         | -      | ชื่อฟิลด์ที่ต้องการตั้งค่าอินเด็กซ์ |
| `index` | `{ fields: string[], unique?: boolean, [key: string]: any }` | -      | การตั้งค่าแบบสมบูรณ์             |

**ตัวอย่าง**

```ts
const posts = db.collection({
  name: 'posts',
  fields: [
    {
      type: 'string',
      name: 'title',
    },
  ],
});

posts.addIndex({
  fields: ['title'],
  unique: true,
});
```

### `removeIndex()`

ใช้สำหรับลบอินเด็กซ์ออกจากคอลเลกชันครับ/ค่ะ

**รูปแบบการใช้งาน (Signature)**

- `removeIndex(fields: string[])`

**พารามิเตอร์**

| ชื่อพารามิเตอร์   | ประเภท       | ค่าเริ่มต้น | คำอธิบาย                     |
| -------- | ---------- | ------ | ------------------------ |
| `fields` | `string[]` | -      | ชุดชื่อฟิลด์ของอินเด็กซ์ที่ต้องการลบ |

**ตัวอย่าง**

```ts
const posts = db.collection({
  name: 'posts',
  fields: [
    {
      type: 'string',
      name: 'title',
    },
  ],
  indexes: [
    {
      fields: ['title'],
      unique: true,
    },
  ],
});

posts.removeIndex(['title']);
```

## เมธอดสำหรับตั้งค่าคอลเลกชัน

### `remove()`

ใช้สำหรับลบคอลเลกชันครับ/ค่ะ

**รูปแบบการใช้งาน (Signature)**

- `remove(): void`

**ตัวอย่าง**

```ts
const posts = db.collection({
  name: 'posts',
  fields: [
    {
      type: 'string',
      name: 'title',
    },
  ],
});

posts.remove();
```

## เมธอดสำหรับดำเนินการกับฐานข้อมูล

### `sync()`

ใช้สำหรับซิงค์การกำหนดคอลเลกชันไปยังฐานข้อมูลครับ/ค่ะ นอกเหนือจากตรรกะเริ่มต้นของ `Model.sync` ใน Sequelize แล้ว เมธอดนี้ยังจัดการกับคอลเลกชันที่เกี่ยวข้องกับฟิลด์ความสัมพันธ์ด้วยครับ/ค่ะ

**รูปแบบการใช้งาน (Signature)**

- `sync(): Promise<void>`

**ตัวอย่าง**

```ts
const posts = db.collection({
  name: 'posts',
  fields: [
    {
      type: 'string',
      name: 'title',
    },
  ],
});

await posts.sync();
```

### `existsInDb()`

ใช้สำหรับตรวจสอบว่าคอลเลกชันมีอยู่ในฐานข้อมูลหรือไม่ครับ/ค่ะ

**รูปแบบการใช้งาน (Signature)**

- `existsInDb(options?: Transactionable): Promise<boolean>`

**พารามิเตอร์**

| ชื่อพารามิเตอร์                 | ประเภท          | ค่าเริ่มต้น | คำอธิบาย     |
| ---------------------- | ------------- | ------ | -------- |
| `options?.transaction` | `Transaction` | -      | อินสแตนซ์ Transaction |

**ตัวอย่าง**

```ts
const posts = db.collection({
  name: 'posts',
  fields: [
    {
      type: 'string',
      name: 'title',
    },
  ],
});

const existed = await posts.existsInDb();

console.log(existed); // false
```

### `removeFromDb()`

**รูปแบบการใช้งาน (Signature)**

- `removeFromDb(): Promise<void>`

**ตัวอย่าง**

```ts
const books = db.collection({
  name: 'books',
});

// ซิงค์คอลเลกชันหนังสือไปยังฐานข้อมูล
await db.sync();

// ลบคอลเลกชันหนังสือออกจากฐานข้อมูล
await books.removeFromDb();
```