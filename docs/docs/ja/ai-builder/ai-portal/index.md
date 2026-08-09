---
title: "AI Portal 構築クイックスタート"
description: "AI Portal 構築は、AI Agent にビジネスシステムのコードを書かせ、NocoBase が認証、データベース、API、権限を基盤として提供する方式です。コードは AI Portal というアプリケーション入口に置かれます。"
keywords: "AI Portal 構築,AI ビルダー,AI Portal,NocoBase AI,NocoBase 基盤,フロントエンド開発,React,shadcn/ui,AI Agent,クイックスタート"
---

# AI Portal 構築クイックスタート

AI の vibe coding は見栄えのよいページを作れる一方で、実際のビジネスシステムとつなぎ込むのは簡単ではなく、認証、権限、データテーブル設計といった基礎機能をゼロから実装するはめになりがちです。

NocoBase はローコード/ノーコードプラットフォームとして、これらの基礎機能をすでに提供しています。NocoBase をシステムカーネルの基盤として扱えば、AI Agent はビジネスロジックの記述に専念でき、信頼できる認証、データベース、API、権限などのインフラは NocoBase が担います。

そのために、**AI Portal** というアクセス入口を用意しました。ソースコードはローカルに置くことができ、AI Agent がコードを書くための場所として確保されています。この入口で書かれたコードは NocoBase が提供する基礎機能に直接アクセスでき、ビルドしたページはそのまま利用できます。

