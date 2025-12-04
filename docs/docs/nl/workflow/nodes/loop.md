---
pkg: '@nocobase/plugin-workflow-loop'
---
:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::


# Lus

## Introductie

Een lus is vergelijkbaar met syntactische structuren zoals `for`/`while`/`forEach` in programmeertalen. U kunt een lus-node gebruiken wanneer u bepaalde bewerkingen een aantal keer of voor een specifieke gegevenscollectie (array) wilt herhalen.

## Installatie

Dit is een ingebouwde plugin en hoeft niet geïnstalleerd te worden.

## Een node aanmaken

Klik in de configuratie-interface van de workflow op de plusknop ("+") in de flow om een "Lus"-node toe te voegen:

![Lus-node aanmaken](https://static-docs.nocobase.com/b3c8061a66bfff037f4b9509ab0aad75.png)

Nadat u een lus-node hebt aangemaakt, wordt er een interne lus-vertakking gegenereerd. U kunt binnen deze vertakking een willekeurig aantal nodes toevoegen. Deze nodes kunnen niet alleen gebruikmaken van variabelen uit de workflow-context, maar ook van lokale variabelen uit de lus-context, zoals het data-object dat bij elke iteratie in de lus-collectie wordt verwerkt, of de index van het aantal lussen (de index begint te tellen vanaf `0`). De scope van lokale variabelen is beperkt tot binnen de lus. Bij geneste lussen kunt u de lokale variabelen van de specifieke lus op elk niveau gebruiken.

## Node-configuratie

![20241016135326](https://static-docs.nocobase.com/20241016135326.png)

### Lus-object

De lus verwerkt verschillende data-typen van het lus-object op verschillende manieren:

1.  **Array**: Dit is de meest voorkomende situatie. U kunt meestal een variabele selecteren uit de workflow-context, zoals de meerdere dataresultaten van een query-node, of vooraf geladen één-op-veel relatiegegevens. Als een array is geselecteerd, zal de lus-node elk element in de array doorlopen, waarbij het huidige element bij elke iteratie wordt toegewezen aan een lokale variabele in de lus-context.

2.  **Getal**: Wanneer de geselecteerde variabele een getal is, wordt dit gebruikt als het aantal iteraties. De waarde moet een positief geheel getal zijn; negatieve getallen zullen de lus niet ingaan en het decimale deel van een getal wordt genegeerd. De index van het aantal lussen in de lokale variabele is ook de waarde van het lus-object. Deze waarde begint bij **0**. Als het lus-object bijvoorbeeld het getal 5 is, zullen het object en de index in elke lus achtereenvolgens zijn: 0, 1, 2, 3, 4.

3.  **Tekenreeks**: Wanneer de geselecteerde variabele een tekenreeks is, wordt de lengte ervan gebruikt als het aantal iteraties, waarbij elk teken van de tekenreeks op basis van de index wordt verwerkt.

4.  **Overig**: Andere typen waarden (inclusief objecttypen) worden behandeld als een lus-object met één item en zullen slechts één keer doorlopen. In dergelijke situaties is het gebruik van een lus meestal niet nodig.

Naast het selecteren van een variabele, kunt u ook direct constanten invoeren voor getal- en tekenreekstypen. Als u bijvoorbeeld `5` (getaltype) invoert, zal de lus-node 5 keer doorlopen. Als u `abc` (tekenreekstype) invoert, zal de lus-node 3 keer doorlopen, waarbij de tekens `a`, `b` en `c` afzonderlijk worden verwerkt. Kies in de variabele-selectietool het gewenste type voor de constante.

### Lus-conditie

Vanaf versie `v1.4.0-beta` zijn er opties toegevoegd met betrekking tot lus-condities. U kunt lus-condities inschakelen in de node-configuratie.

**Conditie**

Vergelijkbaar met de conditie-configuratie in een conditie-node, kunt u configuraties combineren en variabelen uit de huidige lus gebruiken, zoals het lus-object, de lus-index, enz.

**Controle-moment**

Vergelijkbaar met de `while` en `do/while` constructies in programmeertalen, kunt u ervoor kiezen om de geconfigureerde conditie te evalueren vóór elke lus begint of nadat elke lus eindigt. Evaluatie van de post-conditie maakt het mogelijk dat de andere nodes binnen de lus-body één keer worden uitgevoerd voordat de conditie wordt gecontroleerd.

**Wanneer niet aan de conditie is voldaan**

Vergelijkbaar met de `break` en `continue` statements in programmeertalen, kunt u ervoor kiezen om de lus te verlaten of door te gaan naar de volgende iteratie.

### Foutafhandeling in lus-nodes

Vanaf versie `v1.4.0-beta`, wanneer een node binnen de lus niet wordt uitgevoerd (door niet-vervulde condities, fouten, enz.), kunt u de verdere flow configureren. Er worden drie afhandelingsmethoden ondersteund:

*   De workflow verlaten (zoals `throw` in programmeren)
*   De lus verlaten en de workflow voortzetten (zoals `break` in programmeren)
*   Doorgaan naar het volgende lus-object (zoals `continue` in programmeren)

De standaardinstelling is "De workflow verlaten", maar u kunt dit naar behoefte aanpassen.

## Voorbeeld

Wanneer een bestelling wordt geplaatst, moet u bijvoorbeeld de voorraad controleren voor elk product in de bestelling. Als de voorraad voldoende is, wordt deze afgeschreven; anders wordt het product in de bestelregel als ongeldig bijgewerkt.

1.  Maak drie collecties aan: Producten <-(1:m)-- Bestelregels --(m:1)-> Bestellingen. Het datamodel is als volgt:

    **Collectie Bestellingen**
    | Veldnaam               | Veldtype                  |
    | ---------------------- | ------------------------- |
    | Bestelregels           | Eén-op-veel (Bestelregels) |
    | Totaalprijs bestelling | Getal                     |

    **Collectie Bestelregels**
    | Veldnaam | Veldtype              |
    | -------- | --------------------- |
    | Product  | Veel-op-één (Product) |
    | Aantal   | Getal                 |

    **Collectie Producten**
    | Veldnaam        | Veldtype          |
    | --------------- | ----------------- |
    | Productnaam     | Enkele regel tekst |
    | Prijs           | Getal             |
    | Voorraad        | Geheel getal      |

2.  Maak een workflow aan. Selecteer voor de trigger "Collectie-gebeurtenis" en kies de collectie "Bestellingen" om te triggeren "Na toevoegen van record". U moet ook configureren dat de relatiegegevens van de collectie "Bestelregels" en de collectie "Producten" onder de details vooraf worden geladen:

    ![Lus-node_Voorbeeld_Trigger-configuratie](https://static-docs.nocobase.com/0086601c2fc0e17a64d046a4c86b49b7.png)

3.  Maak een lus-node aan en selecteer het lus-object als "Triggerdata / Bestelregels", wat betekent dat elke record in de collectie Bestelregels wordt verwerkt:

    ![Lus-node_Voorbeeld_Lus-node configuratie](https://static-docs.nocobase.com/2507becc32db5a9a0641c198605a20da.png)

4.  Maak binnen de lus-node een "Conditie"-node aan om te controleren of de voorraad van het product voldoende is:

    ![Lus-node_Voorbeeld_Conditie-node configuratie](https://static-docs.nocobase.com/a6d08d15786841e1a3512b38e4629852.png)

5.  Als de voorraad voldoende is, maakt u in de "Ja"-vertakking een "Berekening"-node en een "Record bijwerken"-node aan om de berekende afgeschreven voorraad bij te werken in de corresponderende productrecord:

    ![Lus-node_Voorbeeld_Berekening-node configuratie](https://static-docs.nocobase.com/8df3604c71f8f8705b1552d3ebfe3b50.png)

    ![Lus-node_Voorbeeld_Voorraad bijwerken-node configuratie](https://static-docs.nocobase.com/2d84baa9b3b01bd85fccda9eec992378.png)

6.  Anders maakt u in de "Nee"-vertakking een "Record bijwerken"-node aan om de status van de bestelregel bij te werken naar "ongeldig":

    ![Lus-node_Voorbeeld_Bestelregel bijwerken-node configuratie](https://static-docs.nocobase.com/4996613090c254c69a1d80f3b3a7fae2.png)

De algehele workflow-structuur is als volgt:

![Lus-node_Voorbeeld_Workflow-structuur](https://static-docs.nocobase.com/6f59ef246c1f19976344a7624c4c4151.png)

Nadat u deze workflow hebt geconfigureerd en geactiveerd, wordt bij het aanmaken van een nieuwe bestelling automatisch de voorraad van de producten in de bestelregels gecontroleerd. Als de voorraad voldoende is, wordt deze afgeschreven; anders wordt het product in de bestelregel bijgewerkt naar ongeldig (zodat een geldige totale bestelprijs kan worden berekend).