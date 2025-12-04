---
pkg: '@nocobase/plugin-user-data-sync'
---
:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::


# Användardatasynkronisering

## Introduktion

Denna funktion låter dig registrera och hantera källor för användardatasynkronisering. Som standard tillhandahålls ett HTTP API, men du kan utöka med ytterligare **datakälla**or via **plugin**s. Funktionen stöder synkronisering av data till **användar**- och **avdelnings**-**samling**arna som standard, med möjlighet att utöka synkroniseringen till andra målresurser med hjälp av **plugin**s.

## Hantering av datakällor och datasynkronisering

![](https://static-docs.nocobase.com/202412041043465.png)

:::info
Om inga **plugin**s som tillhandahåller källor för användardatasynkronisering är installerade, kan användardata synkroniseras via HTTP API:et. Se [**Datakälla** - HTTP API](./sources/api.md).
:::

## Lägga till en datakälla

När du har installerat ett **plugin** som tillhandahåller en källa för användardatasynkronisering, kan du lägga till den motsvarande **datakälla**n. Endast aktiverade **datakälla**or kommer att visa knapparna "Synkronisera" och "Uppgift".

> Exempel: WeCom

![](https://static-docs.nocobase.com/202412041053785.png)

## Synkronisera data

Klicka på knappen "Synkronisera" för att påbörja datasynkroniseringen.

![](https://static-docs.nocobase.com/202412041055022.png)

Klicka på knappen "Uppgift" för att se synkroniseringsstatusen. Efter lyckad synkronisering kan du se data i listorna för användare och avdelningar.

![](https://static-docs.nocobase.com/202412041202337.png)

För misslyckade synkroniseringsuppgifter kan du klicka på "Försök igen".

![](https://static-docs.nocobase.com/202412041058337.png)

Vid synkroniseringsfel kan du felsöka problemet via systemloggarna. Dessutom sparas råa synkroniseringsposter i katalogen `user-data-sync` under applikationsloggmappen.

![](https://static-docs.nocobase.com/202412041205655.png)