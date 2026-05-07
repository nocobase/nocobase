---
title: "Resource API"
description: "NocoBase FlowEngine Resource API リファレンス：MultiRecordResource と SingleRecordResource の完全なメソッドシグネチャ、パラメータ形式、filter 構文。"
keywords: "Resource,MultiRecordResource,SingleRecordResource,FlowResource,CRUD,filter,NocoBase"
---

# Resource API

NocoBase FlowEngine は、フロントエンドのデータ操作を処理するために 2 つの Resource クラスを提供しています。`MultiRecordResource` はリスト/テーブル（複数レコード）用、`SingleRecordResource` はフォーム/詳細（単一レコード）用です。これらは REST API 呼び出しをカプセル化し、リアクティブなデータ管理を提供します。

継承チェーン：`FlowResource` → `APIResource` → `BaseRecordResource` → `MultiRecordResource` / `SingleRecordResource`

## MultiRecordResource

リスト、テーブル、カンバンなどの複数レコードのシナリオに使用します。`@nocobase/flow-engine` からインポートします。

### データ操作

| メソッド | パラメータ | 説明 |
|------|------|------|
| `getData()` | - | `TDataItem[]` を返します。初期値は `[]` です |
| `hasData()` | - | データ配列が空でないかどうか |
| `create(data, options?)` | `data: object`, `options?: { refresh?: boolean }` | レコードを作成します。デフォルトでは作成後に自動的に refresh されます |
| `get(filterByTk)` | `filterByTk: string \| number` | 主キーで単一レコードを取得します |
| `update(filterByTk, data, options?)` | `filterByTk: string \| number`, `data: object` | レコードを更新します。完了後に自動的に refresh されます |
| `destroy(filterByTk, options?)` | `filterByTk: string \| number \| Array` | レコードを削除します。一括削除にも対応 |
| `destroySelectedRows()` | - | 選択されたすべての行を削除します |
| `refresh()` | - | データを更新します（`list` action を呼び出します）。同じイベントループ内での複数回の呼び出しはマージされます |

### ページネーション

| メソッド | 説明 |
|------|------|
| `getPage()` | 現在のページ番号を取得します |
| `setPage(page)` | ページ番号を設定します |
| `getPageSize()` | 1 ページあたりの件数を取得します（デフォルト 20） |
| `setPageSize(pageSize)` | 1 ページあたりの件数を設定します |
| `getCount()` | 総レコード数を取得します |
| `getTotalPage()` | 総ページ数を取得します |
| `next()` | 次のページに移動して更新します |
| `previous()` | 前のページに移動して更新します |
| `goto(page)` | 指定ページにジャンプして更新します |

### 選択行

| メソッド | 説明 |
|------|------|
| `setSelectedRows(rows)` | 選択行を設定します |
| `getSelectedRows()` | 選択行を取得します |

### 例：CollectionBlockModel での使用

`CollectionBlockModel` を継承する場合、`createResource()` で resource を作成し、`renderComponent()` でデータを読み取ります：

```tsx
import React from 'react';
import { BlockSceneEnum, CollectionBlockModel } from '@nocobase/client-v2';
import { MultiRecordResource } from '@nocobase/flow-engine';
import { tExpr } from '../locale';

export class ManyRecordBlockModel extends CollectionBlockModel {
  static scene = BlockSceneEnum.many;

  // MultiRecordResource を使用してデータを管理することを宣言
  createResource() {
    return this.context.makeResource(MultiRecordResource);
  }

  get resource() {
    return this.context.resource as MultiRecordResource;
  }

  renderComponent() {
    const data = this.resource.getData();   // TDataItem[]
    const count = this.resource.getCount(); // 総レコード数

    return (
      <div>
        <h3>合計 {count} 件のレコード（第 {this.resource.getPage()} ページ）</h3>
        <pre>{JSON.stringify(data, null, 2)}</pre>
      </div>
    );
  }
}

ManyRecordBlockModel.define({
  label: tExpr('Many records block'),
});
```

完全な例は [FlowEngine → ブロック拡張](../../plugin-development/client/flow-engine/block.md) を参照してください。

### 例：操作ボタンでの CRUD 呼び出し

`ActionModel` の `registerFlow` handler 内で、`ctx.blockModel?.resource` を通じて現在のブロックの resource を取得し、CRUD メソッドを呼び出します：

