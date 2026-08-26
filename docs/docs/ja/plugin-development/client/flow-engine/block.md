---
title: "ブロック拡張"
description: "NocoBase ブロック拡張の開発：BlockModel、DataBlockModel、CollectionBlockModel、TableBlockModel 基底クラスと登録方法。"
keywords: "ブロック拡張,Block,BlockModel,DataBlockModel,CollectionBlockModel,TableBlockModel,renderComponent,NocoBase"
---

# ブロック拡張

NocoBase では、**ブロック（Block）** はページ上のコンテンツ領域です。テーブル、フォーム、チャート、詳細表示などがあります。BlockModel 系基底クラスを継承することで、カスタムブロックを作成し「ブロックの追加」メニューに登録できます。

## 基底クラスの選択

NocoBase は3つのブロック基底クラスを提供しており、データ要件に応じて選択します：

| 基底クラス               | 継承関係                              | 適用シーン                                   |
| ---------------------- | ------------------------------------- | ------------------------------------------ |
| `BlockModel`           | 最も基本的なブロック                  | データソース不要の表示ブロック               |
| `DataBlockModel`       | `BlockModel` を継承                   | データが必要だが NocoBase データテーブルにバインドしない |
| `CollectionBlockModel` | `DataBlockModel` を継承               | NocoBase データテーブルにバインドし、自動データ取得 |
| `TableBlockModel`      | `CollectionBlockModel` を継承         | 完全なテーブルブロック、フィールド列・操作バー・ページネーションなど組み込み済み |

継承チェーンは `BlockModel` → `DataBlockModel` → `CollectionBlockModel` → `TableBlockModel` です。

通常、すぐに使えるテーブルブロックが欲しい場合は `TableBlockModel` を使います。フィールド列、操作バー、ページネーション、ソートなどの完全な機能が組み込まれており、最もよく使われる基底クラスです。レンダリング方法を完全にカスタマイズしたい場合（カードリスト、タイムラインなど）は `CollectionBlockModel` で自分で `renderComponent` を書きます。静的コンテンツやカスタム UI の表示だけなら `BlockModel` で十分です。

`DataBlockModel` の位置付けはやや特殊です。新しいプロパティやメソッドを追加せず、クラス本体は空です。その役割は**分類識別**です：`DataBlockModel` を継承したブロックは UI 上の「データブロック」グループメニューに分類されます。NocoBase 標準の Collection バインディングを使わず、独自のデータ取得ロジックを管理する場合に `DataBlockModel` を継承できます。例えばチャートプラグインの `ChartBlockModel` がこのパターンで、カスタムの `ChartResource` でデータを取得し、標準的なデータテーブルバインディングは不要です。ほとんどのシーンでは `DataBlockModel` を直接使う必要はなく、`CollectionBlockModel` か `TableBlockModel` で十分です。

## BlockModel の例

最もシンプルなブロック — HTML コンテンツの編集をサポート：

<video width="100%" height="450" controls>
  <source src="https://static-docs.nocobase.com/iShot_2026-04-07_17.23.49.mp4" type="video/mp4">
</video>

```tsx
// models/SimpleBlockModel.tsx
import React from 'react';
import { BlockModel } from '@nocobase/client-v2';
import { tExpr } from '@nocobase/flow-engine';

export class SimpleBlockModel extends BlockModel {
  renderComponent() {
    return <div dangerouslySetInnerHTML={{ __html: this.props.html }} />;
  }
}

SimpleBlockModel.define({
  label: tExpr('Simple block'),
});

SimpleBlockModel.registerFlow({
  key: 'flow1',
  title: tExpr('Simple Block Flow'),
  on: 'beforeRender',
  steps: {
    editHtml: {
      title: tExpr('Edit HTML Content'),
      uiSchema: {
        html: {
          type: 'string',
          title: tExpr('HTML Content'),
          'x-decorator': 'FormItem',
          'x-component': 'Input.TextArea',
        },
      },
      defaultParams: {
        html: `<h3>This is a simple block</h3>
<p>You can edit the HTML content.</p>`,
      },
      handler(ctx, params) {
        ctx.model.props.html = params.html;
      },
    },
  },
});
```

この例はブロック開発の3つのステップをカバーしています：

1. **`renderComponent()`** — ブロックの UI をレンダリングし、`this.props` からプロパティを読み取る
2. **`define()`** — 「ブロックの追加」メニューでの表示名を設定
3. **`registerFlow()`** — ビジュアル設定パネルを追加し、ユーザーが画面上で HTML コンテンツを編集可能にする

## CollectionBlockModel の例

ブロックが NocoBase のデータテーブルにバインドする必要がある場合は `CollectionBlockModel` を使います。データ取得を自動的に処理します：

