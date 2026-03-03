:::tip{title="การแจ้งเตือนการแปลด้วย AI"}
เอกสารนี้แปลโดย AI สำหรับข้อมูลที่ถูกต้อง กรุณาดู[เวอร์ชันภาษาอังกฤษ](/runjs/context/block-model)
:::

# ctx.blockModel

โมเดลของบล็อกหลัก (BlockModel instance) ที่ JS Field / JS Block ปัจจุบันสังเกตอยู่ ในสถานการณ์เช่น JSField, JSItem และ JSColumn นั้น `ctx.blockModel` จะชี้ไปยังบล็อกฟอร์ม (Form block) หรือบล็อกตาราง (Table block) ที่ครอบคลุมตรรกะ JS ปัจจุบันอยู่ ส่วนใน JSBlock ที่เป็นอิสระ (Standalone) ค่านี้อาจเป็น `null` หรือมีค่าเดียวกับ `ctx.model` ครับ

## สถานการณ์ที่ใช้งาน

| สถานการณ์ | คำอธิบาย |
|------|------|
| **JSField** | เข้าถึง `form`, `คอลเลกชัน`, และ `resource` ของบล็อกฟอร์มหลักภายในฟิลด์ฟอร์ม เพื่อทำระบบการทำงานเชื่อมโยงกัน (Linkage) หรือการตรวจสอบข้อมูล (Validation) |
| **JSItem** | เข้าถึงข้อมูลทรัพยากรและคอลเลกชันของบล็อกตาราง/ฟอร์มหลัก ภายในรายการย่อยของตาราง |
| **JSColumn** | เข้าถึง `resource` (เช่น `getSelectedRows`) และ `คอลเลกชัน` ของบล็อกตารางหลักภายในคอลัมน์ของตาราง |
| **การดำเนินการในฟอร์ม / เวิร์กโฟลว์เหตุการณ์** | เข้าถึง `form` เพื่อตรวจสอบข้อมูลก่อนส่ง หรือเข้าถึง `resource` เพื่อรีเฟรชข้อมูล เป็นต้น |

> หมายเหตุ: `ctx.blockModel` จะใช้งานได้เฉพาะในบริบท RunJS ที่มีบล็อกหลักอยู่เท่านั้น ในกรณีที่เป็น JSBlock อิสระ (ที่ไม่มีฟอร์มหรือตารางหลัก) ค่านี้อาจเป็น `null` ดังนั้นจึงแนะนำให้ตรวจสอบค่าว่าง (Null check) ก่อนใช้งานครับ

## การนิยามประเภท (Type Definition)

```ts
blockModel: BlockModel | FormBlockModel | TableBlockModel | CollectionBlockModel | DataBlockModel | null;
```

ประเภทที่ระบุจะขึ้นอยู่กับประเภทของบล็อกหลัก: บล็อกฟอร์มส่วนใหญ่จะเป็น `FormBlockModel` หรือ `EditFormModel` ส่วนบล็อกตารางส่วนใหญ่จะเป็น `TableBlockModel` ครับ

## คุณสมบัติที่ใช้บ่อย

| คุณสมบัติ | ประเภท | คำอธิบาย |
|------|------|------|
| `uid` | `string` | ตัวระบุเฉพาะ (Unique identifier) ของโมเดลบล็อก |
| `collection` | `Collection` | คอลเลกชันที่ผูกกับบล็อกปัจจุบัน |
| `resource` | `Resource` | อินสแตนซ์ของทรัพยากร (Resource instance) ที่บล็อกใช้งาน (`SingleRecordResource` / `MultiRecordResource` ฯลฯ) |
| `form` | `FormInstance` | บล็อกฟอร์ม: อินสแตนซ์ของ Ant Design Form ซึ่งรองรับ `getFieldsValue`, `validateFields`, `setFieldsValue` เป็นต้น |
| `emitter` | `EventEmitter` | ตัวส่งเหตุการณ์ (Event emitter) ใช้สำหรับติดตาม `formValuesChange`, `onFieldReset` เป็นต้น |

