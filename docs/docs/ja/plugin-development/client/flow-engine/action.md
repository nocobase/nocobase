---
title: "操作拡張"
description: "NocoBase 操作拡張の開発：ActionModel 基底クラス、ActionSceneEnum 操作シーン、カスタム操作ボタン。"
keywords: "操作拡張,Action,ActionModel,ActionSceneEnum,操作ボタン,NocoBase"
---

# 操作拡張

NocoBase では、**操作（Action）** はブロック内のボタンで、ビジネスロジックをトリガーします。例えば「新規作成」「編集」「削除」などです。`ActionModel` 基底クラスを継承することで、カスタム操作ボタンを追加できます。

## 操作シーン

各操作は表示シーンの宣言が必要で、`static scene` プロパティで指定します：

| シーン       | 値                           | 説明                                         |
| ---------- | ---------------------------- | ------------------------------------------ |
| collection | `ActionSceneEnum.collection` | データテーブルに対する操作（「新規作成」ボタンなど） |
| record     | `ActionSceneEnum.record`     | 単一レコードに対する操作（「編集」「削除」ボタンなど） |
| both       | `ActionSceneEnum.both`       | 両方のシーンで使用可能                       |
| all        | `ActionSceneEnum.all`        | すべてのシーンで使用可能（ダイアログなどの特殊コンテキストを含む） |

## 使用例

### データテーブルレベル操作

データテーブル全体に対する操作で、ブロック上部の操作バーに表示されます：

```tsx
// models/SimpleCollectionActionModel.tsx
import { ActionModel, ActionSceneEnum } from '@nocobase/client-v2';
import { ButtonProps } from 'antd';
import { tExpr } from '@nocobase/flow-engine';

export class SimpleCollectionActionModel extends ActionModel {
  static scene = ActionSceneEnum.collection;

  defaultProps: ButtonProps = {
    children: tExpr('Simple collection action'),
  };
}

SimpleCollectionActionModel.define({
  label: tExpr('Simple collection action'),
});
```

### レコードレベル操作

単一レコードに対する操作で、テーブル各行の操作列に表示されます：

```tsx
// models/SimpleRecordActionModel.tsx
import { ActionModel, ActionSceneEnum } from '@nocobase/client-v2';
import { ButtonProps } from 'antd';
import { tExpr } from '@nocobase/flow-engine';

export class SimpleRecordActionModel extends ActionModel {
  static scene = ActionSceneEnum.record;

  defaultProps: ButtonProps = {
    children: tExpr('Simple record action'),
  };
}

SimpleRecordActionModel.define({
  label: tExpr('Simple record action'),
});
```

### 両方のシーンに対応

操作がシーンを区別しない場合は `ActionSceneEnum.both` を使います：

```tsx
// models/SimpleBothActionModel.tsx
import { ActionModel, ActionSceneEnum } from '@nocobase/client-v2';
import { ButtonProps } from 'antd';
import { tExpr } from '@nocobase/flow-engine';

export class SimpleBothActionModel extends ActionModel {
  static scene = ActionSceneEnum.both;

  defaultProps: ButtonProps = {
    children: tExpr('Simple both action'),
  };
}

SimpleBothActionModel.define({
  label: tExpr('Simple both action'),
});
```

3つの書き方の構造は同じです。違いは `static scene` の値と `defaultProps` 内のボタンテキストだけです。

## 操作の登録

Plugin の `load()` 内で `registerModelLoaders` を使って遅延読み込み登録します：

```ts
// plugin.tsx
import { Plugin } from '@nocobase/client-v2';

export class PluginSimpleActionClient extends Plugin {
  async load() {
    this.flowEngine.registerModelLoaders({
      SimpleCollectionActionModel: {
        loader: () => import('./models/SimpleCollectionActionModel'),
      },
      SimpleRecordActionModel: {
        loader: () => import('./models/SimpleRecordActionModel'),
      },
      SimpleBothActionModel: {
        loader: () => import('./models/SimpleBothActionModel'),
      },
    });
  }
}
```

登録完了後、ブロックの「操作の設定」からカスタム操作ボタンを追加できます。

## 完全なソースコード

- [@nocobase-example/plugin-simple-action](https://github.com/nocobase/nocobase/tree/develop/packages/plugins/%40nocobase-example/plugin-simple-action) — 3つの操作シーンの完全な例

## 関連リンク

- [プラグイン実践：カスタム操作ボタンを作る](../examples/custom-action) — ゼロから3つのシーンの操作ボタンを構築
- [プラグイン実践：フロントエンドとバックエンドが連携するデータ管理プラグインを作る](../examples/fullstack-plugin) — カスタム操作 + ctx.viewer.dialog を完全なプラグインで実際に使用
- [FlowEngine 概要](../flow-engine/index.md) — FlowModel の基本的な使い方
- [ブロック拡張](./block) — カスタムブロック
- [フィールド拡張](./field) — カスタムフィールドコンポーネント
- [FlowDefinition フロー定義](../../../flow-engine/definitions/flow-definition.md) — registerFlow の完全なパラメータとイベントタイプ
- [FlowEngine 完全ドキュメント](../../../flow-engine/index.md) — 完全リファレンス
