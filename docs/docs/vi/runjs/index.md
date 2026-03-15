:::tip{title="Thông báo dịch bằng AI"}
Tài liệu này được dịch bằng AI. Để biết thông tin chính xác, vui lòng tham khảo [phiên bản tiếng Anh](/runjs/index).
:::

# Tổng quan về RunJS

RunJS là môi trường thực thi JavaScript được sử dụng trong NocoBase cho các trường hợp như **JS Block**, **JS Field**, và **JS Action**. Mã nguồn chạy trong một sandbox bị giới hạn, cho phép truy cập an toàn vào `ctx` (Context API) và sở hữu các khả năng sau:

- `await` ở cấp cao nhất (Top-level `await`)
- Nhập các module bên ngoài
- Hiển thị bên trong container
- Biến toàn cục

## `await` ở cấp cao nhất (Top-level `await`)

RunJS hỗ trợ `await` ở cấp cao nhất, không cần phải bao bọc trong IIFE.

**Không khuyến khích**

```jsx
async function test() {}
(async () => {
  await test();
})();
```

**Khuyến khích**

```js
async function test() {}
await test();
```

## Nhập các module bên ngoài

- Sử dụng `ctx.importAsync()` cho các module ESM (Khuyến khích)
- Sử dụng `ctx.requireAsync()` cho các module UMD/AMD

## Hiển thị bên trong container

Sử dụng `ctx.render()` để hiển thị nội dung vào container hiện tại (`ctx.element`), hỗ trợ ba định dạng sau:

### Hiển thị JSX

```jsx
ctx.render(<button>Button</button>);
```

### Hiển thị các nút DOM

```js
const div = document.createElement('div');
div.innerHTML = 'Hello World';

ctx.render(div);
```

### Hiển thị chuỗi HTML

```js
ctx.render('<h1>Hello World</h1>');
```

## Biến toàn cục

- `window`
- `document`
- `navigator`
- `ctx`