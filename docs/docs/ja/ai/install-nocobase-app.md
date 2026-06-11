---
title: NocoBase アプリをインストール
description: NocoBase CLI をインストールし、`nb init --ui` ですばやく新しい NocoBase アプリを作成して、AI Agent がすぐに作業を始められるようにします。
---

# NocoBase アプリをインストール

まだ NocoBase アプリを持っていない場合は、まず `@nocobase/cli` をインストールしてから `nb init --ui` を一度実行するのが最も手早い方法です。ほとんどのケースでは、ウィザードのデフォルト設定のままで十分です。

## 前提条件

- Node.js >= 22
- Yarn 1.x
- Docker でインストールする予定がある場合は、先に Docker が起動していることを確認してください

## ステップ 1：CLI をインストール

まず NocoBase CLI をグローバルインストールします：

```bash
npm install -g @nocobase/cli
nb --version
```

複数のターミナルを同時に使うことが多い場合や、AI Agents と並行して作業したい場合は、追加で一度 `nb session setup` を実行することもおすすめします。こうしておくと、各セッションがそれぞれの `current env` を保持するため、互いに影響しにくくなります。

## ステップ 2：アプリを初期化

デフォルトでは、ビジュアルウィザードをそのまま開く方法をおすすめします：

```bash
nb init --ui
```

![2026-06-11-20-14-32](https://static-docs.nocobase.com/2026-06-11-20-14-32.png)

選ぶ setup の経路によって、表示されるステップは少し変わります。ただし、標準の `Install a new app` ルートなら、通常は次の 6 ステップが表示されます。

1. `Getting started` - `--env` 識別子を設定し、`Install a new app` を選ぶ
2. `App environment` - アプリの基本情報、保存先、ランタイムポートを設定する
3. `App source and version` - アプリの取得方法と使用するソース、バージョンを選ぶ
4. `Configure the database` - 組み込みデータベースかカスタムデータベースを選ぶ
5. `Create an admin account` - 最初の管理者アカウントを設定する
6. `Connection & authentication` - アプリのアクセス URL を入力し、認証方式を選ぶ

ターミナルでの操作に慣れている場合は、次のコマンドを直接実行してもかまいません：

```bash
nb init
```

スクリプトや CI で初期化する場合は、非対話モードを使います：

```bash
nb init --yes --env app1
```

:::tip リモートサーバーでインストールする場合

サーバー上で `nb init --ui` を実行する場合は、先にデフォルト host をそのサーバーの IP に変更することをおすすめします。そうしておくと、ローカルのブラウザからウィザードを開けます。

```bash
nb config set default-ui-host <server-ip>
nb config set default-api-host <server-ip>
```

:::

## ステップ 3：アプリが使える状態か確認する

インストールが終わったら、通常はまず次の 3 点を確認しておくと安心です：

- env が正しく保存されていること
- アプリが正常に起動していること
- 管理者アカウントでログインできること

よく使うコマンドは次のとおりです：

```bash
nb env list
nb env info
nb app logs
```

ローカルのデフォルトインストールなら、通常はブラウザで `http://localhost:13000` をそのまま開けます。ログイン後、新しい AI Agent セッションを開始するか現在のセッションを再起動すれば、AI がこの NocoBase アプリの操作を始められます。

CLI の設定はデフォルトで `~/.nocobase/` に保存されるため、AI Agents は通常どの作業ディレクトリからでもアクセスできます。

このアプリを今後実際のユーザー向けに公開する予定がある場合、長期的に `IP + port` をそのまま使うのはおすすめしません。通常、次のステップはリバースプロキシを挟み、HTTPS を有効にすることです。

## 関連リンク

- [インストール方法とバージョンの比較](../get-started/quickstart.md) — 先にインストール方法とバージョンチャネルを比べてから、どの方法で入れるか決める
- [AI Agent 接続ガイド](./quick-start.mdx) — 既存の NocoBase アプリを接続して、AI Agent の作業を始める
- [`nb init` コマンドリファレンス](../api/cli/init.md) — 新しいアプリの初期化、既存のローカルアプリの引き取り、またはリモートアプリの接続
- [`nb env info` コマンドリファレンス](../api/cli/env/info.md) — 現在の env の接続情報とランタイム設定を確認する
- [NocoBase CLI](../api/cli/index.md) — すべての `nb` コマンドの完全なリファレンス
- [複数の環境管理](../nocobase-cli/operations/multi-environment.md) — 複数の env を同時に管理するときによく使う操作
