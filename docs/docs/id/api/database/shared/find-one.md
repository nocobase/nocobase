---
title: "FindOneOptions"
description: "Parameter method findOne Repository NocoBase: sama dengan find, hanya mengembalikan satu data, tidak memerlukan limit."
keywords: "FindOneOptions,Repository,findOne,query,NocoBase"
---

**Tipe**

```typescript
type FindOneOptions = Omit<FindOptions, 'limit'>;
```

**Parameter**

Sebagian besar parameter sama dengan `find()`, perbedaannya `findOne()` hanya mengembalikan satu data, sehingga tidak memerlukan parameter `limit`, dan saat query selalu bernilai `1`.
