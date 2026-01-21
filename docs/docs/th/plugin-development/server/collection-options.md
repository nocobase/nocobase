:::tip
เอกสารนี้แปลโดย AI หากมีข้อมูลที่ไม่ถูกต้อง โปรดดู[เวอร์ชันภาษาอังกฤษ](/en)
:::


## พารามิเตอร์การตั้งค่าคอลเลกชัน

```ts
export type MigrationRule =
  | 'overwrite'
  | 'skip'
  | 'upsert'
  | 'schema-only'
  | 'insert-ignore';

export interface CollectionOptions {
  name: string;
  title?: string;
  migrationRules?: MigrationRule[];
  inherits?: string[] | string;
  filterTargetKey?: string | string[];
  fields?: FieldOptions[];
  model?: string | ModelStatic<Model>;
  repository?: string | RepositoryType;
  autoGenId?: boolean;
  timestamps?: boolean;
  createdAt?: boolean;
  updatedAt?: boolean;
  deletedAt?: boolean;
  paranoid?: boolean;
  underscored?: boolean;
  indexes?: ModelIndexesOptions[];
}
```

### `name` - ชื่อคอลเลกชัน
- **ประเภท**: `string`
- **จำเป็น**: ✅
- **คำอธิบาย**: เป็นตัวระบุที่ไม่ซ้ำกันสำหรับคอลเลกชัน ซึ่งต้องไม่ซ้ำกันตลอดทั้งแอปพลิเคชันครับ/ค่ะ
- **ตัวอย่าง**:
```typescript
{
  name: 'users'  // คอลเลกชันผู้ใช้งาน
}
```

### `title` - ชื่อเรื่องคอลเลกชัน
- **ประเภท**: `string`
- **จำเป็น**: ❌
- **คำอธิบาย**: ชื่อเรื่องสำหรับแสดงผลของคอลเลกชัน ใช้สำหรับแสดงในส่วนหน้า (frontend) ของอินเทอร์เฟซครับ/ค่ะ
- **ตัวอย่าง**:
```typescript
{
  name: 'users',
  title: 'การจัดการผู้ใช้งาน'  // แสดงเป็น "การจัดการผู้ใช้งาน" ในอินเทอร์เฟซ
}
```

### `migrationRules` - กฎการย้ายข้อมูล (Migration Rules)
- **ประเภท**: `MigrationRule[]`
- **จำเป็น**: ❌
- **คำอธิบาย**: กฎสำหรับการประมวลผลเมื่อมีการย้ายข้อมูลครับ/ค่ะ
- **ตัวอย่าง**:
```typescript
{
  name: 'users',
  migrationRules: ['overwrite'],  // เขียนทับข้อมูลที่มีอยู่
  fields: [...]
}
```

### `inherits` - การสืบทอดคอลเลกชัน
- **ประเภท**: `string[] | string`
- **จำเป็น**: ❌
- **คำอธิบาย**: ใช้สำหรับสืบทอดการกำหนดฟิลด์จากคอลเลกชันอื่น ๆ ครับ/ค่ะ รองรับการสืบทอดจากคอลเลกชันเดียวหรือหลายคอลเลกชัน
- **ตัวอย่าง**:

```typescript
// การสืบทอดแบบเดี่ยว
{
  name: 'admin_users',
  inherits: 'users',  // สืบทอดฟิลด์ทั้งหมดจากคอลเลกชันผู้ใช้งาน
  fields: [
    {
      type: 'string',
      name: 'admin_level'
    }
  ]
}

// การสืบทอดแบบหลายรายการ
{
  name: 'super_admin_users',
  inherits: ['users', 'admin_users'],  // สืบทอดจากหลายคอลเลกชัน
  fields: [...]
}
```

### `filterTargetKey` - คีย์เป้าหมายสำหรับการกรอง
- **ประเภท**: `string | string[]`
- **จำเป็น**: ❌
- **คำอธิบาย**: คีย์เป้าหมายที่ใช้สำหรับการกรองข้อมูลในการสอบถาม (query) ครับ/ค่ะ รองรับทั้งคีย์เดียวและหลายคีย์
- **ตัวอย่าง**:
```typescript
{
  name: 'user_posts',
  filterTargetKey: 'userId',  // กรองตาม User ID
  fields: [...]
}

// หลายคีย์สำหรับการกรอง
{
  name: 'user_category_posts',
  filterTargetKey: ['userId', 'categoryId'],  // กรองตาม User ID และ Category ID
  fields: [...]
}
```

### `fields` - การกำหนดฟิลด์
- **ประเภท**: `FieldOptions[]`
- **จำเป็น**: ❌
- **ค่าเริ่มต้น**: `[]`
- **คำอธิบาย**: อาร์เรย์ของการกำหนดฟิลด์สำหรับคอลเลกชันครับ/ค่ะ แต่ละฟิลด์จะประกอบด้วยข้อมูล เช่น ประเภท, ชื่อ และการตั้งค่าต่าง ๆ
- **ตัวอย่าง**:
```typescript
{
  name: 'users',
  fields: [
    {
      type: 'string',
      name: 'username',
      unique: true,
      title: 'ชื่อผู้ใช้งาน'
    },
    {
      type: 'string',
      name: 'email',
      unique: true,
      title: 'อีเมล'
    },
    {
      type: 'password',
      name: 'password',
      title: 'รหัสผ่าน'
    },
    {
      type: 'date',
      name: 'createdAt',
      title: 'เวลาที่สร้าง'
    }
  ]
}
```

### `model` - โมเดลที่กำหนดเอง
- **ประเภท**: `string | ModelStatic<Model>`
- **จำเป็น**: ❌
- **คำอธิบาย**: ใช้สำหรับระบุคลาสโมเดล Sequelize ที่กำหนดเองครับ/ค่ะ ซึ่งสามารถเป็นได้ทั้งชื่อคลาสหรือตัวคลาสโมเดลเอง
- **ตัวอย่าง**:
```typescript
// ระบุชื่อคลาสโมเดลเป็นสตริง
{
  name: 'users',
  model: 'UserModel',
  fields: [...]
}

// ใช้คลาสโมเดล
import { UserModel } from './models/UserModel';
{
  name: 'users',
  model: UserModel,
  fields: [...]
}
```

### `repository` - Repository ที่กำหนดเอง
- **ประเภท**: `string | RepositoryType`
- **จำเป็น**: ❌
- **คำอธิบาย**: ใช้สำหรับระบุคลาส Repository ที่กำหนดเองครับ/ค่ะ เพื่อจัดการตรรกะการเข้าถึงข้อมูล
- **ตัวอย่าง**:
```typescript
// ระบุชื่อคลาส Repository เป็นสตริง
{
  name: 'users',
  repository: 'UserRepository',
  fields: [...]
}

// ใช้คลาส Repository
import { UserRepository } from './repositories/UserRepository';
{
  name: 'users',
  repository: UserRepository,
  fields: [...]
}
```

