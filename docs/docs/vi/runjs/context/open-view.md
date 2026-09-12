---
title: "ctx.openView()"
description: "ctx.openView() mở popup, drawer hoặc page view, hỗ trợ truyền tham số, callback, dùng cho các kịch bản như chi tiết, chỉnh sửa, lựa chọn."
keywords: "ctx.openView,popup,drawer,page view,chi tiết,chỉnh sửa,RunJS,NocoBase"
---

# ctx.openView()

Mở view chỉ định (drawer, popup, embedded page, v.v.) bằng cách lập trình. Được cung cấp bởi FlowModelContext, dùng để mở view ChildPage hoặc PopupAction đã được cấu hình trong các kịch bản như JSBlock, ô của table, luồng sự kiện.

## Kịch bản áp dụng

| Kịch bản | Mô tả |
|------|------|
| **JSBlock** | Sau khi click button mở popup chi tiết/chỉnh sửa, truyền `filterByTk` của hàng hiện tại |
| **Ô của table** | Render button trong ô, click để mở popup chi tiết của hàng |
| **Luồng sự kiện / JSAction** | Mở view hoặc popup tiếp theo sau khi thao tác thành công |
| **Field quan hệ** | Mở popup lựa chọn/chỉnh sửa qua `ctx.runAction('openView', params)` |

> Lưu ý: `ctx.openView` cần khả dụng trong môi trường RunJS có ngữ cảnh FlowModel; nếu model tương ứng với uid không tồn tại, sẽ tự động tạo PopupActionModel và lưu trữ.

## Chữ ký

```ts
openView(uid: string, options?: OpenViewOptions): Promise<void>
```

## Giải thích tham số

### uid

Định danh duy nhất của model view. Nếu không tồn tại sẽ tự động tạo và lưu. Khuyến nghị sử dụng UID ổn định, như `${ctx.model.uid}-detail`, để tái sử dụng cấu hình khi mở popup nhiều lần.

### Trường options thường dùng

| Trường | Kiểu | Mô tả |
|------|------|------|
| `mode` | `drawer` / `dialog` / `embed` | Cách mở: drawer, popup, embedded, mặc định `drawer` |
| `size` | `small` / `medium` / `large` | Kích thước popup/drawer, mặc định `medium` |
| `title` | `string` | Tiêu đề view |
| `params` | `Record<string, any>` | Tham số bất kỳ truyền cho view |
| `filterByTk` | `any` | Giá trị primary key, dùng cho kịch bản chi tiết/chỉnh sửa bản ghi đơn |
| `sourceId` | `string` | ID bản ghi nguồn, dùng cho kịch bản quan hệ |
| `dataSourceKey` | `string` | Data source |
| `collectionName` | `string` | Tên collection |
| `associationName` | `string` | Tên field quan hệ |
| `navigation` | `boolean` | Có sử dụng route navigation hay không, khi truyền `defineProperties` / `defineMethods` sẽ bị buộc đặt thành `false` |
| `preventClose` | `boolean` | Có ngăn đóng hay không |
| `defineProperties` | `Record<string, PropertyOptions>` | Inject động thuộc tính vào model trong view |
| `defineMethods` | `Record<string, Function>` | Inject động phương thức vào model trong view |

## Ví dụ

### Cách dùng cơ bản: mở drawer

```ts
const popupUid = `${ctx.model.uid}-detail`;
await ctx.openView(popupUid, {
  mode: 'drawer',
  size: 'medium',
  title: ctx.t('详情'),
});
```

### Truyền ngữ cảnh hàng hiện tại

```ts
const primaryKey = ctx.collection?.primaryKey || 'id';
await ctx.openView(`${ctx.model.uid}-1`, {
  mode: 'dialog',
  title: ctx.t('行详情'),
  params: {
    filterByTk: ctx.record?.[primaryKey],
    record: ctx.record,
  },
});
```

### Mở qua runAction

Khi model được cấu hình action openView (như field quan hệ, field có thể click), có thể gọi:

```ts
await ctx.runAction('openView', {
  navigation: false,
  mode: 'dialog',
  collectionName: 'users',
  filterByTk: ctx.record?.id,
});
```

### Inject ngữ cảnh tùy chỉnh

```ts
await ctx.openView(`${ctx.model.uid}-edit`, {
  mode: 'drawer',
  filterByTk: ctx.record?.id,
  defineProperties: {
    onSaved: {
      get: () => () => ctx.resource?.refresh?.(),
      cache: false,
    },
  },
});
```

## Quan hệ với ctx.viewer, ctx.view

| Mục đích | Cách dùng khuyến nghị |
|------|----------|
| **Mở view flow đã cấu hình** | `ctx.openView(uid, options)` |
| **Mở content tùy chỉnh (không có flow)** | `ctx.viewer.dialog()` / `ctx.viewer.drawer()` |
| **Thao tác view đang mở hiện tại** | `ctx.view.close()`, `ctx.view.inputArgs` |

`ctx.openView` mở FlowPage (ChildPageModel), nội bộ render page flow đầy đủ; `ctx.viewer` mở nội dung React bất kỳ.

## Lưu ý

- Khuyến nghị uid liên kết với `ctx.model.uid` (như `${ctx.model.uid}-xxx`), tránh xung đột giữa nhiều block
- Khi truyền `defineProperties` / `defineMethods`, `navigation` sẽ bị buộc đặt thành `false` để tránh mất ngữ cảnh sau khi refresh
- `ctx.view` trong popup trỏ đến instance view hiện tại, `ctx.view.inputArgs` có thể đọc tham số được truyền khi mở

## Liên quan

- [ctx.view](./view.md): Instance view đang mở hiện tại
- [ctx.model](./model.md): Model hiện tại, dùng để xây dựng popupUid ổn định
