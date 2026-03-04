:::tip{title="การแจ้งเตือนการแปลด้วย AI"}
เอกสารนี้แปลโดย AI สำหรับข้อมูลที่ถูกต้อง กรุณาดู[เวอร์ชันภาษาอังกฤษ](/runjs/context/open-view)
:::

# ctx.openView()

เปิดมุมมองที่ระบุ (เช่น ลิ้นชัก, หน้าต่างโต้ตอบ, หน้าเว็บในตัว ฯลฯ) ด้วยการเขียนโปรแกรม ฟังก์ชันนี้จัดทำโดย `FlowModelContext` และใช้เพื่อเปิดมุมมอง `ChildPage` หรือ `PopupAction` ที่กำหนดค่าไว้ในสถานการณ์ต่าง ๆ เช่น `JSBlock`, เซลล์ตาราง และเวิร์กโฟลว์เหตุการณ์ครับ

## สถานการณ์ที่ใช้งาน

| สถานการณ์ | คำอธิบาย |
|------|------|
| **JSBlock** | เปิดหน้าต่างโต้ตอบรายละเอียด/แก้ไขหลังจากคลิกปุ่ม โดยส่ง `filterByTk` ของแถวปัจจุบันเข้าไปครับ |
| **เซลล์ตาราง** | แสดงปุ่มภายในเซลล์ เมื่อคลิกจะเปิดหน้าต่างโต้ตอบรายละเอียดของแถวนั้น |
| **เวิร์กโฟลว์ / JSAction** | เปิดมุมมองถัดไปหรือหน้าต่างโต้ตอบหลังจากดำเนินการสำเร็จ |
| **ฟิลด์ความสัมพันธ์** | เปิดหน้าต่างโต้ตอบสำหรับเลือก/แก้ไขผ่าน `ctx.runAction('openView', params)` |

> หมายเหตุ: `ctx.openView` ต้องใช้งานในสภาพแวดล้อม RunJS ที่มีบริบทของ FlowModel หากไม่มีโมเดลที่ตรงกับ uid ระบบจะสร้าง `PopupActionModel` และบันทึกไว้โดยอัตโนมัติครับ

## Signature

```ts
openView(uid: string, options?: OpenViewOptions): Promise<void>
```

## คำอธิบายพารามิเตอร์

### uid

รหัสเฉพาะ (Unique Identifier) ของโมเดลมุมมอง หากไม่มีอยู่ระบบจะสร้างและบันทึกให้โดยอัตโนมัติ แนะนำให้ใช้ UID ที่คงที่ เช่น `${ctx.model.uid}-detail` เพื่อให้สามารถนำการกำหนดค่ากลับมาใช้ใหม่ได้เมื่อเปิดหน้าต่างโต้ตอบเดิมซ้ำหลายครั้งครับ

### ฟิลด์ที่ใช้บ่อยใน options

| ฟิลด์ | ประเภท | คำอธิบาย |
|------|------|------|
| `mode` | `drawer` / `dialog` / `embed` | รูปแบบการเปิด: ลิ้นชัก (drawer), หน้าต่างโต้ตอบ (dialog) หรือฝังตัว (embed) ค่าเริ่มต้นคือ `drawer` |
| `size` | `small` / `medium` / `large` | ขนาดของหน้าต่างโต้ตอบหรือลิ้นชัก ค่าเริ่มต้นคือ `medium` |
| `title` | `string` | ชื่อหัวข้อของมุมมอง |
| `params` | `Record<string, any>` | พารามิเตอร์ใด ๆ ที่ต้องการส่งไปยังมุมมอง |
| `filterByTk` | `any` | ค่าคีย์หลัก (Primary Key) ใช้สำหรับกรณีแสดงรายละเอียดหรือแก้ไขข้อมูลรายการเดียว |
| `sourceId` | `string` | ID ของเรกคอร์ดต้นทาง สำหรับใช้งานในสถานการณ์ที่มีความสัมพันธ์ |
| `dataSourceKey` | `string` | แหล่งข้อมูล (Data Source) |
| `collectionName` | `string` | ชื่อคอลเลกชัน |
| `associationName` | `string` | ชื่อฟิลด์ความสัมพันธ์ |
| `navigation` | `boolean` | กำหนดว่าจะใช้การนำทางด้วยเส้นทาง (Route Navigation) หรือไม่ หากมีการส่ง `defineProperties` หรือ `defineMethods` ค่านี้จะถูกบังคับเป็น `false` |
| `preventClose` | `boolean` | กำหนดว่าต้องการป้องกันการปิดหรือไม่ |
| `defineProperties` | `Record<string, PropertyOptions>` | แทรกคุณสมบัติ (Properties) ลงในโมเดลภายในมุมมองแบบไดนามิก |
| `defineMethods` | `Record<string, Function>` | แทรกวิธีการ (Methods) ลงในโมเดลภายในมุมมองแบบไดนามิก |

