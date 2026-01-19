:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::


# Přihlášení pomocí Google

> https://developers.google.com/identity/openid-connect/openid-connect

## Získání pověření Google OAuth 2.0

Přejděte do [Google Cloud Console](https://console.cloud.google.com/apis/credentials) a vyberte: Vytvořit pověření (Create Credentials) - ID klienta OAuth (OAuth Client ID).

![](https://static-docs.nocobase.com/0f2946c8643565ecc4ac13249882638c.png)

Přejděte do konfiguračního rozhraní a vyplňte autorizovanou URL pro přesměrování. Tuto URL pro přesměrování získáte při přidávání autentikátoru v NocoBase; obvykle má formát `http(s)://host:port/api/oidc:redirect`. Podrobnosti naleznete v části [Uživatelská příručka - Konfigurace](../index.md#konfigurace).

![](https://static-docs.nocobase.com/24078bf52ec96616334894cb3d9d126.png)

## Přidání nového autentikátoru v NocoBase

Přejděte do: Nastavení pluginů (Plugin Settings) - Uživatelská autentizace (User Authentication) - Přidat (Add) - OIDC.

![](https://static-docs.nocobase.com/0e4b1acdef6335aaee2139ae6629977b.png)

Pro dokončení konfigurace autentikátoru se řiďte parametry popsanými v [Uživatelské příručce - Konfigurace](../index.md#konfigurace).