:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::

# Fördröjning

## Introduktion

Fördröjningsnoden kan lägga till en fördröjning i ett `arbetsflöde`. När fördröjningen är slut kan `arbetsflödet` antingen fortsätta att exekvera efterföljande noder eller avslutas i förtid, beroende på hur ni konfigurerar det.

Den används ofta tillsammans med noden för parallella grenar. Ni kan lägga till en fördröjningsnod i en av grenarna för att hantera processer som ska ske efter en tidsgräns. Till exempel, i en parallell gren kan den ena grenen innehålla manuell hantering och den andra en fördröjningsnod. Om den manuella hanteringen överskrider tidsgränsen och ni har ställt in den på att "misslyckas vid timeout", innebär det att den manuella hanteringen måste slutföras inom den angivna tiden. Om ni istället har ställt in den på att "fortsätta vid timeout", kan den manuella hanteringen ignoreras när tiden har gått ut.

## Installation

Inbyggd `plugin`, ingen installation krävs.

## Skapa nod

I konfigurationsgränssnittet för `arbetsflödet` klickar ni på plusknappen ("+") i flödet för att lägga till en "Fördröjning"-nod:

![Skapa fördröjningsnod](https://static-docs.nocobase.com/d0816999c9f7acaec1c409bd8fb6cc36.png)

## Nodkonfiguration

![Fördröjningsnod_Nodkonfiguration](https://static-docs.nocobase.com/5fe8a36535f20a087a0148ffa1cd2aea.png)

### Fördröjningstid

För fördröjningstiden kan ni ange ett nummer och välja en tidsenhet. De tidsenheter som stöds är: sekunder, minuter, timmar, dagar och veckor.

### Status vid timeout

För status vid timeout kan ni välja "Passera och fortsätt" eller "Misslyckas och avsluta". Det förstnämnda innebär att `arbetsflödet` fortsätter att exekvera efterföljande noder när fördröjningen är slut. Det sistnämnda innebär att `arbetsflödet` avslutas i förtid med statusen "misslyckad" när fördröjningen är slut.

## Exempel

Låt oss ta ett exempel där en arbetsorder behöver besvaras inom en begränsad tid efter att den har initierats. Vi behöver då lägga till en manuell nod i den ena av två parallella grenar och en fördröjningsnod i den andra. Om den manuella hanteringen inte besvaras inom 10 minuter, uppdateras arbetsorderns status till "timeout – ej hanterad".

![Fördröjningsnod_Exempel_Flödesorganisation](https://static-docs.nocobase.com/898c84adc376dc211b003a62e16e8e5b.png)