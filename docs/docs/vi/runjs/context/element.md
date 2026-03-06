:::tip{title="Thông báo dịch bằng AI"}
Tài liệu này được dịch bằng AI. Để biết thông tin chính xác, vui lòng tham khảo [phiên bản tiếng Anh](/runjs/context/element).
:::

# ctx.element

Một instance `ElementProxy` trỏ đến container DOM của sandbox, đóng vai trò là mục tiêu kết xuất (rendering target) mặc định cho `ctx.render()`. Nó khả dụng trong các ngữ cảnh có container kết xuất như `JSBlock`, `JSField`, `JSItem`, `JSColumn`, v.v.

## Các kịch bản áp dụng

| Kịch bản | Mô tả |
|------|------|
| **JSBlock** | Container DOM của khối (block), dùng để kết xuất nội dung tùy chỉnh của khối. |
| **JSField / JSItem / FormJSFieldItem** | Container kết xuất của trường hoặc item biểu mẫu (thường là `<span>`). |
| **JSColumn** | Container DOM của ô trong bảng, dùng để kết xuất nội dung cột tùy chỉnh. |

> Lưu ý: `ctx.element` chỉ khả dụng trong ngữ cảnh RunJS có container kết xuất. Trong các ngữ cảnh không có giao diện người dùng (như logic thuần backend), nó có thể là `undefined`. Khuyến nghị kiểm tra giá trị trước khi sử dụng.

## Định nghĩa kiểu

```typescript
element: ElementProxy | undefined;

// ElementProxy là một proxy cho HTMLElement gốc, cung cấp các API an toàn
class ElementProxy {
  __el: HTMLElement;  // Phần tử DOM gốc bên trong (chỉ truy cập trong một số trường hợp cụ thể)
  innerHTML: string;  // Được làm sạch qua DOMPurify khi đọc/ghi
  outerHTML: string; // Tương tự như trên
  appendChild(child: HTMLElement | string): void;
  // Các phương thức HTMLElement khác được chuyển tiếp (không khuyến khích sử dụng trực tiếp)
}
```

## Yêu cầu bảo mật

**Khuyến nghị: Tất cả việc kết xuất nên được thực hiện qua `ctx.render()`.** Tránh sử dụng trực tiếp các API DOM của `ctx.element` (như `innerHTML`, `appendChild`, `querySelector`, v.v.).

### Tại sao nên sử dụng ctx.render()

| Ưu điểm | Mô tả |
|------|------|
| **An toàn** | Kiểm soát bảo mật tập trung, tránh XSS và các thao tác DOM không đúng cách. |
| **Hỗ trợ React** | Hỗ trợ đầy đủ JSX, các component React và vòng đời (lifecycle). |
| **Kế thừa ngữ cảnh** | Tự động kế thừa `ConfigProvider`, chủ đề (theme), v.v. của ứng dụng. |
| **Xử lý xung đột** | Tự động quản lý việc tạo/hủy React root để tránh xung đột đa instance. |

### ❌ Không khuyến nghị: Thao tác trực tiếp trên ctx.element

```ts
// ❌ Không khuyến nghị: Sử dụng trực tiếp các API của ctx.element
ctx.element.innerHTML = '<div>Nội dung</div>';
ctx.element.appendChild(node);
ctx.element.querySelector('.class');
```

> `ctx.element.innerHTML` đã bị loại bỏ (deprecated), vui lòng sử dụng `ctx.render()` để thay thế.

### ✅ Khuyến nghị: Sử dụng ctx.render()

```ts
// ✅ Kết xuất component React
const { Button, Card } = ctx.libs.antd;
ctx.render(
  <Card title={ctx.t('Chào mừng')}>
    <Button type="primary">Nhấp vào đây</Button>
  </Card>
);

// ✅ Kết xuất chuỗi HTML
ctx.render('<div style="padding:16px;">' + ctx.t('Nội dung') + '</div>');

// ✅ Kết xuất node DOM
const div = document.createElement('div');
div.textContent = ctx.t('Xin chào');
ctx.render(div);
```

## Trường hợp đặc biệt: Làm điểm neo cho Popover

Khi bạn cần mở một Popover lấy phần tử hiện tại làm điểm neo (anchor), bạn có thể truy cập `ctx.element?.__el` để lấy DOM gốc làm `target`:

```ts
// ctx.viewer.popover yêu cầu một DOM gốc làm target
await ctx.viewer.popover({
  target: ctx.element?.__el,
  content: <div>Nội dung hiển thị</div>,
});
```

> Chỉ sử dụng `__el` trong các trường hợp như "sử dụng container hiện tại làm điểm neo"; không thao tác trực tiếp trên DOM trong các trường hợp khác.

## Quan hệ với ctx.render

- Nếu `ctx.render(vnode)` được gọi mà không có đối số `container`, nó sẽ mặc định kết xuất vào container `ctx.element`.
- Nếu thiếu cả `ctx.element` và không cung cấp `container`, một lỗi sẽ được ném ra.
- Bạn có thể chỉ định rõ ràng một container: `ctx.render(vnode, customContainer)`.

## Lưu ý

- `ctx.element` chỉ được sử dụng làm container nội bộ cho `ctx.render()`. Việc truy cập hoặc sửa đổi trực tiếp các thuộc tính/phương thức của nó là không được khuyến khích.
- Trong các ngữ cảnh không có container kết xuất, `ctx.element` sẽ là `undefined`. Hãy đảm bảo container khả dụng hoặc truyền `container` thủ công trước khi gọi `ctx.render()`.
- Mặc dù `innerHTML`/`outerHTML` trong `ElementProxy` đã được làm sạch qua DOMPurify, vẫn khuyến nghị sử dụng `ctx.render()` để quản lý kết xuất thống nhất.

## Liên quan

- [ctx.render](./render.md): Kết xuất nội dung vào container
- [ctx.view](./view.md): Bộ điều khiển view hiện tại
- [ctx.modal](./modal.md): API nhanh cho modal