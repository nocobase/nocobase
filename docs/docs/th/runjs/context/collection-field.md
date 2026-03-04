:::tip{title="การแจ้งเตือนการแปลด้วย AI"}
เอกสารนี้แปลโดย AI สำหรับข้อมูลที่ถูกต้อง กรุณาดู[เวอร์ชันภาษาอังกฤษ](/runjs/context/collection-field)
:::

# ctx.collectionField

อินสแตนซ์ของฟิลด์ในคอลเลกชัน (CollectionField) ที่เกี่ยวข้องกับบริบทการทำงาน (Execution Context) ของ RunJS ในปัจจุบัน ใช้สำหรับเข้าถึงข้อมูลเมตา (Metadata), ประเภท, กฎการตรวจสอบ (Validation Rules) และข้อมูลการเชื่อมโยงของฟิลด์ จะมีค่าอยู่เฉพาะเมื่อฟิลด์ถูกผูกไว้กับคำนิยามของคอลเลกชันเท่านั้น สำหรับฟิลด์ที่กำหนดเอง (Custom) หรือฟิลด์เสมือน (Virtual) อาจมีค่าเป็น `null` ครับ

## สถานการณ์ที่ใช้งาน

| สถานการณ์ | คำอธิบาย |
|------|------|
| **JSField** | การทำ Linkage หรือการตรวจสอบความถูกต้องในฟิลด์ของฟอร์ม โดยอ้างอิงจาก `interface`, `enum`, `targetCollection` และอื่น ๆ |
| **JSItem** | การเข้าถึงข้อมูลเมตาของฟิลด์ที่ตรงกับคอลัมน์ปัจจุบันในรายการของตารางย่อย (Sub-table) |
| **JSColumn** | การเลือกรูปแบบการแสดงผล (Rendering) ตาม `collectionField.interface` หรือการเข้าถึง `targetCollection` ในคอลัมน์ของตาราง |

> หมายเหตุ: `ctx.collectionField` จะใช้งานได้เฉพาะเมื่อฟิลด์ถูกผูกไว้กับคำนิยามของคอลเลกชัน (Collection) เท่านั้น ในสถานการณ์เช่น บล็อกอิสระ (JSBlock) หรือเหตุการณ์ของการดำเนินการ (Action Events) ที่ไม่มีการผูกฟิลด์ โดยปกติจะมีค่าเป็น `undefined` จึงแนะนำให้ตรวจสอบค่าว่างก่อนใช้งานครับ

## การนิยามประเภท (Type Definition)

```ts
collectionField: CollectionField | null | undefined;
```

## คุณสมบัติที่ใช้บ่อย (Common Properties)

| คุณสมบัติ | ประเภท | คำอธิบาย |
|------|------|------|
| `name` | `string` | ชื่อฟิลด์ (เช่น `status`, `userId`) |
| `title` | `string` | ชื่อหัวข้อฟิลด์ (รวมถึงการรองรับหลายภาษา) |
| `type` | `string` | ประเภทข้อมูลของฟิลด์ (`string`, `integer`, `belongsTo` และอื่น ๆ) |
| `interface` | `string` | ประเภทอินเทอร์เฟซของฟิลด์ (`input`, `select`, `m2o`, `o2m`, `m2m` และอื่น ๆ) |
| `collection` | `Collection` | คอลเลกชันที่ฟิลด์นี้สังกัดอยู่ |
| `targetCollection` | `Collection` | คอลเลกชันเป้าหมายของฟิลด์เชื่อมโยง (มีค่าเฉพาะในประเภทการเชื่อมโยง) |
| `target` | `string` | ชื่อคอลเลกชันเป้าหมาย (สำหรับฟิลด์เชื่อมโยง) |
| `enum` | `array` | ตัวเลือกแบบรายการ (Select, Radio และอื่น ๆ) |
| `defaultValue` | `any` | ค่าเริ่มต้น |
| `collectionName` | `string` | ชื่อของคอลเลกชันที่สังกัดอยู่ |
| `foreignKey` | `string` | ชื่อฟิลด์คีย์นอก (Foreign Key) (เช่น `belongsTo`) |
| `sourceKey` | `string` | คีย์ต้นทางของการเชื่อมโยง (เช่น `hasMany`) |
| `targetKey` | `string` | คีย์เป้าหมายของการเชื่อมโยง |
| `fullpath` | `string` | เส้นทางแบบเต็ม (เช่น `main.users.status`) ใช้สำหรับ API หรือการอ้างอิงตัวแปร |
| `resourceName` | `string` | ชื่อทรัพยากร (เช่น `users.status`) |
| `readonly` | `boolean` | สถานะอ่านอย่างเดียว |
| `titleable` | `boolean` | สามารถใช้เป็นหัวข้อในการแสดงผลได้หรือไม่ |
| `validation` | `object` | การตั้งค่ากฎการตรวจสอบความถูกต้อง |
| `uiSchema` | `object` | การตั้งค่า UI |
| `targetCollectionTitleField` | `CollectionField` | ฟิลด์หัวข้อของคอลเลกชันเป้าหมาย (สำหรับฟิลด์เชื่อมโยง) |

## เมธอดที่ใช้บ่อย (Common Methods)

