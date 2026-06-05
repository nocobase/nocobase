:::tip
このドキュメントはAIによって翻訳されました。不正確な情報については、[英語版](/en)をご参照ください
:::

# テーブルブロック

## はじめに

テーブルブロックは、**NocoBase** に組み込まれているコアデータブロックの一つで、主に構造化データをテーブル形式で表示・管理するために使われます。柔軟な設定オプションが用意されており、ユーザーは必要に応じてテーブルの列、列幅、並べ替えルール、データ範囲などをカスタマイズし、特定のビジネスニーズに合ったデータを表示できます。

#### 主な機能：
- **柔軟な列設定**：テーブルの列と列幅を自由に設定でき、さまざまなデータ表示要件に対応します。
- **並べ替えルール**：テーブルデータの並べ替えに対応しています。ユーザーは異なるフィールドに基づいてデータを昇順または降順で並べ替えることができます。
- **データ範囲の設定**：データ範囲を設定することで、表示するデータ範囲を制御し、不要なデータの干渉を防ぎます。
- **操作設定**：テーブルブロックにはさまざまな操作オプションが組み込まれています。ユーザーはフィルター、新規作成、編集、削除などの操作を簡単に設定でき、データを素早く管理できます。
- **クイック編集**：テーブル内で直接データを編集できるため、操作プロセスを簡素化し、作業効率を向上させます。

## ブロック設定

![20251023150819](https://static-docs.nocobase.com/20251023150819.png)

### ブロック連携ルール

連携ルールを使って、ブロックの動作（表示/非表示やJavaScriptの実行など）を制御します。

![20251023194550](https://static-docs.nocobase.com/20251023194550.png)

詳細は [連携ルール](/interface-builder/linkage-rule) をご覧ください。

### データ範囲の設定

例：「ステータス」が「支払い済み」の注文をデフォルトでフィルターします。

![20251023150936](https://static-docs.nocobase.com/20251023150936.png)

詳細は [データ範囲の設定](/interface-builder/blocks/block-settings/data-scope) をご覧ください。

### 並べ替えルールの設定

例：注文日を降順で表示します。

![20251023155114](https://static-docs.nocobase.com/20251023155114.png)

詳細は [並べ替えルールの設定](/interface-builder/blocks/block-settings/sorting-rule) をご覧ください。

### クイック編集を有効にする

ブロック設定とテーブル列設定で「クイック編集を有効にする」をアクティブにすると、どの列をクイック編集可能にするかカスタマイズできます。

![20251023190149](https://static-docs.nocobase.com/20251023190149.png)

![20251023190519](https://static-docs.nocobase.com/20251023190519.gif)

### ツリーテーブルを有効にする

データテーブルがツリー形式の場合、テーブルブロックで「ツリーテーブルを有効にする」機能をオンにできます。このオプションはデフォルトでオフになっています。有効にすると、ブロックはツリー構造でデータを表示し、対応する設定オプションと操作機能もサポートします。

![20251125205918](https://static-docs.nocobase.com/20251125205918.png)

### すべての行をデフォルトで展開

ツリーテーブルが有効な場合、ブロックの読み込み時にすべての子データをデフォルトで展開できます。

## フィールドの設定

### このコレクションのフィールド

> **注意**：継承されたコレクションのフィールド（つまり親コレクションのフィールド）は、現在のフィールドリストに自動的に統合されて表示されます。

![20251023185113](https://static-docs.nocobase.com/20251023185113.png)

### 関連コレクションのフィールド

> **注意**：関連コレクションのフィールドを表示できます（現在は1対1の関係のみをサポートしています）。

![20251023185239](https://static-docs.nocobase.com/20251023185239.png)

### その他のカスタム列

![20251023185425](https://static-docs.nocobase.com/20251023185425.png)

- [JSフィールド](/interface-builder/fields/specific/js-field)
- [JSカラム](/interface-builder/fields/specific/js-column)

## 操作の設定

### グローバル操作

![20251023171655](https://static-docs.nocobase.com/20251023171655.png)

- [フィルター](/interface-builder/actions/types/filter)
- [新規追加](/interface-builder/actions/types/add-new)
- [削除](/interface-builder/actions/types/delete)
- [更新](/interface-builder/actions/types/refresh)
- [インポート](/interface-builder/actions/types/import)
- [エクスポート](/interface-builder/actions/types/export)
- [テンプレート印刷](/template-print/index)
- [一括更新](/interface-builder/actions/types/bulk-update)
- [添付ファイルのエクスポート](/interface-builder/actions/types/export-attachments)
- [ワークフローのトリガー](/interface-builder/actions/types/trigger-workflow)
- [JSアクション](/interface-builder/actions/types/js-action)
- [AIアシスタント](/interface-builder/actions/types/ai-employee)

### 行操作

![20251023181019](https://static-docs.nocobase.com/20251023181019.png)

- [表示](/interface-builder/actions/types/view)
- [編集](/interface-builder/actions/types/edit)
- [削除](/interface-builder/actions/types/delete)
- [ポップアップ](/interface-builder/actions/types/pop-up)
- [リンク](/interface-builder/actions/types/link)
- [レコードの更新](/interface-builder/actions/types/update-record)
- [テンプレート印刷](/template-print/index)
- [ワークフローのトリガー](/interface-builder/actions/types/trigger-workflow)
- [JSアクション](/interface-builder/actions/types/js-action)
- [AIアシスタント](/interface-builder/actions/types/ai-employee)