---
title: "nb proxy caddy generate"
description: "CLI 管理 env 向けの Caddy 設定を生成または更新します。"
keywords: "nb proxy caddy generate,NocoBase CLI,caddy,reverse proxy,proxy configuration"
---

# nb proxy caddy generate

CLI 管理 env 向けの Caddy エントリ設定を生成または更新します。

## 使い方

```bash
nb proxy caddy generate --env <name> [--host <domain>] [--port <port>]
```

## パラメーター

| パラメーター | 型 | 説明 |
| --- | --- | --- |
| `--env`, `-e` | string | 設定を生成する対象の CLI 管理 env 名 |
| `--host` | string | サイトアドレスへ書き込むホスト名。例: `app1.example.com` |
| `--port` | string | サイトアドレスへ書き込む待受ポート。例: `8080` |

## 生成されるファイル

env `test2` を例にすると、通常は次のファイルやディレクトリが管理されます。

- `NB_CLI_ROOT/.nocobase/proxy/caddy/nocobase.caddy`
- `NB_CLI_ROOT/.nocobase/proxy/caddy/test2/app.caddy`
- `NB_CLI_ROOT/.nocobase/proxy/caddy/test2/public/index-v1.html`
- `NB_CLI_ROOT/.nocobase/proxy/caddy/test2/public/index-v2.html`

現在の構成では、`app.caddy` は 1 つの env 用の完全なサイト設定であり、別の `generated.caddy` ファイルへ分割されません。

## 例

```bash
nb proxy caddy generate --env demo --host demo.local.nocobase.com
nb proxy caddy generate --env demo --host demo.local.nocobase.com --port 8080
```

## 注意

- `generate` は設定を書き込むか更新するだけで、Caddy は自動起動しません
- 設定を再生成すると `app.caddy` 全体が上書きされます
- `nb env update` で `app-port` や `app-public-path` などを変更した場合は、通常このコマンドを再実行する必要があります
- このコマンドを使えるのは、CLI 管理の `local` または `docker` env だけです

## 関連コマンド

- [`nb proxy caddy start`](./start.md)
- [`nb proxy caddy reload`](./reload.md)
- [`nb env update`](../../env/update.md)
