:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::

# Autenticación de Usuarios

El módulo de autenticación de usuarios de NocoBase se compone principalmente de dos partes:

- El `plugin` `@nocobase/auth` en el núcleo define interfaces extensibles y middleware relacionados con la autenticación de usuarios, como el inicio de sesión, el registro y la verificación. También se utiliza para registrar y gestionar diversos métodos de autenticación extendidos.
- El `plugin` `@nocobase/plugin-auth` se encarga de inicializar el módulo de gestión de autenticación en el núcleo y, además, proporciona el método básico de autenticación por nombre de usuario (o correo electrónico) y contraseña.

> Es necesario utilizarlo en conjunto con la funcionalidad de gestión de usuarios que ofrece el [`plugin` `@nocobase/plugin-users`](/users-permissions/user).

Además, NocoBase ofrece otros `plugins` con diversos métodos de autenticación de usuarios:

- [`@nocobase/plugin-auth-sms`](/auth-verification/auth-sms/) - Ofrece la funcionalidad de inicio de sesión mediante verificación por SMS.
- [`@nocobase/plugin-auth-saml`](/auth-verification/auth-saml/) - Ofrece la funcionalidad de inicio de sesión único (SSO) con SAML.
- [`@nocobase/plugin-auth-oidc`](/auth-verification/auth-oidc/) - Ofrece la funcionalidad de inicio de sesión único (SSO) con OIDC.
- [`@nocobase/plugin-auth-cas`](/auth-verification/auth-cas/) - Ofrece la funcionalidad de inicio de sesión único (SSO) con CAS.
- [`@nocobase/plugin-auth-ldap`](/auth-verification/auth-ldap/) - Ofrece la funcionalidad de inicio de sesión único (SSO) con LDAP.
- [`@nocobase/plugin-auth-wecom`](/auth-verification/auth-wecom/) - Ofrece la funcionalidad de inicio de sesión con WeCom.
- [`@nocobase/plugin-auth-dingtalk`](/auth-verification/auth-dingtalk/) - Ofrece la funcionalidad de inicio de sesión con DingTalk.

Gracias a estos `plugins`, una vez que el administrador configura el método de autenticación correspondiente, los usuarios pueden iniciar sesión directamente en el sistema utilizando las identidades de usuario proporcionadas por plataformas como Google Workspace o Microsoft Azure. También es posible integrar herramientas de plataformas como Auth0, Logto y Keycloak. Además, los desarrolladores pueden ampliar fácilmente otras formas de autenticación que necesiten, utilizando las interfaces básicas que proporcionamos.