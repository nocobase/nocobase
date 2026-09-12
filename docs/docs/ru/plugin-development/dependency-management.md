# Управление зависимостями

В разработке плагинов NocoBase зависимости делятся на две категории: **зависимости плагина** и **глобальные зависимости**.

- **Глобальные зависимости**: предоставляются `@nocobase/server` и `@nocobase/client`, поэтому плагину не нужно бандлить их отдельно.
- **Зависимости плагина**: уникальные зависимости плагина (включая серверные зависимости) будут включены в артефакты плагина.

## Принципы разработки

Так как зависимости плагина будут включены в артефакты (включая серверные зависимости в `dist/node_modules`), во время разработки можно объявлять все зависимости в `devDependencies`, а не в `dependencies`. Это позволяет избежать расхождений между средами разработки и продакшена.

Когда плагину требуется установить перечисленные ниже зависимости, убедитесь, что **номер версии** совпадает с глобальными зависимостями в `@nocobase/server` и `@nocobase/client`, иначе возможны конфликты во время выполнения.

## Глобальные зависимости

Следующие зависимости предоставляются NocoBase и не должны бандлиться внутри плагинов. При необходимости их версии должны соответствовать версии фреймворка.

``` js
// ядро nocobase
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

// экосистема koa
'koa',
'@koa/cors',
'@koa/router',
'multer',
'@koa/multer',
'koa-bodyparser',
'koa-static',
'koa-send',

// экосистема React
'react',
'react-dom',
'react/jsx-runtime',

// Маршрутизатор React
'react-router',
'react-router-dom',

// UI-библиотека Ant Design
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

// Библиотека форм Formily
'@formily/antd-v5',
'@formily/core',
'@formily/react',
'@formily/json-schema',
'@formily/path',
'@formily/validator',
'@formily/shared',
'@formily/reactive',
'@formily/reactive-react',

// общие утилиты
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

## Рекомендации по разработке

1. **Поддерживайте согласованность зависимостей**  
   Если нужно использовать пакеты, которые уже есть среди глобальных зависимостей, избегайте установки других версий и используйте глобальные зависимости напрямую.

2. **Минимизируйте размер бандла**  
   Для распространенных UI-библиотек (например, `antd`), утилит (например, `lodash`) и драйверов БД (например, `pg`, `mysql2`) лучше опираться на глобально предоставляемые версии, чтобы избежать дублирующего бандлинга.

3. **Согласованность между отладкой и продакшеном**  
   Использование `devDependencies` обеспечивает согласованность между разработкой и итоговыми артефактами, предотвращая различия окружений из-за некорректной конфигурации `dependencies` и `peerDependencies`.