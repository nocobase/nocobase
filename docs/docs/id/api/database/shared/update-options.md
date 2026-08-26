---
title: "UpdateOptions"
description: "Parameter method update Repository NocoBase: values, filter, filterByTk, whitelist, blacklist, transaction."
keywords: "UpdateOptions,Repository,update,values,NocoBase"
---

**Tipe**

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

**Detail**

- `values`: Objek data dari record yang akan diperbarui.
- `filter`: Menentukan kondisi filter untuk record yang akan diperbarui. Untuk penggunaan detail Filter, lihat method [`find()`](#find).
- `filterByTk`: Menentukan kondisi filter berdasarkan TargetKey untuk record yang akan diperbarui.
- `whitelist`: Whitelist field `values`, hanya field di dalam whitelist yang akan ditulis.
- `blacklist`: Blacklist field `values`, field di dalam blacklist tidak akan ditulis.
- `transaction`: Objek transaction. Jika tidak ada parameter transaction yang dimasukkan, method ini akan otomatis membuat transaction internal.

`filterByTk` dan `filter` minimal salah satu harus dimasukkan.
