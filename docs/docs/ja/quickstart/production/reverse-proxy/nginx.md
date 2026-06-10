---
title: "Nginx"
description: "CLI 管理の NocoBase env に対して、nb proxy nginx を使って Nginx のリバースプロキシ設定を生成・管理します。"
keywords: "NocoBase,nb proxy nginx,reverse proxy,Nginx,production"
---

# Nginx

サーバー上ですでに Nginx を使ってサイトを管理している場合や、証明書、キャッシュ、アクセス制御を引き続き自分で管理したい場合は、`nb proxy nginx` が推奨される選択です。

## 推奨される順序

`local` または `docker` の CLI 管理 env では、通常は次の順序で進めます。

```bash
nb proxy nginx use docker
nb proxy nginx generate --env test2 --host c.local.nocobase.com
nb proxy nginx start
```

ローカルプロセスとして動かす場合は次の通りです。

```bash
nb proxy nginx use local
nb proxy nginx generate --env test2 --host c.local.nocobase.com
nb proxy nginx start
```

後続でよく使うコマンドは次の通りです。

```bash
nb proxy nginx current
nb proxy nginx status
nb proxy nginx info
nb proxy nginx reload
nb proxy nginx restart
nb proxy nginx stop
```

## `generate` に必要な入力

最も一般的な形は次の通りです。

```bash
nb proxy nginx generate --env test2 --host c.local.nocobase.com
```

エントリポートも指定したい場合は、次のように書けます。

```bash
nb proxy nginx generate --env test2 --host c.local.nocobase.com --port 8080
```

各引数の意味は次の通りです。

- `--env`: 設定を生成する対象の CLI env
- `--host`: 公開用のドメイン名
- `--port`: プロキシのエントリポート。アプリ自身の `appPort` ではありません

env に `appPort` がない場合は、先に `nb env update test2 --app-port 56575` で保存してください。

## CLI が管理するファイル

`test2` を例にすると、Nginx のワークフローでは通常次のファイルやディレクトリを管理します。

- `NB_CLI_ROOT/.nocobase/proxy/nginx/snippets`
- `NB_CLI_ROOT/.nocobase/proxy/nginx/test2/app.conf`
- `NB_CLI_ROOT/.nocobase/proxy/nginx/test2/public/index-v1.html`
- `NB_CLI_ROOT/.nocobase/proxy/nginx/test2/public/index-v2.html`
- `NB_CLI_ROOT/test2/storage/dist-client`
- `NB_CLI_ROOT/test2/storage/uploads`

生成される Nginx エントリは、通常次の領域をまとめて扱います。

- `uploads`
- `dist`
- `well-known`
- `api`
- `ws`
- `spa`

つまり、実際の NocoBase 本番設定は、単純な `proxy_pass` ブロック 1 つだけで済むことはほとんどありません。

## 手書き設定

アプリが CLI 管理ではない場合や、Nginx 設定全体を意図的に自分で維持したい場合は、手書きで構成することもできます。

ただし NocoBase では、本番向けのリバースプロキシはバックエンドへのプロキシだけでなく、uploads、フロントエンド資産、WebSocket、`.well-known` ルート、SPA フォールバックページまで扱う必要があるのが普通です。

アプリがサブパス配置を使っている場合や、資産、uploads、プロキシで同じパスの見え方を共有していない場合は、手書き設定のほうが間違えやすくなります。そういう場合は、まず次のコマンドで設定を生成してから確認するほうが安全です。

```bash
nb proxy nginx generate --env test2 --host c.local.nocobase.com
```

## 関連リンク

- [本番環境のリバースプロキシ](./index.md)
- [Caddy](./caddy.md)
- [CLI でインストール](../../installation/cli.md)
