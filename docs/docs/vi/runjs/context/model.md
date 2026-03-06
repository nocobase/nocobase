:::tip{title="Thông báo dịch bằng AI"}
Tài liệu này được dịch bằng AI. Để biết thông tin chính xác, vui lòng tham khảo [phiên bản tiếng Anh](/runjs/context/model).
:::

# ctx.model

Instance `FlowModel` nơi ngữ cảnh thực thi RunJS hiện tại tọa lạc, là điểm truy cập mặc định cho các kịch bản như JSBlock, JSField, JSAction. Loại cụ thể thay đổi tùy theo ngữ cảnh: có thể là các lớp con như `BlockModel`, `ActionModel`, `JSEditableFieldModel`, v.v.

## Các kịch bản áp dụng

| Kịch bản | Mô tả |
|------|------|
| **JSBlock** | `ctx.model` là mô hình khối hiện tại, có thể truy cập `resource`, `collection`, `setProps`, v.v. |
| **JSField / JSItem / JSColumn** | `ctx.model` là mô hình trường, có thể truy cập `setProps`, `dispatchEvent`, v.v. |
| **Sự kiện thao tác / ActionModel** | `ctx.model` là mô hình thao tác, có thể đọc/ghi tham số bước, phái phát sự kiện, v.v. |

> Gợi ý: Nếu cần truy cập **khối cha chứa JS hiện tại** (như khối Biểu mẫu/Bảng), hãy sử dụng `ctx.blockModel`; nếu cần truy cập **các mô hình khác**, hãy sử dụng `ctx.getModel(uid)`.

## Định nghĩa kiểu

```ts
model: FlowModel;
```

`FlowModel` là lớp cơ sở, khi chạy thực tế sẽ là các lớp con khác nhau (như `BlockModel`, `FormBlockModel`, `TableBlockModel`, `JSEditableFieldModel`, `ActionModel`, v.v.), các thuộc tính và phương thức khả dụng sẽ khác nhau tùy theo loại.

## Thuộc tính thường dùng

| Thuộc tính | Kiểu | Mô tả |
|------|------|------|
| `uid` | `string` | Định danh duy nhất của mô hình, có thể dùng cho `ctx.getModel(uid)` hoặc liên kết UID của cửa sổ bật lên (popup). |
| `collection` | `Collection` | Bộ sưu tập được liên kết với mô hình hiện tại (tồn tại khi khối/trường được liên kết với dữ liệu). |
| `resource` | `Resource` | Thực thể tài nguyên liên quan, dùng để làm mới, lấy các hàng được chọn, v.v. |
| `props` | `object` | Cấu hình UI/hành vi của mô hình, có thể cập nhật bằng `setProps`. |
| `subModels` | `Record<string, FlowModel>` | Tập hợp các mô hình con (như các trường trong biểu mẫu, các cột trong bảng). |
| `parent` | `FlowModel` | Mô hình cha (nếu có). |

## Phương thức thường dùng

| Phương thức | Mô tả |
|------|------|
| `setProps(partialProps: any): void` | Cập nhật cấu hình mô hình, kích hoạt kết xuất lại (ví dụ: `ctx.model.setProps({ loading: true })`). |
| `dispatchEvent(eventName: string, payload?: any, options?: any): Promise<any[]>` | Phái phát một sự kiện đến mô hình, kích hoạt các luồng công việc được cấu hình trên mô hình đó để lắng nghe tên sự kiện này. `payload` tùy chọn được truyền cho trình xử lý luồng công việc; `options.debounce` có thể bật tính năng chống rung (debounce). |
| `getStepParams?.(flowKey, stepKey)` | Đọc tham số bước của luồng cấu hình (trong các kịch bản như bảng thiết lập, thao tác tùy chỉnh, v.v.). |
| `setStepParams?.(flowKey, stepKey, params)` | Ghi tham số bước của luồng cấu hình. |

## Quan hệ với ctx.blockModel và ctx.getModel

| Nhu cầu | Cách dùng khuyến nghị |
|------|----------|
| **Mô hình của ngữ cảnh thực thi hiện tại** | `ctx.model` |
| **Khối cha của JS hiện tại** | `ctx.blockModel`, thường dùng để truy cập `resource`, `form`, `collection`. |
| **Lấy mô hình bất kỳ theo UID** | `ctx.getModel(uid)` hoặc `ctx.getModel(uid, true)` (tìm kiếm xuyên suốt các ngăn xếp chế độ xem). |

Trong JSField, `ctx.model` là mô hình trường, `ctx.blockModel` là khối Biểu mẫu hoặc Bảng chứa trường đó.

## Ví dụ

### Cập nhật trạng thái khối/thao tác

```ts
ctx.model.setProps({ loading: true });
await doSomething();
ctx.model.setProps({ loading: false });
```

### Phái phát sự kiện mô hình

```ts
// Phái phát sự kiện để kích hoạt luồng công việc được cấu hình trên mô hình này đang lắng nghe tên sự kiện này
await ctx.model.dispatchEvent('remove');
// Khi có payload, nó sẽ được truyền vào ctx.inputArgs của trình xử lý luồng công việc
await ctx.model.dispatchEvent('customEvent', { id: 123 });
```

### Sử dụng UID để liên kết cửa sổ bật lên hoặc truy cập chéo mô hình

```ts
const myUid = ctx.model.uid;
// Trong cấu hình cửa sổ bật lên, có thể truyền vào openerUid: myUid để liên kết
const other = ctx.getModel('other-block-uid');
if (other) other.rerender?.();
```

## Liên quan

- [ctx.blockModel](./block-model.md): Mô hình khối cha nơi JS hiện tại tọa lạc
- [ctx.getModel()](./get-model.md): Lấy các mô hình khác theo UID