### `autoGenId` - สร้าง ID อัตโนมัติ
- **ประเภท**: `boolean`
- **จำเป็น**: ❌
- **ค่าเริ่มต้น**: `true`
- **คำอธิบาย**: กำหนดว่าจะให้สร้าง Primary Key ID โดยอัตโนมัติหรือไม่ครับ/ค่ะ
- **ตัวอย่าง**:
```typescript
{
  name: 'users',
  autoGenId: true,  // สร้าง Primary Key ID โดยอัตโนมัติ
  fields: [...]
}

// ปิดการสร้าง ID อัตโนมัติ (ต้องระบุ Primary Key ด้วยตนเอง)
{
  name: 'external_data',
  autoGenId: false,
fields: [
  {
    type: 'string',
      name: 'id',
      primaryKey: true
    }
  ]
}
```

### `timestamps` - เปิดใช้งาน Timestamp
- **ประเภท**: `boolean`
- **จำเป็น**: ❌
- **ค่าเริ่มต้น**: `true`
- **คำอธิบาย**: กำหนดว่าจะเปิดใช้งานฟิลด์ `createdAt` (เวลาที่สร้าง) และ `updatedAt` (เวลาที่อัปเดต) หรือไม่ครับ/ค่ะ
- **ตัวอย่าง**:
```typescript
{
  name: 'users',
  timestamps: true,  // เปิดใช้งาน Timestamp
  fields: [...]
}
```

### `createdAt` - ฟิลด์เวลาที่สร้าง
- **ประเภท**: `boolean | string`
- **จำเป็น**: ❌
- **ค่าเริ่มต้น**: `true`
- **คำอธิบาย**: การตั้งค่าสำหรับฟิลด์ `createdAt` ครับ/ค่ะ
- **ตัวอย่าง**:
```typescript
{
  name: 'users',
  createdAt: 'created_at',  // กำหนดชื่อฟิลด์เวลาที่สร้างเอง
  fields: [...]
}
```

### `updatedAt` - ฟิลด์เวลาที่อัปเดต
- **ประเภท**: `boolean | string`
- **จำเป็น**: ❌
- **ค่าเริ่มต้น**: `true`
- **คำอธิบาย**: การตั้งค่าสำหรับฟิลด์ `updatedAt` ครับ/ค่ะ
- **ตัวอย่าง**:
```typescript
{
  name: 'users',
  updatedAt: 'updated_at',  // กำหนดชื่อฟิลด์เวลาที่อัปเดตเอง
  fields: [...]
}
```

### `deletedAt` - ฟิลด์ Soft Delete
- **ประเภท**: `boolean | string`
- **จำเป็น**: ❌
- **ค่าเริ่มต้น**: `false`
- **คำอธิบาย**: การตั้งค่าสำหรับฟิลด์ Soft Delete ครับ/ค่ะ
- **ตัวอย่าง**:
```typescript
{
  name: 'users',
  deletedAt: 'deleted_at',  // เปิดใช้งาน Soft Delete
  paranoid: true,
  fields: [...]
}
```

### `paranoid` - โหมด Soft Delete
- **ประเภท**: `boolean`
- **จำเป็น**: ❌
- **ค่าเริ่มต้น**: `false`
- **คำอธิบาย**: กำหนดว่าจะเปิดใช้งานโหมด Soft Delete หรือไม่ครับ/ค่ะ
- **ตัวอย่าง**:
```typescript
{
  name: 'users',
  paranoid: true,  // เปิดใช้งาน Soft Delete
  deletedAt: 'deleted_at',
  fields: [...]
}
```

### `underscored` - การตั้งชื่อแบบ Underscore
- **ประเภท**: `boolean`
- **จำเป็น**: ❌
- **ค่าเริ่มต้น**: `false`
- **คำอธิบาย**: กำหนดว่าจะใช้รูปแบบการตั้งชื่อแบบ Underscore หรือไม่ครับ/ค่ะ
- **ตัวอย่าง**:
```typescript
{
  name: 'users',
  underscored: true,  // ใช้รูปแบบการตั้งชื่อแบบ Underscore
  fields: [...]
}
```

### `indexes` - การตั้งค่า Index
- **ประเภท**: `ModelIndexesOptions[]`
- **จำเป็น**: ❌
- **คำอธิบาย**: การตั้งค่า Index สำหรับฐานข้อมูลครับ/ค่ะ
- **ตัวอย่าง**:
```typescript
{
  name: 'users',
  indexes: [
    {
      fields: ['email'],
      unique: true
    },
    {
      fields: ['username', 'status']
    }
  ],
  fields: [...]
}
```

## คำอธิบายการตั้งค่าพารามิเตอร์ฟิลด์

NocoBase รองรับฟิลด์หลายประเภทครับ/ค่ะ โดยฟิลด์ทั้งหมดจะถูกกำหนดตามประเภท `FieldOptions` แบบ Union Type การตั้งค่าฟิลด์จะประกอบด้วยคุณสมบัติพื้นฐาน, คุณสมบัติเฉพาะของประเภทข้อมูล, คุณสมบัติความสัมพันธ์ และคุณสมบัติสำหรับการเรนเดอร์ในส่วนหน้า (frontend) ครับ/ค่ะ

### ตัวเลือกฟิลด์พื้นฐาน

ฟิลด์ทุกประเภทจะสืบทอดมาจาก `BaseFieldOptions` ซึ่งให้ความสามารถในการตั้งค่าฟิลด์ทั่วไปครับ/ค่ะ:

```typescript
interface BaseFieldOptions<T extends BasicType = BasicType> {
  // พารามิเตอร์ทั่วไป
  name?: string;                    // ชื่อฟิลด์
  hidden?: boolean;                 // ซ่อนหรือไม่
  validation?: ValidationOptions<T>; // กฎการตรวจสอบ

  // คุณสมบัติฟิลด์คอลัมน์ที่ใช้บ่อย
  allowNull?: boolean;
  defaultValue?: any;
  unique?: boolean;
  primaryKey?: boolean;
  autoIncrement?: boolean;
  field?: string;
  comment?: string;

  // เกี่ยวข้องกับส่วนหน้า (Frontend)
  title?: string;
  description?: string;
  interface?: string;
  uiSchema?: any;
}
```

**ตัวอย่าง**:

```typescript
{
  type: 'string',
  name: 'username',
  allowNull: false,        // ไม่อนุญาตค่าว่าง
  unique: true,           // ข้อจำกัดค่าไม่ซ้ำกัน
  defaultValue: '',       // ค่าเริ่มต้นเป็นสตริงว่าง
  index: true,            // สร้าง Index
  comment: 'ชื่อผู้ใช้งานสำหรับเข้าสู่ระบบ'    // คอมเมนต์ในฐานข้อมูล
}
```

