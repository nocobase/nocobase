---
title: "ctx.libs"
description: "ctx.libs là namespace thư viện có sẵn của RunJS, gồm React, antd, dayjs, lodash, formula, math, v.v., không cần import sử dụng trực tiếp."
keywords: "ctx.libs,React,antd,dayjs,lodash,formula,math,thư viện có sẵn,RunJS,NocoBase"
---

# ctx.libs

`ctx.libs` là namespace thống nhất của các thư viện có sẵn trong RunJS, bao gồm các thư viện thường dùng như React, Ant Design, dayjs, lodash. **Không cần `import` hoặc tải bất đồng bộ**, có thể sử dụng trực tiếp qua `ctx.libs.xxx`.

## Kịch bản áp dụng

| Kịch bản | Mô tả |
|------|------|
| **JSBlock / JSField / JSItem / JSColumn** | Sử dụng React + Ant Design để render UI, dayjs để xử lý ngày tháng, lodash để xử lý dữ liệu |
| **Công thức / tính toán** | Sử dụng formula hoặc math để thực hiện công thức kiểu Excel, biểu thức toán học |
| **Luồng sự kiện / quy tắc liên kết** | Trong các kịch bản logic thuần túy gọi các thư viện công cụ như lodash, dayjs, formula, v.v. |

## Tổng quan thư viện có sẵn

| Thuộc tính | Mô tả | Tài liệu |
|------|------|------|
| `ctx.libs.React` | React core, dùng cho JSX và Hooks | [React](https://react.dev/) |
| `ctx.libs.ReactDOM` | API client React DOM (gồm `createRoot`), dùng kết hợp với React để render | [React DOM](https://react.dev/reference/react-dom) |
| `ctx.libs.antd` | Thư viện component Ant Design (Button, Card, Table, Form, Input, Modal, v.v.) | [Ant Design](https://ant.design/components/overview-cn/) |
| `ctx.libs.antdIcons` | Thư viện icon Ant Design (như PlusOutlined, UserOutlined) | [@ant-design/icons](https://ant.design/components/icon-cn/) |
| `ctx.libs.dayjs` | Thư viện công cụ ngày giờ | [dayjs](https://day.js.org/) |
| `ctx.libs.lodash` | Thư viện công cụ (get, set, debounce, v.v.) | [Lodash](https://lodash.com/docs/) |
| `ctx.libs.formula` | Thư viện hàm công thức kiểu Excel (SUM, AVERAGE, IF, v.v.) | [Formula.js](https://formulajs.info/functions/) |
| `ctx.libs.math` | Thư viện biểu thức và tính toán toán học | [Math.js](https://mathjs.org/docs/) |

## Alias top-level

Để tương thích với code lịch sử, một số thư viện cũng được expose ở top-level: `ctx.React`, `ctx.ReactDOM`, `ctx.antd`, `ctx.dayjs`. **Khuyến nghị sử dụng đồng nhất `ctx.libs.xxx`**, tiện cho việc bảo trì và tra cứu tài liệu.

## Lazy load

`lodash`, `formula`, `math`, v.v. sử dụng **lazy load**: chỉ khi truy cập `ctx.libs.lodash` lần đầu mới khởi tạo dynamic import, sau đó tái sử dụng cache. `React`, `antd`, `dayjs`, `antdIcons` được preset bởi ngữ cảnh, có thể truy cập ngay.

## Ví dụ

### Render với React và Ant Design

```tsx
const { Button, Card } = ctx.libs.antd;

ctx.render(
  <Card title="标题">
    <Button type="primary">点击</Button>
  </Card>
);
```

### Sử dụng Hooks

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

### Sử dụng icon

```tsx
const { Button } = ctx.libs.antd;
const { UserOutlined, HeartOutlined } = ctx.libs.antdIcons;

ctx.render(<Button icon={<UserOutlined />}>用户</Button>);
```

### Xử lý ngày tháng với dayjs

```ts
const now = ctx.libs.dayjs();
const formatted = now.format('YYYY-MM-DD HH:mm:ss');
ctx.message.info(formatted);
```

### Hàm công cụ lodash

```ts
const user = { profile: { name: 'Alice' } };
const name = ctx.libs.lodash.get(user, 'profile.name', 'Unknown');
```

### Tính toán công thức formula

```ts
const values = [1, 2, 3, 4];
const sum = ctx.libs.formula.SUM(values);
const avg = ctx.libs.formula.AVERAGE(values);
```

### Biểu thức toán học math

```ts
const result = ctx.libs.math.evaluate('2 + 3 * 4');
// result === 14
```

## Lưu ý

- **Sử dụng lẫn lộn với ctx.importAsync**: Nếu đã tải React bên ngoài qua `ctx.importAsync('react@19')`, JSX sẽ sử dụng instance đó; tại thời điểm này **không** trộn lẫn với `ctx.libs.antd`, antd cần được tải kèm với phiên bản React đó (như `ctx.importAsync('antd@5.x')`, `ctx.importAsync('@ant-design/icons@5.x')`).
- **Nhiều instance React**: Nếu xuất hiện "Invalid hook call" hoặc hook dispatcher là null, thường do nhiều instance React gây ra. Trước khi đọc `ctx.libs.React` hoặc gọi Hooks, hãy thực thi `await ctx.importAsync('react@phiên bản')` trước để đảm bảo dùng chung instance React với page.

## Liên quan

- [ctx.importAsync()](./import-async.md) - Tải module ESM bên ngoài theo nhu cầu (như React, Vue phiên bản chỉ định)
- [ctx.render()](./render.md) - Render nội dung vào container
