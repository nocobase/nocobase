:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::

# Abhängigkeitsverwaltung

Bei der Entwicklung von NocoBase-Plugins unterscheiden wir zwei Arten von Abhängigkeiten: **Plugin-Abhängigkeiten** und **globale Abhängigkeiten**.

- **Globale Abhängigkeiten**: Diese werden von `@nocobase/server` und `@nocobase/client` bereitgestellt. Plugins müssen sie nicht separat bündeln.
- **Plugin-Abhängigkeiten**: Dies sind die spezifischen Abhängigkeiten eines Plugins (einschließlich serverseitiger Abhängigkeiten). Sie werden in die Plugin-Artefakte gebündelt.

## Entwicklungsprinzipien

Da Plugin-Abhängigkeiten in die Plugin-Artefakte gebündelt werden (einschließlich serverseitiger Abhängigkeiten, die in `dist/node_modules` landen), können Sie während der Plugin-Entwicklung alle Abhängigkeiten in `devDependencies` statt in `dependencies` deklarieren. Dies verhindert Unterschiede zwischen Entwicklungs- und Produktionsumgebung.

Wenn ein Plugin die folgenden Abhängigkeiten installieren muss, stellen Sie bitte sicher, dass die **Versionsnummer** mit den globalen Abhängigkeiten von `@nocobase/server` und `@nocobase/client` übereinstimmt. Andernfalls kann es zu Laufzeitkonflikten kommen.

## Globale Abhängigkeiten

Die folgenden Abhängigkeiten werden von NocoBase bereitgestellt und müssen in Plugins nicht gebündelt werden. Sollten Sie sie dennoch benötigen, stellen Sie bitte sicher, dass die Version mit der Framework-Version übereinstimmt.

``` js
// NocoBase Kern
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

// Koa Ökosystem
'koa',
'@koa/cors',
'@koa/router',
'multer',
'@koa/multer',
'koa-bodyparser',
'koa-static',
'koa-send',

// React Ökosystem
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

// Allgemeine Dienstprogramme
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

## Entwicklungsempfehlungen

1.  **Abhängigkeitskonsistenz wahren**\
    Wenn Sie Pakete verwenden möchten, die bereits in den globalen Abhängigkeiten vorhanden sind, vermeiden Sie die Installation unterschiedlicher Versionen. Nutzen Sie stattdessen direkt die globalen Abhängigkeiten.

2.  **Bundling-Größe minimieren**\
    Bei gängigen UI-Bibliotheken (wie `antd`), Utility-Bibliotheken (wie `lodash`) und Datenbanktreibern (wie `pg`, `mysql2`) sollten Sie sich auf die global bereitgestellten Versionen verlassen, um doppeltes Bundling zu vermeiden.

3.  **Konsistenz zwischen Debug- und Produktionsumgebung**\
    Die Verwendung von `devDependencies` gewährleistet die Konsistenz zwischen der Entwicklung und den finalen Artefakten. So vermeiden Sie Umgebungsunterschiede, die durch eine fehlerhafte Konfiguration von `dependencies` und `peerDependencies` entstehen könnten.