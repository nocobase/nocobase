---
title: "IModel"
description: "NocoBase IModel 接口：模型对象基本属性与方法定义。"
keywords: "IModel,接口,Model,数据模型,NocoBase"
---

# IModel

`IModel` 接口定义了模型对象的基本属性和方法。

```typescript
export interface IModel {
  toJSON: () => any;
}
```

## API

### toJSON()

将模型对象转换为 JSON 格式