### `name` - ชื่อฟิลด์

- **ประเภท**: `string`
- **จำเป็น**: ❌
- **คำอธิบาย**: ชื่อคอลัมน์ของฟิลด์ในฐานข้อมูล ซึ่งต้องไม่ซ้ำกันภายในคอลเลกชันครับ/ค่ะ
- **ตัวอย่าง**:
```typescript
{
  type: 'string',
  name: 'username',  // ชื่อฟิลด์
  title: 'ชื่อผู้ใช้งาน'
}
```

### `hidden` - ซ่อนฟิลด์

- **ประเภท**: `boolean`
- **ค่าเริ่มต้น**: `false`
- **คำอธิบาย**: กำหนดว่าจะซ่อนฟิลด์นี้ในรายการหรือฟอร์มโดยค่าเริ่มต้นหรือไม่ครับ/ค่ะ
- **ตัวอย่าง**:
```typescript
{
  type: 'string',
  name: 'internalId',
  hidden: true,  // ซ่อนฟิลด์ ID ภายใน
  title: 'ID ภายใน'
}
```

### `validation` - กฎการตรวจสอบ

```typescript
interface ValidationOptions<T extends BasicType = BasicType> {
  type: T;                          // ประเภทการตรวจสอบ
  rules: FieldValidationRule<T>[];  // อาร์เรย์ของกฎการตรวจสอบ
  [key: string]: any;              // ตัวเลือกการตรวจสอบอื่น ๆ
}

interface FieldValidationRule<T extends BasicType> {
  key: string;                      // ชื่อคีย์กฎ
  name: FieldValidationRuleName<T>; // ชื่อกฎ
  args?: {                         // พารามิเตอร์กฎ
    [key: string]: any;
  };
  paramsType?: 'object';           // ประเภทพารามิเตอร์
}
```

- **ประเภท**: `ValidationOptions<T>`
- **คำอธิบาย**: ใช้ Joi เพื่อกำหนดกฎการตรวจสอบฝั่งเซิร์ฟเวอร์ครับ/ค่ะ
- **ตัวอย่าง**:
```typescript
{
  type: 'string',
  name: 'email',
  validation: {
    type: 'string',
    rules: [
      { key: 'email', name: 'email' },
      { key: 'required', name: 'required' }
    ]
  }
}
```

### `allowNull` - อนุญาตค่าว่าง

- **ประเภท**: `boolean`
- **ค่าเริ่มต้น**: `true`
- **คำอธิบาย**: ควบคุมว่าฐานข้อมูลจะอนุญาตให้บันทึกค่า `NULL` หรือไม่ครับ/ค่ะ
- **ตัวอย่าง**:
```typescript
{
  type: 'string',
  name: 'username',
  allowNull: false,  // ไม่อนุญาตค่าว่าง
  title: 'ชื่อผู้ใช้งาน'
}
```

### `defaultValue` - ค่าเริ่มต้น

- **ประเภท**: `any`
- **คำอธิบาย**: ค่าเริ่มต้นสำหรับฟิลด์ครับ/ค่ะ จะถูกใช้เมื่อสร้างเรคคอร์ดโดยไม่ได้ระบุค่าสำหรับฟิลด์นี้
- **ตัวอย่าง**:
```typescript
{
  type: 'string',
  name: 'status',
  defaultValue: 'draft',  // ค่าเริ่มต้นเป็นสถานะร่าง
  title: 'สถานะ'
}
```

### `unique` - ข้อจำกัดค่าไม่ซ้ำกัน

- **ประเภท**: `boolean | string`
- **ค่าเริ่มต้น**: `false`
- **คำอธิบาย**: กำหนดว่าค่าจะต้องไม่ซ้ำกันหรือไม่ครับ/ค่ะ หากเป็นสตริง สามารถระบุชื่อข้อจำกัดได้
- **ตัวอย่าง**:
```typescript
{
  type: 'string',
  name: 'email',
  unique: true,  // อีเมลต้องไม่ซ้ำกัน
  title: 'อีเมล'
}
```

### `primaryKey` - Primary Key

- **ประเภท**: `boolean`
- **ค่าเริ่มต้น**: `false`
- **คำอธิบาย**: ประกาศให้ฟิลด์นี้เป็น Primary Key ครับ/ค่ะ
- **ตัวอย่าง**:
```typescript
{
  type: 'integer',
  name: 'id',
  primaryKey: true,  // ตั้งเป็น Primary Key
  autoIncrement: true
}
```

### `autoIncrement` - เพิ่มค่าอัตโนมัติ

- **ประเภท**: `boolean`
- **ค่าเริ่มต้น**: `false`
- **คำอธิบาย**: เปิดใช้งานการเพิ่มค่าอัตโนมัติครับ/ค่ะ (ใช้ได้เฉพาะกับฟิลด์ประเภทตัวเลขเท่านั้น)
- **ตัวอย่าง**:
```typescript
{
  type: 'integer',
  name: 'id',
  autoIncrement: true,  // เพิ่มค่าอัตโนมัติ
  primaryKey: true
}
```

### `field` - ชื่อคอลัมน์ในฐานข้อมูล

- **ประเภท**: `string`
- **คำอธิบาย**: ระบุชื่อคอลัมน์จริงในฐานข้อมูลครับ/ค่ะ (ต้องสอดคล้องกับ `field` ของ Sequelize)
- **ตัวอย่าง**:
```typescript
{
  type: 'string',
  name: 'userId',
  field: 'user_id',  // ชื่อคอลัมน์ในฐานข้อมูล
  title: 'User ID'
}
```

### `comment` - คอมเมนต์ในฐานข้อมูล

- **ประเภท**: `string`
- **คำอธิบาย**: ข้อความสำหรับคอมเมนต์ฟิลด์ในฐานข้อมูลครับ/ค่ะ ใช้สำหรับอธิบายประกอบในเอกสาร
- **ตัวอย่าง**:
```typescript
{
  type: 'string',
  name: 'username',
  comment: 'ชื่อผู้ใช้งานสำหรับเข้าสู่ระบบ',  // คอมเมนต์ในฐานข้อมูล
  title: 'ชื่อผู้ใช้งาน'
}
```

### `title` - ชื่อเรื่องสำหรับแสดงผล

- **ประเภท**: `string`
- **คำอธิบาย**: ชื่อเรื่องสำหรับแสดงผลของฟิลด์ครับ/ค่ะ มักใช้สำหรับแสดงในส่วนหน้า (frontend) ของอินเทอร์เฟซ
- **ตัวอย่าง**:
```typescript
{
  type: 'string',
  name: 'username',
  title: 'ชื่อผู้ใช้งาน',  // ชื่อเรื่องที่แสดงในส่วนหน้า (frontend)
  allowNull: false
}
```

