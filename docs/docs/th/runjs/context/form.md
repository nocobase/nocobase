:::tip{title="การแจ้งเตือนการแปลด้วย AI"}
เอกสารนี้แปลโดย AI สำหรับข้อมูลที่ถูกต้อง กรุณาดู[เวอร์ชันภาษาอังกฤษ](/runjs/context/form)
:::

# ctx.form

อินสแตนซ์ของ Ant Design Form ภายในบล็อกปัจจุบัน ใช้สำหรับอ่านและเขียนฟิลด์ในฟอร์ม, เรียกใช้การตรวจสอบ (Validation) และการส่งข้อมูล (Submission) ซึ่งมีค่าเท่ากับ `ctx.blockModel?.form` และสามารถใช้งานได้โดยตรงภายใต้บล็อกที่เกี่ยวข้องกับฟอร์ม (เช่น Form, EditForm, Sub-form เป็นต้น) ครับ

## สถาณการณ์ที่ใช้งาน

| สถานการณ์ | คำอธิบาย |
|------|------|
| **JSField** | อ่าน/เขียนฟิลด์อื่นในฟอร์มเพื่อทำ Linkage หรือคำนวณและตรวจสอบตามค่าของฟิลด์อื่น |
| **JSItem** | อ่าน/เขียนฟิลด์ในแถวเดียวกันหรือฟิลด์อื่นในรายการตารางย่อย (Sub-table) เพื่อทำ Linkage ภายในตาราง |
| **JSColumn** | อ่านค่าของแถวนั้นหรือฟิลด์ที่เกี่ยวข้องในคอลัมน์ของตารางเพื่อใช้ในการแสดงผล (Rendering) |
| **การดำเนินการฟอร์ม / เวิร์กโฟลว์** | การตรวจสอบก่อนส่งข้อมูล, การอัปเดตฟิลด์แบบกลุ่ม, การรีเซ็ตฟอร์ม และอื่น ๆ |

> หมายเหตุ: `ctx.form` จะใช้งานได้เฉพาะในบริบท RunJS ที่เกี่ยวข้องกับบล็อกฟอร์ม (Form, EditForm, Sub-form ฯลฯ) เท่านั้น ในกรณีที่ไม่ใช่ฟอร์ม (เช่น JSBlock อิสระ หรือบล็อกตาราง) อาจไม่มีออบเจ็กต์นี้อยู่ แนะนำให้ตรวจสอบค่าว่างก่อนใช้งาน เช่น: `ctx.form?.getFieldsValue()` ครับ

## การกำหนดประเภท (Type Definition)

```ts
form: FormInstance<any>;
```

`FormInstance` คือประเภทอินสแตนซ์ของ Ant Design Form โดยมีวิธีการใช้งานที่พบบ่อยดังนี้ครับ

## วิธีการที่ใช้บ่อย

### การอ่านค่าฟอร์ม

```ts
// อ่านค่าของฟิลด์ที่ลงทะเบียนไว้ในปัจจุบัน (โดยปกติจะรวมเฉพาะฟิลด์ที่ถูกเรนเดอร์แล้ว)
const values = ctx.form.getFieldsValue();

// อ่านค่าของทุกฟิลด์ (รวมถึงฟิลด์ที่ลงทะเบียนไว้แต่ยังไม่ได้เรนเดอร์ เช่น ฟิลด์ที่ถูกซ่อนหรืออยู่ในส่วนที่พับอยู่)
const allValues = ctx.form.getFieldsValue(true);

// อ่านค่าฟิลด์เดียว
const email = ctx.form.getFieldValue('email');

// อ่านค่าฟิลด์แบบลำดับชั้น (เช่น ในตารางย่อย)
const amount = ctx.form.getFieldValue(['orders', 0, 'amount']);
```

### การเขียนค่าฟอร์ม

```ts
// อัปเดตแบบกลุ่ม (มักใช้สำหรับ Linkage)
ctx.form.setFieldsValue({
  status: 'active',
  updatedAt: new Date(),
});

// อัปเดตฟิลด์เดียว
ctx.form.setFieldValue('remark', 'บันทึกข้อมูลแล้ว');
```

### การตรวจสอบและการส่งข้อมูล

```ts
// เรียกใช้การตรวจสอบฟอร์ม
await ctx.form.validateFields();

// เรียกใช้การส่งข้อมูลฟอร์ม
ctx.form.submit();
```

### การรีเซ็ต

```ts
// รีเซ็ตฟิลด์ทั้งหมด
ctx.form.resetFields();

// รีเซ็ตเฉพาะฟิลด์ที่ระบุ
ctx.form.resetFields(['status', 'remark']);
```

## ความสัมพันธ์กับ Context ที่เกี่ยวข้อง

### ctx.getValue / ctx.setValue

| สถานการณ์ | วิธีการที่แนะนำ |
|------|----------|
| **อ่าน/เขียนฟิลด์ปัจจุบัน** | `ctx.getValue()` / `ctx.setValue(v)` |
| **อ่าน/เขียนฟิลด์อื่น** | `ctx.form.getFieldValue(name)` / `ctx.form.setFieldValue(name, v)` |

ภายในฟิลด์ JS ปัจจุบัน แนะนำให้ใช้ `getValue`/`setValue` เพื่ออ่าน/เขียนฟิลด์ของตัวเองเป็นอันดับแรก และใช้ `ctx.form` เมื่อต้องการเข้าถึงฟิลด์อื่นครับ

