---
pkg: '@nocobase/plugin-workflow-request'
---
:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::


# HTTP-begäran

## Introduktion

När ni behöver interagera med ett annat webbsystem kan ni använda HTTP-begäran-noden. När den körs skickar denna nod en HTTP-begäran till den angivna adressen enligt dess konfiguration. Den kan överföra data i JSON- eller `application/x-www-form-urlencoded`-format för att interagera med externa system.

Om ni är bekanta med verktyg för att skicka förfrågningar, som Postman, kommer ni snabbt att behärska användningen av HTTP-begäran-noden. Till skillnad från dessa verktyg kan alla parametrar i HTTP-begäran-noden använda kontextvariabler från det aktuella arbetsflödet, vilket möjliggör en organisk integration med systemets affärsprocesser.

## Installation

Inbyggd plugin, ingen installation krävs.

## Skapa en nod

I konfigurationsgränssnittet för arbetsflödet klickar ni på plusknappen ("+") i flödet för att lägga till en "HTTP-begäran"-nod:

![HTTP-begäran_Lägg till](https://static-docs.nocobase.com/46f2a6fc3f6869c80f8fbd362a54e644.png)

## Nodkonfiguration

![HTTP-begäran-nod_Konfiguration](https://static-docs.nocobase.com/2fcb29af66b892fa704add52e2974a52.png)

### Begäransmetod

Valfria HTTP-begäransmetoder: `GET`, `POST`, `PUT`, `PATCH` och `DELETE`.

### Begärans-URL

URL:en för HTTP-tjänsten, som måste inkludera protokoll-delen (`http://` eller `https://`). Användning av `https://` rekommenderas.

### Begäransdataformat

Detta är `Content-Type` i begäranshuvudet. För format som stöds, se avsnittet "[Begäransbrödtext](#请求体)".

### Konfiguration av begäranshuvud

Nyckel-värde-par för begäranshuvud-sektionen. Värdena kan använda variabler från arbetsflödets kontext.

:::info{title=Tips}
`Content-Type`-begäranshuvudet konfigureras via begäransdataformatet. Ni behöver inte fylla i det här, och eventuella åsidosättningar blir ineffektiva.
:::

### Begäransparametrar

Nyckel-värde-par för begäransfrågedelen. Värdena kan använda variabler från arbetsflödets kontext.

### Begäransbrödtext

Brödtextdelen av begäran. Olika format stöds beroende på vilken `Content-Type` som valts.

#### `application/json`

Stöder standard JSON-formaterad text. Ni kan infoga variabler från arbetsflödets kontext med hjälp av variabelknappen i det övre högra hörnet av textredigeraren.

:::info{title=Tips}
Variabler måste användas inom en JSON-sträng, till exempel: `{ "a": "{{$context.data.a}}" }`.
:::

#### `application/x-www-form-urlencoded`

Nyckel-värde-par-format. Värdena kan använda variabler från arbetsflödets kontext. När variabler inkluderas kommer de att tolkas som en strängmall och sammanfogas till det slutliga strängvärdet.

#### `application/xml`

Stöder standard XML-formaterad text. Ni kan infoga variabler från arbetsflödets kontext med hjälp av variabelknappen i det övre högra hörnet av textredigeraren.

#### `multipart/form-data` <Badge>v1.8.0+</Badge>

Stöder nyckel-värde-par för formulärdata. Filer kan laddas upp när datatypen är inställd på ett filobjekt. Filer kan endast väljas via variabler från befintliga filobjekt i kontexten, till exempel resultatet av en fråga mot en filsamling eller relaterad data från en associerad filsamling.

:::info{title=Tips}
När ni väljer fildata, se till att variabeln motsvarar ett enskilt filobjekt, inte en lista med filer (vid en fråga med en-till-många- eller många-till-många-relation kommer värdet för relationsfältet att vara en array).
:::

### Tidsgränsinställningar

När en begäran inte svarar under en längre tid kan tidsgränsinställningen användas för att avbryta dess exekvering. Om begäran överskrider tidsgränsen kommer det aktuella arbetsflödet att avslutas i förtid med en misslyckad status.

### Ignorera misslyckanden

Begäran-noden anser att standard HTTP-statuskoder mellan `200` och `299` (inklusive) är framgångsrika, och alla andra anses vara misslyckade. Om alternativet "Ignorera misslyckade begäranden och fortsätt arbetsflödet" är markerat, kommer de efterföljande noderna i arbetsflödet att fortsätta exekveras även om begäran misslyckas.

## Använda svarsresultatet

Svarsresultatet från en HTTP-begäran kan parsas av [JSON-fråga](./json-query.md)-noden för användning i efterföljande noder.

Från och med version `v1.0.0-alpha.16` kan tre delar av begäran-nodens svarsresultat användas som separata variabler:

*   Svarsstatuskod
*   Svarshuvuden
*   Svarsdata

![HTTP-begäran-nod_Använda svarsresultat](https://static-docs.nocobase.com/20240529110610.png)

Svarsstatuskoden är vanligtvis en standard HTTP-statuskod i numerisk form, som `200`, `403` etc. (enligt vad tjänsteleverantören anger).

Svarshuvudena (Response headers) är i JSON-format. Både huvudena och den JSON-formaterade svarsdatan behöver fortfarande parsas med en JSON-nod innan de kan användas.

## Exempel

Till exempel kan vi använda begäran-noden för att ansluta till en molnplattform för att skicka SMS-aviseringar. Konfigurationen för ett moln-SMS-API kan se ut som följande (ni behöver konsultera det specifika API:ets dokumentation för att anpassa parametrarna):

![HTTP-begäran-nod_Konfiguration](https://static-docs.nocobase.com/20240515124004.png)

När arbetsflödet triggar denna nod kommer den att anropa SMS-API:et med det konfigurerade innehållet. Om begäran lyckas kommer ett SMS att skickas via moln-SMS-tjänsten.