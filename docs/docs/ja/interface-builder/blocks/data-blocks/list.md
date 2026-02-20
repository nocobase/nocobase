---
pkg: "@nocobase/plugin-block-list"
---
:::tip
このドキュメントはAIによって翻訳されました。不正確な情報については、[英語版](/en)をご参照ください
:::

# リストブロック

## はじめに

リストブロックは、データをリスト形式で表示します。タスクリスト、ニュース記事、製品情報などのデータ表示に活用できます。

## ブロックの設定

![20251023202835](https://static-docs.nocobase.com/20251023202835.png)

### データ範囲の設定

図のように、注文ステータスが「キャンセル済み」の伝票を絞り込みます。

![20251023202927](https://static-docs.nocobase.com/20251023202927.png)

詳細については、[データ範囲の設定](/interface-builder/blocks/block-settings/data-scope)をご覧ください。

### ソート順の設定

図のように、注文金額の降順で並べ替えます。

![202510123203022](https://static-docs.nocobase.com/20251023203022.png)

詳細については、[ソート順の設定](/interface-builder/blocks/block-settings/sorting-rule)をご覧ください。

## フィールドの設定

### このコレクションのフィールド

> **注意**：継承されたコレクションのフィールド（つまり、親コレクションのフィールド）は、現在のフィールドリストに自動的に結合されて表示されます。

![20251023203103](https://static-docs.nocobase.com/20251023203103.png)

### 関連コレクションのフィールド

> **注意**：関連コレクションのフィールドを表示できます（現在、1対1のリレーションシップのみサポートしています）。

![20251023203611](https://static-docs.nocobase.com/20251023203611.png)

リストフィールドの設定については、[詳細フィールド](/interface-builder/fields/generic/detail-form-item)をご覧ください。

## アクションの設定

### グローバルアクション

![20251023203918](https://static-docs.nocobase.com/20251023203918.png)

- [フィルター](/interface-builder/actions/types/filter)
- [追加](/interface-builder/actions/types/add-new)
- [削除](/interface-builder/actions/types/delete)
- [更新](/interface-builder/actions/types/refresh)
- [インポート](/interface-builder/actions/types/import)
- [エクスポート](/interface-builder/actions/types/export)
- [テンプレート印刷](/template-print/index)
- [一括更新](/interface-builder/actions/types/bulk-update)
- [添付ファイルのエクスポート](/interface-builder/actions/types/export-attachments)
- [ワークフローのトリガー](/interface-builder/actions/types/trigger-workflow)
- [JSアクション](/interface-builder/actions/types/js-action)
- [AI従業員](/interface-builder/actions/types/ai-employee)

### 行アクション

![20251023204329](https://static-docs.nocobase.com/20251023204329.png)

- [編集](/interface-builder/actions/types/edit)
- [削除](/interface-builder/actions/types/delete)
- [リンク](/interface-builder/actions/types/link)
- [ポップアップ](/interface-builder/actions/types/pop-up)
- [レコードの更新](/interface-builder/actions/types/update-record)
- [テンプレート印刷](/template-print/index)
- [ワークフローのトリガー](/interface-builder/actions/types/trigger-workflow)
- [JSアクション](/interface-builder/actions/types/js-action)
- [AI従業員](/interface-builder/actions/types/ai-employee)