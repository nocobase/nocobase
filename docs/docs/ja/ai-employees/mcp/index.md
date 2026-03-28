---
pkg: '@nocobase/plugin-mcp-server'
---

# NocoBase MCP

NocoBase MCP Server プラグインを有効にすると、NocoBase アプリは MCP クライアントが NocoBase API にアクセスして呼び出せる MCP エンドポイントを公開します。

## サーバー URL

- main アプリ：

  `http(s)://<host>:<port>/api/mcp`

- main 以外のアプリ：

  `http(s)://<host>:<port>/api/__app/<app_name>/mcp`

このエンドポイントは `streamable HTTP` トランスポートを使用します。

`x-mcp-packages` リクエストヘッダーを使うと、MCP が公開するパッケージ API を制御できます。例:

`x-mcp-packages: @nocobase/server,plugin-workflow*,plugin-users`

このヘッダーには完全なパッケージ名を指定できます。scope が省略されている場合は、自動的に `@nocobase/` が補われます。デフォルトでは、MCP は次のパッケージ API を読み込みます。

- `@nocobase/plugin-data-source-main`
- `@nocobase/plugin-data-source-manager`
- `@nocobase/plugin-workflow*`
- `@nocobase/plugin-acl`
- `@nocobase/plugin-users`
- `@nocobase/plugin-auth`
- `@nocobase/plugin-client`
- `@nocobase/plugin-flow-engine`
- `@nocobase/plugin-ai`

## 提供される機能

- NocoBase コアおよび各種プラグイン API
- データテーブルを操作するための汎用 CRUD ツール

## クイックスタート

### Codex

#### API Key 認証を使用する

まず API Keys プラグインを有効にし、API Key を作成します。

```bash
export NOCOBASE_API_TOKEN=<your_api_key>
codex mcp add nocobase --url http://<host>:<port>/api/mcp --bearer-token-env-var NOCOBASE_API_TOKEN
```

#### OAuth 認証を使用する

まず IdP: OAuth プラグインを有効にします。

```bash
codex mcp add nocobase --url http://<host>:<port>/api/mcp
codex mcp login nocobase --scopes mcp,offline_access
```

### Claude Code

#### API Key 認証を使用する

まず API Keys プラグインを有効にし、API Key を作成します。

```bash
claude mcp add --transport http nocobase http://<host>:<port>/api/mcp --header "Authorization: Bearer <your_api_key>"
```

#### OAuth 認証を使用する

まず IdP: OAuth プラグインを有効にします。

```bash
claude mcp add --transport http nocobase http://<host>:<port>/api/mcp
```

その後 Claude を開き、対象の MCP サービスにログインします。

```bash
claude
/mcp
```

## Skills と組み合わせて使う

NocoBase MCP は NocoBase Skills とあわせて使うことをおすすめします。詳しくは [NocoBase Skills](../skills/index.md) を参照してください。
