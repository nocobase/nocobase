---
pkg: "@nocobase/plugin-action-bulk-edit"
---

:::tip{title="AI翻訳通知"}
このドキュメントはAIによって翻訳されました。正確な情報については[英語版](/interface-builder/actions/types/bulk-edit)をご参照ください。
:::

# 一括編集

## 概要

一括編集は、データを柔軟に一括更新する必要があるシーンに適しています。一括編集ボタンをクリックすると、ポップアップウィンドウで一括編集フォームを設定し、フィールドごとに異なる更新戦略を設定できます。

![](https://static-docs.nocobase.com/Orders-02-12-2026_07_13_AM.png)


## 操作設定

![](https://static-docs.nocobase.com/Orders-02-12-2026_07_13_AM%20(1).png)


## 利用ガイド

### 一括編集フォームの設定

1. 一括編集ボタンを追加します。

2. 一括編集の範囲を設定します：「選択済み」または「すべて」。デフォルトは「選択済み」です。

![](https://static-docs.nocobase.com/Orders-02-12-2026_07_14_AM.png)

3. 一括編集フォームを追加します。

![](https://static-docs.nocobase.com/Bulk-edit-02-12-2026_07_14_AM.png)

4. 編集が必要なフィールドを設定し、送信ボタンを追加します。

![](https://static-docs.nocobase.com/Bulk-edit-02-12-2026_07_15_AM%20(1).png)

![](https://static-docs.nocobase.com/Bulk-edit-02-12-2026_07_15_AM.png)

### フォームの送信

1. 編集したい行データにチェックを入れます。

2. フィールドの編集モードを選択し、送信する値を入力します。

![](https://static-docs.nocobase.com/Bulk-edit-02-12-2026_10_33_AM.png)

:::info{title=利用可能な編集モード}
* **更新しない**: フィールドの値は変更されません。
* **指定した値に変更**: フィールドの値を送信された値に更新します。
* **クリア**: フィールドのデータを削除します。

:::

3. フォームを送信します。