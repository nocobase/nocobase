# 依赖管理

插件的依赖分为自身的依赖和全局依赖，全局依赖由 `@nocobase/server` 和 `@nocobase/client` 提供，不会打包到插件产物中，自身的依赖会被打包到产物中。

因为自身的依赖会被打包到产物中（包括 server 依赖的 npm 包，也会被打包到 `dist/node_modules`），所以在开发插件时，将所有依赖放到 `devDependencies` 中即可。

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
'multer',
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
