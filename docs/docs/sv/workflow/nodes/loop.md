---
pkg: '@nocobase/plugin-workflow-loop'
---
:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::


# Loop

## Introduktion

En loop motsvarar syntaxstrukturer som `for`, `while` eller `forEach` i programmeringsspråk. När ni behöver upprepa vissa operationer ett visst antal gånger, eller för en viss datasamling (array), kan ni använda en loop-nod.

## Installation

Detta är en inbyggd plugin och kräver ingen installation.

## Skapa en nod

I arbetsflödets konfigurationsgränssnitt klickar ni på plusknappen ("+") i flödet för att lägga till en "Loop"-nod:

![Skapa en loop-nod](https://static-docs.nocobase.com/b3c8061a66bfff037f4b9509ab0aad75.png)

Efter att ni har skapat en loop-nod genereras en gren inuti loopen. Ni kan lägga till valfritt antal noder inom denna gren. Dessa noder kan inte bara använda variabler från arbetsflödets kontext, utan även lokala variabler från loop-kontexten, som till exempel dataobjektet som itereras över i samlingen, eller indexet för loop-räkningen (indexet börjar från `0`). Omfånget för lokala variabler är begränsat till loopen. Om det finns kapslade loopar kan ni använda de lokala variablerna för den specifika loopen på varje nivå.

## Nodkonfiguration

![20241016135326](https://static-docs.nocobase.com/20241016135326.png)

### Loop-objekt

Loopen hanterar olika datatyper för loop-objektet på olika sätt:

1.  **Array**: Detta är det vanligaste fallet. Ni kan vanligtvis välja en variabel från arbetsflödets kontext, som till exempel flera datarader från en frågenod, eller förladdad en-till-många-relationsdata. Om en array väljs kommer loop-noden att iterera genom varje element i arrayen, och tilldela det aktuella elementet till en lokal variabel i loop-kontexten för varje iteration.

2.  **Tal**: När den valda variabeln är ett tal kommer det att användas som antalet iterationer. Värdet måste vara ett positivt heltal; negativa tal kommer inte att starta loopen, och decimaldelen av ett tal kommer att ignoreras. Indexet för loop-räkningen i den lokala variabeln är också värdet på loop-objektet. Detta värde börjar från **0**. Till exempel, om loop-objektets tal är 5, kommer objektet och indexet i varje loop att vara: 0, 1, 2, 3, 4.

3.  **Sträng**: När den valda variabeln är en sträng kommer dess längd att användas som antalet iterationer, och varje tecken i strängen kommer att bearbetas efter index.

4.  **Övrigt**: Andra typer av värden (inklusive objekttyper) behandlas som ett loop-objekt med ett enda element och kommer bara att loopa en gång. Denna situation kräver vanligtvis ingen loop.

Förutom att välja en variabel kan ni också direkt ange konstanter för tal- och strängtyper. Till exempel, om ni anger `5` (tal-typ) kommer loop-noden att iterera 5 gånger. Om ni anger `abc` (sträng-typ) kommer loop-noden att iterera 3 gånger och bearbeta tecknen `a`, `b` och `c` separat. I verktyget för variabelval, välj önskad typ för konstanten.

### Loop-villkor

Från och med version `v1.4.0-beta` har alternativ relaterade till loop-villkor lagts till. Ni kan aktivera loop-villkor i nodkonfigurationen.

**Villkor**

Liknande villkorskonfigurationen i en villkorsnod, kan ni kombinera konfigurationer och använda variabler från den aktuella loopen, som till exempel loop-objektet, loop-indexet, etc.

**Kontrolltidpunkt**

Liknande `while`- och `do/while`-konstruktionerna i programmeringsspråk, kan ni välja att utvärdera det konfigurerade villkoret före varje loop startar eller efter varje loop avslutas. Eftervillkorsutvärdering tillåter att de andra noderna inom loop-kroppen exekveras en gång innan villkoret kontrolleras.

**När villkoret inte uppfylls**

Liknande `break`- och `continue`-satserna i programmeringsspråk, kan ni välja att avsluta loopen eller fortsätta till nästa iteration.

### Hantering av fel i loop-noder

Från och med version `v1.4.0-beta`, när en nod inuti loopen misslyckas med att exekvera (på grund av ej uppfyllda villkor, fel, etc.), kan ni konfigurera det efterföljande flödet. Tre hanteringsmetoder stöds:

*   Avsluta arbetsflödet (som `throw` i programmering)
*   Avsluta loopen och fortsätt arbetsflödet (som `break` i programmering)
*   Fortsätt till nästa loop-objekt (som `continue` i programmering)

Standard är "Avsluta arbetsflödet", vilket kan ändras vid behov.

## Exempel

Till exempel, när en order läggs, behöver ni kontrollera lagret för varje produkt i ordern. Om lagret är tillräckligt, dras lagret av; annars uppdateras produkten i orderdetaljen som ogiltig.

1.  Skapa tre samlingar: Produkter <-(1:m)-- Orderdetaljer --(m:1)-> Ordrar. Datamodellen är som följer:

    **Samlingen Ordrar**
    | Fältnamn          | Fälttyp                   |
    | ----------------- | ------------------------- |
    | Orderdetaljer     | En-till-många (Orderdetaljer) |
    | Orders totalpris  | Tal                       |

    **Samlingen Orderdetaljer**
    | Fältnamn | Fälttyp                 |
    | -------- | ----------------------- |
    | Produkt  | Många-till-en (Produkt) |
    | Kvantitet| Tal                     |

    **Samlingen Produkter**
    | Fältnamn   | Fälttyp       |
    | ---------- | ------------- |
    | Produktnamn| Enkelradstext |
    | Pris       | Tal           |
    | Lager      | Heltal        |

2.  Skapa ett arbetsflöde. För triggern, välj "Samlingshändelse", och välj samlingen "Ordrar" för att triggas "När en post läggs till". Ni behöver också konfigurera den för att förladda relationsdata för samlingen "Orderdetaljer" och samlingen "Produkter" under detaljerna:

    ![Loop-nod_Exempel_Triggerkonfiguration](https://static-docs.nocobase.com/0086601c71c0e17a64d046a4c86b49b7.png)

3.  Skapa en loop-nod och välj loop-objektet som "Triggerdata / Orderdetaljer", vilket innebär att den kommer att bearbeta varje post i samlingen Orderdetaljer:

    ![Loop-nod_Exempel_Loop-nodkonfiguration](https://static-docs.nocobase.com/2507becc32db5a9a0641c198605a20da.png)

4.  Inuti loop-noden, skapa en "Villkors"-nod för att kontrollera om produktens lager är tillräckligt:

    ![Loop-nod_Exempel_Villkorsnodkonfiguration](https://static-docs.nocobase.com/a6d08d15786841e1a3512b38e4629852.png)

5.  Om det är tillräckligt, skapa en "Beräkningsnod" och en "Uppdatera post"-nod i "Ja"-grenen för att uppdatera motsvarande produktpost med det beräknade avdragna lagret:

    ![Loop-nod_Exempel_Beräkningsnodkonfiguration](https://static-docs.nocobase.com/8df3604c71f8f8705b1552d3ebfe3b50.png)

    ![Loop-nod_Exempel_Uppdatera lager-nodkonfiguration](https://static-docs.nocobase.com/2d84baa9b3b01bd85fccda9eec992378.png)

6.  Annars, i "Nej"-grenen, skapa en "Uppdatera post"-nod för att uppdatera statusen för orderdetaljen till "ogiltig":

    ![Loop-nod_Exempel_Uppdatera orderdetalj-nodkonfiguration](https://static-docs.nocobase.com/4996613090c254c69a1d80f3b3a7fae2.png)

Den övergripande arbetsflödesstrukturen är som följer:

![Loop-nod_Exempel_Arbetsflödesstruktur](https://static-docs.nocobase.com/6f59ef246c1f19976344a7624c4c4151.png)

Efter att ni har konfigurerat och aktiverat detta arbetsflöde, när en ny order skapas, kommer den automatiskt att kontrollera lagret för produkterna i orderdetaljerna. Om lagret är tillräckligt, dras det av; annars uppdateras produkten i orderdetaljen till ogiltig (så att ett giltigt ordertotalpris kan beräknas).