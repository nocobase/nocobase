:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::

# Beroendehantering

I NocoBase pluginutveckling delas beroenden in i två kategorier: **pluginberoenden** och **globala beroenden**.

-   **Globala beroenden**: Tillhandahålls av `@nocobase/server` och `@nocobase/client`. Plugin behöver inte paketeras separat.
-   **Pluginberoenden**: Pluginens unika beroenden (inklusive serverberoenden) kommer att paketeras in i pluginens slutprodukter.

## Utvecklingsprinciper

Eftersom pluginberoenden paketeras in i pluginens slutprodukter (inklusive serverberoenden som paketeras till `dist/node_modules`), kan ni under pluginutvecklingen deklarera alla beroenden i `devDependencies` istället för `dependencies`. Detta undviker skillnader mellan utvecklings- och produktionsmiljöer.

När ett plugin behöver installera följande beroenden, se till att **versionsnumret** överensstämmer med de globala beroendena i `@nocobase/server` och `@nocobase/client`, annars kan det uppstå körningskonflikter.

## Globala beroenden

Följande beroenden tillhandahålls av NocoBase och behöver inte paketeras i plugin. Om de ändå behövs, bör de matcha ramverkets version.

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

## Utvecklingsrekommendationer

1.  **Bibehåll beroendekonsistens**\
    Om ni behöver använda paket som redan finns i globala beroenden, undvik att installera olika versioner och använd de globala beroendena direkt.

2.  **Minimera paketeringsstorleken**\
    För vanliga UI-bibliotek (som `antd`), verktygsbibliotek (som `lodash`) och databasdrivrutiner (som `pg`, `mysql2`), bör ni förlita er på de globalt tillhandahållna versionerna för att undvika dubbel paketering.

3.  **Konsistens mellan utvecklings- och produktionsmiljöer**\
    Genom att använda `devDependencies` säkerställer ni konsistens mellan utveckling och slutprodukter, vilket undviker miljöskillnader orsakade av felaktig konfiguration av `dependencies` och `peerDependencies`.