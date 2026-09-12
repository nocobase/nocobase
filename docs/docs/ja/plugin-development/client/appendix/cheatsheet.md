---
title: "プラグイン開発チートシート"
description: "NocoBase プラグイン開発チートシート：やりたいこと → どのファイル → どの API、コードの配置場所を素早く特定できます。"
keywords: "チートシート,Cheatsheet,登録方法,ファイル配置,NocoBase"
---

# プラグイン開発チートシート

プラグインを書いていると「これはどのファイルに書けばいいの？どの API を呼べばいいの？」と迷うことがよくあります。このチートシートで素早く確認できます。

## プラグインのディレクトリ構成

`yarn pm create @my-project/plugin-name` でプラグインを作成すると、以下のディレクトリ構成が自動生成されます。手動でディレクトリを作成しないでください。登録手順の漏れでプラグインが動作しなくなります。詳しくは[はじめてのプラグインを書く](../../write-your-first-plugin)をご覧ください。

```bash
plugin-name/
├── src/
│   ├── client-v2/              # クライアントコード（v2）
│   │   ├── plugin.tsx          # クライアントプラグインエントリ
│   │   ├── locale.ts           # useT / tExpr 翻訳 hook
│   │   ├── models/             # FlowModel（ブロック、フィールド、操作）
│   │   └── pages/              # ページコンポーネント
│   ├── client/                 # クライアントコード（v1、互換性用）
│   │   ├── plugin.tsx
│   │   ├── locale.ts
│   │   ├── models/
│   │   └── pages/
│   ├── server/                 # サーバーサイドコード
│   │   ├── plugin.ts           # サーバープラグインエントリ
│   │   └── collections/        # データテーブル定義
│   └── locale/                 # 多言語翻訳ファイル
│       ├── zh-CN.json
│       └── en-US.json
├── client-v2.js                # ルートエントリ（ビルド成果物の参照先）
├── client-v2.d.ts
├── client.js
├── client.d.ts
├── server.js
├── server.d.ts
└── package.json
```

## クライアント：やりたいこと → 書き方

| やりたいこと | どのファイルに書くか | 呼び出す API | ドキュメント |
| --- | --- | --- | --- |
| ページルートを登録する | `plugin.tsx` の `load()` | `this.router.add()` | [Router](../router) |
| プラグイン設定ページを登録する | `plugin.tsx` の `load()` | `pluginSettingsManager.addMenuItem()` + `addPageTabItem()` | [Router](../router) |
| カスタムブロックを登録する | `plugin.tsx` の `load()` | `this.flowEngine.registerModelLoaders()` | [FlowEngine → ブロック拡張](../flow-engine/block) |
| カスタムフィールドを登録する | `plugin.tsx` の `load()` | `this.flowEngine.registerModelLoaders()` | [FlowEngine → フィールド拡張](../flow-engine/field) |
| カスタム操作を登録する | `plugin.tsx` の `load()` | `this.flowEngine.registerModelLoaders()` | [FlowEngine → 操作拡張](../flow-engine/action) |
| 内部テーブルをブロックのデータテーブル選択に表示する | `plugin.tsx` の `load()` | `mainDS.addCollection()` | [Collections データテーブル](../../server/collections) |
| プラグインのテキストを翻訳する | `locale/zh-CN.json` + `locale/en-US.json` | — | [i18n 国際化](../component/i18n) |

## サーバーサイド：やりたいこと → 書き方

| やりたいこと | どのファイルに書くか | 呼び出す API | ドキュメント |
| --- | --- | --- | --- |
| データテーブルを定義する | `server/collections/xxx.ts` | `defineCollection()` | [Collections データテーブル](../../server/collections) |
| 既存のデータテーブルを拡張する | `server/collections/xxx.ts` | `extendCollection()` | [Collections データテーブル](../../server/collections) |
| カスタム API を登録する | `server/plugin.ts` の `load()` | `this.app.resourceManager.define()` | [ResourceManager](../../server/resource-manager) |
| API の権限を設定する | `server/plugin.ts` の `load()` | `this.app.acl.allow()` | [ACL アクセス制御](../../server/acl) |
| プラグインインストール時に初期データを投入する | `server/plugin.ts` の `install()` | `this.db.getRepository().create()` | [Plugin プラグイン](../../server/plugin) |

## FlowModel チートシート

| やりたいこと | 継承する基底クラス | 主な API |
| --- | --- | --- |
| 純粋な表示ブロックを作る | `BlockModel` | `renderComponent()` + `define()` |
| データテーブルにバインドするブロックを作る（カスタムレンダリング） | `CollectionBlockModel` | `createResource()` + `renderComponent()` |
| 完全なテーブルブロックを作る（組み込みテーブルをベースにカスタマイズ） | `TableBlockModel` | `filterCollection()` + `customModelClasses` |
| フィールド表示コンポーネントを作る | `ClickableFieldModel` | `renderComponent(value)` + `bindModelToInterface()` |
| 操作ボタンを作る | `ActionModel` | `static scene` + `registerFlow({ on: 'click' })` |

## 翻訳メソッドチートシート

| シーン | 使うもの | インポート元 |
| --- | --- | --- |
| Plugin `load()` 内 | `this.t('key')` | Plugin 基底クラスに組み込み済み |
| React コンポーネント内 | `const t = useT(); t('key')` | `locale.ts` |
| FlowModel 静的定義（`define()`、`registerFlow()`） | `tExpr('key')` | `locale.ts` |

## よく使う API チートシート

| やりたいこと | Plugin 内 | コンポーネント内 |
| --- | --- | --- |
| API リクエストを送る | `this.context.api.request()` | `ctx.api.request()` |
| 翻訳を取得する | `this.t()` | `useT()` |
| ログを出力する | `this.context.logger` | `ctx.logger` |
| ルートを登録する | `this.router.add()` | — |
| ページ遷移する | — | `ctx.router.navigate()` |
| ダイアログを開く | — | `ctx.viewer.dialog()` |

## 関連リンク

- [クライアント開発概要](../index.md) — 学習パスとクイックインデックス
- [Plugin プラグイン](../plugin) — プラグインエントリとライフサイクル
- [よくある質問 & トラブルシューティング](./faq) — つまずきポイントの調査
- [Router ルーティング](../router) — ページルートの登録
- [FlowEngine → ブロック拡張](../flow-engine/block) — BlockModel 系基底クラス
- [FlowEngine → フィールド拡張](../flow-engine/field) — FieldModel の開発
- [FlowEngine → 操作拡張](../flow-engine/action) — ActionModel の開発
- [Collections データテーブル](../../server/collections) — defineCollection とフィールドタイプ
- [i18n 国際化](../component/i18n) — 翻訳ファイルの書き方
- [ResourceManager リソース管理](../../server/resource-manager) — カスタム REST API
- [ACL アクセス制御](../../server/acl) — 権限設定
- [Plugin プラグイン（サーバーサイド）](../../server/plugin) — サーバーサイドプラグインのライフサイクル
- [はじめてのプラグインを書く](../../write-your-first-plugin) — プラグインスケルトンの作成
