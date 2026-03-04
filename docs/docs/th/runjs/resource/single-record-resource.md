:::tip{title="การแจ้งเตือนการแปลด้วย AI"}
เอกสารนี้แปลโดย AI สำหรับข้อมูลที่ถูกต้อง กรุณาดู[เวอร์ชันภาษาอังกฤษ](/runjs/resource/single-record-resource)
:::

# SingleRecordResource

Resource สำหรับ**เรคคอร์ดเดียว (Single Record)**: ข้อมูลจะเป็นออบเจ็กต์เดียว รองรับการดึงข้อมูลตามคีย์หลัก, การสร้าง/อัปเดต (save) และการลบ เหมาะสำหรับสถานการณ์ "เรคคอร์ดเดียว" เช่น รายละเอียด (Details) หรือแบบฟอร์ม (Forms) ซึ่งแตกต่างจาก [MultiRecordResource](./multi-record-resource.md) ตรงที่ `getData()` ของ SingleRecordResource จะคืนค่าเป็นออบเจ็กต์เดียว โดยระบุคีย์หลักผ่าน `setFilterByTk(id)` และ `save()` จะเรียกใช้ create หรือ update โดยอัตโนมัติตามสถานะ `isNewRecord` ครับ

**ความสัมพันธ์การสืบทอด**: FlowResource → APIResource → BaseRecordResource → SingleRecordResource

**วิธีการสร้าง**: `ctx.makeResource('SingleRecordResource')` หรือ `ctx.initResource('SingleRecordResource')` โดยก่อนใช้งานต้องเรียก `setResourceName('ชื่อคอลเลกชัน')` หากต้องการดำเนินการตามคีย์หลักต้องเรียก `setFilterByTk(id)` สำหรับใน RunJS นั้น `ctx.api` จะถูกแทรก (Inject) โดยสภาพแวดล้อมการทำงานครับ

---

## สถานการณ์ที่ใช้งาน

| สถานการณ์ | คำอธิบาย |
|------|------|
| **บล็อกรายละเอียด (Details Block)** | บล็อกรายละเอียดใช้ SingleRecordResource เป็นค่าเริ่มต้นเพื่อโหลดเรคคอร์ดเดียวตามคีย์หลัก |
| **บล็อกแบบฟอร์ม (Form Block)** | แบบฟอร์มสร้าง/แก้ไขใช้ SingleRecordResource โดย `save()` จะแยกแยะระหว่าง create/update ให้โดยอัตโนมัติ |
| **รายละเอียดใน JSBlock** | โหลดข้อมูลผู้ใช้หรือคำสั่งซื้อรายการเดียวใน JSBlock และปรับแต่งการแสดงผลตามต้องการ |
| **ทรัพยากรที่มีความสัมพันธ์ (Association Resources)** | โหลดเรคคอร์ดเดียวที่เกี่ยวข้องในรูปแบบ `users.profile` โดยต้องใช้ร่วมกับ `setSourceId(ID ของเรคคอร์ดหลัก)` |

---

## รูปแบบข้อมูล

- `getData()` คืนค่าเป็น**ออบเจ็กต์เรคคอร์ดเดียว** ซึ่งก็คือฟิลด์ `data` จากอินเทอร์เฟซ get
- `getMeta()` คืนค่าข้อมูลเมตา (ถ้ามี)

---

## ชื่อทรัพยากรและคีย์หลัก

| วิธีการ | คำอธิบาย |
|------|------|
| `setResourceName(name)` / `getResourceName()` | ชื่อทรัพยากร เช่น `'users'`, `'users.profile'` (ทรัพยากรที่มีความสัมพันธ์) |
| `setSourceId(id)` / `getSourceId()` | ID ของเรคคอร์ดหลักในกรณีที่เป็นทรัพยากรที่มีความสัมพันธ์ (เช่น `users.profile` ต้องส่งคีย์หลักของ users) |
| `setDataSourceKey(key)` / `getDataSourceKey()` | ตัวระบุแหล่งข้อมูล (ใช้เมื่อมีหลายแหล่งข้อมูล) |
| `setFilterByTk(tk)` / `getFilterByTk()` | คีย์หลักของเรคคอร์ดปัจจุบัน เมื่อตั้งค่าแล้ว `isNewRecord` จะเป็น false |

---

## สถานะ

| คุณสมบัติ/วิธีการ | คำอธิบาย |
|----------|------|
| `isNewRecord` | สถานะว่าเป็น "เรคคอร์ดใหม่" หรือไม่ (จะเป็น true หากไม่ได้ตั้งค่า filterByTk หรือเพิ่งสร้างใหม่) |

---

## พารามิเตอร์คำขอ (ตัวกรอง / ฟิลด์)

| วิธีการ | คำอธิบาย |
|------|------|
| `setFilter(filter)` / `getFilter()` | ตัวกรอง (ใช้งานได้เมื่อไม่ใช่เรคคอร์ดใหม่) |
| `setFields(fields)` / `getFields()` | ฟิลด์ที่ต้องการขอ |
| `setAppends(appends)` / `getAppends()` / `addAppends` / `removeAppends` | การดึงข้อมูลความสัมพันธ์เพิ่มเติม (Association expansion) |

---

## CRUD

