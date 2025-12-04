---
pkg: '@nocobase/plugin-workflow-date-calculation'
---
:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::


# Datumberäkning

## Introduktion

Noden för datumberäkning erbjuder nio beräkningsfunktioner, inklusive att lägga till en tidsperiod, subtrahera en tidsperiod, formaterad utdata av en tidssträng och omvandling av tidsenheter. Varje funktion har specifika indata- och utdatatyper och kan även ta emot resultat från andra noder som parametervariabler. Den använder en beräkningspipeline för att kedja ihop resultaten från konfigurerade funktioner för att slutligen få en förväntad utdata.

## Skapa nod

I gränssnittet för arbetsflödeskonfiguration klickar ni på plusknappen ("+") i flödet för att lägga till en nod för "Datumberäkning".

![Datumberäkningsnod_Skapa nod](https://static-docs.nocobase.com/[图片].png)

## Nodkonfiguration

![Datumberäkningsnod_Nodkonfiguration](https://static-docs.nocobase.com/20240817184423.png)

### Indatavärde

Indatavärdet kan vara en variabel eller en datumkonstant. Variabeln kan vara den data som utlöste detta arbetsflöde eller resultatet från en uppströmsnod i detta arbetsflöde. För konstanten kan ni välja vilket datum som helst.

### Indatavärdestyp

Avser typen av indatavärde. Det finns två möjliga värden.

*   Datumtyp: Betyder att indatavärdet i slutändan kan konverteras till en datum- och tidstyp, som till exempel en numerisk tidsstämpel eller en sträng som representerar tid.
*   Numerisk typ: Eftersom indatavärdets typ påverkar valet av följande tidsberäkningssteg är det nödvändigt att korrekt välja indatavärdets typ.

### Beräkningssteg

Varje beräkningssteg består av en beräkningsfunktion och dess parameterkonfiguration. Det använder en pipeline-design, där resultatet från den föregående funktionens beräkning fungerar som indatavärde för nästa funktions beräkning. På detta sätt kan en serie tidsberäkningar och konverteringar utföras.

Efter varje beräkningssteg är utdatatypen också fast och kommer att påverka vilka funktioner som är tillgängliga för nästa beräkningssteg. Beräkningen kan endast fortsätta om typerna matchar. Annars blir resultatet av ett steg nodens slutliga utdata.

## Beräkningsfunktioner

### Lägg till en tidsperiod

-   Tar emot indatavärdestyp: Datum
-   Parametrar
    -   Mängden att lägga till, vilket kan vara ett nummer eller en inbyggd variabel från noden.
    -   Tidsenhet.
-   Utdatatyp: Datum
-   Exempel: När indatavärdet är `2024-7-15 00:00:00`, mängden är `1` och enheten är "dag", blir beräkningsresultatet `2024-7-16 00:00:00`.

### Subtrahera en tidsperiod

-   Tar emot indatavärdestyp: Datum
-   Parametrar
    -   Mängden att subtrahera, vilket kan vara ett nummer eller en inbyggd variabel från noden.
    -   Tidsenhet.
-   Utdatatyp: Datum
-   Exempel: När indatavärdet är `2024-7-15 00:00:00`, mängden är `1` och enheten är "dag", blir beräkningsresultatet `2024-7-14 00:00:00`.

### Beräkna skillnaden med en annan tid

-   Tar emot indatavärdestyp: Datum
-   Parametrar
    -   Datumet att beräkna skillnaden med, vilket kan vara en datumkonstant eller en variabel från arbetsflödets kontext.
    -   Tidsenhet.
    -   Om absolutvärdet ska tas.
    -   Avrundningsoperation: Alternativ inkluderar att behålla decimaler, avrunda till närmaste heltal, avrunda uppåt och avrunda nedåt.
-   Utdatatyp: Siffra
-   Exempel: När indatavärdet är `2024-7-15 00:00:00`, jämförelseobjektet är `2024-7-16 06:00:00`, enheten är "dag", absolutvärdet tas inte och decimaler behålls, blir beräkningsresultatet `-1.25`.

:::info{title=Tips}
När absolutvärde och avrundning konfigureras samtidigt, tas absolutvärdet först, därefter tillämpas avrundning.
:::

### Hämta värdet av en tid i en specifik enhet

-   Tar emot indatavärdestyp: Datum
-   Parametrar
    -   Tidsenhet.
-   Utdatatyp: Siffra
-   Exempel: När indatavärdet är `2024-7-15 00:00:00` och enheten är "dag", blir beräkningsresultatet `15`.

### Ställ in datumet till början av en specifik enhet

-   Tar emot indatavärdestyp: Datum
-   Parametrar
    -   Tidsenhet.
-   Utdatatyp: Datum
-   Exempel: När indatavärdet är `2024-7-15 14:26:30` och enheten är "dag", blir beräkningsresultatet `2024-7-15 00:00:00`.

### Ställ in datumet till slutet av en specifik enhet

-   Tar emot indatavärdestyp: Datum
-   Parametrar
    -   Tidsenhet.
-   Utdatatyp: Datum
-   Exempel: När indatavärdet är `2024-7-15 14:26:30` och enheten är "dag", blir beräkningsresultatet `2024-7-15 23:59:59`.

### Kontrollera skottår

-   Tar emot indatavärdestyp: Datum
-   Parametrar
    -   Inga parametrar
-   Utdatatyp: Boolesk
-   Exempel: När indatavärdet är `2024-7-15 14:26:30`, blir beräkningsresultatet `true`.

### Formatera som sträng

-   Tar emot indatavärdestyp: Datum
-   Parametrar
    -   Format, se [Day.js: Format](https://day.js.org/docs/zh-CN/display/format)
-   Utdatatyp: Sträng
-   Exempel: När indatavärdet är `2024-7-15 14:26:30` och formatet är `the time is YYYY/MM/DD HH:mm:ss`, blir beräkningsresultatet `the time is 2024/07/15 14:26:30`.

### Konvertera enhet

-   Tar emot indatavärdestyp: Siffra
-   Parametrar
    -   Tidsenhet före konvertering.
    -   Tidsenhet efter konvertering.
    -   Avrundningsoperation, alternativ inkluderar att behålla decimaler, avrunda till närmaste heltal, avrunda uppåt och avrunda nedåt.
-   Utdatatyp: Siffra
-   Exempel: När indatavärdet är `2`, enheten före konvertering är "vecka", enheten efter konvertering är "dag" och decimaler behålls inte, blir beräkningsresultatet `14`.

## Exempel

![Datumberäkningsnod_Exempel](https://static-docs.nocobase.com/20240817184137.png)

Anta att det finns en kampanj, och vi vill lägga till ett slutdatum för kampanjen i produktens fält när varje produkt skapas. Detta slutdatum ska vara klockan 23:59:59 på den sista dagen i veckan efter produktens skapandetid. Därför kan vi skapa två tidsfunktioner och låta dem köras i en pipeline:

-   Beräkna tiden för nästa vecka
-   Återställ resultatet till 23:59:59 på den sista dagen i den veckan

På så sätt får vi det önskade tidsvärdet och skickar det vidare till nästa nod, till exempel en samlingsmodifieringsnod, för att lägga till kampanjens slutdatum i samlingen.