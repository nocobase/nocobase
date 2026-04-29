---
title: "カスタムフィールドコンポーネントを作る"
description: "NocoBase プラグイン実践：ClickableFieldModel でカスタムフィールド表示コンポーネントを作り、フィールドインターフェースにバインドします。"
keywords: "カスタムフィールド,FieldModel,ClickableFieldModel,bindModelToInterface,フィールド拡張,NocoBase"
---

# カスタムフィールドコンポーネントを作る

NocoBase では、フィールドコンポーネントはテーブルやフォーム内でデータを表示・編集するために使います。この例では `ClickableFieldModel` を使ってカスタムフィールド表示コンポーネントを作る方法を示します。フィールドの値の両側に角括弧 `[]` を追加し、`input` タイプのフィールドインターフェースにバインドします。

:::tip 前提知識

以下の内容を事前に理解しておくと、開発がスムーズになります：

- [はじめてのプラグインを書く](../../write-your-first-plugin) — プラグインの作成とディレクトリ構成
- [Plugin プラグイン](../plugin) — プラグインエントリと `load()` ライフサイクル
- [FlowEngine 概要](../flow-engine/index.md) — FlowModel の基本的な使い方
- [FlowEngine → フィールド拡張](../flow-engine/field) — FieldModel、ClickableFieldModel 基底クラスの紹介
- [i18n 国際化](../component/i18n) — 翻訳ファイルの書き方と `tExpr()` 遅延翻訳の使い方

:::

## 最終的な効果

カスタムフィールド表示コンポーネントを作ります：

- `ClickableFieldModel` を継承し、レンダリングロジックをカスタマイズ
- フィールドの値の両側に `[]` を追加して表示
- `bindModelToInterface` で `input`（単行テキスト）タイプのフィールドにバインド

プラグインを有効化後、テーブルブロック内の単行テキストフィールドの列で、列の設定ボタンをクリックし、「フィールドコンポーネント」ドロップダウンに `DisplaySimpleFieldModel` オプションが表示されます。切り替えると、その列の値が `[value]` 形式で表示されます。

<video width="100%" height="450" controls>
  <source src="https://static-docs.nocobase.com/iShot_2026-04-07_20.08.48.mp4" type="video/mp4">
</video>

