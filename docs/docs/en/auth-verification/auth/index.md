# User Authentication

NocoBase's user authentication module is mainly composed of two parts:

- `@nocobase/auth` in the core defines extensible interfaces and middleware related to user authentication such as login, registration, and validation. It is also used to register and manage various extended authentication methods.
- `@nocobase/plugin-auth` in the plugin is used to initialize the authentication management module in the core, while providing the basic username (or email)/password authentication method.

> It needs to be used in conjunction with the user management feature provided by the [`@nocobase/plugin-users` plugin](/users-permissions/user).

In addition, NocoBase also provides various other user authentication method plugins:

- [@nocobase/plugin-auth-sms](/auth-verification/auth-sms/) - Provides SMS verification login feature.
- [@nocobase/plugin-auth-saml](/auth-verification/auth-saml/) - Provides SAML SSO login feature.
- [@nocobase/plugin-auth-oidc](/auth-verification/auth-oidc/) - Provides OIDC SSO login feature.
- [@nocobase/plugin-auth-cas](/auth-verification/auth-cas/) - Provides CAS SSO login feature.
- [@nocobase/plugin-auth-ldap](/auth-verification/auth-ldap/) - Provides LDAP SSO login feature.
- [@nocobase/plugin-auth-wecom](/auth-verification/auth-wecom/) - Provides WeCom login feature.
- [@nocobase/plugin-auth-dingtalk](/auth-verification/auth-dingtalk/) - Provides DingTalk login feature.

With these plugins, after an administrator configures the corresponding authentication methods, users can directly log into the system using identities provided by platforms like Google Workspace and Microsoft Azure. They can also connect to platform tools like Auth0, Logto, and Keycloak. In addition, developers can easily extend other authentication methods they need through the basic interfaces we provide.