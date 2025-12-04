---
pkg: '@nocobase/plugin-two-factor-authentication'
---
:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::


# Tvåfaktorsautentisering (2FA)

## Introduktion

Tvåfaktorsautentisering (2FA) är en extra säkerhetsåtgärd som används vid inloggning till applikationer. När 2FA är aktiverat måste användare, utöver sitt lösenord, ange ytterligare en form av autentisering, till exempel en OTP-kod eller TOTP.

:::info{title=Obs}
För närvarande gäller 2FA-processen endast för lösenordsbaserade inloggningar. Om er applikation har aktiverat SSO eller andra autentiseringsmetoder, vänligen använd den multifaktorautentisering (MFA) som tillhandahålls av respektive IdP.
:::

## Aktivera plugin

![](https://static-docs.nocobase.com/202502282108145.png)

## Administratörskonfiguration

Efter att ni har aktiverat pluginet kommer en konfigurationssida för 2FA att läggas till på sidan för autentiseringshantering.

Administratörer måste markera alternativet ”Aktivera tvåfaktorsautentisering (2FA) för alla användare” och välja en tillgänglig autentiseringstyp att koppla. Om inga autentiserare är tillgängliga måste ni först skapa en ny autentiserare på sidan för verifieringshantering. Se [Verifiering](../verification/index.md) för mer information.

![](https://static-docs.nocobase.com/202502282109802.png)

## Användarinloggning

När 2FA har aktiverats kommer användare som loggar in med lösenord att gå igenom 2FA-verifieringsprocessen.

Om en användare ännu inte har kopplat någon av de angivna autentiserarna, kommer ni att uppmanas att koppla en. När kopplingen är framgångsrik kan ni komma åt applikationen.

![](https://static-docs.nocobase.com/202502282110829.png)

Om en användare redan har kopplat en av de angivna autentiserarna, kommer ni att behöva verifiera er identitet med den kopplade autentiseraren. Efter godkänd verifiering kan ni komma åt applikationen.

![](https://static-docs.nocobase.com/202502282110148.png)

Efter lyckad inloggning kan användare koppla ytterligare autentiserare på sidan för verifieringshantering i sitt personliga center.

![](https://static-docs.nocobase.com/202502282110024.png)