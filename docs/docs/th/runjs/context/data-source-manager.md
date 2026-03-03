:::tip{title="การแจ้งเตือนการแปลด้วย AI"}
เอกสารนี้แปลโดย AI สำหรับข้อมูลที่ถูกต้อง กรุณาดู[เวอร์ชันภาษาอังกฤษ](/runjs/context/data-source-manager)
:::

# ctx.dataSourceManager

ตัวจัดการแหล่งข้อมูล (อินสแตนซ์ `DataSourceManager`) ใช้สำหรับจัดการและเข้าถึงแหล่งข้อมูลหลายรายการ (เช่น ฐานข้อมูลหลัก `main`, ฐานข้อมูลล็อก `logging` เป็นต้น) ใช้ในกรณีที่มีแหล่งข้อมูลหลายแห่ง หรือเมื่อต้องการเข้าถึง Metadata ข้ามแหล่งข้อมูลครับ

## Applicability (สถานการณ์ที่เหมาะสม)

| สถานการณ์ | คำอธิบาย |
|------|------|
| **หลายแหล่งข้อมูล** | แสดงรายการแหล่งข้อมูลทั้งหมด หรือรับแหล่งข้อมูลที่ระบุตาม key |
| **การเข้าถึงข้ามแหล่งข้อมูล** | เข้าถึง Metadata โดยใช้รูปแบบ "key ของแหล่งข้อมูล + ชื่อคอลเลกชัน" เมื่อไม่ทราบแหล่งข้อมูลในบริบทปัจจุบัน |
| **รับฟิลด์ตามเส้นทางเต็ม** | ใช้รูปแบบ `dataSourceKey.collectionName.fieldPath` เพื่อรับการกำหนดค่าฟิลด์ข้ามแหล่งข้อมูล |

> หมายเหตุ: หากคุณใช้งานเฉพาะแหล่งข้อมูลปัจจุบันเป็นหลัก แนะนำให้ใช้ `ctx.dataSource` ก่อน แต่หากต้องการแสดงรายการหรือสลับแหล่งข้อมูล ให้ใช้ `ctx.dataSourceManager` ครับ

## Type Definition (การกำหนดประเภท)

```ts
dataSourceManager: DataSourceManager;

class DataSourceManager {
  constructor();

  // การจัดการแหล่งข้อมูล
  addDataSource(ds: DataSource | DataSourceOptions): void;
  upsertDataSource(ds: DataSource | DataSourceOptions): void;
  removeDataSource(key: string): void;
  clearDataSources(): void;

  // อ่านแหล่งข้อมูล
  getDataSources(): DataSource[];                     // รับแหล่งข้อมูลทั้งหมด
  getDataSource(key: string): DataSource | undefined;  // รับแหล่งข้อมูลตาม key

  // เข้าถึง Metadata โดยตรงผ่าน แหล่งข้อมูล + คอลเลกชัน
  getCollection(dataSourceKey: string, collectionName: string): Collection | undefined;
  getCollectionField(fieldPathWithDataSource: string): CollectionField | undefined;
}
```

## ความสัมพันธ์กับ ctx.dataSource

| ความต้องการ | วิธีการที่แนะนำ |
|------|----------|
| **แหล่งข้อมูลเดียวที่ผูกกับบริบทปัจจุบัน** | `ctx.dataSource` (เช่น แหล่งข้อมูลของหน้า/บล็อกปัจจุบัน) |
| **จุดเริ่มต้นสำหรับแหล่งข้อมูลทั้งหมด** | `ctx.dataSourceManager` |
| **แสดงรายการหรือสลับแหล่งข้อมูล** | `ctx.dataSourceManager.getDataSources()` / `getDataSource(key)` |
| **รับคอลเลกชันภายในแหล่งข้อมูลปัจจุบัน** | `ctx.dataSource.getCollection(name)` |
| **รับคอลเลกชันข้ามแหล่งข้อมูล** | `ctx.dataSourceManager.getCollection(dataSourceKey, collectionName)` |
| **รับฟิลด์ภายในแหล่งข้อมูลปัจจุบัน** | `ctx.dataSource.getCollectionField('users.profile.avatar')` |
| **รับฟิลด์ข้ามแหล่งข้อมูล** | `ctx.dataSourceManager.getCollectionField('main.users.profile.avatar')` |

