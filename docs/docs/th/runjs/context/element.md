:::tip{title="การแจ้งเตือนการแปลด้วย AI"}
เอกสารนี้แปลโดย AI สำหรับข้อมูลที่ถูกต้อง กรุณาดู[เวอร์ชันภาษาอังกฤษ](/runjs/context/element)
:::

# ctx.element

อินสแตนซ์ของ `ElementProxy` ที่ชี้ไปยังคอนเทนเนอร์ DOM ของแซนด์บ็อกซ์ (sandbox) ซึ่งทำหน้าที่เป็นเป้าหมายการเรนเดอร์เริ่มต้นสำหรับ `ctx.render()` สามารถใช้งานได้ในสถานการณ์ที่มีคอนเทนเนอร์สำหรับการเรนเดอร์ เช่น `JSBlock`, `JSField`, `JSItem` และ `JSColumn` ครับ

## สถานการณ์ที่ใช้งานได้

| สถานการณ์ | คำอธิบาย |
|------|------|
| **JSBlock** | คอนเทนเนอร์ DOM ของบล็อก ใช้สำหรับเรนเดอร์เนื้อหาที่กำหนดเองของบล็อก |
| **JSField / JSItem / FormJSFieldItem** | คอนเทนเนอร์สำหรับการเรนเดอร์ฟิลด์หรือรายการฟอร์ม (โดยปกติจะเป็น `<span>`) |
| **JSColumn** | คอนเทนเนอร์ DOM ของเซลล์ในตาราง ใช้สำหรับเรนเดอร์เนื้อหาคอลัมน์ที่กำหนดเอง |

> หมายเหตุ: `ctx.element` จะใช้งานได้เฉพาะในบริบทของ RunJS ที่มีคอนเทนเนอร์สำหรับการเรนเดอร์เท่านั้น ในบริบทที่ไม่มี UI (เช่น ลอจิกหลังบ้านเพียงอย่างเดียว) ค่าอาจเป็น `undefined` แนะนำให้ตรวจสอบค่าว่างก่อนใช้งานครับ

## การกำหนดประเภท (Type Definition)

```typescript
element: ElementProxy | undefined;

// ElementProxy คือพร็อกซีสำหรับ HTMLElement ดั้งเดิม โดยเปิดเผย API ที่ปลอดภัย
class ElementProxy {
  __el: HTMLElement;  // อิลิเมนต์ DOM ดั้งเดิมภายใน (เข้าถึงได้เฉพาะในบางสถานการณ์เท่านั้น)
  innerHTML: string;  // อ่าน/เขียนผ่านการทำความสะอาดด้วย DOMPurify
  outerHTML: string; // เช่นเดียวกับด้านบน
  appendChild(child: HTMLElement | string): void;
  // วิธีการอื่น ๆ ของ HTMLElement จะถูกส่งผ่านไป (ไม่แนะนำให้ใช้งานโดยตรง)
}
```

## ข้อกำหนดด้านความปลอดภัย

**ข้อแนะนำ: ควรทำการเรนเดอร์ทั้งหมดผ่าน `ctx.render()`** หลีกเลี่ยงการใช้ DOM API ของ `ctx.element` โดยตรง (เช่น `innerHTML`, `appendChild`, `querySelector` เป็นต้น)

### ทำไมจึงแนะนำให้ใช้ ctx.render()

| ข้อดี | คำอธิบาย |
|------|------|
| **ความปลอดภัย** | ควบคุมความปลอดภัยแบบรวมศูนย์ เพื่อหลีกเลี่ยง XSS และการจัดการ DOM ที่ไม่เหมาะสม |
| **รองรับ React** | รองรับ JSX, คอมโพเนนต์ React และ Lifecycle อย่างเต็มรูปแบบ |
| **การสืบทอดบริบท** | สืบทอด `ConfigProvider`, ธีม และอื่น ๆ ของแอปพลิเคชันโดยอัตโนมัติ |
| **การจัดการความขัดแย้ง** | จัดการการสร้าง/การทำลาย (unmounting) รูทของ React โดยอัตโนมัติ เพื่อหลีกเลี่ยงความขัดแย้งระหว่างหลายอินสแตนซ์ |

