:::tip{title="การแจ้งเตือนการแปลด้วย AI"}
เอกสารนี้แปลโดย AI สำหรับข้อมูลที่ถูกต้อง กรุณาดู[เวอร์ชันภาษาอังกฤษ](/runjs/render)
:::

# การเรนเดอร์ภายในคอนเทนเนอร์

ใช้ `ctx.render()` เพื่อเรนเดอร์เนื้อหาลงในคอนเทนเนอร์ปัจจุบัน (`ctx.element`) โดยรองรับ 3 รูปแบบดังนี้ครับ:

## `ctx.render()`

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

### การเรนเดอร์ HTML String

```js
ctx.render('<h1>Hello World</h1>');
```

## คำอธิบายเกี่ยวกับ JSX

RunJS สามารถเรนเดอร์ JSX ได้โดยตรง โดยคุณสามารถเลือกใช้ React หรือไลบรารีคอมโพเนนต์ที่มีมาให้ในตัว หรือจะโหลด Dependency ภายนอกตามความต้องการก็ได้ครับ

### การใช้ React และไลบรารีคอมโพเนนต์ที่มีมาให้ในตัว

```jsx
const { Button } = ctx.libs.antd;

ctx.render(<Button>Click</Button>);
```

### การใช้ React และไลบรารีคอมโพเนนต์จากภายนอก

โหลดเวอร์ชันที่ต้องการตามการใช้งานผ่าน `ctx.importAsync()`:

```jsx
const React = await ctx.importAsync('react@19.2.4');
const { Button } = await ctx.importAsync('antd@6.2.2?bundle');

ctx.render(<Button>Click</Button>);
```

เหมาะสำหรับกรณีที่ต้องการใช้เวอร์ชันเฉพาะหรือคอมโพเนนต์จากบุคคลที่สามครับ

## ctx.element

วิธีที่ไม่แนะนำ (เลิกใช้งานแล้ว):

```js
ctx.element.innerHTML = '<h1>Hello World</h1>';
```

วิธีที่แนะนำ:

```js
ctx.render(<h1>Hello World</h1>);
```