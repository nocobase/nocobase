---
title: 'nb env proxy'
description: 'nb env proxy トピックのリファレンスです。Nginx と Caddy のサブコマンドを確認できます。'
keywords: 'nb env proxy,NocoBase CLI,nginx,caddy,reverse proxy,プロキシ設定'
---

# nb env proxy

NocoBase CLI では、`nb env proxy` は今はトピックです。このコマンド自体では設定を生成しません。主な役割は、Nginx と Caddy の provider サブコマンドを見つけることです。

アプリがすでに CLI 管理 env として保存されていて、その env が `local` または `docker` であれば、通常は provider サブコマンドのどちらかをそのまま使えば十分です。

## 使い方

```bash
nb env proxy
```

## どのサブコマンドを先に開くべきか

| やりたいこと | 開くページ |
| --- | --- |
| サイト管理、証明書、キャッシュ、アクセス制御で引き続き Nginx を使いたい | [`nb env proxy nginx`](./nginx.md) |
| HTTPS をすばやく有効にして、TLS の細かい管理を減らしたい | [`nb env proxy caddy`](./caddy.md) |
| `app-port` や `app-public-path` など、プロキシ出力に影響する env 設定を調整したい | [`nb env update`](../update.md) |

## 注意点

- `nb env proxy` 自体には専用のフラグはありません
- 実際に設定を生成するのは `nb env proxy nginx` と `nb env proxy caddy` です
- どちらのサブコマンドも、現在のマシンから runtime に到達できる管理対象 env、つまり `local` または `docker` に対してのみ動作します
- `nb env update` で `app-port` や `app-public-path` のような設定を変更した場合は、そのあとで対応する proxy サブコマンドを通常もう一度実行する必要があります
- このコマンドグループは、リモート API 接続だけの env や SSH env では現在使えません

## 例

```bash
# トピックのヘルプを表示
nb env proxy

# 1 つの env に対して Nginx 設定を生成
nb env proxy nginx --env demo --host demo.local.nocobase.com

# 1 つの env に対して Caddy 設定を生成
nb env proxy caddy --env demo --host demo.local.nocobase.com
```

## 関連コマンド

- [`nb env proxy nginx`](./nginx.md)
- [`nb env proxy caddy`](./caddy.md)
- [`nb env update`](../update.md)
- [`nb env info`](../info.md)
- [`nb config`](../../config/index.md)
