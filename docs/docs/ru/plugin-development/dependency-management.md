:::tip Уведомление о переводе ИИ
Эта документация была автоматически переведена ИИ.
:::

# Управление зависимостями

При разработке плагинов NocoBase зависимости делятся на две категории: **зависимости плагина** и **глобальные зависимости**.

- **Глобальные зависимости**: Предоставляются `@nocobase/server` и `@nocobase/client`, плагинам не требуется упаковывать их отдельно.
- **Зависимости плагина**: Уникальные зависимости плагина (включая серверные зависимости) будут упакованы в артефакты плагина.

## Принципы разработки

Поскольку зависимости плагина будут упакованы в его артефакты (включая серверные зависимости, которые будут упакованы в `dist/node_modules`), при разработке плагинов вы можете объявлять все зависимости в `devDependencies`, а не в `dependencies`. Это позволяет избежать различий между средами разработки и продакшена.

Когда плагину требуется установить следующие зависимости, убедитесь, что **номер версии** совпадает с глобальными зависимостями `@nocobase/server` и `@nocobase/client`, иначе могут возникнуть конфликты во время выполнения.

## Глобальные зависимости

Следующие зависимости предоставляются NocoBase и не требуют упаковки в плагины. Если они вам действительно необходимы, их версии должны соответствовать версии фреймворка.

``` js
// Ядро NocoBase
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

// Экосистема Koa
'koa',
'@koa/cors',
'@koa/router',
'multer',
'@koa/multer',
'koa-bodyparser',
'koa-static',
'koa-send',

// Экосистема React
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

// Общие утилиты
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

1.  **Поддерживайте согласованность зависимостей**\
    Если вам необходимо использовать пакеты, которые уже существуют в глобальных зависимостях, избегайте установки других версий и используйте глобальные зависимости напрямую.

2.  **Минимизируйте размер сборки**\
    Для распространённых UI-библиотек (таких как `antd`), утилит (например, `lodash`) и драйверов баз данных (например, `pg`, `mysql2`) следует использовать глобально предоставляемые версии, чтобы избежать дублирующей упаковки.

3.  **Согласованность сред отладки и продакшена**\
    Использование `devDependencies` обеспечивает согласованность между средой разработки и конечными артефактами, предотвращая различия в окружении, вызванные некорректной конфигурацией `dependencies` и `peerDependencies`.