## ความสัมพันธ์กับ ctx.model และ ctx.form

| ความต้องการ | วิธีการที่แนะนำ |
|------|----------|
| **บล็อกหลักของ JS ปัจจุบัน** | `ctx.blockModel` |
| **อ่าน/เขียนฟิลด์ในฟอร์ม** | `ctx.form` (เทียบเท่ากับ `ctx.blockModel?.form` ซึ่งสะดวกกว่าเมื่ออยู่ในบล็อกฟอร์ม) |
| **โมเดลของบริบทการทำงานปัจจุบัน** | `ctx.model` (ใน JSField จะเป็นโมเดลของฟิลด์ ใน JSBlock จะเป็นโมเดลของบล็อก) |

ใน JSField นั้น `ctx.model` คือโมเดลของฟิลด์ และ `ctx.blockModel` คือบล็อกฟอร์มหรือตารางที่ครอบคลุมฟิลด์นั้นอยู่ โดยปกติ `ctx.form` จะหมายถึง `ctx.blockModel.form` ครับ

## ตัวอย่าง

### ตาราง: รับแถวที่เลือกและนำไปประมวลผล

```ts
const rows = ctx.blockModel?.resource?.getSelectedRows?.() || [];
if (rows.length === 0) {
  ctx.message.warning('กรุณาเลือกข้อมูลก่อน');
  return;
}
```

### สถานการณ์ฟอร์ม: ตรวจสอบข้อมูลและรีเฟรช

```ts
if (ctx.blockModel?.form) {
  await ctx.blockModel.form.validateFields();
  await ctx.blockModel.resource?.refresh?.();
}
```

### ติดตามการเปลี่ยนแปลงของฟอร์ม

```ts
ctx.blockModel?.emitter?.on?.('formValuesChange', (payload) => {
  // ทำการเชื่อมโยงข้อมูลหรือเรนเดอร์ใหม่ตามค่าล่าสุดของฟอร์ม
});
```

### สั่งให้บล็อกเรนเดอร์ใหม่

```ts
ctx.blockModel?.rerender?.();
```

## ข้อควรระวัง

- ใน **JSBlock อิสระ** (ที่ไม่มีบล็อกฟอร์มหรือตารางหลัก) `ctx.blockModel` อาจเป็น `null` แนะนำให้ใช้ Optional Chaining เมื่อเข้าถึงคุณสมบัติ เช่น `ctx.blockModel?.resource?.refresh?.()` ครับ
- ใน **JSField / JSItem / JSColumn** นั้น `ctx.blockModel` จะหมายถึงบล็อกฟอร์มหรือตารางที่ครอบคลุมฟิลด์ปัจจุบันอยู่ ส่วนใน **JSBlock** อาจเป็นตัวมันเองหรือบล็อกในระดับที่สูงกว่า ขึ้นอยู่กับลำดับชั้น (Hierarchy) จริงครับ
- `resource` จะมีอยู่เฉพาะในบล็อกข้อมูล (Data blocks) เท่านั้น ส่วน `form` จะมีอยู่เฉพาะในบล็อกฟอร์ม โดยปกติบล็อกตารางจะไม่มี `form` ครับ

## หัวข้อที่เกี่ยวข้อง

- [ctx.model](./model.md): โมเดลของบริบทการทำงานปัจจุบัน
- [ctx.form](./form.md): อินสแตนซ์ของฟอร์ม มักใช้ในบล็อกฟอร์ม
- [ctx.resource](./resource.md): อินสแตนซ์ของทรัพยากร (เทียบเท่ากับ `ctx.blockModel?.resource` สามารถใช้งานได้ทันทีหากมี)
- [ctx.getModel()](./get-model.md): รับโมเดลของบล็อกอื่นตาม UID