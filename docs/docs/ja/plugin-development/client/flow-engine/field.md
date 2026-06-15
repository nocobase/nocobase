---
title: "フィールド拡張"
description: "NocoBase フィールド拡張の開発：FieldModel、ClickableFieldModel 基底クラス、フィールドレンダリング、フィールドインターフェースへのバインド。"
keywords: "フィールド拡張,Field,FieldModel,ClickableFieldModel,renderComponent,bindModelToInterface,NocoBase"
---

# フィールド拡張

NocoBase では、**フィールドコンポーネント（Field）** はテーブルやフォーム内でデータを表示・編集するために使います。FieldModel 関連の基底クラスを継承することで、フィールドのレンダリング方法をカスタマイズできます。例えば特殊なフォーマットでデータを表示したり、カスタムコンポーネントで編集したりできます。

## 例：カスタム表示フィールド

以下の例では、フィールドの値の両側に角括弧 `[]` を追加するシンプルな表示フィールドを作成します：

![20260407201138](https://static-docs.nocobase.com/20260407201138.png)

```tsx
// models/SimpleFieldModel.tsx
import React from 'react';
import { ClickableFieldModel } from '@nocobase/client-v2';
import { DisplayItemModel } from '@nocobase/flow-engine';

export class DisplaySimpleFieldModel extends ClickableFieldModel {
  public renderComponent(value) {
    // this.context.record で現在の行の完全なレコードを取得可能
    console.log('現在のレコード：', this.context.record);
    console.log('現在のレコード index：', this.context.recordIndex);
    return <span>[{value}]</span>;
  }
}

// 'input' タイプのフィールドインターフェースにバインド
DisplayItemModel.bindModelToInterface('DisplaySimpleFieldModel', ['input']);
```

重要なポイント：

- **`renderComponent(value)`** — 現在のフィールドの値を引数として受け取り、レンダリングする JSX を返す
- **`this.context.record`** — 現在の行の完全なデータレコードを取得
- **`this.context.recordIndex`** — 現在の行のインデックスを取得
- **`ClickableFieldModel`** — `FieldModel` を継承し、クリックインタラクション機能を持つ
- **`DisplayItemModel.bindModelToInterface()`** — フィールドモデルを指定のフィールドインターフェースタイプにバインド（例：`input` はテキスト入力系フィールド）。対応するタイプのフィールドでこの表示コンポーネントを選択できるようになる

## フィールドの登録

Plugin の `load()` 内で `registerModelLoaders` を使って遅延読み込み登録します：

```ts
// plugin.tsx
import { Plugin } from '@nocobase/client-v2';

export class PluginFieldSimpleClient extends Plugin {
  async load() {
    this.flowEngine.registerModelLoaders({
      DisplaySimpleFieldModel: {
        loader: () => import('./models/SimpleFieldModel'),
      },
    });
  }
}
```

登録完了後、テーブルブロック内の対応するタイプのフィールド列（上記の例では `input` にバインドしたため単行テキストフィールド）で、列の設定ボタンをクリックし、「フィールドコンポーネント」ドロップダウンからこのカスタム表示コンポーネントに切り替えられます。完全な実践例は[カスタムフィールドコンポーネントを作る](../examples/custom-field)をご覧ください。

![20260407201221](https://static-docs.nocobase.com/20260407201221.png)

## 完全なソースコード

- [@nocobase-example/plugin-field-simple](https://github.com/nocobase/nocobase/tree/develop/packages/plugins/%40nocobase-example/plugin-field-simple) — カスタムフィールドコンポーネントの例

## 関連リンク

- [プラグイン実践：カスタムフィールドコンポーネントを作る](../examples/custom-field) — ゼロからカスタムフィールド表示コンポーネントを構築
- [プラグイン実践：フロントエンドとバックエンドが連携するデータ管理プラグインを作る](../examples/fullstack-plugin) — カスタムフィールドを完全なプラグインで実際に使用
- [FlowEngine 概要](../flow-engine/index.md) — FlowModel の基本的な使い方
- [ブロック拡張](./block) — カスタムブロック
- [操作拡張](./action) — カスタム操作ボタン
- [FlowDefinition フロー定義](../../../flow-engine/definitions/flow-definition.md) — registerFlow の完全なパラメータとイベントタイプ
- [FlowEngine 完全ドキュメント](../../../flow-engine/index.md) — 完全リファレンス
