---
title: Models - 模型
---

# Models - 模型

将 models 统一放在 `/src/models`、`/lib/models` 目录下，将自动导入 database。

database.table 提供的数据表配置支持指定特殊 model，如：

```ts
import { Model } from '@nocobase/database';

class Test extends Model {
  // 在这个类里可以为 Test Model 扩展其他 API
  static hello() {

  }
}

export default {
  name: 'tests',
  model: Test,
};
```

调用 Model

```ts
const Test = db.getModel('tests');
// Test 可以调用 hello 方法了
Test.hello();
```