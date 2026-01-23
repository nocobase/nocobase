:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::

# Skapa post

Används för att lägga till en ny post i en samling.

Fältvärdena för den nya posten kan använda variabler från arbetsflödets kontext. För att tilldela värden till relationsfält kan ni direkt referera till motsvarande datavariabler i kontexten, antingen som ett objekt eller som ett främmande nyckelvärde. Om ni inte använder variabler behöver ni manuellt ange de främmande nyckelvärdena. För flera främmande nyckelvärden i en många-till-många-relation måste de separeras med kommatecken.

## Skapa nod

I arbetsflödets konfigurationsgränssnitt klickar ni på plusknappen ("+") i flödet för att lägga till en "Skapa post"-nod:

![Lägg till 'Skapa post'-nod](https://static-docs.nocobase.com/386c8c01c89b1eeab848510e77f4841a.png)

## Nodkonfiguration

![Skapa post-nod_Exempel_Nodkonfiguration](https://static-docs.nocobase.com/5f7b97a51b64a1741cf82a4d4455b610.png)

### Samling

Välj den samling som ni vill lägga till en ny post i.

### Fältvärden

Tilldela värden till samlingens fält. Ni kan använda variabler från arbetsflödets kontext eller manuellt ange statiska värden.

:::info{title="Obs"}
Data som skapas av "Skapa post"-noden i ett arbetsflöde hanterar inte automatiskt användardata som "Skapad av" och "Senast ändrad av". Ni behöver konfigurera värdena för dessa fält själva vid behov.
:::

### Förladda relationsdata

Om fälten för den nya posten inkluderar relationsfält och ni vill använda motsvarande relationsdata i efterföljande arbetsflödessteg, kan ni markera de relevanta relationsfälten i förladdningskonfigurationen. På så sätt kommer motsvarande relationsdata automatiskt att laddas och lagras tillsammans med nodens resultatdata efter att den nya posten har skapats.

## Exempel

Om till exempel en post i samlingen "Artiklar" skapas eller uppdateras, och en "Artikelversion"-post behöver skapas automatiskt för att logga en ändringshistorik för artikeln, kan ni använda "Skapa post"-noden för att åstadkomma detta:

![Skapa post-nod_Exempel_Arbetsflödeskonfiguration](https://static-docs.nocobase.com/dfd4820d49c145fa331883fc09c9161f.png)

![Skapa post-nod_Exempel_Nodkonfiguration](https://static-docs.nocobase.com/1a0992e66170be12a068da6503298868.png)

När arbetsflödet aktiveras med denna konfiguration kommer en "Artikelversion"-post automatiskt att skapas för att logga artikelns ändringshistorik när en post i samlingen "Artiklar" ändras.