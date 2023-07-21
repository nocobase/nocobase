# 依赖管理

## 约定式

插件的依赖构建采用约定式的方式，即 `package.json` 中 `devDependencies` 中的依赖*不会*被打包到插件中，`dependencies` 中的依赖*会*被打包到应用中。

## 需要放到 devDependencies 中的 npm 包

有一些依赖由 `@nocobase/server` 和 `@nocobase/client` 提供，不需要打包到插件产物中，因此不应该放到 `dependencies`，而应该放到 `devDependencies` 中。

<Alert type="warning">
当插件安装如下依赖时，要注意 **版本** 和 `@nocobase/server` 和 `@nocobase/client` 的保持一致。
</Alert>

### 全局依赖

```js
// nocobase
'@nocobase/acl',
'@nocobase/actions',
'@nocobase/auth',
'@nocobase/cache',
'@nocobase/client',
'@nocobase/database',
'@nocobase/evaluators',
'@nocobase/logger',
'@nocobase/resourcer',
'@nocobase/sdk',
'@nocobase/server',
'@nocobase/test',
'@nocobase/utils',

// @nocobase/auth
'jsonwebtoken',

// @nocobase/cache
'cache-manager',
'cache-manager-fs-hash',

// @nocobase/database
'sequelize',
'umzug',
'async-mutex',

// @nocobase/evaluators
'@formulajs/formulajs',
'mathjs',

// @nocobase/logger
'winston',
'winston-daily-rotate-file',

// koa
'koa',
'@koa/cors',
'@koa/router',
'@koa/multer',
'koa-bodyparser',
'koa-static',
'koa-send',

// react
'react',
'react-dom',
'react/jsx-runtime',

// react-router
'react-router',
'react-router-dom',

// antd
'antd',
'antd-style',
'@ant-design/icons',
'@ant-design/cssinjs',

// i18next
'i18next',
'react-i18next',

// dnd-kit
'@dnd-kit/accessibility',
'@dnd-kit/core',
'@dnd-kit/modifiers',
'@dnd-kit/sortable',
'@dnd-kit/utilities',

// formily
'@formily/antd-v5',
'@formily/core',
'@formily/react',
'@formily/json-schema',
'@formily/path',
'@formily/validator',
'@formily/shared',
'@formily/reactive',
'@formily/reactive-react',

// utils
'dayjs',
'mysql2',
'pg',
'pg-hstore',
'sqlite3',
'supertest',
'axios',
'@emotion/css',
'ahooks',
'lodash'
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
