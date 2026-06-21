---
title: "DestroyOptions"
description: "Parameter method destroy Repository NocoBase: filter, filterByTk, truncate, transaction."
keywords: "DestroyOptions,Repository,destroy,filter,NocoBase"
---

**Tipe**

```typescript
interface DestroyOptions extends SequelizeDestroyOptions {
  filter?: Filter;
  filterByTk?: TargetKey | TargetKey[];
  truncate?: boolean;
  context?: any;
}
```

**Detail**

- `filter`: Menentukan kondisi filter untuk record yang akan dihapus. Untuk penggunaan detail Filter, lihat method [`find()`](#find).
- `filterByTk`: Menentukan kondisi filter berdasarkan TargetKey untuk record yang akan dihapus.
- `truncate`: Apakah mengosongkan data tabel, berlaku saat tidak ada parameter `filter` atau `filterByTk` yang dimasukkan.
- `transaction`: Objek transaction. Jika tidak ada parameter transaction yang dimasukkan, method ini akan otomatis membuat transaction internal.
