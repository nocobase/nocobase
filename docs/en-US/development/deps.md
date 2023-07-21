# Dependency management

## convention-based

The dependency building for plugins follows a convention-based approach, where dependencies in `devDependencies` of the package.json file *will not be* bundled with the plugin, while the dependencies in `dependencies` *will be* bundled with the application.

## devDependencies npm package list

Some dependencies are provided by `@nocobase/server` and `@nocobase/client` and *do not need to* be bundled with the plugin output. Therefore, they should not be placed in `dependencies` but rather in `devDependencies`. Here are the specific steps:


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

### Plugins depend on other plugins

If a plugin depends on another plugin, then the dependent plugin should also be placed in `devDependencies`. For example:

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
