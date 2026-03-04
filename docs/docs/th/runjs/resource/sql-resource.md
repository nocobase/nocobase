:::tip{title="การแจ้งเตือนการแปลด้วย AI"}
เอกสารนี้แปลโดย AI สำหรับข้อมูลที่ถูกต้อง กรุณาดู[เวอร์ชันภาษาอังกฤษ](/runjs/resource/sql-resource)
:::

# SQLResource

Resource สำหรับการรันคิวรีตาม **การตั้งค่า SQL ที่บันทึกไว้** หรือ **SQL แบบไดนามิก** โดยดึงข้อมูลผ่านอินเทอร์เฟซ เช่น `flowSql:run` / `flowSql:runById` ครับ เหมาะสำหรับใช้ในสถานการณ์ต่างๆ เช่น รายงาน, สถิติ, หรือรายการ SQL ที่กำหนดเอง ซึ่ง SQLResource จะแตกต่างจาก [MultiRecordResource](./multi-record-resource.md) ตรงที่ไม่ได้ขึ้นอยู่กับตารางข้อมูล (Collection) แต่จะรัน SQL คิวรีโดยตรง พร้อมรองรับการแบ่งหน้า (Pagination), การผูกพารามิเตอร์ (Parameter binding), ตัวแปรเทมเพลต (`{{ctx.xxx}}`) และการควบคุมประเภทของผลลัพธ์ครับ

**ความสัมพันธ์การสืบทอด**: FlowResource → APIResource → BaseRecordResource → SQLResource

**วิธีการสร้าง**: `ctx.makeResource('SQLResource')` หรือ `ctx.initResource('SQLResource')` หากต้องการรันตามการตั้งค่าที่บันทึกไว้ให้ใช้ `setFilterByTk(uid)` (UID ของเทมเพลต SQL) สำหรับการดีบั๊กสามารถใช้ `setDebug(true)` + `setSQL(sql)` เพื่อรัน SQL โดยตรงได้ครับ ในส่วนของ RunJS นั้น `ctx.api` จะถูกแทรกเข้ามาโดยสภาพแวดล้อมการรัน (Runtime environment) ครับ

---

## สถานการณ์ที่เหมาะสม

| สถานการณ์ | คำอธิบาย |
|------|------|
| **รายงาน / สถิติ** | การรวมข้อมูลที่ซับซ้อน (Aggregation), การคิวรีข้ามตาราง, และตัวชี้วัดทางสถิติที่กำหนดเอง |
| **รายการที่กำหนดเองใน JSBlock** | การใช้ SQL เพื่อคัดกรอง (Filter), เรียงลำดับ (Sort) หรือสร้างความสัมพันธ์พิเศษ พร้อมการแสดงผล (Rendering) แบบกำหนดเอง |
| **บล็อกแผนภูมิ (Chart Blocks)** | การใช้เทมเพลต SQL ที่บันทึกไว้เพื่อเป็นแหล่งข้อมูลให้กับแผนภูมิ พร้อมรองรับการแบ่งหน้า |
| **การเลือกระหว่าง SQLResource และ ctx.sql** | ใช้ SQLResource เมื่อต้องการการแบ่งหน้า, เหตุการณ์ (Events) หรือข้อมูลแบบ Reactive; ใช้ `ctx.sql.run()` / `ctx.sql.runById()` สำหรับการคิวรีแบบครั้งเดียวทั่วไป |

---

## รูปแบบข้อมูล

- `getData()` จะคืนค่าในรูปแบบที่แตกต่างกันตาม `setSQLType()` ดังนี้ครับ:
  - `selectRows` (ค่าเริ่มต้น): **Array** ของผลลัพธ์หลายแถว
  - `selectRow`: **Object รายการเดียว**
  - `selectVar`: **ค่าเดี่ยว (Scalar value)** (เช่น COUNT, SUM)
- `getMeta()` จะคืนค่าข้อมูลเมตา เช่น การแบ่งหน้า: `page`, `pageSize`, `count`, `totalPage` เป็นต้น

---

## การตั้งค่า SQL และโหมดการรัน

