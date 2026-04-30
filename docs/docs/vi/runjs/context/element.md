---
title: "ctx.element"
description: "ctx.element là DOM container node được render bởi RunJS hiện tại, ctx.render() mặc định render vào đây, dùng cho JSBlock, JSField, v.v."
keywords: "ctx.element,DOM container,ctx.render,JSBlock,JSField,RunJS,NocoBase"
---

# ctx.element

Instance ElementProxy trỏ đến DOM container của sandbox, là target render mặc định của `ctx.render()`. Khả dụng trong các kịch bản có container render như JSBlock, JSField, JSItem, JSColumn.

## Kịch bản áp dụng

| Kịch bản | Mô tả |
|------|------|
| **JSBlock** | DOM container của block, render nội dung tùy chỉnh của block |
| **JSField / JSItem / FormJSFieldItem** | Container render của field/item form (thường là `<span>`) |
| **JSColumn** | DOM container của ô trong table, render nội dung column tùy chỉnh |

> Lưu ý: `ctx.element` chỉ khả dụng trong ngữ cảnh RunJS có container render; trong các kịch bản không có ngữ cảnh UI (như logic backend thuần) có thể là `undefined`, khuyến nghị kiểm tra null trước khi sử dụng.

## Định nghĩa kiểu

```typescript
element: ElementProxy | undefined;

// ElementProxy 对原始 HTMLElement 的代理，对外暴露安全 API
class ElementProxy {
  __el: HTMLElement;  // 内部持有的原生 DOM 元素（仅个别场景需访问）
  innerHTML: string;  // 读写时经 DOMPurify 清洗
  outerHTML: string; // 同上
  appendChild(child: HTMLElement | string): void;
  // 其他 HTMLElement 方法透传（不推荐直接使用）
}
```

## Yêu cầu bảo mật

**Khuyến nghị: tất cả render được thực hiện qua `ctx.render()`.** Không sử dụng trực tiếp DOM API của `ctx.element` (như `innerHTML`, `appendChild`, `querySelector`, v.v.).

### Tại sao khuyến nghị ctx.render()

| Ưu điểm | Mô tả |
|------|------|
| **An toàn** | Kiểm soát bảo mật tập trung, tránh XSS và thao tác DOM không phù hợp |
| **Hỗ trợ React** | Hỗ trợ đầy đủ JSX, React component và lifecycle |
| **Kế thừa ngữ cảnh** | Tự động kế thừa ConfigProvider, theme của ứng dụng, v.v. |
| **Xử lý xung đột** | Tự động quản lý tạo/unmount React root, tránh xung đột nhiều instance |

### Không khuyến nghị: thao tác trực tiếp ctx.element

```ts
// ❌ Không khuyến nghị: dùng trực tiếp API của ctx.element
ctx.element.innerHTML = '<div>内容</div>';
ctx.element.appendChild(node);
ctx.element.querySelector('.class');
```

> `ctx.element.innerHTML` đã deprecated, hãy sử dụng `ctx.render()` thay thế.

### Khuyến nghị: sử dụng ctx.render()

```ts
// ✅ 渲染 React 组件
const { Button, Card } = ctx.libs.antd;
ctx.render(
  <Card title={ctx.t('欢迎')}>
    <Button type="primary">点击</Button>
  </Card>
);

// ✅ 渲染 HTML 字符串
ctx.render('<div style="padding:16px;">' + ctx.t('内容') + '</div>');

// ✅ 渲染 DOM 节点
const div = document.createElement('div');
div.textContent = ctx.t('你好');
ctx.render(div);
```

## Trường hợp đặc biệt: làm anchor cho popover

Khi cần mở Popover với element hiện tại làm anchor, có thể truy cập `ctx.element?.__el` để lấy DOM gốc làm `target`:

```ts
// ctx.viewer.popover 需要原生 DOM 作为 target
await ctx.viewer.popover({
  target: ctx.element?.__el,
  content: <div>弹出内容</div>,
});
```

> Chỉ sử dụng `__el` trong các kịch bản "lấy container hiện tại làm anchor" như thế này; các trường hợp khác xin đừng thao tác DOM trực tiếp.

## Quan hệ với ctx.render

- Nếu `ctx.render(vnode)` không truyền `container`, mặc định render vào container `ctx.element`
- Nếu cùng lúc không có `ctx.element` và không truyền `container`, sẽ ném lỗi
- Có thể chỉ định container rõ ràng: `ctx.render(vnode, customContainer)`

## Lưu ý

- `ctx.element` chỉ được sử dụng làm container nội bộ của `ctx.render()`, không khuyến nghị truy cập hoặc sửa thuộc tính/phương thức của nó trực tiếp
- Trong ngữ cảnh không có container render, `ctx.element` là `undefined`, trước khi gọi `ctx.render()` cần đảm bảo container khả dụng hoặc truyền `container` thủ công
- Mặc dù `innerHTML`/`outerHTML` của ElementProxy đã được DOMPurify làm sạch, vẫn khuyến nghị sử dụng `ctx.render()` để quản lý render thống nhất

## Liên quan

- [ctx.render](./render.md): Render nội dung vào container
- [ctx.view](./view.md): Bộ điều khiển view hiện tại
- [ctx.modal](./modal.md): API tắt cho modal
