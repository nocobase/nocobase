:::tip{title="การแจ้งเตือนการแปลด้วย AI"}
เอกสารนี้แปลโดย AI สำหรับข้อมูลที่ถูกต้อง กรุณาดู[เวอร์ชันภาษาอังกฤษ](/runjs/context/make-resource)
:::

# ctx.makeResource()

**สร้าง** อินสแตนซ์ของ resource ใหม่และส่งค่ากลับ โดย**จะไม่**เขียนทับหรือเปลี่ยนแปลง `ctx.resource` เหมาะสำหรับสถานการณ์ที่ต้องการ resource อิสระหลายตัวหรือการใช้งานชั่วคราวครับ

## 适用场景 (สถานการณ์ที่ใช้งาน)

| สถานการณ์ | คำอธิบาย |
|------|------|
| **Resource หลายตัว** | โหลดหลายแหล่งข้อมูลพร้อมกัน (เช่น รายการผู้ใช้ + รายการคำสั่งซื้อ) โดยแต่ละแหล่งใช้ resource แยกกัน |
| **การคิวรีชั่วคราว** | การคิวรีแบบครั้งเดียวแล้วทิ้ง โดยไม่จำเป็นต้องผูกกับ `ctx.resource` |
| **ข้อมูลเสริม** | ใช้ `ctx.resource` สำหรับข้อมูลหลัก และใช้ `makeResource` เพื่อสร้างอินสแตนซ์สำหรับข้อมูลเพิ่มเติม |

หากคุณต้องการเพียง resource เดียวและต้องการผูกเข้ากับ `ctx.resource` การใช้ [ctx.initResource()](./init-resource.md) จะเหมาะสมกว่าครับ

## 类型定义 (การกำหนดประเภท)

```ts
makeResource<T = FlowResource>(
  resourceType: 'APIResource' | 'SingleRecordResource' | 'MultiRecordResource' | 'SQLResource'
): T;
```

| พารามิเตอร์ | ประเภท | คำอธิบาย |
|------|------|------|
| `resourceType` | `string` | ประเภทของทรัพยากร: `'APIResource'`, `'SingleRecordResource'`, `'MultiRecordResource'`, `'SQLResource'` |

**ค่าที่ส่งกลับ**: อินสแตนซ์ของ resource ที่สร้างขึ้นใหม่

## 与 ctx.initResource() 的区别 (ความแตกต่างจาก ctx.initResource())

| วิธีการ | พฤติกรรม |
|------|------|
| `ctx.makeResource(type)` | สร้างและส่งคืนอินสแตนซ์ใหม่เท่านั้น โดย**ไม่**เขียนลงใน `ctx.resource` สามารถเรียกใช้ได้หลายครั้งเพื่อให้ได้ resource อิสระหลายตัว |
| `ctx.initResource(type)` | หาก `ctx.resource` ยังไม่มี จะทำการสร้างและผูกค่าให้ แต่ถ้ามีอยู่แล้วจะส่งคืนค่าเดิมทันที เพื่อให้แน่ใจว่า `ctx.resource` พร้อมใช้งาน |

## 示例 (ตัวอย่าง)

### Resource เดียว

```ts
const listRes = ctx.makeResource('MultiRecordResource');
listRes.setResourceName('users');
await listRes.refresh();
const users = listRes.getData();
// ctx.resource ยังคงเป็นค่าเดิม (ถ้ามี)
```

### Resource หลายตัว

```ts
const usersRes = ctx.makeResource('MultiRecordResource');
usersRes.setResourceName('users');
await usersRes.refresh();

const ordersRes = ctx.makeResource('MultiRecordResource');
ordersRes.setResourceName('orders');
await ordersRes.refresh();

ctx.render(
  <div>
    <p>จำนวนผู้ใช้: {usersRes.getData().length}</p>
    <p>จำนวนคำสั่งซื้อ: {ordersRes.getData().length}</p>
  </div>
);
```

### การคิวรีชั่วคราว

```ts
// การคิวรีแบบครั้งเดียว ไม่รบกวน ctx.resource
const tempRes = ctx.makeResource('SingleRecordResource');
tempRes.setResourceName('users');
tempRes.setFilterByTk(1);
await tempRes.refresh();
const record = tempRes.getData();
```

## 注意事项 (ข้อควรระวัง)

- resource ที่สร้างขึ้นใหม่จำเป็นต้องเรียกใช้ `setResourceName(name)` เพื่อระบุคอลเลกชัน จากนั้นจึงโหลดข้อมูลผ่าน `refresh()`
- อินสแตนซ์ของแต่ละ resource จะเป็นอิสระต่อกันและไม่ส่งผลกระทบต่อกัน เหมาะสำหรับการโหลดแหล่งข้อมูลหลายแหล่งพร้อมกันครับ

## 相关 (สิ่งที่เกี่ยวข้อง)

- [ctx.initResource()](./init-resource.md): เริ่มต้นและผูกเข้ากับ `ctx.resource`
- [ctx.resource](./resource.md): อินสแตนซ์ resource ในบริบทปัจจุบัน
- [MultiRecordResource](../resource/multi-record-resource) — หลายระเบียน/รายการ
- [SingleRecordResource](../resource/single-record-resource) — ระเบียนเดียว
- [APIResource](../resource/api-resource) — ทรัพยากร API ทั่วไป
- [SQLResource](../resource/sql-resource) — ทรัพยากรการคิวรี SQL