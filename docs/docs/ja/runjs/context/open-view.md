:::tip{title="AI翻訳通知"}
このドキュメントはAIによって翻訳されました。正確な情報については[英語版](/runjs/context/open-view)をご参照ください。
:::

# ctx.openView()

プログラムによって指定されたビュー（ドロワー、ポップアップ、埋め込みページなど）を開きます。`FlowModelContext` から提供され、`JSBlock`、テーブルセル、イベントフローなどのシナリオで、設定済みの `ChildPage` または `PopupAction` ビューを開くために使用されます。

## 適用シナリオ

| シナリオ | 説明 |
|------|------|
| **JSBlock** | ボタンクリック後に詳細/編集ポップアップを開き、現在の行の `filterByTk` を渡します。 |
| **テーブルセル** | セル内にボタンをレンダリングし、クリック時に行の詳細ポップアップを開きます。 |
| **イベントフロー / JSAction** | 操作成功後に次のビューまたはポップアップを開きます。 |
| **関連フィールド** | `ctx.runAction('openView', params)` を介して選択/編集ポップアップを開きます。 |

> 注意：`ctx.openView` は `FlowModel` コンテキストが存在する RunJS 環境で利用可能です。`uid` に対応するモデルが存在しない場合、`PopupActionModel` が自動的に作成され、永続化されます。

## シグネチャ

```ts
openView(uid: string, options?: OpenViewOptions): Promise<void>
```

## パラメータ説明

### uid

ビューモデルの一意識別子。存在しない場合は自動的に作成・保存されます。同じポップアップを複数回開く際に設定を再利用できるよう、`${ctx.model.uid}-detail` のような安定した UID を使用することをお勧めします。

### options の主なフィールド

| フィールド | 型 | 説明 |
|------|------|------|
| `mode` | `drawer` / `dialog` / `embed` | 開き方：ドロワー（drawer）、ポップアップ（dialog）、埋め込み（embed）。デフォルトは `drawer` |
| `size` | `small` / `medium` / `large` | ポップアップ/ドロワーのサイズ。デフォルトは `medium` |
| `title` | `string` | ビューのタイトル |
| `params` | `Record<string, any>` | ビューに渡される任意のパラメータ |
| `filterByTk` | `any` | 主キー値。単一レコードの詳細/編集シナリオで使用されます |
| `sourceId` | `string` | ソースレコード ID。関連シナリオで使用されます |
| `dataSourceKey` | `string` | データソース |
| `collectionName` | `string` | コレクション名 |
| `associationName` | `string` | 関連フィールド名 |
| `navigation` | `boolean` | ルートナビゲーションを使用するかどうか。`defineProperties` または `defineMethods` が渡された場合、強制的に `false` に設定されます |
| `preventClose` | `boolean` | 閉じるのを阻止するかどうか |
| `defineProperties` | `Record<string, PropertyOptions>` | ビュー内のモデルにプロパティを動的に注入します |
| `defineMethods` | `Record<string, Function>` | ビュー内のモデルにメソッドを動的に注入します |

## 例文

### 基本的な使い方：ドロワーを開く

```ts
const popupUid = `${ctx.model.uid}-detail`;
await ctx.openView(popupUid, {
  mode: 'drawer',
  size: 'medium',
  title: ctx.t('詳細'),
});
```

### 現在の行のコンテキストを渡す

```ts
const primaryKey = ctx.collection?.primaryKey || 'id';
await ctx.openView(`${ctx.model.uid}-1`, {
  mode: 'dialog',
  title: ctx.t('行の詳細'),
  params: {
    filterByTk: ctx.record?.[primaryKey],
    record: ctx.record,
  },
});
```

### runAction を介して開く

モデルに `openView` アクション（関連フィールドやクリック可能なフィールドなど）が設定されている場合、以下のように呼び出すことができます：

```ts
await ctx.runAction('openView', {
  navigation: false,
  mode: 'dialog',
  collectionName: 'users',
  filterByTk: ctx.record?.id,
});
```

### カスタムコンテキストの注入

```ts
await ctx.openView(`${ctx.model.uid}-edit`, {
  mode: 'drawer',
  filterByTk: ctx.record?.id,
  defineProperties: {
    onSaved: {
      get: () => () => ctx.resource?.refresh?.(),
      cache: false,
    },
  },
});
```

## ctx.viewer、ctx.view との関係

| 用途 | 推奨される使い方 |
|------|----------|
| **設定済みのフロービューを開く** | `ctx.openView(uid, options)` |
| **カスタムコンテンツを開く（フローなし）** | `ctx.viewer.dialog()` / `ctx.viewer.drawer()` |
| **現在開いているビューを操作する** | `ctx.view.close()`、`ctx.view.inputArgs` |

`ctx.openView` は `FlowPage` (`ChildPageModel`) を開き、内部で完全なフローページをレンダリングします。一方、`ctx.viewer` は任意の React コンテンツを開きます。

## 注意事項

- `uid` は複数のブロック間での衝突を避けるため、`ctx.model.uid` と関連付ける（例：`${ctx.model.uid}-xxx`）ことをお勧めします。
- `defineProperties` または `defineMethods` を渡すと、リフレッシュ後のコンテキスト消失を防ぐため、`navigation` は強制的に `false` に設定されます。
- ポップアップ内の `ctx.view` は現在のビューインスタンスを指し、`ctx.view.inputArgs` で開始時に渡されたパラメータを読み取ることができます。

## 関連情報

- [ctx.view](./view.md)：現在開いているビューインスタンス
- [ctx.model](./model.md)：現在のモデル。安定した `popupUid` を構築するために使用されます。