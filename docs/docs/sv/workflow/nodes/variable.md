---
pkg: '@nocobase/plugin-workflow-variable'
---
:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::


# Variabel

## Introduktion

Ni kan deklarera variabler i ett arbetsflöde eller tilldela värden till redan deklarerade variabler. Detta används vanligtvis för att lagra tillfällig data inom arbetsflödet.

## Skapa nod

I arbetsflödets konfigurationsgränssnitt klickar ni på plusknappen ("+") i arbetsflödet för att lägga till en "Variabel"-nod:

![Add Variable Node](https://static-docs.nocobase.com/53b1e48e777bfff7f2a08271526ef3ee.png)

## Konfigurera nod

### Läge

Variabelnoden liknar variabler i programmering; den måste deklareras innan den kan användas och tilldelas ett värde. Därför, när ni skapar en variabelnod, behöver ni välja dess läge. Det finns två lägen att välja mellan:

![Select Mode](https://static-docs.nocobase.com/49d8b7b501de6faef6f303262aa14550.png)

- Deklarera en ny variabel: Skapar en ny variabel.
- Tilldela ett befintligt variabelvärde: Tilldelar ett värde till en variabel som har deklarerats tidigare i arbetsflödet, vilket motsvarar att ändra variabelns värde.

När noden som skapas är den första variabelnoden i arbetsflödet, kan ni endast välja deklarationsläge, eftersom det ännu inte finns några variabler tillgängliga för tilldelning.

När ni väljer att tilldela ett värde till en deklarerad variabel, behöver ni också välja målvariabeln, det vill säga noden där variabeln deklarerades:

![Select the variable to assign a value to](https://static-docs.nocobase.com/1ce8911548d7347e693d8cc8ac1953eb.png)

### Värde

Värdet på en variabel kan vara av vilken typ som helst. Det kan vara en konstant, som en sträng, ett nummer, ett booleskt värde eller ett datum, eller så kan det vara en annan variabel från arbetsflödet.

I deklarationsläge motsvarar att ställa in variabelns värde att tilldela den ett initialt värde.

![Declare initial value](https://static-docs.nocobase.com/4ce2c508986565ad537343013758c6a4.png)

I tilldelningsläge motsvarar att ställa in variabelns värde att ändra värdet på den deklarerade målvariabeln till ett nytt värde. Efterföljande användningar kommer att hämta detta nya värde.

![Assign a trigger variable to a declared variable](https://static-docs.nocobase.com/858bae180712ad279ae6a964a77a7659.png)

## Använda variabelns värde

I efterföljande noder efter variabelnoden kan ni använda variabelns värde genom att välja den deklarerade variabeln från gruppen "Nodvariabler". Till exempel, i en frågenod, använd variabelns värde som ett frågevillkor:

![Use variable value as a query filter condition](https://static-docs.nocobase.com/1ca91c295254ff85999a1751499f14bc.png)

## Exempel

Ett mer användbart scenario för variabelnoden är i grenar, där nya värden beräknas eller slås samman med tidigare värden (liknande `reduce`/`concat` i programmering), och sedan används efter att grenen har avslutats. Nedan följer ett exempel på hur man använder en loopgren och en variabelnod för att sammanfoga en mottagarsträng.

Börja med att skapa ett arbetsflöde som triggas av en samling, vilket aktiveras när "Artikel"-data uppdateras, och förladdar relaterad "Författare"-relationsdata (för att hämta mottagare):

![Configure Trigger](https://static-docs.nocobase.com/93327530a93c695c637d74cdfdcd5cde.png)

Skapa sedan en variabelnod för att lagra mottagarsträngen:

![Recipient variable node](https://static-docs.nocobase.com/d26fa4a7e7ee4f34e0d8392a51c6666e.png)

Skapa därefter en loopgrennod för att iterera genom artikelns författare och sammanfoga deras mottagarinformation till mottagarvariabeln:

![Loop through authors in the article](https://static-docs.nocobase.com/083fe62c943c17a643dc47ec2872e07c.png)

Inom loopgrenen skapar ni först en beräkningsnod för att sammanfoga den aktuella författaren med den redan lagrade författarsträngen:

![Concatenate recipient string](https://static-docs.nocobase.com/5d21a990162f32cb8818d27b16fd1bcd.png)

Efter beräkningsnoden skapar ni ytterligare en variabelnod. Välj tilldelningsläge, välj mottagarvariabelnoden som tilldelningsmål, och välj resultatet från beräkningsnoden som värde:

![Assign the concatenated recipient string to the recipient node](https://static-docs.nocobase.com/fc40ed95dd9b61d924b7ca11b23f9482.png)

På så sätt, efter att loopgrenen har avslutats, kommer mottagarvariabeln att lagra mottagarsträngen för alla artikelns författare. Därefter, efter loopen, kan ni använda en HTTP-förfrågningsnod för att anropa ett e-postsändnings-API och skicka värdet från mottagarvariabeln som mottagarparameter till API:et:

![Send mail to recipients via the request node](https://static-docs.nocobase.com/37f71aa1a36e172bcb2dce10a250947e.png)

Härmed har en enkel massutskicksfunktion för e-post implementerats med hjälp av en loop och en variabelnod.