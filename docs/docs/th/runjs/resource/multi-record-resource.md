:::tip{title="การแจ้งเตือนการแปลด้วย AI"}
เอกสารนี้แปลโดย AI สำหรับข้อมูลที่ถูกต้อง กรุณาดู[เวอร์ชันภาษาอังกฤษ](/runjs/resource/multi-record-resource)
:::

# MultiRecordResource

Resource สำหรับคอลเลกชัน (Collection): โดยการส่งคำขอจะคืนค่ากลับมาเป็นอาร์เรย์ รองรับการแบ่งหน้า (Pagination), การกรอง (Filtering), การเรียงลำดับ (Sorting) และการสร้าง อ่าน แก้ไข ลบ (CRUD) เหมาะสำหรับสถานการณ์ที่มี "หลายระเบียน" (Multiple records) เช่น ตารางหรือรายการ ซึ่งจะแตกต่างจาก [APIResource](./api-resource.md) ตรงที่ MultiRecordResource จะกำหนดชื่อทรัพยากรผ่าน `setResourceName()` และสร้าง URL เช่น `users:list`, `users:create` โดยอัตโนมัติ พร้อมทั้งมีความสามารถในการแบ่งหน้า, การกรอง และการเลือกแถวในตัวครับ

**ลำดับการสืบทอด (Inheritance)**: FlowResource → APIResource → BaseRecordResource → MultiRecordResource

**วิธีการสร้าง**: `ctx.makeResource('MultiRecordResource')` หรือ `ctx.initResource('MultiRecordResource')` ก่อนใช้งานจำเป็นต้องเรียก `setResourceName('ชื่อคอลเลกชัน')` (เช่น `'users'`) สำหรับใน RunJS ตัว `ctx.api` จะถูกแทรก (Inject) โดยสภาพแวดล้อมการรันครับ

---

## สถาณการณ์ที่ใช้งาน

| สถานการณ์ | คำอธิบาย |
|------|------|
| **บล็อกตาราง (Table Blocks)** | บล็อกตารางและรายการจะใช้ MultiRecordResource เป็นค่าเริ่มต้น รองรับการแบ่งหน้า, การกรอง และการเรียงลำดับ |
| **รายการใน JSBlock** | ใช้สำหรับโหลดข้อมูลจากคอลเลกชัน เช่น ผู้ใช้งาน (Users) หรือคำสั่งซื้อ (Orders) ใน JSBlock และทำการแสดงผลแบบกำหนดเอง |
| **การดำเนินการแบบกลุ่ม (Bulk Operations)** | ใช้ `getSelectedRows()` เพื่อรับข้อมูลแถวที่เลือก และ `destroySelectedRows()` เพื่อลบข้อมูลแบบกลุ่ม |
| **ทรัพยากรที่มีความสัมพันธ์ (Association Resources)** | ใช้ในรูปแบบ `users.tags` เพื่อโหลดข้อมูลคอลเลกชันที่เกี่ยวข้อง โดยต้องใช้ร่วมกับ `setSourceId(ID ของระเบียนหลัก)` |

---

## รูปแบบข้อมูล

- `getData()` คืนค่าเป็น **อาร์เรย์ของระเบียน** ซึ่งก็คือฟิลด์ `data` จาก API ของรายการ (List API)
- `getMeta()` คืนค่าข้อมูลเมตา เช่น การแบ่งหน้า: `page`, `pageSize`, `count`, `totalPage` เป็นต้น

---

## ชื่อทรัพยากรและแหล่งข้อมูล

| วิธีการ (Method) | คำอธิบาย |
|------|------|
| `setResourceName(name)` / `getResourceName()` | ชื่อทรัพยากร เช่น `'users'`, `'users.tags'` (ทรัพยากรที่มีความสัมพันธ์) |
| `setSourceId(id)` / `getSourceId()` | ID ของระเบียนหลักเมื่อใช้งานทรัพยากรที่มีความสัมพันธ์ (เช่น `users.tags` ต้องส่งคีย์หลักของ users) |
| `setDataSourceKey(key)` / `getDataSourceKey()` | ตัวระบุแหล่งข้อมูล (Data Source) (ใช้ในกรณีที่มีหลายแหล่งข้อมูล) |