| วิธีการ | คำอธิบาย |
|------|------|
| `refresh()` | ส่งคำขอ get ตาม `filterByTk` ปัจจุบัน และอัปเดต `getData()`; จะไม่ส่งคำขอหากอยู่ในสถานะเรคคอร์ดใหม่ |
| `save(data, options?)` | เรียก create เมื่อเป็นเรคคอร์ดใหม่ มิฉะนั้นจะเรียก update; สามารถระบุ `{ refresh: false }` เพื่อไม่ให้รีเฟรชอัตโนมัติได้ |
| `destroy(options?)` | ลบตาม `filterByTk` ปัจจุบัน และล้างข้อมูลในเครื่อง (Local data) |
| `runAction(actionName, options)` | เรียกใช้ action ใดๆ ของทรัพยากร |

---

## การตั้งค่าและเหตุการณ์ (Events)

| วิธีการ | คำอธิบาย |
|------|------|
| `setSaveActionOptions(options)` | การตั้งค่าคำขอเมื่อเรียกใช้ save |
| `on('refresh', fn)` / `on('saved', fn)` | ทำงานเมื่อการรีเฟรชเสร็จสิ้น หรือหลังจากบันทึกข้อมูลแล้ว |

---

## ตัวอย่าง

### การดึงข้อมูลพื้นฐานและการอัปเดต

```js
ctx.initResource('SingleRecordResource');
ctx.resource.setResourceName('users');
ctx.resource.setFilterByTk(1);
await ctx.resource.refresh();
const user = ctx.resource.getData();

// อัปเดต
await ctx.resource.save({ name: 'สมชาย' });
```

### การสร้างเรคคอร์ดใหม่

```js
const newRes = ctx.makeResource('SingleRecordResource');
newRes.setResourceName('users');
await newRes.save({ name: 'สมศรี', email: 'somsri@example.com' });
```

### การลบเรคคอร์ด

```js
ctx.resource.setResourceName('users');
ctx.resource.setFilterByTk(1);
await ctx.resource.destroy();
// หลังจาก destroy แล้ว getData() จะเป็น null
```

### การดึงข้อมูลความสัมพันธ์และฟิลด์

```js
ctx.resource.setResourceName('users');
ctx.resource.setFilterByTk(1);
ctx.resource.setFields(['id', 'nickname', 'email']);
ctx.resource.setAppends(['profile', 'roles']);
await ctx.resource.refresh();
const user = ctx.resource.getData();
```

### ทรัพยากรที่มีความสัมพันธ์ (เช่น users.profile)

```js
const res = ctx.makeResource('SingleRecordResource');
res.setResourceName('users.profile');
res.setSourceId(ctx.record?.id); // คีย์หลักของเรคคอร์ดหลัก
res.setFilterByTk(profileId);    // หาก profile เป็นความสัมพันธ์แบบ hasOne สามารถละเว้น filterByTk ได้
await res.refresh();
const profile = res.getData();
```

### การ save โดยไม่รีเฟรชอัตโนมัติ

```js
await ctx.resource.save({ status: 'active' }, { refresh: false });
// หลังจากบันทึกจะไม่เรียก refresh และ getData() จะยังคงเป็นค่าเดิม
```

### การฟังเหตุการณ์ refresh / saved

```js
ctx.resource?.on?.('refresh', () => {
  const data = ctx.resource.getData();
  ctx.render(<div>ผู้ใช้: {data?.nickname}</div>);
});
ctx.resource?.on?.('saved', (savedData) => {
  ctx.message.success('บันทึกสำเร็จ');
});
await ctx.resource?.refresh?.();
```

---

## ข้อควรระวัง

- **ต้องระบุ setResourceName**: ต้องเรียก `setResourceName('ชื่อคอลเลกชัน')` ก่อนใช้งาน มิฉะนั้นจะไม่สามารถสร้าง URL สำหรับส่งคำขอได้ครับ
- **filterByTk และ isNewRecord**: หากไม่ได้ตั้งค่า `setFilterByTk` ค่า `isNewRecord` จะเป็น true และ `refresh()` จะไม่ส่งคำขอ ส่วน `save()` จะทำงานในรูปแบบ create ครับ
- **ทรัพยากรที่มีความสัมพันธ์**: เมื่อชื่อทรัพยากรอยู่ในรูปแบบ `parent.child` (เช่น `users.profile`) ต้องเรียก `setSourceId(คีย์หลักของเรคคอร์ดหลัก)` ก่อนครับ
- **getData เป็นออบเจ็กต์**: ข้อมูล `data` ที่คืนมาจาก API แบบเรคคอร์ดเดียวคือออบเจ็กต์เรคคอร์ด โดย `getData()` จะคืนค่าออบเจ็กต์นั้นโดยตรง และจะเป็น null หลังจากเรียก `destroy()` ครับ

---

## สิ่งที่เกี่ยวข้อง

- [ctx.resource](../context/resource.md) - อินสแตนซ์ resource ในบริบทปัจจุบัน
- [ctx.initResource()](../context/init-resource.md) - เริ่มต้นใช้งานและผูกเข้ากับ ctx.resource
- [ctx.makeResource()](../context/make-resource.md) - สร้างอินสแตนซ์ resource ใหม่โดยไม่ผูกมัด
- [APIResource](./api-resource.md) - ทรัพยากร API ทั่วไปที่เรียกตาม URL
- [MultiRecordResource](./multi-record-resource.md) - สำหรับคอลเลกชัน/รายการ รองรับ CRUD และการแบ่งหน้า (Pagination)