---
title: "本番環境へのデプロイ"
description: "NocoBase の本番デプロイをすばやく完了するには、まずアプリの自動起動を設定し、その後 reverse proxy を設定します。"
keywords: "NocoBase,production deployment,nb app autostart,nb proxy nginx,nb proxy caddy,Nginx,Caddy"
---

# 本番環境へのデプロイ

NocoBase アプリがすでにサーバー上で正常に動作しているなら、本番公開に向けて通常追加で必要になるのは次の 2 点だけです。

1. マシン再起動後にアプリが自動的に復旧するようにすること
2. 外部から安定してアクセスできるように reverse proxy の entrypoint を追加すること

NocoBase CLI では、主に次の 2 つのコマンドグループを使います。

- `nb app autostart`
- `nb proxy`

このページではまず全体の流れを説明します。Nginx または Caddy の詳細は、その後で各 provider のページを参照してください。

## ステップ 1: アプリの自動起動を設定する

本番環境で最初に重要なのはドメイン名ではなく、サービス自体が確実に復旧できることです。そうでないと、マシン再起動、コンテナ再作成、運用作業のあとに、アプリが自動で戻ってこない可能性があります。

`nb app autostart` でよく使うサブコマンドは次のとおりです。

- `nb app autostart enable`
- `nb app autostart list`
- `nb app autostart run`

現在の env に対して自動起動を有効にします。

```bash
nb app autostart enable
```

対象が現在の env でない場合は、明示的に指定します。

```bash
nb app autostart enable --env app1 --yes
```

どの env が自動起動対象としてマークされているか確認します。

```bash
nb app autostart list
```

システム起動後に、有効化された env をすべて起動します。

```bash
nb app autostart run
```

デバッグ時に詳細な起動ログを見たい場合は次を使います。

```bash
nb app autostart run --verbose
```

:::tip このステップが実際に行うこと

`nb app autostart enable` は、CLI 管理 env に対して自動起動を許可するマークを付けます。`nb app autostart run` は、その自動起動が有効になっている env を実際に起動します。

本番環境では通常、`nb app autostart run` を `systemd`、コンテナプラットフォームの起動スクリプト、あるいはすでに使っているホストレベルの自動起動機構など、自分のシステム起動フローに組み込む必要があります。

:::

### 適用範囲

`nb app autostart` は、CLI によって runtime が管理されている env に対してのみ動作します。

- `local`
- `docker`

env が単なるリモート API 接続である場合や、現在のマシン上で CLI によってローカル管理されていない場合、このコマンドグループは自動起動には適していません。

## ステップ 2: reverse proxy を設定する

アプリが自動復旧できるようになったら、次に外部向け entrypoint を扱います。本番環境では、reverse proxy は通常次の役割を担います。

- ドメイン名または entry port のバインド
- HTTP / WebSocket リクエストの NocoBase への転送
- HTTPS、証明書、キャッシュ、アクセス制御の管理

推奨される CLI entrypoint は次のとおりです。

- `nb proxy nginx`
- `nb proxy caddy`

### デフォルトの流れ

アプリがすでに CLI env として保存され、その env が `local` または `docker` であるなら、通常は CLI に直接設定を生成させるのが一般的です。

```bash
nb proxy nginx use docker
nb proxy nginx generate --env app1 --host app.example.com

nb proxy caddy use local
nb proxy caddy generate --env app1 --host app.example.com
```

その後、選択した provider を起動します。

```bash
nb proxy nginx start
nb proxy caddy start
```

CLI は、手書き設定では見落としやすい次のような点も補ってくれます。

- WebSocket の転送
- サブパス配下での entry URL と asset URL
- SPA fallback ページ
- provider レベルで共有される設定ファイル

### Nginx と Caddy のどちらを選ぶか

| シナリオ | 推奨 |
| --- | --- |
| サイト、キャッシュ、証明書、アクセス制御にすでに Nginx を使っている | [Nginx](./reverse-proxy/nginx.md) |
| すでにドメインを持っていて、TLS の細かい管理を減らしながら HTTPS をすばやく有効にしたい | [Caddy](./reverse-proxy/caddy.md) |
| まず全体の概要を見たい | [本番環境の Reverse Proxy](./reverse-proxy/index.md) |

後で `app-port` や `app-public-path` のように proxy の挙動へ影響する env 設定を変更した場合は、対応する proxy サブコマンドを再実行してください。

## デフォルトの公開手順

もっともシンプルな本番公開であれば、通常は次の順序で十分です。

1. まずサーバー上でアプリがそのまま正常起動できることを確認する
2. `nb app autostart enable` を実行する
3. `nb app autostart run` をシステム起動フローに組み込む
4. Nginx または Caddy を選び、対応する `nb proxy` サブコマンドを実行する
5. ドメイン名または entry アドレス経由で外部アクセスを確認する

## クイックインデックス

| やりたいこと | 参照先 |
| --- | --- |
| まず reverse proxy 全体の紹介を読みたい | [本番環境の Reverse Proxy](./reverse-proxy/index.md) |
| entry layer で引き続き Nginx を使いたい | [Nginx](./reverse-proxy/nginx.md) |
| Caddy を使って HTTPS を素早く有効にしたい | [Caddy](./reverse-proxy/caddy.md) |
| アプリの起動、停止、ログ、アップグレード操作を見たい | [アプリ管理](../operations/manage-app.md) |
| `nb proxy nginx` の CLI リファレンスを読みたい | [`nb proxy nginx`](../../api/cli/proxy/nginx/index.md) |
| `nb proxy caddy` の CLI リファレンスを読みたい | [`nb proxy caddy`](../../api/cli/proxy/caddy/index.md) |

## 関連コマンド

```bash
# 1 つの env に自動起動を有効化する
nb app autostart enable --env app1 --yes

# 自動起動状態を確認する
nb app autostart list

# 有効化された env をすべて起動する
nb app autostart run

# Nginx の runtime を選択して設定を生成する
nb proxy nginx use docker
nb proxy nginx generate --env app1 --host app.example.com
nb proxy nginx start

# Caddy の runtime を選択して設定を生成する
nb proxy caddy use local
nb proxy caddy generate --env app1 --host app.example.com
nb proxy caddy start
```
