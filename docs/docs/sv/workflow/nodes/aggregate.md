---
pkg: '@nocobase/plugin-workflow-aggregate'
---
:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::


# Aggregerad fråga

## Introduktion

Denna funktion används för att utföra aggregeringsfrågor på data i en samling som uppfyller specifika villkor, och returnerar de motsvarande statistiska resultaten. Den är ofta användbar för att bearbeta statistik för rapporter.

Nodens implementering bygger på databasens aggregeringsfunktioner. För närvarande stöder den endast statistik på ett enskilt fält i en samling. Det numeriska resultatet av statistiken sparas i nodens utdata för att kunna användas av efterföljande noder.

## Installation

Inbyggd plugin, ingen installation krävs.

## Skapa nod

I arbetsflödets konfigurationsgränssnitt klickar du på plusknappen ("+") i flödet för att lägga till en "Aggregerad fråga"-nod:

![Skapa aggregerad fråga-nod](https://static-docs.nocobase.com/7f9d806ebf5064f80c30f8b67f316f0f.png)

## Nodkonfiguration

![Aggregerad fråga-nod_Nodkonfiguration](https://static-docs.nocobase.com/5732f747b999230567c6bb5e986fd2.png)

### Aggregeringsfunktion

Stöder 5 aggregeringsfunktioner från SQL: `COUNT`, `SUM`, `AVG`, `MIN` och `MAX`. Välj en av dem för att utföra en aggregerad fråga på datan.

### Måltyp

Målet för den aggregerade frågan kan väljas på två sätt. Antingen väljer du direkt målsamlingen och ett av dess fält, eller så väljer du en relaterad samling med en-till-många-relation och dess fält via ett befintligt dataobjekt i arbetsflödets kontext för att utföra aggregeringsfrågan.

### Deduplicering

Detta motsvarar `DISTINCT` i SQL. Fältet för deduplicering är detsamma som det valda samlingsfältet. Att välja olika fält för dessa två stöds för närvarande inte.

### Filtervillkor

I likhet med filtervillkoren vid en vanlig samlingsfråga kan du använda kontextvariabler från arbetsflödet.

## Exempel

Aggregeringsmålet "Samlingsdata" är relativt enkelt att förstå. Här använder vi "räkna det totala antalet artiklar i en kategori efter att en ny artikel har lagts till" som exempel för att introducera användningen av aggregeringsmålet "Relaterad samlingsdata".

Börja med att skapa två samlingar: "Artiklar" och "Kategorier". Samlingen "Artiklar" har ett många-till-ett-relationsfält som pekar på samlingen "Kategorier", och ett omvänt ett-till-många-relationsfält skapas också från "Kategorier" till "Artiklar":

| Fältnamn | Typ                  |
| -------- | -------------------- |
| Titel    | Enkelradstext        |
| Kategori | Många-till-ett (Kategorier) |

| Fältnamn    | Typ                  |
| ----------- | -------------------- |
| Kategorinamn | Enkelradstext        |
| Artiklar    | Ett-till-många (Artiklar) |

Därefter skapar du ett arbetsflöde som utlöses av en samlingshändelse. Välj att det ska utlösas när ny data läggs till i samlingen "Artiklar".

Lägg sedan till en aggregerad fråga-nod och konfigurera den enligt följande:

![Aggregerad fråga-nod_Exempel_Nodkonfiguration](https://static-docs.nocobase.com/542272e636c6c0a567373d1b37ddda78.png)

På så sätt, efter att arbetsflödet har utlösts, kommer noden för aggregerad fråga att räkna antalet alla artiklar i kategorin för den nyligen tillagda artikeln och spara resultatet som nodens utdata.

:::info{title=Tips}
Om du behöver använda relationsdata från samlingshändelsens utlösare måste du konfigurera de relevanta fälten under "Förladda associerad data" i utlösaren, annars kan de inte väljas.
:::