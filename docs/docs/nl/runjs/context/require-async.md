:::tip{title="AI-vertaalmelding"}
Dit document is vertaald door AI. Raadpleeg de [Engelse versie](/runjs/context/require-async) voor nauwkeurige informatie.
:::

# ctx.requireAsync()

Laadt asynchroon **UMD/AMD** of globaal gekoppelde scripts via URL, evenals **CSS**. Het is geschikt voor RunJS-scenario's die UMD/AMD-bibliotheken vereisen, zoals ECharts, Chart.js, FullCalendar (UMD-versie) of jQuery-plugins. Als een bibliotheek ook een ESM-versie biedt, geef dan de voorkeur aan [ctx.importAsync()](./import-async.md).

## Toepassingen

Kan worden gebruikt in elk RunJS-scenario waar UMD/AMD/globale scripts of CSS on-demand moeten worden geladen, zoals JSBlock, JSField, JSItem, JSColumn, workflow, JSAction, enz. Typische toepassingen: ECharts, Chart.js, FullCalendar (UMD), dayjs (UMD), jQuery-plugins, enz.

## Type-definitie

```ts
requireAsync<T = any>(url: string): Promise<T>;
```

## Parameters

| Parameter | Type | Beschrijving |
|-----------|------|-------------|
| `url` | `string` | Het adres van het script of de CSS. Ondersteunt **verkorte notatie** `<pakket>@<versie>/<bestandspad>` (voegt `?raw` toe voor het originele UMD-bestand bij resolutie via ESM CDN) of een **volledige URL**. Laadt en injecteert stijlen als er een `.css`-bestand wordt doorgegeven. |

## Retourwaarde

- Het geladen bibliotheekobject (de eerste modulewaarde van de UMD/AMD-callback). Veel UMD-bibliotheken koppelen zichzelf aan `window` (bijv. `window.echarts`), dus de retourwaarde kan `undefined` zijn. Raadpleeg in dergelijke gevallen de documentatie van de bibliotheek om de globale variabele te benaderen.
- Retourneert het resultaat van `loadCSS` wanneer een `.css`-bestand wordt doorgegeven.

## Beschrijving URL-formaat

- **Verkort pad**: bijv. `echarts@5/dist/echarts.min.js`. Onder het standaard ESM CDN (esm.sh) wordt `https://esm.sh/echarts@5/dist/echarts.min.js?raw` opgevraagd. De parameter `?raw` wordt gebruikt om het originele UMD-bestand op te halen in plaats van een ESM-wrapper.
- **Volledige URL**: Elk CDN-adres kan direct worden gebruikt, zoals `https://cdn.jsdelivr.net/npm/dayjs@1/dayjs.min.js`.
- **CSS**: Een URL die eindigt op `.css` wordt geladen en in de pagina geïnjecteerd.

## Verschil met ctx.importAsync()

- **ctx.requireAsync()**: Laadt **UMD/AMD/globale** scripts. Geschikt voor ECharts, Chart.js, FullCalendar (UMD), jQuery-plugins, enz. Bibliotheken koppelen zich na het laden vaak aan `window`; de retourwaarde kan het bibliotheekobject of `undefined` zijn.
- **ctx.importAsync()**: Laadt **ESM-modules** en retourneert de module-namespace. Als een bibliotheek ESM biedt, gebruik dan `ctx.importAsync()` voor betere module-semantiek en Tree-shaking.

## Voorbeelden

### Basisgebruik

```javascript
// Verkort pad (wordt via ESM CDN opgelost als ...?raw)
const echarts = await ctx.requireAsync('echarts@5/dist/echarts.min.js');

// Volledige URL
const dayjs = await ctx.requireAsync('https://cdn.jsdelivr.net/npm/dayjs@1/dayjs.min.js');

// CSS laden en in de pagina injecteren
await ctx.requireAsync('https://cdn.example.com/theme.css');
```

### ECharts-grafiek

```javascript
const container = document.createElement('div');
container.style.height = '400px';
container.style.width = '100%';
ctx.render(container);

const echarts = await ctx.requireAsync('echarts@5/dist/echarts.min.js');
if (!echarts) throw new Error('ECharts-bibliotheek niet geladen');

const chart = echarts.init(container);
chart.setOption({
  title: { text: ctx.t('Verkoopoverzicht') },
  series: [{ type: 'pie', data: [{ value: 1, name: ctx.t('A') }] }],
});
chart.resize();
```

### Chart.js-staafdiagram

```javascript
async function renderChart() {
  const loaded = await ctx.requireAsync('chart.js@4.4.0/dist/chart.umd.min.js');
  const Chart = loaded?.Chart || loaded?.default?.Chart || loaded?.default;
  if (!Chart) throw new Error('Chart.js niet geladen');

  const container = document.createElement('canvas');
  ctx.render(container);

  new Chart(container, {
    type: 'bar',
    data: {
      labels: ['A', 'B', 'C'],
      datasets: [{ label: ctx.t('Aantal'), data: [12, 19, 3] }],
    },
  });
}
await renderChart();
```

### dayjs (UMD)

```javascript
const dayjs = await ctx.requireAsync('dayjs@1/dayjs.min.js');
console.log(dayjs?.default || dayjs);
```

## Aandachtspunten

- **Formaat van retourwaarde**: UMD-exportmethoden variëren; de retourwaarde kan het bibliotheekobject of `undefined` zijn. Indien `undefined`, benader het dan via `window` volgens de documentatie van de bibliotheek.
- **Netwerkafhankelijkheid**: Vereist toegang tot een CDN. In interne netwerkomgevingen kunt u via **ESM_CDN_BASE_URL** naar een zelf-gehoste service verwijzen.
- **Keuze tussen importAsync**: Als een bibliotheek zowel ESM als UMD biedt, geef dan de voorkeur aan `ctx.importAsync()`.

## Gerelateerd

- [ctx.importAsync()](./import-async.md) - Laadt ESM-modules, geschikt voor Vue, dayjs (ESM), enz.
- [ctx.render()](./render.md) - Rendert grafieken en andere componenten in een container.
- [ctx.libs](./libs.md) - Ingebouwde React, antd, dayjs, enz., geen asynchroon laden vereist.