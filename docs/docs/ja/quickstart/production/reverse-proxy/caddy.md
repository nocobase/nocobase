---
title: "Caddy"
description: "CLI 管理の NocoBase env に対して、nb proxy caddy を使って Caddy のリバースプロキシ設定を生成・管理します。"
keywords: "NocoBase,nb proxy caddy,reverse proxy,Caddy,production"
---

# Caddy

すでにドメインがあり、HTTPS を素早く有効化したい場合は、`nb proxy caddy` が最もシンプルな入口になることが多いです。

## 推奨される順序

`local` または `docker` の CLI 管理 env では、通常は次の順序で進めます。

```bash
nb proxy caddy use docker
nb proxy caddy generate --env test2 --host c.local.nocobase.com
nb proxy caddy start
```

ローカルプロセスとして動かす場合は次の通りです。

```bash
nb proxy caddy use local
nb proxy caddy generate --env test2 --host c.local.nocobase.com
nb proxy caddy start
```

後続でよく使うコマンドは次の通りです。

```bash
nb proxy caddy current
nb proxy caddy status
nb proxy caddy info
nb proxy caddy reload
nb proxy caddy restart
nb proxy caddy stop
```

## `generate` に必要な入力

最も一般的な形は次の通りです。

```bash
nb proxy caddy generate --env test2 --host c.local.nocobase.com
```

エントリポートも指定したい場合は、次のように書けます。

```bash
nb proxy caddy generate --env test2 --host c.local.nocobase.com --port 8080
```

各引数の意味は次の通りです。

- `--env`: 設定を生成する対象の CLI env
- `--host`: 公開用のドメイン名
- `--port`: プロキシのエントリポート

Caddy では、`--host` が特に重要です。サイトアドレスが HTTPS の流れに強く影響するためです。

## CLI が管理するファイル

`test2` を例にすると、Caddy のワークフローでは通常次のファイルやディレクトリを管理します。

- `NB_CLI_ROOT/.nocobase/proxy/caddy/test2/app.caddy`
- `NB_CLI_ROOT/.nocobase/proxy/caddy/nocobase.caddy`
- `NB_CLI_ROOT/.nocobase/proxy/caddy/test2/public/index-v1.html`
- `NB_CLI_ROOT/.nocobase/proxy/caddy/test2/public/index-v2.html`
- `NB_CLI_ROOT/test2/storage/dist-client`
- `NB_CLI_ROOT/test2/storage/uploads`

ここで：

- `nocobase.caddy` は provider レベルのエントリファイルで、各 env の `app.caddy` を取り込みます
- `app.caddy` は 1 つの env 用の完全なサイト設定で、再生成すると全体が上書きされます

## 手書き設定

アプリが CLI 管理ではない場合や、Caddy 設定全体を意図的に自分で維持したい場合は、手書きで構成することもできます。

ただし NocoBase では、本番向けの Caddy エントリは、単純な `reverse_proxy` 1 行で済むものではありません。通常は uploads、フロントエンド資産、`.well-known` ルート、WebSocket、SPA フォールバックページも一緒に扱います。

アプリがサブパス配置を使っている場合や、資産、uploads、エントリレイヤーで同じパスの見え方を共有していない場合は、手書き設定のほうが間違えやすくなります。そういう場合は、まず次のコマンドで設定を生成してから確認するほうが安全です。

```bash
nb proxy caddy generate --env test2 --host c.local.nocobase.com
```

## 関連リンク

- [本番環境のリバースプロキシ](./index.md)
- [Nginx](./nginx.md)
- [CLI でインストール](../../installation/cli.md)
