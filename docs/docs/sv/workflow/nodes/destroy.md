:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::

# Ta bort data
Denna funktion används för att ta bort data från en samling som uppfyller specifika villkor.

Grundläggande användning av borttagningsnoden liknar uppdateringsnoden. Skillnaden är att borttagningsnoden inte kräver fältilldelning; ni behöver bara välja samlingen och ange filtervillkoren. Resultatet av borttagningsnoden är antalet rader som har tagits bort, vilket endast kan ses i körningshistoriken och kan inte användas som en variabel i efterföljande noder.

:::info{title=Obs}
För närvarande stöder borttagningsnoden inte radering av enskilda rader; den utför alltid massraderingar. Detta innebär att den inte kommer att utlösa andra händelser för varje individuell dataradering.
:::

## Skapa nod
I konfigurationsgränssnittet för arbetsflödet klickar ni på plusknappen ("+") i flödet för att lägga till en "Ta bort data"-nod:

![Skapa borttagningsnod](https://static-docs.nocobase.com/e1d6b8728251fcdbed6c7f50e5570da2.png)

## Nodkonfiguration
![Borttagningsnod_Nodkonfiguration](https://static-docs.nocobase.com/580600c2b13ef4e01dfa48b23539648e.png)

### Samling
Välj den samling som ni vill ta bort data från.

### Filtervillkor
Dessa liknar filtervillkoren för en vanlig samlingsfråga, och ni kan använda arbetsflödets kontextvariabler.

## Exempel
För att till exempel regelbundet rensa bort avbrutna och ogiltiga historiska orderdata kan ni använda borttagningsnoden:

![Borttagningsnod_Exempel_Nodkonfiguration](https://static-docs.nocobase.com/b94b75077a17252f8523c3f13ce5f320.png)

Arbetsflödet kommer att utlösas regelbundet och utföra raderingen av all avbruten och ogiltig historisk orderdata.