完全なソースコードは [@nocobase-example/plugin-field-simple](https://github.com/nocobase/nocobase/tree/develop/packages/plugins/%40nocobase-example/plugin-field-simple) を参照してください。ローカルで動作確認したい場合：

```bash
yarn pm enable @nocobase-example/plugin-field-simple
```

以下、ゼロからこのプラグインを構築していきます。

## ステップ1：プラグインスケルトンの作成

リポジトリのルートで実行します：

```bash
yarn pm create @my-project/plugin-field-simple
```

詳しくは[はじめてのプラグインを書く](../../write-your-first-plugin)をご覧ください。

## ステップ2：フィールドモデルの作成

`src/client-v2/models/DisplaySimpleFieldModel.tsx` を新規作成します。これがプラグインの中核で、フィールドのレンダリング方法とバインド先のフィールドインターフェースを定義します。

```tsx
// src/client-v2/models/DisplaySimpleFieldModel.tsx
import React from 'react';
import { ClickableFieldModel } from '@nocobase/client-v2';
import { DisplayItemModel } from '@nocobase/flow-engine';
import { tExpr } from '../locale';

export class DisplaySimpleFieldModel extends ClickableFieldModel {
  public renderComponent(value: string) {
    // this.context.record で現在の行の完全なレコードを取得可能
    console.log('現在のレコード：', this.context.record);
    console.log('現在のレコード index：', this.context.recordIndex);
    return <span>[{value}]</span>;
  }
}

// 「フィールドコンポーネント」ドロップダウンでの表示名を設定
DisplaySimpleFieldModel.define({
  label: tExpr('Simple field'),
});

// 'input'（単行テキスト）タイプのフィールドインターフェースにバインド
DisplayItemModel.bindModelToInterface('DisplaySimpleFieldModel', ['input']);
```

重要なポイント：

- **`renderComponent(value)`** — 現在のフィールドの値を引数として受け取り、レンダリングする JSX を返す
- **`this.context.record`** — 現在の行の完全なデータレコードを取得
- **`this.context.recordIndex`** — 現在の行のインデックスを取得
- **`ClickableFieldModel`** — `FieldModel` を継承し、クリックインタラクション機能を持つ
- **`define({ label })`** — 「フィールドコンポーネント」ドロップダウンでの表示名を設定。追加しないとクラス名がそのまま表示される
- **`DisplayItemModel.bindModelToInterface()`** — フィールドモデルを指定のフィールドインターフェースタイプにバインド（例：`input` は単行テキストフィールド）。対応するタイプのフィールドでこの表示コンポーネントを選択できるようになる

## ステップ3：多言語ファイルの追加

プラグインの `src/locale/` 配下の翻訳ファイルを編集し、`tExpr()` で使用する key の翻訳を追加します：

```json
// src/locale/zh-CN.json
{
  "Simple field": "简单字段"
}
```

```json
// src/locale/en-US.json
{
  "Simple field": "Simple field"
}
```

:::warning 注意

初めて言語ファイルを追加した場合、アプリの再起動が必要です。

:::

翻訳ファイルの書き方と `tExpr()` のその他の使い方については、[i18n 国際化](../component/i18n)をご覧ください。

## ステップ4：プラグインへの登録

`src/client-v2/plugin.tsx` を編集し、`registerModelLoaders` で遅延読み込み登録します：

```ts
// src/client-v2/plugin.tsx
import { Plugin } from '@nocobase/client-v2';

export class PluginFieldSimpleClient extends Plugin {
  async load() {
    this.flowEngine.registerModelLoaders({
      DisplaySimpleFieldModel: {
        loader: () => import('./models/DisplaySimpleFieldModel'),
      },
    });
  }
}

export default PluginFieldSimpleClient;
```

## ステップ5：プラグインの有効化

```bash
yarn pm enable @my-project/plugin-field-simple
```

有効化後、テーブルブロック内の単行テキストフィールドの列で、列の設定ボタンをクリックし、「フィールドコンポーネント」ドロップダウンからこのカスタム表示コンポーネントに切り替えられます。

## 完全なソースコード

- [@nocobase-example/plugin-field-simple](https://github.com/nocobase/nocobase/tree/develop/packages/plugins/%40nocobase-example/plugin-field-simple) — カスタムフィールドコンポーネントの完全な例

## まとめ

この例で使用した機能：

| 機能         | 使い方                                             | ドキュメント                                    |
| ------------ | ------------------------------------------------ | --------------------------------------------- |
| フィールドレンダリング | `ClickableFieldModel` + `renderComponent(value)` | [FlowEngine → フィールド拡張](../flow-engine/field) |
| フィールドインターフェースバインド | `DisplayItemModel.bindModelToInterface()`        | [FlowEngine → フィールド拡張](../flow-engine/field) |
| モデル登録     | `this.flowEngine.registerModelLoaders()`         | [Plugin プラグイン](../plugin)                      |

## 関連リンク

- [はじめてのプラグインを書く](../../write-your-first-plugin) — ゼロからプラグインスケルトンを作成
- [FlowEngine 概要](../flow-engine/index.md) — FlowModel の基本的な使い方
- [FlowEngine → フィールド拡張](../flow-engine/field) — FieldModel、ClickableFieldModel、bindModelToInterface
- [FlowEngine → ブロック拡張](../flow-engine/block) — カスタムブロック
- [Component vs FlowModel](../component-vs-flow-model) — いつ FlowModel を使うか
- [Plugin プラグイン](../plugin) — プラグインエントリと load() ライフサイクル
- [i18n 国際化](../component/i18n) — 翻訳ファイルの書き方と tExpr の使い方
- [FlowEngine 完全ドキュメント](../../../flow-engine/index.md) — FlowModel、Flow、Context の完全リファレンス