### ❌ ไม่แนะนำ: การจัดการ ctx.element โดยตรง

```ts
// ❌ ไม่แนะนำ: การใช้ API ของ ctx.element โดยตรง
ctx.element.innerHTML = '<div>เนื้อหา</div>';
ctx.element.appendChild(node);
ctx.element.querySelector('.class');
```

> `ctx.element.innerHTML` ถูกยกเลิกการใช้งานแล้ว (deprecated) โปรดใช้ `ctx.render()` แทนครับ

### ✅ แนะนำ: การใช้ ctx.render()

```ts
// ✅ การเรนเดอร์คอมโพเนนต์ React
const { Button, Card } = ctx.libs.antd;
ctx.render(
  <Card title={ctx.t('ยินดีต้อนรับ')}>
    <Button type="primary">คลิก</Button>
  </Card>
);

// ✅ การเรนเดอร์สตริง HTML
ctx.render('<div style="padding:16px;">' + ctx.t('เนื้อหา') + '</div>');

// ✅ การเรนเดอร์โหนด DOM
const div = document.createElement('div');
div.textContent = ctx.t('สวัสดี');
ctx.render(div);
```

## กรณีพิเศษ: ใช้เป็นจุดยึดสำหรับ Popover

เมื่อต้องการเปิด Popover โดยใช้คอนเทนเนอร์ปัจจุบันเป็นจุดยึด (anchor) สามารถเข้าถึง `ctx.element?.__el` เพื่อรับ DOM ดั้งเดิมมาเป็น `target` ได้ครับ:

```ts
// ctx.viewer.popover ต้องการ DOM ดั้งเดิมเป็น target
await ctx.viewer.popover({
  target: ctx.element?.__el,
  content: <div>เนื้อหาป๊อปอัพ</div>,
});
```

> ใช้ `__el` เฉพาะในสถานการณ์เช่น "การใช้คอนเทนเนอร์ปัจจุบันเป็นจุดยึด" เท่านั้น ห้ามจัดการ DOM โดยตรงในกรณีอื่นครับ

## ความสัมพันธ์กับ ctx.render

- หากเรียก `ctx.render(vnode)` โดยไม่มีการส่ง `container` ระบบจะเรนเดอร์ลงในคอนเทนเนอร์ `ctx.element` โดยค่าเริ่มต้น
- หากไม่มีทั้ง `ctx.element` และไม่ได้ระบุ `container` จะเกิดข้อผิดพลาด (error)
- สามารถระบุคอนเทนเนอร์ได้อย่างชัดเจน: `ctx.render(vnode, customContainer)`

## ข้อควรระวัง

- `ctx.element` มีไว้สำหรับการใช้งานภายในโดย `ctx.render()` เท่านั้น ไม่แนะนำให้เข้าถึงหรือแก้ไขคุณสมบัติ/วิธีการของมันโดยตรง
- ในบริบทที่ไม่มีคอนเทนเนอร์สำหรับการเรนเดอร์ `ctx.element` จะเป็น `undefined` ก่อนเรียก `ctx.render()` โปรดตรวจสอบให้แน่ใจว่ามีคอนเทนเนอร์พร้อมใช้งาน หรือส่ง `container` ด้วยตนเอง
- แม้ว่า `innerHTML`/`outerHTML` ใน `ElementProxy` จะผ่านการทำความสะอาดด้วย DOMPurify แล้ว แต่ยังคงแนะนำให้ใช้ `ctx.render()` เพื่อการจัดการการเรนเดอร์ที่เป็นระบบเดียวกันครับ

## สิ่งที่เกี่ยวข้อง

- [ctx.render](./render.md): เรนเดอร์เนื้อหาลงในคอนเทนเนอร์
- [ctx.view](./view.md): ตัวควบคุมมุมมองปัจจุบัน
- [ctx.modal](./modal.md): API ทางลัดสำหรับโมดัล (Modal)