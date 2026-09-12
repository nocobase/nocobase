---
title: "プラグイン実践例"
description: "NocoBase クライアントプラグインの完全な実践例：設定ページ、カスタムブロック、フロントエンド・バックエンド連携、カスタムフィールド。ゼロから完成までの完全なプラグイン。"
keywords: "プラグイン例,実践例,完全なプラグイン,NocoBase"
---

# プラグイン実践例

これまでの章では [Plugin](../plugin)、[Router](../router)、[Component](../component/index.md)、[Context](../ctx/index.md)、[FlowEngine](../flow-engine/index.md) などの各機能を個別に紹介しました。この章ではそれらをまとめて、いくつかの完全な実践例を通じて、プラグインの作成から完成までの全プロセスを示します。

各例はそれぞれ実行可能なサンプルプラグインに対応しており、ソースコードを直接確認したりローカルで実行できます。

## 例の一覧

| 例 | 関連する機能 | 難易度 |
| --- | --- | --- |
| [プラグイン設定ページを作る](./settings-page) | Plugin + Router + Component + Context + サーバーサイド | 入門 |
| [カスタム表示ブロックを作る](./custom-block) | Plugin + FlowEngine（BlockModel） | 入門 |
| [カスタムフィールドコンポーネントを作る](./custom-field) | Plugin + FlowEngine（FieldModel） | 入門 |
| [カスタム操作ボタンを作る](./custom-action) | Plugin + FlowEngine（ActionModel） | 入門 |
| [フロントエンドとバックエンドが連携するデータ管理プラグインを作る](./fullstack-plugin) | Plugin + FlowEngine（TableBlockModel + FieldModel + ActionModel）+ サーバーサイド | 応用 |

順番に読むことをお勧めします。最初の例は React コンポーネント + シンプルなサーバーインターフェースで、FlowEngine は使いません。中間の3つはそれぞれ FlowEngine のブロック、フィールド、操作の3つの基底クラスをデモします。最後の例はこれまでに学んだブロック、フィールド、操作をまとめ、サーバーサイドのデータテーブルと組み合わせて、完全なフロントエンド・バックエンド連携プラグインを構成します。React コンポーネントと FlowModel のどちらを使うか迷ったら、先に [Component vs FlowModel](../component-vs-flow-model) をご覧ください。

## 関連リンク

- [はじめてのプラグインを書く](../../write-your-first-plugin) — ゼロから実行可能なプラグインを作成
- [クライアント開発概要](../index.md) — 学習パスとクイックインデックス
- [FlowEngine 概要](../flow-engine/index.md) — FlowModel の基本的な使い方と registerFlow
- [FlowEngine 完全ドキュメント](../../../flow-engine/index.md) — FlowModel、Flow、Context の完全リファレンス
- [Component vs FlowModel](../component-vs-flow-model) — コンポーネントか FlowModel かの選択
