:::tip{title="Thông báo dịch bằng AI"}
Tài liệu này được dịch bằng AI. Để biết thông tin chính xác, vui lòng tham khảo [phiên bản tiếng Anh](/runjs/context/off).
:::

# ctx.off()

Gỡ bỏ các trình lắng nghe sự kiện đã được đăng ký thông qua `ctx.on(eventName, handler)`. Phương thức này thường được sử dụng kết hợp với [ctx.on](./on.md) để hủy đăng ký vào thời điểm thích hợp, nhằm tránh rò rỉ bộ nhớ hoặc kích hoạt lặp lại.

## Các trường hợp sử dụng

| Kịch bản | Mô tả |
|------|------|
| **Dọn dẹp trong React useEffect** | Được gọi trong hàm cleanup của `useEffect` để gỡ bỏ trình lắng nghe khi component bị gỡ bỏ (unmount). |
| **JSField / JSEditableField** | Hủy đăng ký sự kiện `js-field:value-change` khi thực hiện ràng buộc dữ liệu hai chiều cho trường dữ liệu. |
| **Liên quan đến resource** | Hủy đăng ký các trình lắng nghe như `refresh`, `saved` đã được đăng ký qua `ctx.resource.on`. |

## Định nghĩa kiểu

```ts
off(eventName: string, handler: (event?: any) => void): void;
```

## Ví dụ

### Sử dụng kết hợp trong React useEffect

```tsx
React.useEffect(() => {
  const handler = (ev) => setValue(ev?.detail ?? '');
  ctx.on('js-field:value-change', handler);
  return () => ctx.off('js-field:value-change', handler);
}, []);
```

### Hủy đăng ký sự kiện tài nguyên (resource)

```ts
const handler = () => { /* ... */ };
ctx.resource?.on('refresh', handler);
// Tại thời điểm thích hợp
ctx.resource?.off('refresh', handler);
```

## Lưu ý

1. **Tham chiếu handler đồng nhất**: `handler` được truyền vào `ctx.off` phải là cùng một tham chiếu với `handler` đã sử dụng trong `ctx.on`, nếu không sẽ không thể gỡ bỏ chính xác.
2. **Dọn dẹp kịp thời**: Gọi `ctx.off` trước khi component bị gỡ bỏ hoặc context bị hủy để tránh rò rỉ bộ nhớ.

## Tài liệu liên quan

- [ctx.on](./on.md) - Đăng ký sự kiện
- [ctx.resource](./resource.md) - Thực thể tài nguyên và các phương thức `on`/`off` của nó