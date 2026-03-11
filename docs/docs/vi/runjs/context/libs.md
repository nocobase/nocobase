:::tip{title="Thông báo dịch bằng AI"}
Tài liệu này được dịch bằng AI. Để biết thông tin chính xác, vui lòng tham khảo [phiên bản tiếng Anh](/runjs/context/libs).
:::

# ctx.libs

`ctx.libs` là namespace thống nhất cho các thư viện tích hợp sẵn trong RunJS, bao gồm các thư viện phổ biến như React, Ant Design, dayjs, lodash. **Không cần `import` hoặc tải bất đồng bộ**, bạn có thể sử dụng trực tiếp thông qua `ctx.libs.xxx`.

## Các trường hợp sử dụng

| Trường hợp | Mô tả |
|------|------|
| **JSBlock / JSField / JSItem / JSColumn** | Sử dụng React + Ant Design để hiển thị UI, dayjs để xử lý ngày tháng, lodash để xử lý dữ liệu. |
| **Công thức / Tính toán** | Sử dụng formula hoặc math để thực hiện các công thức kiểu Excel hoặc các biểu thức toán học. |
| **Luồng công việc / Quy tắc liên kết** | Gọi các thư viện tiện ích như lodash, dayjs, formula trong các kịch bản logic thuần túy. |

## Danh sách các thư viện tích hợp

| Thuộc tính | Mô tả | Tài liệu |
|------|------|------|
| `ctx.libs.React` | React core, dùng cho JSX và Hooks | [React](https://react.dev/) |
| `ctx.libs.ReactDOM` | ReactDOM client API (bao gồm `createRoot`), phối hợp với React để render | [React DOM](https://react.dev/reference/react-dom) |
| `ctx.libs.antd` | Thư viện component Ant Design (Button, Card, Table, Form, Input, Modal, v.v.) | [Ant Design](https://ant.design/components/overview/) |
| `ctx.libs.antdIcons` | Thư viện icon Ant Design (như PlusOutlined, UserOutlined) | [@ant-design/icons](https://ant.design/components/icon/) |
| `ctx.libs.dayjs` | Thư viện tiện ích ngày giờ | [dayjs](https://day.js.org/) |
| `ctx.libs.lodash` | Thư viện tiện ích (get, set, debounce, v.v.) | [Lodash](https://lodash.com/docs/) |
| `ctx.libs.formula` | Thư viện hàm công thức kiểu Excel (SUM, AVERAGE, IF, v.v.) | [Formula.js](https://formulajs.info/functions/) |
| `ctx.libs.math` | Thư viện tính toán và biểu thức toán học | [Math.js](https://mathjs.org/docs/) |

## Bí danh cấp cao nhất

Để tương thích với mã nguồn cũ, một số thư viện cũng được cung cấp ở cấp cao nhất: `ctx.React`, `ctx.ReactDOM`, `ctx.antd`, `ctx.dayjs`. **Khuyến nghị sử dụng thống nhất `ctx.libs.xxx`** để dễ dàng bảo trì và tra cứu tài liệu.

## Tải chậm (Lazy Loading)

`lodash`, `formula`, và `math` áp dụng cơ chế **tải chậm (lazy loading)**: chỉ khi truy cập `ctx.libs.lodash` lần đầu tiên mới thực hiện dynamic import, sau đó sẽ sử dụng lại bộ nhớ đệm (cache). `React`, `antd`, `dayjs`, và `antdIcons` được thiết lập sẵn bởi ngữ cảnh (context) và có thể sử dụng ngay lập tức.

## Ví dụ

### Render với React và Ant Design

```tsx
const { Button, Card } = ctx.libs.antd;

ctx.render(
  <Card title="Tiêu đề">
    <Button type="primary">Nhấp vào</Button>
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

### Sử dụng Icon

```tsx
const { Button } = ctx.libs.antd;
const { UserOutlined, HeartOutlined } = ctx.libs.antdIcons;

ctx.render(<Button icon={<UserOutlined />}>Người dùng</Button>);
```

### Xử lý ngày tháng với dayjs

```ts
const now = ctx.libs.dayjs();
const formatted = now.format('YYYY-MM-DD HH:mm:ss');
ctx.message.info(formatted);
```

### Hàm tiện ích với lodash

```ts
const user = { profile: { name: 'Alice' } };
const name = ctx.libs.lodash.get(user, 'profile.name', 'Không xác định');
```

### Tính toán công thức

```ts
const values = [1, 2, 3, 4];
const sum = ctx.libs.formula.SUM(values);
const avg = ctx.libs.formula.AVERAGE(values);
```

### Biểu thức toán học với math.js

```ts
const result = ctx.libs.math.evaluate('2 + 3 * 4');
// result === 14
```

## Lưu ý

- **Sử dụng kết hợp với ctx.importAsync**: Nếu tải React bên ngoài thông qua `ctx.importAsync('react@19')`, JSX sẽ sử dụng instance đó; lúc này **không được** dùng chung với `ctx.libs.antd`. Ant Design cần được tải tương ứng với phiên bản React đó (ví dụ: `ctx.importAsync('antd@5.x')`, `ctx.importAsync('@ant-design/icons@5.x')`).
- **Nhiều instance React**: Nếu xuất hiện lỗi "Invalid hook call" hoặc hook dispatcher là null, thường là do có nhiều instance React. Trước khi đọc `ctx.libs.React` hoặc gọi Hooks, hãy thực thi `await ctx.importAsync('react@phiên bản')` để đảm bảo dùng chung một instance React với trang hiện tại.

## Liên quan

- [ctx.importAsync()](./import-async.md) - Tải các module ESM bên ngoài theo nhu cầu (ví dụ: các phiên bản cụ thể của React, Vue)
- [ctx.render()](./render.md) - Render nội dung vào container