:::tip
このドキュメントはAIによって翻訳されました。不正確な情報については、[英語版](/en)をご参照ください
:::

# Microsoft Entra ID

> https://learn.microsoft.com/en-us/entra/identity-platform/quickstart-register-app  
> https://learn.microsoft.com/en-us/entra/identity-platform/v2-protocols-oidc

## NocoBaseに認証器を追加する

まず、NocoBaseに新しい認証器を追加します。手順は、[プラグイン設定] > [ユーザー認証] > [追加] > [OIDC] です。

コールバックURLをコピーします。

![](https://static-docs.nocobase.com/202412021504114.png)

## アプリケーションを登録する

Microsoft Entra 管理センターを開き、新しいアプリケーションを登録します。

![](https://static-docs.nocobase.com/202412021506837.png)

ここに、先ほどコピーしたコールバックURLを貼り付けます。

![](https://static-docs.nocobase.com/202412021520696.png)

## 必要な情報を取得して入力する

先ほど登録したアプリケーションをクリックし、概要ページから **Application (client) ID** と **Directory (tenant) ID** をコピーします。

![](https://static-docs.nocobase.com/202412021522063.png)

`Certificates & secrets` をクリックし、新しいクライアントシークレットを作成して、**Value** をコピーします。

![](https://static-docs.nocobase.com/202412021522846.png)

上記Microsoft Entraの情報とNocoBase認証器の設定の対応関係は以下の通りです。

| Microsoft Entra 情報    | NocoBase 認証器の設定項目                                                                                                                        |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| Application (client) ID | Client ID                                                                                                                                        |
| Client secrets - Value  | Client secret                                                                                                                                    |
| Directory (tenant) ID   | Issuer:<br />https://login.microsoftonline.com/{tenant}/v2.0/.well-known/openid-configuration, `{tenant}` は対応する Directory (tenant) ID に置き換えてください。 |