---
title: "IModel"
description: "Interface IModel của NocoBase: định nghĩa thuộc tính và phương thức cơ bản của đối tượng model."
keywords: "IModel,interface,Model,model dữ liệu,NocoBase"
---

# IModel

Interface `IModel` định nghĩa các thuộc tính và phương thức cơ bản của đối tượng model.

```typescript
export interface IModel {
  toJSON: () => any;
}
```

## API

### toJSON()

Chuyển đối tượng model sang định dạng JSON.