---

## พารามิเตอร์คำขอ (การกรอง / ฟิลด์ / การเรียงลำดับ)

| วิธีการ (Method) | คำอธิบาย |
|------|------|
| `setFilterByTk(tk)` / `getFilterByTk()` | กรองด้วยคีย์หลัก (สำหรับการดึงข้อมูลเดี่ยว `get` เป็นต้น) |
| `setFilter(filter)` / `getFilter()` / `resetFilter()` | เงื่อนไขการกรอง รองรับตัวดำเนินการ เช่น `$eq`, `$ne`, `$in` เป็นต้น |
| `addFilterGroup(key, filter)` / `removeFilterGroup(key)` | กลุ่มการกรอง (สำหรับการรวมหลายเงื่อนไข) |
| `setFields(fields)` / `getFields()` | ฟิลด์ที่ต้องการขอ (Whitelist) |
| `setSort(sort)` / `getSort()` | การเรียงลำดับ เช่น `['-createdAt']` หมายถึงเรียงตามเวลาที่สร้างจากใหม่ไปเก่า |
| `setAppends(appends)` / `getAppends()` / `addAppends` / `removeAppends` | การโหลดข้อมูลที่เกี่ยวข้องเพิ่มเติม (เช่น `['user', 'tags']`) |

---

## การแบ่งหน้า (Pagination)

| วิธีการ (Method) | คำอธิบาย |
|------|------|
| `setPage(page)` / `getPage()` | หน้าปัจจุบัน (เริ่มจาก 1) |
| `setPageSize(size)` / `getPageSize()` | จำนวนรายการต่อหน้า ค่าเริ่มต้นคือ 20 |
| `getTotalPage()` | จำนวนหน้าทั้งหมด |
| `getCount()` | จำนวนรายการทั้งหมด (จาก meta ของเซิร์ฟเวอร์) |
| `next()` / `previous()` / `goto(page)` | เปลี่ยนหน้าและเรียกใช้ `refresh` |

---

## แถวที่เลือก (สำหรับตาราง)

| วิธีการ (Method) | คำอธิบาย |
|------|------|
| `setSelectedRows(rows)` / `getSelectedRows()` | ข้อมูลแถวที่เลือกอยู่ในปัจจุบัน ใช้สำหรับการลบแบบกลุ่มหรือการดำเนินการอื่นๆ |

---

## CRUD และการจัดการรายการ

| วิธีการ (Method) | คำอธิบาย |
|------|------|
| `refresh()` | ส่งคำขอรายการตามพารามิเตอร์ปัจจุบัน อัปเดต `getData()` และ pagination meta พร้อมเรียกใช้เหตุการณ์ `'refresh'` |
| `get(filterByTk)` | ขอข้อมูลระเบียนเดียว และคืนค่าข้อมูลนั้น (ไม่เขียนลงใน `getData`) |
| `create(data, options?)` | สร้างระเบียนใหม่ สามารถเลือก `{ refresh: false }` เพื่อไม่ให้รีเฟรชอัตโนมัติ และเรียกใช้เหตุการณ์ `'saved'` |
| `update(filterByTk, data, options?)` | อัปเดตตามคีย์หลัก |
| `destroy(target)` | ลบข้อมูล; `target` สามารถเป็นคีย์หลัก, วัตถุแถว หรืออาร์เรย์ของคีย์หลัก/วัตถุแถว (สำหรับการลบแบบกลุ่ม) |
| `destroySelectedRows()` | ลบแถวที่เลือกอยู่ในปัจจุบัน (จะแสดงข้อผิดพลาดหากไม่มีการเลือก) |
| `setItem(index, item)` | แทนที่ข้อมูลบางแถวในเครื่อง (Local) โดยไม่ส่งคำขอไปยังเซิร์ฟเวอร์ |
| `runAction(actionName, options)` | เรียกใช้ action ใดๆ ของทรัพยากร (เช่น action ที่กำหนดเอง) |

---

## การตั้งค่าและเหตุการณ์ (Events)

