---
title: "CreateOptions"
description: "Parameter method create Repository NocoBase: values, whitelist, blacklist, updateAssociationValues, transaction."
keywords: "CreateOptions,Repository,create,values,NocoBase"
---

**Tipe**

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

**Detail**

- `values`: Objek data dari record yang akan dibuat.
- `whitelist`: Menentukan field mana yang **diizinkan untuk ditulis** pada objek data record yang akan dibuat. Jika parameter ini tidak dimasukkan, secara default semua field diizinkan untuk ditulis.
- `blacklist`: Menentukan field mana yang **tidak diizinkan untuk ditulis** pada objek data record yang akan dibuat. Jika parameter ini tidak dimasukkan, secara default semua field diizinkan untuk ditulis.
- `transaction`: Objek transaction. Jika tidak ada parameter transaction yang dimasukkan, method ini akan otomatis membuat transaction internal.
