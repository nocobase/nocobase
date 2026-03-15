:::tip{title="การแจ้งเตือนการแปลด้วย AI"}
เอกสารนี้แปลโดย AI สำหรับข้อมูลที่ถูกต้อง กรุณาดู[เวอร์ชันภาษาอังกฤษ](/runjs/context/get-var)
:::

# ctx.getVar()

อ่านค่าตัวแปรจากบริบทการทำงานปัจจุบัน (runtime context) แบบ**อะซิงโครนัส (asynchronously)** แหล่งที่มาของตัวแปรจะสอดคล้องกับการประมวลผล `{{ctx.xxx}}` ใน SQL และเทมเพลต ซึ่งโดยปกติจะมาจากผู้ใช้ปัจจุบัน, ระเบียนปัจจุบัน, พารามิเตอร์ของมุมมอง, บริบทของหน้าต่างป๊อปอัป เป็นต้นครับ

## สถานการณ์ที่ใช้งาน

| สถานการณ์ | คำอธิบาย |
|------|------|
| **JSBlock / JSField** | รับข้อมูลเกี่ยวกับระเบียนปัจจุบัน, ผู้ใช้, ทรัพยากร ฯลฯ เพื่อใช้ในการแสดงผลหรือตรรกะ |
| **กฎการเชื่อมโยง (Linkage Rules) / เวิร์กโฟลว์ (Workflow)** | อ่าน `ctx.record`, `ctx.formValues` ฯลฯ เพื่อใช้ในการตัดสินใจตามเงื่อนไข |
| **สูตรคำนวณ / เทมเพลต** | ใช้กฎการประมวลผลตัวแปรแบบเดียวกับ `{{ctx.xxx}}` |

## การกำหนดประเภท (Type Definition)

```ts
getVar(path: string): Promise<any>;
```

| พารามิเตอร์ | ประเภท | คำอธิบาย |
|------|------|------|
| `path` | `string` | เส้นทางของตัวแปร **ต้องเริ่มต้นด้วย `ctx.`** รองรับการเข้าถึงแบบจุด (dot notation) และดัชนีอาร์เรย์ |

**ค่าที่ส่งกลับ**: `Promise<any>` จำเป็นต้องใช้ `await` เพื่อรับค่าที่ประมวลผลแล้ว หากไม่มีตัวแปรอยู่จะส่งกลับ `undefined` ครับ

> หากส่งเส้นทางที่ไม่เริ่มต้นด้วย `ctx.` จะเกิดข้อผิดพลาด: `ctx.getVar(path) expects an expression starting with "ctx.", got: "..."`

## เส้นทางตัวแปรที่ใช้บ่อย

| เส้นทาง | คำอธิบาย |
|------|------|
| `ctx.record` | ระเบียนปัจจุบัน (ใช้งานได้เมื่อฟอร์ม/รายละเอียดผูกกับระเบียน) |
| `ctx.record.id` | คีย์หลักของระเบียนปัจจุบัน |
| `ctx.formValues` | ค่าปัจจุบันของฟอร์ม (มักใช้ในกฎการเชื่อมโยงและเวิร์กโฟลว์ ในกรณีของฟอร์ม แนะนำให้ใช้ `ctx.form.getFieldsValue()` เพื่ออ่านค่าแบบเรียลไทม์) |
| `ctx.user` | ผู้ใช้ที่เข้าสู่ระบบปัจจุบัน |
| `ctx.user.id` | ID ของผู้ใช้ปัจจุบัน |
| `ctx.user.nickname` | ชื่อเล่นของผู้ใช้ปัจจุบัน |
| `ctx.user.roles.name` | ชื่อบทบาทของผู้ใช้ปัจจุบัน (อาร์เรย์) |
| `ctx.popup.record` | ระเบียนภายในหน้าต่างป๊อปอัป |
| `ctx.popup.record.id` | คีย์หลักของระเบียนภายในหน้าต่างป๊อปอัป |
| `ctx.urlSearchParams` | พารามิเตอร์การค้นหาใน URL (ประมวลผลจาก `?key=value`) |
| `ctx.token` | API Token ปัจจุบัน |
| `ctx.role` | บทบาทปัจจุบัน |