### `description` - คำอธิบายฟิลด์

- **ประเภท**: `string`
- **คำอธิบาย**: ข้อมูลคำอธิบายสำหรับฟิลด์ครับ/ค่ะ เพื่อช่วยให้ผู้ใช้งานเข้าใจวัตถุประสงค์ของฟิลด์
- **ตัวอย่าง**:
```typescript
{
  type: 'string',
  name: 'email',
  title: 'อีเมล',
  description: 'กรุณาป้อนที่อยู่อีเมลที่ถูกต้อง',  // คำอธิบายฟิลด์
  validation: {
    type: 'string',
    rules: [{ key: 'email', name: 'email' }]
  }
}
```

### `interface` - คอมโพเนนต์ UI

- **ประเภท**: `string`
- **คำอธิบาย**: คอมโพเนนต์ UI ที่แนะนำสำหรับฟิลด์ในส่วนหน้า (frontend) ครับ/ค่ะ
- **ตัวอย่าง**:
```typescript
{
  type: 'string',
  name: 'content',
  title: 'เนื้อหา',
  interface: 'textarea',  // แนะนำให้ใช้คอมโพเนนต์ textarea
  uiSchema: {
    'x-component': 'Input.TextArea'
  }
}
```

### อินเทอร์เฟซประเภทฟิลด์

### `type: 'string'` - ฟิลด์สตริง

- **คำอธิบาย**: ใช้สำหรับจัดเก็บข้อมูลข้อความสั้น ๆ ครับ/ค่ะ รองรับการจำกัดความยาวและการตัดช่องว่างอัตโนมัติ (trim)
- **ประเภทฐานข้อมูล**: `VARCHAR`
- **คุณสมบัติเฉพาะ**:
  - `length`: การจำกัดความยาวสตริง
  - `trim`: กำหนดว่าจะตัดช่องว่างที่หัวและท้ายออกโดยอัตโนมัติหรือไม่

```ts
interface StringFieldOptions extends BaseColumnFieldOptions<'string'> {
  type: 'string';
  length?: number;    // การจำกัดความยาวสตริง
  trim?: boolean;     // กำหนดว่าจะตัดช่องว่างที่หัวและท้ายออกโดยอัตโนมัติหรือไม่
}
```

**ตัวอย่าง**:
```typescript
{
  type: 'string',
  name: 'username',
  title: 'ชื่อผู้ใช้งาน',
  length: 50,           // สูงสุด 50 ตัวอักษร
  trim: true,           // ตัดช่องว่างอัตโนมัติ
    allowNull: false,
    unique: true,
    validation: {
      type: 'string',
      rules: [
        { key: 'min', name: 'min', args: { limit: 3 } },
      { key: 'max', name: 'max', args: { limit: 20 } }
    ]
  }
}
```

### `type: 'text'` - ฟิลด์ข้อความ

- **คำอธิบาย**: ใช้สำหรับจัดเก็บข้อมูลข้อความขนาดยาวครับ/ค่ะ รองรับประเภทข้อความที่มีความยาวต่างกันใน MySQL
- **ประเภทฐานข้อมูล**: `TEXT`、`MEDIUMTEXT`、`LONGTEXT`
- **คุณสมบัติเฉพาะ**:
  - `length`: ประเภทความยาวข้อความของ MySQL (tiny/medium/long)

```ts
interface TextFieldOptions extends BaseColumnFieldOptions {
  type: 'text';
  length?: 'tiny' | 'medium' | 'long';  // ประเภทความยาวข้อความของ MySQL
}
```

**ตัวอย่าง**:
```typescript
{
  type: 'text',
  name: 'content',
  title: 'เนื้อหา',
  length: 'medium',     // ใช้ MEDIUMTEXT
  allowNull: true
}
```

### ประเภทตัวเลข

### `type: 'integer'` - ฟิลด์จำนวนเต็ม

- **คำอธิบาย**: ใช้สำหรับจัดเก็บข้อมูลจำนวนเต็มครับ/ค่ะ รองรับการเพิ่มค่าอัตโนมัติและ Primary Key
- **ประเภทฐานข้อมูล**: `INTEGER`

```ts
interface IntegerFieldOptions extends BaseColumnFieldOptions<'number'> {
  type: 'integer';
  // สืบทอดตัวเลือกทั้งหมดจากประเภท INTEGER ของ Sequelize
}
```

**ตัวอย่าง**:
```typescript
  {
    type: 'integer',
  name: 'id',
  title: 'ID',
  primaryKey: true,
  autoIncrement: true,
  allowNull: false
}
```

### `type: 'bigInt'` - ฟิลด์จำนวนเต็มขนาดใหญ่

- **คำอธิบาย**: ใช้สำหรับจัดเก็บข้อมูลจำนวนเต็มขนาดใหญ่ครับ/ค่ะ ซึ่งมีช่วงค่าที่กว้างกว่า `integer`
- **ประเภทฐานข้อมูล**: `BIGINT`

```ts
interface BigIntFieldOptions extends BaseColumnFieldOptions<'number'> {
  type: 'bigInt';
}
```

**ตัวอย่าง**:
```typescript
{
  type: 'bigInt',
  name: 'userId',
  title: 'User ID',
  allowNull: false,
  unique: true
}
```

### `type: 'float'` - ฟิลด์ทศนิยม (Float)

- **คำอธิบาย**: ใช้สำหรับจัดเก็บตัวเลขทศนิยมความแม่นยำเดี่ยวครับ/ค่ะ
- **ประเภทฐานข้อมูล**: `FLOAT`
- **คุณสมบัติเฉพาะ**:
  - `precision`: ความแม่นยำ (จำนวนหลักทั้งหมด)
  - `scale`: จำนวนทศนิยม

```ts
interface FloatFieldOptions extends BaseColumnFieldOptions<'number'> {
  type: 'float';
  precision?: number;  // ความแม่นยำ
  scale?: number;      // จำนวนทศนิยม
}
```

**ตัวอย่าง**:
```typescript
{
  type: 'float',
  name: 'score',
  title: 'คะแนน',
  precision: 5,
  scale: 2,
  allowNull: true,
  defaultValue: 0.0
}
```

### `type: 'double'` - ฟิลด์ทศนิยมความแม่นยำสองเท่า (Double)

- **คำอธิบาย**: ใช้สำหรับจัดเก็บตัวเลขทศนิยมความแม่นยำสองเท่าครับ/ค่ะ ซึ่งมีความแม่นยำสูงกว่า `float`
- **ประเภทฐานข้อมูล**: `DOUBLE`
- **คุณสมบัติเฉพาะ**:
  - `precision`: ความแม่นยำ (จำนวนหลักทั้งหมด)
  - `scale`: จำนวนทศนิยม

