:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::

# Zarządzanie zależnościami

W tworzeniu wtyczek NocoBase, zależności dzielą się na dwie kategorie: **zależności wtyczki** i **zależności globalne**.

- **Zależności globalne**: Są dostarczane przez `@nocobase/server` i `@nocobase/client`. Wtyczki nie muszą ich osobno pakować.
- **Zależności wtyczki**: To unikalne zależności wtyczki (w tym zależności po stronie serwera), które zostaną spakowane do artefaktów wtyczki.

## Zasady tworzenia

Ponieważ zależności wtyczki zostaną spakowane do jej artefaktów (w tym zależności serwerowe do `dist/node_modules`), podczas tworzenia wtyczki mogą Państwo zadeklarować wszystkie zależności w `devDependencies` zamiast w `dependencies`. Pozwala to uniknąć różnic między środowiskiem deweloperskim a produkcyjnym.

Gdy wtyczka wymaga instalacji poniższych zależności, proszę upewnić się, że **numer wersji** jest zgodny z zależnościami globalnymi w `@nocobase/server` i `@nocobase/client`. W przeciwnym razie mogą wystąpić konflikty podczas działania.

## Zależności globalne

Poniższe zależności są dostarczane przez NocoBase i nie muszą być pakowane we wtyczkach. Jeśli zajdzie taka potrzeba, ich wersja powinna być zgodna z wersją frameworka.

``` js
// rdzeń NocoBase
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

// ekosystem Koa
'koa',
'@koa/cors',
'@koa/router',
'multer',
'@koa/multer',
'koa-bodyparser',
'koa-static',
'koa-send',

// ekosystem React
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

// Ogólne narzędzia
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

## Zalecenia dotyczące tworzenia

1.  **Zachowanie spójności zależności**\
    Jeśli potrzebują Państwo użyć pakietów, które już istnieją w zależnościach globalnych, proszę unikać instalowania innych wersji i bezpośrednio korzystać z zależności globalnych.

2.  **Minimalizacja rozmiaru pakietu**\
    W przypadku popularnych bibliotek UI (np. `antd`), bibliotek narzędziowych (np. `lodash`) oraz sterowników baz danych (np. `pg`, `mysql2`), należy polegać na wersjach dostarczanych globalnie, aby uniknąć podwójnego pakowania.

3.  **Spójność między środowiskiem deweloperskim a produkcyjnym**\
    Użycie `devDependencies` zapewnia spójność między środowiskiem deweloperskim a ostatecznymi artefaktami, co pozwala uniknąć różnic środowiskowych spowodowanych niewłaściwą konfiguracją `dependencies` i `peerDependencies`.