![AI Portal Settings](https://static-docs.nocobase.com/20260803154352.png)

## NocoBase が提供する機能

ビジネスシステムを作るとき、実際に時間がかかるのはページそのものではなく、その背後にあるもの——ユーザーログイン、権限チェック、データテーブル設計、CRUD インターフェース、ファイルのアップロードとダウンロードなどです。どのシステムにも必要なものですが、毎回ゼロから作るのは割に合いません。

これらの機能は NocoBase がすでに提供しています：

- **認証体系** — アカウントとパスワードによるログインはすぐに使えます。OIDC、SAML、CAS、LDAP、SMS、DingTalk、WeCom などの方式もサーバー側で有効化すれば、フロントエンドからつなぐだけで使えます
- **データベースとマルチデータソース** — データテーブル管理を内蔵し、外部の MySQL、PostgreSQL などのデータソースにも接続できます
- **REST API** — データテーブルを作れば CRUD インターフェースが自動的に用意され、フィルター、ソート、ページネーション、関連フィールドに対応します
- **権限制御** — ロールベースの ACL で、フィールドレベル・レコードレベルまで制御できます。フロントエンドは現在のユーザーの権限を直接読み取って、何を表示するか決められます
- **ワークフロー** — 業務プロセスの自動化。フロントエンドからのトリガーにもデータ変更によるトリガーにも対応します
- **ファイルストレージ** — アップロードとダウンロード

![AI Portal Template](https://static-docs.nocobase.com/20260803161414.png)

これらの機能をベースに、標準的な[システムテンプレートコード](https://github.com/nocobase/portal-template-default)を用意しました。AI Agent はこれをコピーするだけで基本的なアプリケーションを動かせます。さらに NocoBase は[データモデリング](../data-modeling.md)、[権限設定](../acl.md)などの一連の skills を提供しているため、ビジネス要件を記述すれば、AI Agent はフロントエンドページを生成するだけでなく、データテーブルの作成や権限の設定まで行い、完全なビジネスシステムを仕上げます。

## 前提条件

- NocoBase >= 3.0.0-alpha.6
- Node.js >= 22
- [pnpm](https://pnpm.io/installation)——Portal テンプレートが依存関係のインストールと開発サーバーの起動に使用します
- `nocobase cli` の alpha 版がインストールされていること（**注意：現時点では alpha 版のみ対応しています**）
  - `npm install -g @nocobase/cli@alpha`
  - および `nb init --ui` で初期化済みの NocoBase アプリケーション。詳細は [AI Agent 接続ガイド](../../ai/quick-start.md) を参照してください
- AI Agent（Claude Code、Codex、Cursor など）

## ステップ 1：AI Portal がすでにあることを確認する

まずデフォルトの `main` があることを確認します：

```bash
nb portal list
```

![nb portal list](https://static-docs.nocobase.com/20260803163517.png)

出力には Portal 名、アクセス URL、Portal タイプ、source storage、開発パス、有効状態、デフォルト状態が一覧表示されます。

ソースコードを取得した後は、`info` でさらに詳しく確認できます。開発パスとデプロイパスがそれぞれどこにあるかなどが分かります：

```bash
nb portal info main
```

## ステップ 2：開発モードを起動する

```bash
# portal のソースコードを取得する
nb portal pull main
# ソースコードの開発サーバーを起動する
nb portal dev main
```

開発サーバーはデフォルトで `http://localhost:5173` で動作します。

テンプレートには NocoBase の `users` データテーブルをベースにしたユーザー管理ページが付属しています。ログインして動きを確認してみてください。AI に参照させる初期サンプルとしても優れています。

![portal dev home page](https://static-docs.nocobase.com/20260802220652.png)

## ステップ 3：AI にページを変更させる

Portal の開発ワークスペースに移動し（`pull` はデフォルトで `./main` に取得します。分からない場合は `nb portal info main` で開発パスを確認してください）、そこで AI Agent（Claude Code、Codex、Cursor など）を開き、プロンプトを入力します：

```
顧客管理ページを追加してください。
顧客リスト、名前による検索を含め、行をクリックすると詳細ドロワーが開くようにしてください
```

<!-- 需要一个视频，展示从输入提示词到 AI 完成页面编写、开发服务热更新出效果的完整过程 -->

AI は既存のページと拡張をひととおり読み、テンプレートの規約に沿って新しいページを書きます。その結果は `http://localhost:5173` で確認できます。

AI Agent と効率よく協働する方法については、[AI Agent と協働して構築](./agent-workflow.md)を参照してください。

## ステップ 4：デプロイする

ローカルでの変更が完成したら、ソースコードをリモートに push し、ビルドしてデプロイします：

```bash
nb portal push main --message "Add customer management page"
nb portal deploy main
```

`push` の送信先は、この Portal の source storage 設定によって決まります。デフォルトは `nocobase` で、ソースコードは NocoBase が管理します。[`nb portal config`](../../api/cli/portal/config.md) で `git` に設定した場合、`push` はソースコードを指定した Git リポジトリにコミットしてプッシュし、`--message` は Git のコミットメッセージになります。詳細は[デプロイとソース管理](./deploy.md#source-storage)を参照してください。

デプロイが完了したら `/x/main/` にアクセスすると、いま行った変更を確認できます。

これで一連の流れが通りました——要件を記述し、AI がコードを書き、ローカルで確認し、push してデプロイする。

## 入口をさらに増やしたいとき

1 つのアプリケーションは複数の Portal を持てます。社内スタッフ用に 1 つ、社外の顧客用にもう 1 つといった具合に、ページと権限は完全に独立しつつ、データは共有されます：

```bash
nb portal create customer
```

作成時にはカレントディレクトリの下に `./customer` が開発ワークスペースとして生成されます。`--path` で別の場所を指定することもできます。新しく作成した Portal も同じく `nb portal dev` で開発し、`nb portal deploy` でデプロイします。そのワークスペースに移動して AI Agent を開くだけです。詳しくは[デプロイとソース管理](./deploy.md)を参照してください。

## Demo で体験する

AI Portal 構築を実際に体験したい場合は、Demo 環境を申請できます：https://demo.nocobase.com/new 。フォームに記入すると、専用の Demo 環境が生成されます。この環境には NocoBase 基盤の上に実装された AI Portal アプリケーションがいくつか含まれています。

![AI Portal Settings](https://static-docs.nocobase.com/20260803154352.png)

そのうちの 1 つを選んでアクセスしてみてください：

![AI Portal CRM](https://static-docs.nocobase.com/20260803154700.png)

さらに Portal のウェルカムページにはプロンプトが用意されており、AI Agent からこの AI Portal アプリケーションに直接接続し、アプリケーションコードを取得して、ローカルで開発サーバーを起動し、ページを変更してから Demo 環境に push・デプロイして戻せます。デプロイに成功したらページを再読み込みすると、変更が反映されているのが分かります。

## 次のステップ

- [AI Agent と協働して構築](./agent-workflow.md) — プロンプトの書き方、AI が間違えたときの戻し方
- [プロジェクト構成と技術スタック](./project-structure.md) — テンプレートのディレクトリ規約と主なコマンド
- [デプロイとソース管理](./deploy.md) — Portal のソースコードを Git で管理する方法とマルチ環境デプロイ

## 関連リンク

- [AI Agent と協働して構築](./agent-workflow.md) — 自然言語で AI に Portal のページを書かせる
- [プロジェクト構成と技術スタック](./project-structure.md) — テンプレートのディレクトリ規約と主なコマンド
- [標準コンポーネントと拡張](./components.md) — shadcn/ui のコンポーネント基盤と拡張の仕組み
- [デプロイとソース管理](./deploy.md) — 開発、push、デプロイの一連の流れ
- [AI Agent 接続ガイド](../../ai/quick-start.md) — NocoBase CLI をインストールして初期化する
- [AI ビルダー クイックスタート](../index.md) — コードを書かないもう一つの構築方式
- [バージョン管理](../version-control.md) — ノーコード構築のバージョンスナップショット
- [`nb portal` コマンドリファレンス](../../api/cli/portal/index.md) — すべての Portal コマンドの詳細なパラメータ説明
