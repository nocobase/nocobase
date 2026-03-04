:::tip{title="AI-vertaalmelding"}
Dit document is vertaald door AI. Raadpleeg de [Engelse versie](/interface-builder/blocks/data-blocks/form) voor nauwkeurige informatie.
:::

# Formulierblok

## Introductie

Het formulierblok is een essentieel blok voor het bouwen van interfaces voor gegevensinvoer en -bewerking. Het is zeer aanpasbaar en gebruikt de bijbehorende componenten om de vereiste velden weer te geven op basis van het datamodel. Via gebeurtenisstromen zoals koppelingsregels kan het formulierblok velden dynamisch weergeven. Daarnaast kan het worden gecombineerd met workflows om geautomatiseerde procestriggers en gegevensverwerking te realiseren, wat de werkefficiëntie verder verhoogt of logische orkestratie mogelijk maakt.

## Formulierblok toevoegen

- **Formulier bewerken**: Wordt gebruikt om bestaande gegevens te wijzigen.
- **Formulier toevoegen**: Wordt gebruikt om nieuwe gegevensitems aan te maken.

![20251023191139](https://static-docs.nocobase.com/20251023191139.png)

## Blokconfiguratie-opties

![20251023191448](https://static-docs.nocobase.com/20251023191448.png)

### Blokkoppelingsregels

Beheer het gedrag van blokken (zoals het weergeven of het uitvoeren van JavaScript) via koppelingsregels.

![20251023191703](https://static-docs.nocobase.com/20251023191703.png)

Meer informatie vindt u in [Blokkoppelingsregels](/interface-builder/blocks/block-settings/block-linkage-rule)

### Veldkoppelingsregels

Beheer het gedrag van formuliervelden via koppelingsregels.

![20251023191849](https://static-docs.nocobase.com/20251023191849.png)

Meer informatie vindt u in [Veldkoppelingsregels](/interface-builder/blocks/block-settings/field-linkage-rule)

### Indeling

Het formulierblok ondersteunt twee indelingsmodi, die worden ingesteld via het `layout` attribuut:

- **horizontal** (horizontale indeling): Deze indeling zorgt ervoor dat het label en de inhoud op één regel worden weergegeven, wat verticale ruimte bespaart. Dit is geschikt voor eenvoudige formulieren of situaties met weinig informatie.
- **vertical** (verticale indeling) (standaard): Het label bevindt zich boven het veld. Deze indeling maakt het formulier gemakkelijker te lezen en in te vullen, vooral voor formulieren met meerdere velden of complexe invoeritems.

![20251023193638](https://static-docs.nocobase.com/20251023193638.png)

## Velden configureren

### Velden van deze collectie

> **Let op**: Velden uit overgeërfde collecties (d.w.z. velden van de bovenliggende collectie) worden automatisch samengevoegd en weergegeven in de huidige veldenlijst.

![20240416230739](https://static-docs.nocobase.com/20240416230739.png)

### Velden van gerelateerde collecties

> Velden van gerelateerde collecties zijn alleen-lezen in het formulier en worden meestal gebruikt in combinatie met relatievelden om meerdere veldwaarden van de gerelateerde gegevens weer te geven.

![20260212161035](https://static-docs.nocobase.com/20260212161035.png)

- Momenteel worden alleen "to-one" relaties ondersteund (zoals belongsTo / hasOne, enz.).
- Het wordt meestal gebruikt in combinatie met relatievelden (gebruikt om gerelateerde records te selecteren): de relatieveld-component is verantwoordelijk voor het selecteren of wijzigen van de gerelateerde record, terwijl het veld van de gerelateerde collectie verantwoordelijk is voor het weergeven van meer informatie over die record (alleen-lezen).

**Voorbeeld**: Na het selecteren van een "Verantwoordelijke" worden het telefoonnummer, e-mailadres en andere informatie van die verantwoordelijke in het formulier weergegeven.

> In het bewerkingsformulier kan de bijbehorende relatie-informatie ook worden weergegeven als het relatieveld "Verantwoordelijke" niet is geconfigureerd. Wanneer het relatieveld "Verantwoordelijke" wel is geconfigureerd, zal bij het wijzigen van de verantwoordelijke de bijbehorende relatie-informatie worden bijgewerkt naar de overeenkomstige record.

![20260212160748](https://static-docs.nocobase.com/20260212160748.gif)

### Overige velden

![20251023192559](https://static-docs.nocobase.com/20251023192559.png)

- Door JavaScript te schrijven kunt u aangepaste weergave-inhoud realiseren en complexe informatie tonen.

![20251023192935](https://static-docs.nocobase.com/20251023192935.png)

### Veldsjablonen

Veldsjablonen worden gebruikt om configuraties van veldgebieden in formulierblokken te hergebruiken. Zie voor details [Veldsjablonen](/interface-builder/fields/field-template).

![field-template-menu-20251228](https://static-docs.nocobase.com/field-template-menu-20251228.png)

## Acties configureren

![20251023193231](https://static-docs.nocobase.com/20251023193231.png)

- [Indienen](/interface-builder/actions/types/submit)
- [Workflow activeren](/interface-builder/actions/types/trigger-workflow)
- [JS-actie](/interface-builder/actions/types/js-action)
- [AI-medewerker](/interface-builder/actions/types/ai-employee)