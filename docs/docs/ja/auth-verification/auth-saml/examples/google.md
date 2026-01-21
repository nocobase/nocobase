:::tip
このドキュメントはAIによって翻訳されました。不正確な情報については、[英語版](/en)をご参照ください
:::

# Google Workspace

## Google を IdP として設定する

[Google 管理コンソール](https://admin.google.com/) - アプリ - ウェブアプリとモバイルアプリ

![](https://static-docs.nocobase.com/0812780b990a97a63c14ea899195827.png)

アプリの設定が完了したら、**SSO URL**、**エンティティID**、**証明書**をコピーしてください。

![](https://static-docs.nocobase.com/aafd20a794730e85411c0c8f368637e0.png)

## NocoBase に新しい認証器を追加する

プラグイン設定 - ユーザー認証 - 追加 - SAML

![](https://static-docs.nocobase.com/5bc18c7952b8f15828e26bb07251a335.png)

先ほどコピーした情報をそれぞれ入力します。

- SSO URL: SSO URL
- Public Certificate: 公開証明書
- idP Issuer: エンティティID
- http: ローカル環境でHTTPテストを行う場合はチェックします。

その後、「Usage」にある SP Issuer/EntityID と ACS URL をコピーします。

## Google に SP 情報を入力する

Google コンソールに戻り、「**サービスプロバイダの詳細**」ページで、先ほどコピーした ACS URL とエンティティID を入力し、「**署名付き応答**」にチェックを入れます。

![](https://static-docs.nocobase.com/1536268bf8df4a5ebc72384317172191.png)

![](https://static-docs.nocobase.com/c7de1f8b84730e85411c0c8f368637e0.png)

「**属性マッピング**」セクションで、対応する属性をマッピングするためにマッピングを追加します。

![](https://static-docs.nocobase.com/27180f2f46480c3fee3016df86d6fdb8.png)