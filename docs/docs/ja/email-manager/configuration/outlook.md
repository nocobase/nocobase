---
pkg: "@nocobase/plugin-email-manager"
---
:::tip
このドキュメントはAIによって翻訳されました。不正確な情報については、[英語版](/en)をご参照ください
:::


# Microsoft の設定

### 前提条件
NocoBase でユーザーが Outlook メールボックスを接続できるようにするには、Microsoft サービスにアクセスできるサーバーに NocoBase をデプロイする必要があります。NocoBase のバックエンドが Microsoft API を呼び出すためです。

### アカウントの登録

1. https://azure.microsoft.com/en-us/pricing/purchase-options/azure-account にアクセスします。
    
2. Microsoft アカウントにログインします。
    
![](https://static-docs.nocobase.com/mail-1733818625779.png)

### テナントの作成

1. https://azure.microsoft.com/zh-cn/pricing/purchase-options/azure-account?icid=azurefreeaccount にアクセスし、アカウントにログインします。
    
2. 基本情報を入力し、認証コードを取得します。

![](https://static-docs.nocobase.com/mail-1733818625984.png)

3. その他の情報を入力して続行します。

![](https://static-docs.nocobase.com/mail-1733818626352.png)

4. クレジットカード情報を入力します（この手順はスキップしても構いません）。

![](https://static-docs.nocobase.com/mail-1733818626622.png)

### クライアント ID の取得

1. トップメニューをクリックし、「Microsoft Entra ID」を選択します。

![](https://static-docs.nocobase.com/mail-1733818626871.png)

2. 左側の「App registrations」を選択します。

![](https://static-docs.nocobase.com/mail-1733818627097.png)

3. 上部の「New registration」をクリックします。

![](https://static-docs.nocobase.com/mail-1733818627309.png)

4. 情報を入力して送信します。

名前は任意で構いません。アカウントの種類は下図を参考に選択してください。リダイレクト URI は現時点では空欄で問題ありません。

![](https://static-docs.nocobase.com/mail-1733818627555.png)

5. クライアント ID を取得します。

![](https://static-docs.nocobase.com/mail-1733818627797.png)

### API 承認

1. 左側の「API permissions」メニューを開きます。

![](https://static-docs.nocobase.com/mail-1733818628178.png)

2. 「Add a permission」ボタンをクリックします。

![](https://static-docs.nocobase.com/mail-1733818628448.png)

3. 「Microsoft Graph」をクリックします。

![](https://static-docs.nocobase.com/mail-1733818628725.png)

![](https://static-docs.nocobase.com/mail-1733818628927.png)

4. 以下の権限を検索して追加します。最終的な結果は下図のようになります。
    
    1. `"email"`
    2. `"offline_access"`
    3. `"IMAP.AccessAsUser.All"`
    4. `"SMTP.Send"`
    5. `"offline_access"`
    6. `"User.Read"` (By default)

![](https://static-docs.nocobase.com/mail-1733818629130.png)

### シークレットの取得

1. 左側の「Certificates & secrets」をクリックします。

![](https://static-docs.nocobase.com/mail-1733818629369.png)

2. 「New client secret」ボタンをクリックします。

![](https://static-docs.nocobase.com/mail-1733818629554.png)

3. 説明と有効期限を入力し、「追加」をクリックします。

![](https://static-docs.nocobase.com/mail-1733818630292.png)

4. シークレット ID を取得します。

![](https://static-docs.nocobase.com/mail-1733818630535.png)

5. クライアント ID とクライアント シークレットをそれぞれコピーし、メール設定ページに貼り付けます。

![](https://static-docs.nocobase.com/mail-1733818630710.png)