:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::

# Diagramalternativ

Här kan ni konfigurera hur diagram visas. Två lägen stöds: Basic (grafisk) och Custom (JS-anpassad). Basic är perfekt för snabb mappning och vanliga egenskaper, medan Custom passar för komplexa scenarier och avancerad anpassning.

## Panelstruktur

![clipboard-image-1761473695](https://static-docs.nocobase.com/clipboard-image-1761473695.png)

> Tips: För att enklare konfigurera det aktuella innehållet kan ni först fälla ihop andra paneler.

Överst finns åtgärdsfältet.
Lägesval:
- Basic: Grafisk konfiguration. Välj en typ och slutför fältmappningen; vanliga egenskaper justeras direkt med reglage.
- Custom: Skriv JS i redigeraren och returnera ett ECharts `option`.

## Basic-läge

![20251026190615](https://static-docs.nocobase.com/20251026190615.png)

### Välj diagramtyp
- Stöds: linjediagram, ytdiagram, stapeldiagram, liggande stapeldiagram, cirkeldiagram, ringdiagram, trattdiagram, punktdiagram med mera.
- De fält som krävs kan variera beroende på diagramtyp. Kontrollera först kolumnnamn och typer under ”Datafråga → Visa data”.

### Fältmappning
- Linje-/yta-/stapel-/liggande stapeldiagram:
  - `xField`: dimension (t.ex. datum, kategori, region)
  - `yField`: mått (aggregerat numeriskt värde)
  - `seriesField` (valfritt): seriegruppering (för flera linjer/grupper)
- Cirkel-/ringdiagram:
  - `Category`: kategorisk dimension
  - `Value`: mått
- Trattdiagram:
  - `Category`: steg/kategori
  - `Value`: värde (vanligtvis antal eller procentandel)
- Punktdiagram:
  - `xField`, `yField`: två mått eller dimensioner för axlarna

> För fler diagramalternativ, se ECharts dokumentation: [Axlar](https://echarts.apache.org/handbook/en/concepts/axis) och [Exempel](https://echarts.apache.org/examples/en/index.html)

**Obs!**
- Efter att ha ändrat dimensioner eller mått, kontrollera mappningen igen för att undvika tomma eller felaktigt placerade diagram.
- Cirkel-/ringdiagram och trattdiagram måste ha en kombination av ”kategori + värde”.

### Vanliga egenskaper

![20251026191332](https://static-docs.nocobase.com/20251026191332.png)

- Stapling, utjämning (linje-/ytdiagram)
- Etikettvisning, verktygstips (tooltip), förklaring (legend)
- Rotering av axelns etiketter, avdelare
- Cirkel-/ringdiagrammets radie och inre radie, trattdiagrammets sorteringsordning

**Rekommendationer:**
- Använd linje-/ytdiagram för tidsserier med måttlig utjämning; använd stapel-/liggande stapeldiagram för kategorijämförelser.
- När data är tätt, undvik att visa alla etiketter för att förhindra överlappning.

## Custom-läge

Används för att returnera ett komplett ECharts `option`. Passar för avancerad anpassning som att slå samman flera serier, komplexa verktygstips och dynamiska stilar.
Rekommenderad metod: samla data i `dataset.source`. För detaljer, se ECharts dokumentation: [Dataset](https://echarts.apache.org/handbook/en/concepts/dataset/#map-row-or-column-of-dataset-to-series)

![20251026191728](https://static-docs.nocobase.com/20251026191728.png)

### Datakontext
- `ctx.data.objects`: array av objekt (varje rad som ett objekt, rekommenderas)
- `ctx.data.rows`: 2D-array (med rubrik)
- `ctx.data.columns`: 2D-array grupperad efter kolumner

### Exempel: Linjediagram över månatliga beställningar
```js
return {
  dataset: { source: ctx.data.objects || [] },
  xAxis: { type: 'category' },
  yAxis: {},
  series: [
    {
      type: 'line',
      smooth: true,
      showSymbol: false,
    },
  ],
}
```

### Förhandsgranska och spara
- I Custom-läget, när ni har gjort ändringar, kan ni klicka på knappen ”Förhandsgranska” till höger för att uppdatera diagrammets förhandsvisning.
- Längst ner klickar ni på ”Spara” för att tillämpa och spara konfigurationen; klicka på ”Avbryt” för att ångra alla ändringar som gjorts denna gång.

![20251026192816](https://static-docs.nocobase.com/20251026192816.png)

> [!TIP]
> För mer information om diagramalternativ, se Avancerad användning — Anpassad diagramkonfiguration.