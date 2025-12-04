---
pkg: "@nocobase/plugin-data-visualization"
---
:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::


# Overzicht

De plugin voor gegevensvisualisatie van NocoBase biedt visuele gegevensquery's en een uitgebreide set diagramcomponenten. Met een eenvoudige configuratie kunt u snel dashboards bouwen, inzichten presenteren en multidimensionale analyse en weergave ondersteunen.

![clipboard-image-1761749573](https://static-docs.nocobase.com/clipboard-image-1761749573.png)

## Basisbegrippen
- **Diagramblok**: Een configureerbaar diagramcomponent op een pagina dat gegevensquery's, diagramopties en interactie-evenementen ondersteunt.
- **Gegevensquery (Builder / SQL)**: Configureer visueel met de Builder of schrijf SQL om gegevens op te halen.
- **Metingen (Measures) en Dimensies (Dimensions)**: Metingen worden gebruikt voor numerieke aggregatie; dimensies groeperen gegevens (bijvoorbeeld datum, categorie, regio).
- **Veldmapping**: Wijs queryresultaatkolommen toe aan kernvelden van het diagram, zoals `xField`, `yField`, `seriesField`, of `Category / Value`.
- **Diagramopties (Basic / Custom)**: Basic configureert veelvoorkomende eigenschappen visueel; Custom retourneert een volledige ECharts `option` via JS.
- **Query uitvoeren**: Voer de query uit en haal gegevens op in het configuratiepaneel; schakel over naar Table / JSON om de geretourneerde gegevens te inspecteren.
- **Voorbeeld en Opslaan**: Een voorbeeld is tijdelijk; door op 'Opslaan' te klikken, wordt de configuratie naar de database geschreven en officieel toegepast.
- **Contextvariabelen**: Hergebruik contextinformatie van pagina, gebruiker en filter (bijvoorbeeld `{{ ctx.user.id }}`) in query's en diagramconfiguratie.
- **Filters en koppeling**: Paginaniveau filterblokken verzamelen uniforme voorwaarden, voegen deze automatisch samen in diagramquery's en verversen gekoppelde diagrammen.
- **Interactie-evenementen**: Registreer evenementen via `chart.on` om markering, navigatie en drill-down mogelijk te maken.

## Installatie
Gegevensvisualisatie is een ingebouwde plugin van NocoBase; deze werkt direct ('out of the box') en vereist geen aparte installatie.