```ts
interface DoubleFieldOptions extends BaseColumnFieldOptions<'number'> {
  type: 'double';
  precision?: number;
  scale?: number;
}
```

**ตัวอย่าง**:
```typescript
{
  type: 'double',
    name: 'price',
      title: 'ราคา',
  precision: 10,
  scale: 2,
  allowNull: false,
  defaultValue: 0.00
}
```

### `type: 'real'` - ฟิลด์จำนวนจริง (Real)

- **คำอธิบาย**: ใช้สำหรับจัดเก็บจำนวนจริงครับ/ค่ะ ซึ่งขึ้นอยู่กับฐานข้อมูลที่ใช้
- **ประเภทฐานข้อมูล**: `REAL`
- **คุณสมบัติเฉพาะ**:
  - `precision`: ความแม่นยำ (จำนวนหลักทั้งหมด)
  - `scale`: จำนวนทศนิยม

```ts
interface RealFieldOptions extends BaseColumnFieldOptions<'number'> {
  type: 'real';
  precision?: number;
  scale?: number;
}
```

**ตัวอย่าง**:
```typescript
{
  type: 'real',
  name: 'rate',
  title: 'อัตราแลกเปลี่ยน',
  precision: 8,
  scale: 4,
  allowNull: true
}
```

### `type: 'decimal'` - ฟิลด์ทศนิยมแม่นยำ (Decimal)

- **คำอธิบาย**: ใช้สำหรับจัดเก็บตัวเลขทศนิยมที่แม่นยำครับ/ค่ะ เหมาะสำหรับการคำนวณทางการเงิน
- **ประเภทฐานข้อมูล**: `DECIMAL`
- **คุณสมบัติเฉพาะ**:
  - `precision`: ความแม่นยำ (จำนวนหลักทั้งหมด)
  - `scale`: จำนวนทศนิยม

```ts
interface DecimalFieldOptions extends BaseColumnFieldOptions<'number'> {
  type: 'decimal';
  precision?: number;  // ความแม่นยำ (จำนวนหลักทั้งหมด)
  scale?: number;      // จำนวนทศนิยม
}
```

**ตัวอย่าง**:
```typescript
{
  type: 'decimal',
  name: 'amount',
  title: 'จำนวนเงิน',
  precision: 10,
  scale: 2,
  allowNull: false,
  defaultValue: 0.00,
  validation: {
    type: 'number',
    rules: [
      { key: 'min', name: 'min', args: { limit: 0 } }
    ]
  }
}
```

### ประเภทบูลีน

### `type: 'boolean'` - ฟิลด์บูลีน

- **คำอธิบาย**: ใช้สำหรับจัดเก็บค่าจริง/เท็จครับ/ค่ะ มักใช้สำหรับสถานะเปิด/ปิด
- **ประเภทฐานข้อมูล**: `BOOLEAN` หรือ `TINYINT(1)`

```typescript
interface BooleanFieldOptions extends BaseColumnFieldOptions<'boolean'> {
  type: 'boolean';
}
```

**ตัวอย่าง**:
```typescript
{
  type: 'boolean',
  name: 'isActive',
  title: 'เปิดใช้งานหรือไม่',
  defaultValue: true,
  allowNull: false
}
```

### `type: 'radio'` - ฟิลด์ Radio

- **คำอธิบาย**: ใช้สำหรับจัดเก็บค่าที่เลือกได้เพียงค่าเดียวครับ/ค่ะ มักใช้สำหรับกรณีที่มีสองตัวเลือก
- **ประเภทฐานข้อมูล**: `BOOLEAN` หรือ `TINYINT(1)`

```typescript
interface RadioFieldOptions extends BaseColumnFieldOptions<'boolean'> {
  type: 'radio';
}
```

**ตัวอย่าง**:
```typescript
{
  type: 'radio',
  name: 'isDefault',
  title: 'เป็นค่าเริ่มต้นหรือไม่',
  defaultValue: false,
  allowNull: false
}
```

### ประเภทวันที่และเวลา

### `type: 'date'` - ฟิลด์วันที่

- **คำอธิบาย**: ใช้สำหรับจัดเก็บข้อมูลวันที่ครับ/ค่ะ โดยไม่รวมข้อมูลเวลา
- **ประเภทฐานข้อมูล**: `DATE`
- **คุณสมบัติเฉพาะ**:
  - `timezone`: กำหนดว่าจะรวมข้อมูลเขตเวลาหรือไม่

```typescript
interface DateFieldOptions extends BaseColumnFieldOptions<'date'> {
  type: 'date';
  timezone?: boolean;  // กำหนดว่าจะรวมข้อมูลเขตเวลาหรือไม่
}
```

**ตัวอย่าง**:
```typescript
{
  type: 'date',
  name: 'birthday',
  title: 'วันเกิด',
  allowNull: true,
  timezone: false
}
```

### `type: 'time'` - ฟิลด์เวลา

- **คำอธิบาย**: ใช้สำหรับจัดเก็บข้อมูลเวลาครับ/ค่ะ โดยไม่รวมข้อมูลวันที่
- **ประเภทฐานข้อมูล**: `TIME`
- **คุณสมบัติเฉพาะ**:
  - `timezone`: กำหนดว่าจะรวมข้อมูลเขตเวลาหรือไม่

```ts
interface TimeFieldOptions extends BaseColumnFieldOptions<'time'> {
  type: 'time';
  timezone?: boolean;
}
```

**ตัวอย่าง**:
```typescript
{
  type: 'time',
  name: 'startTime',
  title: 'เวลาเริ่มต้น',
  allowNull: false,
  timezone: false
}
```

### `type: 'datetimeTz'` - ฟิลด์วันที่และเวลาพร้อมเขตเวลา

- **คำอธิบาย**: ใช้สำหรับจัดเก็บข้อมูลวันที่และเวลาพร้อมข้อมูลเขตเวลาครับ/ค่ะ
- **ประเภทฐานข้อมูล**: `TIMESTAMP WITH TIME ZONE`
- **คุณสมบัติเฉพาะ**:
  - `timezone`: กำหนดว่าจะรวมข้อมูลเขตเวลาหรือไม่

```ts
interface DatetimeTzFieldOptions extends BaseColumnFieldOptions<'datetime'> {
  type: 'datetimeTz';
  timezone?: boolean;
}
```

**ตัวอย่าง**:
```typescript
{
  type: 'datetimeTz',
  name: 'createdAt',
  title: 'เวลาที่สร้าง',
  allowNull: false,
  timezone: true,
  defaultToCurrentTime: true,
  onUpdateToCurrentTime: true
}
```

### `type: 'datetimeNoTz'` - ฟิลด์วันที่และเวลาที่ไม่มีเขตเวลา

