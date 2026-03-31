:::tip
このドキュメントはAIによって翻訳されました。不正確な情報については、[英語版](/en)をご参照ください
:::

# 依存関係の管理

NocoBase の**プラグイン**開発では、依存関係は**プラグイン固有の依存関係**と**グローバルな依存関係**の2種類に分けられます。

- **グローバルな依存関係**: `@nocobase/server` と `@nocobase/client` によって提供されるため、**プラグイン**で個別にバンドルする必要はありません。
- **プラグイン固有の依存関係**: **プラグイン**独自の依存関係（サーバーサイドの依存関係を含む）は、**プラグイン**の成果物にバンドルされます。

## 開発原則

**プラグイン**固有の依存関係は**プラグイン**の成果物（サーバーの依存関係は `dist/node_modules`）にバンドルされるため、**プラグイン**開発時には、すべての依存関係を `dependencies` ではなく `devDependencies` に宣言することをおすすめします。これにより、開発環境と本番環境での差異を防ぐことができます。

**プラグイン**が以下の依存関係をインストールする必要がある場合は、**バージョン番号**がグローバルな依存関係の `@nocobase/server` および `@nocobase/client` と一致していることを確認してください。一致しない場合、ランタイムで競合が発生する可能性があります。

## グローバルな依存関係

以下の依存関係はNocoBaseによって提供されるため、**プラグイン**でバンドルする必要はありません。もし必要であれば、フレームワークのバージョンと一致させる必要があります。

``` js
// NocoBase コア
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

// Koa エコシステム
'koa',
'@koa/cors',
'@koa/router',
'multer',
'@koa/multer',
'koa-bodyparser',
'koa-static',
'koa-send',

// React エコシステム
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

// 共通ユーティリティ
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

## 開発の推奨事項

1.  **依存関係の一貫性を保つ**\
    グローバルな依存関係に既に存在するパッケージを使用する必要がある場合は、異なるバージョンをインストールせず、グローバルな依存関係を直接使用してください。

2.  **バンドルサイズを最小限に抑える**\
    一般的なUIライブラリ（`antd`など）、ユーティリティライブラリ（`lodash`など）、データベースドライバー（`pg`、`mysql2`など）については、グローバルに提供されているバージョンに依存し、重複したバンドルを避けるべきです。

3.  **デバッグ環境と本番環境の一貫性**\
    `devDependencies` を使用することで、開発環境と最終的な成果物の一貫性を保ち、`dependencies` や `peerDependencies` の不適切な設定による環境の差異を防ぐことができます。