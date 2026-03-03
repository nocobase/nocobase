:::tip{title="การแจ้งเตือนการแปลด้วย AI"}
เอกสารนี้แปลโดย AI สำหรับข้อมูลที่ถูกต้อง กรุณาดู[เวอร์ชันภาษาอังกฤษ](/runjs/jsx)
:::

# JSX

RunJS รองรับไวยากรณ์ JSX ทำให้คุณสามารถเขียนโค้ดได้เหมือนกับการเขียนคอมโพเนนต์ React โดย JSX จะถูกคอมไพล์โดยอัตโนมัติก่อนการทำงานครับ

## คำอธิบายการคอมไพล์

- ใช้ [sucrase](https://github.com/alangpierce/sucrase) ในการแปลง JSX
- JSX จะถูกคอมไพล์เป็น `ctx.libs.React.createElement` และ `ctx.libs.React.Fragment`
- **ไม่จำเป็นต้อง import React**: สามารถเขียน JSX ได้โดยตรง ซึ่งหลังจากการคอมไพล์จะเรียกใช้ `ctx.libs.React` โดยอัตโนมัติครับ
- เมื่อโหลด React ภายนอกผ่าน `ctx.importAsync('react@x.x.x')` ตัว JSX จะเปลี่ยนไปใช้เมธอด `createElement` จากอินสแตนซ์นั้นแทน

## การใช้ React และคอมโพเนนต์ในตัว

RunJS มาพร้อมกับ React และไลบรารี UI พื้นฐานในตัว ซึ่งสามารถเรียกใช้งานได้โดยตรงผ่าน `ctx.libs` โดยไม่ต้องใช้ `import` ครับ:

- **ctx.libs.React** — ตัวหลักของ React
- **ctx.libs.ReactDOM** — ReactDOM (สามารถใช้ร่วมกับ `createRoot` ได้หากจำเป็น)
- **ctx.libs.antd** — คอมโพเนนต์ Ant Design
- **ctx.libs.antdIcons** — ไอคอน Ant Design

```tsx
const { Button } = ctx.libs.antd;

ctx.render(<Button>คลิก</Button>);
```

เมื่อเขียน JSX โดยตรง ไม่จำเป็นต้องทำการ destructure React แต่จำเป็นต้อง destructure จาก `ctx.libs` เมื่อมีการใช้ **Hooks** (เช่น `useState`, `useEffect`) หรือ **Fragment** (`<>...</>`) ครับ:

```tsx
const { React } = ctx.libs;
const { useState } = React;

const Counter = () => {
  const [count, setCount] = useState(0);
  return <div>Count: {count}</div>;
};

ctx.render(<Counter />);
```

**ข้อควรระวัง**: React ในตัวและ React ภายนอกที่นำเข้าผ่าน `ctx.importAsync()` **ไม่สามารถใช้ร่วมกันได้** หากคุณใช้ไลบรารี UI ภายนอก จะต้องนำเข้า React จากแหล่งภายนอกเดียวกันด้วยครับ

## การใช้ React และคอมโพเนนต์ภายนอก

เมื่อโหลด React และไลบรารี UI เวอร์ชันที่ระบุผ่าน `ctx.importAsync()` ตัว JSX จะใช้อินสแตนซ์ของ React นั้นครับ:

```tsx
const React = await ctx.importAsync('react@19.2.4');
const { Button } = await ctx.importAsync('antd@6.2.2?bundle');

ctx.render(<Button>คลิก</Button>);
```

หาก antd จำเป็นต้องใช้ react/react-dom คุณสามารถระบุเวอร์ชันเดียวกันผ่าน `deps` เพื่อหลีกเลี่ยงการเกิดหลายอินสแตนซ์ได้ครับ:

```tsx
const React = await ctx.importAsync('react@18.2.0');
const { Button } = await ctx.importAsync('antd@5.29.3?bundle&deps=react@18.2.0,react-dom@18.2.0');

ctx.render(<Button>Button</Button>);
```

**ข้อควรระวัง**: เมื่อใช้ React ภายนอก ไลบรารี UI เช่น antd จะต้องนำเข้าผ่าน `ctx.importAsync()` ด้วยเช่นกัน ห้ามใช้ปะปนกับ `ctx.libs.antd` ครับ

## ประเด็นสำคัญของไวยากรณ์ JSX

- **คอมโพเนนต์และ props**: `<Button type="primary">ข้อความ</Button>`
- **Fragment**: `<>...</>` หรือ `<React.Fragment>...</React.Fragment>` (เมื่อใช้ Fragment จำเป็นต้อง destructure `const { React } = ctx.libs`)
- **นิพจน์ (Expressions)**: ใช้ `{นิพจน์}` ใน JSX เพื่อใส่ตัวแปรหรือการคำนวณ เช่น `{ctx.user.name}`, `{count + 1}` ห้ามใช้ไวยากรณ์เทมเพลตแบบ `{{ }}`
- **การแสดงผลตามเงื่อนไข (Conditional Rendering)**: `{flag && <span>เนื้อหา</span>}` หรือ `{flag ? <A /> : <B />}`
- **การแสดงผลรายการ (List Rendering)**: ใช้ `array.map()` เพื่อส่งคืนรายการขององค์ประกอบ และกำหนด `key` ที่คงที่ให้กับแต่ละองค์ประกอบด้วยครับ

```tsx
const { React } = ctx.libs;
const items = ['a', 'b', 'c'];

ctx.render(
  <ul>
    {items.map((item, i) => (
      <li key={i}>{item}</li>
    ))}
  </ul>
);
```