- **คำอธิบาย**: ใช้สำหรับจัดเก็บข้อมูลวันที่และเวลาที่ไม่มีข้อมูลเขตเวลาครับ/ค่ะ
- **ประเภทฐานข้อมูล**: `TIMESTAMP` หรือ `DATETIME`
- **คุณสมบัติเฉพาะ**:
  - `timezone`: กำหนดว่าจะรวมข้อมูลเขตเวลาหรือไม่

```ts
interface DatetimeNoTzFieldOptions extends BaseColumnFieldOptions<'datetime'> {
  type: 'datetimeNoTz';
  timezone?: boolean;
}
```

**ตัวอย่าง**:
```typescript
{
  type: 'datetimeNoTz',
  name: 'updatedAt',
  title: 'เวลาที่อัปเดต',
  allowNull: false,
  timezone: false,
  defaultToCurrentTime: true,
  onUpdateToCurrentTime: true
}
```

### `type: 'dateOnly'` - ฟิลด์เฉพาะวันที่

- **คำอธิบาย**: ใช้สำหรับจัดเก็บข้อมูลที่มีเฉพาะวันที่เท่านั้นครับ/ค่ะ โดยไม่รวมเวลา
- **ประเภทฐานข้อมูล**: `DATE`
- **ตัวอย่าง**:
```typescript
{
  type: 'dateOnly',
  name: 'publishDate',
  title: 'วันที่เผยแพร่',
  allowNull: true
}
```

### `type: 'unixTimestamp'` - ฟิลด์ Unix Timestamp

- **คำอธิบาย**: ใช้สำหรับจัดเก็บข้อมูล Unix Timestamp ครับ/ค่ะ
- **ประเภทฐานข้อมูล**: `BIGINT`
- **คุณสมบัติเฉพาะ**:
  - `epoch`: เวลา Epoch

```typescript
interface UnixTimestampFieldOptions extends BaseColumnFieldOptions<'unixTimestamp'> {
  type: 'unixTimestamp';
  epoch?: number;  // เวลา Epoch
}
```

**ตัวอย่าง**:
```typescript
{
  type: 'unixTimestamp',
  name: 'lastLoginAt',
  title: 'เวลาเข้าสู่ระบบล่าสุด',
  allowNull: true,
  epoch: 0
}
```

### ประเภท JSON

### `type: 'json'` - ฟิลด์ JSON

- **คำอธิบาย**: ใช้สำหรับจัดเก็บข้อมูลในรูปแบบ JSON ครับ/ค่ะ รองรับโครงสร้างข้อมูลที่ซับซ้อน
- **ประเภทฐานข้อมูล**: `JSON` หรือ `TEXT`
- **ตัวอย่าง**:
```typescript
{
  type: 'json',
  name: 'metadata',
  title: 'เมตาดาต้า',
  allowNull: true,
  defaultValue: {}
}
```

### `type: 'jsonb'` - ฟิลด์ JSONB

- **คำอธิบาย**: ใช้สำหรับจัดเก็บข้อมูลในรูปแบบ JSONB ครับ/ค่ะ (เฉพาะ PostgreSQL) ซึ่งรองรับการทำ Index และการสอบถามข้อมูล
- **ประเภทฐานข้อมูล**: `JSONB` (PostgreSQL)
- **ตัวอย่าง**:
```typescript
{
  type: 'jsonb',
  name: 'config',
  title: 'การตั้งค่า',
  allowNull: true,
  defaultValue: {}
}
```

### ประเภทอาร์เรย์

### `type: 'array'` - ฟิลด์อาร์เรย์

- **คำอธิบาย**: ใช้สำหรับจัดเก็บข้อมูลอาร์เรย์ครับ/ค่ะ รองรับประเภทขององค์ประกอบที่หลากหลาย
- **ประเภทฐานข้อมูล**: `JSON` หรือ `ARRAY`
- **คุณสมบัติเฉพาะ**:
  - `dataType`: ประเภทการจัดเก็บ (json/array)
  - `elementType`: ประเภทขององค์ประกอบ (STRING/INTEGER/BOOLEAN/JSON)

```ts
interface ArrayFieldOptions extends BaseColumnFieldOptions<'array'> {
  type: 'array';
  dataType?: 'json' | 'array';  // ประเภทการจัดเก็บ
  elementType?: 'STRING' | 'INTEGER' | 'BOOLEAN' | 'JSON'; // ประเภทขององค์ประกอบ
}
```

**ตัวอย่าง**:
```typescript
{
  type: 'array',
  name: 'tags',
  title: 'แท็ก',
  dataType: 'json',
  elementType: 'STRING',
  allowNull: true,
  defaultValue: []
}
```

### `type: 'set'` - ฟิลด์ Set

- **คำอธิบาย**: ใช้สำหรับจัดเก็บข้อมูลประเภท Set ครับ/ค่ะ ซึ่งคล้ายกับอาร์เรย์แต่มีข้อจำกัดเรื่องค่าไม่ซ้ำกัน
- **ประเภทฐานข้อมูล**: `JSON` หรือ `ARRAY`
- **คุณสมบัติเฉพาะ**:
  - `dataType`: ประเภทการจัดเก็บ (json/array)
  - `elementType`: ประเภทขององค์ประกอบ (STRING/INTEGER/BOOLEAN/JSON)

```ts
interface SetFieldOptions extends BaseColumnFieldOptions<'set'> {
  type: 'set';
  dataType?: 'json' | 'array';
  elementType?: 'STRING' | 'INTEGER' | 'BOOLEAN' | 'JSON';
}
```

**ตัวอย่าง**:
```typescript
{
  type: 'set',
  name: 'categories',
      title: 'หมวดหมู่',
  dataType: 'json',
  elementType: 'STRING',
  allowNull: true,
  defaultValue: []
}
```

### ประเภทตัวระบุ

### `type: 'uuid'` - ฟิลด์ UUID

- **คำอธิบาย**: ใช้สำหรับจัดเก็บตัวระบุที่ไม่ซ้ำกันในรูปแบบ UUID ครับ/ค่ะ
- **ประเภทฐานข้อมูล**: `UUID` หรือ `VARCHAR(36)`
- **คุณสมบัติเฉพาะ**:
  - `autoFill`: เติมค่าอัตโนมัติ

```ts
interface UUIDFieldOptions extends BaseColumnFieldOptions<'uuid'> {
  type: 'uuid';
  autoFill?: boolean;  // เติมค่าอัตโนมัติ
}
```

**ตัวอย่าง**:
```typescript
{
  type: 'uuid',
  name: 'id',
  title: 'ID',
  autoFill: true,
  allowNull: false,
  primaryKey: true
}
```

### `type: 'nanoid'` - ฟิลด์ Nanoid

