:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::

# Ställa in dataintervall

## Introduktion

Att ställa in dataintervallet för ett relationsfält liknar hur ni ställer in dataintervallet för ett block. Det definierar standardfiltervillkor för den relaterade datan.

## Användningsinstruktioner

![20251028211328](https://static-docs.nocobase.com/20251028211328.png)

### Statiskt värde

Exempel: Endast produkter som inte har raderats kan väljas för koppling.

> Fältlistan innehåller fält från relationsfältets mål-samling.

![20251028211434](https://static-docs.nocobase.com/20251028211434.png)

### Variabelvärde

Exempel: Endast produkter vars tjänstedatum är senare än orderdatumet kan väljas för koppling.

![20251028211727](https://static-docs.nocobase.com/20251028211727.png)

För mer information om variabler, se [Variabler](/interface-builder/variables)

### Länkning av relationsfält

Länkning mellan relationsfält uppnås genom att ställa in dataintervallet.

Exempel: Samlingen `Orders` (Order) har ett en-till-många-relationsfält "Opportunity Product" (Affärsmöjlighetsprodukt) och ett många-till-en-relationsfält "Opportunity" (Affärsmöjlighet). Samlingen `Opportunity Product` (Affärsmöjlighetsprodukt) har ett många-till-en-relationsfält "Opportunity" (Affärsmöjlighet). I orderformulärblocket filtreras den valbara datan för "Opportunity Product" för att endast visa de affärsmöjlighetsprodukter som är kopplade till den för närvarande valda "Opportunity" i formuläret.

![20251028212943](https://static-docs.nocobase.com/20251028212943.png)

![20240422154145](https://static-docs.nocobase.com/20240422154145.png)

![20251028213408](https://static-docs.nocobase.com/20251028213408.gif)