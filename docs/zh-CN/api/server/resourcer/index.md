# Resourcer

Resourcer 主要用于管理 API 资源与路由，也是 NocoBase 的内置模块，app 默认会自动创建一个 Resourcer 实例，大部分情况你可以通过 `app.resourcer` 访问。

## 包结构

可通过以下方式引入相关实体：

```ts
import Database, {
  Resourcer,
  Resource,
  Action,
  Middleware,
  branch
} from '@nocobase/resourcer';
```

## 构造函数
