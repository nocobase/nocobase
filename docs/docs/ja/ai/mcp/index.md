---
pkg: '@nocobase/plugin-mcp-server'
sidebar: false
---

# NocoBase MCP

NocoBase MCP サービスプラグインを有効にすると、NocoBase アプリケーションが MCP サービスインターフェースを公開し、MCP クライアントから NocoBase のインターフェースにアクセス・呼び出しができるようになります。

## サービスアドレス

- メインアプリケーション：

  `http(s)://<host>:<port>/api/mcp`

- サブアプリケーション：

  `http(s)://<host>:<port>/api/__app/<app_name>/mcp`

このアドレスは `streamable HTTP` トランスポートプロトコルを使用します。

## 提供する機能

### 汎用ツール

データテーブルの操作に使用できます

| ツール名           | 機能説明                                       |
| ------------------ | ---------------------------------------------- |
| `resource_list`    | データ一覧の取得                               |
| `resource_get`     | データ詳細の取得                               |
| `resource_create`  | データの作成                                   |
| `resource_update`  | データの更新                                   |
| `resource_destroy` | データの削除                                   |
| `resource_query`   | データのクエリ。集計やリレーションクエリなどの複雑な条件をサポート |

### NocoBase コアおよび各種プラグインインターフェース

リクエストヘッダー `x-mcp-packages` で MCP がどのパッケージのインターフェースを公開するかを制御できます。例：

```bash
x-mcp-packages: @nocobase/server,plugin-workflow*,plugin-users
```

このリクエストヘッダーは完全なパッケージ名を指定でき、scope が未指定の場合は自動的に `@nocobase/` が補完されます。

デフォルトでは汎用ツール以外のパッケージインターフェースは読み込まれません。その他のシステム機能の操作には [NocoBase CLI](../quick-start.md) の使用をお勧めします。

よく使うパッケージの説明：

| パッケージ名                           | 機能説明                                 |
| -------------------------------------- | ---------------------------------------- |
| `@nocobase/plugin-data-source-main`    | メインデータソースの管理。データテーブルの作成、フィールドの追加など |
| `@nocobase/plugin-data-source-manager` | データソースの管理。利用可能なデータソース情報の取得 |
| `@nocobase/plugin-workflow`            | ワークフローの管理                       |
| `@nocobase/plugin-acl`                 | ロールと権限の管理                       |
| `@nocobase/plugin-users`               | ユーザーの管理                           |

その他のパッケージと関連インターフェースの説明は [API ドキュメント](/integration/api-doc) プラグインで確認できます。

## 認証方式

### API Key 認証

[API keys](/auth-verification/api-keys/index.md) プラグインで作成した API key を使用して MCP サービスインターフェースを呼び出します。権限は API key にバインドされたロールによって決まります。

### OAuth 認証

OAuth 認証・認可後に取得した access token を使用して MCP サービスインターフェースを呼び出します。権限は認可されたユーザーによって決まります。ユーザーが複数のロールを持つ場合、リクエストヘッダー `x-role` で呼び出しロールを設定できます。

## クイックスタート

### Codex

#### API Key 認証の使用

まず API Keys プラグインを有効にし、API Key を作成します。

```bash
export NOCOBASE_API_TOKEN=<your_api_key>
codex mcp add nocobase --url https://<host>:<port>/api/mcp --bearer-token-env-var NOCOBASE_API_TOKEN
```

#### OAuth 認証の使用

まず IdP: OAuth プラグインを有効にします。

```bash
codex mcp add nocobase --url https://<host>:<port>/api/mcp
codex mcp login nocobase --scopes mcp,offline_access
```

### Claude Code

#### API Key 認証の使用

まず API Keys プラグインを有効にし、API Key を作成します。

```bash
claude mcp add --transport http nocobase https://<host>:<port>/api/mcp --header "Authorization: Bearer <your_api_key>"
```

#### OAuth 認証の使用

まず IdP: OAuth プラグインを有効にします。

```bash
claude mcp add --transport http nocobase https://<host>:<port>/api/mcp
```

実行完了後、Claude を開いて対応する MCP サービスを選択してログインします：

```bash
claude
/mcp
```

### OpenCode

#### API Key 認証の使用

まず API Keys プラグインを有効にし、API Key を作成します。`opencode.json` を設定します：

```json
{
  "mcp": {
    "nocobase": {
      "type": "remote",
      "url": "https://<host>:<port>/api/mcp",
      "enabled": true,
      "headers": {
        "Authorization": "Bearer <your_api_key>"
      }
    }
  },
  "$schema": "https://opencode.ai/config.json"
}
```

#### OAuth 認証の使用

まず IdP: OAuth プラグインを有効にします。`opencode.json` を設定します：

```json
{
  "mcp": {
    "nocobase": {
      "type": "remote",
      "url": "https://<host>:<port>/api/mcp",
      "enabled": true
    }
  },
  "$schema": "https://opencode.ai/config.json"
}
```

ログイン認証

```bash
opencode mcp auth nocobase
```

Debug

```bash
opencode mcp debug nocobase
```
