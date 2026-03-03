:::tip{title="การแจ้งเตือนการแปลด้วย AI"}
เอกสารนี้แปลโดย AI สำหรับข้อมูลที่ถูกต้อง กรุณาดู[เวอร์ชันภาษาอังกฤษ](/runjs/context/collection)
:::

# ctx.collection

อินสแตนซ์ของคอลเลกชัน (Collection) ที่เกี่ยวข้องกับบริบทการทำงาน (Execution Context) ของ RunJS ในปัจจุบัน ใช้สำหรับเข้าถึงข้อมูลเมทาดาตา (Metadata), การกำหนดฟิลด์ และการตั้งค่าคีย์หลัก (Primary Key) ของคอลเลกชัน โดยปกติจะมาจาก `ctx.blockModel.collection` หรือ `ctx.collectionField?.collection` ครับ

## สถานการณ์ที่ใช้งาน

| สถานการณ์ | คำอธิบาย |
|------|------|
| **JSBlock** | คอลเลกชันที่ผูกกับบล็อก สามารถเข้าถึง `name`, `getFields`, `filterTargetKey` และอื่น ๆ ได้ |
| **JSField / JSItem / JSColumn** | คอลเลกชันที่ฟิลด์ปัจจุบันสังกัดอยู่ (หรือคอลเลกชันของบล็อกหลัก) ใช้สำหรับดึงรายการฟิลด์, คีย์หลัก และอื่น ๆ |
| **คอลัมน์ตาราง / บล็อกรายละเอียด** | ใช้สำหรับเรนเดอร์ตามโครงสร้างคอลเลกชัน หรือส่งค่า `filterByTk` เมื่อเปิดหน้าต่างป๊อปอัป |

> หมายเหตุ: `ctx.collection` สามารถใช้งานได้ในสถานการณ์ที่บล็อกข้อมูล, บล็อกแบบฟอร์ม หรือบล็อกตารางมีการผูกกับคอลเลกชัน สำหรับ JSBlock อิสระที่ไม่ได้ผูกกับคอลเลกชัน ค่าอาจเป็น `null` ได้ จึงแนะนำให้ตรวจสอบค่าว่างก่อนใช้งานครับ

## การกำหนดประเภท (Type Definition)

```ts
collection: Collection | null | undefined;
```

## คุณสมบัติที่ใช้บ่อย (Common Properties)

| คุณสมบัติ | ประเภท | คำอธิบาย |
|------|------|------|
| `name` | `string` | ชื่อคอลเลกชัน (เช่น `users`, `orders`) |
| `title` | `string` | ชื่อหัวข้อของคอลเลกชัน (รองรับการทำ Internationalization) |
| `filterTargetKey` | `string \| string[]` | ชื่อฟิลด์คีย์หลัก ใช้สำหรับ `filterByTk` และ `getFilterByTK` |
| `dataSourceKey` | `string` | คีย์ของแหล่งข้อมูล (เช่น `main`) |
| `dataSource` | `DataSource` | อินสแตนซ์ของแหล่งข้อมูลที่สังกัดอยู่ |
| `template` | `string` | เทมเพลตของคอลเลกชัน (เช่น `general`, `file`, `tree`) |
| `titleableFields` | `CollectionField[]` | รายการฟิลด์ที่สามารถแสดงเป็นชื่อหัวข้อได้ |
| `titleCollectionField` | `CollectionField` | อินสแตนซ์ของฟิลด์ที่เป็นชื่อหัวข้อ |

## เมธอดที่ใช้บ่อย (Common Methods)

| เมธอด | คำอธิบาย |
|------|------|
| `getFields(): CollectionField[]` | รับฟิลด์ทั้งหมด (รวมถึงฟิลด์ที่สืบทอดมา) |
| `getField(name: string): CollectionField \| undefined` | รับฟิลด์เดียวตามชื่อฟิลด์ |
| `getFieldByPath(path: string): CollectionField \| undefined` | รับฟิลด์ตามเส้นทาง (รองรับความสัมพันธ์ เช่น `user.name`) |
| `getAssociationFields(types?): CollectionField[]` | รับฟิลด์ความสัมพันธ์ โดย `types` สามารถเป็น `['one']`, `['many']` และอื่น ๆ |
| `getFilterByTK(record): any` | ดึงค่าคีย์หลักจากเรกคอร์ด เพื่อใช้สำหรับ `filterByTk` ของ API |

