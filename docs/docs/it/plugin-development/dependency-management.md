:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::

# Gestione delle Dipendenze

Nello sviluppo di **plugin** per NocoBase, le dipendenze si dividono in due categorie: **dipendenze proprie del plugin** e **dipendenze globali**.

- **Dipendenze globali**: Sono fornite da `@nocobase/server` e `@nocobase/client`; i **plugin** non devono pacchettizzarle separatamente.
- **Dipendenze proprie del plugin**: Sono le dipendenze esclusive del **plugin** (incluse quelle lato server) e verranno pacchettizzate negli artefatti del **plugin**.

## Principi di Sviluppo

Poiché le dipendenze proprie del **plugin** verranno pacchettizzate negli artefatti del **plugin** (incluse le dipendenze lato server, che verranno pacchettizzate in `dist/node_modules`), durante lo sviluppo del **plugin** è consigliabile dichiarare tutte le dipendenze in `devDependencies` anziché in `dependencies`. Questo approccio evita differenze tra gli ambienti di sviluppo e di produzione.

Quando un **plugin** necessita di installare le seguenti dipendenze, La preghiamo di assicurarsi che il **numero di versione** corrisponda a quello delle dipendenze globali in `@nocobase/server` e `@nocobase/client`, altrimenti potrebbero verificarsi conflitti durante l'esecuzione.

## Dipendenze Globali

Le seguenti dipendenze sono fornite da NocoBase e non devono essere pacchettizzate nei **plugin**. Se strettamente necessario, dovrebbero corrispondere alla versione del framework.

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

## Consigli per lo Sviluppo

1.  **Mantenere la coerenza delle dipendenze**\
    Se ha bisogno di utilizzare pacchetti già presenti nelle dipendenze globali, eviti di installare versioni diverse e utilizzi direttamente le dipendenze globali.

2.  **Minimizzare la dimensione del bundle**\
    Per le librerie UI comuni (come `antd`), le librerie di utilità (come `lodash`) e i driver di database (come `pg`, `mysql2`), La invitiamo a fare affidamento sulle versioni fornite globalmente per evitare una pacchettizzazione duplicata.

3.  **Coerenza tra ambienti di debug e di produzione**\
    L'utilizzo di `devDependencies` garantisce la coerenza tra lo sviluppo e gli artefatti finali, evitando differenze ambientali causate da una configurazione impropria di `dependencies` e `peerDependencies`.