```tsx
// models/ManyRecordBlockModel.tsx
import React from 'react';
import { BlockSceneEnum, CollectionBlockModel } from '@nocobase/client-v2';
import { MultiRecordResource } from '@nocobase/flow-engine';
import { tExpr } from '@nocobase/flow-engine';

export class ManyRecordBlockModel extends CollectionBlockModel {
  // 複数レコードのブロックであることを宣言
  static scene = BlockSceneEnum.many;

  createResource() {
    return this.context.makeResource(MultiRecordResource);
  }

  get resource() {
    return this.context.resource as MultiRecordResource;
  }

  renderComponent() {
    return (
      <div>
        <h3>データテーブルブロック</h3>
        {/* resource.getData() でデータテーブルのデータを取得 */}
        <pre>{JSON.stringify(this.resource.getData(), null, 2)}</pre>
      </div>
    );
  }
}

ManyRecordBlockModel.define({
  label: tExpr('Many records'),
});
```

`BlockModel` と比べて、`CollectionBlockModel` には以下の追加要素があります：

- **`static scene`** — ブロックのシーンを宣言。よく使う値：`BlockSceneEnum.many`（複数レコードリスト）、`BlockSceneEnum.one`（単一レコードの詳細 / フォーム）。完全な列挙値には `new`、`select`、`filter`、`subForm`、`bulkEditForm` なども含まれる
- **`createResource()`** — データリソースを作成。`MultiRecordResource` は複数レコードの取得に使用
- **`this.resource.getData()`** — データテーブルのデータを取得

## TableBlockModel の例

`TableBlockModel` は `CollectionBlockModel` を継承した NocoBase 組み込みの完全なテーブルブロックです。フィールド列、操作バー、ページネーション、ソートなどの完全な機能が組み込まれています。ユーザーが「ブロックの追加」で「テーブル」を選択した時に使われるのがこれです。

通常、組み込みの `TableBlockModel` で要件を満たせる場合は、ユーザーが画面上で直接追加するだけでよく、開発者は何もする必要がありません。**TableBlockModel をベースにカスタマイズ**する必要がある場合にのみ継承が必要です。例えば：

- `customModelClasses` をオーバーライドして組み込みの操作グループやフィールド列モデルを置き換える
- `filterCollection` で特定のデータテーブルにのみ使用可能に制限する
- 追加の Flow を登録してカスタム設定項目を追加する

```tsx
// 例：todoItems データテーブルでのみ使用可能に制限したテーブルブロック
import { TableBlockModel } from '@nocobase/client-v2';
import type { Collection } from '@nocobase/flow-engine';
import { tExpr } from '../locale';

export class TodoBlockModel extends TableBlockModel {
  static filterCollection(collection: Collection) {
    return collection.name === 'todoItems';
  }
}

TodoBlockModel.define({
  label: tExpr('Todo block'),
});
```

完全な `TableBlockModel` のカスタマイズ例は[フロントエンドとバックエンドが連携するデータ管理プラグインを作る](../examples/fullstack-plugin)をご覧ください。

## ブロックの登録

Plugin の `load()` 内で登録します：

```ts
// plugin.tsx
import { Plugin } from '@nocobase/client-v2';

export class MyPlugin extends Plugin {
  async load() {
    this.flowEngine.registerModelLoaders({
      SimpleBlockModel: {
        loader: () => import('./models/SimpleBlockModel'),
      },
      ManyRecordBlockModel: {
        loader: () => import('./models/ManyRecordBlockModel'),
      },
    });
  }
}
```

登録完了後、NocoBase の画面で「ブロックの追加」をクリックするとカスタムブロックが表示されます。

## 完全なソースコード

- [@nocobase-example/plugin-simple-block](https://github.com/nocobase/nocobase/tree/develop/packages/plugins/%40nocobase-example/plugin-simple-block) — BlockModel の例
- [@nocobase-example/plugin-collection-block](https://github.com/nocobase/nocobase/tree/develop/packages/plugins/%40nocobase-example/plugin-collection-block) — CollectionBlockModel の例

## 関連リンク

- [プラグイン実践：カスタム表示ブロックを作る](../examples/custom-block) — ゼロから設定可能な BlockModel ブロックを構築
- [プラグイン実践：フロントエンドとバックエンドが連携するデータ管理プラグインを作る](../examples/fullstack-plugin) — TableBlockModel + カスタムフィールド + カスタム操作の完全な例
- [FlowEngine 概要](../flow-engine/index.md) — FlowModel の基本的な使い方と registerFlow
- [フィールド拡張](./field) — カスタムフィールドコンポーネント
- [操作拡張](./action) — カスタム操作ボタン
- [Resource API チートシート](../../../api/flow-engine/resource.md) — MultiRecordResource / SingleRecordResource の完全なメソッドシグネチャ
- [FlowDefinition フロー定義](../../../flow-engine/definitions/flow-definition.md) — registerFlow の完全なパラメータとイベントタイプ
- [FlowEngine 完全ドキュメント](../../../flow-engine/index.md) — 完全リファレンス