| วิธีการ (Method) | คำอธิบาย |
|------|------|
| `setFilterByTk(uid)` | กำหนด UID ของเทมเพลต SQL ที่ต้องการรัน (สอดคล้องกับ runById โดยต้องบันทึกในหน้าการจัดการก่อน) |
| `setSQL(sql)` | กำหนดคำสั่ง SQL ดิบ (ใช้สำหรับ runBySQL เมื่อเปิดโหมดดีบั๊ก `setDebug(true)` เท่านั้น) |
| `setSQLType(type)` | ประเภทผลลัพธ์: `'selectVar'` / `'selectRow'` / `'selectRows'` |
| `setDebug(enabled)` | หากเป็น true การ `refresh` จะเรียกใช้ `runBySQL()` มิฉะนั้นจะเรียกใช้ `runById()` |
| `run()` | เรียกใช้ `runBySQL()` หรือ `runById()` ตามสถานะการดีบั๊ก |
| `runBySQL()` | รันโดยใช้ SQL ที่กำหนดใน `setSQL` (ต้องใช้ `setDebug(true)`) |
| `runById()` | รันเทมเพลต SQL ที่บันทึกไว้โดยใช้ UID ปัจจุบัน |

---

## พารามิเตอร์และบริบท (Context)

| วิธีการ (Method) | คำอธิบาย |
|------|------|
| `setBind(bind)` | ผูกตัวแปร (Bind variables) โดยใช้รูปแบบ Object ร่วมกับ `:name` หรือรูปแบบ Array ร่วมกับ `?` |
| `setLiquidContext(ctx)` | บริบทของเทมเพลต (Liquid) สำหรับการประมวลผล `{{ctx.xxx}}` |
| `setFilter(filter)` | เงื่อนไขการคัดกรองเพิ่มเติม (ส่งผ่านข้อมูลคำขอ) |
| `setDataSourceKey(key)` | ตัวระบุแหล่งข้อมูล (ใช้ในกรณีที่มีหลายแหล่งข้อมูล) |

---

## การแบ่งหน้า (Pagination)

| วิธีการ (Method) | คำอธิบาย |
|------|------|
| `setPage(page)` / `getPage()` | หน้าปัจจุบัน (ค่าเริ่มต้นคือ 1) |
| `setPageSize(size)` / `getPageSize()` | จำนวนรายการต่อหน้า (ค่าเริ่มต้นคือ 20) |
| `next()` / `previous()` / `goto(page)` | เปลี่ยนหน้าและเรียกใช้การ `refresh` |

ใน SQL สามารถใช้ `{{ctx.limit}}` และ `{{ctx.offset}}` เพื่ออ้างอิงพารามิเตอร์การแบ่งหน้าได้ โดย SQLResource จะแทรก `limit` และ `offset` เข้าไปในบริบทให้โดยอัตโนมัติครับ

---

## การดึงข้อมูลและเหตุการณ์ (Events)

| วิธีการ (Method) | คำอธิบาย |
|------|------|
| `refresh()` | รัน SQL (`runById` หรือ `runBySQL`), เขียนผลลัพธ์ลงใน `setData(data)`, อัปเดต meta และเรียกใช้เหตุการณ์ `'refresh'` |
| `runAction(actionName, options)` | เรียกใช้อินเทอร์เฟซระดับล่าง (เช่น `getBind`, `run`, `runById`) |
| `on('refresh', fn)` / `on('loading', fn)` | ทำงานเมื่อการรีเฟรชเสร็จสิ้น หรือเมื่อเริ่มโหลดข้อมูล |

---

## ตัวอย่าง

### การรันตามเทมเพลตที่บันทึกไว้ (runById)

```js
ctx.initResource('SQLResource');
ctx.resource.setFilterByTk('active-users-report'); // UID ของเทมเพลต SQL ที่บันทึกไว้
ctx.resource.setBind({ status: 'active' });
await ctx.resource.refresh();
const data = ctx.resource.getData();
const meta = ctx.resource.getMeta(); // page, pageSize, count ฯลฯ
```

### โหมดดีบั๊ก: การรัน SQL โดยตรง (runBySQL)

