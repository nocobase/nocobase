:::tip{title="Thông báo dịch bằng AI"}
Tài liệu này được dịch bằng AI. Để biết thông tin chính xác, vui lòng tham khảo [phiên bản tiếng Anh](/runjs/jsx).
:::

# JSX

RunJS hỗ trợ cú pháp JSX, cho phép bạn viết mã tương tự như các thành phần React. JSX sẽ được biên dịch tự động trước khi thực thi.

## Lưu ý về biên dịch

- Sử dụng [sucrase](https://github.com/alangpierce/sucrase) để chuyển đổi JSX.
- JSX sẽ được biên dịch thành `ctx.libs.React.createElement` và `ctx.libs.React.Fragment`.
- **Không cần import React**: Bạn có thể viết trực tiếp JSX; sau khi biên dịch, nó sẽ tự động sử dụng `ctx.libs.React`.
- Khi tải React bên ngoài thông qua `ctx.importAsync('react@x.x.x')`, JSX sẽ chuyển sang sử dụng phương thức `createElement` từ instance cụ thể đó.

## Sử dụng React và các thành phần tích hợp sẵn

RunJS tích hợp sẵn React và các thư viện UI phổ biến. Bạn có thể truy cập chúng trực tiếp thông qua `ctx.libs` mà không cần sử dụng `import`:

- **ctx.libs.React** — React core
- **ctx.libs.ReactDOM** — ReactDOM (có thể sử dụng cùng với `createRoot` nếu cần)
- **ctx.libs.antd** — Các thành phần Ant Design
- **ctx.libs.antdIcons** — Các biểu tượng Ant Design

```tsx
const { Button } = ctx.libs.antd;

ctx.render(<Button>Nhấp vào đây</Button>);
```

Khi viết JSX trực tiếp, bạn không cần giải cấu trúc (destructure) React. Bạn chỉ cần giải cấu trúc từ `ctx.libs` khi sử dụng **Hooks** (như `useState`, `useEffect`) hoặc **Fragment** (`<>...</>`):

```tsx
const { React } = ctx.libs;
const { useState } = React;

const Counter = () => {
  const [count, setCount] = useState(0);
  return <div>Count: {count}</div>;
};

ctx.render(<Counter />);
```

**Lưu ý**: React tích hợp sẵn và React bên ngoài được nhập qua `ctx.importAsync()` **không thể dùng lẫn lộn**. Nếu bạn sử dụng một thư viện UI bên ngoài, React cũng phải được nhập từ cùng một nguồn bên ngoài đó.

## Sử dụng React và các thành phần bên ngoài

Khi tải một phiên bản React và thư viện UI cụ thể thông qua `ctx.importAsync()`, JSX sẽ sử dụng instance React đó:

```tsx
const React = await ctx.importAsync('react@19.2.4');
const { Button } = await ctx.importAsync('antd@6.2.2?bundle');

ctx.render(<Button>Nhấp vào đây</Button>);
```

Nếu antd phụ thuộc vào react/react-dom, bạn có thể chỉ định cùng một phiên bản thông qua `deps` để tránh việc tạo nhiều instance:

```tsx
const React = await ctx.importAsync('react@18.2.0');
const { Button } = await ctx.importAsync('antd@5.29.3?bundle&deps=react@18.2.0,react-dom@18.2.0');

ctx.render(<Button>Button</Button>);
```

**Lưu ý**: Khi sử dụng React bên ngoài, các thư viện UI như antd cũng phải được nhập thông qua `ctx.importAsync()`. Không dùng lẫn lộn chúng với `ctx.libs.antd`.

## Các điểm chính về cú pháp JSX

- **Thành phần (Component) và props**: `<Button type="primary">Văn bản</Button>`
- **Fragment**: `<>...</>` hoặc `<React.Fragment>...</React.Fragment>` (yêu cầu giải cấu trúc `const { React } = ctx.libs` khi sử dụng Fragment)
- **Biểu thức**: Sử dụng `{biểu thức}` trong JSX để chèn các biến hoặc phép toán, ví dụ `{ctx.user.name}` hoặc `{count + 1}`. Không sử dụng cú pháp template `{{ }}`.
- **Render có điều kiện**: `{flag && <span>Nội dung</span>}` hoặc `{flag ? <A /> : <B />}`
- **Render danh sách**: Sử dụng `array.map()` để trả về một danh sách các phần tử và đảm bảo mỗi phần tử có một `key` ổn định.

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