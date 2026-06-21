---
title: "IModel"
description: "Interface IModel NocoBase: definisi properti dan method dasar dari objek model."
keywords: "IModel,interface,Model,model data,NocoBase"
---

# IModel

Interface `IModel` mendefinisikan properti dan method dasar dari objek model.

```typescript
export interface IModel {
  toJSON: () => any;
}
```

## API

### toJSON()

Mengkonversi objek model ke format JSON
