:::tip
このドキュメントはAIによって翻訳されました。不正確な情報については、[英語版](/en)をご参照ください
:::

# 詳細ブロック

## 概要

詳細ブロックは、各データのフィールド値を表示するために使用します。柔軟なフィールドレイアウトに対応しており、様々なデータ操作機能が組み込まれています。これにより、ユーザーは情報を簡単に確認・管理できます。

## ブロック設定

![20251029202614](https://static-docs.nocobase.com/20251029202614.png)

### ブロック連携ルール

連携ルールを使って、ブロックの動作（表示するか、JavaScriptを実行するかなど）を制御します。

![20251023195004](https://static-docs.nocobase.com/20251023195004.png)

詳細については、[連携ルール](/interface-builder/linkage-rule) を参照してください。

### データ範囲の設定

例：支払い済みの注文のみを表示

![20251023195051](https://static-docs.nocobase.com/20251023195051.png)

詳細については、[データ範囲の設定](/interface-builder/blocks/block-settings/data-scope) を参照してください。

### フィールド連携ルール

詳細ブロックの連携ルールでは、フィールドの表示/非表示を動的に設定できます。

例：注文ステータスが「キャンセル」の場合、金額を表示しない。

![20251023200739](https://static-docs.nocobase.com/20251023200739.png)

詳細については、[連携ルール](/interface-builder/linkage-rule) を参照してください。

## フィールドの設定

### このコレクションのフィールド

> **注意**：継承されたコレクションのフィールド（つまり親コレクションのフィールド）は、現在のフィールドリストに自動的にマージされて表示されます。

![20251023201012](https://static-docs.nocobase.com/20251023201012.png)

### 関連コレクションのフィールド

> **注意**：関連コレクションのフィールドを表示できます（現在は1対1のリレーションシップのみをサポートしています）。

![20251023201258](https://static-docs.nocobase.com/20251023201258.png)

### その他のフィールド
- JSフィールド
- JSアイテム
- 区切り線
- Markdown

![20251023201514](https://static-docs.nocobase.com/20251023201514.png)

> **ヒント**：JavaScriptを記述して、カスタム表示コンテンツを実装できます。これにより、より複雑な情報を表示できます。  
> 例えば、異なるデータ型、条件、またはロジックに基づいて、様々な表示効果をレンダリングできます。

![20251023202017](https://static-docs.nocobase.com/20251023202017.png)

## アクションの設定

![20251023200529](https://static-docs.nocobase.com/20251023200529.png)

- [編集](/interface-builder/actions/types/edit)
- [削除](/interface-builder/actions/types/delete)
- [リンク](/interface-builder/actions/types/link)
- [ポップアップ](/interface-builder/actions/types/pop-up)
- [レコードの更新](/interface-builder/actions/types/update-record)
- [ワークフローのトリガー](/interface-builder/actions/types/trigger-workflow)
- [JSアクション](/interface-builder/actions/types/js-action)
- [AI従業員](/interface-builder/actions/types/ai-employee)