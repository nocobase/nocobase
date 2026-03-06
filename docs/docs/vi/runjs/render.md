:::tip{title="Thông báo dịch bằng AI"}
Tài liệu này được dịch bằng AI. Để biết thông tin chính xác, vui lòng tham khảo [phiên bản tiếng Anh](/runjs/render).
:::

# Render trong container

Sử dụng `ctx.render()` để render nội dung vào container hiện tại (`ctx.element`), hỗ trợ ba hình thức sau:

## `ctx.render()`

### Render JSX

```jsx
ctx.render(<button>Button</button>);
```

### Render các nút DOM

```js
const div = document.createElement('div');
div.innerHTML = 'Hello World';
ctx.render(div);
```

### Render chuỗi HTML

```js
ctx.render('<h1>Hello World</h1>');
```

## Mô tả về JSX

RunJS có thể render trực tiếp JSX, bạn có thể sử dụng React/thư viện component tích hợp sẵn hoặc tải các phụ thuộc bên ngoài theo nhu cầu.

### Sử dụng React và thư viện component tích hợp sẵn

```jsx
const { Button } = ctx.libs.antd;

ctx.render(<Button>Click</Button>);
```

### Sử dụng React và thư viện component bên ngoài

Tải các phiên bản cụ thể theo nhu cầu thông qua `ctx.importAsync()`:

```jsx
const React = await ctx.importAsync('react@19.2.4');
const { Button } = await ctx.importAsync('antd@6.2.2?bundle');

ctx.render(<Button>Click</Button>);
```

Phù hợp cho các trường hợp yêu cầu phiên bản cụ thể hoặc các component từ bên thứ ba.

## ctx.element

Cách dùng không được khuyến khích (đã lỗi thời):

```js
ctx.element.innerHTML = '<h1>Hello World</h1>';
```

Cách dùng được khuyến khích:

```js
ctx.render(<h1>Hello World</h1>);
```