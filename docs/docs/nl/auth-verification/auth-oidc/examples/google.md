:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::

# Inloggen met Google

> https://developers.google.com/identity/openid-connect/openid-connect

## Google OAuth 2.0-inloggegevens ophalen

[Google Cloud Console](https://console.cloud.google.com/apis/credentials) - Referenties maken - OAuth-client-ID

![](https://static-docs.nocobase.com/0f2946c8643565ecc4ac1324988638c.png)

Ga naar de configuratie-interface en vul de geautoriseerde omleidings-URL in. De omleidings-URL kunt u verkrijgen wanneer u een authenticator toevoegt in NocoBase. Meestal is dit `http(s)://host:port/api/oidc:redirect`. Zie het gedeelte [Gebruikershandleiding - Configuratie](../index.md#configuratie).

![](https://static-docs.nocobase.com/24078bf52ec966a16334894cb3d9d126.png)

## Een nieuwe authenticator toevoegen in NocoBase

Plugininstellingen - Gebruikersauthenticatie - Toevoegen - OIDC

![](https://static-docs.nocobase.com/0e4b1acdef6335aaee2139ae6629977b.png)

Raadpleeg de parameters die worden beschreven in de [Gebruikershandleiding - Configuratie](../index.md#configuratie) om de configuratie van de authenticator te voltooien.