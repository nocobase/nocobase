:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::

# Gerenciamento de Dependências

No desenvolvimento de **plugins** NocoBase, as dependências são divididas em duas categorias: **dependências próprias** e **dependências globais**.

- **Dependências globais**: São fornecidas por `@nocobase/server` e `@nocobase/client`, e os **plugins** não precisam empacotá-las separadamente.
- **Dependências próprias**: São dependências exclusivas do **plugin** (incluindo dependências do lado do servidor) e serão empacotadas nos artefatos do **plugin**.

## Princípios de Desenvolvimento

Como as dependências próprias do **plugin** serão empacotadas nos artefatos do **plugin** (incluindo as dependências do servidor, que serão empacotadas em `dist/node_modules`), durante o desenvolvimento do **plugin**, você pode declarar todas as dependências em `devDependencies` em vez de `dependencies`. Isso evita diferenças entre os ambientes de desenvolvimento e produção.

Quando um **plugin** precisar instalar as seguintes dependências, certifique-se de que o **número da versão** corresponda às dependências globais em `@nocobase/server` e `@nocobase/client`, caso contrário, podem ocorrer conflitos em tempo de execução.

## Dependências Globais

As seguintes dependências são fornecidas pelo NocoBase e não precisam ser empacotadas nos **plugins**. Se for realmente necessário, elas devem corresponder à versão do framework.

``` js
// Core do NocoBase
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

// Ecossistema Koa
'koa',
'@koa/cors',
'@koa/router',
'multer',
'@koa/multer',
'koa-bodyparser',
'koa-static',
'koa-send',

// Ecossistema React
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

// Utilitários comuns
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

## Recomendações de Desenvolvimento

1.  **Mantenha a Consistência das Dependências**\
    Se você precisar usar pacotes que já existem nas dependências globais, evite instalar versões diferentes e utilize as dependências globais diretamente.

2.  **Minimize o Tamanho do Pacote**\
    Para bibliotecas de UI comuns (como `antd`), bibliotecas de utilitários (como `lodash`) e drivers de banco de dados (como `pg`, `mysql2`), você deve depender das versões fornecidas globalmente para evitar empacotamento duplicado.

3.  **Consistência entre Ambientes de Desenvolvimento e Produção**\
    Usar `devDependencies` garante a consistência entre o desenvolvimento e os artefatos finais, evitando diferenças de ambiente causadas por uma configuração inadequada de `dependencies` e `peerDependencies`.