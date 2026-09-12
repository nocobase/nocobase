---
title: NocoBase 2.0 から 2.1 へのアップグレードガイド
description: NocoBase 2.0 アプリを 2.1 へアップグレードし、旧インストール方法、nb CLI、推奨される移行手順を説明します。
---

# NocoBase を 2.0 から 2.1 へアップグレードする方法

NocoBase 2.0 から NocoBase 2.1 へのアップグレードでは、アプリ自体はスムーズに移行できます。大きく変わるのは NocoBase CLI です。

具体的には:

- 2.0 以前の CLI コマンドは、通常 `yarn nocobase` で始まります
- 2.1 以降の CLI では、グローバルにインストールした `nb` を使います

既存アプリをすぐに `nb` へ移行する必要はありません。安定稼働している NocoBase 2.0 アプリを 2.1 へアップグレードするだけなら、基本的には従来のインストール方法とアップグレード方法をそのまま使ってください。新しくインストールするアプリでは、新しい `nb` CLI の利用をおすすめします。

## 従来のインストール方法とアップグレード方法を使い続ける

以前のインストール方法に慣れている場合は、そのまま使い続けられます。インストールとアップグレードは従来のドキュメントに沿って進めてください。

### NocoBase をインストールする

- [Docker インストール](/get-started/installation/docker)
- [create-nocobase-app インストール](/get-started/installation/create-nocobase-app)
- [Git ソースコードインストール](/get-started/installation/git)

### NocoBase をアップグレードする

- [Docker インストールのアップグレード](/get-started/upgrading/docker)
- [create-nocobase-app インストールのアップグレード](/get-started/upgrading/create-nocobase-app)
- [Git ソースコードインストールのアップグレード](/get-started/upgrading/git)

## 新しいアプリでは `nb` CLI を使う

新しいアプリでは、より便利な `nb` によるインストールとアップグレードをおすすめします。

### NocoBase をインストールする

- [NocoBase アプリをインストール](./install-nocobase-app.md)

### NocoBase をアップグレードする

- [NocoBase アプリをアップグレード](./upgrade-nocobase-app.md)

## `nb` CLI へ移行する方法

今後 `nb` でアプリ管理を統一したい場合、現時点でより確実な方法は、新しいアプリを作成してから旧アプリのデータを移行することです。

移行手順:

1. まず `nb init` で新しい CLI アプリを作成します
2. 旧アプリのデータベース、`storage`、必要な環境変数を移行します
3. 新しいアプリが正常に使えることを確認してから、本番環境を切り替えます

しばらく様子を見ることもできます。`nb` が既存のローカルアプリを引き継ぐ機能は、現在開発中です。

![2026-06-13-21-29-24](https://static-docs.nocobase.com/2026-06-13-21-29-24.png)
