:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::

# Logga in med Google

> https://developers.google.com/identity/openid-connect/openid-connect

## Hämta Google OAuth 2.0-autentiseringsuppgifter

[Google Cloud Console](https://console.cloud.google.com/apis/credentials) – Skapa autentiseringsuppgifter – OAuth-klient-ID

![](https://static-docs.nocobase.com/0f2946c8643565ecc4ac1324988638c.png)

Gå till konfigurationsgränssnittet och fyll i den auktoriserade omdirigerings-URL:en. Omdirigerings-URL:en kan hämtas när du lägger till en autentiserare i NocoBase. Vanligtvis är den `http(s)://host:port/api/oidc:redirect`. Se avsnittet [Användarmanual – Konfiguration](../index.md#configuration).

![](https://static-docs.nocobase.com/24078bf52ec966a16334984cb3d9d126.png)

## Lägg till en ny autentiserare i NocoBase

Plugininställningar – Användarautentisering – Lägg till – OIDC

![](https://static-docs.nocobase.com/0e4b1acdef6335aaee2139ae6629977b.png)

Se parametrarna som beskrivs i [Användarmanual – Konfiguration](../index.md#configuration) för att slutföra konfigurationen av autentiseraren.