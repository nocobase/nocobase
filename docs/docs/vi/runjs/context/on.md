---
title: "ctx.on()"
description: "ctx.on() lắng nghe sự kiện block hoặc form, như valuesChange, submit, dùng cho liên kết, validate, logic tùy chỉnh."
keywords: "ctx.on,lắng nghe sự kiện,valuesChange,submit,liên kết form,RunJS,NocoBase"
---

# ctx.on()

Đăng ký sự kiện ngữ cảnh trong RunJS (như thay đổi giá trị field, thay đổi thuộc tính, refresh resource, v.v.). Sự kiện sẽ được map theo kiểu vào sự kiện DOM tùy chỉnh trên `ctx.element` hoặc event bus nội bộ của `ctx.resource`.

## Kịch bản áp dụng

| Kịch bản | Mô tả |
|------|------|
| **JSField / JSEditableField** | Lắng nghe khi giá trị field bị thay đổi từ bên ngoài (form, liên kết, v.v.) để đồng bộ cập nhật UI, thực hiện two-way binding |
| **JSBlock / JSItem / JSColumn** | Lắng nghe sự kiện tùy chỉnh trên container, phản hồi thay đổi dữ liệu hoặc trạng thái |
| **Liên quan đến resource** | Lắng nghe các sự kiện vòng đời như refresh resource, save, thực thi logic sau khi dữ liệu cập nhật |

## Định nghĩa kiểu

```ts
on(eventName: string, handler: (event?: any) => void): void;
```

## Sự kiện thường gặp

| Tên sự kiện | Mô tả | Nguồn sự kiện |
|--------|------|----------|
| `js-field:value-change` | Giá trị field bị sửa từ bên ngoài (như liên kết form, cập nhật giá trị mặc định) | CustomEvent trên `ctx.element`, `ev.detail` là giá trị mới |
| `resource:refresh` | Dữ liệu resource đã được refresh | Event bus của `ctx.resource` |
| `resource:saved` | Resource đã save xong | Event bus của `ctx.resource` |

> Quy tắc map sự kiện cuối cùng: prefix `resource:` đi qua `ctx.resource.on`, các loại khác thường đi qua sự kiện DOM trên `ctx.element` (nếu tồn tại).

## Ví dụ

### Two-way binding field (React useEffect + cleanup)

```tsx
React.useEffect(() => {
  const handler = (ev) => setValue(ev?.detail ?? '');
  ctx.on?.('js-field:value-change', handler);
  return () => {
    ctx.off?.('js-field:value-change', handler);
  };
}, []);
```

### Lắng nghe DOM gốc (thay thế khi ctx.on không khả dụng)

```ts
// 当 ctx.on 未提供时，可直接使用 ctx.element
const handler = (ev) => {
  if (selectEl) selectEl.value = String(ev?.detail ?? '');
};
ctx.element?.addEventListener('js-field:value-change', handler);
// 清理时：ctx.element?.removeEventListener('js-field:value-change', handler);
```

### Cập nhật UI sau khi resource refresh

```ts
ctx.resource?.on('refresh', () => {
  const data = ctx.resource?.getData?.();
  // 根据 data 更新渲染
});
```

## Phối hợp với ctx.off

- Listener đã đăng ký bằng `ctx.on` nên được loại bỏ qua [ctx.off](./off.md) vào thời điểm thích hợp để tránh memory leak hoặc trigger trùng lặp.
- Trong React, thường gọi `ctx.off` trong hàm cleanup của `useEffect`.
- `ctx.off` có thể không tồn tại, khi sử dụng khuyến nghị thêm optional chaining: `ctx.off?.('eventName', handler)`.

## Lưu ý

1. **Hủy theo cặp**: Mỗi lần `ctx.on(eventName, handler)` đều phải có `ctx.off(eventName, handler)` tương ứng, và tham chiếu `handler` được truyền vào phải nhất quán.
2. **Vòng đời**: Loại bỏ listener trước khi component unmount hoặc context bị hủy, nếu không có thể dẫn đến memory leak.
3. **Tính khả dụng của sự kiện**: Các loại context khác nhau hỗ trợ các sự kiện khác nhau, cụ thể tham khảo tài liệu của từng component.

## Tài liệu liên quan

- [ctx.off](./off.md) - Loại bỏ event listener
- [ctx.element](./element.md) - Container render và sự kiện DOM
- [ctx.resource](./resource.md) - Instance resource và `on`/`off` của nó
- [ctx.setValue](./set-value.md) - Đặt giá trị field (sẽ trigger `js-field:value-change`)
