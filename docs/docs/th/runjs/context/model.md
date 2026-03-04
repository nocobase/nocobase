:::tip{title="การแจ้งเตือนการแปลด้วย AI"}
เอกสารนี้แปลโดย AI สำหรับข้อมูลที่ถูกต้อง กรุณาดู[เวอร์ชันภาษาอังกฤษ](/runjs/context/model)
:::

# ctx.model

อินสแตนซ์ (Instance) ของ `FlowModel` ที่บริบทการทำงาน (Execution Context) ของ RunJS ปัจจุบันตั้งอยู่ ซึ่งเป็นจุดเริ่มต้นหลักสำหรับสถานการณ์ต่างๆ เช่น JSBlock, JSField และ JSAction โดยประเภทที่เจาะจงจะเปลี่ยนไปตามบริบท เช่น อาจเป็นคลาสย่อย (Subclass) อย่าง `BlockModel`, `ActionModel` หรือ `JSEditableFieldModel` เป็นต้นครับ

## สถานการณ์ที่ใช้งาน

| สถานการณ์ | คำอธิบาย |
|------|------|
| **JSBlock** | `ctx.model` คือโมเดลของบล็อกปัจจุบัน สามารถเข้าถึง `resource`, `คอลเลกชัน`, `setProps` และอื่นๆ ได้ |
| **JSField / JSItem / JSColumn** | `ctx.model` คือโมเดลของฟิลด์ สามารถเข้าถึง `setProps`, `dispatchEvent` และอื่นๆ ได้ |
| **เหตุการณ์การดำเนินการ / ActionModel** | `ctx.model` คือโมเดลของการดำเนินการ (Action) สามารถอ่าน/เขียนพารามิเตอร์ของขั้นตอน และส่งเหตุการณ์ (Dispatch events) ได้ |

> คำแนะนำ: หากต้องการเข้าถึง **บล็อกหลัก (Parent block) ที่ครอบคลุม JS ปัจจุบัน** (เช่น บล็อกฟอร์มหรือตาราง) ให้ใช้ `ctx.blockModel` หากต้องการเข้าถึง **โมเดลอื่นๆ** ให้ใช้ `ctx.getModel(uid)` ครับ

## คำจำกัดความประเภท (Type Definition)

```ts
model: FlowModel;
```

`FlowModel` เป็นคลาสฐาน (Base class) ซึ่งในขณะทำงานจริงจะเป็นอินสแตนซ์ของคลาสย่อยต่างๆ (เช่น `BlockModel`, `FormBlockModel`, `TableBlockModel`, `JSEditableFieldModel`, `ActionModel` เป็นต้น) โดยคุณสมบัติ (Properties) และวิธีการ (Methods) ที่ใช้งานได้จะแตกต่างกันไปตามประเภทครับ

## คุณสมบัติที่ใช้บ่อย

| คุณสมบัติ | ประเภท | คำอธิบาย |
|------|------|------|
| `uid` | `string` | ตัวระบุเฉพาะ (Unique identifier) ของโมเดล สามารถใช้สำหรับ `ctx.getModel(uid)` หรือการผูก UID ของหน้าต่างป๊อปอัป |
| `collection` | `Collection` | คอลเลกชันที่ผูกกับโมเดลปัจจุบัน (จะมีค่าเมื่อบล็อก/ฟิลด์มีการผูกกับข้อมูล) |
| `resource` | `Resource` | อินสแตนซ์ของทรัพยากรที่เกี่ยวข้อง ใช้สำหรับการรีเฟรชข้อมูล หรือการดึงแถวที่เลือก เป็นต้น |
| `props` | `object` | การตั้งค่า UI/พฤติกรรมของโมเดล สามารถอัปเดตได้โดยใช้ `setProps` |
| `subModels` | `Record<string, FlowModel>` | ชุดของโมเดลย่อย (เช่น ฟิลด์ภายในฟอร์ม หรือคอลัมน์ภายในตาราง) |
| `parent` | `FlowModel` | โมเดลหลัก (ถ้ามี) |

