:::tip{title="การแจ้งเตือนการแปลด้วย AI"}
เอกสารนี้แปลโดย AI สำหรับข้อมูลที่ถูกต้อง กรุณาดู[เวอร์ชันภาษาอังกฤษ](/runjs/context/on)
:::

# ctx.on()

ใช้สำหรับติดตามเหตุการณ์ (Events) ของ Context ใน RunJS (เช่น การเปลี่ยนแปลงค่าของฟิลด์, การเปลี่ยนแปลงคุณสมบัติ, การรีเฟรชทรัพยากร เป็นต้น) โดยเหตุการณ์จะถูกจับคู่ไปยัง Custom DOM Event บน `ctx.element` หรือ Event Bus ภายในของ `ctx.resource` ตามประเภทของเหตุการณ์ครับ

## สถานการณ์ที่ใช้งาน

| สถานการณ์ | คำอธิบาย |
|------|------|
| **JSField / JSEditableField** | ติดตามการเปลี่ยนแปลงค่าของฟิลด์จากภายนอก (เช่น ฟอร์ม, การเชื่อมโยงข้อมูล (Linkage) ฯลฯ) เพื่ออัปเดต UI ให้ตรงกัน และสร้างการเชื่อมโยงข้อมูลแบบสองทาง (Two-way binding) |
| **JSBlock / JSItem / JSColumn** | ติดตาม Custom Events บนคอนเทนเนอร์เพื่อตอบสนองต่อการเปลี่ยนแปลงของข้อมูลหรือสถานะ |
| **resource ที่เกี่ยวข้อง** | ติดตามเหตุการณ์วงจรชีวิต (Lifecycle events) ของทรัพยากร เช่น การรีเฟรชหรือการบันทึก เพื่อรันตรรกะหลังจากข้อมูลมีการอัปเดต |

## การกำหนดประเภท (Type Definition)

```ts
on(eventName: string, handler: (event?: any) => void): void;
```

## เหตุการณ์ที่พบบ่อย

| ชื่อเหตุการณ์ | คำอธิบาย | แหล่งที่มาของเหตุการณ์ |
|--------|------|----------|
| `js-field:value-change` | ค่าของฟิลด์ถูกแก้ไขจากภายนอก (เช่น การเชื่อมโยงฟอร์ม, การอัปเดตค่าเริ่มต้น) | CustomEvent บน `ctx.element` โดย `ev.detail` คือค่าใหม่ |
| `resource:refresh` | ข้อมูลทรัพยากรถูกรีเฟรชแล้ว | Event Bus ของ `ctx.resource` |
| `resource:saved` | การบันทึกทรัพยากรเสร็จสิ้น | Event Bus ของ `ctx.resource` |

> กฎการจับคู่เหตุการณ์: เหตุการณ์ที่มีคำนำหน้าเป็น `resource:` จะใช้ `ctx.resource.on` ส่วนเหตุการณ์อื่นๆ โดยปกติจะใช้ DOM Event บน `ctx.element` (หากมีอยู่) ครับ

## ตัวอย่าง

### การเชื่อมโยงข้อมูลฟิลด์แบบสองทาง (React useEffect + Cleanup)

```tsx
React.useEffect(() => {
  const handler = (ev) => setValue(ev?.detail ?? '');
  ctx.on?.('js-field:value-change', handler);
  return () => {
    ctx.off?.('js-field:value-change', handler);
  };
}, []);
```

### การติดตาม DOM แบบ Native (ทางเลือกเมื่อไม่สามารถใช้ ctx.on ได้)

```ts
// เมื่อไม่มี ctx.on ให้บริการ สามารถใช้ ctx.element ได้โดยตรง
const handler = (ev) => {
  if (selectEl) selectEl.value = String(ev?.detail ?? '');
};
ctx.element?.addEventListener('js-field:value-change', handler);
// เมื่อต้องการล้างข้อมูล: ctx.element?.removeEventListener('js-field:value-change', handler);
```

### การอัปเดต UI หลังจากรีเฟรชทรัพยากร

```ts
ctx.resource?.on('refresh', () => {
  const data = ctx.resource?.getData?.();
  // อัปเดตการเรนเดอร์ตามข้อมูล (data)
});
```

## การใช้งานร่วมกับ ctx.off

- การติดตามที่ลงทะเบียนด้วย `ctx.on` ควรถูกลบออกในเวลาที่เหมาะสมผ่าน [ctx.off](./off.md) เพื่อหลีกเลี่ยงปัญหาหน่วยความจำรั่วไหล (Memory leak) หรือการเรียกซ้ำซ้อนครับ
- ใน React โดยปกติจะเรียกใช้ `ctx.off` ภายในฟังก์ชัน Cleanup ของ `useEffect`
- `ctx.off` อาจไม่มีอยู่ แนะนำให้ใช้ Optional Chaining เมื่อเรียกใช้งาน: `ctx.off?.('eventName', handler)`

## ข้อควรระวัง

1. **การยกเลิกแบบจับคู่**: ทุกครั้งที่ใช้ `ctx.on(eventName, handler)` จะต้องมี `ctx.off(eventName, handler)` ที่คู่กัน และ Reference ของ `handler` ที่ส่งเข้าไปต้องเป็นตัวเดียวกันครับ
2. **วงจรชีวิต (Lifecycle)**: ให้ลบการติดตามออกก่อนที่คอมโพเนนต์จะถูกถอดออก (Unmount) หรือ Context จะถูกทำลาย มิฉะนั้นอาจทำให้เกิดหน่วยความจำรั่วไหลได้
3. **ความพร้อมใช้งานของเหตุการณ์**: ประเภทของ Context ที่แตกต่างกันจะรองรับเหตุการณ์ที่ไม่เหมือนกัน โปรดดูรายละเอียดในเอกสารประกอบของแต่ละคอมโพเนนต์ครับ

## เอกสารที่เกี่ยวข้อง

- [ctx.off](./off.md) - ลบการติดตามเหตุการณ์
- [ctx.element](./element.md) - คอนเทนเนอร์การเรนเดอร์และ DOM Event
- [ctx.resource](./resource.md) - อินสแตนซ์ของทรัพยากรและเมธอด `on`/`off`
- [ctx.setValue](./set-value.md) - ตั้งค่าฟิลด์ (จะทริกเกอร์ `js-field:value-change`)