## ตัวอย่างการใช้งาน

### การรับแหล่งข้อมูลที่ระบุ

```ts
// รับแหล่งข้อมูลที่ชื่อว่า 'main'
const mainDS = ctx.dataSourceManager.getDataSource('main');

// รับคอลเลกชันทั้งหมดภายใต้แหล่งข้อมูลนี้
const collections = mainDS?.getCollections();
```

### การเข้าถึง Metadata ของคอลเลกชันข้ามแหล่งข้อมูล

```ts
// รับคอลเลกชันตาม dataSourceKey + collectionName
const users = ctx.dataSourceManager.getCollection('main', 'users');
const orders = ctx.dataSourceManager.getCollection('main', 'orders');

// รับ Primary Key ของคอลเลกชัน
const primaryKey = users?.filterTargetKey ?? 'id';
```

### การรับการกำหนดค่าฟิลด์ตามเส้นทางเต็ม

```ts
// รูปแบบ: dataSourceKey.collectionName.fieldPath
// รับการกำหนดค่าฟิลด์ตาม "key ของแหล่งข้อมูล.ชื่อคอลเลกชัน.เส้นทางฟิลด์"
const field = ctx.dataSourceManager.getCollectionField('main.users.profile.avatar');

// รองรับเส้นทางฟิลด์ที่มีความสัมพันธ์ (Association field paths)
const userNameField = ctx.dataSourceManager.getCollectionField('main.orders.createdBy.name');
```

### การวนลูปผ่านแหล่งข้อมูลทั้งหมด

```ts
const dataSources = ctx.dataSourceManager.getDataSources();
for (const ds of dataSources) {
  ctx.logger.info(`แหล่งข้อมูล: ${ds.key}, ชื่อที่แสดง: ${ds.displayName}`);
  const collections = ds.getCollections();
  for (const col of collections) {
    ctx.logger.info(`  - คอลเลกชัน: ${col.name}`);
  }
}
```

### การเลือกแหล่งข้อมูลแบบไดนามิกตามตัวแปร

```ts
const dsKey = ctx.getVar('dataSourceKey') ?? 'main';
const collectionName = ctx.getVar('collectionName') ?? 'users';
const col = ctx.dataSourceManager.getCollection(dsKey, collectionName);
if (col) {
  const fields = col.getFields();
  // ...
}
```

## ข้อควรระวัง

- รูปแบบเส้นทางสำหรับ `getCollectionField` คือ `dataSourceKey.collectionName.fieldPath` โดยส่วนแรกคือ key ของแหล่งข้อมูล ตามด้วยชื่อคอลเลกชันและเส้นทางของฟิลด์ครับ
- `getDataSource(key)` จะคืนค่าเป็น `undefined` หากไม่พบแหล่งข้อมูล แนะนำให้ตรวจสอบค่าว่าง (null check) ก่อนใช้งานครับ
- `addDataSource` จะโยนข้อผิดพลาด (exception) หากมี key นั้นอยู่แล้ว ส่วน `upsertDataSource` จะทำการเขียนทับหรือเพิ่มใหม่ครับ

## สิ่งที่เกี่ยวข้อง

- [ctx.dataSource](./data-source.md): อินสแตนซ์ของแหล่งข้อมูลปัจจุบัน
- [ctx.collection](./collection.md): คอลเลกชันที่เกี่ยวข้องกับบริบทปัจจุบัน
- [ctx.collectionField](./collection-field.md): การกำหนดค่าฟิลด์ของคอลเลกชันสำหรับฟิลด์ปัจจุบัน