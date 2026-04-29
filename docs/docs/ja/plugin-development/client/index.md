---
title: "クライアントプラグイン開発の概要"
description: "NocoBase クライアントプラグイン開発の概要：知識の流れ Plugin → Router → Component → Context → FlowEngine、クイックインデックス表でセクションをすばやく見つけられます。"
keywords: "クライアントプラグイン,Plugin,Router,Component,Context,FlowEngine,FlowModel,NocoBase"
---

# 概要

NocoBase のクライアントプラグインでは、さまざまなことができます。新しいページの登録、カスタムコンポーネントの作成、バックエンド API の呼び出し、ブロックやフィールドの追加、さらにはアクションボタンの拡張まで可能です。これらの機能はすべて、統一されたプラグインエントリポイントを通じて管理されます。

React の開発経験があれば、すぐに始められます。ほとんどの場面では通常の React コンポーネントを書くだけで、あとは NocoBase が提供するコンテキスト機能（リクエスト送信、国際化など）を使って NocoBase と連携します。コンポーネントを NocoBase のビジュアル設定画面に表示させたい場合にのみ、[FlowEngine](./flow-engine/index.md) について理解する必要があります。

:::warning 注意

NocoBase は `client`（v1）から `client-v2` への移行を進めています。現在 `client-v2` はまだ開発中です。本ドキュメントの内容は先行体験向けのものであり、本番環境での使用は推奨されません。新しく開発するプラグインは `src/client-v2/` ディレクトリと `@nocobase/client-v2` の API を使用してください。

:::

## 学習パス

以下の順番でクライアントプラグイン開発を学ぶことをお勧めします。シンプルなものから複雑なものへ進みます。

```
Plugin（エントリ）→ Router（ページ）→ Component（コンポーネント）→ Context（コンテキスト）→ FlowEngine（UI 拡張）
```

各ステップの内容：

1. **[Plugin](./plugin)**：プラグインのエントリクラスです。`load()` などのライフサイクルでルーティングやモデルなどのリソースを登録します。
2. **[Router](./router)**：`router.add()` でページルーティングを登録し、`pluginSettingsManager` でプラグイン設定ページを登録します。
3. **[Component](./component/index.md)**：ルーティングにマウントするのは React コンポーネントです。React + Antd で書くだけでよく、通常のフロントエンド開発と変わりません。
4. **[Context](./ctx/index.md)**：プラグイン内では `this.context` でコンテキストを取得し、コンポーネント内では `useFlowContext()` でコンテキストを取得すれば、NocoBase が提供する機能――リクエスト送信（`ctx.api`）、国際化（`ctx.t`）、ログ出力（`ctx.logger`）など――が使えます。
5. **[FlowEngine](./flow-engine/index.md)**：コンポーネントを「ブロック / フィールド / アクションを追加」メニューに表示し、ユーザーによるビジュアル設定をサポートする場合は、FlowModel でラップする必要があります。

最初の 4 ステップでほとんどのプラグインシナリオをカバーできます。NocoBase の UI 設定体系に深く統合する場合にのみ、5 ステップ目に進む必要があります。どちらの方法を使うべきか迷った場合は、[Component vs FlowModel](./component-vs-flow-model) を参照してください。

## クイックインデックス

| やりたいこと                             | 参照先                                                |
| ------------------------------------ | ------------------------------------------------------- |
| クライアントプラグインの基本構造を理解する               | [Plugin プラグイン](./plugin)                                 |
| 独立したページを追加する                     | [Router ルーティング](./router)                                 |
| プラグイン設定ページを追加する                   | [Router ルーティング](./router)                                 |
| 普通の React コンポーネントを書く                | [Component コンポーネント開発](./component/index.md)                       |
| バックエンド API を呼び出す・NocoBase 組み込み機能を使う | [Context → よく使う機能](./ctx/common-capabilities)         |
| コンポーネントのスタイルをカスタマイズする                       | [Styles & Themes スタイルとテーマ](./component/styles-themes) |
| 新しいブロックを追加する                     | [FlowEngine → ブロック拡張](./flow-engine/block)            |
| 新しいフィールドコンポーネントを追加する                 | [FlowEngine → フィールド拡張](./flow-engine/field)            |
| 新しいアクションボタンを追加する                 | [FlowEngine → アクション拡張](./flow-engine/action)           |
| Component と FlowModel のどちらを使うか迷っている    | [Component vs FlowModel](./component-vs-flow-model)     |
| 完成したプラグインの作り方を見る           | [プラグイン実践例](./examples/index.md)                              |

## 関連リンク

- [最初のプラグインを作成する](../write-your-first-plugin) — ゼロから実行可能なプラグインを作成する
- [サーバーサイド開発の概要](../server) — クライアントプラグインは通常サーバーサイドとの連携が必要です
- [FlowEngine 完全リファレンス](../../flow-engine/index.md) — FlowModel、Flow、Context の完全なリファレンス
- [プロジェクトディレクトリ構造](../project-structure) — プラグインファイルの配置場所
