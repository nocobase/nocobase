:::tip{title="Thông báo dịch bằng AI"}
Tài liệu này được dịch bằng AI. Để biết thông tin chính xác, vui lòng tham khảo [phiên bản tiếng Anh](/runjs/context/filter-manager).
:::

# ctx.filterManager

Trình quản lý kết nối bộ lọc, được sử dụng để quản lý các liên kết bộ lọc giữa biểu mẫu bộ lọc (FilterForm) và các khối dữ liệu (bảng, danh sách, biểu đồ, v.v.). Nó được cung cấp bởi `BlockGridModel` và chỉ khả dụng trong ngữ cảnh của nó (ví dụ: trong các khối biểu mẫu bộ lọc, khối dữ liệu).

## Các kịch bản áp dụng

| Kịch bản | Mô tả |
|------|------|
| **Khối biểu mẫu bộ lọc** | Quản lý cấu hình kết nối giữa các mục bộ lọc và khối mục tiêu; làm mới dữ liệu mục tiêu khi bộ lọc thay đổi. |
| **Khối dữ liệu (Bảng/Danh sách)** | Đóng vai trò là mục tiêu được lọc, liên kết các điều kiện lọc thông qua `bindToTarget`. |
| **Quy tắc liên kết / FilterModel tùy chỉnh** | Gọi `refreshTargetsByFilter` trong `doFilter` hoặc `doReset` để kích hoạt làm mới mục tiêu. |
| **Cấu hình trường kết nối** | Sử dụng `getConnectFieldsConfig` và `saveConnectFieldsConfig` để duy trì ánh xạ trường giữa bộ lọc và mục tiêu. |

> Lưu ý: `ctx.filterManager` chỉ khả dụng trong ngữ cảnh RunJS có `BlockGridModel` (ví dụ: trong một trang có chứa biểu mẫu bộ lọc); nó sẽ là `undefined` trong các JSBlock thông thường hoặc các trang độc lập. Khuyến nghị sử dụng optional chaining trước khi truy cập.

## Định nghĩa kiểu dữ liệu

```ts
filterManager: FilterManager;

type FilterConfig = {
  filterId: string;   // UID của model bộ lọc
  targetId: string;   // UID của model khối dữ liệu mục tiêu
  filterPaths?: string[];  // Đường dẫn trường của khối mục tiêu
  operator?: string;  // Toán tử lọc
};

type ConnectFieldsConfig = {
  targets: { targetId: string; filterPaths: string[] }[];
};
```

## Các phương thức thường dùng

| Phương thức | Mô tả |
|------|------|
| `getFilterConfigs()` | Lấy tất cả các cấu hình kết nối bộ lọc hiện tại. |
| `getConnectFieldsConfig(filterId)` | Lấy cấu hình trường kết nối cho một bộ lọc cụ thể. |
| `saveConnectFieldsConfig(filterId, config)` | Lưu cấu hình trường kết nối cho một bộ lọc. |
| `addFilterConfig(config)` | Thêm cấu hình bộ lọc (filterId + targetId + filterPaths). |
| `removeFilterConfig({ filterId?, targetId?, persist? })` | Xóa cấu hình bộ lọc theo filterId, targetId hoặc cả hai. |
| `bindToTarget(targetId)` | Liên kết cấu hình bộ lọc với một khối mục tiêu, kích hoạt resource của nó để áp dụng bộ lọc. |
| `unbindFromTarget(targetId)` | Hủy liên kết bộ lọc khỏi khối mục tiêu. |
| `refreshTargetsByFilter(filterId hoặc filterId[])` | Làm mới dữ liệu khối mục tiêu liên quan dựa trên (các) bộ lọc. |

## Khái niệm cốt lõi

- **FilterModel**: Một model cung cấp các điều kiện lọc (ví dụ: FilterFormItemModel), model này phải triển khai `getFilterValue()` để trả về giá trị bộ lọc hiện tại.
- **TargetModel**: Khối dữ liệu đang được lọc; `resource` của nó phải hỗ trợ `addFilterGroup`, `removeFilterGroup` và `refresh`.

## Ví dụ

### Thêm cấu hình bộ lọc

```ts
await ctx.filterManager?.addFilterConfig({
  filterId: 'filter-form-item-uid',
  targetId: 'table-block-uid',
  filterPaths: ['status', 'createdAt'],
  operator: '$eq',
});
```

### Làm mới các khối mục tiêu

```ts
// Trong doFilter / doReset của một biểu mẫu bộ lọc
ctx.filterManager?.refreshTargetsByFilter(ctx.model.uid);

// Làm mới các mục tiêu liên quan đến nhiều bộ lọc
ctx.filterManager?.refreshTargetsByFilter(['filter-1', 'filter-2']);
```

### Cấu hình trường kết nối

```ts
// Lấy cấu hình kết nối
const config = ctx.filterManager?.getConnectFieldsConfig(ctx.model.uid);

// Lưu cấu hình kết nối
await ctx.filterManager?.saveConnectFieldsConfig(ctx.model.uid, {
  targets: [
    { targetId: 'table-uid', filterPaths: ['status'] },
    { targetId: 'chart-uid', filterPaths: ['category'] },
  ],
});
```

### Xóa cấu hình

```ts
// Xóa tất cả cấu hình cho một bộ lọc cụ thể
await ctx.filterManager?.removeFilterConfig({ filterId: 'filter-uid' });

// Xóa tất cả cấu hình bộ lọc cho một mục tiêu cụ thể
await ctx.filterManager?.removeFilterConfig({ targetId: 'table-uid' });
```

## Liên quan

- [ctx.resource](./resource.md): Resource của khối mục tiêu phải hỗ trợ giao diện bộ lọc.
- [ctx.model](./model.md): Được sử dụng để lấy UID của model hiện tại cho filterId / targetId.