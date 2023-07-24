# Dependency management

The dependencies of the plugin are divided into its own dependencies and global dependencies. Global dependencies are provided by `@nocobase/server` and `@nocobase/client`, and will not be packaged into the plugin product. Its own dependencies will be packaged into the product.

Because the dependencies of the plugin itself will be packaged into the product (including the npm packages that the server depends on, which will also be packaged into `dist/node_modules`), when developing the plugin, all dependencies should be placed in `devDependencies`.

<Alert type="warning">
When installing the following dependencies, pay attention to the **version** and keep consistent with `@nocobase/server` and `@nocobase/client`.
</Alert>

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
