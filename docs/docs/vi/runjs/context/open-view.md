:::tip{title="Thông báo dịch bằng AI"}
Tài liệu này được dịch bằng AI. Để biết thông tin chính xác, vui lòng tham khảo [phiên bản tiếng Anh](/runjs/context/open-view).
:::

# ctx.openView()

Mở một view được chỉ định (ngăn kéo, hộp thoại, trang nhúng, v.v.) bằng lập trình. Được cung cấp bởi `FlowModelContext`, dùng để mở các view `ChildPage` hoặc `PopupAction` đã được cấu hình trong các kịch bản như `JSBlock`, ô bảng, luồng sự kiện, v.v.

## Kịch bản áp dụng

| Kịch bản | Mô tả |
|------|------|
| **JSBlock** | Mở hộp thoại chi tiết/chỉnh sửa sau khi nhấp nút, truyền vào `filterByTk` của dòng hiện tại. |
| **Ô bảng** | Hiển thị một nút trong ô, nhấp vào để mở hộp thoại chi tiết dòng. |
| **Luồng sự kiện / JSAction** | Mở view hoặc hộp thoại tiếp theo sau khi thao tác thành công. |
| **Trường liên kết** | Mở hộp thoại chọn/chỉnh sửa thông qua `ctx.runAction('openView', params)`. |

> Lưu ý: `ctx.openView` khả dụng trong môi trường RunJS có ngữ cảnh FlowModel; nếu model tương ứng với `uid` không tồn tại, `PopupActionModel` sẽ tự động được tạo và lưu trữ lâu dài.

## Chữ ký (Signature)

```ts
openView(uid: string, options?: OpenViewOptions): Promise<void>
```

## Mô tả tham số

### uid

Mã định danh duy nhất của view model. Nếu không tồn tại, nó sẽ tự động được tạo và lưu lại. Khuyên dùng một UID ổn định, chẳng hạn như `${ctx.model.uid}-detail`, để có thể tái sử dụng cấu hình khi mở cùng một hộp thoại nhiều lần.

### Các trường options thường dùng

| Trường | Loại | Mô tả |
|------|------|------|
| `mode` | `drawer` / `dialog` / `embed` | Cách thức mở: ngăn kéo (drawer), hộp thoại (dialog), hoặc nhúng (embed). Mặc định là `drawer`. |
| `size` | `small` / `medium` / `large` | Kích thước của hộp thoại/ngăn kéo. Mặc định là `medium`. |
| `title` | `string` | Tiêu đề của view. |
| `params` | `Record<string, any>` | Các tham số bất kỳ truyền cho view. |
| `filterByTk` | `any` | Giá trị khóa chính, dùng cho kịch bản chi tiết/chỉnh sửa một bản ghi đơn lẻ. |
| `sourceId` | `string` | ID bản ghi nguồn, dùng trong các kịch bản liên kết. |
| `dataSourceKey` | `string` | Nguồn dữ liệu. |
| `collectionName` | `string` | Tên bộ sưu tập. |
| `associationName` | `string` | Tên trường liên kết. |
| `navigation` | `boolean` | Có sử dụng điều hướng route hay không. Khi truyền `defineProperties` / `defineMethods`, trường này sẽ bị ép buộc thành `false`. |
| `preventClose` | `boolean` | Có ngăn chặn việc đóng hay không. |
| `defineProperties` | `Record<string, PropertyOptions>` | Tiêm động các thuộc tính vào model bên trong view. |
| `defineMethods` | `Record<string, Function>` | Tiêm động các phương thức vào model bên trong view. |

## Ví dụ

### Cách dùng cơ bản: Mở ngăn kéo

```ts
const popupUid = `${ctx.model.uid}-detail`;
await ctx.openView(popupUid, {
  mode: 'drawer',
  size: 'medium',
  title: ctx.t('Chi tiết'),
});
```

### Truyền ngữ cảnh dòng hiện tại

```ts
const primaryKey = ctx.collection?.primaryKey || 'id';
await ctx.openView(`${ctx.model.uid}-1`, {
  mode: 'dialog',
  title: ctx.t('Chi tiết dòng'),
  params: {
    filterByTk: ctx.record?.[primaryKey],
    record: ctx.record,
  },
});
```

### Mở thông qua runAction

Khi model đã cấu hình hành động `openView` (như các trường liên kết, trường có thể nhấp), bạn có thể gọi:

```ts
await ctx.runAction('openView', {
  navigation: false,
  mode: 'dialog',
  collectionName: 'users',
  filterByTk: ctx.record?.id,
});
```

### Tiêm ngữ cảnh tùy chỉnh

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

## Mối quan hệ với ctx.viewer và ctx.view

| Mục đích | Cách dùng khuyên dùng |
|------|----------|
| **Mở một view luồng đã cấu hình** | `ctx.openView(uid, options)` |
| **Mở nội dung tùy chỉnh (không theo luồng)** | `ctx.viewer.dialog()` / `ctx.viewer.drawer()` |
| **Thao tác trên view hiện đang mở** | `ctx.view.close()`, `ctx.view.inputArgs` |

`ctx.openView` mở một `FlowPage` (`ChildPageModel`), bên trong sẽ render một trang luồng hoàn chỉnh; trong khi đó `ctx.viewer` mở nội dung React bất kỳ.

## Lưu ý

- UID nên được liên kết với `ctx.model.uid` (ví dụ: `${ctx.model.uid}-xxx`) để tránh xung đột giữa nhiều khối (block).
- Khi truyền `defineProperties` / `defineMethods`, `navigation` sẽ bị ép buộc thành `false` để tránh mất ngữ cảnh sau khi làm mới trang.
- Bên trong hộp thoại, `ctx.view` trỏ đến instance của view hiện tại, và `ctx.view.inputArgs` có thể dùng để đọc các tham số đã truyền khi mở.

## Liên quan

- [ctx.view](./view.md): Instance của view hiện đang mở.
- [ctx.model](./model.md): Model hiện tại, dùng để xây dựng `popupUid` ổn định.