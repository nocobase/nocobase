# Dependency Management

In NocoBase plugin development, dependencies are divided into two categories: **self dependencies** and **global dependencies**.

- **Global dependencies**: Provided by `@nocobase/server` and `@nocobase/client`, and do not need to be bundled separately in the plugin.
- **Self dependencies**: Dependencies unique to the plugin (including server-side dependencies), which will be bundled into the plugin's build output.

## Development Principles

Since self dependencies are bundled into the plugin's build output (including server dependencies, which are bundled into `dist/node_modules`), you should declare all dependencies in `devDependencies` instead of `dependencies` during plugin development. This helps avoid discrepancies between the development and production environments.

When a plugin needs to install the following dependencies, ensure that their **version numbers** are consistent with those in the global dependencies provided by `@nocobase/server` and `@nocobase/client` to avoid runtime conflicts.

## Global Dependencies

The following dependencies are provided by NocoBase and do not need to be bundled in the plugin. If you must use them, ensure they are consistent with the framework's version.

``` js
// NocoBase core
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

// Koa ecosystem
'koa',
'@koa/cors',
'@koa/router',
'multer',
'@koa/multer',
'koa-bodyparser',
'koa-static',
'koa-send',

// React ecosystem
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

// General utilities
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

## Development Suggestions

1.  **Maintain Dependency Consistency**\
    If you need to use a package that already exists in the global dependencies, avoid installing a different version. Use the globally provided one directly.

2.  **Minimize Bundle Size**\
    For common UI libraries (like `antd`), utility libraries (like `lodash`), and database drivers (like
    `pg`, `mysql2`), you should rely on the globally provided versions to avoid duplicate bundling.

3.  **Ensure Consistency Between Debugging and Production Environments**\
    Using `devDependencies` ensures consistency between development and the final build output, preventing environment discrepancies caused by improper configuration of
    `dependencies` and `peerDependencies`.