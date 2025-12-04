---
pkg: '@nocobase/plugin-verification-totp-authenticator'
---
:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::


# Verifiering: TOTP-autentiserare

## Introduktion

TOTP-autentiseraren gör det möjligt för användare att koppla valfri autentiserare som följer TOTP-specifikationen (Time-based One-Time Password) (<a href="https://www.rfc-editor.org/rfc/rfc6238" target="_blank">RFC-6238</a>) och utföra identitetsverifiering med ett tidsbaserat engångslösenord (TOTP).

## Administratörskonfiguration

Navigera till sidan för verifieringshantering.

![](https://static-docs.nocobase.com/202502271726791.png)

Lägg till - TOTP-autentiserare

![](https://static-docs.nocobase.com/202502271745028.png)

Utöver en unik identifierare och titel kräver TOTP-autentiseraren ingen ytterligare konfiguration.

![](https://static-docs.nocobase.com/202502271746034.png)

## Användarkoppling

Efter att autentiseraren har lagts till kan användare koppla TOTP-autentiseraren i sitt personliga område för verifieringshantering.

![](https://static-docs.nocobase.com/202502272252324.png)

:::warning
Pluginen tillhandahåller för närvarande ingen mekanism för återställningskoder. När TOTP-autentiseraren har kopplats, rekommenderas användare att förvara den säkert. Om autentiseraren av misstag skulle förloras, kan ni använda en alternativ verifieringsmetod för att verifiera er identitet, koppla bort autentiseraren och sedan koppla den på nytt.
:::

## Användarfrånkoppling

För att koppla bort autentiseraren krävs verifiering med den redan kopplade verifieringsmetoden.

![](https://static-docs.nocobase.com/202502282103205.png)