---
pkg: "@nocobase/plugin-wecom"
---
:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::



# Synkronisera användardata från WeChat Work

## Introduktion

**WeChat Work**-pluginet stöder synkronisering av användar- och avdelningsdata från WeChat Work.

## Skapa och konfigurera en anpassad WeChat Work-applikation

Först behöver ni skapa en anpassad applikation i WeChat Works administratörskonsol och hämta **Corp ID**, **AgentId** samt **Secret**.

Se [Användarautentisering - WeChat Work](/auth-verification/auth-wecom/).

## Lägg till en synkroniseringsdatakälla i NocoBase

Gå till Användare och behörigheter - Synkronisering - Lägg till, och fyll i den information ni har hämtat.

![](https://static-docs.nocobase.com/202412041251867.png)

## Konfigurera synkronisering av kontakter

Gå till WeChat Works administratörskonsol - Säkerhet och hantering - Hanteringsverktyg, och klicka på Synkronisering av kontakter.

![](https://static-docs.nocobase.com/202412041249958.png)

Konfigurera enligt bilden och ange företagets betrodda IP-adress.

![](https://static-docs.nocobase.com/202412041250776.png)

Nu kan ni fortsätta med synkroniseringen av användardata.

## Konfigurera händelsemottagarservern

Om ni vill att ändringar i användar- och avdelningsdata på WeChat Work ska synkroniseras till NocoBase-applikationen i tid, kan ni göra ytterligare inställningar.

Efter att ni har fyllt i den tidigare konfigurationsinformationen kan ni kopiera URL:en för återuppringningsmeddelanden för kontakter.

![](https://static-docs.nocobase.com/202412041256547.png)

Fyll i den i WeChat Works inställningar, hämta Token och EncodingAESKey, och slutför konfigurationen av NocoBase användarsynkroniseringsdatakälla.

![](https://static-docs.nocobase.com/202412041257947.png)