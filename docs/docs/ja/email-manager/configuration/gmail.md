---
pkg: "@nocobase/plugin-email-manager"
---
:::tip
このドキュメントはAIによって翻訳されました。不正確な情報については、[英語版](/en)をご参照ください
:::



# Google の設定

### 前提条件

ユーザーが Google メールアカウントを NocoBase に連携できるようにするには、Google サービスにアクセス可能なサーバーに NocoBase をデプロイする必要があります。NocoBase のバックエンドが Google API を呼び出すためです。

### アカウントの登録

1.  https://console.cloud.google.com/welcome を開いて Google Cloud にアクセスします。
2.  初めてアクセスする場合は、関連する規約に同意する必要があります。

![](https://static-docs.nocobase.com/mail-1733818617807.png)

### アプリの作成

1.  上部の「Select a project」をクリックします。

![](https://static-docs.nocobase.com/mail-1733818618126.png)

2.  ポップアップ内の「NEW PROJECT」ボタンをクリックします。

![](https://static-docs.nocobase.com/mail-1733818618329.png)

3.  プロジェクト情報を入力します。

![](https://static-docs.nocobase.com/mail-1733818618510.png)

4.  プロジェクト作成後、そのプロジェクトを選択します。

![](https://static-docs.nocobase.com/mail-1733818618828.png)

![](https://static-docs.nocobase.com/mail-1733818619044.png)

### Gmail API の有効化

1.  「APIs & Services」ボタンをクリックします。

![](https://static-docs.nocobase.com/mail-1733818619230.png)

2.  APIs & Services ダッシュボードに移動します。

![](https://static-docs.nocobase.com/mail-1733818619419.png)

3.  「mail」と検索します。

![](https://static-docs.nocobase.com/mail-1733818619810.png)

![](https://static-docs.nocobase.com/mail-1733818620020.png)

4.  「ENABLE」ボタンをクリックして、Gmail API を有効にします。

![](https://static-docs.nocobase.com/mail-1733818620589.png)

![](https://static-docs.nocobase.com/mail-1733818620885.png)

### OAuth 同意画面の設定

1.  左側の「OAuth consent screen」メニューをクリックします。

![](https://static-docs.nocobase.com/mail-1733818621104.png)

2.  「External」を選択します。

![](https://static-docs.nocobase.com/mail-1733818621322.png)

3.  プロジェクト情報（承認ページに表示されます）を入力し、「保存」をクリックします。

![](https://static-docs.nocobase.com/mail-1733818621538.png)

4.  開発者の連絡先情報を入力し、「続行」をクリックします。

![](https://static-docs.nocobase.com/mail-1733818621749.png)

5.  「続行」をクリックします。

![](https://static-docs.nocobase.com/mail-1733818622121.png)

6.  アプリ公開前のテスト用にテストユーザーを追加します。

![](https://static-docs.nocobase.com/mail-1733818622332.png)

![](https://static-docs.nocobase.com/mail-1733818622537.png)

7.  「続行」をクリックします。

![](https://static-docs.nocobase.com/mail-1733818622753.png)

8.  概要情報を確認し、ダッシュボードに戻ります。

![](https://static-docs.nocobase.com/mail-1733818622984.png)

### 認証情報（Credentials）の作成

1.  左側の「Credentials」メニューをクリックします。

![](https://static-docs.nocobase.com/mail-1733818623168.png)

2.  「CREATE CREDENTIALS」ボタンをクリックし、「OAuth client ID」を選択します。

![](https://static-docs.nocobase.com/mail-1733818623386.png)

3.  「Web application」を選択します。

![](https://static-docs.nocobase.com/mail-1733818623758.png)

4.  アプリケーション情報を入力します。

![](https://static-docs.nocobase.com/mail-1733818623992.png)

5.  プロジェクトの最終的なデプロイ先ドメインを入力します（ここでは NocoBase のテストアドレスを例としています）。

![](https://static-docs.nocobase.com/mail-1733818624188.png)

6.  承認済みリダイレクト URI を追加します。これは「ドメイン + "/admin/settings/mail/oauth2"」の形式である必要があります。例：`https://pr-1-mail.test.nocobase.com/admin/settings/mail/oauth2`

![](https://static-docs.nocobase.com/mail-1733818624449.png)

7.  「作成」をクリックすると、OAuth 情報を確認できます。

![](https://static-docs.nocobase.com/mail-1733818624701.png)

8.  Client ID と Client secret をそれぞれコピーし、メール設定ページに貼り付けます。

![](https://static-docs.nocobase.com/mail-1733818624923.png)

9.  「保存」をクリックすると、設定が完了します。

### アプリの公開

上記の手順が完了し、テストユーザーによる認証ログインやメール送信などの機能テストが完了したら、アプリを公開できます。

1.  「OAuth consent screen」メニューをクリックします。

![](https://static-docs.nocobase.com/mail-1733818625124.png)

2.  「EDIT APP」ボタンをクリックし、その後、下部の「SAVE AND CONTINUE」ボタンをクリックします。

![](https://static-docs.nocobase.com/mail-1735633686380.png)

![](https://static-docs.nocobase.com/mail-1735633686750.png)

3.  「ADD OR REMOVE SCOPES」ボタンをクリックし、ユーザーの権限スコープを選択します。

![](https://static-docs.nocobase.com/mail-1735633687054.png)

4.  「Gmail API」と入力して検索し、「Gmail API」にチェックを入れます（スコープ値が「https://mail.google.com/」である Gmail API であることを確認してください）。

![](https://static-docs.nocobase.com/mail-1735633687283.png)

5.  下部の「UPDATE」ボタンをクリックして保存します。

![](https://static-docs.nocobase.com/mail-1735633687536.png)

6.  各ページ下部の「SAVE AND CONTINUE」ボタンをクリックし、最後に「BACK TO DASHBOARD」ボタンをクリックしてダッシュボードページに戻ります。

![](https://static-docs.nocobase.com/mail-1735633687744.png)

![](https://static-docs.nocobase.com/mail-1735633687912.png)

![](https://static-docs.nocobase.com/mail-1735633688075.png)

7.  「PUBLISH APP」ボタンをクリックすると、公開に必要な関連コンテンツがリストされた公開確認ページが表示されます。その後、「CONFIRM」ボタンをクリックします。

![](https://static-docs.nocobase.com/mail-1735633688257.png)

8.  再びコンソールページに戻ると、公開ステータスが「In production」になっていることを確認できます。

![](https://static-docs.nocobase.com/mail-1735633688425.png)

9.  「PREPARE FOR VERIFICATION」ボタンをクリックし、必須情報を入力して「SAVE AND CONTINUE」ボタンをクリックします（図中のデータは例です）。

![](https://static-docs.nocobase.com/mail-1735633688634.png)

![](https://static-docs.nocobase.com/mail-1735633688827.png)

10. 必要な関連情報を引き続き入力します（図中のデータは例です）。

![](https://static-docs.nocobase.com/mail-1735633688993.png)

11. 「SAVE AND CONTINUE」ボタンをクリックします。

![](https://static-docs.nocobase.com/mail-1735633689159.png)

12. 「SUBMIT FOR VERIFICATION」ボタンをクリックして、認証（Verification）を提出します。

![](https://static-docs.nocobase.com/mail-1735633689318.png)

13. 承認結果を待ちます。

![](https://static-docs.nocobase.com/mail-1735633689494.png)

14. 承認がまだ保留中の場合でも、ユーザーは「unsafe」リンクをクリックして認証ログインを行うことができます。

![](https://static-docs.nocobase.com/mail-1735633689645.png)