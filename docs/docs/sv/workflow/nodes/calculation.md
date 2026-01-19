:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::

# Beräkning

Beräkningsnoden kan utvärdera ett uttryck, och resultatet av beräkningen sparas i nodens resultat för att kunna användas av efterföljande noder. Det är ett verktyg för att beräkna, bearbeta och transformera data. I viss mån kan den ersätta funktionen i programmeringsspråk där ni anropar en funktion på ett värde och tilldelar det till en variabel.

## Skapa nod

I gränssnittet för konfiguration av arbetsflöden klickar ni på plusknappen ("+") i flödet för att lägga till en "Beräkning"-nod:

![Beräkningsnod_Lägg till](https://static-docs.nocobase.com/58a455540d26945251cd143eb4b16579.png)

## Nodkonfiguration

![Beräkningsnod_Konfiguration](https://static-docs.nocobase.com/6a155de3f6a883d8cd1881b2d9c33874.png)

### Beräkningsmotor

Beräkningsmotorn definierar syntaxen som stöds av uttrycket. De beräkningsmotorer som för närvarande stöds är [Math.js](https://mathjs.org/) och [Formula.js](https://formulajs.info/). Varje motor har ett stort antal inbyggda vanliga funktioner och metoder för datahantering. För specifik användning kan ni hänvisa till deras officiella dokumentation.

:::info{title=Tips}
Observera att olika motorer skiljer sig åt när det gäller åtkomst till arrayindex. Math.js index börjar från `1`, medan Formula.js börjar från `0`.
:::

Om ni dessutom behöver enkel strängsammanfogning kan ni direkt använda "Strängmall". Denna motor ersätter variablerna i uttrycket med deras motsvarande värden och returnerar sedan den sammanfogade strängen.

### Uttryck

Ett uttryck är en strängrepresentation av en beräkningsformel som kan bestå av variabler, konstanter, operatorer och stödda funktioner. Ni kan använda variabler från arbetsflödets kontext, till exempel resultatet från en föregående nod till beräkningsnoden, eller lokala variabler i en loop.

Om uttryckets inmatning inte följer syntaxen, kommer ett fel att visas i nodkonfigurationen. Om en variabel inte existerar eller typen inte matchar under körning, eller om en obefintlig funktion används, kommer beräkningsnoden att avslutas i förtid med en felstatus.

## Exempel

### Beräkna orderns totalpris

En order kan vanligtvis innehålla flera varor, och varje vara har ett unikt pris och antal. Orderns totalpris beräknas genom att summera produkterna av pris och antal för alla varor. Efter att ni har laddat listan med orderdetaljer (en en-till-många-relation datamängd), kan ni använda en beräkningsnod för att beräkna orderns totalpris:

![Beräkningsnod_Exempel_Konfiguration](https://static-docs.nocobase.com/85966b0116afb49aa966eeaa85e78dae.png)

Här kan `SUMPRODUCT`-funktionen från Formula.js beräkna summan av produkterna för varje rad i två arrayer av samma längd, vilket ger orderns totalpris.