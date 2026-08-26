---
title: "フロントエンドとバックエンドが連携するデータ管理プラグインを作る"
description: "NocoBase プラグイン実践：Server でデータテーブルを定義 + Client で TableBlockModel を使ってデータを表示 + カスタムフィールドと操作、完全なフロントエンド・バックエンド連携プラグイン。"
keywords: "フロントエンド・バックエンド連携,TableBlockModel,defineCollection,ActionModel,ClickableFieldModel,ctx.viewer,NocoBase"
---

# フロントエンドとバックエンドが連携するデータ管理プラグインを作る

これまでの例は純粋なクライアントサイド（ブロック、フィールド、操作）か、クライアント + シンプルなインターフェース（設定ページ）でした。この例ではより完全なシーンを示します。サーバーサイドでデータテーブルを定義し、クライアントで `TableBlockModel` を継承して完全なテーブル機能を取得し、さらにカスタムフィールドコンポーネントとカスタム操作ボタンを追加して、CRUD を備えたデータ管理プラグインを構成します。

この例は、これまでに学んだブロック、フィールド、操作をまとめて、完全なプラグインの開発フローを示します。

:::tip 前提知識

以下の内容を事前に理解しておくと、開発がスムーズになります：

- [はじめてのプラグインを書く](../../write-your-first-plugin) — プラグインの作成とディレクトリ構成
- [Plugin プラグイン](../plugin) — プラグインエントリと `load()` ライフサイクル
- [FlowEngine → ブロック拡張](../flow-engine/block) — BlockModel、CollectionBlockModel、TableBlockModel
- [FlowEngine → フィールド拡張](../flow-engine/field) — ClickableFieldModel、bindModelToInterface
- [FlowEngine → 操作拡張](../flow-engine/action) — ActionModel、ActionSceneEnum
- [i18n 国際化](../component/i18n) — 翻訳ファイルの書き方と `tExpr()` の使い方
- [サーバーサイド開発概要](../../server) — サーバープラグインの基礎

:::

## 最終的な効果

「ToDo」データ管理プラグインを作ります。以下の機能を含みます：

- サーバーサイドで `todoItems` データテーブルを定義し、プラグインインストール時にサンプルデータを自動投入
- クライアントで `TableBlockModel` を継承し、すぐに使えるテーブルブロック（フィールド列、ページネーション、操作バーなど）
- カスタムフィールドコンポーネント — カラー Tag で priority フィールドをレンダリング
- カスタム操作ボタン — 「新規 ToDo」ボタンをクリックするとダイアログでフォーム入力してレコードを作成

<video width="100%" height="450" controls>
  <source src="https://static-docs.nocobase.com/iShot_2026-04-08_16.32.52.mp4" type="video/mp4">
</video>

