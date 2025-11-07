# Dependency Management

In NocoBase plugin development, dependencies are divided into two categories: **plugin dependencies** and **global dependencies**.

- **Global dependencies**: Provided by `@nocobase/server` and `@nocobase/client`, plugins don't need to bundle them separately.
- **Plugin dependencies**: Plugins' unique dependencies (including server-side dependencies) will be bundled into the plugin artifacts.

## Development Principles

Since plugin dependencies will be bundled into the plugin artifacts (including server dependencies being bundled into `dist/node_modules`), during plugin development, you can declare all dependencies in `devDependencies` instead of `dependencies`. This avoids differences between development and production environments.

When a plugin needs to install the following dependencies, make sure the **version number** matches the global dependencies in `@nocobase/server` and `@nocobase/client`, otherwise runtime conflicts may occur.

## Global Dependencies

The following dependencies are provided by NocoBase and don't need to be bundled in plugins. If needed, they should match the framework version.

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

1. **Maintain Dependency Consistency**  
   If you need to use packages that already exist in global dependencies, avoid installing different versions and use the global dependencies directly.

2. **Minimize Bundle Size**  
   For common UI libraries (such as `antd`), utility libraries (such as `lodash`), database drivers (such as `pg`, `mysql2`), you should rely on globally provided versions to avoid duplicate bundling.

3. **Consistency Between Debug and Production Environments**  
   Using `devDependencies` ensures consistency between development and final artifacts, avoiding environment differences caused by improper configuration of `dependencies` and `peerDependencies`.

