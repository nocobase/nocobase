---
title: "CreateOptions"
description: "Tham số phương thức create của Repository NocoBase: values, whitelist, blacklist, updateAssociationValues, transaction."
keywords: "CreateOptions,Repository,create,values,NocoBase"
---

**Kiểu**

```typescript
type WhiteList = string[];
type BlackList = string[];
type AssociationKeysToBeUpdate = string[];

interface CreateOptions extends SequelizeCreateOptions {
  values?: Values;
  whitelist?: WhiteList;
  blacklist?: BlackList;
  updateAssociationValues?: AssociationKeysToBeUpdate;
  context?: any;
}
```

**Thông tin chi tiết**

- `values`: Đối tượng dữ liệu của bản ghi cần tạo.
- `whitelist`: Chỉ định những field nào trong đối tượng dữ liệu **được phép ghi**. Nếu không truyền tham số này, mặc định cho phép tất cả field được ghi.
- `blacklist`: Chỉ định những field nào trong đối tượng dữ liệu **không được phép ghi**. Nếu không truyền tham số này, mặc định cho phép tất cả field được ghi.
- `transaction`: Đối tượng transaction. Nếu không truyền tham số transaction, phương thức sẽ tự động tạo một transaction nội bộ.
