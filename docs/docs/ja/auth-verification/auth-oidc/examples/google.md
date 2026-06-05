:::tip
このドキュメントはAIによって翻訳されました。不正確な情報については、[英語版](/en)をご参照ください
:::

# Googleでサインインする

> https://developers.google.com/identity/openid-connect/openid-connect

## Google OAuth 2.0 認証情報（クレデンシャル）を取得する

[Google Cloud コンソール](https://console.cloud.google.com/apis/credentials)にアクセスし、「認証情報を作成」から「OAuth クライアント ID」を選択します。

![](https://static-docs.nocobase.com/0f2946c8643565ecc4ac13249882638c.png)

設定画面に進み、承認済みリダイレクトURLを入力します。このリダイレクトURLは、NocoBaseで認証器を追加する際に取得できます。通常、`http(s)://host:port/api/oidc:redirect` の形式です。[ユーザーマニュアル - 設定](../index.md#configuration)のセクションもご参照ください。

![](https://static-docs.nocobase.com/24078bf52ec966a16334894cb3d9d126.png)

## NocoBaseに新しい認証器を追加する

プラグイン設定 - ユーザー認証 - 追加 - OIDC

![](https://static-docs.nocobase.com/0e4b1acdef6335aaee2139ae6629977b.png)

[ユーザーマニュアル - 設定](../index.md#configuration)で紹介されているパラメーターを参考に、認証器の設定を完了してください。