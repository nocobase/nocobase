:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::


# Autentizace uživatelů

Modul pro autentizaci uživatelů v NocoBase se skládá hlavně ze dvou částí:

- `@nocobase/auth` v jádře definuje rozšiřitelné rozhraní a middleware související s přihlášením, registrací a ověřováním uživatelů. Zároveň slouží k registraci a správě různých rozšířených metod autentizace.
- `@nocobase/plugin-auth` (plugin) se používá k inicializaci modulu pro správu autentizace v jádře a zároveň poskytuje základní metodu autentizace pomocí uživatelského jména (nebo e-mailu) a hesla.

> Je třeba jej používat ve spojení s funkcí správy uživatelů, kterou poskytuje [`@nocobase/plugin-users` plugin](/users-permissions/user).

Kromě toho NocoBase nabízí i další různé pluginy pro metody autentizace uživatelů:

- [@nocobase/plugin-auth-sms](/auth-verification/auth-sms/) - Poskytuje funkci přihlášení pomocí SMS ověření
- [@nocobase/plugin-auth-saml](/auth-verification/auth-saml/) - Poskytuje funkci přihlášení pomocí SAML SSO
- [@nocobase/plugin-auth-oidc](/auth-verification/auth-oidc/) - Poskytuje funkci přihlášení pomocí OIDC SSO
- [@nocobase/plugin-auth-cas](/auth-verification/auth-cas/) - Poskytuje funkci přihlášení pomocí CAS SSO
- [@nocobase/plugin-auth-ldap](/auth-verification/auth-ldap/) - Poskytuje funkci přihlášení pomocí LDAP SSO
- [@nocobase/plugin-auth-wecom](/auth-verification/auth-wecom/) - Poskytuje funkci přihlášení pomocí WeCom
- [@nocobase/plugin-auth-dingtalk](/auth-verification/auth-dingtalk/) - Poskytuje funkci přihlášení pomocí DingTalk

Díky výše uvedeným pluginům, jakmile administrátor nakonfiguruje odpovídající metodu autentizace, mohou se uživatelé přímo přihlásit do systému pomocí uživatelské identity poskytované platformami jako Google Workspace, Microsoft Azure a dalšími. Zároveň se mohou připojit k nástrojům platforem jako Auth0, Logto, Keycloak a podobně. Kromě toho mohou vývojáři snadno rozšířit další metody autentizace, které potřebují, prostřednictvím základních rozhraní, která poskytujeme.