| เมธอด | คำอธิบาย |
|------|------|
| `isAssociationField(): boolean` | ตรวจสอบว่าเป็นฟิลด์เชื่อมโยงหรือไม่ (`belongsTo`, `hasMany`, `hasOne`, `belongsToMany` และอื่น ๆ) |
| `isRelationshipField(): boolean` | ตรวจสอบว่าเป็นฟิลด์ความสัมพันธ์หรือไม่ (รวมถึง `o2o`, `m2o`, `o2m`, `m2m` และอื่น ๆ) |
| `getComponentProps(): object` | รับค่า Props เริ่มต้นของคอมโพเนนต์ฟิลด์ |
| `getFields(): CollectionField[]` | รับรายการฟิลด์ของคอลเลกชันเป้าหมาย (เฉพาะฟิลด์เชื่อมโยง) |
| `getFilterOperators(): object[]` | รับตัวดำเนินการกรอง (Filter Operators) ที่ฟิลด์นี้รองรับ (เช่น `$eq`, `$ne` และอื่น ๆ) |

## ตัวอย่าง

### การแสดงผลตามเงื่อนไขของประเภทฟิลด์

```ts
if (!ctx.collectionField) return null;
const { interface: iface } = ctx.collectionField;
if (['m2o', 'o2m', 'm2m'].includes(iface)) {
  // ฟิลด์เชื่อมโยง: แสดงรายการที่เชื่อมโยง
  const target = ctx.collectionField.targetCollection;
  // ...
} else if (iface === 'select' || iface === 'radioGroup') {
  const options = ctx.collectionField.enum || [];
  // ...
}
```

### การตรวจสอบว่าเป็นฟิลด์เชื่อมโยงหรือไม่และเข้าถึงคอลเลกชันเป้าหมาย

```ts
if (ctx.collectionField?.isAssociationField()) {
  const targetCol = ctx.collectionField.targetCollection;
  const titleField = targetCol?.titleCollectionField?.name;
  // ประมวลผลตามโครงสร้างของคอลเลกชันเป้าหมาย
}
```

### การรับตัวเลือกจากรายการ (Enumeration)

```ts
const options = ctx.collectionField?.enum ?? [];
const labels = options.map((o) => (typeof o === 'object' ? o.label : o));
```

### การแสดงผลตามเงื่อนไขของโหมดอ่านอย่างเดียวหรือโหมดแสดงผลเท่านั้น

```ts
const { Input } = ctx.libs.antd;
if (ctx.collectionField?.readonly) {
  ctx.render(<span>{ctx.getValue?.() ?? '-'}</span>);
} else {
  ctx.render(<Input onChange={(e) => ctx.setValue?.(e.target.value)} />);
}
```

### การรับฟิลด์หัวข้อของคอลเลกชันเป้าหมาย

```ts
// เมื่อแสดงฟิลด์เชื่อมโยง สามารถใช้ targetCollectionTitleField เพื่อรับชื่อฟิลด์หัวข้อได้
const titleField = ctx.collectionField?.targetCollectionTitleField;
const titleKey = titleField?.name ?? 'title';
const assocValue = ctx.getValue?.() ?? ctx.record?.[ctx.collectionField?.name];
const label = assocValue?.[titleKey];
```

## ความสัมพันธ์กับ ctx.collection

| ความต้องการ | วิธีการที่แนะนำ |
|------|----------|
| **คอลเลกชันที่ฟิลด์ปัจจุบันสังกัดอยู่** | `ctx.collectionField?.collection` หรือ `ctx.collection` |
| **ข้อมูลเมตาของฟิลด์ (ชื่อ, ประเภท, อินเทอร์เฟซ, รายการตัวเลือก และอื่น ๆ)** | `ctx.collectionField` |
| **คอลเลกชันเป้าหมายของการเชื่อมโยง** | `ctx.collectionField?.targetCollection` |

`ctx.collection` มักจะหมายถึงคอลเลกชันที่ผูกกับบล็อกปัจจุบัน ส่วน `ctx.collectionField` หมายถึงคำนิยามของฟิลด์ปัจจุบันในคอลเลกชัน ในสถานการณ์เช่น ตารางย่อยหรือฟิลด์เชื่อมโยง ทั้งสองค่านี้อาจแตกต่างกันได้ครับ

## ข้อควรระวัง

- ในสถานการณ์อย่าง **JSBlock** หรือ **JSAction (ที่ไม่มีการผูกฟิลด์)** โดยปกติ `ctx.collectionField` จะเป็น `undefined` แนะนำให้ใช้ Optional Chaining ก่อนเข้าถึงข้อมูลครับ
- หากฟิลด์ JS ที่กำหนดเองไม่ได้ถูกผูกไว้กับฟิลด์ของคอลเลกชัน `ctx.collectionField` อาจมีค่าเป็น `null`
- `targetCollection` จะมีอยู่เฉพาะในฟิลด์ประเภทเชื่อมโยง (เช่น m2o, o2m, m2m) และ `enum` จะมีอยู่เฉพาะในฟิลด์ที่มีตัวเลือก เช่น select หรือ radioGroup ครับ

## สิ่งที่เกี่ยวข้อง

- [ctx.collection](./collection.md): คอลเลกชันที่เกี่ยวข้องกับบริบทปัจจุบัน
- [ctx.model](./model.md): โมเดลที่บริบทการทำงานปัจจุบันตั้งอยู่
- [ctx.blockModel](./block-model.md): บล็อกหลัก (Parent Block) ที่ครอบคลุม RunJS ปัจจุบัน
- [ctx.getValue()](./get-value.md), [ctx.setValue()](./set-value.md): การอ่านและเขียนค่าของฟิลด์ปัจจุบัน