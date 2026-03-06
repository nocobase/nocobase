:::tip{title="การแจ้งเตือนการแปลด้วย AI"}
เอกสารนี้แปลโดย AI สำหรับข้อมูลที่ถูกต้อง กรุณาดู[เวอร์ชันภาษาอังกฤษ](/runjs/context/render)
:::

# ctx.render()

เรนเดอร์ React element, สตริง HTML หรือ DOM node ลงในคอนเทนเนอร์ที่ระบุ หากไม่ได้ระบุ `container` จะถูกเรนเดอร์ลงใน `ctx.element` โดยอัตโนมัติ และจะสืบทอด context ของแอปพลิเคชัน เช่น ConfigProvider และธีมต่าง ๆ ครับ

## สถานการณ์ที่ใช้งาน

| สถานการณ์ | คำอธิบาย |
|------|------|
| **JSBlock** | เรนเดอร์เนื้อหาที่กำหนดเองของบล็อก (แผนภูมิ, รายการ, การ์ด และอื่น ๆ) |
| **JSField / JSItem / JSColumn** | เรนเดอร์การแสดงผลที่กำหนดเองสำหรับฟิลด์ที่แก้ไขได้หรือคอลัมน์ของตาราง |
| **บล็อกรายละเอียด (Details Block)** | กำหนดรูปแบบการแสดงผลของฟิลด์ในหน้าเนื้อหารายละเอียด |

> หมายเหตุ: `ctx.render()` จำเป็นต้องมีคอนเทนเนอร์สำหรับการเรนเดอร์ หากไม่มีการส่ง `container` และไม่มี `ctx.element` อยู่ (เช่น ในกรณีที่เป็นตรรกะล้วน ๆ โดยไม่มี UI) จะเกิดข้อผิดพลาดขึ้นครับ

## การกำหนดประเภท (Type Definition)

```ts
render(
  vnode: React.ReactElement | Node | DocumentFragment | string,
  container?: Element | DocumentFragment
): ReactDOMClient.Root | null;
```

| พารามิเตอร์ | ประเภท | คำอธิบาย |
|------|------|------|
| `vnode` | `React.ReactElement` \| `Node` \| `DocumentFragment` \| `string` | เนื้อหาที่ต้องการเรนเดอร์ |
| `container` | `Element` \| `DocumentFragment` (ไม่บังคับ) | คอนเทนเนอร์เป้าหมายสำหรับการเรนเดอร์ ค่าเริ่มต้นคือ `ctx.element` |

**ค่าที่ส่งกลับ**:

- เมื่อเรนเดอร์ **React element**: จะคืนค่าเป็น `ReactDOMClient.Root` เพื่อความสะดวกในการเรียกใช้ `root.render()` สำหรับการอัปเดตในภายหลัง
- เมื่อเรนเดอร์ **สตริง HTML** หรือ **DOM node**: จะคืนค่าเป็น `null`

## คำอธิบายประเภทของ vnode

| ประเภท | พฤติกรรม |
|------|------|
| `React.ReactElement` (JSX) | เรนเดอร์โดยใช้ `createRoot` ของ React ซึ่งมีความสามารถของ React ครบถ้วน และสืบทอด context ของแอปพลิเคชันโดยอัตโนมัติ |
| `string` | กำหนดค่า `innerHTML` ของคอนเทนเนอร์หลังจากทำความสะอาดด้วย DOMPurify โดยจะทำการ unmount React root เดิมออกก่อน |
| `Node` (Element, Text และอื่น ๆ) | เพิ่มโหนดผ่าน `appendChild` หลังจากล้างคอนเทนเนอร์แล้ว โดยจะทำการ unmount React root เดิมออกก่อน |
| `DocumentFragment` | เพิ่มโหนดย่อยของ fragment ลงในคอนเทนเนอร์ โดยจะทำการ unmount React root เดิมออกก่อน |

## ตัวอย่าง

### การเรนเดอร์ React element (JSX)

