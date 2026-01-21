:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::

# Vanliga frågor

## Val av diagram
### Hur väljer jag rätt diagram?
Svar: Välj baserat på era data och mål:
- Trender eller förändringar: linjediagram eller ytdiagram
- Värdejämförelse: stapeldiagram eller liggande stapeldiagram
- Sammansättning/andelar: cirkeldiagram eller ringdiagram
- Korrelation eller fördelning: punktdiagram
- Hierarki eller framsteg i steg: trattdiagram

För fler diagramtyper, se [ECharts exempel](https://echarts.apache.org/examples).

### Vilka diagramtyper stöder NocoBase?
Svar: Det visuella läget innehåller vanliga diagram (linjediagram, ytdiagram, stapeldiagram, liggande stapeldiagram, cirkeldiagram, ringdiagram, trattdiagram, punktdiagram, m.fl.). Det anpassade läget stöder alla diagramtyper från ECharts.

## Problem med datafrågor
### Delar det visuella läget och SQL-läget konfigurationer?
Svar: Nej, de är inte ömsesidigt kompatibla. Deras konfigurationer lagras separat. Det läge som användes vid er senaste sparning är det som gäller.

## Diagramalternativ
### Hur konfigurerar jag diagramfält?
Svar: I det visuella läget väljer ni fält baserat på diagramtypen. Till exempel kräver linjediagram eller stapeldiagram konfiguration av X- och Y-axelfält, medan cirkeldiagram kräver ett kategorifält och ett värdefält.
Vi rekommenderar att ni först kör "Kör fråga" för att kontrollera att data stämmer överens med förväntningarna; fältmappningen matchas automatiskt som standard.

## Förhandsgranskning och spara
### Behöver jag förhandsgranska ändringar manuellt?
Svar: I det visuella konfigurationsläget förhandsgranskas ändringar automatiskt. I SQL- och anpassade konfigurationslägen, för att undvika frekventa uppdateringar, klickar ni manuellt på "Förhandsgranska" när ni är klara med redigeringen.

### Varför försvinner förhandsgranskningen när jag stänger dialogrutan?
Svar: Förhandsgranskningen är endast avsedd för tillfällig visning. Spara era ändringar innan ni stänger dialogrutan; osparade ändringar behålls inte.