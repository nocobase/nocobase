---
title: "ctx.filterManager"
description: "ctx.filterManager là trình quản lý filter, dùng để lấy, đặt, lắng nghe điều kiện filter của table hoặc list."
keywords: "ctx.filterManager,filter,lọc table,lọc list,RunJS,NocoBase"
---

# ctx.filterManager

Trình quản lý kết nối filter, dùng để quản lý quan hệ filter giữa form filter (FilterForm) và các block dữ liệu (table, list, chart, v.v.). Được cung cấp bởi `BlockGridModel`, chỉ khả dụng trong ngữ cảnh của nó (như block form filter, block dữ liệu).

## Kịch bản áp dụng

| Kịch bản | Mô tả |
|------|------|
| **Block form filter** | Quản lý cấu hình kết nối giữa các mục filter và block đích, refresh dữ liệu đích khi filter thay đổi |
| **Block dữ liệu (table/list)** | Là đích được filter, ràng buộc điều kiện filter qua `bindToTarget` |
| **Quy tắc liên kết / FilterModel tùy chỉnh** | Trong `doFilter`, `doReset`, gọi `refreshTargetsByFilter` để trigger refresh đích |
| **Cấu hình field kết nối** | Sử dụng `getConnectFieldsConfig`, `saveConnectFieldsConfig` để duy trì mapping field giữa filter và đích |

> Lưu ý: `ctx.filterManager` chỉ khả dụng trong ngữ cảnh RunJS có `BlockGridModel` (như trong page chứa form filter); trong JSBlock thường hoặc page độc lập là `undefined`, khuyến nghị dùng optional chaining khi sử dụng.

## Định nghĩa kiểu

```ts
filterManager: FilterManager;

type FilterConfig = {
  filterId: string;   // 筛选器模型 UID
  targetId: string;   // 目标数据区块模型 UID
  filterPaths?: string[];  // 目标区块的字段路径
  operator?: string;  // 筛选操作符
};

type ConnectFieldsConfig = {
  targets: { targetId: string; filterPaths: string[] }[];
};
```

## Phương thức thường dùng

| Phương thức | Mô tả |
|------|------|
| `getFilterConfigs()` | Lấy tất cả cấu hình kết nối filter hiện tại |
| `getConnectFieldsConfig(filterId)` | Lấy cấu hình field kết nối của filter chỉ định |
| `saveConnectFieldsConfig(filterId, config)` | Lưu cấu hình field kết nối của filter |
| `addFilterConfig(config)` | Thêm cấu hình filter (filterId + targetId + filterPaths) |
| `removeFilterConfig({ filterId?, targetId?, persist? })` | Xóa cấu hình filter, theo filterId hoặc targetId hoặc cả hai |
| `bindToTarget(targetId)` | Ràng buộc cấu hình filter với block đích, trigger resource của nó áp dụng filter |
| `unbindFromTarget(targetId)` | Hủy ràng buộc filter từ block đích |
| `refreshTargetsByFilter(filterId 或 filterId[])` | Refresh dữ liệu block đích liên quan dựa trên filter |

## Khái niệm cốt lõi

- **FilterModel**: Model cung cấp điều kiện filter (như FilterFormItemModel), cần triển khai `getFilterValue()` để trả về giá trị filter hiện tại
- **TargetModel**: Block dữ liệu được filter, `resource` của nó cần hỗ trợ `addFilterGroup`, `removeFilterGroup`, `refresh`

## Ví dụ

### Thêm cấu hình filter

```ts
await ctx.filterManager?.addFilterConfig({
  filterId: 'filter-form-item-uid',
  targetId: 'table-block-uid',
  filterPaths: ['status', 'createdAt'],
  operator: '$eq',
});
```

### Refresh block đích

```ts
// 筛选表单的 doFilter / doReset 中
ctx.filterManager?.refreshTargetsByFilter(ctx.model.uid);

// 刷新多个筛选器关联的目标
ctx.filterManager?.refreshTargetsByFilter(['filter-1', 'filter-2']);
```

### Cấu hình field kết nối

```ts
// 获取连接配置
const config = ctx.filterManager?.getConnectFieldsConfig(ctx.model.uid);

// 保存连接配置
await ctx.filterManager?.saveConnectFieldsConfig(ctx.model.uid, {
  targets: [
    { targetId: 'table-uid', filterPaths: ['status'] },
    { targetId: 'chart-uid', filterPaths: ['category'] },
  ],
});
```

### Xóa cấu hình

```ts
// 删除某筛选器的所有配置
await ctx.filterManager?.removeFilterConfig({ filterId: 'filter-uid' });

// 删除某目标的所有筛选配置
await ctx.filterManager?.removeFilterConfig({ targetId: 'table-uid' });
```

## Liên quan

- [ctx.resource](./resource.md): Resource của block đích cần hỗ trợ interface filter
- [ctx.model](./model.md): Lấy UID model hiện tại để dùng cho filterId / targetId
