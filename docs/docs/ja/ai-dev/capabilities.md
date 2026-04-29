---
title: "サポートされている機能"
description: "AI 開発がサポートするすべての機能：スキャフォールド、データテーブル、ブロック、フィールド、操作、設定ページ、API、権限、国際化、アップグレードスクリプト。"
keywords: "AI 開発,機能,プラグイン開発,スキャフォールド,データテーブル,ブロック,フィールド,操作,権限,国際化"
---

# サポートされている機能

:::tip 前提条件

このページを読む前に、[AI プラグイン開発クイックスタート](./index.md)に従って環境準備が完了していることを確認してください。

:::

AI プラグイン開発の機能は [nocobase-plugin-development](https://github.com/nocobase/skills/tree/main/skills/nocobase-plugin-development) Skill によって実現されています。[NocoBase CLI](../ai/quick-start.md) で初期化（`nb init`）済みであれば、この Skill は自動的にインストールされます。

以下に、AI が現在サポートしているすべての機能を紹介します。各機能にはプロンプト例が付いていますので、コピーして要件の説明を変更するだけですぐに使えます。

:::warning 注意

- NocoBase は `client`（v1）から `client-v2` への移行を進めており、現在 `client-v2` はまだ開発中です。AI が生成するクライアントコードは `client-v2` ベースのため、`/v2/` パスでのみ使用可能です。先行体験用であり、本番環境での使用は推奨しません。
- AI が生成するコードは必ずしも 100% 正確ではありません。有効化する前にレビューすることをお勧めします。実行時に問題が発生した場合は、エラーメッセージを AI に送信して調査・修正を続けてもらいましょう。通常、数回のやり取りで解決できます。
- 開発には GPT または Claude シリーズの大規模言語モデルの使用を推奨します。最も良い結果が得られます。他のモデルでも使用可能ですが、生成品質に差が出る場合があります。

:::

## ベストプラクティス

- **NocoBase プラグインの作成または改修であることを AI に明確に伝え、プラグイン名を指定してください** ── 例えば「nocobase-plugin-development skill を使って NocoBase プラグインを開発してください。名前は @my-scope/plugin-rating です」のように指定します。プラグイン名を指定しないと、AI がどこにコードを生成すべきか判断できない場合があります。
- **プロンプトで nocobase-plugin-development skill の使用を明示してください** ── 例えば「nocobase-plugin-development skill を使って NocoBase プラグインを開発してください……」のように指定します。これにより AI Agent が Skills の機能を直接読み取れるようになり、plan モードに入って Skills を無視してしまうことを防げます。
- **NocoBase ソースコードリポジトリのルートディレクトリで AI Agent を実行してください** ── これにより AI がプロジェクト構造、依存関係、既存のプラグインを自動的に検出できます。ソースコードのルートディレクトリにいない場合は、AI Agent にリポジトリのパスを別途伝える必要があります。

## クイックインデックス

| やりたいこと                 | AI がやってくれること                                       |
| ---------------------------- | ----------------------------------------------------------- |
| 新しいプラグインを作成する   | フロントエンド・バックエンドのディレクトリ構造を含む完全なスキャフォールドを生成 |
| データテーブルを定義する     | すべてのフィールドタイプとリレーションに対応した Collection 定義を生成 |
| カスタムブロックを作る       | BlockModel + 設定パネル + 「ブロックを追加」メニューへの登録を生成 |
| カスタムフィールドを作る     | FieldModel + フィールドインターフェースへのバインドを生成   |
| カスタム操作ボタンを追加する | ActionModel + ポップアップ/ドロワー/確認ダイアログを生成    |
| プラグイン設定ページを作る   | フロントエンドフォーム + バックエンド API + ストレージを生成 |
| カスタム API を書く          | Resource Action + ルーティング登録 + ACL 設定を生成         |
| 権限を設定する               | ACL ルールを生成し、ロールごとにアクセスを制御              |
| 多言語対応する               | 中国語・英語の言語パックを自動生成                          |
| アップグレードスクリプトを書く | DDL とデータマイグレーションに対応した Migration を生成     |

## プラグインスキャフォールド

AI は要件の説明に基づいて、フロントエンド・バックエンドのエントリファイル、型定義、基本設定を含む完全な NocoBase プラグインのディレクトリ構造を生成できます。

プロンプト例：

```
NocoBase プラグインを作成してください。プラグイン名は @my-scope/plugin-todo です。
```

AI が `yarn pm create @my-scope/plugin-todo` を実行し、標準的なディレクトリ構造を生成します：

```
packages/plugins/@my-scope/plugin-todo/
├── src/
│   ├── server/
│   │   └── plugin.ts
│   ├── client-v2/
│   │   └── plugin.tsx
│   └── locale/
│       ├── zh-CN.json
│       └── en-US.json
├── package.json
└── ...
```

## データテーブル定義

AI はリレーション（一対多、多対多など）を含む、すべての NocoBase フィールドタイプの Collection 定義を生成できます。

プロンプト例：

```
nocobase-plugin-development skill を使って NocoBase プラグインを開発してください。名前は @my-scope/plugin-order です。
その中に「注文」テーブルを定義してください。フィールドは：注文番号（自動採番）、顧客名（文字列）、
金額（小数）、ステータス（単一選択：未処理/処理中/完了）、作成日時です。
注文と顧客は多対一のリレーションです。
```

AI が `defineCollection` 定義を生成します。フィールドタイプ、デフォルト値、リレーション設定などが含まれます。

## カスタムブロック

ブロックは NocoBase フロントエンドの最も重要な拡張方法です。AI はブロックモデル、設定パネル、メニュー登録を生成できます。

プロンプト例：

```
nocobase-plugin-development skill を使って NocoBase プラグインを開発してください。名前は @my-scope/plugin-simple-block です。
カスタム表示ブロック（BlockModel）を作成し、ユーザーが設定パネルで HTML コンテンツを入力できるようにして、
ブロックがその HTML をレンダリングするようにしてください。このブロックを「ブロックを追加」メニューに登録してください。
```

<video width="100%" controls>
  <source src="https://static-docs.nocobase.com/iShot_2026-04-07_17.23.49.mp4" type="video/mp4">
</video>

AI が `BlockModel` を生成し、`registerFlow` + `uiSchema` で設定パネルを作成し、「ブロックを追加」メニューに登録します。

完全な例は[カスタム表示ブロックを作る](../plugin-development/client/examples/custom-block)を参照してください。

## カスタムフィールドコンポーネント

NocoBase の組み込みフィールドレンダリングコンポーネントが要件を満たさない場合、AI がカスタム表示コンポーネントを作成し、デフォルトのフィールドレンダリング方法を置き換えることができます。

プロンプト例：

```
nocobase-plugin-development skill を使って NocoBase プラグインを開発してください。名前は @my-scope/plugin-rating です。
カスタムフィールド表示コンポーネント（FieldModel）を作成し、integer 型のフィールドを星アイコンでレンダリングしてください。
1〜5 点に対応し、星をクリックすると評価値を直接変更してデータベースに保存できるようにしてください。
```

![Rating コンポーネントの表示効果](https://static-docs.nocobase.com/20260422170712.png)

AI がカスタムの `FieldModel` を生成し、integer フィールドのデフォルトレンダリングコンポーネントを置き換えます。

## カスタム操作

操作ボタンは、ブロック上部（collection レベル）、テーブル各行の操作列（record レベル）、または両方の位置に表示できます。クリックすると、通知の表示、フォームポップアップのオープン、API の呼び出しなどが可能です。

プロンプト例：

```
nocobase-plugin-development skill を使って NocoBase プラグインを開発してください。名前は @my-scope/plugin-simple-action です。
3 つのカスタム操作ボタン（ActionModel）を作成してください：
1. collection レベルのボタン：ブロック上部に表示し、クリックすると成功通知を表示
2. record レベルのボタン：テーブル各行の操作列に表示し、クリックすると現在のレコードの ID を表示
3. both レベルのボタン：両方の位置に同時に表示し、クリックすると情報通知を表示
```

<video width="100%" controls>
  <source src="https://static-docs.nocobase.com/iShot_2026-04-08_17.55.43.mp4" type="video/mp4">
</video>

AI が `ActionModel` を生成し、`ActionSceneEnum` でボタンの表示位置を制御し、`registerFlow({ on: 'click' })` でクリックイベントを処理します。

完全な例は[カスタム操作ボタンを作る](../plugin-development/client/examples/custom-action)を参照してください。

## プラグイン設定ページ

多くのプラグインでは、パラメータを設定するための設定ページが必要です。たとえば、サードパーティサービスの API Key や Webhook URL などです。

プロンプト例：

```
nocobase-plugin-development skill を使って NocoBase プラグインを開発してください。名前は @my-scope/plugin-settings-page です。
プラグイン設定ページを作成し、「プラグイン設定」メニューの下に「外部サービス設定」エントリを登録してください。2 つの Tab を含みます：
1.「API 設定」Tab：フォームには API Key（文字列、必須）、API Secret（パスワード、必須）、Endpoint（文字列、任意）があり、バックエンド API 経由でデータベースに保存します
2.「概要」Tab：プラグイン名とバージョン情報を表示します
フロントエンドは Ant Design のフォームコンポーネントを使用し、バックエンドでは externalApi:get と externalApi:set の 2 つのインターフェースを定義してください。
```

![プラグイン設定ページの表示効果](https://static-docs.nocobase.com/20260415160006.png)

AI がフロントエンドの設定ページコンポーネント、バックエンドの Resource Action、データテーブル定義、ACL 設定を生成します。

完全な例は[プラグイン設定ページを作る](../plugin-development/client/examples/settings-page)を参照してください。

## カスタム API

組み込みの CRUD インターフェースでは不十分な場合、AI がカスタム REST API を作成できます。以下はフロントエンドとバックエンドが連携する完全な例です。バックエンドでデータテーブルと API を定義し、フロントエンドでカスタムブロックを作成してデータを表示します。

プロンプト例：

```
nocobase-plugin-development skill を使って NocoBase プラグインを開発してください。名前は @my-scope/plugin-todo です。
フロントエンドとバックエンドが連携する Todo データ管理プラグインを作成してください：
1. バックエンドで todoItems テーブルを定義。フィールドは title（文字列）、completed（ブール値）、priority（文字列、デフォルト値 medium）
2. フロントエンドでカスタム TableBlock を作成し、todoItems のデータのみを表示
3. priority フィールドはカラー Tag で表示（high は赤、medium はオレンジ、low は緑）
4.「新規 Todo」ボタンを追加し、クリックするとフォームが表示されてレコードを作成
5. ログイン済みユーザーがすべての CRUD 操作を実行可能
```

![Todo データ管理プラグインの表示効果](https://static-docs.nocobase.com/20260408164204.png)

AI がサーバーサイドの Collection 定義、Resource Action、ACL 設定、およびクライアントサイドの `TableBlockModel`、カスタム `FieldModel`、`ActionModel` を生成します。

完全な例は[フロントエンド・バックエンド連携のデータ管理プラグインを作る](../plugin-development/client/examples/fullstack-plugin)を参照してください。

## 権限設定

AI は生成した API とリソースに対して適切な ACL ルールを自動的に設定します。プロンプトで権限要件を明示的に指定することも可能です：

プロンプト例：

```
nocobase-plugin-development skill を使って NocoBase プラグインを開発してください。名前は @my-scope/plugin-todo です。
todoItems データテーブル（title、completed、priority フィールド）を定義してください。
権限要件：ログイン済みユーザーは閲覧・作成・編集が可能、admin ロールのみ削除可能。
```

AI がサーバーサイドで `this.app.acl.allow()` を使用して対応するアクセスルールを設定します。

## 国際化

AI はデフォルトで中国語と英語の 2 つの言語パック（`zh-CN.json` と `en-US.json`）を生成します。特別に指定する必要はありません。

他の言語が必要な場合：

```
nocobase-plugin-development skill を使って NocoBase プラグインを開発してください。名前は @my-scope/plugin-order です。
中国語、英語、日本語の 3 つの言語パックをサポートしてください。
```

## アップグレードスクリプト

プラグインのデータベース構造の更新やデータマイグレーションが必要な場合、AI が Migration スクリプトを生成できます。

プロンプト例：

```
nocobase-plugin-development skill を使って NocoBase プラグイン @my-scope/plugin-order のアップグレードスクリプトを書いてください。
「注文」テーブルに「備考」フィールド（長文テキスト、任意入力）を追加し、既存の注文の備考フィールドにデフォルト値「なし」を設定してください。
```

AI がバージョン番号付きの Migration ファイルを生成します。DDL 操作とデータマイグレーションロジックが含まれます。

## 関連リンク

- [AI プラグイン開発クイックスタート](./index.md) — クイックスタートと機能概要
- [実践：ウォーターマークプラグインの開発](./watermark-plugin) — AI プラグイン開発の完全な実践事例
- [プラグイン開発](../plugin-development/index.md) — NocoBase プラグイン開発の完全ガイド
- [NocoBase CLI](../ai/quick-start.md) — NocoBase のインストールと管理のためのコマンドラインツール
