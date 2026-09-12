---
pkg: "@nocobase/plugin-email-manager"
title: "メールブロック設定"
description: "メールテーブルブロック：ブロックの追加、フィールド設定、データ範囲（全件/現在のユーザー）、メールアドレスやメールサフィックスに基づくフィルタリング。"
keywords: "メールブロック,メールテーブル,データ範囲,メールフィルタリング,NocoBase"
---
# ブロック設定

## メールメッセージブロック

### ブロックの追加

設定ページで**ブロックを作成**ボタンをクリックし、**メールテーブル**ブロックを選択してメールメッセージブロックを追加します。

![](https://static-docs.nocobase.com/email-manager/Email-12-31-2025_09_56_PM.png)

### フィールド設定

ブロックの**フィールド**ボタンをクリックすると、表示するフィールドを選択できます。詳細な操作についてはテーブルのフィールド設定を参照してください。

![](https://static-docs.nocobase.com/email-manager/Email-12-31-2025_09_58_PM.png)

### データ範囲の設定
ブロック右側の設定からデータ範囲を選択できます：全件のメールまたは現在のログインユーザーのメール。

![](https://static-docs.nocobase.com/email-manager/Email-12-31-2025_09_58_PM%20(1).png)

### メールアドレスに基づくデータフィルタリング

メールメッセージブロック右側の設定ボタンをクリックし、**データ範囲**を選択して、メールをフィルタリングするためのデータ範囲を設定します。

![](https://static-docs.nocobase.com/email-manager/Emails-12-02-2025_04_32_PM.png)

フィルタリング条件を設定し、フィルタリングしたいメールアドレスフィールドを選択して、**確定**をクリックして保存します。

![](https://static-docs.nocobase.com/email-manager/Emails-12-02-2025_04_26_PM.png)

メールメッセージブロックにフィルタリング条件に一致するメールが表示されます。

![](https://static-docs.nocobase.com/email-manager/Emails-12-02-2025_04_29_PM.png)

> メールアドレスに基づくフィルタリングは大文字小文字を区別しません

### メールサフィックスに基づくデータフィルタリング

ビジネステーブルにメールサフィックスを格納するフィールド（JSON 型）を作成し、後続のメールメッセージのフィルタリングに使用します。

![](https://static-docs.nocobase.com/email-manager/data-source-manager-main-NocoBase-12-02-2025_04_36_PM.png)

メールサフィックス情報を入力します。

![](https://static-docs.nocobase.com/email-manager/Emails-12-02-2025_04_38_PM.png)

メールメッセージブロック右側の設定ボタンをクリックし、**データ範囲**を選択して、メールをフィルタリングするためのデータ範囲を設定します。

![](https://static-docs.nocobase.com/email-manager/Emails-12-02-2025_04_32_PM.png)

フィルタリング条件を設定し、フィルタリングしたいメールサフィックスフィールドを選択して、**確定**をクリックして保存します。

![](https://static-docs.nocobase.com/email-manager/Emails-12-02-2025_04_41_PM.png)

メールメッセージテーブルにフィルタリング条件に一致するメールが表示されます。

![](https://static-docs.nocobase.com/email-manager/Emails-12-02-2025_04_48_PM.png)

## メール詳細ブロック

まず、メールメッセージブロックのフィールドで**クリックして開くを有効にする**機能をオンにします。

![](https://static-docs.nocobase.com/email-manager/Email-12-31-2025_10_01_PM.png)

ポップアップウィンドウで**メール詳細**ブロックを追加します。

![](https://static-docs.nocobase.com/email-manager/Email-12-31-2025_10_02_PM.png)

メールの詳細内容を確認できます。

![](https://static-docs.nocobase.com/email-manager/Email-12-31-2025_10_03_PM.png)

下部には必要なボタンを自由に設定できます。

> 現在のメールが下書き状態の場合、デフォルトで下書き編集フォームが表示されます。

## メール送信ブロック

メール送信フォームを作成する方法は 2 つあります：

1. テーブル上部に**メールを送信**ボタンを追加します：  
   ![](https://static-docs.nocobase.com/email-manager/User-12-31-2025_10_04_PM.png)

2. **メール送信**ブロックを追加します：  
   ![](https://static-docs.nocobase.com/email-manager/User-12-31-2025_10_05_PM.png)

どちらの方法でも、完全なメール送信フォームを作成できます。

![](https://static-docs.nocobase.com/email-manager/User-12-31-2025_10_05_PM%20(1).png)

メールフォームの各フィールドは通常のフォームと同様に、**デフォルト値**や**連携ルール**などを設定できます。