## ตัวอย่าง

### การใช้งานพื้นฐาน: เปิดลิ้นชัก (Drawer)

```ts
const popupUid = `${ctx.model.uid}-detail`;
await ctx.openView(popupUid, {
  mode: 'drawer',
  size: 'medium',
  title: ctx.t('รายละเอียด'),
});
```

### การส่งบริบทของแถวปัจจุบัน

```ts
const primaryKey = ctx.collection?.primaryKey || 'id';
await ctx.openView(`${ctx.model.uid}-1`, {
  mode: 'dialog',
  title: ctx.t('รายละเอียดแถว'),
  params: {
    filterByTk: ctx.record?.[primaryKey],
    record: ctx.record,
  },
});
```

### เปิดผ่าน runAction

เมื่อโมเดลมีการกำหนดค่าการดำเนินการ `openView` ไว้ (เช่น ฟิลด์ความสัมพันธ์ หรือฟิลด์ที่คลิกได้) สามารถเรียกใช้งานได้ดังนี้ครับ:

```ts
await ctx.runAction('openView', {
  navigation: false,
  mode: 'dialog',
  collectionName: 'users',
  filterByTk: ctx.record?.id,
});
```

### การแทรกบริบทที่กำหนดเอง (Custom Context)

```ts
await ctx.openView(`${ctx.model.uid}-edit`, {
  mode: 'drawer',
  filterByTk: ctx.record?.id,
  defineProperties: {
    onSaved: {
      get: () => () => ctx.resource?.refresh?.(),
      cache: false,
    },
  },
});
```

## ความสัมพันธ์กับ ctx.viewer และ ctx.view

| วัตถุประสงค์ | วิธีการที่แนะนำ |
|------|----------|
| **เปิดมุมมองโฟลว์ที่กำหนดค่าไว้** | `ctx.openView(uid, options)` |
| **เปิดเนื้อหาที่กำหนดเอง (ไม่มีโฟลว์)** | `ctx.viewer.dialog()` / `ctx.viewer.drawer()` |
| **จัดการมุมมองที่เปิดอยู่ปัจจุบัน** | `ctx.view.close()`, `ctx.view.inputArgs` |

`ctx.openView` จะเปิด `FlowPage` (`ChildPageModel`) ซึ่งจะเรนเดอร์หน้าโฟลว์ที่สมบูรณ์ภายใน ส่วน `ctx.viewer` จะใช้สำหรับเปิดเนื้อหา React ใด ๆ ครับ

## ข้อควรระวัง

- แนะนำให้ `uid` มีความสัมพันธ์กับ `ctx.model.uid` (เช่น `${ctx.model.uid}-xxx`) เพื่อหลีกเลี่ยงความขัดแย้งระหว่างบล็อกต่าง ๆ ครับ
- เมื่อมีการส่ง `defineProperties` หรือ `defineMethods` ค่า `navigation` จะถูกบังคับเป็น `false` เพื่อป้องกันการสูญเสียบริบทหลังจากรีเฟรชหน้าเว็บ
- ภายในหน้าต่างโต้ตอบ `ctx.view` จะอ้างถึงอินสแตนซ์ของมุมมองปัจจุบัน และสามารถใช้ `ctx.view.inputArgs` เพื่ออ่านพารามิเตอร์ที่ส่งมาตอนเปิดได้ครับ

## เนื้อหาที่เกี่ยวข้อง

- [ctx.view](./view.md): อินสแตนซ์ของมุมมองที่เปิดอยู่ปัจจุบัน
- [ctx.model](./model.md): โมเดลปัจจุบัน ใช้สำหรับสร้าง `popupUid` ที่คงที่ครับ