---
pkg: "@nocobase/plugin-action-bulk-update"
---
:::tip
このドキュメントはAIによって翻訳されました。不正確な情報については、[英語版](/en)をご参照ください
:::

# 一括更新

## 概要

一括更新アクションは、複数のレコードに同じ更新を適用したい場合に利用します。一括更新を実行する前に、更新するフィールドの割り当てロジックを事前に定義しておく必要があります。このロジックは、ユーザーが更新ボタンをクリックした際に、選択されたすべてのレコードに適用されます。

![20251029195320](https://static-docs.nocobase.com/20251029195320.png)

## アクション設定

![20251029195729](https://static-docs.nocobase.com/20251029195729.png)

### 更新対象データ

選択済み/すべて、デフォルトは「選択済み」です。

![20251029200034](https://static-docs.nocobase.com/20251029200034.png)

### フィールドの割り当て

一括更新するフィールドを設定します。設定されたフィールドのみが更新されます。

図のように、注文テーブルで一括更新アクションを設定し、選択されたデータを「承認待ち」に一括更新します。

![20251029200109](https://static-docs.nocobase.com/20251029200109.png)

- [ボタンの編集](/interface-builder/actions/action-settings/edit-button)：ボタンのタイトル、タイプ、アイコンを編集します。
- [連携ルール](/interface-builder/actions/action-settings/linkage-rule)：ボタンを動的に表示/非表示にします。
- [再確認](/interface-builder/actions/action-settings/double-check)