## วิธีการที่ใช้บ่อย

| วิธีการ | คำอธิบาย |
|------|------|
| `setProps(partialProps: any): void` | อัปเดตการตั้งค่าของโมเดลและกระตุ้นการแสดงผลใหม่ (Re-rendering) (เช่น `ctx.model.setProps({ loading: true })`) |
| `dispatchEvent(eventName: string, payload?: any, options?: any): Promise<any[]>` | ส่งเหตุการณ์ (Dispatch event) ไปยังโมเดล เพื่อกระตุ้นเวิร์กโฟลว์ที่กำหนดค่าไว้ในโมเดลนั้นซึ่งรอฟังชื่อเหตุการณ์ดังกล่าว สามารถส่ง `payload` ไปยังตัวจัดการเวิร์กโฟลว์ได้ และใช้ `options.debounce` เพื่อเปิดใช้งานการหน่วงเวลา (Debounce) |
| `getStepParams?.(flowKey, stepKey)` | อ่านพารามิเตอร์ขั้นตอนของเวิร์กโฟลว์การตั้งค่า (ใช้ในแผงการตั้งค่า หรือการดำเนินการที่กำหนดเอง เป็นต้น) |
| `setStepParams?.(flowKey, stepKey, params)` | เขียนพารามิเตอร์ขั้นตอนของเวิร์กโฟลว์การตั้งค่า |

## ความสัมพันธ์กับ ctx.blockModel และ ctx.getModel

| ความต้องการ | วิธีการที่แนะนำ |
|------|----------|
| **โมเดลของบริบทการทำงานปัจจุบัน** | `ctx.model` |
| **บล็อกหลักของ JS ปัจจุบัน** | `ctx.blockModel` มักใช้เพื่อเข้าถึง `resource`, `form` หรือ `คอลเลกชัน` |
| **รับโมเดลใดๆ ด้วย UID** | `ctx.getModel(uid)` หรือ `ctx.getModel(uid, true)` (ค้นหาข้าม View stack) |

ใน JSField นั้น `ctx.model` จะเป็นโมเดลของฟิลด์ ในขณะที่ `ctx.blockModel` จะเป็นบล็อกฟอร์มหรือตารางที่ครอบคลุมฟิลด์นั้นอยู่ครับ

## ตัวอย่าง

### การอัปเดตสถานะของบล็อก/การดำเนินการ

```ts
ctx.model.setProps({ loading: true });
await doSomething();
ctx.model.setProps({ loading: false });
```

### การส่งเหตุการณ์ของโมเดล (Dispatching Model Events)

```ts
// ส่งเหตุการณ์เพื่อกระตุ้นเวิร์กโฟลว์ที่กำหนดค่าไว้ในโมเดลนี้ซึ่งรอฟังชื่อเหตุการณ์นี้
await ctx.model.dispatchEvent('remove');

// เมื่อมีการส่ง payload ข้อมูลจะถูกส่งไปยัง ctx.inputArgs ของตัวจัดการเวิร์กโฟลว์
await ctx.model.dispatchEvent('customEvent', { id: 123 });
```

### การใช้ UID สำหรับการผูกป๊อปอัปหรือการเข้าถึงข้ามโมเดล

```ts
const myUid = ctx.model.uid;
// ในการตั้งค่าป๊อปอัป สามารถส่ง openerUid: myUid เพื่อสร้างความเชื่อมโยงได้
const other = ctx.getModel('other-block-uid');
if (other) other.rerender?.();
```

## หัวข้อที่เกี่ยวข้อง

- [ctx.blockModel](./block-model.md): โมเดลของบล็อกหลักที่ JS ปัจจุบันตั้งอยู่
- [ctx.getModel()](./get-model.md): รับโมเดลอื่นตาม UID