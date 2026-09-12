---
title: "ctx.off()"
description: "ctx.off() loại bỏ event listener đã đăng ký bằng ctx.on(), dùng để dọn dẹp, tránh lắng nghe trùng lặp."
keywords: "ctx.off,ctx.on,lắng nghe sự kiện,loại bỏ lắng nghe,RunJS,NocoBase"
---

# ctx.off()

Loại bỏ event listener đã đăng ký qua `ctx.on(eventName, handler)`. Thường được dùng kết hợp với [ctx.on](./on.md), hủy đăng ký vào thời điểm thích hợp để tránh memory leak hoặc trigger trùng lặp.

## Kịch bản áp dụng

| Kịch bản | Mô tả |
|------|------|
| **Cleanup React useEffect** | Gọi trong cleanup của `useEffect`, loại bỏ listener khi component unmount |
| **JSField / JSEditableField** | Khi two-way binding của field, hủy đăng ký `js-field:value-change` |
| **Liên quan đến resource** | Hủy listener refresh, saved, v.v. đã đăng ký với `ctx.resource.on` |

## Định nghĩa kiểu

```ts
off(eventName: string, handler: (event?: any) => void): void;
```

## Ví dụ

### Sử dụng cặp đôi trong React useEffect

```tsx
React.useEffect(() => {
  const handler = (ev) => setValue(ev?.detail ?? '');
  ctx.on('js-field:value-change', handler);
  return () => ctx.off('js-field:value-change', handler);
}, []);
```

### Hủy đăng ký sự kiện resource

```ts
const handler = () => { /* ... */ };
ctx.resource?.on('refresh', handler);
// 适当时机
ctx.resource?.off('refresh', handler);
```

## Lưu ý

1. **Tham chiếu handler nhất quán**: `handler` được truyền vào khi `ctx.off` phải là cùng tham chiếu với khi `ctx.on`, nếu không sẽ không thể loại bỏ chính xác.
2. **Dọn dẹp kịp thời**: Gọi `ctx.off` trước khi component unmount hoặc context bị hủy, để tránh memory leak.

## Tài liệu liên quan

- [ctx.on](./on.md) - Đăng ký sự kiện
- [ctx.resource](./resource.md) - Instance resource và `on`/`off` của nó
