:::tip{title="การแจ้งเตือนการแปลด้วย AI"}
เอกสารนี้แปลโดย AI สำหรับข้อมูลที่ถูกต้อง กรุณาดู[เวอร์ชันภาษาอังกฤษ](/runjs/context/libs)
:::

# ctx.libs

`ctx.libs` คือ Namespace ส่วนกลางสำหรับไลบรารีภายใน (Built-in libraries) ของ RunJS ซึ่งประกอบด้วยไลบรารีที่ใช้งานบ่อย เช่น React, Ant Design, dayjs และ lodash **ไม่จำเป็นต้องใช้ `import` หรือโหลดแบบ Asynchronous** โดยสามารถเรียกใช้งานผ่าน `ctx.libs.xxx` ได้โดยตรงครับ

## สถานการณ์ที่ใช้งาน

| สถานการณ์ | คำอธิบาย |
|------|------|
| **JSBlock / JSField / JSItem / JSColumn** | ใช้ React + Ant Design ในการเรนเดอร์ UI, ใช้ dayjs จัดการวันที่ และใช้ lodash ในการประมวลผลข้อมูล |
| **สูตรคำนวณ / การคำนวณ** | ใช้ formula หรือ math สำหรับสูตรคำนวณแบบ Excel หรือการคำนวณทางคณิตศาสตร์ |
| **เวิร์กโฟลว์ / กฎการเชื่อมโยง** | เรียกใช้ไลบรารีเครื่องมืออย่าง lodash, dayjs และ formula ในสถานการณ์ที่เป็นตรรกะล้วน (Pure logic) |

## รายการไลบรารีภายใน

| คุณสมบัติ | คำอธิบาย | เอกสารประกอบ |
|------|------|------|
| `ctx.libs.React` | ตัวหลักของ React สำหรับใช้ JSX และ Hooks | [React](https://react.dev/) |
| `ctx.libs.ReactDOM` | ReactDOM client API (รวมถึง `createRoot`) ใช้ร่วมกับ React เพื่อเรนเดอร์ | [React DOM](https://react.dev/reference/react-dom) |
| `ctx.libs.antd` | ไลบรารีคอมโพเนนต์ Ant Design (Button, Card, Table, Form, Input, Modal ฯลฯ) | [Ant Design](https://ant.design/components/overview/) |
| `ctx.libs.antdIcons` | ไลบรารีไอคอน Ant Design (เช่น PlusOutlined, UserOutlined) | [@ant-design/icons](https://ant.design/components/icon/) |
| `ctx.libs.dayjs` | ไลบรารีเครื่องมือจัดการวันที่และเวลา | [dayjs](https://day.js.org/) |
| `ctx.libs.lodash` | ไลบรารีเครื่องมือ (get, set, debounce ฯลฯ) | [Lodash](https://lodash.com/docs/) |
| `ctx.libs.formula` | ไลบรารีฟังก์ชันสูตรคำนวณแบบ Excel (SUM, AVERAGE, IF ฯลฯ) | [Formula.js](https://formulajs.info/functions/) |
| `ctx.libs.math` | ไลบรารีนิพจน์และการคำนวณทางคณิตศาสตร์ | [Math.js](https://mathjs.org/docs/) |

## นามแฝงระดับบนสุด (Top-level Aliases)

เพื่อความเข้ากันได้กับโค้ดเก่า ไลบรารีบางส่วนจะถูกเปิดให้ใช้งานในระดับบนสุดด้วย เช่น `ctx.React`, `ctx.ReactDOM`, `ctx.antd` และ `ctx.dayjs` **อย่างไรก็ตาม แนะนำให้ใช้ `ctx.libs.xxx` เป็นมาตรฐานเดียวกัน** เพื่อความสะดวกในการบำรุงรักษาและการค้นหาเอกสารครับ

## การโหลดแบบ Lazy Loading

`lodash`, `formula` และ `math` จะใช้การโหลดแบบ **Lazy loading**: โดยจะทำการ dynamic import เมื่อมีการเข้าถึง `ctx.libs.lodash` เป็นครั้งแรกเท่านั้น และจะใช้แคชซ้ำในครั้งต่อๆ ไป ส่วน `React`, `antd`, `dayjs` และ `antdIcons` จะถูกจัดเตรียมไว้ล่วงหน้าใน Context และสามารถใช้งานได้ทันทีครับ

## ตัวอย่าง

### การเรนเดอร์ด้วย React และ Ant Design

```tsx
const { Button, Card } = ctx.libs.antd;

ctx.render(
  <Card title="หัวข้อ">
    <Button type="primary">คลิก</Button>
  </Card>
);
```

### การใช้ Hooks

```tsx
const { React } = ctx.libs;
const { useState } = React;
const { Button } = ctx.libs.antd;

const App = () => {
  const [count, setCount] = useState(0);
  return <Button onClick={() => setCount((c) => c + 1)}>{count}</Button>;
};
ctx.render(<App />);
```

### การใช้ไอคอน

```tsx
const { Button } = ctx.libs.antd;
const { UserOutlined, HeartOutlined } = ctx.libs.antdIcons;

ctx.render(<Button icon={<UserOutlined />}>ผู้ใช้งาน</Button>);
```

### การจัดการวันที่ด้วย dayjs

```ts
const now = ctx.libs.dayjs();
const formatted = now.format('YYYY-MM-DD HH:mm:ss');
ctx.message.info(formatted);
```

### ฟังก์ชันเครื่องมือของ lodash

```ts
const user = { profile: { name: 'Alice' } };
const name = ctx.libs.lodash.get(user, 'profile.name', 'Unknown');
```

### การคำนวณด้วย formula

```ts
const values = [1, 2, 3, 4];
const sum = ctx.libs.formula.SUM(values);
const avg = ctx.libs.formula.AVERAGE(values);
```

### นิพจน์ทางคณิตศาสตร์ด้วย math.js

```ts
const result = ctx.libs.math.evaluate('2 + 3 * 4');
// result === 14
```

## ข้อควรระวัง

- **การใช้งานร่วมกับ ctx.importAsync**: หากมีการโหลด React ภายนอกผ่าน `ctx.importAsync('react@19')` ตัว JSX จะใช้อินสแตนซ์นั้น ในกรณีนี้ **ห้าม** ใช้ร่วมกับ `ctx.libs.antd` โดยตรง แต่จะต้องโหลด Ant Design เวอร์ชันที่รองรับกับ React เวอร์ชันนั้นๆ แทน (เช่น `ctx.importAsync('antd@5.x')`, `ctx.importAsync('@ant-design/icons@5.x')`)
- **อินสแตนซ์ React หลายตัว**: หากเกิดข้อผิดพลาด "Invalid hook call" หรือ hook dispatcher เป็น null มักเกิดจากการมีอินสแตนซ์ของ React หลายตัว ก่อนที่จะอ่าน `ctx.libs.React` หรือเรียกใช้ Hooks ให้รัน `await ctx.importAsync('react@เวอร์ชัน')` ก่อน เพื่อให้แน่ใจว่าใช้งาน React ตัวเดียวกับหน้าเว็บครับ

## เนื้อหาที่เกี่ยวข้อง

- [ctx.importAsync()](./import-async.md) - โหลดโมดูล ESM ภายนอกตามต้องการ (เช่น React หรือ Vue เวอร์ชันที่ระบุ)
- [ctx.render()](./render.md) - เรนเดอร์เนื้อหาไปยังคอนเทนเนอร์