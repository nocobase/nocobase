---
title: "DestroyOptions"
description: "Tham số phương thức destroy của Repository NocoBase: filter, filterByTk, truncate, transaction."
keywords: "DestroyOptions,Repository,destroy,filter,NocoBase"
---

**Kiểu**

```typescript
interface DestroyOptions extends SequelizeDestroyOptions {
  filter?: Filter;
  filterByTk?: TargetKey | TargetKey[];
  truncate?: boolean;
  context?: any;
}
```

**Thông tin chi tiết**

- `filter`: Chỉ định điều kiện lọc của bản ghi cần xóa. Cách dùng chi tiết Filter có thể tham khảo phương thức [`find()`](#find).
- `filterByTk`: Chỉ định điều kiện lọc của bản ghi cần xóa theo TargetKey.
- `truncate`: Có làm sạch dữ liệu bảng hay không, có hiệu lực khi không truyền tham số `filter` hoặc `filterByTk`.
- `transaction`: Đối tượng transaction. Nếu không truyền tham số transaction, phương thức sẽ tự động tạo một transaction nội bộ.
