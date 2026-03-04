:::tip{title="Thông báo dịch bằng AI"}
Tài liệu này được dịch bằng AI. Để biết thông tin chính xác, vui lòng tham khảo [phiên bản tiếng Anh](/runjs/context/on).
:::

# ctx.on()

Đăng ký các sự kiện ngữ cảnh (như thay đổi giá trị trường, thay đổi thuộc tính, làm mới tài nguyên, v.v.) trong RunJS. Các sự kiện sẽ được ánh xạ tới các sự kiện DOM tùy chỉnh trên `ctx.element` hoặc bus sự kiện nội bộ của `ctx.resource` dựa trên loại của chúng.

## Tình huống sử dụng

| Tình huống | Mô tả |
|------|------|
| **JSField / JSEditableField** | Lắng nghe thay đổi giá trị trường từ bên ngoài (biểu mẫu, liên kết, v.v.) để cập nhật UI đồng bộ, thực hiện liên kết hai chiều (two-way binding). |
| **JSBlock / JSItem / JSColumn** | Lắng nghe các sự kiện tùy chỉnh trên container để phản hồi các thay đổi về dữ liệu hoặc trạng thái. |
| **Liên quan đến resource** | Lắng nghe các sự kiện vòng đời của tài nguyên như làm mới, lưu, v.v., để thực thi logic sau khi dữ liệu được cập nhật. |

## Định nghĩa kiểu

```ts
on(eventName: string, handler: (event?: any) => void): void;
```

## Các sự kiện thường gặp

| Tên sự kiện | Mô tả | Nguồn sự kiện |
|--------|------|----------|
| `js-field:value-change` | Giá trị trường bị sửa đổi từ bên ngoài (ví dụ: liên kết biểu mẫu, cập nhật giá trị mặc định) | CustomEvent trên `ctx.element`, với `ev.detail` là giá trị mới |
| `resource:refresh` | Dữ liệu tài nguyên đã được làm mới | Bus sự kiện `ctx.resource` |
| `resource:saved` | Hoàn tất việc lưu tài nguyên | Bus sự kiện `ctx.resource` |

> Quy tắc ánh xạ sự kiện: Các sự kiện có tiền tố `resource:` sẽ đi qua `ctx.resource.on`, các sự kiện khác thường đi qua các sự kiện DOM trên `ctx.element` (nếu tồn tại).

## Ví dụ

### Liên kết hai chiều cho trường (React useEffect + Cleanup)

```tsx
React.useEffect(() => {
  const handler = (ev) => setValue(ev?.detail ?? '');
  ctx.on?.('js-field:value-change', handler);
  return () => {
    ctx.off?.('js-field:value-change', handler);
  };
}, []);
```

### Lắng nghe DOM gốc (Thay thế khi ctx.on không khả dụng)

```ts
// Khi ctx.on không được cung cấp, bạn có thể sử dụng trực tiếp ctx.element
const handler = (ev) => {
  if (selectEl) selectEl.value = String(ev?.detail ?? '');
};
ctx.element?.addEventListener('js-field:value-change', handler);
// Khi dọn dẹp: ctx.element?.removeEventListener('js-field:value-change', handler);
```

### Cập nhật UI sau khi làm mới tài nguyên

```ts
ctx.resource?.on('refresh', () => {
  const data = ctx.resource?.getData?.();
  // Cập nhật hiển thị dựa trên data
});
```

## Phối hợp với ctx.off

- Các trình lắng nghe được đăng ký bằng `ctx.on` nên được gỡ bỏ vào thời điểm thích hợp thông qua [ctx.off](./off.md) để tránh rò rỉ bộ nhớ hoặc kích hoạt lặp lại.
- Trong React, `ctx.off` thường được gọi trong hàm cleanup của `useEffect`.
- `ctx.off` có thể không tồn tại; khuyến nghị sử dụng optional chaining: `ctx.off?.('eventName', handler)`.

## Lưu ý

1. **Hủy đăng ký theo cặp**: Mỗi `ctx.on(eventName, handler)` phải có một `ctx.off(eventName, handler)` tương ứng, và tham chiếu `handler` được truyền vào phải giống hệt nhau.
2. **Vòng đời**: Gỡ bỏ trình lắng nghe trước khi component bị gỡ bỏ (unmount) hoặc context bị hủy để ngăn chặn rò rỉ bộ nhớ.
3. **Tính khả dụng của sự kiện**: Các loại context khác nhau hỗ trợ các sự kiện khác nhau, vui lòng tham khảo tài liệu của từng thành phần cụ thể.

## Tài liệu liên quan

- [ctx.off](./off.md) - Gỡ bỏ trình lắng nghe sự kiện
- [ctx.element](./element.md) - Container hiển thị và sự kiện DOM
- [ctx.resource](./resource.md) - Thực thể tài nguyên và các phương thức `on`/`off` của nó
- [ctx.setValue](./set-value.md) - Thiết lập giá trị trường (sẽ kích hoạt `js-field:value-change`)