- **คำอธิบาย**: ใช้สำหรับจัดเก็บตัวระบุที่ไม่ซ้ำกันแบบสั้นในรูปแบบ Nanoid ครับ/ค่ะ
- **ประเภทฐานข้อมูล**: `VARCHAR`
- **คุณสมบัติเฉพาะ**:
  - `size`: ความยาวของ ID
  - `customAlphabet`: ชุดตัวอักษรที่กำหนดเอง
  - `autoFill`: เติมค่าอัตโนมัติ

```ts
interface NanoidFieldOptions extends BaseColumnFieldOptions<'nanoid'> {
  type: 'nanoid';
  size?: number;  // ความยาวของ ID
  customAlphabet?: string;  // ชุดตัวอักษรที่กำหนดเอง
  autoFill?: boolean;
}
```

**ตัวอย่าง**:
```typescript
{
  type: 'nanoid',
  name: 'shortId',
  title: 'Short ID',
  size: 12,
  customAlphabet: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',
  autoFill: true,
  allowNull: false,
  unique: true
}
```

### `type: 'uid'` - ฟิลด์ UID ที่กำหนดเอง

- **คำอธิบาย**: ใช้สำหรับจัดเก็บตัวระบุที่ไม่ซ้ำกันในรูปแบบที่กำหนดเองครับ/ค่ะ
- **ประเภทฐานข้อมูล**: `VARCHAR`
- **คุณสมบัติเฉพาะ**:
  - `prefix`: คำนำหน้า
  - `pattern`: รูปแบบการตรวจสอบ

```ts
interface UidFieldOptions extends BaseColumnFieldOptions<'uid'> {
  type: 'uid';
  prefix?: string;  // คำนำหน้า
  pattern?: string; // รูปแบบการตรวจสอบ
}
```

**ตัวอย่าง**:
```typescript
{
  type: 'uid',
  name: 'code',
  title: 'รหัส',
  prefix: 'USR_',
  pattern: '^[A-Za-z0-9_][A-Za-z0-9_-]*$',
  allowNull: false,
  unique: true
}
```

### `type: 'snowflakeId'` - ฟิลด์ Snowflake ID

- **คำอธิบาย**: ใช้สำหรับจัดเก็บตัวระบุที่ไม่ซ้ำกันที่สร้างโดยอัลกอริทึม Snowflake ครับ/ค่ะ
- **ประเภทฐานข้อมูล**: `BIGINT`
- **ตัวอย่าง**:
```typescript
{
  type: 'snowflakeId',
  name: 'snowflakeId',
  title: 'Snowflake ID',
  allowNull: false,
  unique: true
}
```

### ฟิลด์ฟังก์ชัน

### `type: 'password'` - ฟิลด์รหัสผ่าน

- **คำอธิบาย**: ใช้สำหรับจัดเก็บข้อมูลรหัสผ่านที่ถูกเข้ารหัสแล้วครับ/ค่ะ
- **ประเภทฐานข้อมูล**: `VARCHAR`
- **คุณสมบัติเฉพาะ**:
  - `length`: ความยาวของ Hash
  - `randomBytesSize`: ขนาดของ Random Bytes

```ts
interface PasswordFieldOptions extends BaseColumnFieldOptions<'password'> {
  type: 'password';
  length?: number;  // ความยาวของ Hash
  randomBytesSize?: number;  // ขนาดของ Random Bytes
}
```

**ตัวอย่าง**:
```typescript
{
  type: 'password',
  name: 'password',
  title: 'รหัสผ่าน',
  length: 64,
  randomBytesSize: 8,
  allowNull: false,
  hidden: true
}
```

### `type: 'encryption'` - ฟิลด์การเข้ารหัส

- **คำอธิบาย**: ใช้สำหรับจัดเก็บข้อมูลที่ละเอียดอ่อนที่ถูกเข้ารหัสแล้วครับ/ค่ะ
- **ประเภทฐานข้อมูล**: `VARCHAR`
- **ตัวอย่าง**:
```typescript
{
  type: 'encryption',
  name: 'secret',
  title: 'คีย์ลับ',
  allowNull: true,
  hidden: true
}
```

### `type: 'virtual'` - ฟิลด์เสมือน

- **คำอธิบาย**: ใช้สำหรับจัดเก็บข้อมูลเสมือนที่ได้จากการคำนวณครับ/ค่ะ ซึ่งจะไม่ได้ถูกจัดเก็บในฐานข้อมูลจริง
- **ประเภทฐานข้อมูล**: ไม่มี (ฟิลด์เสมือน)
- **ตัวอย่าง**:
```typescript
{
  type: 'virtual',
  name: 'fullName',
  title: 'ชื่อเต็ม'
}
```

### `type: 'context'` - ฟิลด์ Context

- **คำอธิบาย**: ใช้สำหรับอ่านข้อมูลจาก Context ที่กำลังทำงานอยู่ครับ/ค่ะ (เช่น ข้อมูลผู้ใช้งานปัจจุบัน)
- **ประเภทฐานข้อมูล**: กำหนดโดย `dataType`
- **คุณสมบัติเฉพาะ**:
  - `dataIndex`: พาธ Index ของข้อมูล
  - `dataType`: ประเภทข้อมูล
  - `createOnly`: ตั้งค่าเฉพาะตอนสร้างเท่านั้น

```ts
interface ContextFieldOptions extends BaseFieldOptions {
  type: 'context';
  dataIndex?: string;  // พาธ Index ของข้อมูล
  dataType?: string;   // ประเภทข้อมูล
  createOnly?: boolean; // ตั้งค่าเฉพาะตอนสร้างเท่านั้น
}
```

**ตัวอย่าง**:
```typescript
{
  type: 'context',
  name: 'currentUserId',
  title: 'User ID ปัจจุบัน',
  dataIndex: 'user.id',
  dataType: 'integer',
  createOnly: true,
  allowNull: false
}
```

### ฟิลด์ความสัมพันธ์

### `type: 'belongsTo'` - ความสัมพันธ์แบบ Belongs To

- **คำอธิบาย**: แสดงถึงความสัมพันธ์แบบ Many-to-One ครับ/ค่ะ โดยที่เรคคอร์ดปัจจุบันเป็นส่วนหนึ่งของเรคคอร์ดอื่น
- **ประเภทฐานข้อมูล**: ฟิลด์ Foreign Key
- **คุณสมบัติเฉพาะ**:
  - `target`: ชื่อคอลเลกชันเป้าหมาย
  - `foreignKey`: ชื่อฟิลด์ Foreign Key
  - `targetKey`: ชื่อฟิลด์คีย์เป้าหมายในคอลเลกชันเป้าหมาย
  - `onDelete`: การดำเนินการแบบ Cascade เมื่อลบ
  - `onUpdate`: การดำเนินการแบบ Cascade เมื่ออัปเดต
  - `constraints`: กำหนดว่าจะเปิดใช้งานข้อจำกัด Foreign Key หรือไม่

