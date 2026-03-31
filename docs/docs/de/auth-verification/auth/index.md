:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::

# Benutzerauthentifizierung

Das Benutzerauthentifizierungsmodul von NocoBase besteht hauptsächlich aus zwei Teilen:

- Das `@nocobase/auth` im Kern definiert erweiterbare Schnittstellen und Middleware für die Benutzerauthentifizierung, wie Anmeldung, Registrierung und Verifizierung. Es dient auch dazu, verschiedene erweiterte Authentifizierungsmethoden zu registrieren und zu verwalten.
- Das `@nocobase/plugin-auth` Plugin initialisiert das Authentifizierungsmanagementmodul im Kern und bietet die grundlegende Authentifizierung per Benutzername (oder E-Mail) und Passwort.

> Dies muss in Verbindung mit der Benutzerverwaltungsfunktion des [`@nocobase/plugin-users` Plugins](/users-permissions/user) verwendet werden.

Darüber hinaus bietet NocoBase weitere verschiedene Plugins für die Benutzerauthentifizierung:

- [@nocobase/plugin-auth-sms](/auth-verification/auth-sms/) – Bietet die Anmeldung per SMS-Verifizierung.
- [@nocobase/plugin-auth-saml](/auth-verification/auth-saml/) – Bietet die SAML SSO-Anmeldung.
- [@nocobase/plugin-auth-oidc](/auth-verification/auth-oidc/) – Bietet die OIDC SSO-Anmeldung.
- [@nocobase/plugin-auth-cas](/auth-verification/auth-cas/) – Bietet die CAS SSO-Anmeldung.
- [@nocobase/plugin-auth-ldap](/auth-verification/auth-ldap/) – Bietet die LDAP SSO-Anmeldung.
- [@nocobase/plugin-auth-wecom](/auth-verification/auth-wecom/) – Bietet die WeCom-Anmeldung.
- [@nocobase/plugin-auth-dingtalk](/auth-verification/auth-dingtalk/) – Bietet die DingTalk-Anmeldung.

Mithilfe dieser Plugins können Administratoren die entsprechenden Authentifizierungsmethoden konfigurieren. Benutzer können sich dann direkt mit ihrer Benutzeridentität, die von Plattformen wie Google Workspace oder Microsoft Azure bereitgestellt wird, im System anmelden. Es ist auch möglich, eine Anbindung an Plattform-Tools wie Auth0, Logto oder Keycloak herzustellen. Darüber hinaus können Entwickler über die von uns bereitgestellten Basisschnittstellen auf einfache Weise weitere benötigte Authentifizierungsmethoden erweitern.