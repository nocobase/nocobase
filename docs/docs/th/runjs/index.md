:::tip{title="การแจ้งเตือนการแปลด้วย AI"}
เอกสารนี้แปลโดย AI สำหรับข้อมูลที่ถูกต้อง กรุณาดู[เวอร์ชันภาษาอังกฤษ](/runjs/index)
:::

# ภาพรวม RunJS

RunJS คือสภาพแวดล้อมสำหรับการรัน JavaScript (JavaScript execution environment) ที่ใช้ใน NocoBase สำหรับสถานการณ์ต่างๆ เช่น **JS Block**, **JS Field** และ **JS Action** เป็นต้น โค้ดจะทำงานภายใน Sandbox ที่มีการจำกัดสิทธิ์ เพื่อให้สามารถเข้าถึง `ctx` (Context API) ได้อย่างปลอดภัย และมีความสามารถดังต่อไปนี้ครับ:

- Top-level `await` (การใช้ await ในระดับบนสุด)
- การนำเข้าโมดูลภายนอก
- การเรนเดอร์ภายในคอนเทนเนอร์
- ตัวแปรโกลบอล (Global variables)

## Top-level await

RunJS รองรับการใช้งาน `await` ในระดับบนสุด (Top-level `await`) โดยไม่จำเป็นต้องครอบด้วย IIFE ครับ

**ไม่แนะนำ**

```jsx
async function test() {}
(async () => {
  await test();
})();
```

**แนะนำ**

```js
async function test() {}
await test();
```

## การนำเข้าโมดูลภายนอก

- ใช้ `ctx.importAsync()` สำหรับโมดูล ESM (แนะนำ)
- ใช้ `ctx.requireAsync()` สำหรับโมดูล UMD/AMD

## การเรนเดอร์ภายในคอนเทนเนอร์

ใช้ `ctx.render()` เพื่อเรนเดอร์เนื้อหาลงในคอนเทนเนอร์ปัจจุบัน (`ctx.element`) โดยรองรับ 3 รูปแบบดังนี้ครับ:

### การเรนเดอร์ JSX

```jsx
ctx.render(<button>Button</button>);
```

### การเรนเดอร์ DOM Node

```js
const div = document.createElement('div');
div.innerHTML = 'Hello World';

ctx.render(div);
```

### การเรนเดอร์สตริง HTML

```js
ctx.render('<h1>Hello World</h1>');
```

## ตัวแปรโกลบอล

- `window`
- `document`
- `navigator`
- `ctx`