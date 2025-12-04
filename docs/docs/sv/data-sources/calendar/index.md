---
pkg: "@nocobase/plugin-calendar"
---
:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::


# Kalenderblock

## Introduktion

Kalenderblocket visar händelser och datumrelaterad data i en kalendervy, vilket är perfekt för att schemalägga möten, planera aktiviteter och liknande scenarier.

## Installation

Detta är en inbyggd plugin, så ingen installation krävs.

## Lägga till block

![20250403220300](https://static-docs.nocobase.com/20250403220300.png)

1.  Titel-fält: Används för att visa information på kalenderfälten. För närvarande stöds fälttyper som `input`, `select`, `phone`, `email`, `radioGroup` och `sequence`. De fälttyper som stöds för titeln kan utökas via en plugin.
2.  Starttid: Uppgiftens starttid.
3.  Sluttid: Uppgiftens sluttid.

<video width="100%" height="440" controls>
      <source src="https://static-docs.nocobase.com/20240419201640.mp4" type="video/mp4">
</video>

När du klickar på ett uppgiftsfält markeras det och ett popup-fönster visas.

![20240408171928](https://static-docs.nocobase.com/20240408171928.png)

## Blockkonfiguration

![20240419203321](https://static-docs.nocobase.com/20240419203321.png)

### Visa månkalender

![20240419203603](https://static-docs.nocobase.com/20240419203603.png)

### Ange dataintervall

![20240419203751](https://static-docs.nocobase.com/20240419203751.png)

För mer information, se .

### Ange blockhöjd

Exempel: Justera höjden på orderkalenderblocket. Ingen rullningslist kommer att visas inuti kalenderblocket.

![20240605215742](https://static-docs.nocobase.com/20240605215742.gif)

För mer information, se .

### Fält för bakgrundsfärg

:::info{title=Tips}
NocoBase-versionen måste vara v1.4.0-beta eller högre.
:::

Detta alternativ kan användas för att konfigurera bakgrundsfärgen för kalenderhändelser. Så här använder ni det:

1.  Kalenderdatabasen behöver ha ett fält av typen **Enkelval (Single select)** eller **Radioknapp (Radio group)**, och detta fält måste vara konfigurerat med färger.
2.  Gå sedan tillbaka till kalenderblockets konfigurationsgränssnitt och välj det fält ni just konfigurerade med färger under **Fält för bakgrundsfärg**.
3.  Slutligen kan ni prova att välja en färg för en kalenderhändelse och klicka på skicka. Ni kommer då att se att färgen har tillämpats.

![20240914192017_rec_](https://static-docs.nocobase.com/20240914192017_rec_.gif)

### Veckans startdag

> Stöds i version v1.7.7 och senare

Kalenderblocket stöder inställning av veckans startdag, vilket gör att ni kan välja **söndag** eller **måndag** som veckans första dag. Standardstartdagen är **måndag**, vilket gör det enklare för användare att anpassa kalendervyn efter regionala vanor och bättre möta faktiska användarbehov.

![20250707165958](https://static-docs.nocobase.com/20250707165958.png)

## Konfigurera åtgärder

![20240419203424](https://static-docs.nocobase.com/20240419203424.png)

### Idag

Knappen "Idag" i kalenderblocket erbjuder en smidig navigeringsfunktion som gör att ni snabbt kan återgå till den aktuella dagens kalendervy efter att ha bläddrat till andra datum.

![20240419203514](https://static-docs.nocobase.com/20240419203514.png)

### Växla vy

Standardvyn är månad.

![20240419203349](https://static-docs.nocobase.com/20240419203349.png)