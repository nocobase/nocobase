:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::

# Gestión de Dependencias

En el desarrollo de `plugins` para NocoBase, las dependencias se dividen en dos categorías: **dependencias del `plugin`** y **dependencias globales**.

- **Dependencias globales**: Son proporcionadas por `@nocobase/server` y `@nocobase/client`, por lo que los `plugins` no necesitan empaquetarlas por separado.
- **Dependencias del `plugin`**: Son las dependencias exclusivas del `plugin` (incluidas las dependencias del lado del servidor) y se empaquetarán junto con los artefactos del `plugin`.

## Principios de Desarrollo

Dado que las dependencias de un `plugin` se empaquetarán junto con sus artefactos (incluidas las dependencias del servidor, que se empaquetarán en `dist/node_modules`), le recomendamos que declare todas las dependencias en `devDependencies` en lugar de `dependencies` durante el desarrollo del `plugin`. Esto ayuda a evitar diferencias entre los entornos de desarrollo y producción.

Cuando un `plugin` necesite instalar las siguientes dependencias, asegúrese de que el **número de versión** coincida con las dependencias globales de `@nocobase/server` y `@nocobase/client`. De lo contrario, podrían producirse conflictos en tiempo de ejecución.

## Dependencias Globales

Las siguientes dependencias son proporcionadas por NocoBase y no necesitan ser empaquetadas en los `plugins`. Si fuera necesario utilizarlas, sus versiones deben coincidir con la versión del `framework`.

``` js
// Núcleo de NocoBase
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

// Ecosistema de Koa
'koa',
'@koa/cors',
'@koa/router',
'multer',
'@koa/multer',
'koa-bodyparser',
'koa-static',
'koa-send',

// Ecosistema de React
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

// Utilidades comunes
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

## Recomendaciones de Desarrollo

1.  **Mantenga la consistencia de las dependencias**\
    Si necesita utilizar paquetes que ya existen en las dependencias globales, evite instalar versiones diferentes y utilice directamente las dependencias globales.

2.  **Minimice el tamaño del paquete**\
    Para las librerías de UI comunes (como `antd`), librerías de utilidades (como `lodash`) y controladores de bases de datos (como `pg`, `mysql2`), le recomendamos que dependa de las versiones proporcionadas globalmente para evitar el empaquetado duplicado.

3.  **Consistencia entre entornos de depuración y producción**\
    El uso de `devDependencies` garantiza la consistencia entre el desarrollo y los artefactos finales, evitando diferencias en el entorno causadas por una configuración incorrecta de `dependencies` y `peerDependencies`.