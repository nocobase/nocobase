:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::

# Användarautentisering

NocoBase användarautentiseringsmodul består huvudsakligen av två delar:

- `@nocobase/auth` i kärnan definierar utbyggbara gränssnitt och middleware för inloggning, registrering, verifiering och andra användarautentiseringsrelaterade funktioner. Den används också för att registrera och hantera olika utökade autentiseringsmetoder.
- `@nocobase/plugin-auth` (en plugin) används för att initialisera autentiseringshanteringsmodulen i kärnan och tillhandahåller även den grundläggande autentiseringsmetoden med användarnamn (eller e-post) och lösenord.

> Denna modul behöver användas tillsammans med användarhanteringsfunktionen som tillhandahålls av [`@nocobase/plugin-users` plugin](/users-permissions/user).

Utöver detta erbjuder NocoBase även flera andra plugin för användarautentisering:

- [@nocobase/plugin-auth-sms](/auth-verification/auth-sms/) - Tillhandahåller inloggning med SMS-verifiering.
- [@nocobase/plugin-auth-saml](/auth-verification/auth-saml/) - Tillhandahåller SAML SSO-inloggning.
- [@nocobase/plugin-auth-oidc](/auth-verification/auth-oidc/) - Tillhandahåller OIDC SSO-inloggning.
- [@nocobase/plugin-auth-cas](/auth-verification/auth-cas/) - Tillhandahåller CAS SSO-inloggning.
- [@nocobase/plugin-auth-ldap](/auth-verification/auth-ldap/) - Tillhandahåller LDAP SSO-inloggning.
- [@nocobase/plugin-auth-wecom](/auth-verification/auth-wecom/) - Tillhandahåller inloggning med WeCom.
- [@nocobase/plugin-auth-dingtalk](/auth-verification/auth-dingtalk/) - Tillhandahåller inloggning med DingTalk.

Med hjälp av dessa plugin kan administratörer, efter att ha konfigurerat den önskade autentiseringsmetoden, låta användare logga in direkt med användaridentiteter från plattformar som Google Workspace och Microsoft Azure. De kan också integrera med plattformsverktyg som Auth0, Logto och Keycloak. Dessutom kan utvecklare enkelt utöka med andra autentiseringsmetoder de behöver, tack vare de grundläggande gränssnitt vi tillhandahåller.