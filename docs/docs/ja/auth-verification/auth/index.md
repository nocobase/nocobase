:::tip
このドキュメントはAIによって翻訳されました。不正確な情報については、[英語版](/en)をご参照ください
:::

# ユーザー認証

NocoBaseのユーザー認証モジュールは、主に以下の2つの部分で構成されています。

- コア（カーネル）に含まれる`@nocobase/auth`は、ログイン、登録、検証などのユーザー認証に関連する拡張可能なインターフェースとミドルウェアを定義します。また、様々な拡張認証方式の登録と管理にも利用されます。
- プラグインに含まれる`@nocobase/plugin-auth`は、コア（カーネル）内の認証管理モジュールを初期化し、基本的なユーザー名（またはメールアドレス）/パスワード認証方式を提供します。

> [`@nocobase/plugin-users` プラグイン](/users-permissions/user)が提供するユーザー管理機能と組み合わせて使用する必要があります。

さらに、NocoBaseは他にも様々なユーザー認証方式プラグインを提供しています。

- [@nocobase/plugin-auth-sms](/auth-verification/auth-sms/) - SMS認証ログイン機能を提供します
- [@nocobase/plugin-auth-saml](/auth-verification/auth-saml/) - SAML SSOログイン機能を提供します
- [@nocobase/plugin-auth-oidc](/auth-verification/auth-oidc/) - OIDC SSOログイン機能を提供します
- [@nocobase/plugin-auth-cas](/auth-verification/auth-cas/) - CAS SSOログイン機能を提供します
- [@nocobase/plugin-auth-ldap](/auth-verification/auth-ldap/) - LDAP SSOログイン機能を提供します
- [@nocobase/plugin-auth-wecom](/auth-verification/auth-wecom/) - WeComログイン機能を提供します
- [@nocobase/plugin-auth-dingtalk](/auth-verification/auth-dingtalk/) - DingTalkログイン機能を提供します

これらのプラグインを使用することで、管理者が適切な認証方式を設定すれば、ユーザーはGoogle WorkspaceやMicrosoft Azureなどのプラットフォームが提供するユーザーIDを使ってシステムに直接ログインできます。また、Auth0、Logto、Keycloakといったプラットフォームツールと連携することも可能です。さらに、開発者は提供されている基本インターフェースを利用して、必要な他の認証方式を簡単に追加・拡張できます。