:::tip{title="Thông báo dịch bằng AI"}
Tài liệu này được dịch bằng AI. Để biết thông tin chính xác, vui lòng tham khảo [phiên bản tiếng Anh](/runjs/context/view).
:::

# ctx.view

Trình điều khiển chế độ xem hiện tại đang kích hoạt (hộp thoại, ngăn kéo, popover, vùng nhúng, v.v.), được sử dụng để truy cập thông tin và thực hiện các thao tác ở cấp độ chế độ xem. Được cung cấp bởi `FlowViewContext`, nó chỉ khả dụng trong nội dung chế độ xem được mở thông qua `ctx.viewer` hoặc `ctx.openView`.

## Scenarios áp dụng

| Scenario | Mô tả |
|------|------|
| **Nội dung Hộp thoại/Ngăn kéo** | Sử dụng `ctx.view.close()` trong `content` để đóng chế độ xem hiện tại, hoặc sử dụng `Header`, `Footer` để hiển thị tiêu đề và phần chân trang. |
| **Sau khi gửi biểu mẫu** | Gọi `ctx.view.close(result)` sau khi gửi thành công để đóng và trả về kết quả. |
| **JSBlock / Action** | Xác định loại chế độ xem hiện tại thông qua `ctx.view.type`, hoặc đọc các tham số mở từ `ctx.view.inputArgs`. |
| **Lựa chọn liên kết, bảng con** | Đọc các trường như `collectionName`, `filterByTk`, `parentId` trong `inputArgs` để thực hiện tải dữ liệu. |

> Lưu ý: `ctx.view` chỉ khả dụng trong môi trường RunJS có ngữ cảnh chế độ xem (ví dụ: bên trong `content` của `ctx.viewer.dialog()`, trong biểu mẫu pop-up, hoặc bên trong bộ chọn liên kết); trong các trang thông thường hoặc ngữ cảnh backend, nó sẽ là `undefined`. Khuyến nghị sử dụng optional chaining khi truy cập (`ctx.view?.close?.()`).

## Định nghĩa kiểu dữ liệu

```ts
type FlowView = {
  type: 'drawer' | 'popover' | 'dialog' | 'embed';
  inputArgs: Record<string, any>;
  Header: React.FC<{ title?: React.ReactNode; extra?: React.ReactNode }> | null;
  Footer: React.FC<{ children?: React.ReactNode }> | null;
  close: (result?: any, force?: boolean) => void;
  update: (newConfig: any) => void;
  navigation?: ViewNavigation;
  destroy?: () => void;
  submit?: () => Promise<any>;  // Khả dụng trong chế độ xem cấu hình luồng
};
```

## Các thuộc tính và phương thức thường dùng

| Thuộc tính/Phương thức | Kiểu dữ liệu | Mô tả |
|-----------|------|------|
| `type` | `'drawer' \| 'popover' \| 'dialog' \| 'embed'` | Loại chế độ xem hiện tại |
| `inputArgs` | `Record<string, any>` | Các tham số được truyền khi mở chế độ xem, xem chi tiết bên dưới |
| `Header` | `React.FC \| null` | Thành phần đầu trang, dùng để hiển thị tiêu đề và khu vực thao tác |
| `Footer` | `React.FC \| null` | Thành phần chân trang, dùng để hiển thị các nút bấm, v.v. |
| `close(result?, force?)` | `void` | Đóng chế độ xem hiện tại, có thể truyền `result` để trả về cho bên gọi |
| `update(newConfig)` | `void` | Cập nhật cấu hình chế độ xem (ví dụ: chiều rộng, tiêu đề) |
| `navigation` | `ViewNavigation \| undefined` | Điều hướng chế độ xem trong trang, bao gồm chuyển đổi Tab, v.v. |

> Hiện tại chỉ có `dialog` và `drawer` hỗ trợ `Header` và `Footer`.

## Các trường thường gặp trong inputArgs

