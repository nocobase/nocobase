:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::

# Meervoudige voorwaarden <Badge>v2.0.0+</Badge>

## Introductie

Vergelijkbaar met `switch / case` of `if / else if` statements in programmeertalen. Het systeem beoordeelt de geconfigureerde voorwaarden één voor één. Zodra aan een voorwaarde is voldaan, voert de workflow de bijbehorende tak uit en worden verdere voorwaardelijke controles overgeslagen. Als aan geen enkele voorwaarde is voldaan, wordt de 'Anders'-tak uitgevoerd.

## Node aanmaken

Klik in de workflowconfiguratie-interface op de plusknop ('+') in de flow om een 'Meervoudige voorwaarden'-node toe te voegen:

![Meervoudige voorwaarden-node aanmaken](https://static-docs.nocobase.com/20251123222134.png)

## Takbeheer

### Standaard takken

Na aanmaak bevat de node standaard twee takken:

1.  **Voorwaardelijke tak**: Voor het configureren van specifieke beoordelingsvoorwaarden.
2.  **Anders-tak**: Wordt gebruikt wanneer aan geen van de voorwaardelijke takken is voldaan; vereist geen voorwaardeconfiguratie.

Klik op de knop 'Tak toevoegen' onder de node om meer voorwaardelijke takken toe te voegen.

![20251123222540](https://static-docs.nocobase.com/20251123222540.png)

### Tak toevoegen

Nadat u op 'Tak toevoegen' hebt geklikt, wordt de nieuwe tak vóór de 'Anders'-tak geplaatst.

![20251123222805](https://static-docs.nocobase.com/20251123222805.png)

### Tak verwijderen

Wanneer er meerdere voorwaardelijke takken bestaan, klikt u op het prullenbakpictogram aan de rechterkant van een tak om deze te verwijderen. Als er nog maar één voorwaardelijke tak overblijft, kan deze niet worden verwijderd.

![20251123223127](https://static-docs.nocobase.com/20251123223127.png)

:::info{title=Tip}
Het verwijderen van een tak zal ook alle nodes binnen die tak verwijderen; wees voorzichtig met deze handeling.

De 'Anders'-tak is een ingebouwde tak en kan niet worden verwijderd.
:::

## Node-configuratie

### Voorwaardeconfiguratie

Klik op de naam van de voorwaarde bovenaan een tak om de specifieke voorwaardelijke details te bewerken:

![20251123223352](https://static-docs.nocobase.com/20251123223352.png)

#### Voorwaardelabel

Ondersteunt aangepaste labels. Eenmaal ingevuld, wordt dit weergegeven als de voorwaardenaam in het stroomschema. Indien niet geconfigureerd (of leeg gelaten), wordt standaard 'Voorwaarde 1', 'Voorwaarde 2', enzovoort, sequentieel weergegeven.

![20251123224209](https://static-docs.nocobase.com/20251123224209.png)

#### Reken-engine

Ondersteunt momenteel drie engines:

-   **Basis**: Gebruikt eenvoudige logische vergelijkingen (bijv. gelijk aan, bevat) en 'EN'/'OF'-combinaties om resultaten te bepalen.
-   **Math.js**: Ondersteunt expressieberekening met behulp van de [Math.js](https://mathjs.org/)-syntaxis.
-   **Formula.js**: Ondersteunt expressieberekening met behulp van de [Formula.js](https://formulajs.info/)-syntaxis (vergelijkbaar met Excel-formules).

Alle drie de modi ondersteunen het gebruik van workflowcontextvariabelen als parameters.

### Wanneer aan geen voorwaarden is voldaan

In het node-configuratiepaneel kunt u de vervolgactie instellen wanneer aan geen voorwaarden is voldaan:

![20251123224348](https://static-docs.nocobase.com/20251123224348.png)

*   **Workflow beëindigen met fout (Standaard)**: Markeer de workflowstatus als mislukt en beëindig het proces.
*   **Doorgaan met uitvoeren van volgende nodes**: Nadat de huidige node is voltooid, wordt de uitvoering van volgende nodes in de workflow voortgezet.

:::info{title=Tip}
Ongeacht de gekozen afhandeling, wanneer aan geen voorwaarden is voldaan, zal de flow eerst de 'Anders'-tak ingaan om de nodes daarin uit te voeren.
:::

## Uitvoeringsgeschiedenis

In de uitvoeringsgeschiedenis van de workflow identificeert de 'Meervoudige voorwaarden'-node het resultaat van elke voorwaarde met behulp van verschillende kleuren:

-   **Groen**: Voorwaarde voldaan; deze tak is ingegaan.
-   **Rood**: Voorwaarde niet voldaan (of berekeningsfout); deze tak is overgeslagen.
-   **Blauw**: Beoordeling niet uitgevoerd (overgeslagen omdat aan een voorgaande voorwaarde al was voldaan).

![20251123225455](https://static-docs.nocobase.com/20251123225455.png)

Als een configuratiefout een berekeningsuitzondering veroorzaakt, wordt naast de rode weergave, bij het hoveren over de voorwaardenaam, specifieke foutinformatie getoond:

![20251123231014](https://static-docs.nocobase.com/20251123231014.png)

Wanneer een uitzondering optreedt bij de voorwaardeberekening, eindigt de 'Meervoudige voorwaarden'-node met de status 'Fout' en wordt de uitvoering van volgende nodes niet voortgezet.