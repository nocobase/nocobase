---
title: "Render trong container của RunJS"
description: "ctx.render() render React element, JSX hoặc DOM vào container ctx.element, tự động kế thừa ConfigProvider, theme, dùng cho hiển thị tùy chỉnh JSBlock, JSField."
keywords: "ctx.render,render container,JSX,React,ConfigProvider,JSBlock,JSField,NocoBase RunJS"
---

# Render trong container

Sử dụng `ctx.render()` để render nội dung vào container hiện tại (`ctx.element`), hỗ trợ ba dạng sau:

## `ctx.render()`

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

## Giải thích về JSX

RunJS có thể render JSX trực tiếp, có thể sử dụng React/thư viện component có sẵn hoặc tải dependencies bên ngoài theo nhu cầu.

### Sử dụng React và thư viện component có sẵn

```jsx
const { Button } = ctx.libs.antd;

ctx.render(<Button>Click</Button>);
```

### Sử dụng React và thư viện component bên ngoài

Tải phiên bản chỉ định theo nhu cầu qua `ctx.importAsync()`:

```jsx
const React = await ctx.importAsync('react@19.2.4');
const { Button } = await ctx.importAsync('antd@6.2.2?bundle');

ctx.render(<Button>Click</Button>);
```

Phù hợp với kịch bản cần phiên bản cụ thể hoặc component bên thứ ba.

## ctx.element

Cách sử dụng không khuyến nghị (đã deprecated):

```js
ctx.element.innerHTML = '<h1>Hello World</h1>';
```

Cách khuyến nghị:

```js
ctx.render(<h1>Hello World</h1>);
```
