:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::

# Formulierblok

## Introductie

Het Formulierblok is een belangrijk blok voor het bouwen van interfaces voor gegevensinvoer en -bewerking. Het is zeer aanpasbaar en gebruikt de juiste componenten om de benodigde velden weer te geven, gebaseerd op het datamodel. Via gebeurtenisstromen zoals koppelingsregels kan het Formulierblok velden dynamisch weergeven. Bovendien kunt u het combineren met workflows om geautomatiseerde processen te activeren en gegevens te verwerken, wat de efficiëntie verder verhoogt of logische orkestratie mogelijk maakt.

## Formulierblok toevoegen

- **Formulier bewerken**: Gebruikt u om bestaande gegevens te wijzigen.
- **Formulier toevoegen**: Gebruikt u om nieuwe gegevensitems aan te maken.

![20251023191139](https://static-docs.nocobase.com/20251023191139.png)

## Blokinstellingen

![20251023191448](https://static-docs.nocobase.com/20251023191448.png)

### Koppelingsregels voor blokken

Beheer het gedrag van blokken (zoals of ze worden weergegeven of JavaScript uitvoeren) via koppelingsregels.

![20251023191703](https://static-docs.nocobase.com/20251023191703.png)

Meer informatie vindt u in [Koppelingsregels voor blokken](/interface-builder/blocks/block-settings/block-linkage-rule)

### Koppelingsregels voor velden

Beheer het gedrag van formuliervelden via koppelingsregels.

![20251023191849](https://static-docs.nocobase.com/20251023191849.png)

Meer informatie vindt u in [Koppelingsregels voor velden](/interface-builder/blocks/block-settings/field-linkage-rule)

### Indeling

Het Formulierblok ondersteunt twee indelingsmodi, die u kunt instellen via het `layout` attribuut:

- **horizontal** (horizontale indeling): Deze indeling toont het label en de inhoud op één regel, wat verticale ruimte bespaart. Dit is geschikt voor eenvoudige formulieren of situaties met minder informatie.
- **vertical** (verticale indeling) (standaard): Het label staat boven het veld. Deze indeling maakt het formulier gemakkelijker te lezen en in te vullen, vooral voor formulieren met meerdere velden of complexe invoeritems.

![20251023193638](https://static-docs.nocobase.com/20251023193638.png)

## Velden configureren

### Velden van deze collectie

> **Opmerking**: Velden van overgeërfde collecties (d.w.z. velden van de bovenliggende collectie) worden automatisch samengevoegd en weergegeven in de huidige veldenlijst.

![20240416230739](https://static-docs.nocobase.com/20240416230739.png)

### Overige velden

![20251023192559](https://static-docs.nocobase.com/20251023192559.png)

- Schrijf JavaScript om de weergave van inhoud aan te passen en complexe informatie te tonen.

![20251023192935](https://static-docs.nocobase.com/20251023192935.png)

## Acties configureren

![20251023193231](https://static-docs.nocobase.com/20251023193231.png)

- [Verzenden](/interface-builder/actions/types/submit)
- [workflow activeren](/interface-builder/actions/types/trigger-workflow)
- [JS-actie](/interface-builder/actions/types/js-action)
- [AI-medewerker](/interface-builder/actions/types/ai-employee)