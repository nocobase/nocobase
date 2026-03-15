:::tip{title="การแจ้งเตือนการแปลด้วย AI"}
เอกสารนี้แปลโดย AI สำหรับข้อมูลที่ถูกต้อง กรุณาดู[เวอร์ชันภาษาอังกฤษ](/runjs/context/off)
:::

# ctx.off()

ลบตัวดักฟังเหตุการณ์ (event listener) ที่ลงทะเบียนผ่าน `ctx.on(eventName, handler)` มักใช้ควบคู่กับ [ctx.on](./on.md) เพื่อยกเลิกการสมัครรับข้อมูล (unsubscribe) ในเวลาที่เหมาะสม เพื่อป้องกันการรั่วไหลของหน่วยความจำ (memory leak) หรือการเรียกใช้งานซ้ำซ้อนครับ

## กรณีการใช้งาน

| สถานการณ์ | คำอธิบาย |
|------|------|
| **การล้างข้อมูล (Cleanup) ใน React useEffect** | เรียกใช้ภายในฟังก์ชัน cleanup ของ `useEffect` เพื่อลบตัวดักฟังเหตุการณ์เมื่อคอมโพเนนต์ถูกถอดออก (unmount) |
| **JSField / JSEditableField** | ยกเลิกการสมัครรับข้อมูล `js-field:value-change` เมื่อมีการทำ Two-way data binding ของฟิลด์ |
| **เกี่ยวข้องกับ resource** | ยกเลิกการสมัครรับตัวดักฟังเหตุการณ์ เช่น `refresh` หรือ `saved` ที่ลงทะเบียนผ่าน `ctx.resource.on` |

## การกำหนดประเภท (Type Definition)

```ts
off(eventName: string, handler: (event?: any) => void): void;
```

## ตัวอย่าง

### การใช้งานควบคู่กันใน React useEffect

```tsx
React.useEffect(() => {
  const handler = (ev) => setValue(ev?.detail ?? '');
  ctx.on('js-field:value-change', handler);
  return () => ctx.off('js-field:value-change', handler);
}, []);
```

### การยกเลิกการสมัครรับเหตุการณ์ของ Resource

```ts
const handler = () => { /* ... */ };
ctx.resource?.on('refresh', handler);
// เมื่อถึงเวลาที่เหมาะสม
ctx.resource?.off('refresh', handler);
```

## ข้อควรระวัง

1. **การอ้างอิง handler ต้องตรงกัน**: `handler` ที่ส่งไปยัง `ctx.off` ต้องเป็นตัวแปรอ้างอิง (reference) เดียวกันกับที่ใช้ใน `ctx.on` มิฉะนั้นจะไม่สามารถลบออกได้อย่างถูกต้องครับ
2. **ล้างข้อมูลให้ทันท่วงที**: เรียกใช้ `ctx.off` ก่อนที่คอมโพเนนต์จะถูกถอดออกหรือ context จะถูกทำลาย เพื่อหลีกเลี่ยงการรั่วไหลของหน่วยความจำครับ

## เอกสารที่เกี่ยวข้อง

- [ctx.on](./on.md) - การสมัครรับเหตุการณ์
- [ctx.resource](./resource.md) - อินสแตนซ์ของ Resource และเมธอด `on`/`off` ของ Resource นั้นๆ