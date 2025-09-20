# CollectionBlockModel

区块分为三类

- 数据区块：继承 DataBlockModel 和 CollectionBlockModel 的类
- 筛选区块：继承 FilterBlockModel 的类
- 其他区块：直接继承 BlockModel 的类

直接继承 CollectionBlockModel 的类会划分到 Data blocks 分组里

![20250916085829](https://static-docs.nocobase.com/20250916085829.png)

添加 CollectionBlockModel 类型的区块时，需要选择绑定的数据表。

![20250916085923](https://static-docs.nocobase.com/20250916085923.png)

## 扩展说明

```tsx | pure
import { CollectionBlockModel } from '@nocobase/client';
import React from 'react';

export class HelloCollectionBlockModel extends CollectionBlockModel {
  renderComponent() {
    return (
      <div>
        <h1>Hello, NocoBase!</h1>
        <p>这是由 HelloCollectionBlockModel 渲染的简单区块。</p>
      </div>
    );
  }
}
```

### BlockSceneEnum 参数配置

- `BlockSceneEnum.new`：用于新建数据的区块，如新建表单
- `BlockSceneEnum.one`：用于处理一条数据的区块
- `BlockSceneEnum.many`：用于处理多条数据的区块
- `BlockSceneEnum.oam`：可以兼容处理单条或多条数据的区块，如详情、编辑表单区块
- `BlockSceneEnum.select`：用于记录选择的区块

```tsx | pure
import { BlockSceneEnum, CollectionBlockModel } from '@nocobase/client';
import React from 'react';

export class HelloCollectionBlockModel extends CollectionBlockModel {
  static scene = BlockSceneEnum.one;
  renderComponent() {
    return (
      <div>
        <h1>Hello, NocoBase!</h1>
        <p>这是由 HelloCollectionBlockModel 渲染的简单区块。</p>
      </div>
    );
  }
}
```

#### `BlockSceneEnum.new`

表示 Add new 弹窗里可以添加的数据区块，在页面区块里也可以添加

![20250916091649](https://static-docs.nocobase.com/20250916091649.png)

#### `BlockSceneEnum.one`

必须有当前记录上下文，表示 Edit/View 弹窗里可以查看或编辑的当前记录的区块，也可以用于处理对一的关系数据区块。

![20250916091927](https://static-docs.nocobase.com/20250916091927.png)

#### `BlockSceneEnum.many`

用于处理多条数据的区块，包括对多的关系数据区块。

页面里，多条数据的区块

![20250916092158](https://static-docs.nocobase.com/20250916092158.png)

弹窗里，对多的关系数据区块

![20250916092034](https://static-docs.nocobase.com/20250916092034.png)

#### `BlockSceneEnum.select`

关系数据选择器

![20250916092429](https://static-docs.nocobase.com/20250916092429.png)
