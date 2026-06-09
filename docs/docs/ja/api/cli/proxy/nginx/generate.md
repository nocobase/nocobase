---
title: "nb proxy nginx generate"
description: "CLI 管理 env 向けの Nginx 設定を生成または更新します。"
keywords: "nb proxy nginx generate,NocoBase CLI,nginx,reverse proxy,proxy configuration"
---

# nb proxy nginx generate

CLI 管理 env 向けの Nginx エントリ設定を生成または更新します。

## 使い方

```bash
nb proxy nginx generate --env <name> [--host <domain>] [--port <port>]
```

## パラメーター

| パラメーター | 型 | 説明 |
| --- | --- | --- |
| `--env`, `-e` | string | 設定を生成する対象の CLI 管理 env 名 |
| `--host` | string | エントリ設定へ書き込むホスト名。例: `app1.example.com` |
| `--port` | string | エントリ設定へ書き込む待受ポート。例: `8080` |

## 生成されるファイル

env `test2` を例にすると、通常は次のファイルやディレクトリが管理されます。

- `NB_CLI_ROOT/.nocobase/proxy/nginx/nocobase.conf`
- `NB_CLI_ROOT/.nocobase/proxy/nginx/snippets/`
- `NB_CLI_ROOT/.nocobase/proxy/nginx/test2/app.conf`
- `NB_CLI_ROOT/.nocobase/proxy/nginx/test2/public/index-v1.html`
- `NB_CLI_ROOT/.nocobase/proxy/nginx/test2/public/index-v2.html`

生成されたエントリは主に次の領域をカバーします。

- `uploads`
- `dist`
- `well-known`
- `api`
- `ws`
- `spa`

## 例

```bash
nb proxy nginx generate --env demo --host demo.local.nocobase.com
nb proxy nginx generate --env demo --host demo.local.nocobase.com --port 8080
```

## 注意

- `generate` は設定を書き込むか更新するだけで、Nginx は自動起動しません
- `app.conf` は編集可能なエントリファイルですが、管理ブロックは保持する必要があります
- `nb env update` で `app-port` や `app-public-path` などを変更した場合は、通常このコマンドを再実行する必要があります
- このコマンドを使えるのは、CLI 管理の `local` または `docker` env だけです

## 関連コマンド

- [`nb proxy nginx start`](./start.md)
- [`nb proxy nginx reload`](./reload.md)
- [`nb env update`](../../env/update.md)