## ความสัมพันธ์กับ ctx.collectionField และ ctx.blockModel

| ความต้องการ | วิธีการที่แนะนำ |
|------|----------|
| **คอลเลกชันที่เกี่ยวข้องกับบริบทปัจจุบัน** | `ctx.collection` (เทียบเท่ากับ `ctx.blockModel?.collection` หรือ `ctx.collectionField?.collection`) |
| **การกำหนดคอลเลกชันของฟิลด์ปัจจุบัน** | `ctx.collectionField?.collection` (คอลเลกชันที่ฟิลด์นั้นสังกัดอยู่) |
| **คอลเลกชันเป้าหมายของความสัมพันธ์** | `ctx.collectionField?.targetCollection` (คอลเลกชันเป้าหมายของฟิลด์ความสัมพันธ์) |

ในสถานการณ์เช่น ตารางย่อย (Sub-table), `ctx.collection` อาจเป็นคอลเลกชันเป้าหมายของความสัมพันธ์ ส่วนในแบบฟอร์มหรือตารางทั่วไป มักจะเป็นคอลเลกชันที่ผูกกับบล็อกนั้น ๆ ครับ

## ตัวอย่าง

### การรับคีย์หลักและเปิดหน้าต่างป๊อปอัป

```ts
const primaryKey = ctx.collection?.filterTargetKey ?? 'id';
await ctx.openView(popupUid, {
  mode: 'dialog',
  params: {
    filterByTk: ctx.record?.[primaryKey],
    record: ctx.record,
  },
});
```

### การวนลูปฟิลด์เพื่อตรวจสอบข้อมูลหรือทำ Linkage

```ts
const fields = ctx.collection?.getFields() ?? [];
const requiredFields = fields.filter((f) => f.options?.required);
for (const f of requiredFields) {
  const v = ctx.form?.getFieldValue(f.name);
  if (v == null || v === '') {
    ctx.message.warning(`${f.title} จำเป็นต้องระบุ`);
    return;
  }
}
```

### การรับฟิลด์ความสัมพันธ์

```ts
const oneToMany = ctx.collection?.getAssociationFields(['many']) ?? [];
// ใช้สำหรับสร้างตารางย่อย, แหล่งข้อมูลที่เกี่ยวข้อง และอื่น ๆ
```

## ข้อควรระวัง

- `filterTargetKey` คือชื่อฟิลด์คีย์หลักของคอลเลกชัน บางคอลเลกชันอาจใช้คีย์หลักแบบผสม (`string[]`) หากไม่ได้ตั้งค่าไว้ มักจะใช้ `'id'` เป็นค่าเริ่มต้นครับ
- ในสถานการณ์เช่น **ตารางย่อย หรือฟิลด์ความสัมพันธ์**, `ctx.collection` อาจชี้ไปยังคอลเลกชันเป้าหมายของความสัมพันธ์ ซึ่งจะแตกต่างจาก `ctx.blockModel.collection`
- `getFields()` จะรวมฟิลด์จากคอลเลกชันที่สืบทอดมาด้วย โดยฟิลด์ของตัวเองจะเขียนทับฟิลด์ที่สืบทอดมาหากมีชื่อซ้ำกัน

## สิ่งที่เกี่ยวข้อง

- [ctx.collectionField](./collection-field.md): การกำหนดฟิลด์คอลเลกชันของฟิลด์ปัจจุบัน
- [ctx.blockModel](./block-model.md): บล็อกหลักที่รัน JS ปัจจุบัน ซึ่งประกอบด้วย `collection`
- [ctx.model](./model.md): โมเดลปัจจุบัน ซึ่งอาจประกอบด้วย `collection`