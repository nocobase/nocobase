:::tip Повідомлення про переклад ШІ
Ця документація була автоматично перекладена штучним інтелектом.
:::


# Управління залежностями

У розробці плагінів NocoBase залежності поділяються на дві категорії: **залежності плагіна** та **глобальні залежності**.

-   **Глобальні залежності**: Надаються `@nocobase/server` та `@nocobase/client`, плагінам не потрібно їх окремо пакувати.
-   **Залежності плагіна**: Унікальні залежності плагінів (включно із серверними залежностями) будуть упаковані в артефакти плагіна.

## Принципи розробки

Оскільки залежності плагіна будуть упаковані в артефакти плагіна (включно із серверними залежностями, які будуть упаковані в `dist/node_modules`), під час розробки плагіна ви можете оголошувати всі залежності в `devDependencies`, а не в `dependencies`. Це дозволяє уникнути розбіжностей між середовищами розробки та виробництва.

Коли плагіну потрібно встановити наступні залежності, переконайтеся, що **номер версії** відповідає глобальним залежностям у `@nocobase/server` та `@nocobase/client`, інакше можуть виникнути конфлікти під час виконання.

## Глобальні залежності

Наступні залежності надаються NocoBase і не потребують пакування в плагінах. Якщо вони все ж необхідні, їх версія повинна відповідати версії фреймворку.

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

// Екосистема Koa
'koa',
'@koa/cors',
'@koa/router',
'multer',
'@koa/multer',
'koa-bodyparser',
'koa-static',
'koa-send',

// Екосистема React
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

// Загальні утиліти
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

## Рекомендації з розробки

1.  **Підтримуйте узгодженість залежностей**\
    Якщо вам потрібно використовувати пакети, які вже існують у глобальних залежностях, уникайте встановлення інших версій і використовуйте безпосередньо глобальні залежності.

2.  **Мінімізуйте розмір бандла**\
    Для поширених бібліотек інтерфейсу користувача (наприклад, `antd`), бібліотек утиліт (наприклад, `lodash`), драйверів баз даних (наприклад, `pg`, `mysql2`) слід покладатися на глобально надані версії, щоб уникнути повторного пакування.

3.  **Узгодженість між середовищами налагодження та виробництва**\
    Використання `devDependencies` гарантує узгодженість між розробкою та кінцевими артефактами, уникаючи відмінностей у середовищі, спричинених неправильною конфігурацією `dependencies` та `peerDependencies`.