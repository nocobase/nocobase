---
title: Collections - 数据集
---

# Collections - 数据集

与 database.table 用法一致

```ts
export default {
  name: 'examples',
  fields: [],
}
```

配置扩展

```ts
import { extend } from '@nocobase/database';

export default extend({
  name: 'examples',
  fields: [],
});
```