:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::

# Afhankelijkheidsbeheer

Bij de ontwikkeling van NocoBase plugins worden afhankelijkheden onderverdeeld in twee categorieën: **pluginafhankelijkheden** en **globale afhankelijkheden**.

- **Globale afhankelijkheden**: Deze worden geleverd door `@nocobase/server` en `@nocobase/client`. Plugins hoeven deze niet afzonderlijk te bundelen.
- **Pluginafhankelijkheden**: Dit zijn de unieke afhankelijkheden van een plugin (inclusief server-side afhankelijkheden), die worden gebundeld in de plugin-artefacten.

## Ontwikkelingsprincipes

Aangezien pluginafhankelijkheden worden gebundeld in de plugin-artefacten (inclusief serverafhankelijkheden die worden gebundeld in `dist/node_modules`), kunt u tijdens de pluginontwikkeling alle afhankelijkheden declareren in `devDependencies` in plaats van `dependencies`. Dit voorkomt verschillen tussen de ontwikkel- en productieomgeving.

Wanneer een plugin de volgende afhankelijkheden moet installeren, zorg er dan voor dat het **versienummer** overeenkomt met de globale afhankelijkheden in `@nocobase/server` en `@nocobase/client`. Anders kunnen er runtimeconflicten ontstaan.

## Globale afhankelijkheden

De volgende afhankelijkheden worden geleverd door NocoBase en hoeven niet te worden gebundeld in plugins. Indien u ze toch nodig heeft, moeten ze overeenkomen met de frameworkversie.

``` js
// NocoBase kern
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

// Koa ecosysteem
'koa',
'@koa/cors',
'@koa/router',
'multer',
'@koa/multer',
'koa-bodyparser',
'koa-static',
'koa-send',

// React ecosysteem
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

// Algemene hulpprogramma's
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

## Ontwikkelingsaanbevelingen

1.  **Behoud van afhankelijkheidsconsistentie**\
    Als u pakketten wilt gebruiken die al in de globale afhankelijkheden aanwezig zijn, vermijd dan het installeren van verschillende versies en gebruik direct de globale afhankelijkheden.

2.  **Minimaliseer de bundelgrootte**\
    Voor veelvoorkomende UI-bibliotheken (zoals `antd`), utility-bibliotheken (zoals `lodash`) en database drivers (zoals `pg`, `mysql2`), moet u vertrouwen op de globaal geleverde versies om dubbele bundling te voorkomen.

3.  **Consistentie tussen debug- en productieomgevingen**\
    Het gebruik van `devDependencies` zorgt ervoor dat de ontwikkeling en de uiteindelijke artefacten consistent zijn, en voorkomt omgevingsverschillen die worden veroorzaakt door onjuiste configuratie van `dependencies` en `peerDependencies`.