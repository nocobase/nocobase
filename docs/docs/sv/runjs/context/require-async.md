:::tip{title="AI-översättningsmeddelande"}
Detta dokument har översatts av AI. För korrekt information, se [den engelska versionen](/runjs/context/require-async).
:::

# ctx.requireAsync()

Läser in **UMD/AMD** eller globalt monterade skript asynkront via URL, samt **CSS**. Den är lämplig för RunJS-scenarier som kräver UMD/AMD-bibliotek såsom ECharts, Chart.js, FullCalendar (UMD-version) eller jQuery-plugins. Om ett bibliotek även tillhandahåller en ESM-version, prioritera att använda [ctx.importAsync()](./import-async.md).

## Tillämpningsscenarier

Kan användas i alla RunJS-scenarier där UMD/AMD/globala skript eller CSS behöver läsas in vid behov, såsom JSBlock, JSField, JSItem, JSColumn, arbetsflöde, JSAction, etc. Typiska användningsområden: ECharts-diagram, Chart.js, FullCalendar (UMD), dayjs (UMD), jQuery-plugins, etc.

## Typdefinition

```ts
requireAsync<T = any>(url: string): Promise<T>;
```

## Parametrar

| Parameter | Typ | Beskrivning |
|-----------|------|-------------|
| `url` | `string` | Adressen till skriptet eller CSS-filen. Stöder **förkortad sökväg** `<paket>@<version>/<filsökväg>` (lägger till `?raw` för den ursprungliga UMD-filen när den matchas via ESM CDN) eller en **fullständig URL**. Läser in och injicerar stilar om en `.css`-fil skickas med. |

## Returvärde

- Det inlästa biblioteksobjektet (det första modulvärdet från UMD/AMD-callbacken). Många UMD-bibliotek fäster sig vid `window` (t.ex. `window.echarts`), så returvärdet kan vara `undefined`. I sådana fall kan ni komma åt den globala variabeln enligt bibliotekets dokumentation.
- Returnerar resultatet av `loadCSS` när en `.css`-fil skickas med.

## Beskrivning av URL-format

- **Förkortad sökväg**: t.ex. `echarts@5/dist/echarts.min.js`. Under standard ESM CDN (esm.sh) begärs `https://esm.sh/echarts@5/dist/echarts.min.js?raw`. Parametern `?raw` används för att hämta den ursprungliga UMD-filen istället för en ESM-wrapper.
- **Fullständig URL**: Valfri CDN-adress kan användas direkt, såsom `https://cdn.jsdelivr.net/npm/dayjs@1/dayjs.min.js`.
- **CSS**: En URL som slutar på `.css` kommer att läsas in och injiceras på sidan.

## Skillnad från ctx.importAsync()

- **ctx.requireAsync()**: Läser in **UMD/AMD/globala** skript. Lämplig för ECharts, Chart.js, FullCalendar (UMD), jQuery-plugins, etc. Bibliotek fäster sig ofta vid `window` efter inläsning; returvärdet kan vara biblioteksobjektet eller `undefined`.
- **ctx.importAsync()**: Läser in **ESM-moduler** och returnerar modulens namnrymd. Om ett bibliotek tillhandahåller ESM, använd `ctx.importAsync()` för bättre modulsemantik och Tree-shaking.

## Exempel

### Grundläggande användning

```javascript
// Förkortad sökväg (matchas via ESM CDN som ...?raw)
const echarts = await ctx.requireAsync('echarts@5/dist/echarts.min.js');

// Fullständig URL
const dayjs = await ctx.requireAsync('https://cdn.jsdelivr.net/npm/dayjs@1/dayjs.min.js');

// Läs in CSS och injicera på sidan
await ctx.requireAsync('https://cdn.example.com/theme.css');
```

### ECharts-diagram

```javascript
const container = document.createElement('div');
container.style.height = '400px';
container.style.width = '100%';
ctx.render(container);

const echarts = await ctx.requireAsync('echarts@5/dist/echarts.min.js');
if (!echarts) throw new Error('ECharts-biblioteket kunde inte läsas in');

const chart = echarts.init(container);
chart.setOption({
  title: { text: ctx.t('Försäljningsöversikt') },
  series: [{ type: 'pie', data: [{ value: 1, name: ctx.t('A') }] }],
});
chart.resize();
```

### Chart.js stapeldiagram

```javascript
async function renderChart() {
  const loaded = await ctx.requireAsync('chart.js@4.4.0/dist/chart.umd.min.js');
  const Chart = loaded?.Chart || loaded?.default?.Chart || loaded?.default;
  if (!Chart) throw new Error('Chart.js kunde inte läsas in');

  const container = document.createElement('canvas');
  ctx.render(container);

  new Chart(container, {
    type: 'bar',
    data: {
      labels: ['A', 'B', 'C'],
      datasets: [{ label: ctx.t('Antal'), data: [12, 19, 3] }],
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

## Observera

- **Format på returvärde**: Exportmetoder för UMD varierar; returvärdet kan vara biblioteksobjektet eller `undefined`. Om det är `undefined`, kan ni komma åt det via `window` enligt bibliotekets dokumentation.
- **Nätverksberoende**: Kräver åtkomst till CDN. I interna nätverksmiljöer kan ni peka på en egenvärd tjänst via **ESM_CDN_BASE_URL**.
- **Val mellan importAsync**: Om ett bibliotek tillhandahåller både ESM och UMD, prioritera `ctx.importAsync()`.

## Relaterat

- [ctx.importAsync()](./import-async.md) - Läser in ESM-moduler, lämplig för Vue, dayjs (ESM), etc.
- [ctx.render()](./render.md) - Renderar diagram och andra komponenter i en behållare.
- [ctx.libs](./libs.md) - Inbyggda React, antd, dayjs, etc., ingen asynkron inläsning krävs.