```tsx
const { Button, Card } = ctx.libs.antd;

ctx.render(
  <Card title={ctx.t('หัวข้อ')}>
    <Button type="primary" onClick={() => ctx.message.success(ctx.t('คลิกแล้ว'))}>
      {ctx.t('ปุ่ม')}
    </Button>
  </Card>
);
```

### การเรนเดอร์สตริง HTML

```ts
ctx.render('<h1>Hello World</h1>');

// ใช้ร่วมกับ ctx.t สำหรับการทำหลายภาษา (Internationalization)
ctx.render('<div style="padding:16px">' + ctx.t('เนื้อหา') + '</div>');

// การเรนเดอร์ตามเงื่อนไข
ctx.render(hasData ? `<ul>${items.map(i => `<li>${i}</li>`).join('')}</ul>` : '<span style="color:#999">' + ctx.t('No data') + '</span>');
```

### การเรนเดอร์ DOM node

```ts
const div = document.createElement('div');
div.textContent = 'Hello World';
ctx.render(div);

// เรนเดอร์คอนเทนเนอร์ว่างก่อน แล้วจึงส่งต่อให้ไลบรารีภายนอก (เช่น ECharts) เพื่อเริ่มต้นใช้งาน
const container = document.createElement('div');
container.style.width = '100%';
container.style.height = '400px';
ctx.render(container);
const chart = echarts.init(container);
chart.setOption({ ... });
```

### การระบุคอนเทนเนอร์ที่กำหนดเอง

```ts
// เรนเดอร์ไปยัง DOM element ที่ระบุ
const customEl = document.getElementById('my-container');
ctx.render(<div>เนื้อหา</div>, customEl);
```

### การเรียกใช้หลายครั้งจะแทนที่เนื้อหาเดิม

```ts
// การเรียกใช้ครั้งที่สองจะแทนที่เนื้อหาที่มีอยู่ในคอนเทนเนอร์
ctx.render(<div>ครั้งที่หนึ่ง</div>);
ctx.render(<div>ครั้งที่สอง</div>);  // จะแสดงเพียง "ครั้งที่สอง"
```

## ข้อควรระวัง

- **การเรียกใช้หลายครั้งจะแทนที่เนื้อหา**: การเรียก `ctx.render()` แต่ละครั้งจะแทนที่เนื้อหาเดิมที่มีอยู่ในคอนเทนเนอร์ ไม่ใช่การเพิ่มต่อท้ายครับ
- **ความปลอดภัยของสตริง HTML**: สตริง HTML ที่ส่งเข้ามาจะถูกทำความสะอาดผ่าน DOMPurify เพื่อลดความเสี่ยงจาก XSS แต่ยังแนะนำให้หลีกเลี่ยงการต่อสตริงจากข้อมูลผู้ใช้ที่ไม่น่าเชื่อถือครับ
- **อย่าจัดการ ctx.element โดยตรง**: การใช้ `ctx.element.innerHTML` นั้นเลิกใช้งานแล้ว (deprecated) ควรใช้ `ctx.render()` แทนอย่างสม่ำเสมอครับ
- **ต้องส่ง container เมื่อไม่มีค่าเริ่มต้น**: ในกรณีที่ `ctx.element` เป็น `undefined` (เช่น ภายในโมดูลที่โหลดผ่าน `ctx.importAsync`) จำเป็นต้องระบุ `container` อย่างชัดเจนครับ

## เนื้อหาที่เกี่ยวข้อง

- [ctx.element](./element.md) - คอนเทนเนอร์เริ่มต้นสำหรับการเรนเดอร์ ใช้เมื่อไม่ได้ส่ง container ให้กับ `ctx.render()`
- [ctx.libs](./libs.md) - ไลบรารีในตัว เช่น React และ Ant Design สำหรับใช้ในการเรนเดอร์ JSX
- [ctx.importAsync()](./import-async.md) - ใช้ร่วมกับ `ctx.render()` หลังจากโหลดไลบรารี React หรือคอมโพเนนต์ภายนอกตามต้องการ