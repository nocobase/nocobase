:::tip
เอกสารนี้แปลโดย AI หากมีข้อมูลที่ไม่ถูกต้อง โปรดดู[เวอร์ชันภาษาอังกฤษ](/en)
:::


# BelongsToManyRepository

`BelongsToManyRepository` เป็น `Relation Repository` สำหรับจัดการความสัมพันธ์แบบ `BelongsToMany` ครับ/ค่ะ

ความสัมพันธ์แบบ `BelongsToMany` แตกต่างจากความสัมพันธ์ประเภทอื่น ๆ ตรงที่จำเป็นต้องบันทึกข้อมูลผ่านตารางเชื่อมโยง (junction table) ครับ/ค่ะ
เมื่อคุณกำหนดความสัมพันธ์ใน NocoBase คุณสามารถเลือกให้สร้างตารางเชื่อมโยงโดยอัตโนมัติ หรือจะระบุตารางเชื่อมโยงด้วยตัวเองก็ได้ครับ/ค่ะ

## เมธอดของคลาส (Class Methods)

### `find()`

ค้นหาออบเจกต์ที่เกี่ยวข้อง

**รูปแบบการใช้งาน (Signature)**

- `async find(options?: FindOptions): Promise<M[]>`

**รายละเอียด**

พารามิเตอร์สำหรับการค้นหาจะเหมือนกับ [`Repository.find()`](../repository.md#find) ครับ/ค่ะ

### `findOne()`

ค้นหาออบเจกต์ที่เกี่ยวข้อง โดยจะคืนค่ากลับมาเพียงหนึ่งรายการเท่านั้นครับ/ค่ะ

**รูปแบบการใช้งาน (Signature)**

- `async findOne(options?: FindOneOptions): Promise<M>`

<embed src="../shared/find-one.md"></embed>

### `count()`

คืนค่าจำนวนรายการที่ตรงตามเงื่อนไขการค้นหาครับ/ค่ะ

**รูปแบบการใช้งาน (Signature)**

- `async count(options?: CountOptions)`

**ประเภท (Type)**

```typescript
interface CountOptions
  extends Omit<SequelizeCountOptions, 'distinct' | 'where' | 'include'>,
    Transactionable {
  filter?: Filter;
}
```

### `findAndCount()`

สอบถามข้อมูลจากฐานข้อมูลเพื่อดึงชุดข้อมูลและจำนวนผลลัพธ์ทั้งหมดภายใต้เงื่อนไขที่กำหนดครับ/ค่ะ

**รูปแบบการใช้งาน (Signature)**

- `async findAndCount(options?: FindAndCountOptions): Promise<[any[], number]>`

**ประเภท (Type)**

```typescript
type FindAndCountOptions = CommonFindOptions;
```

### `create()`

สร้างออบเจกต์ที่เกี่ยวข้อง

**รูปแบบการใช้งาน (Signature)**

- `async create(options?: CreateOptions): Promise<M>`

<embed src="../shared/create-options.md"></embed>

### `update()`

อัปเดตออบเจกต์ที่เกี่ยวข้องที่ตรงตามเงื่อนไข

**รูปแบบการใช้งาน (Signature)**

- `async update(options?: UpdateOptions): Promise<M>`

<embed src="../shared/update-options.md"></embed>

### `destroy()`

ลบออบเจกต์ที่เกี่ยวข้องที่ตรงตามเงื่อนไข

**รูปแบบการใช้งาน (Signature)**

- `async destroy(options?: TargetKey | TargetKey[] | DestroyOptions): Promise<Boolean>`

<embed src="../shared/destroy-options.md"></embed>

### `add()`

เพิ่มออบเจกต์ที่เกี่ยวข้องใหม่

**รูปแบบการใช้งาน (Signature)**

- `async add(
options: TargetKey | TargetKey[] | PrimaryKeyWithThroughValues | PrimaryKeyWithThroughValues[] | AssociatedOptions
): Promise<void>`

**ประเภท (Type)**

```typescript
type PrimaryKeyWithThroughValues = [TargetKey, Values];

interface AssociatedOptions extends Transactionable {
  tk?:
    | TargetKey
    | TargetKey[]
    | PrimaryKeyWithThroughValues
    | PrimaryKeyWithThroughValues[];
}
```

**รายละเอียด**

คุณสามารถส่ง `targetKey` ของออบเจกต์ที่เกี่ยวข้องเข้ามาโดยตรง หรือจะส่ง `targetKey` พร้อมกับค่าฟิลด์ของตารางเชื่อมโยง (junction table) เข้ามาพร้อมกันก็ได้ครับ/ค่ะ

**ตัวอย่าง**

```typescript
const t1 = await Tag.repository.create({
  values: { name: 't1' },
});

const t2 = await Tag.repository.create({
  values: { name: 't2' },
});

const p1 = await Post.repository.create({
  values: { title: 'p1' },
});

const PostTagRepository = new BelongsToManyRepository(Post, 'tags', p1.id);

// ส่ง targetKey เข้ามา
PostTagRepository.add([t1.id, t2.id]);

// ส่งฟิลด์ของตารางเชื่อมโยงเข้ามา
PostTagRepository.add([
  [t1.id, { tagged_at: '123' }],
  [t2.id, { tagged_at: '456' }],
]);
```

### `set()`

กำหนดออบเจกต์ที่เกี่ยวข้อง

**รูปแบบการใช้งาน (Signature)**

- async set(
  options: TargetKey | TargetKey[] | PrimaryKeyWithThroughValues | PrimaryKeyWithThroughValues[] | AssociatedOptions,
  ): Promise<void>

**รายละเอียด**

พารามิเตอร์จะเหมือนกับเมธอด [add()](#add) ครับ/ค่ะ

### `remove()`

ลบความสัมพันธ์กับออบเจกต์ที่กำหนด

**รูปแบบการใช้งาน (Signature)**

- `async remove(options: TargetKey | TargetKey[] | AssociatedOptions)`

**ประเภท (Type)**

```typescript
interface AssociatedOptions extends Transactionable {
  tk?: TargetKey | TargetKey[];
}
```

### `toggle()`

สลับสถานะของออบเจกต์ที่เกี่ยวข้อง

ในบางสถานการณ์ทางธุรกิจ เรามักจะต้องสลับสถานะของออบเจกต์ที่เกี่ยวข้องอยู่บ่อยครั้งครับ/ค่ะ เช่น ผู้ใช้สามารถกดถูกใจสินค้า, ยกเลิกถูกใจ, และกดถูกใจอีกครั้งได้ เมธอด `toggle` ช่วยให้คุณสามารถสร้างฟังก์ชันการทำงานแบบนี้ได้อย่างรวดเร็วครับ/ค่ะ

**รูปแบบการใช้งาน (Signature)**

- `async toggle(options: TargetKey | { tk?: TargetKey; transaction?: Transaction }): Promise<void>`

**รายละเอียด**

เมธอด `toggle` จะตรวจสอบโดยอัตโนมัติว่าออบเจกต์ที่เกี่ยวข้องมีอยู่แล้วหรือไม่ ถ้ามีอยู่ก็จะถูกลบออกไป แต่ถ้ายังไม่มีก็จะถูกเพิ่มเข้ามาครับ/ค่ะ