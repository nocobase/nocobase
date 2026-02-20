---
pkg: '@nocobase/plugin-workflow-json-query'
---
:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::


# JSON-beräkning

## Introduktion

Med hjälp av olika JSON-beräkningsmotorer kan ni beräkna eller transformera komplex JSON-data som genereras av föregående noder, så att de kan användas av efterföljande noder. Till exempel kan resultat från SQL-operationer och HTTP-förfrågningar omvandlas till önskade värden och variabelformat med hjälp av denna nod, för att sedan användas av efterföljande noder.

## Skapa nod

I arbetsflödets konfigurationsgränssnitt klickar ni på plusknappen ("+") i processen för att lägga till en "JSON-beräkning"-nod:

![Skapa nod](https://static-docs.nocobase.com/7de796517539ad9dfc88b7160f1d0dd7.png)

:::info{title=Tips}
Vanligtvis skapas JSON-beräkningsnoden under andra datanoder för att tolka dem.
:::

## Nodkonfiguration

### Tolkningsmotor

JSON-beräkningsnoden stöder olika syntaxer genom olika tolkningsmotorer. Ni kan välja baserat på era preferenser och varje motors funktioner. För närvarande stöds tre tolkningsmotorer:

- [JMESPath](https://jmespath.org/)
- [JSONPath Plus](https://jsonpath-plus.github.io/JSONPath/docs/ts/)
- [JSONata](https://jsonata.org/)

![Motorval](https://static-docs.nocobase.com/29be3b92a62b7d20312d1673e749f2ec.png)

### Datakälla

Datakällan kan vara resultatet från en föregående nod eller ett dataobjekt i arbetsflödets kontext. Det är vanligtvis ett dataobjekt utan en inbyggd struktur, till exempel resultatet från en SQL-nod eller en HTTP-förfrågningsnod.

![Datakälla](https://static-docs.nocobase.com/f5a97e20693b3d30b3a994a576aa282d.png)

:::info{title=Tips}
Vanligtvis är dataobjekten för samlingsrelaterade noder strukturerade via samlingskonfigurationsinformation och behöver i allmänhet inte tolkas av JSON-beräkningsnoden.
:::

### Tolkningsuttryck

Anpassade tolkningsuttryck baserade på tolkningskrav och den valda tolkningsmotorn.

![Tolkningsuttryck](https://static-docs.nocobase.com/181abd162fd32c09b62f6aa1d1cb3ed4.png)

:::info{title=Tips}
Olika motorer erbjuder olika tolkningssyntaxer. För mer information, se dokumentationen via länkarna.
:::

Från och med version `v1.0.0-alpha.15` stöder uttryck variabler. Variabler förhandsgranskas innan den specifika motorn körs, där variablerna ersätts med specifika strängvärden enligt strängmallregler och sammanfogas med andra statiska strängar i uttrycket för att bilda det slutgiltiga uttrycket. Denna funktion är mycket användbar när ni behöver bygga uttryck dynamiskt, till exempel när visst JSON-innehåll kräver en dynamisk nyckel för tolkning.

### Egenskapsmappning

När beräkningsresultatet är ett objekt (eller en array av objekt) kan ni ytterligare mappa de nödvändiga egenskaperna till undervariabler genom egenskapsmappning för användning av efterföljande noder.

![Egenskapsmappning](https://static-docs.nocobase.com/b876abe4ccf6b4709eb8748f21ef3527.png)

:::info{title=Tips}
För ett objekt (eller en array av objekt) som resultat, om ingen egenskapsmappning utförs, kommer hela objektet (eller arrayen av objekt) att sparas som en enda variabel i nodens resultat, och objektets egenskapsvärden kan inte användas direkt som variabler.
:::

## Exempel

Anta att datan som ska tolkas kommer från en föregående SQL-nod som används för att fråga data, och dess resultat är en uppsättning orderdata:

```json
[
  {
    "id": 1,
    "products": [
      {
        "id": 1,
        "title": "Product 1",
        "price": 100,
        "quantity": 1
      },
      {
        "id": 2,
        "title": "Product 2",
        "price": 120,
        "quantity": 2
      }
    ]
  },
  {
    "id": 2,
    "products": [
      {
        "id": 3,
        "title": "Product 3",
        "price": 130,
        "quantity": 1
      },
      {
        "id": 4,
        "title": "Product 4",
        "price": 140,
        "quantity": 2
      }
    ]
  }
]
```

Om vi behöver tolka och beräkna det totala priset för de två beställningarna i datan, och sammanställa det med motsvarande order-ID till ett objekt för att uppdatera beställningens totala pris, kan vi konfigurera det enligt följande:

![Exempel - Tolka SQL-konfiguration](https://static-docs.nocobase.com/e62322a868b26ff98120bfcd6dcdb3bd.png)

1. Välj JSONata-tolkningsmotorn;
2. Välj resultatet från SQL-noden som datakälla;
3. Använd JSONata-uttrycket `$[0].{"id": id, "total": products.(price * quantity)}` för att tolka;
4. Välj egenskapsmappning för att mappa `id` och `total` till undervariabler;

Det slutgiltiga tolkningsresultatet är följande:

```json
[
  {
    "id": 1,
    "total": 340
  },
  {
    "id": 2,
    "total": 410
  }
]
```

Loopa sedan igenom den resulterande orderarrayen för att uppdatera beställningarnas totala pris.

![Uppdatera motsvarande orders totala pris](https://static-docs.nocobase.com/b3329b0efe4471f5eed1f0673bef740e.png)