## ctx.getVarInfos()

รับ**ข้อมูลโครงสร้าง** (ประเภท, ชื่อหัวข้อ, คุณสมบัติย่อย ฯลฯ) ของตัวแปรที่สามารถประมวลผลได้ในบริบทปัจจุบัน เพื่อความสะดวกในการสำรวจเส้นทางที่ใช้งานได้ ค่าที่ส่งกลับเป็นคำอธิบายแบบสแตติกตาม `meta` และไม่มีค่าจริงขณะทำงานครับ

### การกำหนดประเภท (Type Definition)

```ts
getVarInfos(options?: { path?: string | string[]; maxDepth?: number }): Promise<Record<string, any>>;
```

ในค่าที่ส่งกลับ แต่ละ key คือเส้นทางของตัวแปร และ value คือข้อมูลโครงสร้างของเส้นทางนั้น (ประกอบด้วย `type`, `title`, `properties` ฯลฯ)

### พารามิเตอร์

| พารามิเตอร์ | ประเภท | คำอธิบาย |
|------|------|------|
| `path` | `string \| string[]` | เส้นทางที่ต้องการตัดขอบเขต เพื่อรวบรวมเฉพาะโครงสร้างตัวแปรภายใต้เส้นทางนั้น รองรับ `'record'`, `'record.id'`, `'ctx.record'`, `'{{ ctx.record }}'` หากเป็นอาร์เรย์หมายถึงการรวมหลายเส้นทางเข้าด้วยกัน |
| `maxDepth` | `number` | ระดับความลึกสูงสุดในการขยายข้อมูล ค่าเริ่มต้นคือ `3` หากไม่ระบุ path คุณสมบัติระดับบนสุดจะมี depth=1 หากระบุ path โหนดที่ตรงกับ path จะมี depth=1 |

### ตัวอย่าง

```ts
// รับโครงสร้างตัวแปรภายใต้ record (ขยายสูงสุด 3 ระดับ)
const vars = await ctx.getVarInfos({ path: 'record', maxDepth: 3 });

// รับโครงสร้างของ popup.record
const vars = await ctx.getVarInfos({ path: 'popup.record', maxDepth: 3 });

// รับโครงสร้างตัวแปรระดับบนสุดทั้งหมด (ค่าเริ่มต้น maxDepth=3)
const vars = await ctx.getVarInfos();
```

## ความแตกต่างจาก ctx.getValue

| เมธอด | สถานการณ์ที่ใช้งาน | คำอธิบาย |
|------|----------|------|
| `ctx.getValue()` | ฟิลด์ที่แก้ไขได้ เช่น JSField หรือ JSItem | รับค่าของ**ฟิลด์ปัจจุบัน**แบบซิงโครนัส (synchronously) จำเป็นต้องมีการผูกกับฟอร์ม |
| `ctx.getVar(path)` | บริบท RunJS ใดๆ | รับ**ตัวแปร ctx ใดๆ** แบบอะซิงโครนัส (asynchronously) โดย path ต้องเริ่มต้นด้วย `ctx.` |

ใน JSField ให้ใช้ `getValue`/`setValue` เพื่ออ่าน/เขียนฟิลด์ปัจจุบัน และใช้ `getVar` เพื่อเข้าถึงตัวแปรบริบทอื่นๆ (เช่น record, user, formValues) ครับ

## ข้อควรระวัง

