---
title: "AddSubModelButton"
description: "AddSubModelButton：指定された FlowModel にサブモデルを追加します。非同期メニュー、グループ、サブメニュー、継承クラスフィルタリング、トグル形態に対応。"
keywords: "AddSubModelButton,subModel,サブモデル,FlowModel,FlowEngine,非同期メニュー,グループメニュー"
---

# AddSubModelButton

指定された `FlowModel` にサブモデル（subModel）を追加するために使用します。非同期ロード、グループ、サブメニュー、カスタムモデル継承ルールなど、さまざまな設定方法に対応しています。

## Props

```ts pure
interface AddSubModelButtonProps {
  model: FlowModel;
  subModelKey: string;
  subModelType?: 'object' | 'array';
  items?: SubModelItemsType;
  subModelBaseClass?: string | ModelConstructor;
  subModelBaseClasses?: Array<string | ModelConstructor>;
  afterSubModelInit?: (subModel: FlowModel) => Promise<void>;
  afterSubModelAdd?: (subModel: FlowModel) => Promise<void>;
  afterSubModelRemove?: (subModel: FlowModel) => Promise<void>;
  children?: React.ReactNode;
  keepDropdownOpen?: boolean;
}
```

| パラメータ | 型 | 説明 |
| --- | --- | --- |
| `model` | `FlowModel` | **必須**。サブモデルを追加する対象モデルです。 |
| `subModelKey` | `string` | **必須**。`model.subModels` 内のサブモデルのキー名です。 |
| `subModelType` | `'object' \| 'array'` | サブモデルのデータ構造タイプです。デフォルトは `'array'` です。 |
| `items` | `SubModelItem[]` \| `(ctx) => SubModelItem[] \| Promise<...>` | メニュー項目の定義です。静的または非同期生成に対応しています。 |
| `subModelBaseClass` | `string` \| `ModelConstructor` | 基底クラスを指定し、そのクラスを継承するすべてのモデルをメニュー項目として一覧表示します。 |
| `subModelBaseClasses` | `(string \| ModelConstructor)[]` | 複数の基底クラスを指定し、グループ別に継承モデルを自動一覧表示します。 |
| `afterSubModelInit` | `(subModel) => Promise<void>` | サブモデル初期化後のコールバックです。 |
| `afterSubModelAdd` | `(subModel) => Promise<void>` | サブモデル追加後のコールバックです。 |
| `afterSubModelRemove` | `(subModel) => Promise<void>` | サブモデル削除後のコールバックです。 |
| `children` | `React.ReactNode` | ボタンの内容です。テキストやアイコンにカスタマイズできます。 |
| `keepDropdownOpen` | `boolean` | 追加後もドロップダウンメニューを開いたままにするかどうか。デフォルトでは自動的に閉じます。 |

## SubModelItem 型定義

```ts pure
interface SubModelItem {
  key?: string;
  label?: string;
  type?: 'group' | 'divider';
  disabled?: boolean;
  hide?: boolean | ((ctx: FlowModelContext) => boolean | Promise<boolean>);
  icon?: React.ReactNode;
  children?: SubModelItemsType;
  useModel?: string;
  createModelOptions?: {
    props?: Record<string, any>;
    stepParams?: Record<string, any>;
  };
  toggleable?: boolean | ((model: FlowModel) => boolean);
}
```

| フィールド | 型 | 説明 |
| --- | --- | --- |
| `key` | `string` | 一意識別子です。 |
| `label` | `string` | 表示テキストです。 |
| `type` | `'group' \| 'divider'` | グループまたは区切り線です。省略時は通常の項目またはサブメニューになります。 |
| `disabled` | `boolean` | 現在の項目を無効にするかどうかです。 |
| `hide` | `boolean` \| `(ctx) => boolean \| Promise<boolean>` | 動的な非表示（`true` を返すと非表示になります）。 |
| `icon` | `React.ReactNode` | アイコンの内容です。 |
| `children` | `SubModelItemsType` | サブメニュー項目です。ネストされたグループやサブメニューに使用します。 |
| `useModel` | `string` | 使用する Model のタイプ（登録名）を指定します。 |
| `createModelOptions` | `object` | モデル初期化時のパラメータです。 |
| `toggleable` | `boolean` \| `(model: FlowModel) => boolean` | トグル形態です。追加済みなら削除、未追加なら追加します（1 つのみ許可）。 |

