---
title: NocoBase アプリをインストール
description: NocoBase CLI をインストールし、`nb init --ui` ですばやく新しい NocoBase アプリを作成して、AI Agent がすぐに作業を始められるようにします。
---

# NocoBase アプリをインストール

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

UI ウィザードでインストールする方法をおすすめします：

```bash
nb init --ui
```

1. `Getting started` - `--env` 識別子を設定し、`Install a new app` を選ぶ

![2026-06-11-20-14-32](https://static-docs.nocobase.com/2026-06-11-20-14-32.png)

2. `App environment` - アプリの基本情報、保存先、ランタイムポートを設定する

![2026-06-14-10-03-06](https://static-docs.nocobase.com/2026-06-14-10-03-06.png)

3. `App source and version` - アプリの取得方法と使用するソース、バージョンを選ぶ

![2026-06-14-09-51-33](https://static-docs.nocobase.com/2026-06-14-09-51-33.png)

4. `Configure the database` - 組み込みデータベースかカスタムデータベースを選ぶ

![2026-06-14-09-52-05](https://static-docs.nocobase.com/2026-06-14-09-52-05.png)

5. `Create an admin account` - 最初の管理者アカウントを設定する

![2026-06-14-09-52-56](https://static-docs.nocobase.com/2026-06-14-09-52-56.png)

6. `Connection & authentication` - アプリのアクセス URL を入力し、認証方式を選ぶ

![2026-06-14-10-00-35](https://static-docs.nocobase.com/2026-06-14-10-00-35.png)

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

## 次のステップ

- すでに稼働中の NocoBase アプリがある場合は、[AI Agent 接続ガイド](./quick-start.mdx)を参照してください
- アプリの起動、停止、ログ、アップグレードを管理したい場合は、[アプリ管理](../nocobase-cli/operations/manage-app.md)を参照してください
- 本番環境へのデプロイを続ける場合は、[CLI でアプリをインストール](../nocobase-cli/installation/cli.md)と[本番環境デプロイ概要](../nocobase-cli/production/index.md)を参照してください
- AI にアプリ構築を始めさせたい場合は、[AI Builder](../ai-builder/index.md)を参照してください

## 関連リンク

- [インストール方法とバージョンの比較](../get-started/quickstart.md) — 先にインストール方法とバージョンチャネルを比べてから、どの方法で入れるか決める
- [AI Agent 接続ガイド](./quick-start.mdx) — 既存の NocoBase アプリを接続して、AI Agent の作業を始める
- [`nb init` コマンドリファレンス](../api/cli/init.md) — 新しいアプリの初期化、既存のローカルアプリの引き取り、またはリモートアプリの接続
- [`nb env info` コマンドリファレンス](../api/cli/env/info.md) — 現在の env の接続情報とランタイム設定を確認する
- [NocoBase CLI](../api/cli/index.md) — すべての `nb` コマンドの完全なリファレンス
- [アプリ管理](../nocobase-cli/operations/manage-app.md) — アプリの起動、停止、再起動、ログ確認、アップグレード
- [複数の環境管理](../nocobase-cli/operations/multi-environment.md) — 複数の env を同時に管理するときによく使う操作