Tùy thuộc vào ngữ cảnh mở chế độ xem mà các trường trong `inputArgs` sẽ khác nhau, các trường phổ biến bao gồm:

| Trường | Mô tả |
|------|------|
| `viewUid` | UID của chế độ xem |
| `collectionName` | Tên bộ sưu tập dữ liệu |
| `filterByTk` | Bộ lọc theo khóa chính (dành cho chi tiết bản ghi đơn) |
| `parentId` | ID của bản ghi cha (trong ngữ cảnh liên kết) |
| `sourceId` | ID của bản ghi nguồn |
| `parentItem` | Dữ liệu của mục cha |
| `scene` | Ngữ cảnh (ví dụ: `create`, `edit`, `select`) |
| `onChange` | Callback sau khi lựa chọn hoặc thay đổi |
| `tabUid` | UID của Tab hiện tại (trong trang) |

Truy cập thông qua `ctx.getVar('ctx.view.inputArgs.xxx')` hoặc `ctx.view.inputArgs.xxx`.

## Ví dụ

### Đóng chế độ xem hiện tại

```ts
// Đóng hộp thoại sau khi gửi thành công
await ctx.resource.runAction('create', { data: formData });
ctx.view?.close();

// Đóng và trả về kết quả
ctx.view?.close({ id: newRecord.id, name: newRecord.name });
```

### Sử dụng Header / Footer trong nội dung

```tsx
function DialogContent() {
  const ctx = useFlowViewContext();
  const { Header, Footer, close } = ctx.view;
  return (
    <div>
      <Header title="Chỉnh sửa" extra={<Button size="small">Trợ giúp</Button>} />
      <div>Nội dung biểu mẫu...</div>
      <Footer>
        <Button onClick={() => close()}>Hủy bỏ</Button>
        <Button type="primary" onClick={handleSubmit}>Xác nhận</Button>
      </Footer>
    </div>
  );
}
```

### Phân nhánh dựa trên loại chế độ xem hoặc inputArgs

```ts
if (ctx.view?.type === 'embed') {
  // Ẩn phần đầu trang trong chế độ xem nhúng
  ctx.model.setProps('headerStyle', { display: 'none' });
}

const collectionName = ctx.view?.inputArgs?.collectionName;
if (collectionName === 'users') {
  // Ngữ cảnh bộ chọn người dùng
}
```

## Mối quan hệ với ctx.viewer và ctx.openView

| Mục đích | Cách dùng khuyến nghị |
|------|----------|
| **Mở một chế độ xem mới** | `ctx.viewer.dialog()` / `ctx.viewer.drawer()` hoặc `ctx.openView()` |
| **Thao tác trên chế độ xem hiện tại** | `ctx.view.close()`, `ctx.view.update()` |
| **Lấy tham số khi mở** | `ctx.view.inputArgs` |

`ctx.viewer` chịu trách nhiệm "mở" một chế độ xem, trong khi `ctx.view` đại diện cho thực thể chế độ xem "hiện tại"; `ctx.openView` được sử dụng để mở các chế độ xem luồng công việc đã được cấu hình sẵn.

## Lưu ý

- `ctx.view` chỉ khả dụng bên trong một chế độ xem, nó sẽ là `undefined` trên các trang thông thường.
- Sử dụng optional chaining: `ctx.view?.close?.()` để tránh gây lỗi khi không có ngữ cảnh chế độ xem.
- Tham số `result` trong `close(result)` sẽ được truyền cho Promise trả về bởi `ctx.viewer.open()`.

## Liên quan

- [ctx.openView()](./open-view.md): Mở chế độ xem luồng công việc đã cấu hình
- [ctx.modal](./modal.md): Hộp thoại nhẹ (thông báo, xác nhận, v.v.)

> `ctx.viewer` cung cấp các phương thức như `dialog()`, `drawer()`, `popover()`, `embed()` để mở chế độ xem, và bên trong `content` của các phương thức này có thể truy cập được `ctx.view`.