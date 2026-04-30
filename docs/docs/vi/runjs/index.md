---
title: "Tổng quan NocoBase RunJS"
description: "RunJS là môi trường thực thi JavaScript trong NocoBase cho JS Block, JS Field, JS Action, hỗ trợ top-level await, ctx context, import module, render trong container, chạy trong sandbox an toàn."
keywords: "RunJS,JS Block,JS Field,JS Action,môi trường thực thi JavaScript,ctx context,sandbox,NocoBase"
---

# Tổng quan RunJS

RunJS là môi trường thực thi JavaScript trong NocoBase được sử dụng cho các kịch bản như **JS Block**, **JS Field**, **JS Action**. Mã được chạy trong sandbox bị giới hạn, có thể truy cập an toàn `ctx` (API ngữ cảnh) và có các khả năng sau:

- Top-level async (Top-level `await`)
- Import module bên ngoài
- Render trong container
- Biến toàn cục

## Top-level async (Top-level `await`)

RunJS hỗ trợ top-level `await`, không cần bọc trong IIFE.

**Không khuyến nghị**

```jsx
async function test() {}
(async () => {
  await test();
})();
```

**Khuyến nghị**

```js
async function test() {}
await test();
```

## Import module bên ngoài

- Module ESM sử dụng `ctx.importAsync()` (khuyến nghị)
- Module UMD/AMD sử dụng `ctx.requireAsync()`

## Render trong container

Sử dụng `ctx.render()` để render nội dung vào container hiện tại (`ctx.element`), hỗ trợ ba dạng sau:

### Render JSX

```jsx
ctx.render(<button>Button</button>);
```

### Render DOM node

```js
const div = document.createElement('div');
div.innerHTML = 'Hello World';

ctx.render(div);
```

### Render chuỗi HTML

```js
ctx.render('<h1>Hello World</h1>');
```

## Biến toàn cục

- `window`
- `document`
- `navigator`
- `ctx`