```js
const res = ctx.makeResource('SQLResource');
res.setDebug(true);
res.setSQL('SELECT * FROM users WHERE status = :status LIMIT {{ctx.limit}}');
res.setBind({ status: 'active' });
await res.refresh();
const data = res.getData();
```

### การแบ่งหน้าและการเปลี่ยนหน้า

```js
ctx.resource.setFilterByTk('user-list-sql');
ctx.resource.setPageSize(20);
await ctx.resource.refresh();

// การเปลี่ยนหน้า
await ctx.resource.next();
await ctx.resource.previous();
await ctx.resource.goto(3);
```

### ประเภทของผลลัพธ์

```js
// หลายแถว (ค่าเริ่มต้น)
ctx.resource.setSQLType('selectRows');
const rows = ctx.resource.getData(); // [{...}, {...}]

// แถวเดียว
ctx.resource.setSQLType('selectRow');
const row = ctx.resource.getData(); // {...}

// ค่าเดียว (เช่น COUNT)
ctx.resource.setSQLType('selectVar');
const total = ctx.resource.getData(); // 42
```

### การใช้ตัวแปรเทมเพลต

```js
ctx.defineProperty('minId', { get: () => 10 });
const res = ctx.makeResource('SQLResource');
res.setDebug(true);
res.setSQL('SELECT * FROM users WHERE id > {{ctx.minId}} LIMIT {{ctx.limit}}');
await res.refresh();
```

### การฟังเหตุการณ์ refresh

```js
ctx.resource?.on?.('refresh', () => {
  const data = ctx.resource.getData();
  ctx.render(<ul>{data?.map((r) => <li key={r.id}>{r.name}</li>)}</ul>);
});
await ctx.resource?.refresh?.();
```

---

## ข้อควรระวัง

- **runById จำเป็นต้องบันทึกเทมเพลตก่อน**: UID ที่ใช้ใน `setFilterByTk(uid)` ต้องเป็น ID ของเทมเพลต SQL ที่บันทึกไว้ในหน้าการจัดการแล้วเท่านั้น โดยสามารถบันทึกผ่าน `ctx.sql.save({ uid, sql })` ได้ครับ
- **โหมดดีบั๊กต้องมีสิทธิ์การใช้งาน**: เมื่อใช้ `setDebug(true)` จะเป็นการเรียกผ่าน `flowSql:run` ซึ่งบทบาท (Role) ปัจจุบันต้องมีสิทธิ์ในการตั้งค่า SQL ส่วน `runById` เพียงแค่เข้าสู่ระบบก็สามารถใช้งานได้ครับ
- **การป้องกันการเรียกซ้ำ (Refresh Debouncing)**: หากมีการเรียก `refresh()` หลายครั้งภายใน Event loop เดียวกัน ระบบจะรันเฉพาะครั้งล่าสุดเท่านั้น เพื่อหลีกเลี่ยงการส่งคำขอที่ซ้ำซ้อนครับ
- **การผูกพารามิเตอร์เพื่อป้องกัน SQL Injection**: ควรใช้ `setBind()` ร่วมกับตัวสำรองที่นั่ง (Placeholder) แบบ `:name` หรือ `?` แทนการต่อสตริง เพื่อป้องกันการโจมตีแบบ SQL Injection ครับ

---

## สิ่งที่เกี่ยวข้อง

- [ctx.sql](../context/sql.md) - การรันและจัดการ SQL โดย `ctx.sql.runById` เหมาะสำหรับการคิวรีแบบครั้งเดียวทั่วไป
- [ctx.resource](../context/resource.md) - อินสแตนซ์ของ resource ในบริบทปัจจุบัน
- [ctx.initResource()](../context/init-resource.md) - เริ่มต้นใช้งานและผูกเข้ากับ `ctx.resource`
- [ctx.makeResource()](../context/make-resource.md) - สร้างอินสแตนซ์ resource ใหม่โดยไม่ผูกมัด
- [APIResource](./api-resource.md) - ทรัพยากร API ทั่วไป
- [MultiRecordResource](./multi-record-resource.md) - สำหรับตารางข้อมูลและรายการต่างๆ