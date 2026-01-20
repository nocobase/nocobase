:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::


# Správa závislostí

Při vývoji **pluginů** pro NocoBase se závislosti dělí na dvě hlavní kategorie: **závislosti pluginu** a **globální závislosti**.

-   **Globální závislosti**: Tyto závislosti jsou poskytovány balíčky `@nocobase/server` a `@nocobase/client`. Není potřeba je v **pluginu** balit samostatně.
-   **Závislosti pluginu**: Jedná se o unikátní závislosti specifické pro daný **plugin** (včetně závislostí na straně serveru), které budou zabaleny přímo do výsledného artefaktu **pluginu**.

## Principy vývoje

Jelikož se závislosti **pluginu** balí do jeho výsledných artefaktů (včetně serverových závislostí, které se balí do `dist/node_modules`), doporučujeme při vývoji **pluginů** deklarovat všechny závislosti v `devDependencies` namísto `dependencies`. Tímto přístupem předejdete rozdílům mezi vývojovým a produkčním prostředím.

Pokud **plugin** potřebuje instalovat následující závislosti, ujistěte se, že **číslo verze** odpovídá globálním závislostem v balíčcích `@nocobase/server` a `@nocobase/client`. V opačném případě by mohlo dojít ke konfliktům za běhu.

## Globální závislosti

Následující závislosti jsou poskytovány systémem NocoBase a není potřeba je balit do **pluginů**. Pokud je přesto potřebujete explicitně uvést, měly by odpovídat verzi frameworku.

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

## Doporučení pro vývoj

1.  **Udržujte konzistenci závislostí**\
    Pokud potřebujete použít balíčky, které již existují v globálních závislostech, vyhněte se instalaci odlišných verzí a použijte přímo globálně dostupné závislosti.

2.  **Minimalizujte velikost balíku**\
    U běžných UI knihoven (např. `antd`), nástrojových knihoven (např. `lodash`) a databázových ovladačů (např. `pg`, `mysql2`) byste se měli spoléhat na globálně poskytované verze, abyste předešli duplicitnímu balení.

3.  **Konzistence mezi vývojovým a produkčním prostředím**\
    Použití `devDependencies` zajistí konzistenci mezi vývojovým prostředím a finálními artefakty. Tím se vyhnete rozdílům v prostředí, které by mohly vzniknout nesprávnou konfigurací `dependencies` a `peerDependencies`.