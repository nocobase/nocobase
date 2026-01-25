# 依赖管理

在 NocoBase 插件开发中，依赖分为 **自身依赖** 和 **全局依赖** 两类。

- **全局依赖**：由 `@nocobase/server` 和 `@nocobase/client` 提供，插件中无需单独打包。
- **自身依赖**：插件独有的依赖（包括 server端依赖），会被打包到插件产物中。

## 开发原则

由于自身依赖会被打包到插件产物中（包括 server 依赖会被打包到 `dist/node_modules`），因此在插件开发时，可以将所有依赖声明在 `devDependencies` 中，而不是 `dependencies`。这样可以避免在开发环境与生产环境中产生差异。

当插件需要安装下列依赖时，请确保 **版本号** 与全局依赖中 `@nocobase/server` 和 `@nocobase/client`
保持一致，否则可能导致运行时冲突。

## 全局依赖

以下依赖由 NocoBase 提供，插件中无需打包。若确有需要，应与框架版本保持一致。

``` js
// nocobase 核心
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

// koa 生态
'koa',
'@koa/cors',
'@koa/router',
'multer',
'@koa/multer',
'koa-bodyparser',
'koa-static',
'koa-send',

// React 生态
'react',
'react-dom',
'react/jsx-runtime',

// React Router
'react-router',
'react-router-dom',

// Ant Design
'antd',
'antd-style',
'@ant-design/icons',
'@ant-design/cssinjs',

// i18n
'i18next',
'react-i18next',

// dnd-kit
'@dnd-kit/accessibility',
'@dnd-kit/core',
'@dnd-kit/modifiers',
'@dnd-kit/sortable',
'@dnd-kit/utilities',

// Formily
'@formily/antd-v5',
'@formily/core',
'@formily/react',
'@formily/json-schema',
'@formily/path',
'@formily/validator',
'@formily/shared',
'@formily/reactive',
'@formily/reactive-react',

// 通用工具
'dayjs',
'mysql2',
'pg',
'pg-hstore',
'supertest',
'axios',
'@emotion/css',
'ahooks',
'lodash',
```

## 开发建议

1.  **保持依赖一致性**\
    如果需要使用全局依赖中已存在的包，请避免安装不同版本，直接使用全局依赖即可。

2.  **尽量减少打包体积**\
    对于常见的 UI 库（如 `antd`）、工具库（如 `lodash`）、数据库驱动（如
    `pg`、`mysql2`），应依赖全局提供的版本，避免重复打包。

3.  **调试与生产环境一致**\
    使用 `devDependencies` 即可保证开发与最终产物一致，避免因
    `dependencies` 与 `peerDependencies` 配置不当导致的环境差异。
