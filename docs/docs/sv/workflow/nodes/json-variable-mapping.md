---
pkg: '@nocobase/plugin-workflow-json-variable-mapping'
---
:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::


# JSON-variabelmappning

> v1.6.0

## Introduktion

Denna funktion används för att mappa komplexa JSON-strukturer från resultat av uppströmsnoder till variabler. Dessa variabler kan sedan användas i efterföljande noder. Till exempel kan egenskapsvärden från resultat av SQL-åtgärder och HTTP-förfrågningsnoder användas direkt i efterföljande steg efter att de har mappats.

:::info{title=Tips}
Till skillnad från JSON-beräkningsnoden stöder JSON-variabelmappningsnoden inte anpassade uttryck och baseras inte på en tredjepartsmotor. Den används endast för att mappa egenskapsvärden i en JSON-struktur, men är enklare att använda.
:::

## Skapa nod

I gränssnittet för arbetsflödeskonfiguration klickar ni på plusknappen ('+') i flödet för att lägga till en "JSON-variabelmappning"-nod:

![Skapa nod](https://static-docs.nocobase.com/20250113173635.png)

## Nodkonfiguration

### Datakälla

Datakällan kan vara resultatet av en uppströmsnod eller ett dataobjekt i processkontexten. Det är oftast ett ostrukturerat dataobjekt, som till exempel resultatet av en SQL-nod eller en HTTP-förfrågningsnod.

![Datakälla](https://static-docs.nocobase.com/20250113173720.png)

### Ange exempeldata

Klistra in exempeldata och klicka på knappen för att analysera, så genereras en lista med variabler automatiskt:

![Ange exempeldata](https://static-docs.nocobase.com/20250113182327.png)

Om det finns variabler i den automatiskt genererade listan som ni inte behöver, kan ni klicka på radera-knappen för att ta bort dem.

:::info{title=Tips}
Exempeldatan är inte det slutgiltiga exekveringsresultatet; den används endast för att underlätta genereringen av variabellistan.
:::

### Sökväg inkluderar arrayindex

Om denna inte är markerad, kommer arrayinnehållet att mappas enligt NocoBase arbetsflödens standardhantering av variabler. Till exempel, om ni anger följande exempel:

```json
{
  "a": 1,
  "b": [
    {
      "c": 2
    },
    {
      "c": 3
    }
  ]
}
```

I de genererade variablerna kommer `b.c` att representera arrayen `[2, 3]`.

Om detta alternativ är markerat, kommer variabelns sökväg att inkludera arrayindexet, till exempel `b.0.c` och `b.1.c`.

![20250113184056](https://static-docs.nocobase.com/20250113184056.png)

När arrayindex inkluderas måste ni säkerställa att arrayindexen i indata är konsekventa; annars kan det leda till ett tolkningsfel.

## Använd i efterföljande noder

I konfigurationen av efterföljande noder kan ni använda de variabler som genererats av JSON-variabelmappningsnoden:

![20250113203658](https://static-docs.nocobase.com/20250113203658.png)

Även om JSON-strukturen kan vara komplex, behöver ni efter mappningen bara välja variabeln för den motsvarande sökvägen.