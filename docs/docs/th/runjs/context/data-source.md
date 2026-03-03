:::tip{title="การแจ้งเตือนการแปลด้วย AI"}
เอกสารนี้แปลโดย AI สำหรับข้อมูลที่ถูกต้อง กรุณาดู[เวอร์ชันภาษาอังกฤษ](/runjs/context/data-source)
:::

# ctx.dataSource

อินสแตนซ์ของแหล่งข้อมูล (`DataSource`) ที่ผูกกับบริบทการทำงาน (Execution Context) ของ RunJS ในปัจจุบัน ใช้สำหรับเข้าถึงคอลเลกชัน, เมทาดาตาของฟิลด์ และจัดการการตั้งค่าคอลเลกชัน**ภายในแหล่งข้อมูลปัจจุบัน** โดยปกติจะตรงกับแหล่งข้อมูลที่เลือกในหน้าหรือบล็อกปัจจุบัน (เช่น ฐานข้อมูลหลัก `main`) ครับ

## แอปพลิเคชันที่เหมาะสม

| สถานการณ์ | คำอธิบาย |
|------|------|
| **การดำเนินการกับแหล่งข้อมูลเดียว** | รับเมทาดาตาของคอลเลกชันและฟิลด์เมื่อทราบแหล่งข้อมูลปัจจุบัน |
| **การจัดการคอลเลกชัน** | รับ/เพิ่ม/อัปเดต/ลบคอลเลกชันภายใต้แหล่งข้อมูลปัจจุบัน |
| **รับฟิลด์ตามเส้นทาง** | ใช้รูปแบบ `collectionName.fieldPath` เพื่อรับคำนิยามของฟิลด์ (รองรับเส้นทางความสัมพันธ์) |

> หมายเหตุ: `ctx.dataSource` แทนแหล่งข้อมูลเดียวของบริบทปัจจุบัน หากต้องการแจกแจงหรือเข้าถึงแหล่งข้อมูลอื่น โปรดใช้ [ctx.dataSourceManager](./data-source-manager.md) ครับ

## การนิยามประเภท (Type Definition)

```ts
dataSource: DataSource;

class DataSource {
  constructor(options?: Record<string, any>);

  // คุณสมบัติแบบอ่านอย่างเดียว (Read-only)
  get flowEngine(): FlowEngine;   // อินสแตนซ์ FlowEngine ปัจจุบัน
  get displayName(): string;      // ชื่อที่แสดง (รองรับ i18n)
  get key(): string;              // คีย์ของแหล่งข้อมูล เช่น 'main'
  get name(): string;             // เหมือนกับ key

  // การอ่านข้อมูลคอลเลกชัน
  getCollections(): Collection[];                      // รับคอลเลกชันทั้งหมด
  getCollection(name: string): Collection | undefined; // รับคอลเลกชันตามชื่อ
  getAssociation(associationName: string): CollectionField | undefined; // รับฟิลด์ความสัมพันธ์ (เช่น users.roles)

  // การจัดการคอลเลกชัน
  addCollection(collection: Collection | CollectionOptions): void;
  updateCollection(newOptions: CollectionOptions): void;
  upsertCollection(options: CollectionOptions): Collection | undefined;
  upsertCollections(collections: CollectionOptions[], options?: { clearFields?: boolean }): void;
  removeCollection(name: string): void;
  clearCollections(): void;

  // เมทาดาตาของฟิลด์
  getCollectionField(fieldPath: string): CollectionField | undefined;
}
```

## คุณสมบัติที่ใช้บ่อย

| คุณสมบัติ | ประเภท | คำอธิบาย |
|------|------|------|
| `key` | `string` | คีย์ของแหล่งข้อมูล เช่น `'main'` |
| `name` | `string` | เหมือนกับ key |
| `displayName` | `string` | ชื่อที่แสดง (รองรับ i18n) |
| `flowEngine` | `FlowEngine` | อินสแตนซ์ FlowEngine ปัจจุบัน |

## เมธอดที่ใช้บ่อย

| เมธอด | คำอธิบาย |
|------|------|
| `getCollections()` | รับคอลเลกชันทั้งหมดภายใต้แหล่งข้อมูลปัจจุบัน (เรียงลำดับและกรองรายการที่ซ่อนอยู่แล้ว) |
| `getCollection(name)` | รับคอลเลกชันตามชื่อ; `name` สามารถเป็น `collectionName.fieldName` เพื่อรับคอลเลกชันปลายทางของความสัมพันธ์ |
| `getAssociation(associationName)` | รับคำนิยามของฟิลด์ความสัมพันธ์ตาม `collectionName.fieldName` |
| `getCollectionField(fieldPath)` | รับคำนิยามของฟิลด์ตาม `collectionName.fieldPath` รองรับเส้นทางความสัมพันธ์ เช่น `users.profile.avatar` |

