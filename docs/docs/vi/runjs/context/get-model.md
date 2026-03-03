:::tip{title="Thông báo dịch bằng AI"}
Tài liệu này được dịch bằng AI. Để biết thông tin chính xác, vui lòng tham khảo [phiên bản tiếng Anh](/runjs/context/get-model).
:::

# ctx.getModel()

Dựa trên `uid` của model để lấy instance của model (như `BlockModel`, `PageModel`, `ActionModel`, v.v.) trong engine hiện tại hoặc ngăn xếp chế độ xem (view stack), được sử dụng để truy cập các model khác giữa các khối, trang hoặc cửa sổ bật lên trong RunJS.

Nếu chỉ cần model hoặc khối hiện tại nơi ngữ cảnh thực thi tọa lạc, hãy ưu tiên sử dụng `ctx.model` hoặc `ctx.blockModel` thay vì `ctx.getModel`.

## Các tình huống sử dụng

| Tình huống | Mô tả |
|------|------|
| **JSBlock / JSAction** | Lấy model của các khối khác dựa trên `uid` đã biết để đọc hoặc ghi các thuộc tính như `resource`, `form`, `setProps`, v.v. |
| **RunJS trong cửa sổ bật lên** | Khi cần truy cập một model trên trang đã mở cửa sổ bật lên đó, hãy truyền vào `searchInPreviousEngines: true`. |
| **Thao tác tùy chỉnh** | Định vị form hoặc model con trong bảng thiết lập theo `uid` thông qua ngăn xếp chế độ xem để đọc cấu hình hoặc trạng thái của chúng. |

## Định nghĩa kiểu dữ liệu

```ts
getModel<T extends FlowModel = FlowModel>(
  uid: string,
  searchInPreviousEngines?: boolean
): T | undefined
```

## Tham số

| Tham số | Kiểu | Mô tả |
|------|------|------|
| `uid` | `string` | Định danh duy nhất của instance model, được chỉ định khi cấu hình hoặc khởi tạo (ví dụ: `ctx.model.uid`). |
| `searchInPreviousEngines` | `boolean` | Tùy chọn, mặc định là `false`. Khi là `true`, tìm kiếm từ engine hiện tại ngược lên gốc trong "ngăn xếp chế độ xem", giúp lấy được model trong các engine cấp trên (như trang đã mở cửa sổ bật lên). |

## Giá trị trả về

- Nếu tìm thấy, trả về instance của lớp con `FlowModel` tương ứng (như `BlockModel`, `FormBlockModel`, `ActionModel`).
- Nếu không tìm thấy, trả về `undefined`.

## Phạm vi tìm kiếm

- **Mặc định (`searchInPreviousEngines: false`)**: Chỉ tìm kiếm theo `uid` bên trong **engine hiện tại**. Trong các cửa sổ bật lên hoặc chế độ xem đa cấp, mỗi chế độ xem có một engine độc lập, mặc định chỉ tìm kiếm các model trong chế độ xem hiện tại.
- **`searchInPreviousEngines: true`**: Bắt đầu từ engine hiện tại, tìm kiếm ngược lên theo chuỗi `previousEngine`, trả về kết quả ngay khi khớp. Thích hợp để truy cập một model nào đó trên trang đã mở cửa sổ bật lên hiện tại.

## Ví dụ

### Lấy khối khác và làm mới dữ liệu

```ts
const block = ctx.getModel('list-block-uid');
if (block?.resource) {
  await block.resource.refresh();
}
```

### Truy cập model trên trang từ cửa sổ bật lên

```ts
// Truy cập một khối trên trang đã mở cửa sổ bật lên hiện tại
const pageBlock = ctx.getModel('page-block-uid', true);
if (pageBlock) {
  pageBlock.rerender?.();
}
```

### Đọc/ghi giữa các model và kích hoạt rerender

```ts
const target = ctx.getModel('other-block-uid');
if (target) {
  target.setProps({ loading: true });
  target.rerender?.();
}
```

### Kiểm tra an toàn

```ts
const model = ctx.getModel(someUid);
if (!model) {
  ctx.message.warning('Model mục tiêu không tồn tại');
  return;
}
```

## Liên quan

- [ctx.model](./model.md): Model nơi ngữ cảnh thực thi hiện tại tọa lạc.
- [ctx.blockModel](./block-model.md): Model của khối cha nơi JS hiện tại tọa lạc, thường có thể truy cập trực tiếp mà không cần dùng `getModel`.