## 例

### `<AddSubModelButton />` を使用した subModels の追加

```tsx file="./_demos/add-sub-model/add-sub-model-basic.tsx" preview
```

- `<AddSubModelButton />` を使用して subModels を追加します。ボタンは FlowModel 内に配置する必要があります。
- `model.mapSubModels()` を使用して subModels をイテレートします。`mapSubModels` メソッドは欠落やソートの問題を解決します。
- `<FlowModelRenderer />` を使用して subModels をレンダリングします。

### 異なる形態の AddSubModelButton

```tsx file="./_demos/add-sub-model/add-sub-model-icon.tsx" preview
```

- ボタンコンポーネント `<Button>Add block</Button>` として使用でき、自由に配置できます。
- アイコン `<PlusOutlined />` としても使用できます。
- 右上の Flow Settings の位置に配置することもできます。

### トグル形態のサポート

```tsx file="./_demos/add-sub-model/add-sub-model-toggleable.tsx" preview
```

- シンプルなケースでは `toggleable: true` を設定するだけで十分です。デフォルトではクラス名に基づいて検索し、同じクラスのインスタンスは 1 つだけ許可されます。
- カスタム検索ルール：`toggleable: (model: FlowModel) => boolean`。

### 非同期 items

```tsx file="./_demos/add-sub-model/add-sub-model-async-items.tsx" preview
```

コンテキストから動的な items を取得できます。例えば：

- リモートの `ctx.api.request()` を使用できます。
- `ctx.dataSourceManager` が提供する API から必要なデータを取得することもできます。
- カスタムのコンテキストプロパティやメソッドも使用できます。
- `items` と `children` の両方が async 呼び出しに対応しています。

### メニュー項目の動的非表示（hide）

```tsx file="./_demos/add-sub-model/add-sub-model-hide.tsx" preview
```

- `hide` は `boolean` または関数（async 対応）をサポートします。`true` を返すと非表示になります。
- group と children に対して再帰的に適用されます。

### グループ、サブメニュー、区切り線の使用

```tsx file="./_demos/add-sub-model/add-sub-model-basic-children.tsx" preview
```

- `type: divider` の場合は区切り線になります。
- `type: group` で `children` がある場合はメニューグループになります。
- `children` があるが `type` がない場合はサブメニューになります。

### 継承クラスによる items の自動生成

```tsx file="./_demos/add-sub-model/add-sub-model-base-class.tsx" preview
```

- `subModelBaseClass` を継承するすべての FlowModel が一覧表示されます。
- `Model.define()` で関連するメタデータを定義できます。
- `hide: true` とマークされたものは自動的に非表示になります。

### 継承クラスによるグループ化

```tsx file="./_demos/add-sub-model/add-sub-model-base-class-group.tsx" preview
```

- `subModelBaseClasses` を継承するすべての FlowModel が一覧表示されます。
- `subModelBaseClasses` に基づいて自動的にグループ化され、重複が排除されます。

### 継承クラス + `menuType=submenu` による 2 階層メニュー

```tsx file="./_demos/add-sub-model/add-sub-model-submenu-base-class.tsx" preview
```

- 基底クラスに `Model.define({ menuType: 'submenu' })` で表示形態を指定します。
- 1 階層の項目として表示され、展開すると 2 階層メニューになります。他のグループと `meta.sort` で混合ソートが可能です。

### `Model.defineChildren()` によるカスタムサブメニュー

```tsx file="./_demos/add-sub-model/add-sub-model-define-children.tsx" preview
```

### `Model.defineChildren()` によるカスタムグループ children

```tsx file="./_demos/add-sub-model/add-sub-model-group-children.tsx" preview
```

### サブメニューでの検索の有効化

```tsx file="./_demos/add-sub-model/add-sub-model-submenu-search.tsx" preview
```

- `children` を含むメニュー項目に `searchable: true` を設定するだけで、その階層に検索ボックスが表示されます。
- 同じ階層に group と非 group が混在する構造にも対応しており、検索は現在の階層にのみ作用します。
