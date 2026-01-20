:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::

# Uppdatera data

Används för att uppdatera data i en samling som uppfyller angivna villkor.

Delarna för samling och fältilldelning är desamma som för noden "Skapa post". Huvudskillnaden med noden "Uppdatera data" är att den har ytterligare filtreringsvillkor och att ni behöver välja ett uppdateringsläge. Dessutom returnerar resultatet från "Uppdatera data"-noden antalet rader som har uppdaterats framgångsrikt. Detta kan endast ses i körningshistoriken och kan inte användas som en variabel i efterföljande noder.

## Skapa nod

I arbetsflödets konfigurationsgränssnitt klickar ni på plusknappen ("+") i flödet för att lägga till en "Uppdatera data"-nod:

![Lägg till Uppdatera data-nod](https://static-docs.nocobase.com/9ff24d7bc173b3a71decc1f70ca9fb66.png)

## Nodkonfiguration

![Konfiguration av Uppdatera data-nod](https://static-docs.nocobase.com/98e0f941c57275fc835f08260d0b2e86.png)

### Samling

Välj den samling där data ska uppdateras.

### Uppdateringsläge

Det finns två uppdateringslägen:

*   **Massuppdatering**: Utlöser inte samlingshändelser för varje uppdaterad post. Detta ger bättre prestanda och är lämpligt för uppdateringsoperationer med stora datamängder.
*   **Uppdatera en i taget**: Utlöser samlingshändelser för varje uppdaterad post. Detta kan dock orsaka prestandaproblem vid stora datamängder och bör användas med försiktighet.

Valet beror vanligtvis på måldata för uppdateringen och om andra arbetsflödeshändelser behöver utlösas. Om ni uppdaterar en enskild post baserat på primärnyckeln, rekommenderas "Uppdatera en i taget". Om ni uppdaterar flera poster baserat på villkor, rekommenderas "Massuppdatering".

### Filtreringsvillkor

Liksom filtreringsvillkoren i en vanlig samlingsfråga kan ni använda kontextvariabler från arbetsflödet.

### Fältvärden

Liksom fältilldelningen i noden "Skapa post" kan ni använda kontextvariabler från arbetsflödet eller manuellt ange statiska värden.

Obs: Data som uppdateras av noden "Uppdatera data" i ett arbetsflöde hanterar inte automatiskt fältet "Senast ändrad av". Ni behöver konfigurera värdet för detta fält själva vid behov.

## Exempel

Om ni till exempel behöver uppdatera fältet "Antal artiklar" i samlingen "Artikelkategori" automatiskt när en ny "Artikel" skapas, kan detta uppnås med hjälp av "Uppdatera data"-noden:

![Exempelkonfiguration för Uppdatera data-nod](https://static-docs.nocobase.com/98e0f941c57275fc835f08260d0b2e86.png)

När arbetsflödet utlöses kommer fältet "Antal artiklar" i samlingen "Artikelkategori" automatiskt att uppdateras till aktuellt antal artiklar + 1.