## ความสัมพันธ์กับ ctx.dataSourceManager

| ความต้องการ | วิธีการที่แนะนำ |
|------|----------|
| **แหล่งข้อมูลเดียวที่ผูกกับบริบทปัจจุบัน** | `ctx.dataSource` |
| **จุดเริ่มต้นสำหรับแหล่งข้อมูลทั้งหมด** | `ctx.dataSourceManager` |
| **รับคอลเลกชันภายในแหล่งข้อมูลปัจจุบัน** | `ctx.dataSource.getCollection(name)` |
| **รับคอลเลกชันข้ามแหล่งข้อมูล** | `ctx.dataSourceManager.getCollection(dataSourceKey, collectionName)` |
| **รับฟิลด์ภายในแหล่งข้อมูลปัจจุบัน** | `ctx.dataSource.getCollectionField('users.profile.avatar')` |
| **รับฟิลด์ข้ามแหล่งข้อมูล** | `ctx.dataSourceManager.getCollectionField('main.users.profile.avatar')` |

## ตัวอย่าง

### การรับคอลเลกชันและฟิลด์

```ts
// รับคอลเลกชันทั้งหมด
const collections = ctx.dataSource.getCollections();

// รับคอลเลกชันตามชื่อ
const users = ctx.dataSource.getCollection('users');
const primaryKey = users?.filterTargetKey ?? 'id';

// รับคำนิยามของฟิลด์ตาม "ชื่อคอลเลกชัน.เส้นทางฟิลด์" (รองรับความสัมพันธ์)
const field = ctx.dataSource.getCollectionField('users.profile.avatar');
const userNameField = ctx.dataSource.getCollectionField('orders.createdBy.name');
```

### การรับฟิลด์ความสัมพันธ์

```ts
// รับคำนิยามของฟิลด์ความสัมพันธ์ตาม collectionName.fieldName
const rolesField = ctx.dataSource.getAssociation('users.roles');
if (rolesField?.isAssociationField()) {
  const targetCol = rolesField.targetCollection;
  // ประมวลผลตามโครงสร้างของคอลเลกชันปลายทาง
}
```

### การวนลูปคอลเลกชันเพื่อประมวลผลแบบไดนามิก

```ts
const collections = ctx.dataSource.getCollections();
for (const col of collections) {
  const fields = col.getFields();
  const requiredFields = fields.filter((f) => f.options?.required);
  // ...
}
```

### การตรวจสอบความถูกต้องหรือ UI แบบไดนามิกตามเมทาดาตาของฟิลด์

```ts
const field = ctx.dataSource.getCollectionField('users.status');
if (field) {
  const options = field.enum ?? [];
  const operators = field.getFilterOperators();
  // ดำเนินการตรรกะ UI หรือการตรวจสอบตาม interface, enum, validation และอื่นๆ
}
```

## ข้อควรระวัง

- รูปแบบเส้นทางสำหรับ `getCollectionField(fieldPath)` คือ `collectionName.fieldPath` โดยส่วนแรกคือชื่อคอลเลกชัน และส่วนต่อมาคือเส้นทางฟิลด์ (รองรับความสัมพันธ์ เช่น `user.name`)
- `getCollection(name)` รองรับรูปแบบ `collectionName.fieldName` ซึ่งจะคืนค่าคอลเลกชันปลายทางของฟิลด์ความสัมพันธ์
- ในบริบทของ RunJS โดยปกติ `ctx.dataSource` จะถูกกำหนดโดยแหล่งข้อมูลของบล็อกหรือหน้าปัจจุบัน หากบริบทไม่มีการผูกแหล่งข้อมูล อาจเป็น `undefined` แนะนำให้ตรวจสอบค่าว่างก่อนใช้งานครับ

## สิ่งที่เกี่ยวข้อง

- [ctx.dataSourceManager](./data-source-manager.md): ตัวจัดการแหล่งข้อมูล จัดการแหล่งข้อมูลทั้งหมด
- [ctx.collection](./collection.md): คอลเลกชันที่เกี่ยวข้องกับบริบทปัจจุบัน
- [ctx.collectionField](./collection-field.md): คำนิยามฟิลด์ของคอลเลกชันสำหรับฟิลด์ปัจจุบัน