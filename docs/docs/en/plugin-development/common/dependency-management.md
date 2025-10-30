# Dependency Management

In NocoBase plugin development, dependencies are divided into two categories: **plugin-specific dependencies** and **global dependencies**.

- **Global dependencies**: Provided by `@nocobase/server` and `@nocobase/client`, and do not need to be bundled separately in the plugin.
- **Plugin-specific dependencies**: Dependencies unique to the plugin (including server-side dependencies), which will be bundled into the plugin's build output.

## Development Principles

Since plugin-specific dependencies will be bundled into the plugin's build output (including server dependencies being bundled into `dist/node_modules`), it is recommended to declare all dependencies in `devDependencies` instead of `dependencies` during plugin development. This helps avoid discrepancies between the development and production environments.

When a plugin needs to install the following dependencies, ensure that their **version numbers** are consistent with `@nocobase/server` and `@nocobase/client` from the global dependencies to avoid potential runtime conflicts.

## Global Dependencies

The following dependencies are provided by NocoBase and do not need to be bundled in the plugin. If you must use them, their versions should be consistent with the framework's version.

``` js
// nocobase core
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

// koa ecosystem
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

// Common utilities
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

## Development Recommendations

1.  **Maintain Dependency Consistency**\
    If you need to use a package that already exists in the global dependencies, avoid installing a different version. Use the global dependency directly.

2.  **Minimize Bundle Size**\
    For common UI libraries (like `antd`), utility libraries (like `lodash`), and database drivers (like `pg`, `mysql2`), you should rely on the globally provided versions to avoid redundant bundling.

3.  **Ensure Consistency Between Debugging and Production Environments**\
    Using `devDependencies` ensures that the development environment is consistent with the final build output, avoiding environmental differences caused by improper configuration of `dependencies` and `peerDependencies`.