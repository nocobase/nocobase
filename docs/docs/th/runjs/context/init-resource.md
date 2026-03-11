:::tip{title="การแจ้งเตือนการแปลด้วย AI"}
เอกสารนี้แปลโดย AI สำหรับข้อมูลที่ถูกต้อง กรุณาดู[เวอร์ชันภาษาอังกฤษ](/runjs/context/init-resource)
:::

# ctx.initResource()

**เริ่มต้นใช้งาน (Initialize)** resource สำหรับบริบท (context) ปัจจุบัน: หากยังไม่มี `ctx.resource` อยู่ ระบบจะสร้างขึ้นตามประเภทที่ระบุและผูกเข้ากับบริบท แต่หากมีอยู่แล้วจะนำมาใช้งานโดยตรง หลังจากนั้นจะสามารถเข้าถึงได้ผ่าน `ctx.resource` ครับ

## สถาณการณ์ที่ใช้งาน

โดยทั่วไปจะใช้ในสถานการณ์ของ **JSBlock** (บล็อกอิสระ) เท่านั้น เนื่องจากบล็อกส่วนใหญ่, หน้าต่างป๊อปอัป (Popup) และส่วนประกอบอื่น ๆ จะมีการผูก `ctx.resource` ไว้ล่วงหน้าอยู่แล้ว จึงไม่จำเป็นต้องเรียกใช้ด้วยตนเอง แต่สำหรับ JSBlock จะไม่มี resource มาให้โดยค่าเริ่มต้น ดังนั้นจึงต้องเรียก `ctx.initResource(type)` ก่อนที่จะโหลดข้อมูลผ่าน `ctx.resource` ครับ

## คำนิยามประเภท (Type Definition)

```ts
initResource(
  type: 'APIResource' | 'SingleRecordResource' | 'MultiRecordResource' | 'SQLResource'
): FlowResource;
```

| พารามิเตอร์ | ประเภท | คำอธิบาย |
|------|------|------|
| `type` | `string` | ประเภทของทรัพยากร: `'APIResource'`, `'SingleRecordResource'`, `'MultiRecordResource'`, `'SQLResource'` |

**ค่าที่ส่งกลับ**: อินสแตนซ์ของ resource ในบริบทปัจจุบัน (นั่นคือ `ctx.resource`)

## ความแตกต่างจาก ctx.makeResource()

| วิธีการ | พฤติกรรม |
|------|------|
| `ctx.initResource(type)` | หาก `ctx.resource` ยังไม่มีอยู่ จะทำการสร้างและผูกเข้ากับบริบท หากมีอยู่แล้วจะส่งกลับค่าเดิม เพื่อให้แน่ใจว่า `ctx.resource` พร้อมใช้งาน |
| `ctx.makeResource(type)` | สร้างและส่งกลับอินสแตนซ์ใหม่เท่านั้น โดย**ไม่**เขียนทับลงใน `ctx.resource` เหมาะสำหรับสถานการณ์ที่ต้องการ resource แยกกันหลายตัวหรือการใช้งานชั่วคราว |

## ตัวอย่าง

### ข้อมูลรายการ (MultiRecordResource)

```ts
ctx.initResource('MultiRecordResource');
ctx.resource.setResourceName('users');
await ctx.resource.refresh();
const rows = ctx.resource.getData();
ctx.render(<pre>{JSON.stringify(rows, null, 2)}</pre>);
```

### ข้อมูลรายการเดียว (SingleRecordResource)

```ts
ctx.initResource('SingleRecordResource');
ctx.resource.setResourceName('users');
ctx.resource.setFilterByTk(1); // ระบุ Primary Key
await ctx.resource.refresh();
const record = ctx.resource.getData();
```

### ระบุแหล่งข้อมูล (Data Source)

```ts
ctx.initResource('MultiRecordResource');
ctx.resource.setDataSourceKey('main');
ctx.resource.setResourceName('orders');
await ctx.resource.refresh();
```

## ข้อควรระวัง

- ในสถานการณ์ของบล็อกส่วนใหญ่ (เช่น ฟอร์ม, ตาราง, รายละเอียด) และหน้าต่างป๊อปอัป `ctx.resource` จะถูกผูกไว้ล่วงหน้าโดยสภาพแวดล้อมการทำงาน (Runtime) อยู่แล้ว จึงไม่จำเป็นต้องเรียก `ctx.initResource`
- จำเป็นต้องเริ่มต้นใช้งานด้วยตนเองเฉพาะในบริบทที่ไม่มี resource โดยค่าเริ่มต้น เช่น JSBlock เท่านั้น
- หลังจากเริ่มต้นใช้งานแล้ว ต้องเรียก `setResourceName(name)` เพื่อระบุคอลเลกชัน และเรียก `refresh()` เพื่อโหลดข้อมูลครับ

## สิ่งที่เกี่ยวข้อง

- [ctx.resource](./resource.md): อินสแตนซ์ของ resource ในบริบทปัจจุบัน
- [ctx.makeResource()](./make-resource.md): สร้างอินสแตนซ์ resource ใหม่ โดยไม่ผูกกับ `ctx.resource`
- [MultiRecordResource](../resource/multi-record-resource.md) — หลายรายการ/รายการข้อมูล
- [SingleRecordResource](../resource/single-record-resource.md) — รายการเดียว
- [APIResource](../resource/api-resource.md) — ทรัพยากร API ทั่วไป
- [SQLResource](../resource/sql-resource.md) — ทรัพยากรสำหรับการคิวรี SQL