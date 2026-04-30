---
title: "ctx.view"
description: "ctx.view là model view của page hoặc block hiện tại, dùng để lấy route, mở popup, truy cập trạng thái cấp page."
keywords: "ctx.view,model view,route,popup,trạng thái page,RunJS,NocoBase"
---

# ctx.view

Bộ điều khiển view đang kích hoạt hiện tại (popup, drawer, popover, embedded area, v.v.), dùng để truy cập thông tin và thao tác cấp view. Được cung cấp bởi FlowViewContext, chỉ khả dụng trong nội dung view được mở qua `ctx.viewer` hoặc `ctx.openView`.

## Kịch bản áp dụng

| Kịch bản | Mô tả |
|------|------|
| **Nội dung popup/drawer** | Trong `content` đóng view hiện tại qua `ctx.view.close()`, hoặc dùng `Header`, `Footer` để render tiêu đề và footer |
| **Sau khi submit form** | Sau khi submit thành công gọi `ctx.view.close(result)` để đóng và trả về kết quả |
| **JSBlock / Action** | Xét kiểu view hiện tại dựa trên `ctx.view.type`, hoặc đọc tham số mở từ `ctx.view.inputArgs` |
| **Lựa chọn quan hệ, sub-table** | Đọc `collectionName`, `filterByTk`, `parentId`, v.v. trong `inputArgs` để tải dữ liệu |

> Lưu ý: `ctx.view` chỉ khả dụng trong môi trường RunJS có ngữ cảnh view (như trong content của `ctx.viewer.dialog()`, form popup, nội bộ trình chọn quan hệ); trong page thông thường hoặc ngữ cảnh backend là `undefined`, khi sử dụng khuyến nghị dùng optional chaining (`ctx.view?.close?.()`).

## Định nghĩa kiểu

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
  submit?: () => Promise<any>;  // 流配置视图中可用
};
```

## Thuộc tính và phương thức thường dùng

| Thuộc tính/Phương thức | Kiểu | Mô tả |
|-----------|------|------|
| `type` | `'drawer' \| 'popover' \| 'dialog' \| 'embed'` | Kiểu view hiện tại |
| `inputArgs` | `Record<string, any>` | Tham số được truyền khi mở view, xem bên dưới |
| `Header` | `React.FC \| null` | Component header, dùng để render tiêu đề, vùng thao tác |
| `Footer` | `React.FC \| null` | Component footer, dùng để render button, v.v. |
| `close(result?, force?)` | `void` | Đóng view hiện tại, có thể truyền `result` trả về cho phía gọi |
| `update(newConfig)` | `void` | Cập nhật cấu hình view (như chiều rộng, tiêu đề) |
| `navigation` | `ViewNavigation \| undefined` | Điều hướng view trong page, gồm chuyển Tab, v.v. |

> Hiện tại chỉ `dialog` và `drawer` hỗ trợ `Header` và `Footer`.

## Trường thường gặp của inputArgs

Các kịch bản mở khác nhau có trường `inputArgs` khác nhau, thường gặp bao gồm:

| Trường | Mô tả |
|------|------|
| `viewUid` | UID view |
| `collectionName` | Tên collection |
| `filterByTk` | Filter primary key (chi tiết bản ghi đơn) |
| `parentId` | ID cấp cha (kịch bản quan hệ) |
| `sourceId` | ID bản ghi nguồn |
| `parentItem` | Dữ liệu item cha |
| `scene` | Kịch bản (như `create`, `edit`, `select`) |
| `onChange` | Callback sau khi chọn/thay đổi |
| `tabUid` | UID Tab hiện tại (trong page) |

Truy cập qua `ctx.getVar('ctx.view.inputArgs.xxx')` hoặc `ctx.view.inputArgs.xxx`.

## Ví dụ

### Đóng view hiện tại

```ts
// 提交成功后关闭弹窗
await ctx.resource.runAction('create', { data: formData });
ctx.view?.close();

// 关闭并回传结果
ctx.view?.close({ id: newRecord.id, name: newRecord.name });
```

### Sử dụng Header / Footer trong content

```tsx
function DialogContent() {
  const ctx = useFlowViewContext();
  const { Header, Footer, close } = ctx.view;
  return (
    <div>
      <Header title="编辑" extra={<Button size="small">帮助</Button>} />
      <div>表单内容...</div>
      <Footer>
        <Button onClick={() => close()}>取消</Button>
        <Button type="primary" onClick={handleSubmit}>确定</Button>
      </Footer>
    </div>
  );
}
```

### Rẽ nhánh dựa trên kiểu view hoặc inputArgs

```ts
if (ctx.view?.type === 'embed') {
  // 嵌入式视图中隐藏头部
  ctx.model.setProps('headerStyle', { display: 'none' });
}

const collectionName = ctx.view?.inputArgs?.collectionName;
if (collectionName === 'users') {
  // 用户选择器场景
}
```

## Quan hệ với ctx.viewer, ctx.openView

| Mục đích | Cách dùng khuyến nghị |
|------|----------|
| **Mở view mới** | `ctx.viewer.dialog()` / `ctx.viewer.drawer()` hoặc `ctx.openView()` |
| **Thao tác view hiện tại** | `ctx.view.close()`, `ctx.view.update()` |
| **Lấy tham số mở** | `ctx.view.inputArgs` |

`ctx.viewer` chịu trách nhiệm "mở" view, `ctx.view` biểu thị instance view "hiện tại" đang ở; `ctx.openView` dùng để mở view flow đã cấu hình.

## Lưu ý

- `ctx.view` chỉ khả dụng bên trong view, trong page thông thường là `undefined`
- Sử dụng optional chaining: `ctx.view?.close?.()` để tránh báo lỗi khi không có ngữ cảnh view
- `result` của `close(result)` sẽ được truyền đến Promise được trả về từ `ctx.viewer.open()`

## Liên quan

- [ctx.openView()](./open-view.md): Mở view flow đã cấu hình
- [ctx.modal](./modal.md): Popup nhẹ (thông tin, xác nhận, v.v.)

> `ctx.viewer` cung cấp các phương thức `dialog()`, `drawer()`, `popover()`, `embed()`, v.v. để mở view, có thể truy cập `ctx.view` trong `content` mà nó mở.
