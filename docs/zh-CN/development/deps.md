# 依赖管理

## 约定式

插件的依赖构建采用约定式的方式，即 `package.json` 中 `devDependencies` 中的依赖*不会*被打包到插件中，`dependencies` 中的依赖*会*被打包到应用中。

## 需要放到 devDependencies 中的 npm 包

有一些依赖由 `@nocobase/server` 和 `@nocobase/client` 提供，不需要打包到插件产物中，因此不应该放到 `dependencies`，而应该放到 `devDependencies` 中。

<Alert type="warning">
当插件安装如下依赖时，要注意 **版本** 和 `@nocobase/server` 和 `@nocobase/client` 的保持一致。
</Alert>

### 全局依赖

```bash
# react
react
react-dom

# react-router
react-router
react-router-dom

# antd
antd
antd-style
@ant-design/icons
@ant-design/cssinjs

# i18next
i18next
react-i18next

# formily
@formily/antd-v5
@formily/core
@formily/react
@formily/shared
@formily/json-schema
@formily/reactive

# nocobase
@nocobase/acl
@nocobase/actions
@nocobase/auth
@nocobase/cache
@nocobase/database
@nocobase/evaluators
@nocobase/logger
@nocobase/resourcer
@nocobase/utils

# database
mysql
pg
pg-hstore
sqlite3
```

### 插件依赖别的插件

如果一个插件依赖了另一个插件，那么依赖的插件也应该放到 `devDependencies` 中，例如：

```diff
{
  "name": "@nocobase/plugin-hello",
-  "dependencies": {
-    "@nocobase/plugin-users": "^1.0.0"
-  },
+  "devDependencies": {
+    "@nocobase/plugin-users": "^1.0.0"
+  }
}
```

生产环境中，应该先将 `@nocobase/plugin-users` 安装到应用中，然后再安装 `@nocobase/plugin-hello`，激活插件顺序也应该为先激活 `@nocobase/plugin-users`，再激活 `@nocobase/plugin-hello`。

## import package.json

```diff
- export const namespace = require('../../package.json').name

+ // @ts-ignore
+ import { name } from '../../package.json'
+ export const namespace = name
```
