:::tip{title="การแจ้งเตือนการแปลด้วย AI"}
เอกสารนี้แปลโดย AI สำหรับข้อมูลที่ถูกต้อง กรุณาดู[เวอร์ชันภาษาอังกฤษ](/runjs/context/resource)
:::

# ctx.resource

อินสแตนซ์ **FlowResource** ในบริบท (context) ปัจจุบัน ใช้สำหรับการเข้าถึงและจัดการข้อมูล ในบล็อกส่วนใหญ่ (เช่น ฟอร์ม, ตาราง, รายละเอียด ฯลฯ) และในสถานการณ์หน้าต่างป๊อปอัป สภาพแวดล้อมการทำงานจะทำการผูก (bind) `ctx.resource` ไว้ให้ล่วงหน้า ส่วนในกรณีอย่าง JSBlock ที่ไม่มี resource มาให้โดยเริ่มต้น จำเป็นต้องเรียกใช้ [ctx.initResource()](./init-resource.md) เพื่อเริ่มต้นใช้งานก่อน จึงจะสามารถใช้งานผ่าน `ctx.resource` ได้ครับ

## สถานการณ์ที่ใช้งานได้

สามารถใช้ `ctx.resource` ได้ในทุกสถานการณ์ของ RunJS ที่ต้องการเข้าถึงข้อมูลที่มีโครงสร้าง (เช่น รายการ, ข้อมูลรายการเดียว, API แบบกำหนดเอง, SQL) โดยปกติแล้ว บล็อกฟอร์ม, ตาราง, รายละเอียด และหน้าต่างป๊อปอัปจะมีการผูกไว้ให้ล่วงหน้าแล้ว สำหรับ JSBlock, JSField, JSItem, JSColumn ฯลฯ หากจำเป็นต้องโหลดข้อมูล คุณสามารถเรียก `ctx.initResource(type)` ก่อนแล้วจึงเข้าถึง `ctx.resource` ได้ครับ

## การกำหนดประเภท (Type Definition)

```ts
resource: FlowResource | undefined;
```

- ในบริบทที่มีการผูกไว้ล่วงหน้า `ctx.resource` จะเป็นอินสแตนซ์ของ resource ที่เกี่ยวข้อง
- ในกรณีอย่าง JSBlock ที่ไม่มี resource โดยเริ่มต้น ค่าจะเป็น `undefined` จนกว่าจะมีการเรียกใช้ `ctx.initResource(type)`

## เมธอดที่ใช้บ่อย

เมธอดที่แสดงในแต่ละประเภทของ resource (MultiRecordResource, SingleRecordResource, APIResource, SQLResource) อาจมีความแตกต่างกันเล็กน้อย ด้านล่างนี้คือเมธอดทั่วไปหรือเมธอดที่ใช้บ่อยครับ:

| เมธอด | คำอธิบาย |
|------|------|
| `getData()` | รับข้อมูลปัจจุบัน (รายการหรือรายการเดียว) |
| `setData(value)` | ตั้งค่าข้อมูล Local |
| `refresh()` | ส่งคำขอตามพารามิเตอร์ปัจจุบันเพื่อรีเฟรชข้อมูล |
| `setResourceName(name)` | ตั้งชื่อทรัพยากร (เช่น `'users'`, `'users.tags'`) |
| `setFilterByTk(tk)` | ตั้งค่าตัวกรองด้วย Primary Key (เช่น การ get รายการเดียว) |
| `runAction(actionName, options)` | เรียกใช้ action ใดๆ ของทรัพยากร (เช่น `create`, `update`) |
| `on(event, callback)` / `off(event, callback)` | ติดตาม/ยกเลิกการติดตามเหตุการณ์ (เช่น `refresh`, `saved`) |

**เฉพาะ MultiRecordResource**: `getSelectedRows()`, `destroySelectedRows()`, `setPage()`, `next()`, `previous()` ฯลฯ

## ตัวอย่าง

### ข้อมูลแบบรายการ (ต้องเรียก initResource ก่อน)

```js
ctx.initResource('MultiRecordResource');
ctx.resource.setResourceName('users');
await ctx.resource.refresh();
const rows = ctx.resource.getData();
```

### สถานการณ์ในตาราง (มีการผูกไว้ล่วงหน้าแล้ว)

```js
const rows = ctx.resource?.getSelectedRows?.() || [];
for (const row of rows) {
  console.log(row);
}

await ctx.resource.destroySelectedRows();
ctx.message.success(ctx.t('ลบสำเร็จ'));
```

### รายการเดียว

```js
ctx.initResource('SingleRecordResource');
ctx.resource.setResourceName('users');
ctx.resource.setFilterByTk(1);
await ctx.resource.refresh();
const record = ctx.resource.getData();
```

### การเรียกใช้ Custom Action

```js
await ctx.resource.runAction('create', { data: { name: 'สมชาย' } });
```

## ความสัมพันธ์กับ ctx.initResource / ctx.makeResource

- **ctx.initResource(type)**: หาก `ctx.resource` ยังไม่มีอยู่ จะทำการสร้างและผูกให้ แต่ถ้ามีอยู่แล้วจะส่งคืนอินสแตนซ์เดิมกลับมา เพื่อให้แน่ใจว่า `ctx.resource` พร้อมใช้งาน
- **ctx.makeResource(type)**: สร้างอินสแตนซ์ resource ใหม่และส่งคืนค่ากลับมา แต่จะ**ไม่**เขียนลงใน `ctx.resource` เหมาะสำหรับสถานการณ์ที่ต้องการ resource อิสระหลายตัวหรือการใช้งานชั่วคราว
- **ctx.resource**: เข้าถึง resource ที่ผูกไว้กับบริบทปัจจุบันแล้ว บล็อก/หน้าต่างป๊อปอัปส่วนใหญ่จะมีการผูกไว้ล่วงหน้า หากไม่มีการผูกไว้จะเป็น `undefined` และต้องเรียก `ctx.initResource` ก่อน

## ข้อควรระวัง

- แนะนำให้ตรวจสอบค่าว่างก่อนใช้งานเสมอ: `ctx.resource?.refresh()` โดยเฉพาะในสถานการณ์อย่าง JSBlock ที่อาจไม่มีการผูกไว้ล่วงหน้า
- หลังจากเริ่มต้นใช้งาน (Initialization) คุณต้องเรียก `setResourceName(name)` เพื่อระบุคอลเลกชันก่อนที่จะโหลดข้อมูลผ่าน `refresh()`
- สำหรับ API ฉบับเต็มของ Resource แต่ละประเภท สามารถดูได้จากลิงก์ด้านล่างนี้ครับ

## สิ่งที่เกี่ยวข้อง

- [ctx.initResource()](./init-resource.md) - เริ่มต้นและผูก resource เข้ากับบริบทปัจจุบัน
- [ctx.makeResource()](./make-resource.md) - สร้างอินสแตนซ์ resource ใหม่ โดยไม่ผูกกับ `ctx.resource`
- [MultiRecordResource](../resource/multi-record-resource.md) - หลายรายการ/รายการแบบลิสต์
- [SingleRecordResource](../resource/single-record-resource.md) - รายการเดียว
- [APIResource](../resource/api-resource.md) - ทรัพยากร API ทั่วไป
- [SQLResource](../resource/sql-resource.md) - ทรัพยากรการค้นหา SQL