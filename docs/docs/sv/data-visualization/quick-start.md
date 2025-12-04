:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::

# Snabbstart

Låt oss konfigurera ett diagram från grunden, med fokus på de grundläggande funktionerna. Mer avancerade funktioner beskrivs i senare kapitel.

Förberedelser:
- Ni har konfigurerat en datakälla och en samling (tabell), och har läsbehörighet till dem.

## Lägg till ett diagramblock

I sidodesignern klickar ni på ”Lägg till block”, väljer ”Diagram” och lägger till ett diagramblock.

![clipboard-image-1761554593](https://static-docs.nocobase.com/clipboard-image-1761554593.png)

Efter att ni har lagt till blocket klickar ni på ”Konfigurera” uppe till höger på blocket.

![clipboard-image-1761554709](https://static-docs.nocobase.com/clipboard-image-1761554709.png)

Konfigurationspanelen öppnas till höger. Den innehåller tre delar: Datafråga, Diagramalternativ och Händelser.

![clipboard-image-1761554848](https://static-docs.nocobase.com/clipboard-image-1761554848.png)

## Konfigurera datafråga
I panelen ”Datafråga” kan ni konfigurera datakällan, frågefilter och relaterade alternativ.

- Välj först datakälla och samling
  - I panelen ”Datafråga” väljer ni datakälla och samling som grund för frågan.
  - Om samlingen inte går att välja eller är tom, kontrollera först om den har skapats och om er användare har behörighet.

- Konfigurera mått (Measures)
  - Välj ett eller flera numeriska fält som mått.
  - Ställ in aggregering för varje mått: Summa / Antal / Medel / Max / Min.

- Konfigurera dimensioner (Dimensions)
  - Välj ett eller flera fält som grupperingsdimensioner (datum, kategori, region, etc.).
  - För datum-/tidsfält kan ni ställa in ett format (till exempel `YYYY-MM`, `YYYY-MM-DD`) för att få en konsekvent visning.

![clipboard-image-1761555060](https://static-docs.nocobase.com/clipboard-image-1761555060.png)

Andra alternativ som filtrering, sortering och paginering är valfria.

## Kör fråga och visa data

- Klicka på ”Kör fråga” för att hämta data och rendera en förhandsgranskning av diagrammet direkt till vänster.
- Ni kan klicka på ”Visa data” för att förhandsgranska de returnerade dataresultaten; ni kan växla mellan tabell- och JSON-format. Klicka igen för att dölja dataförhandsgranskningen.
- Om dataresultatet är tomt eller inte stämmer överens med förväntningarna, gå tillbaka till frågepanelen och kontrollera samlingsbehörigheter, fältmappningar för mått/dimensioner och datatyper.

![clipboard-image-1761555228](https://static-docs.nocobase.com/clipboard-image-1761555228.png)

## Konfigurera diagramalternativ

I panelen ”Diagramalternativ” väljer ni diagramtyp och konfigurerar dess alternativ.

- Välj först en diagramtyp (linje/yta, stapel/fält, cirkel/ring, punkt, etc.).
- Slutför kärnfältmappningarna:
  - Linje/yta/stapel/fält: `xField` (dimension), `yField` (mått), `seriesField` (serie, valfritt)
  - Cirkel/ring: `Category` (kategorisk dimension), `Value` (mått)
  - Punkt: `xField`, `yField` (två mått eller dimensioner)
  - För fler diagraminställningar, se ECharts-dokumentationen: [Axis](https://echarts.apache.org/handbook/en/concepts/axis)
- Efter att ni har klickat på ”Kör fråga” fylls fältmappningarna i automatiskt som standard. Om ni ändrar dimensioner/mått, vänligen kontrollera mappningarna igen.

![clipboard-image-1761555586](https://static-docs.nocobase.com/clipboard-image-1761555586.png)

## Förhandsgranska och spara
Ändringar uppdaterar förhandsgranskningen i realtid till vänster, men de sparas inte förrän ni klickar på ”Spara”.

Ni kan också använda knapparna längst ner:

- Förhandsgranska: Konfigurationsändringar uppdaterar förhandsgranskningen automatiskt, eller så kan ni klicka på ”Förhandsgranska”-knappen längst ner för att manuellt utlösa en uppdatering.
- Avbryt: Om ni inte vill behålla de aktuella ändringarna kan ni klicka på ”Avbryt”-knappen längst ner, eller uppdatera sidan, för att återgå till det senast sparade tillståndet.
- Spara: Klicka på ”Spara” för att spara den aktuella frågan och diagramkonfigurationen permanent i databasen; den blir då gällande för alla användare.

![clipboard-image-1761555803](https://static-docs.nocobase.com/clipboard-image-1761555803.png)

## Vanliga tips

- Minsta möjliga konfiguration: Välj en samling + minst ett mått; det rekommenderas att lägga till dimensioner för grupperad visning.
- För datumdimensioner rekommenderas det att ställa in ett lämpligt format (till exempel månadsvis `YYYY-MM`) för att undvika en diskontinuerlig eller rörig X-axel.
- Om frågan är tom eller diagrammet inte visas:
  - Kontrollera samlingen/behörigheterna och fältmappningarna;
  - Använd ”Visa data” för att bekräfta att kolumnnamn och typer matchar diagrammappningen.
- Förhandsgranskning är tillfällig: Den används endast för validering och justeringar. Den träder i kraft först efter att ni klickat på ”Spara”.