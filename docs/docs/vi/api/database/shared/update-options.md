---
title: "UpdateOptions"
description: "Tham số phương thức update của Repository NocoBase: values, filter, filterByTk, whitelist, blacklist, transaction."
keywords: "UpdateOptions,Repository,update,values,NocoBase"
---

**Kiểu**

```typescript
interface UpdateOptions extends Omit<SequelizeUpdateOptions, 'where'> {
  values: Values;
  filter?: Filter;
  filterByTk?: TargetKey;
  whitelist?: WhiteList;
  blacklist?: BlackList;
  updateAssociationValues?: AssociationKeysToBeUpdate;
  context?: any;
}
```

**Thông tin chi tiết**

- `values`: Đối tượng dữ liệu của bản ghi cần cập nhật.
- `filter`: Chỉ định điều kiện lọc của bản ghi cần cập nhật. Cách dùng chi tiết Filter có thể tham khảo phương thức [`find()`](#find).
- `filterByTk`: Chỉ định điều kiện lọc của bản ghi cần cập nhật theo TargetKey.
- `whitelist`: Whitelist của các field trong `values`, chỉ các field trong whitelist sẽ được ghi.
- `blacklist`: Blacklist của các field trong `values`, các field trong blacklist sẽ không được ghi.
- `transaction`: Đối tượng transaction. Nếu không truyền tham số transaction, phương thức sẽ tự động tạo một transaction nội bộ.

`filterByTk` và `filter` ít nhất phải truyền một trong hai.
