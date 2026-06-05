:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::

# Autenticação de Usuários

O módulo de autenticação de usuários do NocoBase é composto principalmente por duas partes:

- O `@nocobase/auth` no *kernel* define interfaces e *middleware* extensíveis relacionados à autenticação de usuários, como login, registro e verificação. Ele também é usado para registrar e gerenciar diversos métodos de autenticação estendidos.
- O `@nocobase/plugin-auth` (um **plugin**) é usado para inicializar o módulo de gerenciamento de autenticação no *kernel* e também oferece o método básico de autenticação por nome de usuário (ou e-mail) e senha.

> É necessário utilizá-lo em conjunto com a funcionalidade de gerenciamento de usuários oferecida pelo [`@nocobase/plugin-users` **plugin**](/users-permissions/user).

Além disso, o NocoBase também oferece outros **plugins** para diversos métodos de autenticação de usuários:

- [`@nocobase/plugin-auth-sms`](/auth-verification/auth-sms/) - Oferece a funcionalidade de login com verificação por SMS
- [`@nocobase/plugin-auth-saml`](/auth-verification/auth-saml/) - Oferece a funcionalidade de login SAML SSO
- [`@nocobase/plugin-auth-oidc`](/auth-verification/auth-oidc/) - Oferece a funcionalidade de login OIDC SSO
- [`@nocobase/plugin-auth-cas`](/auth-verification/auth-cas/) - Oferece a funcionalidade de login CAS SSO
- [`@nocobase/plugin-auth-ldap`](/auth-verification/auth-ldap/) - Oferece a funcionalidade de login LDAP SSO
- [`@nocobase/plugin-auth-wecom`](/auth-verification/auth-wecom/) - Oferece a funcionalidade de login com WeCom
- [`@nocobase/plugin-auth-dingtalk`](/auth-verification/auth-dingtalk/) - Oferece a funcionalidade de login com DingTalk

Com esses **plugins**, depois que o administrador configura o método de autenticação correspondente, os usuários podem fazer login no sistema diretamente usando a identidade de usuário fornecida por plataformas como Google Workspace e Microsoft Azure. Também é possível integrar com ferramentas como Auth0, Logto e Keycloak. Além disso, os desenvolvedores podem expandir facilmente outros métodos de autenticação que precisarem, utilizando as interfaces básicas que oferecemos.