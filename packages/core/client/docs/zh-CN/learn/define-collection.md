# 配置插件的 collection

### 配置插件自定义的数据表

在插件里，自定义的数据表必须放在插件的 `src/server/collections/*.ts` 目录下，内容如下：

```ts
import { defineCollection } from '@nocobase/database';

export default defineCollection({
  name: 'examples',
  fields: [
    { type: 'string', name: 'title' },
    { type: 'string', name: 'content' },
  ],
});
```

通常情况只需要配置 type 和 name 就可以了，除非你要在前端 Add Block 使用，才需要配置 interface 和 uiSchema 之类的前端使用的参数。

## 通过接口访问资源

在插件激活之后，会自动建表。如果已经安装，可以通过 yarn nocobase upgrade 触发建表，如果有数据污染，也可以通过重装的方式重新建表 yarn nocobase install -f
建表之后，就可以通过接口访问资源了。

```bash
GET     /api/examples:list
GET     /api/examples:get?filterByTk=1
POST    /api/examples:create
POST    /api/examples:update?filterByTk=1
POST    /api/examples:destroy?filterByTk=1
```