### ctx.blockModel

| ความต้องการ | วิธีการที่แนะนำ |
|------|----------|
| **อ่าน/เขียนฟิลด์ในฟอร์ม** | `ctx.form` (มีค่าเท่ากับ `ctx.blockModel?.form` ซึ่งสะดวกกว่า) |
| **เข้าถึงบล็อกหลัก** | `ctx.blockModel` (ประกอบด้วย `collection`, `resource` และอื่น ๆ) |

### ctx.getVar('ctx.formValues')

ค่าของฟอร์มต้องรับผ่าน `await ctx.getVar('ctx.formValues')` และไม่ได้ถูกเปิดเผยโดยตรงเป็น `ctx.formValues` ในบริบทของฟอร์ม แนะนำให้ใช้ `ctx.form.getFieldsValue()` เพื่ออ่านค่าล่าสุดแบบเรียลไทม์ครับ

## ข้อควรระวัง

- `getFieldsValue()` โดยปกติจะคืนค่าเฉพาะฟิลด์ที่เรนเดอร์แล้วเท่านั้น หากต้องการรวมฟิลด์ที่ไม่ได้เรนเดอร์ (เช่น ในส่วนที่พับอยู่ หรือถูกซ่อนตามเงื่อนไข) ต้องส่งค่า `true`: `getFieldsValue(true)`
- พาธของฟิลด์แบบลำดับชั้น เช่น ตารางย่อย จะเป็นอาร์เรย์ (Array) เช่น `['orders', 0, 'amount']` โดยสามารถใช้ `ctx.namePath` เพื่อรับพาธของฟิลด์ปัจจุบัน และใช้สร้างพาธสำหรับคอลัมน์อื่นในแถวเดียวกันได้
- `validateFields()` จะโยน (Throw) ออบเจ็กต์ข้อผิดพลาดซึ่งประกอบด้วยข้อมูลอย่าง `errorFields` หากการตรวจสอบก่อนส่งข้อมูลล้มเหลว สามารถใช้ `ctx.exit()` เพื่อหยุดขั้นตอนถัดไปได้
- ในสถานการณ์ที่เป็น Asynchronous เช่น เวิร์กโฟลว์ หรือกฎการเชื่อมโยง (Linkage Rules) `ctx.form` อาจยังไม่พร้อมใช้งาน แนะนำให้ใช้ Optional Chaining หรือการตรวจสอบค่าว่างครับ

## ตัวอย่าง

### Linkage ของฟิลด์: แสดงเนื้อหาที่แตกต่างกันตามประเภท

```ts
const type = ctx.form.getFieldValue('type');
if (type === 'vip') {
  ctx.form.setFieldsValue({ discount: 0.8 });
} else {
  ctx.form.setFieldsValue({ discount: 1 });
}
```

### คำนวณค่าฟิลด์ปัจจุบันตามฟิลด์อื่น

```ts
const quantity = ctx.form.getFieldValue('quantity') ?? 0;
const price = ctx.form.getFieldValue('price') ?? 0;
ctx.setValue(quantity * price);
```

### อ่าน/เขียนคอลัมน์อื่นในแถวเดียวกันภายในตารางย่อย

```ts
// ctx.namePath คือพาธของฟิลด์ปัจจุบันในฟอร์ม เช่น ['orders', 0, 'amount']
// อ่านค่า status ในแถวเดียวกัน: ['orders', 0, 'status']
const rowIndex = ctx.namePath?.[1];
const status = ctx.form.getFieldValue(['orders', rowIndex, 'status']);
```

### การตรวจสอบก่อนส่งข้อมูล

```ts
try {
  await ctx.form.validateFields();
  // การตรวจสอบผ่าน ดำเนินการส่งข้อมูลต่อไป
} catch (e) {
  ctx.message.error('กรุณาตรวจสอบการกรอกข้อมูลในฟอร์ม');
  ctx.exit();
}
```

### ส่งข้อมูลหลังจากยืนยัน

```ts
const confirmed = await ctx.modal.confirm({
  title: 'ยืนยันการส่งข้อมูล',
  content: 'หลังจากส่งแล้วจะไม่สามารถแก้ไขได้ คุณต้องการดำเนินการต่อหรือไม่?',
  okText: 'ยืนยัน',
  cancelText: 'ยกเลิก',
});
if (confirmed) {
  await ctx.form.validateFields();
  ctx.form.submit();
} else {
  ctx.exit(); // หยุดกระบวนการเมื่อผู้ใช้ยกเลิก
}
```

## สิ่งที่เกี่ยวข้อง

- [ctx.getValue()](./get-value.md) / [ctx.setValue()](./set-value.md): อ่านและเขียนค่าฟิลด์ปัจจุบัน
- [ctx.blockModel](./block-model.md): โมเดลของบล็อกหลัก โดย `ctx.form` มีค่าเท่ากับ `ctx.blockModel?.form`
- [ctx.modal](./modal.md): หน้าต่างยืนยัน มักใช้ร่วมกับ `ctx.form.validateFields()` และ `ctx.form.submit()`
- [ctx.exit()](./exit.md): หยุดกระบวนการเมื่อการตรวจสอบล้มเหลวหรือผู้ใช้ยกเลิก
- `ctx.namePath`: พาธของฟิลด์ปัจจุบันในฟอร์ม (อาร์เรย์) ใช้สำหรับสร้างชื่อใน `getFieldValue` / `setFieldValue` สำหรับฟิลด์แบบลำดับชั้น