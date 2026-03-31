---
pkg: "@nocobase/plugin-email-manager"
---
:::tip
このドキュメントはAIによって翻訳されました。不正確な情報については、[英語版](/en)をご参照ください
:::


# ブロック設定

## メールメッセージブロック

### ブロックの追加

設定ページで、**ブロックを作成** ボタンをクリックし、**メールメッセージ (すべて)** または **メールメッセージ (個人)** ブロックを選択して、メールメッセージブロックを追加します。

![](https://static-docs.nocobase.com/email-manager/Email-10-31-2025_03_58_PM.png)

### フィールド設定

ブロックの **フィールド** ボタンをクリックすると、表示するフィールドを選択できます。詳細な操作については、テーブルのフィールド設定方法をご参照ください。

![](https://static-docs.nocobase.com/email-manager/Email-10-31-2025_04_37_PM.png)

### データフィルター設定

テーブル右側の設定アイコンをクリックし、**データ範囲** を選択すると、メールを絞り込むデータ範囲を設定できます。

![](https://static-docs.nocobase.com/email-manager/Email-10-31-2025_04_39_PM.png)

変数を使って、同じサフィックス（末尾）を持つメールを絞り込むことができます。
![](https://static-docs.nocobase.com/email-manager/Email-10-31-2025_04_41_PM.png)

## メール詳細ブロック

まず、メールメッセージブロックのフィールドで、**クリックして開くを有効にする** 機能をオンにします。

![](https://static-docs.nocobase.com/email-manager/Email-10-31-2025_04_45_PM.png)

ポップアップウィンドウで **メール詳細** ブロックを追加します。

![](https://static-docs.nocobase.com/email-manager/Email-10-31-2025_04_46_PM.png)

メールの詳細内容を確認できます。

![](https://static-docs.nocobase.com/email-manager/Loading--10-31-2025_04_49_PM.png)

下部には、必要なボタンを自由に設定できます。

## メール送信ブロック

メール送信フォームを作成する方法は2つあります。

1. テーブルのトップに **メールを送信** ボタンを追加します。
   ![](https://static-docs.nocobase.com/email-manager/Email-10-31-2025_04_52_PM.png)

2. **メール送信** ブロックを追加します。
   ![](https://static-docs.nocobase.com/email-manager/Email-10-31-2025_04_53_PM.png)

どちらの方法でも、完全なメール送信フォームを作成できます。
![](https://static-docs.nocobase.com/email-manager/Email-10-31-2025_04_53_PM%20(1).png)

メールフォームの各フィールドは、通常のフォームと同様に、**デフォルト値** や **連携ルール** などを設定できます。

> メール詳細の下部にあるメール返信フォームとメール転送フォームには、デフォルトで一部のデータ処理が含まれていますが、これらは **イベントフロー** を通じて変更できます。