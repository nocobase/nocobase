:::tip
เอกสารนี้แปลโดย AI หากมีข้อมูลที่ไม่ถูกต้อง โปรดดู[เวอร์ชันภาษาอังกฤษ](/en)
:::


# HasManyRepository

`HasManyRepository` คือ `Relation Repository` ที่ใช้สำหรับจัดการความสัมพันธ์แบบ `HasMany` ครับ/ค่ะ

## เมธอดของคลาส (Class Methods)

### `find()`

ค้นหาออบเจกต์ที่เกี่ยวข้อง

**รูปแบบการเรียกใช้ (Signature)**

- `async find(options?: FindOptions): Promise<M[]>`

**รายละเอียด**

พารามิเตอร์สำหรับการคิวรีจะเหมือนกับ [`Repository.find()`](../repository.md#find) ครับ/ค่ะ

### `findOne()`

ค้นหาออบเจกต์ที่เกี่ยวข้อง โดยจะคืนค่ากลับมาเพียงหนึ่งเรคคอร์ดเท่านั้นครับ/ค่ะ

**รูปแบบการเรียกใช้ (Signature)**

- `async findOne(options?: FindOneOptions): Promise<M>`

<embed src="../shared/find-one.md"></embed>

### `count()`

คืนค่าจำนวนเรคคอร์ดที่ตรงตามเงื่อนไขการคิวรีครับ/ค่ะ

**รูปแบบการเรียกใช้ (Signature)**

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

คิวรีฐานข้อมูลเพื่อดึงชุดข้อมูลและจำนวนผลลัพธ์ที่ตรงตามเงื่อนไขที่ระบุครับ/ค่ะ

**รูปแบบการเรียกใช้ (Signature)**

- `async findAndCount(options?: FindAndCountOptions): Promise<[any[], number]>`

**ประเภท (Type)**

```typescript
type FindAndCountOptions = CommonFindOptions;
```

### `create()`

สร้างออบเจกต์ที่เกี่ยวข้อง

**รูปแบบการเรียกใช้ (Signature)**

- `async create(options?: CreateOptions): Promise<M>`

<embed src="../shared/create-options.md"></embed>

### `update()`

อัปเดตออบเจกต์ที่เกี่ยวข้องที่ตรงตามเงื่อนไขครับ/ค่ะ

**รูปแบบการเรียกใช้ (Signature)**

- `async update(options?: UpdateOptions): Promise<M>`

<embed src="../shared/update-options.md"></embed>

### `destroy()`

ลบออบเจกต์ที่เกี่ยวข้องที่ตรงตามเงื่อนไขครับ/ค่ะ

**รูปแบบการเรียกใช้ (Signature)**

- `async destroy(options?: TK | DestroyOptions): Promise<M>`

<embed src="../shared/destroy-options.md"></embed>

### `add()`

เพิ่มความสัมพันธ์ของออบเจกต์

**รูปแบบการเรียกใช้ (Signature)**

- `async add(options: TargetKey | TargetKey[] | AssociatedOptions)`

**ประเภท (Type)**

```typescript
interface AssociatedOptions extends Transactionable {
  tk?: TargetKey | TargetKey[];
}
```

**รายละเอียด**

- `tk` - ค่า `targetKey` ของออบเจกต์ที่เกี่ยวข้อง ซึ่งอาจเป็นค่าเดียวหรืออาร์เรย์ก็ได้ครับ/ค่ะ
  <embed src="../shared/transaction.md"></embed>

### `remove()`

ลบความสัมพันธ์กับออบเจกต์ที่ระบุ

**รูปแบบการเรียกใช้ (Signature)**

- `async remove(options: TargetKey | TargetKey[] | AssociatedOptions)`

**รายละเอียด**

พารามิเตอร์จะเหมือนกับเมธอด [`add()`](#add) ครับ/ค่ะ

### `set()`

กำหนดออบเจกต์ที่เกี่ยวข้องสำหรับความสัมพันธ์ปัจจุบัน

**รูปแบบการเรียกใช้ (Signature)**

- `async set(options: TargetKey | TargetKey[] | AssociatedOptions)`

**รายละเอียด**

พารามิเตอร์จะเหมือนกับเมธอด [`add()`](#add) ครับ/ค่ะ