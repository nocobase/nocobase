# FilterBlockModel

区块分为三类

- 数据区块：继承 DataBlockModel 和 CollectionBlockModel 的类
- 筛选区块：继承 FilterBlockModel 的类
- 其他区块：直接继承 BlockModel 的类

继承 FilterBlockModel 的类会划分到 Filter blocks 分组里

![20250916090302](https://static-docs.nocobase.com/20250916090302.png)

## 扩展说明

```tsx | pure
import { FilterBlockModel } from '@nocobase/client';
import React from 'react';

export class HelloFilterBlockModel extends FilterBlockModel {
  renderComponent() {
    return (
      <div>
        <h1>Hello, NocoBase!</h1>
        <p>这是由 HelloFilterBlockModel 渲染的简单区块。</p>
      </div>
    );
  }
}
```
