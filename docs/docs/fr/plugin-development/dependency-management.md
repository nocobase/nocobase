:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::

# Gestion des dépendances

Dans le développement de **plugin** NocoBase, les dépendances se répartissent en deux catégories : les **dépendances du plugin** et les **dépendances globales**.

- Les **dépendances globales** sont fournies par `@nocobase/server` et `@nocobase/client`. Les **plugin** n'ont pas besoin de les inclure séparément dans leur bundle.
- Les **dépendances du plugin** sont les dépendances propres à votre **plugin** (y compris les dépendances côté serveur) ; elles seront intégrées dans les livrables du **plugin**.

## Principes de développement

Étant donné que les dépendances de votre **plugin** seront intégrées dans ses livrables (y compris les dépendances côté serveur qui seront placées dans `dist/node_modules`), vous pouvez déclarer toutes les dépendances dans `devDependencies` plutôt que dans `dependencies` lors du développement de votre **plugin**. Cela permet d'éviter les différences entre les environnements de développement et de production.

Si votre **plugin** doit installer les dépendances listées ci-dessous, assurez-vous que leur **numéro de version** corresponde à celui des dépendances globales de `@nocobase/server` et `@nocobase/client`. Dans le cas contraire, des conflits d'exécution pourraient survenir.

## Dépendances globales

Les dépendances suivantes sont fournies par NocoBase et n'ont pas besoin d'être incluses dans les **plugin**. Si vous devez les utiliser, leur version doit correspondre à celle du framework.

``` js
// NocoBase (noyau)
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

// Écosystème Koa
'koa',
'@koa/cors',
'@koa/router',
'multer',
'@koa/multer',
'koa-bodyparser',
'koa-static',
'koa-send',

// Écosystème React
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

// Utilitaires courants
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

## Recommandations de développement

1.  **Maintenir la cohérence des dépendances**\
    Si vous devez utiliser des paquets qui existent déjà dans les dépendances globales, évitez d'installer des versions différentes et utilisez directement les dépendances globales.

2.  **Minimiser la taille du bundle**\
    Pour les bibliothèques d'interface utilisateur courantes (comme `antd`), les bibliothèques utilitaires (comme `lodash`) ou les pilotes de base de données (comme `pg`, `mysql2`), vous devriez vous appuyer sur les versions fournies globalement pour éviter le bundling en double.

3.  **Cohérence entre les environnements de développement et de production**\
    L'utilisation de `devDependencies` garantit la cohérence entre le développement et les livrables finaux, évitant ainsi les différences d'environnement causées par une configuration incorrecte de `dependencies` et `peerDependencies`.