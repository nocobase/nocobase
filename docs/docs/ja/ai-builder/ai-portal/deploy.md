---
title: "デプロイとソース管理"
description: "AI Portal の開発、push、デプロイの一連の流れと、source storage の 2 つのモード、マルチ環境デプロイの方法。"
keywords: "AI Portal,デプロイ,source storage,Git,nb portal deploy,nb portal push,マルチ環境"
---

# デプロイとソース管理

:::tip 前提条件

このページを読む前に、[AI Portal 構築クイックスタート](./index.md)に従って最初の Portal を動かせていることを確認してください。

:::

Portal のソースコードには 3 つの置き場所があります。ローカルの開発ワークスペース、source storage、デプロイ済みの成果物です。`nb portal` はこの 3 者の間の同期を担当します。

## ライフサイクルの全体像

日常的な開発のサイクルは次のようになります：

```text
dev（ローカル開発）→ push（ソースコードの送信）→ deploy（ビルドとデプロイ）
```

それぞれの役割は次のとおりです：

1. `nb portal dev <portal>` — ローカル開発サーバーを起動し、コードを変更して結果を確認する
2. `nb portal push <portal>` — ローカルのソースコード変更を source storage に送信する
3. `nb portal deploy <portal>` — ビルドしてデプロイし、変更をユーザーに反映する

同僚がすでに作成した Portal を引き継ぐ場合や、別のマシンに移った場合は、先にローカルへ取得してから開発します：

```bash
nb portal list                 # どんな Portal があるか確認する
nb portal pull customer        # ソースコードをローカルに取得する
nb portal dev customer         # 開発を始める
```

`pull` はソースコードをダウンロードして開発ワークスペースに展開します。デフォルトの場所は `./<portal>` で、`--path` で別の場所を指定できます。依存関係は自動的にインストールされます。CI で実行する場合や自分でインストールしたい場合は、`--no-install` を付けてスキップします。

取得に成功すると、開発ワークスペースの場所が CLI env config に記録されます。以降の `dev`、`push`、`deploy` はすべてこの場所からソースコードを読むため、毎回指定し直す必要はありません。

## Portal を新しく追加する

1 つのアプリケーションは複数の Portal を持てます。ページと権限は互いに独立し、データは共有されます。たとえば社内スタッフ用に 1 つ、社外の顧客用に 1 つといった具合です：

```bash
nb portal create customer
```

作成時には `@nocobase/portal-template-default` テンプレートをベースに、カレントディレクトリの下に `./customer` が開発ワークスペースとして生成され、`.env` と `.env.local` が書き込まれた後、依存関係が自動的にインストールされます。別の場所に置きたい場合は `--path` で指定します。

<!-- 需要一张 nb portal create 执行完成后的终端输出截图 -->

Portal 名には小文字、数字、アンダースコア、ハイフンのみ使用でき、小文字または数字で始める必要があります。

## source storage

Portal のソースコードは 2 つの場所に保存できます：

| 方式 | 説明 | 使いどころ |
| --- | --- | --- |
| `nocobase` | デフォルトの方式。ソースコードは NocoBase 側の source storage が管理します | 素早く始めたい、一人で開発する、コードレビューが不要 |
| `git` | ソースコードを指定した Git リポジトリに保存します | チームでの協働、コードレビューが必要、CI につなぐ |

デフォルトの `nocobase` は最も早く始められ、事前にリポジトリを用意する必要がありません。ただしバージョン履歴がないため、間違えた場合は丸ごと上書きして戻すしかありません。**この Portal を長期的に運用していくなら、早めに Git に切り替えることをおすすめします。**

### Git に切り替える

`create` は開発ワークスペースの生成のみを担当し、source storage の設定はすべて `config` が担います。作成後はいつでも切り替えられます：

```bash
nb portal config customer \
  --source-storage git \
  --git-repo git@github.com:nocobase/customer-portal.git

nb portal push customer --message "Move customer portal source to Git"
```

`config` は source storage の設定をリモートの Portal レコードに同期します。これ以降の `push` は Git を経由するようになります。

