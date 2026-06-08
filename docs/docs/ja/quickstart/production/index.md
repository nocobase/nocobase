---
title: "本番環境へのデプロイ"
description: "NocoBase を本番環境へデプロイするための最終 2 ステップ: アプリの自動起動を有効にし、リバースプロキシを設定します。"
keywords: "NocoBase,本番環境,デプロイ,nb app autostart,nb env proxy,Nginx,Caddy"
---

# 本番環境へのデプロイ

NocoBase アプリがすでにサーバー上で正常に動作している場合、本番公開前に必要なのは通常あと 2 つだけです。

1. マシン再起動後にアプリが自動的に起動するようにする
2. 安定した外部アクセスのためにアプリの前段にリバースプロキシを置く

NocoBase CLI では、主に次のコマンドを使います。

- `nb app autostart`
- `nb env proxy`

このページではまず全体の流れを説明します。Nginx や Caddy の詳細設定は、それぞれのサブページを参照してください。

## ステップ 1: アプリの自動起動を有効にする

本番環境で最初に優先すべきなのはドメイン名ではなく、再起動やコンテナ再作成、運用作業のあとでもサービスが確実に復旧できることです。

CLI では `nb app autostart` はコマンドグループです。よく使うのは次のコマンドです。

- `nb app autostart enable`
- `nb app autostart list`
- `nb app autostart run`

現在の env に対して自動起動を有効にします。

```bash
nb app autostart enable
```

別の env を明示的に対象にする場合は次のようにします。

```bash
nb app autostart enable --env app1 --yes
```

そのあと、自動起動対象としてマークされた env を確認できます。

```bash
nb app autostart list
```

システム起動後、次のコマンドで自動起動が有効な env をすべて起動します。

```bash
nb app autostart run
```

トラブルシューティングのために下層の起動出力を見たい場合は、次のようにします。

```bash
nb app autostart run --verbose
```

:::tip 実際に何をしているのか

`nb app autostart enable` は、CLI が管理している env を自動起動可能としてマークします。  
`nb app autostart run` は、そのようにマークされた env を実際に起動するコマンドです。

つまり、本番環境では通常 `nb app autostart run` を `systemd`、コンテナプラットフォームの起動スクリプト、または既存のホスト起動機構など、自分のシステム起動フローに組み込む必要があります。

:::

### 適用範囲

`nb app autostart` は、現在のマシン上で CLI がランタイムを管理している env にのみ適用されます。

- `local`
- `docker`

env が単なるリモート API 接続である場合、またはこのマシン上で CLI によりローカル管理されていない場合、このコマンド群は自動起動には適していません。

## ステップ 2: リバースプロキシを設定する

アプリが自動的に復旧できるようになったら、次は外部エントリポイントを整えます。本番環境では、リバースプロキシは通常次の役割を担います。

- ドメイン名または公開ポートのバインド
- HTTP と WebSocket リクエストを NocoBase に転送
- HTTPS、証明書、キャッシュ、アクセス制御の処理

NocoBase CLI では、推奨される入口は次のとおりです。

- `nb env proxy nginx`
- `nb env proxy caddy`

### 標準的なやり方

アプリがすでに CLI の env として保存されており、`local` または `docker` env であれば、通常は CLI にプロキシ設定を生成させるだけで十分です。

```bash
nb env proxy nginx --env app1 --host app.example.com
nb env proxy caddy --env app1 --host app.example.com
```

現在の env がすでに対象 env の場合は、`--env` を省略できます。

```bash
nb env proxy nginx --host app.example.com
```

CLI は、手書き設定で見落としやすい次のような詳細も補ってくれます。

- WebSocket 転送
- サブパス配備時のエントリパスと静的アセットパス
- SPA のフォールバックページ
- provider 共通設定ファイル

### Nginx と Caddy のどちらを選ぶか

通常は次のように判断できます。

| シナリオ | 推奨 |
| --- | --- |
| すでに Nginx をサイト、キャッシュ、証明書、アクセス制御に使っている | [Nginx](./reverse-proxy/nginx.md) |
| すでにドメインがあり、TLS の保守を減らしつつ HTTPS を素早く有効にしたい | [Caddy](./reverse-proxy/caddy.md) |
| このコマンド群の全体像をまず理解したい | [Production Reverse Proxy](./reverse-proxy/index.md) |

`app-port` や `app-public-path` など、プロキシ結果に影響する env 設定を変更した場合は、対応する proxy サブコマンドを再実行してください。

## 推奨される公開手順

もっともシンプルな本番導入手順としては、通常次の順番で問題ありません。

1. まずアプリがサーバー上で正しく起動することを確認する
2. `nb app autostart enable` を実行する
3. `nb app autostart run` をシステム起動フローに組み込む
4. Nginx または Caddy を選び、対応する `nb env proxy` サブコマンドを実行する
5. 最終的なドメイン名または公開アドレスで外部アクセスを確認する

## クイックリンク

| やりたいこと | 参照先 |
| --- | --- |
| リバースプロキシの全体説明から始めたい | [Production Reverse Proxy](./reverse-proxy/index.md) |
| 入口レイヤーに引き続き Nginx を使いたい | [Nginx](./reverse-proxy/nginx.md) |
| Caddy でより素早く HTTPS を導入したい | [Caddy](./reverse-proxy/caddy.md) |
| 起動、停止、ログ、アップグレードを管理したい | [Manage Apps](../operations/manage-app.md) |
| `nb env proxy` の CLI リファレンスを読みたい | [`nb env proxy`](../../api/cli/env/proxy/index.md) |

## 関連コマンド

```bash
# 特定の env で自動起動を有効化
nb app autostart enable --env app1 --yes

# 自動起動状態を一覧表示
nb app autostart list

# 自動起動が有効な env をすべて起動
nb app autostart run

# Nginx 用のリバースプロキシ設定を生成
nb env proxy nginx --env app1 --host app.example.com

# Caddy 用のリバースプロキシ設定を生成
nb env proxy caddy --env app1 --host app.example.com
```