- **path ต้องเริ่มต้นด้วย `ctx.`**: เช่น `ctx.record.id` มิฉะนั้นจะเกิดข้อผิดพลาด
- **เมธอดแบบอะซิงโครนัส**: ต้องใช้ `await` เพื่อรับผลลัพธ์ เช่น `const id = await ctx.getVar('ctx.record.id')`
- **ตัวแปรไม่มีอยู่**: จะส่งกลับ `undefined` สามารถใช้ `??` หลังผลลัพธ์เพื่อกำหนดค่าเริ่มต้นได้: `(await ctx.getVar('ctx.user.nickname')) ?? 'Guest'`
- **ค่าในฟอร์ม**: `ctx.formValues` ต้องรับผ่าน `await ctx.getVar('ctx.formValues')` โดยจะไม่ถูกเปิดเผยโดยตรงเป็น `ctx.formValues` ในบริบทของฟอร์ม แนะนำให้ใช้ `ctx.form.getFieldsValue()` เพื่ออ่านค่าล่าสุดแบบเรียลไทม์ครับ

## ตัวอย่าง

### รับ ID ของระเบียนปัจจุบัน

```ts
const recordId = await ctx.getVar('ctx.record.id');
if (recordId) {
  ctx.message.info(`ระเบียนปัจจุบัน: ${recordId}`);
}
```

### รับระเบียนภายในหน้าต่างป๊อปอัป

```ts
const recordId = await ctx.getVar('ctx.popup.record.id');
if (recordId) {
  ctx.message.info(`ระเบียนในป๊อปอัปปัจจุบัน: ${recordId}`);
}
```

### อ่านรายการย่อยของฟิลด์อาร์เรย์

```ts
const roleNames = await ctx.getVar('ctx.user.roles.name');
// ส่งกลับอาร์เรย์ของชื่อบทบาท เช่น ['admin', 'member']
```

### การกำหนดค่าเริ่มต้น

```ts
// getVar ไม่มีพารามิเตอร์ defaultValue สามารถใช้ ?? หลังผลลัพธ์ได้
const userName = (await ctx.getVar('ctx.user.nickname')) ?? 'Guest';
```

### อ่านค่าฟิลด์ในฟอร์ม

```ts
// ทั้ง ctx.formValues และ ctx.form ใช้สำหรับสถานการณ์ฟอร์ม สามารถใช้ getVar เพื่ออ่านฟิลด์ที่ซ้อนกันได้
const status = await ctx.getVar('ctx.formValues.status');
if (status === 'draft') {
  // ...
}
```

### อ่านพารามิเตอร์การค้นหาใน URL

```ts
const id = await ctx.getVar('ctx.urlSearchParams.id'); // ตรงกับ ?id=xxx
```

### สำรวจตัวแปรที่ใช้งานได้

```ts
// รับโครงสร้างตัวแปรภายใต้ record (ขยายสูงสุด 3 ระดับ)
const vars = await ctx.getVarInfos({ path: 'record', maxDepth: 3 });
// vars จะมีลักษณะเช่น { 'record.id': { type: 'string', title: 'id' }, ... }
```

## สิ่งที่เกี่ยวข้อง

- [ctx.getValue()](./get-value.md) - รับค่าฟิลด์ปัจจุบันแบบซิงโครนัส (เฉพาะ JSField/JSItem ฯลฯ)
- [ctx.form](./form.md) - อินสแตนซ์ของฟอร์ม, `ctx.form.getFieldsValue()` สามารถอ่านค่าฟอร์มแบบเรียลไทม์ได้
- [ctx.model](./model.md) - โมเดลที่บริบทการทำงานปัจจุบันสังกัดอยู่
- [ctx.blockModel](./block-model.md) - บล็อกหลัก (parent block) ที่ JS ปัจจุบันตั้งอยู่
- [ctx.resource](./resource.md) - อินสแตนซ์ทรัพยากรในบริบทปัจจุบัน
- `{{ctx.xxx}}` ใน SQL / เทมเพลต - ใช้กฎการประมวลผลเดียวกับ `ctx.getVar('ctx.xxx')`