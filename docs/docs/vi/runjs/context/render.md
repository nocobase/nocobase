---
title: "ctx.render()"
description: "ctx.render() render React element, chuỗi HTML hoặc DOM vào ctx.element, tự động kế thừa ConfigProvider, theme, dùng cho JSBlock, JSField, v.v."
keywords: "ctx.render,React,JSX,ctx.element,ConfigProvider,JSBlock,JSField,RunJS,NocoBase"
---

# ctx.render()

Render React element, chuỗi HTML hoặc DOM node vào container chỉ định. Khi không truyền `container`, mặc định render vào `ctx.element` và tự động kế thừa ConfigProvider, theme và các ngữ cảnh khác của ứng dụng.

## Kịch bản áp dụng

| Kịch bản | Mô tả |
|------|------|
| **JSBlock** | Render nội dung tùy chỉnh của block (chart, list, card, v.v.) |
| **JSField / JSItem / JSColumn** | Render hiển thị tùy chỉnh của field có thể chỉnh sửa hoặc column của table |
| **Block chi tiết** | Tùy chỉnh hình thức hiển thị của field trang chi tiết |

> Lưu ý: `ctx.render()` cần container render. Nếu không truyền `container` và `ctx.element` không tồn tại (như trong kịch bản logic thuần không có UI), sẽ ném lỗi.

## Định nghĩa kiểu

```ts
render(
  vnode: React.ReactElement | Node | DocumentFragment | string,
  container?: Element | DocumentFragment
): ReactDOMClient.Root | null;
```

| Tham số | Kiểu | Mô tả |
|------|------|------|
| `vnode` | `React.ReactElement` \| `Node` \| `DocumentFragment` \| `string` | Nội dung cần render |
| `container` | `Element` \| `DocumentFragment` (tùy chọn) | Container đích render, mặc định `ctx.element` |

**Giá trị trả về**:

- Khi render **React element**: trả về `ReactDOMClient.Root`, tiện cho việc gọi `root.render()` để cập nhật sau đó
- Khi render **chuỗi HTML** hoặc **DOM node**: trả về `null`

## Giải thích về kiểu vnode

| Kiểu | Hành vi |
|------|------|
| `React.ReactElement` (JSX) | Sử dụng `createRoot` của React để render, có khả năng React đầy đủ, tự động kế thừa ngữ cảnh ứng dụng |
| `string` | Sau khi DOMPurify làm sạch, đặt `innerHTML` của container, sẽ unmount React root hiện có trước |
| `Node` (Element, Text, v.v.) | Xóa container rồi `appendChild` thêm vào, sẽ unmount React root hiện có trước |
| `DocumentFragment` | Các node con của fragment được thêm vào container, sẽ unmount React root hiện có trước |

## Ví dụ

### Render React element (JSX)

```tsx
const { Button, Card } = ctx.libs.antd;

ctx.render(
  <Card title={ctx.t('标题')}>
    <Button type="primary" onClick={() => ctx.message.success(ctx.t('点击了'))}>
      {ctx.t('按钮')}
    </Button>
  </Card>
);
```

### Render chuỗi HTML

```ts
ctx.render('<h1>Hello World</h1>');

// 结合 ctx.t 做国际化
ctx.render('<div style="padding:16px">' + ctx.t('内容') + '</div>');

// 条件渲染
ctx.render(hasData ? `<ul>${items.map(i => `<li>${i}</li>`).join('')}</ul>` : '<span style="color:#999">' + ctx.t('No data') + '</span>');
```

### Render DOM node

```ts
const div = document.createElement('div');
div.textContent = 'Hello World';
ctx.render(div);

// 先渲染空容器，再交给第三方库（如 ECharts）初始化
const container = document.createElement('div');
container.style.width = '100%';
container.style.height = '400px';
ctx.render(container);
const chart = echarts.init(container);
chart.setOption({ ... });
```

### Chỉ định container tùy chỉnh

```ts
// 渲染到指定 DOM 元素
const customEl = document.getElementById('my-container');
ctx.render(<div>内容</div>, customEl);
```

### Gọi nhiều lần sẽ thay thế nội dung

```ts
// 第二次调用会替换容器内已有内容
ctx.render(<div>第一次</div>);
ctx.render(<div>第二次</div>);  // 仅显示「第二次」
```

## Lưu ý

- **Gọi nhiều lần sẽ thay thế**: Mỗi lần `ctx.render()` sẽ thay thế nội dung hiện có trong container, không append.
- **An toàn chuỗi HTML**: HTML truyền vào sẽ được DOMPurify làm sạch, giảm rủi ro XSS, nhưng vẫn khuyến nghị tránh nối input không tin cậy của người dùng.
- **Không thao tác trực tiếp ctx.element**: `ctx.element.innerHTML` đã deprecated, nên sử dụng đồng nhất `ctx.render()`.
- **Khi không có container cần truyền container**: Trong kịch bản `ctx.element` là `undefined` (như trong module được tải bởi `ctx.importAsync`), cần truyền `container` rõ ràng.

## Liên quan

- [ctx.element](./element.md) - Container render mặc định, sử dụng khi `ctx.render()` không truyền container
- [ctx.libs](./libs.md) - Thư viện có sẵn như React, antd, dùng cho render JSX
- [ctx.importAsync()](./import-async.md) - Sau khi tải React/thư viện component bên ngoài theo nhu cầu, dùng kết hợp với `ctx.render()`