| วิธีการ (Method) | คำอธิบาย |
|------|------|
| `setRefreshAction(name)` | action ที่เรียกใช้เมื่อรีเฟรช ค่าเริ่มต้นคือ `'list'` |
| `setCreateActionOptions(options)` / `setUpdateActionOptions(options)` | การตั้งค่าคำขอสำหรับการสร้าง/อัปเดต |
| `on('refresh', fn)` / `on('saved', fn)` | ทำงานเมื่อรีเฟรชเสร็จสิ้น หรือหลังจากบันทึกข้อมูล |

---

## ตัวอย่าง

### รายการพื้นฐาน

```js
ctx.initResource('MultiRecordResource');
ctx.resource.setResourceName('users');
ctx.resource.setPageSize(20);
await ctx.resource.refresh();
const rows = ctx.resource.getData();
const total = ctx.resource.getCount();
```

### การกรองและการเรียงลำดับ

```js
ctx.resource.setResourceName('users');
ctx.resource.setFilter({ status: 'active' });
ctx.resource.setSort(['-createdAt']);
ctx.resource.setFields(['id', 'nickname', 'email']);
await ctx.resource.refresh();
```

### การโหลดข้อมูลที่เกี่ยวข้อง

```js
ctx.resource.setResourceName('orders');
ctx.resource.setAppends(['user', 'items']);
await ctx.resource.refresh();
const orders = ctx.resource.getData();
```

### การสร้างและการเปลี่ยนหน้า

```js
await ctx.resource.create({ name: 'Somchai', email: 'somchai@example.com' });

await ctx.resource.next();
await ctx.resource.previous();
await ctx.resource.goto(3);
```

### การลบแถวที่เลือกแบบกลุ่ม

```js
const rows = ctx.resource?.getSelectedRows?.() || [];
if (rows.length === 0) {
  ctx.message.warning('กรุณาเลือกข้อมูลก่อน');
  return;
}
await ctx.resource.destroySelectedRows();
ctx.message.success(ctx.t('ลบเรียบร้อยแล้ว'));
```

### การฟังเหตุการณ์ refresh

```js
ctx.resource?.on?.('refresh', () => {
  const data = ctx.resource.getData();
  ctx.render(<ul>{data?.map((r) => <li key={r.id}>{r.name}</li>)}</ul>);
});
await ctx.resource?.refresh?.();
```

### ทรัพยากรที่มีความสัมพันธ์ (ตารางย่อย)

```js
const res = ctx.makeResource('MultiRecordResource');
res.setResourceName('users.roles');
res.setSourceId(ctx.record?.id);
await res.refresh();
const roles = res.getData();
```

---

## ข้อควรระวัง

- **ต้องระบุ setResourceName**: ก่อนใช้งานต้องเรียก `setResourceName('ชื่อคอลเลกชัน')` มิฉะนั้นจะไม่สามารถสร้าง URL สำหรับคำขอได้
- **ทรัพยากรที่มีความสัมพันธ์**: เมื่อชื่อทรัพยากรอยู่ในรูปแบบ `parent.child` (เช่น `users.tags`) ต้องเรียก `setSourceId(คีย์หลักของระเบียนหลัก)` ก่อน
- **การป้องกันการเรียกซ้ำ (Refresh Debouncing)**: หากมีการเรียก `refresh()` หลายครั้งภายใน Event Loop เดียวกัน จะทำงานเฉพาะครั้งสุดท้ายเท่านั้น เพื่อหลีกเลี่ยงคำขอที่ซ้ำซ้อน
- **getData เป็นอาร์เรย์**: ฟิลด์ `data` ที่ส่งกลับจาก API รายการจะเป็นอาร์เรย์ของระเบียน และ `getData()` จะคืนค่าอาร์เรย์นั้นโดยตรง

---

## สิ่งที่เกี่ยวข้อง

- [ctx.resource](../context/resource.md) - อินสแตนซ์ resource ในบริบทปัจจุบัน
- [ctx.initResource()](../context/init-resource.md) - เริ่มต้นใช้งานและผูกเข้ากับ ctx.resource
- [ctx.makeResource()](../context/make-resource.md) - สร้างอินสแตนซ์ resource ใหม่โดยไม่ผูกมัด
- [APIResource](./api-resource.md) - ทรัพยากร API ทั่วไปที่เรียกตาม URL
- [SingleRecordResource](./single-record-resource.md) - สำหรับการจัดการระเบียนเดียว