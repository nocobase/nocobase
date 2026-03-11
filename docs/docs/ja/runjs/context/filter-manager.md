:::tip{title="AI翻訳通知"}
このドキュメントはAIによって翻訳されました。正確な情報については[英語版](/runjs/context/filter-manager)をご参照ください。
:::

# ctx.filterManager

フィルター接続マネージャー。フィルターフォーム（FilterForm）とデータブロック（テーブル、リスト、チャートなど）間のフィルターの関連付けを管理するために使用されます。`BlockGridModel` によって提供され、そのコンテキスト内（フィルターフォームブロック、データブロックなど）でのみ利用可能です。

## 適用シーン

| シーン | 説明 |
|------|------|
| **フィルターフォームブロック** | フィルター項目とターゲットブロック間の接続設定を管理し、フィルター変更時にターゲットデータをリフレッシュします。 |
| **データブロック（テーブル/リスト）** | フィルター対象として機能し、`bindToTarget` を通じてフィルター条件をバインドします。 |
| **連動ルール / カスタム FilterModel** | `doFilter` や `doReset` 内で `refreshTargetsByFilter` を呼び出し、ターゲットのリフレッシュを実行します。 |
| **接続フィールド設定** | `getConnectFieldsConfig` や `saveConnectFieldsConfig` を使用して、フィルターとターゲット間のフィールドマッピングを維持します。 |

> 注意：`ctx.filterManager` は `BlockGridModel` を持つ RunJS コンテキスト（フィルターフォームを含むページ内など）でのみ利用可能です。通常の JSBlock や独立したページでは `undefined` になるため、使用前にオプショナルチェイニング（`?.`）によるチェックを推奨します。

## 型定義

```ts
filterManager: FilterManager;

type FilterConfig = {
  filterId: string;   // フィルターモデルの UID
  targetId: string;   // ターゲットデータブロックモデルの UID
  filterPaths?: string[];  // ターゲットブロックのフィールドパス
  operator?: string;  // フィルター演算子
};

type ConnectFieldsConfig = {
  targets: { targetId: string; filterPaths: string[] }[];
};
```

## 常用メソッド

| メソッド | 説明 |
|------|------|
| `getFilterConfigs()` | 現在のすべてのフィルター接続設定を取得します。 |
| `getConnectFieldsConfig(filterId)` | 指定したフィルターの接続フィールド設定を取得します。 |
| `saveConnectFieldsConfig(filterId, config)` | フィルターの接続フィールド設定を保存します。 |
| `addFilterConfig(config)` | フィルター設定（filterId + targetId + filterPaths）を追加します。 |
| `removeFilterConfig({ filterId?, targetId?, persist? })` | filterId、targetId、またはその両方に基づいてフィルター設定を削除します。 |
| `bindToTarget(targetId)` | フィルター設定をターゲットブロックにバインドし、その resource にフィルターを適用させます。 |
| `unbindFromTarget(targetId)` | ターゲットブロックからフィルターのバインドを解除します。 |
| `refreshTargetsByFilter(filterId または filterId[])` | フィルターに基づいて、関連するターゲットブロックのデータをリフレッシュします。 |

## コア概念

- **FilterModel**：フィルター条件を提供するモデル（FilterFormItemModel など）。現在のフィルター値を返す `getFilterValue()` を実装する必要があります。
- **TargetModel**：フィルター対象となるデータブロック。その `resource` は `addFilterGroup`、`removeFilterGroup`、`refresh` をサポートしている必要があります。

## 実行例

### フィルター設定の追加

```ts
await ctx.filterManager?.addFilterConfig({
  filterId: 'filter-form-item-uid',
  targetId: 'table-block-uid',
  filterPaths: ['status', 'createdAt'],
  operator: '$eq',
});
```

### ターゲットブロックのリフレッシュ

```ts
// フィルターフォームの doFilter / doReset 内で
ctx.filterManager?.refreshTargetsByFilter(ctx.model.uid);

// 複数のフィルターに関連付けられたターゲットをリフレッシュ
ctx.filterManager?.refreshTargetsByFilter(['filter-1', 'filter-2']);
```

### 接続フィールドの設定

```ts
// 接続設定の取得
const config = ctx.filterManager?.getConnectFieldsConfig(ctx.model.uid);

// 接続設定の保存
await ctx.filterManager?.saveConnectFieldsConfig(ctx.model.uid, {
  targets: [
    { targetId: 'table-uid', filterPaths: ['status'] },
    { targetId: 'chart-uid', filterPaths: ['category'] },
  ],
});
```

### 設定の削除

```ts
// 特定のフィルターのすべての設定を削除
await ctx.filterManager?.removeFilterConfig({ filterId: 'filter-uid' });

// 特定のターゲットのすべてのフィルター設定を削除
await ctx.filterManager?.removeFilterConfig({ targetId: 'table-uid' });
```

## 関連情報

- [ctx.resource](./resource.md)：ターゲットブロックのリソースはフィルターインターフェースをサポートしている必要があります。
- [ctx.model](./model.md)：filterId / targetId に使用する現在のモデルの UID を取得するために使用します。