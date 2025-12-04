---
pkg: '@nocobase/plugin-workflow-date-calculation'
---
:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::


# Datumberekening

## Introductie

De datumberekening node biedt negen berekeningsfuncties, waaronder het toevoegen en aftrekken van een tijdsperiode, het formatteren van tijdreeksen en het omzetten van duur-eenheden. Elke functie heeft specifieke invoer- en uitvoerwaardetypen en kan resultaten van andere nodes ontvangen als parametervariabelen. Door middel van een berekeningspipeline worden de resultaten van geconfigureerde functies aan elkaar gekoppeld, om zo tot een verwachte uitvoer te komen.

## Node aanmaken

In de configuratie-interface van de **workflow** klikt u op de plusknop ('+') in de **workflow** om een 'Datumberekening' node toe te voegen:

![Datumberekening node_Node aanmaken](https://static-docs.nocobase.com/[图片].png)

## Node configuratie

![Datumberekening node_Node configuratie](https://static-docs.nocobase.com/20240817184423.png)

### Invoerwaarde

De invoerwaarde kan een variabele of een datumconstante zijn. De variabele kan de **data** zijn die deze **workflow** heeft geactiveerd, of het resultaat van een upstream node in deze **workflow**. Voor een constante kunt u elke gewenste datum selecteren.

### Type invoerwaarde

Dit verwijst naar het type invoerwaarde. Er zijn twee mogelijke waarden.

*   Datumtype: Dit betekent dat de invoerwaarde uiteindelijk kan worden omgezet naar een datum-tijd type, zoals een numerieke timestamp of een string die tijd representeert.
*   Numeriek type: Aangezien het type invoerwaarde de keuze van de volgende tijdsberekeningsstappen beïnvloedt, is het belangrijk om het juiste type invoerwaarde te selecteren.

### Berekeningsstappen

Elke berekeningsstap bestaat uit een berekeningsfunctie en de bijbehorende parameterconfiguratie. Het maakt gebruik van een pipeline-ontwerp, waarbij het resultaat van de vorige functie dient als invoerwaarde voor de volgende functie. Op deze manier kan een reeks tijdsberekeningen en -conversies worden voltooid.

Na elke berekeningsstap is het uitvoertype vast en beïnvloedt het de functies die beschikbaar zijn voor de volgende berekeningsstap. De berekening kan alleen doorgaan als de typen overeenkomen. Anders zal het resultaat van een stap de uiteindelijke uitvoer van de node zijn.

## Berekeningsfuncties

### Een tijdsperiode toevoegen

-   Ontvangt invoerwaarde type: Datum
-   Parameters
    -   Het aantal toe te voegen, dit kan een getal zijn of een ingebouwde variabele van de node.
    -   Tijdseenheid.
-   Uitvoerwaarde type: Datum
-   Voorbeeld: Als de invoerwaarde `2024-7-15 00:00:00` is, het aantal `1` en de eenheid "dag", dan is het berekeningsresultaat `2024-7-16 00:00:00`.

### Een tijdsperiode aftrekken

-   Ontvangt invoerwaarde type: Datum
-   Parameters
    -   Het aantal af te trekken, dit kan een getal zijn of een ingebouwde variabele van de node.
    -   Tijdseenheid.
-   Uitvoerwaarde type: Datum
-   Voorbeeld: Als de invoerwaarde `2024-7-15 00:00:00` is, het aantal `1` en de eenheid "dag", dan is het berekeningsresultaat `2024-7-14 00:00:00`.

### Het verschil berekenen met een andere tijd

-   Ontvangt invoerwaarde type: Datum
-   Parameters
    -   De datum waarmee het verschil moet worden berekend. U kunt een datumconstante of een variabele uit de **workflow**-context selecteren.
    -   Tijdseenheid.
    -   Of de absolute waarde moet worden genomen.
    -   Afrondingsbewerking: U kunt kiezen uit decimalen behouden, afronden, naar boven afronden en naar beneden afronden.
-   Uitvoerwaarde type: Numeriek
-   Voorbeeld: Als de invoerwaarde `2024-7-15 00:00:00` is, het vergelijkingsobject `2024-7-16 06:00:00`, de eenheid "dag", de absolute waarde niet wordt genomen en decimalen worden behouden, dan is het berekeningsresultaat `-1.25`.

:::info{title=Tip}
Wanneer absolute waarde en afronding tegelijkertijd zijn geconfigureerd, wordt eerst de absolute waarde genomen en daarna afgerond.
:::

### De waarde van een tijd in een specifieke eenheid ophalen

-   Ontvangt invoerwaarde type: Datum
-   Parameters
    -   Tijdseenheid.
-   Uitvoerwaarde type: Numeriek
-   Voorbeeld: Als de invoerwaarde `2024-7-15 00:00:00` is en de eenheid "dag", dan is het berekeningsresultaat `15`.

### De datum instellen op het begin van een specifieke eenheid

-   Ontvangt invoerwaarde type: Datum
-   Parameters
    -   Tijdseenheid.
-   Uitvoerwaarde type: Datum
-   Voorbeeld: Als de invoerwaarde `2024-7-15 14:26:30` is en de eenheid "dag", dan is het berekeningsresultaat `2024-7-15 00:00:00`.

### De datum instellen op het einde van een specifieke eenheid

-   Ontvangt invoerwaarde type: Datum
-   Parameters
    -   Tijdseenheid.
-   Uitvoerwaarde type: Datum
-   Voorbeeld: Als de invoerwaarde `2024-7-15 14:26:30` is en de eenheid "dag", dan is het berekeningsresultaat `2024-7-15 23:59:59`.

### Controleren op schrikkeljaar

-   Ontvangt invoerwaarde type: Datum
-   Parameters
    -   Geen parameters
-   Uitvoerwaarde type: Booleaans
-   Voorbeeld: Als de invoerwaarde `2024-7-15 14:26:30` is, dan is het berekeningsresultaat `true`.

### Formatteren als string

-   Ontvangt invoerwaarde type: Datum
-   Parameters
    -   Formaat, zie [Day.js: Format](https://day.js.org/docs/en/display/format)
-   Uitvoerwaarde type: String
-   Voorbeeld: Als de invoerwaarde `2024-7-15 14:26:30` is en het formaat `the time is YYYY/MM/DD HH:mm:ss`, dan is het berekeningsresultaat `the time is 2024/07/15 14:26:30`.

### Eenheid omzetten

-   Ontvangt invoerwaarde type: Numeriek
-   Parameters
    -   De tijdseenheid vóór conversie.
    -   De tijdseenheid ná conversie.
    -   Afrondingsbewerking: U kunt kiezen uit decimalen behouden, afronden, naar boven afronden en naar beneden afronden.
-   Uitvoerwaarde type: Numeriek
-   Voorbeeld: Als de invoerwaarde `2` is, de eenheid vóór conversie "week", de eenheid ná conversie "dag" en decimalen niet worden behouden, dan is het berekeningsresultaat `14`.

## Voorbeeld

![Datumberekening node_Voorbeeld](https://static-docs.nocobase.com/20240817184137.png)

Stel dat er een promotieactie is. We willen dat bij het aanmaken van elk product een eindtijd voor de promotieactie wordt toegevoegd aan een veld van het product. Deze eindtijd is 23:59:59 op de laatste dag van de week volgend op de aanmaaktijd van het product. We kunnen hiervoor twee tijdsfuncties aanmaken en deze als een pipeline laten uitvoeren:

-   De tijd voor de volgende week berekenen
-   Het verkregen resultaat resetten naar 23:59:59 op de laatste dag van die week

Op deze manier verkrijgen we de gewenste tijdswaarde en geven we deze door aan de volgende node, bijvoorbeeld een **collectie**-wijzigingsnode, om de eindtijd van de promotieactie aan de **collectie** toe te voegen.