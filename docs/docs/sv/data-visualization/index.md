---
pkg: "@nocobase/plugin-data-visualization"
---
:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::


# Översikt

NocoBase plugin för datavisualisering erbjuder visuella datafrågor och en rik uppsättning diagramkomponenter. Med enkel konfiguration kan ni snabbt skapa instrumentpaneler, presentera insikter och stödja flerdimensionell analys och visning.

![clipboard-image-1761749573](https://static-docs.nocobase.com/clipboard-image-1761749573.png)

## Grundläggande koncept
- Diagramblock: En konfigurerbar diagramkomponent på en sida som stödjer datafrågor, diagramalternativ och interaktionshändelser.
- Datafråga (Builder / SQL): Konfigurera visuellt med Builder eller skriv SQL för att hämta data.
- Mått (Measures) och Dimensioner (Dimensions): Mått används för numerisk aggregering; Dimensioner grupperar data (till exempel datum, kategori, region).
- Fältmappning: Mappa frågeresultatkolumner till kärnfält i diagrammet, som `xField`, `yField`, `seriesField` eller `Category / Value`.
- Diagramalternativ (Basic / Custom): Basic konfigurerar vanliga egenskaper visuellt; Custom returnerar en fullständig ECharts `option` via JS.
- Kör fråga: Kör frågan och hämta data i konfigurationspanelen; ni kan växla till Table / JSON för att inspektera returnerad data.
- Förhandsgranska och Spara: Förhandsgranskning är temporär; genom att klicka på Spara skrivs konfigurationen till databasen och blir aktiv.
- Kontextvariabler: Återanvänd sid-, användar- och filterkontext (till exempel `{{ ctx.user.id }}`) i frågor och diagramkonfiguration.
- Filter och koppling: Filterblock på sidnivå samlar in enhetliga villkor, slås automatiskt samman med diagramfrågor och uppdaterar länkade diagram.
- Interaktionshändelser: Registrera händelser via `chart.on` för att möjliggöra markering, navigering och drill-down.

## Installation
Datavisualisering är ett inbyggt NocoBase plugin; det fungerar direkt och kräver ingen separat installation.