完全なソースコードは [@nocobase-example/plugin-custom-table-block-resource](https://github.com/nocobase/nocobase/tree/develop/packages/plugins/%40nocobase-example/plugin-custom-table-block-resource) を参照してください。ローカルで動作確認したい場合：

```bash
yarn pm enable @nocobase-example/plugin-custom-table-block-resource
```

以下、ゼロからこのプラグインを構築していきます。

## ステップ1：プラグインスケルトンの作成

リポジトリのルートで実行します：

```bash
yarn pm create @my-project/plugin-custom-table-block-resource
```

詳しくは[はじめてのプラグインを書く](../../write-your-first-plugin)をご覧ください。

## ステップ2：データテーブルの定義（サーバーサイド）

`src/server/collections/todoItems.ts` を新規作成します。NocoBase はこのディレクトリ配下の collection 定義を自動的に読み込みます：

```ts
// src/server/collections/todoItems.ts
import { defineCollection } from '@nocobase/database';

export default defineCollection({
  name: 'todoItems',
  title: 'Todo Items',
  fields: [
    { name: 'title', type: 'string', title: 'Title' },
    {
      name: 'completed',
      type: 'boolean',
      title: 'Completed',
      defaultValue: false,
    },
    {
      name: 'priority',
      type: 'string',
      title: 'Priority',
      defaultValue: 'medium',
    },
  ],
});
```

設定ページの例とは異なり、ここでは手動で resource を登録する必要はありません。NocoBase が各 collection に対して標準的な CRUD インターフェース（`list`、`get`、`create`、`update`、`destroy`）を自動生成します。

## ステップ3：権限設定とサンプルデータ（サーバーサイド）

`src/server/plugin.ts` を編集し、`load()` で ACL 権限を設定、`install()` でサンプルデータを投入します：

```ts
// src/server/plugin.ts
import { Plugin } from '@nocobase/server';

export class PluginDataBlockServer extends Plugin {
  async load() {
    // ログインユーザーが todoItems の CRUD を実行可能
    this.app.acl.allow('todoItems', ['list', 'get', 'create', 'update', 'destroy'], 'loggedIn');
  }

  async install() {
    // プラグインの初回インストール時にサンプルデータを投入
    const repo = this.db.getRepository('todoItems');
    const count = await repo.count();
    if (count === 0) {
      await repo.createMany({
        records: [
          { title: 'Learn NocoBase plugin development', completed: true, priority: 'high' },
          { title: 'Build a custom block', completed: false, priority: 'high' },
          { title: 'Write documentation', completed: false, priority: 'medium' },
          { title: 'Add unit tests', completed: false, priority: 'low' },
        ],
      });
    }
  }
}

export default PluginDataBlockServer;
```

重要なポイント：

- **`acl.allow()`** — `['list', 'get', 'create', 'update', 'destroy']` で完全な CRUD 権限を開放、`'loggedIn'` はログインユーザーがアクセス可能であることを意味
- **`install()`** — プラグインの初回インストール時にのみ実行され、初期データの投入に適している
- **`this.db.getRepository()`** — collection 名でデータ操作オブジェクトを取得
- `resourceManager.define()` は不要 — NocoBase が collection に対して CRUD インターフェースを自動生成

## ステップ4：ブロックモデルの作成（クライアント）

`src/client-v2/models/TodoBlockModel.tsx` を新規作成します。`TableBlockModel` を継承すると、完全なテーブルブロック機能がすぐに使えます。フィールド列、操作バー、ページネーション、ソートなどが含まれ、`renderComponent` を自分で書く必要はありません。

![20260408164204](https://static-docs.nocobase.com/20260408164204.png)

:::tip ヒント

実際のプラグイン開発では、`TableBlockModel` のカスタマイズが不要な場合、このブロックを継承・登録する必要はなく、ユーザーにブロック追加時に「テーブル」を選択してもらえば十分です。この記事ではブロックモデルの定義と登録のフローを示すために、`TodoBlockModel` で `TableBlockModel` を継承しています。`TableBlockModel` がその他すべて（フィールド列、操作バー、ページネーションなど）を処理します。

:::

```tsx
// src/client-v2/models/TodoBlockModel.tsx
import { TableBlockModel } from '@nocobase/client-v2';
import type { Collection } from '@nocobase/flow-engine';
import { tExpr } from '../locale';

export class TodoBlockModel extends TableBlockModel {
  // todoItems データテーブルでのみ使用可能に制限
  static filterCollection(collection: Collection) {
    return collection.name === 'todoItems';
  }
}

TodoBlockModel.define({
  label: tExpr('Todo block'),
});
```

`filterCollection` でこのブロックを `todoItems` データテーブルでのみ使用可能に制限しています。ユーザーが「Todo block」を追加する際、データテーブル選択リストには `todoItems` のみが表示され、関係のないテーブルは表示されません。

![20260408170026](https://static-docs.nocobase.com/20260408170026.png)

## ステップ5：カスタムフィールドコンポーネントの作成（クライアント）

`src/client-v2/models/PriorityFieldModel.tsx` を新規作成します。カラー Tag で priority フィールドをレンダリングし、プレーンテキストよりも直感的にします：

![20260408163645](https://static-docs.nocobase.com/20260408163645.png)

```tsx
// src/client-v2/models/PriorityFieldModel.tsx
import React from 'react';
import { ClickableFieldModel } from '@nocobase/client-v2';
import { DisplayItemModel } from '@nocobase/flow-engine';
import { Tag } from 'antd';
import { tExpr } from '../locale';

const priorityColors: Record<string, string> = {
  high: 'red',
  medium: 'orange',
  low: 'green',
};

export class PriorityFieldModel extends ClickableFieldModel {
  public renderComponent(value: string) {
    if (!value) return <span>-</span>;
    return <Tag color={priorityColors[value] || 'default'}>{value}</Tag>;
  }
}

PriorityFieldModel.define({
  label: tExpr('Priority tag'),
});

// input（単行テキスト）タイプのフィールドインターフェースにバインド
DisplayItemModel.bindModelToInterface('PriorityFieldModel', ['input']);
```

登録後、テーブルの priority 列の設定で、「フィールドコンポーネント」ドロップダウンから「Priority tag」に切り替えられます。

## ステップ6：カスタム操作ボタンの作成（クライアント）

`src/client-v2/models/NewTodoActionModel.tsx` を新規作成します。「新規 ToDo」ボタンをクリックすると、`ctx.viewer.dialog()` でダイアログを開き、フォーム入力後にレコードを作成します：

![20260408163810](https://static-docs.nocobase.com/20260408163810.png)

```tsx
// src/client-v2/models/NewTodoActionModel.tsx
import React from 'react';
import { ActionModel, ActionSceneEnum } from '@nocobase/client-v2';
import { MultiRecordResource, observable, observer } from '@nocobase/flow-engine';
import { Button, Form, Input, Select, Space, Switch } from 'antd';
import { ButtonProps } from 'antd';
import { tExpr } from '../locale';

// observable でローディング状態を管理。useState の代わり
const formState = observable({
  loading: false,
});

// ダイアログ内のフォームコンポーネント。observer でラップして observable の変化に応答
const NewTodoForm = observer(function NewTodoForm({
  onSubmit,
  onCancel,
}: {
  onSubmit: (values: any) => Promise<void>;
  onCancel: () => void;
}) {
  const [form] = Form.useForm();

  const handleSubmit = async () => {
    const values = await form.validateFields();
    formState.loading = true;
    try {
      await onSubmit(values);
    } finally {
      formState.loading = false;
    }
  };

  return (
    <Form form={form} layout="vertical" initialValues={{ priority: 'medium', completed: false }}>
      <Form.Item label="Title" name="title" rules={[{ required: true, message: 'Please enter title' }]}>
        <Input placeholder="Enter todo title" />
      </Form.Item>
      <Form.Item label="Priority" name="priority">
        <Select
          options={[
            { label: 'High', value: 'high' },
            { label: 'Medium', value: 'medium' },
            { label: 'Low', value: 'low' },
          ]}
        />
      </Form.Item>
      <Form.Item label="Completed" name="completed" valuePropName="checked">
        <Switch />
      </Form.Item>
      <Form.Item>
        <Space>
          <Button type="primary" onClick={handleSubmit} loading={formState.loading}>
            OK
          </Button>
          <Button onClick={onCancel}>Cancel</Button>
        </Space>
      </Form.Item>
    </Form>
  );
});

export class NewTodoActionModel extends ActionModel {
  static scene = ActionSceneEnum.collection;

  defaultProps: ButtonProps = {
    type: 'primary',
    children: tExpr('New todo'),
  };
}

NewTodoActionModel.define({
  label: tExpr('New todo'),
});

NewTodoActionModel.registerFlow({
  key: 'newTodoFlow',
  title: tExpr('New todo'),
  on: 'click', // ボタンクリックイベントをリッスン
  steps: {
    openForm: {
      async handler(ctx) {
        const resource = ctx.blockModel?.resource as MultiRecordResource;
        if (!resource) return;

        // ctx.viewer.dialog でダイアログを開く
        ctx.viewer.dialog({
          content: (view) => (
            <NewTodoForm
              onSubmit={async (values) => {
                await resource.create(values);
                ctx.message.success(ctx.t('Created successfully'));
                view.close();
              }}
              onCancel={() => view.close()}
            />
          ),
        });
      },
    },
  },
});
```

重要なポイント：

- **`ActionSceneEnum.collection`** — ボタンがブロック上部の操作バーに表示
- **`on: 'click'`** — `registerFlow` でボタンの `click` イベントをリッスン
- **`ctx.viewer.dialog()`** — NocoBase 組み込みのダイアログ機能。`content` は関数を受け取り、引数 `view` から `view.close()` でダイアログを閉じることが可能
- **`resource.create(values)`** — データテーブルの create インターフェースを呼び出してレコードを作成。作成後、テーブルが自動更新
- **`observable` + `observer`** — flow-engine が提供するリアクティブ状態管理で `useState` を置き換え。コンポーネントが `formState.loading` の変化に自動的に応答

## ステップ7：多言語ファイルの追加

プラグインの `src/locale/` 配下の翻訳ファイルを編集します：

```json
// src/locale/zh-CN.json
{
  "Todo block": "待办事项区块",
  "Priority tag": "优先级标签",
  "New todo": "新建待办",
  "Todo form": "待办表单",
  "Title": "标题",
  "Priority": "优先级",
  "Completed": "已完成",
  "Created successfully": "创建成功"
}
```

```json
// src/locale/en-US.json
{
  "Todo block": "Todo block",
  "Priority tag": "Priority tag",
  "New todo": "New todo",
  "Todo form": "Todo form",
  "Title": "Title",
  "Priority": "Priority",
  "Completed": "Completed",
  "Created successfully": "Created successfully"
}
```

:::warning 注意

初めて言語ファイルを追加した場合、アプリの再起動が必要です。

:::

翻訳ファイルの書き方と `tExpr()` のその他の使い方については、[i18n 国際化](../component/i18n)をご覧ください。

## ステップ8：プラグインへの登録（クライアント）

`src/client-v2/plugin.tsx` を編集します。2つのことが必要です：モデルの登録と、`todoItems` のクライアントデータソースへの登録。

:::warning 注意

プラグインコード内で `addCollection` を使ってデータテーブルを手動登録するのは**稀な方法**です。ここではフロントエンド・バックエンド連携の完全なフローをデモするためだけに行っています。実際のプロジェクトでは、データテーブルは通常 NocoBase の画面上で作成・設定するか、API / MCP などで管理するため、プラグインのクライアントコードで明示的に登録する必要はありません。

:::

`defineCollection` で定義したテーブルはサーバー内部テーブルで、デフォルトではブロックのデータテーブル選択リストに表示されません。`addCollection` で手動登録すると、ユーザーがブロック追加時に `todoItems` を選択できるようになります。

![20260408164023](https://static-docs.nocobase.com/20260408164023.png)

```ts
// src/client-v2/plugin.tsx
import { Plugin } from '@nocobase/client-v2';

const todoItemsCollection = {
  name: 'todoItems',
  title: 'Todo Items',
  // filterTargetKey は必須。設定しないと collection がブロックのデータテーブル選択リストに表示されない
  filterTargetKey: 'id',
  fields: [
    {
      type: 'bigInt',
      name: 'id',
      primaryKey: true,
      autoIncrement: true,
      interface: 'id',
    },
    {
      type: 'string',
      name: 'title',
      interface: 'input',
      uiSchema: { type: 'string', title: 'Title', 'x-component': 'Input' },
    },
    {
      type: 'boolean',
      name: 'completed',
      interface: 'checkbox',
      uiSchema: { type: 'boolean', title: 'Completed', 'x-component': 'Checkbox' },
    },
    {
      type: 'string',
      name: 'priority',
      interface: 'input',
      uiSchema: { type: 'string', title: 'Priority', 'x-component': 'Input' },
    },
  ],
};

export class PluginCustomTableBlockResourceClientV2 extends Plugin {
  async load() {
    // ブロック、フィールド、操作モデルの登録
    this.flowEngine.registerModelLoaders({
      TodoBlockModel: {
        loader: () => import('./models/TodoBlockModel'),
      },
      PriorityFieldModel: {
        loader: () => import('./models/PriorityFieldModel'),
      },
      NewTodoActionModel: {
        loader: () => import('./models/NewTodoActionModel'),
      },
    });

    // todoItems をクライアントサイドのデータソースに登録。
    // ensureLoaded() が load() の後に実行され、setCollections() で
    // すべての collection をクリアして再設定するため、'dataSource:loaded' イベントを
    // リッスンする必要がある。イベントコールバック内で再登録することで
    // addCollection がリロード後も維持される。
    const addTodoCollection = () => {
      const mainDS = this.flowEngine.dataSourceManager.getDataSource('main');
      if (mainDS && !mainDS.getCollection('todoItems')) {
        mainDS.addCollection(todoItemsCollection);
      }
    };

    this.app.eventBus.addEventListener('dataSource:loaded', (event: Event) => {
      if ((event as CustomEvent).detail?.dataSourceKey === 'main') {
        addTodoCollection();
      }
    });
  }
}

export default PluginCustomTableBlockResourceClientV2;
```

重要なポイント：

- **`registerModelLoaders`** — 遅延読み込みで3つのモデル（ブロック、フィールド、操作）を登録
- **`this.app.eventBus`** — アプリケーションレベルのイベントバス、ライフサイクルイベントの監視に使用
- **`dataSource:loaded` イベント** — データソースの読み込み完了後にトリガー。このイベントのコールバック内で `addCollection` を呼び出す必要がある。`ensureLoaded()` が `load()` の後に実行され、すべての collection をクリアして再設定するため、`load()` 内で直接 `addCollection` を呼ぶと上書きされてしまう
- **`addCollection()`** — collection をクライアントデータソースに登録。フィールドには `interface` と `uiSchema` プロパティが必要で、NocoBase がレンダリング方法を判断できるようにする
- **`filterTargetKey: 'id'`** — 必須設定。レコードの一意識別に使うフィールド（通常は主キー）を指定。設定しないと collection がブロックのデータテーブル選択リストに表示されない
- サーバーの `defineCollection` は物理テーブルと ORM マッピングの作成を担当し、クライアントの `addCollection` は UI にテーブルの存在を知らせる。両方が連携して初めてフロントエンド・バックエンド連携が完成する

## ステップ9：プラグインの有効化

```bash
yarn pm enable @my-project/plugin-custom-table-block-resource
```

有効化後：

1. 新しいページを作成し、「ブロックの追加」をクリックして「Todo block」を選択、`todoItems` データテーブルにバインド
2. テーブルが自動的にデータを読み込み、フィールド列、ページネーションなどを表示
3. 「操作の設定」で「New todo」ボタンを追加し、クリックするとダイアログでフォーム入力してレコードを作成
4. priority 列の「フィールドコンポーネント」で「Priority tag」に切り替えると、priority がカラー Tag で表示

<!-- 有効化後の完全な機能のスクリーンショットが必要 -->

## 完全なソースコード

- [@nocobase-example/plugin-custom-table-block-resource](https://github.com/nocobase/nocobase/tree/develop/packages/plugins/%40nocobase-example/plugin-custom-table-block-resource) — フロントエンド・バックエンド連携データ管理プラグインの完全な例

## まとめ

この例で使用した機能：

| 機能             | 使い方                                            | ドキュメント                                              |
| ---------------- | ----------------------------------------------- | ------------------------------------------------------- |
| データテーブル定義 | `defineCollection()`                            | [サーバーサイド → Collections データテーブル](../../server/collections) |
| 権限制御         | `acl.allow()`                                   | [サーバーサイド → ACL アクセス制御](../../server/acl)     |
| 初期データ       | `install()` + `repo.createMany()`               | [サーバーサイド → Plugin プラグイン](../../server/plugin) |
| テーブルブロック | `TableBlockModel`                               | [FlowEngine → ブロック拡張](../flow-engine/block)         |
| クライアントデータテーブル登録 | `addCollection()` + `eventBus` + `filterTargetKey` | [Plugin プラグイン](../plugin)                          |
| カスタムフィールド | `ClickableFieldModel` + `bindModelToInterface`  | [FlowEngine → フィールド拡張](../flow-engine/field)       |
| カスタム操作     | `ActionModel` + `registerFlow({ on: 'click' })` | [FlowEngine → 操作拡張](../flow-engine/action)            |
| ダイアログ       | `ctx.viewer.dialog()`                           | [Context → 共通機能](../ctx/common-capabilities)          |
| リアクティブ状態 | `observable` + `observer`                       | [Component コンポーネント開発](../component/index.md)     |
| モデル登録       | `this.flowEngine.registerModelLoaders()`        | [Plugin プラグイン](../plugin)                             |
| 遅延翻訳         | `tExpr()`                                       | [i18n 国際化](../component/i18n)                          |

## 関連リンク

- [はじめてのプラグインを書く](../../write-your-first-plugin) — ゼロからプラグインスケルトンを作成
- [FlowEngine 概要](../flow-engine/index.md) — FlowModel の基本的な使い方と registerFlow
- [FlowEngine → ブロック拡張](../flow-engine/block) — BlockModel、TableBlockModel
- [FlowEngine → フィールド拡張](../flow-engine/field) — ClickableFieldModel、bindModelToInterface
- [FlowEngine → 操作拡張](../flow-engine/action) — ActionModel、ActionSceneEnum
- [カスタム表示ブロックを作る](./custom-block) — BlockModel の基本例
- [カスタムフィールドコンポーネントを作る](./custom-field) — FieldModel の基本例
- [カスタム操作ボタンを作る](./custom-action) — ActionModel の基本例
- [サーバーサイド開発概要](../../server) — サーバープラグインの基礎
- [サーバーサイド → Collections データテーブル](../../server/collections) — defineCollection と addCollection
- [Resource API チートシート](../../../api/flow-engine/resource.md) — MultiRecordResource / SingleRecordResource の完全なメソッドシグネチャ
- [Plugin プラグイン](../plugin) — プラグインエントリと load() ライフサイクル
- [i18n 国際化](../component/i18n) — 翻訳ファイルの書き方と tExpr の使い方
- [サーバーサイド → ACL アクセス制御](../../server/acl) — 権限設定
- [サーバーサイド → Plugin プラグイン](../../server/plugin) — サーバーサイドプラグインのライフサイクル
- [Context → 共通機能](../ctx/common-capabilities) — ctx.viewer、ctx.message など
- [Component コンポーネント開発](../component/index.md) — Antd Form などのコンポーネントの使い方
- [FlowEngine 完全ドキュメント](../../../flow-engine/index.md) — FlowModel、Flow、Context の完全リファレンス
