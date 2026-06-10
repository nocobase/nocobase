---
title: "本番環境のリバースプロキシ"
description: "CLI 管理の NocoBase env に対して、nb proxy nginx と nb proxy caddy を使ってリバースプロキシ設定を生成・管理します。"
keywords: "NocoBase,nb proxy nginx,nb proxy caddy,reverse proxy,Nginx,Caddy,production"
---

# 本番環境のリバースプロキシ

NocoBase CLI では、本番環境のリバースプロキシに推奨される入口は次の 2 つです。

- `nb proxy nginx`
- `nb proxy caddy`

ここでの意味は次の通りです。

- `proxy` はエントリレイヤーを管理します
- `nginx` と `caddy` は provider の実装です
- `docker` と `local` は実行 driver です
- `--env <name>` はどの CLI env に対して設定を生成するかを指定します

アプリがすでに CLI 管理 env として保存されていて、その env が `local` または `docker` であれば、通常は CLI にリバースプロキシ設定の生成と管理を任せれば十分です。そうすることで、WebSocket、サブパス、SPA フォールバックページ、その後の更新まで 1 か所でそろえて管理できます。

アプリが CLI 管理ではない場合や、設定全体を手書きで管理したい場合は、各 provider ページにある手動設定のセクションを参照してください。

## 事前確認

次の点を確認してください。

- アプリが `http://127.0.0.1:13000` のような内部アドレスですでに到達できること
- アプリがすでに CLI env として保存され、その env が `local` または `docker` であること
- その env に `appPort` が保存されていること

コマンドが `appPort` の不足を示した場合は、先に [`nb env update`](../../../api/cli/env/update.md) で更新してください。

その後、`app-port` や `app-public-path` のように proxy の挙動へ影響する設定を変更した場合は、対応する `generate` コマンドを再実行してください。

## 標準的な流れ

Nginx を使う場合:

```bash
nb proxy nginx use docker
nb proxy nginx generate --env test2 --host c.local.nocobase.com
nb proxy nginx start
```

Caddy を使う場合:

```bash
nb proxy caddy use local
nb proxy caddy generate --env test2 --host c.local.nocobase.com
nb proxy caddy start
```

各ステップの役割は次の通りです。

- `use docker|local`: 現在の provider の実行 driver を選ぶ
- `generate --env <name> --host <domain>`: 1 つの env 用のリバースプロキシ設定を生成する
- `start`: 現在の provider のローカルプロセスまたは Docker コンテナを起動する

後から設定を更新した場合、通常はまず `reload` を使います。エントリレイヤーを完全に再起動したいときに `restart` を使ってください。

## CLI が管理するもの

CLI は単なる proxy 断片だけを生成するのではなく、provider に応じて補助ファイルやサイトのエントリ構造もそろえて管理します。

- Nginx は共有 `snippets`、`app.conf`、`public/index-v1.html`、`public/index-v2.html` を管理します
- Caddy は `nocobase.caddy`、`app.caddy`、`public/index-v1.html`、`public/index-v2.html` を管理し、`app.caddy` は 1 つの env 用の完全なサイト設定です

## まず見るページ

| やりたいこと | 参照先 |
| --- | --- |
| サイト、証明書、キャッシュ、アクセス制御に引き続き Nginx を使いたい | [Nginx](./nginx.md) |
| HTTPS を素早く有効化し、TLS の管理を減らしたい | [Caddy](./caddy.md) |
| `app-port` や `app-public-path` のように proxy の結果へ影響する env 設定を調整したい | [`nb env update`](../../../api/cli/env/update.md) |
| まずアプリを CLI 管理 env としてインストールしたい | [CLI でインストール](../../installation/cli.md) |
