---
title: "FlowEngine 概要"
description: "NocoBase FlowEngine プラグイン開発ガイド：FlowModel の基本的な使い方、renderComponent、registerFlow、uiSchema 設定、基底クラスの選択。"
keywords: "FlowEngine,FlowModel,BlockModel,registerFlow,uiSchema,renderComponent,NocoBase"
---

# FlowEngine

NocoBase では、**FlowEngine（フローエンジン）** はビジュアル設定を駆動するコアエンジンです。NocoBase の画面上のブロック、フィールド、操作ボタンはすべて FlowEngine によって管理されています。レンダリング、設定パネル、設定の永続化を含みます。

![20260403215904](https://static-docs.nocobase.com/20260403215904.png)

プラグイン開発者にとって、FlowEngine は2つのコア概念を提供します：

- **FlowModel** — 設定可能なコンポーネントモデル。UI のレンダリングと props の管理を担当
- **Flow** — 設定フロー。コンポーネントの設定パネルとデータ処理ロジックを定義

コンポーネントを「ブロックの追加 / フィールド / 操作」メニューに表示したり、ユーザーが画面上でビジュアル設定できるようにする必要がある場合は、FlowModel でラップします。これらの機能が不要な場合は普通の React コンポーネントで十分です。[Component vs FlowModel](../component-vs-flow-model) をご覧ください。

## FlowModel とは

普通の React コンポーネントとは異なり、FlowModel は UI のレンダリングだけでなく、props のソース、設定パネルの定義、設定の永続化も管理します。簡単に言えば、普通のコンポーネントの props はハードコードされますが、FlowModel の props は Flow によって動的に生成されます。

FlowEngine の全体的なアーキテクチャを深く理解したい場合は、[FlowEngine 完全ドキュメント](../../../flow-engine/index.md)をご覧ください。以下ではプラグイン開発者の視点から、使い方を紹介します。

## 最小限の例

FlowModel の作成から登録まで、3つのステップに分かれます：

### 1. 基底クラスを継承し、renderComponent を実装

```tsx
// models/HelloBlockModel.tsx
import React from 'react';
import { BlockModel } from '@nocobase/client-v2';
import { tExpr } from '@nocobase/flow-engine';

export class HelloBlockModel extends BlockModel {
  renderComponent() {
    return (
      <div>
        <h3>Hello FlowEngine!</h3>
        <p>これはカスタムブロックです。</p>
      </div>
    );
  }
}

// define() でメニュー内の表示名を設定
HelloBlockModel.define({
  label: tExpr('Hello block'),
});
```

`renderComponent()` はこのモデルのレンダリングメソッドで、React コンポーネントの `render()` に相当します。`tExpr()` は遅延翻訳に使用します。`define()` はモジュール読み込み時に実行されますが、この時点では i18n がまだ初期化されていないためです。詳しくは [Context 共通機能 → tExpr](../ctx/common-capabilities#texpr) をご覧ください。

### 2. Plugin で登録

```ts
// plugin.tsx
import { Plugin } from '@nocobase/client-v2';

export class MyPlugin extends Plugin {
  async load() {
    this.flowEngine.registerModelLoaders({
      HelloBlockModel: {
        // 遅延読み込み。初めて使用される時にモジュールをロード
        loader: () => import('./models/HelloBlockModel'),
      },
    });
  }
}
```

### 3. 画面上で使用

登録完了後、プラグインを起動して（プラグインの有効化は[プラグイン開発概要](../../index.md)を参照）、NocoBase の画面で新しいページを作成し、「ブロックの追加」をクリックすると「Hello block」が表示されます。

![20260403221815](https://static-docs.nocobase.com/20260403221815.png)

## registerFlow で設定項目を追加

レンダリングできるだけでは不十分です。FlowModel のコアバリューは**設定可能**であることです。`registerFlow()` でモデルに設定パネルを追加し、ユーザーが画面上でプロパティを変更できるようにします。

例えば HTML コンテンツの編集をサポートするブロック：

```tsx
// models/SimpleBlockModel.tsx
import React from 'react';
import { BlockModel } from '@nocobase/client-v2';
import { tExpr } from '@nocobase/flow-engine';

export class SimpleBlockModel extends BlockModel {
  renderComponent() {
    // this.props の値は Flow handler での設定から取得
    return <div dangerouslySetInnerHTML={{ __html: this.props.html }} />;
  }
}

SimpleBlockModel.define({
  label: tExpr('Simple block'),
});

SimpleBlockModel.registerFlow({
  key: 'flow1',
  title: tExpr('Simple Block Flow'),
  on: 'beforeRender', // レンダリング前に実行
  steps: {
    editHtml: {
      title: tExpr('Edit HTML Content'),
      // uiSchema で設定パネルの UI を定義
      uiSchema: {
        html: {
          type: 'string',
          title: tExpr('HTML Content'),
          'x-decorator': 'FormItem',
          'x-component': 'Input.TextArea',
        },
      },
      // デフォルト値
      defaultParams: {
        html: `<h3>This is a simple block</h3>
<p>You can edit the HTML content.</p>`,
      },
      // handler で設定パネルの値を model の props に設定
      handler(ctx, params) {
        ctx.model.props.html = params.html;
      },
    },
  },
});
```

ここでの重要なポイント：

- **`on: 'beforeRender'`** — この Flow がレンダリング前に実行されることを意味し、設定パネルの値がレンダリング前に `this.props` に書き込まれる
- **`uiSchema`** — JSON Schema 形式で設定パネルの UI を定義。構文は [UI Schema](../../../flow-engine/ui-schema) を参照
- **`handler(ctx, params)`** — `params` はユーザーが設定パネルで入力した値。`ctx.model.props` でモデルに設定する
- **`defaultParams`** — 設定パネルのデフォルト値

## uiSchema のよく使う書き方

`uiSchema` は JSON Schema ベースで、v2 の uiSchema 構文と互換性がありますが、使用シーンは限定的です。主に Flow の設定パネルでフォーム UI を記述するために使います。ほとんどのランタイムコンポーネントレンダリングは Antd コンポーネントを直接使って実装することを推奨し、uiSchema を経由する必要はありません。

ここでは最もよく使うコンポーネントを挙げます（完全なリファレンスは [UI Schema](../../../flow-engine/ui-schema) を参照）：

```ts
uiSchema: {
  // テキスト入力
  title: {
    type: 'string',
    title: 'タイトル',
    'x-decorator': 'FormItem',
    'x-component': 'Input',
  },
  // 複数行テキスト
  content: {
    type: 'string',
    title: 'コンテンツ',
    'x-decorator': 'FormItem',
    'x-component': 'Input.TextArea',
  },
  // ドロップダウン選択
  type: {
    type: 'string',
    title: 'タイプ',
    'x-decorator': 'FormItem',
    'x-component': 'Select',
    enum: [
      { label: 'プライマリ', value: 'primary' },
      { label: 'デフォルト', value: 'default' },
      { label: '破線', value: 'dashed' },
    ],
  },
  // スイッチ
  bordered: {
    type: 'boolean',
    title: 'ボーダーを表示',
    'x-decorator': 'FormItem',
    'x-component': 'Switch',
  },
}
```

各フィールドに `'x-decorator': 'FormItem'` を付けると、タイトルとレイアウトが自動的に適用されます。

## define() のパラメータ説明

`FlowModel.define()` はモデルのメタデータを設定し、メニュー内での表示方法を制御します。プラグイン開発で最もよく使うのは `label` ですが、他のパラメータもサポートしています：

| パラメータ | 型 | 説明 |
|------|------|------|
| `label` | `string \| ReactNode` | 「ブロックの追加 / フィールド / 操作」メニューでの表示名。`tExpr()` 遅延翻訳をサポート |
| `icon` | `ReactNode` | メニュー内のアイコン |
| `sort` | `number` | ソートウェイト。数値が小さいほど前に表示。デフォルト `0` |
| `hide` | `boolean \| (ctx) => boolean` | メニュー内で非表示にするかどうか。動的判断をサポート |
| `group` | `string` | グループ識別子。特定のメニューグループに分類するために使用 |
| `children` | `SubModelItem[] \| (ctx) => SubModelItem[]` | サブメニュー項目。非同期関数での動的構築をサポート |
| `toggleable` | `boolean \| (model) => boolean` | トグル動作をサポートするかどうか（同一親配下で一意） |
| `searchable` | `boolean` | サブメニューで検索を有効にするかどうか |

ほとんどのプラグインでは `label` の設定だけで十分です：

```ts
MyBlockModel.define({
  label: tExpr('My block'),
});
```

ソートや非表示の制御が必要な場合は `sort` と `hide` を追加できます：

```ts
MyBlockModel.define({
  label: tExpr('My block'),
  sort: 10,       // 後方に表示
  hide: (ctx) => !ctx.someCondition,  // 条件に応じて非表示
});
```

## FlowModel 基底クラスの選択

NocoBase は複数の FlowModel 基底クラスを提供しており、拡張するタイプに応じて選択します：

| 基底クラス               | 用途                               | 詳細ドキュメント       |
| ---------------------- | ---------------------------------- | -------------------- |
| `BlockModel`           | 通常のブロック                     | [ブロック拡張](./block)  |
| `DataBlockModel`       | 独自のデータ取得が必要なブロック   | [ブロック拡張](./block)  |
| `CollectionBlockModel` | データテーブルにバインド、自動データ取得 | [ブロック拡張](./block)  |
| `TableBlockModel`      | 完全なテーブルブロック、フィールド列・操作バーなど組み込み済み | [ブロック拡張](./block)  |
| `FieldModel`           | フィールドコンポーネント           | [フィールド拡張](./field)  |
| `ActionModel`          | 操作ボタン                         | [操作拡張](./action) |

通常、テーブルブロックには `TableBlockModel`（最もよく使われ、すぐに使える）、レンダリングの完全カスタマイズには `CollectionBlockModel` か `BlockModel`、フィールドには `FieldModel`、操作ボタンには `ActionModel` を使います。

## 関連リンク

- [ブロック拡張](./block) — BlockModel 系基底クラスでブロックを開発
- [フィールド拡張](./field) — FieldModel でカスタムフィールドを開発
- [操作拡張](./action) — ActionModel で操作ボタンを開発
- [Component vs FlowModel](../component-vs-flow-model) — どちらを使うか迷ったら
- [FlowDefinition フロー定義](../../../flow-engine/definitions/flow-definition.md) — registerFlow の完全なパラメータ説明とイベントタイプ一覧
- [FlowEngine 完全ドキュメント](../../../flow-engine/index.md) — FlowModel、Flow、Context の完全リファレンス
- [FlowEngine クイックスタート](../../../flow-engine/quickstart) — ゼロから編成可能なボタンコンポーネントを構築
- [プラグイン開発概要](../../index.md) — プラグイン開発の全体的な紹介
- [UI Schema](../../../flow-engine/ui-schema) — uiSchema の構文リファレンス
