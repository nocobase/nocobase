---
pkg: '@nocobase/plugin-auth'
---
:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::


# Token-säkerhetspolicy

## Introduktion

Token-säkerhetspolicyn är en funktionskonfiguration som är utformad för att skydda systemets säkerhet och förbättra användarupplevelsen. Den omfattar tre huvudsakliga konfigurationsalternativ: "Sessionens giltighetstid", "Tokenens giltighetstid" och "Tidsgräns för uppdatering av utgången token".

## Konfigurationsplats

Konfigurationsplatsen finns under Inställningar för plugin - Säkerhet - Token-policy:

![20250105111821-2025-01-05-11-18-24](https://static-docs.nocobase.com/20250105111821-2025-01-05-11-18-24.png)

## Sessionens giltighetstid

**Definition:**

Sessionens giltighetstid avser den maximala tid som systemet tillåter en användare att vara inloggad och ha en aktiv session efter inloggning.

**Syfte:**

När sessionens giltighetstid har överskridits får användaren ett 401-felmeddelande vid nästa försök att komma åt systemet, och omdirigeras sedan till inloggningssidan för att autentisera sig igen.
Exempel:
Om sessionens giltighetstid är inställd på 8 timmar kommer sessionen att upphöra efter 8 timmar från inloggningstillfället, förutsatt att inga ytterligare interaktioner sker.

**Rekommenderade inställningar:**

- Scenarier med kortvarig användning: Rekommenderas 1-2 timmar för att öka säkerheten.
- Scenarier med långvarigt arbete: Kan ställas in på 8 timmar för att möta verksamhetens behov.

## Tokenens giltighetstid

**Definition:**

Tokenens giltighetstid avser livscykeln för varje token som systemet utfärdar under användarens aktiva session.

**Syfte:**

När en token går ut utfärdar systemet automatiskt en ny token för att upprätthålla sessionens aktivitet.
Varje utgången token får endast uppdateras en gång.

**Rekommenderade inställningar:**

Av säkerhetsskäl rekommenderas det att ställa in den mellan 15 och 30 minuter.
Justeringar kan göras baserat på scenariets krav. Till exempel:
- Scenarier med hög säkerhet: Tokenens giltighetstid kan förkortas till 10 minuter eller mindre.
- Scenarier med låg risk: Tokenens giltighetstid kan förlängas till 1 timme.

## Tidsgräns för uppdatering av utgången token

**Definition:**

Tidsgränsen för uppdatering av utgången token avser det maximala tidsfönster som tillåter en användare att få en ny token genom en uppdateringsåtgärd efter att den ursprungliga token har gått ut.

**Egenskaper:**

- Om uppdateringstidsgränsen överskrids måste användaren logga in igen för att få en ny token.
- Uppdateringsåtgärden förlänger inte sessionens giltighetstid, utan genererar endast en ny token.

**Rekommenderade inställningar:**

Av säkerhetsskäl rekommenderas det att ställa in den mellan 5 och 10 minuter.