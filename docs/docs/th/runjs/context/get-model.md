:::tip{title="การแจ้งเตือนการแปลด้วย AI"}
เอกสารนี้แปลโดย AI สำหรับข้อมูลที่ถูกต้อง กรุณาดู[เวอร์ชันภาษาอังกฤษ](/runjs/context/get-model)
:::

# ctx.getModel()

ใช้สำหรับรับอินสแตนซ์ของโมเดล (เช่น `BlockModel`, `PageModel`, `ActionModel` เป็นต้น) จากเอนจินปัจจุบันหรือ View Stack ตาม `uid` ของโมเดล เพื่อใช้ใน RunJS สำหรับการเข้าถึงโมเดลอื่น ๆ ข้ามบล็อก ข้ามหน้า หรือข้ามหน้าต่างป๊อปอัปครับ

หากคุณต้องการเพียงโมเดลหรือบล็อกที่อยู่ในบริบทการทำงานปัจจุบัน (Execution Context) แนะนำให้ใช้ `ctx.model` หรือ `ctx.blockModel` เป็นอันดับแรก โดยไม่จำเป็นต้องใช้ `ctx.getModel` ครับ

## สถานการณ์ที่ใช้งาน

| สถานการณ์ | คำอธิบาย |
|------|------|
| **JSBlock / JSAction** | รับโมเดลของบล็อกอื่นตาม `uid` ที่ระบุ เพื่ออ่านหรือเขียนค่าใน `resource`, `form`, `setProps` และอื่น ๆ |
| **RunJS ในหน้าต่างป๊อปอัป** | เมื่อต้องการเข้าถึงโมเดลในหน้าที่เปิดหน้าต่างป๊อปอัปขึ้นมา ให้ส่งค่า `searchInPreviousEngines: true` |
| **การดำเนินการที่กำหนดเอง (Custom Actions)** | ระบุตำแหน่งของฟอร์มหรือโมเดลย่อยในแผงการตั้งค่าตาม `uid` ข้าม View Stack เพื่ออ่านการกำหนดค่าหรือสถานะ |

## การกำหนดประเภท (Type Definition)

```ts
getModel<T extends FlowModel = FlowModel>(
  uid: string,
  searchInPreviousEngines?: boolean
): T | undefined
```

## พารามิเตอร์

| พารามิเตอร์ | ประเภท | คำอธิบาย |
|------|------|------|
| `uid` | `string` | ตัวระบุเฉพาะ (Unique Identifier) ของอินสแตนซ์โมเดลเป้าหมาย ซึ่งกำหนดโดยการตั้งค่าหรือตอนที่สร้างขึ้น (เช่น `ctx.model.uid`) |
| `searchInPreviousEngines` | `boolean` | (ไม่บังคับ) ค่าเริ่มต้นคือ `false` หากเป็น `true` จะค้นหาใน "View Stack" จากเอนจินปัจจุบันย้อนกลับไปยังราก (Root) ทำให้สามารถเข้าถึงโมเดลในเอนจินระดับบนได้ (เช่น หน้าที่เปิดหน้าต่างป๊อปอัป) |

## ค่าที่ส่งกลับ

- หากพบ จะส่งกลับอินสแตนซ์ของคลาสย่อย `FlowModel` ที่เกี่ยวข้อง (เช่น `BlockModel`, `FormBlockModel`, `ActionModel`)
- หากไม่พบ จะส่งกลับ `undefined`

## ขอบเขตการค้นหา

- **ค่าเริ่มต้น (`searchInPreviousEngines: false`)**: ค้นหาตาม `uid` เฉพาะภายใน**เอนจินปัจจุบัน**เท่านั้น ในหน้าต่างป๊อปอัปหรือมุมมองหลายระดับ แต่ละมุมมองจะมีเอนจินที่เป็นอิสระต่อกัน โดยปกติจะค้นหาเฉพาะโมเดลภายในมุมมองปัจจุบันเท่านั้น
- **`searchInPreviousEngines: true`**: เริ่มค้นหาจากเอนจินปัจจุบันและไล่ขึ้นไปตามสายของ `previousEngine` จนกว่าจะพบ เหมาะสำหรับกรณีที่ต้องการเข้าถึงโมเดลในหน้าที่เปิดหน้าต่างป๊อปอัปปัจจุบัน

## ตัวอย่าง

### รับบล็อกอื่นและรีเฟรช

```ts
const block = ctx.getModel('list-block-uid');
if (block?.resource) {
  await block.resource.refresh();
}
```

### เข้าถึงโมเดลบนหน้าเพจจากหน้าต่างป๊อปอัป

```ts
// เข้าถึงบล็อกบนหน้าที่เปิดหน้าต่างป๊อปอัปปัจจุบัน
const pageBlock = ctx.getModel('page-block-uid', true);
if (pageBlock) {
  pageBlock.rerender?.();
}
```

### อ่าน/เขียนข้ามโมเดลและสั่งให้ Rerender

```ts
const target = ctx.getModel('other-block-uid');
if (target) {
  target.setProps({ loading: true });
  target.rerender?.();
}
```

### การตรวจสอบความปลอดภัย

```ts
const model = ctx.getModel(someUid);
if (!model) {
  ctx.message.warning('ไม่พบโมเดลเป้าหมาย');
  return;
}
```

## สิ่งที่เกี่ยวข้อง

- [ctx.model](./model.md): โมเดลที่อยู่ในบริบทการทำงานปัจจุบัน
- [ctx.blockModel](./block-model.md): โมเดลของบล็อกหลัก (Parent Block) ที่ JS ปัจจุบันอาศัยอยู่ โดยปกติสามารถเข้าถึงได้โดยไม่ต้องใช้ `getModel` ครับ