```tsx
import { ActionModel, ActionSceneEnum } from '@nocobase/client-v2';
import { MultiRecordResource } from '@nocobase/flow-engine';
import { tExpr } from '../locale';

export class NewTodoActionModel extends ActionModel {
  static scene = ActionSceneEnum.collection;

  defaultProps = {
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
  on: 'click',
  steps: {
    openForm: {
      async handler(ctx) {
        // 現在のブロックの resource を取得
        const resource = ctx.blockModel?.resource as MultiRecordResource;
        if (!resource) return;

        ctx.viewer.dialog({
          title: ctx.t('New todo'),
          content: (view) => (
            <MyForm
              onSubmit={async (values) => {
                // レコードを作成、作成後 resource は自動的に refresh されます
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

完全な例は [フロントエンドとバックエンドが連動するデータ管理プラグインを作成する](../../plugin-development/client/examples/fullstack-plugin.md) を参照してください。

### 例：CRUD 操作クイックリファレンス

```ts
async handler(ctx) {
  const resource = ctx.blockModel?.resource as MultiRecordResource;

  // --- 作成 ---
  await resource.create({ title: 'New item', completed: false });
  // 自動更新しない
  await resource.create({ title: 'Draft' }, { refresh: false });

  // --- 読み取り ---
  const items = resource.getData();     // TDataItem[]
  const count = resource.getCount();    // 総レコード数
  const item = await resource.get(1);   // 主キーで単一レコードを取得

  // --- 更新 ---
  await resource.update(1, { title: 'Updated' });

  // --- 削除 ---
  await resource.destroy(1);            // 単一削除
  await resource.destroy([1, 2, 3]);    // 一括削除

  // --- ページネーション ---
  resource.setPage(2);
  resource.setPageSize(50);
  await resource.refresh();
  // またはショートカットメソッドを使用
  await resource.goto(3);
  await resource.next();
  await resource.previous();

  // --- 更新 ---
  await resource.refresh();
}
```

## SingleRecordResource

フォーム、詳細ページなどの単一レコードのシナリオに使用します。`@nocobase/flow-engine` からインポートします。

### データ操作

| メソッド | パラメータ | 説明 |
|------|------|------|
| `getData()` | - | `TData`（単一オブジェクト）を返します。初期値は `null` です |
| `save(data, options?)` | `data: object`, `options?: { refresh?: boolean }` | スマート保存 -- `isNewRecord` が true の場合は create を呼び出し、それ以外は update を呼び出します |
| `destroy(options?)` | - | 現在のレコードを削除します（設定済みの filterByTk を使用） |
| `refresh()` | - | データを更新します（`get` action を呼び出します）。`isNewRecord` が true の場合はスキップされます |

### 主要プロパティ

| プロパティ | 説明 |
|------|------|
| `isNewRecord` | 新規レコードかどうかを示します。`setFilterByTk()` は自動的にこれを `false` に設定します |

### 例：フォーム詳細シナリオ

```tsx
import React from 'react';
import { BlockSceneEnum, CollectionBlockModel } from '@nocobase/client-v2';
import { SingleRecordResource } from '@nocobase/flow-engine';
import { tExpr } from '../locale';

export class DetailBlockModel extends CollectionBlockModel {
  static scene = BlockSceneEnum.one;

  createResource() {
    return this.context.makeResource(SingleRecordResource);
  }

  get resource() {
    return this.context.resource as SingleRecordResource;
  }

  renderComponent() {
    const data = this.resource.getData(); // 単一オブジェクトまたは null
    if (!data) return <div>読み込み中...</div>;

    return (
      <div>
        <h3>{data.title}</h3>
        <p>{data.content}</p>
      </div>
    );
  }
}

