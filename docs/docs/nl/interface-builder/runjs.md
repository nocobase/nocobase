:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::

# JS online schrijven en uitvoeren

In NocoBase biedt **RunJS** een lichtgewicht uitbreidingsmethode die ideaal is voor **snelle experimenten en tijdelijke logicaverwerking**. U kunt hiermee interfaces of interacties personaliseren met JavaScript, zonder dat u plugins hoeft te maken of de broncode hoeft aan te passen.

Hiermee kunt u direct in de UI-builder JS-code invoeren om het volgende te bereiken:

- Aangepaste weergave van content (velden, blokken, kolommen, items, enz.)
- Aangepaste interactielogica (knopklikken, gebeurteniskoppeling)
- Dynamisch gedrag op basis van contextuele gegevens

## Ondersteunde scenario's

### JS Blok

Pas de weergave van blokken aan met JS, zodat u volledige controle heeft over de structuur en stijl van het blok.
Dit is ideaal voor het weergeven van aangepaste componenten, statistische grafieken, content van derden en andere zeer flexibele scenario's.

![20250916105031](https://static-docs.nocobase.com/20250916105031.png)

Documentatie: [JS Blok](/interface-builder/blocks/other-blocks/js-block)

### JS Actie

Pas de kliklogica van actieknoppen aan met JS, zodat u elke frontend- of API-verzoekbewerking kunt uitvoeren.
Denk hierbij aan: dynamisch waarden berekenen, aangepaste gegevens indienen, pop-ups activeren, enz.

![20250916105123](https://static-docs.nocobase.com/20250916105123.png)

Documentatie: [JS Actie](/interface-builder/actions/types/js-action)

### JS Veld

Pas de weergavelogica van velden aan met JS.
U kunt dynamisch verschillende stijlen, content of statussen weergeven op basis van veldwaarden.

![20250916105354](https://static-docs.nocobase.com/20250916105354.png)

Documentatie: [JS Veld](/interface-builder/fields/specific/js-field)

### JS Item

Geef onafhankelijke items weer met JS, zonder ze te koppelen aan specifieke velden. Dit wordt vaak gebruikt voor het weergeven van aangepaste informatieblokken.

![20250916104848](https://static-docs.nocobase.com/20250916104848.png)

Documentatie: [JS Item](/interface-builder/fields/specific/js-item)

### JS Tabelkolom

Pas de weergave van tabelkolommen aan met JS.
U kunt hiermee complexe weergavelogica voor cellen implementeren, zoals voortgangsbalken, statuslabels, enz.

![20250916105443](https://static-docs.nocobase.com/20250916105443.png)

Documentatie: [JS Tabelkolom](/interface-builder/fields/specific/js-column)

### Koppelingsregels

Beheer de koppelingslogica tussen velden in formulieren of pagina's met JS.
Bijvoorbeeld: wanneer een veld verandert, wijzigt u dynamisch de waarde of zichtbaarheid van een ander veld.

![20251029114532](https://static-docs.nocobase.com/20251029114532.png)

Documentatie: [Koppelingsregels](/interface-builder/linkage-rule)

### Gebeurtenisstroom

Pas de triggercondities en uitvoeringslogica van de gebeurtenisstroom aan met JS om complexere frontend-interactieketens te bouwen.

![](https://static-docs.nocobase.com/20251031092755.png)

Documentatie: [Gebeurtenisstroom](/interface-builder/event-flow)