1 つのリポジトリに 1 つの Portal を置く場合、`--git-path` はデフォルトのリポジトリルートのままで構いません。複数の Portal を同じリポジトリに入れたい場合にのみ、サブディレクトリを指定する必要があります：

```bash
nb portal config customer --git-path portals/customer
```

### 別のリポジトリから一時的に取得する

別のリポジトリのソースコードを試したいが、Portal の設定は変更したくない場合、`pull` は一時的な指定に対応しています：

```bash
nb portal pull customer --git-repo git@github.com:nocobase/another-portal.git
```

この方法ではリモートの Portal レコードは変更されません。`--git-branch` と `--git-path` は `--git-repo` と一緒にしか使えません。恒久的に Git ストレージへ変更する場合は、前述の `config` を使ってください。

`config` は開発ワークスペースの場所も変更できます。たとえばソースコードを別のディレクトリに移した後、`--path` で新しい場所を CLI に伝えます：

```bash
nb portal config customer --path ./workspaces/customer
```

## env タイプによる違い

`nb portal` は env によって同期の動作が異なります：

| env タイプ | 説明 |
| --- | --- |
| `local` | アプリケーションが現在のマシン上にあります。`pull` はソースコードを開発ワークスペースに取得し、`deploy` は開発ワークスペースからビルドしてデプロイ成果物を同期します |
| `docker` | アプリケーションが Docker 内で動作し、volume を通じて共有されます。動作は上記と同じです |
| `http` | API を通じて同期します。`pull` / `push` はソースコードのアーカイブをダウンロードまたはアップロードします |

`ssh` env は現時点では Portal 管理に対応していません。

## マルチ環境デプロイ

同じ Portal を異なる環境にデプロイできます。`--env` で対象を指定します：

```bash
nb portal deploy customer --env prod --yes
```

`--yes` は対話確認をスキップするためのものです。明示的に指定した `--env` が current env と一致しない場合、CLI はデフォルトで確認を求めて止まります。スクリプトや CI で実行するときは `--yes` を付けるのを忘れないでください。付けないとコマンドが確認待ちで止まってしまいます。

環境をまたいだデータテーブル構造や設定のリリースについては、[リリース管理](../publish.md)を参照してください。

## アクセスパス

デプロイが完了すると、Portal のアクセスパスは次のようになります：

```text
<appPublicPath>/x/<portal>/
```

サブアプリケーション配下の Portal の場合は次のとおりです：

```text
<appPublicPath>/x/apps/<app>/<portal>/
```

`/x/` というプレフィックスは AI Portal 専用で、ノーコード Portal では `/v/` を使います。

## Portal を削除する

```bash
nb portal destroy customer
```

この操作では Portal レコードとデプロイ済みのファイルが削除され、ローカルの開発ワークスペースはデフォルトで残ります。開発ワークスペースも一緒に削除したい場合は `--delete-dev-path` を付けてください。

## 関連リンク

- [AI Portal 構築クイックスタート](./index.md) — AI が書いた最初のフロントエンド入口を動かす
- [AI Agent と協働して構築](./agent-workflow.md) — 自然言語で AI にページを書かせる
- [プロジェクト構成と技術スタック](./project-structure.md) — ビルドコマンドと環境変数の説明
- [リリース管理](../publish.md) — 環境をまたいでデータテーブル構造と設定をリリースする
- [`nb portal` コマンドリファレンス](../../api/cli/portal/index.md) — すべての Portal コマンドの詳細なパラメータ説明
- [`nb portal create`](../../api/cli/portal/create.md) — Portal 作成のすべてのパラメーター
- [`nb portal config`](../../api/cli/portal/config.md) — source storage と開発ワークスペースのパスを調整する
- [`nb portal push`](../../api/cli/portal/push.md) — ソースコードを source storage に送信する
- [`nb portal deploy`](../../api/cli/portal/deploy.md) — Portal をビルドしてデプロイする
- [`nb portal pull`](../../api/cli/portal/pull.md) — source storage からソースコードを取得する
- [`nb portal destroy`](../../api/cli/portal/destroy.md) — Portal レコードとデプロイ済みファイルを削除する
