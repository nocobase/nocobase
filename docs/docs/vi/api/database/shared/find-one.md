---
title: "FindOneOptions"
description: "Tham số phương thức findOne của Repository NocoBase: giống find, chỉ trả về một bản ghi, không cần limit."
keywords: "FindOneOptions,Repository,findOne,truy vấn,NocoBase"
---

**Kiểu**

```typescript
type FindOneOptions = Omit<FindOptions, 'limit'>;
```

**Tham số**

Hầu hết tham số giống `find()`, khác biệt là `findOne()` chỉ trả về một bản ghi nên không cần tham số `limit`, và khi truy vấn luôn là `1`.