DetailBlockModel.define({
  label: tExpr('Detail block'),
});
```

### 例：レコードの新規作成と編集

```ts
async handler(ctx) {
  const resource = ctx.model.context.resource as SingleRecordResource;

  // --- 新規レコード ---
  resource.isNewRecord = true;
  await resource.save({ name: 'John', age: 30 });
  // save 内部で create action を呼び出し、完了後に自動的に refresh されます

  // --- 既存レコードの編集 ---
  resource.setFilterByTk(1);  // 自動的に isNewRecord = false に設定
  await resource.refresh();   // まず現在のデータを読み込む
  const data = resource.getData();
  await resource.save({ ...data, name: 'Jane' });
  // save 内部で update action を呼び出します

  // --- 現在のレコードの削除 ---
  await resource.destroy();   // 設定済みの filterByTk を使用
}
```

## 共通メソッド

以下のメソッドは `MultiRecordResource` と `SingleRecordResource` の両方で使用できます：

### フィルタリング

| メソッド | 説明 |
|------|------|
| `setFilter(filter)` | filter オブジェクトを直接設定します |
| `addFilterGroup(key, filter)` | 名前付きフィルターグループを追加します（推奨、組み合わせ・削除が可能） |
| `removeFilterGroup(key)` | 名前付きフィルターグループを削除します |
| `getFilter()` | 集約された filter を取得します。複数のグループは自動的に `$and` で結合されます |

### フィールド制御

| メソッド | 説明 |
|------|------|
| `setFields(fields)` | 返却フィールドを設定します |
| `setAppends(appends)` | リレーションフィールドの appends を設定します |
| `addAppends(appends)` | appends を追加します（重複排除） |
| `setSort(sort)` | ソートを設定します。例：`['-createdAt', 'name']` |
| `setFilterByTk(value)` | 主キーによるフィルタリングを設定します |

### リソース設定

| メソッド | 説明 |
|------|------|
| `setResourceName(name)` | リソース名を設定します。例：`'users'` またはリレーションリソース `'users.tags'` |
| `setSourceId(id)` | リレーションリソースの親レコード ID を設定します |
| `setDataSourceKey(key)` | データソースを設定します（`X-Data-Source` リクエストヘッダーを追加） |

### メタデータとステータス

| メソッド | 説明 |
|------|------|
| `getMeta(key?)` | メタデータを取得します。key を指定しない場合はメタオブジェクト全体を返します |
| `loading` | 読み込み中かどうか（getter） |
| `getError()` | エラー情報を取得します |
| `clearError()` | エラーをクリアします |

### イベント

| イベント | トリガータイミング |
|------|----------|
| `'refresh'` | `refresh()` がデータの取得に成功した後 |
| `'saved'` | `create` / `update` / `save` 操作が成功した後 |

```ts
resource.on('saved', (data) => {
  console.log('レコードが保存されました:', data);
});
```

## Filter 構文

NocoBase は JSON スタイルのフィルタリング構文を使用し、演算子は `$` で始まります：

```ts
// 等しい
{ status: { $eq: 'active' } }

// 等しくない
{ status: { $ne: 'deleted' } }

// より大きい
{ age: { $gt: 18 } }

// 含む（あいまいマッチ）
{ name: { $includes: 'test' } }

// 条件の組み合わせ
{
  $and: [
    { status: { $eq: 'active' } },
    { age: { $gt: 18 } },
  ]
}

// OR 条件
{
  $or: [
    { status: { $eq: 'active' } },
    { role: { $eq: 'admin' } },
  ]
}
```

Resource では `addFilterGroup` を使用してフィルター条件を管理することをお勧めします：

```ts
// 複数のフィルターグループを追加
resource.addFilterGroup('status', { status: { $eq: 'active' } });
resource.addFilterGroup('age', { age: { $gt: 18 } });
// getFilter() は自動的に集約されます: { $and: [...] }

// 特定のフィルターグループを削除
resource.removeFilterGroup('status');

// フィルターを適用して更新
await resource.refresh();
```

## MultiRecordResource と SingleRecordResource の比較

| 特徴 | MultiRecordResource | SingleRecordResource |
|------|-------|-------|
| getData() の戻り値 | `TDataItem[]`（配列） | `TData`（単一オブジェクト） |
| デフォルトの refresh action | `list` | `get` |
| ページネーション | 対応 | 非対応 |
| 選択行 | 対応 | 非対応 |
| 作成 | `create(data)` | `save(data)` + `isNewRecord=true` |
| 更新 | `update(filterByTk, data)` | `save(data)` + `setFilterByTk(id)` |
| 削除 | `destroy(filterByTk)` | `destroy()` |
| 典型的なシナリオ | リスト、テーブル、カンバン | フォーム、詳細ページ |

## 関連リンク

- [フロントエンドとバックエンドが連動するデータ管理プラグインを作成する](../../plugin-development/client/examples/fullstack-plugin.md) -- 完全な例：カスタム操作ボタンでの `resource.create()` の実際の使用法
- [FlowEngine → ブロック拡張](../../plugin-development/client/flow-engine/block.md) -- CollectionBlockModel での `createResource()` と `resource.getData()` の使用法
- [ResourceManager リソース管理（サーバーサイド）](../../plugin-development/server/resource-manager.md) -- サーバーサイドの REST API リソース定義。クライアントの Resource が呼び出すのはこれらのインターフェースです
- [FlowContext API](./flow-context.md) -- `ctx.makeResource()`、`ctx.initResource()` などのメソッドの説明