```ts
interface BelongsToFieldOptions extends BaseRelationFieldOptions {
  type: 'belongsTo';
  target: string;  // ชื่อคอลเลกชันเป้าหมาย
  foreignKey?: string;  // ชื่อฟิลด์ Foreign Key
  targetKey?: string;   // ชื่อฟิลด์คีย์เป้าหมายในคอลเลกชันเป้าหมาย
  onDelete?: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION';
  onUpdate?: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION';
  constraints?: boolean;  // กำหนดว่าจะเปิดใช้งานข้อจำกัด Foreign Key หรือไม่
}
```

**ตัวอย่าง**:
```typescript
  {
    type: 'belongsTo',
  name: 'author',
  title: 'ผู้เขียน',
  target: 'users',
  foreignKey: 'authorId',
  targetKey: 'id',
  onDelete: 'SET NULL',
  onUpdate: 'CASCADE',
  constraints: false
}
```

### `type: 'hasOne'` - ความสัมพันธ์แบบ Has One

- **คำอธิบาย**: แสดงถึงความสัมพันธ์แบบ One-to-One ครับ/ค่ะ โดยที่เรคคอร์ดปัจจุบันมีความสัมพันธ์กับเรคคอร์ดอื่นหนึ่งรายการ
- **ประเภทฐานข้อมูล**: ฟิลด์ Foreign Key
- **คุณสมบัติเฉพาะ**:
  - `target`: ชื่อคอลเลกชันเป้าหมาย
  - `foreignKey`: ชื่อฟิลด์ Foreign Key
  - `sourceKey`: ชื่อฟิลด์คีย์ต้นทางในคอลเลกชันต้นทาง
  - `onDelete`: การดำเนินการแบบ Cascade เมื่อลบ
  - `onUpdate`: การดำเนินการแบบ Cascade เมื่ออัปเดต
  - `constraints`: กำหนดว่าจะเปิดใช้งานข้อจำกัด Foreign Key หรือไม่

```ts
interface HasOneFieldOptions extends BaseRelationFieldOptions {
  type: 'hasOne';
  target: string;
  foreignKey?: string;
  sourceKey?: string;  // ชื่อฟิลด์คีย์ต้นทาง
  onDelete?: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION';
  onUpdate?: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION';
  constraints?: boolean;
}
```

**ตัวอย่าง**:
```typescript
{
  type: 'hasOne',
  name: 'profile',
  title: 'โปรไฟล์ผู้ใช้งาน',
  target: 'user_profiles',
  foreignKey: 'userId',
  sourceKey: 'id',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE',
  constraints: false
}
```

### `type: 'hasMany'` - ความสัมพันธ์แบบ Has Many

- **คำอธิบาย**: แสดงถึงความสัมพันธ์แบบ One-to-Many ครับ/ค่ะ โดยที่เรคคอร์ดปัจจุบันมีความสัมพันธ์กับเรคคอร์ดอื่นหลายรายการ
- **ประเภทฐานข้อมูล**: ฟิลด์ Foreign Key
- **คุณสมบัติเฉพาะ**:
  - `target`: ชื่อคอลเลกชันเป้าหมาย
  - `foreignKey`: ชื่อฟิลด์ Foreign Key
  - `sourceKey`: ชื่อฟิลด์คีย์ต้นทางในคอลเลกชันต้นทาง
  - `sortBy`: ฟิลด์สำหรับเรียงลำดับ
  - `sortable`: กำหนดว่าจะสามารถเรียงลำดับได้หรือไม่
  - `onDelete`: การดำเนินการแบบ Cascade เมื่อลบ
  - `onUpdate`: การดำเนินการแบบ Cascade เมื่ออัปเดต
  - `constraints`: กำหนดว่าจะเปิดใช้งานข้อจำกัด Foreign Key หรือไม่

```ts
interface HasManyFieldOptions extends BaseRelationFieldOptions {
  type: 'hasMany';
  target: string;
  foreignKey?: string;
  sourceKey?: string;
  sortBy?: string[];  // ฟิลด์สำหรับเรียงลำดับ
  sortable?: boolean; // กำหนดว่าจะสามารถเรียงลำดับได้หรือไม่
  onDelete?: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION';
  onUpdate?: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION';
  constraints?: boolean;
}
```

**ตัวอย่าง**:
```typescript
  {
    type: 'hasMany',
  name: 'posts',
  title: 'รายการบทความ',
  target: 'articles',
  foreignKey: 'authorId',
  sourceKey: 'id',
    sortBy: ['createdAt'],
  sortable: true,
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE',
  constraints: false
}
```

### `type: 'belongsToMany'` - ความสัมพันธ์แบบ Many-to-Many

- **คำอธิบาย**: แสดงถึงความสัมพันธ์แบบ Many-to-Many ครับ/ค่ะ โดยเชื่อมโยงสองคอลเลกชันผ่านตารางเชื่อมโยง (Junction Table)
- **ประเภทฐานข้อมูล**: ตารางเชื่อมโยง (Junction Table)
- **คุณสมบัติเฉพาะ**:
  - `target`: ชื่อคอลเลกชันเป้าหมาย
  - `through`: ชื่อตารางเชื่อมโยง
  - `foreignKey`: ชื่อฟิลด์ Foreign Key
  - `otherKey`: Foreign Key อีกด้านในตารางเชื่อมโยง
  - `sourceKey`: ชื่อฟิลด์คีย์ต้นทางในคอลเลกชันต้นทาง
  - `targetKey`: ชื่อฟิลด์คีย์เป้าหมายในคอลเลกชันเป้าหมาย
  - `onDelete`: การดำเนินการแบบ Cascade เมื่อลบ
  - `onUpdate`: การดำเนินการแบบ Cascade เมื่ออัปเดต
  - `constraints`: กำหนดว่าจะเปิดใช้งานข้อจำกัด Foreign Key หรือไม่

```ts
interface BelongsToManyFieldOptions extends BaseRelationFieldOptions {
  type: 'belongsToMany';
  target: string;
  through: string;  // ชื่อตารางเชื่อมโยง
  foreignKey?: string;
  otherKey?: string;  // Foreign Key อีกด้านในตารางเชื่อมโยง
  sourceKey?: string;
  targetKey?: string;
  onDelete?: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION';
  onUpdate?: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION';
  constraints?: boolean;
}
```

**ตัวอย่าง**:
```typescript
{
  type: 'belongsToMany',
  name: 'tags',
  title: 'แท็ก',
  target: 'article_tags',
  through: 'article_tag_relations',
  foreignKey: 'articleId',
  otherKey: 'tagId',
  sourceKey: 'id',
  targetKey: 'id',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE',
  constraints: false
}
```