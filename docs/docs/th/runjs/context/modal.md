:::tip{title="การแจ้งเตือนการแปลด้วย AI"}
เอกสารนี้แปลโดย AI สำหรับข้อมูลที่ถูกต้อง กรุณาดู[เวอร์ชันภาษาอังกฤษ](/runjs/context/modal)
:::

# ctx.modal

API ทางลัดที่อ้างอิงจาก Ant Design Modal ใช้สำหรับเปิดกล่องข้อความ (Modal) ใน RunJS (เช่น การแจ้งเตือนข้อมูล, ป๊อปอัปยืนยัน ฯลฯ) โดยทำงานผ่าน `ctx.viewer` / ระบบมุมมอง (View System) ครับ

## สถาณการณ์ที่เหมาะสม

| สถานการณ์ | คำอธิบาย |
|------|------|
| **JSBlock / JSField** | แสดงผลลัพธ์การทำงาน, แจ้งเตือนข้อผิดพลาด หรือการยืนยันซ้ำหลังจากผู้ใช้มีปฏิสัมพันธ์ |
| **เวิร์กโฟลว์ / เหตุการณ์การดำเนินการ (Action Events)** | แสดงป๊อปอัปยืนยันก่อนส่งข้อมูล หากผู้ใช้ยกเลิกจะใช้ `ctx.exit()` เพื่อหยุดขั้นตอนถัดไป |
| **กฎการเชื่อมโยง (Linkage Rules)** | แสดงป๊อปอัปแจ้งเตือนเมื่อการตรวจสอบเงื่อนไข (Validation) ล้มเหลว |

> หมายเหตุ: `ctx.modal` ใช้งานได้ในสภาพแวดล้อม RunJS ที่มีบริบทของมุมมอง (เช่น JSBlock ภายในหน้าเพจ, เวิร์กโฟลว์ ฯลฯ) แต่อาจไม่มีในส่วนหลังบ้าน (Backend) หรือบริบทที่ไม่มี UI แนะนำให้ใช้ Optional Chaining (`ctx.modal?.confirm?.()`) เมื่อเรียกใช้งานครับ

## การกำหนดประเภท (Type Definition)

```ts
modal: {
  info: (config: ModalConfig) => Promise<void>;
  success: (config: ModalConfig) => Promise<void>;
  error: (config: ModalConfig) => Promise<void>;
  warning: (config: ModalConfig) => Promise<void>;
  confirm: (config: ModalConfig) => Promise<boolean>;  // คืนค่า true หากผู้ใช้คลิกตกลง และ false หากยกเลิก
};
```

`ModalConfig` มีการกำหนดค่าที่สอดคล้องกับเมธอดสแตติกของ Ant Design `Modal` ครับ

## เมธอดที่ใช้บ่อย

| เมธอด | ค่าที่ส่งกลับ | คำอธิบาย |
|------|--------|------|
| `info(config)` | `Promise<void>` | ป๊อปอัปแจ้งข้อมูล |
| `success(config)` | `Promise<void>` | ป๊อปอัปแจ้งความสำเร็จ |
| `error(config)` | `Promise<void>` | ป๊อปอัปแจ้งข้อผิดพลาด |
| `warning(config)` | `Promise<void>` | ป๊อปอัปแจ้งเตือน |
| `confirm(config)` | `Promise<boolean>` | ป๊อปอัปยืนยัน คืนค่า `true` เมื่อคลิกตกลง และ `false` เมื่อยกเลิก |

## พารามิเตอร์การกำหนดค่า

สอดคล้องกับ Ant Design `Modal` โดยฟิลด์ที่ใช้บ่อยประกอบด้วย:

| พารามิเตอร์ | ประเภท | คำอธิบาย |
|------|------|------|
| `title` | `ReactNode` | หัวข้อ |
| `content` | `ReactNode` | เนื้อหา |
| `okText` | `string` | ข้อความบนปุ่มตกลง |
| `cancelText` | `string` | ข้อความบนปุ่มยกเลิก (เฉพาะ `confirm`) |
| `onOk` | `() => void \| Promise<void>` | ฟังก์ชันที่ทำงานเมื่อคลิกตกลง |
| `onCancel` | `() => void` | ฟังก์ชันที่ทำงานเมื่อคลิกยกเลิก |

## ความสัมพันธ์กับ ctx.message และ ctx.openView

| วัตถุประสงค์ | วิธีการที่แนะนำ |
|------|----------|
| **การแจ้งเตือนชั่วคราวแบบเบา** | `ctx.message` ซึ่งจะหายไปเองอัตโนมัติ |
| **ป๊อปอัปแจ้ง ข้อมูล/สำเร็จ/ข้อผิดพลาด/เตือน** | `ctx.modal.info` / `success` / `error` / `warning` |
| **การยืนยันซ้ำ (ต้องให้ผู้ใช้เลือก)** | `ctx.modal.confirm` ใช้ร่วมกับ `ctx.exit()` เพื่อควบคุมขั้นตอน |
| **ปฏิสัมพันธ์ที่ซับซ้อน เช่น ฟอร์ม หรือรายการ** | `ctx.openView` เพื่อเปิดมุมมองที่กำหนดเอง (หน้าเพจ/Drawer/Modal) |

## ตัวอย่าง

### ป๊อปอัปแจ้งข้อมูลแบบง่าย

```ts
ctx.modal.info({
  title: 'คำแนะนำ',
  content: 'ดำเนินการเสร็จสิ้น',
});
```

### ป๊อปอัปยืนยันและการควบคุมขั้นตอน

```ts
const confirmed = await ctx.modal.confirm({
  title: 'ยืนยันการลบ',
  content: 'คุณแน่ใจหรือไม่ว่าต้องการลบบันทึกนี้?',
  okText: 'ตกลง',
  cancelText: 'ยกเลิก',
});
if (!confirmed) {
  ctx.exit();  // หยุดขั้นตอนถัดไปหากผู้ใช้ยกเลิก
  return;
}
await ctx.runAction('destroy', { filterByTk: ctx.record?.id });
```

### ป๊อปอัปยืนยันพร้อม onOk

```ts
await ctx.modal.confirm({
  title: 'ยืนยันการส่ง',
  content: 'หลังจากส่งแล้วจะไม่สามารถแก้ไขได้ ต้องการดำเนินการต่อหรือไม่?',
  async onOk() {
    await ctx.form.submit();
  },
});
```

### การแจ้งเตือนข้อผิดพลาด

```ts
try {
  await someOperation();
  ctx.modal.success({ title: 'สำเร็จ', content: 'ดำเนินการเสร็จสิ้น' });
} catch (e) {
  ctx.modal.error({ title: 'ข้อผิดพลาด', content: e.message });
}
```

## สิ่งที่เกี่ยวข้อง

- [ctx.message](./message.md): การแจ้งเตือนแบบเบาและหายไปเองอัตโนมัติ
- [ctx.exit()](./exit.md): มักใช้ในรูปแบบ `if (!confirmed) ctx.exit()` เพื่อหยุดขั้นตอนเมื่อผู้ใช้ยกเลิกการยืนยัน
- [ctx.openView()](./open-view.md): เปิดมุมมองที่กำหนดเอง เหมาะสำหรับปฏิสัมพันธ์ที่ซับซ้อน