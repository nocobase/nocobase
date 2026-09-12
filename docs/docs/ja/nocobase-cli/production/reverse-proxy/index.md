---
title: "本番環境リバースプロキシ"
description: "nb プロキシ nginx および nb プロキシ キャディに基づいて、CLI でホストされる NocoBase 環境のリバース プロキシ構成を生成および管理します。"
keywords: "NocoBase、nb プロキシ nginx、nb プロキシ キャディ、リバース プロキシ、Nginx、キャディ、運用環境"
---


# リバースプロキシ

この記事は、`nb init` を使用してインストールされたアプリケーションにのみ適用されます。

NocoBase の本番環境リバースプロキシは、リクエストをアプリケーションプロセスへ転送するだけではありません。WebSocket、サブパス、フロントエンド静的リソース、アップロードディレクトリ、ファイルアクセスルート `/files/`、SPA フォールバックページも処理する必要があります。

`nb proxy` の機能は、これらの見逃しやすい詳細を安定したコマンド エントリのセットに収集することです。

## コアプロセス

コアプロセスのみを見る場合は、次の 3 つのコマンドを覚えておくだけで十分です。

```bash
nb proxy nginx use docker
nb proxy nginx generate --env test2 --host c.local.nocobase.com
nb proxy nginx reload
```

Caddy を使用している場合は、コマンド内の `nginx` を `caddy` に置き換えるだけです。

Nginx または Caddy がローカルにインストールされている場合は、最初の項目の `use docker` を `use local` に変更するだけです。

ほとんどのシナリオでは、最初に `use`、次に `generate`、最後に `reload` を実行するだけで十分です。 Nginx または Caddy の詳細については、それぞれのページに進んでください。

## Nginx を選択する場合と Caddy を選択する場合

通常は次のように判断できます。

|シナリオ |推薦 |
| --- | --- |
|すでに Nginx を使用してサイト、証明書、キャッシュ、またはアクセス制御を管理しています。 [Nginx](./nginx.md) |
|すでにドメイン名を持っており、できるだけ早く HTTPS を実行して、維持するために TLS の詳細を保存したいと考えています。 [キャディ](./caddy.md) |

## 以下を読み続けてください

|欲しいです... |どこを見るべきか |
| --- | --- |
| Nginx 管理サイトの入り口 | に従ってください。 [Nginx](./nginx.md) |
|できるだけ早く HTTPS に接続してください | [キャディ](./caddy.md) |
|まず、プロキシの結果に影響する環境設定 (`app-port`、`app-public-path` など) を調整します。 [`nb env update`](../../../api/cli/env/update.md) |
|まず、アプリケーションのインストールと環境設定を確認します。 [CLI を使用したインストール (推奨)](../../installation/cli.md) |
