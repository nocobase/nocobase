---
title: "Cú pháp JSX trong RunJS"
description: "RunJS hỗ trợ cú pháp JSX, viết code như viết React component, tự động compile thành createElement, có sẵn React, antd, dùng cho UI tùy chỉnh JSBlock, JSField."
keywords: "JSX,React,antd,JSBlock,JSField,createElement,RunJS,NocoBase"
---

# JSX

RunJS hỗ trợ cú pháp JSX, có thể viết code như viết React component, JSX sẽ được tự động compile trước khi thực thi.

## Giải thích về compile

- Sử dụng [sucrase](https://github.com/alangpierce/sucrase) để chuyển đổi JSX
- JSX sẽ được compile thành `ctx.libs.React.createElement` và `ctx.libs.React.Fragment`
- **Không cần import React**: chỉ cần viết JSX trực tiếp, sau khi compile sẽ tự động sử dụng `ctx.libs.React`
- Khi tải React bên ngoài qua `ctx.importAsync('react@x.x.x')`, JSX sẽ chuyển sang sử dụng `createElement` của instance đó

## Sử dụng React và component có sẵn

RunJS đã tích hợp React và các thư viện UI thường dùng, có thể sử dụng trực tiếp qua `ctx.libs`, không cần `import`:

- **ctx.libs.React** — React core
- **ctx.libs.ReactDOM** — ReactDOM (có thể dùng kết hợp với createRoot nếu cần)
- **ctx.libs.antd** — Component Ant Design
- **ctx.libs.antdIcons** — Icon Ant Design

```tsx
const { Button } = ctx.libs.antd;

ctx.render(<Button>点击</Button>);
```

Khi viết JSX trực tiếp, không cần destructure React; chỉ khi sử dụng **Hooks** (như `useState`, `useEffect`) hoặc **Fragment** (`<>...</>`) mới cần destructure từ `ctx.libs`:

```tsx
const { React } = ctx.libs;
const { useState } = React;

const Counter = () => {
  const [count, setCount] = useState(0);
  return <div>Count: {count}</div>;
};

ctx.render(<Counter />);
```

**Lưu ý**: React có sẵn và React bên ngoài import qua `ctx.importAsync()` **không thể dùng lẫn lộn**. Nếu sử dụng thư viện UI bên ngoài, React cũng cần được import từ bên ngoài cùng nhau.

## Sử dụng React và component bên ngoài

Khi tải phiên bản chỉ định của React và thư viện UI qua `ctx.importAsync()`, JSX sẽ sử dụng instance React đó:

```tsx
const React = await ctx.importAsync('react@19.2.4');
const { Button } = await ctx.importAsync('antd@6.2.2?bundle');

ctx.render(<Button>点击</Button>);
```

Nếu antd phụ thuộc vào react/react-dom, có thể chỉ định cùng phiên bản qua `deps` để tránh nhiều instance:

```tsx
const React = await ctx.importAsync('react@18.2.0');
const { Button } = await ctx.importAsync('antd@5.29.3?bundle&deps=react@18.2.0,react-dom@18.2.0');

ctx.render(<Button>Button</Button>);
```

**Lưu ý**: Khi sử dụng React bên ngoài, các thư viện UI như antd cũng cần import qua `ctx.importAsync()`, không trộn lẫn với `ctx.libs.antd`.

## Điểm chính của cú pháp JSX

- **Component và props**: `<Button type="primary">文字</Button>`
- **Fragment**: `<>...</>` hoặc `<React.Fragment>...</React.Fragment>` (khi sử dụng Fragment cần destructure `const { React } = ctx.libs`)
- **Biểu thức**: Trong JSX dùng `{biểu thức}` để chèn biến hoặc phép toán, ví dụ `{ctx.user.name}`, `{count + 1}`; không sử dụng cú pháp template `{{ }}`
- **Render có điều kiện**: `{flag && <span>内容</span>}` hoặc `{flag ? <A /> : <B />}`
- **Render danh sách**: Sử dụng `array.map()` để trả về danh sách phần tử và đặt `key` ổn định cho từng phần tử

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
