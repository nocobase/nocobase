# Sign in with Google

> https://developers.google.com/identity/openid-connect/openid-connect

## Get Google OAuth 2.0 credentials

[Google Cloud Console](https://console.cloud.google.com/apis/credentials) - Create credentials - OAuth client ID


![](https://static-docs.nocobase.com/0f2946c8643565ecc4ac13249882638c.png)


Go to the configuration interface and fill in the authorized redirect URL. The redirect URL can be obtained when adding a new authenticator in NocoBase, and it is usually `http(s)://host:port/api/oidc:redirect`. See the [User Manual - Configuration](../index.md#configuration) section.


![](https://static-docs.nocobase.com/24078bf52ec966a16334894cb3d9d126.png)


## Add an authenticator on NocoBase

Plugin settings - User Authentication - Add - OIDC


![](https://static-docs.nocobase.com/0e4b1acdef6335aaee2139ae6629977b.png)


Refer to the parameters introduced in the [User Manual - Configuration](../index.md#configuration) to complete the authenticator configuration.