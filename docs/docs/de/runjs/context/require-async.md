:::tip{title="KI-Übersetzungshinweis"}
Dieses Dokument wurde von KI übersetzt. Für genaue Informationen lesen Sie bitte die [englische Version](/runjs/context/require-async).
:::

# ctx.requireAsync()

Lädt **UMD/AMD** oder global gemountete Skripte asynchron über eine URL, ebenso wie **CSS**. Dies ist geeignet für RunJS-Szenarien, die UMD/AMD-Bibliotheken wie ECharts, Chart.js, FullCalendar (UMD-Version) oder jQuery-Plugins erfordern. Wenn eine Bibliothek auch eine ESM-Version anbietet, verwenden Sie vorrangig [ctx.importAsync()](./import-async.md).

## Anwendungsfälle

Kann in jedem RunJS-Szenario verwendet werden, in dem UMD/AMD/globale Skripte oder CSS bei Bedarf geladen werden müssen, wie z. B. JSBlock, JSField, JSItem, JSColumn, Workflow, JSAction usw. Typische Anwendungen: ECharts, Chart.js, FullCalendar (UMD), dayjs (UMD), jQuery-Plugins usw.

## Typdefinition

```ts
requireAsync<T = any>(url: string): Promise<T>;
```

## Parameter

| Parameter | Typ | Beschreibung |
|-----------|------|-------------|
| `url` | `string` | Die Skript- oder CSS-Adresse. Unterstützt die **Kurzschreibweise** `<Paket>@<Version>/<Dateipfad>` (fügt `?raw` für die ursprüngliche UMD-Datei hinzu, wenn die Auflösung über das ESM-CDN erfolgt) oder eine **vollständige URL**. Lädt und injiziert Stile, wenn eine `.css`-Datei übergeben wird. |

## Rückgabewert

- Das geladene Bibliotheks-Objekt (der erste Modulwert des UMD/AMD-Callbacks). Viele UMD-Bibliotheken binden sich an `window` (z. B. `window.echarts`), daher kann der Rückgabewert `undefined` sein. Greifen Sie in solchen Fällen gemäß der Dokumentation der Bibliothek auf die globale Variable zu.
- Gibt das Ergebnis von `loadCSS` zurück, wenn eine `.css`-Datei übergeben wird.

## Beschreibung des URL-Formats

- **Kurzpfad**: z. B. `echarts@5/dist/echarts.min.js`. Unter dem Standard-ESM-CDN (esm.sh) wird `https://esm.sh/echarts@5/dist/echarts.min.js?raw` angefragt. Der Parameter `?raw` wird verwendet, um die ursprüngliche UMD-Datei anstelle eines ESM-Wrappers abzurufen.
- **Vollständige URL**: Jede CDN-Adresse kann direkt verwendet werden, wie z. B. `https://cdn.jsdelivr.net/npm/dayjs@1/dayjs.min.js`.
- **CSS**: Eine URL, die auf `.css` endet, wird geladen und in die Seite injiziert.

## Unterschied zu ctx.importAsync()

- **ctx.requireAsync()**: Lädt **UMD/AMD/globale** Skripte. Geeignet für ECharts, Chart.js, FullCalendar (UMD), jQuery-Plugins usw. Bibliotheken binden sich nach dem Laden oft an `window`; der Rückgabewert kann das Bibliotheks-Objekt oder `undefined` sein.
- **ctx.importAsync()**: Lädt **ESM-Module** und gibt den Modul-Namespace zurück. Wenn eine Bibliothek ESM anbietet, verwenden Sie `ctx.importAsync()` für eine bessere Modulsemantik und Tree-Shaking.

## Beispiele

### Grundlegende Verwendung

```javascript
// Kurzpfad (wird über ESM-CDN als ...?raw aufgelöst)
const echarts = await ctx.requireAsync('echarts@5/dist/echarts.min.js');

// Vollständige URL
const dayjs = await ctx.requireAsync('https://cdn.jsdelivr.net/npm/dayjs@1/dayjs.min.js');

// CSS laden und in die Seite injizieren
await ctx.requireAsync('https://cdn.example.com/theme.css');
```

### ECharts-Diagramm

```javascript
const container = document.createElement('div');
container.style.height = '400px';
container.style.width = '100%';
ctx.render(container);

const echarts = await ctx.requireAsync('echarts@5/dist/echarts.min.js');
if (!echarts) throw new Error('ECharts-Bibliothek nicht geladen');

const chart = echarts.init(container);
chart.setOption({
  title: { text: ctx.t('Verkaufsübersicht') },
  series: [{ type: 'pie', data: [{ value: 1, name: ctx.t('A') }] }],
});
chart.resize();
```

### Chart.js-Balkendiagramm

```javascript
async function renderChart() {
  const loaded = await ctx.requireAsync('chart.js@4.4.0/dist/chart.umd.min.js');
  const Chart = loaded?.Chart || loaded?.default?.Chart || loaded?.default;
  if (!Chart) throw new Error('Chart.js nicht geladen');

  const container = document.createElement('canvas');
  ctx.render(container);

  new Chart(container, {
    type: 'bar',
    data: {
      labels: ['A', 'B', 'C'],
      datasets: [{ label: ctx.t('Anzahl'), data: [12, 19, 3] }],
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

## Hinweise

- **Format des Rückgabewerts**: Die UMD-Exportmethoden variieren; der Rückgabewert kann das Bibliotheks-Objekt oder `undefined` sein. Falls `undefined`, greifen Sie gemäß der Dokumentation der Bibliothek über `window` darauf zu.
- **Netzwerkabhängigkeit**: Erfordert CDN-Zugriff. In internen Netzwerkumgebungen können Sie über **ESM_CDN_BASE_URL** auf einen selbstgehosteten Dienst verweisen.
- **Wahl zwischen importAsync**: Wenn eine Bibliothek sowohl ESM als auch UMD anbietet, geben Sie `ctx.importAsync()` den Vorzug.

## Siehe auch

- [ctx.importAsync()](./import-async.md) – Lädt ESM-Module, geeignet für Vue, dayjs (ESM) usw.
- [ctx.render()](./render.md) – Rendert Diagramme und andere Komponenten in einen Container.
- [ctx.libs](./libs.md) – Integriertes React, antd, dayjs usw., kein asynchrones Laden erforderlich.